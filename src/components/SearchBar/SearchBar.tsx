import React, { useState } from 'react';
import './SearchBar.scss';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (value: string) => void;
  showButton?: boolean;
  size?: 'sm' | 'lg';
}

export function SearchBar({
  placeholder = 'Search…',
  onSearch,
  showButton = false,
  size = 'sm',
}: SearchBarProps) {
  const [value, setValue] = useState('');

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') onSearch?.(value);
  }

  return (
    <div className={`search-bar search-bar--${size}`}>
      <div className="search-bar__field">
        <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          value={value}
          placeholder={placeholder}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
      {showButton && (
        <button className="search-bar__btn" onClick={() => onSearch?.(value)}>
          Search
        </button>
      )}
    </div>
  );
}
