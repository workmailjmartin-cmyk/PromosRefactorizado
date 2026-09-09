'use client';

import { useEffect, useState } from 'react';

const estadoInicial = () => ({ tipo: '', asignado: '', drive: '', notas: '' });

export default function AgentesFormModal({ visible, fecha, editingTask, franquicias, etiquetasMarketing, currentUser, userData, onClose, onGuardar }) {
  const [form, setForm] = useState(estadoInicial);

  useEffect(() => {
    if (!visible) return;
    if (editingTask) {
      setForm({ tipo: editingTask.tipo || '', asignado: editingTask.asignado || '', drive: editingTask.drive || '', notas: editingTask.notas || '' });
    } else {
      setForm(estadoInicial());
    }
  }, [visible, editingTask]);

  if (!visible) return null;

  const set = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }));
  const partes = fecha.split('-');
  const fechaDisplay = `${partes[2]}/${partes[1]}/${partes[0]}`;

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      fecha,
      tipo: form.tipo,
      asignado: form.asignado,
      drive: form.drive,
      notas: form.notas,
      creador: editingTask ? editingTask.creador : userData?.franquicia || currentUser?.email,
      timestamp: editingTask ? editingTask.timestamp : Date.now(),
      last_edited_by: editingTask ? currentUser?.email : null,
    };
    onGuardar(payload, editingTask?.id || null);
  };

  return (
    <div className="modal-overlay" style={{ display: 'flex', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(17, 23, 61, 0.8)', zIndex: 10000, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ background: 'white', width: '90%', maxWidth: '500px', borderRadius: '12px', padding: '25px', position: 'relative', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', fontSize: '1.5em', cursor: 'pointer', color: '#11173d' }}>
          ×
        </button>
        <h2 style={{ marginTop: 0, color: '#11173d' }}>🌟 Asignar Tarea Agente</h2>
        <p style={{ color: '#6b7280', fontSize: '0.9em', marginBottom: '20px' }}>
          Fecha: <strong>{fechaDisplay}</strong>
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Tipo</label>
            <select required value={form.tipo} onChange={(e) => set('tipo')(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <option value="">Seleccionar...</option>
              {etiquetasMarketing.map((eti) => (
                <option key={eti.nombre} value={eti.nombre}>
                  {eti.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label>Asignado a</label>
            <select required value={form.asignado} onChange={(e) => set('asignado')(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <option value="">Seleccionar...</option>
              <option value="TODOS">📢 A Todas las Franquicias</option>
              {franquicias.map((f) => (
                <option key={f} value={f}>
                  🏢 {f}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label>Link (Opcional)</label>
            <input type="url" value={form.drive} onChange={(e) => set('drive')(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label>Detalles</label>
            <textarea required rows={3} value={form.notas} onChange={(e) => set('notas')(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontFamily: 'inherit' }} />
          </div>

          <button type="submit" style={{ background: '#f1c40f', color: '#11173d', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
            Guardar y Asignar
          </button>
        </form>
      </div>
    </div>
  );
}
