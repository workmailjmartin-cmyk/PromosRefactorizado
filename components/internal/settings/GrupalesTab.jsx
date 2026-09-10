'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';

export default function GrupalesTab() {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    marcaGlobal: 10,
    comisionGlobal: 15,
    proveedoresExcepciones: []
  });

  // Acá después sumaremos la lógica para leer y guardar en Firebase

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#11173d]">Configuración de Grupales / Enlatados</h2>
        <p className="text-gray-500">Definí los márgenes de rentabilidad para los paquetes mayoristas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* PANEL GLOBAL */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-bold text-[#11173d] border-b pb-2 mb-4">🌍 Valores Globales (Por Defecto)</h3>
          
          <div className="mb-4">
            <label className="block font-bold text-gray-700 mb-1">
              % de Marca <span className="text-xs font-normal text-gray-500">(Costo invisible para vendedores)</span>
            </label>
            <div className="flex items-center">
              <input type="number" className="border p-2 rounded w-24 text-center font-bold" value={config.marcaGlobal} readOnly />
              <span className="ml-2 text-gray-600">%</span>
            </div>
          </div>

          <div className="mb-4">
            <label className="block font-bold text-gray-700 mb-1">
              % de Comisión Final <span className="text-xs font-normal text-gray-500">(Tu rentabilidad)</span>
            </label>
            <div className="flex items-center">
              <input type="number" className="border p-2 rounded w-24 text-center font-bold text-[#ef5a1a]" value={config.comisionGlobal} readOnly />
              <span className="ml-2 text-gray-600">%</span>
            </div>
          </div>

          <button className="w-full bg-[#11173d] text-white font-bold py-2 rounded mt-2 hover:bg-blue-900 transition">
            Guardar Globales
          </button>
        </div>

        {/* PANEL EXCEPCIONES POR PROVEEDOR */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-bold text-[#11173d] border-b pb-2 mb-4">🏢 Excepciones por Proveedor</h3>
          <p className="text-sm text-gray-500 mb-4">Si un proveedor tiene un trato distinto, agregalo acá para sobreescribir la regla global.</p>
          
          {/* Botón provisorio, luego lo haremos funcional */}
          <button className="border-2 border-dashed border-gray-400 text-gray-600 font-bold py-3 w-full rounded-lg hover:bg-gray-100 transition">
            + Añadir Proveedor Específico
          </button>
        </div>
      </div>
    </div>
  );
}