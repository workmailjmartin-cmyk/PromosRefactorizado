'use client';

import { formatDateAR, formatMoney, getNoches, getTarifaPorPersona, parseServicios } from '@/lib/packageUtils';
import { generarTextoPresupuestoInterno } from '@/lib/internal/textoPresupuesto';
import ItinerarioServicios from '@/components/shared/ItinerarioServicios';
import CostosProveedores from './CostosProveedores';
import { useAlert } from '@/contexts/AlertContext';

export default function PackageDetailModal({ pkg, onClose, currentUser, userData, actions }) {
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
          {abierto && <ModalBody pkg={pkg} currentUser={currentUser} userData={userData} actions={actions} onClose={onClose} />}
        </div>
      </div>
    </div>
  );
}

function ModalBody({ pkg, currentUser, userData, actions, onClose }) {
  const { showAlert } = useAlert();
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
  const tarifa = parseFloat(pkg.tarifa) || 0;
  const { tarifaPorPersona, textoBase } = getTarifaPorPersona(pkg);
  const bubbleStyle = { backgroundColor: '#56DDE0', color: '#11173d', padding: '4px 12px', borderRadius: '20px', fontWeight: 600, fontSize: '0.8em', display: 'inline-block', marginTop: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' };

  const isOwner = pkg.editor_email === currentUser?.email;
  const rol = userData?.rol;
  const esGestor = rol === 'admin' || rol === 'editor';
  const canEdit = esGestor || (rol === 'usuario' && pkg.status === 'pending' && isOwner);
  const isAnclado = pkg.reflejo_cliente === true;
  const isOculto = pkg.ocultar_cliente === true;
  const pkgId = pkg.id_paquete || pkg.id || pkg['item.id'];

  const copiarPresupuesto = async () => {
    const texto = generarTextoPresupuestoInterno(pkg);
    try {
      await navigator.clipboard.writeText(texto);
      await showAlert('✅ ¡Presupuesto copiado al portapapeles!', 'success');
    } catch (e) {
      console.error('Error al copiar:', e);
      await showAlert('Error al copiar texto.', 'error');
    }
  };

  return (
    <>
      {canEdit && (
        <div className="modal-tools" style={{ position: 'absolute', top: '15px', right: '50px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', zIndex: 10 }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {esGestor && pkg.status === 'pending' && (
              <button className="btn btn-primario" onClick={() => actions.approvePackage(pkg)} style={{ padding: '5px 12px', fontSize: '0.8em', background: '#2ecc71' }}>
                ✅ Aprobar
              </button>
            )}
            <button className="btn btn-secundario" onClick={() => actions.startEditing(pkg)} style={{ padding: '5px 12px', fontSize: '0.8em' }}>
              ✏️ Editar
            </button>
            <button className="btn btn-secundario" onClick={() => actions.deletePackage(pkg)} style={{ padding: '5px 12px', fontSize: '0.8em', background: '#e74c3c', color: 'white' }}>
              🗑️ Borrar
            </button>
          </div>

          {esGestor && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button
                title="Anclar a B2C (Ignora corte 12hs)"
                onClick={() => actions.toggleVisibilidad(pkgId, 'reflejo_cliente', isAnclado)}
                style={{ padding: '4px 10px', fontSize: '0.85em', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer', border: `1px solid ${isAnclado ? '#1e8e3e' : '#555'}`, background: isAnclado ? '#e6f4ea' : 'transparent', color: isAnclado ? '#1e8e3e' : '#ccc' }}
              >
                ✅ Anclar
              </button>
              <button
                title="Ocultar en B2C"
                onClick={() => actions.toggleVisibilidad(pkgId, 'ocultar_cliente', isOculto)}
                style={{ padding: '4px 10px', fontSize: '0.85em', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer', border: `1px solid ${isOculto ? '#d93025' : '#555'}`, background: isOculto ? '#fce8e6' : 'transparent', color: isOculto ? '#d93025' : '#ccc' }}
              >
                ❌ Ocultar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Cabecera del Modal con Destino + Subtítulo sutil */}
      <div className="modal-detalle-header" style={{ paddingBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '2.2em', lineHeight: 1.1, color: '#fff', textTransform: 'uppercase', fontWeight: 800 }}>
            {pkg.destino}
          </h2>
          {pkg.subtitulo && (
            <div style={{ 
              marginTop: '4px', 
              fontSize: '1em', 
              color: 'rgba(255, 255, 255, 0.85)', 
              fontWeight: 500, 
              textTransform: 'capitalize' 
            }}>
              {pkg.subtitulo}
            </div>
          )}
        </div>
        <div>
          <span style={bubbleStyle}>{pkg.tipo_promo}</span>
        </div>
      </div>

      {/* Grilla responsiva: en PC 2 columnas, en Celular 1 sola vertical */}
      <div className="modal-body-layout">
        <div className="modal-itinerario-col">
          <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginTop: 0, color: '#11173d' }}>
            Itinerario
          </h3>
          <ItinerarioServicios servicios={servicios} mutedText={false} />
        </div>

        <div className="modal-resumen-col" style={{ background: '#f9fbfd', padding: '15px', borderRadius: '8px', height: 'fit-content' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
            <h4 style={{ margin: 0, color: '#11173d' }}>Resumen</h4>
            <button className="btn" onClick={copiarPresupuesto} style={{ background: '#34495e', color: 'white', padding: '5px 12px', fontSize: '0.8em', display: 'flex', alignItems: 'center', gap: '5px' }}>
              📋 Copiar
            </button>
          </div>
          <p style={{ margin: '5px 0', fontSize: '0.9em' }}><b>📅 Salida:</b> {fecha}</p>
          <p style={{ margin: '5px 0', fontSize: '0.9em' }}><b>📍 Desde:</b> {lugarSalida}</p>
          <p style={{ margin: '5px 0', fontSize: '0.9em' }}><b>🌙 Duración:</b> {noches > 0 ? `${noches} Noches` : '-'}</p>
          <p style={{ margin: '5px 0', fontSize: '0.9em' }}><b>📅 Cargado el:</b> {pkg.fecha_creacion || '-'}</p>

          <div>
            <h4 style={{ margin: '18px 0 10px 0', color: '#11173d', borderTop: '1px solid #eee', paddingTop: '15px' }}>Costos (Interno)</h4>
            <CostosProveedores pkg={pkg} />
          </div>

          {pkg.financiacion && (
            <div style={{ marginTop: '15px', background: '#e3f2fd', padding: '10px', borderRadius: '5px', fontSize: '0.85em' }}>
              <b>💳 Financiación:</b> {pkg.financiacion}
            </div>
          )}
        </div>
      </div>

      {/* Footer del Modal */}
      <div style={{ background: '#11173d', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '0 0 12px 12px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <small style={{ opacity: 0.7 }}>Costo Total</small>
            <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>{pkg.moneda} ${formatMoney(pkg.costos_proveedor)}</div>
          </div>
          <div>
            <small style={{ opacity: 0.7 }}>Tarifa Final</small>
            <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#ef5a1a' }}>{pkg.moneda} ${formatMoney(tarifa)}</div>
          </div>
          <div>
            <small style={{ opacity: 0.7 }}>x Persona ({textoBase})</small>
            <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#4caf50' }}>{pkg.moneda} ${formatMoney(tarifaPorPersona)}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <small style={{ opacity: 0.7 }}>Cargado por:</small>
          <div style={{ fontSize: '0.9em' }}>{pkg.creador}</div>
        </div>
      </div>

      {/* Estilos responsivos del modal */}
      <style jsx>{`
        .modal-body-layout {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
          padding: 20px;
        }

        @media (max-width: 768px) {
          .modal-body-layout {
            display: flex !important;
            flex-direction: column !important;
            padding: 12px !important;
            gap: 16px !important;
          }
          .modal-itinerario-col,
          .modal-resumen-col {
            width: 100% !important;
          }
        }
      `}</style>
    </>
  );
}