import { Router, Response } from 'express';
import { User } from '../db/models/User';
import { RatingHistory } from '../db/models/RatingHistory';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// ── GET /api/profile ─────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const historyDocs = await RatingHistory.find({ userId: user._id }).sort({ recordedAt: 1 });
    const history = historyDocs.map((h) => ({
      rating: h.rating,
      date: h.recordedAt.toISOString(),
    }));

    res.json({
      id:          user._id,
      username:    user.username,
      email:       user.email,
      role:        user.role,
      totalPoints: user.totalPoints,
      streakDays:  user.streakDays,
      solvedCount: user.solvedCount,
      ratingHistory: history,
    });
  } catch (err) {
    console.error('Fetch profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router;
