import { API_BASE_URL } from './constants';
import { Problem, Contest, LeaderboardEntry, User, Submission } from '@/types';

async function fetcher<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

// ─── Offline Demo Problems ────────────────────────────────────────────────────
// These are shown to students when the backend is offline. Admins can add real problems.
const DEMO_PROBLEMS: Problem[] = [
  {
    id: 'p-001',
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'easy',
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    acceptanceRate: 72,
    totalSubmissions: 8423,
    description:
      'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
    inputFormat:
      'First line: integer N (length of array)\nSecond line: N space-separated integers\nThird line: integer target',
    outputFormat: 'Two space-separated indices i and j such that nums[i] + nums[j] == target',
    sampleTestCases: [
      { id: 1, input: '4\n2 7 11 15\n9', expectedOutput: '0 1', isSample: true },
      { id: 2, input: '3\n3 2 4\n6', expectedOutput: '1 2', isSample: true },
    ],
    tags: ['Arrays', 'Hash Map'],
    isSolved: false,
    isAttempted: false,
  },
  {
    id: 'p-002',
    title: 'Valid Parentheses',
    slug: 'valid-parentheses',
    difficulty: 'easy',
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    acceptanceRate: 65,
    totalSubmissions: 6201,
    description:
      "Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.\n\nAn input string is valid if:\n- Open brackets must be closed by the same type of brackets.\n- Open brackets must be closed in the correct order.",
    inputFormat: 'A single line string s (1 ≤ |s| ≤ 10^4)',
    outputFormat: 'Print "true" if valid, "false" otherwise',
    sampleTestCases: [
      { id: 1, input: '()', expectedOutput: 'true', isSample: true },
      { id: 2, input: '()[]{} ', expectedOutput: 'true', isSample: true },
      { id: 3, input: '(]', expectedOutput: 'false', isSample: true },
    ],
    tags: ['Strings', 'Stack'],
    isSolved: false,
    isAttempted: false,
  },
  {
    id: 'p-003',
    title: 'Binary Search',
    slug: 'binary-search',
    difficulty: 'easy',
    points: 100,
    timeLimitMs: 500,
    memoryLimitMb: 256,
    acceptanceRate: 78,
    totalSubmissions: 5124,
    description:
      'Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`. If `target` exists, return its index. Otherwise, return -1.\n\nYou must write an algorithm with O(log n) runtime complexity.',
    inputFormat:
      'First line: integer N\nSecond line: N sorted space-separated integers\nThird line: integer target',
    outputFormat: 'Index of target, or -1 if not found',
    sampleTestCases: [
      { id: 1, input: '6\n-1 0 3 5 9 12\n9', expectedOutput: '4', isSample: true },
      { id: 2, input: '6\n-1 0 3 5 9 12\n2', expectedOutput: '-1', isSample: true },
    ],
    tags: ['Arrays', 'Searching'],
    isSolved: false,
    isAttempted: false,
  },
  {
    id: 'p-004',
    title: 'Longest Common Subsequence',
    slug: 'longest-common-subsequence',
    difficulty: 'medium',
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    acceptanceRate: 48,
    totalSubmissions: 3812,
    description:
      'Given two strings `text1` and `text2`, return the length of their longest common subsequence. If there is no common subsequence, return 0.\n\nA subsequence of a string is a new string generated from the original string with some characters (can be none) deleted without changing the relative order of the remaining characters.',
    inputFormat: 'First line: string text1\nSecond line: string text2',
    outputFormat: 'Integer — length of longest common subsequence',
    sampleTestCases: [
      { id: 1, input: 'abcde\nace', expectedOutput: '3', isSample: true },
      { id: 2, input: 'abc\nabc', expectedOutput: '3', isSample: true },
      { id: 3, input: 'abc\ndef', expectedOutput: '0', isSample: true },
    ],
    tags: ['Dynamic Programming', 'Strings'],
    isSolved: false,
    isAttempted: false,
  },
  {
    id: 'p-005',
    title: 'Merge K Sorted Lists',
    slug: 'merge-k-sorted-lists',
    difficulty: 'hard',
    points: 300,
    timeLimitMs: 2000,
    memoryLimitMb: 512,
    acceptanceRate: 32,
    totalSubmissions: 2198,
    description:
      'You are given an array of `k` linked-lists `lists`, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.\n\nFor this problem, represent each linked list as a space-separated sequence of integers on one line.',
    inputFormat: 'First line: integer k\nNext k lines: each line is a sorted space-separated sequence of integers representing a linked list',
    outputFormat: 'Single line of space-separated integers — the merged sorted list',
    sampleTestCases: [
      { id: 1, input: '3\n1 4 5\n1 3 4\n2 6', expectedOutput: '1 1 2 3 4 4 5 6', isSample: true },
      { id: 2, input: '0\n', expectedOutput: '', isSample: true },
    ],
    tags: ['Linked Lists', 'Sorting', 'Priority Queue'],
    isSolved: false,
    isAttempted: false,
  },
  {
    id: 'p-006',
    title: 'Maximum Subarray',
    slug: 'maximum-subarray',
    difficulty: 'medium',
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    acceptanceRate: 55,
    totalSubmissions: 4520,
    description:
      "Given an integer array `nums`, find the subarray with the largest sum, and return its sum.\n\nA subarray is a contiguous non-empty sequence of elements within an array.",
    inputFormat: 'First line: integer N\nSecond line: N space-separated integers (may include negatives)',
    outputFormat: 'Integer — the maximum subarray sum',
    sampleTestCases: [
      { id: 1, input: '9\n-2 1 -3 4 -1 2 1 -5 4', expectedOutput: '6', isSample: true },
      { id: 2, input: '1\n1', expectedOutput: '1', isSample: true },
      { id: 3, input: '5\n5 4 -1 7 8', expectedOutput: '23', isSample: true },
    ],
    tags: ['Arrays', 'Dynamic Programming'],
    isSolved: false,
    isAttempted: false,
  },
];

