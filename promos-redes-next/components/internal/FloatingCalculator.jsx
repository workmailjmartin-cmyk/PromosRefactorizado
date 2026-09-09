'use client';

import { useState } from 'react';
import { calcularVentaAgencia, formatMonedaCalc } from '@/lib/internal/calculadora';

export default function FloatingCalculator({ dbCalculadora }) {
  const [abierto, setAbierto] = useState(false);
  const [minimizado, setMinimizado] = useState(false);
  const [maximizado, setMaximizado] = useState(false);
  const [modo, setModo] = useState('individual'); // 'individual' | 'paquete'

  const [servicioId, setServicioId] = useState('');
  const [proveedorNombre, setProveedorNombre] = useState('');
  const [moneda, setMoneda] = useState('USD ');
  const [monto, setMonto] = useState('');

  const [resultado, setResultado] = useState(null);
  const [carrito, setCarrito] = useState([]);
  const [copiadoIndividual, setCopiadoIndividual] = useState(false);
  const [copiadoPaquete, setCopiadoPaquete] = useState(false);

  const srv = dbCalculadora.find((s) => s.id === servicioId);
  const proveedoresDisponibles = srv?.proveedores || [];

  const handleClose = () => {
    setAbierto(false);
    handleNueva();
    setMaximizado(false);
  };

  const handleServicioChange = (id) => {
    setServicioId(id);
    setProveedorNombre('');
    if (modo === 'individual') setResultado(null);
  };

  const handleCalcular = () => {
    if (!servicioId || !proveedorNombre || monto === '' || isNaN(parseFloat(monto))) {
      alert('Completá servicio, proveedor y monto.');
      return;
    }
    const provOriginal = srv.proveedores.find((p) => p.nombre === proveedorNombre);
    const provData = JSON.parse(JSON.stringify(provOriginal));

    // Lógica estricta de paquete: se fuerza el 18.5% si es markup.
    if (modo === 'paquete' && provData.tipo === 'markup') provData.tasa = 18.5;

    const res = calcularVentaAgencia(monto, provData);

    if (modo === 'individual') {
      setResultado(res);
    } else {
      setCarrito((c) => [...c, { id: Date.now(), servicioNombre: srv.nombre, provNombre: proveedorNombre, moneda, base: res.base, profit: res.profit, final: res.final, activo: true }]);
      setMonto('');
    }
  };

  const toggleItemPaquete = (id) => setCarrito((c) => c.map((it) => (it.id === id ? { ...it, activo: !it.activo } : it)));
  const borrarItemPaquete = (id) => setCarrito((c) => c.filter((it) => it.id !== id));

  const handleNueva = () => {
    setServicioId('');
    setProveedorNombre('');
    setMonto('');
    setResultado(null);
    setCarrito([]);
  };

  const copiarIndividual = () => {
    navigator.clipboard.writeText(resultado.final.toFixed(2)).then(() => {
      setCopiadoIndividual(true);
      setTimeout(() => setCopiadoIndividual(false), 2000);
    });
  };

  const totales = carrito.reduce(
    (acc, it) => (it.activo ? { base: acc.base + it.base, profit: acc.profit + it.profit, final: acc.final + it.final } : acc),
    { base: 0, profit: 0, final: 0 }
  );
  const monedaCarrito = carrito.length > 0 ? carrito[carrito.length - 1].moneda : 'USD ';

  const copiarTotalPaquete = () => {
    navigator.clipboard.writeText(totales.final.toFixed(2)).then(() => {
      setCopiadoPaquete(true);
      setTimeout(() => setCopiadoPaquete(false), 2000);
    });
  };

  const guardarResumenPaquete = () => {
    if (carrito.length === 0) {
      alert('El paquete está vacío');
      return;
    }
    let texto = '🌟 *RESUMEN DE COTIZACIÓN* 🌟\n\n';
    let totalGeneral = 0;
    let monedaActual = 'USD ';
    carrito.forEach((it) => {
      if (it.activo) {
        texto += `🔹 *${it.servicioNombre}*\n`;
        texto += `   Valor: ${it.moneda}${formatMonedaCalc(it.final)}\n\n`;
        totalGeneral += it.final;
        monedaActual = it.moneda;
      }
    });
    texto += `------------------------\n`;
    texto += `💰 *TOTAL FINAL: ${monedaActual}${formatMonedaCalc(totalGeneral)}*\n`;
    navigator.clipboard.writeText(texto);
  };

  const estilosPanel = maximizado
    ? { width: '600px', height: 'auto', maxHeight: '80vh', top: '50%', left: '50%', bottom: 'auto', right: 'auto', transform: 'translate(-50%, -50%)' }
    : { width: '350px', height: 'auto', maxHeight: 'calc(100vh - 120px)', top: 'auto', left: 'auto', bottom: '100px', right: '30px', transform: 'none' };

  return (
    <>
      <button
        title="Abrir Cotizador"
        onClick={() => setAbierto((v) => !v)}
        style={{ position: 'fixed', bottom: '30px', right: '30px', width: '65px', height: '65px', borderRadius: '50%', backgroundColor: '#11173d', border: '2px solid #ef5a1a', color: '#ef5a1a', boxShadow: '0 4px 15px rgba(17, 23, 61, 0.4)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
          <line x1="8" y1="6" x2="16" y2="6"></line>
          <line x1="16" y1="14" x2="16" y2="14.01"></line>
          <line x1="16" y1="10" x2="16" y2="10.01"></line>
          <line x1="16" y1="18" x2="16" y2="18.01"></line>
          <line x1="12" y1="14" x2="12" y2="14.01"></line>
          <line x1="12" y1="10" x2="12" y2="10.01"></line>
          <line x1="12" y1="18" x2="12" y2="18.01"></line>
          <line x1="8" y1="14" x2="8" y2="14.01"></line>
          <line x1="8" y1="10" x2="8" y2="10.01"></line>
          <line x1="8" y1="18" x2="8" y2="18.01"></line>
        </svg>
      </button>

      {maximizado && abierto && (
        <div style={{ display: 'block', position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(17, 23, 61, 0.6)', zIndex: 9997, backdropFilter: 'blur(3px)' }} />
      )}

      {abierto && (
        <div style={{ position: 'fixed', ...estilosPanel, background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 9998, display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
          <div style={{ background: '#11173d', color: 'white', padding: '12px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ef5a1a' }}>
            <h3 style={{ margin: 0, fontSize: '1em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                <line x1="8" y1="6" x2="16" y2="6"></line>
              </svg>
              Cotizador
            </h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setMinimizado((v) => !v)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
                _
              </button>
              <button onClick={() => setMaximizado((v) => !v)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                {maximizado ? '❐' : '⬜'}
              </button>
              <button onClick={handleClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                ✖
              </button>
            </div>
          </div>

          {!minimizado && (
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', background: '#e5e7eb', borderRadius: '8px', padding: '4px', marginBottom: '20px', border: '1px solid #e5e7eb' }}>
                  <button
                    type="button"
                    onClick={() => setModo('individual')}
                    style={{ flex: 1, border: 'none', background: modo === 'individual' ? 'white' : 'transparent', color: modo === 'individual' ? '#11173d' : '#6b7280', fontWeight: 'bold', padding: '8px', borderRadius: '6px', cursor: 'pointer', boxShadow: modo === 'individual' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                  >
                    Individual
                  </button>
                  <button
                    type="button"
                    onClick={() => setModo('paquete')}
                    style={{ flex: 1, border: 'none', background: modo === 'paquete' ? 'white' : 'transparent', color: modo === 'paquete' ? '#11173d' : '#6b7280', fontWeight: 'bold', padding: '8px', borderRadius: '6px', cursor: 'pointer', boxShadow: modo === 'paquete' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                  >
                    Paquete
                  </button>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ fontSize: '0.85em', fontWeight: 'bold', color: '#11173d' }}>Servicio</label>
                  <select value={servicioId} onChange={(e) => handleServicioChange(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb', marginTop: '5px' }}>
                    <option value="">Seleccionar Servicio...</option>
                    {dbCalculadora.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ fontSize: '0.85em', fontWeight: 'bold', color: '#11173d' }}>Proveedor</label>
                  <select value={proveedorNombre} onChange={(e) => setProveedorNombre(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb', marginTop: '5px' }}>
                    <option value="">{servicioId ? 'Seleccionar Proveedor...' : 'Seleccionar Servicio Primero...'}</option>
                    {proveedoresDisponibles.map((p) => (
                      <option key={p.nombre} value={p.nombre}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.85em', fontWeight: 'bold', color: '#11173d' }}>Moneda</label>
                    <select value={moneda} onChange={(e) => setMoneda(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb', marginTop: '5px' }}>
                      <option value="USD ">USD</option>
                      <option value="$">ARS ($)</option>
                    </select>
                  </div>
                  <div style={{ flex: 2 }}>
                    <label style={{ fontSize: '0.85em', fontWeight: 'bold', color: '#11173d' }}>Monto Base (Neto)</label>
                    <input type="number" placeholder="0.00" value={monto} onChange={(e) => setMonto(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb', marginTop: '5px', fontSize: '1.1em', boxSizing: 'border-box' }} />
                  </div>
                </div>

                <button onClick={handleCalcular} style={{ width: '100%', background: 'linear-gradient(135deg, #ef5a1a 0%, #ff7a3d 100%)', color: 'white', padding: '12px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {modo === 'individual' ? 'Calcular Venta' : '➕ Agregar al Paquete'}
                </button>
              </div>

              {modo === 'individual' && resultado && (
                <div style={{ background: '#f9fafb', padding: '20px', borderTop: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ color: '#6b7280', fontSize: '0.9em' }}>Rentabilidad:</span>
                    <span style={{ color: '#56DDE0', fontWeight: 'bold' }}>
                      {moneda}
                      {formatMonedaCalc(resultado.profit)} ({(resultado.profitRate * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #e5e7eb', marginBottom: '20px' }}>
                    <span style={{ color: '#11173d', fontWeight: 'bold', fontSize: '1.1em' }}>Total Venta:</span>
                    <span style={{ color: '#ef5a1a', fontWeight: 'bold', fontSize: '1.5em' }}>
                      {moneda}
                      {formatMonedaCalc(resultado.final)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={copiarIndividual} style={{ flex: 1, background: 'white', color: '#11173d', border: '1px solid #e5e7eb', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                      {copiadoIndividual ? '✅ Copiado' : '📋 Copiar'}
                    </button>
                    <button onClick={handleNueva} style={{ flex: 1, background: '#11173d', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                      🔄 Nueva
                    </button>
                  </div>
                </div>
              )}

              {modo === 'paquete' && (
                <div style={{ background: '#f9fafb', padding: '20px', borderTop: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <h4 style={{ margin: 0, color: '#11173d', fontSize: '0.95em', fontWeight: 'bold', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>Servicios del Presupuesto</h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {carrito.length === 0 ? (
                      <div style={{ color: '#999', fontSize: '0.85em', textAlign: 'center', padding: '10px' }}>El paquete está vacío.</div>
                    ) : (
                      carrito.map((it) => (
                        <div key={it.id} style={{ background: it.activo ? '#eefaf6' : '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: it.activo ? 1 : 0.5 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', color: it.activo ? '#11173d' : '#9ca3af', fontSize: '0.9em', marginBottom: '2px' }}>{it.servicioNombre}</div>
                            <div style={{ color: '#6b7280', fontSize: '0.75em', marginBottom: '5px' }}>{it.provNombre}</div>
                            <div style={{ fontSize: '0.75em', color: '#999' }}>
                              Base: {it.moneda}
                              {formatMonedaCalc(it.base)}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                            <div style={{ color: '#ef5a1a', fontWeight: 'bold', fontSize: '1.1em' }}>
                              {it.moneda}
                              {formatMonedaCalc(it.final)}
                            </div>
                            <div style={{ display: 'flex', gap: '5px' }}>
                              <button title="Pausar / Activar" onClick={() => toggleItemPaquete(it.id)} style={{ background: it.activo ? '#f39c12' : '#9ca3af', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8em' }}>
                                ⏸️
                              </button>
                              <button title="Eliminar" onClick={() => borrarItemPaquete(it.id)} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8em' }}>
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div style={{ background: 'linear-gradient(135deg, #ef5a1a 0%, #ff7a3d 100%)', borderRadius: '12px', padding: '18px', color: 'white', marginTop: '10px', boxShadow: '0 4px 12px rgba(239, 90, 26, 0.25)' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '1.1em', fontWeight: 'bold', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '8px' }}>Resumen Final</h4>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.15)', padding: '8px 12px', borderRadius: '8px', flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75em', fontWeight: 'bold', opacity: 0.85, marginBottom: '2px' }}>Monto Neto</div>
                        <div style={{ fontSize: '1.05em', fontWeight: 'bold' }}>
                          {monedaCarrito}
                          {formatMonedaCalc(totales.base)}
                        </div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.15)', padding: '8px 12px', borderRadius: '8px', flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75em', fontWeight: 'bold', opacity: 0.85, marginBottom: '2px' }}>Rentabilidad</div>
                        <div style={{ fontSize: '1.05em', fontWeight: 'bold', color: '#56DDE0' }}>
                          {monedaCarrito}
                          {formatMonedaCalc(totales.profit)}
                        </div>
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.15)', padding: '12px', borderRadius: '8px', textAlign: 'center', marginBottom: '15px' }}>
                      <div style={{ fontSize: '0.8em', fontWeight: 'bold', opacity: 0.85, marginBottom: '2px' }}>Total Final</div>
                      <div style={{ fontSize: '1.7em', fontWeight: 'bold' }}>
                        {monedaCarrito}
                        {formatMonedaCalc(totales.final)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={copiarTotalPaquete} style={{ flex: 1, background: 'white', color: '#11173d', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9em' }}>
                        {copiadoPaquete ? '✅ Copiado' : '📋 Copiar Total'}
                      </button>
                      <button onClick={guardarResumenPaquete} style={{ flex: 1, background: '#11173d', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9em' }}>
                        💾 Guardar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
