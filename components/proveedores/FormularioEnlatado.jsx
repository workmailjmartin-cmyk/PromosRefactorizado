'use client';
import { useState, useEffect } from 'react';
import { PROVINCIAS } from '@/lib/internal/constants';
import { AEROPUERTOS_POR_PROVINCIA } from '@/lib/internal/airports';

const TIPOS_SERVICIO_BASE = [
  { value: '', label: 'Seleccionar Servicio...' },
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
  hotel2Nombre: '', hotel2Estrellas: '3', hotel2Ubicacion: '', hotel2Regimen: '',
  doble: { mayor: '', menor: '', child: '' },
  triple: { mayor: '', menor: '', child: '' },
  cuadruple: { mayor: '', menor: '', child: '' },
  single: { mayor: '' }
};

export default function FormularioEnlatado({ onCancel, onSave, paqueteAEditar = null }) {
  const [loading, setLoading] = useState(false);
  
  const [infoGeneral, setInfoGeneral] = useState({ destino: '', tipo: 'Grupales', transporte: 'bus-mix', dias: '', noches: '', origenProvincia: '', origenAeropuerto: '', moneda: 'USD', financiacion: '' });
  const [paradas, setParadas] = useState([]);
  const [tempParada, setTempParada] = useState('');
  const [vuelos, setVuelos] = useState([]);
  
  const [salidas, setSalidas] = useState([]);
  const [tempSalida, setTempSalida] = useState(tarifaVacia);
  const [mostrarHotel2, setMostrarHotel2] = useState(false);
  
  const [itinerario, setItinerario] = useState([]);
  const [tempDia, setTempDia] = useState({ titulo: '', descripcion: '' });
  const [servicios, setServicios] = useState([]);
  const [servicioSeleccionado, setServicioSeleccionado] = useState('');
  const [imagenes, setImagenes] = useState([]);
  const [observaciones, setObservaciones] = useState('');
  const [descripcionViaje, setDescripcionViaje] = useState('');

  const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  useEffect(() => {
    if (paqueteAEditar) {
      setInfoGeneral({
        destino: paqueteAEditar.destino || '', tipo: paqueteAEditar.tipo || 'Grupales', transporte: paqueteAEditar.transporte || 'bus-mix',
        dias: paqueteAEditar.dias || '', noches: paqueteAEditar.noches || '', origenProvincia: paqueteAEditar.origenProvincia || '',
        origenAeropuerto: paqueteAEditar.origenAeropuerto || paqueteAEditar.origenPrincipal || '', moneda: paqueteAEditar.moneda || 'USD',
        financiacion: paqueteAEditar.financiacion || ''
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
      setDescripcionViaje(paqueteAEditar.descripcionViaje || '');
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
    // FILTRO ANTI-NEGATIVOS: Si es menor a 0, lo fuerza a 0.
    const valorLimpio = valor === '' ? '' : Math.max(0, parseInt(valor) || 0);
    setTempSalida(prev => ({
      ...prev,
      [base]: { ...prev[base], [campo]: valorLimpio }
    }));
  };

  const agregarSalida = () => {
    if (tempSalida.fecha && tempSalida.hotelNombre && tempSalida.hotelRegimen && tempSalida.doble.mayor) {
      // Magia para concatenar los dos hoteles si existe el segundo
      const hotelYRegimenCombinado = tempSalida.hotel2Nombre 
        ? `${tempSalida.hotelNombre} (${tempSalida.hotelRegimen}) + ${tempSalida.hotel2Nombre} (${tempSalida.hotel2Regimen})`
        : `${tempSalida.hotelNombre} - ${tempSalida.hotelRegimen}`;
      
      const nuevaSalida = { 
        id: tempSalida.id || Date.now(), 
        fecha: tempSalida.fecha, 
        hotelRegimen: hotelYRegimenCombinado, 
        hotelNombre: tempSalida.hotelNombre,
        hotelEstrellas: tempSalida.hotelEstrellas,
        hotelUbicacion: tempSalida.hotelUbicacion,
        regimen: tempSalida.hotelRegimen,
        hotel2Nombre: tempSalida.hotel2Nombre,
        hotel2Estrellas: tempSalida.hotel2Estrellas,
        hotel2Ubicacion: tempSalida.hotel2Ubicacion,
        hotel2Regimen: tempSalida.hotel2Regimen,
        doble: tempSalida.doble, 
        triple: tempSalida.triple, 
        cuadruple: tempSalida.cuadruple, 
        single: tempSalida.single 
      };

      const nuevasSalidas = [...salidas.filter(s => s.id !== nuevaSalida.id), nuevaSalida];
      nuevasSalidas.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
      
      setSalidas(nuevasSalidas);
      setTempSalida(tarifaVacia);
      setMostrarHotel2(false); // Ocultamos el hotel 2 al guardar
    } else { alert("La Fecha, Nombre del Hotel 1, Régimen 1 y Precio Doble (Adulto) son obligatorios."); }
  };

  const editarSalida = (id) => {
    if (!window.confirm('¿Querés editar esta fila de tarifa?')) return;

    let salidasActuales = [...salidas];

    // Autoguardado si había fila a medias
    if (tempSalida.fecha && tempSalida.hotelNombre && tempSalida.doble?.mayor) {
      const hotelYRegimenCombinado = tempSalida.hotel2Nombre 
        ? `${tempSalida.hotelNombre} (${tempSalida.hotelRegimen}) + ${tempSalida.hotel2Nombre} (${tempSalida.hotel2Regimen})`
        : `${tempSalida.hotelNombre} - ${tempSalida.hotelRegimen}`;
      
      const salidaPrevia = { 
        ...tempSalida, 
        id: tempSalida.id || Date.now(),
        hotelRegimen: hotelYRegimenCombinado, 
        regimen: tempSalida.hotelRegimen 
      };
      salidasActuales = [...salidasActuales.filter(s => s.id !== salidaPrevia.id), salidaPrevia];
    }

    const salidaAEditar = salidasActuales.find(s => s.id === id);
    if (salidaAEditar) {
      setTempSalida({
        id: salidaAEditar.id,
        fecha: salidaAEditar.fecha,
        hotelNombre: salidaAEditar.hotelNombre || salidaAEditar.hotelRegimen?.split(' - ')[0] || '',
        hotelEstrellas: salidaAEditar.hotelEstrellas || '3',
        hotelUbicacion: salidaAEditar.hotelUbicacion || '',
        hotelRegimen: salidaAEditar.regimen || salidaAEditar.hotelRegimen?.split(' - ')[1] || '',
        hotel2Nombre: salidaAEditar.hotel2Nombre || '',
        hotel2Estrellas: salidaAEditar.hotel2Estrellas || '3',
        hotel2Ubicacion: salidaAEditar.hotel2Ubicacion || '',
        hotel2Regimen: salidaAEditar.hotel2Regimen || '',
        doble: salidaAEditar.doble,
        triple: salidaAEditar.triple,
        cuadruple: salidaAEditar.cuadruple,
        single: salidaAEditar.single
      });
      // Si la fila a editar tiene un hotel 2, abrimos la caja automáticamente
      setMostrarHotel2(!!salidaAEditar.hotel2Nombre);

      const nuevasSalidas = salidasActuales.filter(s => s.id !== id);
      nuevasSalidas.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
      setSalidas(nuevasSalidas);
    }
  };

  const eliminarSalida = (id) => {
    if (window.confirm('¿Estás seguro de que querés eliminar esta tarifa?')) {
      setSalidas(salidas.filter(x => x.id !== id));
    }
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
      paradas_ascenso: paradas, vuelos, tarifario: salidas, itinerario, servicios, imagenes, observaciones, descripcionViaje
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
          <div className="form-group" style={{ flex: '2 1 200px' }}>
            <label>Financiación *</label>
            <select required name="financiacion" value={infoGeneral.financiacion} onChange={handleInfoChange}>
              <option value="">Seleccionar...</option>
              <option value="sena_30">Seña 30% + Resto Financiado</option>
              <option value="financiado_100">100% Financiado</option>
            </select>
          </div>
        </div>

        {/* CUADRO DE DESCRIPCIÓN DEL VIAJE */}
        <div className="form-group" style={{ marginTop: '15px', marginBottom: '20px' }}>
          <label style={{ fontWeight: 'bold', color: '#11173d' }}>Descripción General del Viaje</label>
          <textarea 
            rows="4" 
            style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ddd', resize: 'vertical' }} 
            placeholder="Describí los puntos fuertes del paquete, la experiencia general, atractivos, etc." 
            value={descripcionViaje} 
            onChange={(e) => setDescripcionViaje(e.target.value)}
          ></textarea>
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

        {/* SECCIÓN 2: TARIFARIO (MINIMALISTA) */}
        <h3 className="section-title" style={{ marginTop: '30px', borderBottom: '2px solid #f3f4f6', paddingBottom: '10px' }}>2. Tarifario Neto ({infoGeneral.moneda})</h3>
        
        <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* DATOS DEL HOTEL 1 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
            <div className="form-group" style={{ margin: 0 }}><label style={{ color: '#4b5563', fontSize: '0.85rem' }}>Fecha Salida *</label><input type="date" value={tempSalida.fecha} onChange={e => setTempSalida({...tempSalida, fecha: e.target.value})} style={{ border: '1px solid #d1d5db', borderRadius: '6px' }} /></div>
            <div className="form-group" style={{ margin: 0 }}><label style={{ color: '#4b5563', fontSize: '0.85rem' }}>Nombre Hotel 1 *</label><input type="text" placeholder="Ej: Hilton Copacabana" value={tempSalida.hotelNombre} onChange={e => setTempSalida({...tempSalida, hotelNombre: e.target.value})} style={{ border: '1px solid #d1d5db', borderRadius: '6px' }} /></div>
            <div className="form-group" style={{ margin: 0 }}><label style={{ color: '#4b5563', fontSize: '0.85rem' }}>Estrellas</label><select value={tempSalida.hotelEstrellas || '3'} onChange={e => setTempSalida({...tempSalida, hotelEstrellas: e.target.value})} style={{ border: '1px solid #d1d5db', borderRadius: '6px' }}><option value="1">1 ⭐</option><option value="2">2 ⭐</option><option value="3">3 ⭐</option><option value="4">4 ⭐</option><option value="5">5 ⭐</option></select></div>
            <div className="form-group" style={{ margin: 0 }}><label style={{ color: '#4b5563', fontSize: '0.85rem' }}>Ubicación (Maps)</label><input type="url" placeholder="https://maps.app.goo.gl/..." value={tempSalida.hotelUbicacion || ''} onChange={e => setTempSalida({...tempSalida, hotelUbicacion: e.target.value})} style={{ border: '1px solid #d1d5db', borderRadius: '6px' }} /></div>
            <div className="form-group" style={{ margin: 0 }}><label style={{ color: '#4b5563', fontSize: '0.85rem' }}>Régimen 1 *</label><select value={tempSalida.hotelRegimen} onChange={e => setTempSalida({...tempSalida, hotelRegimen: e.target.value})} style={{ border: '1px solid #d1d5db', borderRadius: '6px' }}>{OPCIONES_REGIMEN.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}</select></div>
          </div>

          {/* BOTON PARA HOTEL 2 (COMBINADO) */}
          {!mostrarHotel2 ? (
            <div>
              <button type="button" onClick={() => setMostrarHotel2(true)} style={{ background: '#f3f4f6', color: '#374151', border: '1px dashed #9ca3af', padding: '6px 15px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}>+ Combinar con 2do Hotel</button>
            </div>
          ) : (
            <div style={{ background: '#f8fafc', borderLeft: '3px solid #0ea5e9', padding: '15px', borderRadius: '0 8px 8px 0', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, color: '#0ea5e9', fontSize: '0.9rem', textTransform: 'uppercase' }}>Hotel 2 (Combinado)</h4>
                <button type="button" onClick={() => { setMostrarHotel2(false); setTempSalida({...tempSalida, hotel2Nombre: '', hotel2Ubicacion: '', hotel2Regimen: ''}); }} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>✕ Quitar</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                <div className="form-group" style={{ margin: 0 }}><label style={{ color: '#4b5563', fontSize: '0.85rem' }}>Nombre Hotel 2 *</label><input type="text" placeholder="Ej: Pousada Centro" value={tempSalida.hotel2Nombre} onChange={e => setTempSalida({...tempSalida, hotel2Nombre: e.target.value})} style={{ border: '1px solid #d1d5db', borderRadius: '6px' }} /></div>
                <div className="form-group" style={{ margin: 0 }}><label style={{ color: '#4b5563', fontSize: '0.85rem' }}>Estrellas</label><select value={tempSalida.hotel2Estrellas || '3'} onChange={e => setTempSalida({...tempSalida, hotel2Estrellas: e.target.value})} style={{ border: '1px solid #d1d5db', borderRadius: '6px' }}><option value="1">1 ⭐</option><option value="2">2 ⭐</option><option value="3">3 ⭐</option><option value="4">4 ⭐</option><option value="5">5 ⭐</option></select></div>
                <div className="form-group" style={{ margin: 0 }}><label style={{ color: '#4b5563', fontSize: '0.85rem' }}>Ubicación (Maps)</label><input type="url" placeholder="Opcional..." value={tempSalida.hotel2Ubicacion || ''} onChange={e => setTempSalida({...tempSalida, hotel2Ubicacion: e.target.value})} style={{ border: '1px solid #d1d5db', borderRadius: '6px' }} /></div>
                <div className="form-group" style={{ margin: 0 }}><label style={{ color: '#4b5563', fontSize: '0.85rem' }}>Régimen 2 *</label><select value={tempSalida.hotel2Regimen} onChange={e => setTempSalida({...tempSalida, hotel2Regimen: e.target.value})} style={{ border: '1px solid #d1d5db', borderRadius: '6px' }}>{OPCIONES_REGIMEN.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}</select></div>
              </div>
            </div>
          )}

          {/* TARIFAS (Inputs) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '10px' }}>
            {[
              { key: 'doble', title: 'Base Doble *' },
              { key: 'triple', title: 'Base Triple' },
              { key: 'cuadruple', title: 'Base Cuádruple' }
            ].map(base => (
              <div key={base.key} style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#11173d', fontSize: '0.9rem' }}>{base.title}</h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {/* Se agregó el min="0" para evitar tipeo de negativos */}
                  <div style={{ flex: 1 }}><label style={{ fontSize: '0.7rem', color: '#6b7280' }}>Adulto</label><input type="number" min="0" style={{ padding: '6px', width: '100%', border: '1px solid #d1d5db', borderRadius: '4px' }} value={tempSalida[base.key].mayor} onChange={e => handleTarifaChange(base.key, 'mayor', e.target.value)} /></div>
                  <div style={{ flex: 1 }}><label style={{ fontSize: '0.7rem', color: '#6b7280' }}>Menor</label><input type="number" min="0" style={{ padding: '6px', width: '100%', border: '1px solid #d1d5db', borderRadius: '4px' }} value={tempSalida[base.key].menor} onChange={e => handleTarifaChange(base.key, 'menor', e.target.value)} /></div>
                  <div style={{ flex: 1 }}><label style={{ fontSize: '0.7rem', color: '#6b7280' }}>Child</label><input type="number" min="0" style={{ padding: '6px', width: '100%', border: '1px solid #d1d5db', borderRadius: '4px' }} value={tempSalida[base.key].child} onChange={e => handleTarifaChange(base.key, 'child', e.target.value)} /></div>
                </div>
              </div>
            ))}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb', flex: 1 }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#11173d', fontSize: '0.9rem' }}>Base Single</h4>
                <div><label style={{ fontSize: '0.7rem', color: '#6b7280' }}>Adulto</label><input type="number" min="0" style={{ padding: '6px', width: '100%', border: '1px solid #d1d5db', borderRadius: '4px' }} value={tempSalida.single.mayor} onChange={e => handleTarifaChange('single', 'mayor', e.target.value)} /></div>
              </div>
            </div>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <button type="button" className="btn btn-primario" onClick={agregarSalida} style={{ height: '45px', borderRadius: '8px', padding: '0 30px' }}>➕ Guardar Fila a la Tabla</button>
          </div>
        </div>

        {/* TABLA RESUMEN MINIMALISTA */}
        {salidas.length > 0 && (
          <div style={{ overflowX: 'auto', marginTop: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', background: '#fff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <table style={{ width: '100%', tableLayout: 'auto', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f9fafb', color: '#374151', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Salida y Alojamiento</th>
                  <th colSpan="3" style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #e5e7eb', borderLeft: '1px solid #f3f4f6' }}>Doble</th>
                  <th colSpan="3" style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #e5e7eb', borderLeft: '1px solid #f3f4f6' }}>Triple</th>
                  <th colSpan="3" style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #e5e7eb', borderLeft: '1px solid #f3f4f6' }}>Cuádruple</th>
                  <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #e5e7eb', borderLeft: '1px solid #f3f4f6' }}>Sgl</th>
                  <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Acciones</th>
                </tr>
                <tr style={{ background: '#fff', color: '#9ca3af', fontSize: '0.7rem' }}>
                  <th style={{ borderBottom: '1px solid #e5e7eb' }}></th>
                  <th style={{ padding: '8px', borderLeft: '1px solid #f3f4f6', borderBottom: '1px solid #e5e7eb' }}>Ad</th><th style={{ borderBottom: '1px solid #e5e7eb' }}>Me</th><th style={{ borderBottom: '1px solid #e5e7eb' }}>Ch</th>
                  <th style={{ padding: '8px', borderLeft: '1px solid #f3f4f6', borderBottom: '1px solid #e5e7eb' }}>Ad</th><th style={{ borderBottom: '1px solid #e5e7eb' }}>Me</th><th style={{ borderBottom: '1px solid #e5e7eb' }}>Ch</th>
                  <th style={{ padding: '8px', borderLeft: '1px solid #f3f4f6', borderBottom: '1px solid #e5e7eb' }}>Ad</th><th style={{ borderBottom: '1px solid #e5e7eb' }}>Me</th><th style={{ borderBottom: '1px solid #e5e7eb' }}>Ch</th>
                  <th style={{ padding: '8px', borderLeft: '1px solid #f3f4f6', borderBottom: '1px solid #e5e7eb' }}>Ad</th>
                  <th style={{ borderBottom: '1px solid #e5e7eb' }}></th>
                </tr>
              </thead>
              <tbody style={{ textAlign: 'center', color: '#4b5563' }}>
                {salidas.map(s => {
                  // Función helper para que el cero o vacío se vea como un guión elegante
                  const formatPrecio = (val) => (!val || val === '0' || val === 0) ? <span style={{color: '#d1d5db'}}>-</span> : <span style={{fontWeight: 'bold', color: '#11173d'}}>${val}</span>;
                  
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.2s' }} onMouseOver={e=>e.currentTarget.style.background='#f8fafc'} onMouseOut={e=>e.currentTarget.style.background='transparent'}>
                      <td style={{ padding: '15px', textAlign: 'left', lineHeight: '1.4' }}>
                        <div style={{ display: 'inline-block', background: '#e0f2fe', color: '#0284c7', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '5px' }}>{s.fecha}</div>
                        
                        {/* HOTEL 1 */}
                        <div style={{ fontWeight: 'bold', color: '#11173d', fontSize: '0.9rem' }}>{s.hotelNombre}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: s.hotel2Nombre ? '8px' : '0' }}>{s.regimen}</div>
                        
                        {/* HOTEL 2 (Si existe) */}
                        {s.hotel2Nombre && (
                          <>
                            <div style={{ fontSize: '0.7rem', color: '#0ea5e9', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px' }}>+ Combinado con:</div>
                            <div style={{ fontWeight: 'bold', color: '#11173d', fontSize: '0.9rem' }}>{s.hotel2Nombre}</div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{s.hotel2Regimen}</div>
                          </>
                        )}
                      </td>
                      
                      <td style={{ borderLeft: '1px solid #f3f4f6' }}>{formatPrecio(s.doble.mayor)}</td><td>{formatPrecio(s.doble.menor)}</td><td>{formatPrecio(s.doble.child)}</td>
                      <td style={{ borderLeft: '1px solid #f3f4f6' }}>{formatPrecio(s.triple.mayor)}</td><td>{formatPrecio(s.triple.menor)}</td><td>{formatPrecio(s.triple.child)}</td>
                      <td style={{ borderLeft: '1px solid #f3f4f6' }}>{formatPrecio(s.cuadruple.mayor)}</td><td>{formatPrecio(s.cuadruple.menor)}</td><td>{formatPrecio(s.cuadruple.child)}</td>
                      <td style={{ borderLeft: '1px solid #f3f4f6' }}>{formatPrecio(s.single.mayor)}</td>
                      
                      <td style={{ padding: '15px' }}>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                          <button type="button" onClick={() => editarSalida(s.id)} style={{ color: '#0ea5e9', border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem', transition: 'transform 0.1s' }} title="Editar">✏️</button>
                          <button type="button" onClick={() => eliminarSalida(s.id)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem', transition: 'transform 0.1s' }} title="Eliminar">🗑️</button>
                        </div>
                      </td>
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
        <h3 className="section-title" style={{ marginTop: '30px' }}>4. Otros Servicios ({esAereo ? 'Traslados, Excursiones, Seguro' : 'Seguro, Excursiones'})</h3>
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
        <h3 className="section-title" style={{ marginTop: '30px', marginBottom: '5px' }}>5. Galería (Máx 4 fotos)</h3>
        <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: '15px' }}>
          * La <b>primera foto</b> debe ser del destino turístico (Portada).<br/>
          * Las <b>otras 3 fotos</b> deben ser de las instalaciones del hotel.
        </p>
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