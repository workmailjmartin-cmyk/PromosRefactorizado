'use client';
import { useState, useRef, useEffect } from 'react';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { useAlert } from '@/contexts/AlertContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '@/lib/supabase';

const MAX_CHATS = 5;
const MAX_TURNOS = 8; // Turnos para permitir ida y vuelta fluido

export default function AsistenteIA() {
  const { currentUser } = useStaffAuth();
  const { showAlert } = useAlert();
  
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const timeoutRef = useRef(null);

  const [chats, setChats] = useState([]);
  const [chatActivoId, setChatActivoId] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  
  // Estado para el modal moderno de confirmación de borrado
  const [chatAEliminar, setChatAEliminar] = useState(null); 
  
  const [inputTexto, setInputTexto] = useState('');
  
  // Estados para soportar MÚLTIPLES imágenes
  const [imagenesAdjuntas, setImagenesAdjuntas] = useState([]); // Archivos File
  const [imagenesPrevias, setImagenesPrevias] = useState([]);   // URLs base64 para vista previa
  
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarAbierta, setSidebarAbierta] = useState(false);

  // Auto-scroll hacia abajo
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [mensajes, isLoading]);

  // Ajuste automático de altura del Textarea (hasta 5 renglones ~ 130px)
  const handleTextChange = (e) => {
    setInputTexto(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const altura = Math.min(textareaRef.current.scrollHeight, 130);
      textareaRef.current.style.height = `${altura}px`;
    }
  };

  // Cargar lista inicial de chats del usuario
  useEffect(() => {
    if (!currentUser?.uid) return;
    const fetchChats = async () => {
      const { data } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', currentUser.uid)
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setChats(data);
        setChatActivoId(data[0].id);
      } else {
        setChats([]);
        setChatActivoId(null);
      }
    };
    fetchChats();
  }, [currentUser]);

  // Cargar mensajes cuando cambia el chat activo + suscripción Realtime + Respaldo
  useEffect(() => {
    if (!chatActivoId) {
      setMensajes([]);
      return;
    }

    // 1. Cargar historial existente
    const fetchMensajes = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatActivoId)
        .order('created_at', { ascending: true });

      setMensajes(data || []);
    };
    fetchMensajes();

    // 2. Escucha en tiempo real (Realtime)
    const channel = supabase
      .channel(`chat_realtime_${chatActivoId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatActivoId}` },
        (payload) => {
          const nuevoMensaje = payload.new;
          if (nuevoMensaje.role === 'assistant') {
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            setMensajes((prev) => {
              if (prev.some((m) => m.id === nuevoMensaje.id)) return prev;
              return [...prev, nuevoMensaje];
            });
            setIsLoading(false);
          }
        }
      )
      .subscribe();

    // 3. 🛡️ CHEQUEO DE RESPALDO CADA 3 SEGUNDOS MIENTRAS PIENSA
    // Si n8n responde en 5s pero el websocket parpadeó, esto rescata la respuesta de inmediato
    const intervalRespaldo = setInterval(async () => {
      if (isLoading) {
        const { data } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chatActivoId)
          .eq('role', 'assistant')
          .order('created_at', { ascending: false })
          .limit(1);

        if (data && data.length > 0) {
          const ultimoAsistente = data[0];
          setMensajes((prev) => {
            const yaExiste = prev.some((m) => m.id === ultimoAsistente.id);
            if (!yaExiste) {
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
              }
              setIsLoading(false);
              return [...prev, ultimoAsistente];
            }
            return prev;
          });
        }
      }
    }, 3000);

    return () => {
      clearInterval(intervalRespaldo);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      supabase.removeChannel(channel);
    };
  }, [chatActivoId, isLoading]);

  // Crear nuevo chat explícito desde el botón "+"
  const crearNuevoChat = async () => {
    if (chats.length >= MAX_CHATS) {
      if(showAlert) showAlert(`Límite alcanzado: Máximo ${MAX_CHATS} cotizaciones. Eliminá una para continuar.`, 'error');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('chats')
        .insert([{ user_id: currentUser.uid, title: 'Nueva Cotización' }])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const nuevo = data[0];
        setChats(prev => [nuevo, ...prev]);
        setChatActivoId(nuevo.id);
        setMensajes([]);
        setSidebarAbierta(false);
        return nuevo.id;
      }
    } catch (err) {
      console.error("Error creando chat:", err);
      return null;
    }
    return null;
  };

  // Ejecutar borrado definitivo (Llamado desde el modal moderno)
  const ejecutarBorrado = async () => {
    if (!chatAEliminar) return;
    const id = chatAEliminar;
    setChatAEliminar(null); // Cierra el modal
    setIsLoading(false);

    // Borrado definitivo en cascada de Supabase
    const { error } = await supabase.from('chats').delete().eq('id', id);

    if (!error) {
      const restantes = chats.filter((c) => c.id !== id);
      setChats(restantes);

      if (chatActivoId === id) {
        if (restantes.length > 0) {
          setChatActivoId(restantes[0].id);
        } else {
          setChatActivoId(null);
          setMensajes([]);
        }
      }
    }
  };

  // Manejador para subir archivos de imagen tradicionales
  const handleImagenesUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Máximo 4 imágenes
    const combinadas = [...imagenesAdjuntas, ...files].slice(0, 4);
    setImagenesAdjuntas(combinadas);

    const promises = combinadas.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then(previews => setImagenesPrevias(previews));
  };

  // 🔥 Pegar imágenes directamente con Ctrl + V desde el portapapeles
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imagenesPegadas = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          const archivoConNombre = new File([file], `captura_${Date.now()}.png`, { type: file.type });
          imagenesPegadas.push(archivoConNombre);
        }
      }
    }

    if (imagenesPegadas.length > 0) {
      const combinadas = [...imagenesAdjuntas, ...imagenesPegadas].slice(0, 4);
      setImagenesAdjuntas(combinadas);

      const promises = combinadas.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target.result);
          reader.readAsDataURL(file);
        });
      });

      Promise.all(promises).then(previews => setImagenesPrevias(previews));
    }
  };

  // Quitar una imagen de la vista previa
  const eliminarImagen = (index) => {
    setImagenesAdjuntas(prev => prev.filter((_, i) => i !== index));
    setImagenesPrevias(prev => prev.filter((_, i) => i !== index));
  };

  const enviarMensaje = async () => {
    if (!inputTexto.trim() && imagenesAdjuntas.length === 0) return;

    let idChat = chatActivoId;
    if (!idChat) {
      idChat = await crearNuevoChat();
      if (!idChat) return;
    }

    if (mensajes.length >= MAX_TURNOS) {
      if (showAlert) showAlert('Límite de turnos alcanzado en esta cotización. Iniciá una nueva.', 'error');
      return;
    }

    setIsLoading(true);

    // Guardamos una copia local de las fotos para mostrarlas de inmediato en tu mensaje
    const fotosLocalesParaMostrar = [...imagenesPrevias];
    const archivosASubir = [...imagenesAdjuntas];

    // Limpiamos los inputs y la barra de escritura en el acto
    setInputTexto('');
    setImagenesAdjuntas([]);
    setImagenesPrevias([]);
    if (textareaRef.current) textareaRef.current.style.height = '42px';

    // Subir imágenes a Supabase Storage
    let urlsSubidas = [];
    if (archivosASubir.length > 0) {
      const uploadPromises = archivosASubir.map(async (file) => {
        const nombreArchivo = `${Date.now()}_${Math.random().toString(36).substring(7)}_${file.name}`;
        const { data, error } = await supabase.storage.from('cotizaciones_files').upload(nombreArchivo, file);
        if (!error) {
          return supabase.storage.from('cotizaciones_files').getPublicUrl(nombreArchivo).data.publicUrl;
        } else {
          console.error("Error subiendo foto a Supabase:", error);
          return null;
        }
      });
      const resultados = await Promise.all(uploadPromises);
      urlsSubidas = resultados.filter(Boolean);
    }

    const textoGuardar = inputTexto.trim();
    
    // Si la subida a Supabase funcionó usamos la URL web, sino usamos la copia local
    const imagenesParaGuardar = urlsSubidas.length > 0 ? urlsSubidas : fotosLocalesParaMostrar;
    const stringImagenes = imagenesParaGuardar.length > 0 ? JSON.stringify(imagenesParaGuardar) : null;

    const msjUsuario = {
      chat_id: idChat,
      role: 'user',
      content: textoGuardar,
      image_url: stringImagenes
    };

    // 👈 ACÁ: Pintamos el mensaje con las fotos inmediatamente en tu pantalla
    const { data: dbMsgUser } = await supabase.from('messages').insert([msjUsuario]).select();
    if (dbMsgUser) {
      setMensajes((prev) => [...prev, dbMsgUser[0]]);
    } else {
      // Respaldo visual en pantalla si la base tarda
      setMensajes((prev) => [...prev, { ...msjUsuario, id: Date.now() }]);
    }

    // Título inteligente en el historial
    if (mensajes.length === 0) {
      const tituloGenerado = (textoGuardar || 'Cotización con foto').slice(0, 26) + '...';
      await supabase.from('chats').update({ title: tituloGenerado }).eq('id', idChat);
      setChats((prev) => prev.map((c) => (c.id === idChat ? { ...c, title: tituloGenerado } : c)));
    }

    // ⏱️ Reloj de seguridad
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsLoading(false);
      setMensajes((prev) => {
        const yaRespondio = prev.some((m) => m.role === 'assistant');
        if (yaRespondio) return prev;
        return [
          ...prev,
          {
            id: Date.now(),
            role: 'assistant',
            content: '⚠️ **Demora en el servidor:** La consulta a Google Flights tardó más de lo esperado. Por favor, volvé a enviar el mensaje o adjuntá la captura para agilizar.',
          },
        ];
      });
    }, 80000);

    // Disparamos n8n con las URLs de las fotos
    try {
      const WEBHOOK_N8N_URL = 'https://n8n.felizviaje.ar/webhook/cotizador-ia';
      await fetch(WEBHOOK_N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: idChat,
          text: msjUsuario.content,
          user_id: currentUser.uid,
          image_url: urlsSubidas[0] || null,
          images: urlsSubidas,
        }),
      });
    } catch (error) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      console.error('Error webhook:', error);
      setIsLoading(false);
      setMensajes((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: 'assistant',
          content: '❌ **Error de conexión:** No se pudo contactar al Director Comercial. Revisá tu conexión a internet.',
        },
      ]);
    }
  };

 // Helper para dibujar una o múltiples fotos con estilo profesional
  const renderizarImagenesMensaje = (image_url) => {
    if (!image_url) return null;
    let urls = [];
    try {
      if (image_url.startsWith('[')) urls = JSON.parse(image_url);
      else urls = [image_url];
    } catch {
      urls = [image_url];
    }

    return (
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
        {urls.map((url, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            key={i} 
            src={url} 
            alt={`Adjunto ${i + 1}`} 
            style={{ 
              maxHeight: '180px', 
              maxWidth: '100%', 
              borderRadius: '10px', 
              border: '2px solid rgba(255, 255, 255, 0.2)', // Borde sutil para que resalte sobre el fondo azul
              background: '#fff',
              objectFit: 'contain' 
            }} 
          />
        ))}
      </div>
    );
  };

  const esLimiteAlcanzado = mensajes.length >= MAX_TURNOS;

  return (
    <div className="chat-ia-wrapper">
      
      {/* Overlay para móviles */}
      {sidebarAbierta && (
        <div className="chat-mobile-overlay" onClick={() => setSidebarAbierta(false)}></div>
      )}

      {/* ================= SIDEBAR (HISTORIAL) ================= */}
      <div className={`chat-sidebar ${sidebarAbierta ? 'abierta' : ''}`}>
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            onClick={crearNuevoChat}
            disabled={chats.length >= MAX_CHATS}
            style={{ 
              flex: 1, padding: '12px', background: '#11173d', color: '#fff', border: 'none', 
              borderRadius: '8px', fontWeight: 'bold', cursor: chats.length >= MAX_CHATS ? 'not-allowed' : 'pointer', 
              opacity: chats.length >= MAX_CHATS ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' 
            }}
          >
            ➕ Nueva Cotización
          </button>
          <button className="chat-btn-cerrar-mobile" onClick={() => setSidebarAbierta(false)}>✖</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 15px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {chats.map(chat => (
            <div 
              key={chat.id}
              onClick={() => { setChatActivoId(chat.id); setSidebarAbierta(false); }}
              style={{ 
                padding: '12px 14px', background: chatActivoId === chat.id ? '#e0f2fe' : 'transparent', 
                borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', 
                alignItems: 'center', border: chatActivoId === chat.id ? '1px solid #bae6fd' : '1px solid transparent' 
              }}
            >
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.88rem', color: chatActivoId === chat.id ? '#0369a1' : '#4b5563', fontWeight: chatActivoId === chat.id ? 'bold' : 'normal' }}>
                💬 {chat.title}
              </div>
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setChatAEliminar(chat.id); // 🔥 Abre modal moderno
                }} 
                style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1rem', padding: '4px' }} 
                title="Eliminar Chat"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ================= ÁREA PRINCIPAL ================= */}
      <div className="chat-main-area">
        
        {/* Cabecera */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #e5e7eb', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="chat-btn-menu-mobile" onClick={() => setSidebarAbierta(true)}>☰</button>
            <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#11173d', fontWeight: 900 }}>Auditor Comercial AI</h2>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 'bold', background: '#f3f4f6', padding: '4px 10px', borderRadius: '12px' }}>
            Turnos: {mensajes.length} / {MAX_TURNOS}
          </span>
        </div>

        {/* Mensajes */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px', background: '#fcfcfc' }}>
          
          {mensajes.length === 0 && !isLoading && (
            <div style={{ textAlign: 'center', color: '#9ca3af', marginTop: '60px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>✈️</div>
              <h3 style={{ fontSize: '1.2rem', color: '#11173d', marginBottom: '8px', fontWeight: 'bold' }}>Director Comercial Listo</h3>
              <p style={{ fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto', lineHeight: '1.5' }}>
                Pegá tu cotización o subí capturas de vuelos/hoteles. Te ayudo a validar precios, temporadas y calidad de servicio.
              </p>
            </div>
          )}

          {mensajes.map((msg) => {
            const isAI = msg.role === 'assistant';
            return (
              <div key={msg.id} style={{ display: 'flex', justifyContent: isAI ? 'flex-start' : 'flex-end', width: '100%' }}>
                <div style={{ 
                  maxWidth: '85%', 
                  background: isAI ? '#fff' : '#11173d', 
                  color: isAI ? '#11173d' : '#fff', 
                  padding: '14px 18px', 
                  borderRadius: isAI ? '0px 16px 16px 16px' : '16px 0px 16px 16px',
                  border: isAI ? '1px solid #e5e7eb' : 'none',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                  fontSize: '0.92rem',
                  lineHeight: '1.6'
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: isAI ? '#ef5a1a' : '#9ca3af', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {isAI ? '🤖 Director Comercial Feliz Viaje' : '👤 Tú'}
                  </div>
                  
                  {renderizarImagenesMensaje(msg.image_url)}

                  <div className="markdown-body" style={{ color: 'inherit' }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            );
          })}

          {/* 🔥 CARTEL ANIMADO VISIBLE MIENTRAS PIENSA LA IA 🔥 */}
          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
              <div style={{ background: '#fff', padding: '14px 20px', borderRadius: '0px 16px 16px 16px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '12px', color: '#11173d', fontSize: '0.9rem', fontWeight: 600, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <span className="spinner-ia" style={{ fontSize: '1.3rem' }}>✈️</span> 
                <div>
                  <div style={{ fontWeight: 'bold' }}>El Director Comercial está auditando tu paquete...</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 'normal', marginTop: '2px' }}>
                    Verificando tarifas de mercado, hotelería y rentabilidad
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Zona de Input */}
        <div style={{ padding: '10px 15px', background: '#fff', borderTop: '1px solid #e5e7eb' }}>
          {esLimiteAlcanzado ? (
            <div style={{ textAlign: 'center', padding: '12px', background: '#fee2e2', color: '#dc2626', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.88rem' }}>
              🛑 Límite de turnos alcanzado. Iniciá una nueva cotización para comenzar un nuevo análisis.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#f9fafb', padding: '10px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
              
              {/* Previsualización de MÚLTIPLES fotos con botón de borrar individual */}
              {imagenesPrevias.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingBottom: '4px' }}>
                  {imagenesPrevias.map((src, index) => (
                    <div key={index} style={{ position: 'relative', width: 'max-content' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="Previa" style={{ height: '55px', borderRadius: '8px', border: '1px solid #d1d5db', objectFit: 'cover' }} />
                      <button 
                        onClick={() => eliminarImagen(index)} 
                        style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                <label 
                  title="Adjuntar imágenes (máximo 4)" 
                  style={{ cursor: isLoading ? 'not-allowed' : 'pointer', background: '#e5e7eb', width: '42px', height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isLoading ? 0.5 : 1, transition: 'background 0.2s', flexShrink: 0 }}
                >
                  📎
                  <input type="file" accept="image/*" multiple onChange={handleImagenesUpload} style={{ display: 'none' }} disabled={isLoading} />
                </label>

                {/* Textarea auto-ajustable con soporte para Ctrl+V */}
                <textarea 
                  ref={textareaRef}
                  placeholder="Pegá la cotización o preguntale al director..."
                  value={inputTexto}
                  onChange={handleTextChange}
                  onPaste={handlePaste}
                  disabled={isLoading}
                  style={{ 
                    flex: 1, padding: '11px 14px', borderRadius: '12px', border: '1px solid #d1d5db', 
                    fontSize: '0.92rem', resize: 'none', outline: 'none', minHeight: '42px', maxHeight: '130px', 
                    fontFamily: 'inherit', background: '#fff', lineHeight: '1.4' 
                  }}
                  rows="1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      enviarMensaje();
                    }
                  }}
                />

                <button 
                  onClick={enviarMensaje}
                  disabled={isLoading || (!inputTexto.trim() && imagenesAdjuntas.length === 0)}
                  style={{ 
                    background: '#ef5a1a', color: '#fff', border: 'none', height: '42px', padding: '0 18px', 
                    borderRadius: '12px', fontWeight: 'bold', cursor: (isLoading || (!inputTexto.trim() && imagenesAdjuntas.length === 0)) ? 'not-allowed' : 'pointer', 
                    opacity: (isLoading || (!inputTexto.trim() && imagenesAdjuntas.length === 0)) ? 0.5 : 1, 
                    display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 
                  }}
                >
                  <span className="chat-btn-text">Enviar</span> 🚀
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL MODERNO DE CONFIRMACIÓN ================= */}
      {chatAEliminar && (
        <div className="modal-confirm-overlay" onClick={() => setChatAEliminar(null)}>
          <div className="modal-confirm-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-confirm-icon-box">🗑️</div>
            <h3 className="modal-confirm-title">¿Eliminar cotización?</h3>
            <p className="modal-confirm-desc">
              Esta conversación y todos sus análisis se borrarán definitivamente de la base de datos.
            </p>
            <div className="modal-confirm-btn-group">
              <button className="btn-modal-cancel" onClick={() => setChatAEliminar(null)}>
                Cancelar
              </button>
              <button className="btn-modal-delete" onClick={ejecutarBorrado}>
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Estilos CSS Responsive */}
      <style dangerouslySetInnerHTML={{__html: `
        .chat-ia-wrapper { display: flex; height: calc(100dvh - 75px); background: #fff; border-radius: 16px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.03); position: relative; font-family: system-ui, -apple-system, sans-serif; }
        .chat-sidebar { width: 280px; background: #f9fafb; border-right: 1px solid #e5e7eb; display: flex; flex-direction: column; transition: transform 0.3s ease; z-index: 30; }
        .chat-main-area { flex: 1; display: flex; flex-direction: column; min-width: 0; position: relative; z-index: 10; }
        .chat-btn-cerrar-mobile, .chat-btn-menu-mobile { display: none; background: none; border: none; cursor: pointer; font-size: 1.4rem; color: #11173d; }
        .chat-mobile-overlay { display: none; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 20; }
        
        .markdown-body table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        .markdown-body th, .markdown-body td { border: 1px solid #d1d5db; padding: 8px; text-align: left; font-size: 0.88em; }
        .markdown-body th { background: #f3f4f6; color: #11173d; font-weight: bold; }
        .markdown-body ul { padding-left: 20px; list-style-type: disc; margin-bottom: 10px; }
        .markdown-body strong { font-weight: 900; color: inherit; }
        .spinner-ia { display: inline-block; animation: latir 1s infinite alternate; }
        @keyframes latir { 0% { transform: scale(0.9); } 100% { transform: scale(1.2); } }

        /* Estilos del Modal de Confirmación Moderno */
        .modal-confirm-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(17, 23, 61, 0.45);
          backdrop-filter: blur(4px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .modal-confirm-card {
          background: #ffffff;
          border-radius: 18px;
          max-width: 360px;
          width: 100%;
          padding: 24px 20px;
          text-align: center;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.18);
          animation: popIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes popIn {
          0% { transform: scale(0.92); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        .modal-confirm-icon-box {
          width: 52px;
          height: 52px;
          background: #fee2e2;
          color: #dc2626;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          margin: 0 auto 14px auto;
        }

        .modal-confirm-title {
          margin: 0 0 8px 0;
          font-size: 1.15rem;
          color: #11173d;
          font-weight: 800;
        }

        .modal-confirm-desc {
          margin: 0 0 20px 0;
          font-size: 0.88rem;
          color: #6b7280;
          line-height: 1.45;
        }

        .modal-confirm-btn-group {
          display: flex;
          gap: 10px;
          justify-content: center;
        }

        .btn-modal-cancel {
          flex: 1;
          padding: 11px 16px;
          background: #f3f4f6;
          color: #4b5563;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-modal-cancel:hover { background: #e5e7eb; }

        .btn-modal-delete {
          flex: 1;
          padding: 11px 16px;
          background: #dc2626;
          color: #ffffff;
          border: none;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-modal-delete:hover { background: #b91c1c; }

        @media (max-width: 768px) {
          .chat-sidebar { position: absolute; height: 100%; transform: translateX(-100%); }
          .chat-sidebar.abierta { transform: translateX(0); }
          .chat-btn-menu-mobile, .chat-btn-cerrar-mobile, .chat-mobile-overlay { display: block; }
          .chat-btn-text { display: none; }
          .chat-main-area .markdown-body { font-size: 0.88rem; }
        }
      `}} />
    </div>
  );
}