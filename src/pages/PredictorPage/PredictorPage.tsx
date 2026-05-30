import { useState, useMemo, useEffect } from 'react';
import type { MineralData as DbMineral } from '../../data/minerals';
import { fetchMinerals } from '../../api/minerals';
import { AiBox } from '../../components/AiBox/AiBox';
import './PredictorPage.scss';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PredictorParams {
  name: string;
  formula: string;
  metal: string;
  libSize: number;
  bwiTypical: number;
  ceilingBase: number;
  ceilingGradeFactor: number;
  pHOptMin: number;
  pHOptMax: number;
  collectorOptMin: number;
  collectorOptMax: number;
  collectorType: string;
  gradeMin: number;
  concGradeTypical: number;
  concGradeRange: string;
  massPullTypical: number;
  processNote: string;
  warningRoute?: boolean;
}

interface ProcState {
  bwi: number;
  libSize: number;
  ph: number;
  collector: string;
  dosage: number;
}

interface Penalty {
  label: string;
  detail: string;
  impact: number;
  severity: 'ok' | 'warn' | 'bad';
}

interface SensRow {
  label: string;
  current: string;
  recommendation: string;
  important: boolean;
}

// ── Lookup tables ─────────────────────────────────────────────────────────────

const CLAY_PENALTY: Record<string, number> = { none:0, kaolinite:3, smectite:9, talc:14 };
const WATER_PENALTY: Record<string, number> = { fresh:0, partial:1.5, full:4 };

// ── DB → predictor param helpers ──────────────────────────────────────────────

function parseNums(s: string): number[] {
  const m = s.match(/\d+(?:\.\d+)?/g);
  return m ? m.map(Number) : [];
}

function parseCollectorKey(collector: string): string {
  const c = collector.toLowerCase();
  if (c.includes('amine')) return 'amine';
  if (c.includes('dtp') || c.includes('dithio')) return 'dtp';
  if (c.includes('sibx')) return 'sibx';
  if (c.includes('sipx')) return 'sipx';
  return 'pax';
}

function collectorFitFor(dbMineral: DbMineral, collector: string): number {
  const primary = parseCollectorKey(dbMineral.collector);
  const c = collector.toLowerCase();
  if (c === primary) return 1.0;
  const sulfides = ['pax', 'sibx', 'sipx', 'dtp'];
  const isSulfidePrimary = sulfides.includes(primary);
  const isSulfideReq    = sulfides.includes(c);
  if (isSulfidePrimary && isSulfideReq) {
    if ((primary === 'pax' && c === 'sibx') || (primary === 'sibx' && c === 'pax')) return 0.95;
    if (c === 'dtp') return 0.90;
    return 0.88;
  }
  return 0.45;
}

function buildParams(m: DbMineral): PredictorParams {
  const bwiNums    = parseNums(m.bwi);
  const bwiTypical = bwiNums.length ? bwiNums.reduce((a, b) => a + b, 0) / bwiNums.length : 14.0;

  const libNums = parseNums(m.lib);
  const libSize = libNums.length ? libNums[0] : 100;

  const phNums   = parseNums(m.ph);
  const pHOptMin = phNums.length >= 2 ? phNums[0] : phNums.length === 1 ? phNums[0] - 0.5 : 9.0;
  const pHOptMax = phNums.length >= 2 ? phNums[1] : phNums.length === 1 ? phNums[0] + 0.5 : 11.0;

  const recNums     = parseNums(m.recovery);
  const ceilingBase = recNums.length ? Math.max(...recNums) : 80;

  const gradeNums        = parseNums(m.grade);
  const concGradeTypical = gradeNums.length >= 2
    ? (gradeNums[0] + gradeNums[1]) / 2
    : gradeNums.length === 1 ? gradeNums[0] : 20;

  const flotLower    = m.flotation.toLowerCase();
  const warningRoute = flotLower.startsWith('poor') || flotLower.startsWith('very poor') ||
                       flotLower === 'n/a' || flotLower === '—';

  const collectorType = parseCollectorKey(m.collector);
  const [collectorOptMin, collectorOptMax] =
    collectorType === 'amine' ? [150, 350] :
    collectorType === 'dtp'   ? [25,  55]  : [30, 60];

  const massPullTypical = concGradeTypical > 5
    ? Math.max(1.5, Math.min(20, 110 / concGradeTypical))
    : 5.0;

  return {
    name: m.name, formula: m.formula,
    metal: m.metal_group || m.metal,
    libSize, bwiTypical, ceilingBase,
    ceilingGradeFactor: warningRoute ? 0.1 : 1.0,
    pHOptMin, pHOptMax, collectorOptMin, collectorOptMax, collectorType,
    gradeMin: m.metal_group === 'Li' ? 0.5 : 0.3,
    concGradeTypical, concGradeRange: m.grade,
    massPullTypical,
    processNote: m.notes || `${m.name} — ${m.flotation} flotation response.`,
    warningRoute: warningRoute || undefined,
  };
}

