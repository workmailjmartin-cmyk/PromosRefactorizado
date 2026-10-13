'use client';
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAlert } from '@/contexts/AlertContext';

export default function ConfigChatwoot() {
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Estados locales para los arrays
  const [frases, setFrases] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [etiquetas, setEtiquetas] = useState([]);

  // Estados para los inputs temporales antes de agregar
  const [nuevaFrase, setNuevaFrase] = useState('');
  const [nuevoEquipoValue, setNuevoEquipoValue] = useState('');
  const [nuevoEquipoLabel, setNuevoEquipoLabel] = useState('');
  const [nuevaEtiqueta, setNuevaEtiqueta] = useState('');

  // 1. Cargar datos desde Firebase
  useEffect(() => {
    const cargarConfiguracion = async () => {
      try {
        const docRef = doc(db, 'configuracion', 'chatwoot');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFrases(data.frases || []);
          setEquipos(data.equipos || []);
          setEtiquetas(data.etiquetas || []);
        } else {
          // Si no existe, inicializamos con arrays vacíos
          setFrases([]);
          setEquipos([]);
          setEtiquetas([]);
        }
      } catch (error) {
        console.error("Error al cargar config de Chatwoot:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarConfiguracion();
  }, []);

  // 2. Guardar en Firebase
  const handleGuardarTodo = async () => {
    setGuardando(true);
    try {
      const docRef = doc(db, 'configuracion', 'chatwoot');
      await setDoc(docRef, {
        frases,
        equipos,
        etiquetas
      }, { merge: true }); // Usamos merge por si a futuro agregás otros campos
      
      if (showAlert) showAlert('Configuración de Chatwoot guardada correctamente', 'success');
    } catch (error) {
      if (showAlert) showAlert('Error al guardar la configuración', 'error');
    } finally {
      setGuardando(false);
    }
  };

  // --- MANEJADORES DE FRASES ---
  const agregarFrase = () => {
    if (nuevaFrase.trim() === '') return;
    setFrases([...frases, nuevaFrase.trim()]);
    setNuevaFrase('');
  };
  const eliminarFrase = (index) => {
    setFrases(frases.filter((_, i) => i !== index));
  };

  // --- MANEJADORES DE EQUIPOS ---
  const agregarEquipo = () => {
    if (nuevoEquipoValue.trim() === '' || nuevoEquipoLabel.trim() === '') return;
    setEquipos([...equipos, { value: nuevoEquipoValue.trim(), label: nuevoEquipoLabel.trim() }]);
    setNuevoEquipoValue('');
    setNuevoEquipoLabel('');
  };
  const eliminarEquipo = (index) => {
    setEquipos(equipos.filter((_, i) => i !== index));
  };

  // --- MANEJADORES DE ETIQUETAS ---
  const agregarEtiqueta = () => {
    if (nuevaEtiqueta.trim() === '') return;
    setEtiquetas([...etiquetas, nuevaEtiqueta.trim()]);
    setNuevaEtiqueta('');
  };
  const eliminarEtiqueta = (index) => {
    setEtiquetas(etiquetas.filter((_, i) => i !== index));
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Cargando configuración...</div>;

  return (
    <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #e5e7eb', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
        <h2 style={{ margin: 0, color: '#11173d', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          🤖 Parámetros de Chatwoot
        </h2>
        <button 
          onClick={handleGuardarTodo} 
          disabled={guardando}
          style={{ background: '#ef5a1a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: guardando ? 'not-allowed' : 'pointer' }}
        >
          {guardando ? 'Guardando...' : '💾 Guardar Cambios'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* BLOQUE: FRASES LIBERADORAS */}
        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', color: '#0369a1' }}>Frases Liberadoras (Meta Ads)</h3>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <input 
              type="text" 
              value={nuevaFrase} 
              onChange={e => setNuevaFrase(e.target.value)} 
              placeholder="Ej: Hola Feliz Viaje, quiero info de..." 
              style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              onKeyDown={e => e.key === 'Enter' && agregarFrase()}
            />
            <button onClick={agregarFrase} style={{ background: '#11173d', color: '#fff', border: 'none', padding: '0 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Agregar</button>
          </div>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {frases.map((frase, idx) => (
              <li key={idx} style={{ background: '#fff', padding: '10px 15px', borderRadius: '6px', border: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                <span>{frase}</span>
                <button onClick={() => eliminarFrase(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
              </li>
            ))}
            {frases.length === 0 && <li style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.9rem' }}>No hay frases cargadas.</li>}
          </ul>
        </div>

        {/* BLOQUE: EQUIPOS DE CHATWOOT */}
        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', color: '#16a34a' }}>Equipos a Derivar (Bandejas Chatwoot)</h3>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              value={nuevoEquipoValue} 
              onChange={e => setNuevoEquipoValue(e.target.value)} 
              placeholder="ID (Ej: 29)" 
              style={{ width: '120px', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            />
            <input 
              type="text" 
              value={nuevoEquipoLabel} 
              onChange={e => setNuevoEquipoLabel(e.target.value)} 
              placeholder="Nombre Visible (Ej: publicidad_sucursales)" 
              style={{ flex: 1, minWidth: '200px', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              onKeyDown={e => e.key === 'Enter' && agregarEquipo()}
            />
            <button onClick={agregarEquipo} style={{ background: '#11173d', color: '#fff', border: 'none', padding: '0 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Agregar</button>
          </div>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {equipos.map((eq, idx) => (
              <li key={idx} style={{ background: '#fff', padding: '10px 15px', borderRadius: '6px', border: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                <span><strong>[{eq.value}]</strong> {eq.label}</span>
                <button onClick={() => eliminarEquipo(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
              </li>
            ))}
             {equipos.length === 0 && <li style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.9rem' }}>No hay equipos cargados.</li>}
          </ul>
        </div>

        {/* BLOQUE: ETIQUETAS */}
        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', color: '#d97706' }}>Etiquetas Disponibles</h3>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <input 
              type="text" 
              value={nuevaEtiqueta} 
              onChange={e => setNuevaEtiqueta(e.target.value)} 
              placeholder="Ej: publicidad_dirigida" 
              style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              onKeyDown={e => e.key === 'Enter' && agregarEtiqueta()}
            />
            <button onClick={agregarEtiqueta} style={{ background: '#11173d', color: '#fff', border: 'none', padding: '0 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Agregar</button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {etiquetas.map((etiqueta, idx) => (
              <span key={idx} style={{ background: '#fef3c7', color: '#b45309', padding: '5px 12px', borderRadius: '20px', border: '1px solid #fde68a', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
                {etiqueta}
                <button onClick={() => eliminarEtiqueta(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', lineHeight: 1, padding: 0 }}>✕</button>
              </span>
            ))}
            {etiquetas.length === 0 && <span style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.9rem' }}>No hay etiquetas cargadas.</span>}
          </div>
        </div>

      </div>
    </div>
  );
}