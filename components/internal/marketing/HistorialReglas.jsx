import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';

export function HistorialReglas({ equiposChatwoot }) {
  const { showAlert } = useAlert();
  const [reglas, setReglas] = useState([]);
  const [filtroEquipo, setFiltroEquipo] = useState('');
  const [loading, setLoading] = useState(true);

  const cargarReglas = async () => {
    try {
      const q = query(collection(db, 'reglas_chatwoot'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReglas(data);
    } catch (error) {
      console.error("Error al cargar historial:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarReglas(); }, []);

  const actualizarVencimiento = async (id, nuevaFecha) => {
    try {
      await updateDoc(doc(db, 'reglas_chatwoot', id), { vencimiento: nuevaFecha });
      // OPCIONAL: Acá podés hacer un fetch(WEBHOOK_URL_UPDATE) a n8n para que también actualice la fecha en el Sheet/Chatwoot
      if (showAlert) showAlert('Plazo de vigencia actualizado.', 'success');
      cargarReglas();
    } catch (error) {
      if (showAlert) showAlert('Error al actualizar la fecha.', 'error');
    }
  };

  const eliminarRegla = async (id) => {
    if (!window.confirm('¿Seguro que querés eliminar esta automatización?')) return;
    try {
      await deleteDoc(doc(db, 'reglas_chatwoot', id));
      // OPCIONAL: Acá podés hacer un fetch(WEBHOOK_URL_DELETE) a n8n para borrar la regla en Chatwoot
      if (showAlert) showAlert('Automatización eliminada.', 'success');
      cargarReglas();
    } catch (error) {
      if (showAlert) showAlert('Error al eliminar.', 'error');
    }
  };

  const reglasFiltradas = filtroEquipo ? reglas.filter(r => r.chatwoot_automation?.actions?.team === filtroEquipo) : reglas;

  if (loading) return <div>Cargando historial...</div>;

  return (
    <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #e5e7eb', marginTop: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#11173d', fontSize: '1.2rem' }}>📋 Historial de Campañas Activas</h2>
        <select value={filtroEquipo} onChange={(e) => setFiltroEquipo(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}>
          <option value="">Todos los Equipos</option>
          {equiposChatwoot.map((eq, idx) => (
            <option key={idx} value={eq.value}>{eq.label}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {reglasFiltradas.length === 0 ? (
          <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No hay reglas registradas para este filtro.</p>
        ) : (
          reglasFiltradas.map(regla => {
            const conds = regla.chatwoot_automation?.conditions || {};
            const keywords = [conds.destino, conds.salida, conds.mes].filter(Boolean).join(' • ');

            return (
              <div key={regla.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.8rem', color: '#0369a1', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>
                    {regla.chatwoot_automation?.name || 'Regla'}
                  </div>
                  <div style={{ fontWeight: 'bold', color: '#11173d', marginBottom: '5px' }}>
                    Palabras Clave: <span style={{ color: '#ef5a1a' }}>{keywords}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ textAlign: 'right', background: '#fef3c7', padding: '8px 12px', borderRadius: '6px', border: '1px solid #fde68a' }}>
                    <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 'bold', textTransform: 'uppercase' }}>Vencimiento</div>
                    <input 
                      type="date" 
                      value={regla.vencimiento} 
                      onChange={(e) => actualizarVencimiento(regla.id, e.target.value)}
                      style={{ border: 'none', background: 'transparent', fontWeight: 'bold', color: '#11173d', outline: 'none', cursor: 'pointer' }}
                    />
                  </div>
                  <button onClick={() => eliminarRegla(regla.id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                    🗑️
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}