// Lógica de negocio pura, sin DOM, portada tal cual desde clientes.js.
// Se mantiene el comportamiento exacto (mismos nombres de campos de Firestore,
// mismas reglas de cálculo) para no perder funcionalidad.

export const formatMoney = (a) =>
  new Intl.NumberFormat('es-AR', { style: 'decimal', minimumFractionDigits: 0 }).format(a);

export const formatDateAR = (s) => {
  if (!s) return '-';
  const p = s.split('-');
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : s;
};

export const formatEscalasTexto = (n) => {
  n = parseInt(n) || 0;
  if (n === 0) return 'Directo';
  if (n === 1) return '1 Escala';
  return `${n} Escalas`;
};

// Parsea el campo "servicios" (puede venir como string JSON o ya como array).
export function parseServicios(pkg) {
  let raw = pkg?.servicios ?? pkg?.['item.servicios'];
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw || [];
  } catch (e) {
    return [];
  }
}

export function getNoches(pkg) {
  const servicios = parseServicios(pkg);
  if (!Array.isArray(servicios)) return 0;

  let totalHotel = 0;
  let hayHotel = false;
  servicios.forEach((s) => {
    if (s.tipo === 'hotel' && s.noches) {
      totalHotel += parseInt(s.noches) || 0;
      hayHotel = true;
    }
  });
  if (hayHotel && totalHotel > 0) return totalHotel;

  const bus = servicios.find((s) => s.tipo === 'bus');
  if (bus && bus.noches) return parseInt(bus.noches);

  const crucero = servicios.find((s) => s.tipo === 'crucero');
  if (crucero && crucero.crucero_noches) return parseInt(crucero.crucero_noches);

  const circuito = servicios.find((s) => s.tipo === 'circuito');
  if (circuito && circuito.circuito_noches) return parseInt(circuito.circuito_noches);

  if (!pkg?.fecha_salida) return 0;
  let fechaStr = pkg.fecha_salida;
  if (fechaStr.includes('/')) fechaStr = fechaStr.split('/').reverse().join('-');

  const start = new Date(fechaStr + 'T00:00:00');
  let maxDate = new Date(start);
  let hasData = false;
  servicios.forEach((s) => {
    if (s.tipo === 'hotel' && s.checkout) {
      const d = new Date(s.checkout + 'T00:00:00');
      if (d > maxDate) { maxDate = d; hasData = true; }
    }
    if (s.tipo === 'aereo' && s.fecha_regreso) {
      const d = new Date(s.fecha_regreso + 'T00:00:00');
      if (d > maxDate) { maxDate = d; hasData = true; }
    }
    if (s.tipo === 'crucero' && s.checkout) {
      const d = new Date(s.checkout + 'T00:00:00');
      if (d > maxDate) { maxDate = d; hasData = true; }
    }
    if (s.tipo === 'circuito' && s.checkout) {
      const d = new Date(s.checkout + 'T00:00:00');
      if (d > maxDate) { maxDate = d; hasData = true; }
    }
  });
  return hasData ? Math.ceil((maxDate - start) / 86400000) : 0;
}

// Calcula tarifa por persona + el texto de "base" (Doble/Cuádruple), reutilizado
// en la tarjeta, el modal y el mensaje de WhatsApp.
export function getTarifaPorPersona(pkg) {
  const tarifa = parseFloat(pkg?.tarifa) || 0;
  const divisor = parseInt(pkg?.base_pasajeros) === 4 ? 4 : 2;
  return {
    tarifaPorPersona: Math.round(tarifa / divisor),
    textoBase: divisor === 4 ? 'Base Cuádruple' : 'Base Doble',
  };
}

// "Regla de la Cenicienta": las promos "Solo x Hoy" dejan de mostrarse a partir
// de las 12:00 hs (hora Argentina) del día siguiente a su carga, salvo que
// tengan reflejo_cliente=true. Portado tal cual desde clientes.js.
export function getCutoffEpoch() {
  const now = new Date();
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  const arTime = new Date(utcTime - 3 * 3600000);

  const arHour = arTime.getHours();
  const arYear = arTime.getFullYear();
  const arMonth = arTime.getMonth();
  let arDay = arTime.getDate();

  if (arHour < 12) arDay -= 1;

  const cutoffUtc = new Date(Date.UTC(arYear, arMonth, arDay, 3, 0, 0, 0));
  return cutoffUtc.getTime();
}

