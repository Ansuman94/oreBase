import { Router } from 'express';
import { sql } from '../db';

const router = Router();

interface DbSupplier {
  id: number;
  supplier_name: string;
  category: string | null;
  hq_country: string | null;
  products_services: string | null;
  relevant_process: string | null;
  key_minerals: string | null;
  website: string | null;
  notes: string | null;
}

function mapSupplier(row: DbSupplier) {
  return {
    id: row.id,
    name: row.supplier_name,
    cat: row.category ?? '',
    region: row.hq_country ?? '',
    spec: row.products_services ?? '',
    cert: '',
    founded: 0,
    tags: row.key_minerals
      ? row.key_minerals.split(',').map(t => t.trim()).filter(Boolean)
      : [],
    website: row.website ?? '',
    notes: row.notes ?? '',
    relevant_process: row.relevant_process ?? '',
  };
}

router.get('/', async (_req, res) => {
  try {
    const rows = await sql`
      SELECT id, supplier_name, category, hq_country, products_services,
             relevant_process, key_minerals, website, notes
      FROM suppliers
      ORDER BY supplier_name
    ` as DbSupplier[];
    res.json(rows.map(mapSupplier));
  } catch (err) {
    console.error('GET /api/suppliers error:', err);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

export { router as suppliersRouter };
