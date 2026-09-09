import { Fragment } from 'react';
import { formatDateAR, formatEscalasTexto } from '@/lib/packageUtils';

function ServicioWrapper({ icon, titulo, mutedText, children }) {
  return (
    <div style={{ marginBottom: '5px', borderLeft: '3px solid #ddd', paddingLeft: '10px' }}>
      <div style={{ fontWeight: 'bold', color: '#11173d' }}>
        {icon} {titulo}
      </div>
      <div style={{ fontSize: '0.9em', color: mutedText ? '#555' : undefined }}>
        <Lines items={children} />
      </div>
    </div>
  );
}

// Equivalente a l.join('<br>') del original: separa cada línea con un <br/>.
function Lines({ items }) {
  const filtradas = (items || []).filter((item) => item !== false && item !== null && item !== undefined);
  return filtradas.map((item, i) => (
    <Fragment key={i}>
      {item}
      {i < filtradas.length - 1 && <br />}
    </Fragment>
  ));
}

function ServicioItem({ x, idx, mutedText }) {
  switch (x.tipo) {
    case 'aereo': {
      const eIda = x.escalas_ida !== undefined ? parseInt(x.escalas_ida) : parseInt(x.escalas) || 0;
      const eVuelta = x.escalas_vuelta !== undefined ? parseInt(x.escalas_vuelta) : parseInt(x.escalas) || 0;
      const escalasTxt = eIda === eVuelta ? (
        formatEscalasTexto(eIda)
      ) : (
        <>
          <b>IDA:</b> {formatEscalasTexto(eIda)} | <b>REG:</b> {formatEscalasTexto(eVuelta)}
        </>
      );
      return (
        <ServicioWrapper icon="✈️" titulo="AÉREO" mutedText={mutedText}>
          {[
            x.aeropuerto_salida && (
              <>
                🛫 <b>Salida desde:</b> {x.aeropuerto_salida}
              </>
            ),
            <b key="aerolinea">{x.aerolinea}</b>,
            <Fragment key="fechas">
              {formatDateAR(x.fecha_aereo)}
              {x.fecha_regreso ? ` - ${formatDateAR(x.fecha_regreso)}` : ''}
            </Fragment>,
            <Fragment key="escalas">
              🔄 {escalasTxt} | 🧳 {x.tipo_equipaje || '-'}
            </Fragment>,
          ]}
        </ServicioWrapper>
      );
    }

    case 'hotel': {
      let stars = '';
      if (x.hotel_estrellas) for (let k = 0; k < x.hotel_estrellas; k++) stars += '⭐';
      const det = [];
      if (x.noches) det.push(`🌙 ${x.noches} Noches`);
      if (x.checkin) det.push(`Ingreso: ${formatDateAR(x.checkin)}`);
      return (
        <ServicioWrapper icon="🏨" titulo="HOTEL" mutedText={mutedText}>
          {[
            <Fragment key="nombre">
              <b>{x.hotel_nombre}</b> <span style={{ color: '#ef5a1a' }}>{stars}</span>
            </Fragment>,
            `(${x.regimen})`,
            det.length > 0 && <small>{det.join(' | ')}</small>,
            x.hotel_link && (
              <a
                href={x.hotel_link}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#ef5a1a', textDecoration: 'none', fontWeight: 'bold' }}
              >
                📍 Ver Ubicación
              </a>
            ),
          ]}
        </ServicioWrapper>
      );
    }

    case 'traslado':
      return (
        <ServicioWrapper icon="🚕" titulo="TRASLADO" mutedText={mutedText}>
          {[x.tipo_trf]}
        </ServicioWrapper>
      );

    case 'seguro':
      return (
        <ServicioWrapper icon="🛡️" titulo="SEGURO" mutedText={mutedText}>
          {[x.cobertura]}
        </ServicioWrapper>
      );

    case 'adicional':
      return (
        <ServicioWrapper icon="➕" titulo="ADICIONAL" mutedText={mutedText}>
          {[x.descripcion]}
        </ServicioWrapper>
      );

    case 'bus': {
      const infoComidaExtra =
        x.regimen === 'Media Pensión' || x.regimen === 'Pensión Completa'
          ? x.bebidas === 'Si'
            ? <span style={{ color: '#2ecc71', fontWeight: 'bold' }}> (🥤 Con Bebidas)</span>
            : x.bebidas === 'No'
              ? <span style={{ color: '#e74c3c' }}> (🚫 Sin Bebidas)</span>
              : null
          : null;
      return (
        <ServicioWrapper icon="🚌" titulo="PAQUETE BUS" mutedText={mutedText}>
          {[
            x.bus_salida && (
              <>
                📍 <b>Salida desde:</b> {x.bus_salida}
              </>
            ),
            x.noches && (
              <>
                🌙 <b>{x.noches} Noches</b>
              </>
            ),
            x.incluye_alojamiento && (
              <>
                🏨 <b>Hotel:</b> {x.hotel_nombre || 'A confirmar'}
              </>
            ),
            x.incluye_alojamiento && x.hotel_ubicacion && (
              <a
                href={x.hotel_ubicacion}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#ef5a1a', textDecoration: 'none', fontWeight: 'bold', display: 'inline-block', marginTop: '2px' }}
              >
                📍 Ver Ubicación
              </a>
            ),
            x.incluye_alojamiento && (
              <>
                🍽 <b>Régimen:</b> {x.regimen || ''}
                {infoComidaExtra}
              </>
            ),
            x.incluye_excursiones && (
              <>
                🌲 <b>Excursiones:</b> {x.excursion_adicional || 'Incluidas'}
              </>
            ),
            x.asistencia && (
              <>
                🚑 <b>Asistencia al Viajero:</b> Incluida
              </>
            ),
            x.observaciones && (
              <>
                📝 <i>Nota: {x.observaciones}</i>
              </>
            ),
          ]}
        </ServicioWrapper>
      );
    }

    case 'crucero': {
      const det = [];
      if (x.checkin) det.push(`Embarque: ${formatDateAR(x.checkin)}`);
      if (x.crucero_noches) det.push(`🌙 ${x.crucero_noches} Noches`);
      return (
        <ServicioWrapper icon="🚢" titulo="CRUCERO" mutedText={mutedText}>
          {[
            <Fragment key="naviera">
              <b>Naviera:</b> {x.crucero_naviera}
            </Fragment>,
            x.crucero_puerto_salida && (
              <>
                📍 <b>Puerto de Salida:</b> {x.crucero_puerto_salida}
              </>
            ),
            det.length > 0 && <small>{det.join(' | ')}</small>,
            x.crucero_paradas && (
              <>
                🗺️ <b>Recorrido:</b>
                <br />
                <span style={{ whiteSpace: 'pre-wrap', marginTop: '4px', display: 'inline-block' }}>{x.crucero_paradas}</span>
              </>
            ),
            <div key="incluye" style={{ marginTop: '5px' }}>
              <b>Incluye:</b>
              <br />
              <span style={{ color: '#2ecc71' }}>✓ Pensión Completa</span>
              <br />
              <span style={{ color: '#2ecc71' }}>✓ Asistencia al Viajero</span>
              {x.crucero_bebidas && (
                <>
                  <br />
                  <span style={{ color: '#2ecc71' }}>✓ Paquete de Bebidas</span>
                </>
              )}
              {x.crucero_propinas && (
                <>
                  <br />
                  <span style={{ color: '#2ecc71' }}>✓ Propinas Incluidas</span>
                </>
              )}
            </div>,
          ]}
        </ServicioWrapper>
      );
    }

    case 'circuito': {
      const det = [];
      if (x.checkin) det.push(`Inicio: ${formatDateAR(x.checkin)}`);
      if (x.checkout) det.push(`Fin: ${formatDateAR(x.checkout)}`);
      if (x.circuito_noches) det.push(`🌙 ${x.circuito_noches} Noches`);
      return (
        <ServicioWrapper icon="🗺️" titulo="CIRCUITO TERRESTRE" mutedText={mutedText}>
          {[
            <b key="nombre">{x.circuito_nombre}</b>,
            x.circuito_salida && (
              <>
                📍 <b>Salida desde:</b> {x.circuito_salida}
              </>
            ),
            det.length > 0 && <small>{det.join(' | ')}</small>,
            x.circuito_descripcion && (
              <div style={{ marginTop: '5px', color: '#555' }}>
                📝 <i style={{ whiteSpace: 'pre-line' }}>{x.circuito_descripcion}</i>
              </div>
            ),
          ]}
        </ServicioWrapper>
      );
    }

    default:
      return <ServicioWrapper icon="🔹" titulo="" mutedText={mutedText} />;
  }
}

// Reemplaza renderServiciosClienteHTML(rawJson). Recibe el array ya parseado.
export default function ItinerarioServicios({ servicios, mutedText = true }) {
  if (!Array.isArray(servicios) || servicios.length === 0) return <p>-</p>;
  return (
    <>
      {servicios.map((x, idx) => (
        <ServicioItem key={idx} x={x} idx={idx} mutedText={mutedText} />
      ))}
    </>
  );
}
