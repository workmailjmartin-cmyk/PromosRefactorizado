'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Loader from '@/components/shared/Loader'; 
import { useStaffAuth } from '@/hooks/useStaffAuth';
import FormularioEnlatado from '@/components/proveedores/FormularioEnlatado';
import { useAlert } from '@/contexts/AlertContext';

const MARKUP_AGENCIA = 1.20; 

const getServicioIcon = (tipo) => {
  const t = tipo?.toLowerCase();
  if (t === 'aereo') return '✈️';
  if (t === 'hotel') return '🏨';
  if (t === 'traslado') return '🚕';
  if (t === 'excursion') return '🌲';
  if (t === 'seguro') return '🛡️';
  return '➕';
};

export default function DetallePaqueteMayorista() {
  const params = useParams();
  const { currentUser, userData } = useStaffAuth();
  const { showAlert } = useAlert(); 
  
  const [paquete, setPaquete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  
  const [lightboxAbierto, setLightboxAbierto] = useState(false);
  const [imagenActivaIndex, setImagenActivaIndex] = useState(0);
  const [modoEdicion, setModoEdicion] = useState(false);

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

  const esPropietario = paquete.proveedor_email === currentUser?.email;
  const esGestor = userData?.rol === 'admin' || userData?.rol === 'editor';
  const puedeEditar = esPropietario || esGestor;

  if (modoEdicion) {
    return <FormularioEnlatado paqueteAEditar={paquete} onCancel={() => setModoEdicion(false)} onSave={guardarEdicion} />;
  }

  // LÓGICA DE PRECIO PARA PAQUETES VIEJOS Y NUEVOS
  const aplicarMarkup = (valor) => valor ? Math.round(parseFloat(valor) * MARKUP_AGENCIA) : '-';
  const preciosDoble = paquete.tarifario?.map(t => {
    if (typeof t.doble === 'object') return parseFloat(t.doble.mayor) || 0;
    return parseFloat(t.doble) || 0;
  }).filter(p => p > 0) || [];
  const precioDesde = preciosDoble.length > 0 ? Math.round(Math.min(...preciosDoble) * MARKUP_AGENCIA) : 0;
  
  const fechasUnicasISO = [...new Set(paquete.tarifario?.map(t => t.fecha) || [])].sort();
  const tarifarioFiltrado = paquete.tarifario?.filter(t => t.fecha === fechaSeleccionada) || [];
  
  const serviciosIncluidos = (paquete.servicios || []).filter(s => !s.opcional);
  const serviciosOpcionales = (paquete.servicios || []).filter(s => s.opcional);
  const vuelos = paquete.vuelos || []; 
  
  const abrirLightbox = (index) => { setImagenActivaIndex(index); setLightboxAbierto(true); };
  const cerrarLightbox = () => setLightboxAbierto(false);
  const sigImagen = (e) => { e.stopPropagation(); setImagenActivaIndex((prev) => (prev + 1) % paquete.imagenes.length); };
  const antImagen = (e) => { e.stopPropagation(); setImagenActivaIndex((prev) => (prev === 0 ? paquete.imagenes.length - 1 : prev - 1)); };

  return (
    <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 10px 25px rgba(0,0,0,0.03)', padding: '30px', position: 'relative' }}>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', marginBottom: '40px' }}>
        
        {/* GALERÍA (70%) */}
        <div style={{ flex: '7 1 500px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {paquete.imagenes && paquete.imagenes.length > 0 ? (
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

        {/* INFO Y PRECIO (30%) */}
        <div style={{ flex: '3 1 280px', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'inline-block', background: '#11173d', color: '#fff', padding: '6px 14px', borderRadius: '25px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '20px', letterSpacing: '0.5px' }}>
              {paquete.transporte.includes('aereo') ? '✈️ Aéreo' : '🚌 Bus'} • Salida desde {paquete.transporte.includes('aereo') ? paquete.origenProvincia || paquete.origenPrincipal : paquete.origenPrincipal}
            </div>
            {puedeEditar && (
              <button onClick={() => setModoEdicion(true)} style={{ background: '#ef5a1a', color: '#fff', padding: '6px 12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem', boxShadow: '0 2px 4px rgba(239, 90, 26, 0.2)' }}>
                ✏️ Editar
              </button>
            )}
          </div>
          
          <h1 style={{ margin: '0 0 10px 0', fontSize: '2.4rem', color: '#11173d', fontWeight: 900, lineHeight: '1.1', letterSpacing: '-0.5px' }}>
            {paquete.destino}
          </h1>
          
          <p style={{ margin: '0 0 15px 0', color: '#11173d', fontSize: '1.1rem', fontWeight: 'bold' }}>
            <span style={{ color: '#ef5a1a', marginRight: '5px' }}>🌙</span>
            {paquete.dias} Días / {paquete.noches} Noches
          </p>
          
          {paquete.paradas_ascenso && paquete.paradas_ascenso.length > 0 && (
            <p style={{ margin: '0 0 15px 0', fontSize: '0.85rem', color: '#6b7280' }}>
              <b style={{color: '#11173d'}}>Paradas de ascenso:</b> {paquete.paradas_ascenso.join(' - ')}
            </p>
          )}

          {/* LISTA DE SERVICIOS ARRIBA DEL PRECIO */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '15px', marginBottom: '20px', flex: 1 }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#11173d', fontSize: '1rem', fontWeight: '900' }}>Servicios Incluidos</h4>
            {serviciosIncluidos.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {serviciosIncluidos.map((s, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.2rem', width: '25px', textAlign: 'center' }}>{getServicioIcon(s.tipo)}</span>
                    <div style={{ flex: 1, borderLeft: '2px solid #e5e7eb', paddingLeft: '10px' }}>
                      <div style={{ color: '#11173d', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', lineHeight: '1' }}>{s.tipo}</div>
                      <div style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '2px' }}>{s.detalle1}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.8rem', margin: 0 }}>No hay servicios detallados.</p>
            )}
          </div>

          {/* BLOQUE PRECIO ABAJO */}
          <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '16px', textAlign: 'right' }}>
            <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#ef5a1a', display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '8px' }}>
              <span style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 'bold' }}>desde</span>
              {paquete.moneda || 'USD'} ${precioDesde}
            </div>
            <span style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 'bold' }}>*Precio neto para Agencia ({Math.round(MARKUP_AGENCIA * 100 - 100)}% de markup)</span>
          </div>

        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '40px 0' }} />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '50px', marginBottom: '50px' }}>
        
        {/* BLOQUE IZQUIERDO: Vuelos y Opcionales */}
        <div style={{ flex: '1 1 300px' }}>
          
          {vuelos.length > 0 && (
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{ color: '#0369a1', fontSize: '1.4rem', fontWeight: 900, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                ✈️ Itinerario de Vuelos
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {vuelos.map((v, idx) => {
                  const fechaSalidaArg = v.fechaSalida ? new Date(v.fechaSalida).toLocaleDateString('es-AR') : '';
                  const fechaLlegadaArg = v.fechaLlegada ? new Date(v.fechaLlegada).toLocaleDateString('es-AR') : '';
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
                        {s.detalle1} {s.fechaHora ? ` - ${new Date(s.fechaHora).toLocaleDateString('es-AR')}` : ''}
                      </div>
                      {s.detalle2 && <div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>{s.detalle2}</div>}
                    </div>
                    {s.tarifa && (
                      <div style={{ background: '#fef3c7', color: '#b45309', padding: '5px 10px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.9rem', border: '1px solid #fde68a' }}>
                        + {paquete.moneda || 'USD'} ${s.tarifa}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* BLOQUE DERECHO: Itinerario Diario */}
        <div style={{ flex: '1 1 300px' }}>
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
            <p style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.9rem' }}>El proveedor no cargó itinerario.</p>
          )}
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '40px 0' }} />

      <div>
        <h3 style={{ color: '#11173d', fontSize: '1.5rem', fontWeight: 900, marginBottom: '25px' }}>
          Seleccioná tu fecha de Salida
        </h3>
        
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
             <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>No hay fechas cargadas.</p>
          )}
        </div>

        {/* TABLA TARIFARIO COMPLEJA Y FIJA */}
        {tarifarioFiltrado.length > 0 && (
          <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid #e5e7eb', background: '#fff' }}>
            <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#11173d', color: '#fff' }}>
                  <th rowSpan="2" style={{ padding: '15px 10px', textAlign: 'left', width: '18%' }}>Alojamiento</th>
                  <th rowSpan="2" style={{ padding: '15px 10px', textAlign: 'left', width: '12%' }}>Régimen</th>
                  <th colSpan="3" style={{ padding: '10px 2px', textAlign: 'center', borderLeft: '1px solid #374151', width: '21%' }}>Base Doble</th>
                  <th colSpan="3" style={{ padding: '10px 2px', textAlign: 'center', borderLeft: '1px solid #374151', width: '21%' }}>Base Triple</th>
                  <th colSpan="3" style={{ padding: '10px 2px', textAlign: 'center', borderLeft: '1px solid #374151', width: '21%' }}>Base Cuádruple</th>
                  <th style={{ padding: '10px 2px', textAlign: 'center', borderLeft: '1px solid #374151', width: '7%' }}>Single</th>
                </tr>
                <tr style={{ background: '#f3f4f6', color: '#4b5563', fontSize: '0.75rem' }}>
                  <th style={{ padding: '8px 2px', borderLeft: '1px solid #e5e7eb' }}>Adulto</th>
                  <th style={{ padding: '8px 2px' }}>Menor</th>
                  <th style={{ padding: '8px 2px' }}>Child</th>
                  <th style={{ padding: '8px 2px', borderLeft: '1px solid #e5e7eb' }}>Adulto</th>
                  <th style={{ padding: '8px 2px' }}>Menor</th>
                  <th style={{ padding: '8px 2px' }}>Child</th>
                  <th style={{ padding: '8px 2px', borderLeft: '1px solid #e5e7eb' }}>Adulto</th>
                  <th style={{ padding: '8px 2px' }}>Menor</th>
                  <th style={{ padding: '8px 2px' }}>Child</th>
                  <th style={{ padding: '8px 2px', borderLeft: '1px solid #e5e7eb' }}>Adulto</th>
                </tr>
              </thead>
              <tbody style={{ textAlign: 'center' }}>
                {tarifarioFiltrado.map((fila, idx) => {
                  const doble = typeof fila.doble === 'object' ? fila.doble : { mayor: fila.doble };
                  const triple = typeof fila.triple === 'object' ? fila.triple : { mayor: fila.triple };
                  const cuadruple = typeof fila.cuadruple === 'object' ? fila.cuadruple : { mayor: fila.cuadruple };
                  const single = typeof fila.single === 'object' ? fila.single : { mayor: fila.single };

                  // Lógica de compatibilidad para separar Hotel y Régimen en paquetes viejos
                  const nombreAlojamiento = fila.hotelNombre || (fila.hotelRegimen ? fila.hotelRegimen.split(' - ')[0] : 'Hotel');
                  const tipoRegimen = fila.regimen || (fila.hotelRegimen ? fila.hotelRegimen.split(' - ')[1] : '');
                  const estrellas = fila.hotelEstrellas ? '⭐'.repeat(parseInt(fila.hotelEstrellas)) : '';

                  return (
                    <tr key={idx} style={{ borderBottom: idx === tarifarioFiltrado.length - 1 ? 'none' : '1px solid #f3f4f6' }}>
                      
                      <td style={{ padding: '15px 10px', textAlign: 'left', wordWrap: 'break-word', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 'bold', color: '#11173d', lineHeight: '1.2' }}>{nombreAlojamiento}</div>
                        {estrellas && <div style={{ fontSize: '0.65rem', margin: '4px 0', letterSpacing: '1px' }}>{estrellas}</div>}
                        {fila.hotelUbicacion && (
                          <a href={fila.hotelUbicacion} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '5px', fontSize: '0.65rem', background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '12px', textDecoration: 'none', fontWeight: 'bold' }}>📍 Ubicación</a>
                        )}
                      </td>
                      
                      <td style={{ padding: '15px 10px', textAlign: 'left', fontWeight: '600', color: '#4b5563', wordWrap: 'break-word', verticalAlign: 'top' }}>
                        {tipoRegimen}
                      </td>
                      
                      <td style={{ padding: '15px 2px', borderLeft: '1px solid #e5e7eb', fontWeight: '900', color: '#ef5a1a' }}>{doble.mayor ? `$${aplicarMarkup(doble.mayor)}` : '-'}</td>
                      <td style={{ padding: '15px 2px', color: '#6b7280' }}>{doble.menor ? `$${aplicarMarkup(doble.menor)}` : '-'}</td>
                      <td style={{ padding: '15px 2px', color: '#6b7280' }}>{doble.child ? `$${aplicarMarkup(doble.child)}` : '-'}</td>
                      
                      <td style={{ padding: '15px 2px', borderLeft: '1px solid #e5e7eb', fontWeight: 'bold', color: '#11173d' }}>{triple.mayor ? `$${aplicarMarkup(triple.mayor)}` : '-'}</td>
                      <td style={{ padding: '15px 2px', color: '#6b7280' }}>{triple.menor ? `$${aplicarMarkup(triple.menor)}` : '-'}</td>
                      <td style={{ padding: '15px 2px', color: '#6b7280' }}>{triple.child ? `$${aplicarMarkup(triple.child)}` : '-'}</td>
                      
                      <td style={{ padding: '15px 2px', borderLeft: '1px solid #e5e7eb', fontWeight: 'bold', color: '#11173d' }}>{cuadruple.mayor ? `$${aplicarMarkup(cuadruple.mayor)}` : '-'}</td>
                      <td style={{ padding: '15px 2px', color: '#6b7280' }}>{cuadruple.menor ? `$${aplicarMarkup(cuadruple.menor)}` : '-'}</td>
                      <td style={{ padding: '15px 2px', color: '#6b7280' }}>{cuadruple.child ? `$${aplicarMarkup(cuadruple.child)}` : '-'}</td>
                      
                      <td style={{ padding: '15px 2px', borderLeft: '1px solid #e5e7eb', fontWeight: 'bold', color: '#11173d' }}>{single.mayor ? `$${aplicarMarkup(single.mayor)}` : '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {paquete.observaciones && (
        <div style={{ marginTop: '40px', padding: '20px', background: '#fff5f0', borderRadius: '12px', borderLeft: '4px solid #ef5a1a' }}>
          <h3 style={{ color: '#ef5a1a', fontSize: '1.1rem', margin: '0 0 10px 0', fontWeight: '900' }}>⚠️ Observaciones Importantes</h3>
          <p style={{ margin: 0, color: '#4b5563', fontSize: '0.95rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{paquete.observaciones}</p>
        </div>
      )}

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
  );
}