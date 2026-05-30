import { useState, useMemo, useEffect } from 'react';
import type { MineralData } from '../../data/minerals';
import { fetchMinerals } from '../../api/minerals';
import { Badge } from '../../components/Badge/Badge';
import type { BadgeVariant } from '../../components/Badge/Badge';
import { MetalButton } from '../../components/MetalButton/MetalButton';
import { FloatTag } from '../../components/FloatTag/FloatTag';
import type { FloatTier } from '../../components/FloatTag/FloatTag';
import { Checkbox } from '../../components/Checkbox/Checkbox';
import { ViewToggle } from '../../components/ViewToggle/ViewToggle';
import type { ViewMode } from '../../components/ViewToggle/ViewToggle';
import { MineralCard } from '../../components/MineralCard/MineralCard';
import { MineralTable } from '../../components/MineralTable/MineralTable';
import type { MineralRow } from '../../components/MineralTable/MineralTable';
import { PropGrid } from '../../components/PropGrid/PropGrid';
import { HorizontalBarChart } from '../../components/HorizontalBarChart/HorizontalBarChart';
import { PageLoader } from '../../components/PageLoader/PageLoader';
import './MineralsPage.scss';

const METAL_COLORS: Record<string, string> = {
  // Base & industrial — ore/mineral colour associations
  Cu:  '#B8520A', // chalcopyrite — copper orange-brown
  Fe:  '#8A4030', // hematite — rust red
  Ni:  '#2D6048', // garnierite — green
  Zn:  '#8A5220', // sphalerite — amber-brown
  Pb:  '#4A5268', // galena — dark blue-grey
  Sn:  '#5A3820', // cassiterite — dark brown
  Al:  '#8A4A2A', // bauxite — earthy red
  Cr:  '#2D5A3A', // chromite — chrome green
  Mn:  '#506020', // pyrolusite — olive
  Mo:  '#3A5068', // molybdenite — dark steel-blue
  W:   '#3A3848', // wolframite — very dark grey
  Ti:  '#7A4028', // rutile — reddish-brown
  V:   '#9A3E18', // vanadinite — red-orange
  // Precious metals
  Au:  '#B07800', // native gold — golden
  Ag:  '#505870', // argentite — dark grey
  Pt:  '#485860', // sperrylite — dark steel
  Pd:  '#4A5C70', // palladite — dark grey-blue
  Rh:  '#3A5460', // rhodite — dark teal-grey
  Ir:  '#485C78', // iridosmine — steel-blue
  Ru:  '#3A4C5A', // laurite — dark blue-grey
  Os:  '#3A4A5C', // osmiridium — darkest blue-grey
  Re:  '#484858', // rhenium — dark grey
  PGM: '#485860', // platinum group — dark steel
  // Battery & energy metals
  Li:  '#2E7D6B', // spodumene / brine — teal
  Co:  '#1E52A0', // cobalt blue — the classic pigment
  // Rare earth elements — mauve family
  REE: '#7A4060', // rare earth elements (Rare Earth Elements)
  La:  '#7A4060', // lanthanum
  Ce:  '#784262', // cerium
  Nd:  '#764464', // neodymium
  Pr:  '#7C4058', // praseodymium
  Sm:  '#724268', // samarium
  Eu:  '#7A3E6A', // europium
  Gd:  '#7C4265', // gadolinium
  Dy:  '#763C60', // dysprosium
  Tb:  '#784060', // terbium
  Y:   '#6A4870', // yttrium
  Sc:  '#685898', // scandium — lavender (REE-adjacent)
  // Technology & specialty metals
  Ta:  '#3A4858', // tantalite — dark navy
  Nb:  '#3A5060', // columbite — dark steel
  In:  '#405878', // indite — dark blue
  Ga:  '#485888', // gallite — blue-grey
  Ge:  '#486068', // argyrodite — grey-teal
  Bi:  '#7A3858', // bismuthinite — dark mauve
  Sb:  '#4A5040', // stibnite — dark grey-olive
  Se:  '#7A3838', // selenium — dark red
  Te:  '#486070', // tellurite — dark teal
  As:  '#4A5840', // arsenopyrite — dark grey-olive
  Hg:  '#9A3020', // cinnabar — vermilion red
  Cd:  '#7A6820', // greenockite — dark yellow
  Zr:  '#4A5C68', // zircon — steel teal
  U:   '#5A6830', // uraninite / pitchblende — dark olive
  // Mineral / non-metallic
  Ba:  '#486068', // barite — grey
  K:   '#8A7050', // sylvite / potash — earthy
  P:   '#7A7038', // apatite — dark yellow-olive
  F:   '#3A6878', // fluorite — deep teal
  // Fallback
  Other: '#505050',
};

