import React from 'react';
import './MineralCard.scss';

interface MineralChip {
  label: string;
  color: string;
}

interface MineralStat {
  label: string;
  value: string;
}

interface MineralCardProps {
  name: string;
  formula: string;
  typeColor?: string;
  chips?: MineralChip[];
  stats?: MineralStat[];
  selected?: boolean;
  onClick?: () => void;
}

export function MineralCard({
  name,
  formula,
  typeColor,
  chips = [],
  stats = [],
  selected = false,
  onClick,
}: MineralCardProps) {
  return (
    <div
      className={`mineral-card ${selected ? 'mineral-card--selected' : ''}`}
      style={typeColor ? ({ '--stripe-color': typeColor } as React.CSSProperties) : undefined}
      onClick={onClick}
    >
      <div className="mineral-card__name">{name}</div>
      <div className="mineral-card__formula">{formula}</div>
      {chips.length > 0 && (
        <div className="mineral-card__chips">
          {chips.map((c, i) => (
            <span
              key={i}
              className="mineral-card__chip"
              style={{ color: c.color, borderColor: `${c.color}40`, background: `${c.color}15` }}
            >
              {c.label}
            </span>
          ))}
        </div>
      )}
      {stats.length > 0 && (
        <div className="mineral-card__stats">
          {stats.map((s, i) => (
            <div key={i} className="mineral-card__stat">
              <div className="mineral-card__stat-label">{s.label}</div>
              <div className="mineral-card__stat-value">{s.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
