'use client';

import { formatDateAR, formatMoney, getNoches, getTarifaPorPersona, parseServicios } from '@/lib/packageUtils';
import { ICONOS_SERVICIO } from '@/lib/constants';

export default function PackageCard({ pkg, onSelect, textoListon }) {
  if (!pkg.destino) return null;

  const servicios = parseServicios(pkg);
  const tieneAereo = Array.isArray(servicios) && servicios.some((s) => s.tipo === 'aereo');
  const esCircuito = Array.isArray(servicios) && servicios.some((s) => s.tipo === 'circuito');
  const fechaMostrar = !pkg.fecha_salida && esCircuito && !tieneAereo ? 'Múltiples Salidas' : formatDateAR(pkg.fecha_salida);

  const noches = getNoches(pkg);
  let lugarSalida = pkg.salida;
  if (!tieneAereo) {
    const crucero = Array.isArray(servicios) && servicios.find((s) => s.tipo === 'crucero');
    const circuito = Array.isArray(servicios) && servicios.find((s) => s.tipo === 'circuito');
    if (crucero && crucero.crucero_puerto_salida) lugarSalida = crucero.crucero_puerto_salida;
    else if (circuito && circuito.circuito_salida) lugarSalida = circuito.circuito_salida;
  }

  const { tarifaPorPersona } = getTarifaPorPersona(pkg);
  const summaryIcons = [...new Set((Array.isArray(servicios) ? servicios : []).map((x) => ICONOS_SERVICIO[x.tipo] || '🔹'))].join(' ');

  const esSoloXHoy = pkg.tipo_promo === 'Solo X Hoy';

  return (
    <div className="paquete-card">
      <div className="card-clickable" style={{ height: '100%', position: 'relative' }} onClick={() => onSelect(pkg)}>
        {esSoloXHoy && (
          <div
            style={{
              position: 'absolute', top: 0, right: 0, width: '110px', height: '110px',
              overflow: 'hidden', pointerEvents: 'none', zIndex: 10, borderRadius: '0 8px 0 0',
            }}
          >
            <div
              style={{
                position: 'absolute', top: '22px', right: '-35px', width: '155px', transform: 'rotate(45deg)',
                background: 'linear-gradient(90deg, #ffffff 0%, #56DDE0 100%)', color: '#11173d', fontWeight: 800,
                fontSize: '0.68em', textAlign: 'center', padding: '4px 0', boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
                letterSpacing: '0.5px', textTransform: 'uppercase', whiteSpace: 'nowrap',
              }}
            >
              {textoListon}
            </div>
          </div>
        )}

        <div className="card-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
            <div style={{ maxWidth: esSoloXHoy ? '72%' : '100%', paddingRight: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '1.4em', lineHeight: 1.2, color: '#11173d' }}>{pkg.destino}</h3>
            </div>
          </div>
          <div className="fecha">📅 Salida: {fechaMostrar}</div>
        </div>

        <div className="card-body">
          <div style={{ fontSize: '0.85em', color: '#555', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px', lineHeight: 1.4 }}>
            <span>{summaryIcons}</span>
            {noches > 0 && (
              <span style={{ background: '#eef2f5', color: '#11173d', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.85em', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                🌙 {noches}
              </span>
            )}
          </div>
        </div>

        <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85em', color: '#666', marginBottom: '-5px' }}>
              Desde <strong style={{ color: '#11173d', fontWeight: 800 }}>{lugarSalida || 'Varias'}</strong>
            </div>
            <p className="precio-valor" style={{ margin: '5px 0 0 0' }}>
              {pkg.moneda || 'USD'} ${formatMoney(tarifaPorPersona)}{' '}
              <span style={{ fontSize: '0.5em', color: '#999', fontWeight: 'normal' }}>x Persona</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
