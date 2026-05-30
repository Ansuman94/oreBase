import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { PillTabs, HomeCard, SkeletonLoader } from '../../components';
import { SearchBar } from '../../components/SearchBar/SearchBar';
import type { HomeCardIconVariant } from '../../components/HomeCard/HomeCard';
import { fetchStats } from '../../api/stats';
import type { AppStats } from '../../api/stats';
import { searchMinerals } from '../../api/minerals';
import { searchProcessRoutes } from '../../api/processes';
import { searchSuppliers } from '../../api/suppliers';
import type { MineralData } from '../../data/minerals';
import type { ProcessRoute } from '../../data/routes';
import type { Supplier } from '../../data/suppliers';
import './SearchPage.scss';

const SEARCH_TABS = [
  { id: 'all',       label: 'All' },
  { id: 'minerals',  label: 'Minerals' },
  { id: 'processes', label: 'Processes' },
  { id: 'suppliers', label: 'Suppliers' },
];


interface CardDef {
  id: string;
  name: string;
  sub: ReactNode;
  iconVariant: HomeCardIconVariant;
  icon: ReactNode;
}

const HOME_CARDS: CardDef[] = [
  {
    id: 'minerals',
    name: 'Mineral Database',
    sub: 'Minerals with full property data',
    iconVariant: 'brand',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <polygon points="12 2 22 8 22 16 12 22 2 16 2 8" />
        <line x1="12" y1="2" x2="12" y2="22" />
        <line x1="2" y1="8" x2="22" y2="8" />
        <line x1="2" y1="16" x2="22" y2="16" />
      </svg>
    ),
  },
  {
    id: 'processes',
    name: 'Process Routes',
    sub: 'Metallurgical flowsheets',
    iconVariant: 'green',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="12" cy="5" r="2" />
        <circle cx="5" cy="19" r="2" />
        <circle cx="19" cy="19" r="2" />
        <line x1="12" y1="7" x2="5" y2="17" />
        <line x1="12" y1="7" x2="19" y2="17" />
      </svg>
    ),
  },
  {
    id: 'planner',
    name: 'Extraction Planner',
    sub: 'Design optimal extraction circuits',
    iconVariant: 'brand',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <polyline points="9 16 11 18 15 14" />
      </svg>
    ),
  },
  {
    id: 'predictor',
    name: 'Recovery Predictor',
    sub: 'ML-driven recovery rate estimation',
    iconVariant: 'blue',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    id: 'suppliers',
    name: 'Suppliers',
    sub: 'Verified reagent & equipment suppliers',
    iconVariant: 'brown',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18Z" />
        <path d="M6 12H4a2 2 0 00-2 2v6a2 2 0 002 2h2" />
        <path d="M18 9h2a2 2 0 012 2v9a2 2 0 01-2 2h-2" />
        <line x1="10" y1="6" x2="14" y2="6" />
        <line x1="10" y1="10" x2="14" y2="10" />
        <line x1="10" y1="14" x2="14" y2="14" />
      </svg>
    ),
  },
  {
    id: 'ai-search',
    name: 'AI Search',
    sub: 'Natural-language mineral intelligence',
    iconVariant: 'olive',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z" />
      </svg>
    ),
  },
];

const CARD_ROUTES: Record<string, string> = {
  minerals:    '/minerals',
  processes:   '/processes',
  planner:     '/planner',
  predictor:   '/predictor',
  suppliers:   '/suppliers',
  'ai-search': '/ai-search',
};

interface SearchResults {
  minerals:  MineralData[];
  processes: ProcessRoute[];
  suppliers: Supplier[];
}

