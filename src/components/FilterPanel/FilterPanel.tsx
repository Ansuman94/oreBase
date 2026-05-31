import React from 'react';
import './FilterPanel.scss';

interface FilterPanelProps {
  title?: string;
  onClear?: () => void;
  children: React.ReactNode;
}

export function FilterPanel({ title = 'Refine', onClear, children }: FilterPanelProps) {
  return (
    <div className="filter-panel">
      <div className="filter-panel__header">
        <span className="filter-panel__title">{title}</span>
        {onClear && (
          <button className="filter-panel__clear" onClick={onClear}>
            Clear all
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
