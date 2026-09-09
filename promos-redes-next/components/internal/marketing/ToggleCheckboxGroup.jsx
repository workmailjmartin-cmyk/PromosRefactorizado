'use client';

export default function ToggleCheckboxGroup({ options, selected, onChange, labels }) {
  const toggle = (value) => {
    if (selected.includes(value)) onChange(selected.filter((v) => v !== value));
    else onChange([...selected, value]);
  };

  return (
    <div className="toggle-btn-group">
      {options.map((value) => (
        <label className="toggle-btn-label" key={value}>
          <input type="checkbox" className="toggle-btn-input" checked={selected.includes(value)} onChange={() => toggle(value)} />
          <span className="toggle-btn-text">{labels ? labels[value] : value}</span>
        </label>
      ))}
    </div>
  );
}