const DEMO_CONTEST: Contest = {
  id: 'c88',
  title: 'CIT Coding Assessment — Session 1',
  startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // started 30 min ago
  endTime: new Date(Date.now() + 90 * 60 * 1000).toISOString(), // ends in 90 min
  durationMinutes: 120,
  participantCount: 142,
  maxScore: 700,
  problems: DEMO_PROBLEMS.slice(0, 4),
  isLeaderboardFrozen: false,
  announcements: [
    {
      id: 'a1',
      timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      message: 'Welcome to Session 1. You have 120 minutes. Good luck to all participants.',
    },
    {
      id: 'a2',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      message: 'Clarification on Problem 3 (Binary Search): the input array is guaranteed to be sorted in strictly ascending order.',
    },
  ],
};

// ─── API client ───────────────────────────────────────────────────────────────

// Local in-memory store for admin-created problems
let localProblems: Problem[] = [...DEMO_PROBLEMS];
let localContest: Contest = { ...DEMO_CONTEST };

// Auto-archive: merge contest problems into the problem archive when contest ends
function getArchivedProblems(): Problem[] {
  const existing = new Set(localProblems.map((p) => p.id));
  const contestEnded = new Date(localContest.endTime) < new Date();

  if (contestEnded && localContest.problems) {
    const newProblems = localContest.problems.filter((p) => !existing.has(p.id));
    if (newProblems.length > 0) {
      localProblems = [...localProblems, ...newProblems];
    }
  }
  return localProblems;
}

export const api = {
  // Problems — includes auto-archived contest problems
  getProblems: async (): Promise<Problem[]> => {
    try {
      return await fetcher<Problem[]>('/problems');
    } catch {
      return getArchivedProblems();
    }
  },

  getProblemById: async (id: string): Promise<Problem | null> => {
    try {
      return await fetcher<Problem>(`/problems/${id}`);
    } catch {
      return localProblems.find((p) => p.id === id) || null;
    }
  },

  createProblem: async (problemData: Partial<Problem>): Promise<Problem> => {
    try {
      return await fetcher<Problem>('/problems', {
        method: 'POST',
        body: JSON.stringify(problemData),
      });
    } catch {
      const newProblem: Problem = {
        id: 'p-' + Math.random().toString(36).substring(2, 7),
        title: problemData.title || 'Untitled Problem',
        slug: (problemData.title || 'untitled').toLowerCase().replace(/\s+/g, '-'),
        difficulty: problemData.difficulty || 'medium',
        points: problemData.points || 100,
        timeLimitMs: problemData.timeLimitMs || 1000,
        memoryLimitMb: problemData.memoryLimitMb || 256,
        acceptanceRate: 0,
        totalSubmissions: 0,
        description: problemData.description || '',
        inputFormat: problemData.inputFormat || '',
        outputFormat: problemData.outputFormat || '',
        sampleTestCases: problemData.sampleTestCases || [],
        tags: problemData.tags || [],
        isSolved: false,
        isAttempted: false,
      };
      localProblems = [newProblem, ...localProblems];
      return newProblem;
    }
  },

  deleteProblem: async (id: string): Promise<void> => {
    try {
      await fetcher<void>(`/problems/${id}`, { method: 'DELETE' });
    } catch {
      localProblems = localProblems.filter((p) => p.id !== id);
    }
  },

  // Contest
  getContest: async (id: string): Promise<Contest | null> => {
    try {
      return await fetcher<Contest>(`/contest/${id}`);
    } catch {
      if (id === localContest.id) return localContest;
      return null;
    }
  },

  createContest: async (contestData: Partial<Contest>): Promise<Contest> => {
    try {
      return await fetcher<Contest>('/contest', {
        method: 'POST',
        body: JSON.stringify(contestData),
      });
    } catch {
      const newContest: Contest = {
        id: 'c-' + Math.random().toString(36).substring(2, 7),
        title: contestData.title || 'Untitled Contest',
        startTime: contestData.startTime || new Date().toISOString(),
        endTime: contestData.endTime || new Date(Date.now() + 120 * 60000).toISOString(),
        durationMinutes: contestData.durationMinutes || 120,
        participantCount: 0,
        maxScore: 0,
        problems: contestData.problems || [],
        announcements: [],
      };
      localContest = newContest;
      return newContest;
    }
  },

  postAnnouncement: async (contestId: string, message: string): Promise<void> => {
    try {
      await fetcher<void>(`/contest/${contestId}/announcements`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
    } catch {
      if (localContest.id === contestId) {
        localContest.announcements.push({
          id: 'a-' + Math.random().toString(36).substring(2, 7),
          timestamp: new Date().toISOString(),
          message,
        });
      }
    }
  },

  getLeaderboard: async (contestId: string): Promise<LeaderboardEntry[]> => {
    try {
      return await fetcher<LeaderboardEntry[]>(`/leaderboard/${contestId}`);
    } catch {
      return [];
    }
  },

  // Profile & Submissions
  getProfile: async (): Promise<User | null> => {
    try {
      return await fetcher<User>('/profile');
    } catch {
      return null;
    }
  },

  getSubmissions: async (): Promise<Submission[]> => {
    try {
      return await fetcher<Submission[]>('/submissions');
    } catch {
      return [];
    }
  },
};
