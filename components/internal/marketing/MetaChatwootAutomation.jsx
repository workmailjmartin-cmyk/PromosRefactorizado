'use client';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAlert } from '@/contexts/AlertContext';

const WEBHOOK_URL = 'https://n8n.felizviaje.ar/webhook/crear-regla-chatwoot'; 

export default function MetaChatwootAutomation() {
  const { showAlert } = useAlert();
  
  // --- ESTADOS DE CONFIGURACIÓN DINÁMICA (Traídos de Firebase) ---
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [frasesLiberadoras, setFrasesLiberadoras] = useState([]);
  const [equiposChatwoot, setEquiposChatwoot] = useState([]);
  const [etiquetasPrecargadas, setEtiquetasPrecargadas] = useState([]);

  // --- ESTADOS: SECCIÓN 1 ---
  const [fraseLiberadora, setFraseLiberadora] = useState('');
  // ... (tus otros estados se mantienen igual)
  const [textoLibre, setTextoLibre] = useState('');
  const [destino, setDestino] = useState('');
  const [salida, setSalida] = useState('');
  const [mes, setMes] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [respuestaAutomatica, setRespuestaAutomatica] = useState('');
  const [equipo, setEquipo] = useState('');
  const [etiqueta, setEtiqueta] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // --- Cargar Configuración desde Firebase ---
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, 'configuracion', 'chatwoot');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFrasesLiberadoras(data.frases || []);
          setEquiposChatwoot(data.equipos || []);
          setEtiquetasPrecargadas(data.etiquetas || []);
          
          // Setear valores por defecto si hay datos
          if (data.frases && data.frases.length > 0) setFraseLiberadora(data.frases[0]);
        }
      } catch (error) {
        console.error("Error cargando config chatwoot:", error);
      } finally {
        setLoadingConfig(false);
      }
    };
    fetchConfig();
  }, []);

  // --- BURBUJA DE CHATWOOT PARA QA ---
  useEffect(() => {
    (function(d,t) {
      var BASE_URL="https://chat.felizviaje.ar";
      var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
      g.src=BASE_URL+"/packs/js/sdk.js";
      g.defer = true;
      g.async = true;
      s.parentNode.insertBefore(g,s);
      g.onload=function(){
        window.chatwootSDK.run({
          websiteToken: '6smY8dUYYzBpaH4ze3hVQRQo',
          baseUrl: BASE_URL
        })
      }
    })(document,"script");
  }, []);


  // --- DERIVADOS Y VALIDACIONES ---
  const mensajeFinal = `${fraseLiberadora} ${textoLibre}`.trim();
  const charCount = mensajeFinal.length;
  const isLengthValid = charCount <= 80;

  const textoNormalizado = textoLibre.toLowerCase();
  
  const isDestinoValid = destino.trim() !== '' && textoNormalizado.includes(destino.toLowerCase().trim());
  const isSalidaValid = salida.trim() !== '' && textoNormalizado.includes(salida.toLowerCase().trim());
  const isMesValid = mes.trim() === '' || textoNormalizado.includes(mes.toLowerCase().trim());

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
      if (showAlert) showAlert('Atención: La URL del webhook no está configurada.', 'error');
      else alert('Atención: La URL del webhook no está configurada.');
      return;
    }

    setIsSubmitting(true);

    // Buscamos el nombre del equipo seleccionado para armar el Nombre de la regla
    // Esto lo hace dinámico basado en lo que el usuario eligió
    const equipoSeleccionado = equiposChatwoot.find(eq => eq.value === equipo);
    const nombreEquipoStr = equipoSeleccionado ? equipoSeleccionado.label.toUpperCase() : 'NUEVA FRANQUICIA';

    // Formateamos la fecha de vencimiento para la descripción [DD/MM]
    const fechaObj = new Date(fechaVencimiento);
    const dia = String(fechaObj.getUTCDate()).padStart(2, '0');
    const mesNum = String(fechaObj.getUTCMonth() + 1).padStart(2, '0');
    const fechaFormateada = `${dia}/${mesNum}`;

    const payload = {
      meta_message: mensajeFinal,
      vencimiento: fechaVencimiento,
      chatwoot_automation: {
        // Ajustado para coincidir con tu formato de la imagen
        name: nombreEquipoStr, 
        description: `[${fechaFormateada}] ${destino.trim()}`,
        event_name: "message_created",
        conditions: {
          destino: destino.trim(),
          salida: salida.trim(),
          mes: mes.trim() !== '' ? mes.trim() : null
        },
        actions: {
          team: equipo, // Aquí estamos enviando el ID numérico (ej. "15")
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

      // Leemos la respuesta de n8n
      const responseData = await response.json(); 

      if (response.ok) {
        // Camino de éxito (200)
        if (showAlert) showAlert('¡Automatización enviada con éxito!', 'success');
        setTextoLibre(''); setDestino(''); setSalida(''); setMes(''); setFechaVencimiento(''); setRespuestaAutomatica(''); setEquipo(''); setEtiqueta('');
      } else {
        // Camino de error (400 - Duplicado o falta Mes)
        // Mostramos el mensaje exacto que n8n nos mandó
        if (showAlert) showAlert(responseData.error || 'Error de validación', 'error');
        else alert(responseData.error || 'Error de validación');
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
                {frasesLiberadoras.map((frase, idx) => (
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
                  {charCount} / 80 caracteres
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
                  {equiposChatwoot.map((eq, idx) => (
                    <option key={idx} value={eq.value}>{eq.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '8px', color: '#374151' }}>Etiqueta *</label>
                <select value={etiqueta} onChange={(e) => setEtiqueta(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.95rem' }}>
                  <option value="" disabled>Seleccionar etiqueta...</option>
                  {etiquetasPrecargadas.map((et, idx) => (
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