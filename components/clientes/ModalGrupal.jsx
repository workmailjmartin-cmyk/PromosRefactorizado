'use client';
import { useState } from 'react';

export default function ModalGrupal({ pkg, onClose }) {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);

  if (!pkg) return null;

  // Transformamos el formato "2026-10-15" en datos para nuestro almanaque visual
  const fechasFormateadas = (pkg.fechas || []).map(f => {
    const [year, month, day] = f.split('-');
    const dateObj = new Date(year, month - 1, day);
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    return {
      original: f,
      diaNombre: dias[dateObj.getDay()],
      diaNum: day,
      mesNombre: meses[dateObj.getMonth()]
    };
  });

  // Texto para WhatsApp
  const nroWhatsApp = "5493512444868"; // Cambialo por el tuyo
  const mensaje = encodeURIComponent(`¡Hola Feliz Viaje! Vengo de la web y quiero consultar por el paquete a ${pkg.destino}.${fechaSeleccionada ? ` Me interesa la salida del ${fechaSeleccionada}.` : ''}`);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Cabecera con Imagen */}
        <div className="relative h-48 md:h-64 bg-gray-200 shrink-0">
          {pkg.imagenes && pkg.imagenes.length > 0 ? (
            <img src={pkg.imagenes[0]} alt={pkg.destino} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">Sin imagen</div>
          )}
          {/* Botón Cerrar */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold transition"
          >
            ✕
          </button>
          {/* Título flotante */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-12">
            <h2 className="text-3xl font-black text-white uppercase leading-tight">{pkg.destino}</h2>
            <div className="text-white/90 font-medium mt-1">
              {pkg.dias} Días / {pkg.noches} Noches • {pkg.transporte === 'Aereo' ? '✈️ Aéreo' : '🚌 Bus'}
            </div>
          </div>
        </div>

        {/* Cuerpo del Modal (Scrolleable) */}
        <div className="p-6 overflow-y-auto flex-1">
          
          <div className="bg-orange-50 border-l-4 border-[#ef5a1a] p-4 mb-6 rounded-r-lg">
            <p className="text-[#d94e14] font-bold text-sm">
              ⚠ Importante: Tarifas y disponibilidad sujetas a confirmación al momento de reservar. Verificá tu cupo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Columna Izquierda: Info */}
            <div>
              <h3 className="text-xl font-bold text-[#11173d] border-b pb-2 mb-4">¿Qué incluye?</h3>
              <ul className="space-y-3">
                {(pkg.inclusiones || []).map((inc, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-700 font-medium">
                    <span className="text-green-500 text-lg">✓</span> {inc}
                  </li>
                ))}
              </ul>
            </div>

            {/* Columna Derecha: El "Calendario Visual" */}
            <div>
              <h3 className="text-xl font-bold text-[#11173d] border-b pb-2 mb-4">Elegí tu fecha de salida</h3>
              
              {fechasFormateadas.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {fechasFormateadas.map((f, i) => {
                    const isSelected = fechaSeleccionada === f.original;
                    return (
                      <button 
                        key={i}
                        onClick={() => setFechaSeleccionada(f.original)}
                        className={`flex flex-col items-center p-2 rounded-xl border-2 transition-all ${
                          isSelected 
                            ? 'border-[#ef5a1a] bg-orange-50 shadow-md transform scale-105' 
                            : 'border-gray-200 hover:border-[#11173d]'
                        }`}
                      >
                        <span className={`text-xs font-bold uppercase ${isSelected ? 'text-[#ef5a1a]' : 'text-gray-500'}`}>{f.mesNombre}</span>
                        <span className={`text-2xl font-black ${isSelected ? 'text-[#11173d]' : 'text-gray-700'}`}>{f.diaNum}</span>
                        <span className="text-xs text-gray-400 font-medium">{f.diaNombre}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 italic">Múltiples salidas disponibles. Consultá con un asesor.</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer con Precio y Botón WhatsApp */}
        <div className="bg-[#11173d] p-6 shrink-0 flex flex-col md:flex-row items-center justify-between gap-4 rounded-b-2xl">
          <div>
            <div className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">Precio Final por Persona</div>
            <div className="text-3xl font-black text-[#56DDE0]">
              {/* ACÁ EN LA ETAPA 5 APLICAREMOS LA FÓRMULA DE RENTABILIDAD */}
              USD ${pkg.costo_doble}*
            </div>
            <div className="text-white/50 text-xs mt-1">* En base doble</div>
          </div>
          
          <a 
            href={`https://wa.me/${nroWhatsApp}?text=${mensaje}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full md:w-auto bg-[#25d366] hover:bg-[#1da851] text-white px-8 py-3 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors shadow-lg"
          >
            💬 Consultar por WhatsApp
          </a>
        </div>

      </div>
    </div>
  );
}