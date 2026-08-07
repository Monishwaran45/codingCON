export type Difficulty = 'easy' | 'medium' | 'hard';

export type Verdict = 'pending' | 'running' | 'AC' | 'WA' | 'TLE' | 'MLE' | 'RE';

export type UserRole = 'student' | 'admin' | 'problem_setter';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  permissions: string[];
  avatarUrl?: string;
  totalPoints: number;
  streakDays: number;
  solvedCount: number;
  ratingHistory: { date: string; rating: number }[];
  rating?: number;
}

export interface TestCase {
  id: string | number;
  input: string;
  expectedOutput: string;
  isSample: boolean;
}

export interface TestCaseResult {
  id: string | number;
  passed: boolean;
  expectedOutput?: string;
  actualOutput?: string;
  executionTimeMs?: number;
  memoryKb?: number;
  error?: string;
}

export interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: Difficulty;
  points: number;
  timeLimitMs: number;
  memoryLimitMb: number;
  acceptanceRate: number;
  totalSubmissions: number;
  description: string;
  inputFormat: string;
  outputFormat: string;
  sampleTestCases: TestCase[];
  tags: string[];
  isSolved?: boolean;
  isAttempted?: boolean;
  lastAttemptedAt?: string;
}

export interface Submission {
  id: string;
  problemId: string;
  problemTitle: string;
  userId: string;
  username: string;
  language: string;
  code: string;
  verdict: Verdict;
  passedTestCases: number;
  totalTestCases: number;
  executionTimeMs: number;
  memoryKb: number;
  createdAt: string;
  testCaseResults?: TestCaseResult[];
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl?: string;
  solvedCount: number;
  totalScore: number;
  penaltyTimeMinutes: number;
  problemBreakdown: Record<string, { score: number; attempted: boolean; solvedTime?: string }>;
}

export interface Contest {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  participantCount: number;
  maxScore: number;
  problems: Problem[];
  isLeaderboardFrozen?: boolean;
  freezeTimeRemainingMinutes?: number;
  announcements: { id: string; timestamp: string; message: string }[];
}
