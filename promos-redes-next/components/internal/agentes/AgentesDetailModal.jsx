'use client';

import { esRolGestor } from '@/lib/internal/constants';

export default function AgentesDetailModal({ tarea, etiquetasMarketing, userData, currentUser, onClose, onEditar, onBorrar }) {
  if (!tarea) return null;

  const partes = tarea.fecha.split('-');
  const fechaFormat = `${partes[2]}/${partes[1]}/${partes[0]}`;
  const eti = etiquetasMarketing.find((e) => e.nombre === tarea.tipo) || { color: '#f1c40f' };
  const tienePermisos = esRolGestor(userData?.rol) || currentUser?.email === tarea.creador;

  return (
    <div
      className="modal-overlay"
      style={{ display: 'flex', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(17, 23, 61, 0.8)', zIndex: 10000, justifyContent: 'center', alignItems: 'center' }}
      onClick={(e) => {
        if (e.currentTarget === e.target) onClose();
      }}
    >
      <div style={{ background: 'white', width: '90%', maxWidth: '600px', borderRadius: '12px', overflow: 'hidden', position: 'relative', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: '#11173d', color: 'white', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5em', textTransform: 'uppercase' }}>{tarea.tipo.toUpperCase()}</h2>
            <span style={{ background: eti.color, color: 'white', padding: '4px 12px', borderRadius: '20px', fontWeight: 600, fontSize: '0.75em', display: 'inline-block', marginTop: '10px' }}>{fechaFormat}</span>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {tienePermisos && (
              <>
                <button onClick={() => onEditar(tarea)} style={{ background: '#f1c40f', color: '#11173d', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85em', cursor: 'pointer', fontWeight: 'bold' }}>
                  ✏️ Editar
                </button>
                <button onClick={() => onBorrar(tarea.id)} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85em', cursor: 'pointer', fontWeight: 'bold' }}>
                  🗑️ Borrar
                </button>
              </>
            )}
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer' }}>
              ×
            </button>
          </div>
        </div>
        <div style={{ padding: '25px', color: '#11173d', fontSize: '0.95em' }}>
          <div style={{ marginBottom: '15px' }}>
            <strong style={{ color: '#f1c40f' }}>🏢 Asignado a:</strong> <span style={{ fontWeight: 'bold' }}>{tarea.asignado}</span>
          </div>
          {tarea.drive && tarea.drive.trim() !== '' && (
            <div style={{ marginBottom: '15px' }}>
              <strong style={{ color: '#f1c40f' }}>🔗 Link:</strong>
              <br />
              <a href={tarea.drive} target="_blank" rel="noopener noreferrer" style={{ color: '#3498db', wordBreak: 'break-all' }}>
                {tarea.drive}
              </a>
            </div>
          )}
          <div>
            <strong style={{ color: '#f1c40f' }}>📝 Detalles:</strong>
            <div style={{ background: '#f9fbfd', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb', marginTop: '5px', whiteSpace: 'pre-wrap', color: '#555', lineHeight: 1.5 }}>{tarea.notas || 'Sin instrucciones adicionales.'}</div>
          </div>
        </div>
        <div style={{ background: '#11173d', color: 'white', padding: '10px 20px', textAlign: 'right', fontSize: '0.8em', opacity: 0.9 }}>Cargado por: {tarea.creador}</div>
      </div>
    </div>
  );
}
