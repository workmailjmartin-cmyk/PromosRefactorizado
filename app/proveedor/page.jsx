'use client';
import { useState, useEffect } from 'react';
import FormularioEnlatado from '@/components/proveedores/FormularioEnlatado';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStaffAuth } from '@/hooks/useStaffAuth';

// Porcentaje de marca (Markup) que se le suma al costo neto para mostrar el precio de venta.
// 1.20 = 20% de recargo.
const MARKUP_AGENCIA = 1.20; 

export default function ProveedorDashboard() {
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
  const { currentUser, userData } = useStaffAuth();
  
  const [paquetes, setPaquetes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroCreador, setFiltroCreador] = useState('todos'); // 'todos' o 'mis_paquetes'

  // Función para descargar los paquetes de Firebase
  const cargarPaquetes = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'enlatados'));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Ordenamos para que los más nuevos salgan primero
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
      alert("Error de sesión. Volvé a ingresar.");
      return;
    }
    try {
      const paqueteNuevo = {
        ...datos,
        proveedor_email: currentUser.email,
        proveedor_nombre: userData.franquicia || currentUser.email,
        timestamp: Date.now(),
        fecha_creacion: new Date().toLocaleDateString('es-AR'),
        estado: 'activo'
      };
      // Usamos sintaxis modular de Firebase (v9)
      await addDoc(collection(db, 'enlatados'), paqueteNuevo);
      alert("✅ ¡Paquete publicado con éxito!");
      setMostrandoFormulario(false);
      cargarPaquetes(); // Recargamos la lista
    } catch (error) {
      console.error("Error guardando en Firebase:", error);
      alert("❌ Hubo un error al guardar el paquete. Intentá de nuevo.");
    }
  };

  // Lógica de filtrado
  const paquetesFiltrados = paquetes.filter(p => {
    if (filtroCreador === 'mis_paquetes') {
      return p.proveedor_email === currentUser?.email;
    }
    return true; // 'todos'
  });

  // Función para sacar el precio más barato (Base Doble) y sumarle el Markup
  const obtenerPrecioDesde = (tarifario) => {
    if (!tarifario || tarifario.length === 0) return 0;
    const precios = tarifario.map(t => parseFloat(t.doble) || 0).filter(p => p > 0);
    if (precios.length === 0) return 0;
    const costoNeto = Math.min(...precios);
    return Math.round(costoNeto * MARKUP_AGENCIA);
  };

  return (
    <div>
      {/* CABECERA Y FILTROS */}
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
              onClick={() => setMostrandoFormulario(true)}
              className="btn btn-primario"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '1.1rem' }}
            >
              ➕ Cargar Nuevo Paquete
            </button>
          </div>

          {/* BARRA DE FILTROS ESTILO INTERNAL */}
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

      {/* RENDERIZADO DEL FORMULARIO O LA GRILLA */}
      {mostrandoFormulario ? (
        <FormularioEnlatado 
          onCancel={() => setMostrandoFormulario(false)} 
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
                <strong style={{ color: '#11173d' }}>¡Sé el primero en cargar uno haciendo clic en el botón naranja!</strong>
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {/* TARJETAS DE PAQUETES (ESTILO SEARCHVIEW) */}
              {paquetesFiltrados.map((pkg) => {
                const esMio = pkg.proveedor_email === currentUser?.email;
                const precioFinal = obtenerPrecioDesde(pkg.tarifario);
                const imagenPortada = pkg.imagenes && pkg.imagenes.length > 0 ? pkg.imagenes[0] : '/placeholder.jpg'; // Asegurate de tener una imagen en /public/placeholder.jpg por si no suben foto

                return (
                  <div key={pkg.id} style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #eee', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                    
                    {/* Imagen */}
                    <div style={{ height: '180px', position: 'relative', background: '#f3f4f6' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imagenPortada} alt={pkg.destino} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,255,255,0.9)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8em', fontWeight: 'bold', color: '#11173d' }}>
                        🌙 {pkg.noches} Noches
                      </div>
                    </div>

                    {/* Cuerpo de la Tarjeta */}
                    <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: '0.8em', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '5px' }}>
                        {pkg.transporte === 'aereo' ? '✈️ Aéreo' : '🚌 Bus'} • Desde {pkg.origenPrincipal}
                      </div>
                      <h3 style={{ margin: '0 0 15px 0', fontSize: '1.3rem', color: '#11173d', lineHeight: '1.2' }}>
                        {pkg.destino}
                      </h3>
                      
                      <div style={{ marginTop: 'auto', textAlign: 'right' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ef5a1a', display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '5px' }}>
                          <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 'normal' }}>desde</span>
                          {pkg.moneda || 'USD'} ${precioFinal}
                        </div>
                      </div>
                    </div>

                    {/* Footer con Botones (Más redondeados) */}
                    <div style={{ background: '#f9fafb', padding: '15px 20px', borderTop: '1px solid #eee', display: 'flex', gap: '10px' }}>
                      <a 
                        href={`/proveedor/paquete/${pkg.id}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn"
                        style={{ flex: 1, textAlign: 'center', background: '#11173d', color: '#fff', textDecoration: 'none', padding: '12px', borderRadius: '10px', fontSize: '0.9em', fontWeight: 'bold', transition: 'opacity 0.2s' }}
                        onMouseOver={e=>e.currentTarget.style.opacity='0.9'} onMouseOut={e=>e.currentTarget.style.opacity='1'}
                      >
                        Ver Detalles
                      </a>
                      
                      {esMio && (
                        <button 
                          className="btn"
                          style={{ background: '#e5e7eb', color: '#4b5563', padding: '12px', borderRadius: '10px', fontSize: '0.9em', fontWeight: 'bold', transition: 'background 0.2s' }}
                          onClick={() => alert("Función Editar en desarrollo")}
                          onMouseOver={e=>e.currentTarget.style.background='#d1d5db'} onMouseOut={e=>e.currentTarget.style.background='#e5e7eb'}
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