import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { Contest, IContest } from '../db/models/Contest';
import { Problem } from '../db/models/Problem';
import { Announcement } from '../db/models/Announcement';
import { Leaderboard } from '../db/models/Leaderboard';
import { requireAuth, requirePermission, AuthRequest } from '../middleware/auth';

const router = Router();

// ── helper ────────────────────────────────────────────────────────────────────
async function hydrateContest(contest: IContest) {
  const problems = await Problem.find({ _id: { $in: contest.problemIds } });
  
  // Map problems in the order specified by contest.problemIds
  const orderedProblems = (contest.problemIds || [])
    .map((pid) => problems.find((p) => p._id === pid))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  const announcements = await Announcement.find({ contestId: contest._id }).sort({ timestamp: 1 });

  return {
    id:                         contest._id,
    title:                      contest.title,
    startTime:                  contest.startTime.toISOString(),
    endTime:                    contest.endTime.toISOString(),
    durationMinutes:            contest.durationMinutes,
    participantCount:           contest.participantCount,
    maxScore:                   contest.maxScore,
    isLeaderboardFrozen:        contest.isLeaderboardFrozen,
    freezeTimeRemainingMinutes: contest.freezeTimeRemainingMinutes ?? null,
    problems: orderedProblems.map((p) => {
      const sampleTcs = (p.testCases || [])
        .filter((t) => t.isSample)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      return {
        id: p._id,
        title: p.title,
        slug: p.slug,
        difficulty: p.difficulty,
        points: p.points,
        timeLimitMs: p.timeLimitMs,
        memoryLimitMb: p.memoryLimitMb,
        acceptanceRate: p.acceptanceRate,
        totalSubmissions: p.totalSubmissions,
        description: p.description,
        inputFormat: p.inputFormat,
        outputFormat: p.outputFormat,
        tags: p.tags || [],
        sampleTestCases: sampleTcs.map((t) => ({
          id: t.id,
          input: t.input,
          expectedOutput: t.expectedOutput,
          isSample: true,
        })),
      };
    }),
    announcements: announcements.map((a) => ({
      id: a._id,
      message: a.message,
      timestamp: a.timestamp.toISOString(),
    })),
  };
}

// ── GET /api/contest ───────────────────────────────────────────────────────────
router.get('/', requireAuth, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const contests = await Contest.find().sort({ createdAt: -1 });
    const hydrated = await Promise.all(contests.map(hydrateContest));
    res.json(hydrated);
  } catch (err) {
    console.error('Fetch contests error:', err);
    res.status(500).json({ error: 'Failed to fetch contests' });
  }
});

// ── GET /api/contest/active ───────────────────────────────────────────────────
router.get('/active', requireAuth, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();
    let contest = await Contest.findOne({ startTime: { $lte: now } }).sort({ startTime: -1 });

    if (!contest) {
      contest = await Contest.findOne().sort({ createdAt: -1 });
      if (!contest) { res.status(404).json({ error: 'No active contest' }); return; }
    }

    const hydrated = await hydrateContest(contest);
    res.json(hydrated);
  } catch (err) {
    console.error('Fetch active contest error:', err);
    res.status(500).json({ error: 'Failed to fetch active contest' });
  }
});

// ── GET /api/contest/:id ──────────────────────────────────────────────────────
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) { res.status(404).json({ error: 'Contest not found' }); return; }

    // Register participant if first visit (student only)
    if (req.user!.role === 'student') {
      const existingLb = await Leaderboard.findOne({ contestId: contest._id, userId: req.user!.id });
      if (!existingLb) {
        await Leaderboard.create({
          contestId: contest._id,
          userId: req.user!.id,
          username: req.user!.username,
          solvedCount: 0,
          totalScore: 0,
          penaltyTimeMinutes: 0,
          problemBreakdown: new Map(),
          lastUpdated: new Date(),
        }).catch(() => { /* handle potential race condition */ });

        await Contest.findByIdAndUpdate(contest._id, { $inc: { participantCount: 1 } });
      }
    }

    const hydrated = await hydrateContest(contest);
    res.json(hydrated);
  } catch (err) {
    console.error('Fetch contest by ID error:', err);
    res.status(500).json({ error: 'Failed to fetch contest' });
  }
});

// ── POST /api/contest ─────────────────────────────────────────────────────────
router.post('/', requireAuth, requirePermission('manage_contests', 'manage_problems'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, startTime, endTime, durationMinutes, problemIds } = req.body as {
      title: string; startTime: string; endTime: string;
      durationMinutes?: number; problemIds?: string[];
    };

    if (!title || !startTime || !endTime) {
      res.status(400).json({ error: 'title, startTime and endTime are required' });
      return;
    }

    const id = uuid();
    const validProblemIds = problemIds ?? [];
    
    // Calculate max score
    const problems = await Problem.find({ _id: { $in: validProblemIds } });
    const maxScore = problems.reduce((sum, p) => sum + (p.points || 0), 0);

    const contest = await Contest.create({
      _id: id,
      title: title.trim(),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      durationMinutes: durationMinutes ?? 120,
      maxScore,
      createdBy: req.user!.id,
      problemIds: validProblemIds,
    });

    const hydrated = await hydrateContest(contest);

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getIO } = require('../socket/gateway') as typeof import('../socket/gateway');
    getIO()?.emit('contest:created', hydrated);

    res.status(201).json(hydrated);
  } catch (err) {
    console.error('Create contest error:', err);
    res.status(500).json({ error: 'Failed to create contest' });
  }
});

// ── POST /api/contest/:id/announcements ───────────────────────────────────────
router.post('/:id/announcements', requireAuth, requirePermission('manage_contests', 'manage_problems'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { message } = req.body as { message: string };
    if (!message?.trim()) { res.status(400).json({ error: 'message is required' }); return; }

    const contest = await Contest.findById(req.params.id);
    if (!contest) { res.status(404).json({ error: 'Contest not found' }); return; }

    const id = uuid();
    const timestamp = new Date();

    const announcement = await Announcement.create({
      _id: id,
      contestId: req.params.id,
      message: message.trim(),
      createdBy: req.user!.id,
      timestamp,
    });

    const ann = {
      id: announcement._id,
      message: announcement.message,
      timestamp: announcement.timestamp.toISOString(),
    };

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getIO } = require('../socket/gateway') as typeof import('../socket/gateway');
    getIO()?.to(`contest:${req.params.id}`).emit('announcement', ann);

    res.status(201).json(ann);
  } catch (err) {
    console.error('Create announcement error:', err);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

// ── PATCH /api/contest/:id/freeze ─────────────────────────────────────────────
router.patch('/:id/freeze', requireAuth, requirePermission('manage_contests'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { frozen } = req.body as { frozen: boolean };
    await Contest.findByIdAndUpdate(req.params.id, { isLeaderboardFrozen: !!frozen });
    res.json({ ok: true, frozen: !!frozen });
  } catch (err) {
    console.error('Freeze contest error:', err);
    res.status(500).json({ error: 'Failed to freeze contest' });
  }
});

export default router;
