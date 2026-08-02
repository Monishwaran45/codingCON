import { create } from 'zustand';
import { User } from '@/types';
import { MOCK_USER } from '@/mocks/user';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string) => Promise<void>;
  loginWithOAuth: (provider: 'google' | 'github') => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: MOCK_USER,
  isAuthenticated: true,
  isLoading: false,
  login: async (email: string) => {
    set({ isLoading: true });
    setTimeout(() => {
      set({
        user: { ...MOCK_USER, email },
        isAuthenticated: true,
        isLoading: false,
      });
    }, 600);
  },
  loginWithOAuth: async (provider: string) => {
    set({ isLoading: true });
    setTimeout(() => {
      set({
        user: MOCK_USER,
        isAuthenticated: true,
        isLoading: false,
      });
    }, 600);
  },
  logout: async () => {
    set({ user: null, isAuthenticated: false });
  },
}));
