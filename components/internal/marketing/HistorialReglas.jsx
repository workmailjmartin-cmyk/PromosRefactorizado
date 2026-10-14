'use client';
import { useState, useEffect } from 'react';
import { useAlert } from '@/contexts/AlertContext';

// ACA VAN LAS NUEVAS URLs DE TUS WEBHOOKS DE N8N (Completalas en n8n luego)
const WEBHOOK_URL_LEER = 'https://n8n.felizviaje.ar/webhook/leer-reglas';
const WEBHOOK_URL_ACTUALIZAR = 'https://n8n.felizviaje.ar/webhook/actualizar-regla';
const WEBHOOK_URL_ELIMINAR = 'https://n8n.felizviaje.ar/webhook/eliminar-regla';

export default function HistorialReglas({ equiposChatwoot }) {
  const { showAlert } = useAlert();
  const [reglas, setReglas] = useState([]);
  const [filtroEquipo, setFiltroEquipo] = useState('');
  const [loading, setLoading] = useState(true);

  // 1. LEER DESDE N8N (EXCEL)
  const cargarReglas = async () => {
    setLoading(true);
    try {
      const response = await fetch(WEBHOOK_URL_LEER, { method: 'GET' });
      const data = await response.json();
      
      // Asumimos que n8n devuelve un array de objetos desde el Excel
      setReglas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar historial desde n8n:", error);
      if (showAlert) showAlert('No se pudo cargar el historial desde el servidor.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarReglas(); }, []);

  // 2. ACTUALIZAR EN N8N (EXCEL + CHATWOOT)
  const actualizarVencimiento = async (id_regla, nuevaFecha) => {
    try {
      const response = await fetch(WEBHOOK_URL_ACTUALIZAR, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_regla, vencimiento: nuevaFecha })
      });

      if (response.ok) {
        if (showAlert) showAlert('Plazo de vigencia actualizado.', 'success');
        cargarReglas(); // Recargamos para ver los cambios
      } else {
        throw new Error('Error en el servidor n8n');
      }
    } catch (error) {
      if (showAlert) showAlert('Error al actualizar la fecha.', 'error');
    }
  };

  // 3. ELIMINAR EN N8N (EXCEL + CHATWOOT)
  const eliminarRegla = async (id_regla) => {
    if (!window.confirm('¿Seguro que querés eliminar esta automatización por completo?')) return;
    
    try {
      const response = await fetch(WEBHOOK_URL_ELIMINAR, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_regla })
      });

      if (response.ok) {
        if (showAlert) showAlert('Automatización eliminada.', 'success');
        cargarReglas(); // Recargamos para ver los cambios
      } else {
        throw new Error('Error en el servidor n8n');
      }
    } catch (error) {
      if (showAlert) showAlert('Error al eliminar.', 'error');
    }
  };

  const reglasFiltradas = filtroEquipo 
    ? reglas.filter(r => String(r.equipo_id) === String(filtroEquipo)) 
    : reglas;

  if (loading) return <div style={{ padding: '20px', textAlign: 'center', fontWeight: 'bold' }}>⏳ Sincronizando con Excel...</div>;

  return (
    <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #e5e7eb', marginTop: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <h2 style={{ margin: 0, color: '#11173d', fontSize: '1.2rem' }}>📋 Historial (Sincronizado con Excel)</h2>
        <select value={filtroEquipo} onChange={(e) => setFiltroEquipo(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}>
          <option value="">Todos los Equipos</option>
          {equiposChatwoot && equiposChatwoot.map((eq, idx) => (
            <option key={idx} value={eq.value}>{eq.label}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {reglasFiltradas.length === 0 ? (
          <p style={{ color: '#6b7280', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>No hay reglas registradas en el Excel para este filtro.</p>
        ) : (
          reglasFiltradas.map((regla, index) => {
            // Armamos las palabras clave en base a lo que mande n8n
            const keywords = [regla.destino, regla.salida, regla.mes].filter(Boolean).join(' • ');

            return (
              <div key={regla.id_regla || index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', flexWrap: 'wrap', gap: '15px' }}>
                <div style={{ flex: '1 1 250px' }}>
                  <div style={{ fontSize: '0.85rem', color: '#0369a1', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>
                    {regla.nombre || `Regla ID: ${regla.id_regla}`}
                  </div>
                  <div style={{ fontWeight: 'bold', color: '#11173d', marginBottom: '5px', fontSize: '0.95rem' }}>
                    Palabras Clave: <span style={{ color: '#ef5a1a' }}>{keywords}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ textAlign: 'right', background: '#fef3c7', padding: '8px 12px', borderRadius: '6px', border: '1px solid #fde68a', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 'bold', textTransform: 'uppercase' }}>Vencimiento</div>
                    <input 
                      type="date" 
                      value={regla.vencimiento || ''} 
                      onChange={(e) => actualizarVencimiento(regla.id_regla, e.target.value)}
                      style={{ border: 'none', background: 'transparent', fontWeight: 'bold', color: '#11173d', outline: 'none', cursor: 'pointer', fontSize: '0.95rem', padding: 0 }}
                    />
                  </div>
                  <button onClick={() => eliminarRegla(regla.id_regla)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                    🗑️
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}