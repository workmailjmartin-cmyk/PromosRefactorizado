'use client';
import { useState } from 'react';

export default function GrupalesTab() {
  const [config, setConfig] = useState({
    marcaGlobal: 10,
    comisionGlobal: 15,
  });

  const handleChange = (e) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  const guardarConfiguracion = () => {
    alert(`Configuración guardada:\nMarca: ${config.marcaGlobal}%\nComisión: ${config.comisionGlobal}%`);
    // Acá luego conectamos con Firebase
  };

  return (
    <div className="bg-white rounded-xl">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-[#11173d] mb-2">Configuración de Grupales / Enlatados</h3>
        <p className="text-gray-500">Definí los márgenes de rentabilidad para los paquetes mayoristas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* PANEL GLOBAL */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h4 className="text-lg font-bold text-[#11173d] border-b pb-2 mb-4 flex items-center gap-2">
            🌍 Valores Globales (Por Defecto)
          </h4>
          
          <div className="mb-4">
            <label className="block font-bold text-[#11173d] mb-1">
              % de Marca <span className="text-sm font-normal text-gray-500">(Costo invisible para vendedores)</span>
            </label>
            <div className="flex items-center">
              <input 
                type="number" 
                name="marcaGlobal"
                className="border border-gray-300 p-2 rounded-lg w-24 text-center font-bold focus:outline-none focus:border-[#ef5a1a]" 
                value={config.marcaGlobal} 
                onChange={handleChange} 
              />
              <span className="ml-2 text-gray-600 font-bold">%</span>
            </div>
          </div>

          <div className="mb-6">
            <label className="block font-bold text-[#11173d] mb-1">
              % de Comisión Final <span className="text-sm font-normal text-gray-500">(Tu rentabilidad)</span>
            </label>
            <div className="flex items-center">
              <input 
                type="number" 
                name="comisionGlobal"
                className="border border-gray-300 p-2 rounded-lg w-24 text-center font-bold focus:outline-none focus:border-[#ef5a1a]" 
                value={config.comisionGlobal} 
                onChange={handleChange} 
              />
              <span className="ml-2 text-gray-600 font-bold">%</span>
            </div>
          </div>

          <button 
            onClick={guardarConfiguracion}
            className="w-full bg-[#ef5a1a] hover:bg-[#d94e14] text-white font-bold py-2.5 rounded-lg transition shadow-sm"
          >
            Guardar Globales
          </button>
        </div>

        {/* PANEL EXCEPCIONES */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h4 className="text-lg font-bold text-[#11173d] border-b pb-2 mb-4 flex items-center gap-2">
            🏢 Excepciones por Proveedor
          </h4>
          <p className="text-sm text-gray-500 mb-4">Si un proveedor tiene un trato distinto, agregalo acá para sobreescribir la regla global.</p>
          
          <button className="border-2 border-dashed border-[#11173d] text-[#11173d] font-bold py-3 w-full rounded-lg hover:bg-gray-50 transition">
            + Añadir Proveedor Específico
          </button>
        </div>
      </div>
    </div>
  );
}