import logging
import asyncio
from datetime import datetime
from app.models.submission import Submission, TestCaseResult as DBTestCaseResult
from app.models.problem import Problem
from app.models.leaderboard import Leaderboard, ProblemScoreBreakdown
from app.worker.sandbox import run_code
from app.sockets.gateway import emit_submission_progress, emit_submission_done, emit_leaderboard_update
from app.services.redis_service import redis_service

logger = logging.getLogger("app.judge_worker")

async def process_submission(payload: dict):
    submission_id = payload.get("submission_id")
    if not submission_id:
        return

    submission = await Submission.get(submission_id)
    if not submission:
        logger.error(f"Submission {submission_id} not found")
        return

    problem = await Problem.get(submission.problem_id)
    if not problem:
        logger.error(f"Problem {submission.problem_id} not found")
        return

    submission.verdict = "running"
    await submission.save()

    test_cases = [tc for tc in problem.test_cases if tc.is_sample] if not submission.is_submit else problem.test_cases
    if not test_cases:
        test_cases = problem.test_cases

    submission.total_test_cases = len(test_cases)
    await submission.save()

    passed_count = 0
    max_time_ms = 0
    overall_verdict = "AC"
    results = []
    failed_test_case = None

    for idx, tc in enumerate(test_cases):
        res = await run_code(submission.language, submission.code, tc.input)

        if res.timed_out:
            tc_passed = False
            verdict = "TLE"
        elif res.exit_code != 0:
            tc_passed = False
            verdict = "RE"
        else:
            actual = res.stdout.strip()
            expected = tc.expected_output.strip()
            tc_passed = (actual == expected)
            verdict = "AC" if tc_passed else "WA"

        if tc_passed:
            passed_count += 1
        elif overall_verdict == "AC":
            overall_verdict = verdict

        max_time_ms = max(max_time_ms, res.execution_time_ms)

        tc_res = DBTestCaseResult(
            id=tc.id,
            test_case_id=tc.id,
            passed=tc_passed,
            actual_output=res.stdout,
            execution_time_ms=res.execution_time_ms,
            memory_kb=res.memory_kb,
            error=res.stderr,
            sort_order=idx
        )
        results.append(tc_res)

        if not tc_passed and failed_test_case is None:
            failed_test_case = {
                "id": tc.id,
                "passed": False,
                "expectedOutput": tc.expected_output,
                "actualOutput": res.stdout,
                "executionTimeMs": res.execution_time_ms,
                "memoryKb": res.memory_kb,
                "error": res.stderr
            }

        progress_event = {
            "submissionId": submission_id,
            "passedTestCases": passed_count,
            "totalTestCases": len(test_cases),
            "isStreaming": True,
            "testCaseResult": {
                "id": tc.id,
                "passed": tc_passed,
                "executionTimeMs": res.execution_time_ms,
                "memoryKb": res.memory_kb,
                "expectedOutput": tc.expected_output if tc.is_sample else None,
                "actualOutput": res.stdout if tc.is_sample else None,
                "error": res.stderr if tc.is_sample else None
            }
        }
        await emit_submission_progress(submission_id, progress_event)

    submission.verdict = overall_verdict
    submission.passed_test_cases = passed_count
    submission.execution_time_ms = max_time_ms
    submission.test_case_results = results
    await submission.save()

    # Update problem submission stats
    problem.total_submissions += 1
    if overall_verdict == "AC":
        problem.acceptance_rate = round(((problem.acceptance_rate * (problem.total_submissions - 1)) + 100) / problem.total_submissions, 1)
    await problem.save()

    # Update Leaderboard if submission belongs to a contest
    if submission.contest_id and submission.is_submit and overall_verdict == "AC":
        await update_leaderboard(submission.contest_id, submission.user_id, problem.id, problem.points)

    done_event = {
        "submissionId": submission_id,
        "verdict": overall_verdict,
        "passedTestCases": passed_count,
        "totalTestCases": len(test_cases),
        "executionTimeMs": max_time_ms,
        "memoryKb": 0,
        "failedTestCase": failed_test_case,
        "isStreaming": False
    }
    await emit_submission_done(submission_id, done_event)
    logger.info(f"Submission {submission_id} finished with verdict: {overall_verdict}")

async def update_leaderboard(contest_id: str, user_id: str, problem_id: str, points: int):
    lb = await Leaderboard.find_one(Leaderboard.contest_id == contest_id, Leaderboard.user_id == user_id)
    if not lb:
        from app.models.user import User
        user = await User.get(user_id)
        lb = Leaderboard(
            contest_id=contest_id,
            user_id=user_id,
            username=user.username if user else "Participant",
            solved_count=0,
            total_score=0,
            problem_breakdown={}
        )

    if problem_id not in lb.problem_breakdown or not lb.problem_breakdown[problem_id].solved_time:
        lb.problem_breakdown[problem_id] = ProblemScoreBreakdown(
            score=points,
            attempted=True,
            solved_time=datetime.utcnow().strftime("%H:%M:%S")
        )
        lb.solved_count += 1
        lb.total_score += points
        lb.last_updated = datetime.utcnow()
        await lb.save()

    # Invalidate Redis leaderboard cache & emit WebSocket update
    leaderboard_entries = await Leaderboard.find(Leaderboard.contest_id == contest_id).sort("-total_score", "+penalty_time_minutes").to_list()
    serialized = [
        {
            "userId": entry.user_id,
            "username": entry.username,
            "rank": idx + 1,
            "score": entry.total_score,
            "solvedCount": entry.solved_count,
            "penaltyMinutes": entry.penalty_time_minutes,
            "problemBreakdown": {k: v.model_dump() for k, v in entry.problem_breakdown.items()}
        }
        for idx, entry in enumerate(leaderboard_entries)
    ]
    await redis_service.set_json(f"leaderboard:{contest_id}", serialized, ttl_seconds=600)
    await emit_leaderboard_update(contest_id, serialized)
