import { Badge } from '../Badge/Badge';
import type { BadgeVariant } from '../Badge/Badge';
import './MineralTable.scss';

export interface MineralRow {
  id: string | number;
  name: string;
  formula: string;
  type: string;
  typeVariant?: BadgeVariant;
  metal: string;
  metalColor?: string;
  grade: string;
  bwi: string;
  recovery: string;
  flotation: string;
  flotationVariant?: BadgeVariant;
}

type SortDir = 'asc' | 'desc';

interface MineralTableProps {
  rows: MineralRow[];
  selectedId?: string | number;
  onRowClick?: (row: MineralRow) => void;
  sortKey?: keyof MineralRow;
  sortDir?: SortDir;
  onSort?: (key: keyof MineralRow) => void;
}

const COLUMNS: { key: keyof MineralRow; label: string }[] = [
  { key: 'name',      label: 'Mineral' },
  { key: 'formula',   label: 'Formula' },
  { key: 'type',      label: 'Type' },
  { key: 'metal',     label: 'Metal' },
  { key: 'grade',     label: 'Grade' },
  { key: 'bwi',       label: 'BWI' },
  { key: 'recovery',  label: 'Recovery' },
  { key: 'flotation', label: 'Flotation' },
];

export function MineralTable({
  rows,
  selectedId,
  onRowClick,
  sortKey,
  sortDir,
  onSort,
}: MineralTableProps) {
  return (
    <div className="mineral-table-wrap">
      <table className="mineral-table">
        <thead>
          <tr>
            {COLUMNS.map(col => (
              <th
                key={col.key}
                className={`mineral-table__th ${sortKey === col.key ? 'mineral-table__th--sorted' : ''}`}
                onClick={() => onSort?.(col.key)}
              >
                {col.label}
                {sortKey === col.key && (
                  <span className="mineral-table__sort-icon">
                    {sortDir === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr
              key={row.id}
              className={`mineral-table__row ${selectedId === row.id ? 'mineral-table__row--selected' : ''}`}
              onClick={() => onRowClick?.(row)}
            >
              <td className="mineral-table__td mineral-table__td--name">{row.name}</td>
              <td className="mineral-table__td mineral-table__td--formula">{row.formula}</td>
              <td className="mineral-table__td">
                {row.typeVariant
                  ? <Badge variant={row.typeVariant} label={row.type} />
                  : row.type}
              </td>
              <td className="mineral-table__td">
                <span className="mineral-table__metal-dot" style={{ background: row.metalColor }} />
                {row.metal}
              </td>
              <td className="mineral-table__td mineral-table__td--num">{row.grade}</td>
              <td className="mineral-table__td mineral-table__td--num">{row.bwi}</td>
              <td className="mineral-table__td mineral-table__td--num">{row.recovery}</td>
              <td className="mineral-table__td">
                {row.flotationVariant
                  ? <Badge variant={row.flotationVariant} label={row.flotation} />
                  : row.flotation}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
