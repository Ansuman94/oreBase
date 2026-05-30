import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { ProcessRoute } from '../../data/routes';
import { fetchProcessRoutes } from '../../api/processes';
import { RouteCard } from '../../components/RouteCard/RouteCard';
import './PlannerPage.scss';

// ── Types ─────────────────────────────────────────────────────────────────────

type PlannerTab = 'screen' | 'opex' | 'nsr';

interface ScoredRoute extends ProcessRoute { score: number; suitable: boolean; }

// ── Metal display names ───────────────────────────────────────────────────────

const METAL_LABELS: Record<string, string> = {
  Cu:'Copper', Li:'Lithium', Au:'Gold', Co:'Cobalt', Ni:'Nickel',
  Ag:'Silver', Fe:'Iron', Zn:'Zinc', Pb:'Lead', Mn:'Manganese',
  Mo:'Molybdenum', W:'Tungsten', Sn:'Tin', Ti:'Titanium', V:'Vanadium',
  Pt:'Platinum', PGM:'PGM', REE:'REE', Al:'Aluminium', Cr:'Chromium',
  U:'Uranium', Bi:'Bismuth', Sb:'Antimony', Sc:'Scandium', Y:'Yttrium',
  Nb:'Niobium', Ta:'Tantalum', B:'Boron', Mg:'Magnesium', Si:'Silicon',
  P:'Phosphorus', K:'Potassium', Sr:'Strontium', Ba:'Barium',
  Zr:'Zirconium', Ge:'Germanium', Ga:'Gallium', In:'Indium',
  Se:'Selenium', Te:'Tellurium', Cs:'Caesium', Rb:'Rubidium',
  Hg:'Mercury', Cd:'Cadmium', Re:'Rhenium', Be:'Beryllium',
  C:'Graphite', F:'Fluorite',
};

// ── OPEX lookup tables ────────────────────────────────────────────────────────

const ROUTE_ENERGY: Record<string, number> = {
  flotation: 22, heap: 5.8, pox: 29.9, biox: 3.7, dle: 5.2, cil: 14.2,
};
const ROUTE_WATER: Record<string, number> = {
  flotation: 2.1, heap: 1.3, pox: 2.8, biox: 0.9, dle: 0.3, cil: 1.8,
};
const ROUTE_REAGENTS: Record<string, { xanthate: number; lime: number; acid: number; cyanide: number; flocculant: number }> = {
  flotation: { xanthate: 0.040, lime: 1.8,  acid: 0,    cyanide: 0,    flocculant: 0.02  },
  heap:      { xanthate: 0,     lime: 0,    acid: 8.5,  cyanide: 0,    flocculant: 0     },
  pox:       { xanthate: 0.035, lime: 4.2,  acid: 12,   cyanide: 0,    flocculant: 0.03  },
  biox:      { xanthate: 0,     lime: 0,    acid: 2.2,  cyanide: 0,    flocculant: 0     },
  dle:       { xanthate: 0,     lime: 0.8,  acid: 0,    cyanide: 0,    flocculant: 0     },
  cil:       { xanthate: 0,     lime: 2.4,  acid: 0,    cyanide: 0.35, flocculant: 0.025 },
};
const ROUTE_LABOUR: Record<string, number> = { flotation: 8, heap: 4, pox: 12, biox: 5, dle: 6, cil: 9 };
const ROUTE_MAINT:  Record<string, number> = { flotation: 2.8, heap: 1.2, pox: 4.5, biox: 1.0, dle: 1.8, cil: 2.2 };

const OPEX_BENCHMARKS: Record<string, { label: string; val: number }[]> = {
  flotation: [{ label:'World quartile 1 (low cost)', val:18 }, { label:'World median', val:27 }, { label:'World quartile 3 (high cost)', val:38 }],
  heap:      [{ label:'World quartile 1', val:9  }, { label:'World median', val:14 }, { label:'World quartile 3', val:20 }],
  pox:       [{ label:'World quartile 1', val:28 }, { label:'World median', val:40 }, { label:'World quartile 3', val:55 }],
  biox:      [{ label:'World quartile 1', val:7  }, { label:'World median', val:11 }, { label:'World quartile 3', val:16 }],
  dle:       [{ label:'World quartile 1 (LCE)', val:2800 }, { label:'World median', val:3800 }, { label:'World quartile 3', val:5200 }],
  cil:       [{ label:'World quartile 1', val:15 }, { label:'World median', val:23 }, { label:'World quartile 3', val:34 }],
};

// ── NSR smelter presets ───────────────────────────────────────────────────────

interface SmelterTerms {
  tc: number; rc: number; cuPay: number; auPay: number; agPay: number;
  asThresh: number; pbThresh: number; biThresh: number; moistThresh: number;
}
const SMELTER_TERMS: Record<string, SmelterTerms> = {
  generic:  { tc:80,  rc:8.0, cuPay:96.5, auPay:90, agPay:90, asThresh:0.30, pbThresh:1.0, biThresh:0.06, moistThresh:8 },
  codelco:  { tc:75,  rc:7.5, cuPay:96.5, auPay:90, agPay:90, asThresh:0.20, pbThresh:0.8, biThresh:0.05, moistThresh:8 },
  aurubis:  { tc:68,  rc:6.8, cuPay:96.5, auPay:90, agPay:90, asThresh:0.25, pbThresh:1.0, biThresh:0.06, moistThresh:8 },
  glencore: { tc:72,  rc:7.2, cuPay:96.5, auPay:90, agPay:90, asThresh:0.50, pbThresh:1.5, biThresh:0.10, moistThresh:9 },
  custom:   { tc:80,  rc:8.0, cuPay:96.5, auPay:90, agPay:90, asThresh:0.30, pbThresh:1.0, biThresh:0.06, moistThresh:8 },
};

// ── Category styles ───────────────────────────────────────────────────────────

const CAT_STYLES: Record<string, { color: string; bg: string }> = {
  Pyrometallurgy: { color:'#8A4500', bg:'#FFF0E0' },
  Hydrometallurgy: { color:'#1A4F8A', bg:'#E3ECF7' },
  Emerging:        { color:'#5530A0', bg:'#F0EAFF' },
  Combined:        { color:'#1E6B42', bg:'#E3F0EA' },
};

function getCo2Style(co2: string): { color: string; bg: string } {
  if (co2 === 'High')               return { color:'#8A4500', bg:'#FFF0E0' };
  if (co2 === 'Low' || co2 === 'Very low') return { color:'#1E6B42', bg:'#E3F0EA' };
  return { color:'#1A4F8A', bg:'#E3ECF7' };
}

