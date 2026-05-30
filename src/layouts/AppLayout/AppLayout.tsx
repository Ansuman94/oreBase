import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { NavBar } from '../../components/NavBar/NavBar';
import { Sidebar } from '../../components/Sidebar/Sidebar';
import { fetchStats } from '../../api/stats';
import type { AppStats } from '../../api/stats';
import { useAuth } from '../../contexts/AuthContext';
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
            <path d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18Z" />
            <path d="M6 12H4a2 2 0 00-2 2v6a2 2 0 002 2h2" />
            <path d="M18 9h2a2 2 0 012 2v9a2 2 0 01-2 2h-2" />
            <line x1="10" y1="6" x2="14" y2="6" />
            <line x1="10" y1="10" x2="14" y2="10" />
            <line x1="10" y1="14" x2="14" y2="14" />
          </svg>
        ),
      },
      {
        id: 'regions',
        label: 'Regions',
        hidden: true,
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

const ADMIN_SECTION = {
  label: 'Admin',
  items: [
    {
      id: 'users',
      label: 'User Management',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87" />
          <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
      ),
    },
  ],
};

const ROUTE_MAP: Record<string, string> = {
  search: '/search',
  minerals: '/minerals',
  processes: '/processes',
  suppliers: '/suppliers',
  regions: '/regions',
  planner: '/planner',
  predictor: '/predictor',
  'ai-search': '/ai-search',
  users: '/users',
};

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [stats, setStats]           = useState<AppStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  const badgeOverrides: Record<string, string> = stats ? {
    minerals:  stats.minerals.toLocaleString(),
    processes: stats.processRoutes.toLocaleString(),
    suppliers: stats.suppliers.toLocaleString(),
  } : {};

  const BADGE_ITEMS = new Set(['minerals', 'processes', 'suppliers']);

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
      <NavBar showSearch={!['/search', '/minerals', '/processes', '/suppliers', '/planner', '/predictor'].includes(location.pathname)} />
      <div className="app-layout__body">
        <Sidebar
          sections={[...NAV_SECTIONS, ...(user?.role === 'admin' ? [ADMIN_SECTION] : [])].map(s => ({
            ...s,
            items: s.items
              .filter(i => !('hidden' in i) || !i.hidden)
              .map(i => ({
                ...i,
                badge:        'badge' in i ? (badgeOverrides[i.id] ?? i.badge) : undefined,
                badgeLoading: statsLoading && BADGE_ITEMS.has(i.id),
              })),
          }))}
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
