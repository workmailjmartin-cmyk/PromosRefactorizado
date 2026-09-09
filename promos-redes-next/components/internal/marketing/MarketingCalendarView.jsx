'use client';

import { useEffect, useRef, useState } from 'react';
import { useMarketingCalendar } from '@/hooks/useMarketingCalendar';
import { useMarketingTaskActions } from '@/hooks/useMarketingTaskActions';
import TaskFormModal from './TaskFormModal';
import TaskDetailModal from './TaskDetailModal';
import { esRolGestor } from '@/lib/internal/constants';
import { useAlert } from '@/contexts/AlertContext';

const NOMBRES_MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function MarketingCalendarView({ userData, currentUser, franquicias, etiquetasMarketing, onActionBusy, scrollToDay, forcePropios }) {
  const { showAlert } = useAlert();
  const esGestor = esRolGestor(userData?.rol);
  const { currentDate, vista, setVista, tareas, loading, refetch, irMesAnterior, irMesSiguiente } = useMarketingCalendar(true, userData?.rol, forcePropios);
  const { guardarTarea, borrarTarea } = useMarketingTaskActions({ refetch, onActionBusy });

  const [formTarget, setFormTarget] = useState(null); // { fecha, editingTask } | null
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
  const scrolledRef = useRef(null);

  // Igual a irAlCalendarioMarketing(): al llegar desde el mini-planner con un día
  // objetivo, hacemos scroll suave hasta esa celda y la resaltamos 2.5s.
  useEffect(() => {
    if (!scrollToDay || loading) return;
    if (scrolledRef.current === scrollToDay) return;
    scrolledRef.current = scrollToDay;
    const timeout = setTimeout(() => {
      const el = document.getElementById(`cal-mkt-day-${scrollToDay}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        el.style.transform = 'scale(1.02)';
        el.style.boxShadow = '0 0 0 6px rgba(239, 90, 26, 0.4)';
        setTimeout(() => {
          el.style.transform = 'scale(1)';
          el.style.boxShadow = 'none';
        }, 2500);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 150);
    return () => clearTimeout(timeout);
  }, [scrollToDay, loading]);

  const miFranquicia = userData?.franquicia || '';
  const mes = currentDate.getMonth();
  const anio = currentDate.getFullYear();
  const primerDia = new Date(anio, mes, 1).getDay();
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const hoyPuro = new Date();
  hoyPuro.setHours(0, 0, 0, 0);

  const handleMesAnterior = () => {
    if (!irMesAnterior()) showAlert('Solo se puede visualizar hasta 2 meses atrás.', 'info');
  };

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
      tareasDelDia = tareasDelDia.filter((t) => (Array.isArray(t.asignado) ? t.asignado.includes(miFranquicia) || t.asignado.includes('TODOS') : t.asignado === miFranquicia || t.asignado === 'TODOS'));
    }

    celdas.push(
      <div
        key={dia}
        id={`cal-mkt-day-${diaStr}`}
        onClick={() => setFormTarget({ fecha: fechaString, editingTask: null })}
        style={{ background: colorFondo, opacity: opacidad, border: `1px solid ${esHoy ? '#ef5a1a' : '#e5e7eb'}`, borderRadius: '8px', minHeight: '120px', padding: '10px', display: 'flex', flexDirection: 'column', cursor: 'pointer', boxShadow: esHoy ? '0 0 0 2px rgba(239, 90, 26, 0.2)' : 'none' }}
      >
        <div style={{ fontWeight: 'bold', fontSize: '1.1em', color: esHoy ? '#ef5a1a' : '#11173d', marginBottom: '8px' }}>{dia}</div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {tareasDelDia.map((tarea) => {
            const esParaMi = Array.isArray(tarea.asignado) ? tarea.asignado.includes(miFranquicia) || tarea.asignado.includes('TODOS') : tarea.asignado === miFranquicia || tarea.asignado === 'TODOS';
            const infoEtiqueta = etiquetasMarketing.find((e) => e.nombre === tarea.tipo) || { abrev: 'MKT', color: '#6b7280' };
            const asignadoMostrado = Array.isArray(tarea.asignado)
              ? tarea.asignado.includes('TODOS')
                ? 'Todas'
                : tarea.asignado.length > 1
                  ? `Múltiples (${tarea.asignado.length})`
                  : tarea.asignado[0]
              : tarea.asignado;

            return (
              <div
                key={tarea.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setTareaSeleccionada(tarea);
                }}
                style={{ background: esParaMi ? '#eff6ff' : '#f9fafb', border: '1px solid #e5e7eb', borderLeft: esParaMi ? '4px solid #3b82f6' : '2px solid #e5e7eb', borderRadius: '4px', padding: '6px', marginBottom: '5px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ background: infoEtiqueta.color, color: 'white', padding: '2px 5px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.7em', letterSpacing: '0.5px' }}>{infoEtiqueta.abrev}</span>
                  {esParaMi && <span title="¡Esta tarea es para tu franquicia!" style={{ fontSize: '1.1em' }}>🔔</span>}
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.75em', color: esParaMi ? '#1e3a8a' : '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Para: {asignadoMostrado}</div>
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
        <h2 style={{ color: '#11173d', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>📅 Calendario Cuenta Oficial</h2>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <button onClick={handleMesAnterior} style={{ background: '#f3f4f6', color: '#11173d', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            &lt; Anterior
          </button>
          <h3 style={{ margin: 0, color: '#ef5a1a', minWidth: '180px', textAlign: 'center', textTransform: 'capitalize' }}>
            {NOMBRES_MESES[mes]} {anio}
          </h3>
          <button onClick={irMesSiguiente} style={{ background: '#f3f4f6', color: '#11173d', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            Siguiente &gt;
          </button>
        </div>
      </div>

      <div style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', borderLeft: '4px solid #e74c3c', borderRadius: '8px', padding: '12px 18px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <p style={{ margin: '0 0 8px 0', fontSize: '0.85em', color: '#334155', lineHeight: 1.4 }}>
          <strong>💡 Objetivo del Calendario:</strong> En este calendario está organizada la distribución de contenido para la cuenta oficial de Instagram de la marca entre toda la red de Feliz Viaje. El objetivo es que todos puedan
          participar del desarrollo de contenido, y promover la visibilidad de sus franquicias.
        </p>
        <p style={{ margin: '0 0 8px 0', fontSize: '0.85em', color: '#334155', lineHeight: 1.4 }}>
          🎥 <strong>Videos AGC (Creados por la Agencia):</strong> Deben grabarse por su cuenta en calidad <strong>HD 4K</strong> y ser enviados al equipo de Marketing para desarrollar la edición por Drive o enlace de iCloud.
        </p>
        <p style={{ margin: '0 0 8px 0', fontSize: '0.85em', color: '#334155', lineHeight: 1.4 }}>
          ❗ <strong>¿TENÉS DUDAS SOBRE LO QUE TE TOCA HACER HOY?</strong> Revisá el instructivo:{' '}
          <a href="https://canva.link/instructivoredfeliz" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline', fontWeight: 500 }}>
            https://canva.link/instructivoredfeliz
          </a>
        </p>
        <p style={{ margin: 0, fontSize: '0.85em', color: '#11173d', lineHeight: 1.4, backgroundColor: '#ffe8e5', display: 'inline-block', padding: '3px 8px', borderRadius: '4px' }}>
          ⏰ <strong>Atención:</strong> Las cotizaciones de SOLO POR HOY (COT SXH) deben cargarse hasta las 11:30. Resto de cotizaciones hasta <strong> las 13:00 horas</strong>.
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px', width: '100%' }}>
        <div style={{ background: '#f3f4f6', padding: '4px', borderRadius: '30px', display: 'inline-flex', alignItems: 'center', gap: '5px', border: '1px solid #e5e7eb' }}>
          <button
            onClick={() => setVista('PROPIOS')}
            style={{ border: 'none', background: vista === 'PROPIOS' ? 'white' : 'transparent', color: vista === 'PROPIOS' ? '#ef5a1a' : '#6b7280', boxShadow: vista === 'PROPIOS' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none', padding: '6px 15px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85em' }}
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

      <div style={{ minHeight: '600px' }}>
        {loading ? <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#6b7280', fontWeight: 'bold' }}>Cargando tareas... ⏳</div> : <div id="grid-calendario-marketing">{celdas}</div>}
      </div>

      <div style={{ marginTop: '20px', background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#11173d', fontSize: '0.9em' }}>📌 Referencias de Etiquetas:</h4>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          {etiquetasMarketing.length === 0 ? (
            <span style={{ color: '#999', fontSize: '0.8em' }}>Cargando referencias...</span>
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

      <TaskFormModal
        visible={!!formTarget}
        fecha={formTarget?.fecha}
        editingTask={formTarget?.editingTask}
        franquicias={franquicias}
        etiquetasMarketing={etiquetasMarketing}
        esGestor={esGestor}
        currentUser={currentUser}
        userData={userData}
        onClose={() => setFormTarget(null)}
        onGuardar={handleGuardar}
      />

      <TaskDetailModal
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
