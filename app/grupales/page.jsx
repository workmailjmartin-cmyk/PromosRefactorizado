'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import ModalGrupal from '@/components/clientes/ModalGrupal';

export default function GrupalesB2C() {
  const [paquetes, setPaquetes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paqueteSeleccionado, setPaqueteSeleccionado] = useState(null);
  
  // Estados para los filtros
  const [filtroTransporte, setFiltroTransporte] = useState('Todos');
  const [filtroDestino, setFiltroDestino] = useState('');

  useEffect(() => {
    const cargarPaquetes = async () => {
      try {
        const snap = await db.collection('enlatados').get();
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

  const filtrados = paquetes.filter(pkg => {
    const matchTransporte = filtroTransporte === 'Todos' || pkg.transporte === filtroTransporte;
    const matchDestino = pkg.destino?.toLowerCase().includes(filtroDestino.toLowerCase());
    return matchTransporte && matchDestino;
  });

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans relative pb-20">
      
      {/* HEADER CALCADO DE PROMOCIONES */}
      <header className="bg-white py-4 px-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          {/* Reemplazá el src por la ruta real de tu logo si la tenés */}
          <img src="/logo.png" alt="Feliz Viaje" className="h-12 object-contain" onError={(e) => e.target.style.display='none'} />
        </div>
        <h1 className="text-3xl font-extrabold text-[#ef5a1a]">Salidas Grupales</h1>
        <div className="flex items-center gap-4 text-sm font-bold text-gray-700">
          <span className="flex items-center gap-1">📍 + 25 Sucursales</span>
          <span className="flex items-center gap-1">📋 Conocé nuestros servicios</span>
        </div>
      </header>

      {/* CAJA DE FILTROS AL ESTILO PROMOCIONES */}
      <div className="max-w-5xl mx-auto mt-8 px-4">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            
            {/* Buscador de Destino */}
            <div>
              <label className="block text-xs font-bold text-[#11173d] uppercase tracking-wider mb-2">📍 ¿A dónde querés viajar?</label>
              <input 
                type="text" 
                placeholder="Ej: Punta Cana, Brasil..." 
                value={filtroDestino}
                onChange={(e) => setFiltroDestino(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-[#ef5a1a]"
              />
            </div>

            {/* Mega Switch (Aéreo / Bus) */}
            <div>
              <label className="block text-xs font-bold text-[#11173d] uppercase tracking-wider mb-2">✈️ Tipo de Transporte</label>
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                {['Todos', 'Aereo', 'Bus'].map(tipo => (
                  <button
                    key={tipo}
                    onClick={() => setFiltroTransporte(tipo)}
                    className={`flex-1 py-3 text-sm font-bold transition ${
                      filtroTransporte === tipo ? 'bg-[#ef5a1a] text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {tipo === 'Aereo' ? 'Aéreos' : tipo === 'Bus' ? 'Buses' : 'Todos'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-6 border-t pt-6">
            <button 
              onClick={() => { setFiltroDestino(''); setFiltroTransporte('Todos'); }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-6 rounded-lg text-sm transition"
            >
              🧹 Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* TÍTULO DE GRILLA */}
      <div className="text-center mt-12 mb-8">
        <h2 className="text-3xl font-extrabold text-[#11173d] flex items-center justify-center gap-2">
          Paquetes Destacados ✈️
        </h2>
        <p className="text-gray-500 mt-2 font-medium">Nuestras recomendaciones para vos</p>
      </div>

      {/* GRILLA DE RESULTADOS */}
      <div className="max-w-6xl mx-auto px-4 mb-12">
        {loading ? (
          <div className="text-center font-bold text-[#11173d]">Cargando paquetes...</div>
        ) : filtrados.length === 0 ? (
          <div className="text-center font-bold text-gray-500">No encontramos paquetes para esta búsqueda.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtrados.map(pkg => (
              <div 
                key={pkg.id} 
                onClick={() => setPaqueteSeleccionado(pkg)}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-gray-200 flex flex-col cursor-pointer"
              >
                <div className="h-48 relative bg-gray-100">
                  {pkg.imagenes?.length > 0 ? (
                    <img src={pkg.imagenes[0]} alt={pkg.destino} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">Sin foto</div>
                  )}
                  <div className="absolute top-2 left-2 bg-white/90 text-[#11173d] px-2 py-1 rounded text-[10px] font-extrabold uppercase tracking-widest shadow-sm">
                    {pkg.tipo}
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="text-[10px] text-gray-500 font-black tracking-widest uppercase mb-1">
                    {pkg.noches} NOCHES • {pkg.transporte === 'Aereo' ? '✈️ VUELO' : '🚌 BUS'}
                  </div>
                  <h3 className="text-lg font-black text-[#11173d] uppercase leading-tight mb-3">
                    {pkg.destino}
                  </h3>
                  <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                    Incluye: {pkg.inclusiones?.join(' + ')}
                  </p>
                  
                  <div className="mt-auto border-t border-gray-100 pt-3">
                    <div className="text-[10px] text-gray-400 font-bold mb-1">Precio por persona</div>
                    <div className="text-xl font-black text-[#11173d] mb-4">
                      USD {pkg.costo_doble}
                    </div>
                    <button className="w-full bg-[#ef5a1a] text-white font-bold py-2 rounded-lg text-sm transition">
                      Ver paquete
                    </button>
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