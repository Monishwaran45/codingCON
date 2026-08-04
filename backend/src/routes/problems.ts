import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db/database';
import { ProblemRow, TestCaseRow } from '../db/types';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';

function asProblem(v: unknown)     { return v as ProblemRow | undefined; }
function asProblems(v: unknown)    { return v as ProblemRow[]; }
function asTestCases(v: unknown)   { return v as TestCaseRow[]; }
function asSubmission(v: unknown)  {
  return v as { verdict: string; created_at: string } | undefined;
}

const router = Router();

// ── helpers ───────────────────────────────────────────────────────────────────
function hydrateProblem(row: ProblemRow, userId?: string) {
  const testCases = asTestCases(
    db.prepare('SELECT * FROM test_cases WHERE problem_id = ? ORDER BY sort_order ASC').all(row.id),
  );

  let isSolved = false;
  let isAttempted = false;
  let lastAttemptedAt: string | undefined;

  if (userId) {
    const latest = asSubmission(db.prepare(`
      SELECT verdict, created_at FROM submissions
      WHERE problem_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 1
    `).get(row.id, userId));
    if (latest) {
      isAttempted = true;
      lastAttemptedAt = latest.created_at;
      isSolved = latest.verdict === 'AC';
    }
  }

  return {
    id:               row.id,
    title:            row.title,
    slug:             row.slug,
    difficulty:       row.difficulty,
    points:           row.points,
    timeLimitMs:      row.time_limit_ms,
    memoryLimitMb:    row.memory_limit_mb,
    acceptanceRate:   row.acceptance_rate,
    totalSubmissions: row.total_submissions,
    description:      row.description,
    inputFormat:      row.input_format,
    outputFormat:     row.output_format,
    tags:             JSON.parse(row.tags) as string[],
    isSolved,
    isAttempted,
    lastAttemptedAt,
    sampleTestCases: testCases
      .filter((t) => t.is_sample === 1)
      .map((t) => ({ id: t.id, input: t.input, expectedOutput: t.expected_output, isSample: true })),
  };
}

// ── GET /api/problems ─────────────────────────────────────────────────────────
router.get('/', requireAuth, (req: AuthRequest, res: Response): void => {
  const { difficulty, tag, q } = req.query as { difficulty?: string; tag?: string; q?: string };

  let sql = 'SELECT * FROM problems WHERE is_active = 1';
  const params: (string | number)[] = [];
  if (difficulty) { sql += ' AND difficulty = ?'; params.push(difficulty); }

  let problems = asProblems(db.prepare(sql).all(...params)).map((r) =>
    hydrateProblem(r, req.user!.id),
  );

  if (tag) {
    const lt = tag.toLowerCase();
    problems = problems.filter((p) => p.tags.some((t) => t.toLowerCase() === lt));
  }
  if (q) {
    const lq = q.toLowerCase();
    problems = problems.filter(
      (p) => p.title.toLowerCase().includes(lq) || p.tags.some((t) => t.toLowerCase().includes(lq)),
    );
  }

  res.json(problems);
});

// ── GET /api/problems/:id ─────────────────────────────────────────────────────
router.get('/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  const row = asProblem(
    db.prepare('SELECT * FROM problems WHERE (id = ? OR slug = ?) AND is_active = 1')
      .get(req.params.id, req.params.id),
  );
  if (!row) { res.status(404).json({ error: 'Problem not found' }); return; }
  res.json(hydrateProblem(row, req.user!.id));
});

// ── POST /api/problems ────────────────────────────────────────────────────────
router.post('/', requireAuth, requireRole('admin', 'problem_setter'), (req: AuthRequest, res: Response): void => {
  const {
    title, difficulty, points, timeLimitMs, memoryLimitMb,
    description, inputFormat, outputFormat, tags, sampleTestCases,
  } = req.body as {
    title: string; difficulty: string; points: number;
    timeLimitMs: number; memoryLimitMb: number;
    description: string; inputFormat: string; outputFormat: string;
    tags: string[];
    sampleTestCases: { input: string; expectedOutput: string; isSample: boolean }[];
  };

  if (!title || !difficulty || !description) {
    res.status(400).json({ error: 'title, difficulty and description are required' });
    return;
  }

  const id   = uuid();
  const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  db.prepare(`
    INSERT INTO problems
      (id,title,slug,difficulty,points,time_limit_ms,memory_limit_mb,
       description,input_format,output_format,tags,created_by)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    id, title.trim(), slug, difficulty,
    points ?? 100, timeLimitMs ?? 1000, memoryLimitMb ?? 256,
    description, inputFormat ?? '', outputFormat ?? '',
    JSON.stringify(tags ?? []), req.user!.id,
  );

  let order = 0;
  for (const tc of sampleTestCases ?? []) {
    db.prepare(
      'INSERT INTO test_cases (id,problem_id,input,expected_output,is_sample,sort_order) VALUES (?,?,?,?,?,?)',
    ).run(uuid(), id, tc.input, tc.expectedOutput, tc.isSample ? 1 : 0, order++);
  }

  const row = asProblem(db.prepare('SELECT * FROM problems WHERE id = ?').get(id));
  if (!row) { res.status(500).json({ error: 'Problem creation failed' }); return; }
  res.status(201).json(hydrateProblem(row, req.user!.id));
});

// ── PATCH /api/problems/:id ───────────────────────────────────────────────────
router.patch('/:id', requireAuth, requireRole('admin', 'problem_setter'), (req: AuthRequest, res: Response): void => {
  const row = asProblem(db.prepare('SELECT * FROM problems WHERE id = ?').get(req.params.id));
  if (!row) { res.status(404).json({ error: 'Problem not found' }); return; }

  const fields: string[] = [];
  const vals: (string | number)[] = [];
  const allowed: [string, string][] = [
    ['title', 'title'], ['difficulty', 'difficulty'], ['points', 'points'],
    ['timeLimitMs', 'time_limit_ms'], ['memoryLimitMb', 'memory_limit_mb'],
    ['description', 'description'], ['inputFormat', 'input_format'], ['outputFormat', 'output_format'],
  ];
  for (const [k, col] of allowed) {
    if (req.body[k] !== undefined) { fields.push(`${col} = ?`); vals.push(req.body[k] as string | number); }
  }
  if (req.body.tags !== undefined) { fields.push('tags = ?'); vals.push(JSON.stringify(req.body.tags)); }
  if (fields.length === 0) { res.status(400).json({ error: 'Nothing to update' }); return; }

  vals.push(req.params.id);
  db.prepare(`UPDATE problems SET ${fields.join(', ')} WHERE id = ?`).run(...vals);

  const updated = asProblem(db.prepare('SELECT * FROM problems WHERE id = ?').get(req.params.id));
  if (!updated) { res.status(500).json({ error: 'Update failed' }); return; }
  res.json(hydrateProblem(updated, req.user!.id));
});

// ── DELETE /api/problems/:id ──────────────────────────────────────────────────
router.delete('/:id', requireAuth, requireRole('admin', 'problem_setter'), (req: AuthRequest, res: Response): void => {
  const row = asProblem(db.prepare('SELECT id FROM problems WHERE id = ?').get(req.params.id));
  if (!row) { res.status(404).json({ error: 'Problem not found' }); return; }
  db.prepare('UPDATE problems SET is_active = 0 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
