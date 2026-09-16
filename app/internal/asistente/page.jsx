'use client';
import { useState, useRef, useEffect } from 'react';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { useAlert } from '@/contexts/AlertContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '@/lib/supabase';

const MAX_CHATS = 5;
const MAX_TURNOS = 6;

export default function AsistenteIA() {
  const { currentUser } = useStaffAuth();
  const { showAlert } = useAlert();
  const messagesEndRef = useRef(null);

  const [chats, setChats] = useState([]);
  const [chatActivoId, setChatActivoId] = useState(null);
  const [mensajes, setMensajes] = useState([]);

  const [inputTexto, setInputTexto] = useState('');
  const [imagenAdjunta, setImagenAdjunta] = useState(null); 
  const [imagenPrevia, setImagenPrevia] = useState(null); 
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado para abrir/cerrar el menú en celulares
  const [sidebarAbierta, setSidebarAbierta] = useState(false);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [mensajes, isLoading]);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const fetchChats = async () => {
      const { data } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', currentUser.uid)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setChats(data);
        setChatActivoId(data[0].id);
      } else {
        crearNuevoChat();
      }
    };
    fetchChats();
  }, [currentUser]);

  useEffect(() => {
    if (!chatActivoId) return;

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
      .channel('chat_realtime')
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

  const crearNuevoChat = async () => {
    if (chats.length >= MAX_CHATS) {
      if(showAlert) showAlert(`Límite alcanzado: Máximo ${MAX_CHATS} cotizaciones.`, 'error');
      return;
    }
    const { data } = await supabase
      .from('chats')
      .insert([{ user_id: currentUser.uid, title: 'Nueva Cotización' }])
      .select();

    if (data) {
      setChats([data[0], ...chats]);
      setChatActivoId(data[0].id);
      setMensajes([]);
      setSidebarAbierta(false);
    }
  };

  const archivarChat = async (e, id) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar esta cotización?')) return;
    
    await supabase.from('chats').update({ status: 'archived' }).eq('id', id);
    
    const restantes = chats.filter(c => c.id !== id);
    setChats(restantes);
    if (chatActivoId === id) setChatActivoId(restantes.length > 0 ? restantes[0].id : null);
  };

  const handleImagenUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagenAdjunta(file);
      const reader = new FileReader();
      reader.onload = (upload) => setImagenPrevia(upload.target.result);
      reader.readAsDataURL(file);
    }
  };

  const enviarMensaje = async () => {
    if (!inputTexto.trim() && !imagenAdjunta) return;
    if (mensajes.length >= MAX_TURNOS) {
       if(showAlert) showAlert('Contexto máximo alcanzado. Iniciá una nueva cotización.', 'error');
       return;
    }

    setIsLoading(true);
    let urlImagenSubida = null;

    if (imagenAdjunta) {
      const nombreArchivo = `${Date.now()}_${imagenAdjunta.name}`;
      const { data: uploadData, error } = await supabase.storage
        .from('cotizaciones_files')
        .upload(nombreArchivo, imagenAdjunta);
      
      if (!error) {
        urlImagenSubida = supabase.storage.from('cotizaciones_files').getPublicUrl(nombreArchivo).data.publicUrl;
      }
    }

    const msjUsuario = {
      chat_id: chatActivoId,
      role: 'user',
      content: inputTexto,
      image_url: urlImagenSubida
    };

    const { data: dbMsgUser } = await supabase.from('messages').insert([msjUsuario]).select();
    
    if (dbMsgUser) setMensajes(prev => [...prev, dbMsgUser[0]]);
    
    setInputTexto('');
    setImagenAdjunta(null);
    setImagenPrevia(null);

    try {
      const WEBHOOK_N8N_URL = 'https://TU-N8N.com/webhook/cotizador-ia'; 
      fetch(WEBHOOK_N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatActivoId })
      });
    } catch (error) {
      console.error("Error webhook:", error);
      setIsLoading(false);
    }
  };

  const esLimiteAlcanzado = mensajes.length >= MAX_TURNOS;

  return (
    <div className="chat-ia-wrapper">
      
      {/* Overlay oscuro para mobile */}
      {sidebarAbierta && (
        <div className="chat-mobile-overlay" onClick={() => setSidebarAbierta(false)}></div>
      )}

      {/* ================= SIDEBAR (HISTORIAL) ================= */}
      <div className={`chat-sidebar ${sidebarAbierta ? 'abierta' : ''}`}>
        <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            onClick={crearNuevoChat}
            disabled={chats.length >= MAX_CHATS}
            style={{ flex: 1, padding: '12px', background: '#11173d', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: chats.length >= MAX_CHATS ? 'not-allowed' : 'pointer', opacity: chats.length >= MAX_CHATS ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            ➕ Nueva Cotización
          </button>
          <button className="chat-btn-cerrar-mobile" onClick={() => setSidebarAbierta(false)}>✖</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 20px 10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {chats.map(chat => (
            <div 
              key={chat.id}
              onClick={() => { setChatActivoId(chat.id); setSidebarAbierta(false); }}
              style={{ padding: '12px 15px', background: chatActivoId === chat.id ? '#e0f2fe' : 'transparent', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: chatActivoId === chat.id ? '1px solid #bae6fd' : '1px solid transparent', transition: 'all 0.2s' }}
            >
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.9rem', color: chatActivoId === chat.id ? '#0369a1' : '#4b5563', fontWeight: chatActivoId === chat.id ? 'bold' : 'normal' }}>
                💬 {chat.title}
              </div>
              <button onClick={(e) => archivarChat(e, chat.id)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1.1rem' }} title="Eliminar Chat">
                🗑️
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ================= ÁREA PRINCIPAL (CHAT) ================= */}
      <div className="chat-main-area">
        
        {/* Cabecera del chat */}
        <div style={{ padding: '15px 20px', borderBottom: '1px solid #e5e7eb', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="chat-btn-menu-mobile" onClick={() => setSidebarAbierta(true)}>☰</button>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#11173d', fontWeight: 900 }}>Asistente de Cotizaciones AI</h2>
          </div>
          <span style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 'bold', background: '#f3f4f6', padding: '4px 10px', borderRadius: '12px' }}>
            Turnos: {mensajes.length} / {MAX_TURNOS}
          </span>
        </div>

        {/* Zona de Mensajes */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', background: '#fcfcfc' }}>
          
          {mensajes.length === 0 && !isLoading && (
            <div style={{ textAlign: 'center', color: '#9ca3af', marginTop: '40px' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#6b7280', marginBottom: '10px' }}>¡Hola! Soy tu asistente.</h3>
              <p style={{ fontSize: '0.95rem' }}>Mandame la cotización y la analizo con las reglas de nuestros manuales.</p>
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
                  padding: '15px 20px', 
                  borderRadius: isAI ? '0px 16px 16px 16px' : '16px 0px 16px 16px',
                  border: isAI ? '1px solid #e5e7eb' : 'none',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                  fontSize: '0.95rem',
                  lineHeight: '1.6'
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: isAI ? '#ef5a1a' : '#9ca3af', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {isAI ? '🤖 Asistente Feliz Viaje' : '👤 Tú'}
                  </div>
                  
                  {msg.image_url && (
                     // eslint-disable-next-line @next/next/no-img-element
                    <img src={msg.image_url} alt="Adjunto" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', marginBottom: '10px', border: '1px solid #374151' }} />
                  )}

                  <div className="markdown-body" style={{ color: 'inherit' }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
              <div style={{ background: '#fff', padding: '15px 20px', borderRadius: '0px 16px 16px 16px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '10px', color: '#6b7280', fontSize: '0.9rem', fontWeight: 'bold' }}>
                <span className="spinner-ia">🤖</span> Analizando manuales...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Zona de Input */}
        <div style={{ padding: '15px', background: '#fff', borderTop: '1px solid #e5e7eb' }}>
          {esLimiteAlcanzado ? (
            <div style={{ textAlign: 'center', padding: '12px', background: '#fee2e2', color: '#dc2626', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.9rem' }}>
              🛑 Contexto máximo alcanzado. Por favor, iniciá una nueva cotización.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#f9fafb', padding: '10px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
              
              {imagenPrevia && (
                <div style={{ position: 'relative', width: 'max-content' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagenPrevia} alt="Previa" style={{ height: '50px', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                  <button onClick={() => {setImagenAdjunta(null); setImagenPrevia(null)}} style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>✕</button>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                <label style={{ cursor: isLoading ? 'not-allowed' : 'pointer', background: '#e5e7eb', width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isLoading ? 0.5 : 1, transition: 'background 0.2s' }}>
                  📎
                  <input type="file" accept="image/*" onChange={handleImagenUpload} style={{ display: 'none' }} disabled={isLoading} />
                </label>

                <textarea 
                  placeholder="Pegá tu cotización acá..."
                  value={inputTexto}
                  onChange={(e) => setInputTexto(e.target.value)}
                  disabled={isLoading}
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '0.95rem', resize: 'none', outline: 'none', minHeight: '45px', maxHeight: '100px', fontFamily: 'inherit', background: '#fff' }}
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
                  disabled={isLoading || (!inputTexto.trim() && !imagenAdjunta)}
                  style={{ background: '#ef5a1a', color: '#fff', border: 'none', height: '45px', padding: '0 20px', borderRadius: '12px', fontWeight: 'bold', cursor: (isLoading || (!inputTexto.trim() && !imagenAdjunta)) ? 'not-allowed' : 'pointer', opacity: (isLoading || (!inputTexto.trim() && !imagenAdjunta)) ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '8px', transition: 'transform 0.2s' }}
                >
                  <span className="chat-btn-text">Enviar</span> 🚀
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 🔥 MAGIA CSS: Hace que sea responsive sin depender de Tailwind 🔥 */}
      <style dangerouslySetInnerHTML={{__html: `
        .chat-ia-wrapper { display: flex; height: calc(100vh - 120px); background: #fff; border-radius: 16px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.03); position: relative; font-family: system-ui, -apple-system, sans-serif; }
        .chat-sidebar { width: 280px; background: #f9fafb; border-right: 1px solid #e5e7eb; display: flex; flex-direction: column; transition: transform 0.3s ease; z-index: 30; }
        .chat-main-area { flex: 1; display: flex; flex-direction: column; min-width: 0; position: relative; z-index: 10; }
        .chat-btn-cerrar-mobile, .chat-btn-menu-mobile { display: none; background: none; border: none; cursor: pointer; font-size: 1.5rem; color: #11173d; }
        .chat-mobile-overlay { display: none; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 20; }
        
        .markdown-body table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        .markdown-body th, .markdown-body td { border: 1px solid #d1d5db; padding: 8px; text-align: left; font-size: 0.9em; }
        .markdown-body th { background: #f3f4f6; color: #11173d; font-weight: bold; }
        .markdown-body ul { padding-left: 20px; list-style-type: disc; margin-bottom: 10px; }
        .markdown-body strong { font-weight: 900; color: inherit; }
        .spinner-ia { display: inline-block; animation: latir 1s infinite alternate; }
        @keyframes latir { 0% { transform: scale(0.9); } 100% { transform: scale(1.2); } }

        /* REGLAS PARA CELULARES */
        @media (max-width: 768px) {
          .chat-sidebar { position: absolute; height: 100%; transform: translateX(-100%); }
          .chat-sidebar.abierta { transform: translateX(0); }
          .chat-btn-menu-mobile, .chat-btn-cerrar-mobile, .chat-mobile-overlay { display: block; }
          .chat-btn-text { display: none; } /* Oculta la palabra "Enviar" en celu, deja el cohete */
          .chat-main-area .markdown-body { font-size: 0.9rem; }
        }
      `}} />
    </div>
  );
}