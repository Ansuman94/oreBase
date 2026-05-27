import './SkeletonLoader.scss';

interface SkeletonLoaderProps {
  variant?: 'line' | 'block' | 'card';
  width?: string;
  height?: string;
}

export function SkeletonLoader({ variant = 'line', width, height }: SkeletonLoaderProps) {
  return (
    <div
      className={`skeleton skeleton--${variant}`}
      style={{ width, height }}
    />
  );
}
