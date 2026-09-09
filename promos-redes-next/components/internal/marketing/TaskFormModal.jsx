'use client';

import { useEffect, useState } from 'react';
import FranchiseMultiSelect from './FranchiseMultiSelect';
import ToggleCheckboxGroup from './ToggleCheckboxGroup';
import { TAG_COTIZACION_HISTORIA } from '@/lib/internal/constants';

const SERVICIOS_OPCIONES = ['Paquete', 'Vuelos', 'Alojamientos', 'Circuitos', 'Traslado'];
const MESES_OPCIONES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MESES_LABELS = { Enero: 'Ene', Febrero: 'Feb', Marzo: 'Mar', Abril: 'Abr', Mayo: 'May', Junio: 'Jun', Julio: 'Jul', Agosto: 'Ago', Septiembre: 'Sep', Octubre: 'Oct', Noviembre: 'Nov', Diciembre: 'Dic' };
const HOTELES_OPCIONES = ['Low cost', 'Medium', 'Premium'];

const estadoInicial = () => ({
  tipo: '',
  asignados: [],
  drive: '',
  notas: '',
  cotizDestino: '',
  cotizServicios: [],
  cotizMeses: [],
  cotizNoches: '',
  cotizHoteles: [],
  cotizRegimen: 'Sin regimen',
  cotizCuotas: 'Si',
  cotizObs: '',
  cotizObsInternas: '',
});

