import { useState } from 'react';
import { Calendar, MapPin, Clock, CheckCircle2, Award, Sparkles, DollarSign } from 'lucide-react';
import { ChurchEvent } from '../types';

interface EventosSectionProps {
  events: ChurchEvent[];
  onToggleGoing: (eventId: string) => void;
  onShowAlert: (msg: string) => void;
  onNavigate: (tab: string) => void;
}

export default function EventosSection({ events, onToggleGoing, onShowAlert, onNavigate }: EventosSectionProps) {
  const [filterMode, setFilterMode] = useState<'todos' | 'confirmados'>('todos');

  const filteredEvents = events.filter((ev) => 
    filterMode === 'todos' ? true : ev.going
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Title Header Area */}
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h1 className="font-display font-extrabold text-3xl text-primary tracking-tight">Eventos</h1>
          </div>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider ml-1">PRÓXIMAS ATIVIDADES</p>
        </div>

        {/* Tab Filters */}
        <div className="bg-slate-100 p-1 rounded-full border border-slate-200 flex text-[10px] uppercase font-bold tracking-widest select-none">
          <button
            onClick={() => setFilterMode('todos')}
            className={`px-4 py-1.5 rounded-full cursor-pointer transition-all ${
              filterMode === 'todos' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-primary'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterMode('confirmados')}
            className={`px-4 py-1.5 rounded-full cursor-pointer transition-all ${
              filterMode === 'confirmados' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-primary'
            }`}
          >
            Confirmados
          </button>
        </div>
      </div>

      {/* List of upcoming events */}
      <div className="space-y-4">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 bg-white/40 rounded-2xl p-6 border border-slate-200">
            <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
            <p className="font-semibold text-slate-600">Nenhum evento localizado com este filtro.</p>
            <p className="text-xs text-slate-500 mt-1">Navegue pelas células ou assista à transmissão online!</p>
          </div>
        ) : (
          filteredEvents.map((ev) => (
            <div 
              key={ev.id}
              className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-primary-fixed transition-all"
            >
              <div className="space-y-4">
                
                {/* Badge Day / Time Header */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#002d5e] p-3 rounded-2xl text-center min-w-[60px] text-white shadow-sm shrink-0">
                      <span className="text-[10px] font-bold text-[#d6e3ff] uppercase tracking-wider block leading-none mb-1">
                        {ev.month}
                      </span>
                      <span className="text-xl font-black block leading-none">
                        {ev.day}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-extrabold text-[#001939] leading-tight group-hover:text-primary transition-colors">
                        {ev.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 font-bold select-none">
                        <Clock className="w-3.5 h-3.5 text-[#7696cd]" />
                        <span>{ev.timeStr} às {ev.timeEnd || '??:??'}</span>
                        <div className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span className="text-primary truncate max-w-[150px]">{ev.location}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description of what this activity is about */}
                <p className="text-[#43474f] text-sm leading-relaxed pt-2 border-t border-slate-100/60 font-medium">
                  {ev.description}
                </p>

                {/* Pricing, Address and Maps */}
                <div className="space-y-2 mt-2">
                   <div className="flex flex-col gap-1 items-start text-xs text-slate-500 font-bold bg-[#f3f4f5] p-3 rounded-xl select-none">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span>{ev.location}</span>
                      </div>
                      {ev.address && <span className="text-[10px] text-slate-400 pl-6 break-words">{ev.address}</span>}
                   </div>
                      
                   <div className="flex flex-wrap gap-2">
                       {ev.isPaid && (
                         <>
                           <div className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                              Valor: R$ {ev.value?.toFixed(2)}
                           </div>
                           <button 
                                onClick={(e) => { e.stopPropagation(); onNavigate('dizimos'); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-700 rounded-lg border border-sky-100 text-[10px] font-black uppercase tracking-wider hover:bg-sky-100 transition-colors"
                             >
                               <DollarSign className="w-3 h-3" /> Pagar via Pix
                             </button>
                         </>
                       )}
                       <button 
                          onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.location)}`, '_blank')}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100 text-[10px] font-black uppercase tracking-wider hover:bg-indigo-100 transition-colors"
                       >
                         <MapPin className="w-3 h-3" /> Rota Maps
                       </button>
                    </div>
                </div>

              </div>

              {/* Toggle Event register presence */}
              <button
                onClick={() => {
                  onToggleGoing(ev.id);
                  onShowAlert(ev.going ? "Presença cancelada na atividade." : `Presença confirmada no ${ev.title}! Confira na ficha do Perfil.`);
                }}
                className={`w-full mt-5 py-3.5 font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  ev.going 
                    ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm' 
                    : 'bg-primary text-white hover:opacity-95'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{ev.going ? 'Presença Confirmada' : 'Confirmar Presença'}</span>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Liturgical small card note */}
      <section className="bg-[#ffdbcb] text-[#713615] rounded-2xl p-5 border border-[#ffb692]/40 flex items-start gap-4 shadow-sm select-none">
        <Sparkles className="w-5 h-5 text-[#a9c7ff] shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-sm text-[#341100]">Inscrições Online</h4>
          <p className="text-[11px] text-[#713615]/90 font-medium mt-0.5 leading-normal">
            A participação nos cultos principais é livre e irrestrita. Use as confirmações acima para eventos específicos de formação, retiros, almoços beneficentes e congressos.
          </p>
        </div>
      </section>
    </div>
  );
}
