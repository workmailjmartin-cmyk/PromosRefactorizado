'use client';

import { useCallback, useState } from 'react';
import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAlert } from '@/contexts/AlertContext';

// Igual a loadUsersList + el submit de #user-form + confirmDeleteUser.
export function useUsersAdmin({ onActionBusy }) {
  const { showAlert, showConfirm } = useAlert();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadUsersList = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'usuarios'));
      setUsuarios(snap.docs.map((d) => d.data()));
    } catch (e) {
      console.error(e);
      setUsuarios([]);
    }
    setLoading(false);
  }, []);

  const guardarUsuario = useCallback(
    async ({ email, rol, franquicia }) => {
      onActionBusy?.('Guardando...');
      try {
        const emailLimpio = email.trim().toLowerCase();
        await setDoc(doc(db, 'usuarios', emailLimpio), { email: emailLimpio, rol, franquicia, fecha_modificacion: new Date() }, { merge: true });
        await showAlert('Usuario guardado.', 'success');
        await loadUsersList();
        return true;
      } catch (e) {
        console.error(e);
        await showAlert('Error.', 'error');
        return false;
      } finally {
        onActionBusy?.(false);
      }
    },
    [showAlert, loadUsersList, onActionBusy]
  );

  const confirmDeleteUser = useCallback(
    async (email) => {
      if (!(await showConfirm('¿Eliminar?'))) return;
      onActionBusy?.('Eliminando...');
      try {
        await deleteDoc(doc(db, 'usuarios', email));
        await loadUsersList();
      } catch (e) {
        console.error(e);
        await showAlert('Error.', 'error');
      } finally {
        onActionBusy?.(false);
      }
    },
    [showConfirm, showAlert, loadUsersList, onActionBusy]
  );

  return { usuarios, loading, loadUsersList, guardarUsuario, confirmDeleteUser };
}
