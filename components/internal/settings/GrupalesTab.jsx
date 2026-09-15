'use client';
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAlert } from '@/contexts/AlertContext';

export default function GrupalesTab() {
  // Estado principal de configuración
  const [config, setConfig] = useState({
    marcaGlobal: 10,
    comisionGlobal: 15,
    excepciones: [] // <-- Array para guardar las reglas de proveedores
  });
  
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  
  // Estados para el mini-formulario de excepciones
  const [modoExcepcion, setModoExcepcion] = useState(false);
  const [formExcepcion, setFormExcepcion] = useState({ email: '', nombre: '', marca: '', comision: '', esEdicion: false });

  const { showAlert } = useAlert();

  // 1. CARGAR CONFIGURACIÓN Y LISTA DE PROVEEDORES
  useEffect(() => {
    const inicializarDatos = async () => {
      try {
        // Cargar configuración actual
        const docRef = doc(db, 'configuracion', 'grupales');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setConfig({
            marcaGlobal: data.marcaGlobal || 10,
            comisionGlobal: data.comisionGlobal || 15,
            excepciones: data.excepciones || []
          });
        }

        // Cargar usuarios que son proveedores
        const querySnapshot = await getDocs(collection(db, 'usuarios'));
        const listaProveedores = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.rol === 'proveedor' || data.rol === 'proveedor_agencia') {
            listaProveedores.push({
              email: data.email,
              nombre: data.franquicia || data.nombre || data.email
            });
          }
        });
        // Ordenar alfabéticamente
        listaProveedores.sort((a, b) => a.nombre.localeCompare(b.nombre));
        setProveedores(listaProveedores);

      } catch (error) {
        console.error("Error al cargar:", error);
      }
      setLoading(false);
    };
    inicializarDatos();
  }, []);

  const handleChangeGlobal = (e) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  // Función genérica para guardar en Firebase (se usa para globales y excepciones)
  const actualizarFirebase = async (datosParciales, mensajeExito) => {
    setGuardando(true);
    try {
      const docRef = doc(db, 'configuracion', 'grupales');
      await setDoc(docRef, datosParciales, { merge: true });
      if (showAlert) showAlert(mensajeExito, 'success');
    } catch (error) {
      console.error(error);
      if (showAlert) showAlert('Hubo un error al guardar en la base de datos.', 'error');
    }
    setGuardando(false);
  };

  // Guardar Valores Globales
  const guardarGlobales = () => {
    actualizarFirebase({
      marcaGlobal: Number(config.marcaGlobal),
      comisionGlobal: Number(config.comisionGlobal)
    }, '¡Valores globales guardados exitosamente!');
  };

  // --- LÓGICA DE EXCEPCIONES ---
  const abrirFormularioNuevo = () => {
    setFormExcepcion({ email: '', nombre: '', marca: '', comision: '', esEdicion: false });
    setModoExcepcion(true);
  };

  const abrirFormularioEditar = (exc) => {
    setFormExcepcion({ ...exc, esEdicion: true });
    setModoExcepcion(true);
  };

  const guardarExcepcion = () => {
    if (!formExcepcion.email || formExcepcion.marca === '' || formExcepcion.comision === '') {
      if (showAlert) showAlert('Completá todos los campos', 'error');
      return;
    }

    // Buscamos el nombre del proveedor para guardarlo bonito
    const provSeleccionado = proveedores.find(p => p.email === formExcepcion.email);
    const nombreGuardar = provSeleccionado ? provSeleccionado.nombre : formExcepcion.email;

    const nuevasExcepciones = [...(config.excepciones || [])];
    const index = nuevasExcepciones.findIndex(e => e.email === formExcepcion.email);

    const reglaNueva = {
      email: formExcepcion.email,
      nombre: nombreGuardar,
      marca: Number(formExcepcion.marca),
      comision: Number(formExcepcion.comision)
    };

    if (index >= 0) {
      nuevasExcepciones[index] = reglaNueva; // Sobreescribe si existe
    } else {
      nuevasExcepciones.push(reglaNueva); // Agrega si es nuevo
    }

    setConfig({ ...config, excepciones: nuevasExcepciones });
    setModoExcepcion(false);
    
    // Guardamos la lista actualizada en Firebase automáticamente
    actualizarFirebase({ excepciones: nuevasExcepciones }, '¡Excepción de proveedor guardada!');
  };

  const eliminarExcepcion = (email) => {
    if (!confirm('¿Seguro que querés eliminar esta regla específica?')) return;
    const nuevasExcepciones = (config.excepciones || []).filter(e => e.email !== email);
    setConfig({ ...config, excepciones: nuevasExcepciones });
    actualizarFirebase({ excepciones: nuevasExcepciones }, '¡Excepción eliminada!');
  };


  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Cargando configuración...</div>;
  }

  return (
    <div style={{ background: '#fff', padding: '30px', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
      
      <div style={{ marginBottom: '30px', borderBottom: '2px solid #f3f4f6', paddingBottom: '20px' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.8rem', color: '#11173d', fontWeight: 900 }}>Configuración de Grupales / Enlatados</h3>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '1rem' }}>Definí los márgenes de rentabilidad para los paquetes mayoristas.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
        
        {/* ================= PANEL GLOBAL ================= */}
        <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.03)', height: 'fit-content' }}>
          <h4 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', color: '#11173d', fontWeight: 900, borderBottom: '1px solid #eee', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🌍 Valores Globales (Por Defecto)
          </h4>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', color: '#11173d', marginBottom: '8px' }}>
              % de Marca <span style={{ fontWeight: 'normal', color: '#6b7280', fontSize: '0.85rem' }}>(Costo invisible)</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input 
                type="number" 
                name="marcaGlobal"
                value={config.marcaGlobal} 
                onChange={handleChangeGlobal}
                style={{ width: '100px', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1.1rem', fontWeight: 'bold', textAlign: 'center', outline: 'none' }} 
              />
              <span style={{ fontSize: '1.2rem', color: '#4b5563', fontWeight: 'bold' }}>%</span>
            </div>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', color: '#11173d', marginBottom: '8px' }}>
              % de Comisión Final <span style={{ fontWeight: 'normal', color: '#6b7280', fontSize: '0.85rem' }}>(Tu rentabilidad)</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input 
                type="number" 
                name="comisionGlobal"
                value={config.comisionGlobal} 
                onChange={handleChangeGlobal}
                style={{ width: '100px', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1.1rem', fontWeight: 'bold', textAlign: 'center', outline: 'none' }} 
              />
              <span style={{ fontSize: '1.2rem', color: '#4b5563', fontWeight: 'bold' }}>%</span>
            </div>
          </div>

          <button 
            onClick={guardarGlobales}
            disabled={guardando}
            style={{ width: '100%', background: '#ef5a1a', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: guardando ? 'not-allowed' : 'pointer', boxShadow: '0 4px 6px rgba(239, 90, 26, 0.2)', transition: 'background 0.3s' }}
          >
            {guardando ? 'Guardando...' : '💾 Guardar Globales'}
          </button>
        </div>

        {/* ================= PANEL EXCEPCIONES ================= */}
        <div style={{ background: '#f9fafb', padding: '25px', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ margin: '0 0 15px 0', fontSize: '1.2rem', color: '#11173d', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
            🏢 Excepciones por Proveedor
          </h4>
          <p style={{ margin: '0 0 25px 0', fontSize: '0.9rem', color: '#6b7280', lineHeight: '1.5' }}>
            Si un proveedor tiene un trato distinto, agregalo acá para sobreescribir la regla global.
          </p>

          {/* LISTA DE REGLAS ACTUALES */}
          {config.excepciones && config.excepciones.length > 0 && !modoExcepcion && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {config.excepciones.map((exc) => (
                <div key={exc.email} style={{ background: '#fff', border: '1px solid #d1d5db', padding: '15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div>
                    <div style={{ fontWeight: '900', color: '#11173d', fontSize: '1rem', marginBottom: '2px' }}>{exc.nombre}</div>
                    <div style={{ fontSize: '0.85rem', color: '#4b5563', fontWeight: 'bold' }}>
                      Marca: <span style={{ color: '#ef5a1a' }}>{exc.marca}%</span> <span style={{ margin: '0 6px', color: '#d1d5db' }}>|</span> 
                      Comisión: <span style={{ color: '#059669' }}>{exc.comision}%</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => abrirFormularioEditar(exc)} style={{ background: '#e0f2fe', color: '#0369a1', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Editar">
                      ✏️
                    </button>
                    <button onClick={() => eliminarExcepcion(exc.email)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Eliminar">
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* FORMULARIO DE EDICIÓN/CREACIÓN */}
          {modoExcepcion ? (
            <div style={{ background: '#fff', border: '2px solid #bae6fd', padding: '20px', borderRadius: '12px', marginTop: 'auto' }}>
              <h5 style={{ margin: '0 0 15px 0', fontSize: '1.05rem', color: '#0369a1', fontWeight: 900 }}>
                {formExcepcion.esEdicion ? '✏️ Editar Excepción' : '✨ Nueva Excepción'}
              </h5>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#11173d', marginBottom: '5px' }}>Seleccionar Proveedor</label>
                <select 
                  value={formExcepcion.email} 
                  onChange={(e) => setFormExcepcion({...formExcepcion, email: e.target.value})}
                  disabled={formExcepcion.esEdicion}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', background: formExcepcion.esEdicion ? '#f3f4f6' : '#fff', color: formExcepcion.esEdicion ? '#9ca3af' : '#11173d' }}
                >
                  <option value="">Elegí un proveedor de la lista...</option>
                  {proveedores.map(prov => (
                    <option key={prov.email} value={prov.email}>{prov.nombre}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#11173d', marginBottom: '5px' }}>% Marca</label>
                  <input type="number" value={formExcepcion.marca} onChange={(e) => setFormExcepcion({...formExcepcion, marca: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }} placeholder="Ej: 12" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#11173d', marginBottom: '5px' }}>% Comisión</label>
                  <input type="number" value={formExcepcion.comision} onChange={(e) => setFormExcepcion({...formExcepcion, comision: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }} placeholder="Ej: 18" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={guardarExcepcion} style={{ flex: 1, background: '#0284c7', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Guardar Regla
                </button>
                <button onClick={() => setModoExcepcion(false)} style={{ flex: 1, background: '#e5e7eb', color: '#4b5563', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={abrirFormularioNuevo}
              style={{ marginTop: 'auto', background: 'transparent', border: '2px dashed #9ca3af', color: '#4b5563', fontWeight: 'bold', padding: '14px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = '#11173d'; e.currentTarget.style.color = '#11173d'; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = '#9ca3af'; e.currentTarget.style.color = '#4b5563'; }}
            >
              + Añadir Proveedor Específico
            </button>
          )}

        </div>

      </div>
    </div>
  );
}