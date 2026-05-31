import React from 'react';
import './PageLayout.scss';

interface PageLayoutProps {
  filters?: React.ReactNode;
  results: React.ReactNode;
  detail?: React.ReactNode;
}

export function PageLayout({ filters, results, detail }: PageLayoutProps) {
  return (
    <div className="page-layout">
      {filters && <div className="page-layout__filters">{filters}</div>}
      <div className="page-layout__results">{results}</div>
      {detail && <div className="page-layout__detail">{detail}</div>}
    </div>
  );
}
