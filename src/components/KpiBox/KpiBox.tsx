import './KpiBox.scss';

interface KpiBoxProps {
  label: string;
  value: string | number;
  sub?: string;
}

export function KpiBox({ label, value, sub }: KpiBoxProps) {
  return (
    <div className="kpi-box">
      <div className="kpi-box__label">{label}</div>
      <div className="kpi-box__value">{value}</div>
      {sub && <div className="kpi-box__sub">{sub}</div>}
    </div>
  );
}
