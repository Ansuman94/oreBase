import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set. Copy .env.example to .env and fill in your Neon connection string.');
}

export const sql = neon(process.env.DATABASE_URL);
