import { LeaderboardEntry, Contest } from '@/types';
import { MOCK_PROBLEMS } from './problems';

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, userId: 'u1', username: 'tourist', solvedCount: 4, totalScore: 2500, penaltyTimeMinutes: 42, problemBreakdown: { p1: { score: 500, attempted: true, solvedTime: '00:08' }, p2: { score: 750, attempted: true, solvedTime: '00:18' }, p3: { score: 1000, attempted: true, solvedTime: '00:32' }, p4: { score: 1250, attempted: true, solvedTime: '00:42' } } },
  { rank: 2, userId: 'u2', username: 'Benq', solvedCount: 4, totalScore: 2420, penaltyTimeMinutes: 65, problemBreakdown: { p1: { score: 500, attempted: true, solvedTime: '00:10' }, p2: { score: 750, attempted: true, solvedTime: '00:22' }, p3: { score: 1000, attempted: true, solvedTime: '00:45' }, p4: { score: 1170, attempted: true, solvedTime: '01:05' } } },
  { rank: 3, userId: 'u3', username: 'Monishwaran45', solvedCount: 3, totalScore: 2250, penaltyTimeMinutes: 58, problemBreakdown: { p1: { score: 500, attempted: true, solvedTime: '00:12' }, p2: { score: 750, attempted: true, solvedTime: '00:28' }, p3: { score: 1000, attempted: true, solvedTime: '00:58' }, p4: { score: 0, attempted: false } } },
  { rank: 4, userId: 'u4', username: 'Radewoosh', solvedCount: 3, totalScore: 2100, penaltyTimeMinutes: 72, problemBreakdown: { p1: { score: 500, attempted: true, solvedTime: '00:15' }, p2: { score: 750, attempted: true, solvedTime: '00:35' }, p3: { score: 850, attempted: true, solvedTime: '01:12' }, p4: { score: 0, attempted: true } } },
  { rank: 5, userId: 'u5', username: 'ecnerwala', solvedCount: 2, totalScore: 1250, penaltyTimeMinutes: 35, problemBreakdown: { p1: { score: 500, attempted: true, solvedTime: '00:09' }, p2: { score: 750, attempted: true, solvedTime: '00:35' }, p3: { score: 0, attempted: false }, p4: { score: 0, attempted: false } } },
  { rank: 6, userId: 'u6', username: 'Um_nik', solvedCount: 2, totalScore: 1250, penaltyTimeMinutes: 48, problemBreakdown: { p1: { score: 500, attempted: true, solvedTime: '00:14' }, p2: { score: 750, attempted: true, solvedTime: '00:48' }, p3: { score: 0, attempted: true }, p4: { score: 0, attempted: false } } },
  { rank: 7, userId: 'u7', username: 'Petr', solvedCount: 2, totalScore: 1100, penaltyTimeMinutes: 52, problemBreakdown: { p1: { score: 500, attempted: true, solvedTime: '00:16' }, p2: { score: 600, attempted: true, solvedTime: '00:52' }, p3: { score: 0, attempted: false }, p4: { score: 0, attempted: false } } },
  { rank: 8, userId: 'u8', username: 'Gennady', solvedCount: 1, totalScore: 500, penaltyTimeMinutes: 11, problemBreakdown: { p1: { score: 500, attempted: true, solvedTime: '00:11' }, p2: { score: 0, attempted: false }, p3: { score: 0, attempted: false }, p4: { score: 0, attempted: false } } },
];

export const MOCK_CONTEST: Contest = {
  id: 'c88',
  title: 'codingCON Grand Championship Round #88 (Div. 1 + Div. 2)',
  startTime: new Date(Date.now() - 1800000).toISOString(), // 30 mins ago
  endTime: new Date(Date.now() + 5400000).toISOString(),   // 90 mins left
  durationMinutes: 120,
  participantCount: 1482,
  maxScore: 3500,
  problems: MOCK_PROBLEMS,
  isLeaderboardFrozen: false,
  announcements: [
    { id: 'a1', timestamp: '15m ago', message: 'Clarification for Problem B: Dynamic graph edges are undirected.' },
    { id: 'a2', timestamp: '28m ago', message: 'Welcome to Round #88! The contest is now live.' }
  ]
};
