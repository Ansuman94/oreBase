import React from 'react';
import './Checkbox.scss';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  count?: number;
}

export function Checkbox({ label, count, className = '', ...props }: CheckboxProps) {
  return (
    <label className={`checkbox ${className}`}>
      <input type="checkbox" className="checkbox__input" {...props} />
      <span className="checkbox__label">{label}</span>
      {count !== undefined && (
        <span className="checkbox__count">{count.toLocaleString()}</span>
      )}
    </label>
  );
}
