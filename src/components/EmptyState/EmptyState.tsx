import './EmptyState.scss';

interface EmptyStateProps {
  title: string;
  message?: string;
}

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <svg
        className="empty-state__icon"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <h4 className="empty-state__title">{title}</h4>
      {message && <p className="empty-state__message">{message}</p>}
    </div>
  );
}
