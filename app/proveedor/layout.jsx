'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import Loader from '@/components/shared/Loader';

export default function ProveedorLayout({ children }) {
  const { status, currentUser, userData, logout } = useStaffAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'logged-out' || (status === 'logged-in' && userData?.rol !== 'proveedor')) {
      router.push('/');
    } else if (status === 'logged-in' && userData?.rol === 'proveedor') {
      setIsAuthorized(true);
    }
  }, [status, userData, router]);

  if (status === 'loading' || !isAuthorized) {
    return <Loader visible={true} text="Cargando portal..." />;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column' }}>
      {/* HEADER IDÉNTICO AL PANEL INTERNO */}
      <header className="main-header" style={{ position: 'relative', zIndex: 10 }}>
        <div className="header-content" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          
          {/* Logo clickeable que recarga el portal */}
          <div 
            className="logo" 
            onClick={() => window.location.href = '/proveedor'}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px' }}
            title="Descartar cambios y volver al inicio"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Logo Feliz Viaje" id="app-logo" />
            <span style={{ color: '#11173d', fontWeight: 800, fontSize: '1.3rem', borderLeft: '2px solid #e5e7eb', paddingLeft: '15px' }}>
              Portal de Mayoristas
            </span>
          </div>

          <div className="user-info">
            <span id="user-email" style={{ textAlign: 'right' }}>
              <b style={{ color: '#ef5a1a' }}>{userData?.franquicia || 'Proveedor'}</b>
              <br />
              <small style={{ color: '#6b7280' }}>{currentUser?.email}</small>
            </span>
            <button className="Btn" id="logout-button" onClick={() => { logout(); router.push('/'); }}>
              <div className="sign">
                <svg viewBox="0 0 512 512">
                  <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z" />
                </svg>
              </div>
              <div className="text">Salir</div>
            </button>
          </div>

        </div>
      </header>

      <main style={{ flex: 1, padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {children}
      </main>
    </div>
  );
}