'use client';

import { formatDateAR, formatMoney, getNoches, parseServicios } from '@/lib/packageUtils';
import { ICONOS_SERVICIO } from '@/lib/constants';

function getSummaryIcons(servicios) {
  if (!Array.isArray(servicios)) return '';
  return [...new Set(servicios.map((x) => ICONOS_SERVICIO[x.tipo] || '🔹'))].join(' ');
}

export default function PackageCard({ pkg, onSelect }) {
  if (!pkg.destino) return null;

  const noches = getNoches(pkg);
  const servicios = parseServicios(pkg);
  const tieneAereo = Array.isArray(servicios) && servicios.some((s) => s.tipo === 'aereo');
  const esCircuito = Array.isArray(servicios) && servicios.some((s) => s.tipo === 'circuito');
  const fechaMostrar = !pkg.fecha_salida && esCircuito && !tieneAereo ? 'Múltiples Salidas' : formatDateAR(pkg.fecha_salida);

  let lugarSalida = pkg.salida;
  if (!tieneAereo) {
    const crucero = Array.isArray(servicios) && servicios.find((s) => s.tipo === 'crucero');
    const circuito = Array.isArray(servicios) && servicios.find((s) => s.tipo === 'circuito');
    if (crucero && crucero.crucero_puerto_salida) lugarSalida = crucero.crucero_puerto_salida;
    else if (circuito && circuito.circuito_salida) lugarSalida = circuito.circuito_salida;
  }

  const tarifa = parseFloat(pkg.tarifa) || 0;
  const divisor = parseInt(pkg.base_pasajeros) === 4 ? 4 : 2;
  const summaryIcons = getSummaryIcons(servicios);
  const bubbleStyle = { backgroundColor: '#56DDE0', color: '#11173d', padding: '4px 12px', borderRadius: '20px', fontWeight: 600, fontSize: '0.75em', display: 'inline-block', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };

  return (
    <div className="paquete-card">
      <div className="card-clickable" onClick={() => onSelect(pkg)}>
        <div className="card-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
            <div style={{ maxWidth: '75%', paddingRight: '30px' }}>
              <h3 style={{ margin: 0, fontSize: '1.5em', lineHeight: 1.2, color: '#11173d' }}>
                {pkg.destino}{' '}
                {pkg.status === 'pending' && (
                  <span style={{ backgroundColor: '#ffeaa7', color: '#d35400', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7em', marginLeft: '5px' }}>
                    ⏳ En Revisión
                  </span>
                )}
              </h3>
            </div>
            {noches > 0 && (
              <div style={{ background: '#eef2f5', color: '#11173d', padding: '5px 10px', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.8em', whiteSpace: 'nowrap' }}>
                🌙 {noches}
              </div>
            )}
          </div>
          <div className="fecha">📅 Salida: {fechaMostrar}</div>
        </div>

        <div className="card-body">
          <div style={{ fontSize: '0.85em', color: '#555', display: 'flex', flexWrap: 'wrap', lineHeight: 1.4 }}>{summaryIcons}</div>
        </div>

        <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <span style={bubbleStyle}>{pkg.tipo_promo}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85em', color: '#666', fontWeight: 500, marginBottom: '-5px' }}>Desde {lugarSalida}</div>
            <p className="precio-valor" style={{ margin: '5px 0 0 0' }}>
              {pkg.moneda} ${formatMoney(Math.round(tarifa / divisor))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
