export default function LoginScreen({ onLogin }) {
  return (
    <div id="login-container" className="login-container">
      <div className="login-box">
        <div className="logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Feliz Viaje" style={{ height: '80px', margin: '0 auto' }} />
        </div>
        <h2 style={{ color: '#11173d' }}>Acceso Plataforma</h2>
        <button className="btn btn-primario" style={{ width: '100%', marginTop: '20px' }} onClick={onLogin}>
          Iniciar con Google
        </button>
      </div>
    </div>
  );
}
