import { useState, useMemo, useEffect } from 'react';
import type { Supplier } from '../../data/suppliers';
import { fetchSuppliers } from '../../api/suppliers';
import { Checkbox } from '../../components/Checkbox/Checkbox';
import { SupplierCard } from '../../components/SupplierCard/SupplierCard';
import { PropertyTable } from '../../components/PropertyTable/PropertyTable';
import { Tag } from '../../components/Tag/Tag';
import { PageLoader } from '../../components/PageLoader/PageLoader';
import './SuppliersPage.scss';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'name',      label: 'Name A–Z' },
  { value: 'category',  label: 'Category' },
];

type DetailTab = 'details' | 'products' | 'contact';

export function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCats, setSelectedCats]       = useState<Set<string>>(new Set());
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(new Set());
  const [searchText, setSearchText]       = useState('');
  const [sortKey, setSortKey]             = useState('relevance');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [detailTab, setDetailTab]         = useState<DetailTab>('details');

  useEffect(() => {
    fetchSuppliers()
      .then(setSuppliers)
      .catch(() => setError('Failed to load suppliers from server.'))
      .finally(() => setLoading(false));
  }, []);

  const availableCategories = useMemo(() => {
    return [...new Set(suppliers.map(s => s.cat))].sort();
  }, [suppliers]);

  const availableRegions = useMemo(() => {
    return [...new Set(suppliers.map(s => s.region))].sort();
  }, [suppliers]);

  const catCounts = useMemo(() => {
    const map: Record<string, number> = {};
    suppliers.forEach(s => { map[s.cat] = (map[s.cat] || 0) + 1; });
    return map;
  }, [suppliers]);

  const regionCounts = useMemo(() => {
    const map: Record<string, number> = {};
    suppliers.forEach(s => { map[s.region] = (map[s.region] || 0) + 1; });
    return map;
  }, [suppliers]);

  const filtered = useMemo(() => {
    let list = suppliers;
    if (selectedCats.size > 0)    list = list.filter(s => selectedCats.has(s.cat));
    if (selectedRegions.size > 0) list = list.filter(s => selectedRegions.has(s.region));
    if (searchText) {
      const q = searchText.toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.cat.toLowerCase().includes(q) ||
        s.spec.toLowerCase().includes(q) ||
        s.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return [...list].sort((a, b) => {
      if (sortKey === 'name')     return a.name.localeCompare(b.name);
      if (sortKey === 'category') return a.cat.localeCompare(b.cat);
      return 0;
    });
  }, [suppliers, selectedCats, selectedRegions, searchText, sortKey]);

  function toggleCat(c: string)    { setSelectedCats(p    => toggle(p, c)); }
  function toggleRegion(r: string) { setSelectedRegions(p => toggle(p, r)); }

  function toggle(prev: Set<string>, key: string): Set<string> {
    const n = new Set(prev);
    n.has(key) ? n.delete(key) : n.add(key);
    return n;
  }

  function clearFilters() {
    setSelectedCats(new Set());
    setSelectedRegions(new Set());
  }

  function handleCardClick(s: Supplier) {
    setSelectedSupplier(s);
    setDetailTab('details');
  }

  const hasFilters = selectedCats.size > 0 || selectedRegions.size > 0;

  return (
    <div className="suppliers-page">
      {/* Filter sidebar */}
      <aside className="suppliers-page__filters">
        {loading ? <PageLoader variant="filter" /> : (
          <>
            <div className="suppliers-page__filter-head">
              <span className="suppliers-page__filter-title">Refine</span>
              {hasFilters && (
                <button className="suppliers-page__filter-clear" onClick={clearFilters}>Clear all</button>
              )}
            </div>

            <div className="suppliers-page__filter-section">
              <div className="suppliers-page__filter-label">Category</div>
              {availableCategories.map(c => (
                <Checkbox
                  key={c}
                  label={c}
                  count={catCounts[c] ?? 0}
                  checked={selectedCats.has(c)}
                  onChange={() => toggleCat(c)}
                />
              ))}
            </div>

            <div className="suppliers-page__filter-section">
              <div className="suppliers-page__filter-label">Region</div>
              {availableRegions.map(r => (
                <Checkbox
                  key={r}
                  label={r}
                  count={regionCounts[r] ?? 0}
                  checked={selectedRegions.has(r)}
                  onChange={() => toggleRegion(r)}
                />
              ))}
            </div>
          </>
        )}
      </aside>

      {/* Card grid */}
      <div className="suppliers-page__main">
        {(loading || error) ? <PageLoader variant="cards" rows={9} error={error} /> : <>
        <div className="suppliers-page__toolbar">
          <span className="suppliers-page__count">
            <strong>{filtered.length.toLocaleString()}</strong> suppliers
          </span>
          <input
            className="suppliers-page__search"
            type="text"
            placeholder="Search name, category, specialisation…"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
          <div className="suppliers-page__sort-wrap">
            <label className="suppliers-page__sort-label">Sort:</label>
            <select
              className="suppliers-page__sort-select"
              value={sortKey}
              onChange={e => setSortKey(e.target.value)}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="suppliers-page__grid">
          {filtered.map(s => (
            <SupplierCard
              key={s.id}
              name={s.name}
              spec={s.spec}
              tags={s.tags}
              region={s.region}
              selected={selectedSupplier?.id === s.id}
              onClick={() => handleCardClick(s)}
            />
          ))}
          {filtered.length === 0 && (
            <div className="suppliers-page__empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3}>
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <p>No suppliers match your filters</p>
            </div>
          )}
        </div>
        </>}
      </div>

      {/* Detail panel */}
      <aside className="suppliers-page__detail">
        {!selectedSupplier ? (
          <div className="suppliers-page__detail-empty">
            <div className="suppliers-page__detail-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3}>
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <p className="suppliers-page__detail-empty-text">Select a supplier to view details</p>
          </div>
        ) : (
          <div className="suppliers-page__detail-inner">
            <div className="suppliers-page__detail-head">
              <div className="suppliers-page__detail-head-info">
                <div className="suppliers-page__detail-name">{selectedSupplier.name}</div>
                <div className="suppliers-page__detail-sub">{selectedSupplier.cat} · {selectedSupplier.region}</div>
              </div>
              <button
                className="suppliers-page__detail-close"
                onClick={() => setSelectedSupplier(null)}
                title="Close"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="suppliers-page__detail-tabs">
              {(['details', 'products', 'contact'] as DetailTab[]).map(tab => (
                <button
                  key={tab}
                  className={`suppliers-page__detail-tab ${detailTab === tab ? 'suppliers-page__detail-tab--active' : ''}`}
                  onClick={() => setDetailTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="suppliers-page__detail-body">
              {detailTab === 'details' && (
                <>
                  <div className="suppliers-page__detail-section">
                    <div className="suppliers-page__detail-section-title">Supplier details</div>
                    <PropertyTable rows={[
                      { key: 'Category',      value: selectedSupplier.cat },
                      { key: 'Region',        value: selectedSupplier.region },
                      { key: 'Certification', value: selectedSupplier.cert, status: 'ok' },
                      { key: 'Founded',       value: String(selectedSupplier.founded) },
                    ]} />
                  </div>
                  <div className="suppliers-page__detail-section">
                    <div className="suppliers-page__detail-section-title">Specialisation</div>
                    <p className="suppliers-page__detail-text">{selectedSupplier.spec}</p>
                  </div>
                  <div className="suppliers-page__detail-section">
                    <div className="suppliers-page__detail-section-title">Product tags</div>
                    <div className="suppliers-page__detail-tags">
                      {selectedSupplier.tags.map((t, i) => <Tag key={i} label={t} />)}
                    </div>
                  </div>
                </>
              )}
              {detailTab === 'products' && (
                <div className="suppliers-page__detail-placeholder">
                  <p>Product catalog not available in this version.</p>
                </div>
              )}
              {detailTab === 'contact' && (
                <div className="suppliers-page__detail-placeholder">
                  <p>Contact information not available in this version.</p>
                </div>
              )}
            </div>

            <div className="suppliers-page__detail-footer">
              <button className="suppliers-page__detail-btn">Save</button>
              <button className="suppliers-page__detail-btn suppliers-page__detail-btn--primary">
                Contact supplier →
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
