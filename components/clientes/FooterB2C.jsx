const SERVICIOS = [
  '✈️ Vuelos Nacionales e Internacionales',
  '🏨 Hotelería',
  '🚗 Traslados Privados y Regulares',
  '🛡️ Asistencia al Viajero',
  '🚌 Paquetes en Bus',
  '🗺️ Circuitos Terrestres',
  '🚢 Cruceros',
  '🎟️ Entradas',
  '🗺️ Excursiones',
  '🎠 Parques Temáticos',
];

export default function FooterB2C() {
  return (
    <footer id="footer-servicios" className="footer-b2c">
      <div className="footer-b2c-content">
        <h4 className="footer-title">Nuestros Servicios</h4>

        <ul className="lista-servicios-unificada">
          {SERVICIOS.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>

        <div className="footer-logo-col">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Feliz Viaje" style={{ maxHeight: '60px', marginBottom: '10px' }} />
          <p style={{ color: '#555', fontSize: '0.95em', margin: 0, lineHeight: 1.4 }}>
            ¿No encontrás lo que estas buscando?
            <br />
            ¡Nuestro asesor tiene una promo para vos!
          </p>
        </div>
      </div>
      <div className="footer-bottom">© 2026 Feliz Viaje. Todos los derechos reservados.</div>
    </footer>
  );
}
