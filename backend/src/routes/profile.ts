import { Router, Response } from 'express';
import { User } from '../db/models/User';
import { RatingHistory } from '../db/models/RatingHistory';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// ── GET /api/profile ─────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id).lean();
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const { Submission } = await import('../db/models/Submission');
    const { Problem } = await import('../db/models/Problem');

    const acSubmissions = await Submission.find({ userId: user._id, verdict: 'AC' }).select('problemId').lean();
    const solvedProblemIds = Array.from(new Set(acSubmissions.map((s) => s.problemId)));
    const solvedCount = Math.max(user.solvedCount || 0, solvedProblemIds.length);

    let totalPoints = user.totalPoints || 0;
    if (solvedProblemIds.length > 0) {
      const solvedProblems = await Problem.find({ _id: { $in: solvedProblemIds } }).select('points').lean();
      const computedPoints = solvedProblems.reduce((sum, p) => sum + (p.points || 0), 0);
      totalPoints = Math.max(totalPoints, computedPoints);
    }

    if (user.solvedCount !== solvedCount || user.totalPoints !== totalPoints) {
      await User.findByIdAndUpdate(user._id, { solvedCount, totalPoints });
    }

    const historyDocs = await RatingHistory.find({ userId: user._id }).sort({ recordedAt: 1 }).lean();
    const history = historyDocs.map((h) => ({
      rating: h.rating,
      date: new Date(h.recordedAt).toISOString(),
    }));

    res.json({
      id:          user._id,
      username:    user.username,
      email:       user.email,
      role:        user.role,
      totalPoints,
      streakDays:  user.streakDays,
      solvedCount,
      ratingHistory: history,
    });
  } catch (err) {
    console.error('Fetch profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router;
