// Versión INTERNA de generarTextoPresupuesto (app.js). Es parecida a la del
// portal de clientes pero NO es la misma función: acá el título se adapta si el
// paquete tiene un solo servicio ("VUELO", "HOTEL", etc. en vez de "PAQUETE"),
// las políticas de aerolíneas solo se agregan si hay un servicio aéreo, y el
// aviso de "asistencia no incluida" solo aparece cuando corresponde (sin el
// texto alternativo que sí tiene la versión de clientes.js).
import {
  formatDateAR,
  formatEscalasTexto,
  formatMoney,
  getNoches,
  getTarifaPorPersona,
  parseServicios,
} from '@/lib/packageUtils';

const TITULOS_SERVICIO_UNICO = {
  aereo: 'VUELO',
  hotel: 'HOTEL',
  traslado: 'TRASLADO',
  seguro: 'ASISTENCIA AL VIAJERO',
  bus: 'PAQUETE BUS',
  crucero: 'CRUCERO',
  circuito: 'CIRCUITO',
  adicional: 'SERVICIO',
};

export function generarTextoPresupuestoInterno(pkg) {
  const fechaCotizacion = pkg.fecha_creacion ? pkg.fecha_creacion : new Date().toLocaleDateString('es-AR');
  const noches = getNoches(pkg);
  const { tarifaPorPersona, textoBase } = getTarifaPorPersona(pkg);
  const servicios = parseServicios(pkg);

  const tieneSeguro = Array.isArray(servicios) && servicios.some(
    (s) => s.tipo === 'seguro' || (s.tipo === 'bus' && s.asistencia === true) || s.tipo === 'crucero'
  );
  const tieneAereo = Array.isArray(servicios) && servicios.some((s) => s.tipo === 'aereo');

  let tituloServicio = 'PAQUETE';
  if (Array.isArray(servicios) && servicios.length === 1) {
    tituloServicio = TITULOS_SERVICIO_UNICO[servicios[0].tipo] || 'SERVICIO';
  }

  let texto = `*${pkg.destino.toUpperCase()}*\n`;
  texto += `${tituloServicio}\n\n`;

  const esCircuitoTxt = Array.isArray(servicios) && servicios.some((s) => s.tipo === 'circuito');
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

  texto += `\n✅ Servicios que incluye el ${tituloServicio.toLowerCase()}:\n\n`;

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
  texto += `ℹ Más info: (https://info.felizviaje.ar/informacion-antes-de-viajar/)\n\n`;
  texto += `⚠¡Cupos limitados!\n`;
  texto += `-Para asegurar esta tarifa y evitar aumentos, recomendamos avanzar con la seña lo antes posible.\n`;
  texto += `-Las plazas y precios pueden modificarse en cualquier momento según disponibilidad de vuelos y hotel.\n\n`;
  texto += `¿Encontraste una mejor oferta? ¡Compartila con nosotros y la mejoramos para vos!\n\n`;

  if (tieneAereo) {
    texto += `✈ Políticas generales de aerolíneas (tarifas económicas)\n`;
    texto += `-Equipaje y la selección de asientos no están incluidos (pueden tener costo adicional)\n\n`;
  }

  if (!tieneSeguro) {
    texto += `Asistencia al viajero no incluida. Puede añadirse al reservar o más adelante. Es requisito obligatorio en la mayoría de los destinos internacionales\n`;
  }

  return texto.trim();
}
