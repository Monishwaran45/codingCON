import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { Problem, IProblem } from '../db/models/Problem';
import { Submission } from '../db/models/Submission';
import { requireAuth, requirePermission, AuthRequest } from '../middleware/auth';

const router = Router();

// ── helper ────────────────────────────────────────────────────────────────────
async function hydrateProblem(problem: IProblem, userId?: string) {
  let isSolved = false;
  let isAttempted = false;
  let lastAttemptedAt: string | undefined;

  if (userId) {
    const latest = await Submission.findOne({ problemId: problem._id, userId })
      .sort({ createdAt: -1 })
      .select('verdict createdAt');
    if (latest) {
      isAttempted = true;
      lastAttemptedAt = latest.createdAt.toISOString();
      isSolved = latest.verdict === 'AC';
    }
  }

  const sampleTestCases = (problem.testCases || [])
    .filter((t) => t.isSample)
    .map((t) => ({
      id: t.id,
      input: t.input,
      expectedOutput: t.expectedOutput,
      isSample: true,
    }));

  return {
    id: problem._id,
    title: problem.title,
    slug: problem.slug,
    difficulty: problem.difficulty,
    points: problem.points,
    timeLimitMs: problem.timeLimitMs,
    memoryLimitMb: problem.memoryLimitMb,
    acceptanceRate: problem.acceptanceRate,
    totalSubmissions: problem.totalSubmissions,
    description: problem.description,
    inputFormat: problem.inputFormat,
    outputFormat: problem.outputFormat,
    tags: problem.tags || [],
    isSolved,
    isAttempted,
    lastAttemptedAt,
    sampleTestCases,
  };
}

// ── GET /api/problems ─────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { difficulty, tag, q } = req.query as { difficulty?: string; tag?: string; q?: string };

    const activeContests = await import('../db/models/Contest').then(m => m.Contest.find({ endTime: { $gt: new Date() } }));
    const hiddenProblemIds = activeContests.flatMap(c => c.problemIds || []);

    const query: Record<string, unknown> = { 
      isActive: true,
      _id: { $nin: hiddenProblemIds }
    };
    if (difficulty) {
      query.difficulty = difficulty;
    }

    const docs = await Problem.find(query);

    let problems = await Promise.all(
      docs.map((doc) => hydrateProblem(doc, req.user!.id)),
    );

    if (tag) {
      const lt = tag.toLowerCase();
      problems = problems.filter((p) => p.tags.some((t) => t.toLowerCase() === lt));
    }
    if (q) {
      const lq = q.toLowerCase();
      problems = problems.filter(
        (p) => p.title.toLowerCase().includes(lq) || p.tags.some((t) => t.toLowerCase().includes(lq)),
      );
    }

    res.json(problems);
  } catch (err) {
    console.error('Fetch problems error:', err);
    res.status(500).json({ error: 'Failed to fetch problems' });
  }
});

// ── GET /api/problems/:id/admin ───────────────────────────────────────────────
router.get('/:id/admin', requireAuth, requirePermission('manage_problems'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const problem = await Problem.findOne({
      $or: [{ _id: req.params.id }, { slug: req.params.id }],
    });
    if (!problem) { res.status(404).json({ error: 'Problem not found' }); return; }

    const hydrated = await hydrateProblem(problem, req.user!.id);
    const allTestCases = (problem.testCases || []).map((t) => ({
      id: t.id,
      input: t.input,
      expectedOutput: t.expectedOutput,
      isSample: t.isSample,
    }));

    res.json({
      ...hydrated,
      allTestCases,
    });
  } catch (err) {
    console.error('Fetch admin problem error:', err);
    res.status(500).json({ error: 'Failed to fetch problem details' });
  }
});

// ── GET /api/problems/:id ─────────────────────────────────────────────────────
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const problem = await Problem.findOne({
      $or: [{ _id: req.params.id }, { slug: req.params.id }],
      isActive: true,
    });
    if (!problem) { res.status(404).json({ error: 'Problem not found' }); return; }

    const hydrated = await hydrateProblem(problem, req.user!.id);
    res.json(hydrated);
  } catch (err) {
    console.error('Fetch problem by ID error:', err);
    res.status(500).json({ error: 'Failed to fetch problem' });
  }
});

