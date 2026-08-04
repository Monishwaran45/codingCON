import { Router, Response } from 'express';
import db from '../db/database';
import { UserRow } from '../db/types';
import { requireAuth, AuthRequest } from '../middleware/auth';

function asUser(v: unknown) { return v as UserRow | undefined; }
function asHistory(v: unknown) { return v as { rating: number; date: string }[]; }

const router = Router();

// ── GET /api/profile ─────────────────────────────────────────────────────────
router.get('/', requireAuth, (req: AuthRequest, res: Response): void => {
  const user = asUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id));
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }

  const history = asHistory(
    db.prepare(
      'SELECT rating, recorded_at as date FROM rating_history WHERE user_id = ? ORDER BY recorded_at ASC',
    ).all(user.id),
  );

  res.json({
    id:          user.id,
    username:    user.username,
    email:       user.email,
    role:        user.role,
    rating:      user.rating,
    maxRating:   user.max_rating,
    streakDays:  user.streak_days,
    solvedCount: user.solved_count,
    ratingHistory: history,
  });
});

export default router;
