'use client';
import { useState, useEffect } from 'react';
import FormularioEnlatado from '@/components/proveedores/FormularioEnlatado';
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { useAlert } from '@/contexts/AlertContext'; 
import Loader from '@/components/shared/Loader';

// El staff ve el precio ya con el recargo, pero para ellos es el precio "Neto"
const MARKUP_AGENCIA = 1.20; 

export default function InternalEnlatadosDashboard() {
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
  const [paqueteAEditar, setPaqueteAEditar] = useState(null); 
  
  const { currentUser, userData } = useStaffAuth();
  const { showAlert } = useAlert(); 
  
  const [paquetes, setPaquetes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Verificamos si el usuario es Admin o Editor
  const esGestor = userData?.rol === 'admin' || userData?.rol === 'editor';

  const cargarPaquetes = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'enlatados'));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setPaquetes(data);
    } catch (error) {
      console.error("Error al cargar paquetes:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarPaquetes();
  }, []);

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
        await updateDoc(docRef, {
          ...datos,
          fecha_actualizacion: new Date().toLocaleDateString('es-AR')
        });
        if(showAlert) showAlert('¡Paquete actualizado correctamente!', 'success');
      } else {
        const paqueteNuevo = {
          ...datos,
          proveedor_email: currentUser.email,
          proveedor_nombre: userData.franquicia || currentUser.email,
          timestamp: Date.now(),
          fecha_creacion: new Date().toLocaleDateString('es-AR'),
          estado: 'activo'
        };
        await addDoc(collection(db, 'enlatados'), paqueteNuevo);
        if(showAlert) showAlert('¡Nuevo paquete publicado!', 'success');
      }

      setMostrandoFormulario(false);
      setPaqueteAEditar(null);
      cargarPaquetes(); 
    } catch (error) {
      if(showAlert) showAlert('Hubo un problema al guardar.', 'error');
    }
  };

  const abrirParaEditar = (pkg) => {
    setPaqueteAEditar(pkg);
    setMostrandoFormulario(true);
  };

  const cancelarEdicion = () => {
    setPaqueteAEditar(null);
    setMostrandoFormulario(false);
  };

  const formatearPrecio = (valor) => {
    if (!valor) return '-';
    return Number(valor).toLocaleString('es-AR');
  };

  const obtenerPrecioDesde = (tarifario) => {
    if (!tarifario || tarifario.length === 0) return 0;
    const precios = tarifario.map(t => {
      if (typeof t.doble === 'object') return parseFloat(t.doble.mayor) || 0;
      return parseFloat(t.doble) || 0;
    }).filter(p => p > 0);
    if (precios.length === 0) return 0;
    return Math.round(Math.min(...precios) * MARKUP_AGENCIA);
  };

  if (loading) return <Loader visible={true} text="Cargando sistema central..." />;

  return (
    <div style={{ padding: '20px' }}>
      {!mostrandoFormulario && (
        <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '2px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
            <div>
              <h1 style={{ color: '#11173d', margin: '0 0 5px 0', fontSize: '2.2rem', fontWeight: 800 }}>Gestión Central de Paquetes</h1>
              <p style={{ color: '#6b7280', margin: 0, fontSize: '1.1rem' }}>
                Base de datos completa de viajes enlatados.
              </p>
            </div>
            
            {esGestor && (
              <button 
                onClick={() => { setPaqueteAEditar(null); setMostrandoFormulario(true); }}
                className="btn btn-primario"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '1.1rem' }}
              >
                ➕ Cargar Viaje (Admin)
              </button>
            )}
          </div>
        </div>
      )}

      {mostrandoFormulario && esGestor ? (
        <FormularioEnlatado paqueteAEditar={paqueteAEditar} onCancel={cancelarEdicion} onSave={guardarEnFirebase} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {paquetes.length === 0 ? (
            <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No hay paquetes en el sistema.</p>
          ) : (
            paquetes.map((pkg) => {
              const precioFinal = obtenerPrecioDesde(pkg.tarifario);
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

                  <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '0.8em', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '5px' }}>
                      {pkg.transporte.includes('aereo') ? '✈️ Aéreo' : '🚌 Bus'} • Desde {pkg.transporte.includes('aereo') ? pkg.origenProvincia || pkg.origenPrincipal : pkg.origenPrincipal}
                    </div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '1.3rem', color: '#11173d', lineHeight: '1.2' }}>{pkg.destino}</h3>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '15px' }}>Proveedor: {pkg.proveedor_nombre}</div>
                    
                    <div style={{ marginTop: 'auto', textAlign: 'right' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ef5a1a', display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '5px' }}>
                        <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 'normal' }}>desde</span>
                        {pkg.moneda || 'USD'} ${formatearPrecio(precioFinal)}
                      </div>
                    </div>
                  </div>

                  <div style={{ background: '#f9fafb', padding: '15px 20px', borderTop: '1px solid #eee', display: 'flex', gap: '10px' }}>
                    <a 
                      href={`/proveedor/paquete/${pkg.id}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn"
                      style={{ flex: 1, textAlign: 'center', background: '#11173d', color: '#fff', textDecoration: 'none', padding: '12px', borderRadius: '10px', fontSize: '0.9em', fontWeight: 'bold' }}
                    >
                      👁️ Ver Folleto
                    </a>
                    
                    {esGestor && (
                      <button 
                        style={{ background: '#e5e7eb', color: '#4b5563', padding: '12px', borderRadius: '10px', fontSize: '0.9em', fontWeight: 'bold', cursor: 'pointer', border: 'none' }}
                        onClick={() => abrirParaEditar(pkg)}
                      >
                        ✏️ Editar
                      </button>
                    )}
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