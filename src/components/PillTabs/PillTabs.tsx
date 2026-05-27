import './PillTabs.scss';

export interface PillTab {
  id: string;
  label: string;
}

interface PillTabsProps {
  tabs: PillTab[];
  activeTab: string;
  onChange: (id: string) => void;
}

export function PillTabs({ tabs, activeTab, onChange }: PillTabsProps) {
  return (
    <div className="pill-tabs">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`pill-tabs__tab ${activeTab === tab.id ? 'pill-tabs__tab--active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
