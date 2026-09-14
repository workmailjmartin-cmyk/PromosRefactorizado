'use client';
import { useState, useEffect } from 'react';
import { PROVINCIAS } from '@/lib/internal/constants';
import { AEROPUERTOS_POR_PROVINCIA } from '@/lib/internal/airports';

const TIPOS_SERVICIO_BASE = [
  { value: '', label: 'Seleccionar Servicio...' },
  { value: 'hotel', label: '🏨 Hotel' },
  { value: 'traslado', label: '🚕 Traslado' },
  { value: 'excursion', label: '🌲 Excursión' },
  { value: 'seguro', label: '🛡️ Asistencia / Seguro' },
];

const OPCIONES_REGIMEN = [
  { value: '', label: 'Seleccionar...' },
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

// Estructura limpia para resetear el form de tarifas
const tarifaVacia = {
  fecha: '', hotelNombre: '', hotelEstrellas: '3', hotelUbicacion: '', hotelRegimen: '',
  doble: { mayor: '', menor: '', child: '' },
  triple: { mayor: '', menor: '', child: '' },
  cuadruple: { mayor: '', menor: '', child: '' },
  single: { mayor: '' }
};

export default function FormularioEnlatado({ onCancel, onSave, paqueteAEditar = null }) {
  const [loading, setLoading] = useState(false);
  
  const [infoGeneral, setInfoGeneral] = useState({ destino: '', tipo: 'Grupales', transporte: 'bus-mix', dias: '', noches: '', origenProvincia: '', origenAeropuerto: '', moneda: 'USD' });
  const [paradas, setParadas] = useState([]);
  const [tempParada, setTempParada] = useState('');
  const [vuelos, setVuelos] = useState([]);
  
  const [salidas, setSalidas] = useState([]);
  const [tempSalida, setTempSalida] = useState(tarifaVacia);
  
  const [itinerario, setItinerario] = useState([]);
  const [tempDia, setTempDia] = useState({ titulo: '', descripcion: '' });
  const [servicios, setServicios] = useState([]);
  const [servicioSeleccionado, setServicioSeleccionado] = useState('');
  const [imagenes, setImagenes] = useState([]);
  const [observaciones, setObservaciones] = useState('');

  const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  useEffect(() => {
    if (paqueteAEditar) {
      setInfoGeneral({
        destino: paqueteAEditar.destino || '', tipo: paqueteAEditar.tipo || 'Grupales', transporte: paqueteAEditar.transporte || 'bus-mix',
        dias: paqueteAEditar.dias || '', noches: paqueteAEditar.noches || '', origenProvincia: paqueteAEditar.origenProvincia || '',
        origenAeropuerto: paqueteAEditar.origenAeropuerto || paqueteAEditar.origenPrincipal || '', moneda: paqueteAEditar.moneda || 'USD'
      });
      setParadas(paqueteAEditar.paradas_ascenso || []);
      setVuelos(paqueteAEditar.vuelos || []);
      
      // Adaptador para paquetes viejos (si doble era un string, lo convierte a objeto)
      const salidasAdaptadas = (paqueteAEditar.tarifario || []).map(t => {
        return {
          ...t,
          doble: typeof t.doble === 'object' ? t.doble : { mayor: t.doble || '', menor: '', child: '' },
          triple: typeof t.triple === 'object' ? t.triple : { mayor: t.triple || '', menor: '', child: '' },
          cuadruple: typeof t.cuadruple === 'object' ? t.cuadruple : { mayor: t.cuadruple || '', menor: '', child: '' },
          single: typeof t.single === 'object' ? t.single : { mayor: t.single || '' }
        };
      });
      setSalidas(salidasAdaptadas);
      
      setItinerario(paqueteAEditar.itinerario || []);
      setServicios(paqueteAEditar.servicios || []);
      setImagenes(paqueteAEditar.imagenes || []);
      setObservaciones(paqueteAEditar.observaciones || '');
    }
  }, [paqueteAEditar]);

  const esBus = infoGeneral.transporte.includes('bus');
  const esAereo = infoGeneral.transporte.includes('aereo');

  const handleInfoChange = (e) => {
    const { name, value } = e.target;
    if (name === 'origenProvincia') setInfoGeneral(prev => ({ ...prev, origenProvincia: value, origenAeropuerto: '' }));
    else setInfoGeneral(prev => ({ ...prev, [name]: value }));
  };

  // VUELOS
  const agregarVuelo = () => {
    const origenInicial = vuelos.length === 0 ? infoGeneral.origenAeropuerto : '';
    setVuelos([...vuelos, { id: Date.now(), aerolinea: '', origen: origenInicial, fechaSalida: '', horaSalida: '', destino: '', fechaLlegada: '', horaLlegada: '', equipaje: '', obs: '' }]);
  };
  const actualizarVuelo = (id, campo, valor) => setVuelos(vuelos.map(v => v.id === id ? { ...v, [campo]: valor } : v));
  const eliminarVuelo = (id) => setVuelos(vuelos.filter(v => v.id !== id));
  
  // PARADAS
  const agregarParada = () => { if (tempParada && !paradas.includes(tempParada)) { setParadas([...paradas, tempParada]); setTempParada(''); } };
  
  // TARIFARIO NUEVO (Complejo)
  const handleTarifaChange = (base, campo, valor) => {
    setTempSalida(prev => ({
      ...prev,
      [base]: { ...prev[base], [campo]: valor }
    }));
  };

  const agregarSalida = () => {
    if (tempSalida.fecha && tempSalida.hotelNombre && tempSalida.hotelRegimen && tempSalida.doble.mayor) {
      // Mantenemos hotelRegimen viejo por compatibilidad, pero guardamos todo por separado
      const hotelYRegimenCombinado = `${tempSalida.hotelNombre} - ${tempSalida.hotelRegimen}`;
      setSalidas([...salidas, { 
        id: Date.now(), 
        fecha: tempSalida.fecha, 
        hotelRegimen: hotelYRegimenCombinado, 
        hotelNombre: tempSalida.hotelNombre,
        hotelEstrellas: tempSalida.hotelEstrellas,
        hotelUbicacion: tempSalida.hotelUbicacion,
        regimen: tempSalida.hotelRegimen,
        doble: tempSalida.doble, 
        triple: tempSalida.triple, 
        cuadruple: tempSalida.cuadruple, 
        single: tempSalida.single 
      }]);
      setTempSalida(tarifaVacia);
    } else { alert("La Fecha, Hotel, Régimen y Precio Doble (Adulto) son obligatorios."); }
  };

  // OTROS
  const agregarDiaItinerario = () => { if (tempDia.titulo) { setItinerario([...itinerario, { id: Date.now(), dia: itinerario.length + 1, ...tempDia }]); setTempDia({ titulo: '', descripcion: '' }); } };
  const agregarServicio = () => { if (servicioSeleccionado) { setServicios([...servicios, { id: Date.now(), tipo: servicioSeleccionado, detalle1: '', detalle2: '', in: false, out: false, opcional: false, fechaHora: '', tarifa: '' }]); setServicioSeleccionado(''); } };
  const actualizarServicio = (id, campo, valor) => setServicios(servicios.map(s => s.id === id ? { ...s, [campo]: valor } : s));

  const handleSubirFoto = async (e) => {
    if (imagenes.length >= 4) return alert("Máximo 4 imágenes permitidas.");
    const file = e.target.files[0]; if (!file) return;
    setLoading(true);
    const data = new FormData(); data.append('file', file); data.append('upload_preset', UPLOAD_PRESET);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: data });
      const fileRes = await res.json();
      if (fileRes.secure_url) setImagenes([...imagenes, fileRes.secure_url]);
    } catch (err) { alert("Error al subir la imagen."); }
    setLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (salidas.length === 0) return alert("Tenés que agregar al menos una tarifa.");
    if (imagenes.length === 0) return alert("Subí al menos 1 imagen de portada.");
    if (esAereo && vuelos.length === 0) return alert("Al ser un paquete aéreo, debés cargar la información de vuelos.");
    
    const paqueteFinal = {
      ...infoGeneral, origenPrincipal: infoGeneral.origenProvincia || infoGeneral.origenAeropuerto,
      paradas_ascenso: paradas, vuelos, tarifario: salidas, itinerario, servicios, imagenes, observaciones
    };
    if (paqueteAEditar?.id) paqueteFinal.id = paqueteAEditar.id;
    onSave(paqueteFinal);
  };

  return (
    <div className="upload-form-container" style={{ background: '#fff', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '15px' }}>
        <h2 className="section-title" style={{ margin: 0, color: '#11173d' }}>{paqueteAEditar ? '✏️ Editar Paquete' : 'Cargar Paquete Mayorista'}</h2>
        <button type="button" onClick={onCancel} className="btn" style={{ background: '#f3f4f6', color: '#6b7280', fontWeight: 'bold' }}>⬅ Volver</button>
      </div>

      <form onSubmit={handleSubmit}>
        
        {/* SECCIÓN 1 */}
        <h3 className="section-title">1. Información del Viaje</h3>
        <div className="form-group-row">
          <div className="form-group" style={{ flex: 2 }}><label>Título / Destino Principal</label><input type="text" required name="destino" placeholder="Ej: Cataratas Premium" value={infoGeneral.destino} onChange={handleInfoChange} /></div>
          <div className="form-group"><label>Transporte Principal</label><select name="transporte" value={infoGeneral.transporte} onChange={handleInfoChange}><option value="bus-mix">🚌 Bus Mix</option><option value="bus-cama">🚌 Bus Cama</option><option value="bus-semicama">🚌 Bus Semicama</option><option value="aereo">✈️ Aéreo (Regular)</option><option value="aereo-charter">✈️ Aéreo (Charter Exclusivo)</option></select></div>
        </div>
        
        <div className="form-group-row" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: '1 1 80px' }}><label>Días</label><input type="number" required name="dias" value={infoGeneral.dias} onChange={handleInfoChange} /></div>
          <div className="form-group" style={{ flex: '1 1 80px' }}><label>Noches</label><input type="number" required name="noches" value={infoGeneral.noches} onChange={handleInfoChange} /></div>
          <div className="form-group" style={{ flex: '2 1 200px' }}><label>Provincia Salida *</label><select required name="origenProvincia" value={infoGeneral.origenProvincia} onChange={handleInfoChange}>{PROVINCIAS.map(p => (<option key={p.value} value={p.value} disabled={p.value === ''}>{p.label}</option>))}</select></div>
          <div className="form-group" style={{ flex: '2 1 200px' }}>
            <label>{esAereo ? 'Aeropuerto de Salida *' : 'Ciudad / Terminal *'}</label>
            {esAereo ? (
              <select required name="origenAeropuerto" value={infoGeneral.origenAeropuerto} onChange={handleInfoChange} disabled={!infoGeneral.origenProvincia}>
                <option value="">Seleccionar Aeropuerto...</option>
                {(AEROPUERTOS_POR_PROVINCIA[infoGeneral.origenProvincia] || []).map(a => (<option key={a.sigla} value={`${a.sigla} - ${a.nombre}`}>{a.sigla} - {a.nombre}</option>))}
              </select>
            ) : (<input type="text" required name="origenAeropuerto" placeholder="Ej: Terminal Cba" value={infoGeneral.origenAeropuerto} onChange={handleInfoChange} />)}
          </div>
          <div className="form-group" style={{ flex: '1 1 120px' }}><label>Moneda</label><select name="moneda" value={infoGeneral.moneda} onChange={handleInfoChange}><option value="USD">USD</option><option value="ARS">ARS</option></select></div>
        </div>

        {esBus && (
          <div className="form-group-row" style={{ alignItems: 'flex-end', background: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
            <div className="form-group" style={{ flex: 1 }}><label>Paradas / Ascensos Adicionales</label><input type="text" placeholder="Ej: Leones, Rosario..." value={tempParada} onChange={(e) => setTempParada(e.target.value)} /></div>
            <button type="button" className="btn btn-secundario" onClick={agregarParada} style={{ background: '#11173d', color: 'white', height: '42px' }}>+ Sumar</button>
          </div>
        )}
        {paradas.length > 0 && esBus && (
          <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {paradas.map(p => <span key={p} style={{ background: '#e5e7eb', padding: '5px 12px', borderRadius: '15px', fontSize: '0.85em', fontWeight: 'bold' }}>📍 {p} <button type="button" onClick={() => setParadas(paradas.filter(x => x !== p))} style={{ color: 'red' }}>x</button></span>)}
          </div>
        )}

        {esAereo && (
          <div style={{ background: '#f0f9ff', padding: '20px', borderRadius: '12px', border: '1px solid #bae6fd', marginBottom: '30px', marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#0369a1', fontSize: '1.2rem' }}>✈️ Información de Vuelos</h3>
              <button type="button" onClick={agregarVuelo} className="btn" style={{ background: '#0284c7', color: '#fff', fontSize: '0.9rem', padding: '8px 15px' }}>+ Agregar Tramo</button>
            </div>
            {vuelos.length === 0 ? (
              <p style={{ color: '#0284c7', fontStyle: 'italic', margin: 0 }}>Hacé clic en el botón Agregar Tramo para sumar vuelos.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {vuelos.map((v, idx) => (
                  <div key={v.id} style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #e0f2fe', position: 'relative' }}>
                    <button type="button" onClick={() => eliminarVuelo(v.id)} style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer' }}>✕</button>
                    <b style={{ display: 'block', marginBottom: '10px', color: '#0369a1' }}>Tramo {idx + 1}</b>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '10px' }}>
                      <div className="form-group" style={{ margin: 0 }}><label>Aerolínea</label><input type="text" value={v.aerolinea} onChange={e => actualizarVuelo(v.id, 'aerolinea', e.target.value)} /></div>
                      <div className="form-group" style={{ margin: 0 }}><label>Aeropuerto Salida</label><input type="text" value={v.origen} onChange={e => actualizarVuelo(v.id, 'origen', e.target.value)} /></div>
                      <div className="form-group" style={{ margin: 0 }}><label>Fecha Salida</label><input type="date" value={v.fechaSalida} onChange={e => actualizarVuelo(v.id, 'fechaSalida', e.target.value)} /></div>
                      <div className="form-group" style={{ margin: 0 }}><label>Hora Salida</label><input type="time" value={v.horaSalida} onChange={e => actualizarVuelo(v.id, 'horaSalida', e.target.value)} /></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '10px', borderTop: '1px dashed #bae6fd', paddingTop: '15px' }}>
                      <div className="form-group" style={{ margin: 0 }}><label>Equipaje Incluido</label><select value={v.equipaje} onChange={e => actualizarVuelo(v.id, 'equipaje', e.target.value)}>{OPCIONES_EQUIPAJE.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                      <div className="form-group" style={{ margin: 0 }}><label>Aeropuerto Llegada</label><input type="text" value={v.destino} onChange={e => actualizarVuelo(v.id, 'destino', e.target.value)} /></div>
                      <div className="form-group" style={{ margin: 0 }}><label>Fecha Llegada</label><input type="date" value={v.fechaLlegada} onChange={e => actualizarVuelo(v.id, 'fechaLlegada', e.target.value)} /></div>
                      <div className="form-group" style={{ margin: 0 }}><label>Hora Llegada</label><input type="time" value={v.horaLlegada} onChange={e => actualizarVuelo(v.id, 'horaLlegada', e.target.value)} /></div>
                    </div>
                    <div className="form-group" style={{ margin: 0, marginTop: '15px' }}><label>Observaciones del Vuelo</label><input type="text" placeholder="Ej: Vuelo directo." value={v.obs} onChange={e => actualizarVuelo(v.id, 'obs', e.target.value)} /></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECCIÓN 2: TARIFARIO (NUEVO DISEÑO CON CATEGORÍAS) */}
        <h3 className="section-title" style={{ marginTop: '30px' }}>2. Tarifario Neto ({infoGeneral.moneda})</h3>
        
        <div style={{ background: '#fff5f0', padding: '20px', borderRadius: '12px', border: '1px solid #ffedd5', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px' }}>
            <div className="form-group" style={{ margin: 0 }}><label style={{ color: '#ef5a1a' }}>Fecha Salida *</label><input type="date" value={tempSalida.fecha} onChange={e => setTempSalida({...tempSalida, fecha: e.target.value})} /></div>
            <div className="form-group" style={{ margin: 0 }}><label style={{ color: '#ef5a1a' }}>Nombre Hotel *</label><input type="text" placeholder="Ej: Hilton Copacabana" value={tempSalida.hotelNombre} onChange={e => setTempSalida({...tempSalida, hotelNombre: e.target.value})} /></div>
            <div className="form-group" style={{ margin: 0 }}><label style={{ color: '#ef5a1a' }}>Estrellas</label><select value={tempSalida.hotelEstrellas || '3'} onChange={e => setTempSalida({...tempSalida, hotelEstrellas: e.target.value})}><option value="1">1 ⭐</option><option value="2">2 ⭐</option><option value="3">3 ⭐</option><option value="4">4 ⭐</option><option value="5">5 ⭐</option></select></div>
            <div className="form-group" style={{ margin: 0 }}><label style={{ color: '#ef5a1a' }}>Ubicación (Maps)</label><input type="url" placeholder="https://maps.app.goo.gl/..." value={tempSalida.hotelUbicacion || ''} onChange={e => setTempSalida({...tempSalida, hotelUbicacion: e.target.value})} /></div>
            <div className="form-group" style={{ margin: 0 }}><label style={{ color: '#ef5a1a' }}>Régimen *</label><select value={tempSalida.hotelRegimen} onChange={e => setTempSalida({...tempSalida, hotelRegimen: e.target.value})}>{OPCIONES_REGIMEN.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}</select></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
            {/* CAJA DOBLE */}
            <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#11173d', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Base Doble *</h4>
              <div style={{ display: 'flex', gap: '5px' }}>
                <div style={{ flex: 1 }}><label style={{ fontSize: '0.75rem' }}>Adulto*</label><input type="number" style={{ padding: '6px' }} value={tempSalida.doble.mayor} onChange={e => handleTarifaChange('doble', 'mayor', e.target.value)} /></div>
                <div style={{ flex: 1 }}><label style={{ fontSize: '0.75rem' }}>Menor</label><input type="number" style={{ padding: '6px' }} value={tempSalida.doble.menor} onChange={e => handleTarifaChange('doble', 'menor', e.target.value)} /></div>
                <div style={{ flex: 1 }}><label style={{ fontSize: '0.75rem' }}>Child(0-1)</label><input type="number" style={{ padding: '6px' }} value={tempSalida.doble.child} onChange={e => handleTarifaChange('doble', 'child', e.target.value)} /></div>
              </div>
            </div>
            
            {/* CAJA TRIPLE */}
            <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#11173d', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Base Triple</h4>
              <div style={{ display: 'flex', gap: '5px' }}>
                <div style={{ flex: 1 }}><label style={{ fontSize: '0.75rem' }}>Adulto</label><input type="number" style={{ padding: '6px' }} value={tempSalida.triple.mayor} onChange={e => handleTarifaChange('triple', 'mayor', e.target.value)} /></div>
                <div style={{ flex: 1 }}><label style={{ fontSize: '0.75rem' }}>Menor</label><input type="number" style={{ padding: '6px' }} value={tempSalida.triple.menor} onChange={e => handleTarifaChange('triple', 'menor', e.target.value)} /></div>
                <div style={{ flex: 1 }}><label style={{ fontSize: '0.75rem' }}>Child(0-1)</label><input type="number" style={{ padding: '6px' }} value={tempSalida.triple.child} onChange={e => handleTarifaChange('triple', 'child', e.target.value)} /></div>
              </div>
            </div>

            {/* CAJA CUÁDRUPLE */}
            <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#11173d', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Base Cuádruple</h4>
              <div style={{ display: 'flex', gap: '5px' }}>
                <div style={{ flex: 1 }}><label style={{ fontSize: '0.75rem' }}>Adulto</label><input type="number" style={{ padding: '6px' }} value={tempSalida.cuadruple.mayor} onChange={e => handleTarifaChange('cuadruple', 'mayor', e.target.value)} /></div>
                <div style={{ flex: 1 }}><label style={{ fontSize: '0.75rem' }}>Menor</label><input type="number" style={{ padding: '6px' }} value={tempSalida.cuadruple.menor} onChange={e => handleTarifaChange('cuadruple', 'menor', e.target.value)} /></div>
                <div style={{ flex: 1 }}><label style={{ fontSize: '0.75rem' }}>Child(0-1)</label><input type="number" style={{ padding: '6px' }} value={tempSalida.cuadruple.child} onChange={e => handleTarifaChange('cuadruple', 'child', e.target.value)} /></div>
              </div>
            </div>

            {/* CAJA SINGLE Y BOTON */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb', flex: 1 }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#11173d', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Base Single</h4>
                <div><label style={{ fontSize: '0.75rem' }}>Adulto</label><input type="number" style={{ padding: '6px', width: '50%' }} value={tempSalida.single.mayor} onChange={e => handleTarifaChange('single', 'mayor', e.target.value)} /></div>
              </div>
              <button type="button" className="btn btn-primario" onClick={agregarSalida} style={{ height: '45px', borderRadius: '8px' }}>➕ Guardar Fila</button>
            </div>
          </div>
        </div>

        {/* TABLA RESUMEN EN EL FORMULARIO */}
        {salidas.length > 0 && (
          <div style={{ overflowX: 'auto', marginTop: '15px' }}>
            <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', fontSize: '0.85em', border: '1px solid #ddd' }}>
              <thead>
                <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #ddd', textAlign: 'center' }}>
                  <th rowSpan="2" style={{ padding: '8px', textAlign: 'left', width: '22%' }}>Salida y Alojamiento</th>
                  <th rowSpan="2" style={{ padding: '8px', textAlign: 'left', width: '12%' }}>Régimen</th>
                  <th colSpan="3" style={{ borderLeft: '1px solid #ddd', width: '18%' }}>Doble</th>
                  <th colSpan="3" style={{ borderLeft: '1px solid #ddd', width: '18%' }}>Triple</th>
                  <th colSpan="3" style={{ borderLeft: '1px solid #ddd', width: '18%' }}>Cuádruple</th>
                  <th style={{ borderLeft: '1px solid #ddd', width: '6%' }}>Sgl</th>
                  <th rowSpan="2" style={{ width: '6%' }}></th>
                </tr>
                <tr style={{ background: '#f9fafb', fontSize: '0.8em', color: '#6b7280' }}>
                  <th style={{ borderLeft: '1px solid #ddd' }}>Ad</th><th>Me</th><th>Ch</th>
                  <th style={{ borderLeft: '1px solid #ddd' }}>Ad</th><th>Me</th><th>Ch</th>
                  <th style={{ borderLeft: '1px solid #ddd' }}>Ad</th><th>Me</th><th>Ch</th>
                  <th style={{ borderLeft: '1px solid #ddd' }}>Ad</th>
                </tr>
              </thead>
              <tbody style={{ textAlign: 'center' }}>
                {salidas.map(s => {
                  const nombre = s.hotelNombre || (s.hotelRegimen ? s.hotelRegimen.split(' - ')[0] : 'Hotel');
                  const regimen = s.regimen || (s.hotelRegimen ? s.hotelRegimen.split(' - ')[1] : '');
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px', textAlign: 'left', wordWrap: 'break-word' }}><b>{s.fecha}</b><br/>{nombre}</td>
                      <td style={{ padding: '8px', textAlign: 'left', wordWrap: 'break-word' }}>{regimen}</td>
                      <td style={{ borderLeft: '1px solid #ddd', fontWeight: 'bold' }}>{s.doble.mayor ? `$${s.doble.mayor}` : '-'}</td><td>{s.doble.menor || '-'}</td><td>{s.doble.child || '-'}</td>
                      <td style={{ borderLeft: '1px solid #ddd' }}>{s.triple.mayor ? `$${s.triple.mayor}` : '-'}</td><td>{s.triple.menor || '-'}</td><td>{s.triple.child || '-'}</td>
                      <td style={{ borderLeft: '1px solid #ddd' }}>{s.cuadruple.mayor ? `$${s.cuadruple.mayor}` : '-'}</td><td>{s.cuadruple.menor || '-'}</td><td>{s.cuadruple.child || '-'}</td>
                      <td style={{ borderLeft: '1px solid #ddd' }}>{s.single.mayor ? `$${s.single.mayor}` : '-'}</td>
                      <td style={{ padding: '8px' }}><button type="button" onClick={() => setSalidas(salidas.filter(x => x.id !== s.id))} style={{ color: 'red', fontWeight: 'bold', border: 'none', background: 'none', cursor: 'pointer' }}>X</button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* SECCIÓN 3 */}
        <h3 className="section-title" style={{ marginTop: '30px' }}>3. Itinerario Resumido</h3>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start', background: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #eee' }}>
          <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Título del Día (Ej: Día 1 - Viaje)</label><input type="text" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} value={tempDia.titulo} onChange={e => setTempDia({...tempDia, titulo: e.target.value})} /></div>
          <div style={{ flex: 2 }}><label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Descripción de actividades</label><textarea rows="1" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', resize: 'vertical', minHeight: '42px' }} value={tempDia.descripcion} onChange={e => setTempDia({...tempDia, descripcion: e.target.value})}></textarea></div>
          <div style={{ paddingTop: '25px' }}><button type="button" className="btn btn-secundario" onClick={agregarDiaItinerario} style={{ background: '#11173d', color: 'white', height: '42px', padding: '0 20px' }}>+ Día</button></div>
        </div>
        
        {itinerario.length > 0 && (
          <div style={{ marginTop: '15px', padding: '15px', background: '#fff', borderRadius: '8px', borderLeft: '4px solid #ef5a1a', border: '1px solid #eee' }}>
            {itinerario.map(d => (<div key={d.id} style={{ marginBottom: '10px' }}><b style={{ color: '#11173d' }}>Día {d.dia}: {d.titulo}</b> <button type="button" onClick={() => setItinerario(itinerario.filter(x => x.id !== d.id))} style={{ color: 'red', fontSize: '0.8rem', marginLeft: '10px', border: 'none', background: 'none', cursor: 'pointer' }}>Borrar</button><p style={{ margin: '5px 0 0 0', fontSize: '0.9em', color: '#666' }}>{d.descripcion}</p></div>))}
          </div>
        )}

        {/* SECCIÓN 4 */}
        <h3 className="section-title" style={{ marginTop: '30px' }}>4. Otros Servicios ({esAereo ? 'Traslados, Hoteles extras, Excursiones' : 'Hoteles, Excursiones'})</h3>
        <div id="servicios-container">
          {servicios.map(s => (
            <div key={s.id} style={{ padding: '20px', border: '1px solid #e5e7eb', borderRadius: '12px', marginBottom: '15px', position: 'relative', background: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
              <button type="button" onClick={() => setServicios(servicios.filter(x => x.id !== s.id))} style={{ position: 'absolute', right: '15px', top: '15px', color: '#ef4444', fontWeight: 'bold', border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px', borderBottom: '1px dashed #e5e7eb', paddingBottom: '10px', flexWrap: 'wrap' }}>
                <h4 style={{ margin: 0, textTransform: 'uppercase', fontSize: '1rem', color: '#ef5a1a', fontWeight: '900' }}>{s.tipo}</h4>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: '#0369a1', fontWeight: 'bold', fontSize: '0.9rem', background: '#e0f2fe', padding: '4px 10px', borderRadius: '15px' }}>
                  <input type="checkbox" checked={s.opcional || false} onChange={(e) => actualizarServicio(s.id, 'opcional', e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#0284c7' }} />
                  Marcar como Opcional (Adicional)
                </label>
                {s.opcional && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginLeft: 'auto' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#11173d' }}>Tarifa {infoGeneral.moneda}:</label>
                    <input type="number" placeholder="Ej: 50" value={s.tarifa || ''} onChange={(e) => actualizarServicio(s.id, 'tarifa', e.target.value)} style={{ width: '100px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                  </div>
                )}
              </div>
              
              {s.tipo === 'traslado' ? (
                <div className="form-group-row">
                  <div className="form-group" style={{ flex: 1, display: 'flex', gap: '15px', alignItems: 'center' }}><label><input type="checkbox" checked={s.in || false} onChange={(e) => actualizarServicio(s.id, 'in', e.target.checked)} /> IN</label><label><input type="checkbox" checked={s.out || false} onChange={(e) => actualizarServicio(s.id, 'out', e.target.checked)} /> OUT</label></div>
                  <div className="form-group" style={{ flex: 2 }}><label>Detalle</label><input type="text" value={s.detalle1} onChange={(e) => actualizarServicio(s.id, 'detalle1', e.target.value)} /></div>
                  <div className="form-group" style={{ flex: 2 }}><label>Notas</label><input type="text" value={s.detalle2} onChange={(e) => actualizarServicio(s.id, 'detalle2', e.target.value)} /></div>
                </div>
              ) : s.tipo === 'excursion' ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                  <div className="form-group" style={{ flex: '2 1 200px', margin: 0 }}><label>Nombre de la Excursión</label><input type="text" placeholder="Ej: Pan de Azúcar" value={s.detalle1} onChange={(e) => actualizarServicio(s.id, 'detalle1', e.target.value)} /></div>
                  <div className="form-group" style={{ flex: '1 1 150px', margin: 0 }}><label>Fecha y Hora (Opcional)</label><input type="datetime-local" value={s.fechaHora || ''} onChange={(e) => actualizarServicio(s.id, 'fechaHora', e.target.value)} /></div>
                  <div className="form-group" style={{ flex: '2 1 200px', margin: 0 }}><label>Notas / Observaciones</label><input type="text" placeholder="Ej: No incluye entrada" value={s.detalle2} onChange={(e) => actualizarServicio(s.id, 'detalle2', e.target.value)} /></div>
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
            {TIPOS_SERVICIO_BASE.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <button type="button" className="btn btn-secundario" onClick={agregarServicio} style={{ background: '#11173d', color: 'white' }}>+ Agregar</button>
        </div>

        {/* SECCIÓN 5 */}
        <h3 className="section-title" style={{ marginTop: '30px' }}>5. Galería (Máx 4)</h3>
        <div style={{ padding: '20px', border: '2px dashed #ddd', borderRadius: '8px', textAlign: 'center', background: '#f9fafb' }}>
          <label style={{ cursor: 'pointer', background: '#fff', padding: '10px 20px', border: '1px solid #ccc', borderRadius: '6px', fontWeight: 'bold' }}>📸 Subir Foto<input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleSubirFoto} disabled={loading || imagenes.length >= 4} /></label>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '15px' }}>
            {imagenes.map((img, i) => (
              <div key={i} style={{ width: '80px', height: '80px', border: '1px solid #ddd', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
                <img src={img} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button type="button" onClick={() => setImagenes(imagenes.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: 0, right: 0, background: 'red', color: 'white', border: 'none', cursor: 'pointer', padding: '2px 5px' }}>X</button>
              </div>
            ))}
          </div>
        </div>

        {/* SECCIÓN 6 */}
        <h3 className="section-title" style={{ marginTop: '30px' }}>6. Observaciones Generales</h3>
        <div style={{ padding: '15px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #eee' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#6b7280' }}>Información adicional, requisitos migratorios, tasas, etc.</label>
          <textarea rows="4" style={{ width: '100%', padding: '15px', borderRadius: '6px', border: '1px solid #ddd', resize: 'vertical' }} value={observaciones} onChange={(e) => setObservaciones(e.target.value)}></textarea>
        </div>

        <div style={{ textAlign: 'right', marginTop: '40px', borderTop: '2px solid #eee', paddingTop: '20px' }}>
          <button type="submit" disabled={loading} className="btn btn-primario" style={{ padding: '15px 40px', fontSize: '1.1em' }}>
            {loading ? 'Guardando...' : paqueteAEditar ? '💾 Guardar Cambios' : '🚀 Publicar Paquete'}
          </button>
        </div>

      </form>
    </div>
  );
}