// Genera el texto de presupuesto que se envía por WhatsApp al asesor.
// Portado 1:1 desde generarTextoPresupuesto() en clientes.js.
export function generarTextoPresupuesto(pkg) {
  const fechaCotizacion = pkg.fecha_creacion ? pkg.fecha_creacion : new Date().toLocaleDateString('es-AR');
  const noches = getNoches(pkg);
  const { tarifaPorPersona, textoBase } = getTarifaPorPersona(pkg);
  const servicios = parseServicios(pkg);

  const tieneSeguro = Array.isArray(servicios) && servicios.some(
    (s) => s.tipo === 'seguro' || (s.tipo === 'bus' && s.asistencia === true) || s.tipo === 'crucero'
  );

  let texto = `*${pkg.destino.toUpperCase()}*\n`;
  texto += `PAQUETE\n\n`;

  const esCircuitoTxt = Array.isArray(servicios) && servicios.some((s) => s.tipo === 'circuito');
  const tieneAereo = Array.isArray(servicios) && servicios.some((s) => s.tipo === 'aereo');
  const fechaTxt = !pkg.fecha_salida && esCircuitoTxt && !tieneAereo
    ? 'Múltiples Salidas'
    : formatDateAR(pkg.fecha_salida);
  texto += `📅 Salida: ${fechaTxt}\n`;

  let lugarSalida = pkg.salida;
  if (!tieneAereo) {
    const crucero = Array.isArray(servicios) && servicios.find((s) => s.tipo === 'crucero');
    const circuito = Array.isArray(servicios) && servicios.find((s) => s.tipo === 'circuito');
    if (crucero && crucero.crucero_puerto_salida) lugarSalida = crucero.crucero_puerto_salida;
    else if (circuito && circuito.circuito_salida) lugarSalida = circuito.circuito_salida;
  }
  texto += `📍 Desde: ${lugarSalida}\n`;
  if (noches > 0) texto += `🌙 Duración: ${noches} Noches\n`;

  texto += `\n✅ Servicios que incluye el paquete:\n\n`;

  if (Array.isArray(servicios)) {
    servicios.forEach((s) => {
      if (s.tipo === 'aereo') {
        const eIda = s.escalas_ida !== undefined ? parseInt(s.escalas_ida) : parseInt(s.escalas) || 0;
        const eVuelta = s.escalas_vuelta !== undefined ? parseInt(s.escalas_vuelta) : parseInt(s.escalas) || 0;
        const escalasTxt = eIda === eVuelta
          ? formatEscalasTexto(eIda)
          : `IDA: ${formatEscalasTexto(eIda)} | REGRESO: ${formatEscalasTexto(eVuelta)}`;

        texto += `> ✈️ *AÉREO*\n`;
        if (s.aeropuerto_salida) texto += `🛫 *Salida desde:* ${s.aeropuerto_salida}\n`;
        texto += `${s.aerolinea || 'Aerolínea'}\n`;
        texto += `${formatDateAR(s.fecha_aereo)}${s.fecha_regreso ? ' - ' + formatDateAR(s.fecha_regreso) : ''}\n`;
        texto += `${escalasTxt} | ${s.tipo_equipaje || '-'}\n\n`;
      } else if (s.tipo === 'hotel') {
        let stars = '';
        if (s.hotel_estrellas) for (let i = 0; i < s.hotel_estrellas; i++) stars += '⭐';
        texto += `> 🏨 *HOTEL*\n`;
        texto += `${s.hotel_nombre} ${stars}\n`;
        if (s.regimen) texto += `(${s.regimen})\n`;
        if (s.noches) texto += `${s.noches} Noches`;
        if (s.checkin) texto += ` | Ingreso: ${formatDateAR(s.checkin)}`;
        texto += `\n`;
        if (s.hotel_link) texto += `📍 Ubicación: ${s.hotel_link}\n`;
        texto += `\n`;
      } else if (s.tipo === 'traslado') {
        texto += `> 🚗 *TRASLADO*\n`;
        texto += `${s.tipo_trf || 'Incluido'}\n\n`;
      } else if (s.tipo === 'seguro') {
        texto += `> 🛡️ *SEGURO*\n`;
        texto += `${s.cobertura || 'Asistencia al viajero'}\n\n`;
      } else if (s.tipo === 'bus') {
        texto += `> 🚌 *PAQUETE BUS* (${s.noches || '?'} Noches)\n`;
        if (s.bus_salida) texto += `> 📍 *Salida desde:* ${s.bus_salida}\n`;
        if (s.incluye_alojamiento) {
          texto += `> 🏨 *Hotel:* ${s.hotel_nombre || 'A confirmar'}\n`;
          if (s.hotel_ubicacion) texto += `> 📍 *Ubicación:* ${s.hotel_ubicacion}\n`;
          texto += `> 🍽 *Régimen:* ${s.regimen || ''}`;
          if (s.regimen === 'Media Pensión' || s.regimen === 'Pensión Completa') {
            texto += ` ${s.bebidas === 'Si' ? '(🥤 Con Bebidas)' : '(🚫 Sin Bebidas)'}`;
          }
          texto += `\n`;
        }
        if (s.incluye_excursiones) texto += `> 🌲 *Excursiones:* ${s.excursion_adicional || 'Incluidas'}\n`;
        if (s.asistencia) texto += `> 🚑 *Asistencia al Viajero Incluida*\n`;
        if (s.observaciones) texto += `> 📝 *Nota:* ${s.observaciones}\n`;
        texto += `\n`;
      } else if (s.tipo === 'crucero') {
        texto += `> 🚢 *CRUCERO ${s.crucero_naviera ? s.crucero_naviera.toUpperCase() : ''}*\n`;
        if (s.crucero_noches) texto += ` *Duración:* ${s.crucero_noches} Noches\n`;
        if (s.crucero_puerto_salida) texto += ` Puerto de Salida: ${s.crucero_puerto_salida}\n`;
        if (s.checkin) texto += ` Fechas: ${formatDateAR(s.checkin)} al ${formatDateAR(s.checkout || '')}\n`;
        if (s.crucero_paradas) texto += ` Recorrido: ${s.crucero_paradas}\n`;
        texto += ` Incluye:\n- Pensión Completa\n- Asistencia al Viajero\n`;
        if (s.crucero_bebidas) texto += `- Paquete de Bebidas\n`;
        if (s.crucero_propinas) texto += `- Propinas\n`;
        texto += `\n`;
      } else if (s.tipo === 'adicional') {
        texto += `> ➕ *ADICIONAL*\n`;
        texto += `${s.descripcion}\n\n`;
      } else if (s.tipo === 'circuito') {
        texto += `> 🗺️ *CIRCUITO: ${s.circuito_nombre ? s.circuito_nombre.toUpperCase() : ''}*\n`;
        if (s.circuito_noches) texto += `Duración: ${s.circuito_noches} Noches\n`;
        if (s.circuito_salida) texto += `Salida desde: ${s.circuito_salida}\n`;
        if (s.checkin) texto += `*Fechas:* ${formatDateAR(s.checkin)} al ${formatDateAR(s.checkout || '')}\n`;
        if (s.circuito_descripcion) texto += `Detalle: ${s.circuito_descripcion}\n`;
        texto += `\n`;
      }
    });
  }

  texto += `💲*Tarifa final por Persona en ${textoBase}:*\n`;
  texto += `${pkg.moneda} $${formatMoney(tarifaPorPersona)}\n\n`;

  if (pkg.financiacion) texto += `💳 Financiación: ${pkg.financiacion}\n\n`;
  texto += `--------------------------------------------\n`;
  texto += `Información importante:\n`;
  texto += `-Tarifas y disponibilidad sujetas a cambio al momento de la reserva.\n`;
  texto += `-Cotización válida al ${fechaCotizacion}\n\n`;
  texto += `ℹ Más info: (https://felizviaje.tur.ar/informacion-antes-de-contratar)\n\n`;
  texto += `⚠¡Cupos limitados!\n`;
  texto += `-Para asegurar esta tarifa y evitar aumentos, recomendamos avanzar con la seña lo antes posible.\n`;
  texto += `-Las plazas y precios pueden modificarse en cualquier momento según disponibilidad de vuelos y hotel.\n\n`;
  texto += `¿Encontraste una mejor oferta? ¡Compartila con nosotros y la mejoramos para vos!\n\n`;
  texto += `✈️ Políticas generales de aerolíneas (tarifas económicas)\n`;
  texto += `-Equipaje y la selección de asientos no están incluidos (pueden tener costo adicional)\n\n`;

  texto += tieneSeguro
    ? `Asistencia al viajero es requisito obligatorio en la mayoría de los destinos internacionales`
    : `Asistencia al viajero no incluida. Puede añadirse al reservar o más adelante. Es requisito obligatorio en la mayoría de los destinos internacionales`;

  return texto;
}

export function buildWhatsAppLink(pkg, wppNumber) {
  const mensaje = encodeURIComponent(
    `¡Hola Feliz Viaje! Vengo de la web y quiero consultar por este paquete:\n\n${generarTextoPresupuesto(pkg)}`
  );
  return `https://wa.me/${wppNumber}?text=${mensaje}`;
}
