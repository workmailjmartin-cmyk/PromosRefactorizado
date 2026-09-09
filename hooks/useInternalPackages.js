'use client';

import { useCallback, useEffect, useState } from 'react';
import { collection, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAlert } from '@/contexts/AlertContext';

// Igual a processPackageHistory(): si un mismo paquete tiene varias versiones
// guardadas (mismo id_paquete repetido), nos quedamos con la última y la
// descartamos por completo si esa última versión está marcada como "deleted".
function processPackageHistory(rawList) {
  const historyMap = new Map();
  rawList.forEach((pkg) => {
    const id = pkg.id_paquete || pkg.id || pkg['item.id'];
    if (!id) return;
    if (!historyMap.has(id)) historyMap.set(id, []);
    historyMap.get(id).push(pkg);
  });
  const processed = [];
  historyMap.forEach((versions) => {
    const latest = versions[versions.length - 1];
    if (latest.status === 'deleted') return;
    processed.push(latest);
  });
  return processed;
}

function getMilisegundos(pkg) {
  if (pkg.timestamp) return pkg.timestamp;
  if (pkg.fecha_creacion) {
    const partes = pkg.fecha_creacion.split('/');
    if (partes.length === 3) return new Date(partes[2], partes[1] - 1, partes[0]).getTime();
  }
  return 0;
}

async function fetchPaquetesOrdenados() {
  const snapshot = await getDocs(collection(db, 'paquetes'));
  const packages = snapshot.docs.map((d) => ({ id_paquete: d.id, ...d.data() }));
  packages.sort((a, b) => getMilisegundos(b) - getMilisegundos(a));
  return packages;
}

// Igual a autoCleanupPackages(): SOLO el admin ejecuta el mantenimiento, y como
// mucho una vez por día (usa localStorage como marca de tiempo, igual que el
// original). Borra paquetes vencidos (fecha de viaje pasada, o "Solo x Hoy" con
// más de 7 días, u otras promos con más de 30) salvo que estén anclados a la web
// de clientes (reflejo_cliente), y tareas de marketing con más de 60 días.
async function autoCleanupPackages(packages, rol) {
  if (rol !== 'admin') return false;

  const hoyString = new Date().toISOString().split('T')[0];
  const ultimoChequeo = localStorage.getItem('ultimo_mantenimiento');
  if (ultimoChequeo === hoyString) return false;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const candidatos = packages.filter((pkg) => {
    if (pkg.reflejo_cliente) return false;
    if (pkg.fecha_salida) {
      const fechaSalida = new Date(pkg.fecha_salida + 'T00:00:00');
      if (fechaSalida <= now) return true;
    }
    if (!pkg.fecha_creacion || !pkg.tipo_promo) return false;
    const parts = pkg.fecha_creacion.split('/');
    if (parts.length === 3) {
      const fechaPkg = new Date(parts[2], parts[1] - 1, parts[0]);
      const diffDays = Math.ceil((now - fechaPkg) / (1000 * 60 * 60 * 24));
      if (pkg.tipo_promo === 'Solo X Hoy' && diffDays > 7) return true;
      if (pkg.tipo_promo !== 'Solo X Hoy' && diffDays > 30) return true;
    }
    return false;
  });

  for (const pkg of candidatos) {
    await deleteDoc(doc(db, 'paquetes', pkg.id_paquete || pkg.id));
  }

  try {
    const limiteMkt = new Date();
    limiteMkt.setDate(limiteMkt.getDate() - 60);
    const snapMkt = await getDocs(collection(db, 'calendario_marketing'));
    for (const d of snapMkt.docs) {
      const tarea = d.data();
      if (tarea.fecha) {
        const fechaTarea = new Date(tarea.fecha + 'T00:00:00');
        if (fechaTarea < limiteMkt) await deleteDoc(d.ref);
      }
    }
  } catch (e) {
    console.error('Error limpieza Mkt:', e);
  }

  localStorage.setItem('ultimo_mantenimiento', hoyString);
  return candidatos.length > 0;
}

export function useInternalPackages(ready, rol) {
  const { showAlert } = useAlert();
  const [uniquePackages, setUniquePackages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAndLoadPackages = useCallback(async () => {
    setLoading(true);
    try {
      let packages = await fetchPaquetesOrdenados();
      let unique = processPackageHistory(packages);

      const huboLimpieza = await autoCleanupPackages(unique, rol);
      if (huboLimpieza) {
        packages = await fetchPaquetesOrdenados();
        unique = processPackageHistory(packages);
      }

      setUniquePackages(unique);
    } catch (e) {
      console.error('🔥 Error al leer de Firebase:', e);
      await showAlert('No se pudieron cargar las promociones. Revisa tu conexión.', 'error');
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rol]);

  useEffect(() => {
    if (!ready) return;
    fetchAndLoadPackages();
  }, [ready, fetchAndLoadPackages]);

  const pendingCount = uniquePackages.filter((p) => p.status === 'pending').length;

  return { uniquePackages, loading, pendingCount, refetch: fetchAndLoadPackages };
}
