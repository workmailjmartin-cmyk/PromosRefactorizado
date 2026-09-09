'use client';

import { useState } from 'react';

export default function TiposPromocionManager({ tiposPromocion, onAgregar, onBorrar }) {
  const [nombre, setNombre] = useState('');
  const [alcance, setAlcance] = useState('todos');

  const handleAgregar = async () => {
    const ok = await onAgregar({ nombre, alcance });
    if (ok) setNombre('');
  };

  return (
    <div className="user-list-card" style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden', marginTop: '20px' }}>
      <h3 style={{ padding: '15px 20px 5px 20px', color: '#11173d', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>🚀 Tipos de Promoción</h3>
      <p style={{ padding: '0 20px 10px 20px', margin: 0, color: '#666', fontSize: '0.9em' }}>Administrá las promociones disponibles y su privacidad.</p>

      <div style={{ padding: '20px', borderTop: '1px solid #eee' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'flex-end' }}>
          <div style={{ flex: 2 }}>
            <input type="text" placeholder="Nombre (Ej: Black Friday)" value={nombre} onChange={(e) => setNombre(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px' }} />
          </div>
          <div style={{ flex: 1 }}>
            <select value={alcance} onChange={(e) => setAlcance(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
              <option value="todos">Para Todos</option>
              <option value="casa_central">Solo Casa Central</option>
            </select>
          </div>
          <div>
            <button onClick={handleAgregar} style={{ background: '#11173d', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', height: '40px' }}>
              + Crear
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {tiposPromocion.length === 0 ? (
            <span style={{ color: '#999', fontSize: '0.9em' }}>Cargando promociones...</span>
          ) : (
            tiposPromocion.map((p, index) => (
              <div
                key={p.nombre}
                style={{
                  background: p.alcance === 'casa_central' ? '#fef3e2' : '#eefaf6',
                  border: `1px solid ${p.alcance === 'casa_central' ? '#f5a623' : '#a7e0cf'}`,
                  color: '#11173d',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.85em',
                }}
              >
                {p.alcance === 'casa_central' && <span title="Solo Casa Central">🔒</span>}
                <b>{p.nombre}</b>
                <button onClick={() => onBorrar(index)} style={{ background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer', fontWeight: 'bold' }}>
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
