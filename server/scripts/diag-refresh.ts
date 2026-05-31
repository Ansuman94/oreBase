import 'dotenv/config';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sql } from '../db';

async function main() {
  // Test refresh_tokens table
  try {
    const rows = await sql`SELECT COUNT(*) FROM refresh_tokens`;
    console.log('refresh_tokens count:', rows[0].count);
  } catch(e) {
    console.error('refresh_tokens table error:', e);
    return;
  }

  // Test JWT signing
  try {
    const tok = jwt.sign({ userId: 1, email: 'test', role: 'admin' }, process.env.JWT_ACCESS_SECRET!, { expiresIn: '15m' });
    console.log('JWT sign ok, prefix:', tok.slice(0, 20));
  } catch(e) {
    console.error('JWT sign error:', e);
  }

  // Test inserting refresh token
  try {
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await sql`INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (1, ${hash}, ${expiresAt})`;
    await sql`DELETE FROM refresh_tokens WHERE token_hash = ${hash}`;
    console.log('refresh_tokens insert/delete ok');
  } catch(e) {
    console.error('refresh_tokens insert error:', e);
  }
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
