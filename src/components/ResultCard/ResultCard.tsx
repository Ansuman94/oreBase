import { Badge } from '../Badge/Badge';
import type { BadgeVariant } from '../Badge/Badge';
import { Chip } from '../Chip/Chip';
import './ResultCard.scss';

interface ChipData { label: string; value: string; }
interface ActionData { label: string; onClick?: () => void; }

interface ResultCardProps {
  title: string;
  subtitle?: string;
  badgeVariant?: BadgeVariant;
  badgeLabel?: string;
  meta?: string;
  chips?: ChipData[];
  actions?: ActionData[];
  selected?: boolean;
  onClick?: () => void;
}

export function ResultCard({
  title,
  subtitle,
  badgeVariant,
  badgeLabel,
  meta,
  chips = [],
  actions = [],
  selected = false,
  onClick,
}: ResultCardProps) {
  return (
    <div
      className={`result-card ${selected ? 'result-card--selected' : ''}`}
      onClick={onClick}
    >
      <div className="result-card__top">
        <input
          type="checkbox"
          className="result-card__cb"
          checked={selected}
          onChange={() => {}}
          onClick={e => e.stopPropagation()}
        />
        <div className="result-card__title">
          {title}
          {subtitle && <span className="result-card__subtitle"> ({subtitle})</span>}
        </div>
        {badgeVariant && badgeLabel && (
          <Badge variant={badgeVariant} label={badgeLabel} />
        )}
      </div>
      {meta && <div className="result-card__meta">{meta}</div>}
      {chips.length > 0 && (
        <div className="result-card__chips">
          {chips.map((c, i) => <Chip key={i} label={c.label} value={c.value} />)}
        </div>
      )}
      {actions.length > 0 && (
        <div className="result-card__actions">
          {actions.map((a, i) => (
            <button
              key={i}
              className="result-card__action"
              onClick={e => { e.stopPropagation(); a.onClick?.(); }}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
