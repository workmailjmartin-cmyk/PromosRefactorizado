'use client';

import { formatDateAR, formatMoney, getNoches, getTarifaPorPersona, parseServicios, buildWhatsAppLink } from '@/lib/packageUtils';
import ItinerarioServicios from '@/components/shared/ItinerarioServicios';

export default function PackageDetailModal({ pkg, onClose, wppNumber }) {
  const abierto = !!pkg;

  return (
    <div
      id="modal-detalle"
      className="modal-overlay"
      style={{ display: abierto ? 'flex' : 'none' }}
      onClick={(e) => {
        if (e.target.id === 'modal-detalle') onClose();
      }}
    >
      <div className="modal-contenido">
        <button id="modal-cerrar" className="modal-cerrar-btn" onClick={onClose}>
          ×
        </button>
        <div id="modal-body" className="modal-detalle-body">
          {abierto && <ModalBody pkg={pkg} wppNumber={wppNumber} />}
        </div>
      </div>
    </div>
  );
}

function ModalBody({ pkg, wppNumber }) {
  const servicios = parseServicios(pkg);

  let lugarSalida = pkg.salida;
  const esCircuito = Array.isArray(servicios) && servicios.some((s) => s.tipo === 'circuito');
  const fecha = !pkg.fecha_salida && esCircuito ? 'Múltiples Salidas' : formatDateAR(pkg.fecha_salida);

  const tieneAereo = Array.isArray(servicios) && servicios.some((s) => s.tipo === 'aereo');
  if (!tieneAereo) {
    const crucero = Array.isArray(servicios) && servicios.find((s) => s.tipo === 'crucero');
    const circuito = Array.isArray(servicios) && servicios.find((s) => s.tipo === 'circuito');
    if (crucero && crucero.crucero_puerto_salida) lugarSalida = crucero.crucero_puerto_salida;
    else if (circuito && circuito.circuito_salida) lugarSalida = circuito.circuito_salida;
  }

  const noches = getNoches(pkg);
  const { tarifaPorPersona, textoBase } = getTarifaPorPersona(pkg);
  const linkWhatsApp = buildWhatsAppLink(pkg, wppNumber);

  return (
    <>
      <div className="modal-detalle-header" style={{ display: 'block', paddingBottom: '25px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h2 style={{ margin: 0, fontSize: '2.2em', lineHeight: 1.1 }}>{pkg.destino}</h2>
        </div>
      </div>

      <div className="modal-layout-grid" style={{ padding: '20px' }}>
        <div className="modal-itinerario">
          <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginTop: 0, color: '#11173d' }}>Itinerario</h3>
          <ItinerarioServicios servicios={servicios} />
        </div>

        <div className="modal-resumen" style={{ background: '#f9fbfd', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#11173d', fontSize: '1.2em' }}>Resumen del Viaje</h4>
          <p style={{ margin: '5px 0', fontSize: '0.95em' }}>
            <b>📅 Salida:</b> {fecha}
          </p>
          <p style={{ margin: '5px 0', fontSize: '0.95em' }}>
            <b>📍 Desde:</b> {lugarSalida || '-'}
          </p>
          <p style={{ margin: '5px 0', fontSize: '0.95em' }}>
            <b>🌙 Duración:</b> {noches > 0 ? `${noches} Noches` : '-'}
          </p>
        </div>

        <div className="modal-financiacion">
          {pkg.financiacion && (
            <div style={{ marginBottom: '15px', background: '#e3f2fd', padding: '10px', borderRadius: '5px', fontSize: '0.85em', color: '#11173d' }}>
              <b>💳 Financiación / Notas:</b>
              <br />
              {pkg.financiacion}
            </div>
          )}
          <a
            href={linkWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#25d366', color: 'white', border: 'none', padding: '12px', borderRadius: '8px',
              fontWeight: 'bold', cursor: 'pointer', textDecoration: 'none', textAlign: 'center', display: 'block',
              marginTop: '20px', fontSize: '1.1em', transition: '0.2s', boxShadow: '0 4px 10px rgba(37,211,102,0.3)',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#1da851')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#25d366')}
          >
            💬 Consultar al Asesor
          </a>
        </div>
      </div>

      <div
        className="modal-footer-pricing"
        style={{
          background: '#11173d', color: 'white', padding: '20px 30px', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', borderRadius: '0 0 12px 12px', flexWrap: 'wrap', gap: '15px',
        }}
      >
        <div style={{ textAlign: 'left' }}>
          <small style={{ opacity: 0.8, fontSize: '0.85em', textTransform: 'uppercase' }}>
            Tarifa final por persona ({textoBase})
          </small>
          <div style={{ fontSize: '2.5em', fontWeight: 'bold', color: '#56DDE0', lineHeight: 1.1 }}>
            {pkg.moneda || 'USD'} ${formatMoney(tarifaPorPersona)}
          </div>
        </div>
        <div style={{ textAlign: 'right', maxWidth: '250px' }}>
          <small style={{ color: '#ef5a1a', fontSize: '0.85em', lineHeight: 1.3, display: 'block', fontWeight: 500 }}>
            * Tarifas y cupos sujetos a disponibilidad.
            <br />
            Revisar{' '}
            <a href="https://info.felizviaje.ar/informacion-antes-de-viajar/" target="_blank" rel="noopener noreferrer" style={{ color: '#56DDE0', textDecoration: 'underline' }}>
              bases y condiciones
            </a>
            .
          </small>
        </div>
      </div>
    </>
  );
}
