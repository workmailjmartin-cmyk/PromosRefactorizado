'use client';

import { useEffect, useState } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '@/lib/firebase';

// Equivalente exacto a:
//   auth.signInAnonymously().then(() => fetchAndLoadPackages()).catch(...)
// El portal de clientes no requiere que el visitante inicie sesión: se loguea
// de forma anónima e invisible solo para poder leer Firestore.
export function useAnonymousAuth() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    signInAnonymously(auth)
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((e) => {
        console.error('Error Auth:', e);
        if (!cancelled) setError(e);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { ready, error };
}
