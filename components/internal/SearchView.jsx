'use client';

import { useMemo, useState } from 'react';
import { PROVINCIAS } from '@/lib/internal/constants';
import WeeklyPlanner from './WeeklyPlanner';
import PackageCard from './PackageCard';
import PackageDetailModal from './PackageDetailModal';
import { usePackageActions } from '@/hooks/usePackageActions';
import { useAlert } from '@/contexts/AlertContext';

const normalizeText = (text) => (text ? text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() : '');

export default function SearchView({
  uniquePackages,
  loading,
  refetch,
  currentUser,
  userData,
  esGestor,
  franquiciasFiltro,
  tiposPromocionVisibles,
  promosSecretas,
  onIrACalendarioMarketing,
  onAbrirCarga,
  onStartEditing,
  onActionBusy,
}) {
  const [destinoDraft, setDestinoDraft] = useState('');
  const [promoDraft, setPromoDraft] = useState('');
  const [filtros, setFiltros] = useState({ destino: '', creador: '', promo: '', salida: '', orden: 'reciente' });
  const [selectedPackage, setSelectedPackage] = useState(null);
  const { showConfirm } = useAlert();

  const packageActions = usePackageActions({
    onBusy: onActionBusy,
    onDone: () => setSelectedPackage(null),
    refetch,
  });
  // startEditing no toca Firestore: solo abre el formulario de Carga con los
  // datos del paquete, así que vive un nivel más arriba (en app/page.jsx), que
  // es quien controla la vista actual.
  const actions = {
    ...packageActions,
    startEditing: async (pkg) => {
      if (!(await showConfirm('Se abrirá el formulario de edición.'))) return;
      setSelectedPackage(null);
      onStartEditing(pkg);
    },
  };

  // El original relee destino/promo en vivo cada vez que corre applyFilters(),
  // sea por Buscar, Limpiar, o el 'change' de Creador/Salida/Orden. Por eso todo
  // disparador debe "arrastrar" los drafts actuales, no solo el botón Buscar.
  const flush = (partial) => setFiltros((f) => ({ ...f, destino: destinoDraft, promo: promoDraft, ...partial }));

  const filteredPackages = useMemo(() => {
    const fDestino = normalizeText(filtros.destino);
    const esAdmin = esGestor;

    let result = uniquePackages.filter((pkg) => {
      const mDestino = !fDestino || normalizeText(pkg.destino).includes(fDestino);
      const mCreador = !filtros.creador || (pkg.creador && pkg.creador === filtros.creador);
      const mPromo = !filtros.promo || (pkg.tipo_promo && pkg.tipo_promo === filtros.promo);
      const mSalida = !filtros.salida || (pkg.salida && pkg.salida === filtros.salida);
      if (!mDestino || !mCreador || !mPromo || !mSalida) return false;

      // 👻 Filtro de invisibilidad: promo secreta de Casa Central, oculta para no-admins.
      if (!esAdmin && promosSecretas.includes(pkg.tipo_promo)) return false;

      const isOwner = pkg.editor_email === currentUser?.email;
      const isPending = pkg.status === 'pending';
      if (isPending && !isOwner && !esAdmin) return false;

      return true;
    });

    if (filtros.orden === 'reciente') {
      result = [...result].sort((a, b) => {
        const getTs = (pkg) => {
          if (pkg.timestamp) return pkg.timestamp;
          if (pkg.id_paquete && pkg.id_paquete.startsWith('pkg_')) return parseInt(pkg.id_paquete.split('_')[1]) || 0;
          return 0;
        };
        return getTs(b) - getTs(a);
      });
    } else if (filtros.orden === 'menor_precio') {
      result = [...result].sort((a, b) => parseFloat(a.tarifa) - parseFloat(b.tarifa));
    } else if (filtros.orden === 'mayor_precio') {
      result = [...result].sort((a, b) => parseFloat(b.tarifa) - parseFloat(a.tarifa));
    }

    return result;
  }, [uniquePackages, filtros, esGestor, promosSecretas, currentUser]);

  const handleLimpiar = () => {
    setDestinoDraft('');
    setPromoDraft('');
    setFiltros({ destino: '', creador: '', promo: '', salida: '', orden: 'reciente' });
  };

  return (
    <div id="view-search" className="view active">
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '15px', justifyContent: 'center' }}>
        <button
          id="btn-sub-buscar"
          className="btn"
          style={{ background: '#11173d', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          🔍 Buscar
        </button>
        <button
          id="btn-sub-cargar"
          className="btn"
          onClick={onAbrirCarga}
          style={{ background: '#f3f4f6', color: '#6b7280', border: 'none', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          ➕ Cargar
        </button>
      </div>

      <WeeklyPlanner franquicia={userData?.franquicia || ''} onIrACalendario={onIrACalendarioMarketing} />

      <div className="panel-filtros">
        <div className="filtro-group large">
          <label>Destino</label>
          <input type="text" id="filtro-destino" value={destinoDraft} onChange={(e) => setDestinoDraft(e.target.value)} />
        </div>

        <div className="filtro-group">
          <label>📍 Salida desde</label>
          <select id="filtro-salida" style={{ border: '1px solid #ddd', borderRadius: '6px', width: '170px' }} value={filtros.salida} onChange={(e) => flush({ salida: e.target.value })}>
            {PROVINCIAS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filtro-group" id="container-filtro-creador">
          <label>Creador</label>
          <select id="filtro-creador" value={filtros.creador} onChange={(e) => flush({ creador: e.target.value })}>
            <option value="">Todas las Franquicias</option>
            {franquiciasFiltro.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <div className="filtro-group">
          <label>Promoción</label>
          <select id="filtro-promo" value={promoDraft} onChange={(e) => setPromoDraft(e.target.value)}>
            <option value="">Todas</option>
            {tiposPromocionVisibles.map((p) => (
              <option key={p.nombre} value={p.nombre}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="filtro-group">
          <label>Orden</label>
          <select id="filtro-orden" value={filtros.orden} onChange={(e) => flush({ orden: e.target.value })}>
            <option value="reciente">Recientes</option>
            <option value="menor_precio">Menor Precio</option>
            <option value="mayor_precio">Mayor Precio</option>
          </select>
        </div>

        <div className="panel-actions">
          <button id="boton-buscar" className="btn btn-primario" onClick={() => flush({})}>
            Buscar
          </button>
          <button id="boton-limpiar" className="btn btn-secundario" onClick={handleLimpiar}>
            Limpiar
          </button>
        </div>
      </div>

      <div id="grilla-paquetes" className="grilla-resultados">
        {loading ? null : filteredPackages.length === 0 ? (
          <p style={{ gridColumn: '1/-1', textAlign: 'center' }}>No hay resultados.</p>
        ) : (
          filteredPackages.map((pkg) => <PackageCard key={pkg.id_paquete} pkg={pkg} onSelect={setSelectedPackage} />)
        )}
      </div>

      <PackageDetailModal
        pkg={selectedPackage}
        onClose={() => setSelectedPackage(null)}
        currentUser={currentUser}
        userData={userData}
        actions={actions}
      />
    </div>
  );
}
