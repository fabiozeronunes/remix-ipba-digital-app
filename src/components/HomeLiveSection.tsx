import { useState, useRef, useEffect } from 'react';
import { 
  ArrowRight, 
  HeartHandshake, 
  Coins, 
  BellRing, 
  CheckCircle, 
  Quote, 
  Radio,
  Play,
  Pause,
  Volume2,
  Headphones
} from 'lucide-react';
import { RadioProgram, ChurchEvent } from '../types';

interface HomeLiveSectionProps {
  onNavigate: (tab: string) => void;
  userLogged: boolean;
  onShowAlert: (msg: string) => void;
  radioPrograms?: RadioProgram[];
  transmissions?: any[];
  events?: ChurchEvent[];
}

const VERSES = [
  {
    text: "Elevo os meus olhos para os montes; de onde me virá o socorro? O meu socorro vem do Senhor, que fez os céus e a terra.",
    ref: "Salmos 121:1-2"
  },
  {
    text: "O Senhor é o meu pastor, nada me faltará. Deitar-me faz em verdes pastos, guia-me mansamente a águas tranquilas.",
    ref: "Salmos 23:1-2"
  },
  {
    text: "Não andeis ansiosos por coisa alguma; antes em tudo sejam os vossos pedidos conhecidos diante de Deus pela oração e súplica com ações de graças.",
    ref: "Filipenses 4:6"
  }
];

