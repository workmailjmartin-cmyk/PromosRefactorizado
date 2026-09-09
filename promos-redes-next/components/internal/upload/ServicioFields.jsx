'use client';

import Counter from './Counter';
import StarRating from './StarRating';
import { AEROPUERTOS_POR_PROVINCIA } from '@/lib/internal/airports';

// Helpers de estilo compartidos (mismas clases que ya trae globals.css)
const row = { className: 'form-group-row' };

export function CamposAereo({ data, onChange, provincia, minDate }) {
  const aeropuertos = AEROPUERTOS_POR_PROVINCIA[provincia] || [];
  return (
    <>
      <h4>✈️ Aéreo</h4>
      <div {...row}>
        <div className="form-group">
          <label>Aerolínea</label>
          <input type="text" required value={data.aerolinea || ''} onChange={(e) => onChange({ aerolinea: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Ida</label>
          <input type="date" required min={minDate} value={data.fecha_aereo || ''} onChange={(e) => onChange({ fecha_aereo: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Vuelta</label>
          <input type="date" min={minDate} value={data.fecha_regreso || ''} onChange={(e) => onChange({ fecha_regreso: e.target.value })} />
        </div>
      </div>
      <div {...row}>
        <div className="form-group">
          <label>Escalas Ida</label>
          <Counter value={data.escalas_ida ?? 0} onChange={(v) => onChange({ escalas_ida: v })} />
        </div>
        <div className="form-group">
          <label>Escalas Vuelta</label>
          <Counter value={data.escalas_vuelta ?? 0} onChange={(v) => onChange({ escalas_vuelta: v })} />
        </div>
        <div className="form-group">
          <label>Equipaje</label>
          <select value={data.tipo_equipaje || 'Mochila'} onChange={(e) => onChange({ tipo_equipaje: e.target.value })}>
            <option>Mochila</option>
            <option>Mochila + Carry On</option>
            <option>Mochila + Bodega</option>
            <option>Mochila + Carry On + Bodega</option>
          </select>
        </div>
        <div className="form-group" style={{ flex: 1.5 }}>
          <label>🛫 Aeropuerto Salida (Opcional)</label>
          <select className="form-control" value={data.aeropuerto_salida || ''} onChange={(e) => onChange({ aeropuerto_salida: e.target.value })}>
            <option value="">{provincia ? '-- No especificar --' : '-- Selecciona provincia primero --'}</option>
            {aeropuertos.map((a) => {
              const label = `${a.nombre} (${a.sigla})`;
              return (
                <option key={label} value={label}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>
      </div>
      <div {...row}>
        <div className="form-group">
          <label>Proveedor</label>
          <input type="text" required value={data.proveedor || ''} onChange={(e) => onChange({ proveedor: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Costo</label>
          <input type="number" className="input-costo" required value={data.costo ?? ''} onChange={(e) => onChange({ costo: e.target.value })} />
        </div>
      </div>
    </>
  );
}

export function CamposHotel({ data, onChange, minDate }) {
  return (
    <>
      <h4>🏨 Hotel</h4>
      <div className="form-group">
        <label>Alojamiento</label>
        <input type="text" required value={data.hotel_nombre || ''} onChange={(e) => onChange({ hotel_nombre: e.target.value })} />
      </div>
      <div className="form-group">
        <label>Estrellas</label>
        <StarRating value={data.hotel_estrellas ?? 0} onChange={(v) => onChange({ hotel_estrellas: v })} />
      </div>
      <div className="form-group">
        <label>Ubicación (Link)</label>
        <input type="url" placeholder="https://maps.google.com/..." value={data.hotel_link || ''} onChange={(e) => onChange({ hotel_link: e.target.value })} />
      </div>
      <div {...row}>
        <div className="form-group">
          <label>Check In</label>
          <input type="date" required min={minDate} value={data.checkin || ''} onChange={(e) => onChange({ checkin: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Check Out</label>
          <input type="date" required min={minDate} value={data.checkout || ''} onChange={(e) => onChange({ checkout: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Noches</label>
          <input type="text" readOnly value={data.noches || ''} style={{ background: '#eee', width: '60px' }} />
        </div>
      </div>
      <div className="form-group">
        <label>Régimen</label>
        <select value={data.regimen || 'Solo Habitación'} onChange={(e) => onChange({ regimen: e.target.value })}>
          <option>Solo Habitación</option>
          <option>Desayuno</option>
          <option>Media Pensión</option>
          <option>All Inclusive</option>
        </select>
      </div>
      <div {...row}>
        <div className="form-group">
          <label>Proveedor</label>
          <input type="text" required value={data.proveedor || ''} onChange={(e) => onChange({ proveedor: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Costo</label>
          <input type="number" className="input-costo" required value={data.costo ?? ''} onChange={(e) => onChange({ costo: e.target.value })} />
        </div>
      </div>
    </>
  );
}

export function CamposTraslado({ data, onChange }) {
  return (
    <>
      <h4>🚕 Traslado</h4>
      <div className="checkbox-group">
        <label className="checkbox-label">
          <input type="checkbox" checked={!!data.trf_in} onChange={(e) => onChange({ trf_in: e.target.checked })} /> In
        </label>
        <label className="checkbox-label">
          <input type="checkbox" checked={!!data.trf_out} onChange={(e) => onChange({ trf_out: e.target.checked })} /> Out
        </label>
        <label className="checkbox-label">
          <input type="checkbox" checked={!!data.trf_hah} onChange={(e) => onChange({ trf_hah: e.target.checked })} /> Hotel - Hotel
        </label>
      </div>
      <div {...row}>
        <div className="form-group">
          <label>Tipo</label>
          <select value={data.tipo_trf || 'Compartido'} onChange={(e) => onChange({ tipo_trf: e.target.value })}>
            <option>Compartido</option>
            <option>Privado</option>
          </select>
        </div>
        <div className="form-group">
          <label>Proveedor</label>
          <input type="text" required value={data.proveedor || ''} onChange={(e) => onChange({ proveedor: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Costo</label>
          <input type="number" className="input-costo" required value={data.costo ?? ''} onChange={(e) => onChange({ costo: e.target.value })} />
        </div>
      </div>
    </>
  );
}

export function CamposSeguro({ data, onChange }) {
  return (
    <>
      <h4>🛡️ Seguro</h4>
      <div {...row}>
        <div className="form-group">
          <label>Proveedor</label>
          <input type="text" required value={data.proveedor || ''} onChange={(e) => onChange({ proveedor: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Cobertura</label>
          <input type="text" required value={data.cobertura || ''} onChange={(e) => onChange({ cobertura: e.target.value })} />
        </div>
      </div>
      <div {...row}>
        <div className="form-group">
          <label>Costo</label>
          <input type="number" className="input-costo" required value={data.costo ?? ''} onChange={(e) => onChange({ costo: e.target.value })} />
        </div>
      </div>
    </>
  );
}

export function CamposAdicional({ data, onChange }) {
  return (
    <>
      <h4>➕ Adicional</h4>
      <div className="form-group">
        <label>Detalle</label>
        <input type="text" required value={data.descripcion || ''} onChange={(e) => onChange({ descripcion: e.target.value })} />
      </div>
      <div {...row}>
        <div className="form-group">
          <label>Proveedor</label>
          <input type="text" required value={data.proveedor || ''} onChange={(e) => onChange({ proveedor: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Costo</label>
          <input type="number" className="input-costo" required value={data.costo ?? ''} onChange={(e) => onChange({ costo: e.target.value })} />
        </div>
      </div>
    </>
  );
}

export function CamposBus({ data, onChange }) {
  return (
    <>
      <div style={{ marginBottom: '15px', borderBottom: '2px solid #f8f9fa', paddingBottom: '10px' }}>
        <h4 style={{ margin: 0, color: '#333' }}>🚌 Paquete Bus</h4>
      </div>

      <div {...row}>
        <div className="form-group" style={{ flex: '0 0 auto' }}>
          <label style={{ fontWeight: 600 }}>
            Cant. Noches <span style={{ color: 'red' }}>*</span>
          </label>
          <input type="number" required style={{ width: '100px' }} value={data.noches ?? ''} onChange={(e) => onChange({ noches: e.target.value })} />
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label style={{ fontWeight: 600 }}>Ciudad de Salida (Opcional)</label>
          <input type="text" placeholder="Ej: Córdoba, Rosario..." value={data.bus_salida || ''} onChange={(e) => onChange({ bus_salida: e.target.value })} />
        </div>
      </div>

      <div className="form-group" style={{ borderBottom: '1px solid #eee', padding: '12px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <div style={{ flex: 1 }}>
            <label style={{ margin: 0, fontWeight: 500, color: '#555', cursor: 'pointer' }}>Incluye Alojamiento 🏨</label>
          </div>
          <div style={{ width: '40px', textAlign: 'right' }}>
            <input type="checkbox" style={{ transform: 'scale(1.5)', cursor: 'pointer' }} checked={!!data.incluye_alojamiento} onChange={(e) => onChange({ incluye_alojamiento: e.target.checked })} />
          </div>
        </div>
      </div>

      {data.incluye_alojamiento && (
        <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '5px', marginBottom: '10px', borderLeft: '3px solid #007bff', marginTop: '5px' }}>
          <div className="form-group">
            <label>
              Nombre del Alojamiento <span style={{ color: 'red' }}>*</span>
            </label>
            <input type="text" placeholder="Nombre..." required value={data.hotel_nombre || ''} onChange={(e) => onChange({ hotel_nombre: e.target.value })} />
          </div>
          <div {...row}>
            <div className="form-group">
              <label>
                Régimen <span style={{ color: 'red' }}>*</span>
              </label>
              <select required value={data.regimen || ''} onChange={(e) => onChange({ regimen: e.target.value })}>
                <option value="" disabled>
                  -- Seleccionar --
                </option>
                <option>Solo Alojamiento</option>
                <option>Desayuno</option>
                <option>Media Pensión</option>
                <option>Pensión Completa</option>
              </select>
            </div>
            <div className="form-group">
              <label>
                Bebidas <span style={{ color: 'red' }}>*</span>
              </label>
              <select required value={data.bebidas || ''} onChange={(e) => onChange({ bebidas: e.target.value })}>
                <option value="" disabled>
                  -- Seleccionar --
                </option>
                <option value="No">🚫 No incluye</option>
                <option value="Si">🥤 Si incluye</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>
              Ubicación <span style={{ color: 'red' }}>*</span>
            </label>
            <input type="text" placeholder="Ubicación exacta..." required value={data.hotel_ubicacion || ''} onChange={(e) => onChange({ hotel_ubicacion: e.target.value })} />
          </div>
        </div>
      )}

      <div className="form-group" style={{ borderBottom: '1px solid #eee', padding: '12px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <div style={{ flex: 1 }}>
            <label style={{ margin: 0, fontWeight: 500, color: '#555', cursor: 'pointer' }}>Incluye Excursiones 🌲</label>
          </div>
          <div style={{ width: '40px', textAlign: 'right' }}>
            <input type="checkbox" style={{ transform: 'scale(1.5)', cursor: 'pointer' }} checked={!!data.incluye_excursiones} onChange={(e) => onChange({ incluye_excursiones: e.target.checked })} />
          </div>
        </div>
        {data.incluye_excursiones && (
          <div style={{ marginTop: '10px' }}>
            <label style={{ fontSize: '0.9em' }}>
              Detalle de excursiones <span style={{ color: 'red' }}>*</span>
            </label>
            <input type="text" placeholder="Describir excursiones..." required value={data.excursion_adicional || ''} onChange={(e) => onChange({ excursion_adicional: e.target.value })} />
          </div>
        )}
      </div>

      <div className="form-group" style={{ borderBottom: '1px solid #eee', padding: '12px 0', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <div style={{ flex: 1 }}>
            <label style={{ margin: 0, fontWeight: 500, color: '#555', cursor: 'pointer' }}>Asistencia al Viajero 🚑</label>
          </div>
          <div style={{ width: '40px', textAlign: 'right' }}>
            <input type="checkbox" style={{ transform: 'scale(1.5)', cursor: 'pointer' }} checked={!!data.asistencia} onChange={(e) => onChange({ asistencia: e.target.checked })} />
          </div>
        </div>
      </div>

      <div {...row}>
        <div className="form-group">
          <label>
            Proveedor <span style={{ color: 'red' }}>*</span>
          </label>
          <input type="text" required value={data.proveedor || ''} onChange={(e) => onChange({ proveedor: e.target.value })} />
        </div>
        <div className="form-group">
          <label>
            Costo <span style={{ color: 'red' }}>*</span>
          </label>
          <input type="number" className="input-costo" required value={data.costo ?? ''} onChange={(e) => onChange({ costo: e.target.value })} />
        </div>
      </div>

      <div className="form-group">
        <label>Observaciones</label>
        <textarea rows={2} placeholder="Notas adicionales..." value={data.observaciones || ''} onChange={(e) => onChange({ observaciones: e.target.value })} />
      </div>
    </>
  );
}

export function CamposCrucero({ data, onChange, minDate }) {
  return (
    <>
      <div style={{ marginBottom: '15px', borderBottom: '2px solid #f8f9fa', paddingBottom: '10px' }}>
        <h4 style={{ margin: 0, color: '#333' }}>🚢 Crucero</h4>
      </div>
      <div {...row}>
        <div className="form-group">
          <label>Naviera</label>
          <input type="text" placeholder="Ej: MSC, Costa Cruceros..." required value={data.crucero_naviera || ''} onChange={(e) => onChange({ crucero_naviera: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Puerto de Salida</label>
          <input type="text" placeholder="Ej: Buenos Aires, Miami..." required value={data.crucero_puerto_salida || ''} onChange={(e) => onChange({ crucero_puerto_salida: e.target.value })} />
        </div>
      </div>
      <div {...row}>
        <div className="form-group">
          <label>Embarque</label>
          <input type="date" required min={minDate} value={data.checkin || ''} onChange={(e) => onChange({ checkin: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Desembarque</label>
          <input type="date" required min={minDate} value={data.checkout || ''} onChange={(e) => onChange({ checkout: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Noches</label>
          <input type="text" readOnly value={data.crucero_noches || ''} style={{ background: '#eee', width: '60px' }} />
        </div>
      </div>

      <div {...row} style={{ background: '#f9f9f9', padding: '12px', borderRadius: '5px', marginBottom: '10px' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label style={{ margin: 0, fontWeight: 500, cursor: 'pointer' }}>
            <input type="checkbox" style={{ transform: 'scale(1.2)', marginRight: '5px' }} checked={!!data.crucero_bebidas} onChange={(e) => onChange({ crucero_bebidas: e.target.checked })} /> Paquete de
            Bebidas 🥤
          </label>
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label style={{ margin: 0, fontWeight: 500, cursor: 'pointer' }}>
            <input type="checkbox" style={{ transform: 'scale(1.2)', marginRight: '5px' }} checked={!!data.crucero_propinas} onChange={(e) => onChange({ crucero_propinas: e.target.checked })} /> Propinas
            Incluidas 💰
          </label>
        </div>
      </div>

      <div style={{ marginBottom: '15px', paddingLeft: '5px' }}>
        <small style={{ color: '#2ecc71', fontWeight: 'bold' }}>✓ Pensión Completa incluida</small> |{' '}
        <small style={{ color: '#2ecc71', fontWeight: 'bold' }}>✓ Asistencia al Viajero incluida</small>
      </div>

      <div className="form-group" style={{ border: '1px solid #eee', padding: '10px', borderRadius: '5px', marginBottom: '10px' }}>
        <label>Itinerario / Paradas del Recorrido</label>
        <textarea
          rows={4}
          placeholder="Pegá acá el recorrido (Ej: Día 1: Buenos Aires... Día 2: Navegación...)"
          style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', marginTop: '5px' }}
          value={data.crucero_paradas || ''}
          onChange={(e) => onChange({ crucero_paradas: e.target.value })}
        />
      </div>

      <div {...row}>
        <div className="form-group">
          <label>Proveedor</label>
          <input type="text" required value={data.proveedor || ''} onChange={(e) => onChange({ proveedor: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Costo</label>
          <input type="number" className="input-costo" required value={data.costo ?? ''} onChange={(e) => onChange({ costo: e.target.value })} />
        </div>
      </div>
    </>
  );
}

export function CamposCircuito({ data, onChange, minDate }) {
  return (
    <>
      <div style={{ marginBottom: '15px', borderBottom: '2px solid #f8f9fa', paddingBottom: '10px' }}>
        <h4 style={{ margin: 0, color: '#333' }}>🗺️ Circuito Terrestre</h4>
      </div>
      <div {...row}>
        <div className="form-group">
          <label>
            Nombre del Circuito <span style={{ color: 'red' }}>*</span>
          </label>
          <input type="text" placeholder="Ej: Vuelta al Norte, Europa Clásica..." required value={data.circuito_nombre || ''} onChange={(e) => onChange({ circuito_nombre: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Ciudad de Salida</label>
          <input type="text" placeholder="Ej: Madrid, Salta..." required value={data.circuito_salida || ''} onChange={(e) => onChange({ circuito_salida: e.target.value })} />
        </div>
      </div>
      <div {...row}>
        <div className="form-group">
          <label>Fecha de Inicio</label>
          <input type="date" required min={minDate} value={data.checkin || ''} onChange={(e) => onChange({ checkin: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Fecha de Fin</label>
          <input type="date" required min={minDate} value={data.checkout || ''} onChange={(e) => onChange({ checkout: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Noches</label>
          <input type="text" readOnly value={data.circuito_noches || ''} style={{ background: '#eee', width: '60px' }} />
        </div>
      </div>
      <div className="form-group">
        <label>
          Descripción / Itinerario <span style={{ color: 'red' }}>*</span>
        </label>
        <textarea rows={3} placeholder="Describe brevemente las ciudades, excursiones o el régimen incluido..." required value={data.circuito_descripcion || ''} onChange={(e) => onChange({ circuito_descripcion: e.target.value })} />
      </div>
      <div {...row}>
        <div className="form-group">
          <label>
            Proveedor <span style={{ color: 'red' }}>*</span>
          </label>
          <input type="text" required value={data.proveedor || ''} onChange={(e) => onChange({ proveedor: e.target.value })} />
        </div>
        <div className="form-group">
          <label>
            Costo <span style={{ color: 'red' }}>*</span>
          </label>
          <input type="number" className="input-costo" required value={data.costo ?? ''} onChange={(e) => onChange({ costo: e.target.value })} />
        </div>
      </div>
    </>
  );
}
