import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

export function useAuth() {
  const [mounted, setMounted] = useState(false);
  const store = useAuthStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: store.login,
      logout: store.logout,
      mounted: false,
    };
  }

  return {
    ...store,
    mounted: true,
  };
}
