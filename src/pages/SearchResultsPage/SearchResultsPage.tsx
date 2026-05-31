import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchMinerals } from '../../api/minerals';
import { searchProcessRoutes } from '../../api/processes';
import { searchSuppliers } from '../../api/suppliers';
import { SkeletonLoader } from '../../components/SkeletonLoader/SkeletonLoader';
import type { MineralData } from '../../data/minerals';
import type { ProcessRoute } from '../../data/routes';
import type { Supplier } from '../../data/suppliers';
import './SearchResultsPage.scss';

const COLLAPSED_ROWS = 5;

type SectionKey = 'minerals' | 'processes' | 'suppliers';

export function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const q = searchParams.get('q') ?? '';

  const [minerals,  setMinerals]  = useState<MineralData[]>([]);
  const [processes, setProcesses] = useState<ProcessRoute[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [expanded,  setExpanded]  = useState<Record<SectionKey, boolean>>({
    minerals: false, processes: false, suppliers: false,
  });

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    setMinerals([]);
    setProcesses([]);
    setSuppliers([]);
    setExpanded({ minerals: false, processes: false, suppliers: false });
    Promise.all([
      searchMinerals(q),
      searchProcessRoutes(q),
      searchSuppliers(q),
    ])
      .then(([m, p, s]) => { setMinerals(m); setProcesses(p); setSuppliers(s); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [q]);

  function toggle(key: SectionKey) {
    setExpanded(e => ({ ...e, [key]: !e[key] }));
  }

  const total = minerals.length + processes.length + suppliers.length;

  function goToMineral(name: string) {
    navigate('/minerals', { state: { selectMineral: name } });
  }
  function goToProcess(name: string) {
    navigate('/processes', { state: { searchQuery: name } });
  }
  function goToSupplier(id: number) {
    navigate('/suppliers', { state: { selectSupplierId: id } });
  }

  return (
    <div className="search-results-page">

      <div className="search-results-page__header">
        <button className="search-results-page__back" onClick={() => navigate('/search')}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back
        </button>
        <div className="search-results-page__query-info">
          {loading
            ? 'Searching…'
            : <><strong>{total.toLocaleString()}</strong> results for <em>"{q}"</em></>
          }
        </div>
      </div>

      <div className="search-results-page__body">

        {/* Loading skeletons — COLLAPSED_ROWS per section so height matches collapsed state */}
        {loading && [0, 1, 2].map(i => (
          <div key={i} className="search-results-page__section">
            <div className="search-results-page__section-header">
              <SkeletonLoader variant="line" width="120px" height="13px" />
              <SkeletonLoader variant="line" width="80px" height="13px" />
            </div>
            <div className="search-results-page__rows search-results-page__rows--collapsed">
              {Array.from({ length: COLLAPSED_ROWS }).map((_, j) => (
                <div key={j} className="search-results-page__row-skeleton">
                  <SkeletonLoader variant="line" width="50%" height="13px" />
                  <SkeletonLoader variant="line" width="22%" height="11px" />
                </div>
              ))}
            </div>
          </div>
        ))}

        {!loading && total === 0 && q && (
          <div className="search-results-page__empty">
            No results found for "{q}"
          </div>
        )}

        {/* Minerals */}
        {!loading && minerals.length > 0 && (
          <div className="search-results-page__section">
            <div className="search-results-page__section-header">
              <div className="search-results-page__section-left">
                <span className="search-results-page__section-title">Minerals</span>
                <span className="search-results-page__section-count">{minerals.length}</span>
              </div>
              {minerals.length > COLLAPSED_ROWS && (
                <button className="search-results-page__toggle" onClick={() => toggle('minerals')}>
                  {expanded.minerals
                    ? 'Show less ↑'
                    : `Show all ${minerals.length} ↓`}
                </button>
              )}
            </div>
            <div className={`search-results-page__rows${!expanded.minerals ? ' search-results-page__rows--collapsed' : ''}`}>
              {(expanded.minerals ? minerals : minerals.slice(0, COLLAPSED_ROWS)).map(m => (
                <button key={m.name} className="search-results-page__row" onClick={() => goToMineral(m.name)}>
                  <div className="search-results-page__row-main">
                    <span className="search-results-page__row-name">{m.name}</span>
                    <span className="search-results-page__row-formula">{m.formula}</span>
                  </div>
                  <div className="search-results-page__row-meta">
                    <span className="search-results-page__row-tag">{m.metal}</span>
                    <span className="search-results-page__row-sub">{m.type}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Process Routes */}
        {!loading && processes.length > 0 && (
          <div className="search-results-page__section">
            <div className="search-results-page__section-header">
              <div className="search-results-page__section-left">
                <span className="search-results-page__section-title">Process Routes</span>
                <span className="search-results-page__section-count">{processes.length}</span>
              </div>
              {processes.length > COLLAPSED_ROWS && (
                <button className="search-results-page__toggle" onClick={() => toggle('processes')}>
                  {expanded.processes
                    ? 'Show less ↑'
                    : `Show all ${processes.length} ↓`}
                </button>
              )}
            </div>
            <div className={`search-results-page__rows${!expanded.processes ? ' search-results-page__rows--collapsed' : ''}`}>
              {(expanded.processes ? processes : processes.slice(0, COLLAPSED_ROWS)).map(p => (
                <button key={p.id} className="search-results-page__row" onClick={() => goToProcess(p.name)}>
                  <div className="search-results-page__row-main">
                    <span className="search-results-page__row-name">{p.name}</span>
                  </div>
                  <div className="search-results-page__row-meta">
                    <span className="search-results-page__row-tag">{p.metal}</span>
                    <span className="search-results-page__row-sub">{p.category} · {p.recovery}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Suppliers */}
        {!loading && suppliers.length > 0 && (
          <div className="search-results-page__section">
            <div className="search-results-page__section-header">
              <div className="search-results-page__section-left">
                <span className="search-results-page__section-title">Suppliers</span>
                <span className="search-results-page__section-count">{suppliers.length}</span>
              </div>
              {suppliers.length > COLLAPSED_ROWS && (
                <button className="search-results-page__toggle" onClick={() => toggle('suppliers')}>
                  {expanded.suppliers
                    ? 'Show less ↑'
                    : `Show all ${suppliers.length} ↓`}
                </button>
              )}
            </div>
            <div className={`search-results-page__rows${!expanded.suppliers ? ' search-results-page__rows--collapsed' : ''}`}>
              {(expanded.suppliers ? suppliers : suppliers.slice(0, COLLAPSED_ROWS)).map(s => (
                <button key={s.id} className="search-results-page__row" onClick={() => goToSupplier(s.id)}>
                  <div className="search-results-page__row-main">
                    <span className="search-results-page__row-name">{s.name}</span>
                  </div>
                  <div className="search-results-page__row-meta">
                    <span className="search-results-page__row-tag">{s.cat}</span>
                    <span className="search-results-page__row-sub">{s.region}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
