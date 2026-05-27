import React from 'react';
import './HomeCard.scss';

interface HomeCardProps {
  icon: React.ReactNode;
  iconBg?: string;
  name: string;
  sub: string;
  onClick?: () => void;
}

export function HomeCard({ icon, iconBg, name, sub, onClick }: HomeCardProps) {
  return (
    <div className="home-card" onClick={onClick}>
      <div className="home-card__icon" style={iconBg ? { background: iconBg } : undefined}>
        {icon}
      </div>
      <div className="home-card__name">{name}</div>
      <div className="home-card__sub">{sub}</div>
    </div>
  );
}
