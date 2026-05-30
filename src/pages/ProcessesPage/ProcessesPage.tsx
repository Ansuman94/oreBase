import { useState, useMemo, useEffect } from 'react';
import type { ProcessRoute } from '../../data/routes';
import { fetchProcessRoutes } from '../../api/processes';
import { Checkbox } from '../../components/Checkbox/Checkbox';
import { MetalButton } from '../../components/MetalButton/MetalButton';
import { RouteCard } from '../../components/RouteCard/RouteCard';
import { PageLoader } from '../../components/PageLoader/PageLoader';
import './ProcessesPage.scss';

const CAT_STYLES: Record<string, { color: string; bg: string }> = {
  Pyrometallurgy: { color: '#8A4500', bg: '#FFF0E0' },
  Hydrometallurgy: { color: '#1A4F8A', bg: '#E3ECF7' },
  Emerging:        { color: '#5530A0', bg: '#F0EAFF' },
  Combined:        { color: '#1E6B42', bg: '#E3F0EA' },
};

const CO2_STYLES: Record<string, { color: string; bg: string }> = {
  'High':     { color: '#8A4500', bg: '#FFF0E0' },
  'Medium':   { color: '#806000', bg: '#FFF8E0' },
  'Low':      { color: '#1E6B42', bg: '#E3F0EA' },
  'Very low': { color: '#1E6B42', bg: '#E3F0EA' },
};

const PROCESS_METHODS = [
  'Froth flotation',
  'Smelting',
  'Gravity separation',
  'Roasting',
  'CIL / CIP',
  'Electrowinning',
  'Ion exchange',
  'Heap leaching',
  'SX-EW',
  'Pressure oxidation',
  'DMS',
  'Magnetic separation',
  'Bioleaching',
  'DLE',
  'HPAL',
  'In-situ leach',
];

const METAL_COLORS: Record<string, string> = {
  Cu: '#B8520A', Li: '#2E7D6B', Au: '#B07800', Co: '#1E52A0', Ni: '#2D6048',
  Ag: '#505870', Fe: '#8A4030', Mn: '#506020', Zn: '#8A5220', Pb: '#4A5268',
  Mo: '#3A5068', W: '#3A3848', Sn: '#5A3820', Al: '#8A4A2A', Cr: '#2D5A3A',
  V: '#9A3E18', Ti: '#7A4028', REE: '#7A4060', Pt: '#485860', PGM: '#485860',
};

const METAL_ORDER = ['Cu', 'Li', 'Au', 'Co', 'Ni', 'Ag', 'Fe', 'Mn', 'Zn', 'Pb', 'Mo', 'W', 'REE', 'Pt', 'PGM'];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'recovery',  label: 'Recovery ↓' },
  { value: 'opex',      label: 'OPEX ↓' },
  { value: 'energy',    label: 'Energy ↓' },
];

