import { parseServicios } from '@/lib/packageUtils';

// Reemplaza renderCostosProveedoresHTML(rawJson).
export default function CostosProveedores({ pkg }) {
  const servicios = parseServicios(pkg);
  if (!Array.isArray(servicios) || servicios.length === 0) return <p>-</p>;

  return (
    <ul style={{ paddingLeft: '15px', margin: 0 }}>
      {servicios.map((s, i) => (
        <li key={i}>
          {s.proveedor || s.tipo}: ${s.costo}
        </li>
      ))}
    </ul>
  );
}
