'use client';
import { useState, useEffect } from 'react';
import FormularioEnlatado from '@/components/proveedores/FormularioEnlatado';
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import Swal from 'sweetalert2'; // <-- Importamos SweetAlert2

const MARKUP_AGENCIA = 1.20; 

export default function ProveedorDashboard() {
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
  const [paqueteAEditar, setPaqueteAEditar] = useState(null); // <-- Estado para saber qué paquete estamos editando
  
  const { currentUser, userData } = useStaffAuth();
  const [paquetes, setPaquetes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroCreador, setFiltroCreador] = useState('todos');

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

  // Función inteligente: Sirve tanto para crear nuevos como para actualizar existentes
  const guardarEnFirebase = async (datos) => {
    if (!currentUser || !userData) {
      Swal.fire('Error', 'Problema de sesión. Volvé a ingresar.', 'error');
      return;
    }
    
    // Si el objeto "datos" tiene un ID, significa que estamos editando
    const esEdicion = !!datos.id;

    try {
      if (esEdicion) {
        // ACTUALIZAR PAQUETE EXISTENTE
        const docRef = doc(db, 'enlatados', datos.id);
        await updateDoc(docRef, {
          ...datos,
          fecha_actualizacion: new Date().toLocaleDateString('es-AR')
        });
        
        Swal.fire({
          icon: 'success',
          title: '¡Actualizado!',
          text: 'Los cambios se guardaron correctamente.',
          confirmButtonColor: '#11173d'
        });

      } else {
        // CREAR PAQUETE NUEVO
        const paqueteNuevo = {
          ...datos,
          proveedor_email: currentUser.email,
          proveedor_nombre: userData.franquicia || currentUser.email,
          timestamp: Date.now(),
          fecha_creacion: new Date().toLocaleDateString('es-AR'),
          estado: 'activo'
        };
        await addDoc(collection(db, 'enlatados'), paqueteNuevo);
        
        Swal.fire({
          icon: 'success',
          title: '¡Publicado!',
          text: 'El paquete ya está disponible en el mercado.',
          confirmButtonColor: '#11173d'
        });
      }

      setMostrandoFormulario(false);
      setPaqueteAEditar(null);
      cargarPaquetes(); 
    } catch (error) {
      console.error("Error guardando en Firebase:", error);
      Swal.fire('Error', 'Hubo un problema al guardar. Intentá de nuevo.', 'error');
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

  const paquetesFiltrados = paquetes.filter(p => {
    if (filtroCreador === 'mis_paquetes') {
      return p.proveedor_email === currentUser?.email;
    }
    return true;
  });

  const obtenerPrecioDesde = (tarifario) => {
    if (!tarifario || tarifario.length === 0) return 0;
    const precios = tarifario.map(t => parseFloat(t.doble) || 0).filter(p => p > 0);
    if (precios.length === 0) return 0;
    return Math.round(Math.min(...precios) * MARKUP_AGENCIA);
  };

  return (
    <div>
      {!mostrandoFormulario && (
        <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '2px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
            <div>
              <h1 style={{ color: '#11173d', margin: '0 0 5px 0', fontSize: '2.2rem', fontWeight: 800 }}>Mercado de Paquetes</h1>
              <p style={{ color: '#6b7280', margin: 0, fontSize: '1.1rem' }}>
                Explorá los viajes disponibles o publicá los tuyos. Compitiendo con las mejores tarifas.
              </p>
            </div>
            <button 
              onClick={() => { setPaqueteAEditar(null); setMostrandoFormulario(true); }}
              className="btn btn-primario"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '1.1rem' }}
            >
              ➕ Cargar Nuevo Paquete
            </button>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', gap: '15px', background: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', border: '1px solid #eee' }}>
            <div style={{ flex: 1, maxWidth: '250px' }}>
              <label style={{ display: 'block', fontSize: '0.85em', fontWeight: 'bold', color: '#6b7280', marginBottom: '5px' }}>Filtro de Creador</label>
              <select 
                value={filtroCreador} 
                onChange={(e) => setFiltroCreador(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', outline: 'none' }}
              >
                <option value="todos">🌍 Todos los Paquetes</option>
                <option value="mis_paquetes">📦 Solo Mis Paquetes</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {mostrandoFormulario ? (
        <FormularioEnlatado 
          paqueteAEditar={paqueteAEditar} // <-- Le pasamos los datos al form si estamos editando
          onCancel={cancelarEdicion} 
          onSave={guardarEnFirebase} 
        />
      ) : (
        <>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px', color: '#11173d', fontWeight: 'bold' }}>Cargando mercado... ⏳</div>
          ) : paquetesFiltrados.length === 0 ? (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '50px 20px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
              <p style={{ color: '#9ca3af', fontSize: '1.2rem', margin: 0 }}>
                No se encontraron paquetes. <br/>
                <strong style={{ color: '#11173d' }}>¡Sé el primero en cargar uno!</strong>
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {paquetesFiltrados.map((pkg) => {
                // Chequeamos si es el dueño O si es admin/editor
                const esMio = pkg.proveedor_email === currentUser?.email || (userData?.rol === 'admin' || userData?.rol === 'editor');
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
                        {pkg.transporte.includes('aereo') ? '✈️ Aéreo' : '🚌 Bus'} • Desde {pkg.origenPrincipal}
                      </div>
                      <h3 style={{ margin: '0 0 15px 0', fontSize: '1.3rem', color: '#11173d', lineHeight: '1.2' }}>{pkg.destino}</h3>
                      
                      <div style={{ marginTop: 'auto', textAlign: 'right' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ef5a1a', display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '5px' }}>
                          <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 'normal' }}>desde</span>
                          {pkg.moneda || 'USD'} ${precioFinal}
                        </div>
                      </div>
                    </div>

                    <div style={{ background: '#f9fafb', padding: '15px 20px', borderTop: '1px solid #eee', display: 'flex', gap: '10px' }}>
                      <a 
                        href={`/proveedor/paquete/${pkg.id}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn"
                        style={{ flex: 1, textAlign: 'center', background: '#11173d', color: '#fff', textDecoration: 'none', padding: '12px', borderRadius: '10px', fontSize: '0.9em', fontWeight: 'bold', transition: 'opacity 0.2s' }}
                      >
                        👁️ Ver Detalles
                      </a>
                      
                      {esMio && (
                        <button 
                          className="btn"
                          style={{ background: '#e5e7eb', color: '#4b5563', padding: '12px', borderRadius: '10px', fontSize: '0.9em', fontWeight: 'bold', cursor: 'pointer' }}
                          onClick={() => abrirParaEditar(pkg)} // <-- ACÁ ABRIMOS LA MAGIA
                        >
                          ✏️ Editar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}