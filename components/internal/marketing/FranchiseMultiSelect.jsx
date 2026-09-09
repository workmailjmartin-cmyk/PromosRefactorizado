'use client';

import { useEffect, useRef, useState } from 'react';

export default function FranchiseMultiSelect({ franquicias, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const isTodos = selected.includes('TODOS');
  const toggle = (value) => {
    if (selected.includes(value)) onChange(selected.filter((v) => v !== value));
    else onChange([...selected, value]);
  };

  const filtradas = franquicias.filter((f) => f.toLowerCase().includes(busqueda.toLowerCase()));

  let headerContent;
  if (selected.length === 0) {
    headerContent = <span style={{ color: '#6b7280' }}>Seleccionar franquicias...</span>;
  } else if (isTodos) {
    headerContent = <span style={{ background: '#eefaf6', color: '#047857', padding: '4px 10px', borderRadius: '6px', fontSize: '0.9em', fontWeight: 'bold' }}>📢 A Todas las Franquicias</span>;
  } else {
    headerContent = <span style={{ background: '#eff6ff', color: '#1e3a8a', padding: '4px 10px', borderRadius: '6px', fontSize: '0.9em', fontWeight: 'bold' }}>{selected.length} Franquicias asignadas</span>;
  }

  return (
    <div className="custom-select-container" ref={ref}>
      <div className="custom-select-header" onClick={() => setOpen((o) => !o)}>
        {headerContent}
        <span style={{ fontSize: '0.8em', color: '#999' }}>▼</span>
      </div>
      <div className="custom-select-dropdown" style={{ display: open ? 'flex' : 'none' }}>
        <div className="custom-select-search">
          <input type="text" placeholder="🔍 Buscar franquicia..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        <div className="custom-select-list">
          <label className={`franq-item${isTodos ? ' selected' : ''}`}>
            <input type="checkbox" style={{ display: 'none' }} checked={isTodos} onChange={() => toggle('TODOS')} /> 📢 A Todas las Franquicias
          </label>
          <hr style={{ margin: '5px 0', border: 0, borderTop: '1px solid #ddd', width: '100%' }} />
          {filtradas.map((f) => (
            <label key={f} className={`franq-item${selected.includes(f) ? ' selected' : ''}`}>
              <input type="checkbox" style={{ display: 'none' }} checked={selected.includes(f)} onChange={() => toggle(f)} /> 🏢 {f}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
