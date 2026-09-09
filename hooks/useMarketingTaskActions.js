'use client';

import { useCallback } from 'react';
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAlert } from '@/contexts/AlertContext';

export function useMarketingTaskActions({ refetch, onActionBusy }) {
  const { showAlert, showConfirm } = useAlert();

  const guardarTarea = useCallback(
    async (payload, editingId) => {
      onActionBusy?.(editingId ? 'Actualizando tarea...' : 'Guardando tarea...');
      try {
        if (editingId) await updateDoc(doc(db, 'calendario_marketing', editingId), payload);
        else await addDoc(collection(db, 'calendario_marketing'), payload);
        await showAlert('¡Tarea guardada con éxito!', 'success');
        await refetch();
        return true;
      } catch (e) {
        console.error(e);
        await showAlert('Error al guardar en BD.', 'error');
        return false;
      } finally {
        onActionBusy?.(false);
      }
    },
    [showAlert, refetch, onActionBusy]
  );

  const borrarTarea = useCallback(
    async (id) => {
      if (!(await showConfirm('⚠️ ¿Seguro que querés ELIMINAR esta tarea del calendario?'))) return false;
      onActionBusy?.('Borrando tarea...');
      try {
        await deleteDoc(doc(db, 'calendario_marketing', id));
        await refetch();
        await showAlert('Tarea eliminada', 'success');
        return true;
      } catch (e) {
        console.error(e);
        await showAlert('Error al borrar', 'error');
        return false;
      } finally {
        onActionBusy?.(false);
      }
    },
    [showAlert, showConfirm, refetch, onActionBusy]
  );

  return { guardarTarea, borrarTarea };
}
