import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { getMe, login as apiLogin, logout as apiLogout } from '../api/auth';
import type { AuthUser } from '../api/auth';

interface AuthCtx {
  user:    AuthUser | null;
  loading: boolean;
  login:   (email: string, password: string) => Promise<void>;
  logout:  () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then(u => setUser(u))
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const u = await apiLogin(email, password);
    setUser(u);
  }

  async function logout() {
    await apiLogout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
