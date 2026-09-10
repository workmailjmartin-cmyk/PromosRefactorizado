'use client';
import { useState } from 'react';
import FormularioEnlatado from '@/components/proveedores/FormularioEnlatado';
import { db } from '@/lib/firebase';
import { useStaffAuth } from '@/hooks/useStaffAuth';

export default function ProveedorDashboard() {
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
  const { user, userData } = useStaffAuth();

  const guardarEnFirebase = async (datos) => {
    if (!user || !userData) {
      alert("Error de sesión. Volvé a ingresar.");
      return;
    }
    try {
      const paqueteNuevo = {
        ...datos,
        proveedor_email: user.email,
        proveedor_nombre: userData.franquicia || user.email,
        timestamp: Date.now(),
        fecha_creacion: new Date().toLocaleDateString('es-AR'),
        estado: 'activo'
      };
      await db.collection('enlatados').add(paqueteNuevo);
      alert("✅ ¡Paquete guardado con éxito en la base de datos!");
      setMostrandoFormulario(false);
    } catch (error) {
      console.error("Error guardando en Firebase:", error);
      alert("❌ Hubo un error al guardar el paquete. Intentá de nuevo.");
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid #e5e7eb', paddingBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ color: '#11173d', margin: '0 0 5px 0', fontSize: '2.2rem', fontWeight: 800 }}>Mis Paquetes (Enlatados)</h1>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '1.1rem' }}>Acá podés gestionar exclusivamente tus viajes cargados.</p>
        </div>
        {!mostrandoFormulario && (
          <button 
            onClick={() => setMostrandoFormulario(true)}
            className="btn btn-primario"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '1.1rem' }}
          >
            ➕ Cargar Nuevo Paquete
          </button>
        )}
      </div>

      {mostrandoFormulario ? (
        <FormularioEnlatado 
          onCancel={() => setMostrandoFormulario(false)} 
          onSave={guardarEnFirebase} 
        />
      ) : (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '50px 20px', textAlign: 'center', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <p style={{ color: '#9ca3af', fontSize: '1.2rem', margin: 0 }}>
            Aún no tenés paquetes cargados. <br/>
            <strong style={{ color: '#11173d' }}>¡Hacé clic en el botón naranja para empezar!</strong>
          </p>
        </div>
      )}
    </div>
  );
}