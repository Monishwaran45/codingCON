import uuid
from fastapi import APIRouter, HTTPException, Depends, status
from typing import Optional

from app.models.user import User
from app.models.problem import Problem
from app.models.submission import Submission
from app.schemas.submission import SubmissionCreate, SubmissionResponse
from app.api.auth import get_current_user
from app.services.queue_service import queue_service

router = APIRouter(prefix="/submissions", tags=["submissions"])

@router.post("", status_code=status.HTTP_202_ACCEPTED)
async def submit_code(req: SubmissionCreate, user: User = Depends(get_current_user)):
    problem = await Problem.get(req.problemId)
    if not problem or not problem.is_active:
        raise HTTPException(status_code=404, detail="Problem not found")

    submission_id = str(uuid.uuid4())
    test_cases = [tc for tc in problem.test_cases if tc.is_sample] if not req.isSubmit else problem.test_cases
    if not test_cases:
        test_cases = problem.test_cases

    submission = Submission(
        id=submission_id,
        problem_id=problem.id,
        user_id=user.id,
        contest_id=req.contestId,
        language=req.language,
        code=req.code,
        verdict="pending",
        is_submit=req.isSubmit,
        total_test_cases=len(test_cases)
    )
    await submission.save()

    # Push to RabbitMQ message queue
    payload = {
        "submission_id": submission_id,
        "problem_id": problem.id,
        "user_id": user.id,
        "language": req.language,
        "code": req.code,
        "is_submit": req.isSubmit,
        "contest_id": req.contestId
    }
    await queue_service.publish_submission(payload)

    return {"id": submission_id, "totalTestCases": len(test_cases)}

@router.get("/{submission_id}")
async def get_submission(submission_id: str, user: User = Depends(get_current_user)):
    submission = await Submission.get(submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    failed_tc = None
    for r in submission.test_case_results:
        if not r.passed:
            failed_tc = {
                "id": r.id,
                "passed": False,
                "actualOutput": r.actual_output,
                "executionTimeMs": r.execution_time_ms,
                "memoryKb": r.memory_kb,
                "error": r.error
            }
            break

    return {
        "id": submission.id,
        "problemId": submission.problem_id,
        "userId": submission.user_id,
        "language": submission.language,
        "code": submission.code,
        "verdict": submission.verdict,
        "passedTestCases": submission.passed_test_cases,
        "totalTestCases": submission.total_test_cases,
        "executionTimeMs": submission.execution_time_ms,
        "memoryKb": submission.memory_kb,
        "isSubmit": submission.is_submit,
        "failedTestCase": failed_tc,
        "testCaseResults": [
            {
                "id": r.id,
                "passed": r.passed,
                "executionTimeMs": r.execution_time_ms,
                "memoryKb": r.memory_kb,
                "error": r.error
            }
            for r in submission.test_case_results
        ]
    }
