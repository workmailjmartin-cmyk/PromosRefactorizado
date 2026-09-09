'use client';

import { useEffect, useState } from 'react';

const SLOT_VACIO = { paquete_id: '', imagen_id: '' };

export default function VidrieraManager({ vidriera, bancoImagenes, uniquePackages, onGuardarVidriera, onAgregarImagen, onBorrarImagen }) {
  const [slots, setSlots] = useState([SLOT_VACIO, SLOT_VACIO, SLOT_VACIO, SLOT_VACIO]);
  const [nuevaImgNombre, setNuevaImgNombre] = useState('');
  const [nuevaImgUrl, setNuevaImgUrl] = useState('');

  useEffect(() => {
    const base = [0, 1, 2, 3].map((i) => vidriera[i] || SLOT_VACIO);
    setSlots(base);
  }, [vidriera]);

  const actualizarSlot = (index, patch) => setSlots((s) => s.map((slot, i) => (i === index ? { ...slot, ...patch } : slot)));

  const paquetesDestacables = uniquePackages.filter((pkg) => pkg.status === 'approved' && !pkg.ocultar_cliente);

  const handleAgregarImagen = async () => {
    const ok = await onAgregarImagen({ nombre: nuevaImgNombre, url: nuevaImgUrl });
    if (ok) {
      setNuevaImgNombre('');
      setNuevaImgUrl('');
    }
  };

  return (
    <>
      <div id="panel-vidriera-b2c" style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginTop: '30px', border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h3 style={{ margin: 0, color: '#11173d', fontSize: '1.5em' }}>🖼️ Vidriera Web (Top 4)</h3>
            <p style={{ margin: '5px 0 0 0', color: '#6b7280', fontSize: '0.9em' }}>Elegí qué 4 paquetes querés destacar con imágenes en la web de clientes.</p>
          </div>
          <button onClick={() => onGuardarVidriera(slots)} className="btn btn-primario" style={{ background: '#25d366', padding: '10px 20px', fontWeight: 'bold', borderRadius: '8px' }}>
            💾 Guardar Vidriera
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          {slots.map((slot, i) => {
            const imgUrl = bancoImagenes.find((img) => img.id === slot.imagen_id)?.url || '';
            return (
              <div key={i} style={{ border: '2px dashed #ccc', borderRadius: '8px', padding: '15px', background: '#f9fafb' }}>
                <div style={{ fontWeight: 900, color: '#11173d', marginBottom: '12px', fontSize: '1.1em' }}>Posición {i + 1}</div>

                <label style={{ fontSize: '0.8em', fontWeight: 'bold', color: '#555' }}>Paquete a destacar:</label>
                <select value={slot.paquete_id} onChange={(e) => actualizarSlot(i, { paquete_id: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '6px', background: 'white' }}>
                  <option value="">-- Vacío (No mostrar) --</option>
                  {paquetesDestacables.map((pkg) => (
                    <option key={pkg.id_paquete} value={pkg.id_paquete}>
                      {pkg.destino} (${pkg.tarifa})
                    </option>
                  ))}
                </select>

                <label style={{ fontSize: '0.8em', fontWeight: 'bold', color: '#555' }}>Fondo:</label>
                <select value={slot.imagen_id} onChange={(e) => actualizarSlot(i, { imagen_id: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '6px', background: 'white' }}>
                  <option value="">-- Seleccionar Fondo --</option>
                  {bancoImagenes.map((img) => (
                    <option key={img.id} value={img.id}>
                      {img.nombre}
                    </option>
                  ))}
                </select>

                <div style={{ height: '120px', width: '100%', borderRadius: '6px', overflow: 'hidden', border: '1px solid #ddd', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {imgUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imgUrl}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <span style={{ color: '#999', fontWeight: 'bold', fontSize: '0.9em' }}>Elegí un fondo</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <hr style={{ margin: '30px 0', border: 0, borderTop: '2px solid #e5e7eb' }} />

      <div id="banco-enlaces-container">
        <div style={{ marginBottom: '15px' }}>
          <h3 style={{ margin: 0, color: '#11173d', fontSize: '1.4em' }}>🔗 Mi Banco de Enlaces (WordPress)</h3>
          <p style={{ margin: '5px 0 0 0', color: '#6b7280', fontSize: '0.9em' }}>Pegá acá los links de las imágenes que subiste a tu WordPress (Máximo 50).</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '25px', background: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px dashed #ccc' }}>
          <input type="text" placeholder="Nombre (Ej: Playa Cancún)" value={nuevaImgNombre} onChange={(e) => setNuevaImgNombre(e.target.value)} style={{ flex: 1, minWidth: '150px', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px' }} />
          <input type="url" placeholder="Link de WordPress (Ej: https://...)" value={nuevaImgUrl} onChange={(e) => setNuevaImgUrl(e.target.value)} style={{ flex: 2, minWidth: '250px', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px' }} />
          <button onClick={handleAgregarImagen} className="btn btn-primario" style={{ background: '#2563eb', padding: '10px 20px' }}>
            ➕ Agregar Link
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px' }}>
          {bancoImagenes.length === 0 ? (
            <p style={{ color: '#999', fontSize: '0.85em', gridColumn: '1/-1' }}>Aún no agregaste enlaces.</p>
          ) : (
            bancoImagenes.map((img, index) => (
              <div key={img.id} style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', background: 'white', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: '100px', width: '100%', background: '#eee', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {img.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img.url}
                      alt={img.nombre}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <span style={{ color: '#999', fontSize: '0.8em' }}>Sin imagen</span>
                  )}
                </div>
                <div style={{ padding: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8em', fontWeight: 'bold', color: '#333', marginBottom: '5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={img.nombre}>
                    {img.nombre}
                  </div>
                  <button onClick={() => onBorrarImagen(index)} style={{ background: '#fce8e6', color: '#d93025', border: '1px solid #fad2cf', width: '100%', padding: '4px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8em', fontWeight: 'bold' }}>
                    🗑️ Borrar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
