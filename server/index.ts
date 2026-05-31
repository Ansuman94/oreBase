import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { mineralsRouter }  from './routes/minerals';
import { suppliersRouter } from './routes/suppliers';
import { processesRouter } from './routes/processes';
import { statsRouter }     from './routes/stats';
import { authRouter }      from './routes/auth';
import { usersRouter }     from './routes/users';
import { requireAuth, requireRole } from './middleware/auth';

const app = express();

const corsOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Public — auth endpoints (no token required)
app.use('/api/auth', authRouter);

// viewer+ — read-only data pages
app.use('/api/minerals',  requireAuth, mineralsRouter);
app.use('/api/suppliers', requireAuth, suppliersRouter);
app.use('/api/stats',     requireAuth, statsRouter);

// analyst+ — planner / predictor data
app.use('/api/processes', requireAuth, requireRole('analyst'), processesRouter);

// admin only — user management
app.use('/api/users', requireAuth, requireRole('admin'), usersRouter);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

if (!process.env.VERCEL) {
  const PORT = process.env.PORT ?? 3001;
  app.listen(PORT, () => {
    console.log(`OreBase API server running on http://localhost:${PORT}`);
  });
}

export default app;
