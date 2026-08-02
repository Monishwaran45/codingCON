import { API_BASE_URL } from './constants';
import { MOCK_PROBLEMS } from '@/mocks/problems';
import { MOCK_LEADERBOARD, MOCK_CONTEST } from '@/mocks/leaderboard';
import { MOCK_USER, MOCK_SUBMISSIONS } from '@/mocks/user';
import { Problem, Contest, LeaderboardEntry, User, Submission } from '@/types';

async function fetcher<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // JWT in httpOnly cookie
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    // Fallback to mock data gracefully when backend server is offline
    console.warn(`[API] ${endpoint} request failed, using mock data fallback.`);
    throw error;
  }
}

export const api = {
  // Problems
  getProblems: async (): Promise<Problem[]> => {
    try {
      return await fetcher<Problem[]>('/problems');
    } catch {
      return MOCK_PROBLEMS;
    }
  },
  getProblemById: async (id: string): Promise<Problem> => {
    try {
      return await fetcher<Problem>(`/problems/${id}`);
    } catch {
      return MOCK_PROBLEMS.find((p) => p.id === id) || MOCK_PROBLEMS[0];
    }
  },

  // Contest
  getContest: async (id: string): Promise<Contest> => {
    try {
      return await fetcher<Contest>(`/contest/${id}`);
    } catch {
      return MOCK_CONTEST;
    }
  },
  getLeaderboard: async (contestId: string): Promise<LeaderboardEntry[]> => {
    try {
      return await fetcher<LeaderboardEntry[]>(`/leaderboard/${contestId}`);
    } catch {
      return MOCK_LEADERBOARD;
    }
  },

  // User Profile & Submissions
  getProfile: async (): Promise<User> => {
    try {
      return await fetcher<User>('/profile');
    } catch {
      return MOCK_USER;
    }
  },
  getSubmissions: async (): Promise<Submission[]> => {
    try {
      return await fetcher<Submission[]>('/submissions');
    } catch {
      return MOCK_SUBMISSIONS;
    }
  },
};
