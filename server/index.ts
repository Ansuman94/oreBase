import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { mineralsRouter } from './routes/minerals';
import { suppliersRouter } from './routes/suppliers';
import { processesRouter } from './routes/processes';

const app = express();

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));
app.use(express.json());

app.use('/api/minerals', mineralsRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/processes', processesRouter);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => {
  console.log(`OreBase API server running on http://localhost:${PORT}`);
});
