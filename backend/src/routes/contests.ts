import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { Contest, IContest } from '../db/models/Contest';
import { Problem } from '../db/models/Problem';
import { Announcement } from '../db/models/Announcement';
import { Leaderboard } from '../db/models/Leaderboard';
import { requireAuth, requirePermission, AuthRequest } from '../middleware/auth';

const router = Router();

// Short in-memory cache for active contest (4s TTL)
let activeContestCache: { data: any; expiry: number } | null = null;

// ── helper ────────────────────────────────────────────────────────────────────
function formatContestData(contest: any, problems: any[], announcements: any[]) {
  const problemMap = new Map(problems.map(p => [p._id, p]));
  const orderedProblems = (contest.problemIds || [])
    .map((pid: string) => problemMap.get(pid))
    .filter(Boolean);

  const now = new Date();
  const startTime = new Date(contest.startTime);
  const endTime = new Date(contest.endTime);
  const isEnded = endTime < now;
  const isUpcoming = startTime > now;
  const isLive = !isEnded && !isUpcoming;
  const status: 'live' | 'upcoming' | 'ended' = isLive ? 'live' : (isUpcoming ? 'upcoming' : 'ended');

  return {
    id:                         contest._id,
    title:                      contest.title,
    startTime:                  startTime.toISOString(),
    endTime:                    endTime.toISOString(),
    durationMinutes:            contest.durationMinutes,
    participantCount:           contest.participantCount,
    maxScore:                   contest.maxScore,
    isLeaderboardFrozen:        contest.isLeaderboardFrozen,
    freezeTimeRemainingMinutes: contest.freezeTimeRemainingMinutes ?? null,
    isEnded,
    isUpcoming,
    isLive,
    status,
    problems: orderedProblems.map((p: any) => {
      const sampleTcs = (p.testCases || [])
        .filter((t: any) => t.isSample)
        .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));
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
        sampleTestCases: sampleTcs.map((t: any) => ({
          id: t.id,
          input: t.input,
          expectedOutput: t.expectedOutput,
          isSample: true,
        })),
      };
    }),
    announcements: announcements.map((a: any) => ({
      id: a._id,
      message: a.message,
      timestamp: new Date(a.timestamp).toISOString(),
    })),
  };
}

async function hydrateContest(contest: IContest) {
  const [problems, announcements] = await Promise.all([
    Problem.find({ _id: { $in: contest.problemIds } }).lean(),
    Announcement.find({ contestId: contest._id }).sort({ timestamp: 1 }).lean(),
  ]);
  return formatContestData(contest, problems, announcements);
}

// ── GET /api/contest ───────────────────────────────────────────────────────────
router.get('/', requireAuth, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const contests = await Contest.find().sort({ createdAt: -1 }).lean();
    const allProblemIds = Array.from(new Set(contests.flatMap(c => c.problemIds || [])));
    const allContestIds = contests.map(c => c._id);

    const [allProblems, allAnnouncements] = await Promise.all([
      Problem.find({ _id: { $in: allProblemIds } }).lean(),
      Announcement.find({ contestId: { $in: allContestIds } }).sort({ timestamp: 1 }).lean(),
    ]);

    const announcementMap = new Map<string, any[]>();
    allAnnouncements.forEach(a => {
      let list = announcementMap.get(a.contestId);
      if (!list) {
        list = [];
        announcementMap.set(a.contestId, list);
      }
      list.push(a);
    });

    const hydrated = contests.map(c =>
      formatContestData(c, allProblems, announcementMap.get(c._id) || [])
    );

    res.json(hydrated);
  } catch (err) {
    console.error('Fetch contests error:', err);
    res.status(500).json({ error: 'Failed to fetch contests' });
  }
});

// ── GET /api/contest/active ───────────────────────────────────────────────────
router.get('/active', requireAuth, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const nowMs = Date.now();
    if (activeContestCache && activeContestCache.expiry > nowMs) {
      res.json(activeContestCache.data);
      return;
    }

    const now = new Date();
    // 1. Try to find an actively running live contest
    let contest = await Contest.findOne({
      startTime: { $lte: now },
      endTime: { $gte: now },
    }).sort({ startTime: -1 }).lean();

    // 2. Fallback: find any most recent contest in database (returns as concluded without modifying DB)
    if (!contest) {
      contest = await Contest.findOne().sort({ createdAt: -1 }).lean();
      if (!contest) { res.status(404).json({ error: 'No active contest' }); return; }
    }

    const hydrated = await hydrateContest(contest as any);
    activeContestCache = { data: hydrated, expiry: nowMs + 2000 };
    res.json(hydrated);
  } catch (err) {
    console.error('Fetch active contest error:', err);
    res.status(500).json({ error: 'Failed to fetch active contest' });
  }
});

