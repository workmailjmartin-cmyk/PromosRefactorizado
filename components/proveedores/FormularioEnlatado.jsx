'use client';
import { useState, useEffect } from 'react';

const TIPOS_SERVICIO_BASE = [
  { value: '', label: 'Seleccionar Servicio...' },
  { value: 'aereo', label: '✈️ Aéreo' },
  { value: 'hotel', label: '🏨 Hotel' },
  { value: 'traslado', label: '🚕 Traslado' },
  { value: 'excursion', label: '🌲 Excursión' },
  { value: 'seguro', label: '🛡️ Asistencia / Seguro' },
];

const OPCIONES_REGIMEN = [
  { value: '', label: 'Seleccionar Régimen...' },
  { value: 'Solo Habitación', label: 'Solo Habitación' },
  { value: 'Desayuno', label: 'Desayuno' },
  { value: 'Desayuno Buffet', label: 'Desayuno Buffet' },
  { value: 'Media Pensión (Sin Bebidas)', label: 'Media Pensión (Sin Bebidas)' },
  { value: 'Media Pensión (Con Bebidas)', label: 'Media Pensión (Con Bebidas)' },
  { value: 'Pensión Completa', label: 'Pensión Completa' },
  { value: 'All Inclusive', label: 'All Inclusive' }
];

const OPCIONES_EQUIPAJE = [
  { value: '', label: 'Seleccionar...' },
  { value: 'Equipaje de mano', label: '🎒 Equipaje de mano' },
  { value: 'Mano + Carry On', label: '🎒 + 🧳 Carry On' },
  { value: 'Mano + Bodega', label: '🎒 + 💼 Bodega' },
  { value: 'Mano + Carry On + Bodega', label: '🎒 + 🧳 + 💼 Completo' }
];

// Componente para Notificaciones Lindas (reemplaza al alert)
const AlertaElegante = ({ mensaje, tipo, onClose }) => {
  if (!mensaje) return null;
  const isError = tipo === 'error';
  return (
    <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, background: isError ? '#fee2e2' : '#dcfce7', borderLeft: `5px solid ${isError ? '#ef4444' : '#22c55e'}`, padding: '15px 25px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '15px', animation: 'slideIn 0.3s ease-out' }}>
      <span style={{ fontSize: '1.2rem' }}>{isError ? '❌' : '✅'}</span>
      <span style={{ color: isError ? '#991b1b' : '#166534', fontWeight: 'bold' }}>{mensaje}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#6b7280' }}>×</button>
    </div>
  );
};