function metalColor(metal: string): string {
  return METAL_COLORS[metal] ?? METAL_COLORS.Other;
}

function getTypeVariant(type: string): BadgeVariant {
  switch (type.toLowerCase()) {
    case 'sulfide':   return 'sulfide';
    case 'oxide':     return 'oxide';
    case 'carbonate': return 'carbonate';
    case 'silicate':  return 'silicate';
    case 'native':    return 'native';
    case 'phosphate': return 'phosphate';
    case 'sulfate':   return 'sulfate';
    case 'halide':    return 'halide';
    default:          return 'process';
  }
}

function getFloatVariant(flotation: string): BadgeVariant {
  const f = flotation.toLowerCase();
  if (f.includes('very')) return 'float-vg';
  if (f === 'good')       return 'float-g';
  if (f.includes('mod'))  return 'float-m';
  if (f === 'poor')       return 'float-p';
  return 'float-n';
}

const FLOAT_TIERS: { label: string; tier: FloatTier; key: string }[] = [
  { label: 'Very Good', tier: 'vg', key: 'Very good' },
  { label: 'Good',      tier: 'g',  key: 'Good' },
  { label: 'Moderate',  tier: 'm',  key: 'Moderate' },
  { label: 'Poor',      tier: 'p',  key: 'Poor' },
];

const SORT_OPTIONS = [
  { value: 'name',     label: 'Name' },
  { value: 'sg_min',   label: 'Density (SG)' },
  { value: 'hardness', label: 'Hardness' },
  { value: 'bwi',      label: 'Bond Work Index' },
  { value: 'recovery', label: 'Recovery' },
];

const METAL_ORDER = ['Cu', 'Li', 'Ni', 'Co', 'Au', 'Ag', 'Fe', 'Mn', 'Zn', 'Pb', 'REE', 'Pt', 'PGM', 'Other'];

const SG_REF_COLOR = '#B8B2AE'; // $color-faint — all reference bars share this
const SG_REFERENCES = [
  { label: 'Water',       value: 1.0  },
  { label: 'Quartz',      value: 2.65 },
  { label: 'Avg sulfide', value: 4.2  },
  { label: 'Galena',      value: 7.6  },
  { label: 'Gold',        value: 19.3 },
];

const TABLE_SORT_KEYS = new Set<string>(['name', 'formula', 'type', 'metal', 'grade', 'bwi', 'recovery', 'flotation']);

function getSortValue(m: MineralData, key: string): string | number {
  switch (key) {
    case 'name':      return m.name;
    case 'formula':   return m.formula;
    case 'type':      return m.type;
    case 'metal':     return m.metal;
    case 'grade':     return parseFloat(m.grade) || 0;
    case 'bwi':       return parseFloat(m.bwi) || 0;
    case 'recovery':  return parseFloat(m.recovery) || 0;
    case 'flotation': return m.float_cat || m.flotation || '';
    case 'sg_min':    return parseFloat(m.sg_min) || 0;
    case 'hardness':  return parseFloat(m.hardness) || 0;
    default:          return m.name;
  }
}

type DetailTab = 'props' | 'processing' | 'notes';

