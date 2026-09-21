'use client';

export default function HeaderB2C({ titulo = 'Promociones' }) {
  const scrollToServicios = (e) => {
    e.preventDefault();
    document.getElementById('footer-servicios')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <style>{`
        .header-b2c-wrapper {
          position: relative;
          background: #fff;
          border-bottom: 1px solid #e5e7eb;
          padding: 15px 5%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 1000;
        }
        
        .titulo-dinamico {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          margin: 0;
          white-space: nowrap;
          color: #ef5a1a;
        }

        .links-derecha {
          display: flex;
          gap: 15px;
          align-items: center;
        }

        /* --- MODO CELULAR --- */
        @media (max-width: 768px) {
          .header-b2c-wrapper {
            flex-direction: column;
            padding: 15px;
            gap: 15px;
          }
          .titulo-dinamico {
            position: relative;
            left: 0;
            top: 0;
            transform: none;
            text-align: center;
            white-space: normal;
            font-size: 1.8rem;
          }
          .links-derecha {
            justify-content: center;
            font-size: 0.85rem;
          }
        }
      `}</style>

      <div className="header-b2c-wrapper">
        <div className="logo-container">
          <a href="/clientes">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Feliz Viaje"
              className="logo-img"
              style={{ maxHeight: '60px', width: 'auto', cursor: 'pointer' }}
            />
          </a>
        </div>

        <h1 className="titulo-dinamico">
          {titulo}
        </h1>

        <div className="links-derecha">
          <a
            href="https://www.google.com/maps/d/u/0/viewer?ll=-29.80567022174473%2C-62.01399203410176&z=6&mid=1sIKByAEAd5L0_TuVSCfG9puc2pFPv1I"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#11173d', fontWeight: 'bold', textDecoration: 'none' }}
          >
            📍 + 25 Sucursales
          </a>
          <span style={{ color: '#d1d5db' }}>|</span>
          <a href="#footer-servicios" onClick={scrollToServicios} style={{ color: '#11173d', fontWeight: 'bold', textDecoration: 'none' }}>
            🧳 Conocé nuestros servicios
          </a>
        </div>
      </div>
    </>
  );
}