// ── POST /api/contest/:id/extend ──────────────────────────────────────────────
router.post('/:id/extend', requireAuth, requirePermission('manage_contests'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) { res.status(404).json({ error: 'Contest not found' }); return; }

    const now = new Date();
    // If already expired, start from now - 15m to now + 105m (restarts as live)
    if (contest.endTime < now) {
      contest.startTime = new Date(now.getTime() - 15 * 60 * 1000);
      contest.endTime = new Date(now.getTime() + 105 * 60 * 1000);
    } else {
      // Extend existing end time by 60 minutes
      contest.endTime = new Date(contest.endTime.getTime() + 60 * 60 * 1000);
    }

    await contest.save();
    activeContestCache = null; // bust cache
    const hydrated = await hydrateContest(contest);

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getIO } = require('../socket/gateway') as typeof import('../socket/gateway');
    getIO()?.to(`contest:${req.params.id}`).emit('contest:updated', hydrated);
    getIO()?.emit('contest:updated', hydrated);

    res.json(hydrated);
  } catch (err) {
    console.error('Extend contest error:', err);
    res.status(500).json({ error: 'Failed to extend contest' });
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

// ── POST /api/contest/:id/stop ────────────────────────────────────────────────
router.post('/:id/stop', requireAuth, requirePermission('manage_contests'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) { res.status(404).json({ error: 'Contest not found' }); return; }

    contest.endTime = new Date();
    await contest.save();
    activeContestCache = null; // bust cache

    const hydrated = await hydrateContest(contest);

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getIO } = require('../socket/gateway') as typeof import('../socket/gateway');
    getIO()?.to(`contest:${req.params.id}`).emit('contest:ended', hydrated);

    res.json(hydrated);
  } catch (err) {
    console.error('Stop contest error:', err);
    res.status(500).json({ error: 'Failed to stop contest' });
  }
});

// ── DELETE /api/contest/:id ───────────────────────────────────────────────────
router.delete('/:id', requireAuth, requirePermission('manage_contests'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) { res.status(404).json({ error: 'Contest not found' }); return; }

    await Promise.all([
      Contest.findByIdAndDelete(req.params.id),
      Announcement.deleteMany({ contestId: req.params.id }),
      Leaderboard.deleteMany({ contestId: req.params.id }),
    ]);

    activeContestCache = null; // bust cache
    res.json({ ok: true, message: 'Contest and associated data deleted successfully' });
  } catch (err) {
    console.error('Delete contest error:', err);
    res.status(500).json({ error: 'Failed to delete contest' });
  }
});

// ── GET /api/contest/:id/participants ─────────────────────────────────────────
router.get('/:id/participants', requireAuth, requirePermission('manage_contests', 'manage_problems'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leaderboardDocs = await Leaderboard.find({ contestId: req.params.id })
      .sort({ totalScore: -1, penaltyTimeMinutes: 1 })
      .lean();

    const { User } = await import('../db/models/User');
    const userIds = leaderboardDocs.map((e) => e.userId);
    const users = await User.find({ _id: { $in: userIds } }).select('_id username email role').lean();
    const userMap = new Map(users.map((u) => [u._id, u]));

    const participants = leaderboardDocs.map((entry, index) => {
      const user = userMap.get(entry.userId);
      return {
        rank: index + 1,
        userId: entry.userId,
        username: user?.username || entry.username || 'Student',
        email: user?.email || '—',
        role: user?.role || 'student',
        solvedCount: entry.solvedCount || 0,
        totalScore: entry.totalScore || 0,
        penaltyTimeMinutes: entry.penaltyTimeMinutes || 0,
        lastUpdated: entry.lastUpdated ? new Date(entry.lastUpdated).toISOString() : new Date().toISOString(),
        problemBreakdown: entry.problemBreakdown || {},
      };
    });

    res.json(participants);
  } catch (err) {
    console.error('Fetch participants error:', err);
    res.status(500).json({ error: 'Failed to fetch contest participants' });
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
