'use client';
import { useState, useEffect } from 'react';
import HeaderB2C from '@/components/clientes/HeaderB2C';
import FooterB2C from '@/components/clientes/FooterB2C';
import WhatsAppFloatButton from '@/components/shared/WhatsAppFloatButton';
import Loader from '@/components/shared/Loader';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { WPP_NUMBER } from '@/lib/constants';

const MARKUP_AGENCIA = 1.20; 

const normalizarTexto = (texto) => {
  if (!texto) return '';
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

export default function ListadoEnlatadosCliente() {
  const [paquetesOriginales, setPaquetesOriginales] = useState([]);
  const [paquetesFiltrados, setPaquetesFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- ESTADOS DE LOS FILTROS ---
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroTransporte, setFiltroTransporte] = useState('');
  const [filtroSalida, setFiltroSalida] = useState('');
  const [filtroMoneda, setFiltroMoneda] = useState('');
  const [filtroOrden, setFiltroOrden] = useState('recientes');

  // Listas dinámicas para poblar los <select>
  const [opcionesSalidas, setOpcionesSalidas] = useState([]);

  const obtenerPrecioFinal = (tarifario) => {
    if (!tarifario || tarifario.length === 0) return 0;
    const precios = tarifario.map(t => {
      if (typeof t.doble === 'object') return parseFloat(t.doble.mayor) || 0;
      return parseFloat(t.doble) || 0;
    }).filter(p => p > 0);
    if (precios.length === 0) return 0;
    return Math.round(Math.min(...precios) * MARKUP_AGENCIA);
  };

  const cargarPaquetes = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'enlatados'));
      const data = querySnapshot.docs.map(doc => {
        const pkgData = doc.data();
        return { 
          id: doc.id, 
          ...pkgData,
          precioFinalCalculado: obtenerPrecioFinal(pkgData.tarifario)
        };
      }).filter(p => p.estado !== 'inactivo'); // Filtro de seguridad
      
      data.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setPaquetesOriginales(data);
      setPaquetesFiltrados(data);

      const salidasSet = new Set();
      data.forEach(p => {
        if (p.origenPrincipal) salidasSet.add(p.origenPrincipal.trim());
        if (p.paradas_ascenso && Array.isArray(p.paradas_ascenso)) {
          p.paradas_ascenso.forEach(parada => salidasSet.add(parada.trim()));
        }
      });
      setOpcionesSalidas(Array.from(salidasSet).sort());

    } catch (error) { console.error("Error al cargar:", error); }
    setLoading(false);
  };

  useEffect(() => { cargarPaquetes(); }, []);

  // --- LÓGICA DEL BUSCADOR ---
  useEffect(() => {
    let result = [...paquetesOriginales];

    if (filtroTexto.trim() !== '') {
      const termino = normalizarTexto(filtroTexto);
      result = result.filter(p => normalizarTexto(p.destino).includes(termino));
    }
    if (filtroTransporte !== '') {
      result = result.filter(p => p.transporte && p.transporte.includes(filtroTransporte));
    }
    if (filtroSalida !== '') {
      result = result.filter(p => {
        const principalMatch = p.origenPrincipal && p.origenPrincipal.includes(filtroSalida);
        const paradasMatch = p.paradas_ascenso && p.paradas_ascenso.includes(filtroSalida);
        return principalMatch || paradasMatch;
      });
    }
    if (filtroMoneda !== '') {
      result = result.filter(p => (p.moneda || 'USD') === filtroMoneda);
    }
    if (filtroOrden === 'recientes') {
      result.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    } else if (filtroOrden === 'menor') {
      result.sort((a, b) => a.precioFinalCalculado - b.precioFinalCalculado);
    } else if (filtroOrden === 'mayor') {
      result.sort((a, b) => b.precioFinalCalculado - a.precioFinalCalculado);
    }
    setPaquetesFiltrados(result);
  }, [filtroTexto, filtroTransporte, filtroSalida, filtroMoneda, filtroOrden, paquetesOriginales]);

  const formatearPrecio = (valor) => { if (!valor) return '-'; return Number(valor).toLocaleString('es-AR'); };

  return (
    <div id="app-container" style={{ display: 'block' }}>
      <HeaderB2C />
      
      {loading ? <Loader visible={true} text="Buscando ofertas..." /> : (
        <div className="container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
          
          {/* BANNER EXPLICATIVO */}
          <div style={{ background: '#e0f2fe', border: '1px solid #7dd3fc', borderRadius: '12px', padding: '20px', marginBottom: '30px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h2 style={{ margin: '0 0 10px 0', color: '#0284c7', fontSize: '1.4rem', fontWeight: '900' }}>Paquetes Pre-Comprados con Financiación Exclusiva</h2>
            <p style={{ margin: 0, color: '#0369a1', fontSize: '1rem', lineHeight: '1.5' }}>
              Estas son ofertas de cupo limitado que te permiten financiar tu viaje en cómodas cuotas. 
              <br /><b>¿Buscás la tarifa más económica posible?</b> <a href={`https://wa.me/${WPP_NUMBER}`} target="_blank" rel="noopener noreferrer" style={{ color: '#ef5a1a', textDecoration: 'underline', fontWeight: 'bold' }}>Contactá a un asesor</a> para cotizar un paquete a medida.
            </p>
          </div>

          {/* BARRA DE FILTROS */}
          <div style={{ background: '#fff', padding: '15px 25px', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'flex-end', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', marginBottom: '40px' }}>
            <div style={{ flex: '2 1 180px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#11173d', marginBottom: '8px' }}>Destino</label>
              <input type="text" placeholder="Ej: Rio de Janeiro..." value={filtroTexto} onChange={(e) => setFiltroTexto(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', fontSize: '0.9rem' }} />
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#11173d', marginBottom: '8px' }}>Salida desde</label>
              <select value={filtroSalida} onChange={(e) => setFiltroSalida(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', fontSize: '0.9rem', background: '#fff' }}>
                <option value="">Todas las Salidas</option>
                {opcionesSalidas.map(sal => <option key={sal} value={sal}>{sal}</option>)}
              </select>
            </div>
            <div style={{ flex: '1 1 130px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#11173d', marginBottom: '8px' }}>Tipo</label>
              <select value={filtroTransporte} onChange={(e) => setFiltroTransporte(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', fontSize: '0.9rem', background: '#fff' }}>
                <option value="">Todos</option>
                <option value="bus">Paquete Bus</option>
                <option value="aereo">Paquete Aéreo</option>
                <option value="charter">🛩️ Grupal Acompañado</option>
              </select>
            </div>
            <div style={{ flex: '1 1 130px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#11173d', marginBottom: '8px' }}>Orden</label>
              <select value={filtroOrden} onChange={(e) => setFiltroOrden(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', fontSize: '0.9rem', background: '#fff' }}>
                <option value="recientes">Recientes</option>
                <option value="menor">Menor Precio</option>
                <option value="mayor">Mayor Precio</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px', flex: '0 0 auto' }}>
              <button onClick={() => { setFiltroTexto(''); setFiltroTransporte(''); setFiltroSalida(''); setFiltroMoneda(''); setFiltroOrden('recientes'); }} style={{ background: '#f3f4f6', color: '#4b5563', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}>Limpiar</button>
            </div>
          </div>

          {/* GRILLA DE TARJETAS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px', marginBottom: '60px' }}>
            {paquetesFiltrados.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', background: '#f9fafb', borderRadius: '12px', color: '#6b7280' }}>
                <h3>No se encontraron viajes</h3>
                <p>Probá borrando algún filtro para ver más resultados.</p>
              </div>
            ) : (
              paquetesFiltrados.map((pkg) => {
                const imagenPortada = pkg.imagenes && pkg.imagenes.length > 0 ? pkg.imagenes[0] : '/placeholder.jpg'; 
                return (
                  <div key={pkg.id} style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #eee', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', cursor: 'pointer' }} onMouseOver={e=>e.currentTarget.style.transform='translateY(-5px)'} onMouseOut={e=>e.currentTarget.style.transform='translateY(0)'}>
                    <div style={{ height: '200px', position: 'relative', background: '#f3f4f6' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imagenPortada} alt={pkg.destino} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,255,255,0.9)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85em', fontWeight: 'bold', color: '#11173d' }}>
                        🌙 {pkg.noches} Noches
                      </div>
                    </div>
                    <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: '0.8em', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '8px' }}>
                        {pkg.transporte.includes('aereo') ? '✈️ Aéreo' : '🚌 Bus'} • Desde {pkg.transporte.includes('aereo') ? pkg.origenProvincia || pkg.origenPrincipal : pkg.origenPrincipal}
                      </div>
                      <h3 style={{ margin: '0 0 15px 0', fontSize: '1.4rem', color: '#11173d', lineHeight: '1.2' }}>{pkg.destino}</h3>
                      <div style={{ marginTop: 'auto', textAlign: 'left', borderTop: '1px solid #f3f4f6', paddingTop: '15px' }}>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 'bold', marginBottom: '2px' }}>Precio por persona</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ef5a1a', display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                          <span style={{ fontSize: '0.9rem', color: '#11173d' }}>{pkg.moneda || 'USD'}</span> ${formatearPrecio(pkg.precioFinalCalculado)}
                        </div>
                      </div>
                    </div>
                    <div style={{ background: '#f9fafb', padding: '15px 20px', borderTop: '1px solid #eee', display: 'flex' }}>
                      <a href={`/clientes/paquete/${pkg.id}`} style={{ flex: 1, textAlign: 'center', background: '#11173d', color: '#fff', textDecoration: 'none', padding: '14px', borderRadius: '10px', fontSize: '1rem', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'background 0.2s' }} onMouseOver={e=>e.currentTarget.style.background='#ef5a1a'} onMouseOut={e=>e.currentTarget.style.background='#11173d'}>
                        Ver Fechas y Tarifas
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      <FooterB2C />
      <WhatsAppFloatButton phoneNumber={WPP_NUMBER} />
    </div>
  );
}