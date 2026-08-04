import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db/database';
import { SubmissionRow, TestCaseRow } from '../db/types';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { runCode } from '../judge/runner';
import { recalculateLeaderboard } from './leaderboard';

type SubmissionWithTitle = SubmissionRow & { problem_title: string };

function asSubmissions(v: unknown)   { return v as SubmissionWithTitle[]; }
function asSubmission(v: unknown)    { return v as (SubmissionRow & { problem_title: string }) | undefined; }
function asTestCases(v: unknown)     { return v as TestCaseRow[]; }
function asProblem(v: unknown)       { return v as { id: string; time_limit_ms: number; memory_limit_mb: number } | undefined; }
function asResults(v: unknown) {
  return v as {
    id: string; test_case_id: string; passed: number;
    actual_output: string | null; execution_time_ms: number | null;
    memory_kb: number | null; error: string | null; sort_order: number;
  }[];
}
function asStats(v: unknown)       { return v as { total: number; accepted: number }; }
function asLeaderboard(v: unknown) {
  return v as {
    user_id: string; username: string; solved_count: number;
    total_score: number; penalty_time_minutes: number; problem_breakdown: string;
  }[];
}
function asAlreadySolved(v: unknown) { return v as unknown; }

const router = Router();

// ── GET /api/submissions ──────────────────────────────────────────────────────
router.get('/', requireAuth, (req: AuthRequest, res: Response): void => {
  const rows = asSubmissions(db.prepare(`
    SELECT s.*, p.title as problem_title
    FROM submissions s JOIN problems p ON p.id = s.problem_id
    WHERE s.user_id = ? ORDER BY s.created_at DESC LIMIT 50
  `).all(req.user!.id));

  res.json(rows.map((r) => ({
    id: r.id, problemId: r.problem_id, problemTitle: r.problem_title,
    userId: r.user_id, username: req.user!.username, language: r.language,
    verdict: r.verdict, passedTestCases: r.passed_test_cases,
    totalTestCases: r.total_test_cases, executionTimeMs: r.execution_time_ms,
    memoryKb: r.memory_kb, createdAt: r.created_at,
  })));
});

