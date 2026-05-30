export type UserRole = 'viewer' | 'analyst' | 'admin';

export interface AuthUser {
  id:    number;
  email: string;
  role:  UserRole;
  name:  string | null;
}

export async function authFetch(url: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, { ...init, credentials: 'include' });
  if (res.status === 401) {
    // Try to refresh the access token once
    const refreshed = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
    if (!refreshed.ok) return res; // propagate original 401
    return fetch(url, { ...init, credentials: 'include' });
  }
  return res;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await fetch('/api/auth/login', {
    method:      'POST',
    headers:     { 'Content-Type': 'application/json' },
    credentials: 'include',
    body:        JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? 'Login failed');
  }
  const data = await res.json() as { user: AuthUser };
  return data.user;
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
}

export async function getMe(): Promise<AuthUser | null> {
  try {
    const res = await authFetch('/api/auth/me');
    if (!res.ok) return null;
    return res.json() as Promise<AuthUser>;
  } catch {
    return null;
  }
}
