import { Tag } from '../Tag/Tag';
import './SupplierCard.scss';

interface SupplierCardProps {
  name: string;
  spec: string;
  tags?: string[];
  region?: string;
  selected?: boolean;
  onClick?: () => void;
}

export function SupplierCard({ name, spec, tags = [], region, selected = false, onClick }: SupplierCardProps) {
  return (
    <div
      className={`supplier-card ${selected ? 'supplier-card--selected' : ''}`}
      onClick={onClick}
    >
      <div className="supplier-card__name">{name}</div>
      <div className="supplier-card__spec">{spec}</div>
      <div className="supplier-card__tags">
        {tags.map((t, i) => <Tag key={i} label={t} />)}
        {region && <span className="supplier-card__region">{region}</span>}
      </div>
    </div>
  );
}
