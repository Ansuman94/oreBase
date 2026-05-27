import React, { useState } from 'react';
import './RangeSlider.scss';

interface RangeSliderProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  defaultValue?: number;
  unit?: string;
  minLabel?: string;
  maxLabel?: string;
  onChange?: (value: number) => void;
}

export function RangeSlider({
  label,
  min,
  max,
  step = 1,
  defaultValue,
  unit = '',
  minLabel,
  maxLabel,
  onChange,
}: RangeSliderProps) {
  const [value, setValue] = useState(defaultValue ?? min);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value);
    setValue(v);
    onChange?.(v);
  }

  return (
    <div className="range-slider">
      <label className="range-slider__label">
        {label}
        <span className="range-slider__value">{value}{unit}</span>
      </label>
      <input
        type="range"
        className="range-slider__input"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
      />
      {(minLabel || maxLabel) && (
        <div className="range-slider__hints">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  );
}