export default function TaskFormModal({ visible, fecha, editingTask, franquicias, etiquetasMarketing, esGestor, currentUser, userData, onClose, onGuardar }) {
  const [form, setForm] = useState(estadoInicial);

  useEffect(() => {
    if (!visible) return;
    if (editingTask) {
      const asignados = Array.isArray(editingTask.asignado) ? editingTask.asignado : [editingTask.asignado];
      const d = editingTask.cotiz_data || {};
      setForm({
        tipo: editingTask.tipo || '',
        asignados,
        drive: editingTask.drive || '',
        notas: editingTask.notas || '',
        cotizDestino: d.destino || '',
        cotizServicios: d.servicios || [],
        cotizMeses: d.meses || [],
        cotizNoches: d.noches || '',
        cotizHoteles: d.hoteles || [],
        cotizRegimen: d.regimen || 'Sin regimen',
        cotizCuotas: d.cuotas || 'Si',
        cotizObs: d.obs || '',
        cotizObsInternas: d.obs_internas || '',
      });
    } else {
      setForm(estadoInicial());
    }
  }, [visible, editingTask]);

  if (!visible) return null;

  const isSpecial = form.tipo === TAG_COTIZACION_HISTORIA;
  const set = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }));

  const partes = fecha.split('-');
  const fechaDisplay = `${partes[2]}/${partes[1]}/${partes[0]}`;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.asignados.length === 0) {
      alert('Tenés que asignar la tarea a al menos una franquicia');
      return;
    }

    const cotizData = isSpecial
      ? {
          destino: form.cotizDestino,
          servicios: form.cotizServicios,
          meses: form.cotizMeses,
          noches: form.cotizNoches,
          hoteles: form.cotizHoteles,
          regimen: form.cotizRegimen,
          cuotas: form.cotizCuotas,
          obs: form.cotizObs,
          obs_internas: form.cotizObsInternas,
        }
      : null;

    const payload = {
      fecha,
      tipo: form.tipo,
      asignado: form.asignados,
      drive: form.drive,
      notas: form.notas,
      cotiz_data: cotizData,
      creador: editingTask ? editingTask.creador : userData?.franquicia || currentUser?.email || 'Anónimo',
      timestamp: editingTask ? editingTask.timestamp : Date.now(),
      last_edited_by: editingTask ? currentUser?.email : null,
    };

    onGuardar(payload, editingTask?.id || null);
  };

  return (
    <div className="modal-overlay" style={{ display: 'flex', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(17, 23, 61, 0.8)', zIndex: 10000, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ background: 'white', width: '90%', maxWidth: '700px', borderRadius: '12px', padding: '25px', position: 'relative', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', fontSize: '1.5em', cursor: 'pointer', color: '#11173d' }}>
          ×
        </button>
        <h2 style={{ marginTop: 0, color: '#11173d' }}>📝 Asignar Tarea</h2>
        <p style={{ color: '#6b7280', fontSize: '0.9em', marginBottom: '20px' }}>
          Fecha de entrega: <strong>{fechaDisplay}</strong>
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Tipo de Contenido</label>
            <select required value={form.tipo} onChange={(e) => set('tipo')(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <option value="">Seleccionar...</option>
              {etiquetasMarketing.map((eti) => (
                <option key={eti.nombre} value={eti.nombre}>
                  {eti.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label>Asignado a (Podés tildar varias)</label>
            <FranchiseMultiSelect franquicias={franquicias} selected={form.asignados} onChange={set('asignados')} />
          </div>

          {!isSpecial && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Link de Carpeta (Google Drive)</label>
                <input type="url" placeholder="https://drive.google.com/..." value={form.drive} onChange={(e) => set('drive')(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Instrucciones y Detalles</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ej: Subir el video en formato vertical, usar logo blanco..."
                  value={form.notas}
                  onChange={(e) => set('notas')(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontFamily: 'inherit' }}
                />
              </div>
            </div>
          )}

          {isSpecial && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', background: '#fffdf0', padding: '20px', borderRadius: '8px', border: '1px solid #f1c40f' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>
                  📍 Destino <span style={{ color: 'red' }}>*</span>
                </label>
                <input required value={form.cotizDestino} onChange={(e) => set('cotizDestino')(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label>✅ Servicio</label>
                <ToggleCheckboxGroup options={SERVICIOS_OPCIONES} selected={form.cotizServicios} onChange={set('cotizServicios')} />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label>📅 Fechas de Viaje</label>
                <ToggleCheckboxGroup options={MESES_OPCIONES} selected={form.cotizMeses} onChange={set('cotizMeses')} labels={MESES_LABELS} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>🌙 Noches</label>
                  <input placeholder="Ej: 7 noches..." value={form.cotizNoches} onChange={(e) => set('cotizNoches')(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>🍽️ Régimen</label>
                  <select value={form.cotizRegimen} onChange={(e) => set('cotizRegimen')(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
                    <option value="Sin regimen">Sin régimen</option>
                    <option value="Desayuno">Desayuno</option>
                    <option value="Media Pension">Media Pensión</option>
                    <option value="All Inclusive">All Inclusive</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label>🏨 Tipo de Hotel</label>
                <ToggleCheckboxGroup options={HOTELES_OPCIONES} selected={form.cotizHoteles} onChange={set('cotizHoteles')} />
              </div>

              <div className="form-group" style={{ margin: 0, borderTop: '1px dashed #d1d5db', paddingTop: '10px' }}>
                <label>💳 Con seña y cuotas</label>
                <select value={form.cotizCuotas} onChange={(e) => set('cotizCuotas')(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
                  <option value="Si">Sí</option>
                  <option value="No">No</option>
                </select>
                <small style={{ color: '#d35400', display: 'block', marginTop: '4px', lineHeight: 1.2 }}>
                  * Para calcular seña hacer NETO AEREO + Ganancia: Las cuotas son los meses que queden a la salida. Todos los servicios con cancelación gratis.
                </small>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label>📝 Observaciones</label>
                <textarea rows={2} value={form.cotizObs} onChange={(e) => set('cotizObs')(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontFamily: 'inherit' }} />
              </div>

              {esGestor && (
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ color: '#c0392b' }}>🔒 Observaciones Internas (Solo Admin/Editores)</label>
                  <textarea
                    rows={2}
                    value={form.cotizObsInternas}
                    onChange={(e) => set('cotizObsInternas')(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #fadbd8', background: '#fdedec', fontFamily: 'inherit' }}
                  />
                </div>
              )}
            </div>
          )}

          <button type="submit" style={{ background: '#ef5a1a', color: 'white', border: 'none', padding: '14px', borderRadius: '8px', fontSize: '1.1em', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
            Guardar y Asignar
          </button>
        </form>
      </div>
    </div>
  );
}
