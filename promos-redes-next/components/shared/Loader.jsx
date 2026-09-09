// Componente de presentación puro: el padre controla la visibilidad con la prop
// "visible" (equivalente al showLoader(true/false) del código original). El
// panel interno además pasa un "text" opcional (showLoader(true, "Cargando...")).
export default function Loader({ visible, text }) {
  return (
    <div id="loader-overlay" style={{ display: visible ? 'flex' : 'none' }}>
      <div className="hourglassBackground">
        <div className="hourglassContainer">
          <div className="hourglassCurves"></div>
          <div className="hourglassCapTop"></div>
          <div className="hourglassGlassTop"></div>
          <div className="hourglassSand"></div>
          <div className="hourglassSandStream"></div>
          <div className="hourglassCapBottom"></div>
          <div className="hourglassGlass"></div>
        </div>
      </div>
      {text && <p style={{ marginTop: '20px', fontWeight: 600, color: '#11173d', fontSize: '1.2em' }}>{text}</p>}
    </div>
  );
}
