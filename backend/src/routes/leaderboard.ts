import { Router, Response } from 'express';
import db from '../db/database';
import { LeaderboardRow } from '../db/types';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';

function asLbRows(v: unknown) { return v as LeaderboardRow[]; }
function asContest(v: unknown) {
  return v as { start_time: string; is_leaderboard_frozen: number } | undefined;
}
function asCps(v: unknown)          { return v as { problem_id: string }[]; }
function asParticipants(v: unknown) { return v as { user_id: string; username: string }[]; }
function asSubs(v: unknown)         { return v as { verdict: string; created_at: string; is_submit: number }[]; }
function asProblem(v: unknown)      { return v as { points: number } | undefined; }

const router = Router();

// ── GET /api/leaderboard/:contestId ──────────────────────────────────────────
router.get('/:contestId', requireAuth, (req: AuthRequest, res: Response): void => {
  const rows = asLbRows(
    db.prepare(
      'SELECT * FROM leaderboard WHERE contest_id = ? ORDER BY total_score DESC, penalty_time_minutes ASC',
    ).all(req.params.contestId),
  );

  res.json(
    rows.map((r, idx) => ({
      rank:               idx + 1,
      userId:             r.user_id,
      username:           r.username,
      solvedCount:        r.solved_count,
      totalScore:         r.total_score,
      penaltyTimeMinutes: r.penalty_time_minutes,
      problemBreakdown:   JSON.parse(r.problem_breakdown) as Record<
        string,
        { score: number; attempted: boolean; solvedTime?: string }
      >,
    })),
  );
});

// ── POST /api/leaderboard/:contestId/recalculate  (admin only) ───────────────
router.post(
  '/:contestId/recalculate',
  requireAuth,
  requireRole('admin'),
  (req: AuthRequest, res: Response): void => {
    recalculateLeaderboard(req.params.contestId);
    res.json({ ok: true });
  },
);

// ── Exported helper — called by the judge after each AC submission ────────────
export function recalculateLeaderboard(contestId: string): void {
  const contest = asContest(
    db.prepare('SELECT start_time, is_leaderboard_frozen FROM contests WHERE id = ?').get(contestId),
  );
  if (!contest || contest.is_leaderboard_frozen) return;

  const contestStart = new Date(contest.start_time).getTime();
  const cps          = asCps(db.prepare(
    'SELECT problem_id FROM contest_problems WHERE contest_id = ? ORDER BY sort_order',
  ).all(contestId));
  const participants = asParticipants(db.prepare(
    'SELECT DISTINCT user_id, username FROM leaderboard WHERE contest_id = ?',
  ).all(contestId));

  for (const { user_id, username } of participants) {
    let totalScore   = 0;
    let totalPenalty = 0;
    let solvedCount  = 0;
    const breakdown: Record<string, { score: number; attempted: boolean; solvedTime?: string }> = {};

    for (const { problem_id } of cps) {
      const subs = asSubs(db.prepare(`
        SELECT verdict, created_at, is_submit FROM submissions
        WHERE user_id = ? AND problem_id = ? AND contest_id = ?
        ORDER BY created_at ASC
      `).all(user_id, problem_id, contestId));

      if (subs.length === 0) { breakdown[problem_id] = { score: 0, attempted: false }; continue; }

      breakdown[problem_id] = { score: 0, attempted: true };
      const acSub = subs.find((s) => s.verdict === 'AC' && s.is_submit === 1);
      if (!acSub) continue;

      const problem = asProblem(db.prepare('SELECT points FROM problems WHERE id = ?').get(problem_id));
      if (!problem) continue;

      const minutesSinceStart = Math.floor(
        (new Date(acSub.created_at).getTime() - contestStart) / 60000,
      );
      const wrongAttempts = subs.filter(
        (s) => s.verdict !== 'AC' && s.is_submit === 1 &&
               new Date(s.created_at) < new Date(acSub.created_at),
      ).length;

      breakdown[problem_id] = { score: problem.points, attempted: true, solvedTime: acSub.created_at };
      totalScore   += problem.points;
      totalPenalty += minutesSinceStart + wrongAttempts * 20;
      solvedCount++;
    }

    db.prepare(`
      INSERT INTO leaderboard
        (contest_id,user_id,username,solved_count,total_score,penalty_time_minutes,problem_breakdown,last_updated)
      VALUES (?,?,?,?,?,?,?,datetime('now'))
      ON CONFLICT(contest_id,user_id) DO UPDATE SET
        solved_count         = excluded.solved_count,
        total_score          = excluded.total_score,
        penalty_time_minutes = excluded.penalty_time_minutes,
        problem_breakdown    = excluded.problem_breakdown,
        last_updated         = excluded.last_updated
    `).run(contestId, user_id, username, solvedCount, totalScore, totalPenalty, JSON.stringify(breakdown));
  }
}

export default router;
