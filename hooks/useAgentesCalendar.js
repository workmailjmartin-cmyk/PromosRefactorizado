'use client';

import { useCallback, useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { esRolGestor } from '@/lib/internal/constants';

export function useAgentesCalendar(ready, rol) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [vista, setVista] = useState(() => (esRolGestor(rol) ? 'RED' : 'PROPIOS'));
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTareas = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'calendario_agentes'));
      setTareas(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error('Error al traer agentes:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (ready) fetchTareas();
  }, [ready, fetchTareas]);

  // A diferencia del calendario de Marketing, acá no hay límite de 2 meses hacia atrás.
  const irMesAnterior = () => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const irMesSiguiente = () => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  return { currentDate, vista, setVista, tareas, loading, refetch: fetchTareas, irMesAnterior, irMesSiguiente };
}
