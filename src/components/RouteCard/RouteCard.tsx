import React, { useState } from 'react';
import './RouteCard.scss';

export interface RouteMetric { label: string; value: string; highlight?: boolean; }

interface RouteCardProps {
  name: string;
  recommended?: boolean;
  recTag?: string;
  metrics?: RouteMetric[];
  detail?: React.ReactNode;
}

export function RouteCard({
  name,
  recommended = false,
  recTag = 'Recommended',
  metrics = [],
  detail,
}: RouteCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="route-card">
      <div className={`route-card__head ${recommended ? 'route-card__head--rec' : 'route-card__head--norm'}`}>
        <span className="route-card__name">{name}</span>
        <div className="route-card__head-r">
          {recommended && (
            <span className="route-card__rec-tag">{recTag}</span>
          )}
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

      {detail && (
        <>
          <button className="route-card__toggle" onClick={() => setOpen(o => !o)}>
            {open ? '▲ Hide detail' : '▼ Show detail'}
          </button>
          {open && <div className="route-card__detail">{detail}</div>}
        </>
      )}
    </div>
  );
}
