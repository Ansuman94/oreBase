import React from 'react';
import { Tabs } from '../Tabs/Tabs';
import type { Tab } from '../Tabs/Tabs';
import './DetailPanel.scss';

interface FooterAction { label: string; primary?: boolean; onClick?: () => void; }

interface DetailPanelProps {
  title: string;
  sub?: string;
  open: boolean;
  onClose: () => void;
  tabs?: Tab[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  children?: React.ReactNode;
  footer?: FooterAction[];
}

export function DetailPanel({
  title, sub, open, onClose,
  tabs, activeTab, onTabChange,
  children, footer = [],
}: DetailPanelProps) {
  return (
    <div className={`detail-panel ${open ? '' : 'detail-panel--closed'}`}>
      <div className="detail-panel__header">
        <div className="detail-panel__info">
          <div className="detail-panel__title">{title}</div>
          {sub && <div className="detail-panel__sub">{sub}</div>}
        </div>
        <button className="detail-panel__close" onClick={onClose} aria-label="Close">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {tabs && tabs.length > 0 && activeTab && onTabChange && (
        <Tabs tabs={tabs} activeTab={activeTab} onChange={onTabChange} />
      )}

      <div className="detail-panel__body">{children}</div>

      {footer.length > 0 && (
        <div className="detail-panel__footer">
          {footer.map((a, i) => (
            <button
              key={i}
              className={`detail-panel__footer-btn ${a.primary ? 'detail-panel__footer-btn--primary' : ''}`}
              onClick={a.onClick}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
