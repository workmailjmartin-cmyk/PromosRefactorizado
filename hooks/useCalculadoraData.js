'use client';

import { useCallback, useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CALCULADORA_DEFAULT } from '@/lib/internal/calculadora';
import { useAlert } from '@/contexts/AlertContext';

// Igual a loadCalculadoraConfig() + el botón "Guardar Cambios en Firebase".
export function useCalculadoraData(ready) {
  const { showAlert } = useAlert();
  const [dbCalculadora, setDbCalculadora] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'config', 'calculadora_v3'));
        if (cancelled) return;
        if (snap.exists()) {
          setDbCalculadora(snap.data().servicios || []);
        } else {
          setDbCalculadora(CALCULADORA_DEFAULT);
          await setDoc(doc(db, 'config', 'calculadora_v3'), { servicios: CALCULADORA_DEFAULT });
        }
      } catch (e) {
        console.error('Error cargando calculadora:', e);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready]);

  const guardarEnFirebase = useCallback(
    async (servicios) => {
      try {
        await setDoc(doc(db, 'config', 'calculadora_v3'), { servicios });
        await showAlert('¡Estructura guardada con éxito!', 'success');
      } catch (e) {
        console.error(e);
        await showAlert('Error guardando.', 'error');
      }
    },
    [showAlert]
  );

  return { dbCalculadora, setDbCalculadora, loaded, guardarEnFirebase };
}
