'use client';

import { useCallback } from 'react';
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAlert } from '@/contexts/AlertContext';

export function useAgentesTaskActions({ refetch, onActionBusy }) {
  const { showAlert, showConfirm } = useAlert();

  const guardarTarea = useCallback(
    async (payload, editingId) => {
      onActionBusy?.('Guardando tarea...');
      try {
        if (editingId) await updateDoc(doc(db, 'calendario_agentes', editingId), payload);
        else await addDoc(collection(db, 'calendario_agentes'), payload);
        await showAlert('¡Tarea Agente guardada!', 'success');
        await refetch();
        return true;
      } catch (e) {
        console.error(e);
        await showAlert('Error al guardar', 'error');
        return false;
      } finally {
        onActionBusy?.(false);
      }
    },
    [showAlert, refetch, onActionBusy]
  );

  const borrarTarea = useCallback(
    async (id) => {
      if (!(await showConfirm('¿Eliminar esta tarea del agente?'))) return false;
      onActionBusy?.('Eliminando...');
      try {
        await deleteDoc(doc(db, 'calendario_agentes', id));
        await refetch();
        return true;
      } catch (e) {
        console.error(e);
        await showAlert('Error', 'error');
        return false;
      } finally {
        onActionBusy?.(false);
      }
    },
    [showAlert, showConfirm, refetch, onActionBusy]
  );

  return { guardarTarea, borrarTarea };
}
