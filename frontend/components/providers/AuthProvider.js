'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '@/services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  async function refresh() {
    try {
      await api('/api/auth/csrf');
      const payload = await api('/api/auth/me');
      setUser(payload.data);
    } catch {
      setUser(null);
    } finally {
      setReady(true);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const value = useMemo(() => ({ user, ready, setUser, refresh }), [user, ready]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