export default function FormularioEnlatado({ onCancel, onSave, paqueteAEditar = null }) {
  const [loading, setLoading] = useState(false);
  const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: '' });

  const mostrarNotificacion = (msj, tipo = 'error') => {
    setNotificacion({ mensaje: msj, tipo });
    setTimeout(() => setNotificacion({ mensaje: '', tipo: '' }), 4000);
  };

  // 1. Info General
  const [infoGeneral, setInfoGeneral] = useState({
    destino: '',
    tipo: 'Grupales',
    transporte: 'bus-mix',
    dias: '',
    noches: '',
    origenPrincipal: '',
    moneda: 'USD',
  });
  const [paradas, setParadas] = useState([]);
  const [tempParada, setTempParada] = useState('');

  // 2. Fechas y Tarifas
  const [salidas, setSalidas] = useState([]);
  const [tempSalida, setTempSalida] = useState({ fecha: '', hotelNombre: '', hotelRegimen: '', doble: '', triple: '', single: '', cuadruple: '' });

  // 3. Itinerario
  const [itinerario, setItinerario] = useState([]);
  const [tempDia, setTempDia] = useState({ titulo: '', descripcion: '' });

  // 4. Servicios
  const [servicios, setServicios] = useState([]);
  const [servicioSeleccionado, setServicioSeleccionado] = useState('');

  // 5. Fotos
  const [imagenes, setImagenes] = useState([]);

  // Variables de Entorno
  const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  // --- MODO EDICIÓN: Precargar datos ---
  useEffect(() => {
    if (paqueteAEditar) {
      setInfoGeneral({
        destino: paqueteAEditar.destino || '',
        tipo: paqueteAEditar.tipo || 'Grupales',
        transporte: paqueteAEditar.transporte || 'bus-mix',
        dias: paqueteAEditar.dias || '',
        noches: paqueteAEditar.noches || '',
        origenPrincipal: paqueteAEditar.origenPrincipal || '',
        moneda: paqueteAEditar.moneda || 'USD',
      });
      setParadas(paqueteAEditar.paradas_ascenso || []);
      setSalidas(paqueteAEditar.tarifario || []);
      setItinerario(paqueteAEditar.itinerario || []);
      setServicios(paqueteAEditar.servicios || []);
      setImagenes(paqueteAEditar.imagenes || []);
    }
  }, [paqueteAEditar]);

  // --- REGLAS DE NEGOCIO ---
  const esBus = infoGeneral.transporte.includes('bus');
  const esAereo = infoGeneral.transporte === 'aereo';
  
  // Filtramos la lista de servicios a agregar (Regla: Si es Bus, ocultamos Aéreo)
  const tiposServicioPermitidos = TIPOS_SERVICIO_BASE.filter(t => {
    if (esBus && t.value === 'aereo') return false;
    return true;
  });

  // --- HANDLERS ---
  const handleInfoChange = (e) => setInfoGeneral({ ...infoGeneral, [e.target.name]: e.target.value });

  const agregarParada = () => {
    if (tempParada && !paradas.includes(tempParada)) {
      setParadas([...paradas, tempParada]);
      setTempParada('');
    }
  };

  const agregarSalida = () => {
    if (tempSalida.fecha && tempSalida.hotelNombre && tempSalida.hotelRegimen && tempSalida.doble) {
      const hotelYRegimenCombinado = `${tempSalida.hotelNombre} - ${tempSalida.hotelRegimen}`;
      setSalidas([...salidas, { id: Date.now(), fecha: tempSalida.fecha, hotelRegimen: hotelYRegimenCombinado, doble: tempSalida.doble, triple: tempSalida.triple, cuadruple: tempSalida.cuadruple, single: tempSalida.single }]);
      setTempSalida({ fecha: '', hotelNombre: '', hotelRegimen: '', doble: '', triple: '', single: '', cuadruple: '' });
    } else {
      mostrarNotificacion("La Fecha, Hotel, Régimen y Precio Doble son obligatorios.");
    }
  };

  const agregarDiaItinerario = () => {
    if (tempDia.titulo) {
      setItinerario([...itinerario, { id: Date.now(), dia: itinerario.length + 1, ...tempDia }]);
      setTempDia({ titulo: '', descripcion: '' });
    }
  };

  const agregarServicio = () => {
    if (!servicioSeleccionado) return;
    setServicios([...servicios, { 
      id: Date.now(), 
      tipo: servicioSeleccionado, 
      detalle1: '', detalle2: '', in: false, out: false,
      // Campos extra para aéreos
      aereoFecha: '', aereoHora: '', aereoAerolinea: '', aereoEquipaje: '', aereoObs: ''
    }]);
    setServicioSeleccionado('');
  };

  const actualizarServicio = (id, campo, valor) => {
    setServicios(servicios.map(s => s.id === id ? { ...s, [campo]: valor } : s));
  };

  const handleSubirFoto = async (e) => {
    if (imagenes.length >= 4) return mostrarNotificacion("Máximo 4 imágenes permitidas.");
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    const data = new FormData();
    data.append('file', file);
    data.append('upload_preset', UPLOAD_PRESET);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: data });
      const fileRes = await res.json();
      if (fileRes.secure_url) setImagenes([...imagenes, fileRes.secure_url]);
      else mostrarNotificacion("Error de Cloudinary. Verificá las credenciales en .env.");
    } catch (err) {
      mostrarNotificacion("Error de conexión al subir la imagen.");
    }
    setLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (salidas.length === 0) return mostrarNotificacion("Tenés que agregar al menos una tarifa.");
    if (imagenes.length === 0) return mostrarNotificacion("Subí al menos 1 imagen de portada.");
    
    // Si estamos editando, pasamos el ID original
    const paqueteFinal = {
      ...infoGeneral,
      paradas_ascenso: paradas,
      tarifario: salidas,
      itinerario,
      servicios,
      imagenes
    };
    if (paqueteAEditar?.id) paqueteFinal.id = paqueteAEditar.id;
    
    onSave(paqueteFinal);
  };

  return (
    <div className="upload-form-container" style={{ background: '#fff', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', position: 'relative' }}>
      
      <AlertaElegante mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({mensaje:'', tipo:''})} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '15px' }}>
        <h2 className="section-title" style={{ margin: 0, color: '#11173d' }}>
          {paqueteAEditar ? '✏️ Editar Paquete' : 'Cargar Paquete Mayorista'}
        </h2>
        <button type="button" onClick={onCancel} className="btn" style={{ background: '#f3f4f6', color: '#6b7280', fontWeight: 'bold' }}>
          ⬅ Volver
        </button>
      </div>

      <form id="upload-form" onSubmit={handleSubmit}>
        
        {/* SECCIÓN 1: INFO GENERAL */}
        <h3 className="section-title">1. Información del Viaje</h3>
        <div className="form-group-row">
          <div className="form-group" style={{ flex: 2 }}>
            <label>Título / Destino Principal</label>
            <input type="text" required name="destino" placeholder="Ej: Cataratas Premium" value={infoGeneral.destino} onChange={handleInfoChange} />
          </div>
          <div className="form-group">
            <label>Transporte Principal</label>
            <select name="transporte" value={infoGeneral.transporte} onChange={handleInfoChange}>
              <option value="bus-mix">🚌 Bus Mix</option>
              <option value="bus-cama">🚌 Bus Cama</option>
              <option value="bus-semicama">🚌 Bus Semicama</option>
              <option value="aereo">✈️ Aéreo (Regular)</option>
              <option value="aereo-charter">✈️ Aéreo (Charter Exclusivo)</option>
            </select>
          </div>
        </div>
        <div className="form-group-row">
          <div className="form-group"><label>Días</label><input type="number" required name="dias" value={infoGeneral.dias} onChange={handleInfoChange} /></div>
          <div className="form-group"><label>Noches</label><input type="number" required name="noches" value={infoGeneral.noches} onChange={handleInfoChange} /></div>
          <div className="form-group"><label>{esAereo || infoGeneral.transporte==='aereo-charter' ? 'Aeropuerto de Salida Principal' : 'Lugar de Salida (Origen)'}</label><input type="text" required name="origenPrincipal" value={infoGeneral.origenPrincipal} onChange={handleInfoChange} /></div>
          <div className="form-group"><label>Moneda</label><select name="moneda" value={infoGeneral.moneda} onChange={handleInfoChange}><option value="USD">USD</option><option value="ARS">ARS</option></select></div>
        </div>

        {/* PARADAS BUS */}
        {esBus && (
          <div className="form-group-row" style={{ alignItems: 'flex-end', background: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
            <div className="form-group" style={{ flex: 1 }}><label>Paradas / Ascensos Adicionales</label><input type="text" value={tempParada} onChange={(e) => setTempParada(e.target.value)} /></div>
            <button type="button" className="btn btn-secundario" onClick={agregarParada} style={{ background: '#11173d', color: 'white', height: '42px' }}>+ Sumar</button>
          </div>
        )}
        {paradas.length > 0 && (
          <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {paradas.map(p => (
              <span key={p} style={{ background: '#e5e7eb', padding: '5px 12px', borderRadius: '15px', fontSize: '0.85em', fontWeight: 'bold' }}>📍 {p} <button type="button" onClick={() => setParadas(paradas.filter(x => x !== p))} style={{ color: 'red' }}>x</button></span>
            ))}
          </div>
        )}

        {/* SECCIÓN 2: TARIFARIO */}
        <h3 className="section-title" style={{ marginTop: '30px' }}>2. Tarifario Neto ({infoGeneral.moneda})</h3>
        <div className="form-group-row" style={{ background: '#fff5f0', padding: '15px', borderRadius: '8px', alignItems: 'flex-end', border: '1px solid #ffedd5', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ minWidth: '150px' }}><label style={{ color: '#ef5a1a' }}>Fecha Salida *</label><input type="date" value={tempSalida.fecha} onChange={e => setTempSalida({...tempSalida, fecha: e.target.value})} /></div>
          <div className="form-group" style={{ flex: 1.5, minWidth: '150px' }}><label style={{ color: '#ef5a1a' }}>Nombre Hotel *</label><input type="text" value={tempSalida.hotelNombre} onChange={e => setTempSalida({...tempSalida, hotelNombre: e.target.value})} /></div>
          <div className="form-group" style={{ flex: 1.5, minWidth: '180px' }}><label style={{ color: '#ef5a1a' }}>Régimen *</label><select value={tempSalida.hotelRegimen} onChange={e => setTempSalida({...tempSalida, hotelRegimen: e.target.value})}>{OPCIONES_REGIMEN.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}</select></div>
          
          <div className="form-group"><label>Doble *</label><input type="number" placeholder={infoGeneral.moneda} value={tempSalida.doble} onChange={e => setTempSalida({...tempSalida, doble: e.target.value})} /></div>
          <div className="form-group"><label>Triple</label><input type="number" placeholder={infoGeneral.moneda} value={tempSalida.triple} onChange={e => setTempSalida({...tempSalida, triple: e.target.value})} /></div>
          <div className="form-group"><label>Cuádruple</label><input type="number" placeholder={infoGeneral.moneda} value={tempSalida.cuadruple} onChange={e => setTempSalida({...tempSalida, cuadruple: e.target.value})} /></div>
          <div className="form-group"><label>Single</label><input type="number" placeholder={infoGeneral.moneda} value={tempSalida.single} onChange={e => setTempSalida({...tempSalida, single: e.target.value})} /></div>
          
          <button type="button" className="btn btn-primario" onClick={agregarSalida} style={{ height: '42px', minWidth: '80px' }}>+ Fila</button>
        </div>

        {salidas.length > 0 && (
          <table style={{ width: '100%', marginTop: '15px', borderCollapse: 'collapse', fontSize: '0.9em', border: '1px solid #ddd' }}>
            <thead><tr style={{ background: '#f3f4f6', borderBottom: '2px solid #ddd' }}><th>Salida</th><th>Hotel/Régimen</th><th>Doble</th><th>Triple</th><th>Cuádruple</th><th>Single</th><th></th></tr></thead>
            <tbody>
              {salidas.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid #eee' }}><td style={{ padding: '10px', fontWeight: 'bold' }}>{s.fecha}</td><td style={{ padding: '10px' }}>{s.hotelRegimen}</td><td style={{ padding: '10px' }}>${s.doble}</td><td style={{ padding: '10px' }}>{s.triple ? `$${s.triple}` : '-'}</td><td style={{ padding: '10px' }}>{s.cuadruple ? `$${s.cuadruple}` : '-'}</td><td style={{ padding: '10px' }}>{s.single ? `$${s.single}` : '-'}</td><td style={{ padding: '10px', textAlign: 'right' }}><button type="button" onClick={() => setSalidas(salidas.filter(x => x.id !== s.id))} style={{ color: 'red', fontWeight: 'bold' }}>X</button></td></tr>
              ))}
            </tbody>
          </table>
        )}

        {/* SECCIÓN 3: ITINERARIO (Alineado) */}
        <h3 className="section-title" style={{ marginTop: '30px' }}>3. Itinerario Resumido</h3>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start', background: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #eee' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Título del Día (Ej: Día 1 - Viaje)</label>
            <input type="text" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} value={tempDia.titulo} onChange={e => setTempDia({...tempDia, titulo: e.target.value})} />
          </div>
          <div style={{ flex: 2 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Descripción de actividades</label>
            <textarea rows="1" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', resize: 'vertical', minHeight: '42px' }} value={tempDia.descripcion} onChange={e => setTempDia({...tempDia, descripcion: e.target.value})}></textarea>
          </div>
          <div style={{ paddingTop: '25px' }}>
            <button type="button" className="btn btn-secundario" onClick={agregarDiaItinerario} style={{ background: '#11173d', color: 'white', height: '42px', padding: '0 20px' }}>+ Día</button>
          </div>
        </div>
        
        {itinerario.length > 0 && (
          <div style={{ marginTop: '15px', padding: '15px', background: '#fff', borderRadius: '8px', borderLeft: '4px solid #ef5a1a', border: '1px solid #eee' }}>
            {itinerario.map(d => (
              <div key={d.id} style={{ marginBottom: '10px' }}>
                <b style={{ color: '#11173d' }}>Día {d.dia}: {d.titulo}</b> <button type="button" onClick={() => setItinerario(itinerario.filter(x => x.id !== d.id))} style={{ color: 'red', fontSize: '0.8rem', marginLeft: '10px' }}>Borrar</button>
                <p style={{ margin: '5px 0 0 0', fontSize: '0.9em', color: '#666' }}>{d.descripcion}</p>
              </div>
            ))}
          </div>
        )}

        {/* SECCIÓN 4: SERVICIOS */}
        <h3 className="section-title" style={{ marginTop: '30px' }}>4. Servicios Incluidos (Hoteles, Excursiones)</h3>
        <div id="servicios-container">
          {servicios.map(s => (
            <div key={s.id} style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '10px', position: 'relative', background: s.tipo==='aereo' ? '#f0f9ff' : '#fff' }}>
              <button type="button" onClick={() => setServicios(servicios.filter(x => x.id !== s.id))} style={{ position: 'absolute', right: '15px', top: '15px', color: 'red', fontWeight: 'bold' }}>X</button>
              <h4 style={{ margin: '0 0 10px 0', textTransform: 'uppercase', fontSize: '0.9em', color: '#ef5a1a' }}>{s.tipo}</h4>
              
              {s.tipo === 'traslado' ? (
                <div className="form-group-row">
                  <div className="form-group" style={{ flex: 1, display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <label><input type="checkbox" checked={s.in || false} onChange={(e) => actualizarServicio(s.id, 'in', e.target.checked)} /> IN</label>
                    <label><input type="checkbox" checked={s.out || false} onChange={(e) => actualizarServicio(s.id, 'out', e.target.checked)} /> OUT</label>
                  </div>
                  <div className="form-group" style={{ flex: 2 }}><label>Detalle</label><input type="text" value={s.detalle1} onChange={(e) => actualizarServicio(s.id, 'detalle1', e.target.value)} /></div>
                  <div className="form-group" style={{ flex: 2 }}><label>Notas</label><input type="text" value={s.detalle2} onChange={(e) => actualizarServicio(s.id, 'detalle2', e.target.value)} /></div>
                </div>
              ) : s.tipo === 'aereo' ? (
                // BLOQUE AÉREO ESPECÍFICO
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div className="form-group-row">
                    <div className="form-group"><label>Aeropuerto / Tramo</label><input type="text" placeholder="Ej: COR - EZE" value={s.detalle1} onChange={(e) => actualizarServicio(s.id, 'detalle1', e.target.value)} /></div>
                    <div className="form-group"><label>Fecha y Hora</label><input type="datetime-local" value={s.aereoFecha} onChange={(e) => actualizarServicio(s.id, 'aereoFecha', e.target.value)} /></div>
                    <div className="form-group"><label>Aerolínea</label><input type="text" value={s.aereoAerolinea} onChange={(e) => actualizarServicio(s.id, 'aereoAerolinea', e.target.value)} /></div>
                  </div>
                  <div className="form-group-row">
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Equipaje Incluido</label>
                      <select value={s.aereoEquipaje} onChange={(e) => actualizarServicio(s.id, 'aereoEquipaje', e.target.value)}>
                        {OPCIONES_EQUIPAJE.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 2 }}><label>Observaciones</label><input type="text" placeholder="Ej: Vuelo directo, no incluye comida" value={s.aereoObs} onChange={(e) => actualizarServicio(s.id, 'aereoObs', e.target.value)} /></div>
                  </div>
                </div>
              ) : (
                <div className="form-group-row">
                  <div className="form-group"><label>{s.tipo === 'hotel' ? 'Nombre del Hotel' : 'Detalle'}</label><input type="text" value={s.detalle1} onChange={(e) => actualizarServicio(s.id, 'detalle1', e.target.value)} /></div>
                  <div className="form-group"><label>{s.tipo === 'hotel' ? 'Régimen' : 'Notas'}</label><input type="text" value={s.detalle2} onChange={(e) => actualizarServicio(s.id, 'detalle2', e.target.value)} /></div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="add-service-bar" style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
          <select style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} value={servicioSeleccionado} onChange={(e) => setServicioSeleccionado(e.target.value)}>
            {tiposServicioPermitidos.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <button type="button" className="btn btn-secundario" onClick={agregarServicio} style={{ background: '#11173d', color: 'white' }}>+ Agregar</button>
        </div>

        {/* SECCIÓN 5: FOTOS */}
        <h3 className="section-title" style={{ marginTop: '30px' }}>5. Galería (Máx 4)</h3>
        <div style={{ padding: '20px', border: '2px dashed #ddd', borderRadius: '8px', textAlign: 'center', background: '#f9fafb' }}>
          <label style={{ cursor: 'pointer', background: '#fff', padding: '10px 20px', border: '1px solid #ccc', borderRadius: '6px', fontWeight: 'bold' }}>
            📸 Subir Foto
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleSubirFoto} disabled={loading || imagenes.length >= 4} />
          </label>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '15px' }}>
            {imagenes.map((img, i) => (
              <div key={i} style={{ width: '80px', height: '80px', border: '1px solid #ddd', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
                <img src={img} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button type="button" onClick={() => setImagenes(imagenes.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: 0, right: 0, background: 'red', color: 'white', border: 'none', cursor: 'pointer', padding: '2px 5px' }}>X</button>
              </div>
            ))}
          </div>
        </div>

        {/* BOTÓN FINAL */}
        <div style={{ textAlign: 'right', marginTop: '30px', borderTop: '2px solid #eee', paddingTop: '20px' }}>
          <button type="submit" disabled={loading} className="btn btn-primario" style={{ padding: '15px 40px', fontSize: '1.1em' }}>
            {loading ? 'Guardando...' : paqueteAEditar ? '💾 Guardar Cambios' : '🚀 Publicar Paquete'}
          </button>
        </div>

      </form>
    </div>
  );
}