import React from 'react';
import './SidebarItem.scss';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  badge?: string | number;
  active?: boolean;
  onClick?: () => void;
}

export function SidebarItem({ icon, label, badge, active = false, onClick }: SidebarItemProps) {
  return (
    <button
      className={`sidebar-item ${active ? 'sidebar-item--active' : ''}`}
      onClick={onClick}
    >
      <span className="sidebar-item__icon">{icon}</span>
      <span className="sidebar-item__label">{label}</span>
      {badge !== undefined && (
        <span className="sidebar-item__badge">{badge}</span>
      )}
    </button>
  );
}
