import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { NavBar } from '../../components/NavBar/NavBar';
import { Sidebar } from '../../components/Sidebar/Sidebar';
import './AppLayout.scss';

const NAV_SECTIONS = [
  {
    label: 'Explore',
    items: [
      {
        id: 'search',
        label: 'Quick Search',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        ),
      },
      {
        id: 'minerals',
        label: 'Minerals',
        badge: '847',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <polygon points="12 2 22 8 22 16 12 22 2 16 2 8" />
            <line x1="12" y1="2" x2="12" y2="22" />
            <line x1="2" y1="8" x2="22" y2="8" />
            <line x1="2" y1="16" x2="22" y2="16" />
          </svg>
        ),
      },
      {
        id: 'processes',
        label: 'Process Routes',
        badge: '2,140',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <circle cx="12" cy="5" r="2" />
            <circle cx="5" cy="19" r="2" />
            <circle cx="19" cy="19" r="2" />
            <line x1="12" y1="7" x2="5" y2="17" />
            <line x1="12" y1="7" x2="19" y2="17" />
          </svg>
        ),
      },
      {
        id: 'suppliers',
        label: 'Suppliers',
        badge: '312',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        ),
      },
      {
        id: 'regions',
        label: 'Regions',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Tools',
    items: [
      {
        id: 'planner',
        label: 'Extraction Planner',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        ),
      },
      {
        id: 'predictor',
        label: 'Recovery Predictor',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        ),
      },
      {
        id: 'ai-search',
        label: 'AI Search',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z" />
          </svg>
        ),
      },
    ],
  },
];

const ROUTE_MAP: Record<string, string> = {
  search: '/search',
  minerals: '/minerals',
  processes: '/processes',
  suppliers: '/suppliers',
  regions: '/regions',
  planner: '/planner',
  predictor: '/predictor',
  'ai-search': '/ai-search',
};

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const activeId =
    Object.entries(ROUTE_MAP).find(([, path]) =>
      location.pathname.startsWith(path)
    )?.[0] ?? '';

  function handleNav(id: string) {
    const route = ROUTE_MAP[id];
    if (route) navigate(route);
  }

  return (
    <div className="app-layout">
      <NavBar showSearch={!['/search', '/minerals', '/processes', '/suppliers', '/planner'].includes(location.pathname)} />
      <div className="app-layout__body">
        <Sidebar
          sections={NAV_SECTIONS}
          activeId={activeId}
          onNav={handleNav}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(c => !c)}
        />
        <main className="app-layout__main">{children}</main>
      </div>
    </div>
  );
}
