'use client';
import { useState } from 'react';
import FormularioEnlatado from '@/components/proveedores/FormularioEnlatado';
import { db } from '@/lib/firebase'; // Tu conexión a Firebase
import { useStaffAuth } from '@/hooks/useStaffAuth'; // Para saber quién está logueado

export default function ProveedorDashboard() {
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
  const { user, userData } = useStaffAuth();

  const guardarEnFirebase = async (datos) => {
    // Escudo por si las dudas
    if (!user || !userData) {
      alert("Error de sesión. Volvé a ingresar.");
      return;
    }

    try {
      // 1. Armamos el paquete sumando los datos del proveedor y la fecha de creación
      const paqueteNuevo = {
        ...datos, // Todo lo que llenó en el formulario (destino, costos, fotos, etc.)
        proveedor_email: user.email,
        proveedor_nombre: userData.franquicia || user.email, // Usamos el campo franquicia/nombre
        timestamp: Date.now(),
        fecha_creacion: new Date().toLocaleDateString('es-AR'),
        estado: 'activo' // Podría ser 'pendiente' si querés revisarlos antes
      };

      // 2. Lo mandamos a una colección NUEVA de Firebase llamada "enlatados"
      await db.collection('enlatados').add(paqueteNuevo);
      
      alert("✅ ¡Paquete guardado con éxito en la base de datos!");
      setMostrandoFormulario(false);
      
      // Acá a futuro podemos hacer que se recargue la tabla para que lo vea publicado
    } catch (error) {
      console.error("Error guardando en Firebase:", error);
      alert("❌ Hubo un error al guardar el paquete. Intentá de nuevo.");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#11173d]">Mis Paquetes (Enlatados)</h1>
          <p className="text-gray-500 mt-1">Acá podés gestionar exclusivamente tus viajes cargados.</p>
        </div>
        {!mostrandoFormulario && (
          <button 
            onClick={() => setMostrandoFormulario(true)}
            className="bg-[#ef5a1a] hover:bg-[#d94e14] text-white px-6 py-2 rounded-lg font-bold shadow-md transition"
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-400">
          Aún no tenés paquetes cargados. ¡Hacé clic en el botón naranja para empezar!
          {/* En el futuro acá irá la tabla donde el proveedor ve sus paquetes */}
        </div>
      )}
    </div>
  );
}