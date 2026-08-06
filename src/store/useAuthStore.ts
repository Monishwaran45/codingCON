import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { api } from '@/lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          // Role, permissions, and identity all come from the backend JWT
          const userData = await api.login(email, password);
          set({ user: userData, isAuthenticated: true, isLoading: false, error: null });
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : 'Login failed. Check your credentials.';
          set({ isLoading: false, error: message });
          throw err; // re-throw so AuthForm can react
        }
      },

      register: async (email: string, username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const userData = await api.register(email, username, password);
          set({ user: userData, isAuthenticated: true, isLoading: false, error: null });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Registration failed.';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      logout: async () => {
        try {
          await api.logout();
        } catch {
          // ignore network errors on logout
        }
        set({ user: null, isAuthenticated: false, error: null });
      },
    }),
    {
      name: 'codingcon-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
