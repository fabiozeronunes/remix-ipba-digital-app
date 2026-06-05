import React, { useState } from 'react';
import { 
  Search, 
  SlidersHorizontal, 
  MapPin, 
  Calendar, 
  Users, 
  CheckCircle, 
  Home, 
  ArrowRight,
  Sparkles,
  Info,
  Bell,
  Download,
  Navigation,
  Compass,
  Check,
  Map
} from 'lucide-react';
import { Cell } from '../types';

interface CelulasSectionProps {
  cells: Cell[];
  onToggleJoin: (cellId: string) => void;
  onShowAlert: (msg: string) => void;
}

export default function CelulasSection({ cells, onToggleJoin, onShowAlert }: CelulasSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState(true); // default to true so it is readily discoverable!
  const [showHouseModal, setShowHouseModal] = useState(false);

  // Filter States
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('all');

  // Route Creator States
  const [routingCell, setRoutingCell] = useState<Cell | null>(null);
  const [userLocationInput, setUserLocationInput] = useState('');
  const [isTracingRoute, setIsTracingRoute] = useState(false);
  const [routeSteps, setRouteSteps] = useState<string[]>([]);
  const [showRouteResult, setShowRouteResult] = useState(false);

  // Derived unique cities
  const allCities = Array.from(new Set(cells.map(c => c.city || 'Não especificada').filter(Boolean)));

  // Derived unique neighborhoods, filtered by selected city if any
  const allNeighborhoods = Array.from(
    new Set(
      cells
        .filter(c => selectedCity === 'all' || (c.city || 'Não especificada') === selectedCity)
        .map(c => c.neighborhood)
    )
  );

  // Reset neighborhood if no longer available in the filtered city list
  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setSelectedNeighborhood('all');
  };

  // Start routing flow
  const handleStartRouting = (cell: Cell) => {
    setRoutingCell(cell);
    setUserLocationInput('Minha Localização Atual');
    setIsTracingRoute(false);
    setRouteSteps([]);
    setShowRouteResult(false);
  };

  // Run the beautiful animated simulated route generation flow
  const handleCalculateRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userLocationInput.trim()) {
      onShowAlert("Por favor, digite um endereço ou referência de partida.");
      return;
    }
    setIsTracingRoute(true);
    setRouteSteps([]);
    setShowRouteResult(false);

    setTimeout(() => {
      setIsTracingRoute(false);
      setShowRouteResult(true);
      const isCustomLocation = userLocationInput.trim() !== 'Minha Localização Atual';
      const startPoint = isCustomLocation ? userLocationInput : 'Sua Localização GPS Atual';
      const city = routingCell?.city || 'São Paulo';
      
      setRouteSteps([
        `📍 Saída registrada de: "${startPoint}"`,
        `🛣️ Prossiga por 900m na principal via de acesso à cidade de ${city}`,
        `↗️ Mantenha-se à direita na entrada para o bairro ${routingCell?.neighborhood}`,
        `🏡 Siga as placas de indicação da Célula "${routingCell?.title}" por mais de 450 metros`,
        `🏁 Chegada concluída no Destino: "${routingCell?.address}". Encontro liderado por: ${routingCell?.leaderName}!`
      ]);
      
      onShowAlert(`Rota calculada com sucesso para a ${routingCell?.title}!`);
    }, 1300);
  };

  const filteredCells = cells.filter((cell) => {
    // 1. City Filter
    const cellCity = cell.city || 'São Paulo';
    if (selectedCity !== 'all' && cellCity !== selectedCity) return false;

    // 2. Neighborhood Filter
    if (selectedNeighborhood !== 'all' && cell.neighborhood !== selectedNeighborhood) return false;

    // 3. Text Search Match
    const text = searchTerm.toLowerCase();
    if (!text) return true;

    const leaderMatch = cell.leaderName.toLowerCase().includes(text);
    const titleMatch = cell.title.toLowerCase().includes(text);
    const neighborhoodMatch = cell.neighborhood.toLowerCase().includes(text);
    const cityMatch = cellCity.toLowerCase().includes(text);
    return leaderMatch || titleMatch || neighborhoodMatch || cityMatch;
  });

  // Featured cell is we pre-select the closest one (e.g. Célula Manancial with "1.2km")
  const featuredCell = cells[0];
  const regularCells = cells.slice(1);

  const handleHouseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowHouseModal(false);
    onShowAlert("Obrigado pelo interesse! Nossa equipe de comunhão entrará em contato para agendar uma visita e preparar seu lar.");
  };

  const joinedCells = cells.filter(cell => cell.joined);

  // Helper to parse Portuguese weekday + time and map it into a recurring weekly iCalendar event (.ics)
  const getICSFileForCells = (selectedCells: Cell[]) => {
    if (selectedCells.length === 0) return;

    let icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Portal do Membro//Células//PT',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday ...

    selectedCells.forEach((cell) => {
      const normalized = cell.schedule.toLowerCase();
      let dayNum = 2; // Default Tuesday
      let dayCode = 'TU';

      if (normalized.includes('segunda')) {
        dayNum = 1;
        dayCode = 'MO';
      } else if (normalized.includes('terça') || normalized.includes('terca')) {
        dayNum = 2;
        dayCode = 'TU';
      } else if (normalized.includes('quarta')) {
        dayNum = 3;
        dayCode = 'WE';
      } else if (normalized.includes('quinta')) {
        dayNum = 4;
        dayCode = 'TH';
      } else if (normalized.includes('sexta')) {
        dayNum = 5;
        dayCode = 'FR';
      } else if (normalized.includes('sábado') || normalized.includes('sabado')) {
        dayNum = 6;
        dayCode = 'SA';
      } else if (normalized.includes('domingo')) {
        dayNum = 0;
        dayCode = 'SU';
      }

      // Time parsing
      const timeRegex = /(\d{2})[h:](\d{2})/;
      const match = normalized.match(timeRegex);
      let hour = 20;
      let min = 0;
      if (match) {
        hour = parseInt(match[1], 10);
        min = parseInt(match[2], 10);
      }

      // Calculate days until next occurrence of the cell weekday
      let daysUntil = dayNum - currentDay;
      if (daysUntil <= 0) {
        daysUntil += 7; // next week
      }

      const targetDate = new Date(today.getTime() + daysUntil * 24 * 60 * 60 * 1000);
      targetDate.setHours(hour, min, 0, 0);

      const pad = (n: number) => String(n).padStart(2, '0');
      const yearStr = targetDate.getFullYear();
      const monthStr = pad(targetDate.getMonth() + 1);
      const dateStr = pad(targetDate.getDate());
      const hhStr = pad(targetDate.getHours());
      const mmStr = pad(targetDate.getMinutes());

      // End date 1 hour 30 min later
      const endDate = new Date(targetDate.getTime() + 90 * 60 * 1000);
      const endYearStr = endDate.getFullYear();
      const endMonthStr = pad(endDate.getMonth() + 1);
      const endDateStr = pad(endDate.getDate());
      const endHhStr = pad(endDate.getHours());
      const endMmStr = pad(endDate.getMinutes());

      const formattedStart = `${yearStr}${monthStr}${dateStr}T${hhStr}${mmStr}00`;
      const formattedEnd = `${endYearStr}${endMonthStr}${endDateStr}T${endHhStr}${endMmStr}00`;

      icsLines.push('BEGIN:VEVENT');
      icsLines.push(`SUMMARY:Encontro da ${cell.title}`);
      icsLines.push(`UID:cell-group-${cell.id}@portaldomembro.org`);
      icsLines.push('SEQUENCE:0');
      icsLines.push('STATUS:CONFIRMED');
      icsLines.push('TRANSP:OPAQUE');
      icsLines.push(`DTSTART:${formattedStart}`);
      icsLines.push(`DTEND:${formattedEnd}`);
      icsLines.push(`RRRULE:FREQ=WEEKLY;BYDAY=${dayCode}`);
      icsLines.push(`DESCRIPTION:Encontro semanal da ${cell.title}. Líder: ${cell.leaderName}. Endereço: ${cell.address}`);
      icsLines.push(`LOCATION:${cell.address}, ${cell.neighborhood}`);
      icsLines.push('BEGIN:VALARM');
      icsLines.push('TRIGGER:-PT30M'); // 30 mins alarm
      icsLines.push('ACTION:DISPLAY');
      icsLines.push('DESCRIPTION:Lembrete de Célula');
      icsLines.push('END:VALARM');
      icsLines.push('END:VEVENT');
    });

    icsLines.push('END:VCALENDAR');

    const icsContent = icsLines.join('\r\n');
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    const filename = selectedCells.length === 1 
      ? `lembrete_${selectedCells[0].title.toLowerCase().replace(/\s+/g, '_')}.ics` 
      : `lembretes_celulas_unificadas.ics`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowAlert(
      selectedCells.length === 1 
        ? `Lembrete semanal para a ${selectedCells[0].title} gerado! Abra o arquivo para adicionar ao seu calendário.`
        : `Lembretes para as ${selectedCells.length} células adicionadas ao calendário!`
    );
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Search Input Section */}
      <section className="space-y-4">
        <h1 className="font-display font-extrabold text-3xl text-primary tracking-tight">Células</h1>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-surface-container-high border-none rounded-xl focus:ring-2 focus:ring-primary text-sm text-[#191c1d] outline-none placeholder:text-[#43474f]/60" 
              placeholder="Buscar por bairro, célula ou líder" 
              type="text"
            />
          </div>
          <button 
            type="button"
            onClick={() => {
              setFilterActive(!filterActive);
            }}
            className={`p-4 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              filterActive ? 'bg-indigo-650 text-white shadow-xs' : 'bg-surface-container-high text-indigo-700 hover:bg-[#e1e3e4]'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* City and Neighborhood select components */}
        {filterActive && (
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in text-[#2c323f]">
            <div>
              <label className="block text-[10px] font-black uppercase text-[#002B5E] tracking-wider mb-1.5 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-indigo-600" />
                Filtrar por Cidade:
              </label>
              <select
                value={selectedCity}
                onChange={(e) => handleCityChange(e.target.value)}
                className="w-full bg-white text-xs font-bold border border-slate-205 rounded-xl px-3 py-2.5 outline-none focus:ring-1 focus:ring-indigo-400 cursor-pointer"
              >
                <option value="all">📍 Todas as Cidades ({allCities.length})</option>
                {allCities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-[#002B5E] tracking-wider mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-650" />
                Filtrar por Bairro:
              </label>
              <select
                value={selectedNeighborhood}
                onChange={(e) => setSelectedNeighborhood(e.target.value)}
                className="w-full bg-white text-xs font-bold border border-slate-205 rounded-xl px-3 py-2.5 outline-none focus:ring-1 focus:ring-indigo-400 cursor-pointer"
              >
                <option value="all">🏘️ Todos os Bairros ({allNeighborhoods.length})</option>
                {allNeighborhoods.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            {(selectedCity !== 'all' || selectedNeighborhood !== 'all') && (
              <div className="sm:col-span-2 flex items-center justify-between pt-1 border-t border-slate-100 mt-1">
                <span className="text-[10px] text-slate-500 font-bold">
                  Filtro ativo: {selectedCity !== 'all' ? selectedCity : ''} {selectedNeighborhood !== 'all' ? `• Bairro: ${selectedNeighborhood}` : ''}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCity('all');
                    setSelectedNeighborhood('all');
                  }}
                  className="text-[10px] text-red-600 font-black uppercase tracking-wider hover:underline"
                >
                  Limpar Filtros 🗙
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Meus Encontros e Lembretes - Active reminders card */}
      {joinedCells.length > 0 && (
        <section className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-5 border border-indigo-100 shadow-sm space-y-4 animate-fade-in text-[#2c323f]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 uppercase tracking-widest">
                <Bell className="w-3.5 h-3.5 animate-bounce" />
                Lembretes no Dispositivo
              </span>
              <h3 className="text-xl font-extrabold text-indigo-950 tracking-tight">
                Seus Encontros de Célula
              </h3>
            </div>
            {joinedCells.length > 1 && (
              <button 
                onClick={() => getICSFileForCells(joinedCells)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-md cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Sincronizar Todas</span>
              </button>
            )}
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Você está inscrito em {joinedCells.length} {joinedCells.length === 1 ? 'grupo de conexão' : 'grupos de conexão'}. Baixe o arquivo de lembrete (.ics) abaixo para agendar automaticamente as reuniões semanais recorrentes no calendário padrão do seu celular ou tablet.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {joinedCells.map((cell) => (
              <div 
                key={`reminder-${cell.id}`} 
                className="bg-white rounded-xl p-3.5 border border-slate-200/60 flex items-center justify-between gap-3 shadow-xs hover:border-indigo-200 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-extrabold text-sm text-slate-800 truncate">{cell.title}</p>
                  <p className="text-[10px] text-indigo-700 font-extrabold bg-indigo-50 rounded-md px-2 py-0.5 inline-block mt-1">
                    {cell.schedule}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Evita conflito
                      onShowAlert("Redirecionando para o estudo da célula...");
                      // Dispara evento global para o EstudosSection capturar
                      const navEvent = new CustomEvent('navigate-to-estudos-tag', { detail: { tag: 'CÉLULA' } });
                      window.dispatchEvent(navEvent);
                    }}
                    className="block mt-2 text-[10px] font-black uppercase text-indigo-900 bg-indigo-100 hover:bg-indigo-200 px-2 py-1 rounded-md cursor-pointer transition-colors"
                  >
                    Estudo da Célula
                  </button>
                </div>
                <button 
                  onClick={() => getICSFileForCells([cell])}
                  title="Exportar lembrete semanal para o calendário"
                  className="p-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100/70 rounded-lg transition-colors cursor-pointer shrink-0 border border-indigo-100/50"
                >
                  <Calendar className="w-4 h-4 text-indigo-600" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured: Closest Cell (A 1.2km de você) */}
      {!searchTerm && featuredCell && (
        <section className="space-y-4">
          <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest leading-none ml-1">
            Célula mais próxima
          </h2>
          
          <div className="bg-[#002d5e] rounded-2xl p-6 text-white shadow-lg overflow-hidden relative group">
            {/* Background design glow */}
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-[#001939] rounded-full opacity-40 blur-3xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
            
            <div className="relative z-10 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold tracking-wide mb-2 uppercase">
                    {featuredCell.distance}
                  </span>
                  <h3 className="text-2xl font-bold leading-tight">{featuredCell.title}</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                  <MapPin className="w-5 h-5 text-[#a9c7ff]" />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <img 
                  className="w-12 h-12 rounded-full border-2 border-white/30 object-cover" 
                  alt="Pastor Roberto Silva Portrait" 
                  src={featuredCell.leaderAvatar} 
                />
                <div>
                  <p className="text-[11px] opacity-70 font-semibold uppercase tracking-wider">Líder</p>
                  <p className="font-extrabold text-white text-base">{featuredCell.leaderName}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/10 pt-4 text-xs">
                <div className="flex items-center gap-2 text-white/90">
                  <Calendar className="w-4 h-4 text-[#a9c7ff] shrink-0" />
                  <span>{featuredCell.schedule}</span>
                </div>
                <div className="flex items-start gap-2 text-white/90">
                  <MapPin className="w-4 h-4 text-[#a9c7ff] shrink-0 mt-0.5" />
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold break-words">{featuredCell.address}</span>
                    <span className="opacity-80 text-[11px]">{featuredCell.neighborhood}, {featuredCell.city || 'São Paulo'}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button 
                  type="button"
                  onClick={() => {
                    onToggleJoin(featuredCell.id);
                    onShowAlert(featuredCell.joined ? "Participação cancelada." : "Inscrição confirmada na Célula Manancial! O Pastor Roberto receberá sua notificação.");
                  }}
                  className={`flex-1 py-4 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    featuredCell.joined 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-primary-container text-[#d6e3ff] hover:text-white border border-white/20'
                  }`}
                >
                  {featuredCell.joined ? <CheckCircle className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                  <span>{featuredCell.joined ? 'Inscrito na Célula' : 'Quero Participar'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStartRouting(featuredCell)}
                  className="py-4 px-4 bg-indigo-55 bg-indigo-50/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
                  title="Traçar rota até este endereço"
                >
                  <Navigation className="w-4 h-4 text-emerald-350" />
                  <span>Traçar Rota</span>
                </button>

                {featuredCell.joined && (
                  <button 
                    type="button"
                    onClick={() => getICSFileForCells([featuredCell])}
                    title="Definir Lembrete no Dispositivo"
                    className="p-4 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all flex items-center justify-center cursor-pointer border border-white/20"
                  >
                    <Bell className="w-5 h-5 text-white animate-pulse" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Explorar Células List */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest leading-none ml-1">
          {searchTerm ? 'Células Encontradas' : 'Explorar Células'}
        </h2>

        {filteredCells.length === 0 ? (
          <div className="text-center py-10 bg-white/40 rounded-2xl p-6 border border-slate-200">
            <Users className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
            <p className="font-semibold text-slate-600">Nenhuma célula encontrada para "{searchTerm}"</p>
            <p className="text-xs text-slate-500 mt-1">Tente buscar por outro bairro, líder ou avenida.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {(searchTerm ? filteredCells : regularCells).map((cell) => (
              <div 
                key={cell.id} 
                className="bg-surface-container-lowest p-5 rounded-xl border border-slate-100 flex flex-col justify-between shadow-sm relative group hover:border-primary-fixed transition-all"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-bold text-primary leading-tight">{cell.title}</h4>
                      <p className="text-[10px] text-[#713615] bg-[#ffdbcb] font-bold px-2 py-0.5 rounded-full inline-block mt-1">
                        {cell.distance}
                      </p>
                    </div>
                    <Users className="w-5 h-5 text-primary/40 group-hover:text-primary transition-colors" />
                  </div>

                  <div className="flex items-center gap-3">
                    <img 
                      className="w-10 h-10 rounded-full object-cover border border-slate-200" 
                      alt={cell.leaderName} 
                      src={cell.leaderAvatar} 
                    />
                    <div>
                      <p className="text-[9px] text-[#43474f] uppercase font-bold tracking-wider">Líder</p>
                      <p className="font-bold text-on-surface text-sm">{cell.leaderName}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-on-surface-variant text-xs pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-primary/60" />
                      <span>{cell.schedule}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-primary/60" />
                      <span className="truncate">{cell.address}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button 
                    type="button"
                    onClick={() => {
                      onToggleJoin(cell.id);
                      onShowAlert(cell.joined ? "Participação cancelada." : `Inscrição confirmada na ${cell.title}!`);
                    }}
                    className={`flex-1 py-3 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      cell.joined 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'bg-primary-container text-[#d6e3ff] hover:text-white'
                    }`}
                  >
                    {cell.joined ? <CheckCircle className="w-3.5 h-3.5" /> : null}
                    <span>{cell.joined ? 'Inscrito' : 'Quero Participar'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStartRouting(cell)}
                    className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-xl transition-all flex items-center justify-center cursor-pointer shrink-0"
                    title="Traçar Rota / Como Chegar"
                  >
                    <Navigation className="w-4 h-4 text-indigo-650" />
                  </button>

                  {cell.joined && (
                    <button 
                      type="button"
                      onClick={() => getICSFileForCells([cell])}
                      title="Definir Lembrete no Dispositivo"
                      className="p-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-100/70 rounded-xl transition-all flex items-center justify-center cursor-pointer shrink-0 border border-indigo-100/40"
                    >
                      <Bell className="w-4 h-4 text-indigo-600 animate-pulse" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CTA: Open your home (Abra sua casa) */}
      <section>
        <div className="bg-surface-container-highest rounded-2xl p-8 relative overflow-hidden border border-slate-200/60 shadow-sm">
          <div className="relative z-10 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center">
              <Home className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-black text-primary tracking-tighter leading-none">Abra sua casa</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed max-w-[280px]">
              Hospede um grupo de conexão e seja um canal de bênçãos em sua vizinhança.
            </p>
            <button 
              onClick={() => setShowHouseModal(true)}
              className="px-6 py-3 bg-primary-container text-[#d6e3ff] hover:text-white rounded-full font-bold uppercase tracking-widest text-[10px] active:scale-95 transition-all cursor-pointer"
            >
              Saiba Mais
            </button>
          </div>
          {/* Background watermark icon */}
          <div className="absolute -bottom-10 -right-10 opacity-[0.03] pointer-events-none">
            <Users className="w-64 h-64 text-black" />
          </div>
        </div>
      </section>

      {/* Sweet popup house host modal */}
      {showHouseModal && (
        <div className="fixed inset-0 bg-[#001939]/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-bold text-primary">Seja um anfitrião</h3>
              </div>
              <button 
                onClick={() => setShowHouseModal(false)}
                className="text-slate-400 hover:text-primary font-bold text-sm cursor-pointer p-1"
              >
                Voltar
              </button>
            </div>
            
            <p className="text-sm text-[#43474f] leading-relaxed">
              Casas abertas transformam vidas. Hospedar uma Célula consiste em ceder um espaço uma vez por semana para louvor, reflexão bíblica rápida e partilha fraterna de cafezinho. Nós fornecemos todo o apoio pastoral!
            </p>

            <form onSubmit={handleHouseSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1">Seu Nome</label>
                <input 
                  required 
                  className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-sm outline-none w-full focus:ring-2 focus:ring-primary" 
                  placeholder="Seu nome completo" 
                  type="text" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1">Telefone / WhatsApp</label>
                <input 
                  required 
                  className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-sm outline-none w-full focus:ring-2 focus:ring-primary" 
                  placeholder="(11) 99999-9999" 
                  type="tel" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1">Bairro de Residência</label>
                <input 
                  required 
                  className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-sm outline-none w-full focus:ring-2 focus:ring-primary" 
                  placeholder="Ex: Itaim Bibi, Moema, Vila Mariana" 
                  type="text" 
                />
              </div>

              <button 
                className="w-full py-4 bg-primary text-white font-bold rounded-xl uppercase tracking-widest text-xs hover:opacity-95 transition-opacity cursor-pointer mt-4"
                type="submit"
              >
                Enviar Solicitação
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Rastrear endereço e criar Rota modal */}
      {routingCell && (
        <div className="fixed inset-0 bg-[#001939]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in text-[#2c323f]">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-5 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-indigo-600 animate-pulse" />
                <div>
                  <h3 className="text-lg font-black text-[#002B5E] leading-tight">Como Chegar à Célula</h3>
                  <p className="text-[10px] font-bold text-slate-450 uppercase tracking-widest mt-0.5">Rastreamento de Rota Ativo</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setRoutingCell(null)}
                className="text-slate-450 hover:text-red-650 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 p-1.5 rounded-xl text-xs font-black select-none cursor-pointer"
              >
                Cancelar/Sair
              </button>
            </div>

            <div className="bg-indigo-50/50 border border-indigo-150 rounded-2xl p-4 space-y-1.5">
              <span className="text-[9px] font-black uppercase text-indigo-750 tracking-wider">Destino Escolhido:</span>
              <h4 className="font-extrabold text-indigo-950 text-sm">{routingCell.title}</h4>
              <p className="text-xs text-slate-750 font-medium">
                📍 {routingCell.address}, {routingCell.neighborhood} • {routingCell.city || 'São Paulo'}
              </p>
              <div className="text-[10px] text-indigo-600 font-extrabold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Reuniões recorrentes: {routingCell.schedule}
              </div>
            </div>

            <form onSubmit={handleCalculateRoute} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">
                  Seu Endereço de Partida / Referência:
                </label>
                <div className="flex gap-2">
                  <input 
                    required
                    value={userLocationInput}
                    onChange={(e) => setUserLocationInput(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-205 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-400 text-slate-800"
                    placeholder="Ex: Minha Casa ou Metrô Trianon-Masp" 
                    type="text" 
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setUserLocationInput('Minha Localização GPS Atual');
                      onShowAlert("Posição GPS simulada com sucesso!");
                    }}
                    className="px-3.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-[10px] font-black uppercase tracking-wider rounded-xl transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    📍 GPS
                  </button>
                </div>
              </div>

              {!isTracingRoute && !showRouteResult && (
                <button
                  type="submit"
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl uppercase tracking-widest text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                >
                  <Navigation className="w-4 h-4 fill-white text-white" />
                  <span>Calcular Rota / Direções</span>
                </button>
              )}
            </form>

            {/* Spinner loader feedback */}
            {isTracingRoute && (
              <div className="py-8 text-center space-y-3 flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
                <p className="text-xs font-black text-indigo-900 uppercase tracking-wider animate-pulse">
                  Traçando itinerário ideal até o local da célula...
                </p>
                <p className="text-[10px] text-slate-400">Cruzando dados de endereço e bairro do Pastor Líder.</p>
              </div>
            )}

            {/* Generated results timeline */}
            {showRouteResult && routeSteps.length > 0 && (
              <div className="space-y-4 animate-fade-in border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-indigo-950 tracking-wider">
                    📋 Passo a Passo da Rota
                  </span>
                  <span className="text-[9px] text-[#2e7d32] bg-[#e8f5e9] border border-[#a5d6a7] font-black px-2 py-0.5 rounded uppercase tracking-wider animate-pulse">
                    Melhor Caminho Encontrado
                  </span>
                </div>

                <div className="space-y-3 pl-1.5 border-l-2 border-dashed border-indigo-200">
                  {routeSteps.map((step, idx) => (
                    <div key={`step-${idx}`} className="relative pl-5 text-xs font-medium text-slate-700 leading-relaxed">
                      {/* Timeline dot marker styled with step number */}
                      <span className="absolute -left-2.5 top-0.5 w-4 h-4 rounded-full bg-indigo-100 border border-indigo-300 flex items-center justify-center text-[8.5px] font-black text-indigo-700">
                        {idx + 1}
                      </span>
                      {step}
                    </div>
                  ))}
                </div>

                {/* Direct External Navigation options */}
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${routingCell.address}, ${routingCell.neighborhood}, ${routingCell.city || 'São Paulo'}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-3 bg-[#e8f0fe] hover:bg-[#d2e3fc] border border-indigo-150 text-indigo-850 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer text-center text-indigo-900 transition-colors"
                  >
                    🗺️ Abrir no Google Maps
                  </a>

                  <a
                    href={`https://waze.com/ul?q=${encodeURIComponent(`${routingCell.address}, ${routingCell.neighborhood}, ${routingCell.city || 'São Paulo'}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-3 bg-[#fff9c4] hover:bg-[#fff59d] border border-amber-200 text-amber-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer text-center text-amber-900 transition-colors"
                  >
                    🚗 Navegar via Waze
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
