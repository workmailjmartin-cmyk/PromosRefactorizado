'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffAuth } from '@/hooks/useStaffAuth';

export default function ProveedorLayout({ children }) {
  // Usamos los nombres exactos de tu sistema (status, currentUser, userData y logout)
  const { status, currentUser, userData, logout } = useStaffAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Si todavía está procesando el login, no hacemos nada, solo esperamos.
    if (status === 'loading') return;

    // Si no está logueado o tiene otro rol, lo pateamos a la raíz
    if (status === 'logged-out' || (status === 'logged-in' && userData?.rol !== 'proveedor')) {
      router.push('/');
    } 
    // Si está logueado y es proveedor, le abrimos la puerta
    else if (status === 'logged-in' && userData?.rol === 'proveedor') {
      setIsAuthorized(true);
    }
  }, [status, userData, router]);

  // Pantalla de carga mientras piensa
  if (status === 'loading' || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl font-bold text-[#11173d] bg-gray-50">
        Cargando portal... ⏳
      </div>
    );
  }

  // Si pasó el control, le mostramos su layout exclusivo
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header exclusivo para el proveedor */}
      <header className="bg-[#11173d] text-white p-4 px-6 flex justify-between items-center shadow-md">
        <div className="font-bold text-xl flex items-center gap-2">
          ✈️ Portal de Mayoristas
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-bold text-[#ef5a1a]">{userData?.franquicia || 'Proveedor'}</div>
            <div className="text-xs text-gray-400">{currentUser?.email}</div>
          </div>
          <button 
            onClick={() => {
              logout();
              router.push('/'); // Lo mandamos afuera tras cerrar sesión
            }}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm"
          >
            Salir
          </button>
        </div>
      </header>

      {/* Acá adentro se dibuja tu FormularioEnlatado */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}