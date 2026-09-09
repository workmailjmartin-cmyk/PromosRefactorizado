'use client';

import { useState } from 'react';
import { useAgentesCalendar } from '@/hooks/useAgentesCalendar';
import { useAgentesTaskActions } from '@/hooks/useAgentesTaskActions';
import AgentesFormModal from './AgentesFormModal';
import AgentesDetailModal from './AgentesDetailModal';

const NOMBRES_MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function AgentesCalendarView({ userData, currentUser, franquicias, etiquetasMarketing, onActionBusy }) {
  const { currentDate, vista, setVista, tareas, loading, refetch, irMesAnterior, irMesSiguiente } = useAgentesCalendar(true, userData?.rol);
  const { guardarTarea, borrarTarea } = useAgentesTaskActions({ refetch, onActionBusy });

  const [formTarget, setFormTarget] = useState(null);
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);

  const miFranquicia = userData?.franquicia || '';
  const mes = currentDate.getMonth();
  const anio = currentDate.getFullYear();
  const primerDia = new Date(anio, mes, 1).getDay();
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const hoyPuro = new Date();
  hoyPuro.setHours(0, 0, 0, 0);

  const handleGuardar = async (payload, editingId) => {
    const ok = await guardarTarea(payload, editingId);
    if (ok) {
      setFormTarget(null);
      setTareaSeleccionada(null);
    }
  };

  const handleBorrar = async (id) => {
    const ok = await borrarTarea(id);
    if (ok) setTareaSeleccionada(null);
  };

  const celdas = [];
  for (let i = 0; i < primerDia; i++) celdas.push(<div key={`vacio-${i}`} style={{ background: 'transparent', minHeight: '100px' }} />);

  for (let dia = 1; dia <= diasEnMes; dia++) {
    const fechaCelda = new Date(anio, mes, dia);
    const esHoy = fechaCelda.getTime() === hoyPuro.getTime();
    const esPasado = fechaCelda < hoyPuro;
    const diaSemana = fechaCelda.getDay();
    const esFinde = diaSemana === 0 || diaSemana === 6;
    const colorFondo = esFinde ? '#f9fafb' : 'white';
    const opacidad = esPasado ? 0.4 : esFinde ? 0.8 : 1;
    const diaStr = String(dia).padStart(2, '0');
    const fechaString = `${anio}-${String(mes + 1).padStart(2, '0')}-${diaStr}`;

    let tareasDelDia = tareas.filter((t) => t.fecha === fechaString);
    if (vista === 'PROPIOS') {
      tareasDelDia = tareasDelDia.filter((t) => t.asignado === miFranquicia || t.asignado === 'TODOS');
    }

    celdas.push(
      <div
        key={dia}
        onClick={() => setFormTarget({ fecha: fechaString, editingTask: null })}
        style={{ background: colorFondo, opacity: opacidad, border: `1px solid ${esHoy ? '#f1c40f' : '#e5e7eb'}`, borderRadius: '8px', minHeight: '120px', padding: '10px', display: 'flex', flexDirection: 'column', cursor: 'pointer', boxShadow: esHoy ? '0 0 0 2px rgba(241, 196, 15, 0.2)' : 'none' }}
      >
        <div style={{ fontWeight: 'bold', fontSize: '1.1em', color: esHoy ? '#f1c40f' : '#11173d', marginBottom: '8px' }}>{dia}</div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {tareasDelDia.map((tarea) => {
            const esParaMi = tarea.asignado === miFranquicia || tarea.asignado === 'TODOS';
            const infoEtiqueta = etiquetasMarketing.find((e) => e.nombre === tarea.tipo) || { abrev: 'AGT', color: '#6b7280' };
            return (
              <div
                key={tarea.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setTareaSeleccionada(tarea);
                }}
                style={{ background: esParaMi ? '#fffdf0' : '#f9fafb', border: '1px solid #e5e7eb', borderLeft: esParaMi ? '4px solid #f1c40f' : '2px solid #e5e7eb', borderRadius: '4px', padding: '6px', marginBottom: '5px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ background: infoEtiqueta.color, color: 'white', padding: '2px 5px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.7em' }}>{infoEtiqueta.abrev}</span>
                  {esParaMi && <span style={{ fontSize: '1.1em' }}>🔔</span>}
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.75em', color: esParaMi ? '#7a6200' : '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Para: {tarea.asignado}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e5e7eb', paddingBottom: '15px', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ color: '#11173d', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>🌟 @viajafelizcon</h2>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <button onClick={irMesAnterior} style={{ background: '#f3f4f6', color: '#11173d', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            &lt; Anterior
          </button>
          <h3 style={{ margin: 0, color: '#f1c40f', minWidth: '180px', textAlign: 'center', textTransform: 'capitalize' }}>
            {NOMBRES_MESES[mes]} {anio}
          </h3>
          <button onClick={irMesSiguiente} style={{ background: '#f3f4f6', color: '#11173d', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            Siguiente &gt;
          </button>
        </div>
      </div>

      <div style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#fff9e6', borderLeft: '4px solid #f1c40f', borderRadius: '8px', padding: '12px 18px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <p style={{ margin: '0 0 8px 0', fontSize: '0.85em', color: '#334155', lineHeight: 1.4 }}>
          <strong>💡 Objetivo del Calendario:</strong> Espacio de coordinación y seguimiento para el desarrollo y metas del equipo de Agentes Felices de cada franquicia.
        </p>
        <p style={{ margin: 0, fontSize: '0.85em', color: '#334155', lineHeight: 1.4 }}>
          ❗ <strong>Para conocer más información sobre cómo usar tu cuenta @viajafelizcon usando este calendario:</strong> lee todo lo que necesitás saber en esta presentación:{' '}
          <a href="https://canva.link/viajafelizoncalendariofv" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline', fontWeight: 500 }}>
            https://canva.link/viajafelizoncalendariofv
          </a>
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px', width: '100%' }}>
        <div style={{ background: '#f3f4f6', padding: '4px', borderRadius: '30px', display: 'inline-flex', alignItems: 'center', gap: '5px', border: '1px solid #e5e7eb' }}>
          <button
            onClick={() => setVista('PROPIOS')}
            style={{ border: 'none', background: vista === 'PROPIOS' ? 'white' : 'transparent', color: vista === 'PROPIOS' ? '#f1c40f' : '#6b7280', boxShadow: vista === 'PROPIOS' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none', padding: '6px 15px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85em' }}
          >
            👁️ Mis Tareas
          </button>
          <button
            onClick={() => setVista('RED')}
            style={{ border: 'none', background: vista === 'RED' ? 'white' : 'transparent', color: vista === 'RED' ? '#1e3a8a' : '#6b7280', boxShadow: vista === 'RED' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none', padding: '6px 15px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85em' }}
          >
            🌐 Red FV
          </button>
        </div>
      </div>

      <div className="header-dias-semana" style={{ marginBottom: '10px' }}>
        {DIAS_SEMANA.map((d) => (
          <div key={d} style={{ textAlign: 'center', fontWeight: 'bold', color: '#6b7280', padding: '10px 0', background: '#f9fafb', borderRadius: '6px' }}>
            {d}
          </div>
        ))}
      </div>

      <div id="grid-calendario-agentes" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '15px', minHeight: '600px' }}>
        {loading ? <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#6b7280', fontWeight: 'bold' }}>Cargando tareas... ⏳</div> : celdas}
      </div>

      <div style={{ marginTop: '20px', background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#11173d', fontSize: '0.9em' }}>📌 Referencias de Etiquetas:</h4>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          {etiquetasMarketing.length === 0 ? (
            <span style={{ color: '#999', fontSize: '0.8em' }}>No hay etiquetas.</span>
          ) : (
            etiquetasMarketing.map((eti) => (
              <div key={eti.nombre} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85em', color: '#555', background: '#f9fafb', padding: '4px 10px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                <span style={{ background: eti.color, color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.8em' }}>{eti.abrev}</span>
                <span style={{ fontWeight: 500 }}>= {eti.nombre}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <AgentesFormModal
        visible={!!formTarget}
        fecha={formTarget?.fecha}
        editingTask={formTarget?.editingTask}
        franquicias={franquicias}
        etiquetasMarketing={etiquetasMarketing}
        currentUser={currentUser}
        userData={userData}
        onClose={() => setFormTarget(null)}
        onGuardar={handleGuardar}
      />

      <AgentesDetailModal
        tarea={tareaSeleccionada}
        etiquetasMarketing={etiquetasMarketing}
        userData={userData}
        currentUser={currentUser}
        onClose={() => setTareaSeleccionada(null)}
        onEditar={(tarea) => {
          setTareaSeleccionada(null);
          setFormTarget({ fecha: tarea.fecha, editingTask: tarea });
        }}
        onBorrar={handleBorrar}
      />
    </div>
  );
}
