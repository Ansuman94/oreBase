import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export type UserRole = 'viewer' | 'analyst' | 'admin';

export interface AuthUser {
  userId: number;
  email:  string;
  role:   UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const ROLE_RANK: Record<UserRole, number> = { viewer: 0, analyst: 1, admin: 2 };

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.access_token as string | undefined;
  if (!token) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as AuthUser;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Token invalid or expired' });
  }
}

export function requireRole(minRole: UserRole) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    if (ROLE_RANK[req.user.role] < ROLE_RANK[minRole]) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}
