'use client';

import { useState } from 'react';

export default function EtiquetasManager({ etiquetas, onAgregar, onBorrar }) {
  const [nombre, setNombre] = useState('');
  const [abrev, setAbrev] = useState('');
  const [color, setColor] = useState('#3498db');

  const handleAgregar = async () => {
    const ok = await onAgregar({ nombre, abrev, color });
    if (ok) {
      setNombre('');
      setAbrev('');
    }
  };

  return (
    <div className="user-list-card" style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
      <h3 style={{ padding: '15px 20px 5px 20px', color: '#11173d', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>🏷️ Etiquetas de Marketing</h3>
      <p style={{ padding: '0 20px 10px 20px', margin: 0, color: '#666', fontSize: '0.9em' }}>Creá los tipos de contenido con colores para el calendario.</p>

      <div style={{ padding: '20px', borderTop: '1px solid #eee' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'flex-end' }}>
          <div style={{ flex: 2 }}>
            <input type="text" placeholder="Nombre (Ej: Posteo Instagram)" value={nombre} onChange={(e) => setNombre(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px' }} />
          </div>
          <div style={{ flex: 1 }}>
            <input type="text" placeholder="Abrev (Ej: POST)" value={abrev} onChange={(e) => setAbrev(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px' }} />
          </div>
          <div style={{ flex: 1 }}>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: '100%', height: '40px', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', padding: '2px' }} />
          </div>
          <div>
            <button onClick={handleAgregar} style={{ background: '#11173d', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', height: '40px' }}>
              + Crear
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {etiquetas.length === 0 ? (
            <span style={{ color: '#999', fontSize: '0.9em' }}>Cargando etiquetas...</span>
          ) : (
            etiquetas.map((eti, index) => (
              <div key={eti.nombre} style={{ background: `${eti.color}15`, border: `1px solid ${eti.color}`, color: '#11173d', padding: '5px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85em' }}>
                <span style={{ background: eti.color, color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.8em' }}>{eti.abrev}</span>
                <b>{eti.nombre}</b>
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
