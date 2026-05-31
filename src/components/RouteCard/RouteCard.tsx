import type { ReactNode } from 'react';
import { useState } from 'react';
import './RouteCard.scss';

export interface RouteMetric { label: string; value: string; highlight?: boolean; }

interface RouteCardProps {
  name: string;
  subtitle?: string;
  recommended?: boolean;
  recTag?: string;
  badge?: ReactNode;
  metrics?: RouteMetric[];
  stages?: string[];
  pros?: string[];
  cons?: string[];
  co2?: string;
  co2Color?: string;
  co2Bg?: string;
}

export function RouteCard({
  name,
  subtitle,
  recommended = false,
  recTag = 'Recommended',
  badge,
  metrics = [],
  stages = [],
  pros = [],
  cons = [],
  co2,
  co2Color,
  co2Bg,
}: RouteCardProps) {
  const [open, setOpen] = useState(false);
  const hasDetail = stages.length > 0 || pros.length > 0 || cons.length > 0;

  return (
    <div className="route-card">
      <div className={`route-card__head ${recommended ? 'route-card__head--rec' : 'route-card__head--norm'}`}>
        <div className="route-card__name-block">
          <span className="route-card__name">{name}</span>
          {subtitle && <span className="route-card__subtitle">{subtitle}</span>}
        </div>
        <div className="route-card__head-r">
          {recommended && <span className="route-card__rec-tag">{recTag}</span>}
          {badge}
        </div>
      </div>

      {metrics.length > 0 && (
        <div className="route-card__metrics">
          {metrics.map((m, i) => (
            <div key={i} className="route-card__metric">
              <div className="route-card__metric-label">{m.label}</div>
              <div className={`route-card__metric-val ${m.highlight ? 'route-card__metric-val--green' : ''}`}>
                {m.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {hasDetail && (
        <>
          {open && (
            <div className="route-card__detail">
              {stages.length > 0 && (
                <div className="route-card__detail-col">
                  <div className="route-card__sec-title">Process steps</div>
                  {stages.map((s, i) => (
                    <div key={i} className="route-card__step">
                      <div className="route-card__step-num">{i + 1}</div>
                      <div className="route-card__step-text">{s}</div>
                    </div>
                  ))}
                </div>
              )}
              {(pros.length > 0 || cons.length > 0 || co2) && (
                <div className="route-card__detail-col">
                  {pros.length > 0 && (
                    <>
                      <div className="route-card__sec-title">Advantages</div>
                      {pros.map((p, i) => (
                        <div key={i} className="route-card__pro">{p}</div>
                      ))}
                    </>
                  )}
                  {cons.length > 0 && (
                    <>
                      <div className="route-card__sec-title route-card__sec-title--gap">Limitations</div>
                      {cons.map((c, i) => (
                        <div key={i} className="route-card__con">{c}</div>
                      ))}
                    </>
                  )}
                  {co2 && (
                    <div className="route-card__co2-row">
                      <span
                        className="route-card__co2-tag"
                        style={co2Color ? { color: co2Color, background: co2Bg, border: `1px solid ${co2Color}40` } : undefined}
                      >
                        CO₂: {co2}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <button className="route-card__toggle" onClick={() => setOpen(o => !o)}>
            {open ? 'Hide steps ▲' : 'Show steps ▼'}
          </button>
        </>
      )}
    </div>
  );
}
