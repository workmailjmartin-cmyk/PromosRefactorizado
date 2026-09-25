'use client';
import { useState, useRef, useEffect } from 'react';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { useAlert } from '@/contexts/AlertContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '@/lib/supabase';

const MAX_CHATS = 5;
const MAX_TURNOS = 8; // Aumentado ligeramente para permitir intercambios fluidos

export default function AsistenteIA() {
  const { currentUser } = useStaffAuth();
  const { showAlert } = useAlert();
  
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const [chats, setChats] = useState([]);
  const [chatActivoId, setChatActivoId] = useState(null);
  const [mensajes, setMensajes] = useState([]);

  const [inputTexto, setInputTexto] = useState('');
  
  // Estados para soportar MÚLTIPLES imágenes
  const [imagenesAdjuntas, setImagenesAdjuntas] = useState([]); // Archivos File
  const [imagenesPrevias, setImagenesPrevias] = useState([]);   // URLs base64 para vista previa
  
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarAbierta, setSidebarAbierta] = useState(false);

  // Auto-scroll hacia abajo
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [mensajes, isLoading]);

  // Ajuste automático de altura del Textarea (hasta 5 renglones ~ 125px)
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

  // Cargar mensajes cuando cambia el chat activo + suscripción Realtime
  useEffect(() => {
    setIsLoading(false); // Resetea cualquier carga fantasma

    if (!chatActivoId) {
      setMensajes([]);
      return;
    }

    const fetchMensajes = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatActivoId)
        .order('created_at', { ascending: true });
      
      setMensajes(data || []);
    };
    fetchMensajes();

    const channel = supabase
      .channel(`chat_realtime_${chatActivoId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatActivoId}` }, 
        (payload) => {
          const nuevoMensaje = payload.new;
          if (nuevoMensaje.role === 'assistant') {
            setMensajes(prev => [...prev, nuevoMensaje]);
            setIsLoading(false);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [chatActivoId]);

  // Crear nuevo chat explícito desde el botón "+"
  const crearNuevoChat = async () => {
    if (chats.length >= MAX_CHATS) {
      if(showAlert) showAlert(`Límite alcanzado: Máximo ${MAX_CHATS} cotizaciones. Eliminá una para continuar.`, 'error');
      return null;
    }

    setIsLoading(false);
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

  // Eliminar chat (Limpieza total en cascada)
  const archivarChat = async (e, id) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar definitivamente esta cotización?')) return;

    setIsLoading(false);
    
    // Al borrar el chat, la base de datos borra todos los mensajes por ON DELETE CASCADE
    const { error } = await supabase.from('chats').delete().eq('id', id);
    
    if (!error) {
      const restantes = chats.filter(c => c.id !== id);
      setChats(restantes);

      // Si borramos el chat que estábamos viendo
      if (chatActivoId === id) {
        if (restantes.length > 0) {
          setChatActivoId(restantes[0].id);
        } else {
          // Si no queda ninguno, limpiamos la pantalla a estado cero
          setChatActivoId(null);
          setMensajes([]);
        }
      }
    }
  };

  // Manejador para SUBIR MÚLTIPLES IMÁGENES
  const handleImagenesUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Máximo 4 imágenes por mensaje
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

  // 🔥 Pegar imágenes con Ctrl + V directamente desde el portapapeles
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imagenesPegadas = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          // Le asignamos un nombre claro a la captura
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

  // Eliminar una imagen de la lista previa
  const eliminarImagen = (index) => {
    const nuevasAdjuntas = imagenesAdjuntas.filter((_, i) => i !== index);
    const nuevasPrevias = imagenesPrevias.filter((_, i) => i !== index);
    setImagenesAdjuntas(nuevasAdjuntas);
    setImagenesPrevias(nuevasPrevias);
  };

  const enviarMensaje = async () => {
    if (!inputTexto.trim() && imagenesAdjuntas.length === 0) return;

    let idChat = chatActivoId;
    if (!idChat) {
      idChat = await crearNuevoChat();
      if (!idChat) return;
    }

    if (mensajes.length >= MAX_TURNOS) {
      if(showAlert) showAlert('Límite de turnos alcanzado. Abrí una nueva cotización.', 'error');
      return;
    }

    setIsLoading(true);

    // Subida de imágenes a Supabase Storage
    let urlsSubidas = [];
    if (imagenesAdjuntas.length > 0) {
      const uploadPromises = imagenesAdjuntas.map(async (file) => {
        const nombreArchivo = `${Date.now()}_${Math.random().toString(36).substring(7)}_${file.name}`;
        const { error } = await supabase.storage.from('cotizaciones_files').upload(nombreArchivo, file);
        if (!error) {
          return supabase.storage.from('cotizaciones_files').getPublicUrl(nombreArchivo).data.publicUrl;
        }
        return null;
      });
      const resultados = await Promise.all(uploadPromises);
      urlsSubidas = resultados.filter(Boolean);
    }

    const textoGuardar = inputTexto.trim();
    const stringImagenes = urlsSubidas.length > 0 ? JSON.stringify(urlsSubidas) : null;

    const msjUsuario = {
      chat_id: idChat,
      role: 'user',
      content: textoGuardar,
      image_url: stringImagenes
    };

    // Limpieza de inputs
    setInputTexto('');
    setImagenesAdjuntas([]);
    setImagenesPrevias([]);
    if (textareaRef.current) textareaRef.current.style.height = '42px';

    // Insertar mensaje del usuario en pantalla
    const { data: dbMsgUser } = await supabase.from('messages').insert([msjUsuario]).select();
    if (dbMsgUser) setMensajes(prev => [...prev, dbMsgUser[0]]);

    // Título inteligente
    if (mensajes.length === 0) {
      const tituloGenerado = (textoGuardar || 'Cotización').slice(0, 26) + '...';
      await supabase.from('chats').update({ title: tituloGenerado }).eq('id', idChat);
      setChats(prev => prev.map(c => c.id === idChat ? { ...c, title: tituloGenerado } : c));
    }

    // ⏱️ RELOJ DE SEGURIDAD CON AVISO DE ERROR AL VENDEDOR
    const timeoutError = setTimeout(() => {
      setIsLoading(false);
      const msjFallo = {
        id: Date.now(),
        role: 'assistant',
        content: '⚠️ **Demora en el servidor:** La consulta a Google Flights o a los manuales tardó más de lo esperado. Por favor, volvé a enviar el mensaje o adjuntá la captura de pantalla para agilizar.'
      };
      setMensajes(prev => [...prev, msjFallo]);
    }, 75000); // 75 segundos de margen seguro

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
          images: urlsSubidas
        })
      });
    } catch (error) {
      clearTimeout(timeoutError);
      console.error("Error webhook:", error);
      setIsLoading(false);
      setMensajes(prev => [...prev, {
        id: Date.now(),
        role: 'assistant',
        content: '❌ **Error de conexión:** No pudimos contactar al Director Comercial. Revisá tu conexión a internet.'
      }]);
    }
  };

  // Helper para dibujar una o múltiples fotos en el historial
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
            style={{ maxHeight: '180px', maxWidth: '100%', borderRadius: '8px', border: '1px solid #d1d5db', objectFit: 'contain' }} 
          />
        ))}
      </div>
    );
  };

  const esLimiteAlcanzado = mensajes.length >= MAX_TURNOS;

  return (
    <div className="chat-ia-wrapper">
      
      {/* Overlay mobile */}
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
              <button onClick={(e) => archivarChat(e, chat.id)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1rem', padding: '4px' }} title="Eliminar Chat">
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

          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
              <div style={{ background: '#fff', padding: '14px 20px', borderRadius: '0px 16px 16px 16px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '12px', color: '#11173d', fontSize: '0.9rem', fontWeight: 600, boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                <span className="spinner-ia">✈️</span> 
                <div>
                  <span>El Director Comercial está auditando tu paquete...</span>
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
              
              {/* Previsualización de MÚLTIPLES fotos */}
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

                {/* Textarea auto-ajustable de 1 a 5 renglones */}
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