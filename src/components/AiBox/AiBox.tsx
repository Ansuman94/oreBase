import React from 'react';
import './AiBox.scss';

interface AiBoxProps {
  title?: string;
  children: React.ReactNode;
}

export function AiBox({ title = 'OreBase AI', children }: AiBoxProps) {
  return (
    <div className="ai-box">
      <div className="ai-box__head">
        <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        {title}
      </div>
      <div className="ai-box__body">{children}</div>
    </div>
  );
}
