'use client';

import { useCallback } from 'react';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAlert } from '@/contexts/AlertContext';
import { TAG_COTIZACION_HISTORIA } from '@/lib/internal/constants';

const configRef = () => doc(db, 'metadata', 'config');

export function useMarketingConfig({ etiquetasMarketing, tiposPromocion, vidriera, bancoImagenes, refetchConfig, onActionBusy }) {
  const { showAlert, showConfirm } = useAlert();

  // --- Etiquetas de Marketing ---
  const agregarEtiqueta = useCallback(
    async ({ nombre, abrev, color }) => {
      if (!nombre.trim() || !abrev.trim()) {
        await showAlert('Completá nombre y abreviatura', 'error');
        return false;
      }
      onActionBusy?.('Guardando etiqueta...');
      try {
        const nuevas = [...etiquetasMarketing, { nombre: nombre.trim(), abrev: abrev.trim().toUpperCase(), color }];
        await setDoc(configRef(), { tipos_marketing: nuevas }, { merge: true });
        await refetchConfig();
        return true;
      } catch (e) {
        console.error(e);
        await showAlert('Error al guardar', 'error');
        return false;
      } finally {
        onActionBusy?.(false);
      }
    },
    [etiquetasMarketing, showAlert, refetchConfig, onActionBusy]
  );

  const borrarEtiqueta = useCallback(
    async (index) => {
      if (etiquetasMarketing[index]?.nombre === TAG_COTIZACION_HISTORIA) {
        await showAlert('No podés borrar esta etiqueta reservada del sistema.', 'error');
        return;
      }
      if (!window.confirm('¿Borrar esta etiqueta?')) return;
      onActionBusy?.('Borrando...');
      try {
        const nuevas = etiquetasMarketing.filter((_, i) => i !== index);
        await updateDoc(configRef(), { tipos_marketing: nuevas });
        await refetchConfig();
      } catch (e) {
        console.error(e);
        await showAlert('Error', 'error');
      } finally {
        onActionBusy?.(false);
      }
    },
    [etiquetasMarketing, showAlert, refetchConfig, onActionBusy]
  );

  // --- Tipos de Promoción ---
  const agregarPromo = useCallback(
    async ({ nombre, alcance }) => {
      if (!nombre.trim()) {
        await showAlert('Completá el nombre de la promoción', 'error');
        return false;
      }
      onActionBusy?.('Guardando...');
      try {
        const nuevas = [...tiposPromocion, { nombre: nombre.trim(), alcance }];
        await setDoc(configRef(), { tipos_promocion: nuevas }, { merge: true });
        await refetchConfig();
        return true;
      } catch (e) {
        console.error(e);
        await showAlert('Error', 'error');
        return false;
      } finally {
        onActionBusy?.(false);
      }
    },
    [tiposPromocion, showAlert, refetchConfig, onActionBusy]
  );

  const borrarPromo = useCallback(
    async (index) => {
      if (!(await showConfirm('¿Borrar esta promoción permanentemente?'))) return;
      onActionBusy?.('Borrando...');
      try {
        const nuevas = tiposPromocion.filter((_, i) => i !== index);
        await updateDoc(configRef(), { tipos_promocion: nuevas });
        await refetchConfig();
      } catch (e) {
        console.error(e);
        await showAlert('Error', 'error');
      } finally {
        onActionBusy?.(false);
      }
    },
    [tiposPromocion, showAlert, showConfirm, refetchConfig, onActionBusy]
  );

  // --- Texto del listón "Solo X Hoy" ---
  const guardarListon = useCallback(
    async (texto) => {
      if (!texto.trim()) {
        await showAlert('Escribí un texto corto para el listón.', 'error');
        return false;
      }
      onActionBusy?.('Guardando...');
      try {
        await setDoc(configRef(), { texto_liston: texto.trim() }, { merge: true });
        await refetchConfig();
        await showAlert('¡Texto del listón actualizado!', 'success');
        return true;
      } catch (e) {
        console.error(e);
        await showAlert('Error al guardar listón', 'error');
        return false;
      } finally {
        onActionBusy?.(false);
      }
    },
    [showAlert, refetchConfig, onActionBusy]
  );

  // --- Banco de imágenes (enlaces de WordPress) ---
  const agregarImagenBanco = useCallback(
    async ({ nombre, url }) => {
      if (bancoImagenes.length >= 50) {
        await showAlert('Límite de 50 alcanzado. Borrá alguna vieja.', 'error');
        return false;
      }
      if (!nombre.trim() || !url.trim()) {
        await showAlert('Completá nombre y link.', 'error');
        return false;
      }
      onActionBusy?.('Guardando enlace...');
      try {
        const nueva = { id: 'img_' + Date.now(), nombre: nombre.trim(), url: url.trim() };
        const nuevas = [...bancoImagenes, nueva];
        await setDoc(configRef(), { banco_imagenes: nuevas }, { merge: true });
        await refetchConfig();
        await showAlert('Enlace guardado', 'success');
        return true;
      } catch (e) {
        console.error(e);
        await showAlert('Error', 'error');
        return false;
      } finally {
        onActionBusy?.(false);
      }
    },
    [bancoImagenes, showAlert, refetchConfig, onActionBusy]
  );

  const borrarImagenBanco = useCallback(
    async (index) => {
      if (!(await showConfirm('¿Seguro que querés borrar este enlace?'))) return;
      onActionBusy?.('Borrando enlace...');
      try {
        const nuevas = bancoImagenes.filter((_, i) => i !== index);
        await setDoc(configRef(), { banco_imagenes: nuevas }, { merge: true });
        await refetchConfig();
      } catch (e) {
        console.error(e);
        await showAlert('Error al borrar', 'error');
      } finally {
        onActionBusy?.(false);
      }
    },
    [bancoImagenes, showAlert, showConfirm, refetchConfig, onActionBusy]
  );

  // --- Vidriera (Top 4) ---
  const guardarVidriera = useCallback(
    async (slots) => {
      onActionBusy?.('Guardando Vidriera...');
      try {
        await setDoc(configRef(), { vidriera: slots }, { merge: true });
        await showAlert('Vidriera actualizada', 'success');
      } catch (e) {
        console.error(e);
        await showAlert('Error al guardar', 'error');
      } finally {
        onActionBusy?.(false);
      }
    },
    [showAlert, onActionBusy]
  );

  return { agregarEtiqueta, borrarEtiqueta, agregarPromo, borrarPromo, guardarListon, agregarImagenBanco, borrarImagenBanco, guardarVidriera };
}
