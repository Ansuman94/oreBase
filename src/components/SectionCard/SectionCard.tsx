import React from 'react';
import './SectionCard.scss';

interface SectionCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({ title, children, className = '' }: SectionCardProps) {
  return (
    <div className={`section-card ${className}`}>
      {title && <h3 className="section-card__title">{title}</h3>}
      {children}
    </div>
  );
}
