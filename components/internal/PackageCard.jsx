'use client';

import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatDateAR, formatMoney, getNoches, parseServicios } from '@/lib/packageUtils';
import { ICONOS_SERVICIO } from '@/lib/constants';

function getSummaryIcons(servicios) {
  if (!Array.isArray(servicios)) return '';
  return [...new Set(servicios.map((x) => ICONOS_SERVICIO[x.tipo] || '🔹'))].join(' ');
}

export default function PackageCard({ pkg, onSelect, userData }) {
  if (!pkg.destino) return null;

  // Estado para el checkbox de validación por IA
  const [isValidado, setIsValidado] = useState(Boolean(pkg.validado_ia));
  const esGestor = userData?.rol === 'admin' || userData?.rol === 'editor';

  const handleToggleValidado = async (e) => {
    e.stopPropagation(); // Evita abrir el modal del paquete al hacer clic en el cuadrito

    // Si ya está validado y NO es editor/administrador, le impide desmarcarlo
    if (isValidado && !esGestor) {
      alert('⛔ Solo los editores o administradores pueden desmarcar la validación de IA.');
      return;
    }

    const nuevoEstado = !isValidado;
    setIsValidado(nuevoEstado);

    try {
      const id = pkg.id_paquete || pkg.id || pkg['item.id'];
      await updateDoc(doc(db, 'paquetes', id), { validado_ia: nuevoEstado });
      pkg.validado_ia = nuevoEstado;
    } catch (error) {
      console.error('Error al actualizar validado por IA:', error);
      setIsValidado(!nuevoEstado); // Revierte si hubo error de red
    }
  };

  const noches = getNoches(pkg);
  const servicios = parseServicios(pkg);
  const tieneAereo = Array.isArray(servicios) && servicios.some((s) => s.tipo === 'aereo');
  const esCircuito = Array.isArray(servicios) && servicios.some((s) => s.tipo === 'circuito');
  const fechaMostrar = !pkg.fecha_salida && esCircuito && !tieneAereo ? 'Múltiples Salidas' : formatDateAR(pkg.fecha_salida);
  const tieneCharter = pkg.vuelos && pkg.vuelos.some((v) => v.esCharter);
  
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', gap: '8px' }}>
            
            {/* Título y Subtítulo Discreto */}
            <div style={{ flex: 1, minWidth: 0, paddingRight: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                <h3 style={{ margin: 0, fontSize: '1.45em', lineHeight: 1.15, color: '#11173d', fontWeight: 800, textTransform: 'uppercase' }}>
                  {pkg.destino}
                </h3>
                {pkg.status === 'pending' && (
                  <span style={{ backgroundColor: '#ffeaa7', color: '#d35400', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7em', fontWeight: 'bold' }}>
                    ⏳ En Revisión
                  </span>
                )}
              </div>

              {/* Subtítulo: mismo color, tamaño menor, inicial mayúscula */}
              {pkg.subtitulo && (
                <div style={{ 
                  marginTop: '2px', 
                  fontSize: '1em', 
                  color: '#11173d', 
                  fontWeight: 700, 
                  textTransform: 'capitalize',
                  lineHeight: 1.2,
                  letterSpacing: '0.2px',
                }}>
                  {pkg.subtitulo}
                </div>
              )}
            </div>

            {/* Noches */}
            {noches > 0 && (
              <div style={{ background: '#eef2f5', color: '#11173d', padding: '5px 10px', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.8em', whiteSpace: 'nowrap', flexShrink: 0 }}>
                🌙 {noches}
              </div>
            )}
          </div>

          <div className="fecha" style={{ marginTop: '8px' }}>📅 Salida: {fechaMostrar}</div>
        </div>

        <div className="card-body">
          <div style={{ fontSize: '0.85em', color: '#555', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', lineHeight: 1.4 }}>
            <span>{summaryIcons}</span>
            {tieneCharter && (
              <span style={{ background: '#ef5a1a', color: '#fff', padding: '3px 8px', borderRadius: '10px', fontWeight: 'bold', fontSize: '0.9em', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(239, 90, 26, 0.3)' }}>
                ✈️ Charter
              </span>
            )}
          </div>
        </div>

        <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={bubbleStyle}>{pkg.tipo_promo}</span>
            
            {/* 👈 CHECKBOX EXCLUSIVO INTERNO: VALIDADO POR IA */}
            <div
              onClick={handleToggleValidado}
              title={isValidado ? (esGestor ? 'Hacé clic para desmarcar' : 'Validado por IA (solo editores pueden desmarcar)') : 'Marcar como validado por IA'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                cursor: (!isValidado || esGestor) ? 'pointer' : 'not-allowed',
                background: isValidado ? '#ecfdf5' : '#f8fafc',
                border: `1px solid ${isValidado ? '#10b981' : '#cbd5e1'}`,
                padding: '3px 8px',
                borderRadius: '16px',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: isValidado ? '#047857' : '#64748b',
                userSelect: 'none',
                transition: 'all 0.2s',
                boxShadow: isValidado ? '0 1px 3px rgba(16, 185, 129, 0.2)' : 'none'
              }}
            >
              <input
                type="checkbox"
                checked={isValidado}
                onChange={() => {}}
                style={{ 
                  cursor: (!isValidado || esGestor) ? 'pointer' : 'not-allowed', 
                  accentColor: '#10b981',
                  margin: 0
                }}
              />
              <span>Validado por IA</span>
            </div>
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