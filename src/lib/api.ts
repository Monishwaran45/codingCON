import { API_BASE_URL } from './constants';
import { getAuthToken, setMemoryToken } from './auth-token';
import { Problem, Contest, LeaderboardEntry, User, Submission } from '@/types';

// In-memory short-lived cache for GET requests (5s TTL)
interface CacheEntry<T> {
  data: T;
  expiry: number;
}
const requestCache = new Map<string, CacheEntry<any>>();
const inFlightRequests = new Map<string, Promise<any>>();

export function clearApiCache(): void {
  requestCache.clear();
  inFlightRequests.clear();
}

// ── Core fetcher ──────────────────────────────────────────────────────────────
async function fetcher<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const isGet = !options.method || options.method === 'GET';
  const token = getAuthToken();
  const cacheKey = `${token || 'anon'}:${endpoint}`;

  // Invalidate cache on mutations
  if (!isGet) {
    requestCache.clear();
  }

  // Check cache for GET requests
  if (isGet) {
    const cached = requestCache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return cached.data as T;
    }
    // Deduplicate in-flight concurrent requests
    const pending = inFlightRequests.get(cacheKey);
    if (pending) {
      return pending as Promise<T>;
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const fetchPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const message = (body as { error?: string }).error ?? `HTTP ${res.status}`;
        if (res.status === 401) {
          setMemoryToken(undefined);
        }
        throw new Error(message);
      }

      const data = (await res.json()) as T;

      // Cache successful GET responses for 4 seconds
      if (isGet) {
        requestCache.set(cacheKey, { data, expiry: Date.now() + 4000 });
      }

      return data;
    } finally {
      if (isGet) {
        inFlightRequests.delete(cacheKey);
      }
    }
  })();

  if (isGet) {
    inFlightRequests.set(cacheKey, fetchPromise);
  }

  return fetchPromise;
}

// ── API surface (mirrors backend routes exactly) ──────────────────────────────
export const api = {
  // ── Auth ───────────────────────────────────────────────────────────────────
  login: (email: string, password: string) =>
    fetcher<User>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, username: string, password: string) =>
    fetcher<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password }),
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

  getAdminProblemById: (id: string) =>
    fetcher<Problem & { allTestCases: { id?: string | number; input: string; expectedOutput: string; isSample: boolean }[] }>(`/problems/${id}/admin`),

  createProblem: (data: Partial<Problem> & { testCases?: { input: string; expectedOutput: string; isSample?: boolean }[] }) =>
    fetcher<Problem>('/problems', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProblem: (id: string, data: Partial<Problem> & { testCases?: { input: string; expectedOutput: string; isSample?: boolean }[] }) =>
    fetcher<Problem>(`/problems/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteProblem: (id: string) =>
    fetcher<{ ok: boolean }>(`/problems/${id}`, { method: 'DELETE' }),

  // ── Contests ───────────────────────────────────────────────────────────────
  getContests: () =>
    fetcher<Contest[]>('/contest'),

  /** Fetches the active contest */
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

  stopContest: (contestId: string) =>
    fetcher<Contest>(`/contest/${contestId}/stop`, {
      method: 'POST',
    }),

  extendContest: (contestId: string) =>
    fetcher<Contest>(`/contest/${contestId}/extend`, {
      method: 'POST',
    }),

  deleteContest: (contestId: string) =>
    fetcher<{ ok: boolean }>(`/contest/${contestId}`, {
      method: 'DELETE',
    }),

  getContestParticipants: (contestId: string) =>
    fetcher<import('@/types').Participant[]>(`/contest/${contestId}/participants`),

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

  // ── Roles ──────────────────────────────────────────────────────────────────
  getRoles: () =>
    fetcher<{ name: string; permissions: string[] }[]>('/roles'),
};
