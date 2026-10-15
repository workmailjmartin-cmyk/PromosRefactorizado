'use client';
import { useState, useEffect } from 'react';
import { useAlert } from '@/contexts/AlertContext';

// 🔴 URLs DE TUS WEBHOOKS DE N8N
const WEBHOOK_URL_LEER = 'https://n8n.felizviaje.ar/webhook/leer-reglas';
const WEBHOOK_URL_ACTUALIZAR = 'https://n8n.felizviaje.ar/webhook/actualizar-regla';
const WEBHOOK_URL_ELIMINAR = 'https://n8n.felizviaje.ar/webhook/eliminar-regla';

export default function HistorialReglas({ equiposChatwoot }) {
  const { showAlert } = useAlert();
  const [reglas, setReglas] = useState([]);
  
  // ESTADOS PARA LOS FILTROS
  const [filtroEquipo, setFiltroEquipo] = useState('');
  const [filtroPalabras, setFiltroPalabras] = useState(''); // <-- NUEVO FILTRO DE BÚSQUEDA
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, id_regla: null });
  const [loading, setLoading] = useState(true);

  const cargarReglas = async () => {
    setLoading(true);
    try {
      const response = await fetch(WEBHOOK_URL_LEER, { method: 'GET' });
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setReglas(data);
      } else if (data && Array.isArray(data.reglas)) {
        setReglas(data.reglas);
      } else {
        setReglas([]);
      }
    } catch (error) {
      if (showAlert) showAlert('No se pudo cargar el historial desde el servidor.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarReglas(); }, []);

  const actualizarVencimiento = async (id_regla, nuevaFecha) => {
    if (!id_regla) return;
    try {
      const response = await fetch(WEBHOOK_URL_ACTUALIZAR, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_regla: String(id_regla), vencimiento: nuevaFecha })
      });
      if (response.ok) {
        if (showAlert) showAlert('Plazo de vigencia actualizado.', 'success');
        cargarReglas(); 
      }
    } catch (error) {
      if (showAlert) showAlert('Error al actualizar la fecha.', 'error');
    }
  };

  // 1. Abre el modal
  const confirmarEliminar = (id_regla) => {
    if (!id_regla) return;
    setConfirmDialog({ isOpen: true, id_regla });
  };

  // 2. Cierra el modal
  const closeConfirm = () => {
    setConfirmDialog({ isOpen: false, id_regla: null });
  };

  // 3. Ejecuta la eliminación real cuando el usuario toca "Aceptar" en el modal
  const ejecutarEliminacion = async () => {
    const id_regla = confirmDialog.id_regla;
    closeConfirm(); // Cerramos el modal inmediatamente
    
    try {
      const response = await fetch(WEBHOOK_URL_ELIMINAR, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_regla: String(id_regla) })
      });
      if (response.ok) {
        if (showAlert) showAlert('Automatización eliminada.', 'success');
        cargarReglas();
      }
    } catch (error) {
      if (showAlert) showAlert('Error al intentar eliminar la regla.', 'error');
    }
  };

  // --- NUEVA FUNCIÓN PARA COPIAR AL PORTAPAPELES ---
  const handleCopiarMensaje = (texto) => {
    if (!texto) return;
    navigator.clipboard.writeText(texto);
    if (showAlert) showAlert('¡Mensaje copiado al portapapeles!', 'success');
  };

  // --- LÓGICA DE FILTRADO COMBINADO ---
  const reglasFiltradas = reglas.filter(r => {
    // 1. Filtro por equipo
    const coincideEquipo = filtroEquipo ? String(r.equipo_id) === String(filtroEquipo) : true;
    
    // 2. Filtro por palabras clave (destino, salida, mes)
    const stringBusqueda = `${r.destino || ''} ${r.salida || ''} ${r.mes || ''}`.toLowerCase();
    const coincidePalabras = filtroPalabras ? stringBusqueda.includes(filtroPalabras.toLowerCase()) : true;
    
    return coincideEquipo && coincidePalabras;
  });

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', marginTop: '10px' }}>
        <h3 style={{ color: '#0369a1', margin: '0 0 10px 0' }}>⏳ Sincronizando con Base de Datos...</h3>
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #e5e7eb', marginTop: '10px' }}>
      
      {/* CABECERA Y FILTROS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <h2 style={{ margin: 0, color: '#11173d', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📋 Historial de Automatizaciones
        </h2>
        
        {/* BARRA DE BÚSQUEDA Y SELECTOR DE EQUIPO */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flex: '1', justifyContent: 'flex-end' }}>
          <input 
            type="text" 
            placeholder="🔍 Buscar destino o salida..." 
            value={filtroPalabras}
            onChange={(e) => setFiltroPalabras(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', background: '#fff', minWidth: '220px' }}
          />
          <select value={filtroEquipo} onChange={(e) => setFiltroEquipo(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', background: '#f8fafc', fontWeight: 'bold', color: '#374151' }}>
            <option value="">Todos los Equipos</option>
            {equiposChatwoot && equiposChatwoot.map((eq, idx) => (
              <option key={idx} value={eq.value}>{eq.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* LISTA DE REGLAS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {reglasFiltradas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', background: '#f9fafb', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
            <p style={{ color: '#6b7280', fontStyle: 'italic', margin: 0 }}>No hay reglas que coincidan con la búsqueda.</p>
          </div>
        ) : (
          reglasFiltradas.map((regla, index) => {
            const keywords = [regla.destino, regla.salida, regla.mes].filter(Boolean).join(' • ');

            return (
              <div key={regla.id_regla || index} style={{ display: 'flex', flexDirection: 'column', padding: '15px 20px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc', transition: 'all 0.2s' }}>
                
                {/* FILA SUPERIOR: INFO GENERAL Y BOTONES */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
                  <div style={{ flex: '1 1 250px' }}>
                    <div style={{ fontSize: '0.85rem', color: '#0369a1', fontWeight: '900', textTransform: 'uppercase', marginBottom: '5px' }}>
                      {regla.nombre || `Regla ID: ${regla.id_regla}`}
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#11173d', fontSize: '1rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      🔑 Palabras Clave: <span style={{ color: '#ef5a1a' }}>{keywords}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ textAlign: 'right', background: '#fff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px' }}>Vencimiento</div>
                      <input 
                        type="date" 
                        value={regla.vencimiento || ''} 
                        onChange={(e) => actualizarVencimiento(regla.id_regla, e.target.value)}
                        style={{ border: 'none', background: 'transparent', fontWeight: 'bold', color: '#11173d', outline: 'none', cursor: 'pointer', fontSize: '1rem', padding: 0 }}
                      />
                    </div>
                    
                    <button 
                      onClick={() => confirmarEliminar(regla.id_regla)} 
                      title="Eliminar de Chatwoot y Base de Datos"
                      style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* FILA INFERIOR: TEXTO DEL MENSAJE Y BOTÓN COPIAR */}
                {(regla.mensaje || regla.meta_message) && (
                  <div style={{ marginTop: '15px', padding: '12px 15px', background: '#e2e8f0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '15px' }}>
                    <div style={{ fontSize: '0.85rem', color: '#475569', fontStyle: 'italic', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                      &quot;{regla.mensaje || regla.meta_message}&quot;
                    </div>
                    <button 
                      onClick={() => handleCopiarMensaje(regla.mensaje || regla.meta_message)}
                      style={{ background: '#cbd5e1', color: '#1e293b', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}
                    >
                      📋 Copiar
                    </button>
                  </div>
                )}
                
              </div>
            );
          })
        )}
      </div>
      {/* MODAL DE CONFIRMACIÓN ESTILIZADO */}
        {confirmDialog.isOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(17, 23, 61, 0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
            <div style={{ background: '#fff', padding: '30px', borderRadius: '16px', maxWidth: '400px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🤔</div>
              <h3 style={{ margin: '0 0 10px 0', color: '#11173d', fontSize: '1.2rem', fontWeight: 900 }}>¿Estás seguro?</h3>
              <p style={{ color: '#4b5563', fontSize: '0.95rem', marginBottom: '25px', lineHeight: '1.5' }}>
                ¿Querés eliminar definitivamente esta automatización de Chatwoot y la Base de Datos?
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button 
                  type="button" 
                  onClick={closeConfirm} 
                  style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', color: '#374151', fontWeight: 'bold', cursor: 'pointer', flex: 1, transition: 'background 0.2s' }} 
                  onMouseOver={e=>e.currentTarget.style.background='#f3f4f6'} 
                  onMouseOut={e=>e.currentTarget.style.background='#fff'}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  onClick={ejecutarEliminacion} 
                  style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#ef5a1a', color: '#fff', fontWeight: 'bold', cursor: 'pointer', flex: 1, transition: 'background 0.2s' }} 
                  onMouseOver={e=>e.currentTarget.style.background='#ea580c'} 
                  onMouseOut={e=>e.currentTarget.style.background='#ef5a1a'}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}