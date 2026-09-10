'use client';
import { useState } from 'react';

export default function FormularioEnlatado({ onCancel, onSave }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    destino: '',
    tipo: 'Grupales',
    transporte: 'Aereo',
    dias: '',
    noches: '',
    costo_doble: '',
    costo_triple: '',
    costo_single: '',
    fechas: [], // Guardaremos un array con múltiples fechas
    inclusiones: [],
    imagenes: [] // Links de Cloudinary
  });

  const [fechaTemp, setFechaTemp] = useState('');

  // ☁️ CONFIGURACIÓN DE CLOUDINARY (Llená estos dos datos)
  const CLOUD_NAME = 'saqeoijc'; 
  const UPLOAD_PRESET = 'fotos_enlatados'; 

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const agregarFecha = () => {
    if (fechaTemp && !formData.fechas.includes(fechaTemp)) {
      setFormData({ ...formData, fechas: [...formData.fechas, fechaTemp] });
      setFechaTemp('');
    }
  };

  const quitarFecha = (f) => {
    setFormData({ ...formData, fechas: formData.fechas.filter(fecha => fecha !== f) });
  };

  const toggleInclusion = (item) => {
    if (formData.inclusiones.includes(item)) {
      setFormData({ ...formData, inclusiones: formData.inclusiones.filter(i => i !== item) });
    } else {
      setFormData({ ...formData, inclusiones: [...formData.inclusiones, item] });
    }
  };

  // 📸 FUNCIÓN MÁGICA QUE SUBE A CLOUDINARY
  const handleSubirFoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const data = new FormData();
    data.append('file', file);
    data.append('upload_preset', UPLOAD_PRESET);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: data
      });
      const fileRes = await res.json();
      
      // Guardamos la URL segura que nos devuelve Cloudinary
      setFormData({ ...formData, imagenes: [...formData.imagenes, fileRes.secure_url] });
    } catch (err) {
      alert("Error al subir la imagen");
    }
    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold text-[#11173d] mb-6">Cargar Paquete Mayorista</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* BLOQUE 1: Info General */}
        <div className="space-y-4">
          <h3 className="font-bold border-b pb-2 text-gray-700">1. Información General</h3>
          <div>
            <label className="block text-sm font-semibold text-gray-600">Destino</label>
            <input type="text" name="destino" value={formData.destino} onChange={handleChange} className="w-full border rounded p-2" placeholder="Ej: Playas del Nordeste..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600">Transporte</label>
              <select name="transporte" value={formData.transporte} onChange={handleChange} className="w-full border rounded p-2">
                <option value="Aereo">✈️ Aéreo</option>
                <option value="Bus">🚌 Bus</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">Tipo de Viaje</label>
              <select name="tipo" value={formData.tipo} onChange={handleChange} className="w-full border rounded p-2">
                <option value="Grupales">Grupales</option>
                <option value="Charter Acompañado">Charter Acompañado</option>
                <option value="Charter No Acompañado">Charter No Acompañado</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold">Días</label><input type="number" name="dias" onChange={handleChange} className="w-full border rounded p-2"/></div>
            <div><label className="block text-sm font-semibold">Noches</label><input type="number" name="noches" onChange={handleChange} className="w-full border rounded p-2"/></div>
          </div>
        </div>

        {/* BLOQUE 2: Costos (El secreto del Proveedor) */}
        <div className="space-y-4">
          <h3 className="font-bold border-b pb-2 text-gray-700">2. Costos Netos (USD)</h3>
          <div>
            <label className="block text-sm font-bold text-[#ef5a1a]">Costo Base Doble * (Obligatorio)</label>
            <input type="number" name="costo_doble" value={formData.costo_doble} onChange={handleChange} className="w-full border-2 border-[#ef5a1a] rounded p-2 bg-orange-50" placeholder="Ej: 1200" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600">Costo Base Triple (Opcional)</label>
              <input type="number" name="costo_triple" onChange={handleChange} className="w-full border rounded p-2 bg-gray-50" placeholder="Ej: 1150"/>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600">Costo Single (Opcional)</label>
              <input type="number" name="costo_single" onChange={handleChange} className="w-full border rounded p-2 bg-gray-50" placeholder="Ej: 1800"/>
            </div>
          </div>
        </div>

        {/* BLOQUE 3: Múltiples Fechas */}
        <div className="space-y-4">
          <h3 className="font-bold border-b pb-2 text-gray-700">3. Fechas de Salida</h3>
          <div className="flex gap-2">
            <input type="date" value={fechaTemp} onChange={(e) => setFechaTemp(e.target.value)} className="border rounded p-2 flex-1" />
            <button type="button" onClick={agregarFecha} className="bg-[#11173d] text-white px-4 py-2 rounded font-bold">Añadir</button>
          </div>
          {/* Etiquetas de fechas añadidas */}
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.fechas.map(f => (
              <span key={f} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                📅 {f} <button type="button" onClick={() => quitarFecha(f)} className="text-red-500 font-bold">×</button>
              </span>
            ))}
            {formData.fechas.length === 0 && <span className="text-sm text-gray-400">Sin fechas añadidas...</span>}
          </div>
        </div>

        {/* BLOQUE 4: Inclusiones y Fotos */}
        <div className="space-y-4">
          <h3 className="font-bold border-b pb-2 text-gray-700">4. Qué Incluye y Fotos</h3>
          <div className="flex flex-wrap gap-3">
            {['✈️ Vuelos', '🏨 Alojamiento', '🚕 Traslados', '🛡️ Seguro', '🌲 Excursiones'].map(item => (
              <label key={item} className="flex items-center gap-2 cursor-pointer bg-gray-100 px-3 py-1 rounded-full text-sm">
                <input type="checkbox" onChange={() => toggleInclusion(item)} checked={formData.inclusiones.includes(item)} className="accent-[#ef5a1a]" />
                {item}
              </label>
            ))}
          </div>

          <div className="mt-4 p-4 border-2 border-dashed border-gray-300 rounded-lg text-center bg-gray-50">
            <label className="cursor-pointer">
              <span className="bg-[#2ecc71] hover:bg-[#27ae60] text-white px-4 py-2 rounded font-bold transition">📸 Subir Foto (Cloudinary)</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleSubirFoto} disabled={loading} />
            </label>
            {loading && <p className="text-sm text-blue-500 mt-2">Subiendo imagen, por favor esperá...</p>}
            
            <div className="flex gap-2 mt-4 justify-center">
              {formData.imagenes.map((img, i) => (
                <div key={i} className="h-16 w-16 rounded overflow-hidden shadow">
                  <img src={img} alt="preview" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-4 border-t pt-4">
        <button onClick={onCancel} className="px-6 py-2 rounded text-gray-600 font-bold hover:bg-gray-100">Cancelar</button>
        <button onClick={() => onSave(formData)} className="bg-[#ef5a1a] hover:bg-[#d94e14] text-white px-6 py-2 rounded font-bold shadow">💾 Guardar Paquete</button>
      </div>
    </div>
  );
}