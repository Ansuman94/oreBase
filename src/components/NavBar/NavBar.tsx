import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchBar } from '../SearchBar/SearchBar';
import { Button } from '../Button/Button';
import { Avatar } from '../Avatar/Avatar';
import { useAuth } from '../../contexts/AuthContext';
import './NavBar.scss';

interface NavBarProps {
  onSearch?: (q: string) => void;
  onAiClick?: () => void;
  showSearch?: boolean;
}

function getInitials(name: string | null | undefined, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export function NavBar({ onSearch, onAiClick, showSearch = true }: NavBarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  async function handleLogout() {
    setMenuOpen(false);
    await logout();
    navigate('/login', { replace: true });
  }

  const initials = user ? getInitials(user.name, user.email) : '??';

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
        {showSearch && (
          <SearchBar placeholder="Search minerals, ore types, process routes…" onSearch={onSearch} showButton />
        )}
        <Button variant="ghost" onClick={onAiClick}>✦ AI Search</Button>
      </div>

      <div className="navbar__right">
        <div className="navbar__user-menu" ref={menuRef}>
          <button
            className="navbar__avatar-btn"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="User menu"
          >
            <Avatar initials={initials} variant="brand" />
          </button>
          {menuOpen && (
            <div className="navbar__dropdown">
              <div className="navbar__dropdown-header">
                <span className="navbar__dropdown-name">{user?.name ?? user?.email}</span>
                <span className="navbar__dropdown-role">{user?.role}</span>
              </div>
              <button className="navbar__dropdown-item navbar__dropdown-item--logout" onClick={handleLogout}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
