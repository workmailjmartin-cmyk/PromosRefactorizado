'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const MARKUP_AGENCIA = 1.20; // 20% de recargo para ocultar el neto real a la competencia

export default function DetallePaqueteMayorista() {
  const params = useParams();
  const [paquete, setPaquete] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarPaquete = async () => {
      if (!params?.id) return;
      try {
        const docRef = doc(db, 'enlatados', params.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPaquete({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error al cargar el paquete:", error);
      }
      setLoading(false);
    };
    cargarPaquete();
  }, [params.id]);

  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold', color: '#11173d' }}>Cargando detalles del viaje... ⏳</div>;
  }

  if (!paquete) {
    return <div style={{ padding: '50px', textAlign: 'center', color: 'red', fontWeight: 'bold' }}>❌ El paquete no existe o fue eliminado.</div>;
  }

  // Aplicamos el markup al vuelo para la tabla
  const aplicarMarkup = (valor) => valor ? Math.round(parseFloat(valor) * MARKUP_AGENCIA) : '-';

  return (
    <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #eee', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', padding: '30px' }}>
      
      {/* 1. CABECERA */}
      <div style={{ borderBottom: '2px solid #f3f4f6', paddingBottom: '20px', marginBottom: '30px' }}>
        <div style={{ display: 'inline-block', background: '#ef5a1a', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px' }}>
          {paquete.transporte === 'aereo' ? '✈️ Aéreo' : '🚌 Bus'} • Salida desde {paquete.origenPrincipal}
        </div>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '2.5rem', color: '#11173d', fontWeight: 900 }}>{paquete.destino}</h1>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '1.1rem', fontWeight: 'bold' }}>
          🌙 {paquete.dias} Días / {paquete.noches} Noches
        </p>
        {paquete.paradas_ascenso && paquete.paradas_ascenso.length > 0 && (
          <p style={{ margin: '10px 0 0 0', fontSize: '0.9rem', color: '#4b5563' }}>
            <b>Paradas de ascenso:</b> {paquete.paradas_ascenso.join(' - ')}
          </p>
        )}
      </div>

      {/* 2. GALERÍA DE IMÁGENES */}
      {paquete.imagenes && paquete.imagenes.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: paquete.imagenes.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '40px' }}>
          {paquete.imagenes.map((img, idx) => (
            <div key={idx} style={{ height: '250px', borderRadius: '8px', overflow: 'hidden' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={`Foto ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      )}

      {/* 3. TARIFARIO MATRICIAL */}
      <h3 style={{ color: '#11173d', borderBottom: '2px solid #ef5a1a', paddingBottom: '5px', display: 'inline-block', marginBottom: '20px' }}>
        Tarifas de Referencia (USD)
      </h3>
      {paquete.tarifario && paquete.tarifario.length > 0 ? (
        <div style={{ overflowX: 'auto', marginBottom: '40px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
            <thead>
              <tr style={{ background: '#11173d', color: '#fff' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderRadius: '8px 0 0 0' }}>Fecha Salida</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Hotel y Régimen</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Base Doble</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Base Triple</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Base Cuádruple</th>
                <th style={{ padding: '12px', textAlign: 'center', borderRadius: '0 8px 0 0' }}>Base Single</th>
              </tr>
            </thead>
            <tbody>
              {paquete.tarifario.map((fila, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee', background: idx % 2 === 0 ? '#f9fafb' : '#fff' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#ef5a1a' }}>{fila.fecha}</td>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#4b5563' }}>{fila.hotelRegimen}</td>
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>${aplicarMarkup(fila.doble)}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>{fila.triple ? `$${aplicarMarkup(fila.triple)}` : '-'}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>{fila.cuadruple ? `$${aplicarMarkup(fila.cuadruple)}` : '-'}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>{fila.single ? `$${aplicarMarkup(fila.single)}` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p style={{ color: '#6b7280', fontStyle: 'italic', marginBottom: '40px' }}>No hay tarifas cargadas.</p>
      )}

      {/* 4. SERVICIOS INCLUIDOS */}
      <h3 style={{ color: '#11173d', borderBottom: '2px solid #ef5a1a', paddingBottom: '5px', display: 'inline-block', marginBottom: '20px' }}>
        Servicios Incluidos
      </h3>
      {paquete.servicios && paquete.servicios.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px', marginBottom: '40px' }}>
          {paquete.servicios.map((s, idx) => (
            <div key={idx} style={{ padding: '15px', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb', display: 'flex', flexDirection: 'column' }}>
              <strong style={{ color: '#11173d', textTransform: 'uppercase', fontSize: '0.85rem', marginBottom: '5px' }}>
                {s.tipo}
              </strong>
              <span style={{ color: '#4b5563', fontSize: '0.95rem' }}>{s.detalle1}</span>
              {s.detalle2 && <span style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '4px' }}>{s.detalle2}</span>}
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: '#6b7280', fontStyle: 'italic', marginBottom: '40px' }}>No hay servicios detallados.</p>
      )}

      {/* 5. ITINERARIO */}
      <h3 style={{ color: '#11173d', borderBottom: '2px solid #ef5a1a', paddingBottom: '5px', display: 'inline-block', marginBottom: '20px' }}>
        Itinerario Resumido
      </h3>
      {paquete.itinerario && paquete.itinerario.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {paquete.itinerario.map((dia, idx) => (
            <div key={idx} style={{ paddingLeft: '20px', borderLeft: '4px solid #ef5a1a' }}>
              <h4 style={{ margin: '0 0 5px 0', color: '#11173d' }}>Día {dia.dia}: {dia.titulo}</h4>
              <p style={{ margin: 0, color: '#4b5563', fontSize: '0.95rem', lineHeight: '1.5' }}>{dia.descripcion}</p>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: '#6b7280', fontStyle: 'italic' }}>El proveedor no cargó itinerario diario.</p>
      )}

    </div>
  );
}