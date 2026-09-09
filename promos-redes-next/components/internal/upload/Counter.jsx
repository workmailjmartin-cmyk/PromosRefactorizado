'use client';

export default function Counter({ value, onChange }) {
  const v = parseInt(value) || 0;
  return (
    <div className="counter-wrapper">
      <button type="button" className="counter-btn" onClick={() => onChange(Math.max(0, v - 1))}>
        -
      </button>
      <span className="counter-value">{v}</span>
      <button type="button" className="counter-btn" onClick={() => onChange(v + 1)}>
        +
      </button>
    </div>
  );
}
