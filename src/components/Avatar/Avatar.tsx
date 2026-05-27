import './Avatar.scss';

export type AvatarVariant = 'brand' | 'blue';

interface AvatarProps {
  initials: string;
  variant?: AvatarVariant;
  size?: 'sm' | 'md';
}

export function Avatar({ initials, variant = 'brand', size = 'md' }: AvatarProps) {
  return (
    <div className={`avatar avatar--${variant} avatar--${size}`}>
      {initials}
    </div>
  );
}
