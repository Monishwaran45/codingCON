/**
 * Database module — uses Node 24's built-in node:sqlite (no native install).
 * The API is synchronous and nearly identical to better-sqlite3.
 */
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const DB_PATH = process.env.DB_PATH || './data/codingcon.db';
const resolvedPath = path.resolve(DB_PATH);

// Ensure data directory exists
const dir = path.dirname(resolvedPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new DatabaseSync(resolvedPath);

// Enable WAL mode + foreign keys
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

export function initSchema(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id              TEXT PRIMARY KEY,
      username        TEXT NOT NULL UNIQUE,
      email           TEXT NOT NULL UNIQUE,
      password_hash   TEXT NOT NULL,
      role            TEXT NOT NULL DEFAULT 'student'
                        CHECK(role IN ('student','admin','problem_setter')),
      rating          INTEGER NOT NULL DEFAULT 1500,
      max_rating      INTEGER NOT NULL DEFAULT 1500,
      streak_days     INTEGER NOT NULL DEFAULT 0,
      solved_count    INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS rating_history (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rating      INTEGER NOT NULL,
      contest_id  TEXT,
      recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS problems (
      id                TEXT PRIMARY KEY,
      title             TEXT NOT NULL,
      slug              TEXT NOT NULL UNIQUE,
      difficulty        TEXT NOT NULL CHECK(difficulty IN ('easy','medium','hard')),
      points            INTEGER NOT NULL DEFAULT 100,
      time_limit_ms     INTEGER NOT NULL DEFAULT 1000,
      memory_limit_mb   INTEGER NOT NULL DEFAULT 256,
      acceptance_rate   REAL NOT NULL DEFAULT 0,
      total_submissions INTEGER NOT NULL DEFAULT 0,
      description       TEXT NOT NULL DEFAULT '',
      input_format      TEXT NOT NULL DEFAULT '',
      output_format     TEXT NOT NULL DEFAULT '',
      tags              TEXT NOT NULL DEFAULT '[]',
      is_active         INTEGER NOT NULL DEFAULT 1,
      created_by        TEXT REFERENCES users(id),
      created_at        TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS test_cases (
      id              TEXT PRIMARY KEY,
      problem_id      TEXT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
      input           TEXT NOT NULL,
      expected_output TEXT NOT NULL,
      is_sample       INTEGER NOT NULL DEFAULT 0,
      sort_order      INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS contests (
      id                            TEXT PRIMARY KEY,
      title                         TEXT NOT NULL,
      start_time                    TEXT NOT NULL,
      end_time                      TEXT NOT NULL,
      duration_minutes              INTEGER NOT NULL DEFAULT 120,
      participant_count             INTEGER NOT NULL DEFAULT 0,
      max_score                     INTEGER NOT NULL DEFAULT 0,
      is_leaderboard_frozen         INTEGER NOT NULL DEFAULT 0,
      freeze_time_remaining_minutes INTEGER,
      created_by                    TEXT REFERENCES users(id),
      created_at                    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contest_problems (
      contest_id TEXT NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
      problem_id TEXT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (contest_id, problem_id)
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id          TEXT PRIMARY KEY,
      contest_id  TEXT NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
      message     TEXT NOT NULL,
      created_by  TEXT REFERENCES users(id),
      timestamp   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id                TEXT PRIMARY KEY,
      problem_id        TEXT NOT NULL REFERENCES problems(id),
      user_id           TEXT NOT NULL REFERENCES users(id),
      contest_id        TEXT REFERENCES contests(id),
      language          TEXT NOT NULL,
      code              TEXT NOT NULL,
      verdict           TEXT NOT NULL DEFAULT 'pending'
                          CHECK(verdict IN ('pending','running','AC','WA','TLE','MLE','RE')),
      passed_test_cases INTEGER NOT NULL DEFAULT 0,
      total_test_cases  INTEGER NOT NULL DEFAULT 0,
      execution_time_ms INTEGER NOT NULL DEFAULT 0,
      memory_kb         INTEGER NOT NULL DEFAULT 0,
      is_submit         INTEGER NOT NULL DEFAULT 0,
      created_at        TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS submission_results (
      id                TEXT PRIMARY KEY,
      submission_id     TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
      test_case_id      TEXT NOT NULL,
      passed            INTEGER NOT NULL DEFAULT 0,
      actual_output     TEXT,
      execution_time_ms INTEGER,
      memory_kb         INTEGER,
      error             TEXT,
      sort_order        INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS leaderboard (
      contest_id            TEXT NOT NULL,
      user_id               TEXT NOT NULL REFERENCES users(id),
      username              TEXT NOT NULL,
      solved_count          INTEGER NOT NULL DEFAULT 0,
      total_score           INTEGER NOT NULL DEFAULT 0,
      penalty_time_minutes  INTEGER NOT NULL DEFAULT 0,
      problem_breakdown     TEXT NOT NULL DEFAULT '{}',
      last_updated          TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (contest_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_submissions_user    ON submissions(user_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_problem ON submissions(problem_id);
    CREATE INDEX IF NOT EXISTS idx_test_cases_problem  ON test_cases(problem_id);
    CREATE INDEX IF NOT EXISTS idx_leaderboard_contest ON leaderboard(contest_id, total_score);
  `);
}

export default db;
