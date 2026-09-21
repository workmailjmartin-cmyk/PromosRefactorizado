'use client';
import React, { useEffect, useState, useRef } from 'react';import { useParams } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Loader from '@/components/shared/Loader'; 
import { useStaffAuth } from '@/hooks/useStaffAuth';
import FormularioEnlatado from '@/components/proveedores/FormularioEnlatado';
import { useAlert } from '@/contexts/AlertContext';

const MARKUP_AGENCIA = 1.20; 

const getServicioIcon = (tipo) => {
  const t = tipo?.toLowerCase() || '';
  if (t.includes('aereo')) return '✈️';
  if (t.includes('hotel')) return '🏨';
  if (t.includes('bus')) return '🚌';
  if (t.includes('traslado')) return '🚕';
  if (t.includes('excursion')) return '🌲';
  if (t.includes('seguro')) return '🛡️';
  if (t.includes('butaca')) return '💺';
  return '➕';
};

export default function DetallePaqueteInterno() {
  const params = useParams();
  const { currentUser, userData } = useStaffAuth();
  const { showAlert } = useAlert(); 
  
  const [paquete, setPaquete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  
  const [lightboxAbierto, setLightboxAbierto] = useState(false);
  const [imagenActivaIndex, setImagenActivaIndex] = useState(0);
  const [modoEdicion, setModoEdicion] = useState(false);
  
  // EL INTERRUPTOR MÁGICO PARA MOSTRAR AL CLIENTE
  const [vistaCliente, setVistaCliente] = useState(false);
  const [tooltipActivo, setTooltipActivo] = useState(null); 
  const [descAbierta, setDescAbierta] = useState(true);

  const formatearPrecio = (valor) => {
    if (!valor) return '-';
    return Number(valor).toLocaleString('es-AR');
  };

 // --- MINI COMPONENTE PARA EL PRECIO CON CARTELITO Y CÁLCULO DE FINANCIACIÓN ---
  const PrecioClickable = ({ valor, idUnico, destacado = false }) => {
    // 1. REGLA DE REACT: TODOS LOS HOOKS AL PRINCIPIO
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const anchorRef = useRef(null);
    const isOpen = tooltipActivo === idUnico;

    useEffect(() => {
      if (!isOpen || !anchorRef.current) return;
      
      const updatePosition = () => {
        const rect = anchorRef.current.getBoundingClientRect();
        setCoords({ top: rect.top, left: rect.left + (rect.width / 2) });
      };

      updatePosition();

      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }, [isOpen]);

    // 2. AHORA SÍ, ESCAPE RÁPIDO SI NO HAY PRECIO
    if (!valor) return '-';
    
    // 3. CÁLCULOS BASE
    const costo = parseFloat(valor);
    const venta = Math.round(costo * MARKUP_AGENCIA);
    const ganancia = venta - costo;

    // 4. VARIABLES DE FINANCIACIÓN
    let sena = 0;
    let cuotasDisponibles = 0;
    let valorCuota = 0;
    let fechaLimitePago = '';
    let exigeContado = false;

    if (fechaSeleccionada) {
      const fechaSalida = new Date(`${fechaSeleccionada}T12:00:00Z`);
      const hoy = new Date();
      
      const fechaTope = new Date(fechaSalida.getTime());
      fechaTope.setDate(fechaTope.getDate() - 30);
      
      const diffTime = fechaSalida.getTime() - hoy.getTime();
      const diasFaltantesParaViaje = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diasFaltantesParaViaje <= 30) {
        exigeContado = true;
      } else {
        const tipoFinanciacion = paquete?.financiacion || 'sena_30';
        if (tipoFinanciacion === 'sena_30') sena = Math.round(venta * 0.30);
        else if (tipoFinanciacion === 'financiado_100') sena = 0;
        
        const saldoAFinanciar = venta - sena;
        fechaLimitePago = fechaTope.toLocaleDateString('es-AR');
        
        const diffTimeHastaTope = fechaTope.getTime() - hoy.getTime();
        const diasHastaTope = Math.ceil(diffTimeHastaTope / (1000 * 60 * 60 * 24));
        
        if (diasHastaTope >= 30) {
          cuotasDisponibles = Math.floor(diasHastaTope / 30);
          valorCuota = Math.round(saldoAFinanciar / cuotasDisponibles);
        }
      }
    }

    return (
      <>
        {isOpen && (
          <div 
            onClick={(e) => { e.stopPropagation(); setTooltipActivo(null); }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40, cursor: 'default' }}
          />
        )}

        <div 
          ref={anchorRef} 
          style={{ position: 'relative', display: 'inline-block', cursor: 'pointer', zIndex: isOpen ? 50 : 1 }} 
          onClick={(e) => { 
            e.stopPropagation();
            setTooltipActivo(isOpen ? null : idUnico);
          }}
        >
          <span style={{ color: destacado ? '#ef5a1a' : 'inherit', fontWeight: destacado ? '900' : 'inherit' }}>
            ${formatearPrecio(venta)}
          </span>
          
          {isOpen && (
            <div style={{ position: 'fixed', top: coords.top - 12, left: coords.left, transform: 'translateX(-50%) translateY(-100%)', background: '#11173d', color: '#fff', padding: '15px', borderRadius: '12px', fontSize: '0.85rem', zIndex: 99999, width: '220px', textAlign: 'left', boxShadow: '0 10px 25px rgba(0,0,0,0.4)', cursor: 'default' }}>
              
              {!vistaCliente && (
                <div style={{ borderBottom: '1px solid #374151', paddingBottom: '10px', marginBottom: '10px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Uso Interno</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{color: '#d1d5db'}}>Costo Neto:</span> <b>${formatearPrecio(costo)}</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{color: '#4ade80'}}>Ganancia:</span> <b style={{color: '#4ade80'}}>${formatearPrecio(ganancia)}</b>
                  </div>
                </div>
              )}

              <div>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Plan de Pago</div>
                
                {exigeContado ? (
                  <div style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'center', padding: '10px 0' }}>
                    ⚠️ Pago 100% Contado
                    <div style={{ fontSize: '0.75rem', fontWeight: 'normal', color: '#d1d5db', marginTop: '4px' }}>(Viaje próximo)</div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{color: '#d1d5db'}}>Seña:</span> <b>${formatearPrecio(sena)}</b>
                    </div>
                    
                    {cuotasDisponibles > 0 ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', background: 'rgba(255,255,255,0.1)', padding: '4px 6px', borderRadius: '4px' }}>
                        <span style={{color: '#fff'}}>Saldo en:</span> <b>{cuotasDisponibles} x ${formatearPrecio(valorCuota)}</b>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{color: '#d1d5db'}}>Saldo total:</span> <b>${formatearPrecio(venta - sena)}</b>
                      </div>
                    )}
                    
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '8px', borderTop: '1px dashed #4b5563', paddingTop: '5px' }}>
                      Fecha límite de pago:<br/>
                      <strong style={{color: '#fbbf24'}}>{fechaLimitePago}</strong>
                    </div>
                  </>
                )}
              </div>

              <div style={{ position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '8px solid #11173d' }}></div>
            </div>
          )}
        </div>
      </>
    );
  };

  const cargarPaquete = async () => {
    if (!params?.id) return;
    try {
      const docRef = doc(db, 'enlatados', params.id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        setPaquete(data);
        if (data.tarifario && data.tarifario.length > 0) {
          const fechasOrdenadas = [...new Set(data.tarifario.map(t => t.fecha))].sort();
          setFechaSeleccionada(fechasOrdenadas[0]);
        }
      }
    } catch (error) { console.error("Error al cargar:", error); }
    setLoading(false);
  };

  useEffect(() => { cargarPaquete(); }, [params.id]);

  const guardarEdicion = async (datosActualizados) => {
    try {
      const docRef = doc(db, 'enlatados', datosActualizados.id);
      await updateDoc(docRef, { ...datosActualizados, fecha_actualizacion: new Date().toLocaleDateString('es-AR') });
      if (showAlert) showAlert('¡Paquete Actualizado!', 'success');
      else alert('¡Paquete Actualizado!');
      setModoEdicion(false);
      cargarPaquete(); 
    } catch (error) {
      if (showAlert) showAlert('Hubo un problema al actualizar.', 'error');
      else alert('Hubo un problema al actualizar.');
    }
  };

  if (loading) return <Loader visible={true} text="Cargando viaje..." />;
  if (!paquete) return <div style={{ padding: '50px', textAlign: 'center', color: 'red', fontWeight: 'bold' }}>❌ El paquete no existe.</div>;

  // Lógica interna: Solo Admin/Editor editan acá
  const puedeEditar = userData?.rol === 'admin' || userData?.rol === 'editor';

  if (modoEdicion) {
    return <FormularioEnlatado paqueteAEditar={paquete} onCancel={() => setModoEdicion(false)} onSave={guardarEdicion} />;
  }

  const aplicarMarkup = (valor) => valor ? Math.round(parseFloat(valor) * MARKUP_AGENCIA) : '-';
  
  // Cálculos para el precio base principal
  const preciosDobleReales = paquete.tarifario?.map(t => {
    if (typeof t.doble === 'object') return parseFloat(t.doble.mayor) || 0;
    return parseFloat(t.doble) || 0;
  }).filter(p => p > 0) || [];
  
  const costoRealBase = preciosDobleReales.length > 0 ? Math.min(...preciosDobleReales) : 0;
  const precioVentaBase = Math.round(costoRealBase * MARKUP_AGENCIA);
  
  const fechasUnicasISO = [...new Set(paquete.tarifario?.map(t => t.fecha) || [])].sort();
  const tarifarioFiltrado = paquete.tarifario?.filter(t => t.fecha === fechaSeleccionada) || [];
  
  const serviciosOpcionales = (paquete.servicios || []).filter(s => s.opcional);
  const vuelos = paquete.vuelos || []; 

  // --- GENERACIÓN DE SERVICIOS INCLUIDOS AUTOMÁTICOS ---
  // 1. Tomamos los servicios manuales (Traslados, Excursiones, Seguros)
  const serviciosManuales = (paquete.servicios || []).filter(s => !s.opcional);

  // 2. Extraemos el Alojamiento de la tarifa seleccionada
  let servicioHotel = null;
  if (tarifarioFiltrado.length > 0) {
    const tarifaBase = tarifarioFiltrado[0];
    
    if (tarifaBase.hotel2Nombre) {
      // Tiene hotel combinado -> Lo resumimos
      servicioHotel = {
        tipo: 'hotel',
        detalle1: '2 Hoteles Combinados',
        detalle2: 'Ver alojamientos y regímenes en la tabla de tarifas'
      };
    } else {
      // Es un solo hotel -> Lo mostramos normal
      servicioHotel = {
        tipo: 'hotel',
        detalle1: tarifaBase.hotelNombre || (tarifaBase.hotelRegimen ? tarifaBase.hotelRegimen.split(' - ')[0] : 'Alojamiento'),
        detalle2: tarifaBase.regimen || (tarifaBase.hotelRegimen ? tarifaBase.hotelRegimen.split(' - ')[1] : '')
      };
    }
  }

  // 3. Extraemos el Transporte Principal
  let servicioTransporte = null;
  if (paquete.transporte) {
    if (paquete.transporte.includes('aereo')) {
      servicioTransporte = { tipo: 'aereo', detalle1: 'Vuelos Incluidos', detalle2: 'Ver itinerario debajo' };
    } else if (paquete.transporte.includes('bus')) {
      servicioTransporte = { tipo: 'Bus Larga Distancia', detalle1: paquete.transporte.replace('-', ' ').toUpperCase(), detalle2: '' };
    }
  }

  // 4. Unimos todo: Transporte -> Hotel -> Otros Servicios
  const serviciosIncluidos = [servicioTransporte, servicioHotel, ...serviciosManuales].filter(Boolean); 
  
  const abrirLightbox = (index) => { setImagenActivaIndex(index); setLightboxAbierto(true); };
  const cerrarLightbox = () => setLightboxAbierto(false);
  const sigImagen = (e) => { e.stopPropagation(); setImagenActivaIndex((prev) => (prev + 1) % paquete.imagenes.length); };
  const antImagen = (e) => { e.stopPropagation(); setImagenActivaIndex((prev) => (prev === 0 ? paquete.imagenes.length - 1 : prev - 1)); };

  return (
    <>
      {/* HEADER EXCLUSIVO DEL PAQUETE INTERNO CON MEDIA QUERIES */}
      <style>{`
        .header-paquete-interno {
          background: #fff;
          border-bottom: 1px solid #e5e7eb;
          padding: 15px 5%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 1000;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .titulo-paquete-interno {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          margin: 0;
          color: #ef5a1a;
          font-size: 1.8rem;
          font-weight: 900;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .etiqueta-panel {
          font-size: 0.9rem;
          font-weight: bold;
          color: #11173d;
          background: #e0f2fe;
          padding: 6px 14px;
          border-radius: 20px;
          border: 1px solid #bae6fd;
        }

        /* --- MODO CELULAR --- */
        @media (max-width: 768px) {
          .header-paquete-interno {
            flex-direction: column;
            padding: 15px;
            gap: 12px;
            position: relative; 
          }
          .titulo-paquete-interno {
            position: relative;
            left: 0;
            top: 0;
            transform: none;
            text-align: center;
            white-space: normal;
            font-size: 1.5rem;
            line-height: 1.2;
            width: 100%;
          }
          /* Bloqueo estricto antidesborde */
          .contenedor-gris { padding: 15px 10px !important; width: 100vw; overflow-x: hidden; box-sizing: border-box; }
          .caja-blanca { padding: 20px 15px !important; width: 100%; overflow-x: hidden; box-sizing: border-box; }
          .tabla-responsive { max-width: 100vw; }
        }
      `}</style>

      <header className="header-paquete-interno">
        <div style={{ flex: '1 1 auto' }}>
          <a href="/internal/enlatados">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Feliz Viaje" style={{ maxHeight: '60px', width: 'auto', cursor: 'pointer' }} />
          </a>
        </div>

        <h1 className="titulo-paquete-interno">
          {paquete.destino}
        </h1>

        <div style={{ flex: '1 1 auto', display: 'flex', justifyContent: 'flex-end' }}>
          <span className="etiqueta-panel">
            🔒 Panel Interno
          </span>
        </div>
      </header>
      <div className="contenedor-gris" style={{ background: '#f3f4f6', minHeight: '100vh', width: '100%', overflowX: 'hidden' }}>
        <div className="caja-blanca" style={{ maxWidth: '1200px', margin: '0 auto', background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 10px 25px rgba(0,0,0,0.03)', position: 'relative', width: '100%', overflowX: 'hidden' }}>
        
        {/* SWITCH DE VISTA CLIENTE / STAFF */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => { setVistaCliente(!vistaCliente); setTooltipActivo(null); }}
            style={{ background: vistaCliente ? '#10b981' : '#11173d', color: '#fff', padding: '8px 20px', borderRadius: '25px', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', maxWidth: '100%', whiteSpace: 'nowrap' }}
          >
            {vistaCliente ? '👀 MODO CLIENTE' : '🏢 MODO STAFF'}
          </button>
        </div>

        {/* ---------------- COMIENZO DEL FOLLETO (Se ve igual para todos) ---------------- */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 10px 25px rgba(0,0,0,0.03)', padding: '30px', position: 'relative' }}>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', marginBottom: '40px' }}>
            
            <div style={{ flex: '1 1 400px', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '15px' }}>              {paquete.imagenes && paquete.imagenes.length > 0 ? (
                <>
                  <div onClick={() => abrirLightbox(0)} style={{ height: '400px', borderRadius: '20px', overflow: 'hidden', cursor: 'pointer' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={paquete.imagenes[0]} alt="Portada" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }} onMouseOver={e=>e.currentTarget.style.transform='scale(1.03)'} onMouseOut={e=>e.currentTarget.style.transform='scale(1)'} />
                  </div>
                  {paquete.imagenes.length > 1 && (
                    <div style={{ display: 'flex', gap: '15px' }}>
                      {paquete.imagenes.slice(1).map((img, idx) => (
                        <div key={idx + 1} onClick={() => abrirLightbox(idx + 1)} style={{ flex: 1, height: '110px', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img} alt={`Miniatura ${idx+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85, transition: 'opacity 0.2s' }} onMouseOver={e=>e.currentTarget.style.opacity='1'} onMouseOut={e=>e.currentTarget.style.opacity='0.85'} />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ height: '400px', background: '#f3f4f6', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>Sin imágenes cargadas</div>
              )}
            </div>

            <div style={{ flex: '1 1 300px', minWidth: '280px', display: 'flex', flexDirection: 'column' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'inline-block', background: '#11173d', color: '#fff', padding: '6px 14px', borderRadius: '25px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '15px', letterSpacing: '0.5px', alignSelf: 'flex-start' }}>
                  {paquete.transporte.includes('aereo') ? '✈️ Aéreo' : '🚌 Bus'} • Salida desde {paquete.transporte.includes('aereo') ? paquete.origenProvincia || paquete.origenPrincipal : paquete.origenPrincipal}
                </div>
                
                {/* BOTÓN EDITAR: Vuelve a su posición original (Se oculta en vista cliente) */}
                {puedeEditar && !vistaCliente && (
                  <button onClick={() => setModoEdicion(true)} style={{ background: '#ef5a1a', color: '#fff', padding: '6px 12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem', boxShadow: '0 2px 4px rgba(239, 90, 26, 0.2)' }}>
                    ✏️ Editar
                  </button>
                )}
              </div>
              
              <h1 style={{ margin: '0 0 5px 0', fontSize: '2.4rem', color: '#11173d', fontWeight: 900, lineHeight: '1.1', letterSpacing: '-0.5px' }}>
                {paquete.destino}
              </h1>

              {/* NOMBRE DEL PROVEEDOR (Se oculta en vista cliente) */}
              {!vistaCliente && (
                <div style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '15px' }}>
                  Proveedor: <b style={{ color: '#11173d' }}>{paquete.proveedor_nombre}</b>
                </div>
              )}
              
              <p style={{ margin: '0 0 15px 0', color: '#11173d', fontSize: '1.1rem', fontWeight: 'bold' }}>
                <span style={{ color: '#ef5a1a', marginRight: '5px' }}>🌙</span>
                {paquete.dias} Días / {paquete.noches} Noches
              </p>
              
              {paquete.paradas_ascenso && paquete.paradas_ascenso.length > 0 && (
                <p style={{ margin: '0 0 15px 0', fontSize: '0.85rem', color: '#6b7280' }}>
                  <b style={{color: '#11173d'}}>Paradas de ascenso:</b> {paquete.paradas_ascenso.join(' - ')}
                </p>
              )}

              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '15px', marginBottom: '20px', flex: 1 }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#11173d', fontSize: '1rem', fontWeight: '900' }}>Servicios Incluidos</h4>
                {serviciosIncluidos.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {serviciosIncluidos.map((s, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.2rem', width: '25px', textAlign: 'center' }}>{getServicioIcon(s.tipo)}</span>
                        <div style={{ flex: 1, borderLeft: '2px solid #e5e7eb', paddingLeft: '10px' }}>
                          <div style={{ color: '#11173d', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', lineHeight: '1' }}>{s.tipo}</div>
                          <div style={{ color: '#4b5563', fontSize: '0.8rem', fontWeight: 'bold', marginTop: '2px' }}>{s.detalle1}</div>
                          {s.detalle2 && <div style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '1px' }}>{s.detalle2}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.8rem', margin: 0 }}>Consultá los servicios incluidos.</p>
                )}
              </div>

              <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '16px', textAlign: 'right' }}>
                <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#ef5a1a', display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '8px' }}>
                  <span style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 'bold' }}>desde</span>
                  {paquete.moneda || 'USD'} ${formatearPrecio(precioVentaBase)}
                </div>
                {!vistaCliente && <span style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>*Precio Neto Agencia (Markup incluido)</span>}
                <div style={{ marginTop: '10px', fontSize: '0.75rem', color: '#dc2626', fontWeight: 'bold', textTransform: 'uppercase', background: '#fef2f2', padding: '8px', borderRadius: '6px', border: '1px solid #fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '14px', height: '14px', flexShrink: 0 }} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Disponibilidad sujeta a confirmación
                </div>
                {/* BOTÓN SCROLL SUAVE A TARIFAS */}
                <button 
                  onClick={() => document.getElementById('seccion-tarifas').scrollIntoView({ behavior: 'smooth' })}
                  style={{ width: '100%', marginTop: '5px', padding: '12px', background: '#11173d', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(17,23,61,0.2)' }}
                >
                  🗓️ Ver Fechas y Tarifas
                </button>
              </div>

            </div>
          </div>

          {/* ACORDEÓN DE DESCRIPCIÓN */}
          {paquete.descripcionViaje && (
            <div style={{ marginBottom: '40px', border: '1px solid #e5e7eb', borderRadius: '12px', background: '#fff', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
              <div 
                onClick={() => setDescAbierta(!descAbierta)} 
                style={{ padding: '15px 20px', background: '#f9fafb', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: descAbierta ? '1px solid #e5e7eb' : 'none' }}
              >
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#11173d', fontWeight: 900 }}>📝 Descripción General</h3>
                <span style={{ fontSize: '1.2rem', color: '#6b7280', transition: 'transform 0.3s', transform: descAbierta ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
              </div>
              {descAbierta && (
                <div style={{ padding: '20px', color: '#4b5563', lineHeight: '1.7', whiteSpace: 'pre-wrap', fontSize: '1rem' }}>
                  {paquete.descripcionViaje}
                </div>
              )}
            </div>
          )}

          <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '40px 0' }} />

          {/* LÓGICA INTELIGENTE: Si no hay vuelos ni opcionales, la columna izquierda desaparece */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '50px', marginBottom: '50px' }}>
            
            {(vuelos.length > 0 || serviciosOpcionales.length > 0) && (
              <div style={{ flex: '1 1 300px' }}>
                {vuelos.length > 0 && (
                  <div style={{ marginBottom: '40px' }}>
                    {/* ... (Acá adentro va a quedar el código que ya tenías de vuelos) ... */}
                    <h3 style={{ color: '#0369a1', fontSize: '1.4rem', fontWeight: 900, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>✈️ Itinerario de Vuelos</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {vuelos.map((v, idx) => {
                        const fechaSalidaArg = v.fechaSalida ? new Date(`${v.fechaSalida}T12:00:00Z`).toLocaleDateString('es-AR') : '';
                        const fechaLlegadaArg = v.fechaLlegada ? new Date(`${v.fechaLlegada}T12:00:00Z`).toLocaleDateString('es-AR') : '';
                        return (
                          <div key={idx} style={{ padding: '15px', background: '#f0f9ff', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px dashed #7dd3fc', paddingBottom: '10px' }}>
                              <strong style={{ color: '#0369a1' }}>Tramo {idx + 1}: {v.aerolinea}</strong>
                              <span style={{ fontSize: '0.85rem', color: '#0284c7', fontWeight: 'bold', background: '#e0f2fe', padding: '2px 8px', borderRadius: '12px' }}>{v.equipaje}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#11173d' }}>{v.horaSalida}</div>
                                <div style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 'bold' }}>{fechaSalidaArg}</div>
                                <div style={{ fontSize: '0.9rem', color: '#0369a1', marginTop: '4px' }}>{v.origen}</div>
                              </div>
                              <div style={{ color: '#bae6fd', fontSize: '2rem' }}>⟶</div>
                              <div style={{ flex: 1, textAlign: 'right' }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#11173d' }}>{v.horaLlegada}</div>
                                <div style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 'bold' }}>{fechaLlegadaArg}</div>
                                <div style={{ fontSize: '0.9rem', color: '#0369a1', marginTop: '4px' }}>{v.destino}</div>
                              </div>
                            </div>
                            {v.obs && <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#4b5563', fontStyle: 'italic' }}>* {v.obs}</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {serviciosOpcionales.length > 0 && (
                  <div>
                    <h3 style={{ color: '#11173d', fontSize: '1.4rem', fontWeight: 900, marginBottom: '20px' }}>Opcionales Recomendados</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {serviciosOpcionales.map((s, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '15px', padding: '15px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', alignItems: 'center' }}>
                          <span style={{ fontSize: '1.5rem', lineHeight: '1' }}>{getServicioIcon(s.tipo)}</span>
                          <div style={{ flex: 1 }}>
                            <strong style={{ color: '#11173d', fontSize: '0.95rem', textTransform: 'uppercase' }}>{s.tipo}</strong>
                            <div style={{ color: '#4b5563', fontSize: '0.9rem', fontWeight: '500' }}>
                              {s.detalle1} {s.fechaHora ? ` - ${new Date(`${s.fechaHora}T12:00:00Z`).toLocaleDateString('es-AR')}` : ''}
                            </div>
                            {s.detalle2 && <div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>{s.detalle2}</div>}
                          </div>
                          {s.tarifa && (
                            <div style={{ background: '#fef3c7', color: '#b45309', padding: '5px 10px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.9rem', border: '1px solid #fde68a' }}>
                              + {paquete.moneda || 'USD'} ${formatearPrecio(Math.round(parseFloat(s.tarifa) * MARKUP_AGENCIA))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* El itinerario ahora toma todo el ancho (100%) si la columna izquierda está oculta */}
            <div style={{ flex: (vuelos.length > 0 || serviciosOpcionales.length > 0) ? '1 1 300px' : '1 1 100%' }}>
              <h3 style={{ color: '#11173d', fontSize: '1.4rem', fontWeight: 900, marginBottom: '25px' }}>Itinerario Resumido</h3>
              {paquete.itinerario && paquete.itinerario.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {paquete.itinerario.map((dia, idx) => (
                    <div key={idx} style={{ paddingLeft: '20px', borderLeft: '3px solid #ef5a1a', position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '-8px', top: '4px', width: '13px', height: '13px', background: '#ef5a1a', borderRadius: '50%' }}></div>
                      <h4 style={{ margin: '0 0 5px 0', color: '#11173d', fontSize: '1rem', fontWeight: 800 }}>Día {dia.dia}: {dia.titulo}</h4>
                      <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem', lineHeight: '1.5' }}>{dia.descripcion}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.9rem' }}>A consultar.</p>
              )}
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '40px 0' }} />

          <div id="seccion-tarifas">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px' }}>
              <h3 style={{ color: '#11173d', fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>Seleccioná tu fecha de Salida</h3>
              <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>Tarifas en {paquete.moneda || 'USD'}</span>
            </div>
            
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '40px' }}>
              {fechasUnicasISO.length > 0 ? (
                fechasUnicasISO.map((fecha) => {
                  const estaSeleccionada = fechaSeleccionada === fecha;
                  const partes = fecha.split('-');
                  const anio = partes[0];
                  const mesNum = partes[1];
                  const dia = partes[2];
                  const mesesCortos = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                  const mesNombre = mesesCortos[parseInt(mesNum, 10) - 1];

                  return (
                    <div
                      key={fecha}
                      onClick={() => setFechaSeleccionada(fecha)}
                      style={{
                        width: '85px', padding: '10px 0', borderRadius: '12px', cursor: 'pointer',
                        background: estaSeleccionada ? '#11173d' : '#fff',
                        border: estaSeleccionada ? '2px solid #11173d' : '2px solid #e5e7eb',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        boxShadow: estaSeleccionada ? '0 6px 12px rgba(17,23,61,0.15)' : '0 2px 4px rgba(0,0,0,0.02)',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: estaSeleccionada ? 'translateY(-3px)' : 'translateY(0)'
                      }}
                    >
                      <div style={{ color: estaSeleccionada ? '#fff' : '#ef5a1a', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px' }}>{mesNombre}</div>
                      <div style={{ color: estaSeleccionada ? '#fff' : '#11173d', fontSize: '1.8rem', fontWeight: '900', lineHeight: '1', marginBottom: '4px' }}>{dia}</div>
                      <div style={{ color: estaSeleccionada ? '#9ca3af' : '#6b7280', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '1px' }}>{anio}</div>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: estaSeleccionada ? '#ef5a1a' : 'transparent', marginTop: '4px' }}></div>
                    </div>
                  );
                })
              ) : (
                <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>A consultar.</p>
              )}
            </div>

            {tarifarioFiltrado.length > 0 && (
              <>
                {/* Contenedor que da el borde (Faltaba abrir este div) */}
                <div style={{ borderRadius: '16px', border: '1px solid #e5e7eb', background: '#fff' }}>
                  <div className="tabla-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%' }}>
                    <table style={{ minWidth: '1050px', width: '100%', tableLayout: 'auto', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: '#11173d', color: '#fff' }}>
                          <th rowSpan="2" style={{ padding: '15px 10px', textAlign: 'left', width: '18%', position: 'sticky', left: 0, background: '#11173d', zIndex: 20 }}>Alojamiento</th>
                          <th rowSpan="2" style={{ padding: '15px 10px', textAlign: 'left', width: '12%' }}>Régimen</th>
                          <th colSpan="3" style={{ padding: '10px 2px', textAlign: 'center', borderLeft: '1px solid #374151', width: '21%' }}>Base Doble</th>
                          <th colSpan="3" style={{ padding: '10px 2px', textAlign: 'center', borderLeft: '1px solid #374151', width: '21%' }}>Base Triple</th>
                          <th colSpan="3" style={{ padding: '10px 2px', textAlign: 'center', borderLeft: '1px solid #374151', width: '21%' }}>Base Cuádruple</th>
                          <th style={{ padding: '10px 2px', textAlign: 'center', borderLeft: '1px solid #374151', width: '7%' }}>Single</th>
                        </tr>
                        <tr style={{ background: '#f3f4f6', color: '#4b5563', fontSize: '0.75rem' }}>
                          <th style={{ padding: '8px 2px', borderLeft: '1px solid #e5e7eb' }}>Adulto</th><th style={{ padding: '8px 2px' }}>Menor</th><th style={{ padding: '8px 2px' }}>Child</th>
                          <th style={{ padding: '8px 2px', borderLeft: '1px solid #e5e7eb' }}>Adulto</th><th style={{ padding: '8px 2px' }}>Menor</th><th style={{ padding: '8px 2px' }}>Child</th>
                          <th style={{ padding: '8px 2px', borderLeft: '1px solid #e5e7eb' }}>Adulto</th><th style={{ padding: '8px 2px' }}>Menor</th><th style={{ padding: '8px 2px' }}>Child</th>
                          <th style={{ padding: '8px 2px', borderLeft: '1px solid #e5e7eb' }}>Adulto</th>
                        </tr>
                      </thead>
                      <tbody style={{ textAlign: 'center' }}>
                        {tarifarioFiltrado.map((fila, idx) => {
                          const doble = typeof fila.doble === 'object' ? fila.doble : { mayor: fila.doble };
                          const triple = typeof fila.triple === 'object' ? fila.triple : { mayor: fila.triple };
                          const cuadruple = typeof fila.cuadruple === 'object' ? fila.cuadruple : { mayor: fila.cuadruple };
                          const single = typeof fila.single === 'object' ? fila.single : { mayor: fila.single };

                          const nombreAlojamiento = fila.hotelNombre || (fila.hotelRegimen ? fila.hotelRegimen.split(' - ')[0] : 'Hotel');
                          const tipoRegimen = fila.regimen || (fila.hotelRegimen ? fila.hotelRegimen.split(' - ')[1] : '');
                          const estrellas = fila.hotelEstrellas ? '⭐'.repeat(parseInt(fila.hotelEstrellas)) : '';
                          
                          const estrellas2 = fila.hotel2Estrellas ? '⭐'.repeat(parseInt(fila.hotel2Estrellas)) : '';

                          return (
                            <tr key={idx} style={{ borderBottom: idx === tarifarioFiltrado.length - 1 ? 'none' : '1px solid #f3f4f6' }}>
                              <td style={{ padding: '15px 10px', textAlign: 'left', wordWrap: 'break-word', verticalAlign: 'middle', position: 'sticky', left: 0, background: '#fff', zIndex: 10, borderRight: '1px solid #e5e7eb' }}>
                                <div style={{ fontWeight: 'bold', color: '#11173d', lineHeight: '1.2' }}>{nombreAlojamiento}</div>
                                {estrellas && <div style={{ fontSize: '0.65rem', margin: '4px 0', letterSpacing: '1px' }}>{estrellas}</div>}
                                {fila.hotelUbicacion && (<a href={fila.hotelUbicacion} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '5px', fontSize: '0.65rem', background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '12px', textDecoration: 'none', fontWeight: 'bold' }}>📍 Ubicación</a>)}
                                
                                {/* DIBUJO DEL HOTEL 2 COMBINADO */}
                                {fila.hotel2Nombre && (
                                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #e5e7eb' }}>
                                    <div style={{ fontSize: '0.7rem', color: '#0ea5e9', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px' }}>+ Combinado con:</div>
                                    <div style={{ fontWeight: 'bold', color: '#11173d', lineHeight: '1.2' }}>{fila.hotel2Nombre}</div>
                                    {estrellas2 && <div style={{ fontSize: '0.65rem', margin: '4px 0', letterSpacing: '1px' }}>{estrellas2}</div>}
                                    {fila.hotel2Ubicacion && (<a href={fila.hotel2Ubicacion} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '5px', fontSize: '0.65rem', background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '12px', textDecoration: 'none', fontWeight: 'bold' }}>📍 Ubicación</a>)}
                                  </div>
                                )}
                              </td>
                              
                              <td style={{ padding: '15px 10px', textAlign: 'middle', fontWeight: '600', color: '#4b5563', wordWrap: 'break-word', verticalAlign: 'middle' }}>
                                <div>{tipoRegimen}</div>
                                {fila.hotel2Nombre && (
                                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed transparent' }}>
                                    <div style={{ fontSize: '0.7rem', color: 'transparent', marginBottom: '2px' }}>+</div>
                                    <div>{fila.hotel2Regimen}</div>
                                  </div>
                                )}
                              </td>
                              
                              <td style={{ padding: '15px 2px', borderLeft: '1px solid #e5e7eb' }}><PrecioClickable valor={doble.mayor} idUnico={`d-may-${idx}`} destacado={true} /></td>
                              <td style={{ padding: '15px 2px', color: '#6b7280' }}><PrecioClickable valor={doble.menor} idUnico={`d-men-${idx}`} /></td>
                              <td style={{ padding: '15px 2px', color: '#6b7280' }}><PrecioClickable valor={doble.child} idUnico={`d-chi-${idx}`} /></td>
                              
                              <td style={{ padding: '15px 2px', borderLeft: '1px solid #e5e7eb' }}><PrecioClickable valor={triple.mayor} idUnico={`t-may-${idx}`} destacado={true} /></td>
                              <td style={{ padding: '15px 2px', color: '#6b7280' }}><PrecioClickable valor={triple.menor} idUnico={`t-men-${idx}`} /></td>
                              <td style={{ padding: '15px 2px', color: '#6b7280' }}><PrecioClickable valor={triple.child} idUnico={`t-chi-${idx}`} /></td>
                              
                              <td style={{ padding: '15px 2px', borderLeft: '1px solid #e5e7eb' }}><PrecioClickable valor={cuadruple.mayor} idUnico={`c-may-${idx}`} destacado={true} /></td>
                              <td style={{ padding: '15px 2px', color: '#6b7280' }}><PrecioClickable valor={cuadruple.menor} idUnico={`c-men-${idx}`} /></td>
                              <td style={{ padding: '15px 2px', color: '#6b7280' }}><PrecioClickable valor={cuadruple.child} idUnico={`c-chi-${idx}`} /></td>
                              
                              <td style={{ padding: '15px 2px', borderLeft: '1px solid #e5e7eb' }}><PrecioClickable valor={single.mayor} idUnico={`s-may-${idx}`} destacado={true} /></td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div> 
                </div>

                {/* ACLARACIÓN DE TARIFAS POR PERSONA */}
                <div style={{ textAlign: 'right', marginTop: '10px', fontSize: '0.8rem', color: '#6b7280', fontWeight: 'bold' }}>
                  * Todas las tarifas y cuotas están expresadas por persona.
                </div>
                <div style={{ marginTop: '15px', fontSize: '0.75rem', color: '#dc2626', fontWeight: 'bold', textTransform: 'uppercase', background: '#fef2f2', padding: '8px', borderRadius: '6px', border: '1px solid #fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: 'fit-content', marginLeft: 'auto' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '14px', height: '14px', flexShrink: 0 }} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Disponibilidad sujeta a confirmación
                </div>
              </>
            )}
          </div>

            {paquete.observaciones && (
              <div style={{ marginTop: '40px', padding: '20px', background: '#fff5f0', borderRadius: '12px', borderLeft: '4px solid #ef5a1a' }}>
                <h3 style={{ color: '#ef5a1a', fontSize: '1.1rem', margin: '0 0 10px 0', fontWeight: '900' }}>⚠️ Observaciones Importantes</h3>
                <p style={{ margin: 0, color: '#4b5563', fontSize: '0.95rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{paquete.observaciones}</p>
              </div>
            )}

          </div>

          {/* LIGHTBOX GALERÍA */}
          {lightboxAbierto && paquete.imagenes && (
            <div onClick={cerrarLightbox} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.95)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
              <button onClick={cerrarLightbox} style={{ position: 'absolute', top: '30px', right: '40px', background: 'none', border: 'none', color: '#fff', fontSize: '2.5rem', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
              <button onClick={antImagen} style={{ position: 'absolute', left: '40px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: '2rem', width: '60px', height: '60px', borderRadius: '50%', cursor: 'pointer' }}>‹</button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={paquete.imagenes[imagenActivaIndex]} alt="Zoom" style={{ maxWidth: '85%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '12px' }} />
              <button onClick={sigImagen} style={{ position: 'absolute', right: '40px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: '2rem', width: '60px', height: '60px', borderRadius: '50%', cursor: 'pointer' }}>›</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}