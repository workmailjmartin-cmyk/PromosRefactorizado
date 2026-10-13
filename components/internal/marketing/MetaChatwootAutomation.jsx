'use client';
import { useState, useEffect } from 'react';
import { useAlert } from '@/contexts/AlertContext'; // Asumo que usas tu contexto de alertas

// --- CONSTANTES PRECARGADAS ---
const WEBHOOK_URL = ''; // <-- PEGA AQUÍ LA URL DE TU WEBHOOK DE n8n

const FRASES_LIBERADORAS = [
  "Hola, vengo de Facebook.",
  "Hola, vi el anuncio.",
  "Quiero más info de la promo.",
  "Me interesa la publicación.",
  "Hola equipo."
];

const EQUIPOS_CHATWOOT = [
  { value: "franquicia - manantiales", label: "Franquicia Manantiales" },
  { value: "franquicia - centro", label: "Franquicia Centro" },
  { value: "ventas online", label: "Ventas Online" }
];

const ETIQUETAS_PRECARGADAS = [
  "publicidad",
  "promo-activa",
  "meta-ads",
  "hot-sale",
  "black-friday"
];

export default function MetaChatwootAutomation() {
  const { showAlert } = useAlert();
  
  // --- ESTADOS: SECCIÓN 1 ---
  const [fraseLiberadora, setFraseLiberadora] = useState(FRASES_LIBERADORAS[0]);
  const [textoLibre, setTextoLibre] = useState('');
  const [destino, setDestino] = useState('');
  const [salida, setSalida] = useState('');
  const [mes, setMes] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');

  // --- ESTADOS: SECCIÓN 2 ---
  const [respuestaAutomatica, setRespuestaAutomatica] = useState('');
  const [equipo, setEquipo] = useState('');
  const [etiqueta, setEtiqueta] = useState('');

  // --- ESTADOS: SECCIÓN 3 (UI) ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // --- DERIVADOS Y VALIDACIONES ---
  // Mensaje final concatenado
  const mensajeFinal = `${fraseLiberadora} ${textoLibre}`.trim();
  const charCount = mensajeFinal.length;
  const isLengthValid = charCount <= 1024;

  // Lógica para ignorar mayúsculas pero respetar acentos (toLowerCase mantiene los acentos intactos)
  const textoNormalizado = textoLibre.toLowerCase();
  
  const isDestinoValid = destino.trim() !== '' && textoNormalizado.includes(destino.toLowerCase().trim());
  const isSalidaValid = salida.trim() !== '' && textoNormalizado.includes(salida.toLowerCase().trim());
  const isMesValid = mes.trim() === '' || textoNormalizado.includes(mes.toLowerCase().trim()); // Mes es opcional

  // Validar si el formulario está listo para enviarse
  const isFormValid = 
    isLengthValid &&
    destino.trim() !== '' && isDestinoValid &&
    salida.trim() !== '' && isSalidaValid &&
    isMesValid &&
    fechaVencimiento !== '' &&
    respuestaAutomatica.trim() !== '' &&
    equipo !== '' &&
    etiqueta !== '';

  // --- MANEJADORES DE EVENTOS ---
  const handleCopiar = () => {
    navigator.clipboard.writeText(mensajeFinal);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleConfirmar = async () => {
    if (!WEBHOOK_URL) {
      if (showAlert) showAlert('Atención: La URL del webhook no está configurada en el código.', 'error');
      else alert('Atención: La URL del webhook no está configurada.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      meta_message: mensajeFinal,
      vencimiento: fechaVencimiento,
      chatwoot_automation: {
        name: `Promo: ${destino.trim()} - ${salida.trim()}${mes ? ` - ${mes.trim()}` : ''}`,
        event_name: "message_created",
        conditions: {
          destino: destino.trim(),
          salida: salida.trim(),
          mes: mes.trim() !== '' ? mes.trim() : null
        },
        actions: {
          team: equipo,
          label: etiqueta,
          response_message: respuestaAutomatica.trim()
        }
      }
    };

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        if (showAlert) showAlert('¡Automatización enviada con éxito a n8n!', 'success');
        
        // Opcional: Limpiar formulario tras éxito
        setTextoLibre(''); setDestino(''); setSalida(''); setMes(''); setFechaVencimiento(''); setRespuestaAutomatica(''); setEquipo(''); setEtiqueta('');
      } else {
        throw new Error('Error en el servidor');
      }
    } catch (error) {
      if (showAlert) showAlert('Hubo un error al conectar con el Webhook.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '2px solid #e5e7eb' }}>
        <h1 style={{ color: '#11173d', margin: 0, fontSize: '2rem', fontWeight: 800 }}>
          Generador de Campañas (Meta ➔ Chatwoot)
        </h1>
        <p style={{ color: '#6b7280', marginTop: '5px' }}>Estandariza los mensajes de tus pautas y automatiza su distribución en Chatwoot.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* ==========================================
            SECCIÓN 1: CONFIGURACIÓN META ADS
        ========================================== */}
        <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#0369a1', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🔵 1. Mensaje del Cliente (Meta Ads)
          </h2>
          
          <div style={{ display: 'grid', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '8px', color: '#374151' }}>Frase Liberadora (Inicio) *</label>
              <select value={fraseLiberadora} onChange={(e) => setFraseLiberadora(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.95rem' }}>
                {FRASES_LIBERADORAS.map((frase, idx) => (
                  <option key={idx} value={frase}>{frase}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '8px', color: '#374151' }}>Texto Libre de la Publicación *</label>
              <textarea 
                rows="4" 
                value={textoLibre} 
                onChange={(e) => setTextoLibre(e.target.value)} 
                placeholder="Ej: Quiero ir a Cataratas desde Córdoba en Enero."
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.95rem', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '5px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: isLengthValid ? '#6b7280' : '#ef4444' }}>
                  {charCount} / 1024 caracteres
                </span>
              </div>
            </div>

            {/* PALABRAS CLAVE */}
            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#475569', fontSize: '0.95rem' }}>🔍 Palabras Clave Obligatorias en el Texto Libre</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                
                {/* DESTINO */}
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '5px', color: '#374151' }}>Destino *</label>
                  <input type="text" value={destino} onChange={(e) => setDestino(e.target.value)} placeholder="Ej: Cataratas" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                  {destino.trim() !== '' && (
                    <div style={{ marginTop: '5px', fontSize: '0.8rem', fontWeight: 'bold', color: isDestinoValid ? '#16a34a' : '#ef4444' }}>
                      {isDestinoValid ? '✅ Palabra encontrada' : '❌ No se encuentra en el Texto Libre'}
                    </div>
                  )}
                </div>

                {/* SALIDA */}
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '5px', color: '#374151' }}>Salida / Franquicia *</label>
                  <input type="text" value={salida} onChange={(e) => setSalida(e.target.value)} placeholder="Ej: Córdoba" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                  {salida.trim() !== '' && (
                    <div style={{ marginTop: '5px', fontSize: '0.8rem', fontWeight: 'bold', color: isSalidaValid ? '#16a34a' : '#ef4444' }}>
                      {isSalidaValid ? '✅ Palabra encontrada' : '❌ No se encuentra en el Texto Libre'}
                    </div>
                  )}
                </div>

                {/* MES */}
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '5px', color: '#374151' }}>Mes (Opcional)</label>
                  <input type="text" value={mes} onChange={(e) => setMes(e.target.value)} placeholder="Ej: Enero" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                  {mes.trim() !== '' && (
                    <div style={{ marginTop: '5px', fontSize: '0.8rem', fontWeight: 'bold', color: isMesValid ? '#16a34a' : '#ef4444' }}>
                      {isMesValid ? '✅ Palabra encontrada' : '❌ No se encuentra en el Texto Libre'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '8px', color: '#374151' }}>Fecha Vencimiento Pauta *</label>
              <input type="date" value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.95rem' }} />
            </div>

          </div>
        </div>

        {/* ==========================================
            SECCIÓN 2: CONFIGURACIÓN CHATWOOT
        ========================================== */}
        <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#16a34a', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🟢 2. Automatización en Chatwoot
          </h2>

          <div style={{ display: 'grid', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '8px', color: '#374151' }}>Mensaje de Respuesta Automática (Bot) *</label>
              <textarea 
                rows="3" 
                value={respuestaAutomatica} 
                onChange={(e) => setRespuestaAutomatica(e.target.value)} 
                placeholder="Ej: ¡Hola! Gracias por tu interés. Enseguida un asesor te enviará la info..."
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.95rem', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '8px', color: '#374151' }}>Equipo a derivar *</label>
                <select value={equipo} onChange={(e) => setEquipo(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.95rem' }}>
                  <option value="" disabled>Seleccionar equipo...</option>
                  {EQUIPOS_CHATWOOT.map((eq, idx) => (
                    <option key={idx} value={eq.value}>{eq.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '8px', color: '#374151' }}>Etiqueta *</label>
                <select value={etiqueta} onChange={(e) => setEtiqueta(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.95rem' }}>
                  <option value="" disabled>Seleccionar etiqueta...</option>
                  {ETIQUETAS_PRECARGADAS.map((et, idx) => (
                    <option key={idx} value={et}>{et}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            SECCIÓN 3: RESULTADO Y EJECUCIÓN
        ========================================== */}
        <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#11173d', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🚀 3. Resultado Final
          </h2>

          <div style={{ background: '#f3f4f6', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #d1d5db' }}>
            <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '8px', color: '#6b7280', textTransform: 'uppercase' }}>
              Vista Previa (Mensaje de Meta)
            </label>
            <p style={{ margin: 0, color: '#11173d', fontSize: '1rem', whiteSpace: 'pre-wrap', minHeight: '40px' }}>
              {mensajeFinal}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
            
            <button 
              type="button"
              onClick={handleCopiar}
              disabled={!textoLibre}
              style={{ padding: '12px 20px', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: textoLibre ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {copiado ? '✅ ¡Copiado!' : '📋 Copiar para Meta'}
            </button>

            <button 
              type="button"
              onClick={handleConfirmar}
              disabled={!isFormValid || isSubmitting}
              style={{ 
                padding: '12px 30px', 
                background: isFormValid ? '#ef5a1a' : '#fca5a5', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '8px', 
                fontWeight: 'bold', 
                fontSize: '1.05rem',
                cursor: (isFormValid && !isSubmitting) ? 'pointer' : 'not-allowed',
                marginLeft: 'auto',
                transition: 'background 0.2s'
              }}
            >
              {isSubmitting ? '⏳ Enviando a n8n...' : '⚙️ Confirmar y Crear en Chatwoot'}
            </button>
            
          </div>
          
          {/* MENSAJE DE ADVERTENCIA SI ALGO FALLA */}
          {!isFormValid && textoLibre.length > 0 && (
            <p style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'right', marginTop: '10px', fontWeight: 'bold' }}>
              * El botón de Confirmar está bloqueado. Revisa las palabras clave o los campos obligatorios.
            </p>
          )}

        </div>
      </div>
    </div>
  );
}