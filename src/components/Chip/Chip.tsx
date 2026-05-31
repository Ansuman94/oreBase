import './Chip.scss';

interface ChipProps {
  label: string;
  value: string;
}

export function Chip({ label, value }: ChipProps) {
  return (
    <div className="chip">
      {label} <span className="chip__value">{value}</span>
    </div>
  );
}