// ── POST /api/problems ────────────────────────────────────────────────────────
router.post('/', requireAuth, requirePermission('manage_problems'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      title, difficulty, points, timeLimitMs, memoryLimitMb,
      description, inputFormat, outputFormat, tags, sampleTestCases, testCases,
    } = req.body as {
      title: string; difficulty: 'easy' | 'medium' | 'hard'; points: number;
      timeLimitMs: number; memoryLimitMb: number;
      description: string; inputFormat: string; outputFormat: string;
      tags: string[];
      sampleTestCases?: { input: string; expectedOutput: string; isSample?: boolean }[];
      testCases?: { input: string; expectedOutput: string; isSample?: boolean }[];
    };

    if (!title || !difficulty || !description) {
      res.status(400).json({ error: 'title, difficulty and description are required' });
      return;
    }

    const id = uuid();
    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now().toString(36);

    const casesToInsert = testCases ?? sampleTestCases ?? [];
    const formattedCases = casesToInsert.map((tc, idx) => ({
      id: uuid(),
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      isSample: !!tc.isSample,
      sortOrder: idx,
    }));

    const problem = await Problem.create({
      _id: id,
      title: title.trim(),
      slug,
      difficulty,
      points: points ?? 100,
      timeLimitMs: timeLimitMs ?? 1000,
      memoryLimitMb: memoryLimitMb ?? 256,
      description,
      inputFormat: inputFormat ?? '',
      outputFormat: outputFormat ?? '',
      tags: tags ?? [],
      createdBy: req.user!.id,
      testCases: formattedCases,
    });

    const hydrated = await hydrateProblem(problem, req.user!.id);

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getIO } = require('../socket/gateway') as typeof import('../socket/gateway');
    getIO()?.emit('problem:created', hydrated);

    res.status(201).json(hydrated);
  } catch (err) {
    console.error('Create problem error:', err);
    res.status(500).json({ error: 'Failed to create problem' });
  }
});

// ── PATCH /api/problems/:id ───────────────────────────────────────────────────
router.patch('/:id', requireAuth, requirePermission('manage_problems'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) { res.status(404).json({ error: 'Problem not found' }); return; }

    const updateFields: Record<string, unknown> = {};
    const allowed = ['title', 'difficulty', 'points', 'timeLimitMs', 'memoryLimitMb', 'description', 'inputFormat', 'outputFormat', 'tags'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updateFields[key] = req.body[key];
      }
    }

    if (Array.isArray(req.body.testCases)) {
      updateFields.testCases = (req.body.testCases as { input: string; expectedOutput: string; isSample?: boolean }[]).map((tc, idx) => ({
        id: uuid(),
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isSample: !!tc.isSample,
        sortOrder: idx,
      }));
    }

    const updated = await Problem.findByIdAndUpdate(req.params.id, { $set: updateFields }, { new: true });
    if (!updated) { res.status(500).json({ error: 'Update failed' }); return; }

    const hydrated = await hydrateProblem(updated, req.user!.id);

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getIO } = require('../socket/gateway') as typeof import('../socket/gateway');
    getIO()?.emit('problem:updated', hydrated);

    res.json(hydrated);
  } catch (err) {
    console.error('Update problem error:', err);
    res.status(500).json({ error: 'Failed to update problem' });
  }
});

// ── DELETE /api/problems/:id ──────────────────────────────────────────────────
router.delete('/:id', requireAuth, requirePermission('manage_problems'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) { res.status(404).json({ error: 'Problem not found' }); return; }

    await Problem.findByIdAndUpdate(req.params.id, { isActive: false });

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getIO } = require('../socket/gateway') as typeof import('../socket/gateway');
    getIO()?.emit('problem:deleted', { id: req.params.id });

    res.json({ ok: true });
  } catch (err) {
    console.error('Delete problem error:', err);
    res.status(500).json({ error: 'Failed to delete problem' });
  }
});

export default router;