export function ProcessesPage() {
  const [routes, setRoutes] = useState<ProcessRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMethods, setSelectedMethods] = useState<Set<string>>(new Set());
  const [recovMin, setRecovMin] = useState('');
  const [recovMax, setRecovMax] = useState('');
  const [selectedMetals, setSelectedMetals] = useState<Set<string>>(new Set());
  const [opexMin, setOpexMin] = useState('');
  const [opexMax, setOpexMax] = useState('');
  const [searchText, setSearchText] = useState('');
  const [sortKey, setSortKey] = useState('relevance');
  const [showAllMetals, setShowAllMetals] = useState(false);

  useEffect(() => {
    fetchProcessRoutes()
      .then(setRoutes)
      .catch(() => setError('Failed to load process routes from server.'))
      .finally(() => setLoading(false));
  }, []);

  const methodCounts = useMemo(() => {
    const map: Record<string, number> = {};
    routes.forEach(r => r.methods.forEach(m => { map[m] = (map[m] || 0) + 1; }));
    return map;
  }, [routes]);

  const metalCounts = useMemo(() => {
    const map: Record<string, number> = {};
    routes.forEach(r => { map[r.metal] = (map[r.metal] || 0) + 1; });
    return map;
  }, [routes]);

  const availableMetals = useMemo(() => {
    const known = METAL_ORDER.filter(m => metalCounts[m]);
    const extra = Object.keys(metalCounts).filter(m => !METAL_ORDER.includes(m)).sort();
    return [...known, ...extra];
  }, [metalCounts]);

  const filtered = useMemo(() => {
    let list = routes;

    if (selectedMethods.size > 0) {
      list = list.filter(r => r.methods.some(m => selectedMethods.has(m)));
    }
    if (selectedMetals.size > 0) {
      list = list.filter(r => selectedMetals.has(r.metal));
    }
    if (recovMin) list = list.filter(r => r.recoveryNum >= parseFloat(recovMin));
    if (recovMax) list = list.filter(r => r.recoveryNum <= parseFloat(recovMax));
    if (opexMin)  list = list.filter(r => r.opexNum >= parseFloat(opexMin));
    if (opexMax)  list = list.filter(r => r.opexNum <= parseFloat(opexMax));
    if (searchText) {
      const q = searchText.toLowerCase();
      list = list.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.metal.toLowerCase().includes(q) ||
        r.oreType.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => {
      if (sortKey === 'recovery') return b.recoveryNum - a.recoveryNum;
      if (sortKey === 'opex')     return a.opexNum - b.opexNum;
      if (sortKey === 'energy')   return parseFloat(a.energy) - parseFloat(b.energy);
      // relevance: recommended first, then by recovery
      if (a.recommended && !b.recommended) return -1;
      if (!a.recommended && b.recommended) return 1;
      return b.recoveryNum - a.recoveryNum;
    });
  }, [routes, selectedMethods, selectedMetals, recovMin, recovMax, opexMin, opexMax, searchText, sortKey]);

  function toggleMethod(m: string) {
    setSelectedMethods(prev => { const n = new Set(prev); n.has(m) ? n.delete(m) : n.add(m); return n; });
  }
  function toggleMetal(m: string) {
    setSelectedMetals(prev => { const n = new Set(prev); n.has(m) ? n.delete(m) : n.add(m); return n; });
  }

  function clearFilters() {
    setSelectedMethods(new Set());
    setSelectedMetals(new Set());
    setRecovMin('');
    setRecovMax('');
    setOpexMin('');
    setOpexMax('');
  }

  const hasFilters = selectedMethods.size > 0 || selectedMetals.size > 0 || recovMin || recovMax || opexMin || opexMax;

  return (
    <div className="processes-page">
      <aside className="processes-page__filters">
        {loading ? <PageLoader variant="filter" /> : (
          <>
            <div className="processes-page__filter-head">
              <span className="processes-page__filter-title">Refine</span>
              {hasFilters && (
                <button className="processes-page__filter-clear" onClick={clearFilters}>Clear all</button>
              )}
            </div>

            <div className="processes-page__filter-section">
              <div className="processes-page__filter-label">Process method</div>
              <div className="processes-page__method-list">
                {PROCESS_METHODS.map(m => (
                  <Checkbox
                    key={m}
                    label={m}
                    count={methodCounts[m] ?? 0}
                    checked={selectedMethods.has(m)}
                    onChange={() => toggleMethod(m)}
                  />
                ))}
              </div>
            </div>

            <div className="processes-page__filter-section">
              <div className="processes-page__filter-label">Recovery range (%)</div>
              <div className="processes-page__range-row">
                <input
                  className="processes-page__range-input"
                  type="number"
                  placeholder="Min"
                  value={recovMin}
                  onChange={e => setRecovMin(e.target.value)}
                />
                <span className="processes-page__range-sep">—</span>
                <input
                  className="processes-page__range-input"
                  type="number"
                  placeholder="Max"
                  value={recovMax}
                  onChange={e => setRecovMax(e.target.value)}
                />
              </div>
            </div>

            <div className="processes-page__filter-section">
              <div className="processes-page__filter-label">Primary metal</div>
              <div className="processes-page__metal-grid">
                {(showAllMetals ? availableMetals : availableMetals.slice(0, 8)).map(m => (
                  <MetalButton
                    key={m}
                    metal={m}
                    color={METAL_COLORS[m] ?? '#505050'}
                    count={metalCounts[m] ?? 0}
                    active={selectedMetals.has(m)}
                    onClick={() => toggleMetal(m)}
                  />
                ))}
              </div>
              {availableMetals.length > 8 && (
                <button
                  className="processes-page__metal-more"
                  onClick={() => setShowAllMetals(v => !v)}
                >
                  {showAllMetals ? 'Show less' : `+${availableMetals.length - 8} more`}
                </button>
              )}
            </div>

            <div className="processes-page__filter-section">
              <div className="processes-page__filter-label">OPEX ($/t ore)</div>
              <div className="processes-page__range-row">
                <input
                  className="processes-page__range-input"
                  type="number"
                  placeholder="Min"
                  value={opexMin}
                  onChange={e => setOpexMin(e.target.value)}
                />
                <span className="processes-page__range-sep">—</span>
                <input
                  className="processes-page__range-input"
                  type="number"
                  placeholder="Max"
                  value={opexMax}
                  onChange={e => setOpexMax(e.target.value)}
                />
              </div>
            </div>
          </>
        )}
      </aside>

      <div className="processes-page__main">
        {(loading || error) ? <PageLoader variant="list" rows={5} error={error} /> : <>
        <div className="processes-page__toolbar">
          <span className="processes-page__count">
            <strong>{filtered.length.toLocaleString()}</strong> process routes
          </span>
          <input
            className="processes-page__search"
            type="text"
            placeholder="Search name, metal, ore type…"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
          <div className="processes-page__sort-wrap">
            <label className="processes-page__sort-label">Sort:</label>
            <select
              className="processes-page__sort-select"
              value={sortKey}
              onChange={e => setSortKey(e.target.value)}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="processes-page__list">
          {filtered.length === 0 ? (
            <div className="processes-page__empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3}>
                <circle cx="12" cy="5" r="2" />
                <circle cx="5" cy="19" r="2" />
                <circle cx="19" cy="19" r="2" />
                <line x1="12" y1="7" x2="5" y2="17" />
                <line x1="12" y1="7" x2="19" y2="17" />
              </svg>
              <p>No process routes match your filters</p>
            </div>
          ) : (
            filtered.map(route => {
              const cat = CAT_STYLES[route.category] ?? { color: '#5C5450', bg: '#F2EDE8' };
              const co2 = CO2_STYLES[route.co2] ?? { color: '#8C8480', bg: '#F2EDE8' };
              return (
                <RouteCard
                  key={route.id}
                  name={route.name}
                  subtitle={`${route.ore} · ${route.category} · ${route.metal}`}
                  recommended={route.recommended}
                  badge={
                    <span
                      className="processes-page__cat-badge"
                      style={{ color: cat.color, background: cat.bg }}
                    >
                      {route.category}
                    </span>
                  }
                  metrics={[
                    { label: 'Recovery', value: route.recovery, highlight: route.recommended },
                    { label: 'OPEX',     value: route.opex },
                    { label: 'Energy',   value: route.energy },
                    { label: 'Water',    value: route.water },
                    { label: 'Capex',    value: route.capex },
                  ]}
                  stages={route.stages}
                  pros={route.pros}
                  cons={route.cons}
                  co2={route.co2}
                  co2Color={co2.color}
                  co2Bg={co2.bg}
                />
              );
            })
          )}
        </div>
        </>}
      </div>
    </div>
  );
}
