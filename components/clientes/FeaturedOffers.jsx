'use client';

import { formatMoney, getNoches, getTarifaPorPersona, parseServicios } from '@/lib/packageUtils';
import { IMAGEN_PLACEHOLDER } from '@/lib/constants';

const NOMBRE_INCLUSION = {
  aereo: 'Vuelo',
  hotel: 'Hotel',
  traslado: 'Traslados',
  bus: 'Bus',
  crucero: 'Crucero',
};

function inclusionesTexto(servicios) {
  const nombres = (Array.isArray(servicios) ? servicios : [])
    .map((s) => {
      if (s.tipo === 'seguro' || s.asistencia) return 'Asistencia';
      return NOMBRE_INCLUSION[s.tipo] || '';
    })
    .filter(Boolean);
  const unicas = [...new Set(nombres)];
  return unicas.length > 0 ? `Incluye: ${unicas.join(' + ')}` : 'Servicios incluidos';
}

function mesDeSalida(pkg) {
  if (!pkg.fecha_salida) return 'VARIAS FECHAS';
  const p = pkg.fecha_salida.split('-');
  if (p.length !== 3) return 'VARIAS FECHAS';
  const d = new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]));
  return d.toLocaleString('es-ES', { month: 'long' }).toUpperCase();
}

function OfertaCard({ pkg, imagenIdFondo, bancoImagenes, onSelect }) {
  const noches = getNoches(pkg);
  const { tarifaPorPersona } = getTarifaPorPersona(pkg);
  const servicios = parseServicios(pkg);
  const imgFondo = bancoImagenes.find((img) => img.id === imagenIdFondo)?.url || IMAGEN_PLACEHOLDER;
  const lugarSalida = pkg.salida ? `saliendo desde ${pkg.salida}` : '';

  return (
    <div
      style={{
        background: 'white', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', transition: 'box-shadow 0.3s', height: '100%',
      }}
      onMouseOver={(e) => (e.currentTarget.style.boxShadow = '0 10px 15px rgba(0,0,0,0.1)')}
      onMouseOut={(e) => (e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)')}
    >
      <div style={{ height: '170px', overflow: 'hidden', position: 'relative', background: '#eee' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgFondo}
          alt={pkg.destino}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
          onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <div style={{ fontSize: '0.65em', color: '#6b7280', fontWeight: 800, letterSpacing: '0.5px', marginBottom: '8px' }}>
          {noches > 0 ? `${noches} NOCHES` : 'PAQUETE'} - {mesDeSalida(pkg)}
        </div>
        <h3 style={{ fontSize: '1.1em', fontWeight: 800, color: '#11173d', margin: '0 0 12px 0', lineHeight: 1.3, textTransform: 'uppercase' }}>
          {pkg.destino} {noches > 0 ? `${noches} NOCHES` : ''} {lugarSalida}
        </h3>
        <p style={{ fontSize: '0.8em', color: '#4b5563', margin: '0 0 20px 0', fontWeight: 500 }}>{inclusionesTexto(servicios)}</p>

        <div style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid #f3f4f6' }}>
          <div style={{ fontSize: '0.75em', color: '#6b7280', fontWeight: 500, marginBottom: '2px' }}>Precio por persona</div>
          <div style={{ fontSize: '1.4em', fontWeight: 900, color: '#11173d', marginBottom: '15px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '0.7em' }}>{pkg.moneda || 'USD'}</span> {formatMoney(tarifaPorPersona)}
          </div>
          <button
            className="btn-oferta"
            style={{ width: '100%', background: '#ef5a1a', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95em' }}
            onClick={() => onSelect(pkg)}
          >
            Ver paquete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FeaturedOffers({ vidriera, allPackages, bancoImagenes, onSelect }) {
  const paquetesVidriera = (vidriera || [])
    .filter((slot) => slot.paquete_id)
    .map((slot) => {
      const pkg = allPackages.find((p) => p.id_paquete === slot.paquete_id || p.id === slot.paquete_id);
      return pkg ? { pkg, imagenIdFondo: slot.imagen_id } : null;
    })
    .filter(Boolean);

  if (paquetesVidriera.length === 0) return null;

  return (
    <div id="wrapper-ofertas-destacadas">
      <div style={{ textAlign: 'center', marginBottom: '25px', marginTop: '20px' }}>
        <h2 style={{ fontSize: '2.2em', fontWeight: 900, color: '#11173d', margin: '0 0 5px 0' }}>Ofertas Destacadas ✈️</h2>
        <p style={{ color: '#6b7280', margin: 0, fontSize: '1.1em' }}>Nuestras recomendaciones para vos</p>
      </div>
      <div id="grid-ofertas" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '50px' }}>
        {paquetesVidriera.map(({ pkg, imagenIdFondo }) => (
          <OfertaCard
            key={pkg.id_paquete}
            pkg={pkg}
            imagenIdFondo={imagenIdFondo}
            bancoImagenes={bancoImagenes}
            onSelect={onSelect}
          />
        ))}
      </div>
      <div style={{ textAlign: 'center', marginBottom: '25px', borderTop: '1px solid #eee', paddingTop: '30px' }}>
        <h2 style={{ fontSize: '2em', fontWeight: 900, color: '#11173d', margin: 0 }}>Conoce todas nuestras promociones:</h2>
      </div>
    </div>
  );
}
