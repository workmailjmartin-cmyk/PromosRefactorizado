'use client';

import { useCallback, useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { esRolGestor } from '@/lib/internal/constants';

export function useMarketingCalendar(ready, rol, forcePropios) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [vista, setVista] = useState(() => (forcePropios ? 'PROPIOS' : esRolGestor(rol) ? 'RED' : 'PROPIOS'));
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTareas = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'calendario_marketing'));
      setTareas(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error('Error al traer tareas:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (ready) fetchTareas();
  }, [ready, fetchTareas]);

  // Igual al original: no se puede retroceder más de 2 meses. Devuelve false
  // cuando el límite impide el movimiento, para que el llamador muestre el aviso.
  const irMesAnterior = () => {
    const hoy = new Date();
    const mesMinimo = new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1);
    const mesDestino = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    if (mesDestino < mesMinimo) return false;
    setCurrentDate(mesDestino);
    return true;
  };

  const irMesSiguiente = () => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  return { currentDate, vista, setVista, tareas, loading, refetch: fetchTareas, irMesAnterior, irMesSiguiente };
}
