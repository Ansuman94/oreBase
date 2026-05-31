import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sql } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import type { AuthUser, UserRole } from '../middleware/auth.js';

const router = Router();

const ACCESS_MAX_AGE  = 15 * 60 * 1000;          // 15 min ms
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days ms

const COOKIE_BASE = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path:     '/',
};

function signAccess(user: AuthUser): string {
  return jwt.sign(
    { userId: user.userId, email: user.email, role: user.role },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: '15m' },
  );
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  try {
    const rows = await sql`
      SELECT id, email, password_hash, role, name
      FROM users WHERE email = ${email.toLowerCase().trim()}
    `;
    const row = rows[0];
    if (!row || !(await bcrypt.compare(password, row.password_hash as string))) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const authUser: AuthUser = {
      userId: row.id as number,
      email:  row.email as string,
      role:   row.role as UserRole,
    };

    const accessToken  = signAccess(authUser);
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt    = new Date(Date.now() + REFRESH_MAX_AGE);

    await sql`
      INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
      VALUES (${authUser.userId}, ${hashToken(refreshToken)}, ${expiresAt})
    `;

    res.cookie('access_token',  accessToken,  { ...COOKIE_BASE, maxAge: ACCESS_MAX_AGE  });
    res.cookie('refresh_token', refreshToken, { ...COOKIE_BASE, maxAge: REFRESH_MAX_AGE });
    res.json({ user: { id: authUser.userId, email: authUser.email, role: authUser.role, name: row.name } });
  } catch (err) {
    console.error('POST /api/auth/login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/refresh — issue new access token using refresh token
router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies?.refresh_token as string | undefined;
  if (!refreshToken) {
    res.status(401).json({ error: 'No refresh token' });
    return;
  }

  try {
    const rows = await sql`
      SELECT rt.id, rt.user_id, u.email, u.role, u.name
      FROM refresh_tokens rt
      JOIN users u ON u.id = rt.user_id
      WHERE rt.token_hash = ${hashToken(refreshToken)}
        AND rt.expires_at > NOW()
    `;
    const row = rows[0];
    if (!row) {
      res.status(401).json({ error: 'Refresh token invalid or expired' });
      return;
    }

    const authUser: AuthUser = {
      userId: row.user_id as number,
      email:  row.email as string,
      role:   row.role as UserRole,
    };
    const accessToken = signAccess(authUser);

    res.cookie('access_token', accessToken, { ...COOKIE_BASE, maxAge: ACCESS_MAX_AGE });
    res.json({ user: { id: authUser.userId, email: authUser.email, role: authUser.role, name: row.name } });
  } catch (err) {
    console.error('POST /api/auth/refresh error:', err);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// POST /api/auth/logout — clear cookies + revoke refresh token
router.post('/logout', async (req, res) => {
  const refreshToken = req.cookies?.refresh_token as string | undefined;
  if (refreshToken) {
    await sql`DELETE FROM refresh_tokens WHERE token_hash = ${hashToken(refreshToken)}`.catch(() => {});
  }
  res.clearCookie('access_token',  COOKIE_BASE);
  res.clearCookie('refresh_token', COOKIE_BASE);
  res.json({ ok: true });
});

// GET /api/auth/me — return current user from access token
router.get('/me', requireAuth, async (req, res) => {
  try {
    const rows = await sql`
      SELECT id, email, role, name FROM users WHERE id = ${req.user!.userId}
    `;
    const u = rows[0];
    if (!u) { res.status(404).json({ error: 'User not found' }); return; }
    res.json({ id: u.id, email: u.email, role: u.role, name: u.name });
  } catch (err) {
    console.error('GET /api/auth/me error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export { router as authRouter };