export default function HomeLiveSection({ 
  onNavigate, 
  userLogged, 
  onShowAlert, 
  radioPrograms = [],
  transmissions = [],
  events = []
}: HomeLiveSectionProps) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const muralEvents = events.filter(e => {
    if (!e.mural) return false;
    // Simple month mapping
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const eventMonthIndex = months.indexOf(e.month);
    if (eventMonthIndex === -1) return false;
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const nowMonth = now.getMonth();
    const nowDay = now.getDate();
    
    // Robustly determine the correct year for the event
    let eventYear = currentYear;
    if (eventMonthIndex < nowMonth && (nowMonth - eventMonthIndex) > 6) {
      eventYear = currentYear + 1;
    } else if (eventMonthIndex > nowMonth && (eventMonthIndex - nowMonth) > 6) {
      eventYear = currentYear - 1;
    }
    
    // Compare YYYYMMDD numerically so it is 100% immune to timezone and clock-drift issues!
    const nowVal = currentYear * 10000 + (nowMonth + 1) * 100 + nowDay;
    const eventVal = eventYear * 10000 + (eventMonthIndex + 1) * 100 + e.day;
    
    // Hide events strictly before today
    if (eventVal < nowVal) return false;
    
    // Limit to current month and next month (diff <= 1)
    const diff = (eventMonthIndex - nowMonth + 12) % 12;
    return diff <= 1;
  });
  
  const upcomingTransmissions = transmissions
    .filter(t => t.date && new Date(t.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
  const nextTransmission = upcomingTransmissions.length > 0 ? upcomingTransmissions[0] : null;

  const [reminderSet, setReminderSet] = useState(false);
  const [verseIndex, setVerseIndex] = useState(0);

  // Radio active player states
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(() => {
    return radioPrograms.length > 0 ? radioPrograms[0].id : null;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync state if radioPrograms changes and nothing is selected
  useEffect(() => {
    if (radioPrograms.length > 0 && !currentPlayingId) {
      setCurrentPlayingId(radioPrograms[0].id);
    }
  }, [radioPrograms, currentPlayingId]);

  const currentProgram = radioPrograms.find(p => p.id === currentPlayingId);

  const handleReminderToggle = () => {
    if (reminderSet) {
      setReminderSet(false);
      onShowAlert("Lembrete removido.");
    } else {
      setReminderSet(true);
      onShowAlert("Lembrete ativado! Enviaremos uma notificação minutos antes do culto.");
    }
  };

  const cycleVerse = () => {
    setVerseIndex((prev) => (prev + 1) % VERSES.length);
  };

  // Playing and pausing toggle
  const handlePlayToggle = (program: RadioProgram) => {
    if (currentPlayingId === program.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        if (audioRef.current) {
          audioRef.current.volume = volume;
          audioRef.current.play().then(() => {
            setIsPlaying(true);
          }).catch(() => {
            onShowAlert("Ops! Sem conexão à rádio de transmissão agora.");
            setIsPlaying(false);
          });
        }
      }
    } else {
      setCurrentPlayingId(program.id);
      setIsPlaying(true);
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.volume = volume;
          audioRef.current.play().then(() => {
            setIsPlaying(true);
          }).catch(() => {
            onShowAlert("Erro ao carregar sinal da Rádio.");
            setIsPlaying(false);
          });
        }
      }, 100);
    }
  };

  return (
    <div className="space-y-10 animate-fade-in relative">
      
      {/* 1 - Next Live Services Section at the TOP */}
      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest leading-none">
              Próximos Cultos
            </h3>
            <p className="text-xl font-extrabold text-primary tracking-tight mt-1">Ao Vivo em breve</p>
          </div>
          <button 
            onClick={() => onNavigate('aovivo')}
            className="text-xs font-bold text-primary-fixed-dim py-1.5 px-3.5 bg-primary rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
          >
            Ver tudo
          </button>
        </div>

        {/* Live Broadcast Feature Card */}
        {nextTransmission ? (
          <div 
            onClick={() => onNavigate('aovivo')}
            className="relative group cursor-pointer overflow-hidden rounded-3xl bg-surface-container-highest ambient-shadow transition-all hover:translate-y-[-2px]"
          >
            <div className="h-44 w-full relative">
              <img 
                className="w-full h-full object-cover grayscale-[10%] group-hover:scale-105 transition-all duration-700" 
                alt="Live Stream" 
                src={nextTransmission.imageUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuC4Hzlm92FmyUKryjvIHDjHBlJ6ddjutbEL0-cm1wDnLScOlWHTLJ4080eCexJQ1bS2dJ_pESocYL3p6-dmqx7f4G8xkq1fgu0-7FjNcYXvkbOv5IdC9w-Xr2Eg7Fco0qPv_wbPXInibTUseWiPWyYBwqwJLxntiZRP6JVqsWLoAOKwD46RgvUBjaQGdyDqE_YyU7jSLBGjIDBmCmszW1iQd7g2nHw42fQMTVthiqbJlZAzuuwloc9d_-NovApM8XA6Wl0tc8DofwM"}
              />
              <div className="absolute inset-0 bg-black/40" />
              
              <div className="absolute top-4 left-4 bg-[#ba1a1a] text-white text-[10px] font-bold px-2.5 py-1.5 rounded-md flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                <span>PRÓXIMO</span>
              </div>
            </div>

            <div className="p-6 relative -mt-10 bg-slate-900 rounded-t-3xl border-t border-slate-850">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-white/10 p-2.5 rounded-2xl flex flex-col items-center min-w-[55px]">
                  <span className="text-[9px] font-bold text-white/80 uppercase">
                    {new Date(nextTransmission.date).toLocaleDateString('pt-BR', { weekday: 'short' })}
                  </span>
                  <span className="text-xl font-black text-white">
                    {new Date(nextTransmission.date).getDate()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-amber-400 font-extrabold text-lg">
                    {new Date(nextTransmission.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <p className="text-white/60 text-[9px] font-bold uppercase tracking-wider block mt-0.5">
                    Horário de Brasília
                  </p>
                </div>
              </div>

              <h4 className="text-white text-lg font-bold leading-tight mb-1">
                {nextTransmission.title}
              </h4>
              <p className="text-white/70 text-xs font-semibold mb-3">
                {nextTransmission.subtitle}
              </p>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleReminderToggle();
                }}
                className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  reminderSet 
                    ? 'bg-green-700 text-white hover:bg-green-800 border border-green-800' 
                    : 'bg-[#00a63e] text-white hover:bg-[#00a63e]/90'
                }`}
              >
                {reminderSet ? <CheckCircle className="w-4 h-4" /> : <BellRing className="w-4 h-4" />}
                <span>{reminderSet ? "Lembrete Ativado" : "Lembrar-me do início"}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-surface-container-lowest rounded-3xl text-center">
            <p className="text-sm font-bold text-slate-500">Nenhum culto agendado no momento.</p>
          </div>
        )}
      </section>

      {/* Mural Section */}
      {muralEvents.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-sm font-black text-black uppercase tracking-wider leading-none ml-1">
            MURAL DE AVISOS
          </h3>
          <div className="grid gap-4">
            {muralEvents.map((ev) => (
              <div 
                key={ev.id} 
                className="p-5 bg-gradient-to-br from-indigo-950 to-slate-900 rounded-3xl shadow-xl flex flex-col gap-4 relative overflow-hidden border border-indigo-700/50"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 rounded-full blur-2xl pointer-events-none" />
                
                <div 
                  className="flex items-center gap-3.5 relative z-10 cursor-pointer" 
                  onClick={() => onNavigate('eventos')}
                >
                  <div className="bg-white/10 text-white text-xs font-extrabold p-3 rounded-2xl h-14 w-14 flex flex-col items-center justify-center shrink-0 shadow-lg border border-white/10">
                    <span className="uppercase text-[9px] opacity-80">{ev.month}</span>
                    <span className="text-xl">{ev.day}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-base text-white truncate">{ev.title}</h4>
                    <p className="text-[11px] text-amber-300 font-semibold mt-0.5 leading-tight">
                      {ev.location && `${ev.location}`}
                      {ev.address && `, ${ev.address}`}
                      {ev.neighborhood && ` - ${ev.neighborhood}`}
                      {ev.city && ` - ${ev.city}`}
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={() => onNavigate('eventos')}
                  className="w-full py-3 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all bg-[#00a63e] text-white hover:bg-[#00a63e]/90 shadow relative z-10"
                >
                  Confirme sua Presença
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 2 - BRAND NEW RADIO IPBA SECTION immediately below PROXIMOS CULTOS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-600 animate-pulse" />
            <h3 className="text-sm font-black text-black uppercase tracking-wider leading-none">
              RÁDIO IPBA DIGITAL
            </h3>
          </div>
          {isPlaying && (
            <span className="flex items-center gap-1 bg-[#ecfdf5] border border-[#a7f3d0] text-[#047857] text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping mr-1" />
              REPRODUZINDO
            </span>
          )}
        </div>

        {/* Dynamic Interactive Player Card */}
        <div className="bg-[#0b1322] text-[#cbd5e1] p-5 rounded-3xl shadow-xl flex flex-col gap-4 relative overflow-hidden border border-slate-700/50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/15 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg relative">
              {isPlaying ? (
                <div className="flex items-end gap-1 h-5 w-5 justify-center">
                  <div className="w-0.75 bg-white rounded animate-[soundBar_1s_infinite_alternate]" style={{ height: '30%' }} />
                  <div className="w-0.75 bg-white rounded animate-[soundBar_1.2s_infinite_alternate]" style={{ height: '80%' }} />
                  <div className="w-0.75 bg-white rounded animate-[soundBar_0.8s_infinite_alternate]" style={{ height: '50%' }} />
                </div>
              ) : (
                <Headphones className="w-5 h-5 text-white" />
              )
              }
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-[9px] text-indigo-400 font-extrabold uppercase tracking-widest leading-none">
                {currentProgram ? 'No Ar' : 'Rádio Parada'}
              </div>
              <h4 className="text-xs font-black text-white truncate mt-1">
                {currentProgram ? currentProgram.title : 'Selecione um programa abaixo'}
              </h4>
              <p className="text-[10px] text-amber-300 truncate font-semibold mt-0.5">
                {currentProgram ? `Locutor: ${currentProgram.speaker}` : 'IPBA Rádio Digital • 24 Horas'}
              </p>
            </div>
          </div>

          {/* Player controls */}
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 mt-1 gap-4">
            <button
              type="button"
              onClick={() => {
                if (currentProgram) {
                  handlePlayToggle(currentProgram);
                } else if (radioPrograms.length > 0) {
                  handlePlayToggle(radioPrograms[0]);
                }
              }}
              className={`px-5 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all ${
                radioPrograms.length === 0
                  ? 'bg-slate-850 text-slate-600 cursor-not-allowed'
                  : isPlaying 
                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-400' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? 'Pausar' : 'Ouvir Agora'}</span>
            </button>

            {/* Volume control slider */}
            <div className="flex items-center gap-2 text-slate-400 shrink-0">
              <Volume2 className="w-3.5 h-3.5" />
              <input 
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => {
                  const vol = parseFloat(e.target.value);
                  setVolume(vol);
                  if (audioRef.current) {
                    audioRef.current.volume = vol;
                  }
                }}
                className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Dynamic list of programs playing */}
        <div className="space-y-2.5">
          {radioPrograms.length > 0 ? (
            radioPrograms.map((prog) => {
              const isSelected = currentProgram?.id === prog.id;
              const isThisPlaying = isSelected && isPlaying;
              return (
                <div 
                  key={prog.id}
                  className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 border transition-all select-none ${
                    isSelected 
                      ? 'bg-indigo-50/50 border-indigo-200/80 shadow-sm' 
                      : 'bg-surface-container-lowest hover:bg-slate-50 border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <span className="text-[8.5px] text-indigo-600 font-extrabold uppercase tracking-wider block">
                      {prog.scheduledTime || 'Programação Diária'}
                    </span>
                    
                    <h5 className="font-extrabold text-xs text-on-surface leading-snug">
                      {prog.title}
                    </h5>
                    
                    <p className="text-[10px] text-slate-500 font-semibold">
                      Por: {prog.speaker}
                    </p>

                    {/* Tags */}
                    {prog.tags && prog.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {prog.tags.map((tag, idx) => (
                          <span 
                            key={idx} 
                            className="text-[7.5px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 uppercase tracking-wide"
                          >
                            🏷️ {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePlayToggle(prog)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 cursor-pointer shadow transition-all ${
                      isThisPlaying
                        ? 'bg-amber-500 text-slate-900 border-none animate-pulse'
                        : isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-indigo-50'
                    }`}
                  >
                    {isThisPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                  </button>
                </div>
              );
            })
          ) : (
            <p className="text-center text-xs text-slate-400 py-4 font-semibold">
              Nenhuma programação cadastrada na rádio.
            </p>
          )}
        </div>
      </section>

      {/* Hidden audio element */}
      <audio 
        ref={audioRef} 
        src={currentProgram?.audioUrl} 
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          onShowAlert("Programação finalizada.");
        }}
      />

      {/* Style element for music player soundbars spectrum simulation */}
      <style>{`
        @keyframes soundBar {
          0% { height: 15%; }
          100% { height: 100%; }
        }
      `}</style>

      {/* 3 - Quick Actions Section below Rádio */}
      <section className="space-y-4">
        <h3 className="text-sm font-black text-black uppercase tracking-wider leading-none ml-1">
          AÇÕES RÁPIDAS
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div 
            onClick={() => onNavigate('dizimos')}
            className="bg-surface-container-lowest p-5 rounded-2xl flex flex-col justify-between h-36 hover:bg-white transition-all cursor-pointer group border border-transparent hover:border-primary-fixed ambient-shadow select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-fixed/30 flex items-center justify-center text-primary-container group-hover:scale-110 transition-transform">
              <Coins className="w-5.5 h-5.5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-primary text-sm leading-tight">Ofertas e Dízimos</p>
              <p className="text-[10px] text-on-surface-variant mt-1 font-medium">Contribua com a obra</p>
            </div>
          </div>

          <div 
            onClick={() => onNavigate('oracao')}
            className="bg-surface-container-lowest p-5 rounded-2xl flex flex-col justify-between h-36 hover:bg-white transition-all cursor-pointer group border border-transparent hover:border-primary-fixed ambient-shadow select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-fixed/30 flex items-center justify-center text-primary-container group-hover:scale-110 transition-transform">
              <HeartHandshake className="w-5.5 h-5.5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-primary text-sm leading-tight">Pedido de Oração</p>
              <p className="text-[10px] text-on-surface-variant mt-1 font-medium">Estamos orando por você</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4 - Daily devocional versicle at BOTTOM */}
      <section 
        onClick={cycleVerse} 
        className="relative border-l-4 border-indigo-600 bg-surface-container-lowest p-6 rounded-r-2xl text-on-surface-variant font-medium ambient-shadow cursor-pointer hover:bg-slate-50 transition-colors select-none group"
      >
        <div className="absolute top-3 right-4 text-[9px] font-bold text-indigo-500 tracking-wider flex items-center gap-1 group-hover:opacity-100 opacity-60 transition-opacity uppercase">
          <span>Trocar Versículo</span>
          <ArrowRight className="w-3 h-3 text-indigo-500" />
        </div>
        <Quote className="w-6 h-6 text-indigo-600 mb-2 opacity-40 animate-pulse" />
        <p className="italic text-xs leading-relaxed text-slate-700 pr-5 font-semibold">
          "{VERSES[verseIndex].text}"
        </p>
        <span className="block mt-3 not-italic font-extrabold text-[10px] text-indigo-600 uppercase tracking-widest leading-none">
          — {VERSES[verseIndex].ref}
        </span>
      </section>
    </div>
  );
}
