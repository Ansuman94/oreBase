import { SidebarItem } from '../SidebarItem/SidebarItem';
import './Sidebar.scss';

export interface SidebarNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
}

interface SidebarSection {
  label: string;
  items: SidebarNavItem[];
}

interface SidebarStat { label: string; value: string | number; }

interface SidebarProps {
  sections: SidebarSection[];
  activeId: string;
  onNav: (id: string) => void;
  stats?: SidebarStat[];
}

export function Sidebar({ sections, activeId, onNav, stats }: SidebarProps) {
  return (
    <aside className="sidebar">
      {sections.map((section, i) => (
        <div key={i} className="sidebar__section">
          <div className="sidebar__label">{section.label}</div>
          {section.items.map(item => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              badge={item.badge}
              active={activeId === item.id}
              onClick={() => onNav(item.id)}
            />
          ))}
          {i < sections.length - 1 && <div className="sidebar__divider" />}
        </div>
      ))}

      {stats && stats.length > 0 && (
        <div className="sidebar__stats">
          <div className="sidebar__stats-title">Database stats</div>
          {stats.map((s, i) => (
            <div key={i} className="sidebar__stat-row">
              <span>{s.label}</span>
              <span>{s.value}</span>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
