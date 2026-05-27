import './Badge.scss';

export type BadgeVariant =
  | 'sulfide' | 'oxide' | 'mixed' | 'brine' | 'carbonate' | 'process'
  | 'ok' | 'warn' | 'bad'
  | 'silicate' | 'native' | 'phosphate' | 'sulfate' | 'halide'
  | 'float-vg' | 'float-g' | 'float-m' | 'float-p' | 'float-n';

interface BadgeProps {
  variant: BadgeVariant;
  label: string;
}

export function Badge({ variant, label }: BadgeProps) {
  return (
    <span className={`badge badge--${variant}`}>{label}</span>
  );
}
