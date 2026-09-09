'use client';

import { useCallback, useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PROMOS_DEFAULT, esRolGestor, TAG_COTIZACION_HISTORIA } from '@/lib/internal/constants';

// Equivalente a cargarFranquiciasAdmin() + cargarPromocionesAdmin() en la parte
// que llena los filtros/selects (la parte de administración de franquicias y
// promos en sí —crear/borrar— se implementa en la fase de "Configuración").
export function useAppConfig(ready, rol) {
  const [franquicias, setFranquicias] = useState([]);
  const [tiposPromocion, setTiposPromocion] = useState(PROMOS_DEFAULT);
  const [etiquetasMarketing, setEtiquetasMarketing] = useState([]);
  const [textoListon, setTextoListon] = useState('SOLO X HOY');
  const [vidriera, setVidriera] = useState([]);
  const [bancoImagenes, setBancoImagenes] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      const snap = await getDoc(doc(db, 'metadata', 'config'));
      if (snap.exists()) {
        const data = snap.data();
        setFranquicias(data.franquicias || []);
        setTiposPromocion(data.tipos_promocion || PROMOS_DEFAULT);
        // 🛡️ Protección: la etiqueta reservada siempre existe, aunque se haya
        // borrado de la base (igual que cargarEtiquetasMarketing).
        const etiquetas = data.tipos_marketing || [];
        if (!etiquetas.find((e) => e.nombre === TAG_COTIZACION_HISTORIA)) {
          etiquetas.unshift({ nombre: TAG_COTIZACION_HISTORIA, abrev: 'COT-H', color: '#f1c40f' });
        }
        setEtiquetasMarketing(etiquetas);
        if (data.texto_liston) setTextoListon(data.texto_liston);
        setVidriera(data.vidriera || []);
        setBancoImagenes(data.banco_imagenes || []);
      }
    } catch (e) {
      console.error('Error cargando configuración:', e);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    fetchConfig();
  }, [ready, fetchConfig]);

  const esGestor = esRolGestor(rol);

  // Igual que cargarFranquiciasAdmin: "Casa Central" siempre aparece como opción
  // del filtro aunque no esté en la lista de franquicias guardada.
  const franquiciasFiltro = franquicias.includes('Casa Central') ? franquicias : ['Casa Central', ...franquicias];

  // Igual que cargarPromocionesAdmin: los tipos "casa_central" no se listan como
  // opción de filtro/carga para quien no es admin/editor.
  const tiposPromocionVisibles = tiposPromocion.filter((p) => esGestor || p.alcance !== 'casa_central');
  const promosSecretas = tiposPromocion.filter((p) => p.alcance === 'casa_central').map((p) => p.nombre);

  return {
    franquicias,
    franquiciasFiltro,
    tiposPromocion,
    tiposPromocionVisibles,
    promosSecretas,
    etiquetasMarketing,
    textoListon,
    vidriera,
    bancoImagenes,
    loaded,
    refetch: fetchConfig,
  };
}