function oreTypePenalty(type: string, warningRoute: boolean): number {
  const t = type.toLowerCase();
  if (t.includes('sulfide') || t.includes('sulphide') || t.includes('spodumene') || t.includes('free-milling')) return 0;
  if (t === 'native' || t === 'native element') return 3;
  if (t.includes('refractory') || t.includes('telluride') || t.includes('arsenide')) return -12;
  if (t.includes('oxide') || t.includes('carbonate') || t.includes('sulfate') || t.includes('sulphate') || t.includes('chloride') || t.includes('fluoride') || t.includes('selenide')) return warningRoute ? -45 : -5;
  if (t.includes('laterite') || t.includes('bauxite') || t.includes('serpentine') || t.includes('silicate') || t.includes('phyllosilicate') || t.includes('pyroxene') || t.includes('amphibole')) return -20;
  if (t.includes('brine') || t.includes('clay') || t.includes('evaporite') || t.includes('nitrate') || t.includes('zeolite') || t.includes('borate')) return -40;
  if (t.includes('mica') || t.includes('phosphate') || t.includes('feldspar') || t.includes('garnet') || t.includes('vanadate') || t.includes('molybdate') || t.includes('chromate')) return -8;
  if (t.includes('silica') || t.includes('ti-oxide') || t.includes('intermetallic') || t.includes('arsenate')) return -12;
  return 0;
}