export function SearchPage() {
  const navigate = useNavigate();

  // ── Tab + card grid ─────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('all');
  const visibleCards = HOME_CARDS;

  // ── Stats ───────────────────────────────────────────────────────────────────
  const [stats, setStats]               = useState<AppStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  const cardSub = (loading: boolean, value: number | undefined, suffix: string): ReactNode =>
    loading
      ? <SkeletonLoader variant="line" width="140px" height="11px" />
      : value != null ? `${value.toLocaleString()} ${suffix}` : suffix;

  const cardSubOverrides: Record<string, ReactNode> = {
    minerals:  cardSub(statsLoading, stats?.minerals,      'minerals with full property data'),
    processes: cardSub(statsLoading, stats?.processRoutes, 'metallurgical flowsheets'),
    suppliers: cardSub(statsLoading, stats?.suppliers,     'verified reagent & equipment suppliers'),
  };

  const statsDisplay = [
    { label: 'Minerals',       value: stats?.minerals.toLocaleString()      },
    { label: 'Process routes', value: stats?.processRoutes.toLocaleString() },
    { label: 'Suppliers',      value: stats?.suppliers.toLocaleString()      },
    { label: 'Metals',         value: stats?.metals.toLocaleString()         },
  ];

  // ── Search ──────────────────────────────────────────────────────────────────
  const [searchText,    setSearchText]    = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const dropdownOpen  = searchText.length >= 2;

  useEffect(() => {
    if (searchText.length < 2) { setSearchResults(null); return; }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const tab = activeTab as 'all' | 'minerals' | 'processes' | 'suppliers';
        const [mins, procs, sups] = await Promise.all([
          tab === 'all' || tab === 'minerals'  ? searchMinerals(searchText)      : Promise.resolve([]),
          tab === 'all' || tab === 'processes' ? searchProcessRoutes(searchText) : Promise.resolve([]),
          tab === 'all' || tab === 'suppliers' ? searchSuppliers(searchText)     : Promise.resolve([]),
        ]);
        setSearchResults({ minerals: mins, processes: procs, suppliers: sups });
      } catch {
        setSearchResults(null);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText, activeTab]);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setSearchText('');
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  function handleSearch(query: string) {
    if (!query.trim()) return;
    const q = query.trim();
    setSearchText('');
    if (activeTab === 'minerals')  { navigate('/minerals',  { state: { searchQuery: q } }); return; }
    if (activeTab === 'processes') { navigate('/processes', { state: { searchQuery: q } }); return; }
    if (activeTab === 'suppliers') { navigate('/suppliers', { state: { searchQuery: q } }); return; }
    navigate(`/search/results?q=${encodeURIComponent(q)}`);
  }

  function goToMineral(name: string) {
    setSearchText('');
    navigate('/minerals', { state: { selectMineral: name } });
  }
  function goToProcess(routeName: string) {
    setSearchText('');
    navigate('/processes', { state: { searchQuery: routeName } });
  }
  function goToSupplier(id: number) {
    setSearchText('');
    navigate('/suppliers', { state: { selectSupplierId: id } });
  }
  function goToPage(path: string) {
    setSearchText('');
    navigate(path);
  }

  const totalResults = searchResults
    ? searchResults.minerals.length + searchResults.processes.length + searchResults.suppliers.length
    : 0;

  return (
    <div className="search-page">
      <div className="search-page__hero">
        <h1>
          The structured intelligence layer for{' '}
          <em>mining metallurgy</em>
        </h1>
        <p>
          Search, explore, and analyse mineral properties, extraction processes,
          and supply chains — powered by structured data and AI.
        </p>
      </div>

      {/* Search bar + dropdown */}
      <div className="search-page__search-wrap" ref={searchWrapRef}>
        <SearchBar
          variant="hero"
          placeholder="Search minerals, ore types, process routes…"
          value={searchText}
          onChange={setSearchText}
          onSearch={handleSearch}
          onEscape={() => setSearchText('')}
        />

        {dropdownOpen && (
          <div className="search-page__dropdown">
            {searchLoading && (
              <div className="search-page__dropdown-loading">
                <SkeletonLoader variant="line" width="60%" height="13px" />
              </div>
            )}

            {!searchLoading && searchResults && totalResults === 0 && (
              <div className="search-page__dropdown-empty">No results for "{searchText}"</div>
            )}

            {!searchLoading && searchResults && totalResults > 0 && (
              <>
                {searchResults.minerals.length > 0 && (
                  <div className="search-page__dropdown-group">
                    <div className="search-page__dropdown-group-header">
                      <span className="search-page__dropdown-group-label">Minerals</span>
                      <span className="search-page__dropdown-group-count">{searchResults.minerals.length}</span>
                    </div>
                    {searchResults.minerals.slice(0, 4).map(m => (
                      <button
                        key={m.name}
                        className="search-page__dropdown-item"
                        onClick={() => goToMineral(m.name)}
                      >
                        <span className="search-page__dropdown-item-name">{m.name} ({m.formula})</span>
                        <span className="search-page__dropdown-item-sub">{m.metal} · {m.type}</span>
                      </button>
                    ))}
                    {searchResults.minerals.length > 4 && (
                      <button className="search-page__dropdown-more" onClick={() => goToPage('/minerals')}>
                        +{searchResults.minerals.length - 4} more minerals →
                      </button>
                    )}
                  </div>
                )}

                {searchResults.processes.length > 0 && (
                  <div className="search-page__dropdown-group">
                    <div className="search-page__dropdown-group-header">
                      <span className="search-page__dropdown-group-label">Process Routes</span>
                      <span className="search-page__dropdown-group-count">{searchResults.processes.length}</span>
                    </div>
                    {searchResults.processes.slice(0, 4).map(p => (
                      <button
                        key={p.id}
                        className="search-page__dropdown-item"
                        onClick={() => goToProcess(p.name)}
                      >
                        <span className="search-page__dropdown-item-name">{p.name}</span>
                        <span className="search-page__dropdown-item-sub">{p.metal} · {p.category}</span>
                      </button>
                    ))}
                    {searchResults.processes.length > 4 && (
                      <button className="search-page__dropdown-more" onClick={() => goToPage('/processes')}>
                        +{searchResults.processes.length - 4} more routes →
                      </button>
                    )}
                  </div>
                )}

                {searchResults.suppliers.length > 0 && (
                  <div className="search-page__dropdown-group">
                    <div className="search-page__dropdown-group-header">
                      <span className="search-page__dropdown-group-label">Suppliers</span>
                      <span className="search-page__dropdown-group-count">{searchResults.suppliers.length}</span>
                    </div>
                    {searchResults.suppliers.slice(0, 4).map(s => (
                      <button
                        key={s.id}
                        className="search-page__dropdown-item"
                        onClick={() => goToSupplier(s.id)}
                      >
                        <span className="search-page__dropdown-item-name">{s.name}</span>
                        <span className="search-page__dropdown-item-sub">{s.cat} · {s.region}</span>
                      </button>
                    ))}
                    {searchResults.suppliers.length > 4 && (
                      <button className="search-page__dropdown-more" onClick={() => goToPage('/suppliers')}>
                        +{searchResults.suppliers.length - 4} more suppliers →
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="search-page__tabs">
        <PillTabs tabs={SEARCH_TABS} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Card grid — filtered by tab */}
      <div className="search-page__grid">
        {visibleCards.map(card => (
          <HomeCard
            key={card.id}
            icon={card.icon}
            iconVariant={card.iconVariant}
            name={card.name}
            sub={cardSubOverrides[card.id] ?? card.sub}
            onClick={CARD_ROUTES[card.id] ? () => navigate(CARD_ROUTES[card.id]) : undefined}
          />
        ))}
      </div>

      {/* Stats bar */}
      <div className="search-page__stats">
        {statsDisplay.map(stat => (
          <div key={stat.label} className="search-page__stat">
            <span className="search-page__stat-num">
              {statsLoading
                ? <SkeletonLoader variant="line" width="48px" height="26px" />
                : stat.value
              }
            </span>
            <span className="search-page__stat-lbl">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
