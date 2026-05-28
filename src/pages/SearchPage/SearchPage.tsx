import { useState } from 'react';
import type { ReactNode } from 'react';
import { PillTabs, HomeCard } from '../../components';
import { SearchBar } from '../../components/SearchBar/SearchBar';
import type { HomeCardIconVariant } from '../../components/HomeCard/HomeCard';
import './SearchPage.scss';

const SEARCH_TABS = [
  { id: 'all', label: 'All' },
  { id: 'minerals', label: 'Minerals' },
  { id: 'processes', label: 'Processes' },
  { id: 'suppliers', label: 'Suppliers' },
];

interface CardDef {
  id: string;
  name: string;
  sub: string;
  iconVariant: HomeCardIconVariant;
  icon: ReactNode;
}

const HOME_CARDS: CardDef[] = [
  {
    id: 'minerals',
    name: 'Mineral Database',
    sub: '847 minerals with full property data',
    iconVariant: 'brand',
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
    name: 'Process Routes',
    sub: '2,140 metallurgical flowsheets',
    iconVariant: 'green',
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
    id: 'planner',
    name: 'Extraction Planner',
    sub: 'Design optimal extraction circuits',
    iconVariant: 'brand',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <polyline points="9 16 11 18 15 14" />
      </svg>
    ),
  },
  {
    id: 'predictor',
    name: 'Recovery Predictor',
    sub: 'ML-driven recovery rate estimation',
    iconVariant: 'blue',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    id: 'suppliers',
    name: 'Suppliers',
    sub: '312 verified reagent & equipment suppliers',
    iconVariant: 'brown',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: 'ai-search',
    name: 'AI Search',
    sub: 'Natural-language mineral intelligence',
    iconVariant: 'olive',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z" />
      </svg>
    ),
  },
];

const STATS = [
  { label: 'Minerals', value: '847' },
  { label: 'Process routes', value: '2,140' },
  { label: 'Suppliers', value: '312' },
  { label: 'Metals', value: '18' },
];

export function SearchPage() {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div className="search-page">
      <div className="search-page__hero">
        <h1>
          The structured intelligence layer for{' '}
          <em>mining metallurgy</em>
        </h1>
        <p>
          Search, explore, and analyse mineral properties, extraction processes,
          and supply chains — powered by structured data and AI.
        </p>
      </div>

      <div className="search-page__search-wrap">
        <SearchBar
          variant="hero"
          placeholder="Search minerals, ore types, process routes…"
        />
      </div>

      <div className="search-page__tabs">
        <PillTabs tabs={SEARCH_TABS} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      <div className="search-page__grid">
        {HOME_CARDS.map(card => (
          <HomeCard
            key={card.id}
            icon={card.icon}
            iconVariant={card.iconVariant}
            name={card.name}
            sub={card.sub}
          />
        ))}
      </div>

      <div className="search-page__stats">
        {STATS.map(stat => (
          <div key={stat.label} className="search-page__stat">
            <span className="search-page__stat-num">{stat.value}</span>
            <span className="search-page__stat-lbl">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
