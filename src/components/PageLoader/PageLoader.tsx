import './PageLoader.scss';

export type PageLoaderVariant = 'table' | 'cards' | 'list' | 'filter';

interface PageLoaderProps {
  variant?: PageLoaderVariant;
  rows?: number;
  error?: string | null;
}

function Shimmer({ width }: { width?: string }) {
  return <span className="page-loader__shimmer" style={width ? { width } : undefined} />;
}

function TableSkeleton({ rows }: { rows: number }) {
  const cols = [72, 58, 64, 36, 48, 46, 58, 56] as const;
  return (
    <div className="page-loader__table">
      <div className="page-loader__thead">
        {cols.map((w, i) => <Shimmer key={i} width={`${w}%`} />)}
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="page-loader__row">
          {cols.map((w, j) => (
            <Shimmer key={j} width={`${Math.round(w * (0.5 + Math.sin(i * 3 + j) * 0.25))}%`} />
          ))}
        </div>
      ))}
    </div>
  );
}

function CardsSkeleton({ rows }: { rows: number }) {
  return (
    <div className="page-loader__cards">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="page-loader__card">
          <Shimmer width="65%" />
          <Shimmer width="90%" />
          <Shimmer width="80%" />
          <div className="page-loader__card-tags">
            <Shimmer width="32%" />
            <Shimmer width="28%" />
            <Shimmer width="24%" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ListSkeleton({ rows }: { rows: number }) {
  return (
    <div className="page-loader__list">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="page-loader__list-item">
          <div className="page-loader__list-head">
            <Shimmer width="55%" />
            <Shimmer width="28%" />
          </div>
          <div className="page-loader__list-metrics">
            {[60, 52, 48, 44, 40].map((w, j) => (
              <div key={j} className="page-loader__list-metric">
                <Shimmer width="60%" />
                <Shimmer width={`${w}%`} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function FilterSkeleton() {
  return (
    <div className="page-loader__filter">
      {/* Metal section */}
      <div className="page-loader__filter-section">
        <Shimmer width="48px" />
        <div className="page-loader__filter-metals">
          {[38, 30, 28, 32, 26, 34, 28, 24].map((w, i) => (
            <span key={i} className="page-loader__filter-metal-btn" style={{ width: `${w}px` }} />
          ))}
        </div>
      </div>

      {/* Ore type section */}
      <div className="page-loader__filter-section">
        <Shimmer width="64px" />
        {[72, 58, 80, 65, 70, 55].map((w, i) => (
          <div key={i} className="page-loader__filter-check-row">
            <span className="page-loader__filter-check-box" />
            <Shimmer width={`${w}%`} />
          </div>
        ))}
      </div>

      {/* Flotation section */}
      <div className="page-loader__filter-section">
        <Shimmer width="110px" />
        <div className="page-loader__filter-tags">
          {[64, 48, 72, 44, 32].map((w, i) => (
            <span key={i} className="page-loader__filter-tag-pill" style={{ width: `${w}px` }} />
          ))}
        </div>
      </div>

      {/* SG range section */}
      <div className="page-loader__filter-section">
        <Shimmer width="56px" />
        <div className="page-loader__filter-range-row">
          <span className="page-loader__filter-input" />
          <span className="page-loader__filter-sep" />
          <span className="page-loader__filter-input" />
        </div>
      </div>
    </div>
  );
}

export function PageLoader({ variant = 'table', rows = 8, error }: PageLoaderProps) {
  if (error) {
    return (
      <div className="page-loader__error">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="page-loader__error-icon">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p className="page-loader__error-text">{error}</p>
      </div>
    );
  }

  if (variant === 'filter') {
    return <FilterSkeleton />;
  }

  return (
    <div className="page-loader">
      <div className="page-loader__toolbar">
        <Shimmer width="80px" />
        <Shimmer width="220px" />
        <Shimmer width="120px" />
      </div>
      {variant === 'table'  && <TableSkeleton rows={rows} />}
      {variant === 'cards'  && <CardsSkeleton rows={rows} />}
      {variant === 'list'   && <ListSkeleton rows={rows} />}
    </div>
  );
}
