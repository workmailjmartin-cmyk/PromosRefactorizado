'use client';

export default function HeaderB2C() {
  const scrollToServicios = (e) => {
    e.preventDefault();
    document.getElementById('footer-servicios')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="header-b2c" style={{ position: 'relative' }}>
      <div className="logo-container">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Feliz Viaje"
          className="logo-img"
          style={{ maxHeight: '70px', width: 'auto', cursor: 'pointer' }}
          onClick={() => window.location.reload()}
        />
      </div>

      <h1
        className="titulo-promos"
        style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', margin: 0, whiteSpace: 'nowrap' }}
      >
        Promociones
      </h1>

      <div className="header-spacer header-links-container">
        <a
          href="https://www.google.com/maps/d/u/0/viewer?ll=-29.80567022174473%2C-62.01399203410176&z=6&mid=1sIKByAEAd5L0_TuVSCfG9puc2pFPv1I"
          target="_blank"
          rel="noopener noreferrer"
          className="header-link-item"
        >
          📍 + 25 Sucursales
        </a>
        <span className="header-link-separator">|</span>
        <a href="#footer-servicios" className="header-link-item" onClick={scrollToServicios}>
          🧳 Conocé nuestros servicios
        </a>
      </div>
    </div>
  );
}
