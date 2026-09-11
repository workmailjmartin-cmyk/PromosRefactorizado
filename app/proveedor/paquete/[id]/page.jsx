'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Loader from '@/components/shared/Loader';


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

// Función para formatear fecha a DD/MM/AAAA
const formatoArgentino = (fechaString) => {
  if (!fechaString) return '';
  const partes = fechaString.split('-');
  if (partes.length !== 3) return fechaString;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
};

export default function DetallePaqueteMayorista() {
  const params = useParams();
  const [paquete, setPaquete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [lightboxAbierto, setLightboxAbierto] = useState(false);
  const [imagenActivaIndex, setImagenActivaIndex] = useState(0);

  useEffect(() => {
    const cargarPaquete = async () => {
      if (!params?.id) return;
      try {
        const docRef = doc(db, 'enlatados', params.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          setPaquete(data);
          if (data.tarifario && data.tarifario.length > 0) {
            // Ordenar fechas cronológicamente
            const fechasOrdenadas = [...new Set(data.tarifario.map(t => t.fecha))].sort();
            setFechaSeleccionada(fechasOrdenadas[0]);
          }
        }
      } catch (error) {
        console.error("Error al cargar:", error);
      }
      setLoading(false);
    };
    cargarPaquete();
  }, [params.id]);

  if (loading) {
    return <Loader visible={true} text="Cargando viaje..." />;
  }
  
  if (!paquete) return <div style={{ padding: '50px', textAlign: 'center', color: 'red', fontWeight: 'bold' }}>❌ El paquete no existe o fue eliminado.</div>;

  const aplicarMarkup = (valor) => valor ? Math.round(parseFloat(valor) * MARKUP_AGENCIA) : '-';
  const preciosDoble = paquete.tarifario?.map(t => parseFloat(t.doble) || 0).filter(p => p > 0) || [];
  const precioDesde = preciosDoble.length > 0 ? Math.round(Math.min(...preciosDoble) * MARKUP_AGENCIA) : 0;
  
  // Extraemos las fechas únicas que cargó el proveedor
  const fechasUnicasISO = [...new Set(paquete.tarifario?.map(t => t.fecha) || [])].sort();
  const tarifarioFiltrado = paquete.tarifario?.filter(t => t.fecha === fechaSeleccionada) || [];
  
  const abrirLightbox = (index) => { setImagenActivaIndex(index); setLightboxAbierto(true); };
  const cerrarLightbox = () => setLightboxAbierto(false);
  const sigImagen = (e) => { e.stopPropagation(); setImagenActivaIndex((prev) => (prev + 1) % paquete.imagenes.length); };
  const antImagen = (e) => { e.stopPropagation(); setImagenActivaIndex((prev) => (prev === 0 ? paquete.imagenes.length - 1 : prev - 1)); };

  return (
    <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 10px 25px rgba(0,0,0,0.03)', padding: '30px' }}>
      
      {/* 1. SECCIÓN SUPERIOR: 70/30 */}
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

        {/* INFO (30%) */}
        <div style={{ flex: '3 1 280px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'inline-block', background: '#ef5a1a', color: '#fff', padding: '6px 14px', borderRadius: '25px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '20px', alignSelf: 'flex-start', letterSpacing: '0.5px' }}>
            {paquete.transporte === 'aereo' ? '✈️ Aéreo' : '🚌 Bus'} • Salida desde {paquete.origenPrincipal}
          </div>
          
          <h1 style={{ margin: '0 0 15px 0', fontSize: '2.4rem', color: '#11173d', fontWeight: 900, lineHeight: '1.1', letterSpacing: '-0.5px' }}>
            {paquete.destino}
          </h1>
          
          <p style={{ margin: '0 0 15px 0', color: '#11173d', fontSize: '1.1rem', fontWeight: 'bold' }}>
            <span style={{ color: '#ef5a1a', marginRight: '5px' }}>🌙</span>
            {paquete.dias} Días / {paquete.noches} Noches
          </p>
          
          {paquete.paradas_ascenso && paquete.paradas_ascenso.length > 0 && (
            <p style={{ margin: '0 0 20px 0', fontSize: '0.9rem', color: '#6b7280' }}>
              <b style={{color: '#11173d'}}>Paradas de ascenso:</b> {paquete.paradas_ascenso.join(' - ')}
            </p>
          )}

          <div style={{ marginTop: 'auto', background: '#f9fafb', padding: '25px', borderRadius: '16px', textAlign: 'right' }}>
            <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#ef5a1a', display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '8px' }}>
              <span style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 'bold' }}>desde</span>
              {paquete.moneda || 'USD'} ${precioDesde}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 'bold' }}>*Precio por persona en base doble</span>
          </div>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '40px 0' }} />

      {/* 2. SERVICIOS E ITINERARIO */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '50px', marginBottom: '50px' }}>
        
        {/* Servicios */}
        <div style={{ flex: '1 1 300px' }}>
          <h3 style={{ color: '#11173d', fontSize: '1.4rem', fontWeight: 900, marginBottom: '25px' }}>Servicios Incluidos</h3>
          {paquete.servicios && paquete.servicios.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {paquete.servicios.map((s, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '15px', padding: '15px 0', borderLeft: '3px solid #e5e7eb', paddingLeft: '15px' }}>
                  <span style={{ fontSize: '1.5rem', lineHeight: '1', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))' }}>{getServicioIcon(s.tipo)}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <strong style={{ color: '#11173d', textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '0.5px' }}>
                      {s.tipo} {s.in ? ' (IN)' : ''} {s.out ? ' (OUT)' : ''}
                    </strong>
                    <span style={{ color: '#4b5563', fontSize: '0.95rem', marginTop: '2px', fontWeight: '500' }}>{s.detalle1}</span>
                    {s.detalle2 && <span style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '2px' }}>{s.detalle2}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.9rem' }}>No hay servicios detallados.</p>
          )}
        </div>

        {/* Itinerario */}
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

      {/* 3. CALENDARIO ESTILO GOOGLE Y TARIFARIO */}
      <div>
        <h3 style={{ color: '#11173d', fontSize: '1.5rem', fontWeight: 900, marginBottom: '25px' }}>
          Seleccioná tu fecha de Salida
        </h3>
        
        {/* Mini Calendario de Fechas Disponibles */}
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '40px' }}>
          {fechasUnicasISO.length > 0 ? (
            fechasUnicasISO.map((fecha) => {
              const estaSeleccionada = fechaSeleccionada === fecha;
              const dia = fecha.split('-')[2];
              const mesNum = fecha.split('-')[1];
              const mesesCortos = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
              const mesNombre = mesesCortos[parseInt(mesNum, 10) - 1];

              return (
                <div
                  key={fecha}
                  onClick={() => setFechaSeleccionada(fecha)}
                  style={{
                    width: '75px', height: '85px', borderRadius: '12px', cursor: 'pointer',
                    background: estaSeleccionada ? '#11173d' : '#fff',
                    border: estaSeleccionada ? '2px solid #11173d' : '2px solid #e5e7eb',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    boxShadow: estaSeleccionada ? '0 6px 12px rgba(17,23,61,0.15)' : '0 2px 4px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: estaSeleccionada ? 'translateY(-3px)' : 'translateY(0)'
                  }}
                  onMouseOver={e => { if (!estaSeleccionada) e.currentTarget.style.borderColor = '#ef5a1a'; }}
                  onMouseOut={e => { if (!estaSeleccionada) e.currentTarget.style.borderColor = '#e5e7eb'; }}
                >
                  <div style={{ color: estaSeleccionada ? '#fff' : '#ef5a1a', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px' }}>
                    {mesNombre}
                  </div>
                  <div style={{ color: estaSeleccionada ? '#fff' : '#11173d', fontSize: '1.8rem', fontWeight: '900', lineHeight: '1' }}>
                    {dia}
                  </div>
                  {/* Puntito Naranja Inferior */}
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: estaSeleccionada ? '#ef5a1a' : '#d1d5db', marginTop: '6px' }}></div>
                </div>
              );
            })
          ) : (
             <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>No hay fechas cargadas.</p>
          )}
        </div>

        {/* Tabla Minimalista */}
        {tarifarioFiltrado.length > 0 && (
          <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid #e5e7eb', background: '#fff' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
              <thead>
                <tr style={{ background: '#f9fafb', color: '#11173d', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '18px 20px', textAlign: 'left', fontWeight: 800 }}>Hotel y Régimen</th>
                  <th style={{ padding: '18px 20px', textAlign: 'center', fontWeight: 800 }}>Base Doble</th>
                  <th style={{ padding: '18px 20px', textAlign: 'center', fontWeight: 800 }}>Base Triple</th>
                  <th style={{ padding: '18px 20px', textAlign: 'center', fontWeight: 800 }}>Base Cuádruple</th>
                  <th style={{ padding: '18px 20px', textAlign: 'center', fontWeight: 800 }}>Base Single</th>
                </tr>
              </thead>
              <tbody>
                {tarifarioFiltrado.map((fila, idx) => (
                  <tr key={idx} style={{ borderBottom: idx === tarifarioFiltrado.length - 1 ? 'none' : '1px solid #f3f4f6' }}>
                    <td style={{ padding: '18px 20px', fontWeight: 'bold', color: '#4b5563' }}>{fila.hotelRegimen}</td>
                    <td style={{ padding: '18px 20px', textAlign: 'center', fontWeight: '900', color: '#ef5a1a', fontSize: '1.1rem' }}>${aplicarMarkup(fila.doble)}</td>
                    <td style={{ padding: '18px 20px', textAlign: 'center', color: '#6b7280' }}>{fila.triple ? `$${aplicarMarkup(fila.triple)}` : '-'}</td>
                    <td style={{ padding: '18px 20px', textAlign: 'center', color: '#6b7280' }}>{fila.cuadruple ? `$${aplicarMarkup(fila.cuadruple)}` : '-'}</td>
                    <td style={{ padding: '18px 20px', textAlign: 'center', color: '#6b7280' }}>{fila.single ? `$${aplicarMarkup(fila.single)}` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. MODAL GALERÍA */}
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