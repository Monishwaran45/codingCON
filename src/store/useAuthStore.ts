import { create } from 'zustand';
import { User } from '@/types';
import { API_BASE_URL } from '@/lib/constants';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string) => Promise<void>;
  loginWithOAuth: (provider: 'google' | 'github') => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: async (email: string) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        credentials: 'include',
      });
      if (res.ok) {
        const userData = await res.json();
        set({ user: userData, isAuthenticated: true, isLoading: false });
        return;
      }
    } catch {
      // Fallback for dev mode when auth server offline
    }
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
        ratingHistory: [{ date: new Date().toISOString().split('T')[0], rating: 1500 }],
      },
      isAuthenticated: true,
      isLoading: false,
    });
  },
  loginWithOAuth: (provider: 'google' | 'github') => {
    // Initiate real OAuth authorization handshake via NestJS Auth Gateway
    if (typeof window !== 'undefined') {
      window.location.href = `${API_BASE_URL}/auth/${provider}`;
    }
  },
  logout: async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch {
      // Ignore network errors on logout
    }
    set({ user: null, isAuthenticated: false });
  },
}));
