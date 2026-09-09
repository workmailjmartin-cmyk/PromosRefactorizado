'use client';

import { useState } from 'react';
import { useCalculadoraData } from '@/hooks/useCalculadoraData';
import { useAlert } from '@/contexts/AlertContext';

export default function CalculadoraTab({ ready }) {
  const { dbCalculadora, setDbCalculadora, guardarEnFirebase } = useCalculadoraData(ready);
  const { showConfirm } = useAlert();
  const [servicioEditandoId, setServicioEditandoId] = useState(null);

  const srv = dbCalculadora.find((s) => s.id === servicioEditandoId);

  const seleccionar = (id) => setServicioEditandoId(id);

  // Igual al original: estas dos acciones puntuales usan prompt()/confirm()
  // nativos del navegador (no el modal personalizado), tal como en app.js.
  const editarNombreServicio = () => {
    const nuevoNombre = window.prompt('Editá el nombre y el emoji (Ej: 🚌 Paquete en BUS):', srv.nombre);
    if (nuevoNombre) setDbCalculadora((db) => db.map((s) => (s.id === srv.id ? { ...s, nombre: nuevoNombre } : s)));
  };

  const borrarServicioActual = () => {
    if (window.confirm(`¿Seguro que querés borrar el servicio "${srv.nombre}" y todos sus proveedores?`)) {
      setDbCalculadora((db) => db.filter((s) => s.id !== srv.id));
      setServicioEditandoId(null);
    }
  };

  const crearServicio = () => {
    const nombreStr = window.prompt('Escribí el nombre del servicio con su emoji (Ej: 🚀 Viajes a Marte):');
    if (nombreStr) {
      const newId = 'srv_' + Date.now();
      setDbCalculadora((db) => [...db, { id: newId, nombre: nombreStr, proveedores: [] }]);
      setServicioEditandoId(newId);
    }
  };

  const updateProv = (index, field, value) => {
    setDbCalculadora((db) =>
      db.map((s) => (s.id !== servicioEditandoId ? s : { ...s, proveedores: s.proveedores.map((p, i) => (i === index ? { ...p, [field]: value } : p)) }))
    );
  };

  const deleteProv = (index) => {
    setDbCalculadora((db) => db.map((s) => (s.id !== servicioEditandoId ? s : { ...s, proveedores: s.proveedores.filter((_, i) => i !== index) })));
  };

  const agregarProveedor = () => {
    setDbCalculadora((db) =>
      db.map((s) => (s.id !== servicioEditandoId ? s : { ...s, proveedores: [...s.proveedores, { nombre: 'Nuevo Proveedor', tasa: 10, tipo: 'markup' }] }))
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '250px', maxWidth: '300px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: '#11173d', color: 'white', padding: '15px', fontWeight: 'bold' }}>Mis Servicios</div>
          <div style={{ overflowY: 'auto', flex: 1, padding: '10px' }}>
            {dbCalculadora.map((s) => (
              <div
                key={s.id}
                onClick={() => seleccionar(s.id)}
                style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', cursor: 'pointer', transition: 'background 0.2s', background: servicioEditandoId === s.id ? '#e6f4ea' : 'white', fontWeight: servicioEditandoId === s.id ? 'bold' : 'normal' }}
              >
                {s.nombre}
              </div>
            ))}
          </div>
          <button onClick={crearServicio} style={{ width: '100%', padding: '15px', background: '#f9fafb', border: 'none', borderTop: '1px solid #e5e7eb', cursor: 'pointer', color: '#ef5a1a', fontWeight: 'bold' }}>
            + Crear Servicio Nuevo
          </button>
        </div>

        {srv && (
          <div style={{ flex: 2, minWidth: '300px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ cursor: 'pointer', borderBottom: '2px dashed #11173d' }} onClick={editarNombreServicio} title="Tocar para editar nombre">
                ✏️ {srv.nombre}
              </span>
              <button onClick={borrarServicioActual} style={{ background: '#ef5a1a', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8em', cursor: 'pointer', fontWeight: 'bold' }}>
                🗑️ Borrar Servicio
              </button>
            </div>
            <p style={{ color: '#6b7280', fontSize: '0.9em' }}>Acá podés gestionar los proveedores y sus comisiones para este servicio.</p>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '15px', fontSize: '0.9em' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #11173d', color: '#11173d' }}>
                    <th style={{ padding: '12px 10px' }}>Proveedor</th>
                    <th style={{ padding: '12px 10px' }}>Porcentaje (%)</th>
                    <th style={{ padding: '12px 10px' }}>Lógica Matemática</th>
                    <th style={{ padding: '12px 10px', textAlign: 'center' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {srv.proveedores.map((prov, index) => (
                    <tr key={index}>
                      <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>
                        <input type="text" value={prov.nombre} onChange={(e) => updateProv(index, 'nombre', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                      </td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>
                        <input type="number" step="0.1" value={prov.tasa} onChange={(e) => updateProv(index, 'tasa', e.target.value)} style={{ width: '80px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                      </td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>
                        <select value={prov.tipo} onChange={(e) => updateProv(index, 'tipo', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
                          <option value="markup">Suma (Markup)</option>
                          <option value="descuento">Descuento Neta</option>
                        </select>
                      </td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                        <button onClick={() => deleteProv(index)} style={{ background: '#ef5a1a', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                          Borrar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={agregarProveedor} style={{ marginTop: '20px', padding: '10px 15px', background: '#56DDE0', color: '#11173d', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              + Agregar Proveedor
            </button>
          </div>
        )}
      </div>

      {srv && (
        <button
          onClick={() => guardarEnFirebase(dbCalculadora)}
          style={{ width: '100%', background: 'linear-gradient(135deg, #ef5a1a 0%, #ff7a3d 100%)', color: 'white', padding: '15px', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1em', cursor: 'pointer', marginTop: '20px' }}
        >
          💾 Guardar Cambios en Firebase
        </button>
      )}
    </div>
  );
}
