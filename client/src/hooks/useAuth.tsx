import type { UserPublic } from '@dialyrounds/shared';
import { SESSION_IDLE_MS } from '@dialyrounds/shared';
import { isMarketingHost } from '../utils/routes';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api } from '../api/client';

interface AuthContextValue {
  user: UserPublic | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api<{ user: UserPublic }>('/api/auth/me');
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await api('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    setUser(null);
  }, []);

  useEffect(() => {
    if (isMarketingHost()) {
      setLoading(false);
      return;
    }
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user) return;

    let timeout: number | undefined;
    const resetTimer = () => {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        void logout();
        window.alert('Session expired due to inactivity.');
      }, SESSION_IDLE_MS);
    };

    const events = ['mousemove', 'keydown', 'touchstart', 'click'] as const;
    for (const event of events) {
      window.addEventListener(event, resetTimer);
    }
    resetTimer();

    return () => {
      window.clearTimeout(timeout);
      for (const event of events) {
        window.removeEventListener(event, resetTimer);
      }
    };
  }, [user, logout]);

  const value = useMemo(
    () => ({ user, loading, refresh, logout }),
    [user, loading, refresh, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
