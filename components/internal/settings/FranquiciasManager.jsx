'use client';

import { useState } from 'react';

function EditarFranquiciaModal({ nombreActual, onResolver }) {
  const [valor, setValor] = useState(nombreActual);

  return (
    <div className="modal-overlay" style={{ display: 'flex', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(17, 23, 61, 0.8)', zIndex: 99999, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ background: 'white', padding: '25px', borderRadius: '12px', width: '90%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
        <h3 style={{ marginTop: 0, color: '#11173d' }}>✏️ Editar Franquicia</h3>
        <p style={{ color: '#666', fontSize: '0.9em', marginBottom: '15px' }}>Modificá el nombre de la franquicia:</p>
        <input
          type="text"
          autoFocus
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          style={{ width: '100%', padding: '12px', marginBottom: '20px', border: '2px solid #e5e7eb', borderRadius: '6px', fontSize: '1em', boxSizing: 'border-box', textAlign: 'center', fontWeight: 'bold', color: '#11173d' }}
        />
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => onResolver(valor)} style={{ background: '#1e8e3e', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', flex: 1 }}>
            Guardar
          </button>
          <button onClick={() => onResolver(null)} style={{ background: '#e5e7eb', color: '#333', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', flex: 1 }}>
            Cancelar
          </button>
          <button onClick={() => onResolver('BORRAR')} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', width: '100%', marginTop: '5px' }}>
            🗑️ Eliminar Franquicia
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FranquiciasManager({ franquicias, modoEdicion, onToggleModoEdicion, onAgregar, onGestionar }) {
  const [nueva, setNueva] = useState('');
  const [editando, setEditando] = useState(null); // { index, nombre } | null

  const handleAgregar = async () => {
    const ok = await onAgregar(nueva);
    if (ok) setNueva('');
  };

  return (
    <div className="user-list-card" style={{ marginBottom: '20px' }}>
      <h3 style={{ padding: '15px 20px 5px 20px', color: '#11173d', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
        🏢 Gestión de Franquicias
        <span style={{ background: '#ef5a1a', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7em' }}>{franquicias.length}</span>
        <button
          onClick={onToggleModoEdicion}
          title="Activar/Desactivar edición"
          style={{ marginLeft: 'auto', background: modoEdicion ? '#e5e7eb' : 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2em', borderRadius: '5px', padding: '2px 5px', transition: '0.2s' }}
        >
          ✏️
        </button>
      </h3>
      <p style={{ padding: '0 20px', color: '#6b7280', fontSize: '0.85em', marginTop: '5px' }}>Agregá sucursales para que aparezcan en los menús desplegables.</p>

      <div style={{ padding: '0 20px 20px 20px', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          placeholder="Ej: Mendoza Centro..."
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
        />
        <button onClick={handleAgregar} style={{ background: '#11173d', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
          + Sumar Franquicia
        </button>
      </div>

      <div style={{ padding: '0 20px 20px 20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {franquicias.length === 0 ? (
          <span style={{ color: '#999', fontSize: '0.9em' }}>No hay franquicias cargadas aún.</span>
        ) : (
          franquicias.map((franq, index) =>
            modoEdicion ? (
              <span
                key={franq}
                onClick={() => setEditando({ index, nombre: franq })}
                title="Clic para Editar o Borrar"
                style={{ cursor: 'pointer', background: '#fce8e6', color: '#d93025', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85em', fontWeight: 'bold', border: '1px solid #fad2cf', transition: '0.2s' }}
              >
                ✏️ {franq}
              </span>
            ) : (
              <span key={franq} style={{ background: '#e6f4ea', color: '#1e8e3e', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85em', fontWeight: 'bold', border: '1px solid #ceead6' }}>
                🏢 {franq}
              </span>
            )
          )
        )}
      </div>

      {editando && (
        <EditarFranquiciaModal
          nombreActual={editando.nombre}
          onResolver={(accion) => {
            onGestionar(editando.index, editando.nombre, accion);
            setEditando(null);
          }}
        />
      )}
    </div>
  );
}
