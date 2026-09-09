// Listado completo de provincias (el panel interno usa las 24, a diferencia del
// portal de clientes que solo ofrece 5 en el placeholder inicial).
export const PROVINCIAS = [
  { value: '', label: 'Todas las Provincias' },
  { value: 'CABA', label: 'CABA (Ciudad Autónoma de Bs As)' },
  { value: 'Buenos Aires', label: 'Buenos Aires (Provincia)' },
  { value: 'Catamarca', label: 'Catamarca' },
  { value: 'Chaco', label: 'Chaco' },
  { value: 'Chubut', label: 'Chubut' },
  { value: 'Córdoba', label: 'Córdoba' },
  { value: 'Corrientes', label: 'Corrientes' },
  { value: 'Entre Ríos', label: 'Entre Ríos' },
  { value: 'Formosa', label: 'Formosa' },
  { value: 'Jujuy', label: 'Jujuy' },
  { value: 'La Pampa', label: 'La Pampa' },
  { value: 'La Rioja', label: 'La Rioja' },
  { value: 'Mendoza', label: 'Mendoza' },
  { value: 'Misiones', label: 'Misiones' },
  { value: 'Neuquén', label: 'Neuquén' },
  { value: 'Río Negro', label: 'Río Negro' },
  { value: 'Salta', label: 'Salta' },
  { value: 'San Juan', label: 'San Juan' },
  { value: 'San Luis', label: 'San Luis' },
  { value: 'Santa Cruz', label: 'Santa Cruz' },
  { value: 'Santa Fe', label: 'Santa Fe' },
  { value: 'Santiago del Estero', label: 'Santiago del Estero' },
  { value: 'Tierra del Fuego', label: 'Tierra del Fuego' },
  { value: 'Tucumán', label: 'Tucumán' },
];

// Semilla usada cuando metadata/config todavía no tiene "tipos_promocion" guardado.
export const PROMOS_DEFAULT = [
  { nombre: 'Solo X Hoy', alcance: 'todos' },
  { nombre: 'FEED', alcance: 'todos' },
  { nombre: 'ADS', alcance: 'todos' },
];

// Roles con permisos de gestión (aprobar, editar cualquier paquete, ver promos
// secretas, etc.). El original los llama indistintamente "esAdmin" aunque incluye
// a "editor" — se mantiene ese mismo criterio acá.
export const esRolGestor = (rol) => rol === 'admin' || rol === 'editor';

// Etiqueta reservada del sistema: nunca se puede borrar desde el panel de
// Configuración (la usa el registro automático de historial de cotizaciones).
export const TAG_COTIZACION_HISTORIA = 'Cotización SOLO X HOY- Historia';
