import React from 'react';
import './HomeCard.scss';

export type HomeCardIconVariant = 'brand' | 'green' | 'blue' | 'brown' | 'olive';

interface HomeCardProps {
  icon: React.ReactNode;
  iconVariant?: HomeCardIconVariant;
  name: string;
  sub: React.ReactNode;
  onClick?: () => void;
}

export function HomeCard({ icon, iconVariant = 'brand', name, sub, onClick }: HomeCardProps) {
  return (
    <div className="home-card" onClick={onClick}>
      <div className={`home-card__icon home-card__icon--${iconVariant}`}>
        {icon}
      </div>
      <div className="home-card__name">{name}</div>
      <div className="home-card__sub">{sub}</div>
    </div>
  );
}
