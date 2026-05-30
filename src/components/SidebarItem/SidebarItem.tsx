import React, { useRef, useState } from 'react';
import { SkeletonLoader } from '../SkeletonLoader/SkeletonLoader';
import './SidebarItem.scss';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  badge?: string | number;
  badgeLoading?: boolean;
  active?: boolean;
  onClick?: () => void;
  collapsed?: boolean;
}

export function SidebarItem({ icon, label, badge, badgeLoading = false, active = false, onClick, collapsed = false }: SidebarItemProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [tooltipY, setTooltipY] = useState<number | null>(null);

  function handleMouseEnter() {
    if (collapsed && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setTooltipY(rect.top + rect.height / 2);
    }
  }

  function handleMouseLeave() {
    setTooltipY(null);
  }

  return (
    <>
      <button
        ref={btnRef}
        className={`sidebar-item ${active ? 'sidebar-item--active' : ''} ${collapsed ? 'sidebar-item--collapsed' : ''}`}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span className="sidebar-item__icon">{icon}</span>
        {!collapsed && <span className="sidebar-item__label">{label}</span>}
        {!collapsed && badgeLoading && (
          <span className="sidebar-item__badge sidebar-item__badge--loading">
            <SkeletonLoader variant="line" width="28px" height="12px" />
          </span>
        )}
        {!collapsed && !badgeLoading && badge !== undefined && (
          <span className="sidebar-item__badge">{badge}</span>
        )}
      </button>
      {collapsed && tooltipY !== null && (
        <div className="sidebar-item__tooltip" style={{ top: tooltipY }}>
          {label}
        </div>
      )}
    </>
  );
}