export function MineralsPage() {
  const [minerals, setMinerals] = useState<MineralData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetals, setSelectedMetals] = useState<Set<string>>(new Set());
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [selectedFloats, setSelectedFloats] = useState<Set<string>>(new Set());
  const [sgMin, setSgMin] = useState('');
  const [sgMax, setSgMax] = useState('');
  const [searchText, setSearchText] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [view, setView] = useState<ViewMode>('table');
  const [selectedMineral, setSelectedMineral] = useState<MineralData | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('props');
  const [showAllMetals, setShowAllMetals] = useState(false);

  useEffect(() => {
    fetchMinerals()
      .then(setMinerals)
      .catch(() => setError('Failed to load minerals from server.'))
      .finally(() => setLoading(false));
  }, []);

  const metalCounts = useMemo(() => {
    const map: Record<string, number> = {};
    minerals.forEach(m => { const g = m.metal_group || m.metal || 'Other'; map[g] = (map[g] || 0) + 1; });
    return map;
  }, [minerals]);

  const availableMetals = useMemo(() => {
    const known = METAL_ORDER.filter(m => metalCounts[m]);
    const extra = Object.keys(metalCounts).filter(m => !METAL_ORDER.includes(m)).sort();
    return [...known, ...extra];
  }, [metalCounts]);

  const typeCounts = useMemo(() => {
    const map: Record<string, number> = {};
    minerals.forEach(m => { if (m.type) map[m.type] = (map[m.type] || 0) + 1; });
    return map;
  }, [minerals]);

  const availableTypes = useMemo(() => Object.keys(typeCounts).sort(), [typeCounts]);


  const filtered = useMemo(() => {
    let list = minerals;
    if (selectedMetals.size > 0) list = list.filter(m => selectedMetals.has(m.metal_group || m.metal));
    if (selectedTypes.size > 0)  list = list.filter(m => selectedTypes.has(m.type));
    if (selectedFloats.size > 0) list = list.filter(m => selectedFloats.has(m.float_cat));
    if (sgMin) list = list.filter(m => parseFloat(m.sg_min) >= parseFloat(sgMin));
    if (sgMax) list = list.filter(m => parseFloat(m.sg_max) <= parseFloat(sgMax));
    if (searchText) {
      const q = searchText.toLowerCase();
      list = list.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.formula.toLowerCase().includes(q) ||
        m.metal.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      const av = getSortValue(a, sortKey);
      const bv = getSortValue(b, sortKey);
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [minerals, selectedMetals, selectedTypes, selectedFloats, sgMin, sgMax, searchText, sortKey, sortDir]);

  const tableRows: MineralRow[] = useMemo(() =>
    filtered.map((m, i) => ({
      id: i,
      name: m.name,
      formula: m.formula,
      type: m.type,
      typeVariant: getTypeVariant(m.type),
      metal: m.metal,
      metalColor: metalColor(m.metal_group || m.metal),
      grade: m.grade ? `${m.grade}%` : '—',
      bwi: m.bwi ? `${m.bwi} kWh/t` : '—',
      recovery: m.recovery ? `${m.recovery}%` : '—',
      flotation: m.float_cat || m.flotation || '—',
      flotationVariant: m.float_cat ? getFloatVariant(m.float_cat) : undefined,
    })),
    [filtered]
  );

  function toggleMetal(m: string) {
    setSelectedMetals(prev => { const n = new Set(prev); n.has(m) ? n.delete(m) : n.add(m); return n; });
  }
  function toggleType(t: string) {
    setSelectedTypes(prev => { const n = new Set(prev); n.has(t) ? n.delete(t) : n.add(t); return n; });
  }
  function toggleFloat(key: string) {
    setSelectedFloats(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }

  function handleTableSort(key: keyof MineralRow) {
    const k = key as string;
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('asc'); }
  }

  function handleRowClick(row: MineralRow) {
    const mineral = filtered[row.id as number] ?? null;
    setSelectedMineral(mineral);
    setDetailTab('props');
  }

  function handleCardClick(m: MineralData) {
    setSelectedMineral(m);
    setDetailTab('props');
  }

  function clearFilters() {
    setSelectedMetals(new Set());
    setSelectedTypes(new Set());
    setSelectedFloats(new Set());
    setSgMin('');
    setSgMax('');
  }

  const hasFilters = selectedMetals.size > 0 || selectedTypes.size > 0 || selectedFloats.size > 0 || sgMin || sgMax;
  const tableSortKey = TABLE_SORT_KEYS.has(sortKey) ? (sortKey as keyof MineralRow) : undefined;

  const sgComparisons = useMemo(() => {
    if (!selectedMineral) return [];
    const mineralSg = parseFloat(selectedMineral.sg_min) || 0;
    const rows = [
      ...SG_REFERENCES.map(r => ({ label: r.label, value: r.value, max: 20, color: SG_REF_COLOR })),
      { label: 'This mineral', value: mineralSg, max: 20, color: '#C85A0A', highlight: true },
    ];
    return rows.sort((a, b) => a.value - b.value);
  }, [selectedMineral]);

  return (
    <div className="minerals-page">
      <aside className="minerals-page__filters">
        {loading ? <PageLoader variant="filter" /> : (
          <>
            <div className="minerals-page__filter-head">
              <span className="minerals-page__filter-title">Filters</span>
              {hasFilters && (
                <button className="minerals-page__filter-clear" onClick={clearFilters}>Clear all</button>
              )}
            </div>

            <div className="minerals-page__filter-section">
              <div className="minerals-page__filter-label">Metal</div>
              <div className="minerals-page__metal-grid">
                {(showAllMetals ? availableMetals : availableMetals.slice(0, 8)).map(m => (
                  <MetalButton
                    key={m}
                    metal={m}
                    color={metalColor(m)}
                    count={metalCounts[m]}
                    active={selectedMetals.has(m)}
                    onClick={() => toggleMetal(m)}
                  />
                ))}
              </div>
              {availableMetals.length > 8 && (
                <button
                  className="minerals-page__metal-more"
                  onClick={() => setShowAllMetals(v => !v)}
                >
                  {showAllMetals ? 'Show less' : `+${availableMetals.length - 8} more`}
                </button>
              )}
            </div>

            <div className="minerals-page__filter-section">
              <div className="minerals-page__filter-label">Ore Type</div>
              <div className="minerals-page__type-list">
                {availableTypes.map(t => (
                  <Checkbox
                    key={t}
                    label={t}
                    count={typeCounts[t]}
                    checked={selectedTypes.has(t)}
                    onChange={() => toggleType(t)}
                  />
                ))}
              </div>
            </div>

            <div className="minerals-page__filter-section">
              <div className="minerals-page__filter-label">Flotation Response</div>
              <div className="minerals-page__float-tags">
                {FLOAT_TIERS.map(f => (
                  <FloatTag
                    key={f.key}
                    label={f.label}
                    tier={f.tier}
                    active={selectedFloats.has(f.key)}
                    onClick={() => toggleFloat(f.key)}
                  />
                ))}
              </div>
            </div>

            <div className="minerals-page__filter-section">
              <div className="minerals-page__filter-label">SG Range</div>
              <div className="minerals-page__sg-row">
                <input
                  className="minerals-page__sg-input"
                  type="number"
                  placeholder="Min"
                  step="0.1"
                  value={sgMin}
                  onChange={e => setSgMin(e.target.value)}
                />
                <span className="minerals-page__sg-sep">–</span>
                <input
                  className="minerals-page__sg-input"
                  type="number"
                  placeholder="Max"
                  step="0.1"
                  value={sgMax}
                  onChange={e => setSgMax(e.target.value)}
                />
              </div>
            </div>
          </>
        )}
      </aside>

      <div className="minerals-page__main">
        {(loading || error) ? <PageLoader variant="table" rows={8} error={error} /> : <>
        <div className="minerals-page__toolbar">
          <span className="minerals-page__count">
            {filtered.length.toLocaleString()} mineral{filtered.length !== 1 ? 's' : ''}
          </span>
          <input
            className="minerals-page__search"
            type="text"
            placeholder="Search name, formula, metal…"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
          <select
            className="minerals-page__sort-select"
            value={sortKey}
            onChange={e => { setSortKey(e.target.value); setSortDir('asc'); }}
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ViewToggle view={view} onChange={setView} />
        </div>

        <div className="minerals-page__results">
          {view === 'table' ? (
            <MineralTable
              rows={tableRows}
              selectedId={selectedMineral ? tableRows.find(r => r.name === selectedMineral.name)?.id : undefined}
              onRowClick={handleRowClick}
              sortKey={tableSortKey}
              sortDir={sortDir}
              onSort={handleTableSort}
            />
          ) : (
            <div className="minerals-page__card-grid">
              {filtered.map((m, i) => (
                <MineralCard
                  key={i}
                  name={m.name}
                  formula={m.formula}
                  typeColor={metalColor(m.metal_group || m.metal)}
                  chips={[
                    { label: m.metal, color: metalColor(m.metal_group || m.metal) },
                    { label: m.type, color: '#6C6460' },
                  ]}
                  stats={[
                    { label: 'SG', value: m.sg_min === m.sg_max ? m.sg_min : `${m.sg_min}–${m.sg_max}` },
                    { label: 'BWI', value: m.bwi ? `${m.bwi} kWh/t` : '—' },
                    { label: 'Recovery', value: m.recovery ? `${m.recovery}%` : '—' },
                    { label: 'Flotation', value: m.float_cat || m.flotation || '—' },
                  ]}
                  selected={selectedMineral?.name === m.name}
                  onClick={() => handleCardClick(m)}
                />
              ))}
            </div>
          )}
        </div>
        </>}
      </div>

      <aside className="minerals-page__detail">
        {!selectedMineral ? (
          <div className="minerals-page__detail-empty">
            <div className="minerals-page__detail-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3}>
                <polygon points="12 2 22 8 22 16 12 22 2 16 2 8" />
                <line x1="12" y1="2" x2="12" y2="22" />
                <line x1="2" y1="8" x2="22" y2="8" />
                <line x1="2" y1="16" x2="22" y2="16" />
              </svg>
            </div>
            <p className="minerals-page__detail-empty-text">Select a mineral to view details</p>
          </div>
        ) : (
          <>
            <div
              className="minerals-page__detail-stripe"
              style={{ background: metalColor(selectedMineral.metal_group || selectedMineral.metal) }}
            />
            <div className="minerals-page__detail-header">
              <div className="minerals-page__detail-name">{selectedMineral.name}</div>
              <div className="minerals-page__detail-formula">{selectedMineral.formula}</div>
              <div className="minerals-page__detail-chips">
                <Badge variant={getTypeVariant(selectedMineral.type)} label={selectedMineral.type} />
                <span className="minerals-page__detail-metal-chip">
                  <span
                    className="minerals-page__detail-dot"
                    style={{ background: metalColor(selectedMineral.metal_group || selectedMineral.metal) }}
                  />
                  {selectedMineral.metal}
                </span>
              </div>
            </div>

            <div className="minerals-page__detail-tabs">
              {(['props', 'processing', 'notes'] as DetailTab[]).map(tab => (
                <button
                  key={tab}
                  className={`minerals-page__detail-tab ${detailTab === tab ? 'minerals-page__detail-tab--active' : ''}`}
                  onClick={() => setDetailTab(tab)}
                >
                  {tab === 'props' ? 'Properties' : tab === 'processing' ? 'Processing' : 'Notes'}
                </button>
              ))}
            </div>

            <div className="minerals-page__detail-body">
              {detailTab === 'props' && (
                <>
                  <PropGrid properties={[
                    { label: 'Specific Gravity', value: `${selectedMineral.sg_min}–${selectedMineral.sg_max} g/cm³` },
                    { label: 'Hardness (Mohs)',  value: selectedMineral.hardness || '—' },
                    { label: 'Bond Work Index',  value: selectedMineral.bwi ? `${selectedMineral.bwi} kWh/t` : '—' },
                    { label: 'Liberation Size',  value: selectedMineral.lib ? `${selectedMineral.lib} µm` : '—' },
                  ]} />
                  {sgComparisons.length > 0 && (
                    <>
                      <div className="minerals-page__chart-title">Density (SG) in Context</div>
                      <HorizontalBarChart rows={sgComparisons} />
                    </>
                  )}
                </>
              )}

              {detailTab === 'processing' && (
                <>
                  <PropGrid properties={[
                    {
                      label: 'Flotation Response',
                      value: selectedMineral.float_cat || selectedMineral.flotation || '—',
                      status: (() => {
                        const f = (selectedMineral.float_cat || '').toLowerCase();
                        if (f.includes('very') || f === 'good') return 'ok';
                        if (f.includes('mod')) return 'warn';
                        if (f === 'poor') return 'bad';
                        return '';
                      })(),
                    },
                    { label: 'pH Range',  value: selectedMineral.ph || '—' },
                    { label: 'Collector', value: selectedMineral.collector || '—' },
                    {
                      label: 'Recovery',
                      value: selectedMineral.recovery ? `${selectedMineral.recovery}%` : '—',
                      status: (() => {
                        const r = parseFloat(selectedMineral.recovery);
                        if (r >= 85) return 'ok';
                        if (r >= 70) return 'warn';
                        if (r > 0) return 'bad';
                        return '';
                      })(),
                    },
                    { label: 'Grade',     value: selectedMineral.grade ? `${selectedMineral.grade}%` : '—' },
                    { label: 'Leaching',  value: selectedMineral.leach || '—' },
                  ]} />
                </>
              )}

              {detailTab === 'notes' && (
                <p className="minerals-page__detail-notes">
                  {selectedMineral.notes || 'No additional notes available.'}
                </p>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
