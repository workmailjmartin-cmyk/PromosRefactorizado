'use client';

import { CamposAereo, CamposHotel, CamposTraslado, CamposSeguro, CamposAdicional, CamposBus, CamposCrucero, CamposCircuito } from './ServicioFields';

const CAMPOS_POR_TIPO = {
  aereo: CamposAereo,
  hotel: CamposHotel,
  traslado: CamposTraslado,
  seguro: CamposSeguro,
  adicional: CamposAdicional,
  bus: CamposBus,
  crucero: CamposCrucero,
  circuito: CamposCircuito,
};

export default function ServicioCard({ servicio, onChange, onRemove, provincia, minDate }) {
  const Campos = CAMPOS_POR_TIPO[servicio.tipo];
  if (!Campos) return null;

  return (
    <div className={`servicio-card ${servicio.tipo}`}>
      <button type="button" className="btn-eliminar-servicio" onClick={onRemove}>
        ×
      </button>
      <Campos data={servicio} onChange={onChange} provincia={provincia} minDate={minDate} />
    </div>
  );
}
