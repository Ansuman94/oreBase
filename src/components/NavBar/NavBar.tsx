import { SearchBar } from '../SearchBar/SearchBar';
import { Button } from '../Button/Button';
import { Avatar } from '../Avatar/Avatar';
import './NavBar.scss';

interface NavBarProps {
  onSearch?: (q: string) => void;
  onAiClick?: () => void;
}

export function NavBar({ onSearch, onAiClick }: NavBarProps) {
  return (
    <nav className="navbar">
      <div className="navbar__brand">
        <div className="navbar__gem">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}>
            <polygon points="12 2 22 8 22 16 12 22 2 16 2 8" />
            <line x1="12" y1="2" x2="12" y2="22" />
            <line x1="2" y1="8" x2="22" y2="8" />
            <line x1="2" y1="16" x2="22" y2="16" />
          </svg>
        </div>
        <div>
          <div className="navbar__name">OreBase</div>
          <div className="navbar__tag">Mineral Intelligence</div>
        </div>
      </div>

      <div className="navbar__center">
        <SearchBar placeholder="Search minerals, ore types, process routes…" onSearch={onSearch} showButton />
        <Button variant="ghost" onClick={onAiClick}>✦ AI Search</Button>
      </div>

      <div className="navbar__right">
        <Avatar initials="ME" variant="brand" />
      </div>
    </nav>
  );
}
