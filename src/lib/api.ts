/**
 * API client — all requests go to the real backend.
 * The only fallback is an empty state so the UI degrades gracefully
 * rather than showing fake data.
 */
import { API_BASE_URL } from './constants';
import { Problem, Contest, LeaderboardEntry, User, Submission } from '@/types';

// ── Core fetcher ──────────────────────────────────────────────────────────────
async function fetcher<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── API surface (mirrors backend routes exactly) ──────────────────────────────
export const api = {
  // ── Auth ───────────────────────────────────────────────────────────────────
  login: (email: string, password: string) =>
    fetcher<User>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, username: string, password: string, role?: string) =>
    fetcher<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password, role }),
    }),

  logout: () =>
    fetcher<{ ok: boolean }>('/auth/logout', { method: 'POST' }),

  getMe: () =>
    fetcher<User>('/auth/me'),

  // ── Problems ───────────────────────────────────────────────────────────────
  getProblems: (params?: { difficulty?: string; tag?: string; q?: string }) => {
    const qs = new URLSearchParams(
      Object.entries(params ?? {}).filter(([, v]) => Boolean(v)) as [string, string][],
    ).toString();
    return fetcher<Problem[]>(`/problems${qs ? `?${qs}` : ''}`);
  },

  getProblemById: (id: string) =>
    fetcher<Problem>(`/problems/${id}`),

  createProblem: (data: Partial<Problem>) =>
    fetcher<Problem>('/problems', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProblem: (id: string, data: Partial<Problem>) =>
    fetcher<Problem>(`/problems/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteProblem: (id: string) =>
    fetcher<{ ok: boolean }>(`/problems/${id}`, { method: 'DELETE' }),

  // ── Contests ───────────────────────────────────────────────────────────────
  /** Fetches the most recently started contest regardless of ID */
  getActiveContest: () =>
    fetcher<Contest>('/contest/active'),

  getContest: (id: string) =>
    fetcher<Contest>(`/contest/${id}`),

  createContest: (data: {
    title: string; startTime: string; endTime: string;
    durationMinutes?: number; problemIds?: string[];
  }) =>
    fetcher<Contest>('/contest', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  postAnnouncement: (contestId: string, message: string) =>
    fetcher<{ id: string; message: string; timestamp: string }>(
      `/contest/${contestId}/announcements`,
      { method: 'POST', body: JSON.stringify({ message }) },
    ),

  freezeLeaderboard: (contestId: string, frozen: boolean) =>
    fetcher<{ ok: boolean }>(`/contest/${contestId}/freeze`, {
      method: 'PATCH',
      body: JSON.stringify({ frozen }),
    }),

  // ── Leaderboard ────────────────────────────────────────────────────────────
  getLeaderboard: (contestId: string) =>
    fetcher<LeaderboardEntry[]>(`/leaderboard/${contestId}`),

  // ── Submissions ────────────────────────────────────────────────────────────
  getSubmissions: () =>
    fetcher<Submission[]>('/submissions'),

  getSubmission: (id: string) =>
    fetcher<Submission>(`/submissions/${id}`),

  // ── Profile ────────────────────────────────────────────────────────────────
  getProfile: () =>
    fetcher<User>('/profile'),
};
