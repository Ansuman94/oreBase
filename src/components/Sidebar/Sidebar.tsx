import React from 'react';
import { SidebarItem } from '../SidebarItem/SidebarItem';
import './Sidebar.scss';

export interface SidebarNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  badgeLoading?: boolean;
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
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ sections, activeId, onNav, stats, collapsed = false, onToggle }: SidebarProps) {
  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      <div className="sidebar__content">
        {sections.map((section, i) => (
          <div key={i} className="sidebar__section">
            <div className="sidebar__label-row">
              <span className="sidebar__label">{section.label}</span>
              {i === 0 && (
                <button
                  className="sidebar__toggle"
                  onClick={onToggle}
                  title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  <svg className="sidebar__toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
              )}
            </div>
            {section.items.map(item => (
              <SidebarItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                badge={item.badge}
                badgeLoading={item.badgeLoading}
                active={activeId === item.id}
                collapsed={collapsed}
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
      </div>
    </aside>
  );
}
