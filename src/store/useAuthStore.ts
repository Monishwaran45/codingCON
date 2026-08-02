import { create } from 'zustand';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string) => Promise<void>;
  loginWithOAuth: (provider: 'google' | 'github') => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: async (email: string) => {
    set({ isLoading: true });
    setTimeout(() => {
      const username = email.split('@')[0];
      set({
        user: {
          id: 'u-' + Math.random().toString(36).substring(2, 7),
          username,
          email,
          role: 'student',
          rating: 1500,
          maxRating: 1500,
          streakDays: 1,
          solvedCount: 0,
          ratingHistory: [{ date: new Date().toISOString().split('T')[0], rating: 1500 }]
        },
        isAuthenticated: true,
        isLoading: false,
      });
    }, 600);
  },
  loginWithOAuth: async (provider: 'google' | 'github') => {
    set({ isLoading: true });
    setTimeout(() => {
      set({
        user: {
          id: 'u-' + Math.random().toString(36).substring(2, 7),
          username: provider === 'github' ? 'octocat' : 'google_coder',
          email: `${provider}@codingcon.dev`,
          role: 'student',
          rating: 1500,
          maxRating: 1500,
          streakDays: 1,
          solvedCount: 0,
          ratingHistory: [{ date: new Date().toISOString().split('T')[0], rating: 1500 }]
        },
        isAuthenticated: true,
        isLoading: false,
      });
    }, 600);
  },
  logout: async () => {
    set({ user: null, isAuthenticated: false });
  },
}));
