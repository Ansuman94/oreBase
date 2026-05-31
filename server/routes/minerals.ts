import { Router } from 'express';
import { sql } from '../db.js';

const router = Router();

interface DbMineral {
  id: number;
  mineral_name: string;
  formula: string | null;
  metal: string | null;
  ore_type: string | null;
  sg_min: number | null;
  sg_max: number | null;
  hardness_mohs: string | null;
  bwi_kwh_t: number | null;
  liberation_size_um: string | null;
  flotation_response: string | null;
  leach_response: string | null;
  optimal_ph_float: string | null;
  collector_type: string | null;
  recovery_ceiling: string | null;
  concentrate_grade: string | null;
  notes: string | null;
}

function primaryMetal(metal: string | null): string {
  if (!metal) return '';
  return metal.split('/')[0].trim();
}

function mapMineral(row: DbMineral) {
  const str = (v: number | string | null) => (v != null ? String(v) : '—');
  return {
    name: row.mineral_name,
    formula: row.formula ?? '',
    metal: row.metal ?? '',
    type: row.ore_type ?? '',
    sg_min: str(row.sg_min),
    sg_max: str(row.sg_max),
    hardness: row.hardness_mohs ?? '—',
    bwi: str(row.bwi_kwh_t),
    lib: row.liberation_size_um ?? '—',
    flotation: row.flotation_response ?? '—',
    leach: row.leach_response ?? '—',
    ph: row.optimal_ph_float ?? '—',
    collector: row.collector_type ?? '—',
    recovery: row.recovery_ceiling ?? '—',
    grade: row.concentrate_grade ?? '—',
    notes: row.notes ?? '',
    metal_group: primaryMetal(row.metal),
    float_cat: row.flotation_response ?? '',
  };
}

router.get('/', async (_req, res) => {
  try {
    const rows = await sql`
      SELECT id, mineral_name, formula, metal, ore_type,
             sg_min, sg_max, hardness_mohs, bwi_kwh_t, liberation_size_um,
             flotation_response, leach_response, optimal_ph_float,
             collector_type, recovery_ceiling, concentrate_grade, notes
      FROM minerals
      ORDER BY mineral_name
    ` as DbMineral[];
    res.json(rows.map(mapMineral));
  } catch (err) {
    console.error('GET /api/minerals error:', err);
    res.status(500).json({ error: 'Failed to fetch minerals' });
  }
});

router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q || typeof q !== 'string') {
    res.status(400).json({ error: 'Query parameter q is required' });
    return;
  }
  try {
    const rows = await sql`
      SELECT id, mineral_name, formula, metal, ore_type,
             sg_min, sg_max, hardness_mohs, bwi_kwh_t, liberation_size_um,
             flotation_response, leach_response, optimal_ph_float,
             collector_type, recovery_ceiling, concentrate_grade, notes
      FROM minerals
      WHERE to_tsvector('english', coalesce(mineral_name,'') || ' ' || coalesce(notes,''))
            @@ plainto_tsquery('english', ${q})
         OR mineral_name ILIKE ${'%' + q + '%'}
      ORDER BY mineral_name
      LIMIT 50
    ` as DbMineral[];
    res.json(rows.map(mapMineral));
  } catch (err) {
    console.error('GET /api/minerals/search error:', err);
    res.status(500).json({ error: 'Failed to search minerals' });
  }
});

export { router as mineralsRouter };
