'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';

export default function GrupalesB2C() {
  const [paquetes, setPaquetes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para los filtros
  const [filtroTransporte, setFiltroTransporte] = useState('Todos'); // 'Todos', 'Aereo', 'Bus'
  const [filtroDestino, setFiltroDestino] = useState('');

  useEffect(() => {
    const cargarPaquetes = async () => {
      try {
        const snap = await db.collection('enlatados').get();
        // Traemos los datos y solo mostramos los activos
        const data = snap.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(pkg => pkg.estado === 'activo');
        
        setPaquetes(data);
      } catch (error) {
        console.error("Error al cargar grupales:", error);
      }
      setLoading(false);
    };
    cargarPaquetes();
  }, []);

  // Lógica para filtrar en tiempo real
  const filtrados = paquetes.filter(pkg => {
    const matchTransporte = filtroTransporte === 'Todos' || pkg.transporte === filtroTransporte;
    const matchDestino = pkg.destino?.toLowerCase().includes(filtroDestino.toLowerCase());
    return matchTransporte && matchDestino;
  });

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      
      {/* HEADER HERO (El encabezado gigante) */}
      <div className="bg-[#11173d] text-white py-16 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Salidas Grupales y Paquetes</h1>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
          Descubrí nuestros viajes armados con todo resuelto. Elegí tu destino, seleccioná la fecha y preparate para disfrutar.
        </p>
      </div>

      {/* BARRA DE BÚSQUEDA Y MEGA SWITCH */}
      <div className="max-w-6xl mx-auto -mt-8 px-4 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 flex flex-col md:flex-row gap-4 items-center justify-between border border-gray-100">
          
          {/* El Mega Switch de 3 posiciones */}
          <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-auto">
            {['Todos', 'Aereo', 'Bus'].map(tipo => (
              <button
                key={tipo}
                onClick={() => setFiltroTransporte(tipo)}
                className={`flex-1 md:w-32 py-2 px-4 rounded-lg font-bold text-sm transition-all ${
                  filtroTransporte === tipo 
                    ? 'bg-white text-[#ef5a1a] shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tipo === 'Aereo' ? '✈️ Aéreos' : tipo === 'Bus' ? '🚌 Buses' : '🌍 Todos'}
              </button>
            ))}
          </div>

          {/* Buscador de Destino */}
          <div className="w-full md:flex-1 relative">
            <span className="absolute left-3 top-3 text-gray-400">📍</span>
            <input 
              type="text" 
              placeholder="¿A dónde querés viajar?" 
              value={filtroDestino}
              onChange={(e) => setFiltroDestino(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[#ef5a1a]/50 font-medium"
            />
          </div>
        </div>
      </div>

      {/* GRILLA DE RESULTADOS */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {loading ? (
          <div className="text-center text-[#11173d] font-bold py-20 text-xl">Buscando los mejores viajes... ⏳</div>
        ) : filtrados.length === 0 ? (
          <div className="text-center text-gray-500 font-bold py-20 text-xl">No encontramos paquetes para esta búsqueda 😔</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtrados.map(pkg => (
              <div 
                key={pkg.id} 
                onClick={() => alert('Próximamente: Abre el modal con el calendario y detalle')}
                className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all border border-gray-100 flex flex-col cursor-pointer transform hover:-translate-y-1"
              >
                {/* Imagen del paquete (Directo de Cloudinary) */}
                <div className="h-56 bg-gray-200 relative">
                  {pkg.imagenes && pkg.imagenes.length > 0 ? (
                    <img src={pkg.imagenes[0]} alt={pkg.destino} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">Sin foto</div>
                  )}
                  {/* Etiqueta flotante (Grupales, Charter, etc.) */}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-[#11173d] px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                    {pkg.tipo}
                  </div>
                </div>

                {/* Contenido de la Tarjeta */}
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-extrabold text-[#11173d] uppercase leading-tight mb-3">
                    {pkg.destino}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-sm text-[#11173d] font-bold mb-4">
                    <span className="bg-[#eef2f5] px-2 py-1 rounded-md">🌙 {pkg.noches} Noches</span>
                    <span className="bg-[#eef2f5] px-2 py-1 rounded-md">{pkg.transporte === 'Aereo' ? '✈️ Vuelo' : '🚌 Bus'}</span>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2 mb-6 flex-1 font-medium">
                    Incluye: {pkg.inclusiones?.join(' • ')}
                  </p>

                  <div className="border-t border-gray-100 pt-4 mt-auto">
                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Precio por persona</div>
                    <div className="text-2xl font-black text-[#ef5a1a]">
                      {/* OJO: Acá mostraremos el cálculo final, por ahora ponemos el base provisorio */}
                      USD ${pkg.costo_doble}*
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}