function scoreRoute(r: ProcessRoute, oreType: string, grain: string, hasAs: boolean, ws: boolean, lowco2: boolean): number {
  const n = r.name.toLowerCase();
  let s = r.recoveryNum;
  if (r.oreType !== oreType) s -= 35;
  if (grain.includes('Fine') && (n.includes('heap leach') || n.includes('dump leach') || n.includes('in-situ'))) s -= 12;
  if (hasAs && n.includes('heap leach') && !n.includes('pox') && !n.includes('biox') && !n.includes('roast')) s -= 15;
  if (ws && (n.includes('hpal') || n.includes('rkef') || n.includes('smelt') || n.includes('pox'))) s -= 10;
  if (lowco2 && r.co2 === 'High') s -= 8;
  if (lowco2 && (r.co2 === 'Very low' || r.co2 === 'Low')) s += 5;
  return s;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PlannerPage() {
  const location = useLocation();
  const navigate  = useNavigate();
  const [tab, setTab] = useState<PlannerTab>('screen');

  // Tab 1: Route screener — live data
  const [allRoutes,     setAllRoutes]     = useState<ProcessRoute[]>([]);
  const [routesLoading, setRoutesLoading] = useState(true);
  const [srMetal,     setSrMetal]     = useState('Cu');
  const [srOreType,   setSrOreType]   = useState('');
  const [srGrade,     setSrGrade]     = useState('High (>1.5%)');
  const [srGrain,     setSrGrain]     = useState('Coarse (>150 µm)');
  const [srRegion,    setSrRegion]    = useState('Sub-Saharan Africa');
  const [srScale,     setSrScale]     = useState('');
  const [srAs,        setSrAs]        = useState(false);
  const [srClay,      setSrClay]      = useState(false);
  const [srWater,     setSrWater]     = useState(false);
  const [srCo2,       setSrCo2]       = useState(false);
  const [screenResults, setScreenResults] = useState<ScoredRoute[] | null>(null);
  const [screenMods,    setScreenMods]    = useState<string[]>([]);
  const [screenLabel,   setScreenLabel]   = useState('');

  // Tab 2: OPEX calculator
  const [opxRoute,    setOpxRoute]    = useState('flotation');
  const [opxTpd,      setOpxTpd]      = useState(5000);
  const [opxGrade,    setOpxGrade]    = useState(1.2);
  const [opxRec,      setOpxRec]      = useState(87);
  const [opxPower,    setOpxPower]    = useState(6);    // slider 2-18, /100 = $/kWh
  const [opxWater,    setOpxWater]    = useState(5);    // slider 0-20, /10 = $/m³
  const [opxLabour,   setOpxLabour]   = useState(10);   // slider 3-25, /10 = multiplier
  const [opxXan,      setOpxXan]      = useState(1800);
  const [opxLime,     setOpxLime]     = useState(120);
  const [opxAcid,      setOpxAcid]      = useState(110);
  const [opxCyanide,   setOpxCyanide]   = useState(1800);
  const [opxFlocculant,setOpxFlocculant]= useState(2200);
  const [opxFreight,   setOpxFreight]   = useState(0);
  const [opxAsConc,   setOpxAsConc]   = useState(0.0);
  const [opxAsThresh, setOpxAsThresh] = useState(0.3);
  const [opxDone,     setOpxDone]     = useState(false);

  // Tab 3: NSR calculator
  const [nsrConcCu,   setNsrConcCu]   = useState(28);
  const [nsrConcAu,   setNsrConcAu]   = useState(2.5);
  const [nsrConcAg,   setNsrConcAg]   = useState(45);
  const [nsrConcAs,   setNsrConcAs]   = useState(0.15);
  const [nsrConcPb,   setNsrConcPb]   = useState(0.3);
  const [nsrConcBi,   setNsrConcBi]   = useState(0.02);
  const [nsrMoisture, setNsrMoisture] = useState(8);
  const [nsrSmelter,  setNsrSmelter]  = useState('generic');
  const [nsrTc,       setNsrTc]       = useState(80);
  const [nsrRc,       setNsrRc]       = useState(8.0);
  const [nsrCuPay,    setNsrCuPay]    = useState(96.5);
  const [nsrAuPay,    setNsrAuPay]    = useState(90);
  const [nsrAgPay,    setNsrAgPay]    = useState(90);
  const [nsrCuPrice,  setNsrCuPrice]  = useState(9200);
  const [nsrAuPrice,  setNsrAuPrice]  = useState(2300);
  const [nsrAgPrice,  setNsrAgPrice]  = useState(28);
  const [nsrHeadCu,   setNsrHeadCu]   = useState(1.2);
  const [nsrRecovery, setNsrRecovery] = useState(87);
  const [nsrMassPull, setNsrMassPull] = useState(4.3);
  const [nsrFreight,  setNsrFreight]  = useState(35);
  const [nsrDone,     setNsrDone]     = useState(false);

  // Fetch process routes on mount
  useEffect(() => {
    fetchProcessRoutes()
      .then(setAllRoutes)
      .finally(() => setRoutesLoading(false));
  }, []);

  // Pre-select metal + ore type when navigated from mineral detail
  useEffect(() => {
    const state = location.state as { metal?: string; oreType?: string } | null;
    if (!state?.metal) return;
    navigate(location.pathname, { replace: true, state: null });
    const t = setTimeout(() => {
      setSrMetal(state.metal!);
      if (state.oreType) setSrOreType(state.oreType);
    }, 0);
    return () => clearTimeout(t);
  }, [location.state, location.pathname, navigate]);

  // Derived metal + ore-type options from live data
  const availableMetals = useMemo(() => {
    return [...new Set(allRoutes.map(r => r.metal).filter(Boolean))].sort();
  }, [allRoutes]);

  const availableOreTypes = useMemo(() => {
    return [...new Set(
      allRoutes.filter(r => r.metal === srMetal).map(r => r.oreType).filter(Boolean)
    )].sort();
  }, [allRoutes, srMetal]);

  // Sync ore type when metal changes or data first loads
  useEffect(() => {
    if (availableOreTypes.length > 0 && !availableOreTypes.includes(srOreType)) {
      setSrOreType(availableOreTypes[0]);
    }
  }, [availableOreTypes, srOreType]);

  // Sync smelter presets to form fields
  useEffect(() => {
    if (nsrSmelter !== 'custom') {
      const t = SMELTER_TERMS[nsrSmelter];
      setNsrTc(t.tc);
      setNsrRc(t.rc);
      setNsrCuPay(t.cuPay);
      setNsrAuPay(t.auPay);
      setNsrAgPay(t.agPay);
    }
  }, [nsrSmelter]);

  // ── OPEX computation ──────────────────────────────────────────────────────

  const opxResult = useMemo(() => {
    const powerRate = opxPower / 100;
    const waterRate = opxWater / 10;
    const labIdx    = opxLabour / 10;
    const totalKwh  = ROUTE_ENERGY[opxRoute] ?? 15;
    const energyCost = totalKwh * powerRate;
    const waterCost  = (ROUTE_WATER[opxRoute] ?? 2) * waterRate;
    const rg = ROUTE_REAGENTS[opxRoute] ?? { xanthate:0, lime:0, acid:0, cyanide:0, flocculant:0 };
    const reagentCostPerT = (
      rg.xanthate   * opxXan +
      rg.lime       * opxLime +
      rg.acid       * opxAcid +
      rg.cyanide    * opxCyanide +
      rg.flocculant * opxFlocculant
    ) / 1000;
    const labPerT   = (ROUTE_LABOUR[opxRoute] ?? 8) * labIdx * 80000 / (opxTpd * 365);
    const maintPerT = (ROUTE_MAINT[opxRoute]  ?? 2.5) * labIdx;

    let asPenaltyPerT = 0;
    let asPenNote = 'Enter As% to calculate penalty';
    if (opxAsConc > opxAsThresh) {
      const excessAs   = opxAsConc - opxAsThresh;
      const massPullPct = opxGrade * (opxRec / 100) / 0.28 * 100;
      const concPerOre  = massPullPct / 100;
      const penPerDmt   = (excessAs / 0.1) * 3.0;
      asPenaltyPerT = penPerDmt * concPerOre;
      asPenNote = `Penalty: $${((opxAsConc - opxAsThresh) / 0.1 * 3).toFixed(1)}/dmt conc above threshold`;
    } else if (opxAsConc > 0) {
      asPenNote = `As ${opxAsConc}% is below threshold — no penalty`;
    }

    const freightMult = 1 + opxFreight / 100;
    const baseCost  = energyCost + waterCost + reagentCostPerT + labPerT + maintPerT + asPenaltyPerT;
    const totalPerT = baseCost * freightMult;
    const cuPerT    = opxGrade / 100 * opxRec / 100;
    const totalPerKgCu = cuPerT > 0 ? totalPerT / cuPerT : 0;

    const breakdown: { label: string; val: number; bar: string }[] = [
      { label:'Energy (grinding, pumps, smelting)',      val: energyCost,             bar:'#E8941A' },
      { label:'Reagents (xanthate, lime, acid, cyanide)', val: reagentCostPerT,       bar:'#1A8A4A' },
      { label:'Labour (operating, supervision)',          val: labPerT,               bar:'#1A4F8A' },
      { label:'Water',                                   val: waterCost,              bar:'#4A8AB0' },
      { label:'Maintenance & spares',                    val: maintPerT,              bar:'#8A4AB0' },
      { label:'Arsenic penalty',                         val: asPenaltyPerT,          bar:'#C83A0A' },
      { label:'Freight premium',                         val: baseCost * (opxFreight / 100), bar:'#6A6A6A' },
    ].filter(r => r.val > 0);

    const powerSteps = [2,3,4,5,6,7,8,10,12,14,16,18];
    const powerOPEX = powerSteps.map(p => {
      const ec = totalKwh * (p / 100);
      return baseCost - energyCost + ec;
    });

    return { totalPerT, totalPerKgCu, energyCost, totalKwh, breakdown, powerSteps, powerOPEX, asPenNote, tpd: opxTpd, route: opxRoute };
  }, [opxRoute, opxTpd, opxGrade, opxRec, opxPower, opxWater, opxLabour, opxXan, opxLime, opxAcid, opxCyanide, opxFlocculant, opxFreight, opxAsConc, opxAsThresh]);

  // ── NSR computation ───────────────────────────────────────────────────────

  const nsrResult = useMemo(() => {
    const terms      = SMELTER_TERMS[nsrSmelter] ?? SMELTER_TERMS.generic;
    const dryFactor  = (100 - nsrMoisture) / 100;
    const concPerOre = nsrMassPull / 100;
    const concPerOreDry = concPerOre * dryFactor;

    const cuGrossPerDmt = (nsrConcCu / 100) * (nsrCuPay / 100) * nsrCuPrice * 1000 / 1000;
    const auGrossPerDmt = (nsrConcAu / 31.1035) * (nsrAuPay / 100) * nsrAuPrice;
    const agGrossPerDmt = (nsrConcAg / 31.1035) * (nsrAgPay / 100) * nsrAgPrice;
    const grossPerDmt   = cuGrossPerDmt + auGrossPerDmt + agGrossPerDmt;

    const tcDeduct = nsrTc;
    const payableCuLbs = (nsrConcCu / 100) * (nsrCuPay / 100) * 1000 * 2.20462;
    const rcDeduct     = (nsrRc / 100) * payableCuLbs;

    const asPenPerDmt    = nsrConcAs > terms.asThresh    ? Math.round((nsrConcAs - terms.asThresh) / 0.1) * 3 : 0;
    const pbPenPerDmt    = nsrConcPb > terms.pbThresh    ? Math.round((nsrConcPb - terms.pbThresh) / 0.1) * 1 : 0;
    const biPenPerDmt    = nsrConcBi > terms.biThresh    ? Math.round((nsrConcBi - terms.biThresh) / 0.01) * 2 : 0;
    const moistPenPerDmt = nsrMoisture > terms.moistThresh ? (nsrMoisture - terms.moistThresh) * 1.5 : 0;
    const totalPenPerDmt = asPenPerDmt + pbPenPerDmt + biPenPerDmt + moistPenPerDmt;

    const netPerDmt  = grossPerDmt - tcDeduct - rcDeduct - totalPenPerDmt - nsrFreight;
    const nsrPerOre  = netPerDmt * concPerOreDry;

    const waterfall: { label: string; val: number; color: string; sign: number }[] = [
      { label:'Gross Cu value',         val: cuGrossPerDmt,  color:'#1E6B42', sign: 1 },
      { label:'Gross Au value',         val: auGrossPerDmt,  color:'#1E6B42', sign: 1 },
      { label:'Gross Ag value',         val: agGrossPerDmt,  color:'#1E6B42', sign: 1 },
      { label:'Treatment charge (TC)',  val: tcDeduct,       color:'#B02020', sign: -1 },
      { label:'Refining charge (RC)',   val: rcDeduct,       color:'#B02020', sign: -1 },
      { label:'As penalty',            val: asPenPerDmt,    color:'#A05A00', sign: -1 },
      { label:'Pb penalty',            val: pbPenPerDmt,    color:'#A05A00', sign: -1 },
      { label:'Bi penalty',            val: biPenPerDmt,    color:'#A05A00', sign: -1 },
      { label:'Moisture penalty',      val: moistPenPerDmt, color:'#A05A00', sign: -1 },
      { label:'Freight to port',       val: nsrFreight,     color:'#B02020', sign: -1 },
    ].filter(r => r.val > 0.1);

    const penalties = [
      { el:'As',       actual: nsrConcAs,   thresh: terms.asThresh,    pen: asPenPerDmt,    unit:'% · $3/dmt per 0.1% above threshold' },
      { el:'Pb',       actual: nsrConcPb,   thresh: terms.pbThresh,    pen: pbPenPerDmt,    unit:'% · $1/dmt per 0.1% above threshold' },
      { el:'Bi',       actual: nsrConcBi,   thresh: terms.biThresh,    pen: biPenPerDmt,    unit:'% · $2/dmt per 0.01% above threshold' },
      { el:'Moisture', actual: nsrMoisture, thresh: terms.moistThresh, pen: moistPenPerDmt, unit:'% · $1.5/dmt per 1% above threshold' },
    ];

    const cuPrices    = [6000, 7000, 8000, 9000, 10000, 11000, 12000, 13000, 14000];
    const nsrAtPrice  = cuPrices.map(p => {
      const cuG = (nsrConcCu / 100) * (nsrCuPay / 100) * p * 1000 / 1000;
      const net = cuG + auGrossPerDmt + agGrossPerDmt - tcDeduct - rcDeduct - totalPenPerDmt - nsrFreight;
      return net * concPerOreDry;
    });

    return {
      nsrPerOre, netPerDmt, grossPerDmt, tcDeduct, rcDeduct, totalPenPerDmt,
      waterfall, penalties, cuPrices, nsrAtPrice, nsrCuPrice,
    };
  }, [nsrConcCu, nsrConcAu, nsrConcAg, nsrConcAs, nsrConcPb, nsrConcBi, nsrMoisture,
      nsrSmelter, nsrTc, nsrRc, nsrCuPay, nsrAuPay, nsrAgPay,
      nsrCuPrice, nsrAuPrice, nsrAgPrice, nsrHeadCu, nsrRecovery, nsrMassPull, nsrFreight]);

  // ── Route screener handler ────────────────────────────────────────────────

  function handleRunScreener() {
    const metalRoutes = allRoutes.filter(r => r.metal === srMetal);
    const scored: ScoredRoute[] = metalRoutes
      .map(r => ({
        ...r,
        score: scoreRoute(r, srOreType, srGrain, srAs, srWater, srCo2),
        suitable: r.oreType === srOreType,
      }))
      .sort((a, b) => b.score - a.score);

    const mods: string[] = [];
    if (srGrain.includes('Fine')) mods.push('Fine grain detected — add IsaMill/tower mill regrind stage to achieve target liberation P80. Adds ~$2–4/t OPEX.');
    if (srAs)    mods.push('High arsenic — POX or fluidised bed roasting required to fix As as stable ferric arsenate. Roasting adds $8–15/t; POX adds $18–28/t.');
    if (srClay)  mods.push('High clay — insert desliming cyclones upstream of flotation. Use viscosity-reducing grinding aid. Expect 3–5% recovery penalty without desliming.');
    if (srWater) mods.push('Water scarcity — closed-circuit reclaim targeting >92%. Dry-stack tailings strongly recommended. Avoid water-intensive POX route.');
    if (srCo2)   mods.push('Low CO₂ priority — penalises high-CO₂ routes in scoring. Evaluate renewable energy for grinding circuits; H₂-fired smelting for Cu/Ni.');

    const metalLabel = METAL_LABELS[srMetal] ?? srMetal;
    const directMatch = scored.filter(r => r.suitable).length;
    setScreenLabel(`${metalLabel} extraction · ${srOreType} · ${srGrade} · ${srGrain} · ${directMatch} direct match · ${metalRoutes.length} total routes`);
    setScreenMods(mods);
    setScreenResults(scored);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const tabLabels: Record<PlannerTab, string> = {
    screen: 'Route screener',
    opex:   'OPEX calculator',
    nsr:    'NSR calculator',
  };

  return (
    <div className="planner-page">

      {/* Tab bar */}
      <div className="planner-page__tabbar">
        {(['screen', 'opex', 'nsr'] as PlannerTab[]).map(t => (
          <button
            key={t}
            className={`planner-page__tab ${tab === t ? 'planner-page__tab--active' : ''}`}
            onClick={() => setTab(t)}
          >
            {tabLabels[t]}
          </button>
        ))}
      </div>

      <div className="planner-page__content">

        {/* ── TAB 1: Route screener ─────────────────────────────────────── */}
        {tab === 'screen' && (
          <>
            <div className="planner-page__form">
              <h3 className="planner-page__form-title">Ore fingerprint — route screener</h3>
              <p className="planner-page__form-desc">Narrows all viable process routes for your ore type. Use as a first-pass filter before OPEX and NSR analysis.</p>
              <div className="planner-page__grid">
                <div className="planner-page__field">
                  <label>Primary metal</label>
                  <select value={srMetal} onChange={e => setSrMetal(e.target.value)} disabled={routesLoading}>
                    {availableMetals.map(m => (
                      <option key={m} value={m}>{METAL_LABELS[m] ? `${METAL_LABELS[m]} (${m})` : m}</option>
                    ))}
                  </select>
                </div>
                <div className="planner-page__field">
                  <label>Ore type</label>
                  <select value={srOreType} onChange={e => setSrOreType(e.target.value)} disabled={routesLoading}>
                    {availableOreTypes.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="planner-page__field">
                  <label>Head grade</label>
                  <select value={srGrade} onChange={e => setSrGrade(e.target.value)}>
                    <option>High (&gt;1.5%)</option>
                    <option>Medium (0.5–1.5%)</option>
                    <option>Low (&lt;0.5%)</option>
                  </select>
                </div>
                <div className="planner-page__field">
                  <label>Grain size</label>
                  <select value={srGrain} onChange={e => setSrGrain(e.target.value)}>
                    <option>Coarse (&gt;150 µm)</option>
                    <option>Medium (75–150 µm)</option>
                    <option>Fine (&lt;75 µm)</option>
                  </select>
                </div>
                <div className="planner-page__field">
                  <label>Region / climate</label>
                  <select value={srRegion} onChange={e => setSrRegion(e.target.value)}>
                    {['Sub-Saharan Africa','South America — arid','Australia','Central Asia','Other'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="planner-page__field">
                  <label>Scale (Mt/yr)</label>
                  <input type="text" placeholder="e.g. 5" value={srScale} onChange={e => setSrScale(e.target.value)} />
                </div>
              </div>
              <div className="planner-page__mods">
                {([
                  ['High arsenic',    srAs,        setSrAs],
                  ['High clay',       srClay,      setSrClay],
                  ['Water scarcity',  srWater,     setSrWater],
                  ['Low CO₂ priority',srCo2,       setSrCo2],
                ] as [string, boolean, (v: boolean) => void][]).map(([label, val, set]) => (
                  <label key={label} className="planner-page__mod">
                    <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} />
                    {label}
                  </label>
                ))}
              </div>
              <button className="planner-page__run" onClick={handleRunScreener}>
                <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                Generate all routes
              </button>
            </div>

            {screenResults && (
              <div className="planner-page__screener-out">
                <div className="planner-page__screener-header">
                  <div>
                    <div className="planner-page__screener-header-title">{screenLabel.split(' · ')[0]}</div>
                    <div className="planner-page__screener-header-sub">{screenLabel.split(' · ').slice(1).join(' · ')}</div>
                  </div>
                  <div className="planner-page__screener-header-note">Ranked by recovery + ore-fit score</div>
                </div>
                <div className="planner-page__screener-body">
                  {screenMods.length > 0 && (
                    <div className="planner-page__mod-box">
                      <div className="planner-page__mod-box-title">⚠ Modifications for your ore profile</div>
                      {screenMods.map((m, i) => (
                        <div key={i} className="planner-page__mod-item">• {m}</div>
                      ))}
                    </div>
                  )}
                  {screenResults.map(r => {
                    const isRec    = screenResults.filter(x => x.suitable)[0]?.id === r.id;
                    const catStyle = CAT_STYLES[r.category] ?? CAT_STYLES.Hydrometallurgy;
                    const co2Style = getCo2Style(r.co2);
                    return (
                      <RouteCard
                        key={r.id}
                        name={r.name}
                        subtitle={`${r.oreType} · ${r.category}`}
                        recommended={isRec}
                        badge={
                          <>
                            <span className="planner-page__cat-badge" style={{ color: catStyle.color, background: catStyle.bg }}>{r.category}</span>
                            {!isRec && (
                              <span className={`planner-page__suit-badge planner-page__suit-badge--${r.suitable ? 'ok' : 'bad'}`}>
                                {r.suitable ? 'Suitable' : 'Not recommended'}
                              </span>
                            )}
                          </>
                        }
                        metrics={[
                          { label:'Recovery', value: r.recovery, highlight: isRec },
                          { label:'OPEX',     value: r.opex },
                          { label:'Energy',   value: r.energy },
                          { label:'Water',    value: r.water },
                          { label:'Capex',    value: r.capex },
                        ]}
                        stages={r.stages}
                        pros={r.pros}
                        cons={r.cons}
                        co2={r.co2}
                        co2Color={co2Style.color}
                        co2Bg={co2Style.bg}
                      />
                    );
                  })}
                  <div className="planner-page__score-note">
                    Routes ranked by composite score: recovery × ore-type suitability × penalty modifiers (fine grain, high arsenic, water scarcity, CO₂ target).
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── TAB 2: OPEX calculator ────────────────────────────────────── */}
        {tab === 'opex' && (
          <>
            <div className="planner-page__form">
              <h3 className="planner-page__form-title">OPEX calculator — real arithmetic from your site inputs</h3>
              <p className="planner-page__form-desc">Enter your actual project parameters. OPEX is calculated from first principles — not lookup tables. Change any input to see costs update instantly.</p>

              <div className="planner-page__cols-3">
                {/* Col 1: Ore & process */}
                <div>
                  <div className="planner-page__col-header">Ore &amp; process</div>
                  <div className="planner-page__field">
                    <label>Process route</label>
                    <select value={opxRoute} onChange={e => setOpxRoute(e.target.value)}>
                      <option value="flotation">Flotation + smelting (Cu sulfide)</option>
                      <option value="heap">Heap leach SX-EW (Cu oxide)</option>
                      <option value="pox">Pressure oxidation + leach</option>
                      <option value="biox">Bioleaching (low grade sulfide)</option>
                      <option value="dle">Direct lithium extraction (brine)</option>
                      <option value="cil">CIL cyanidation (gold)</option>
                    </select>
                  </div>
                  <div className="planner-page__field">
                    <label>Throughput (tpd ore)</label>
                    <input type="number" value={opxTpd} min={100} max={100000} onChange={e => setOpxTpd(parseFloat(e.target.value) || 5000)} />
                  </div>
                  <div className="planner-page__field">
                    <label>Head grade (%)</label>
                    <input type="number" value={opxGrade} min={0.1} max={10} step={0.1} onChange={e => setOpxGrade(parseFloat(e.target.value) || 1.2)} />
                  </div>
                  <div className="planner-page__field">
                    <label>Recovery (%)</label>
                    <input type="number" value={opxRec} min={40} max={98} onChange={e => setOpxRec(parseFloat(e.target.value) || 87)} />
                  </div>
                </div>

                {/* Col 2: Site costs */}
                <div>
                  <div className="planner-page__col-header">Site costs</div>
                  <div className="planner-page__field">
                    <label>Power cost ($/kWh) <span className="planner-page__range-val">${(opxPower / 100).toFixed(2)}</span></label>
                    <input type="range" min={2} max={18} value={opxPower} onChange={e => setOpxPower(parseInt(e.target.value))} />
                    <div className="planner-page__range-labels"><span>$0.02 (hydro)</span><span>$0.18 (diesel)</span></div>
                  </div>
                  <div className="planner-page__field">
                    <label>Water cost ($/m³) <span className="planner-page__range-val">${(opxWater / 10).toFixed(2)}</span></label>
                    <input type="range" min={0} max={20} value={opxWater} onChange={e => setOpxWater(parseInt(e.target.value))} />
                    <div className="planner-page__range-labels"><span>$0.00</span><span>$2.00/m³</span></div>
                  </div>
                  <div className="planner-page__field">
                    <label>Labour index <span className="planner-page__range-val">{(opxLabour / 10).toFixed(1)}×</span></label>
                    <input type="range" min={3} max={25} value={opxLabour} onChange={e => setOpxLabour(parseInt(e.target.value))} />
                    <div className="planner-page__range-labels"><span>0.3× (DRC)</span><span>2.5× (Australia)</span></div>
                  </div>
                </div>

                {/* Col 3: Reagents & freight */}
                <div>
                  <div className="planner-page__col-header">Reagents &amp; freight</div>
                  <div className="planner-page__field">
                    <label>Xanthate price ($/t) <span className="planner-page__range-val">${opxXan.toLocaleString()}</span></label>
                    <input type="range" min={800} max={3500} step={50} value={opxXan} onChange={e => setOpxXan(parseInt(e.target.value))} />
                  </div>
                  <div className="planner-page__field">
                    <label>Lime price ($/t) <span className="planner-page__range-val">${opxLime}</span></label>
                    <input type="range" min={60} max={300} step={5} value={opxLime} onChange={e => setOpxLime(parseInt(e.target.value))} />
                  </div>
                  <div className="planner-page__field">
                    <label>H₂SO₄ price ($/t) <span className="planner-page__range-val">${opxAcid}</span></label>
                    <input type="range" min={40} max={250} step={5} value={opxAcid} onChange={e => setOpxAcid(parseInt(e.target.value))} />
                  </div>
                  <div className="planner-page__field">
                    <label>NaCN price ($/t) <span className="planner-page__range-val">${opxCyanide.toLocaleString()}</span></label>
                    <input type="range" min={1200} max={3000} step={50} value={opxCyanide} onChange={e => setOpxCyanide(parseInt(e.target.value))} />
                  </div>
                  <div className="planner-page__field">
                    <label>Flocculant price ($/t) <span className="planner-page__range-val">${opxFlocculant.toLocaleString()}</span></label>
                    <input type="range" min={1500} max={4000} step={50} value={opxFlocculant} onChange={e => setOpxFlocculant(parseInt(e.target.value))} />
                  </div>
                  <div className="planner-page__field">
                    <label>Freight premium (%)</label>
                    <select value={String(opxFreight)} onChange={e => setOpxFreight(parseInt(e.target.value))}>
                      <option value="0">0% — port access</option>
                      <option value="15">+15% — 200 km to port</option>
                      <option value="35">+35% — 500 km remote</option>
                      <option value="70">+70% — very remote (&gt;1,000 km)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Arsenic penalty box */}
              <div className="planner-page__penalty-box">
                <div className="planner-page__penalty-box-title">Arsenic penalty modifier</div>
                <div className="planner-page__cols-3 planner-page__cols-3--flush">
                  <div className="planner-page__field">
                    <label>Arsenic in concentrate (%)</label>
                    <input type="number" value={opxAsConc} min={0} max={8} step={0.1} onChange={e => setOpxAsConc(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="planner-page__field">
                    <label>As threshold at smelter (%)</label>
                    <input type="number" value={opxAsThresh} min={0.1} max={1.0} step={0.05} onChange={e => setOpxAsThresh(parseFloat(e.target.value) || 0.3)} />
                  </div>
                  <div className="planner-page__as-note">{opxResult.asPenNote}</div>
                </div>
              </div>

              <button className="planner-page__run" onClick={() => setOpxDone(true)}>
                <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                Calculate OPEX
              </button>
            </div>

            {/* OPEX results */}
            {opxDone && (() => {
              const r = opxResult;
              const maxBar = Math.max(...r.breakdown.map(b => b.val), 0.01);
              const benchmarks = OPEX_BENCHMARKS[r.route] ?? OPEX_BENCHMARKS.flotation;
              const compareVal = r.route === 'dle' ? r.totalPerT * 800 : r.totalPerT;
              const bmMax = (benchmarks[benchmarks.length - 1]?.val ?? 1) * 1.2;
              const powerMax = Math.max(...r.powerOPEX, 0.01);
              const kpis = [
                { label:'OPEX per tonne ore',   val:`$${r.totalPerT.toFixed(2)}`,                              sub:'$/t ore processed',                       color: r.totalPerT > 40 ? '#B02020' : r.totalPerT > 25 ? '#A05A00' : '#1E6B42' },
                { label:'OPEX per tonne Cu',    val:`$${Math.round(r.totalPerKgCu).toLocaleString()}`,        sub:'$/t Cu produced',                          color: 'inherit' },
                { label:'Energy cost share',    val:`${Math.round(r.energyCost / r.totalPerT * 100)}%`,       sub:`${r.totalKwh.toFixed(1)} kWh/t × $${(opxPower/100).toFixed(3)}/kWh`, color: 'inherit' },
                { label:'Annual OPEX (total)',  val:`$${(r.totalPerT * r.tpd * 365 / 1e6).toFixed(1)}M`,     sub:`${r.tpd.toLocaleString()} tpd × 365 days`, color: 'inherit' },
              ];
              return (
                <>
                  <div className="planner-page__kpis">
                    {kpis.map((k, i) => (
                      <div key={i} className="planner-page__kpi-box">
                        <div className="planner-page__kpi-label">{k.label}</div>
                        <div className="planner-page__kpi-val" style={{ color: k.color }}>{k.val}</div>
                        <div className="planner-page__kpi-sub">{k.sub}</div>
                      </div>
                    ))}
                  </div>

                  <div className="planner-page__section">
                    <div className="planner-page__section-title">Cost breakdown ($/t ore processed)</div>
                    {r.breakdown.map((b, i) => (
                      <div key={i} className="planner-page__bar-row">
                        <div className="planner-page__bar-label">{b.label}</div>
                        <div className="planner-page__bar-wrap"><div className="planner-page__bar" style={{ width:`${Math.round(b.val / maxBar * 100)}%`, background: b.bar }} /></div>
                        <div className="planner-page__bar-val">${b.val.toFixed(2)}</div>
                        <div className="planner-page__bar-pct">{Math.round(b.val / r.totalPerT * 100)}%</div>
                      </div>
                    ))}
                    <div className="planner-page__bar-row planner-page__bar-row--total">
                      <div className="planner-page__bar-label">Total OPEX</div>
                      <div className="planner-page__bar-wrap" />
                      <div className="planner-page__bar-val planner-page__bar-val--brand">${r.totalPerT.toFixed(2)}</div>
                      <div className="planner-page__bar-pct">100%</div>
                    </div>
                  </div>

                  <div className="planner-page__section">
                    <div className="planner-page__section-title">How OPEX changes with power cost</div>
                    <div className="planner-page__section-sub">Your current power cost is highlighted. Slide the power cost input above to explore.</div>
                    <div className="planner-page__chart">
                      <div className="planner-page__chart-bars">
                        {r.powerSteps.map((p, i) => {
                          const active = Math.abs(p - opxPower) < 1;
                          const h = Math.round(r.powerOPEX[i] / powerMax * 110);
                          return (
                            <div key={p} className="planner-page__chart-col">
                              <div className="planner-page__chart-col-val" style={{ color: active ? '#C85A0A' : '#8C8480', fontWeight: active ? 600 : 400 }}>${r.powerOPEX[i].toFixed(1)}</div>
                              <div className="planner-page__chart-col-bar" style={{ height: h, background: active ? '#C85A0A' : '#E8E2DE' }} />
                              <div className="planner-page__chart-col-label" style={{ color: active ? '#C85A0A' : '#8C8480' }}>${(p / 100).toFixed(2)}</div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="planner-page__chart-axis">Power cost ($/kWh) →</div>
                    </div>
                  </div>

                  <div className="planner-page__section">
                    <div className="planner-page__section-title">Comparison vs industry benchmarks</div>
                    {benchmarks.map((b, i) => (
                      <div key={i} className="planner-page__bar-row">
                        <div className="planner-page__bar-label">{b.label}</div>
                        <div className="planner-page__bar-wrap"><div className="planner-page__bar" style={{ width:`${Math.round(b.val / bmMax * 100)}%`, background:'#E8E2DE' }} /></div>
                        <div className="planner-page__bar-val">${b.val}</div>
                        <div className="planner-page__bar-pct" style={{ color: compareVal <= b.val ? '#1E6B42' : '#B02020' }}>{compareVal <= b.val ? '✓ You' : '↑ You'}</div>
                      </div>
                    ))}
                    <div className="planner-page__bar-row planner-page__bar-row--yours">
                      <div className="planner-page__bar-label">Your OPEX</div>
                      <div className="planner-page__bar-wrap"><div className="planner-page__bar" style={{ width:`${Math.round(compareVal / bmMax * 100)}%`, background:'#C85A0A' }} /></div>
                      <div className="planner-page__bar-val planner-page__bar-val--brand">${r.route === 'dle' ? Math.round(compareVal).toLocaleString() : compareVal.toFixed(1)}</div>
                      <div className="planner-page__bar-pct" />
                    </div>
                  </div>
                </>
              );
            })()}
          </>
        )}

        {/* ── TAB 3: NSR calculator ─────────────────────────────────────── */}
        {tab === 'nsr' && (
          <>
            <div className="planner-page__form">
              <h3 className="planner-page__form-title">NSR calculator — Net smelter return</h3>
              <p className="planner-page__form-desc">Calculate actual revenue after smelter treatment charges, refining charges, and penalty deductions. This is what you actually receive per tonne of ore — not gross recovery.</p>

              <div className="planner-page__cols-2">
                {/* Col 1: Concentrate assay */}
                <div>
                  <div className="planner-page__col-header">Concentrate assay</div>
                  {([
                    ['Cu grade in concentrate (%)', nsrConcCu, setNsrConcCu, 5, 55, 0.5],
                    ['Au in concentrate (g/t)',     nsrConcAu, setNsrConcAu, 0, 100, 0.5],
                    ['Ag in concentrate (g/t)',     nsrConcAg, setNsrConcAg, 0, 1000, 1],
                    ['As in concentrate (%)',       nsrConcAs, setNsrConcAs, 0, 8, 0.05],
                    ['Pb in concentrate (%)',       nsrConcPb, setNsrConcPb, 0, 5, 0.05],
                    ['Bi in concentrate (%)',       nsrConcBi, setNsrConcBi, 0, 1, 0.01],
                    ['Moisture (%)',                nsrMoisture, setNsrMoisture, 3, 20, 0.5],
                  ] as [string, number, (v: number) => void, number, number, number][]).map(([label, val, set, min, max, step]) => (
                    <div key={label} className="planner-page__field">
                      <label>{label}</label>
                      <input type="number" value={val} min={min} max={max} step={step} onChange={e => set(parseFloat(e.target.value) || 0)} />
                    </div>
                  ))}
                </div>

                {/* Col 2: Smelter terms */}
                <div>
                  <div className="planner-page__col-header">Smelter terms</div>
                  <div className="planner-page__field">
                    <label>Smelter</label>
                    <select value={nsrSmelter} onChange={e => setNsrSmelter(e.target.value)}>
                      <option value="generic">Generic / spot market</option>
                      <option value="codelco">Codelco — Chile</option>
                      <option value="aurubis">Aurubis — Europe</option>
                      <option value="glencore">Glencore Nikkelverk — Norway</option>
                      <option value="custom">Custom terms</option>
                    </select>
                  </div>
                  {([
                    ['Treatment charge TC ($/dmt conc)', nsrTc,    setNsrTc,    40, 180, 1],
                    ['Refining charge RC (¢/lb Cu)',     nsrRc,    setNsrRc,    4,  20,  0.5],
                    ['Cu payable (%)',                   nsrCuPay, setNsrCuPay, 85, 99,  0.5],
                    ['Au payable (%)',                   nsrAuPay, setNsrAuPay, 70, 98,  0.5],
                    ['Ag payable (%)',                   nsrAgPay, setNsrAgPay, 70, 98,  0.5],
                  ] as [string, number, (v: number) => void, number, number, number][]).map(([label, val, set, min, max, step]) => (
                    <div key={label} className="planner-page__field">
                      <label>{label}</label>
                      <input type="number" value={val} min={min} max={max} step={step}
                        onChange={e => { setNsrSmelter('custom'); set(parseFloat(e.target.value) || 0); }} />
                    </div>
                  ))}
                  <div className="planner-page__col-subheader">Metal prices</div>
                  <div className="planner-page__cols-3 planner-page__cols-3--flush">
                    <div className="planner-page__field">
                      <label>Cu ($/t)</label>
                      <input type="number" value={nsrCuPrice} min={3000} max={20000} step={100} onChange={e => setNsrCuPrice(parseFloat(e.target.value) || 9200)} />
                    </div>
                    <div className="planner-page__field">
                      <label>Au ($/oz)</label>
                      <input type="number" value={nsrAuPrice} min={500} max={5000} step={50} onChange={e => setNsrAuPrice(parseFloat(e.target.value) || 2300)} />
                    </div>
                    <div className="planner-page__field">
                      <label>Ag ($/oz)</label>
                      <input type="number" value={nsrAgPrice} min={10} max={100} step={1} onChange={e => setNsrAgPrice(parseFloat(e.target.value) || 28)} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Ore → concentrate conversion box */}
              <div className="planner-page__oreconv-box">
                <div className="planner-page__oreconv-box-title">Ore → concentrate conversion</div>
                <div className="planner-page__cols-4">
                  {([
                    ['Head grade Cu (%)',      nsrHeadCu,   setNsrHeadCu,   0.1, 8,   0.1],
                    ['Recovery (%)',           nsrRecovery, setNsrRecovery, 40,  99,   1],
                    ['Mass pull (%)',          nsrMassPull, setNsrMassPull, 0.5, 20,   0.1],
                    ['Freight to port ($/wmt)',nsrFreight,  setNsrFreight,  0,   200,  1],
                  ] as [string, number, (v: number) => void, number, number, number][]).map(([label, val, set, min, max, step]) => (
                    <div key={label} className="planner-page__field">
                      <label>{label}</label>
                      <input type="number" value={val} min={min} max={max} step={step} onChange={e => set(parseFloat(e.target.value) || 0)} />
                    </div>
                  ))}
                </div>
              </div>

              <button className="planner-page__run" onClick={() => setNsrDone(true)}>
                <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                Calculate NSR
              </button>
            </div>

            {/* NSR results */}
            {nsrDone && (() => {
              const n = nsrResult;
              const wfMax = Math.max(...n.waterfall.map(r => r.val), 0.01);
              const nsrMax = Math.max(...n.nsrAtPrice.map(Math.abs), 0.01);
              const nsrKpis = [
                { label:'NSR per tonne ore',       val:`$${n.nsrPerOre.toFixed(2)}`,                    sub:'Net revenue after all deductions',  color: n.nsrPerOre > 8 ? '#1E6B42' : n.nsrPerOre > 4 ? '#A05A00' : '#B02020' },
                { label:'NSR per dmt concentrate', val:`$${Math.round(n.netPerDmt)}`,                   sub:'After TC, RC, penalties, freight',   color: 'inherit' },
                { label:'Total deductions',        val:`$${Math.round(n.tcDeduct + n.rcDeduct + n.totalPenPerDmt + nsrFreight)}/dmt`, sub:`TC+RC: $${Math.round(n.tcDeduct + n.rcDeduct)} · Penalties: $${Math.round(n.totalPenPerDmt)}`, color:'#B02020' },
                { label:'Realisation rate',        val:`${Math.round(n.netPerDmt / n.grossPerDmt * 100)}%`, sub:'Net ÷ gross value per dmt',       color: n.netPerDmt / n.grossPerDmt > 0.75 ? '#1E6B42' : '#A05A00' },
              ];
              return (
                <>
                  <div className="planner-page__kpis">
                    {nsrKpis.map((k, i) => (
                      <div key={i} className="planner-page__kpi-box">
                        <div className="planner-page__kpi-label">{k.label}</div>
                        <div className="planner-page__kpi-val" style={{ color: k.color }}>{k.val}</div>
                        <div className="planner-page__kpi-sub">{k.sub}</div>
                      </div>
                    ))}
                  </div>

                  <div className="planner-page__section">
                    <div className="planner-page__section-title">NSR waterfall — from gross revenue to net return</div>
                    {n.waterfall.map((row, i) => (
                      <div key={i} className="planner-page__wfall-row">
                        <div className="planner-page__wfall-label">{row.label}</div>
                        <div className="planner-page__bar-wrap"><div className="planner-page__bar" style={{ width:`${Math.round(row.val / wfMax * 100)}%`, background: row.color }} /></div>
                        <div className="planner-page__wfall-val" style={{ color: row.color }}>{row.sign > 0 ? '+' : '-'}${row.val.toFixed(1)}/dmt</div>
                      </div>
                    ))}
                    <div className="planner-page__wfall-row planner-page__wfall-row--total">
                      <div className="planner-page__wfall-label">Net smelter return (NSR)</div>
                      <div className="planner-page__bar-wrap"><div className="planner-page__bar" style={{ width:`${Math.round(Math.max(0, n.netPerDmt) / wfMax * 100)}%`, background:'#C85A0A' }} /></div>
                      <div className="planner-page__wfall-val planner-page__wfall-val--brand">${Math.round(n.netPerDmt)}/dmt</div>
                    </div>
                  </div>

                  <div className="planner-page__section">
                    <div className="planner-page__section-title">Penalty &amp; deduction detail</div>
                    <div className="planner-page__pen-table">
                      <div className="planner-page__pen-header">
                        <span>Element</span><span>Your value</span><span>Threshold</span><span>Penalty/dmt</span><span>Note</span>
                      </div>
                      {n.penalties.map((p, i) => (
                        <div key={i} className="planner-page__pen-row">
                          <span className="planner-page__pen-el">{p.el}</span>
                          <span className="planner-page__pen-mono" style={{ color: p.actual > p.thresh ? '#B02020' : '#1E6B42' }}>{p.actual}%</span>
                          <span className="planner-page__pen-mono planner-page__pen-mono--muted">{p.thresh}%</span>
                          <span className="planner-page__pen-mono" style={{ color: p.pen > 0 ? '#B02020' : '#1E6B42', fontWeight: 600 }}>{p.pen > 0 ? `$${p.pen.toFixed(1)}` : 'None'}</span>
                          <span className="planner-page__pen-note">{p.unit}</span>
                        </div>
                      ))}
                    </div>
                    <div className="planner-page__score-note">
                      Penalty schedules shown are indicative. Actual penalties vary by smelter and are subject to annual negotiations. Verify against your specific offtake contract.
                    </div>
                  </div>

                  <div className="planner-page__section">
                    <div className="planner-page__section-title">NSR sensitivity to Cu price</div>
                    <div className="planner-page__section-sub">How your NSR per tonne of ore changes as copper price moves.</div>
                    <div className="planner-page__chart">
                      <div className="planner-page__chart-bars">
                        {n.cuPrices.map((p, i) => {
                          const v      = n.nsrAtPrice[i];
                          const active = Math.abs(p - n.nsrCuPrice) < 600;
                          const h      = Math.max(4, Math.round(Math.abs(v) / nsrMax * 100));
                          return (
                            <div key={p} className="planner-page__chart-col">
                              <div className="planner-page__chart-col-val" style={{ color: active ? '#C85A0A' : '#8C8480', fontWeight: active ? 600 : 400 }}>${v.toFixed(1)}</div>
                              <div className="planner-page__chart-col-bar" style={{ height: h, background: active ? '#C85A0A' : v < 0 ? '#B02020' : '#E8E2DE' }} />
                              <div className="planner-page__chart-col-label" style={{ color: active ? '#C85A0A' : '#8C8480' }}>{(p / 1000).toFixed(0)}k</div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="planner-page__chart-axis">Cu price ($/t) →</div>
                    </div>
                  </div>
                </>
              );
            })()}
          </>
        )}

      </div>
    </div>
  );
}
