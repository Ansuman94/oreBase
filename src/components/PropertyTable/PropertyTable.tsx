import './PropertyTable.scss';

export type PropertyStatus = 'ok' | 'warn' | 'bad' | '';

export interface PropertyRow {
  key: string;
  value: string;
  status?: PropertyStatus;
}

interface PropertyTableProps {
  rows: PropertyRow[];
}

export function PropertyTable({ rows }: PropertyTableProps) {
  return (
    <table className="prop-table">
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="prop-table__row">
            <td className="prop-table__key">{row.key}</td>
            <td className={`prop-table__value prop-table__value--${row.status || ''}`}>
              {row.value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
