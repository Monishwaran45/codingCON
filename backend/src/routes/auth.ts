import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { User, IUser } from '../db/models/User';
import { Role } from '../db/models/Role';
import { RatingHistory } from '../db/models/RatingHistory';
import { signToken, requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// ── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, username, password } = req.body as {
      email: string; username: string; password: string;
    };

    if (!email || !username || !password) {
      res.status(400).json({ error: 'email, username and password are required' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const safeRole = 'student';

    const existing = await User.findOne({
      $or: [
        { email: email.toLowerCase().trim() },
        { username: username.trim() },
      ],
    });

    if (existing) {
      res.status(409).json({ error: 'Email or username already taken' });
      return;
    }

    const id = uuid();
    const hash = bcrypt.hashSync(password, 10);

    const user = await User.create({
      _id: id,
      username: username.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: hash,
      role: safeRole,
    });

    const token = signToken({ id: user._id, email: user.email, role: user.role });
    res.cookie('token', token, cookieOpts()).status(201).json(await toPublicUser(user));
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'User registration failed' });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    if (!email || !password) {
      res.status(400).json({ error: 'email and password are required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = signToken({ id: user._id, email: user.email, role: user.role });
    const historyDocs = await RatingHistory.find({ userId: user._id }).sort({ recordedAt: 1 });
    const history = historyDocs.map((h) => ({ rating: h.rating, date: h.recordedAt.toISOString() }));

    res.cookie('token', token, cookieOpts()).json({ ...(await toPublicUser(user)), ratingHistory: history });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ── POST /api/auth/logout ────────────────────────────────────────────────────
router.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie('token').json({ ok: true });
});

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const historyDocs = await RatingHistory.find({ userId: user._id }).sort({ recordedAt: 1 });
    const history = historyDocs.map((h) => ({ rating: h.rating, date: h.recordedAt.toISOString() }));

    res.json({ ...(await toPublicUser(user)), ratingHistory: history });
  } catch (err) {
    console.error('Auth /me error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
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

async function toPublicUser(u: IUser) {
  const roleDoc = await Role.findOne({ name: u.role });
  const { Submission } = await import('../db/models/Submission');
  const { Problem } = await import('../db/models/Problem');

  const acSubmissions = await Submission.find({ userId: u._id, verdict: 'AC' }).select('problemId');
  const solvedProblemIds = Array.from(new Set(acSubmissions.map((s) => s.problemId)));
  const solvedCount = Math.max(u.solvedCount || 0, solvedProblemIds.length);

  let totalPoints = u.totalPoints || 0;
  if (solvedProblemIds.length > 0) {
    const solvedProblems = await Problem.find({ _id: { $in: solvedProblemIds } }).select('points');
    const computedPoints = solvedProblems.reduce((sum, p) => sum + (p.points || 0), 0);
    totalPoints = Math.max(totalPoints, computedPoints);
  }

  if (u.solvedCount !== solvedCount || u.totalPoints !== totalPoints) {
    await User.findByIdAndUpdate(u._id, { solvedCount, totalPoints });
  }

  return {
    id:          u._id,
    username:    u.username,
    email:       u.email,
    role:        u.role,
    permissions: roleDoc?.permissions || [],
    totalPoints,
    streakDays:  u.streakDays,
    solvedCount,
    ratingHistory: [] as { rating: number; date: string }[],
  };
}

export default router;
