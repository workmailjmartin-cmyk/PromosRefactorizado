'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const MARKUP_AGENCIA = 1.20; // 20% de recargo

// Función auxiliar para los emojis de servicios
const getServicioIcon = (tipo) => {
  const icons = { aereo: '✈️', hotel: '🏨', traslado: '🚕', excursion: '🌲', seguro: '🛡️' };
  return icons[tipo?.toLowerCase()] || '✅';
};

export default function DetallePaqueteMayorista() {
  const params = useParams();
  const [paquete, setPaquete] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados interactivos
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  
  // Estados de la Galería (Lightbox)
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
          
          // Seleccionar por defecto la primera fecha disponible
          if (data.tarifario && data.tarifario.length > 0) {
            const fechasUnicas = [...new Set(data.tarifario.map(t => t.fecha))];
            setFechaSeleccionada(fechasUnicas[0]);
          }
        }
      } catch (error) {
        console.error("Error al cargar:", error);
      }
      setLoading(false);
    };
    cargarPaquete();
  }, [params.id]);

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold', color: '#11173d' }}>Cargando viaje... ⏳</div>;
  if (!paquete) return <div style={{ padding: '50px', textAlign: 'center', color: 'red', fontWeight: 'bold' }}>❌ El paquete no existe o fue eliminado.</div>;

  // Lógica de Precios y Filtros
  const aplicarMarkup = (valor) => valor ? Math.round(parseFloat(valor) * MARKUP_AGENCIA) : '-';
  
  // Calcular el "Desde" general (precio base doble más bajo de TODO el tarifario)
  const preciosDoble = paquete.tarifario?.map(t => parseFloat(t.doble) || 0).filter(p => p > 0) || [];
  const precioDesde = preciosDoble.length > 0 ? Math.round(Math.min(...preciosDoble) * MARKUP_AGENCIA) : 0;

  // Filtrar la tabla de tarifas por la fecha que toca el usuario
  const fechasUnicas = [...new Set(paquete.tarifario?.map(t => t.fecha) || [])];
  const tarifarioFiltrado = paquete.tarifario?.filter(t => t.fecha === fechaSeleccionada) || [];
  
  // Funciones del Carrusel (Lightbox)
  const abrirLightbox = (index) => { setImagenActivaIndex(index); setLightboxAbierto(true); };
  const cerrarLightbox = () => setLightboxAbierto(false);
  const sigImagen = (e) => { e.stopPropagation(); setImagenActivaIndex((prev) => (prev + 1) % paquete.imagenes.length); };
  const antImagen = (e) => { e.stopPropagation(); setImagenActivaIndex((prev) => (prev === 0 ? paquete.imagenes.length - 1 : prev - 1)); };

  return (
    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #eee', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', padding: '30px' }}>
      
      {/* 1. SECCIÓN SUPERIOR: 2 COLUMNAS (FOTOS + INFO) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', marginBottom: '40px' }}>
        
        {/* COLUMNA IZQUIERDA: GALERÍA */}
        <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {paquete.imagenes && paquete.imagenes.length > 0 ? (
            <>
              {/* Foto Principal */}
              <div 
                onClick={() => abrirLightbox(0)}
                style={{ height: '350px', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #eee' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={paquete.imagenes[0]} alt="Portada" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }} onMouseOver={e=>e.currentTarget.style.transform='scale(1.05)'} onMouseOut={e=>e.currentTarget.style.transform='scale(1)'} />
              </div>
              
              {/* Miniaturas */}
              {paquete.imagenes.length > 1 && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  {paquete.imagenes.slice(1).map((img, idx) => (
                    <div 
                      key={idx + 1} 
                      onClick={() => abrirLightbox(idx + 1)}
                      style={{ flex: 1, height: '90px', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #eee' }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt={`Miniatura ${idx+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} onMouseOver={e=>e.currentTarget.style.opacity='1'} onMouseOut={e=>e.currentTarget.style.opacity='0.8'} />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ height: '350px', background: '#f3f4f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>Sin imágenes</div>
          )}
        </div>

        {/* COLUMNA DERECHA: INFO PRINCIPAL */}
        <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'inline-block', background: '#ef5a1a', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '15px', alignSelf: 'flex-start' }}>
            {paquete.transporte === 'aereo' ? '✈️ Aéreo' : '🚌 Bus'} • Salida desde {paquete.origenPrincipal}
          </div>
          
          <h1 style={{ margin: '0 0 15px 0', fontSize: '2.5rem', color: '#11173d', fontWeight: 900, lineHeight: '1.1' }}>{paquete.destino}</h1>
          
          <p style={{ margin: '0 0 10px 0', color: '#ef5a1a', fontSize: '1.2rem', fontWeight: 'bold' }}>
            🌙 {paquete.dias} Días / {paquete.noches} Noches
          </p>
          
          {paquete.paradas_ascenso && paquete.paradas_ascenso.length > 0 && (
            <p style={{ margin: '0 0 20px 0', fontSize: '0.95rem', color: '#6b7280' }}>
              <b style={{color: '#11173d'}}>Paradas de ascenso:</b> {paquete.paradas_ascenso.join(' - ')}
            </p>
          )}

          {/* Bloque Precio */}
          <div style={{ marginTop: 'auto', background: '#f9fafb', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', textAlign: 'right' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#ef5a1a', display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '8px' }}>
              <span style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 'normal' }}>desde</span>
              {paquete.moneda || 'USD'} ${precioDesde}
            </div>
            <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>*Precio por persona en base doble</span>
          </div>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '2px solid #f3f4f6', margin: '40px 0' }} />

      {/* 2. SERVICIOS E ITINERARIO (2 COLUMNAS) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', marginBottom: '40px' }}>
        
        {/* Servicios (Lista con Emojis) */}
        <div style={{ flex: '1 1 300px' }}>
          <h3 style={{ color: '#11173d', borderBottom: '2px solid #ef5a1a', paddingBottom: '5px', display: 'inline-block', marginBottom: '20px', fontSize: '1.3rem' }}>
            Servicios Incluidos
          </h3>
          {paquete.servicios && paquete.servicios.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {paquete.servicios.map((s, idx) => (
                <li key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', background: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #eee' }}>
                  <span style={{ fontSize: '1.5rem', lineHeight: '1' }}>{getServicioIcon(s.tipo)}</span>
                  <div>
                    <strong style={{ color: '#11173d', textTransform: 'uppercase', fontSize: '0.85rem', display: 'block' }}>
                      {s.tipo} {s.in ? ' (IN)' : ''} {s.out ? ' (OUT)' : ''}
                    </strong>
                    <span style={{ color: '#4b5563', fontSize: '0.95rem' }}>{s.detalle1}</span>
                    {s.detalle2 && <span style={{ color: '#6b7280', fontSize: '0.85rem', display: 'block', marginTop: '4px' }}>{s.detalle2}</span>}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No hay servicios detallados.</p>
          )}
        </div>

        {/* Itinerario */}
        <div style={{ flex: '1 1 300px' }}>
          <h3 style={{ color: '#11173d', borderBottom: '2px solid #ef5a1a', paddingBottom: '5px', display: 'inline-block', marginBottom: '20px', fontSize: '1.3rem' }}>
            Itinerario Resumido
          </h3>
          {paquete.itinerario && paquete.itinerario.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {paquete.itinerario.map((dia, idx) => (
                <div key={idx} style={{ paddingLeft: '20px', borderLeft: '4px solid #ef5a1a', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '-10px', top: '2px', width: '16px', height: '16px', background: '#ef5a1a', borderRadius: '50%', border: '4px solid #fff' }}></div>
                  <h4 style={{ margin: '0 0 5px 0', color: '#11173d', fontSize: '1.1rem' }}>Día {dia.dia}: {dia.titulo}</h4>
                  <p style={{ margin: 0, color: '#4b5563', fontSize: '0.95rem', lineHeight: '1.5' }}>{dia.descripcion}</p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#6b7280', fontStyle: 'italic' }}>El proveedor no cargó itinerario.</p>
          )}
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '2px solid #f3f4f6', margin: '40px 0' }} />

      {/* 3. CALENDARIO Y TARIFARIO */}
      <div>
        <h3 style={{ color: '#11173d', fontSize: '1.5rem', marginBottom: '15px' }}>Fechas de Salida y Tarifas ({paquete.moneda || 'USD'}</h3>
        
        {/* Filtro de Fechas (Botones) */}
        {fechasUnicas.length > 0 ? (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '25px' }}>
            {fechasUnicas.map((fecha) => (
              <button
                key={fecha}
                onClick={() => setFechaSeleccionada(fecha)}
                style={{
                  padding: '10px 20px', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', border: 'none',
                  background: fechaSeleccionada === fecha ? '#11173d' : '#f3f4f6',
                  color: fechaSeleccionada === fecha ? '#fff' : '#4b5563',
                  boxShadow: fechaSeleccionada === fecha ? '0 4px 6px rgba(17,23,61,0.2)' : 'none'
                }}
              >
                📅 {fecha}
              </button>
            ))}
          </div>
        ) : (
          <p style={{ color: '#6b7280' }}>No hay fechas cargadas.</p>
        )}

        {/* Tabla Filtrada */}
        {tarifarioFiltrado.length > 0 && (
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #eee' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
              <thead>
                <tr style={{ background: '#f9fafb', color: '#11173d', borderBottom: '2px solid #eee' }}>
                  <th style={{ padding: '15px', textAlign: 'left' }}>Hotel y Régimen</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>Base Doble</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>Base Triple</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>Base Cuádruple</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>Base Single</th>
                </tr>
              </thead>
              <tbody>
                {tarifarioFiltrado.map((fila, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #eee', background: '#fff' }}>
                    <td style={{ padding: '15px', fontWeight: 'bold', color: '#4b5563' }}>{fila.hotelRegimen}</td>
                    <td style={{ padding: '15px', textAlign: 'center', fontWeight: '900', color: '#ef5a1a' }}>${aplicarMarkup(fila.doble)}</td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>{fila.triple ? `$${aplicarMarkup(fila.triple)}` : '-'}</td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>{fila.cuadruple ? `$${aplicarMarkup(fila.cuadruple)}` : '-'}</td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>{fila.single ? `$${aplicarMarkup(fila.single)}` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. MODAL GALERÍA (LIGHTBOX) */}
      {lightboxAbierto && paquete.imagenes && (
        <div 
          onClick={cerrarLightbox}
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {/* Botón Cerrar */}
          <button onClick={cerrarLightbox} style={{ position: 'absolute', top: '20px', right: '30px', background: 'none', border: 'none', color: '#fff', fontSize: '2rem', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
          
          {/* Flecha Izquierda */}
          <button onClick={antImagen} style={{ position: 'absolute', left: '20px', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontSize: '2rem', width: '50px', height: '50px', borderRadius: '50%', cursor: 'pointer' }}>‹</button>
          
          {/* Imagen Activa */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={paquete.imagenes[imagenActivaIndex]} alt="Zoom" style={{ maxWidth: '90%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px' }} />
          
          {/* Flecha Derecha */}
          <button onClick={sigImagen} style={{ position: 'absolute', right: '20px', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontSize: '2rem', width: '50px', height: '50px', borderRadius: '50%', cursor: 'pointer' }}>›</button>
        </div>
      )}

    </div>
  );
}