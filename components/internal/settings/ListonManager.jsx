'use client';

import { useEffect, useState } from 'react';

export default function ListonManager({ textoListon, onGuardar }) {
  const [texto, setTexto] = useState(textoListon);

  useEffect(() => setTexto(textoListon), [textoListon]);

  return (
    <div className="user-list-card" style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden', marginTop: '20px' }}>
      <h3 style={{ padding: '15px 20px 5px 20px', color: '#11173d', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>🎀 Texto Listón &quot;Solo X Hoy&quot;</h3>
      <p style={{ padding: '0 20px 10px 20px', margin: 0, color: '#666', fontSize: '0.9em' }}>Personalizá el texto de la cinta celeste que ven los clientes. (Máx 15 caracteres).</p>

      <div style={{ padding: '20px', borderTop: '1px solid #eee', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          type="text"
          maxLength={15}
          placeholder="Ej: ÚLTIMOS LUGARES"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          style={{ flex: 1, padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontWeight: 'bold', textTransform: 'uppercase' }}
        />
        <button onClick={() => onGuardar(texto)} style={{ background: '#11173d', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          Guardar Texto
        </button>
      </div>
    </div>
  );
}
