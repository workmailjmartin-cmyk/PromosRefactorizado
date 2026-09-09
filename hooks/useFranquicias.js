'use client';

import { useCallback, useState } from 'react';
import { doc, getDoc, updateDoc, setDoc, arrayUnion, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAlert } from '@/contexts/AlertContext';

// CRUD de metadata/config.franquicias, igual a cargarFranquiciasAdmin +
// gestionarFranquicia (editar/borrar) + el botón "+ Sumar Franquicia".
export function useFranquicias({ franquicias, refetchConfig, onActionBusy, refetchUsers }) {
  const { showAlert, showConfirm } = useAlert();
  const [modoEdicion, setModoEdicion] = useState(false);

  const agregarFranquicia = useCallback(
    async (nombre) => {
      const nueva = nombre.trim();
      if (!nueva) {
        await showAlert('Escribí el nombre de la franquicia primero.', 'error');
        return false;
      }
      onActionBusy?.('Guardando franquicia...');
      try {
        await setDoc(doc(db, 'metadata', 'config'), { franquicias: arrayUnion(nueva) }, { merge: true });
        await refetchConfig();
        await showAlert('Franquicia guardada correctamente.', 'success');
        return true;
      } catch (e) {
        console.error(e);
        await showAlert('Error técnico: ' + e.message, 'error');
        return false;
      } finally {
        onActionBusy?.(false);
      }
    },
    [showAlert, refetchConfig, onActionBusy]
  );

  // accion: nuevo nombre, o el literal 'BORRAR', o null/'' si se canceló.
  const gestionarFranquicia = useCallback(
    async (index, nombreActual, accion) => {
      if (!accion || accion === nombreActual) return;

      onActionBusy?.('Actualizando...');
      try {
        const snap = await getDoc(doc(db, 'metadata', 'config'));
        let listaFranquicias = snap.exists() ? snap.data().franquicias || [] : [];

        if (accion.trim().toUpperCase() === 'BORRAR') {
          if (!(await showConfirm(`⚠️ ¿Seguro que querés eliminar "${nombreActual}" permanentemente?`))) {
            onActionBusy?.(false);
            return;
          }
          listaFranquicias = listaFranquicias.filter((_, i) => i !== index);
          await updateDoc(doc(db, 'metadata', 'config'), { franquicias: listaFranquicias });
        } else {
          const nuevoNombre = accion.trim();
          listaFranquicias = listaFranquicias.map((f, i) => (i === index ? nuevoNombre : f));
          await updateDoc(doc(db, 'metadata', 'config'), { franquicias: listaFranquicias });

          // Cascada: todos los usuarios con la franquicia vieja pasan a la nueva.
          const usersQuery = query(collection(db, 'usuarios'), where('franquicia', '==', nombreActual));
          const usersSnap = await getDocs(usersQuery);
          if (!usersSnap.empty) {
            const batch = writeBatch(db);
            usersSnap.forEach((userDoc) => batch.update(userDoc.ref, { franquicia: nuevoNombre }));
            await batch.commit();
            await refetchUsers?.();
          }
        }

        await refetchConfig();
        await showAlert('¡Actualizado con éxito!', 'success');
      } catch (e) {
        console.error(e);
        await showAlert('Error al modificar.', 'error');
      } finally {
        onActionBusy?.(false);
      }
    },
    [showAlert, showConfirm, refetchConfig, refetchUsers, onActionBusy]
  );

  return {
    modoEdicion,
    toggleModoEdicion: () => setModoEdicion((m) => !m),
    agregarFranquicia,
    gestionarFranquicia,
    franquicias,
  };
}
