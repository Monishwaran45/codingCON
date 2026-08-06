/**
 * Seed script — populates MongoDB with demo problems, one contest, and default
 * accounts. Run with: npm run seed
 */
import dotenv from 'dotenv';
dotenv.config();

import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';
import { connectDB } from '../src/db/database';
import { User } from '../src/db/models/User';
import { Problem } from '../src/db/models/Problem';
import { Contest } from '../src/db/models/Contest';
import { Announcement } from '../src/db/models/Announcement';
import { Role } from '../src/db/models/Role';

async function seed() {
  await connectDB();

  // ── helpers ──────────────────────────────────────────────────────────────────
  async function insertUser(
    email: string,
    username: string,
    password: string,
    role: 'student' | 'admin' | 'problem_setter',
    rating = 1500,
  ): Promise<string> {
    const existing = await User.findOne({ email });
    if (existing) return existing._id;
    const id = uuid();
    await User.create({
      _id: id,
      username,
      email,
      passwordHash: bcrypt.hashSync(password, 10),
      role,
      rating,
      maxRating: rating,
    });
    console.log(`  ✓ user  ${email}  [${role}]`);
    return id;
  }

  async function insertProblem(
    p: {
      title: string; slug: string; difficulty: 'easy' | 'medium' | 'hard'; points: number;
      timeLimitMs: number; memoryLimitMb: number;
      description: string; inputFormat: string; outputFormat: string;
      tags: string[];
      sampleCases: { input: string; expected: string }[];
      hiddenCases?: { input: string; expected: string }[];
    },
    createdBy: string,
  ): Promise<string> {
    const existing = await Problem.findOne({ slug: p.slug });
    if (existing) return existing._id;

    const id = uuid();
    const testCases: { id: string; input: string; expectedOutput: string; isSample: boolean; sortOrder: number }[] = [];
    let order = 0;

    for (const tc of p.sampleCases) {
      testCases.push({
        id: uuid(),
        input: tc.input,
        expectedOutput: tc.expected,
        isSample: true,
        sortOrder: order++,
      });
    }
    for (const tc of p.hiddenCases ?? []) {
      testCases.push({
        id: uuid(),
        input: tc.input,
        expectedOutput: tc.expected,
        isSample: false,
        sortOrder: order++,
      });
    }

    await Problem.create({
      _id: id,
      title: p.title,
      slug: p.slug,
      difficulty: p.difficulty,
      points: p.points,
      timeLimitMs: p.timeLimitMs,
      memoryLimitMb: p.memoryLimitMb,
      description: p.description,
      inputFormat: p.inputFormat,
      outputFormat: p.outputFormat,
      tags: p.tags,
      createdBy,
      testCases,
    });

    console.log(`  ✓ problem  "${p.title}"`);
    return id;
  }

  // ── Roles ─────────────────────────────────────────────────────────────────────
  console.log('\n── Seeding roles …');
  await Role.deleteMany({});
  await Role.create({ name: 'student', permissions: ['solve_problems'] });
  await Role.create({ name: 'faculty', permissions: ['create_problem', 'view_reports'] });
  await Role.create({ name: 'admin', permissions: ['all'] });
  await Role.create({ name: 'problem_setter', permissions: ['create_problem'] });

  // ── Users ─────────────────────────────────────────────────────────────────────
  console.log('\n── Seeding users …');
  const adminId   = await insertUser('admin@cit.edu',    'Admin',       'admin123',   'admin',          0);
  const _faculty  = await insertUser('faculty@cit.edu',  'Faculty',     'faculty123', 'problem_setter', 0);
  const _student  = await insertUser('student@cit.edu',  'TestStudent', 'student123', 'student',       1500);
  void _faculty; void _student;

  // ── Problems ──────────────────────────────────────────────────────────────────
  console.log('\n── Seeding problems …');

  const p1 = await insertProblem({
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

  const p2 = await insertProblem({
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

  const p3 = await insertProblem({
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

  const p4 = await insertProblem({
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

  await insertProblem({
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

  await insertProblem({
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
  const existingContest = await Contest.findById('c88');
  if (!existingContest) {
    const now   = new Date();
    const start = new Date(now.getTime() - 30 * 60 * 1000);
    const end   = new Date(now.getTime() + 90 * 60 * 1000);

    const problemIds = [p1, p2, p3, p4];
    const problems = await Problem.find({ _id: { $in: problemIds } });
    const maxScore = problems.reduce((sum, p) => sum + (p.points || 0), 0);

    await Contest.create({
      _id: 'c88',
      title: 'CIT Coding Assessment — Session 1',
      startTime: start,
      endTime: end,
      durationMinutes: 120,
      maxScore,
      createdBy: adminId,
      problemIds,
    });

    await Announcement.create({
      _id: uuid(),
      contestId: 'c88',
      message: 'Welcome to Session 1. You have 120 minutes. Good luck to all participants.',
      timestamp: new Date(now.getTime() - 20 * 60 * 1000),
    });

    await Announcement.create({
      _id: uuid(),
      contestId: 'c88',
      message: 'Clarification on Binary Search: the input array is guaranteed to be sorted in strictly ascending order.',
      timestamp: new Date(now.getTime() - 5 * 60 * 1000),
    });

    console.log('  ✓ contest  c88');
  } else {
    console.log('  – contest c88 already exists, skipping');
  }

  console.log('\n✅  Seed complete.\n');
  console.log('  Default accounts:');
  console.log('    admin@cit.edu     / admin123');
  console.log('    faculty@cit.edu   / faculty123');
  console.log('    student@cit.edu   / student123\n');

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
