/**
 * Seed script — populates the DB with demo problems, one contest, and default
 * accounts. Run once with: npm run seed
 */
import dotenv from 'dotenv';
dotenv.config();

import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';
import db, { initSchema } from '../src/db/database';

initSchema();

// ── helpers ──────────────────────────────────────────────────────────────────
function insertUser(
  email: string,
  username: string,
  password: string,
  role: string,
  rating = 1500,
): string {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: string } | undefined;
  if (existing) return existing.id;
  const id = uuid();
  db.prepare(
    'INSERT INTO users (id,username,email,password_hash,role,rating,max_rating) VALUES (?,?,?,?,?,?,?)',
  ).run(id, username, email, bcrypt.hashSync(password, 10), role, rating, rating);
  console.log(`  ✓ user  ${email}  [${role}]`);
  return id;
}

function insertProblem(
  p: {
    title: string; slug: string; difficulty: string; points: number;
    timeLimitMs: number; memoryLimitMb: number;
    description: string; inputFormat: string; outputFormat: string;
    tags: string[];
    sampleCases: { input: string; expected: string }[];
    hiddenCases?: { input: string; expected: string }[];
  },
  createdBy: string,
): string {
  const existing = db.prepare('SELECT id FROM problems WHERE slug = ?').get(p.slug) as { id: string } | undefined;
  if (existing) return existing.id;

  const id = uuid();
  db.prepare(
    `INSERT INTO problems
      (id,title,slug,difficulty,points,time_limit_ms,memory_limit_mb,
       description,input_format,output_format,tags,created_by)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
  ).run(
    id, p.title, p.slug, p.difficulty, p.points,
    p.timeLimitMs, p.memoryLimitMb,
    p.description, p.inputFormat, p.outputFormat,
    JSON.stringify(p.tags), createdBy,
  );

  let order = 0;
  for (const tc of p.sampleCases) {
    db.prepare(
      'INSERT INTO test_cases (id,problem_id,input,expected_output,is_sample,sort_order) VALUES (?,?,?,?,1,?)',
    ).run(uuid(), id, tc.input, tc.expected, order++);
  }
  for (const tc of p.hiddenCases ?? []) {
    db.prepare(
      'INSERT INTO test_cases (id,problem_id,input,expected_output,is_sample,sort_order) VALUES (?,?,?,?,0,?)',
    ).run(uuid(), id, tc.input, tc.expected, order++);
  }
  console.log(`  ✓ problem  "${p.title}"`);
  return id;
}

// ── Users ─────────────────────────────────────────────────────────────────────
console.log('\n── Seeding users …');
const adminId   = insertUser('admin@cit.edu',    'Admin',       'admin123',   'admin',          0);
const _faculty  = insertUser('faculty@cit.edu',  'Faculty',     'faculty123', 'problem_setter', 0);
const _student  = insertUser('student@cit.edu',  'TestStudent', 'student123', 'student',       1500);
void _faculty; void _student;

// ── Problems ──────────────────────────────────────────────────────────────────
console.log('\n── Seeding problems …');

const p1 = insertProblem({
  title: 'Two Sum', slug: 'two-sum', difficulty: 'easy',
  points: 100, timeLimitMs: 1000, memoryLimitMb: 256,
  description:
    'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
  inputFormat:  'First line: integer N\nSecond line: N space-separated integers\nThird line: integer target',
  outputFormat: 'Two space-separated indices i and j (0-indexed) such that nums[i]+nums[j]==target',
  tags: ['Arrays', 'Hash Map'],
  sampleCases: [
    { input: '4\n2 7 11 15\n9', expected: '0 1' },
    { input: '3\n3 2 4\n6',      expected: '1 2' },
  ],
  hiddenCases: [
    { input: '2\n3 3\n6',        expected: '0 1' },
    { input: '5\n1 2 3 4 5\n9',  expected: '3 4' },
    { input: '4\n0 4 3 0\n0',    expected: '0 3' },
  ],
}, adminId);

const p2 = insertProblem({
  title: 'Valid Parentheses', slug: 'valid-parentheses', difficulty: 'easy',
  points: 100, timeLimitMs: 1000, memoryLimitMb: 256,
  description:
    "Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.\n\nAn input string is valid if:\n- Open brackets must be closed by the same type of brackets.\n- Open brackets must be closed in the correct order.",
  inputFormat:  'A single line string s (1 ≤ |s| ≤ 10^4)',
  outputFormat: 'Print "true" if valid, "false" otherwise',
  tags: ['Strings', 'Stack'],
  sampleCases: [
    { input: '()',       expected: 'true'  },
    { input: '()[]{} ', expected: 'true'  },
    { input: '(]',      expected: 'false' },
  ],
  hiddenCases: [
    { input: '{[]}',    expected: 'true'  },
    { input: '([)]',    expected: 'false' },
    { input: '',        expected: 'true'  },
  ],
}, adminId);

const p3 = insertProblem({
  title: 'Binary Search', slug: 'binary-search', difficulty: 'easy',
  points: 100, timeLimitMs: 2000, memoryLimitMb: 256,
  description:
    'Given a sorted array of integers `nums` and a target integer, return the index of target. If not found, return -1. You must achieve O(log n) time complexity.',
  inputFormat:  'First line: integer N\nSecond line: N sorted space-separated integers\nThird line: integer target',
  outputFormat: 'Index of target, or -1 if not found',
  tags: ['Arrays', 'Searching'],
  sampleCases: [
    { input: '6\n-1 0 3 5 9 12\n9',  expected: '4'  },
    { input: '6\n-1 0 3 5 9 12\n2',  expected: '-1' },
  ],
  hiddenCases: [
    { input: '1\n5\n5',               expected: '0'  },
    { input: '4\n1 2 3 4\n1',         expected: '0'  },
    { input: '4\n1 2 3 4\n4',         expected: '3'  },
  ],
}, adminId);

const p4 = insertProblem({
  title: 'Maximum Subarray', slug: 'maximum-subarray', difficulty: 'medium',
  points: 200, timeLimitMs: 1000, memoryLimitMb: 256,
  description:
    "Given an integer array `nums`, find the contiguous subarray with the largest sum and return its sum (Kadane's algorithm).",
  inputFormat:  'First line: integer N\nSecond line: N space-separated integers (may be negative)',
  outputFormat: 'Integer — the maximum subarray sum',
  tags: ['Arrays', 'Dynamic Programming'],
  sampleCases: [
    { input: '9\n-2 1 -3 4 -1 2 1 -5 4', expected: '6'  },
    { input: '1\n1',                       expected: '1'  },
    { input: '5\n5 4 -1 7 8',             expected: '23' },
  ],
  hiddenCases: [
    { input: '3\n-3 -2 -1',               expected: '-1' },
    { input: '6\n1 2 3 4 5 6',            expected: '21' },
  ],
}, adminId);

insertProblem({
  title: 'Longest Common Subsequence', slug: 'longest-common-subsequence',
  difficulty: 'medium', points: 200, timeLimitMs: 2000, memoryLimitMb: 256,
  description:
    'Given two strings `text1` and `text2`, return the length of their longest common subsequence. If there is no common subsequence, return 0.',
  inputFormat:  'First line: string text1\nSecond line: string text2',
  outputFormat: 'Integer — length of LCS',
  tags: ['Dynamic Programming', 'Strings'],
  sampleCases: [
    { input: 'abcde\nace', expected: '3' },
    { input: 'abc\nabc',   expected: '3' },
    { input: 'abc\ndef',   expected: '0' },
  ],
  hiddenCases: [
    { input: 'bl\nybyml',              expected: '2' },
    { input: 'hofubmnylkra\nzetrgyopvq', expected: '2' },
  ],
}, adminId);

insertProblem({
  title: 'Merge K Sorted Lists', slug: 'merge-k-sorted-lists',
  difficulty: 'hard', points: 300, timeLimitMs: 2000, memoryLimitMb: 512,
  description:
    'You are given k sorted arrays. Merge them into one sorted array.\n\nRepresent each list as a space-separated sequence of integers on one line.',
  inputFormat:  'First line: integer k\nNext k lines: each line is a sorted space-separated sequence',
  outputFormat: 'Single line of space-separated integers — the merged sorted list',
  tags: ['Sorting', 'Priority Queue'],
  sampleCases: [
    { input: '3\n1 4 5\n1 3 4\n2 6', expected: '1 1 2 3 4 4 5 6' },
    { input: '1\n1 2 3',              expected: '1 2 3'            },
  ],
  hiddenCases: [
    { input: '2\n1 3 5\n2 4 6', expected: '1 2 3 4 5 6' },
    { input: '3\n1\n2\n3',      expected: '1 2 3'        },
  ],
}, adminId);

// ── Contest ───────────────────────────────────────────────────────────────────
console.log('\n── Seeding contest …');
const existingContest = db.prepare("SELECT id FROM contests WHERE id = 'c88'").get();
if (!existingContest) {
  const now   = new Date();
  const start = new Date(now.getTime() - 30 * 60 * 1000);
  const end   = new Date(now.getTime() + 90 * 60 * 1000);

  db.prepare(
    'INSERT INTO contests (id,title,start_time,end_time,duration_minutes,created_by) VALUES (?,?,?,?,120,?)',
  ).run('c88', 'CIT Coding Assessment — Session 1', start.toISOString(), end.toISOString(), adminId);

  for (const [i, pid] of [p1, p2, p3, p4].entries()) {
    db.prepare('INSERT INTO contest_problems (contest_id,problem_id,sort_order) VALUES (?,?,?)').run('c88', pid, i);
  }

  const totRow = db.prepare(`
    SELECT COALESCE(SUM(p.points),0) AS total
    FROM contest_problems cp JOIN problems p ON p.id = cp.problem_id
    WHERE cp.contest_id = 'c88'
  `).get() as { total: number };
  db.prepare('UPDATE contests SET max_score = ? WHERE id = ?').run(totRow.total, 'c88');

  db.prepare('INSERT INTO announcements (id,contest_id,message,timestamp) VALUES (?,?,?,?)').run(
    uuid(), 'c88',
    'Welcome to Session 1. You have 120 minutes. Good luck to all participants.',
    new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
  );
  db.prepare('INSERT INTO announcements (id,contest_id,message,timestamp) VALUES (?,?,?,?)').run(
    uuid(), 'c88',
    'Clarification on Binary Search: the input array is guaranteed to be sorted in strictly ascending order.',
    new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
  );

  console.log('  ✓ contest  c88');
} else {
  console.log('  – contest c88 already exists, skipping');
}

console.log('\n✅  Seed complete.\n');
console.log('  Default accounts:');
console.log('    admin@cit.edu     / admin123');
console.log('    faculty@cit.edu   / faculty123');
console.log('    student@cit.edu   / student123\n');
