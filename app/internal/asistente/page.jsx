'use client';
import { useState, useRef, useEffect } from 'react';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { useAlert } from '@/contexts/AlertContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '@/lib/supabase'; // Tu conexión a Supabase

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
  const [imagenAdjunta, setImagenAdjunta] = useState(null); // Archivo crudo
  const [imagenPrevia, setImagenPrevia] = useState(null); // Para mostrar
  const [isLoading, setIsLoading] = useState(false);

  // Auto-scroll
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [mensajes, isLoading]);

  // 1. CARGAR CHATS
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

  // 2. CARGAR MENSAJES Y SUSCRIBIRSE A REALTIME 🚀
  useEffect(() => {
    if (!chatActivoId) return;

    // A) Traer el historial previo
    const fetchMensajes = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatActivoId)
        .order('created_at', { ascending: true });
      
      setMensajes(data || []);
    };
    fetchMensajes();

    // B) LA MAGIA: Suscribirse a nuevos mensajes de la IA
    const channel = supabase
      .channel('chat_realtime')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatActivoId}` }, 
        (payload) => {
          const nuevoMensaje = payload.new;
          // Si el mensaje nuevo es de la IA, lo sumamos a la pantalla y apagamos el cargando
          if (nuevoMensaje.role === 'assistant') {
            setMensajes(prev => [...prev, nuevoMensaje]);
            setIsLoading(false);
          }
        }
      )
      .subscribe();

    // Limpiar suscripción al cambiar de chat
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

  // --- EL FLUJO PROPUESTO (REACT -> SUPABASE -> N8N) ---
  const enviarMensaje = async () => {
    if (!inputTexto.trim() && !imagenAdjunta) return;
    if (mensajes.length >= MAX_TURNOS) {
       if(showAlert) showAlert('Contexto máximo alcanzado. Iniciá una nueva cotización.', 'error');
       return;
    }

    setIsLoading(true);
    let urlImagenSubida = null;

    // 1. Subir imagen al Bucket si existe (Opcional)
    if (imagenAdjunta) {
      const nombreArchivo = `${Date.now()}_${imagenAdjunta.name}`;
      const { data: uploadData, error } = await supabase.storage
        .from('cotizaciones_files') // <-- Asegurate de crear este bucket en Supabase
        .upload(nombreArchivo, imagenAdjunta);
      
      if (!error) {
        urlImagenSubida = supabase.storage.from('cotizaciones_files').getPublicUrl(nombreArchivo).data.publicUrl;
      }
    }

    // 2. Guardar mensaje del usuario en la tabla 'messages'
    const msjUsuario = {
      chat_id: chatActivoId,
      role: 'user',
      content: inputTexto,
      image_url: urlImagenSubida
    };

    const { data: dbMsgUser } = await supabase.from('messages').insert([msjUsuario]).select();
    
    // Mostramos nuestro propio mensaje en pantalla inmediatamente
    if (dbMsgUser) setMensajes(prev => [...prev, dbMsgUser[0]]);
    
    setInputTexto('');
    setImagenAdjunta(null);
    setImagenPrevia(null);

    // 3. Disparar el Webhook de n8n (Solo pasamos el ID)
    try {
      const WEBHOOK_N8N_URL = 'https://TU-N8N.com/webhook/cotizador-ia'; 
      // Hacemos fetch pero NO le ponemos 'await' a la respuesta del JSON, 
      // porque n8n solo debe devolver un 200 OK de recibido rápido, y luego procesar por atrás.
      fetch(WEBHOOK_N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatActivoId })
      });
      // El estado 'isLoading' queda en TRUE. 
      // Se va a apagar solo cuando el useEffect de Realtime reciba la respuesta de n8n.
    } catch (error) {
      console.error("Error webhook:", error);
      setIsLoading(false);
    }
  };

  const esLimiteAlcanzado = mensajes.length >= MAX_TURNOS;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 100px)', background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.03)' }}>
      
      {/* SIDEBAR */}
      <div style={{ width: '280px', background: '#f9fafb', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px' }}>
          <button onClick={crearNuevoChat} style={{ width: '100%', padding: '12px', background: '#11173d', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: chats.length >= MAX_CHATS ? 'not-allowed' : 'pointer', opacity: chats.length >= MAX_CHATS ? 0.7 : 1 }}>
            ➕ Nueva Cotización
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 20px 10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {chats.map(chat => (
            <div key={chat.id} onClick={() => setChatActivoId(chat.id)} style={{ padding: '12px 15px', background: chatActivoId === chat.id ? '#e0f2fe' : 'transparent', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.9rem', color: chatActivoId === chat.id ? '#0369a1' : '#4b5563', fontWeight: chatActivoId === chat.id ? 'bold' : 'normal' }}>
                💬 {chat.title}
              </div>
              <button onClick={(e) => archivarChat(e, chat.id)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>🗑️</button>
            </div>
          ))}
        </div>
      </div>

      {/* ÁREA DE CHAT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        
        <div style={{ padding: '15px 25px', borderBottom: '1px solid #e5e7eb', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#11173d', fontWeight: 900 }}>Asistente de Cotizaciones AI</h2>
          <span style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 'bold', background: '#f3f4f6', padding: '4px 10px', borderRadius: '12px' }}>
            Turnos: {mensajes.length} / {MAX_TURNOS}
          </span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px', background: '#fcfcfc' }}>
          
          {mensajes.length === 0 && !isLoading && (
            <div style={{ textAlign: 'center', color: '#9ca3af', marginTop: '50px' }}>
              <h3>¡Hola! Soy tu asistente.</h3>
              <p>Mandame la cotización y la analizo con las reglas de nuestros manuales.</p>
            </div>
          )}

          {mensajes.map((msg) => {
            const isAI = msg.role === 'assistant';
            return (
              <div key={msg.id} style={{ display: 'flex', justifyContent: isAI ? 'flex-start' : 'flex-end', width: '100%' }}>
                <div style={{ maxWidth: '75%', background: isAI ? '#fff' : '#11173d', color: isAI ? '#11173d' : '#fff', padding: '15px 20px', borderRadius: isAI ? '0px 16px 16px 16px' : '16px 0px 16px 16px', border: isAI ? '1px solid #e5e7eb' : 'none', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', fontSize: '0.95rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: isAI ? '#ef5a1a' : '#9ca3af', marginBottom: '8px' }}>
                    {isAI ? '🤖 Asistente Feliz Viaje' : '👤 Tú'}
                  </div>
                  {msg.image_url && (
                     // eslint-disable-next-line @next/next/no-img-element
                    <img src={msg.image_url} alt="Adjunto" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', marginBottom: '10px' }} />
                  )}
                  <div className="markdown-body" style={{ color: 'inherit' }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ background: '#fff', padding: '15px 20px', borderRadius: '0px 16px 16px 16px', border: '1px solid #e5e7eb', color: '#6b7280', fontSize: '0.9rem', fontWeight: 'bold' }}>
                <span className="spinner-ia">🤖</span> Analizando base de conocimientos...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ÁREA DE INPUT */}
        <div style={{ padding: '20px', background: '#fff', borderTop: '1px solid #e5e7eb' }}>
          {esLimiteAlcanzado ? (
            <div style={{ textAlign: 'center', padding: '15px', background: '#fee2e2', color: '#dc2626', borderRadius: '12px', fontWeight: 'bold' }}>
              🛑 Contexto máximo alcanzado. Iniciá una nueva cotización.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#f9fafb', padding: '15px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
              
              {imagenPrevia && (
                <div style={{ position: 'relative', width: 'max-content' }}>
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagenPrevia} alt="Previa" style={{ height: '60px', borderRadius: '8px' }} />
                  <button onClick={() => {setImagenAdjunta(null); setImagenPrevia(null)}} style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>✕</button>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <label style={{ cursor: isLoading ? 'not-allowed' : 'pointer', background: '#e5e7eb', padding: '12px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  📎
                  <input type="file" accept="image/*" onChange={handleImagenUpload} style={{ display: 'none' }} disabled={isLoading} />
                </label>

                <textarea 
                  placeholder="Escribí o pegá tu cotización acá..."
                  value={inputTexto}
                  onChange={(e) => setInputTexto(e.target.value)}
                  disabled={isLoading}
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '0.95rem', resize: 'none', outline: 'none' }}
                  rows="2"
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensaje(); } }}
                />

                <button 
                  onClick={enviarMensaje}
                  disabled={isLoading || (!inputTexto.trim() && !imagenAdjunta)}
                  style={{ background: '#ef5a1a', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '12px', fontWeight: 'bold', cursor: (isLoading || (!inputTexto.trim() && !imagenAdjunta)) ? 'not-allowed' : 'pointer' }}
                >
                  {isLoading ? '⏳' : 'Enviar 🚀'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Estilos para el Markdown */}
      <style dangerouslySetInnerHTML={{__html: `
        .markdown-body table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .markdown-body th, .markdown-body td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
        .markdown-body th { background: #f3f4f6; color: #11173d; font-weight: bold; }
        .spinner-ia { display: inline-block; animation: latir 1.5s infinite; }
        @keyframes latir { 0% { transform: scale(1); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
      `}} />
    </div>
  );
}