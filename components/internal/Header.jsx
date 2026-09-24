'use client';

import { useState } from 'react';

const NAV_ITEMS = [
  { key: 'search', label: '🔥 Promociones' },
  { key: 'enlatados', label: '✈️ Grupales y Enlatados' }, 
  { key: 'users', label: '⚙️ Configuración', soloGestor: true },
  { key: 'marketing', label: '📋 Calendario de Contenidos', sub: 'Marketing' },
  { key: 'agentes', label: '🌟 Calendario @viajafelizcon', sub: 'Entorno Digital' },
];

export default function Header({ userData, esGestor, currentView, onNavigate, onLogoClick, onLogout }) {
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const nombreMostrar = userData?.franquicia || userData?.email;

  const handleItemClick = (key) => {
    onNavigate(key);
    setDrawerAbierto(false); // Cierra el menú al hacer clic en una sección
  };

  return (
    <>
      <header className="main-header">
        <div className="header-content">
          
          {/* Botón Hamburguesa (Solo visible en celular) */}
          <button 
            className="mobile-hamburger-btn" 
            onClick={() => setDrawerAbierto(true)}
            aria-label="Abrir menú"
          >
            ☰
          </button>

          {/* Logo */}
          <div className="logo" title="Recargar página">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Logo Feliz Viaje" id="app-logo" onClick={onLogoClick} style={{ cursor: 'pointer' }} />
          </div>

          {/* Navegación Desktop (Oculta en celular) */}
          <nav className="app-nav desktop-nav">
            {NAV_ITEMS.filter((item) => !item.soloGestor || esGestor).map((item) => (
              <button
                key={item.key}
                className={`nav-button${currentView === item.key ? ' active' : ''}`}
                style={{ position: item.sub ? 'relative' : undefined, margin: 0, paddingBottom: '4px', whiteSpace: 'nowrap', fontSize: '0.9em' }}
                onClick={() => onNavigate(item.key)}
              >
                {item.label}
                {item.sub && (
                  <span style={{ position: 'absolute', top: '100%', left: 0, width: '100%', textAlign: 'center', fontSize: '0.65em', fontWeight: 400, opacity: 0.8, marginTop: '-12px' }}>
                    {item.sub}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Info Usuario Desktop (Oculta en celular) */}
          <div className="user-info desktop-user-info">
            <span id="user-email">
              <b>{nombreMostrar}</b>
              <br />
              <small>{(userData?.rol || '').toUpperCase()}</small>
            </span>
            <button className="Btn" id="logout-button" onClick={onLogout}>
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

      {/* ================= MENÚ LATERAL (DRAWER MÓVIL) ================= */}
      {drawerAbierto && (
        <div className="mobile-drawer-overlay" onClick={() => setDrawerAbierto(false)}></div>
      )}

      <aside className={`mobile-drawer ${drawerAbierto ? 'abierto' : ''}`}>
        <div className="drawer-header">
          <div className="drawer-user-card">
            <div className="user-avatar">👤</div>
            <div>
              <div className="user-name">{nombreMostrar}</div>
              <span className="user-role-badge">{(userData?.rol || '').toUpperCase()}</span>
            </div>
          </div>
          <button className="drawer-close-btn" onClick={() => setDrawerAbierto(false)}>✕</button>
        </div>

        <nav className="drawer-nav-list">
          {NAV_ITEMS.filter((item) => !item.soloGestor || esGestor).map((item) => (
            <button
              key={item.key}
              className={`drawer-nav-item ${currentView === item.key ? 'activo' : ''}`}
              onClick={() => handleItemClick(item.key)}
            >
              <div className="drawer-nav-label">{item.label}</div>
              {item.sub && <div className="drawer-nav-sub">{item.sub}</div>}
            </button>
          ))}
        </nav>

        <div className="drawer-footer">
          <button className="drawer-logout-btn" onClick={() => { setDrawerAbierto(false); onLogout(); }}>
            🚪 Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ================= ESTILOS RESPONSIVE DEL HEADER ================= */}
      <style dangerouslySetInnerHTML={{__html: `
        .mobile-hamburger-btn { display: none; background: none; border: none; font-size: 1.8rem; color: #11173d; cursor: pointer; padding: 5px; }
        .desktop-nav { display: flex; flex: 1; align-items: center; justify-content: center; gap: 15px; }
        .desktop-user-info { display: flex; align-items: center; }

        /* Estilos del Menú Lateral Mobile */
        .mobile-drawer-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(2px);
          z-index: 9998;
        }

        .mobile-drawer {
          position: fixed; top: 0; left: 0; bottom: 0;
          width: 290px;
          background: #ffffff;
          box-shadow: 4px 0 25px rgba(0,0,0,0.15);
          z-index: 9999;
          display: flex; flex-direction: column;
          transform: translateX(-100%);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .mobile-drawer.abierto {
          transform: translateX(0);
        }

        .drawer-header {
          padding: 20px 16px;
          background: #11173d;
          color: #fff;
          display: flex; justify-content: space-between; align-items: center;
        }

        .drawer-user-card { display: flex; align-items: center; gap: 12px; }
        .user-avatar { width: 38px; height: 38px; border-radius: 50%; background: rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; font-size: 1.1rem; }
        .user-name { font-weight: bold; font-size: 0.95rem; line-height: 1.2; max-width: 170px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .user-role-badge { font-size: 0.65rem; background: #ef5a1a; padding: 2px 7px; border-radius: 8px; font-weight: bold; }
        .drawer-close-btn { background: none; border: none; color: #fff; font-size: 1.3rem; cursor: pointer; padding: 4px; }

        .drawer-nav-list { flex: 1; overflow-y: auto; padding: 15px 12px; display: flex; flex-direction: column; gap: 8px; }
        .drawer-nav-item {
          display: flex; flex-direction: column; align-items: flex-start;
          width: 100%; padding: 12px 14px; border-radius: 10px;
          border: 1px solid transparent; background: #f8fafc;
          cursor: pointer; text-align: left; transition: all 0.2s;
        }
        .drawer-nav-item.activo { background: #e0f2fe; border-color: #bae6fd; }
        .drawer-nav-label { font-weight: bold; color: #11173d; font-size: 0.92rem; }
        .drawer-nav-item.activo .drawer-nav-label { color: #0284c7; }
        .drawer-nav-sub { font-size: 0.72rem; color: #64748b; margin-top: 2px; }

        .drawer-footer { padding: 16px; border-top: 1px solid #e2e8f0; }
        .drawer-logout-btn {
          width: 100%; padding: 12px; background: #fee2e2; color: #dc2626;
          border: none; border-radius: 8px; font-weight: bold; font-size: 0.9rem; cursor: pointer;
        }

        /* MEDIA QUERY PARA CELULARES */
        @media (max-width: 768px) {
          .desktop-nav, .desktop-user-info { display: none !important; }
          .mobile-hamburger-btn { display: block !important; }
          .header-content {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            padding: 8px 12px !important;
            width: 100% !important;
          }
          .main-header .logo img { max-height: 42px; }
        }
      `}} />
    </>
  );
}