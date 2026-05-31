/**
 * Run once to create the default admin user:
 *   npx tsx server/scripts/seed-admin.ts
 *
 * Change the password immediately after first login.
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { sql } from '../db';

const DEFAULT_EMAIL    = 'admin@orebase.com';
const DEFAULT_PASSWORD = 'OreBase2025!';
const DEFAULT_NAME     = 'Admin';

const hash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

await sql`
  INSERT INTO users (email, password_hash, name, role)
  VALUES (${DEFAULT_EMAIL}, ${hash}, ${DEFAULT_NAME}, 'admin')
  ON CONFLICT (email) DO UPDATE
    SET password_hash = EXCLUDED.password_hash,
        role          = 'admin'
`;

console.log(`✓ Admin user ready: ${DEFAULT_EMAIL} / ${DEFAULT_PASSWORD}`);
console.log('  Change this password immediately after first login.');
process.exit(0);
