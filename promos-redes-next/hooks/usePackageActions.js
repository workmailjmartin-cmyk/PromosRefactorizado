'use client';

import { useCallback } from 'react';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAlert } from '@/contexts/AlertContext';

// Igual a deletePackage / approvePackage / toggleVisibilidad en app.js.
// startEditing() no se incluye todavía: abre el formulario de Carga, que se
// migra en una fase siguiente.
export function usePackageActions({ onBusy, onDone, refetch }) {
  const { showAlert, showConfirm } = useAlert();

  const deletePackage = useCallback(async (pkg) => {
    if (!(await showConfirm('⚠️ ¿Eliminar este paquete para siempre?'))) return;
    onBusy?.('Eliminando paquete...');
    try {
      const id = pkg.id_paquete || pkg.id || pkg['item.id'];
      await deleteDoc(doc(db, 'paquetes', id));
      await showAlert('Paquete eliminado correctamente.', 'success');
      onDone?.();
      await refetch();
    } catch (e) {
      console.error('Error al borrar en Firebase:', e);
      await showAlert('Error al eliminar.', 'error');
    }
    onBusy?.(false);
  }, [showAlert, showConfirm, onBusy, onDone, refetch]);

  const approvePackage = useCallback(async (pkg) => {
    if (!(await showConfirm('¿Aprobar publicación en FEED?'))) return;
    onBusy?.('Aprobando...');
    try {
      const id = pkg.id_paquete || pkg.id || pkg['item.id'];
      await updateDoc(doc(db, 'paquetes', id), { status: 'approved' });
      await showAlert('Paquete Aprobado y publicado.', 'success');
      onDone?.();
      await refetch();
    } catch (e) {
      console.error('Error al aprobar en Firebase:', e);
      await showAlert('Error al aprobar.', 'error');
    }
    onBusy?.(false);
  }, [showAlert, showConfirm, onBusy, onDone, refetch]);

  const toggleVisibilidad = useCallback(async (id, campo, estadoActual) => {
    onBusy?.('Actualizando visibilidad...');
    try {
      const nuevoEstado = !estadoActual;
      const updateData = { [campo]: nuevoEstado };
      if (nuevoEstado === true) {
        if (campo === 'reflejo_cliente') updateData.ocultar_cliente = false;
        if (campo === 'ocultar_cliente') updateData.reflejo_cliente = false;
      }
      await updateDoc(doc(db, 'paquetes', id), updateData);
      onDone?.();
      await refetch();
      await showAlert('Visibilidad actualizada en la web de clientes.', 'success');
    } catch (e) {
      console.error('Error al actualizar visibilidad:', e);
      await showAlert('Error de conexión al actualizar.', 'error');
    }
    onBusy?.(false);
  }, [showAlert, onBusy, onDone, refetch]);

  return { deletePackage, approvePackage, toggleVisibilidad };
}
