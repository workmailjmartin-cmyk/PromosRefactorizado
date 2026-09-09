'use client';

import { useMemo, useState } from 'react';

export default function UsersList({ usuarios, loading, onEditar, onBorrar }) {
  const [busqueda, setBusqueda] = useState('');

  const visibles = useMemo(() => {
    const termino = busqueda.toLowerCase();
    if (!termino) return usuarios;
    return usuarios.filter((u) => `${u.email} ${u.rol} ${u.franquicia}`.toLowerCase().includes(termino));
  }, [usuarios, busqueda]);

  return (
    <div className="user-list-card">
      <h3 style={{ padding: '0 20px', color: '#777' }}>Usuarios Existentes</h3>
      <div style={{ padding: '0 20px 15px 20px' }}>
        <input
          type="text"
          placeholder="🔍 Buscar por email o franquicia..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb', boxSizing: 'border-box', fontSize: '0.9em' }}
        />
      </div>
      <div>
        {loading ? (
          'Cargando...'
        ) : (
          visibles.map((u) => (
            <div className="user-item" key={u.email}>
              <span>
                <b>{u.email}</b>
                <br />
                <small>
                  {(u.rol || '').toUpperCase()} - {u.franquicia}
                </small>
              </span>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button className="btn btn-secundario" style={{ padding: '4px 10px' }} onClick={() => onEditar(u)}>
                  ✏️
                </button>
                <button className="btn btn-secundario" style={{ padding: '4px 10px' }} onClick={() => onBorrar(u.email)}>
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
