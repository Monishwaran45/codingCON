import { Router, Response } from 'express';
import { Leaderboard, IProblemBreakdown } from '../db/models/Leaderboard';
import { Contest } from '../db/models/Contest';
import { Problem } from '../db/models/Problem';
import { Submission } from '../db/models/Submission';
import { User } from '../db/models/User';
import { requireAuth, requirePermission, AuthRequest } from '../middleware/auth';

const router = Router();

// ── GET /api/leaderboard (active contest) ──────────────────────────────────────
router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const activeContest = await Contest.findOne().sort({ createdAt: -1 });
    if (!activeContest) { res.json([]); return; }

    const docs = await Leaderboard.find({ contestId: activeContest._id }).sort({
      totalScore: -1,
      penaltyTimeMinutes: 1,
    });

    res.json(
      docs.map((r, idx) => {
        const breakdownObj: Record<string, IProblemBreakdown> = {};
        if (r.problemBreakdown instanceof Map) {
          r.problemBreakdown.forEach((val, key) => { breakdownObj[key] = val; });
        } else if (r.problemBreakdown && typeof r.problemBreakdown === 'object') {
          Object.assign(breakdownObj, r.problemBreakdown);
        }
        return {
          rank: idx + 1,
          userId: r.userId,
          username: r.username,
          solvedCount: r.solvedCount,
          totalScore: r.totalScore,
          penaltyTimeMinutes: r.penaltyTimeMinutes,
          problemBreakdown: breakdownObj,
        };
      })
    );
  } catch (err) {
    console.error('Fetch root leaderboard error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// ── GET /api/leaderboard/:contestId ──────────────────────────────────────────
router.get('/:contestId', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const docs = await Leaderboard.find({ contestId: req.params.contestId }).sort({
      totalScore: -1,
      penaltyTimeMinutes: 1,
    }).lean();

    res.json(
      docs.map((r, idx) => {
        // Convert Map or Object to plain object
        const breakdownObj: Record<string, IProblemBreakdown> = {};
        if (r.problemBreakdown instanceof Map) {
          r.problemBreakdown.forEach((val, key) => {
            breakdownObj[key] = val;
          });
        } else if (r.problemBreakdown && typeof r.problemBreakdown === 'object') {
          Object.assign(breakdownObj, r.problemBreakdown);
        }

        return {
          rank: idx + 1,
          userId: r.userId,
          username: r.username,
          solvedCount: r.solvedCount,
          totalScore: r.totalScore,
          penaltyTimeMinutes: r.penaltyTimeMinutes,
          problemBreakdown: breakdownObj,
        };
      }),
    );
  } catch (err) {
    console.error('Fetch leaderboard error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// ── POST /api/leaderboard/:contestId/recalculate (admin only) ───────────────
router.post(
  '/:contestId/recalculate',
  requireAuth,
  requirePermission('manage_users'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await recalculateLeaderboard(req.params.contestId);
      res.json({ ok: true });
    } catch (err) {
      console.error('Recalculate leaderboard error:', err);
      res.status(500).json({ error: 'Failed to recalculate leaderboard' });
    }
  },
);

// ── Exported helper — called asynchronously by judge after submission ────────────
export async function recalculateLeaderboard(contestId: string): Promise<void> {
  try {
    const contest = await Contest.findById(contestId).lean();
    if (!contest || contest.isLeaderboardFrozen) return;

    const contestStart = new Date(contest.startTime).getTime();
    const problemIds = contest.problemIds || [];

    // 1. Fetch problems in 1 query
    const problems = await Problem.find({ _id: { $in: problemIds } }).select('_id points').lean();
    const problemPointsMap = new Map(problems.map(p => [p._id, p.points || 0]));

    // 2. Fetch all submissions for the contest in 1 query
    const submissions = await Submission.find({
      $or: [
        { contestId },
        { createdAt: { $gte: contest.startTime, $lte: contest.endTime } },
      ],
    }).sort({ createdAt: 1 }).lean();

    // 3. Collect unique user IDs and fetch usernames in 1 query
    const userIds = new Set<string>();
    submissions.forEach(s => userIds.add(s.userId));
    
    const existingEntries = await Leaderboard.find({ contestId }).lean();
    existingEntries.forEach(e => userIds.add(e.userId));

    const users = await User.find({ _id: { $in: Array.from(userIds) } }).select('_id username').lean();
    const userMap = new Map<string, string>();
    users.forEach(u => userMap.set(u._id, u.username));
    existingEntries.forEach(e => {
      if (!userMap.has(e.userId)) userMap.set(e.userId, e.username);
    });

    // 4. In-memory aggregation: group submissions by userId and problemId
    const userSubmissions = new Map<string, typeof submissions>();
    for (const sub of submissions) {
      let list = userSubmissions.get(sub.userId);
      if (!list) {
        list = [];
        userSubmissions.set(sub.userId, list);
      }
      list.push(sub);
    }

    const bulkOps: any[] = [];

    for (const [userId, username] of Array.from(userMap.entries())) {
      let totalScore = 0;
      let totalPenalty = 0;
      let solvedCount = 0;
      const breakdown: Record<string, IProblemBreakdown> = {};

      const userSubs = userSubmissions.get(userId) || [];

      for (const problemId of problemIds) {
        const problemSubs = userSubs.filter(s => s.problemId === problemId);

        if (problemSubs.length === 0) {
          breakdown[problemId] = { score: 0, attempted: false };
          continue;
        }

        breakdown[problemId] = { score: 0, attempted: true };
        const acSub = problemSubs.find((s) => s.verdict === 'AC' && s.isSubmit);
        if (!acSub) continue;

        const points = problemPointsMap.get(problemId) || 0;
        const subTime = new Date(acSub.createdAt).getTime();
        const minutesSinceStart = Math.floor((subTime - contestStart) / 60000);
        const wrongAttempts = problemSubs.filter(
          (s) => s.verdict !== 'AC' && s.isSubmit && new Date(s.createdAt).getTime() < subTime,
        ).length;

        breakdown[problemId] = {
          score: points,
          attempted: true,
          solvedTime: new Date(acSub.createdAt).toISOString(),
        };
        totalScore += points;
        totalPenalty += Math.max(0, minutesSinceStart) + wrongAttempts * 20;
        solvedCount++;
      }

      bulkOps.push({
        updateOne: {
          filter: { contestId, userId },
          update: {
            $set: {
              username,
              solvedCount,
              totalScore,
              penaltyTimeMinutes: totalPenalty,
              problemBreakdown: breakdown,
              lastUpdated: new Date(),
            },
          },
          upsert: true,
        },
      });
    }

    if (bulkOps.length > 0) {
      await Leaderboard.bulkWrite(bulkOps);
    }
  } catch (err) {
    console.error('recalculateLeaderboard error:', err);
  }
}

export default router;
