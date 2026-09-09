'use client';

import { TAG_COTIZACION_HISTORIA, esRolGestor } from '@/lib/internal/constants';

export default function TaskDetailModal({ tarea, etiquetasMarketing, userData, currentUser, onClose, onEditar, onBorrar }) {
  if (!tarea) return null;

  const partes = tarea.fecha.split('-');
  const fechaFormat = `${partes[2]}/${partes[1]}/${partes[0]}`;
  const infoEtiqueta = etiquetasMarketing.find((e) => e.nombre === tarea.tipo) || { abrev: 'MKT', color: '#56DDE0' };
  const esGestor = esRolGestor(userData?.rol);
  const tienePermisos = esGestor || currentUser?.email === tarea.creador;

  const asignados = Array.isArray(tarea.asignado) ? tarea.asignado : [tarea.asignado];
  const esTodos = asignados.includes('TODOS');

  let contenido;
  if (tarea.tipo === TAG_COTIZACION_HISTORIA && tarea.cotiz_data) {
    const d = tarea.cotiz_data;
    contenido = (
      <ul style={{ lineHeight: 1.8, marginTop: '10px', paddingLeft: '20px', color: '#333', fontSize: '0.95em' }}>
        {d.destino && (
          <li>
            <b>📍 Destino:</b> {d.destino}
          </li>
        )}
        {d.servicios?.length > 0 && (
          <li>
            <b>✅ Servicios incluidos:</b> {d.servicios.join(' / ')}
          </li>
        )}
        {d.meses?.length > 0 && (
          <li>
            <b>📅 Meses de viaje:</b> {d.meses.join(' / ')}
          </li>
        )}
        {d.noches && (
          <li>
            <b>🌙 Noches:</b> {d.noches}
          </li>
        )}
        {d.hoteles?.length > 0 && (
          <li>
            <b>🏨 Categoría de Hotel:</b> {d.hoteles.join(' / ')}
          </li>
        )}
        {d.regimen && (
          <li>
            <b>🍽️ Régimen:</b> {d.regimen}
          </li>
        )}
        {d.cuotas && (
          <li>
            <b>💳 Con seña y cuotas:</b> {d.cuotas}
          </li>
        )}
        {d.obs && (
          <li>
            <b>📝 Observaciones:</b> <span style={{ whiteSpace: 'pre-wrap' }}>{d.obs}</span>
          </li>
        )}
        {esGestor && d.obs_internas && (
          <li style={{ color: '#c0392b', background: '#fdedec', padding: '8px', borderRadius: '6px', marginTop: '8px', listStyle: 'none' }}>
            <b>🔒 Obs. Internas:</b> <span style={{ whiteSpace: 'pre-wrap' }}>{d.obs_internas}</span>
          </li>
        )}
      </ul>
    );
  } else {
    contenido = <p style={{ whiteSpace: 'pre-wrap', color: '#555', lineHeight: 1.6, fontSize: '0.95em', marginTop: '10px' }}>{tarea.notas || 'Sin instrucciones adicionales.'}</p>;
  }

  return (
    <div
      className="modal-overlay"
      style={{ display: 'flex', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(17, 23, 61, 0.8)', zIndex: 10000, justifyContent: 'center', alignItems: 'center' }}
      onClick={(e) => {
        if (e.currentTarget === e.target) onClose();
      }}
    >
      <div className="modal-contenido" style={{ maxWidth: '700px' }}>
        <button className="modal-cerrar-btn" onClick={onClose}>
          ×
        </button>
        <div className="modal-detalle-body">
          {tienePermisos && (
            <div className="modal-tools" style={{ position: 'absolute', top: '20px', right: '70px', display: 'flex', gap: '10px' }}>
              <button className="btn btn-secundario" onClick={() => onEditar(tarea)} style={{ padding: '5px 15px', fontSize: '0.8em' }}>
                ✏️ Editar
              </button>
              <button className="btn btn-secundario" onClick={() => onBorrar(tarea.id)} style={{ padding: '5px 15px', fontSize: '0.8em', background: '#e74c3c', color: 'white' }}>
                🗑️ Borrar
              </button>
            </div>
          )}

          <div className="modal-detalle-header" style={{ display: 'block', paddingBottom: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h2 style={{ margin: 0, fontSize: '2.2em', lineHeight: 1.1, paddingRight: '170px' }}>{tarea.tipo.toUpperCase()}</h2>
            </div>
            <div style={{ marginTop: '5px' }}>
              <span style={{ backgroundColor: infoEtiqueta.color, color: 'white', padding: '4px 12px', borderRadius: '20px', fontWeight: 600, fontSize: '0.8em', display: 'inline-block', marginTop: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>{tarea.tipo}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', padding: '20px' }}>
            <div>
              <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginTop: 0, color: '#11173d' }}>Detalles de Contenido</h3>
              {contenido}
              {tarea.drive && tarea.drive.trim() !== '' && (
                <div style={{ marginTop: '20px', background: '#eef2f5', padding: '15px', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#11173d' }}>📁 Archivo / Link de Drive</h4>
                  <a href={tarea.drive} target="_blank" rel="noopener noreferrer" style={{ color: '#ef5a1a', textDecoration: 'none', wordBreak: 'break-all', fontWeight: 500 }}>
                    {tarea.drive}
                  </a>
                </div>
              )}
            </div>
            <div style={{ background: '#f9fbfd', padding: '15px', borderRadius: '8px', height: 'fit-content', border: '1px solid #e5e7eb' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#11173d', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Resumen</h4>
              <p style={{ margin: '8px 0 15px 0', fontSize: '0.95em' }}>
                <b>📅 Entrega:</b> {fechaFormat}
              </p>
              <div style={{ margin: '8px 0 4px 0', fontSize: '0.95em' }}>
                <b>🏢 Asignado a:</b>
              </div>
              {esTodos ? (
                <span style={{ background: '#eefaf6', color: '#047857', padding: '4px 10px', borderRadius: '6px', fontSize: '0.85em', fontWeight: 'bold', border: '1px solid #10b981', display: 'inline-block', marginTop: '5px' }}>
                  📢 A Todas las Franquicias
                </span>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px', marginTop: '5px' }}>
                  {asignados.map((f) => (
                    <span key={f} style={{ background: '#eff6ff', color: '#1e3a8a', padding: '4px 10px', borderRadius: '6px', fontSize: '0.85em', fontWeight: 'bold', border: '1px solid #bfdbfe' }}>
                      🏢 {f}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ background: '#11173d', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderRadius: '0 0 12px 12px' }}>
            <div style={{ textAlign: 'right' }}>
              <small style={{ opacity: 0.7 }}>Cargado por:</small>
              <div style={{ fontSize: '0.9em' }}>{tarea.creador}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
