import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../api/auth';

const ROLE_RANK: Record<UserRole, number> = { viewer: 0, analyst: 1, admin: 2 };

interface Props {
  children:  ReactNode;
  minRole?:  UserRole;
}

export function ProtectedRoute({ children, minRole = 'viewer' }: Props) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading__spinner" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (ROLE_RANK[user.role] < ROLE_RANK[minRole]) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
