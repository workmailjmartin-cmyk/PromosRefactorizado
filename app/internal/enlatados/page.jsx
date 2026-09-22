'use client';
import { useState, useEffect } from 'react';
import FormularioEnlatado from '@/components/proveedores/FormularioEnlatado';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore'; 
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
  const [configPrecios, setConfigPrecios] = useState({ marca: 0, comision: 15 });

  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroTransporte, setFiltroTransporte] = useState('');
  const [filtroSalida, setFiltroSalida] = useState('');
  const [filtroProveedor, setFiltroProveedor] = useState('');
  const [filtroMoneda, setFiltroMoneda] = useState('');
  const [filtroOrden, setFiltroOrden] = useState('recientes');

  const [opcionesSalidas, setOpcionesSalidas] = useState([]);
  const [opcionesProveedores, setOpcionesProveedores] = useState([]);

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, mensaje: '', accion: null });
  const openConfirm = (mensaje, accion) => setConfirmDialog({ isOpen: true, mensaje, accion });
  const closeConfirm = () => setConfirmDialog({ isOpen: false, mensaje: '', accion: null });

  const esGestor = userData?.rol === 'admin' || userData?.rol === 'editor';

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
    
    const costoBase = Math.min(...precios);
    return calcularPrecioVenta(costoBase, configActual); 
  };

  const cargarDatos = async () => {
    setLoading(true);
    try {
      let configActual = { marca: 0, comision: 15 };
      try {
        const configDoc = await getDoc(doc(db, 'configuracion', 'grupales')); 
        if (configDoc.exists()) {
          const data = configDoc.data();
          configActual = {
            marca: data.marcaGlobal !== undefined ? parseFloat(data.marcaGlobal) : 0, 
            comision: data.comisionGlobal !== undefined ? parseFloat(data.comisionGlobal) : 15 
          };
          setConfigPrecios(configActual);
        }
      } catch(e) {}

      const querySnapshot = await getDocs(collection(db, 'enlatados'));
      const data = querySnapshot.docs.map(docSnap => {
        const pkgData = docSnap.data();
        return { 
          id: docSnap.id, 
          ...pkgData,
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

    } catch (error) {}
    setLoading(false);
  };

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
      return;
    }
    const esEdicion = !!datos.id;
    try {
      const nombreProveedorFinal = datos.proveedor_nombre || userData.franquicia || currentUser.email;

      if (esEdicion) {
        const docRef = doc(db, 'enlatados', datos.id);
        await updateDoc(docRef, { ...datos, proveedor_nombre: nombreProveedorFinal, fecha_actualizacion: new Date().toLocaleDateString('es-AR') });
        if(showAlert) showAlert('¡Paquete actualizado!', 'success');
      } else {
        const paqueteNuevo = { 
          ...datos, 
          proveedor_email: currentUser.email, 
          proveedor_nombre: nombreProveedorFinal, 
          timestamp: Date.now(), 
          fecha_creacion: new Date().toLocaleDateString('es-AR'), 
          estado: 'activo' 
        };
        await addDoc(collection(db, 'enlatados'), paqueteNuevo);
        if(showAlert) showAlert('¡Nuevo paquete publicado!', 'success');
      }
      setMostrandoFormulario(false);
      setPaqueteAEditar(null);
      cargarDatos(); 
    } catch (error) { if(showAlert) showAlert('Hubo un error al guardar.', 'error'); }
  };

  const eliminarPaquete = async (id) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'enlatados', id));
      if(showAlert) showAlert('Paquete eliminado correctamente.', 'success');
      setMostrandoFormulario(false);
      setPaqueteAEditar(null);
      cargarDatos();
    } catch (error) {
      if(showAlert) showAlert('Error al eliminar el paquete.', 'error');
    }
    setLoading(false);
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
                <option value="charter">✈️ Grupal Acompañado</option>
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
                onClick={() => { setFiltroTexto(''); setFiltroTransporte(''); setFiltroSalida(''); setFiltroProveedor(''); setFiltroMoneda(''); setFiltroOrden('recientes'); }} 
                style={{ background: '#f3f4f6', color: '#4b5563', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                Limpiar
              </button>
            </div>

          </div>
        </div>
      )}

      {mostrandoFormulario ? (
        <FormularioEnlatado 
          paqueteAEditar={paqueteAEditar} 
          onCancel={cancelarEdicion} 
          onSave={guardarEnFirebase} 
          onDelete={(id) => eliminarPaquete(id)}
          esGestor={esGestor}
          userEmail={currentUser?.email}
        />
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
              const puedeEditar = esGestor || currentUser?.email === pkg.proveedor_email;
              
              // Verificación segura para evitar crashes con paquetes viejos
              const tieneCharter = Array.isArray(pkg.vuelos) && pkg.vuelos.some(v => v.esCharter);

              return (
                <div key={pkg.id} style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #eee', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                  
                  <div style={{ height: '180px', position: 'relative', background: '#f3f4f6' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagenPortada} alt={pkg.destino} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,255,255,0.9)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8em', fontWeight: 'bold', color: '#11173d' }}>
                      🌙 {pkg.noches} Noches
                    </div>

                    {tieneCharter && (
                      <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: '#ef5a1a', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '900', color: '#fff', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 4px 6px rgba(0,0,0,0.2)', textTransform: 'uppercase' }}>
                        ✈️ Vuelo Charter
                      </div>
                    )}
                  </div>

                  <div style={{ padding: '20px 20px 12px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '0.8em', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '5px' }}>
                      {pkg.transporte.includes('aereo') ? '✈️ Aéreo' : '🚌 Bus'} • Desde {pkg.transporte.includes('aereo') ? pkg.origenProvincia || pkg.origenPrincipal : pkg.origenPrincipal}
                    </div>
                    
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '1.3rem', color: '#11173d', lineHeight: '1.2' }}>{pkg.destino}</h3>
                    <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '10px' }}>Por: {pkg.proveedor_nombre}</div>

                    <div style={{ marginTop: 'auto', textAlign: 'right' }}>
                      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ef5a1a', display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '5px' }}>
                        <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 'normal' }}>desde</span>
                        {pkg.moneda || 'USD'} ${formatearPrecio(pkg.precioFinalCalculado)}
                      </div>
                    </div>
                  </div>

                  <div style={{ background: '#f9fafb', padding: '15px 20px', borderTop: '1px solid #eee', display: 'flex', gap: '10px' }}>
                    <a 
                      href={`/internal/enlatados/${pkg.id}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ flex: 1, textAlign: 'center', background: '#11173d', color: '#fff', textDecoration: 'none', padding: '10px', borderRadius: '8px', fontSize: '0.9em', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                    >
                       Ver Paquete
                    </a>
                    
                    {puedeEditar && (
                      <>
                        <button onClick={() => { setPaqueteAEditar(pkg); setMostrandoFormulario(true); }} style={{ background: '#e0f2fe', color: '#0369a1', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'background 0.2s' }} onMouseOver={e=>e.currentTarget.style.background='#bae6fd'} onMouseOut={e=>e.currentTarget.style.background='#e0f2fe'} title="Editar Paquete">✏️</button>
                        <button onClick={() => openConfirm('¿Estás seguro de que querés ELIMINAR este paquete por completo?', () => eliminarPaquete(pkg.id))} style={{ background: '#fef2f2', color: '#ef4444', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'background 0.2s' }} onMouseOver={e=>e.currentTarget.style.background='#fecaca'} onMouseOut={e=>e.currentTarget.style.background='#fef2f2'} title="Eliminar Paquete">🗑️</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {confirmDialog.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(17, 23, 61, 0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '16px', maxWidth: '400px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', textAlign: 'center', position: 'relative' }}>
            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🤔</div>
            <h3 style={{ margin: '0 0 10px 0', color: '#11173d', fontSize: '1.2rem', fontWeight: 900 }}>¿Estás seguro?</h3>
            <p style={{ color: '#4b5563', fontSize: '0.95rem', marginBottom: '25px', lineHeight: '1.5' }}>{confirmDialog.mensaje}</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button type="button" onClick={closeConfirm} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', color: '#374151', fontWeight: 'bold', cursor: 'pointer', flex: 1, transition: 'background 0.2s' }} onMouseOver={e=>e.currentTarget.style.background='#f3f4f6'} onMouseOut={e=>e.currentTarget.style.background='#fff'}>
                Cancelar
              </button>
              <button type="button" onClick={() => { confirmDialog.accion(); closeConfirm(); }} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#ef5a1a', color: '#fff', fontWeight: 'bold', cursor: 'pointer', flex: 1, transition: 'background 0.2s' }} onMouseOver={e=>e.currentTarget.style.background='#ea580c'} onMouseOut={e=>e.currentTarget.style.background='#ef5a1a'}>
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}