'use client';

import { useEffect, useState } from 'react';
import { PROVINCIAS } from '@/lib/internal/constants';
import { useUploadForm } from '@/hooks/useUploadForm';
import ServicioCard from './ServicioCard';
import BasePasajerosToggle from './BasePasajerosToggle';
import { formatMoney } from '@/lib/packageUtils';

const PROVINCIAS_UPLOAD = PROVINCIAS.filter((p) => p.value !== '');

const TIPOS_SERVICIO = [
  { value: '', label: 'Seleccionar Servicio...' },
  { value: 'aereo', label: '✈️ Aéreo' },
  { value: 'hotel', label: '🏨 Hotel' },
  { value: 'traslado', label: '🚕 Traslado' },
  { value: 'seguro', label: '🛡️ Seguro' },
  { value: 'bus', label: '🚌 Paquete Bus' },
  { value: 'crucero', label: '🚢 Crucero' },
  { value: 'circuito', label: '🗺️ Circuito Terrestre' },
  { value: 'adicional', label: '➕ Adicional' },
];

export default function UploadView({ editingPackage, currentUser, userData, tiposPromocionVisibles, refetch, onVolverABuscar, onDone, onActionBusy }) {
  const {
    form,
    setDestino,
    setSalida,
    setFechaSalida,
    setMoneda,
    setPromo,
    setFinanciacion,
    setTarifaTotal,
    setBasePasajeros,
    minDate,
    tarifaPorPersona,
    addServicio,
    updateServicio,
    removeServicio,
    handleSubmit,
    isEditingId,
  } = useUploadForm({ editingPackage, currentUser, userData, refetch, onDone, onActionBusy });

  const [servicioSeleccionado, setServicioSeleccionado] = useState('');

  // Igual al <select id="upload-promo"> del original: al no tener una opción
  // "placeholder", el navegador deja seleccionada la primera promo disponible.
  useEffect(() => {
    if (!form.promo && tiposPromocionVisibles.length > 0 && !isEditingId) {
      setPromo(tiposPromocionVisibles[0].nombre);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiposPromocionVisibles]);

  const handleAgregarServicio = () => {
    if (!servicioSeleccionado) return;
    addServicio(servicioSeleccionado);
    setServicioSeleccionado('');
  };

  return (
    <div id="view-upload" className="view active">
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '15px', justifyContent: 'center' }}>
        <button
          id="btn-sub-buscar-2"
          className="btn"
          onClick={onVolverABuscar}
          style={{ background: '#f3f4f6', color: '#6b7280', border: 'none', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          🔍 Buscar
        </button>
        <button
          id="btn-sub-cargar-2"
          className="btn"
          style={{ background: '#11173d', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          ➕ Cargar
        </button>
      </div>

      <div className="upload-form-container">
        <h2 className="section-title" style={{ marginTop: 0 }}>
          Información del Viaje {isEditingId && <small style={{ color: '#ef5a1a' }}>(Editando)</small>}
        </h2>
        <form id="upload-form" onSubmit={handleSubmit}>
          <div className="form-group-row">
            <div className="form-group">
              <label>Destino</label>
              <input type="text" required value={form.destino} onChange={(e) => setDestino(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Provincia de Salida</label>
              <select required style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', width: '100%' }} value={form.salida} onChange={(e) => setSalida(e.target.value)}>
                <option value="" disabled>
                  Selecciona...
                </option>
                {PROVINCIAS_UPLOAD.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group-row">
            <div className="form-group">
              <label>Fecha Salida</label>
              <input type="date" value={form.fechaSalida} onChange={(e) => setFechaSalida(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Moneda</label>
              <select value={form.moneda} onChange={(e) => setMoneda(e.target.value)}>
                <option>USD</option>
                <option>ARS</option>
              </select>
            </div>
            <div className="form-group">
              <label>Tipo Promo</label>
              <select value={form.promo} onChange={(e) => setPromo(e.target.value)}>
                {tiposPromocionVisibles.map((p) => (
                  <option key={p.nombre} value={p.nombre}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <h3 className="section-title">Servicios</h3>

          <div id="servicios-container">
            {form.servicios.map((s) => (
              <ServicioCard
                key={s.__id}
                servicio={s}
                provincia={form.salida}
                minDate={minDate}
                onChange={(patch) => updateServicio(s.__id, patch)}
                onRemove={() => removeServicio(s.__id)}
              />
            ))}
          </div>

          <div className="add-service-bar">
            <select style={{ flex: 1 }} value={servicioSeleccionado} onChange={(e) => setServicioSeleccionado(e.target.value)}>
              {TIPOS_SERVICIO.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <button type="button" className="btn btn-secundario" onClick={handleAgregarServicio} style={{ background: '#11173d', color: 'white' }}>
              + Agregar
            </button>
          </div>

          <div className="totals-section form-group-row">
            <div className="form-group">
              <label>Costo Total (Interno)</label>
              <input type="number" readOnly value={form.costoTotal} />
            </div>
            <div className="form-group">
              <label>Tarifa de Venta (Total)</label>
              <input type="number" required value={form.tarifaTotal} onChange={(e) => setTarifaTotal(e.target.value)} />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <BasePasajerosToggle value={form.basePasajeros} onChange={setBasePasajeros} />
            </div>
            <div className="form-group">
              <label>x Persona</label>
              <input
                type="text"
                readOnly
                value={formatMoney(tarifaPorPersona)}
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#4caf50', fontWeight: 'bold', cursor: 'default' }}
              />
            </div>
          </div>

          <div className="finance-section">
            <div className="form-group">
              <label>💳 Financiación / Notas de Pago</label>
              <textarea rows={3} placeholder="Ej: Seña del 30%, saldo 20 días antes..." value={form.financiacion} onChange={(e) => setFinanciacion(e.target.value)} />
            </div>
          </div>

          <div style={{ textAlign: 'right', marginTop: '20px' }}>
            <button type="submit" className="btn btn-primario" style={{ padding: '15px 40px', fontSize: '1.1em' }}>
              Guardar Paquete
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
