import { Router } from 'express';
import { sql } from '../db.js';

const router = Router();

interface DbProcessRoute {
  id: number;
  route_name: string;
  metal: string | null;
  ore_type: string | null;
  recovery_range_pct: string | null;
  typical_opex_usd_t: string | null;
  energy_kwh_t: string | null;
  water_m3_t: string | null;
  co2_intensity: string | null;
  capex_level: string | null;
  best_application: string | null;
  key_limitation: string | null;
  product: string | null;
  stages: number | null;
  stages_details: string | null;
  source: string | null;
}

function parseRangeAvg(s: string | null): number {
  if (!s) return 0;
  const nums = s.match(/[\d.]+/g);
  if (!nums) return 0;
  const vals = nums.map(Number).filter(n => !isNaN(n));
  if (vals.length === 0) return 0;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

function inferCategory(routeName: string): string {
  const n = routeName.toLowerCase();
  if (n.includes('smelt') && !n.includes('leach')) return 'Pyrometallurgy';
  if (n.includes('dle') || n.includes('direct lithium') || n.includes('bioleach')) return 'Emerging';
  if ((n.includes('flotation') || n.includes('float')) && (n.includes('leach') || n.includes('sx-ew'))) return 'Combined';
  return 'Hydrometallurgy';
}

function inferMethods(routeName: string): string[] {
  const n = routeName.toLowerCase();
  const methods: string[] = [];
  if (n.includes('flotation') || n.includes('float') || n.includes('flot')) methods.push('Froth flotation');
  if (n.includes('heap leach')) methods.push('Heap leaching');
  if (n.includes('sx-ew')) methods.push('SX-EW');
  if (n.includes('pox') || n.includes('pressure oxid')) methods.push('Pressure oxidation');
  if (n.includes('dle') || n.includes('direct lithium')) methods.push('DLE');
  if (n.includes('bioleach') || n.includes('biox')) methods.push('Bioleaching');
  if (/\b(cil|cip|cic)\b/i.test(routeName) || n.includes('carbon-in-')) methods.push('CIL / CIP');
  if (n.includes('smelt') || n.includes('blast furnace') || n.includes('rkef') || n.includes('arc furnace')) methods.push('Smelting');
  if (n.includes('gravity') || n.includes('knelson') || n.includes('falcon')) methods.push('Gravity separation');
  if (n.includes('electrowinning') || n.includes('electrorefin') || n.includes('+ ew') || n.includes('electrolytic') || n.includes('electrolysis')) methods.push('Electrowinning');
  if (n.includes('hpal') || n.includes('high pressure acid leach') || n.includes('high-pressure acid leach')) methods.push('HPAL');
  if (n.includes('roast')) methods.push('Roasting');
  if (/\bix\b/i.test(routeName) || n.includes('ion exchange') || n.includes('ion-exchange') || n.includes('anion exchange') || n.includes('ion adsorption') || n.includes('resin in pulp')) methods.push('Ion exchange');
  if (n.includes('magnetic') || n.includes('lims')) methods.push('Magnetic separation');
  if (n.includes('dms') || n.includes('dense media')) methods.push('DMS');
  if (n.includes('in-situ leach') || n.includes('(isl)')) methods.push('In-situ leach');
  return methods;
}


function mapProcessRoute(row: DbProcessRoute) {
  return {
    id: String(row.id),
    name: row.route_name,
    ore: row.ore_type ?? '',
    metal: row.metal ?? '',
    oreType: row.ore_type ?? '',
    category: inferCategory(row.route_name),
    methods: inferMethods(row.route_name),
    recovery: row.recovery_range_pct ?? '',
    recoveryNum: parseRangeAvg(row.recovery_range_pct),
    opex: row.typical_opex_usd_t ?? '',
    opexNum: parseRangeAvg(row.typical_opex_usd_t),
    energy: row.energy_kwh_t ?? '',
    water: row.water_m3_t ?? '',
    capex: row.capex_level ?? '',
    co2: row.co2_intensity ?? '',
    stages: row.stages_details ? row.stages_details.split('%#').map(s => s.trim()).filter(Boolean) : [],
    pros: row.best_application ? [row.best_application] : [],
    cons: row.key_limitation ? [row.key_limitation] : [],
    recommended: false,
    product: row.product ?? '',
  };
}

router.get('/recommend', async (req, res) => {
  const { metal, oreType } = req.query;
  if (!metal || typeof metal !== 'string' || !oreType || typeof oreType !== 'string') {
    res.status(400).json({ error: 'metal and oreType query params are required' });
    return;
  }
  try {
    const rows = await sql`
      SELECT id, route_name, metal, ore_type, recovery_range_pct,
             typical_opex_usd_t, energy_kwh_t, water_m3_t, co2_intensity,
             capex_level, best_application, key_limitation, product, stages, stages_details, source
      FROM process_routes
      WHERE metal    ILIKE ${metal}
        AND ore_type ILIKE ${oreType}
      ORDER BY
        COALESCE(
          CAST(NULLIF(REGEXP_REPLACE(recovery_range_pct, '[^0-9].*', ''), '') AS NUMERIC),
          0
        ) DESC
      LIMIT 5
    ` as DbProcessRoute[];
    res.json(rows.map(mapProcessRoute));
  } catch (err) {
    console.error('GET /api/processes/recommend error:', err);
    res.status(500).json({ error: 'Failed to fetch recommended routes' });
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
      SELECT id, route_name, metal, ore_type, recovery_range_pct,
             typical_opex_usd_t, energy_kwh_t, water_m3_t, co2_intensity,
             capex_level, best_application, key_limitation, product, stages, stages_details, source
      FROM process_routes
      WHERE route_name        ILIKE ${'%' + q + '%'}
         OR metal             ILIKE ${'%' + q + '%'}
         OR ore_type          ILIKE ${'%' + q + '%'}
         OR best_application  ILIKE ${'%' + q + '%'}
         OR key_limitation    ILIKE ${'%' + q + '%'}
      ORDER BY route_name
      LIMIT 30
    ` as DbProcessRoute[];
    res.json(rows.map(mapProcessRoute));
  } catch (err) {
    console.error('GET /api/processes/search error:', err);
    res.status(500).json({ error: 'Failed to search process routes' });
  }
});

router.get('/', async (_req, res) => {
  try {
    const rows = await sql`
      SELECT id, route_name, metal, ore_type, recovery_range_pct,
             typical_opex_usd_t, energy_kwh_t, water_m3_t, co2_intensity,
             capex_level, best_application, key_limitation, product, stages, stages_details, source
      FROM process_routes
      ORDER BY metal, route_name
    ` as DbProcessRoute[];
    res.json(rows.map(mapProcessRoute));
  } catch (err) {
    console.error('GET /api/processes error:', err);
    res.status(500).json({ error: 'Failed to fetch process routes' });
  }
});

export { router as processesRouter };
