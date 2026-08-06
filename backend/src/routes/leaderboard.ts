import { Router, Response } from 'express';
import { Leaderboard, IProblemBreakdown } from '../db/models/Leaderboard';
import { Contest } from '../db/models/Contest';
import { Problem } from '../db/models/Problem';
import { Submission } from '../db/models/Submission';
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
    });

    res.json(
      docs.map((r, idx) => {
        // Convert Map to plain object
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

// ── Exported helper — called by judge after each AC submission ────────────
export async function recalculateLeaderboard(contestId: string): Promise<void> {
  try {
    const contest = await Contest.findById(contestId);
    if (!contest || contest.isLeaderboardFrozen) return;

    const contestStart = contest.startTime.getTime();
    const problemIds = contest.problemIds || [];

    const lbEntries = await Leaderboard.find({ contestId });
    const participants = lbEntries.map((e) => ({ userId: e.userId, username: e.username }));

    for (const { userId, username } of participants) {
      let totalScore = 0;
      let totalPenalty = 0;
      let solvedCount = 0;
      const breakdown = new Map<string, IProblemBreakdown>();

      for (const problemId of problemIds) {
        const subs = await Submission.find({
          userId,
          problemId,
          contestId,
        }).sort({ createdAt: 1 });

        if (subs.length === 0) {
          breakdown.set(problemId, { score: 0, attempted: false });
          continue;
        }

        breakdown.set(problemId, { score: 0, attempted: true });
        const acSub = subs.find((s) => s.verdict === 'AC' && s.isSubmit);
        if (!acSub) continue;

        const problem = await Problem.findById(problemId);
        if (!problem) continue;

        const minutesSinceStart = Math.floor(
          (acSub.createdAt.getTime() - contestStart) / 60000,
        );
        const wrongAttempts = subs.filter(
          (s) => s.verdict !== 'AC' && s.isSubmit && s.createdAt < acSub.createdAt,
        ).length;

        breakdown.set(problemId, {
          score: problem.points,
          attempted: true,
          solvedTime: acSub.createdAt.toISOString(),
        });
        totalScore += problem.points;
        totalPenalty += Math.max(0, minutesSinceStart) + wrongAttempts * 20;
        solvedCount++;
      }

      await Leaderboard.findOneAndUpdate(
        { contestId, userId },
        {
          $set: {
            username,
            solvedCount,
            totalScore,
            penaltyTimeMinutes: totalPenalty,
            problemBreakdown: breakdown,
            lastUpdated: new Date(),
          },
        },
        { upsert: true },
      );
    }
  } catch (err) {
    console.error('recalculateLeaderboard error:', err);
  }
}

export default router;
