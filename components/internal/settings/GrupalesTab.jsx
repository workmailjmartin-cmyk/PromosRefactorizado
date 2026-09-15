'use client';
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAlert } from '@/contexts/AlertContext';

export default function GrupalesTab() {
  const [config, setConfig] = useState({
    marcaGlobal: 10,
    comisionGlobal: 15,
  });
  
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  
  const { showAlert } = useAlert(); // <-- Traemos tu sistema de alertas lindas

  // 1. CARGAR CONFIGURACIÓN DESDE FIREBASE AL ENTRAR
  useEffect(() => {
    const cargarConfig = async () => {
      try {
        const docRef = doc(db, 'configuracion', 'grupales');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setConfig(docSnap.data());
        }
      } catch (error) {
        console.error("Error al cargar la configuración:", error);
      }
      setLoading(false);
    };
    cargarConfig();
  }, []);

  const handleChange = (e) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  // 2. GUARDAR CONFIGURACIÓN REAL EN FIREBASE
  const guardarConfiguracion = async () => {
    setGuardando(true);
    try {
      const docRef = doc(db, 'configuracion', 'grupales');
      await setDoc(docRef, {
        marcaGlobal: Number(config.marcaGlobal),
        comisionGlobal: Number(config.comisionGlobal)
      }, { merge: true }); // Merge true evita borrar otras cosas si agregás más campos luego
      
      if (showAlert) {
        showAlert('¡Configuración guardada exitosamente!', 'success');
      } else {
        alert('Configuración guardada'); // Fallback por si falla el contexto
      }
    } catch (error) {
      console.error(error);
      if (showAlert) {
        showAlert('Hubo un error al guardar.', 'error');
      }
    }
    setGuardando(false);
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
        
        {/* PANEL GLOBAL */}
        <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.03)' }}>
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
                onChange={handleChange}
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
                onChange={handleChange}
                style={{ width: '100px', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1.1rem', fontWeight: 'bold', textAlign: 'center', outline: 'none' }} 
              />
              <span style={{ fontSize: '1.2rem', color: '#4b5563', fontWeight: 'bold' }}>%</span>
            </div>
          </div>

          <button 
            onClick={guardarConfiguracion}
            disabled={guardando}
            style={{ width: '100%', background: '#ef5a1a', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: guardando ? 'not-allowed' : 'pointer', boxShadow: '0 4px 6px rgba(239, 90, 26, 0.2)', transition: 'background 0.3s' }}
          >
            {guardando ? 'Guardando...' : '💾 Guardar Globales'}
          </button>
        </div>

        {/* PANEL EXCEPCIONES */}
        <div style={{ background: '#f9fafb', padding: '25px', borderRadius: '12px', border: '1px dashed #d1d5db', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ margin: '0 0 15px 0', fontSize: '1.2rem', color: '#11173d', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
            🏢 Excepciones por Proveedor
          </h4>
          <p style={{ margin: '0 0 25px 0', fontSize: '0.9rem', color: '#6b7280', lineHeight: '1.5' }}>
            Si un proveedor tiene un trato distinto, agregalo acá para sobreescribir la regla global.
          </p>
          
          <button style={{ marginTop: 'auto', background: 'transparent', border: '2px dashed #11173d', color: '#11173d', fontWeight: 'bold', padding: '14px', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.3s' }}>
            + Añadir Proveedor Específico
          </button>
        </div>

      </div>
    </div>
  );
}