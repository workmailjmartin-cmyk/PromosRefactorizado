'use client';

import { useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';
import { useAlert } from '@/contexts/AlertContext';

// Estados equivalentes a mostrar login-container vs app-container en el original.
export function useStaffAuth() {
  const { showAlert } = useAlert();
  const [status, setStatus] = useState('loading'); // 'loading' | 'logged-out' | 'logged-in'
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setBusy(true);

      // 👻 ESCUDO: si el usuario es anónimo o no tiene email, lo bloqueamos.
      if (u && (u.isAnonymous || !u.email)) {
        await signOut(auth);
        setBusy(false);
        return;
      }

      if (u) {
        try {
          const emailLimpio = u.email.trim().toLowerCase();
          const snap = await getDoc(doc(db, 'usuarios', emailLimpio));
          if (snap.exists()) {
            setCurrentUser(u);
            setUserData(snap.data());
            setStatus('logged-in');
          } else {
            await showAlert('⛔ Sin permisos.');
            await signOut(auth);
            setCurrentUser(null);
            setUserData(null);
            setStatus('logged-out');
          }
        } catch (e) {
          console.error('🔥 ERROR REAL DE FIRESTORE:', e);
          await showAlert('Error de conexión: ' + e.message);
          setStatus('logged-out');
        }
      } else {
        setCurrentUser(null);
        setUserData(null);
        setStatus('logged-out');
      }
      setBusy(false);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async () => {
    setBusy(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setBusy(true);
    await signOut(auth);
    window.location.reload();
  }, []);

  return {
    status,
    currentUser,
    userData,
    login,
    logout,
    loading: status === 'loading' || busy,
  };
}
