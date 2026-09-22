'use client';
import { useState, useEffect } from 'react';
import FormularioEnlatado from '@/components/proveedores/FormularioEnlatado';
import { collection, getDocs, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore'; 
import { db } from '@/lib/firebase';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { useAlert } from '@/contexts/AlertContext'; 
import Loader from '@/components/shared/Loader';

const normalizarTexto = (texto) => {
  if (!texto) return '';
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

export default function InternalEnlatadosDashboard() {
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
  const [paqueteAEditar, setPaqueteAEditar] = useState(null); 
  
  const { currentUser, userData } = useStaffAuth();
  const { showAlert } = useAlert(); 
  
  const [paquetesOriginales, setPaquetesOriginales] = useState([]);
  const [paquetesFiltrados, setPaquetesFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- NUEVO: ESTADO PARA GUARDAR LA CONFIGURACIÓN ---
  const [configPrecios, setConfigPrecios] = useState({ marca: 0, comision: 15 });

  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroTransporte, setFiltroTransporte] = useState('');
  const [filtroSalida, setFiltroSalida] = useState('');
  const [filtroProveedor, setFiltroProveedor] = useState('');
  const [filtroMoneda, setFiltroMoneda] = useState('');
  const [filtroOrden, setFiltroOrden] = useState('recientes');

  const [opcionesSalidas, setOpcionesSalidas] = useState([]);
  const [opcionesProveedores, setOpcionesProveedores] = useState([]);

  const esGestor = userData?.rol === 'admin' || userData?.rol === 'editor';

  // --- NUEVO: FUNCIONES DE CÁLCULO DINÁMICO ---
  const calcularNetoInterno = (costoRaw, config) => {
    const costo = parseFloat(costoRaw) || 0;
    return Math.round(costo * (1 + (config.marca / 100)));
  };

  const calcularPrecioVenta = (costoRaw, config) => {
    const netoInterno = calcularNetoInterno(costoRaw, config);
    return Math.round(netoInterno * (1 + (config.comision / 100)));
  };

  const obtenerPrecioFinal = (tarifario, configActual) => {
    if (!tarifario || tarifario.length === 0) return 0;
    const precios = tarifario.map(t => {
      if (typeof t.doble === 'object') return parseFloat(t.doble.mayor) || 0;
      return parseFloat(t.doble) || 0;
    }).filter(p => p > 0);
    if (precios.length === 0) return 0;
    
    // USAMOS EL NUEVO CÁLCULO EN LUGAR DE MARKUP_AGENCIA
    const costoBase = Math.min(...precios);
    return calcularPrecioVenta(costoBase, configActual); 
  };

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // 1. CARGAMOS LA CONFIGURACIÓN PRIMERO
      let configActual = { marca: 0, comision: 15 };
      try {
        const configDoc = await getDoc(doc(db, 'configuracion', 'grupales')); 
        if (configDoc.exists()) {
          const data = configDoc.data();
          // Manejo seguro de números: si existe la propiedad, usa el número aunque sea 0.
          configActual = {
            marca: data.marcaGlobal !== undefined ? parseFloat(data.marcaGlobal) : 0, 
            comision: data.comisionGlobal !== undefined ? parseFloat(data.comisionGlobal) : 15 
          };
          setConfigPrecios(configActual);
        }
      } catch(e) { console.error("Error cargando config de precios:", e); }

      // 2. LUEGO CARGAMOS LOS PAQUETES
      const querySnapshot = await getDocs(collection(db, 'enlatados'));
      const data = querySnapshot.docs.map(docSnap => {
        const pkgData = docSnap.data();
        return { 
          id: docSnap.id, 
          ...pkgData,
          // Pasamos la configuración para que calcule correctamente
          precioFinalCalculado: obtenerPrecioFinal(pkgData.tarifario, configActual) 
        };
      });
      data.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      
      setPaquetesOriginales(data);
      setPaquetesFiltrados(data);

      const salidasSet = new Set();
      const provSet = new Set();
      
      data.forEach(p => {
        if (p.origenPrincipal) salidasSet.add(p.origenPrincipal.trim());
        if (p.paradas_ascenso && Array.isArray(p.paradas_ascenso)) {
          p.paradas_ascenso.forEach(parada => salidasSet.add(parada.trim()));
        }
        if (p.proveedor_nombre) provSet.add(p.proveedor_nombre.trim());
      });

      setOpcionesSalidas(Array.from(salidasSet).sort());
      setOpcionesProveedores(Array.from(provSet).sort());

    } catch (error) { console.error("Error al cargar:", error); }
    setLoading(false);
  };

  // LLamamos a cargarDatos que ahora trae config y paquetes juntos
  useEffect(() => { cargarDatos(); }, []);

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
    if (filtroProveedor !== '') {
      result = result.filter(p => p.proveedor_nombre === filtroProveedor);
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
  }, [filtroTexto, filtroTransporte, filtroSalida, filtroProveedor, filtroMoneda, filtroOrden, paquetesOriginales]);

  const guardarEnFirebase = async (datos) => {
    if (!currentUser || !userData) {
      if(showAlert) showAlert('Error de sesión. Volvé a ingresar.', 'error');
      else alert('Error de sesión. Volvé a ingresar.');
      return;
    }
    const esEdicion = !!datos.id;
    try {
      if (esEdicion) {
        const docRef = doc(db, 'enlatados', datos.id);
        await updateDoc(docRef, { ...datos, fecha_actualizacion: new Date().toLocaleDateString('es-AR') });
        if(showAlert) showAlert('¡Paquete actualizado!', 'success');
      } else {
        const paqueteNuevo = { ...datos, proveedor_email: currentUser.email, proveedor_nombre: userData.franquicia || currentUser.email, timestamp: Date.now(), fecha_creacion: new Date().toLocaleDateString('es-AR'), estado: 'activo' };
        await addDoc(collection(db, 'enlatados'), paqueteNuevo);
        if(showAlert) showAlert('¡Nuevo paquete publicado!', 'success');
      }
      setMostrandoFormulario(false);
      setPaqueteAEditar(null);
      cargarDatos(); 
    } catch (error) { if(showAlert) showAlert('Hubo un error al guardar.', 'error'); }
  };

  const cancelarEdicion = () => { setPaqueteAEditar(null); setMostrandoFormulario(false); };
  const formatearPrecio = (valor) => { if (!valor) return '-'; return Number(valor).toLocaleString('es-AR'); };

  if (loading) return <Loader visible={true} text="Cargando base central..." />;

  return (
    <div style={{ padding: '20px' }}>
      {!mostrandoFormulario && (
        <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '2px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
            
            <h1 style={{ color: '#11173d', margin: 0, fontSize: '2.2rem', fontWeight: 800 }}>
              Gestión Central de Paquetes
            </h1>
            
            {esGestor && (
              <button 
                onClick={() => { setPaqueteAEditar(null); setMostrandoFormulario(true); }} 
                className="btn btn-primario" 
                style={{ padding: '8px 16px', fontSize: '0.9rem', borderRadius: '8px', fontWeight: 'bold' }}
              >
                ➕ Cargar Viaje
              </button>
            )}
          </div>

          <div style={{ background: '#fff', padding: '15px 25px', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'flex-end', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', marginBottom: '30px' }}>
            
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

            <div style={{ flex: '1 1 160px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#11173d', marginBottom: '8px' }}>Proveedor</label>
              <select value={filtroProveedor} onChange={(e) => setFiltroProveedor(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', fontSize: '0.9rem', background: '#fff' }}>
                <option value="">Todos los Prov.</option>
                {opcionesProveedores.map(prov => <option key={prov} value={prov}>{prov}</option>)}
              </select>
            </div>

            <div style={{ flex: '1 1 130px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#11173d', marginBottom: '8px' }}>Transporte</label>
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
              <button 
                onClick={() => {}} 
                style={{ background: '#ef5a1a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                Buscar
              </button>
              <button 
                onClick={() => { setFiltroTexto(''); setFiltroTransporte(''); setFiltroSalida(''); setFiltroProveedor(''); setFiltroMoneda(''); setFiltroOrden('recientes'); }} 
                style={{ background: '#f3f4f6', color: '#4b5563', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                Limpiar
              </button>
            </div>

          </div>
        </div>
      )}

      {mostrandoFormulario && esGestor ? (
        <FormularioEnlatado paqueteAEditar={paqueteAEditar} onCancel={cancelarEdicion} onSave={guardarEnFirebase} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {paquetesFiltrados.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', background: '#f9fafb', borderRadius: '12px', color: '#6b7280' }}>
              <h3>No se encontraron viajes</h3>
              <p>Probá borrando algún filtro para ver más resultados.</p>
              <button onClick={() => {setFiltroTexto(''); setFiltroTransporte(''); setFiltroSalida(''); setFiltroProveedor(''); setFiltroMoneda('');}} style={{ background: '#11173d', color: '#fff', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', marginTop: '10px' }}>Limpiar Filtros</button>
            </div>
          ) : (
            paquetesFiltrados.map((pkg) => {
              const imagenPortada = pkg.imagenes && pkg.imagenes.length > 0 ? pkg.imagenes[0] : '/placeholder.jpg'; 
              return (
                <div key={pkg.id} style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #eee', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                  
                  <div style={{ height: '180px', position: 'relative', background: '#f3f4f6' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagenPortada} alt={pkg.destino} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,255,255,0.9)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8em', fontWeight: 'bold', color: '#11173d' }}>
                      🌙 {pkg.noches} Noches
                    </div>
                  </div>

                  <div style={{ padding: '20px 20px 12px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '0.8em', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '5px' }}>
                      {pkg.transporte.includes('aereo') ? '✈️ Aéreo' : '🚌 Bus'} • Desde {pkg.transporte.includes('aereo') ? pkg.origenProvincia || pkg.origenPrincipal : pkg.origenPrincipal}
                    </div>
                    
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '1.3rem', color: '#11173d', lineHeight: '1.2' }}>{pkg.destino}</h3>
                    
                    <div style={{ marginTop: 'auto', textAlign: 'right' }}>
                      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ef5a1a', display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '5px' }}>
                        <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 'normal' }}>desde</span>
                        {pkg.moneda || 'USD'} ${formatearPrecio(pkg.precioFinalCalculado)}
                      </div>
                    </div>
                  </div>

                  <div style={{ background: '#f9fafb', padding: '15px 20px', borderTop: '1px solid #eee', display: 'flex' }}>
                    <a 
                      href={`/internal/enlatados/${pkg.id}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ flex: 1, textAlign: 'center', background: '#11173d', color: '#fff', textDecoration: 'none', padding: '12px', borderRadius: '10px', fontSize: '0.9em', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                    >
                       Ver Paquete
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}