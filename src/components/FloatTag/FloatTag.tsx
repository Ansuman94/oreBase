import './FloatTag.scss';

export type FloatTier = 'vg' | 'g' | 'm' | 'p' | 'n';

interface FloatTagProps {
  label: string;
  tier: FloatTier;
  active?: boolean;
  onClick?: () => void;
}

export function FloatTag({ label, tier, active = false, onClick }: FloatTagProps) {
  return (
    <button
      className={`float-tag float-tag--${tier} ${active ? 'float-tag--active' : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
