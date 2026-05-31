import './MetalButton.scss';

interface MetalButtonProps {
  metal: string;
  color: string;
  count?: number;
  active?: boolean;
  onClick?: () => void;
}

export function MetalButton({ metal, color, count, active = false, onClick }: MetalButtonProps) {
  return (
    <button
      className={`metal-btn ${active ? 'metal-btn--active' : ''}`}
      onClick={onClick}
      style={active ? { borderColor: color } : undefined}
    >
      <span className="metal-btn__dot" style={{ background: color }} />
      <span className="metal-btn__label">{metal}</span>
      {count !== undefined && (
        <span className="metal-btn__count">{count}</span>
      )}
    </button>
  );
}
