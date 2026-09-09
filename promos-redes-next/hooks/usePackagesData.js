'use client';

import { useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getCutoffEpoch } from '@/lib/packageUtils';
import { SALIDAS_INICIALES } from '@/lib/constants';

const SALIDAS_PLACEHOLDER = SALIDAS_INICIALES.map((s) => s.value).filter(Boolean);

// Equivalente a fetchAndLoadPackages() en clientes.js: trae metadata/config
// (texto del listón "Solo x Hoy", vidriera destacada, banco de imágenes) y
// la colección "paquetes", aplicando exactamente el mismo filtro de visibilidad.
export function usePackagesData(ready) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allPackages, setAllPackages] = useState([]);
  const [vidriera, setVidriera] = useState([]);
  const [textoListon, setTextoListon] = useState('SOLO X HOY');
  const [bancoImagenes, setBancoImagenes] = useState([]);
  const [salidasDisponibles, setSalidasDisponibles] = useState(SALIDAS_PLACEHOLDER);
  const [salidasCargadas, setSalidasCargadas] = useState(false);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    async function fetchAndLoadPackages() {
      setLoading(true);
      try {
        try {
          const configDoc = await getDoc(doc(db, 'metadata', 'config'));
          if (configDoc.exists()) {
            const data = configDoc.data();
            if (data.texto_liston) setTextoListon(data.texto_liston);
            if (data.vidriera) setVidriera(data.vidriera);
            if (data.banco_imagenes) setBancoImagenes(data.banco_imagenes);
          }
        } catch (e) {
          console.error('Error trayendo config:', e);
        }

        const snapshot = await getDocs(collection(db, 'paquetes'));
        const cutoffEpoch = getCutoffEpoch();

        const packages = snapshot.docs
          .map((d) => ({ id_paquete: d.id, ...d.data() }))
          .filter((pkg) => {
            if (pkg.alcance === 'casa_central' || pkg.status === 'pending' || pkg.ocultar_cliente) return false;
            if (pkg.tipo_promo === 'FEED' || pkg.tipo_promo === 'ADS') {
              const antiguedad = Date.now() - (pkg.timestamp || 0);
              return antiguedad <= 7 * 24 * 60 * 60 * 1000;
            }
            if (!pkg.reflejo_cliente && pkg.timestamp && pkg.timestamp < cutoffEpoch) return false;
            return true;
          });

        if (cancelled) return;

        setAllPackages(packages);

        const salidas = [...new Set(packages.map((pkg) => pkg.salida))]
          .filter((s) => s && s.trim() !== '')
          .sort();
        setSalidasDisponibles(salidas);
        setSalidasCargadas(true);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAndLoadPackages();
    return () => {
      cancelled = true;
    };
  }, [ready]);

  return { loading, error, allPackages, vidriera, textoListon, bancoImagenes, salidasDisponibles, salidasCargadas };
}
