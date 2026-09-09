// Número oficial de WhatsApp del asesor. Antes vivía hardcodeado en clientes.js
// (const WPP_NUMBER = "5493512444868"). Ahora es variable de entorno para poder
// cambiarlo sin tocar código, pero con el mismo valor por defecto.
export const WPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5493512444868';

// Íconos por tipo de servicio, usados en la grilla de resultados.
export const ICONOS_SERVICIO = {
  aereo: '✈️',
  hotel: '🏨',
  traslado: '🚕',
  seguro: '🛡️',
  bus: '🚌',
  crucero: '🚢',
  circuito: '🗺️',
};

export const IMAGEN_PLACEHOLDER = 'https://via.placeholder.com/800x400?text=Sin+Imagen';

// Opciones que trae el <select id="filtro-salida"> ANTES de que carguen los paquetes
// reales desde Firestore (en el original, este innerHTML se pisa por completo una vez
// que fetchAndLoadPackages() termina). Se preserva el mismo comportamiento: placeholder
// estático primero, lista real (con las salidas que existen de verdad) después.
export const SALIDAS_INICIALES = [
  { value: '', label: 'Todas las Provincias' },
  { value: 'CABA', label: 'CABA' },
  { value: 'Buenos Aires', label: 'Buenos Aires (Provincia)' },
  { value: 'Córdoba', label: 'Córdoba' },
  { value: 'Mendoza', label: 'Mendoza' },
  { value: 'Santa Fe', label: 'Santa Fe' },
];
