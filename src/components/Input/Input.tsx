import React from 'react';
import './Input.scss';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
}

export function Input({ label, helperText, className = '', ...props }: InputProps) {
  return (
    <div className="field">
      {label && <label className="field__label">{label}</label>}
      <input className={`field__input ${className}`} {...props} />
      {helperText && <span className="field__helper">{helperText}</span>}
    </div>
  );
}
