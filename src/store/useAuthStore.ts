import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { API_BASE_URL } from '@/lib/constants';

// Admin emails for offline/local mode — in production, this comes from the backend
const ADMIN_EMAILS = [
  'admin@cit.edu',
  'faculty@cit.edu',
  'admin@citchennai.edu',
  'admin@codingcon.com',
  'hodcse@cit.edu',
];

function detectRole(email: string): 'student' | 'admin' | 'problem_setter' {
  const lower = email.toLowerCase();
  if (ADMIN_EMAILS.includes(lower)) return 'admin';
  if (lower.startsWith('faculty.') || lower.includes('faculty@') || lower.includes('prof.')) return 'problem_setter';
  return 'student';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password?: string) => {
        set({ isLoading: true, error: null });

        // Try real backend first
        try {
          const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            credentials: 'include',
          });
          if (res.ok) {
            const userData = await res.json();
            set({ user: userData, isAuthenticated: true, isLoading: false, error: null });
            return;
          }
        } catch {
          // Backend offline — fall through to local mode
        }

        // Local fallback: detect role from email
        const role = detectRole(email);
        const username = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

        const mockUser: User = {
          id: `u-${Math.random().toString(36).substring(2, 9)}`,
          username,
          email,
          role,
          rating: role === 'admin' ? 0 : 1500,
          maxRating: role === 'admin' ? 0 : 1500,
          streakDays: 0,
          solvedCount: 0,
          ratingHistory: [],
        };

        set({ user: mockUser, isAuthenticated: true, isLoading: false, error: null });
      },

      logout: async () => {
        try {
          await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
        } catch {
          // ignore
        }
        set({ user: null, isAuthenticated: false, error: null });
      },
    }),
    {
      name: 'codingcon-auth',
      // Only persist user and isAuthenticated
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
