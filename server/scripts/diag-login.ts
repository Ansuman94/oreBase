import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { sql } from '../db';

async function main() {
  const rows = await sql`SELECT id, email, password_hash, role, name FROM users WHERE email = 'admin@orebase.com'`;
  console.log('rows found:', rows.length);
  if (rows[0]) {
    console.log('email:', rows[0].email);
    console.log('role:', rows[0].role);
    const hash = rows[0].password_hash as string;
    console.log('hash prefix:', hash.slice(0, 10));
    const ok = await bcrypt.compare('OreBase2025!', hash);
    console.log('password match:', ok);
  }
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
