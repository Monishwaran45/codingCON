import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { Submission, ISubmissionResult } from '../db/models/Submission';
import { Problem, ITestCase } from '../db/models/Problem';
import { User } from '../db/models/User';
import { Leaderboard, IProblemBreakdown } from '../db/models/Leaderboard';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { runCode } from '../judge/runner';
import { normaliseOutput } from '../judge/normalise';
import { recalculateLeaderboard } from './leaderboard';
import { publishJudgeJob } from '../queue/rabbitmq';

const router = Router();

// ── GET /api/submissions ──────────────────────────────────────────────────────
router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const submissions = await Submission.find({ userId: req.user!.id })
      .sort({ createdAt: -1 })
      .limit(50);

    const problemIds = submissions.map((s) => s.problemId);
    const problems = await Problem.find({ _id: { $in: problemIds } }).select('title');
    const problemMap = new Map(problems.map((p) => [p._id, p.title]));

    res.json(
      submissions.map((r) => ({
        id: r._id,
        problemId: r.problemId,
        problemTitle: problemMap.get(r.problemId) || 'Unknown Problem',
        userId: r.userId,
        username: req.user!.username,
        language: r.language,
        verdict: r.verdict,
        passedTestCases: r.passedTestCases,
        totalTestCases: r.totalTestCases,
        executionTimeMs: r.executionTimeMs,
        memoryKb: r.memoryKb,
        createdAt: r.createdAt.toISOString(),
      })),
    );
  } catch (err) {
    console.error('Fetch submissions error:', err);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// ── GET /api/submissions/:id ──────────────────────────────────────────────────
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sub = await Submission.findOne({ _id: req.params.id, userId: req.user!.id });
    if (!sub) { res.status(404).json({ error: 'Submission not found' }); return; }

    const problem = await Problem.findById(sub.problemId).select('title');

    res.json({
      id: sub._id,
      problemId: sub.problemId,
      problemTitle: problem?.title || 'Unknown Problem',
      language: sub.language,
      verdict: sub.verdict,
      passedTestCases: sub.passedTestCases,
      totalTestCases: sub.totalTestCases,
      executionTimeMs: sub.executionTimeMs,
      memoryKb: sub.memoryKb,
      createdAt: sub.createdAt.toISOString(),
      testCaseResults: (sub.testCaseResults || []).map((r) => ({
        id: r.testCaseId,
        passed: r.passed,
        actualOutput: r.actualOutput ?? null,
        executionTimeMs: r.executionTimeMs ?? null,
        memoryKb: r.memoryKb ?? null,
        error: r.error ?? null,
      })),
    });
  } catch (err) {
    console.error('Fetch submission detail error:', err);
    res.status(500).json({ error: 'Failed to fetch submission detail' });
  }
});

// ── POST /api/submissions ─────────────────────────────────────────────────────
router.post('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { problemId, language, code, isSubmit, contestId } = req.body as {
      problemId: string; language: string; code: string;
      isSubmit: boolean; contestId?: string;
    };

    if (!problemId || !language || !code) {
      res.status(400).json({ error: 'problemId, language and code are required' });
      return;
    }

    const problem = await Problem.findOne({ _id: problemId, isActive: true });
    if (!problem) { res.status(404).json({ error: 'Problem not found' }); return; }

    const allCases = problem.testCases || [];
    const targetCases = isSubmit
      ? allCases
      : allCases.filter((t) => t.isSample);

    if (targetCases.length === 0) {
      res.status(422).json({ error: 'No test cases found for this problem' });
      return;
    }

    const id = uuid();
    await Submission.create({
      _id: id,
      problemId,
      userId: req.user!.id,
      contestId: contestId ?? null,
      language,
      code,
      verdict: 'running',
      totalTestCases: targetCases.length,
      isSubmit: !!isSubmit,
      testCaseResults: [],
      createdAt: new Date(),
    });

    res.status(202).json({ id, totalTestCases: targetCases.length });

    // Publish to Message Queue
    await publishJudgeJob({
      submissionId: id,
      userId: req.user!.id,
      contestId: contestId ?? null,
      problemId,
      language,
      code,
      testCases: targetCases,
      timeLimitMs: problem.timeLimitMs,
      isSubmit: !!isSubmit,
    });
  } catch (err) {
    console.error('Create submission error:', err);
    res.status(500).json({ error: 'Failed to submit code' });
  }
});

// ── Judge ─────────────────────────────────────────────────────────────────────
// ── Helper ────────────────────────────────────────────────────────────────────
// Re-export the canonical normaliser for any route-specific logic if needed
export { normaliseOutput as normalise } from '../judge/normalise';

export default router;
