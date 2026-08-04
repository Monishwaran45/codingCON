import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db/database';
import { ContestRow, AnnouncementRow, ProblemRow, TestCaseRow } from '../db/types';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';

function asContest(v: unknown)       { return v as ContestRow | undefined; }
function asProblems(v: unknown)      { return v as ProblemRow[]; }
function asAnnouncements(v: unknown) { return v as AnnouncementRow[]; }
function asTestCases(v: unknown)     { return v as TestCaseRow[]; }
function asPoints(v: unknown)        { return v as { points: number } | undefined; }
function asTotal(v: unknown)         { return v as { total: number }; }
function asSeen(v: unknown)          { return v as unknown; }

const router = Router();

// ── helper ────────────────────────────────────────────────────────────────────
function hydrateContest(row: ContestRow) {
  const problems      = asProblems(db.prepare(`
    SELECT p.* FROM problems p
    JOIN contest_problems cp ON cp.problem_id = p.id
    WHERE cp.contest_id = ? ORDER BY cp.sort_order ASC
  `).all(row.id));

  const announcements = asAnnouncements(db.prepare(
    'SELECT * FROM announcements WHERE contest_id = ? ORDER BY timestamp ASC',
  ).all(row.id));

  return {
    id:                         row.id,
    title:                      row.title,
    startTime:                  row.start_time,
    endTime:                    row.end_time,
    durationMinutes:            row.duration_minutes,
    participantCount:           row.participant_count,
    maxScore:                   row.max_score,
    isLeaderboardFrozen:        row.is_leaderboard_frozen === 1,
    freezeTimeRemainingMinutes: row.freeze_time_remaining_minutes,
    problems: problems.map((p) => {
      const tcs = asTestCases(db.prepare(
        'SELECT * FROM test_cases WHERE problem_id = ? AND is_sample = 1 ORDER BY sort_order',
      ).all(p.id));
      return {
        id: p.id, title: p.title, slug: p.slug, difficulty: p.difficulty,
        points: p.points, timeLimitMs: p.time_limit_ms, memoryLimitMb: p.memory_limit_mb,
        acceptanceRate: p.acceptance_rate, totalSubmissions: p.total_submissions,
        description: p.description, inputFormat: p.input_format, outputFormat: p.output_format,
        tags: JSON.parse(p.tags) as string[],
        sampleTestCases: tcs.map((t) => ({
          id: t.id, input: t.input, expectedOutput: t.expected_output, isSample: true,
        })),
      };
    }),
    announcements: announcements.map((a) => ({ id: a.id, message: a.message, timestamp: a.timestamp })),
  };
}

// ── GET /api/contest/active ───────────────────────────────────────────────────
router.get('/active', requireAuth, (_req: AuthRequest, res: Response): void => {
  const row = asContest(db.prepare(
    "SELECT * FROM contests WHERE start_time <= datetime('now') ORDER BY start_time DESC LIMIT 1",
  ).get());
  if (!row) { res.status(404).json({ error: 'No active contest' }); return; }
  res.json(hydrateContest(row));
});

// ── GET /api/contest/:id ──────────────────────────────────────────────────────
router.get('/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  const row = asContest(db.prepare('SELECT * FROM contests WHERE id = ?').get(req.params.id));
  if (!row) { res.status(404).json({ error: 'Contest not found' }); return; }

  // Register participant if first visit (student only)
  if (req.user!.role === 'student') {
    const seen = asSeen(db.prepare(
      'SELECT 1 FROM leaderboard WHERE contest_id = ? AND user_id = ?',
    ).get(row.id, req.user!.id));
    if (!seen) {
      db.prepare(`
        INSERT OR IGNORE INTO leaderboard
          (contest_id,user_id,username,solved_count,total_score,penalty_time_minutes,problem_breakdown)
        VALUES (?,?,?,0,0,0,'{}')
      `).run(row.id, req.user!.id, req.user!.username);
      db.prepare('UPDATE contests SET participant_count = participant_count + 1 WHERE id = ?').run(row.id);
    }
  }

  res.json(hydrateContest(row));
});

// ── POST /api/contest ─────────────────────────────────────────────────────────
router.post('/', requireAuth, requireRole('admin', 'problem_setter'), (req: AuthRequest, res: Response): void => {
  const { title, startTime, endTime, durationMinutes, problemIds } = req.body as {
    title: string; startTime: string; endTime: string;
    durationMinutes?: number; problemIds?: string[];
  };
  if (!title || !startTime || !endTime) {
    res.status(400).json({ error: 'title, startTime and endTime are required' });
    return;
  }

  const id = uuid();
  db.prepare(
    'INSERT INTO contests (id,title,start_time,end_time,duration_minutes,created_by) VALUES (?,?,?,?,?,?)',
  ).run(id, title.trim(), startTime, endTime, durationMinutes ?? 120, req.user!.id);

  let maxScore = 0;
  for (const [i, pid] of (problemIds ?? []).entries()) {
    db.prepare('INSERT INTO contest_problems (contest_id,problem_id,sort_order) VALUES (?,?,?)').run(id, pid, i);
    const p = asPoints(db.prepare('SELECT points FROM problems WHERE id = ?').get(pid));
    if (p) maxScore += p.points;
  }
  db.prepare('UPDATE contests SET max_score = ? WHERE id = ?').run(maxScore, id);

  const row = asContest(db.prepare('SELECT * FROM contests WHERE id = ?').get(id));
  if (!row) { res.status(500).json({ error: 'Contest creation failed' }); return; }
  res.status(201).json(hydrateContest(row));
});

// ── POST /api/contest/:id/announcements ───────────────────────────────────────
router.post('/:id/announcements', requireAuth, requireRole('admin', 'problem_setter'), (req: AuthRequest, res: Response): void => {
  const { message } = req.body as { message: string };
  if (!message?.trim()) { res.status(400).json({ error: 'message is required' }); return; }

  const contest = asContest(db.prepare('SELECT id FROM contests WHERE id = ?').get(req.params.id));
  if (!contest) { res.status(404).json({ error: 'Contest not found' }); return; }

  const id        = uuid();
  const timestamp = new Date().toISOString();
  db.prepare('INSERT INTO announcements (id,contest_id,message,created_by,timestamp) VALUES (?,?,?,?,?)')
    .run(id, req.params.id, message.trim(), req.user!.id, timestamp);

  const ann = { id, message: message.trim(), timestamp };

  // Lazy-require to avoid circular import
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getIO } = require('../socket/gateway') as typeof import('../socket/gateway');
  getIO()?.to(`contest:${req.params.id}`).emit('announcement', ann);

  res.status(201).json(ann);
});

// ── PATCH /api/contest/:id/freeze ─────────────────────────────────────────────
router.patch('/:id/freeze', requireAuth, requireRole('admin'), (req: AuthRequest, res: Response): void => {
  const { frozen } = req.body as { frozen: boolean };
  db.prepare('UPDATE contests SET is_leaderboard_frozen = ? WHERE id = ?').run(frozen ? 1 : 0, req.params.id);
  res.json({ ok: true, frozen });
});

export default router;
