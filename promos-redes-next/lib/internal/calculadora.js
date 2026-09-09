// Motor matemático universal (calcularVentaAgencia) + semilla por defecto,
// portados 1:1 desde app.js.
export const CALCULADORA_DEFAULT = [
  {
    id: 'vuelo_nac',
    nombre: '✈️ Vuelo Nacional',
    proveedores: [
      { nombre: 'Hoteldo', tasa: 11.7, tipo: 'markup' },
      { nombre: 'Ola', tasa: 11.7, tipo: 'markup' },
    ],
  },
  { id: 'vuelo_int', nombre: '✈️ Vuelo Internacional', proveedores: [{ nombre: 'Hoteldo', tasa: 9.7, tipo: 'markup' }] },
  { id: 'hoteles', nombre: '🏨 Alojamiento', proveedores: [{ nombre: 'Feliz Viaje', tasa: 18.5, tipo: 'markup' }] },
  {
    id: 'autos',
    nombre: '🚗 Autos',
    proveedores: [
      { nombre: 'BookingCars', tasa: 12, tipo: 'descuento' },
      { nombre: 'Hoteldo', tasa: 18.5, tipo: 'markup' },
    ],
  },
];

export function calcularVentaAgencia(montoBase, provData) {
  let final = parseFloat(montoBase);
  let base = parseFloat(montoBase);
  let profit = 0;
  const profitRate = parseFloat(provData.tasa) / 100;

  if (provData.tipo === 'descuento') {
    // Lógica BookingCars: el monto ingresado es el Final; la ganancia se resta de ahí.
    base = final * (1 - profitRate);
    profit = final - base;
  } else {
    // Lógica normal (Markup): el monto ingresado es la Base; se le suma la ganancia.
    profit = base * profitRate;
    final = base + profit;
  }
  return { base, profit, final, profitRate };
}

export const formatMonedaCalc = (n) => new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
