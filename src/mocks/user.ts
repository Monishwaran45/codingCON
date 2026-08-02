import { User, Submission } from '@/types';

export const MOCK_USER: User = {
  id: 'u3',
  username: 'Monishwaran45',
  email: 'monish@codingcon.dev',
  role: 'student',
  avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=Monishwaran45',
  rating: 2185,
  maxRating: 2240,
  streakDays: 14,
  solvedCount: 142,
  ratingHistory: [
    { date: '2026-01-01', rating: 1600 },
    { date: '2026-02-15', rating: 1750 },
    { date: '2026-03-30', rating: 1890 },
    { date: '2026-05-10', rating: 2010 },
    { date: '2026-06-20', rating: 2120 },
    { date: '2026-08-01', rating: 2185 }
  ]
};

export const MOCK_SUBMISSIONS: Submission[] = [
  {
    id: 'sub-89124',
    problemId: 'p3',
    problemTitle: 'Matrix Minimum Path Sum',
    userId: 'u3',
    username: 'Monishwaran45',
    language: 'javascript',
    code: `function minPathSum(grid) { ... }`,
    verdict: 'AC',
    passedTestCases: 15,
    totalTestCases: 15,
    executionTimeMs: 18,
    memoryKb: 14200,
    createdAt: new Date(Date.now() - 300000).toISOString()
  },
  {
    id: 'sub-89110',
    problemId: 'p2',
    problemTitle: 'Graph Connectivity Queries',
    userId: 'u3',
    username: 'Monishwaran45',
    language: 'cpp',
    code: `#include <iostream>\nusing namespace std;`,
    verdict: 'AC',
    passedTestCases: 20,
    totalTestCases: 20,
    executionTimeMs: 42,
    memoryKb: 18400,
    createdAt: new Date(Date.now() - 1080000).toISOString()
  },
  {
    id: 'sub-89098',
    problemId: 'p4',
    problemTitle: 'Quantum Segment Tree',
    userId: 'u1',
    username: 'tourist',
    language: 'cpp',
    code: `// Tourist segment tree`,
    verdict: 'AC',
    passedTestCases: 35,
    totalTestCases: 35,
    executionTimeMs: 12,
    memoryKb: 11200,
    createdAt: new Date(Date.now() - 1500000).toISOString()
  },
  {
    id: 'sub-89085',
    problemId: 'p1',
    problemTitle: 'Subarray XOR Maximum',
    userId: 'u3',
    username: 'Monishwaran45',
    language: 'python',
    code: `def solve(): pass`,
    verdict: 'AC',
    passedTestCases: 10,
    totalTestCases: 10,
    executionTimeMs: 24,
    memoryKb: 13800,
    createdAt: new Date(Date.now() - 1920000).toISOString()
  },
  {
    id: 'sub-89071',
    problemId: 'p3',
    problemTitle: 'Matrix Minimum Path Sum',
    userId: 'u4',
    username: 'Radewoosh',
    language: 'cpp',
    code: `int main() {}`,
    verdict: 'WA',
    passedTestCases: 8,
    totalTestCases: 15,
    executionTimeMs: 15,
    memoryKb: 9800,
    createdAt: new Date(Date.now() - 2400000).toISOString()
  }
];
