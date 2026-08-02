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

export const api = {
  // Problems
  getProblems: async (): Promise<Problem[]> => {
    try {
      return await fetcher<Problem[]>('/problems');
    } catch {
      return [];
    }
  },
  getProblemById: async (id: string): Promise<Problem | null> => {
    try {
      return await fetcher<Problem>(`/problems/${id}`);
    } catch {
      return null;
    }
  },
  createProblem: async (problemData: Partial<Problem>): Promise<Problem> => {
    try {
      return await fetcher<Problem>('/problems', {
        method: 'POST',
        body: JSON.stringify(problemData),
      });
    } catch {
      // Local fallback for offline mode
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
      };
      return newProblem;
    }
  },

  // Contest
  getContest: async (id: string): Promise<Contest | null> => {
    try {
      return await fetcher<Contest>(`/contest/${id}`);
    } catch {
      return null;
    }
  },
  getLeaderboard: async (contestId: string): Promise<LeaderboardEntry[]> => {
    try {
      return await fetcher<LeaderboardEntry[]>(`/leaderboard/${contestId}`);
    } catch {
      return [];
    }
  },

  // User Profile & Submissions
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
