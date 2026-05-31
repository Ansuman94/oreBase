import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { sql } from '../db.js';
import type { UserRole } from '../middleware/auth.js';

const router = Router();

const VALID_ROLES: UserRole[] = ['viewer', 'analyst', 'admin'];

// GET /api/users — list all users
router.get('/', async (_req, res) => {
  try {
    const rows = await sql`
      SELECT id, email, name, role, created_at
      FROM users
      ORDER BY created_at DESC
    `;
    res.json(rows);
  } catch (err) {
    console.error('GET /api/users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/users — create a new user
router.post('/', async (req, res) => {
  const { email, password, name, role } = req.body as {
    email?: string; password?: string; name?: string; role?: string;
  };

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' });
    return;
  }

  const userRole: UserRole = VALID_ROLES.includes(role as UserRole) ? (role as UserRole) : 'viewer';

  try {
    const hash = await bcrypt.hash(password, 12);
    const rows = await sql`
      INSERT INTO users (email, password_hash, name, role)
      VALUES (${email.toLowerCase().trim()}, ${hash}, ${name?.trim() || null}, ${userRole})
      RETURNING id, email, name, role, created_at
    `;
    res.status(201).json(rows[0]);
  } catch (err: unknown) {
    const pg = err as { constraint?: string };
    if (pg?.constraint === 'users_email_key') {
      res.status(409).json({ error: 'A user with this email already exists' });
      return;
    }
    console.error('POST /api/users error:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PATCH /api/users/:id — update name, role, and optionally reset password
router.patch('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid user id' });
    return;
  }

  const { name, role, password } = req.body as {
    name?: string; role?: string; password?: string;
  };

  if (password !== undefined && password !== '' && password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' });
    return;
  }

  const userRole: UserRole | undefined =
    role && VALID_ROLES.includes(role as UserRole) ? (role as UserRole) : undefined;

  try {
    if (password) {
      const hash = await bcrypt.hash(password, 12);
      await sql`
        UPDATE users
        SET name          = COALESCE(${name?.trim() ?? null}, name),
            role          = COALESCE(${userRole ?? null}, role),
            password_hash = ${hash}
        WHERE id = ${id}
      `;
    } else {
      await sql`
        UPDATE users
        SET name = COALESCE(${name?.trim() ?? null}, name),
            role = COALESCE(${userRole ?? null}, role)
        WHERE id = ${id}
      `;
    }

    const rows = await sql`
      SELECT id, email, name, role, created_at FROM users WHERE id = ${id}
    `;
    if (!rows[0]) { res.status(404).json({ error: 'User not found' }); return; }
    res.json(rows[0]);
  } catch (err) {
    console.error('PATCH /api/users/:id error:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

export { router as usersRouter };
