import React from 'react';
import './FilterGroup.scss';

interface FilterGroupProps {
  title: string;
  children: React.ReactNode;
}

export function FilterGroup({ title, children }: FilterGroupProps) {
  return (
    <div className="filter-group">
      <div className="filter-group__title">{title}</div>
      {children}
    </div>
  );
}
