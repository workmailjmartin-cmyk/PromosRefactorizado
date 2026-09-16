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
  
  // NUEVO: Estado para abrir/cerrar el menú en celulares
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
      setSidebarAbierta(false); // Cierra el sidebar en mobile al crear uno nuevo
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
    // ACHICAMOS EL ALTO PARA QUE NO CHOCARA CON TU FOOTER DE JUAN PABLO MARTIN
    <div className="relative flex w-full bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm" style={{ height: 'calc(100vh - 120px)' }}>
      
      {/* 📱 FONDO OSCURO PARA MOBILE (Cierra el menú al tocar afuera) */}
      {sidebarAbierta && (
        <div 
          className="absolute inset-0 bg-black/50 z-20 md:hidden" 
          onClick={() => setSidebarAbierta(false)} 
        />
      )}

      {/* ================= SIDEBAR (RESPONSIVE) ================= */}
      <div 
        className={`absolute md:relative z-30 h-full w-[280px] bg-gray-50 border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out ${
          sidebarAbierta ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-5 flex justify-between items-center">
          <button 
            onClick={crearNuevoChat} 
            className="flex-1 bg-[#11173d] text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-[#1a235c] transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={chats.length >= MAX_CHATS}
          >
            ➕ Nueva Cotización
          </button>
          
          {/* Botón de cerrar solo en mobile */}
          <button onClick={() => setSidebarAbierta(false)} className="md:hidden ml-3 text-xl p-2 text-gray-500">
            ✖
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-5 flex flex-col gap-2">
          {chats.map(chat => (
            <div 
              key={chat.id} 
              onClick={() => { setChatActivoId(chat.id); setSidebarAbierta(false); }} 
              className={`p-3 rounded-xl cursor-pointer flex justify-between items-center transition-all ${
                chatActivoId === chat.id ? 'bg-[#e0f2fe] border border-[#bae6fd]' : 'bg-transparent border border-transparent hover:bg-gray-100'
              }`}
            >
              <div className={`overflow-hidden text-ellipsis whitespace-nowrap text-sm ${chatActivoId === chat.id ? 'text-[#0369a1] font-bold' : 'text-gray-600'}`}>
                💬 {chat.title}
              </div>
              <button onClick={(e) => archivarChat(e, chat.id)} className="bg-transparent border-none text-gray-400 hover:text-red-500 cursor-pointer">
                🗑️
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ================= ÁREA DE CHAT ================= */}
      <div className="flex-1 flex flex-col relative min-w-0 h-full">
        
        <div className="px-5 py-4 border-b border-gray-200 bg-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* BOTÓN HAMBURGUESA SOLO EN MOBILE */}
            <button onClick={() => setSidebarAbierta(true)} className="md:hidden text-2xl text-[#11173d] focus:outline-none">
              ☰
            </button>
            <h2 className="m-0 text-lg md:text-xl text-[#11173d] font-black truncate">Asistente de Cotizaciones AI</h2>
          </div>
          
          <span className="text-xs md:text-sm text-gray-500 font-bold bg-gray-100 px-3 py-1 rounded-full whitespace-nowrap">
            Turnos: {mensajes.length} / {MAX_TURNOS}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-5 bg-[#fcfcfc]">
          {mensajes.length === 0 && !isLoading && (
            <div className="text-center text-gray-400 mt-10">
              <h3 className="text-xl font-bold text-gray-500 mb-2">¡Hola! Soy tu asistente.</h3>
              <p>Mandame la cotización y la analizo con las reglas de nuestros manuales.</p>
            </div>
          )}

          {mensajes.map((msg) => {
            const isAI = msg.role === 'assistant';
            return (
              <div key={msg.id} className={`flex w-full ${isAI ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[90%] md:max-w-[75%] p-4 text-sm md:text-base shadow-sm ${
                  isAI 
                    ? 'bg-white text-[#11173d] rounded-r-2xl rounded-bl-2xl border border-gray-200' 
                    : 'bg-[#11173d] text-white rounded-l-2xl rounded-br-2xl'
                }`}>
                  <div className={`text-xs font-bold mb-2 ${isAI ? 'text-[#ef5a1a]' : 'text-gray-400'}`}>
                    {isAI ? '🤖 Asistente Feliz Viaje' : '👤 Tú'}
                  </div>
                  {msg.image_url && (
                     // eslint-disable-next-line @next/next/no-img-element
                    <img src={msg.image_url} alt="Adjunto" className="max-w-full max-h-[200px] rounded-lg mb-3" />
                  )}
                  <div className="markdown-body text-inherit leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex justify-start w-full">
              <div className="bg-white p-4 rounded-r-2xl rounded-bl-2xl border border-gray-200 text-gray-500 text-sm font-bold flex items-center gap-2 shadow-sm">
                <span className="spinner-ia text-lg">🤖</span> Analizando base de conocimientos...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ================= ÁREA DE INPUT (AHORA CON MENOS ESPACIO ABAJO) ================= */}
        <div className="p-3 md:p-4 bg-white border-t border-gray-200">
          {esLimiteAlcanzado ? (
            <div className="text-center p-3 bg-red-100 text-red-600 rounded-xl font-bold text-sm">
              🛑 Contexto máximo alcanzado. Iniciá una nueva cotización.
            </div>
          ) : (
            <div className="flex flex-col gap-2 bg-gray-50 p-2 md:p-3 rounded-2xl border border-gray-200">
              
              {imagenPrevia && (
                <div className="relative w-max mb-1">
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagenPrevia} alt="Previa" className="h-[50px] rounded-lg" />
                  <button 
                    onClick={() => {setImagenAdjunta(null); setImagenPrevia(null)}} 
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center cursor-pointer text-[10px] font-bold shadow-md"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="flex gap-2 items-end">
                <label className={`cursor-pointer bg-gray-200 p-3 rounded-full flex items-center justify-center transition-colors hover:bg-gray-300 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  📎
                  <input type="file" accept="image/*" onChange={handleImagenUpload} className="hidden" disabled={isLoading} />
                </label>

                <textarea 
                  placeholder="Pegá tu cotización acá..."
                  value={inputTexto}
                  onChange={(e) => setInputTexto(e.target.value)}
                  disabled={isLoading}
                  className="flex-1 p-3 rounded-xl border border-gray-300 text-sm md:text-base resize-none outline-none focus:border-[#0369a1] bg-white min-h-[50px] max-h-[120px]"
                  rows="2"
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensaje(); } }}
                />

                <button 
                  onClick={enviarMensaje}
                  disabled={isLoading || (!inputTexto.trim() && !imagenAdjunta)}
                  className={`bg-[#ef5a1a] text-white border-none py-3 px-4 md:px-5 rounded-xl font-bold flex items-center gap-2 transition-transform ${
                    (isLoading || (!inputTexto.trim() && !imagenAdjunta)) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'
                  }`}
                >
                  <span className="hidden md:inline">{isLoading ? 'Procesando...' : 'Enviar'}</span>
                  {isLoading ? '⏳' : '🚀'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Estilos Globales para la IA */}
      <style dangerouslySetInnerHTML={{__html: `
        .markdown-body table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 10px; }
        .markdown-body th, .markdown-body td { border: 1px solid #d1d5db; padding: 10px; text-align: left; font-size: 0.9em; }
        .markdown-body th { background: #f3f4f6; color: #11173d; font-weight: 900; }
        .markdown-body strong { font-weight: 900; color: inherit; }
        .markdown-body ul { padding-left: 20px; list-style-type: disc; margin-bottom: 10px; }
        .spinner-ia { display: inline-block; animation: latir 1s infinite alternate; }
        @keyframes latir { 0% { transform: scale(0.9); } 100% { transform: scale(1.2); } }
      `}} />
    </div>
  );
}