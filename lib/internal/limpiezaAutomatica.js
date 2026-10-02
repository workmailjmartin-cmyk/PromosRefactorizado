import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const DIAS_VIGENCIA = {
  'solo x hoy': 7,
  'feed': 30,
  'ads': 40,
  'default': 30 // Para cualquier otro tipo que creen
};

// Convierte string DD/MM/YYYY o timestamp a objeto Date
function obtenerFechaCreacion(pkg) {
  if (pkg.timestamp && typeof pkg.timestamp === 'number') {
    return new Date(pkg.timestamp);
  }
  if (pkg.fecha_creacion && typeof pkg.fecha_creacion === 'string') {
    const partes = pkg.fecha_creacion.split('/');
    if (partes.length === 3) {
      return new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
    }
  }
  return null;
}

// Convierte fecha de salida a Date
function parsearFechaSalida(str) {
  if (!str) return null;
  const s = String(str).trim();
  if (s.includes('-')) {
    const [y, m, d] = s.split('-');
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  }
  if (s.includes('/')) {
    const [d, m, y] = s.split('/');
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  }
  return null;
}

export async function ejecutarLimpiezaAutomatica() {
  const hoyStr = new Date().toISOString().split('T')[0];
  const ultimoBarrido = localStorage.getItem('ultimo_barrido_limpieza');

  // Solo ejecuta una vez por día para ahorrar lecturas en Firebase
  if (ultimoBarrido === hoyStr) {
    return;
  }

  const ahora = new Date();
  const limiteEnlatados = new Date();
  limiteEnlatados.setDate(ahora.getDate() + 1); // 1 día antes de la salida

  let totalBorradosPromos = 0;
  let totalBorradosEnlatados = 0;

  try {
    const batch = writeBatch(db);
    let hayOperaciones = false;

    // ==========================================
    // 1. LIMPIEZA DE PROMOCIONES DIARIAS
    // ==========================================
    const snapPaquetes = await getDocs(collection(db, 'paquetes'));
    snapPaquetes.forEach((docSnap) => {
      const pkg = docSnap.data();
      const fechaCreacion = obtenerFechaCreacion(pkg);

      if (fechaCreacion) {
        const tipoLimpio = (pkg.tipo_promo || '').trim().toLowerCase();
        const diasPermitidos = DIAS_VIGENCIA[tipoLimpio] || DIAS_VIGENCIA['default'];

        const diasTranscurridos = (ahora - fechaCreacion) / (1000 * 60 * 60 * 24);

        if (diasTranscurridos > diasPermitidos) {
          batch.delete(doc(db, 'paquetes', docSnap.id));
          totalBorradosPromos++;
          hayOperaciones = true;
        }
      }
    });

    // ==========================================
    // 2. LIMPIEZA DE ENLATADOS (1 día antes de la salida)
    // ==========================================
    const snapEnlatados = await getDocs(collection(db, 'enlatados'));
    snapEnlatados.forEach((docSnap) => {
      const enlatado = docSnap.data();
      const fechas = [];

      if (enlatado.fecha_salida) fechas.push(enlatado.fecha_salida);
      if (Array.isArray(enlatado.salidas)) fechas.push(...enlatado.salidas);
      if (Array.isArray(enlatado.tarifario)) {
        enlatado.tarifario.forEach((t) => {
          if (t.fecha) fechas.push(t.fecha);
          if (t.fecha_salida) fechas.push(t.fecha_salida);
          if (t.salida) fechas.push(t.salida);
        });
      }

      // Buscamos la fecha de salida MÁS LEJANA que tiene el viaje
      let fechaMasTardia = null;
      fechas.forEach((f) => {
        const d = parsearFechaSalida(f);
        if (d && (!fechaMasTardia || d > fechaMasTardia)) {
          fechaMasTardia = d;
        }
      });

      // Si la última salida del paquete ocurre en menos de 24 hs o ya pasó, se borra
      if (fechaMasTardia && fechaMasTardia <= limiteEnlatados) {
        batch.delete(doc(db, 'enlatados', docSnap.id));
        totalBorradosEnlatados++;
        hayOperaciones = true;
      }
    });

    // Ejecuta todos los borrados en un solo viaje a Firebase
    if (hayOperaciones) {
      await batch.commit();
      console.log(`🧹 Limpieza completada: ${totalBorradosPromos} promos y ${totalBorradosEnlatados} enlatados eliminados.`);
    }

    // Registramos que hoy ya se limpió
    localStorage.setItem('ultimo_barrido_limpieza', hoyStr);

  } catch (error) {
    console.error('Error durante la limpieza automática:', error);
  }
}