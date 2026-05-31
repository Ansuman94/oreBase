import './PropGrid.scss';

export type PropStatus = 'ok' | 'warn' | 'bad' | '';

export interface PropItem {
  label: string;
  value: string;
  status?: PropStatus;
}

interface PropGridProps {
  properties: PropItem[];
}

export function PropGrid({ properties }: PropGridProps) {
  return (
    <div className="prop-grid">
      {properties.map((p, i) => (
        <div key={i} className="prop-grid__item">
          <div className="prop-grid__label">{p.label}</div>
          <div className={`prop-grid__value prop-grid__value--${p.status || ''}`}>
            {p.value}
          </div>
        </div>
      ))}
    </div>
  );
}
