import { Router } from 'express';
import { sql } from '../db';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const [row] = await sql`
      SELECT
        (SELECT COUNT(*)::int FROM minerals)       AS minerals,
        (SELECT COUNT(*)::int FROM process_routes) AS process_routes,
        (SELECT COUNT(*)::int FROM suppliers)      AS suppliers,
        (SELECT COUNT(DISTINCT metal)::int
           FROM process_routes
          WHERE metal IS NOT NULL)                 AS metals
    `;
    res.json({
      minerals:      row.minerals,
      processRoutes: row.process_routes,
      suppliers:     row.suppliers,
      metals:        row.metals,
    });
  } catch (err) {
    console.error('GET /api/stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export { router as statsRouter };
