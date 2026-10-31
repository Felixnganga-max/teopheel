import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loginRequest, logoutRequest, refreshRequest } from '../api/loginApi';
import { setAuthFailHandler, setAccessToken } from '../api/client';

const AuthContext = createContext(null);

const withTitle = (u) => (u ? { ...u, title: u.role === 'owner' ? 'Owner' : 'Location Admin' } : null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // restoring the session on page load

  useEffect(() => {
    let alive = true;
    setAuthFailHandler(() => setUser(null)); // refresh failed anywhere -> back to login
    refreshRequest()
      .then((d) => alive && setUser(withTitle(d.user)))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await loginRequest(email, password);
    const u = withTitle(data.user);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      /* ignore */
    }
    setAccessToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout, isAuthenticated: !!user, isOwner: user?.role === 'owner' }),
    [user, loading, login, logout]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
