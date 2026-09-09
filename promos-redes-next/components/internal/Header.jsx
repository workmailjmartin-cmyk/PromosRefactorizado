'use client';

const NAV_ITEMS = [
  { key: 'search', label: '🔥 Promociones' },
  // "Cargar" (nav-upload) existe en el código original pero el botón siempre
  // tenía display:none y nada lo mostraba jamás — era HTML muerto. Se accede al
  // formulario de carga por las sub-pestañas "🔍 Buscar / ➕ Cargar" dentro de la
  // vista de búsqueda, no desde este menú. No se replica ese botón fantasma acá.
  { key: 'users', label: '⚙️ Configuración', soloGestor: true },
  { key: 'marketing', label: '📋 Calendario de Contenidos', sub: 'Marketing' },
  { key: 'agentes', label: '🌟 Calendario @viajafelizcon', sub: 'Entorno Digital' },
];

export default function Header({ userData, esGestor, currentView, onNavigate, onLogoClick, onLogout }) {
  const nombreMostrar = userData?.franquicia || userData?.email;

  return (
    <header className="main-header">
      <div className="header-content">
        <div className="logo" title="Recargar página">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Logo Feliz Viaje" id="app-logo" onClick={onLogoClick} style={{ cursor: 'pointer' }} />
        </div>

        <nav className="app-nav" style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', gap: '15px', flexWrap: 'nowrap', padding: '0 10px' }}>
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

        <div className="user-info">
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
  );
}
