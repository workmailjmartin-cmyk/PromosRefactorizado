'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

function getFechasSemana() {
  const hoy = new Date();
  const day = hoy.getDay();
  const diff = hoy.getDate() - day + (day === 0 ? -6 : 1);
  const lunes = new Date(hoy);
  lunes.setDate(diff);

  return Array.from({ length: 5 }, (_, i) => {
    const fecha = new Date(lunes);
    fecha.setDate(lunes.getDate() + i);
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return { fecha, fechaString: `${anio}-${mes}-${dia}`, diaStr: dia, mesStr: mes };
  });
}

export default function WeeklyPlanner({ franquicia, onIrACalendario }) {
  const [open, setOpen] = useState(true);
  const [dias, setDias] = useState(() => getFechasSemana().map((d) => ({ ...d, tareas: 0 })));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snapshot = await getDocs(collection(db, 'calendario_marketing'));
        if (cancelled) return;
        const tareas = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

        const semanas = getFechasSemana().map((info) => {
          const tareasDelDia = tareas.filter((t) => t.fecha === info.fechaString);
          const tareasMias = tareasDelDia.filter((t) =>
            Array.isArray(t.asignado)
              ? t.asignado.includes(franquicia) || t.asignado.includes('TODOS')
              : t.asignado === franquicia || t.asignado === 'TODOS'
          );
          return { ...info, tareas: tareasMias.length };
        });
        setDias(semanas);
      } catch (e) {
        console.error('Error cargando el radar:', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [franquicia]);

  const hoyPuro = new Date().setHours(0, 0, 0, 0);

  return (
    <div id="weekly-planner" className="planner-wrapper" style={{ marginBottom: '20px' }}>
      <div className={`planner-header${open ? ' open' : ''}`} id="planner-header-btn" onClick={() => setOpen((o) => !o)}>
        <div className="planner-title" style={{ fontWeight: 'bold', color: '#11173d' }}>
          📅 Mis Tareas de Solo x Hoy de esta Semana
        </div>
        <div className="planner-toggle-icon">▼</div>
      </div>

      <div className={`planner-body${open ? ' open' : ''}`} id="planner-body-content">
          <div id="mini-planner-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', padding: '20px', background: '#f9fafb' }}>
            {dias.map((d, i) => {
              const esHoy = new Date(d.fecha).setHours(0, 0, 0, 0) === hoyPuro;
              return (
                <div
                  key={d.fechaString}
                  id={`mini-day-${i + 1}`}
                  onClick={() => onIrACalendario(d.diaStr)}
                  style={{
                    background: esHoy ? '#fffdf0' : 'white',
                    border: esHoy ? '2px solid #ef5a1a' : '1px solid #e5e7eb',
                    borderRadius: '8px', padding: '15px', textAlign: 'center', cursor: 'pointer',
                    transition: '0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transform: esHoy ? 'scale(1.03)' : 'scale(1)',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.boxShadow = '0 6px 15px rgba(239,90,26,0.15)')}
                  onMouseOut={(e) => (e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)')}
                >
                  <div style={{ fontWeight: 'bold', color: '#11173d', marginBottom: '5px', textTransform: 'uppercase', fontSize: '0.85em' }}>{DIAS[i]}</div>
                  <div style={{ color: '#6b7280', fontSize: '0.75em', marginBottom: '10px' }}>{d.diaStr}/{d.mesStr}</div>
                  <div>
                    {d.tareas > 0 ? (
                      <div style={{ background: '#eefaf6', color: '#047857', padding: '6px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.9em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', border: '1px solid #10b981' }}>
                        <span>🔔</span> {d.tareas} Tarea{d.tareas > 1 ? 's' : ''}
                      </div>
                    ) : (
                      <div style={{ color: '#9ca3af', fontSize: '0.85em', padding: '6px' }}>☕ No te toca cotizar hoy</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
      </div>
    </div>
  );
}
