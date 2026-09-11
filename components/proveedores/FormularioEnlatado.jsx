'use client';
import { useState } from 'react';

const TIPOS_SERVICIO = [
  { value: '', label: 'Seleccionar Servicio...' },
  { value: 'aereo', label: '✈️ Aéreo' },
  { value: 'hotel', label: '🏨 Hotel' },
  { value: 'traslado', label: '🚕 Traslado' },
  { value: 'excursion', label: '🌲 Excursión' },
  { value: 'seguro', label: '🛡️ Asistencia / Seguro' },
];

export default function FormularioEnlatado({ onCancel, onSave }) {
  const [loading, setLoading] = useState(false);

  // 1. Info General y Rutas
  const [infoGeneral, setInfoGeneral] = useState({
    destino: '',
    tipo: 'Grupales',
    transporte: 'bus',
    dias: '',
    noches: '',
    origenPrincipal: '',
  });
  const [paradas, setParadas] = useState([]);
  const [tempParada, setTempParada] = useState('');

  // 2. Fechas y Tarifas
  const [salidas, setSalidas] = useState([]);
  const [tempSalida, setTempSalida] = useState({ fecha: '', doble: '', triple: '', single: '', cuadruple: '' });

  // 3. Itinerario
  const [itinerario, setItinerario] = useState([]);
  const [tempDia, setTempDia] = useState({ titulo: '', descripcion: '' });

  // 4. Servicios (Modular)
  const [servicios, setServicios] = useState([]);
  const [servicioSeleccionado, setServicioSeleccionado] = useState('');

  // 5. Fotos
  const [imagenes, setImagenes] = useState([]);

  const CLOUD_NAME = 'tu_cloud_name_aqui';
  const UPLOAD_PRESET = 'fotos_enlatados';

  // --- HANDLERS ---
  const handleInfoChange = (e) => setInfoGeneral({ ...infoGeneral, [e.target.name]: e.target.value });

  const agregarParada = () => {
    if (tempParada && !paradas.includes(tempParada)) {
      setParadas([...paradas, tempParada]);
      setTempParada('');
    }
  };

  const agregarSalida = () => {
    if (tempSalida.fecha && tempSalida.doble) {
      setSalidas([...salidas, { id: Date.now(), ...tempSalida }]);
      setTempSalida({ fecha: '', doble: '', triple: '', single: '', cuadruple: '' });
    } else {
      alert("La Fecha y el Costo Base Doble son obligatorios.");
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
    setServicios([...servicios, { id: Date.now(), tipo: servicioSeleccionado, detalle1: '', detalle2: '' }]);
    setServicioSeleccionado('');
  };

  const handleSubirFoto = async (e) => {
    if (imagenes.length >= 4) {
      alert("Máximo 4 imágenes permitidas.");
      return;
    }
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    const data = new FormData();
    data.append('file', file);
    data.append('upload_preset', UPLOAD_PRESET);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: data });
      const fileRes = await res.json();
      setImagenes([...imagenes, fileRes.secure_url]);
    } catch (err) {
      alert("Error al subir imagen.");
    }
    setLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...infoGeneral,
      paradas_ascenso: paradas,
      tarifario: salidas,
      itinerario,
      servicios,
      imagenes
    });
  };

  return (
    <div className="upload-form-container" style={{ background: '#fff', borderRadius: '8px', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '15px' }}>
        <h2 className="section-title" style={{ margin: 0, color: '#11173d' }}>
          Cargar Paquete Mayorista
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
            <input type="text" required name="destino" placeholder="Ej: Cataratas Premium - Puerto Iguazú" value={infoGeneral.destino} onChange={handleInfoChange} />
          </div>
          <div className="form-group">
            <label>Transporte</label>
            <select name="transporte" value={infoGeneral.transporte} onChange={handleInfoChange}>
              <option value="bus">🚌 Bus Cama / Mix</option>
              <option value="aereo">✈️ Aéreo</option>
            </select>
          </div>
        </div>
        <div className="form-group-row">
          <div className="form-group"><label>Días</label><input type="number" required name="dias" onChange={handleInfoChange} /></div>
          <div className="form-group"><label>Noches</label><input type="number" required name="noches" onChange={handleInfoChange} /></div>
          <div className="form-group"><label>Lugar de Salida (Origen)</label><input type="text" required name="origenPrincipal" placeholder="Ej: Córdoba" onChange={handleInfoChange} /></div>
        </div>

        {/* PARADAS / ASCENSOS */}
        {infoGeneral.transporte === 'bus' && (
          <div className="form-group-row" style={{ alignItems: 'flex-end', background: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Paradas / Ascensos Adicionales (Ruta del Bus)</label>
              <input type="text" placeholder="Ej: Leones, Rosario..." value={tempParada} onChange={(e) => setTempParada(e.target.value)} />
            </div>
            <button type="button" className="btn btn-secundario" onClick={agregarParada} style={{ background: '#11173d', color: 'white', height: '42px' }}>
              + Sumar Parada
            </button>
          </div>
        )}
        {paradas.length > 0 && (
          <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {paradas.map(p => (
              <span key={p} style={{ background: '#e5e7eb', padding: '5px 12px', borderRadius: '15px', fontSize: '0.85em', fontWeight: 'bold' }}>
                📍 {p} <button type="button" onClick={() => setParadas(paradas.filter(x => x !== p))} style={{ color: 'red', marginLeft: '5px' }}>x</button>
              </span>
            ))}
          </div>
        )}

        {/* SECCIÓN 2: TARIFARIO MATRICIAL */}
        <h3 className="section-title" style={{ marginTop: '30px' }}>2. Tarifario Neto (USD)</h3>
        <div className="form-group-row" style={{ background: '#fff5f0', padding: '15px', borderRadius: '8px', alignItems: 'flex-end', border: '1px solid #ffedd5' }}>
          <div className="form-group"><label style={{ color: '#ef5a1a' }}>Fecha Salida</label><input type="date" value={tempSalida.fecha} onChange={e => setTempSalida({...tempSalida, fecha: e.target.value})} /></div>
          <div className="form-group"><label>Base Doble *</label><input type="number" placeholder="USD" value={tempSalida.doble} onChange={e => setTempSalida({...tempSalida, doble: e.target.value})} /></div>
          <div className="form-group"><label>Base Triple</label><input type="number" placeholder="USD" value={tempSalida.triple} onChange={e => setTempSalida({...tempSalida, triple: e.target.value})} /></div>
          <div className="form-group"><label>Base Cuádruple</label><input type="number" placeholder="USD" value={tempSalida.cuadruple} onChange={e => setTempSalida({...tempSalida, cuadruple: e.target.value})} /></div>
          <div className="form-group"><label>Base Single</label><input type="number" placeholder="USD" value={tempSalida.single} onChange={e => setTempSalida({...tempSalida, single: e.target.value})} /></div>
          <button type="button" className="btn btn-primario" onClick={agregarSalida} style={{ height: '42px' }}>+ Fila</button>
        </div>

        {salidas.length > 0 && (
          <table style={{ width: '100%', marginTop: '15px', borderCollapse: 'collapse', fontSize: '0.9em', border: '1px solid #ddd' }}>
            <thead>
              <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Salida</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Doble</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Triple</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Cuádruple</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Single</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {salidas.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>{s.fecha}</td>
                  <td style={{ padding: '10px' }}>${s.doble}</td>
                  <td style={{ padding: '10px' }}>{s.triple ? `$${s.triple}` : '-'}</td>
                  <td style={{ padding: '10px' }}>{s.cuadruple ? `$${s.cuadruple}` : '-'}</td>
                  <td style={{ padding: '10px' }}>{s.single ? `$${s.single}` : '-'}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}><button type="button" onClick={() => setSalidas(salidas.filter(x => x.id !== s.id))} style={{ color: 'red', fontWeight: 'bold' }}>X</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* SECCIÓN 3: ITINERARIO */}
        <h3 className="section-title" style={{ marginTop: '30px' }}>3. Itinerario Resumido</h3>
        <div className="form-group-row" style={{ alignItems: 'flex-start' }}>
          <div className="form-group" style={{ flex: 1 }}><label>Título del Día (Ej: Día 1 - Salida)</label><input type="text" value={tempDia.titulo} onChange={e => setTempDia({...tempDia, titulo: e.target.value})} /></div>
          <div className="form-group" style={{ flex: 2 }}><label>Descripción de actividades</label><textarea rows="2" value={tempDia.descripcion} onChange={e => setTempDia({...tempDia, descripcion: e.target.value})}></textarea></div>
          <div className="form-group" style={{ paddingTop: '24px' }}>
            <button type="button" className="btn btn-secundario" onClick={agregarDiaItinerario} style={{ background: '#11173d', color: 'white' }}>+ Día</button>
          </div>
        </div>
        
        {itinerario.length > 0 && (
          <div style={{ marginTop: '15px', padding: '15px', background: '#f9fafb', borderRadius: '8px', borderLeft: '4px solid #ef5a1a' }}>
            {itinerario.map(d => (
              <div key={d.id} style={{ marginBottom: '10px' }}>
                <b style={{ color: '#11173d' }}>Día {d.dia}: {d.titulo}</b>
                <p style={{ margin: '5px 0 0 0', fontSize: '0.9em', color: '#666' }}>{d.descripcion}</p>
              </div>
            ))}
          </div>
        )}

        {/* SECCIÓN 4: SERVICIOS */}
        <h3 className="section-title" style={{ marginTop: '30px' }}>4. Servicios Incluidos (Hoteles, Excursiones)</h3>
        <div id="servicios-container">
          {servicios.map(s => (
            <div key={s.id} style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '10px', position: 'relative' }}>
              <button type="button" onClick={() => setServicios(servicios.filter(x => x.id !== s.id))} style={{ position: 'absolute', right: '15px', top: '15px', color: 'red', fontWeight: 'bold' }}>X</button>
              <h4 style={{ margin: '0 0 10px 0', textTransform: 'uppercase', fontSize: '0.9em', color: '#ef5a1a' }}>{s.tipo}</h4>
              <div className="form-group-row">
                <div className="form-group"><label>{s.tipo === 'hotel' ? 'Nombre del Hotel' : 'Detalle / Proveedor'}</label><input type="text" onChange={(e) => {s.detalle1 = e.target.value; setServicios([...servicios])}} /></div>
                <div className="form-group"><label>{s.tipo === 'hotel' ? 'Régimen (Ej: Desayuno)' : 'Notas adicionales'}</label><input type="text" onChange={(e) => {s.detalle2 = e.target.value; setServicios([...servicios])}} /></div>
              </div>
            </div>
          ))}
        </div>
        <div className="add-service-bar" style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
          <select style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} value={servicioSeleccionado} onChange={(e) => setServicioSeleccionado(e.target.value)}>
            {TIPOS_SERVICIO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <button type="button" className="btn btn-secundario" onClick={agregarServicio} style={{ background: '#11173d', color: 'white' }}>
            + Agregar Servicio
          </button>
        </div>

        {/* SECCIÓN 5: FOTOS */}
        <h3 className="section-title" style={{ marginTop: '30px' }}>5. Galería de Imágenes (Máx 4)</h3>
        <div style={{ padding: '20px', border: '2px dashed #ddd', borderRadius: '8px', textAlign: 'center', background: '#f9fafb' }}>
          <label style={{ cursor: 'pointer', background: '#fff', padding: '10px 20px', border: '1px solid #ccc', borderRadius: '6px', fontWeight: 'bold' }}>
            📸 Subir Foto
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleSubirFoto} disabled={loading || imagenes.length >= 4} />
          </label>
          {loading && <p style={{ color: '#ef5a1a', fontWeight: 'bold', marginTop: '10px' }}>Subiendo...</p>}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '15px' }}>
            {imagenes.map((img, i) => (
              <div key={i} style={{ width: '80px', height: '80px', border: '1px solid #ddd', borderRadius: '6px', overflow: 'hidden' }}>
                <img src={img} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>

        {/* BOTÓN FINAL */}
        <div style={{ textAlign: 'right', marginTop: '30px', borderTop: '2px solid #eee', paddingTop: '20px' }}>
          <button type="submit" className="btn btn-primario" style={{ padding: '15px 40px', fontSize: '1.1em' }}>
            Guardar Paquete Mayorista
          </button>
        </div>

      </form>
    </div>
  );
}