// ── GET /api/submissions/:id ──────────────────────────────────────────────────
router.get('/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  const row = asSubmission(db.prepare(`
    SELECT s.*, p.title as problem_title
    FROM submissions s JOIN problems p ON p.id = s.problem_id
    WHERE s.id = ? AND s.user_id = ?
  `).get(req.params.id, req.user!.id));
  if (!row) { res.status(404).json({ error: 'Submission not found' }); return; }

  const results = asResults(db.prepare(
    'SELECT * FROM submission_results WHERE submission_id = ? ORDER BY sort_order',
  ).all(row.id));

  res.json({
    id: row.id, problemId: row.problem_id, problemTitle: row.problem_title,
    language: row.language, verdict: row.verdict,
    passedTestCases: row.passed_test_cases, totalTestCases: row.total_test_cases,
    executionTimeMs: row.execution_time_ms, memoryKb: row.memory_kb, createdAt: row.created_at,
    testCaseResults: results.map((r) => ({
      id: r.test_case_id, passed: r.passed === 1,
      actualOutput: r.actual_output, executionTimeMs: r.execution_time_ms,
      memoryKb: r.memory_kb, error: r.error,
    })),
  });
});

// ── POST /api/submissions ─────────────────────────────────────────────────────
router.post('/', requireAuth, (req: AuthRequest, res: Response): void => {
  const { problemId, language, code, isSubmit, contestId } = req.body as {
    problemId: string; language: string; code: string;
    isSubmit: boolean; contestId?: string;
  };

  if (!problemId || !language || !code) {
    res.status(400).json({ error: 'problemId, language and code are required' });
    return;
  }

  const problem = asProblem(
    db.prepare('SELECT id, time_limit_ms, memory_limit_mb FROM problems WHERE id = ? AND is_active = 1')
      .get(problemId),
  );
  if (!problem) { res.status(404).json({ error: 'Problem not found' }); return; }

  const testCases = asTestCases(db.prepare(`
    SELECT * FROM test_cases WHERE problem_id = ?
    ${isSubmit ? '' : 'AND is_sample = 1'}
    ORDER BY sort_order ASC
  `).all(problemId));
  if (testCases.length === 0) {
    res.status(422).json({ error: 'No test cases found for this problem' });
    return;
  }

  const id = uuid();
  db.prepare(`
    INSERT INTO submissions
      (id,problem_id,user_id,contest_id,language,code,verdict,total_test_cases,is_submit)
    VALUES (?,?,?,?,?,?,'running',?,?)
  `).run(id, problemId, req.user!.id, contestId ?? null, language, code, testCases.length, isSubmit ? 1 : 0);

  res.status(202).json({ id, totalTestCases: testCases.length });

  // Run async — do NOT await
  void runJudge({
    submissionId: id, userId: req.user!.id,
    contestId: contestId ?? null, problemId, language, code,
    testCases, timeLimitMs: problem.time_limit_ms, isSubmit: !!isSubmit,
  });
});

// ── Judge ─────────────────────────────────────────────────────────────────────
interface JudgeJob {
  submissionId: string; userId: string; contestId: string | null;
  problemId: string; language: string; code: string;
  testCases: TestCaseRow[]; timeLimitMs: number; isSubmit: boolean;
}

async function runJudge(job: JudgeJob): Promise<void> {
  const { getIO } = await import('../socket/gateway');
  const io   = getIO();
  const room = `submission:${job.submissionId}`;

  let passed       = 0;
  let maxTime      = 0;
  let maxMem       = 0;
  let finalVerdict: SubmissionRow['verdict'] = 'AC';
  let failedTc: null | {
    id: string; passed: false; expectedOutput: string; actualOutput: string;
    executionTimeMs: number; memoryKb: number; error?: string;
  } = null;

  for (let i = 0; i < job.testCases.length; i++) {
    const tc     = job.testCases[i];
    const result = await runCode(job.language, job.code, tc.input);

    let verdict: SubmissionRow['verdict'] = 'AC';
    if (result.timedOut || result.netTimeMs > job.timeLimitMs) verdict = 'TLE';
    else if (result.exitCode !== 0) verdict = 'RE';
    else if (normalise(result.stdout) !== normalise(tc.expected_output)) verdict = 'WA';

    const tcPassed = verdict === 'AC';
    if (tcPassed) passed++;
    maxTime = Math.max(maxTime, result.executionTimeMs);
    maxMem  = Math.max(maxMem,  result.memoryKb);

    db.prepare(`
      INSERT INTO submission_results
        (id,submission_id,test_case_id,passed,actual_output,execution_time_ms,memory_kb,error,sort_order)
      VALUES (?,?,?,?,?,?,?,?,?)
    `).run(
      uuid(), job.submissionId, tc.id, tcPassed ? 1 : 0,
      result.stdout, result.executionTimeMs, result.memoryKb,
      result.stderr || null, i,
    );

    io?.to(room).emit('submission:progress', {
      submissionId: job.submissionId, passedTestCases: passed,
      totalTestCases: job.testCases.length, isStreaming: true,
      testCaseResult: {
        id: tc.id, passed: tcPassed,
        executionTimeMs: result.executionTimeMs, memoryKb: result.memoryKb,
        ...(tc.is_sample ? { expectedOutput: tc.expected_output, actualOutput: result.stdout } : {}),
        ...(result.stderr ? { error: result.stderr } : {}),
      },
    });

    if (!tcPassed) {
      finalVerdict = verdict;
      if (!failedTc) {
        failedTc = {
          id: tc.id, passed: false,
          expectedOutput: tc.expected_output, actualOutput: result.stdout,
          executionTimeMs: result.executionTimeMs, memoryKb: result.memoryKb,
          ...(result.stderr ? { error: result.stderr } : {}),
        };
      }
      break;
    }
  }

  db.prepare(
    'UPDATE submissions SET verdict=?,passed_test_cases=?,execution_time_ms=?,memory_kb=? WHERE id=?',
  ).run(finalVerdict, passed, maxTime, maxMem, job.submissionId);

  db.prepare('UPDATE problems SET total_submissions = total_submissions + 1 WHERE id = ?').run(job.problemId);

  if (finalVerdict === 'AC') {
    const alreadySolved = asAlreadySolved(db.prepare(`
      SELECT 1 FROM submissions
      WHERE user_id=? AND problem_id=? AND verdict='AC' AND id != ?
    `).get(job.userId, job.problemId, job.submissionId));

    if (!alreadySolved) {
      db.prepare('UPDATE users SET solved_count = solved_count + 1 WHERE id = ?').run(job.userId);
    }

    const stats = asStats(db.prepare(`
      SELECT COUNT(*) as total, SUM(CASE WHEN verdict='AC' THEN 1 ELSE 0 END) as accepted
      FROM submissions WHERE problem_id=? AND is_submit=1
    `).get(job.problemId));
    db.prepare('UPDATE problems SET acceptance_rate=? WHERE id=?')
      .run(Math.round((stats.accepted / stats.total) * 100), job.problemId);

    if (job.contestId && job.isSubmit) {
      recalculateLeaderboard(job.contestId);
      const lb = asLeaderboard(db.prepare(`
        SELECT * FROM leaderboard WHERE contest_id=?
        ORDER BY total_score DESC, penalty_time_minutes ASC
      `).all(job.contestId));

      io?.to(`contest:${job.contestId}`).emit('leaderboard:update',
        lb.map((r, idx) => ({
          rank: idx + 1, userId: r.user_id, username: r.username,
          solvedCount: r.solved_count, totalScore: r.total_score,
          penaltyTimeMinutes: r.penalty_time_minutes,
          problemBreakdown: JSON.parse(r.problem_breakdown),
        })),
      );
    }
  }

  io?.to(room).emit('submission:done', {
    submissionId: job.submissionId, verdict: finalVerdict,
    passedTestCases: passed, totalTestCases: job.testCases.length,
    executionTimeMs: maxTime, memoryKb: maxMem,
    failedTestCase: failedTc, isStreaming: false,
  });
}

function normalise(s: string): string {
  return s.split('\n').map((l) => l.trimEnd()).join('\n').trim();
}

export default router;