function defaultProc(_m: DbMineral, params: PredictorParams): ProcState {
  return {
    bwi:       params.bwiTypical,
    libSize:   params.libSize,
    ph:        Math.round((params.pHOptMin + params.pHOptMax) / 2 * 10),
    collector: params.collectorType,
    dosage:    Math.round((params.collectorOptMin + params.collectorOptMax) / 2),
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

const DEFAULT_PROC: ProcState = { bwi:14.2, libSize:38, ph:110, collector:'pax', dosage:45 };

export function PredictorPage() {
  const [allMinerals,     setAllMinerals]     = useState<DbMineral[]>([]);
  const [mineralsLoading, setMineralsLoading] = useState(true);

  const [oreType, setOreType] = useState('');
  const [mineral, setMineral] = useState('');
  const [proc,    setProc]    = useState<ProcState>(DEFAULT_PROC);

  const [grade,    setGrade]    = useState(1.2);
  const [pyrite,   setPyrite]   = useState(5);
  const [asOre,    setAsOre]    = useState(0.05);
  const [clay,     setClay]     = useState(3);
  const [clayType, setClayType] = useState('none');
  const [grind,    setGrind]    = useState(75);
  const [cleaners, setCleaners] = useState(3);
  const [water,    setWater]    = useState('fresh');
  const [temp,     setTemp]     = useState(25);

  // Fetch on mount — state updates happen in async .then, not synchronously in effect body
  useEffect(() => {
    fetchMinerals()
      .then(data => {
        setAllMinerals(data);
        if (data.length > 0) {
          const first  = data[0];
          const params = buildParams(first);
          setOreType(first.type);
          setMineral(first.name);
          setProc(defaultProc(first, params));
        }
      })
      .catch(() => {})
      .finally(() => setMineralsLoading(false));
  }, []);

  // Ore type change — reset mineral to first of that type + update process defaults
  function handleOreTypeChange(type: string) {
    setOreType(type);
    const first = allMinerals.find(m => m.type === type);
    if (first) {
      setMineral(first.name);
      setProc(defaultProc(first, buildParams(first)));
    }
  }

  // Mineral change — update mineral + process defaults together in an event handler
  function handleMineralChange(name: string) {
    const dbMin = allMinerals.find(m => m.name === name);
    setMineral(name);
    if (dbMin) setProc(defaultProc(dbMin, buildParams(dbMin)));
  }

  // Unique ore types across all minerals
  const oreTypes = useMemo(() =>
    [...new Set(allMinerals.map(m => m.type))].sort(),
  [allMinerals]);

  // Minerals filtered to selected ore type
  const filteredMinerals = useMemo(() =>
    allMinerals.filter(m => m.type === oreType),
  [allMinerals, oreType]);

  // Derived mineral params
  const dbMineral = useMemo(() => allMinerals.find(m => m.name === mineral) ?? null, [allMinerals, mineral]);
  const md        = useMemo(() => dbMineral ? buildParams(dbMineral) : null, [dbMineral]);

  // ── Computation ─────────────────────────────────────────────────────────────

  const result = useMemo(() => {
    if (!md || !dbMineral) return null;

    const { bwi, libSize, ph: phRaw, collector, dosage } = proc;
    const phReal       = phRaw / 10;
    const collectorFit = collectorFitFor(dbMineral, collector);

    // Step 1: Recovery ceiling
    let ceiling = md.ceilingBase;
    if (grade < md.gradeMin) {
      ceiling -= (md.gradeMin - grade) * 8;
    } else {
      ceiling += Math.min((grade - 0.5) * md.ceilingGradeFactor, 4);
    }
    ceiling += oreTypePenalty(oreType, md.warningRoute ?? false);
    if (asOre > 1.0)      ceiling -= 8;
    else if (asOre > 0.5) ceiling -= 4;
    else if (asOre > 0.2) ceiling -= 1.5;
    ceiling = Math.min(98, Math.max(20, ceiling));

    const ceilingDisplay = `${Math.round(ceiling - 4)}–${Math.round(ceiling)}%`;
    const ceilingNote = md.warningRoute
      ? '⚠ Poor flotation mineral — alternative route recommended'
      : grade < md.gradeMin
        ? '↓ Below minimum viable grade — severe penalty'
        : asOre > 0.5
          ? 'Arsenic reduces maximum achievable recovery'
          : 'Based on comparable ore testwork data';
    const ceilingStatus = md.warningRoute ? 'bad' : grade < md.gradeMin ? 'warn' : 'ok';

    // Step 2: Process penalties
    let rec = ceiling;
    const penalties: Penalty[] = [];

    const grindRatio = grind / libSize;
    let grindPenalty = 0;
    if (grindRatio > 4.0) {
      grindPenalty = 18;
      penalties.push({ label:'Grind far too coarse', detail:`P80 ${grind}µm is ${grindRatio.toFixed(1)}× liberation size (${libSize}µm) — liberation severely inadequate`, impact:-grindPenalty, severity:'bad' });
    } else if (grindRatio > 2.5) {
      grindPenalty = 10;
      penalties.push({ label:'Grind too coarse', detail:`P80 ${grind}µm is ${grindRatio.toFixed(1)}× liberation size — insufficient liberation`, impact:-grindPenalty, severity:'warn' });
    } else if (grindRatio > 1.5) {
      grindPenalty = 4;
      penalties.push({ label:'Grind slightly coarse', detail:`P80 ${grind}µm is ${grindRatio.toFixed(1)}× liberation size — moderate liberation`, impact:-grindPenalty, severity:'warn' });
    } else if (grindRatio < 0.5) {
      grindPenalty = -2;
      penalties.push({ label:'Over-grinding', detail:`P80 ${grind}µm is well below liberation size — energy wasted, slimes generation risk`, impact:2, severity:'warn' });
    } else {
      penalties.push({ label:'Grind P80 optimal', detail:`P80 ${grind}µm ≈ ${grindRatio.toFixed(1)}× liberation size — good liberation`, impact:0, severity:'ok' });
    }
    rec -= grindPenalty;

    const bwiDev = bwi - md.bwiTypical;
    let bwiPenalty = 0;
    if (bwiDev > 5) {
      bwiPenalty = 5;
      penalties.push({ label:'Ore much harder than typical', detail:`BWI ${bwi} kWh/t is ${bwiDev.toFixed(1)} above typical (${md.bwiTypical.toFixed(1)}) — mills underperform at target P80, effective liberation worse than modelled`, impact:-bwiPenalty, severity:'warn' });
    } else if (bwiDev > 2) {
      bwiPenalty = 2;
      penalties.push({ label:'Ore harder than typical', detail:`BWI ${bwi} kWh/t slightly above typical (${md.bwiTypical.toFixed(1)}) — minor liberation efficiency loss`, impact:-bwiPenalty, severity:'warn' });
    } else if (bwiDev < -4) {
      bwiPenalty = -2;
      penalties.push({ label:'Soft ore — BWI favourable', detail:`BWI ${bwi} kWh/t well below typical (${md.bwiTypical.toFixed(1)}) — easier grinding, better liberation at target P80`, impact:2, severity:'ok' });
    } else {
      penalties.push({ label:'BWI within typical range', detail:`BWI ${bwi} kWh/t ≈ typical for ${md.name} (${md.bwiTypical.toFixed(1)} kWh/t)`, impact:0, severity:'ok' });
    }
    rec -= bwiPenalty;

    let phPenalty = 0;
    if (phReal < md.pHOptMin - 1.5) {
      phPenalty = 10;
      penalties.push({ label:'pH too low', detail:`pH ${phReal.toFixed(1)} — far below optimal ${md.pHOptMin}–${md.pHOptMax}. Pyrite activation, poor collector adsorption.`, impact:-phPenalty, severity:'bad' });
    } else if (phReal < md.pHOptMin - 0.5) {
      phPenalty = 5;
      penalties.push({ label:'pH slightly low', detail:`pH ${phReal.toFixed(1)} — below optimal window ${md.pHOptMin}–${md.pHOptMax}`, impact:-phPenalty, severity:'warn' });
    } else if (phReal > md.pHOptMax + 1.0) {
      phPenalty = 7;
      penalties.push({ label:'pH too high', detail:`pH ${phReal.toFixed(1)} — above optimal ${md.pHOptMin}–${md.pHOptMax}. Surface oxidation inhibits collector adsorption.`, impact:-phPenalty, severity:'bad' });
    } else if (phReal > md.pHOptMax + 0.3) {
      phPenalty = 3;
      penalties.push({ label:'pH slightly high', detail:`pH ${phReal.toFixed(1)} — above optimal window`, impact:-phPenalty, severity:'warn' });
    } else {
      penalties.push({ label:'pH optimal', detail:`pH ${phReal.toFixed(1)} within optimal window ${md.pHOptMin}–${md.pHOptMax}`, impact:0, severity:'ok' });
    }
    rec -= phPenalty;

    let collectorPenalty = 0;
    if (collectorFit < 0.6) {
      collectorPenalty = 12;
      penalties.push({ label:'Wrong collector type', detail:`${collector.toUpperCase()} has poor selectivity for ${md.name}. Switch to ${md.collectorType.toUpperCase()}.`, impact:-collectorPenalty, severity:'bad' });
    } else if (collectorFit < 0.85) {
      collectorPenalty = 5;
      penalties.push({ label:'Suboptimal collector', detail:`${collector.toUpperCase()} works but ${md.collectorType.toUpperCase()} is better suited for ${md.name}`, impact:-collectorPenalty, severity:'warn' });
    } else {
      penalties.push({ label:'Collector type correct', detail:`${collector.toUpperCase()} is well-suited for ${md.name}`, impact:0, severity:'ok' });
    }
    rec -= collectorPenalty;

    let dosagePenalty = 0;
    if (dosage < md.collectorOptMin * 0.5) {
      dosagePenalty = 10;
      penalties.push({ label:'Collector dosage too low', detail:`${dosage}g/t is well below minimum effective dosage (${md.collectorOptMin}g/t). Insufficient surface coverage.`, impact:-dosagePenalty, severity:'bad' });
    } else if (dosage < md.collectorOptMin) {
      dosagePenalty = 4;
      penalties.push({ label:'Collector dosage low', detail:`${dosage}g/t below optimal range ${md.collectorOptMin}–${md.collectorOptMax}g/t`, impact:-dosagePenalty, severity:'warn' });
    } else if (dosage > md.collectorOptMax * 2) {
      dosagePenalty = 5;
      penalties.push({ label:'Collector overdose', detail:`${dosage}g/t far exceeds optimal — selectivity lost, gangue flotation increases, concentrate grade drops`, impact:-dosagePenalty, severity:'warn' });
    } else if (dosage > md.collectorOptMax) {
      dosagePenalty = 2;
      penalties.push({ label:'Collector dosage high', detail:`${dosage}g/t above optimal range — slight selectivity loss`, impact:-dosagePenalty, severity:'warn' });
    } else {
      penalties.push({ label:'Collector dosage optimal', detail:`${dosage}g/t within optimal range ${md.collectorOptMin}–${md.collectorOptMax}g/t`, impact:0, severity:'ok' });
    }
    rec -= dosagePenalty;

    const clayPen = (CLAY_PENALTY[clayType] ?? 0) * (clay / 10);
    if (clayPen > 5)      penalties.push({ label:'Severe clay impact',   detail:`${clay}% ${clayType} clay — major surface coating and viscosity problem. Desliming cyclones required.`, impact:-Math.round(clayPen), severity:'bad' });
    else if (clayPen > 2) penalties.push({ label:'Moderate clay impact', detail:`${clay}% ${clayType} clay — consider dispersants and desliming`, impact:-Math.round(clayPen), severity:'warn' });
    else if (clayPen > 0) penalties.push({ label:'Minor clay impact',    detail:`${clay}% ${clayType} clay — manageable with standard dispersants`, impact:-Math.round(clayPen), severity:'warn' });
    rec -= clayPen;

    const pyriteInConc = Math.round(pyrite * 1.2);
    let pyriteNote = '';
    if (pyriteInConc > 15)     pyriteNote = `High pyrite (${pyrite}%) will significantly dilute concentrate grade — expect FeS₂ contamination >15% in concentrate.`;
    else if (pyriteInConc > 5) pyriteNote = `Moderate pyrite (${pyrite}%) will report partially to concentrate — 5–12% FeS₂ in concentrate expected.`;

    const cleanerBonus = ({ 1:0, 2:1.5, 3:3, 4:4 } as Record<number, number>)[cleaners] ?? 3;

    const waterPen = WATER_PENALTY[water] ?? 0;
    if (waterPen > 0) {
      penalties.push({ label:`${water === 'full' ? 'Fully' : 'Partially'} recycled water`, detail:'Accumulated ions (Ca²⁺, Mg²⁺, SO₄²⁻) in recycled water can depress flotation and cause frothing issues', impact:-waterPen, severity:'warn' });
    }
    rec -= waterPen;

    let tempPen = 0;
    if (temp < 10) {
      tempPen = 4;
      penalties.push({ label:'Low temperature', detail:`${temp}°C — collector adsorption kinetics significantly slowed below 15°C`, impact:-tempPen, severity:'warn' });
    } else if (temp > 40) {
      tempPen = 3;
      penalties.push({ label:'High temperature', detail:`${temp}°C — frother volatility increases, froth instability risk`, impact:-tempPen, severity:'warn' });
    }
    rec -= tempPen;

    rec = Math.min(ceiling, Math.max(15, rec));
    const recP10 = Math.round(Math.max(15, rec - 5));
    const recP50 = Math.round(rec);
    const recP90 = Math.round(Math.min(ceiling, rec + 3));

    const concGrade = Math.round((md.concGradeTypical * collectorFit * (1 - pyrite * 0.008)) + cleanerBonus);
    const massPull  = parseFloat((md.massPullTypical * (grade / 1.2) * (1 + (dosage - md.collectorOptMin) / md.collectorOptMin * 0.05)).toFixed(1));

    const badCount  = penalties.filter(p => p.severity === 'bad').length;
    const warnCount = penalties.filter(p => p.severity === 'warn').length;
    const okCount   = penalties.filter(p => p.severity === 'ok').length;
    const confidence = badCount >= 2 ? 'Low (±8%)' : badCount === 1 || warnCount >= 3 ? 'Medium (±4%)' : 'High (±2%)';

    const sens: SensRow[] = [
      { label:'Grind P80',       current:`${grind}µm`,           recommendation: grindRatio > 2 ? `Regrind to P80 ${Math.round(libSize * 1.3)}µm → est. +${Math.min(12, Math.round(grindPenalty * 0.7))}% recovery` : 'At good liberation', important: grindRatio > 1.5 },
      { label:'pH',              current:phReal.toFixed(1),      recommendation: phPenalty > 0 ? `Adjust to pH ${((md.pHOptMin + md.pHOptMax) / 2).toFixed(1)} → est. +${Math.round(phPenalty * 0.8)}%` : 'In optimal window', important: phPenalty > 3 },
      { label:'Collector type',  current:collector.toUpperCase(), recommendation: collectorPenalty > 0 ? `Switch to ${md.collectorType.toUpperCase()} → est. +${Math.round(collectorPenalty * 0.9)}%` : 'Correct choice', important: collectorPenalty > 4 },
      { label:'Collector dosage',current:`${dosage}g/t`,         recommendation: dosagePenalty > 0 ? `Adjust to ${Math.round((md.collectorOptMin + md.collectorOptMax) / 2)}g/t → est. +${Math.round(dosagePenalty * 0.8)}%` : 'Optimal dosage', important: dosagePenalty > 3 },
      { label:'Clay / slimes',   current:`${clay}% ${clayType}`, recommendation: clayPen > 4 ? 'Add desliming cyclones + dispersant' : 'Acceptable level', important: clayPen > 4 },
      { label:'Water source',    current:water,                  recommendation: waterPen > 0 ? 'Monitor Ca/Mg levels, consider fresh water bleed' : 'No issues', important: waterPen > 2 },
    ];

    const topConstraint = penalties.find(p => p.severity === 'bad') ?? penalties.find(p => p.severity === 'warn');
    const insightText = md.warningRoute
      ? `${md.name} has poor flotation response. ${md.processNote} Use the Extraction Planner to find the recommended route for this ore type.`
      : topConstraint
        ? `Primary constraint: ${topConstraint.label.toLowerCase()}. ${topConstraint.detail}${topConstraint.impact < -3 ? ` Addressing this single constraint is estimated to recover ${Math.abs(topConstraint.impact)}% of the ${Math.round(ceiling - rec)}% gap between current predicted recovery (${recP50}%) and the theoretical ceiling (${Math.round(ceiling)}%).` : ''} ${md.processNote}`
        : `Parameters are well-optimised for ${md.name} flotation. Predicted recovery of ${recP50}% is ${Math.round(ceiling - recP50)}% below the theoretical ceiling of ${Math.round(ceiling)}% — the remaining gap represents inherent ore variability and mineralogical complexity that cannot be closed by process optimisation alone. ${md.processNote}`;

    return {
      ceiling, ceilingDisplay, ceilingNote, ceilingStatus,
      recP10, recP50, recP90, concGrade, massPull, confidence,
      penalties, pyriteNote, sens, insightText,
      badCount, warnCount, okCount,
      phReal, libSize, md,
    };
  }, [md, dbMineral, proc, oreType, grade, pyrite, asOre, clay, clayType, grind, cleaners, water, temp]);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const SEV_ICON: Record<string, string> = { ok:'✓', warn:'⚠', bad:'✗' };
  const kpiColor = (v: number, good: number, mid: number) =>
    v >= good ? '#1E6B42' : v >= mid ? '#A05A00' : '#B02020';

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="predictor-page">

      <div className="predictor-page__inputs">

        {/* Card 1: Ore fingerprint */}
        <div className="predictor-page__card">
          <div className="predictor-page__card-header">
            <div className="predictor-page__card-icon predictor-page__card-icon--brand">
              <svg width="12" height="12" fill="none" stroke="#fff" strokeWidth={2} viewBox="0 0 24 24">
                <polygon points="12 2 22 8 22 16 12 22 2 16 2 8" />
              </svg>
            </div>
            <h3 className="predictor-page__card-title">Section 1 — Ore fingerprint</h3>
          </div>
          <p className="predictor-page__card-desc">Defines the recovery ceiling — what is physically possible for this ore. Required before process conditions.</p>

          <div className="predictor-page__field">
            <label>Ore type</label>
            <select value={oreType} onChange={e => handleOreTypeChange(e.target.value)} disabled={mineralsLoading}>
              {mineralsLoading
                ? <option>Loading…</option>
                : oreTypes.map(t => <option key={t} value={t}>{t}</option>)
              }
            </select>
          </div>

          <div className="predictor-page__field">
            <label>Primary mineral species</label>
            <select value={mineral} onChange={e => handleMineralChange(e.target.value)} disabled={mineralsLoading || filteredMinerals.length === 0}>
              {mineralsLoading
                ? <option>Loading minerals…</option>
                : filteredMinerals.map(m => (
                    <option key={m.name} value={m.name}>{m.name} ({m.formula}) — {m.metal}</option>
                  ))
              }
            </select>
          </div>

          <div className="predictor-page__grid-2">
            <div className="predictor-page__field predictor-page__field--flush">
              <label>Head grade (%)</label>
              <input type="number" value={grade} min={0.1} max={10} step={0.1} onChange={e => setGrade(parseFloat(e.target.value) || 1.2)} />
            </div>
            <div className="predictor-page__field predictor-page__field--flush">
              <label>Bond work index (kWh/t)</label>
              <input type="number" value={proc.bwi} min={5} max={25} step={0.1} onChange={e => setProc(p => ({ ...p, bwi: parseFloat(e.target.value) || p.bwi }))} />
            </div>
            <div className="predictor-page__field predictor-page__field--flush">
              <label>Liberation size (µm)</label>
              <input type="number" value={proc.libSize} min={10} max={300} step={1} onChange={e => setProc(p => ({ ...p, libSize: parseFloat(e.target.value) || p.libSize }))} />
              <div className="predictor-page__field-hint">From MLA/QEMSCAN or petrographic study</div>
            </div>
          </div>

          <div className="predictor-page__sub-header">Associated minerals (penalty elements)</div>
          <div className="predictor-page__grid-2">
            <div className="predictor-page__field predictor-page__field--flush">
              <label>Pyrite content (%)</label>
              <input type="number" value={pyrite} min={0} max={40} step={0.5} onChange={e => setPyrite(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="predictor-page__field predictor-page__field--flush">
              <label>Arsenic in ore (%)</label>
              <input type="number" value={asOre} min={0} max={5} step={0.05} onChange={e => setAsOre(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="predictor-page__field predictor-page__field--flush">
              <label>Clay / talc content (%)</label>
              <input type="number" value={clay} min={0} max={30} step={0.5} onChange={e => setClay(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="predictor-page__field predictor-page__field--flush">
              <label>Clay type</label>
              <select value={clayType} onChange={e => setClayType(e.target.value)}>
                <option value="none">None / low impact</option>
                <option value="kaolinite">Kaolinite — moderate impact</option>
                <option value="smectite">Smectite — severe impact</option>
                <option value="talc">Talc — very severe (floats naturally)</option>
              </select>
            </div>
          </div>

          {result && (
            <div className={`predictor-page__ceiling predictor-page__ceiling--${result.ceilingStatus}`}>
              <div className="predictor-page__ceiling-label">Recovery ceiling for this ore</div>
              <div className="predictor-page__ceiling-row">
                <div className="predictor-page__ceiling-val">{result.ceilingDisplay}</div>
                <div className="predictor-page__ceiling-note">{result.ceilingNote}</div>
              </div>
            </div>
          )}
        </div>

        {/* Card 2: Process conditions */}
        <div className="predictor-page__card">
          <div className="predictor-page__card-header">
            <div className="predictor-page__card-icon predictor-page__card-icon--blue">
              <svg width="12" height="12" fill="none" stroke="#fff" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4" />
              </svg>
            </div>
            <h3 className="predictor-page__card-title">Section 2 — Process conditions</h3>
          </div>
          <p className="predictor-page__card-desc">How close to the ceiling your operating conditions will get you. Defaults are set from the mineral selected in Section 1.</p>

          <div className="predictor-page__slider-field">
            <label>Grind P80 (µm)<span className="predictor-page__slider-val">{grind}</span></label>
            <input type="range" min={20} max={250} value={grind} onChange={e => setGrind(parseInt(e.target.value))} />
            <div className="predictor-page__slider-labels">
              <span>20 µm</span>
              <span className="predictor-page__slider-marker">Liberation: {result?.libSize ?? proc.libSize} µm ↑</span>
              <span>250 µm</span>
            </div>
          </div>

          <div className="predictor-page__slider-field">
            <label>pH<span className="predictor-page__slider-val">{(proc.ph / 10).toFixed(1)}</span></label>
            <input type="range" min={40} max={130} value={proc.ph} onChange={e => setProc(p => ({ ...p, ph: parseInt(e.target.value) }))} />
            <div className="predictor-page__slider-labels">
              <span>pH 4.0</span>
              <span className="predictor-page__slider-optimal">Optimal: {md?.pHOptMin}–{md?.pHOptMax}</span>
              <span>pH 13.0</span>
            </div>
          </div>

          <div className="predictor-page__grid-2">
            <div className="predictor-page__field predictor-page__field--flush">
              <label>Collector type</label>
              <select value={proc.collector} onChange={e => setProc(p => ({ ...p, collector: e.target.value }))}>
                <option value="pax">PAX (potassium amyl xanthate)</option>
                <option value="sibx">SIBX (sodium isobutyl xanthate)</option>
                <option value="sipx">SIPX (sodium isopropyl xanthate)</option>
                <option value="dtp">DTP (dithiophosphate)</option>
                <option value="amine">Amine (oxide / Li minerals)</option>
              </select>
            </div>
            <div className="predictor-page__field predictor-page__field--flush">
              <label>Collector dosage (g/t)</label>
              <input type="number" value={proc.dosage} min={5} max={500} onChange={e => setProc(p => ({ ...p, dosage: parseFloat(e.target.value) || p.dosage }))} />
              <div className="predictor-page__field-hint">
                Optimal: {md?.collectorOptMin}–{md?.collectorOptMax} g/t for {md?.collectorType.toUpperCase()}
              </div>
            </div>
            <div className="predictor-page__field predictor-page__field--flush">
              <label>Cleaner stages</label>
              <select value={cleaners} onChange={e => setCleaners(parseInt(e.target.value))}>
                <option value={1}>1 cleaner stage</option>
                <option value={2}>2 cleaner stages</option>
                <option value={3}>3 cleaner stages</option>
                <option value={4}>4 cleaner stages</option>
              </select>
            </div>
            <div className="predictor-page__field predictor-page__field--flush">
              <label>Water source</label>
              <select value={water} onChange={e => setWater(e.target.value)}>
                <option value="fresh">Fresh water</option>
                <option value="partial">Partially recycled (&lt;70%)</option>
                <option value="full">Fully recycled (&gt;90%)</option>
              </select>
            </div>
          </div>

          <div className="predictor-page__slider-field">
            <label>Temperature (°C)<span className="predictor-page__slider-val">{temp}</span></label>
            <input type="range" min={5} max={45} value={temp} onChange={e => setTemp(parseInt(e.target.value))} />
            <div className="predictor-page__slider-labels">
              <span>5°C</span>
              <span className="predictor-page__slider-optimal">Optimal: 18–35°C</span>
              <span>45°C</span>
            </div>
          </div>
        </div>
      </div>

      {result && (
        <>
          <div className="predictor-page__kpis">
            <div className="predictor-page__kpi-box">
              <div className="predictor-page__kpi-label">Predicted recovery</div>
              <div className="predictor-page__kpi-val" style={{ color: kpiColor(result.recP50, 82, 70) }}>{result.recP50}%</div>
              <div className="predictor-page__kpi-sub">Range: {result.recP10}–{result.recP90}%</div>
            </div>
            <div className="predictor-page__kpi-box">
              <div className="predictor-page__kpi-label">Concentrate grade</div>
              <div className="predictor-page__kpi-val">{result.concGrade}% {result.md.metal}</div>
              <div className="predictor-page__kpi-sub">Range: {result.md.concGradeRange}</div>
            </div>
            <div className="predictor-page__kpi-box">
              <div className="predictor-page__kpi-label">Mass pull</div>
              <div className="predictor-page__kpi-val">{result.massPull}%</div>
              <div className="predictor-page__kpi-sub">t conc per 100t ore</div>
            </div>
            <div className="predictor-page__kpi-box">
              <div className="predictor-page__kpi-label">Model confidence</div>
              <div className="predictor-page__kpi-val" style={{ color: result.badCount >= 2 ? '#B02020' : result.warnCount >= 2 ? '#A05A00' : '#1E6B42' }}>{result.confidence}</div>
              <div className="predictor-page__kpi-sub">{result.okCount} params optimal</div>
            </div>
          </div>

          <div className="predictor-page__analysis">
            <div className="predictor-page__card predictor-page__card--no-gap">
              <h3 className="predictor-page__analysis-title">Primary constraints</h3>
              <div className="predictor-page__constraints">
                {result.penalties.map((p, i) => (
                  <div key={i} className="predictor-page__constraint-row">
                    <div className={`predictor-page__constraint-icon predictor-page__constraint-icon--${p.severity}`}>
                      {SEV_ICON[p.severity]}
                    </div>
                    <div className="predictor-page__constraint-body">
                      <div className="predictor-page__constraint-label">
                        {p.label}
                        {p.impact !== 0 && (
                          <span className="predictor-page__constraint-impact" style={{ color: p.impact < 0 ? '#B02020' : '#1E6B42' }}>
                            {p.impact > 0 ? '+' : ''}{p.impact}%
                          </span>
                        )}
                      </div>
                      <div className="predictor-page__constraint-detail">{p.detail}</div>
                    </div>
                  </div>
                ))}
                {result.pyriteNote && (
                  <div className="predictor-page__pyrite-note">{result.pyriteNote}</div>
                )}
              </div>
            </div>

            <div className="predictor-page__card predictor-page__card--no-gap">
              <h3 className="predictor-page__analysis-title">Parameter sensitivity</h3>
              <div className="predictor-page__sensitivity">
                {result.sens.map((s, i) => (
                  <div key={i} className="predictor-page__sens-row">
                    <div className="predictor-page__sens-left">
                      <div className="predictor-page__sens-label">{s.label}</div>
                      <div className="predictor-page__sens-current">{s.current}</div>
                    </div>
                    <div className="predictor-page__sens-rec" style={{ color: s.important ? '#C85A0A' : '#8C8480' }}>
                      {s.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="predictor-page__card predictor-page__card--insight">
            <AiBox title="OreBase AI — constraint analysis">
              <p>{result.insightText}</p>
            </AiBox>
          </div>
        </>
      )}
    </div>
  );
}
