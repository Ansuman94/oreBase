import './HorizontalBarChart.scss';

export interface BarRow {
  label: string;
  value: number;
  max: number;
  color?: string;
  highlight?: boolean;
}

interface HorizontalBarChartProps {
  rows: BarRow[];
}

export function HorizontalBarChart({ rows }: HorizontalBarChartProps) {
  return (
    <div className="hbar-chart">
      {rows.map((row, i) => {
        const pct = Math.min(100, (row.value / row.max) * 100);
        return (
          <div key={i} className={`hbar-chart__row ${row.highlight ? 'hbar-chart__row--highlight' : ''}`}>
            <div className="hbar-chart__label">{row.label}</div>
            <div className="hbar-chart__track">
              <div
                className="hbar-chart__fill"
                style={{ width: `${pct}%`, background: row.color }}
              />
            </div>
            <div className="hbar-chart__value">{row.value}</div>
          </div>
        );
      })}
    </div>
  );
}
