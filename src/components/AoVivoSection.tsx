import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Tv, MessageSquare, Send, Users, Heart, Trash2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, orderBy, doc, setDoc } from 'firebase/firestore';
import { User } from '../types';

interface AoVivoSectionProps {
  userLogged: boolean;
  userName: string;
  onShowAlert: (msg: string) => void;
  userCategory?: string;
  transmissions?: any[];
  dbUsers?: User[];
}

const isAuthorizedLeader = (categoryStr?: string) => {
  if (!categoryStr) return false;
  const lower = categoryStr.toLowerCase();
  return lower.includes('admin') || lower.includes('pastor') || lower.includes('presb') || lower.includes('presbítero');
};

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  avatar: string;
  transmissionId?: string;
  timestamp?: number;
}

const INITIAL_CHAT: ChatMessage[] = [];

export default function AoVivoSection({ userLogged, userName, onShowAlert, userCategory, transmissions: propTransmissions, dbUsers }: AoVivoSectionProps) {
  const [isPlaying, setIsPlaying] = useState(() => {
    return localStorage.getItem('pref_play_live_autoplay') === 'true';
  });
  const [chatList, setChatList] = useState<ChatMessage[]>([]);
  const [newComment, setNewComment] = useState('');
  const [viewerCount, setViewerCount] = useState(42);
  const [loved, setLoved] = useState(false);
  const [allTransmissions, setAllTransmissions] = useState<any[]>([]);

  const [liveConfig, setLiveConfig] = useState<any>(() => {
    const raw = localStorage.getItem('church_youtube_live');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {}
    }
    return {
      id: 'trans-default',
      youtubeUrl: 'https://www.youtube.com/embed/5qap5aO4i9A',
      title: 'Série Expositiva: Epístola de Filipenses',
      subtitle: 'Sermão: "Alegria nas Tribulações" • Rev. Roberto Silva',
      isLive: true,
      viewerCount: 42,
      isPublic: true
    };
  });

  const isLeader = isAuthorizedLeader(userCategory);
  const isPublicTransmission = liveConfig.isPublic !== false;

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Filter messages to only render comments from registered database members (removes mock/fake and bots)
  const filteredChatList = chatList.filter((msg) => {
    const list = dbUsers || [];
    if (list.length === 0) return true; // fallback to showing everything temporarily if loading, but typically loads instantly
    const senderName = msg.sender?.toLowerCase().trim();
    return list.some(u => u.name?.toLowerCase().trim() === senderName);
  });

  // Get real-time photo of a registered member if available
  const getSenderAvatar = (senderName: string, defaultAvatar: string) => {
    const list = dbUsers || [];
    const matched = list.find(u => u.name?.toLowerCase().trim() === senderName.toLowerCase().trim());
    return matched?.avatarUrl || defaultAvatar;
  };

  // Sync propTransmissions instantly with allTransmissions state
  useEffect(() => {
    if (propTransmissions && propTransmissions.length > 0) {
      setAllTransmissions(propTransmissions);
      
      // Auto-set matching active transmission details if they were updated in admin
      const currentId = liveConfig.id;
      const matching = propTransmissions.find(t => t.id === currentId);
      if (matching) {
        setLiveConfig(matching);
        if (matching.viewerCount !== undefined) {
          setViewerCount(Number(matching.viewerCount));
        }
      }
    }
  }, [propTransmissions]);

  // Sync local storage active state on startup to prevent flickering
  useEffect(() => {
    const raw = localStorage.getItem('church_youtube_live');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setLiveConfig(parsed);
        if (parsed.viewerCount !== undefined) {
          setViewerCount(Number(parsed.viewerCount));
        }
      } catch (e) {}
    }
  }, []);

  // Listen to Firestore real-time chats specific to the selected transmissionId
  useEffect(() => {
    const activeTransId = liveConfig.id || 'trans-default';
    const q = query(
      collection(db, 'transmissionChats'),
      where('transmissionId', '==', activeTransId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        // Display beautiful INITIAL_CHAT mapped for this transmission as friendly fallbacks
        setChatList(INITIAL_CHAT.map(msg => ({ ...msg, transmissionId: activeTransId })));
      } else {
        const list: ChatMessage[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as ChatMessage);
        });
        setChatList(list);
      }
    }, (error) => {
      console.warn("Error loading dynamic chat for", activeTransId, error);
    });

    return () => unsubscribe();
  }, [liveConfig.id]);

  // Handle automatic scrolling to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatList]);

  // Add realistic periodic virtual viewer increase
  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount(v => v + Math.floor(Math.random() * 2) - (Math.random() > 0.6 ? 1 : 0));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (!userLogged) {
      onShowAlert("Por favor, faça login ou acesse seu painel para interagir com o Chat ao Vivo.");
      return;
    }

    const date = new Date();
    const minsStr = String(date.getMinutes()).padStart(2, '0');
    const hoursStr = String(date.getHours()).padStart(2, '0');

    const activeTransId = liveConfig.id || 'trans-default';
    const docId = `ch-user-${Date.now()}`;
    const chatMsg: ChatMessage = {
      id: docId,
      transmissionId: activeTransId,
      sender: userName,
      text: newComment.trim(),
      time: `${hoursStr}:${minsStr}`,
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCAw9f0m9zhnseECjh851sbC_y6zLT72KxZLFVCXdRwDIWH1CC-47FIiUxUXqTuB95Spni3XDvS7u1c-glbKjtQ2aiQke9uLjXjx-PV80NSNENNsu_daFFwxaV4mbyOOaA9-ScMxItwTnqLmvpGA-Dd2xJWBIz5zJZspCQG6fQDPZ6kwo3E_MeyjhrwVP4B2tYvr6V3HBeiGN899eENqjHE6bBz6N_K14zK1XoogBk6NAT1WsQyx2fJXpIuYiRJK92dLfb6Zkrbf9c',
      timestamp: Date.now()
    };

    try {
      await setDoc(doc(db, 'transmissionChats', docId), chatMsg);
      setNewComment('');
    } catch (err) {
      console.error("Error committing comment to Firestore:", err);
      onShowAlert("Erro ao publicar comentário.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-5xl mx-auto">
      {/* Title block */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Tv className="w-5 h-5 text-[#ba1a1a]" />
          <h1 className="font-display font-extrabold text-3xl text-[#001939] tracking-tight">Transmissão</h1>
        </div>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider ml-1">Cultos Online e Repetições</p>
      </div>

      {/* Unified Live Broadcast with Chat layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Left column: Player and stream HUD detail */}
        <div className="lg:col-span-2 flex flex-col space-y-4">
          <section className="relative overflow-hidden rounded-3xl bg-black shadow-lg aspect-video w-full">
            <div className="w-full h-full relative group bg-neutral-950">
              {!isPublicTransmission && !isLeader ? (
                <div className="absolute inset-0 bg-[#0c1017] flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="w-14 h-14 bg-red-950/40 text-red-500 rounded-full flex items-center justify-center border border-red-950 shadow-md">
                    <span className="text-2xl font-black">🔒</span>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-white font-extrabold text-sm uppercase tracking-wider">Transmissão Privada</h4>
                    <p className="text-[10px] text-slate-400 max-w-sm leading-relaxed">
                      Esta transmissão é privada e restrita para a liderança com cargo eclesiástico (Admin, Pastor e Presbíteros).
                    </p>
                  </div>
                </div>
              ) : (
                isPlaying ? (
                  liveConfig.youtubeUrl ? (
                    <div className="absolute inset-0 w-full h-full bg-black">
                      <iframe
                        title="YouTube Live"
                        className="w-full h-full border-none"
                        src={`${liveConfig.youtubeUrl}${liveConfig.youtubeUrl.includes('?') ? '&' : '?'}autoplay=1&mute=0`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      ></iframe>
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-black flex flex-col items-center justify-center text-white space-y-4">
                      <div className="flex items-end gap-1.5 h-12">
                        <div className="w-1.5 bg-[#a9c7ff] rounded-t animate-[bounce_1s_infinite_100ms]" style={{ height: '80%' }} />
                        <div className="w-1.5 bg-[#a9c7ff] rounded-t animate-[bounce_1s_infinite_400ms]" style={{ height: '40%' }} />
                        <div className="w-1.5 bg-[#a9c7ff] rounded-t animate-[bounce_1s_infinite_200ms]" style={{ height: '90%' }} />
                        <div className="w-1.5 bg-[#a9c7ff] rounded-t animate-[bounce_1s_infinite_600ms]" style={{ height: '60%' }} />
                      </div>
                      <p className="text-xs tracking-widest font-black uppercase text-slate-400">
                        Sintonizando áudio em tempo real...
                      </p>
                      
                      <button 
                        onClick={() => setIsPlaying(false)}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                      >
                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                          <Pause className="w-8 h-8 text-white fill-white" />
                        </div>
                      </button>
                    </div>
                  )
                ) : (
                  <>
                    <img 
                      className="w-full h-full object-cover brightness-50" 
                      alt="Chapel internal temple" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuC4Hzlm92FmyUKryjvIHDjHBlJ6ddjutbEL0-cm1wDnLScOlWHTLJ4080eCexJQ1bS2dJ_pESocYL3p6-dmqx7f4G8xkq1fgu0-7FjNcYXvkbOv5IdC9w-Xr2Eg7Fco0qPv_wbPXInibTUseWiPWyYBwqwJLxntiZRP6JVqsWLoAOKwD46RgvUBjaQGdyDqE_YyU7jSLBGjIDBmCmszW1iQd7g2nHw42fQMTVthiqbJlZAzuuwloc9d_-NovApM8XA6Wl0tc8DofwM" 
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button 
                        onClick={() => {
                          setIsPlaying(true);
                          onShowAlert("Sintonizado canal! Use fones de ouvido para melhor qualidade.");
                        }}
                        className="w-16 h-16 rounded-full bg-white text-primary flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                      >
                        <Play className="w-8 h-8 ml-1 text-[#001939] fill-[#001939]" />
                      </button>
                    </div>
                  </>
                )
              )}

              {/* HUD metrics positioning */}
              <div className="absolute top-4 left-4 flex gap-1.5 items-center select-none z-10">
                <div className={`text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1.5 uppercase ${liveConfig.isLive ? 'bg-[#ba1a1a]' : 'bg-slate-600'}`}>
                  {liveConfig.isLive && <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                  <span>{liveConfig.isLive ? 'Ao Vivo' : 'Gravado'}</span>
                </div>
                {!isPublicTransmission && (
                  <div className="bg-amber-600 border border-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase flex items-center gap-1">
                    <span>🔒 Resguardada (Liderança)</span>
                  </div>
                )}
              </div>

              <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-white flex items-center gap-1.5 z-10">
                <Users className="w-3.5 h-3.5 text-slate-300" />
                <span>{viewerCount} Assistindo</span>
              </div>
            </div>
          </section>

          {/* Broadcast info metadata card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex justify-between items-center select-none">
            <div className="pr-2">
              <h4 className="font-extrabold text-[#001939] text-base leading-snug">
                {liveConfig.title}
              </h4>
              <p className="text-[11px] text-slate-500 font-semibold mt-1">
                {liveConfig.subtitle} {liveConfig.date && `• ${new Date(liveConfig.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`}
              </p>
              {liveConfig.tags && liveConfig.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2.5">
                  {liveConfig.tags.map((tg: string, idx: number) => (
                    <span key={idx} className="px-1.5 py-0.5 bg-amber-50 border border-amber-100 text-amber-700 rounded text-[8px] font-black uppercase tracking-wider">
                      🏷️ {tg}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button 
              onClick={() => {
                setLoved(!loved);
                onShowAlert(loved ? "Removido amei" : "Enviado coração de louvor!");
              }}
              className={`p-2.5 rounded-full transition-all cursor-pointer shrink-0 ${
                loved ? 'bg-rose-600 text-white shadow' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
              }`}
            >
              <Heart className={`w-4.5 h-4.5 ${loved ? 'fill-white' : ''}`} />
            </button>
          </div>
        </div>

        {/* Right column: Dynamic Live Transmission Chat */}
        <div className="lg:col-span-1">
          <section className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col h-[400px] lg:h-full min-h-[400px]">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-3 select-none">
              <MessageSquare className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-black text-[#001939] uppercase tracking-wider">Chat da Transmissão Teste</h3>
            </div>

            {/* Comments stream list container */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto space-y-3.5 pr-1 scroll-smooth"
            >
              {filteredChatList.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 select-none">
                  <MessageSquare className="w-8 h-8 text-slate-350 animate-pulse" />
                  <p className="text-xs font-bold text-slate-400">Nenhum comentário enviado ainda.</p>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">Participe enviando a primeira mensagem no chat de membros!</p>
                </div>
              ) : (
                filteredChatList.map((msg) => (
                  <div key={msg.id} className="flex gap-2.5 items-start animate-fade-in">
                    <img 
                      src={getSenderAvatar(msg.sender, msg.avatar)} 
                      alt={msg.sender} 
                      className="w-7 h-7 rounded-full object-cover mt-0.5 border border-slate-100 shrink-0" 
                    />
                    <div className="bg-[#f3f4f5] p-2.5 rounded-2xl max-w-[85%]">
                      <div className="flex items-center justify-between gap-3 mb-0.5">
                        <span className="text-[10px] font-extrabold text-[#001939] truncate max-w-[90px]">{msg.sender}</span>
                        <span className="text-[8px] text-slate-400 font-bold shrink-0">{msg.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-700 leading-normal font-medium">{msg.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input Text Form */}
            <form onSubmit={handleSendComment} className="mt-3.5 pt-3 border-t border-slate-100 flex gap-2">
              <input 
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 bg-[#f3f4f5] border-none rounded-full px-4 py-2.5 text-xs text-[#191c1d] focus:ring-1 focus:ring-primary h-9 outline-none placeholder:text-slate-400"
                placeholder={userLogged ? "Envie uma mensagem..." : "Faça login para comentar..."}
                disabled={!userLogged}
              />
              <button 
                type="submit"
                disabled={!userLogged || !newComment.trim()}
                className="w-9 h-9 bg-primary disabled:opacity-40 text-white rounded-full flex items-center justify-center cursor-pointer shrink-0 transition-opacity"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </section>
        </div>
      </div>

      {/* History and Other Transmissions section */}
      {allTransmissions.length > 0 && (
         <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
           <h3 className="text-xs font-black text-[#001939] uppercase tracking-wider mb-4">Escolha a Transmissão e Interaja</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {allTransmissions.map((t) => (
                 <div
                   key={t.id}
                   className={`w-full text-left p-5 border rounded-3xl shadow-sm transition-all group cursor-pointer ${
                     liveConfig.id === t.id 
                       ? 'bg-blue-50/40 border-primary shadow-sm' 
                       : 'bg-white border-slate-200 hover:border-slate-300'
                   }`}
                   onClick={() => {
                     setLiveConfig(t);
                     localStorage.setItem('church_youtube_live', JSON.stringify(t));
                     window.scrollTo({ top: 0, behavior: 'smooth' });
                     onShowAlert(`Transmitindo agora: ${t.title}`);
                   }}
                 >
                   <div className="flex items-center gap-2 mb-2 select-none">
                     <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg">
                       {t.isLive ? 'AO VIVO' : 'GRAVADO'}
                     </span>
                     <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 border rounded-lg ${t.isPublic ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'} `}>
                        {t.isPublic ? 'PÚBLICO' : 'PRIVADO'}
                     </span>
                     <span className="text-[10px] font-semibold text-slate-400">
                       {t.viewerCount || 0} assistindo
                     </span>
                   </div>
                   
                   <h4 className="text-sm font-black text-[#191c1d] leading-tight mb-1 group-hover:text-primary transition-colors">{t.title}</h4>
                   <p className="text-[11px] text-slate-500 font-medium">{t.subtitle} {t.date && `• ${new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`}</p>
                   
                   {t.tags && t.tags.length > 0 && (
                     <div className="flex flex-wrap gap-1 mt-3">
                       {t.tags.map((tg: string, idx: number) => (
                         <span key={idx} className="flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded text-[9px] font-black uppercase tracking-wider">
                           🏷️ {tg}
                         </span>
                       ))}
                     </div>
                   )}
                 </div>
             ))}
           </div>
         </section>
      )}
    </div>
  );
}
