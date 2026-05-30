import { authFetch } from './auth';
import type { UserRole } from './auth';

export interface AppUser {
  id:         number;
  email:      string;
  name:       string | null;
  role:       UserRole;
  created_at: string;
}

export async function fetchUsers(): Promise<AppUser[]> {
  const res = await authFetch('/api/users');
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json() as Promise<AppUser[]>;
}

export async function createUser(data: {
  email:    string;
  password: string;
  name:     string;
  role:     UserRole;
}): Promise<AppUser> {
  const res = await authFetch('/api/users', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to create user' })) as { error?: string };
    throw new Error(err.error ?? 'Failed to create user');
  }
  return res.json() as Promise<AppUser>;
}

export async function updateUser(id: number, data: {
  name?:     string;
  role?:     UserRole;
  password?: string;
}): Promise<AppUser> {
  const res = await authFetch(`/api/users/${id}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to update user' })) as { error?: string };
    throw new Error(err.error ?? 'Failed to update user');
  }
  return res.json() as Promise<AppUser>;
}
