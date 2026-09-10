'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffAuth } from '@/hooks/useStaffAuth'; // Usamos tu hook de permisos actual

export default function ProveedorLayout({ children }) {
  const { user, userData, loading } = useStaffAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      // Si no está logueado o su rol no es proveedor, lo pateamos sin piedad
      if (!user || !userData || userData.rol !== 'proveedor') {
        router.push('/'); // Lo mandamos al login interno
      } else {
        setIsAuthorized(true);
      }
    }
  }, [user, userData, loading, router]);

  if (loading || !isAuthorized) {
    return <div className="min-h-screen flex items-center justify-center">Cargando portal... ⏳</div>;
  }

  // Si pasó el control, le mostramos su layout exclusivo
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header exclusivo para el proveedor (No ve tus cosas de agencia) */}
      <header className="bg-[#11173d] text-white p-4 flex justify-between items-center shadow-md">
        <div className="font-bold text-xl">📦 Portal de Proveedores</div>
        <div className="flex items-center gap-4">
          <span className="text-sm opacity-80">{userData.email}</span>
          {/* Botón de salir (podés conectar tu función de logout acá) */}
          <button className="bg-red-500 hover:bg-red-600 px-4 py-1 rounded text-sm font-bold transition">
            Salir
          </button>
        </div>
      </header>

      {/* Acá adentro se va a dibujar la página del proveedor */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}