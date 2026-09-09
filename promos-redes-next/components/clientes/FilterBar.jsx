'use client';

import { SALIDAS_INICIALES } from '@/lib/constants';

// Nota de comportamiento (igual al original): el campo "destino" NO filtra en vivo
// mientras se escribe. Solo se aplica al tocar "Buscar Viaje" (o al usar "Limpiar").
// Los selects de "Salida" y "Orden" sí aplican el filtro apenas cambian (evento
// 'change' en el código original).
export default function FilterBar({
  destinoDraft,
  onDestinoDraftChange,
  salida,
  onSalidaChange,
  orden,
  onOrdenChange,
  salidasDisponibles,
  salidasCargadas,
  onBuscar,
  onLimpiar,
}) {
  return (
    <div className="panel-filtros" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
      <div className="filtro-group large">
        <label>¿A dónde querés viajar?</label>
        <input
          type="text"
          id="filtro-destino"
          placeholder="Ej: Punta Cana, Brasil..."
          value={destinoDraft}
          onChange={(e) => onDestinoDraftChange(e.target.value)}
        />
      </div>

      <div className="filtro-group">
        <label>📍 Salida desde</label>
        <select
          id="filtro-salida"
          style={{ border: '1px solid #ddd', borderRadius: '6px' }}
          value={salida}
          onChange={(e) => onSalidaChange(e.target.value)}
        >
          {!salidasCargadas
            ? SALIDAS_INICIALES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : [
                <option key="" value="">
                  Todas las Provincias
                </option>,
                ...salidasDisponibles.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                )),
              ]}
        </select>
      </div>

      <div className="filtro-group">
        <label>Orden</label>
        <select id="filtro-orden" value={orden} onChange={(e) => onOrdenChange(e.target.value)}>
          <option value="reciente">Recientes</option>
          <option value="menor_precio">Menor Precio</option>
          <option value="mayor_precio">Mayor Precio</option>
        </select>
      </div>

      <div className="panel-actions" style={{ width: '100%', justifyContent: 'center', marginTop: '10px', display: 'flex', gap: '15px' }}>
        <button
          id="boton-limpiar"
          onClick={onLimpiar}
          style={{
            width: '150px',
            background: '#f9fafb',
            color: '#6b7280',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontWeight: 'bold',
            fontSize: '0.9em',
            cursor: 'pointer',
            transition: '0.2s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = '#f3f4f6')}
          onMouseOut={(e) => (e.currentTarget.style.background = '#f9fafb')}
        >
          🧹 Limpiar
        </button>
        <button id="boton-buscar" className="btn btn-primario" style={{ width: '200px' }} onClick={onBuscar}>
          Buscar Viaje
        </button>
      </div>
    </div>
  );
}
