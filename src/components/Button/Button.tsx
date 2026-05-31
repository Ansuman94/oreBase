import React from 'react';
import './Button.scss';

export type ButtonVariant = 'primary' | 'ghost' | 'subtle' | 'run';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: React.ReactNode;
}

export function Button({
  variant = 'primary',
  icon,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button className={`btn btn--${variant} ${className}`} {...props}>
      {icon && <span className="btn__icon">{icon}</span>}
      {children}
    </button>
  );
}
