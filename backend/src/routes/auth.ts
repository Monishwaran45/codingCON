import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import db from '../db/database';
import { UserRow } from '../db/types';
import { signToken, requireAuth, AuthRequest } from '../middleware/auth';

// node:sqlite returns Record<string,unknown> — cast through unknown
function asUser(v: unknown) { return v as UserRow | undefined; }
function asUsers(v: unknown) { return v as { rating: number; date: string }[]; }

const router = Router();

// ── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', (req: Request, res: Response): void => {
  const { email, username, password, role } = req.body as {
    email: string; username: string; password: string; role?: string;
  };

  if (!email || !username || !password) {
    res.status(400).json({ error: 'email, username and password are required' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  const safeRole = ['student', 'admin', 'problem_setter'].includes(role ?? '')
    ? role! : 'student';

  const existing = db
    .prepare('SELECT id FROM users WHERE email = ? OR username = ?')
    .get(email.toLowerCase(), username);
  if (existing) {
    res.status(409).json({ error: 'Email or username already taken' });
    return;
  }

  const id   = uuid();
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(
    'INSERT INTO users (id,username,email,password_hash,role) VALUES (?,?,?,?,?)',
  ).run(id, username.trim(), email.toLowerCase().trim(), hash, safeRole);

  const user = asUser(db.prepare('SELECT * FROM users WHERE id = ?').get(id));
  if (!user) { res.status(500).json({ error: 'User creation failed' }); return; }

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  res.cookie('token', token, cookieOpts()).status(201).json(toPublicUser(user));
});

// ── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', (req: Request, res: Response): void => {
  const { email, password } = req.body as { email: string; password: string };

  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  const user = asUser(
    db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim()),
  );
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const token   = signToken({ id: user.id, email: user.email, role: user.role });
  const history = asUsers(
    db.prepare(
      'SELECT rating, recorded_at as date FROM rating_history WHERE user_id = ? ORDER BY recorded_at ASC',
    ).all(user.id),
  );

  res.cookie('token', token, cookieOpts()).json({ ...toPublicUser(user), ratingHistory: history });
});

// ── POST /api/auth/logout ────────────────────────────────────────────────────
router.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie('token').json({ ok: true });
});

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', requireAuth, (req: AuthRequest, res: Response): void => {
  const user = asUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id));
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }

  const history = asUsers(
    db.prepare(
      'SELECT rating, recorded_at as date FROM rating_history WHERE user_id = ? ORDER BY recorded_at ASC',
    ).all(user.id),
  );
  res.json({ ...toPublicUser(user), ratingHistory: history });
});

// ── helpers ───────────────────────────────────────────────────────────────────
function cookieOpts() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

function toPublicUser(u: UserRow) {
  return {
    id:          u.id,
    username:    u.username,
    email:       u.email,
    role:        u.role,
    rating:      u.rating,
    maxRating:   u.max_rating,
    streakDays:  u.streak_days,
    solvedCount: u.solved_count,
    ratingHistory: [] as { rating: number; date: string }[],
  };
}

export default router;
