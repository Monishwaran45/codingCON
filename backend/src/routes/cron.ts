import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Contest } from '../db/models/Contest';
import { Leaderboard } from '../db/models/Leaderboard';

const router = Router();

/**
 * GET /api/cron
 * Background Cron maintenance task.
 * Called by Vercel Cron or Render Cron to keep the backend service warm,
 * sync contest states, and update leaderboard entries.
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = req.headers.authorization;
      const queryKey = req.query.key as string;
      const isAuthorized =
        authHeader === `Bearer ${cronSecret}` || queryKey === cronSecret;

      if (!isAuthorized) {
        res.status(401).json({ error: 'Unauthorized cron request' });
        return;
      }
    }

    const timestamp = new Date();
    const dbState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    // Update active contests status check
    const activeContestsCount = await Contest.countDocuments({
      startTime: { $lte: timestamp },
      endTime: { $gte: timestamp },
    });

    const totalLeaderboardEntries = await Leaderboard.countDocuments();

    res.json({
      status: 'ok',
      timestamp: timestamp.toISOString(),
      database: dbState,
      activeContests: activeContestsCount,
      leaderboardEntries: totalLeaderboardEntries,
      message: 'Backend keep-alive & maintenance cron completed successfully',
    });
  } catch (err) {
    const error = err as Error;
    console.error('[CRON ERROR]', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Cron task execution failed',
      error: error.message,
    });
  }
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  // Delegate POST requests to GET handler logic
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.authorization;
    const queryKey = req.query.key as string;
    const isAuthorized =
      authHeader === `Bearer ${cronSecret}` || queryKey === cronSecret;

    if (!isAuthorized) {
      res.status(401).json({ error: 'Unauthorized cron request' });
      return;
    }
  }

  const timestamp = new Date();
  const dbState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.json({
    status: 'ok',
    timestamp: timestamp.toISOString(),
    database: dbState,
    message: 'Backend keep-alive & maintenance cron completed successfully',
  });
});

export default router;
