'use client';

export default function BasePasajerosToggle({ value, onChange }) {
  const es4 = parseInt(value) === 4;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <label style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '0.85em', textAlign: 'center' }}>Base de Cotización</label>
      <div
        style={{ position: 'relative', display: 'inline-flex', background: 'rgba(0,0,0,0.25)', borderRadius: '40px', width: '150px', height: '50px', alignItems: 'center', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}
        onClick={() => onChange(es4 ? 2 : 4)}
      >
        <div
          style={{
            position: 'absolute', left: es4 ? '75px' : '4px', width: '71px', height: '42px', background: '#ef5a1a', borderRadius: '30px',
            transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)', boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
          }}
        />
        <div style={{ flex: 1, textAlign: 'center', zIndex: 1, fontSize: '1.6em', transition: '0.3s', filter: es4 ? 'grayscale(100%)' : 'drop-shadow(0px 1px 2px rgba(0,0,0,0.4))', opacity: es4 ? 0.3 : 1 }}>
          👥
        </div>
        <div style={{ flex: 1, textAlign: 'center', zIndex: 1, fontSize: '1.6em', transition: '0.3s', paddingTop: '2px', filter: es4 ? 'drop-shadow(0px 1px 2px rgba(0,0,0,0.4))' : 'grayscale(100%)', opacity: es4 ? 1 : 0.3 }}>
          👥👥
        </div>
      </div>
    </div>
  );
}
