'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAlert } from '@/contexts/AlertContext';
import { formatDateAR, parseServicios } from '@/lib/packageUtils';
import { limpiarProfundo } from '@/lib/internal/limpiarProfundo';

const genId = () => Date.now() + Math.random();

function hoyISO() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().split('T')[0];
}

const estadoInicial = () => ({
  destino: '',
  subtitulo: '', // 👈 1. Inicializado
  salida: '',
  fechaSalida: '',
  moneda: 'USD',
  promo: '',
  financiacion: '',
  servicios: [],
  costoTotal: 0,
  tarifaTotal: '',
  basePasajeros: 2,
});

function conNochesRecalculadas(servicio) {
  if (!servicio.checkin || !servicio.checkout) return servicio;
  const d1 = new Date(servicio.checkin);
  const d2 = new Date(servicio.checkout);
  const diff = d2 > d1 ? Math.ceil((d2 - d1) / 86400000) : 0;
  const campo = servicio.tipo === 'crucero' ? 'crucero_noches' : servicio.tipo === 'circuito' ? 'circuito_noches' : 'noches';
  return { ...servicio, [campo]: diff };
}

export function useUploadForm({ editingPackage, currentUser, userData, refetch, onDone, onActionBusy }) {
  const { showAlert } = useAlert();
  const [form, setForm] = useState(estadoInicial);

  const isEditingId = editingPackage ? editingPackage.id_paquete || editingPackage.id || editingPackage['item.id'] : null;
  const originalCreator = editingPackage ? editingPackage.creador || '' : '';

  useEffect(() => {
    if (!editingPackage) {
      setForm(estadoInicial());
      return;
    }
    let fecha = editingPackage.fecha_salida || '';
    if (fecha.includes('/')) fecha = fecha.split('/').reverse().join('-');

    const serviciosRaw = parseServicios(editingPackage);
    const servicios = Array.isArray(serviciosRaw) ? serviciosRaw.map((s) => ({ ...s, __id: genId() })) : [];
    const costoTotal = servicios.reduce((acc, s) => acc + (parseFloat(s.costo) || 0), 0);

    setForm({
      destino: editingPackage.destino || '',
      subtitulo: editingPackage.subtitulo || '', // 👈 2. Precarga al editar
      salida: editingPackage.salida || '',
      fechaSalida: fecha,
      moneda: editingPackage.moneda || 'USD',
      promo: editingPackage.tipo_promo || '',
      financiacion: editingPackage.financiacion || '',
      servicios,
      costoTotal,
      tarifaTotal: editingPackage.tarifa != null ? String(editingPackage.tarifa) : '',
      basePasajeros: editingPackage.base_pasajeros ? parseInt(editingPackage.base_pasajeros) : 2,
    });
  }, [editingPackage]);

  const minDate = form.fechaSalida || hoyISO();

  const tarifaPorPersona = useMemo(() => {
    const divisor = parseInt(form.basePasajeros) === 4 ? 4 : 2;
    return Math.round((parseFloat(form.tarifaTotal) || 0) / divisor);
  }, [form.tarifaTotal, form.basePasajeros]);

  const setCampo = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }));

  const addServicio = useCallback(
    (tipo) => {
      const hasExclusive = form.servicios.some((s) => s.tipo === 'bus');
      if (hasExclusive && tipo !== 'adicional') {
        showAlert('⛔ Ya hay un paquete Bus cargado. Solo puedes agregar Adicionales.', 'error');
        return;
      }
      if (tipo === 'bus' && form.servicios.length > 0) {
        showAlert('⛔ El Paquete Bus debe ser único y no se puede mezclar con otros servicios base.', 'error');
        return;
      }

      const nuevoServicio = { __id: genId(), tipo };
      if (tipo === 'aereo') {
        nuevoServicio.tipo_equipaje = '';
        nuevoServicio.equipaje = '';
        nuevoServicio.escalas = 'Directo';
      }

      setForm((f) => ({ ...f, servicios: [...f.servicios, nuevoServicio] }));
    },
    [form.servicios, showAlert]
  );

  const updateServicio = useCallback((uid, patch) => {
    setForm((f) => {
      let tocaCosto = false;
      const servicios = f.servicios.map((s) => {
        if (s.__id !== uid) return s;
        let next = { ...s, ...patch };
        if ('checkin' in patch || 'checkout' in patch) next = conNochesRecalculadas(next);
        if ('costo' in patch) tocaCosto = true;
        return next;
      });
      if (!tocaCosto) return { ...f, servicios };
      const t = servicios.reduce((acc, s) => acc + (parseFloat(s.costo) || 0), 0);
      return { ...f, servicios, costoTotal: t, tarifaTotal: String(Math.round(t * 1.185)) };
    });
  }, []);

  const removeServicio = useCallback((uid) => {
    setForm((f) => {
      const servicios = f.servicios.filter((s) => s.__id !== uid);
      const t = servicios.reduce((acc, s) => acc + (parseFloat(s.costo) || 0), 0);
      return { ...f, servicios, costoTotal: t, tarifaTotal: String(Math.round(t * 1.185)) };
    });
  }, []);

  const resetForm = useCallback(() => setForm(estadoInicial()), []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      onActionBusy?.('Guardando...');

      const costo = parseFloat(form.costoTotal) || 0;
      const tarifa = parseFloat(form.tarifaTotal) || 0;
      let fechaViajeStr = form.fechaSalida;

      if (tarifa < costo) {
        onActionBusy?.(false);
        return showAlert('Error: Tarifa menor al costo.', 'error');
      }
      if (form.servicios.length === 0) {
        onActionBusy?.(false);
        return showAlert('Agrega servicios.', 'error');
      }

      const serviciosData = form.servicios.map(({ __id, ...resto }) => resto);

      // 🛡️ VALIDACIÓN ESTRICTA: El equipaje es 100% obligatorio si hay aéreo
      for (const serv of serviciosData) {
        if (serv.tipo === 'aereo') {
          const eq = serv.tipo_equipaje || serv.equipaje;
          if (!eq || eq.trim() === '' || eq === '-') {
            onActionBusy?.(false);
            return showAlert('⛔ El equipaje del vuelo es obligatorio. Seleccioná una opción en el aéreo.', 'error');
          }
        }
      }

      const esCircuito = serviciosData.some((s) => s.tipo === 'circuito');
      const tieneAereo = serviciosData.some((s) => s.tipo === 'aereo');

      if (esCircuito && !tieneAereo) {
        fechaViajeStr = '';
      } else if (!fechaViajeStr) {
        onActionBusy?.(false);
        return showAlert('Falta fecha de salida.', 'error');
      }

      let fechaMaxRegresoAereo = null;
      let aereoRegresoStr = '';
      for (const serv of serviciosData) {
        if (serv.tipo === 'aereo' && serv.fecha_regreso) {
          fechaMaxRegresoAereo = new Date(serv.fecha_regreso + 'T00:00:00');
          aereoRegresoStr = formatDateAR(serv.fecha_regreso);
          break;
        }
      }
      if (fechaMaxRegresoAereo) {
        for (const serv of serviciosData) {
          let endDateStr = null;
          if ((serv.tipo === 'hotel' || serv.tipo === 'crucero' || serv.tipo === 'circuito') && serv.checkout) {
            endDateStr = serv.checkout;
          } else if (serv.tipo === 'bus' && serv.noches && fechaViajeStr) {
            const startBus = new Date(fechaViajeStr + 'T00:00:00');
            startBus.setDate(startBus.getDate() + parseInt(serv.noches));
            endDateStr = startBus.toISOString().split('T')[0];
          }
          if (endDateStr) {
            const endDate = new Date(endDateStr + 'T00:00:00');
            if (endDate > fechaMaxRegresoAereo) {
              onActionBusy?.(false);
              return showAlert(
                `⛔ Error: El servicio de ${serv.tipo.toUpperCase()} finaliza después de tu regreso en Vuelo (${aereoRegresoStr}). Revisa las fechas.`,
                'error'
              );
            }
          }
        }
      }

      const idGenerado = isEditingId || 'pkg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const creadorFinal = isEditingId && originalCreator ? originalCreator : userData?.franquicia || currentUser?.email;

      const fechaActual = new Date();
      const fechaCreacionFormateada = `${String(fechaActual.getDate()).padStart(2, '0')}/${String(fechaActual.getMonth() + 1).padStart(2, '0')}/${fechaActual.getFullYear()}`;

      const payload = {
        id_paquete: idGenerado,
        destino: form.destino,
        subtitulo: form.subtitulo || '',
        salida: form.salida,
        fecha_salida: fechaViajeStr,
        costos_proveedor: costo,
        tarifa,
        moneda: form.moneda,
        tipo_promo: form.promo,
        financiacion: form.financiacion,
        servicios: serviciosData,
        status: 'approved',
        creador: creadorFinal,
        editor_email: currentUser?.email,
        action_type: isEditingId ? 'edit' : 'create',
        timestamp: Date.now(),
        fecha_creacion: fechaCreacionFormateada,
        reflejo_cliente: false,
        ocultar_cliente: false,
        base_pasajeros: parseInt(form.basePasajeros) || 2,
      };

      limpiarProfundo(payload);

      try {
        if (isEditingId) {
          delete payload.creador;
          delete payload.fecha_creacion;
          await updateDoc(doc(db, 'paquetes', isEditingId), payload);
        } else {
          await setDoc(doc(db, 'paquetes', idGenerado), payload);
        }
      } catch (err) {
        console.error('Fallo el guardado en Firebase:', err);
        onActionBusy?.(false);
        showAlert('Falla exacta: ' + err.message, 'error');
        return;
      }

      // Liberar pantalla inmediatamente
      onActionBusy?.(false);
      resetForm();

      if (onDone) onDone();
      if (refetch) await refetch();

      showAlert(isEditingId ? 'Actualizado correctamente.' : 'Guardado correctamente.', 'success');
    },
    [form, isEditingId, originalCreator, currentUser, userData, showAlert, refetch, onDone, onActionBusy, resetForm]
  );

  return {
    form,
    setDestino: setCampo('destino'),
    setSubtitulo: setCampo('subtitulo'), // 👈 4. Exportado
    setSalida: setCampo('salida'),
    setFechaSalida: setCampo('fechaSalida'),
    setMoneda: setCampo('moneda'),
    setPromo: setCampo('promo'),
    setFinanciacion: setCampo('financiacion'),
    setTarifaTotal: setCampo('tarifaTotal'),
    setBasePasajeros: setCampo('basePasajeros'),
    minDate,
    tarifaPorPersona,
    addServicio,
    updateServicio,
    removeServicio,
    handleSubmit,
    isEditingId,
  };
}