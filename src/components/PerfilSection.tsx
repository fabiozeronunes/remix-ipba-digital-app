import React, { useState, useRef, useEffect } from 'react';
import { 
  User as UserIcon, 
  Edit2, 
  Save, 
  Moon, 
  Sun, 
  Bell, 
  Volume2, 
  Trash2, 
  Sparkles, 
  Upload, 
  Camera, 
  Check, 
  Lock, 
  Shield, 
  HelpCircle, 
  HeartHandshake, 
  Calendar, 
  Coins, 
  FileText, 
  Layers, 
  Activity,
  LogOut,
  Info,
  ChevronRight,
  Database,
  Video,
  Users,
  MapPin,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';

interface PerfilSectionProps {
  user: User | null;
  onLogout: () => void;
  onNavigate: (tab: string) => void;
  userPrayersCount?: number;
  userEventsCount?: number;
  userContributionsCount?: number;
  onShowAlert: (msg: string) => void;
  onUpdateUser: (updatedUser: Partial<User>, targetEmail?: string) => void;
  cargos: string[];
}

const PRESET_AVATARS = [
  { id: '1', name: 'Azul Elegante', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150' },
  { id: '2', name: 'Moderno Coral', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150' },
  { id: '3', name: 'Pastoral Ouro', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150' },
  { id: '4', name: 'Suave Turquesa', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150' },
  { id: '5', name: 'Clássico Minimal', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150' }
];

export default function PerfilSection({
  user,
  onLogout,
  onNavigate,
  userPrayersCount = 0,
  userEventsCount = 0,
  userContributionsCount = 0,
  onShowAlert,
  onUpdateUser,
  cargos
}: PerfilSectionProps) {
  // Navigation tabs of PerfilSection
  const [activeSubTab, setActiveSubTab] = useState<'perfil' | 'edit' | 'preferencias' | 'cadastro'>('preferencias');

  // Load preferences from localStorage on init
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('pref_theme_mode') as 'light' | 'dark') || 'light';
  });
  const [soundEffects, setSoundEffects] = useState<boolean>(() => {
    return localStorage.getItem('pref_sound_effects') !== 'false';
  });
  const [notificationPlan, setNotificationPlan] = useState<boolean>(() => {
    return localStorage.getItem('pref_notify_plan') !== 'false';
  });
  const [notificationLive, setNotificationLive] = useState<boolean>(() => {
    return localStorage.getItem('pref_notify_live') !== 'false';
  });
  const [notificationPrayers, setNotificationPrayers] = useState<boolean>(() => {
    return localStorage.getItem('pref_notify_prayers') !== 'false';
  });

  // Additional Menu Options Settings
  const [cellsFilterActive, setCellsFilterActive] = useState<boolean>(() => {
    return localStorage.getItem('pref_cells_filter_active') !== 'false';
  });
  const [cellsCityFilter, setCellsCityFilter] = useState<string>(() => {
    return localStorage.getItem('pref_cells_city_filter') || 'all';
  });
  const [playLiveAutoplay, setPlayLiveAutoplay] = useState<boolean>(() => {
    return localStorage.getItem('pref_play_live_autoplay') === 'true';
  });
  const [eventsOnlyGoing, setEventsOnlyGoing] = useState<boolean>(() => {
    return localStorage.getItem('pref_events_only_going') === 'true';
  });
  const [prayersAnonymousDefault, setPrayersAnonymousDefault] = useState<boolean>(() => {
    return localStorage.getItem('pref_prayers_anonymous_default') === 'true';
  });
  const [prayersFilterPending, setPrayersFilterPending] = useState<boolean>(() => {
    return localStorage.getItem('pref_prayers_filter_pending') === 'true';
  });
  const [dizimosHideAmounts, setDizimosHideAmounts] = useState<boolean>(() => {
    return localStorage.getItem('pref_dizimos_hide_amounts') === 'true';
  });
  const [dizimosDefaultDestination, setDizimosDefaultDestination] = useState<string>(() => {
    return localStorage.getItem('pref_dizimos_default_destination') || 'Oferta';
  });
  const [studiesFontSize, setStudiesFontSize] = useState<string>(() => {
    return localStorage.getItem('pref_studies_font_size') || 'normal';
  });
  const [studiesDefaultTag, setStudiesDefaultTag] = useState<string>(() => {
    return localStorage.getItem('pref_studies_default_tag') || 'Todos';
  });

  // Unified Notification Preferences Syncer State
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>(() => {
    let defaults = {
      live: true,
      events: true,
      prayers: true,
      cells: true,
      studies: true
    };
    const saved = localStorage.getItem('church_notif_preferences');
    if (saved) {
      try {
        return { ...defaults, ...JSON.parse(saved) };
      } catch (e) {}
    }
    return defaults;
  });

  // Edit user state
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBirthDate, setEditBirthDate] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editMinistry, setEditMinistry] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Quick Registration State (Ficha cadastral de visitante / Novo membro)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regBirth, setRegBirth] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regMinistry, setRegMinistry] = useState('');

  // File Upload Drag & Drop State
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [lastUserId, setLastUserId] = useState<string | null>(null);

  // Initialize edit fields when user is logged in or changed (but do not kick them out of subtab when they are inside)
  useEffect(() => {
    if (user) {
      const uId = user.email || user.name;
      if (lastUserId !== uId) {
        setEditName(user.name || '');
        setEditPhone(user.phone || '');
        setEditBirthDate(user.birthDate || '');
        setEditAddress(user.address || '');
        setEditMinistry(user.ministry || '');
        setEditCategory(user.category || 'Membro Comungante');
        setEditAvatarUrl(user.avatarUrl || '');
        setEditPassword(user.password || '');
        setLastUserId(uId);
        setActiveSubTab('perfil');
      }
    } else {
      setLastUserId(null);
      setActiveSubTab('cadastro');
    }
  }, [user, lastUserId]);

  const handleStartEditing = () => {
    if (user) {
      setEditName(user.name || '');
      setEditPhone(user.phone || '');
      setEditBirthDate(user.birthDate || '');
      setEditAddress(user.address || '');
      setEditMinistry(user.ministry || '');
      setEditCategory(user.category || 'Membro Comungante');
      setEditAvatarUrl(user.avatarUrl || '');
      setEditPassword(user.password || '');
    }
    setActiveSubTab('edit');
  };

  // Handle application sound effects simulation
  const playClickSound = () => {
    if (!soundEffects) return;
    try {
      const actx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.connect(gain);
      gain.connect(actx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, actx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, actx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.04, actx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.08);
      osc.start();
      osc.stop(actx.currentTime + 0.08);
    } catch(e) {}
  };

  // Sound preference setter with side effect audio sound
  const handleToggleSound = () => {
    const nextVal = !soundEffects;
    setSoundEffects(nextVal);
    localStorage.setItem('pref_sound_effects', String(nextVal));
    if (nextVal) {
      setTimeout(() => {
        try {
          const actx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.frequency.setValueAtTime(523.25, actx.currentTime); // C5
          gain.gain.setValueAtTime(0.05, actx.currentTime);
          osc.start();
          osc.stop(actx.currentTime + 0.15);
        } catch(e) {}
      }, 50);
    }
    onShowAlert(nextVal ? "Sons e micro-interações ativados!" : "Sons do aplicativo desativados.");
  };

  // Toggle Dark Mode simulation inside the preview page
  const handleToggleTheme = () => {
    const nextTheme = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(nextTheme);
    localStorage.setItem('pref_theme_mode', nextTheme);
    playClickSound();

    // Toggle global body class or styles
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      onShowAlert("Visual Escuro e Confortável ativado para testes!");
    } else {
      document.documentElement.classList.remove('dark');
      onShowAlert("Tema Claro e Elegante de volta!");
    }
  };

  // Clean local memory data dashboard
  const handleClearAppCache = () => {
    playClickSound();
    if (window.confirm("Isso redefinirá as configurações do aplicativo para os padrões. Deseja continuar?")) {
      localStorage.removeItem('pref_theme_mode');
      localStorage.removeItem('pref_sound_effects');
      localStorage.removeItem('pref_notify_plan');
      localStorage.removeItem('pref_notify_live');
      localStorage.removeItem('pref_notify_prayers');
      onShowAlert("Preferências do dispositivo limpas com sucesso.");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  // Process Avatar File (Base64)
  const handleAvatarFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      onShowAlert("O arquivo precisa ser uma imagem válida!");
      return;
    }
    if (file.size > 1.2 * 1024 * 1024) {
      onShowAlert("Escolha uma imagem menor que 1.2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (base64) {
        setEditAvatarUrl(base64);
        onShowAlert("Sucesso! Imagem carregada e pendente de salvamento.");
        playClickSound();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleAvatarFile(file);
    }
  };

  // Trigger Local Registration of User Profile
  const handleRegisterUser = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();

    const cleanEmail = regEmail.trim().toLowerCase();
    if (!regName.trim()) {
      onShowAlert("Informe o nome completo!");
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      onShowAlert("Informe um endereço de e-mail válido!");
      return;
    }
    if (!regPassword || regPassword.length < 4) {
      onShowAlert("A senha de acesso deve ter pelo menos 4 caracteres!");
      return;
    }

    // Compose custom user
    const newUser: User = {
      name: regName.trim(),
      email: cleanEmail,
      phone: regPhone.trim(),
      password: regPassword,
      category: 'Visitante Frequente',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
      birthDate: regBirth || '1995-01-01',
      address: regAddress.trim(),
      ministry: regMinistry.trim(),
      planCount: 0,
      prayerCount: 0,
      eventCount: 0,
      status: 'Ativo',
      updatedAt: new Date().toISOString()
    };

    onUpdateUser(newUser, cleanEmail);
    onShowAlert(`Cadastro efetuado! Bem-vindo(a), ${newUser.name}.`);
    
    // Clear registration inputs
    setRegName('');
    setRegEmail('');
    setRegPhone('');
    setRegPassword('');
    setRegBirth('');
    setRegAddress('');
    setRegMinistry('');
  };

  // Save changes to User Profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();

    if (!user || !user.email) return;

    if (!editName.trim()) {
      onShowAlert("O nome não pode ficar em branco!");
      return;
    }

    if (!editPhone.trim()) {
      onShowAlert("O campo celular é obrigatório!");
      return;
    }

    if (!editBirthDate || !editBirthDate.trim()) {
      onShowAlert("A data de nascimento é obrigatória!");
      return;
    }

    const payload: Partial<User> = {
      name: editName.trim(),
      phone: editPhone.trim(),
      birthDate: editBirthDate,
      address: editAddress.trim(),
      ministry: editMinistry.trim(),
      category: editCategory,
      avatarUrl: editAvatarUrl,
      password: editPassword
    };

    onUpdateUser(payload, user.email);
    onShowAlert("Dados atualizados com sucesso!");
    setActiveSubTab('perfil');
  };

  // Unified Notification Preferences Syncer Helper
  const updateNotifPref = (key: string, value: boolean) => {
    const nextPrefs = { ...notifPrefs, [key]: value };
    setNotifPrefs(nextPrefs);
    localStorage.setItem('church_notif_preferences', JSON.stringify(nextPrefs));
    onUpdateUser({ notificationPreferences: nextPrefs });
    
    if (key === 'live') {
      setNotificationLive(value);
      localStorage.setItem('pref_notify_live', String(value));
    } else if (key === 'prayers') {
      setNotificationPrayers(value);
      localStorage.setItem('pref_notify_prayers', String(value));
    } else if (key === 'events') {
      setNotificationPlan(value);
      localStorage.setItem('pref_notify_plan', String(value));
    }
  };

  // Clear preferences individual state change sync
  const togglePlanSetting = () => {
    const nextVal = !notificationPlan;
    setNotificationPlan(nextVal);
    localStorage.setItem('pref_notify_plan', String(nextVal));
    updateNotifPref('events', nextVal);
    playClickSound();
    onShowAlert(nextVal ? "Lembretes do plano de leitura ativados." : "Lembretes de leitura desativados.");
  };

  const toggleLiveSetting = () => {
    const nextVal = !notificationLive;
    setNotificationLive(nextVal);
    localStorage.setItem('pref_notify_live', String(nextVal));
    updateNotifPref('live', nextVal);
    playClickSound();
    onShowAlert(nextVal ? "Notificações de transmissões ativadas." : "Notificações de transmissões desativadas.");
  };

  const togglePrayersSetting = () => {
    const nextVal = !notificationPrayers;
    setNotificationPrayers(nextVal);
    localStorage.setItem('pref_notify_prayers', String(nextVal));
    updateNotifPref('prayers', nextVal);
    playClickSound();
    onShowAlert(nextVal ? "Alertas de intercessão recebidos." : "Alertas de intercessão desativados.");
  };

  // Custom adjustments for Cells
  const handleToggleCellsFilterActive = () => {
    const nextVal = !cellsFilterActive;
    setCellsFilterActive(nextVal);
    localStorage.setItem('pref_cells_filter_active', String(nextVal));
    playClickSound();
    onShowAlert(nextVal ? "Filtro inicial de Células: Mostrar apenas ativas." : "Filtro inicial de Células: Mostrar todas as cadastradas.");
  };

  const handleCellsCityFilterChange = (city: string) => {
    setCellsCityFilter(city);
    localStorage.setItem('pref_cells_city_filter', city);
    playClickSound();
    onShowAlert(`Filtro de Cidade inicial definido para: ${city === 'all' ? 'Todas' : city}`);
  };

  // Custom adjustments for Ao Vivo (Live streaming)
  const handleTogglePlayLiveAutoplay = () => {
    const nextVal = !playLiveAutoplay;
    setPlayLiveAutoplay(nextVal);
    localStorage.setItem('pref_play_live_autoplay', String(nextVal));
    playClickSound();
    onShowAlert(nextVal ? "Auto-play de Culto Ao Vivo ativado." : "Auto-play de Culto Ao Vivo desativado.");
  };

  // Custom adjustments for Eventos
  const handleToggleEventsOnlyGoing = () => {
    const nextVal = !eventsOnlyGoing;
    setEventsOnlyGoing(nextVal);
    localStorage.setItem('pref_events_only_going', String(nextVal));
    playClickSound();
    onShowAlert(nextVal ? "Lembretes de Eventos: Filtrar confirmados por padrão." : "Lembretes de Eventos: Mostrar todos por padrão.");
  };

  // Custom adjustments for Orações (Prayer list)
  const handleTogglePrayersAnonymousDefault = () => {
    const nextVal = !prayersAnonymousDefault;
    setPrayersAnonymousDefault(nextVal);
    localStorage.setItem('pref_prayers_anonymous_default', String(nextVal));
    playClickSound();
    onShowAlert(nextVal ? "Suas orações serão encaminhadas como pastoral restrita por padrão." : "Suas orações serão públicas no mural por padrão.");
  };

  const handleTogglePrayersFilterPending = () => {
    const nextVal = !prayersFilterPending;
    setPrayersFilterPending(nextVal);
    localStorage.setItem('pref_prayers_filter_pending', String(nextVal));
    playClickSound();
    onShowAlert(nextVal ? "Aba de Orações: Mostrar minhas e sob intercessão." : "Aba de Orações: Exibir todas as orações.");
  };

  // Custom adjustments for Dízimos (Contributions)
  const handleToggleDizimosHideAmounts = () => {
    const nextVal = !dizimosHideAmounts;
    setDizimosHideAmounts(nextVal);
    localStorage.setItem('pref_dizimos_hide_amounts', String(nextVal));
    playClickSound();
    onShowAlert(nextVal ? "Valores de dízimos serão ocultados por privacidade." : "Valores de dízimos serão exibidos normalmente.");
  };

  const handleDizimosDefaultDestinationChange = (dest: string) => {
    setDizimosDefaultDestination(dest);
    localStorage.setItem('pref_dizimos_default_destination', dest);
    playClickSound();
    onShowAlert(`Destinação de Contribuições favorita definida como: ${dest}`);
  };

  // Custom adjustments for Estudos (Bible studies)
  const handleStudiesFontSizeChange = (size: string) => {
    setStudiesFontSize(size);
    localStorage.setItem('pref_studies_font_size', size);
    playClickSound();
    const labelMap: Record<string, string> = { 'normal': 'Normal', 'large': 'Texto Grande', 'xlarge': 'Texto Extra Grande' };
    onShowAlert(`Modo leitura de Estudos definido: ${labelMap[size] || size}`);
  };

  const handleStudiesDefaultTagChange = (tag: string) => {
    setStudiesDefaultTag(tag);
    localStorage.setItem('pref_studies_default_tag', tag);
    playClickSound();
    onShowAlert(`Tag inicial favorita do Estudos definida como: ${tag}`);
  };

  const computedCargos = cargos && cargos.length > 0 ? cargos : [
    'Pastor / Presbítero', 
    'Coordenador / Admin', 
    'Membro Comungante', 
    'Visitante Frequente', 
    'Diácono / Cooperador'
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-6 py-6 pb-28 animate-fade-in text-slate-800" id="perfil-viewport">
      
      {/* Upper Navigation Tabs */}
      <div className="flex bg-[#001939]/5 p-1 rounded-2xl gap-1 mb-6 border border-slate-200/50" id="perfil-sub-tabs">
        {user ? (
          <>
            <button
              id="subtab-perfil"
              onClick={() => { playClickSound(); setActiveSubTab('perfil'); }}
              className={`flex-1 py-3 text-xs md:text-sm font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeSubTab === 'perfil'
                  ? 'bg-[#002D5E] text-white shadow-md'
                  : 'text-[#002D5E] hover:bg-white/50'
              }`}
            >
              <UserIcon className="w-4 h-4 shrink-0" />
              <span>Meu Painel</span>
            </button>

            <button
              id="subtab-edit"
              onClick={() => { playClickSound(); handleStartEditing(); }}
              className={`flex-1 py-3 text-xs md:text-sm font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeSubTab === 'edit'
                  ? 'bg-[#002D5E] text-white shadow-md'
                  : 'text-[#002D5E] hover:bg-white/50'
              }`}
            >
              <Edit2 className="w-3.5 h-3.5 shrink-0" />
              <span>Editar Cadastro</span>
            </button>
          </>
        ) : (
          <button
            id="subtab-cadastro"
            onClick={() => { playClickSound(); setActiveSubTab('cadastro'); }}
            className={`flex-1 py-3 text-xs md:text-sm font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeSubTab === 'cadastro'
                ? 'bg-[#002D5E] text-white shadow-md'
                : 'text-[#002D5E] hover:bg-white/50'
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0 text-amber-500 animate-pulse" />
            <span>Ficha de Cadastro</span>
          </button>
        )}

        <button
          id="subtab-preferencias"
          onClick={() => { playClickSound(); setActiveSubTab('preferencias'); }}
          className={`flex-1 py-3 text-xs md:text-sm font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeSubTab === 'preferencias'
              ? 'bg-[#002D5E] text-white shadow-md'
              : 'text-[#002D5E] hover:bg-white/50'
          }`}
        >
          <Volume2 className="w-4 h-4 shrink-0" />
          <span>Opções & Sons</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        
        {/* TAB 1: MEU PAINEL (SUMMARY & STATS) */}
        {activeSubTab === 'perfil' && user && (
          <motion.div
            key="perfil-resumo"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
            id="perfil-dashboard"
          >
            {/* Header Identity Card - Inspired by Image 3 */}
            <div className="flex flex-col items-center py-6 space-y-4" id="perfil-header-identity">
              <div className="relative group">
                <img 
                  src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'} 
                  alt={user.name} 
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl ring-1 ring-slate-100"
                />
              </div>

              <div className="text-center space-y-1">
                <h2 className="text-3xl font-black text-[#001939] tracking-tight">{user.name}</h2>
                <div className="flex flex-wrap items-center justify-center gap-1.5 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 max-w-xs mx-auto">
                  <span>{user.category || 'MEMBRO'}</span>
                  {user.ministry && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span>{user.ministry.toUpperCase()}</span>
                    </>
                  )}
                  <span className="text-slate-300">•</span>
                  <span className="text-emerald-600">MEMBRO ATIVO</span>
                </div>
              </div>
            </div>

            {/* Stats Panel - Inspired by Image 3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="perfil-stats-cards">
              {/* Devocional / Leitura */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-900">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-2xl font-black text-slate-900 block leading-none">12</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Dias de Leitura Devocional</span>
                </div>
              </div>

              {/* Orações */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-rose-500">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-2xl font-black text-slate-900 block leading-none">{userPrayersCount}</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Pedidos de Oração Ativos</span>
                </div>
              </div>

              {/* Eventos */}
              <div className="bg-[#002D5E] p-5 rounded-3xl border border-[#001939] shadow-lg flex items-center gap-4 col-span-1 md:col-span-2">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-2xl font-black text-white block leading-none">{userEventsCount}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-sky-200 block">Eventos Confirmados</span>
                </div>
              </div>
            </div>

            {/* Ficha de Membro Card - Inspired by Image 2 */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-6 shadow-sm" id="card-ficha-membro">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 text-[#002D5E] flex items-center justify-center shadow-sm">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-black text-[#001939] uppercase tracking-tight">Ficha de Membro</h3>
                </div>
                <span className="px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-[9px] font-black uppercase tracking-widest text-emerald-600">
                  Cadastro Ativo
                </span>
              </div>

              <div className="space-y-5 px-1">
                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-[#002D5E] shrink-0 border border-indigo-100">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">E-mail</span>
                    <span className="text-sm font-bold text-slate-800 break-all">{user.email}</span>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-[#002D5E] shrink-0 border border-indigo-100">
                    <Volume2 className="w-5 h-5 rotate-90" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Telefone / WhatsApp</span>
                    <span className="text-sm font-bold text-slate-800">{user.phone || 'Gere no seu perfil'}</span>
                  </div>
                </div>

                {/* Birth Date */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-[#002D5E] shrink-0 border border-indigo-100">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Data de Nascimento</span>
                    <span className="text-sm font-bold text-slate-800">
                      {user.birthDate && user.birthDate !== 'Não Informada' ? (
                        new Date(user.birthDate + 'T00:00:00').toLocaleDateString('pt-BR')
                      ) : 'Não informada'}
                    </span>
                  </div>
                </div>

                {/* Ministry */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-[#002D5E] shrink-0 border border-indigo-100">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Área / Ministério</span>
                    <span className="text-sm font-bold text-slate-800">{user.ministry || 'Aguardando vinculação'}</span>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-[#002D5E] shrink-0 border border-indigo-100">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Endereço Residencial</span>
                    <span className="text-sm font-bold text-slate-800">{user.address || 'Não cadastrado'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation List - Inspired by Image 1 */}
            <div className="bg-white rounded-3xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden shadow-sm" id="perfil-nav-list">
              
              {/* Admin Access Panel */}
              {(user.category?.includes('Pastor') || user.category?.includes('Admin') || user.category?.includes('Coordenador')) && (
                <button 
                  onClick={() => onNavigate('admin')}
                  className="w-full p-5 flex items-center gap-4 hover:bg-slate-50 transition-colors group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#001939] text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="text-sm font-black text-[#001939] tracking-tight">Logar como ADMINISTRADOR 🛠️</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acesso ao Painel Master e Clero</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-amber-500" />
                </button>
              )}

              {/* Contributions */}
              <button 
                onClick={() => onNavigate('dizimos')}
                className="w-full p-5 flex items-center gap-4 hover:bg-slate-50 transition-colors group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#002D5E] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Coins className="w-6 h-6" />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="text-sm font-black text-[#001939] tracking-tight">Minhas Contribuições</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{userContributionsCount} registros recentes</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </button>

              {/* Prayer History */}
              <button 
                onClick={() => onNavigate('oracao')}
                className="w-full p-5 flex items-center gap-4 hover:bg-slate-50 transition-colors group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Activity className="w-6 h-6" />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="text-sm font-black text-[#001939] tracking-tight">Histórico / Controle de Oração</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{userPrayersCount} pedidos registrados</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </button>

              {/* Courses & Studies */}
              <button 
                onClick={() => onNavigate('estudos')}
                className="w-full p-5 flex items-center gap-4 hover:bg-slate-50 transition-colors group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-slate-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <UserIcon className="w-6 h-6" />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="text-sm font-black text-[#001939] tracking-tight">Meus Cursos e Estudos</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acesse conteúdos exclusivos</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </button>

              {/* Notifications */}
              <button 
                onClick={() => setActiveSubTab('preferencias')}
                className="w-full p-5 flex items-center gap-4 hover:bg-slate-50 transition-colors group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Bell className="w-6 h-6" />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="text-sm font-black text-[#001939] tracking-tight">Configurações de Notificações</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gerencie seus avisos e alertas</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </button>

              {/* Visual Settings */}
              <div className="w-full p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-slate-700 flex items-center justify-center">
                  <Moon className="w-6 h-6" />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="text-sm font-black text-[#001939] tracking-tight">Ajustes Visuais</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{themeMode === 'light' ? 'Tema Claro Ativo' : 'Tema Escuro Ativo'}</p>
                </div>
                <button 
                  onClick={handleToggleTheme}
                  className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${themeMode === 'dark' ? 'bg-[#001939]' : 'bg-slate-200'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${themeMode === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Security */}
              <button 
                onClick={() => handleStartEditing()}
                className="w-full p-5 flex items-center gap-4 hover:bg-slate-50 transition-colors group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-slate-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Lock className="w-6 h-6" />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="text-sm font-black text-[#001939] tracking-tight">Segurança e Senha</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Altere seu acesso e credenciais</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </button>
            </div>

            {/* Logout Action */}
            <div className="pt-4 px-2">
              <button
                onClick={onLogout}
                className="w-full py-4 border-2 border-rose-100 rounded-3xl text-rose-500 font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-rose-50 transition-colors cursor-pointer active:scale-[0.98]"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair da Conta</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* TAB 2: EDITAR CADASTRO (EDIT USER DATA) */}
        {activeSubTab === 'edit' && user && (
          <motion.div
            key="perfil-edit"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            id="perfil-editor-section"
          >
            <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl border border-slate-200/80 p-5 md:p-8 space-y-6">
              
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-[#002D5E] uppercase tracking-tight">Editar Meus Dados</h3>
                  <p className="text-[11px] text-slate-400 font-semibold">Mantenha sua ficha ministerial e cadastral atualizada no portal.</p>
                </div>
                <button
                  type="button"
                  id="btn-abort-edit"
                  onClick={() => { playClickSound(); setActiveSubTab('perfil'); }}
                  className="p-2 border border-slate-200 rounded-full hover:bg-slate-50 text-slate-500 hover:text-slate-700 cursor-pointer text-xs"
                >
                  Voltar
                </button>
              </div>

              {/* Avatar Photo Edit Suite with Drag-and-Drop */}
              <div className="space-y-3" id="profile-picture-suite">
                <label className="block text-[10px] font-black text-[#001939] uppercase tracking-wider">Foto do Perfil (Arraste um arquivo ou Clique abaixo)</label>
                
                <div className="flex flex-col md:flex-row items-center gap-6">
                  {/* Current Preview */}
                  <div className="relative">
                    <img 
                      src={editAvatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'} 
                      alt="Avatar Preview" 
                      className="w-24 h-24 rounded-full object-cover border-4 border-[#002D5E]/20 bg-slate-100 object-center shrink-0" 
                    />
                    {editAvatarUrl && (
                      <button
                        type="button"
                        id="btn-remove-avatar-url"
                        onClick={() => { playClickSound(); setEditAvatarUrl(''); }}
                        className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-650 text-white p-1 rounded-full shadow-md cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95"
                        title="Remover Foto"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Drag-and-drop & Manual select interface */}
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`flex-1 border-2 border-dashed rounded-2xl p-4 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-1.5 ${
                      isDragging 
                        ? 'border-[#002D5E] bg-[#002D5E]/5 scale-[0.99] ring-2 ring-[#002D5E]/10' 
                        : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
                    }`}
                    onClick={() => { playClickSound(); fileInputRef.current?.click(); }}
                  >
                    <Upload className={`w-6 h-6 ${isDragging ? 'text-[#002D5E] animate-bounce' : 'text-slate-400'}`} />
                    <p className="text-xs font-bold text-slate-600">Arraste uma foto aqui ou toque para selecionar</p>
                    <p className="text-[10px] text-slate-400 font-semibold">Tamanho máximo: 1.2MB (PNG, JPG o JPEG)</p>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      id="file_avatar_upload"
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => { const file = e.target.files?.[0]; if (file) handleAvatarFile(file); }}
                    />
                  </div>
                </div>

                {/* Preset Avatars Selection horizontal panel */}
                <div className="space-y-1.5 pt-2">
                  <span className="block text-[10px] font-bold text-slate-500">Ou utilize um de nossos avatares de amostras:</span>
                  <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar" id="avatar-sample-carousel">
                    {PRESET_AVATARS.map((avatar) => {
                      const isSelected = editAvatarUrl === avatar.url;
                      return (
                        <button
                          key={avatar.id}
                          type="button"
                          onClick={() => { playClickSound(); setEditAvatarUrl(avatar.url); }}
                          className={`relative rounded-full shrink-0 transition-all active:scale-95 cursor-pointer flex items-center justify-center border-2 ${
                            isSelected 
                              ? 'border-[#002D5E] scale-102 ring-3 ring-[#002D5E]/10' 
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <img src={avatar.url} alt={avatar.name} className="w-10 h-10 rounded-full object-cover" />
                          {isSelected && (
                            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-0.5 rounded-full border border-white">
                              <Check className="w-2.5 h-2.5 font-bold" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Form Input Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label htmlFor="edit_name" className="block text-[10px] font-black text-[#001939] uppercase tracking-wider">Nome Completo</label>
                  <input
                    type="text"
                    id="edit_name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#002D5E] bg-slate-50 hover:bg-slate-50/50"
                    placeholder="Ex: Fábio Nunes"
                    required
                  />
                </div>

                <div className="space-y-1 opacity-60 cursor-not-allowed">
                  <label htmlFor="edit_email_disabled" className="block text-[10px] font-black text-[#001939] uppercase tracking-wider">E-mail (Inalterável)</label>
                  <input
                    type="email"
                    id="edit_email_disabled"
                    value={user.email}
                    disabled
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-150 text-slate-550"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="edit_phone" className="block text-[10px] font-black text-[#001939] uppercase tracking-wider">Telefone Celular</label>
                  <input
                    type="text"
                    id="edit_phone"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#002D5E] bg-slate-50 hover:bg-slate-50/50"
                    placeholder="Ex: (11) 99999-7777"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="edit_birth" className="block text-[10px] font-black text-[#001939] uppercase tracking-wider">Data de Nascimento</label>
                  <input
                    type="date"
                    id="edit_birth"
                    value={editBirthDate}
                    onChange={(e) => setEditBirthDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#002D5E] bg-slate-50 hover:bg-slate-50/50"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="edit_category" className="block text-[10px] font-black text-[#001939] uppercase tracking-wider">Cargo / Papel na Igreja</label>
                  <select
                    id="edit_category"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#002D5E] bg-slate-50 hover:bg-slate-50/50"
                  >
                    {computedCargos.map((cargo) => (
                      <option key={cargo} value={cargo}>{cargo}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="edit_ministry" className="block text-[10px] font-black text-[#001939] uppercase tracking-wider">Ministério / Equipe de Trabalho</label>
                  <input
                    type="text"
                    id="edit_ministry"
                    value={editMinistry}
                    onChange={(e) => setEditMinistry(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#002D5E] bg-slate-50 hover:bg-slate-50/50"
                    placeholder="Ex: Diaconato, Comunicação, Louvor, etc."
                  />
                </div>

                <div className="col-span-1 md:col-span-2 space-y-1">
                  <label htmlFor="edit_address" className="block text-[10px] font-black text-[#001939] uppercase tracking-wider">Endereço de Residência</label>
                  <input
                    type="text"
                    id="edit_address"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#002D5E] bg-slate-50 hover:bg-slate-50/50"
                    placeholder="Ex: Av. Copacabana, 500 - Alphaville"
                  />
                </div>

                {/* Secure password edit box */}
                <div className="col-span-1 md:col-span-2 border-t border-slate-100 pt-3 space-y-2">
                  <label htmlFor="edit_password" className="block text-[10px] font-black text-[#001939] uppercase tracking-wider flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Alterar Minha Senha</span>
                  </label>
                  
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="edit_password"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#002D5E] bg-slate-50 pr-24"
                      placeholder="Insira sua nova senha"
                    />
                    <button
                      type="button"
                      id="btn-eye-toggle-edit"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 px-2 py-1 text-[10px] font-black uppercase text-slate-400 bg-slate-200/55 rounded hover:bg-slate-200 cursor-pointer"
                    >
                      {showPassword ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>
                </div>

              </div>

              {/* Form trigger submit control */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3" id="form-save-actions">
                <button
                  type="button"
                  id="btn-cancel-profile-changes"
                  onClick={() => { playClickSound(); setActiveSubTab('perfil'); }}
                  className="px-5 py-2.5 border border-slate-250 text-slate-500 rounded-full text-xs font-black uppercase tracking-wider hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="btn-submit-profile-changes"
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Dados</span>
                </button>
              </div>

            </form>
          </motion.div>
        )}

        {/* TAB 3: CADASTRO INICIAL (QUICK REGISTER FORM FOR VISITORS) */}
        {activeSubTab === 'cadastro' && !user && (
          <motion.div
            key="perfil-guest-enrollment"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            id="perfil-registration-portal"
          >
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 md:p-8 space-y-6">
              
              <div className="text-center space-y-2 max-w-lg mx-auto" id="registration-header">
                <div className="w-12 h-12 rounded-full bg-[#001939]/5 text-[#001939] flex items-center justify-center mx-auto ring-4 ring-slate-100 mb-2">
                  <HeartHandshake className="w-6 h-6 text-[#002D5E]" />
                </div>
                <h3 className="text-base font-black text-[#002D5E] uppercase tracking-tight">Ficha de Visitante & Membros</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  Ainda não possui uma conta? Digite seus dados básicos abaixo para registrar sua ficha no aplicativo instantaneamente!
                </p>
              </div>

              <form onSubmit={handleRegisterUser} className="space-y-5 pt-2">
                <div className="grid grid-cols-1 gap-4">
                  
                  {/* Name field */}
                  <div className="space-y-1.5">
                    <label htmlFor="reg_name" className="block text-[10px] font-black text-[#001939] uppercase tracking-wider pl-1">Nome Completo *</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        id="reg_name"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#002D5E] bg-white transition-all shadow-sm"
                        placeholder="Nome e Sobrenome"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Email field */}
                    <div className="space-y-1.5">
                      <label htmlFor="reg_email" className="block text-[10px] font-black text-[#001939] uppercase tracking-wider pl-1">E-mail de Login *</label>
                      <div className="relative">
                        <Volume2 className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 rotate-90" /> {/* Using Volume as mail icon placeholder if mail icon is not imported or different, but User want Lucide so user-mail icons */}
                        <UserIcon className="hidden" /> {/* just to keep context */}
                        <div className="absolute left-4 top-3.5 text-slate-400">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                        </div>
                        <input
                          type="email"
                          id="reg_email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#002D5E] bg-white transition-all shadow-sm"
                          placeholder="seu@email.com"
                          required
                        />
                      </div>
                    </div>

                    {/* Phone field */}
                    <div className="space-y-1.5">
                      <label htmlFor="reg_phone" className="block text-[10px] font-black text-[#001939] uppercase tracking-wider pl-1">Celular / WhatsApp *</label>
                      <div className="relative">
                        <div className="absolute left-4 top-3.5 text-slate-400">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        </div>
                        <input
                          type="text"
                          id="reg_phone"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#002D5E] bg-white transition-all shadow-sm"
                          placeholder="(00) 00000-0000"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Birth Date field */}
                    <div className="space-y-1.5">
                      <label htmlFor="reg_birth" className="block text-[10px] font-black text-[#001939] uppercase tracking-wider pl-1">Data de Nascimento *</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                        <input
                          type="date"
                          id="reg_birth"
                          value={regBirth}
                          onChange={(e) => setRegBirth(e.target.value)}
                          className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#002D5E] bg-white transition-all shadow-sm"
                          required
                        />
                      </div>
                    </div>

                    {/* Password field */}
                    <div className="space-y-1.5">
                      <label htmlFor="reg_pwd" className="block text-[10px] font-black text-[#001939] uppercase tracking-wider pl-1">Criar Senha de Acesso *</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                        <input
                          type="password"
                          id="reg_pwd"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#002D5E] bg-white transition-all shadow-sm"
                          placeholder="Mínimo 4 dígitos"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address field */}
                  <div className="space-y-1.5">
                    <label htmlFor="reg_address" className="block text-[10px] font-black text-[#001939] uppercase tracking-wider pl-1">Endereço Residencial *</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        id="reg_address"
                        value={regAddress}
                        onChange={(e) => setRegAddress(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#002D5E] bg-white transition-all shadow-sm"
                        placeholder="Rua, número, bairro e cidade"
                        required
                      />
                    </div>
                  </div>

                  {/* Ministry field */}
                  <div className="space-y-1.5">
                    <label htmlFor="reg_ministry" className="block text-[10px] font-black text-[#001939] uppercase tracking-wider pl-1">Área / Ministério para servir *</label>
                    <div className="relative">
                      <Layers className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        id="reg_ministry"
                        value={regMinistry}
                        onChange={(e) => setRegMinistry(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#002D5E] bg-white transition-all shadow-sm"
                        placeholder="Ex: Louvor, Mídias, Infantil, etc."
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:justify-between items-center gap-6">
                  <p className="text-[11px] text-[#002D5E] font-black cursor-pointer flex items-center gap-1.5 hover:underline decoration-2 underline-offset-4" onClick={() => onNavigate('login')}>
                    <span>Já possui uma conta existente? Faça login aqui!</span>
                    <ChevronRight className="w-4 h-4 shrink-0" />
                  </p>
                  
                  <button
                    type="submit"
                    id="btn-register-user-submit"
                    className="w-full sm:w-auto px-10 py-4 bg-[#002D5E] hover:bg-[#001939] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200/50 active:scale-95 transition-all text-center cursor-pointer"
                  >
                    Registrar Ficha 🚀
                  </button>
                </div>
              </form>

            </div>
          </motion.div>
        )}

        {/* TAB 4: CONFIGURAÇÕES E SONS (PREFERENCES DASHBOARD) */}
        {activeSubTab === 'preferencias' && (
          <motion.div
            key="perfil-pref-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            id="perfil-app-config-view"
            className="space-y-6"
          >
            {/* Header Identity Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 md:p-8 space-y-2">
              <h3 className="text-base font-black text-[#002D5E] uppercase tracking-tight">Painel de Preferências & Ajustes</h3>
              <p className="text-[11px] text-slate-400 font-semibold">Customize o comportamento e as opções de todas as telas do aplicativo nos mínimos detalhes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* 1. GERAL & APARÊNCIA */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 space-y-4" id="pref-cat-geral">
                <span className="block text-[10px] font-black text-[#001939] uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <Layers className="w-4 h-4 text-sky-600" />
                  <span>Configurações Gerais</span>
                </span>
                
                <div className="space-y-4">
                  {/* Theme Mode */}
                  <div className="flex items-center justify-between gap-4 text-xs">
                    <div className="space-y-0.5">
                      <span className="font-extrabold text-[#001939] block">Visual do Aplicativo</span>
                      <p className="text-[10px] text-slate-400 font-semibold">Alterne entre o tema padrão claro e o modo noturno confortável.</p>
                    </div>
                    <button
                      type="button"
                      id="btn-theme-switcher"
                      onClick={handleToggleTheme}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-250 hover:bg-slate-100 text-[#002D5E] text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {themeMode === 'light' ? 'Modo Noturno' : 'Modo Claro'}
                    </button>
                  </div>

                  {/* Sound Effects */}
                  <div className="flex items-center justify-between gap-4 text-xs pt-1">
                    <div className="space-y-0.5">
                      <span className="font-extrabold text-[#001939] block">Sons do Portal</span>
                      <p className="text-[10px] text-slate-400 font-semibold">Efeitos sonoros harmônicos e de cliques ao navegar no app.</p>
                    </div>
                    <button
                      type="button"
                      id="btn-sound-effects-toggle"
                      onClick={handleToggleSound}
                      className={`w-11 h-6 rounded-full py-0.5 px-0.5 transition-colors duration-200 relative focus:outline-none shrink-0 cursor-pointer ${
                        soundEffects ? 'bg-emerald-500' : 'bg-slate-250'
                      }`}
                    >
                      <div className={`bg-white w-5 h-5 rounded-full shadow-xs transform transition-transform duration-200 ${
                        soundEffects ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. CÉLULAS PERTO DE VOCÊ */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 space-y-4" id="pref-cat-celulas">
                <span className="block text-[10px] font-black text-[#001939] uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Menu: Células e Grupos</span>
                </span>
                
                <div className="space-y-4">
                  {/* Filter Active Default */}
                  <div className="flex items-center justify-between gap-4 text-xs">
                    <div className="space-y-0.5">
                      <span className="font-extrabold text-[#001939] block">Exibir Apenas Ativas</span>
                      <p className="text-[10px] text-slate-400 font-semibold">Mostrar por padrão apenas pequenos grupos com reuniões ativas na busca.</p>
                    </div>
                    <button
                      type="button"
                      id="opt-toggle-cells-filter"
                      onClick={handleToggleCellsFilterActive}
                      className={`w-11 h-6 rounded-full py-0.5 px-0.5 transition-colors duration-200 relative focus:outline-none shrink-0 cursor-pointer ${
                        cellsFilterActive ? 'bg-emerald-500' : 'bg-slate-250'
                      }`}
                    >
                      <div className={`bg-white w-5 h-5 rounded-full shadow-xs transform transition-transform duration-200 ${
                        cellsFilterActive ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Starting City Selector */}
                  <div className="flex flex-col gap-1 text-xs pt-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[#001939]">Cidade de Partida Padrão</span>
                      <select
                        id="opt-cells-city-select"
                        value={cellsCityFilter}
                        onChange={(e) => handleCellsCityFilterChange(e.target.value)}
                        className="px-2.5 py-1 text-[10px] font-extrabold text-[#002D5E] border border-slate-200 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#002D5E] bg-white cursor-pointer"
                      >
                        <option value="all">Todas as Cidades</option>
                        <option value="Cabo Frio">Cabo Frio</option>
                        <option value="São Pedro">São Pedro</option>
                        <option value="Arraial do Cabo">Arraial do Cabo</option>
                        <option value="Búzios">Búzios</option>
                      </select>
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold">Altere para filtrar as células desta cidade por padrão ao acessar a aba correspondente.</p>
                  </div>
                </div>
              </div>

              {/* 3. AO VIVO (CULTO ONLINE) */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 space-y-4" id="pref-cat-aovivo">
                <span className="block text-[10px] font-black text-[#001939] uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <Video className="w-4 h-4 text-red-600" />
                  <span>Menu: Culto Ao Vivo</span>
                </span>
                
                <div className="space-y-4">
                  {/* Autoplay player */}
                  <div className="flex items-center justify-between gap-4 text-xs">
                    <div className="space-y-0.5">
                      <span className="font-extrabold text-[#001939] block">Auto-play de Transmissão</span>
                      <p className="text-[10px] text-slate-400 font-semibold">Iniciar áudio/vídeo automaticamente assim que abrir a tela Ao Vivo.</p>
                    </div>
                    <button
                      type="button"
                      id="opt-toggle-live-autoplay"
                      onClick={handleTogglePlayLiveAutoplay}
                      className={`w-11 h-6 rounded-full py-0.5 px-0.5 transition-colors duration-200 relative focus:outline-none shrink-0 cursor-pointer ${
                        playLiveAutoplay ? 'bg-red-500' : 'bg-slate-250'
                      }`}
                    >
                      <div className={`bg-white w-5 h-5 rounded-full shadow-xs transform transition-transform duration-200 ${
                        playLiveAutoplay ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Cultos ao vivo alerts */}
                  <div className="flex items-center justify-between gap-4 text-xs pt-1">
                    <div className="space-y-0.5">
                      <span className="font-extrabold text-[#001939] block">Alertas de Novas Lives</span>
                      <p className="text-[10px] text-slate-400 font-semibold">Notificar-me no browser quando uma transmissão tiver início no templo.</p>
                    </div>
                    <button
                      type="button"
                      id="opt-toggle-notif-live"
                      onClick={toggleLiveSetting}
                      className={`w-11 h-6 rounded-full py-0.5 px-0.5 transition-colors duration-200 relative focus:outline-none shrink-0 cursor-pointer ${
                        notificationLive ? 'bg-red-500' : 'bg-slate-250'
                      }`}
                    >
                      <div className={`bg-white w-5 h-5 rounded-full shadow-xs transform transition-transform duration-200 ${
                        notificationLive ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* 4. ORAÇÕES (MURAL) */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 space-y-4" id="pref-cat-oracoes">
                <span className="block text-[10px] font-black text-[#001939] uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <HeartHandshake className="w-4 h-4 text-indigo-600" />
                  <span>Menu: Mural de Orações</span>
                </span>
                
                <div className="space-y-4">
                  {/* Anonymous/Pastoral default */}
                  <div className="flex items-center justify-between gap-4 text-xs">
                    <div className="space-y-0.5">
                      <span className="font-extrabold text-[#001939] block">Pedir Oração com Sigilo</span>
                      <p className="text-[10px] text-slate-400 font-semibold font-medium">Deixar opção de visibilidade como "Pastoral Restrito" por padrão no formulário.</p>
                    </div>
                    <button
                      type="button"
                      id="opt-toggle-prayers-sigilo"
                      onClick={handleTogglePrayersAnonymousDefault}
                      className={`w-11 h-6 rounded-full py-0.5 px-0.5 transition-colors duration-200 relative focus:outline-none shrink-0 cursor-pointer ${
                        prayersAnonymousDefault ? 'bg-indigo-600' : 'bg-slate-250'
                      }`}
                    >
                      <div className={`bg-white w-5 h-5 rounded-full shadow-xs transform transition-transform duration-200 ${
                        prayersAnonymousDefault ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Pre-filter personal requests list */}
                  <div className="flex items-center justify-between gap-4 text-xs pt-1">
                    <div className="space-y-0.5">
                      <span className="font-extrabold text-[#001939] block">Mural Padrão 'Minhas Orações'</span>
                      <p className="text-[10px] text-slate-400 font-semibold font-medium">Exibir a aba contendo exclusivamente seus pedidos favoritos primeiro.</p>
                    </div>
                    <button
                      type="button"
                      id="opt-toggle-prayers-myrequests"
                      onClick={handleTogglePrayersFilterPending}
                      className={`w-11 h-6 rounded-full py-0.5 px-0.5 transition-colors duration-200 relative focus:outline-none shrink-0 cursor-pointer ${
                        prayersFilterPending ? 'bg-indigo-600' : 'bg-slate-250'
                      }`}
                    >
                      <div className={`bg-white w-5 h-5 rounded-full shadow-xs transform transition-transform duration-200 ${
                        prayersFilterPending ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* 5. DÍZIMOS & OFERTAS */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 space-y-4" id="pref-cat-dizimos">
                <span className="block text-[10px] font-black text-[#001939] uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <Coins className="w-4 h-4 text-amber-600" />
                  <span>Menu: Dízimos & Ofertas</span>
                </span>
                
                <div className="space-y-4">
                  {/* Hide Amounts */}
                  <div className="flex items-center justify-between gap-4 text-xs">
                    <div className="space-y-0.5">
                      <span className="font-extrabold text-[#001939] block">Ocultar Valores Financeiros</span>
                      <p className="text-[10px] text-slate-400 font-semibold font-medium">Ocultar valores reais em público (Ex: R$ ••••) no painel de doações locais.</p>
                    </div>
                    <button
                      type="button"
                      id="opt-toggle-dizimos-hideamounts"
                      onClick={handleToggleDizimosHideAmounts}
                      className={`w-11 h-6 rounded-full py-0.5 px-0.5 transition-colors duration-200 relative focus:outline-none shrink-0 cursor-pointer ${
                        dizimosHideAmounts ? 'bg-amber-500' : 'bg-slate-250'
                      }`}
                    >
                      <div className={`bg-white w-5 h-5 rounded-full shadow-xs transform transition-transform duration-200 ${
                        dizimosHideAmounts ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Default Destination Select */}
                  <div className="flex flex-col gap-1 text-xs pt-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[#001939]">Destinação Favorita</span>
                      <select
                        id="opt-dizimos-default-dest"
                        value={dizimosDefaultDestination}
                        onChange={(e) => handleDizimosDefaultDestinationChange(e.target.value)}
                        className="px-2.5 py-1 text-[10px] font-extrabold text-amber-600 border border-slate-250 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white cursor-pointer"
                      >
                        <option value="Dízimo">Dízimo Regular</option>
                        <option value="Oferta">Oferta Voluntária</option>
                        <option value="Missões">Fundo Missionário</option>
                        <option value="Obra Social">Ação e Obra Social</option>
                      </select>
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold font-medium">Pre-selecionar o tipo de doação favorita ao abrir o portal de dízimos.</p>
                  </div>
                </div>
              </div>

              {/* 6. ESTUDOS & LIÇÕES */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 space-y-4" id="pref-cat-estudos">
                <span className="block text-[10px] font-black text-[#001939] uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <BookOpen className="w-4 h-4 text-violet-600" />
                  <span>Menu: Estudos & Lições</span>
                </span>
                
                <div className="space-y-4">
                  {/* Reading Font Size selector */}
                  <div className="flex flex-col gap-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[#001939]">Tamanho de Letra de Leitura</span>
                      <select
                        id="opt-studies-font-size"
                        value={studiesFontSize}
                        onChange={(e) => handleStudiesFontSizeChange(e.target.value)}
                        className="px-2.5 py-1 text-[10px] font-extrabold text-violet-600 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500 bg-white cursor-pointer"
                      >
                        <option value="normal">Normal (Padrão)</option>
                        <option value="large">Grande (Acessível)</option>
                        <option value="xlarge font-black">Extra Grande</option>
                      </select>
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold font-medium">Ajuste o tamanho do texto para conforto visual nas lições bíblicas.</p>
                  </div>

                  {/* Default Tag filter selector */}
                  <div className="flex flex-col gap-1 text-xs pt-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[#001939]">Tag das Lições Padrão</span>
                      <select
                        id="opt-studies-default-tag"
                        value={studiesDefaultTag}
                        onChange={(e) => handleStudiesDefaultTagChange(e.target.value)}
                        className="px-2.5 py-1 text-[10px] font-extrabold text-violet-600 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500 bg-white cursor-pointer"
                      >
                        <option value="Todos">Todas as Lições</option>
                        <option value="Teologia">Teologia</option>
                        <option value="Sermões">Sermões</option>
                        <option value="Bíblia">Bíblia</option>
                        <option value="Devocional">Devocional</option>
                      </select>
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold font-medium">Selecione para carregar esta categoria favorita de estudos por padrão.</p>
                  </div>
                </div>
              </div>

              {/* 7. EVENTOS & ATIVIDADES */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 space-y-4 md:col-span-2" id="pref-cat-eventos">
                <span className="block text-[10px] font-black text-[#001939] uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  <span>Menu: Eventos & Atividades Gerais</span>
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Event Filter Default only going */}
                  <div className="flex items-center justify-between gap-4 text-xs">
                    <div className="space-y-0.5">
                      <span className="font-extrabold text-[#001939] block">Exibir Apenas Confirmados</span>
                      <p className="text-[10px] text-slate-400 font-semibold font-medium">Opção padrão de filtrar do painel para apenas eventos com inscrição ativa.</p>
                    </div>
                    <button
                      type="button"
                      id="opt-toggle-events-onlygoing"
                      onClick={handleToggleEventsOnlyGoing}
                      className={`w-11 h-6 rounded-full py-0.5 px-0.5 transition-colors duration-200 relative focus:outline-none shrink-0 cursor-pointer ${
                        eventsOnlyGoing ? 'bg-indigo-500' : 'bg-slate-250'
                      }`}
                    >
                      <div className={`bg-white w-5 h-5 rounded-full shadow-xs transform transition-transform duration-200 ${
                        eventsOnlyGoing ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Reading plan notification alert toggle */}
                  <div className="flex items-center justify-between gap-4 text-xs">
                    <div className="space-y-0.5">
                      <span className="font-extrabold text-[#001939] block font-extrabold">Notificações de Esboços & Agenda</span>
                      <p className="text-[10px] text-slate-400 font-semibold font-medium">Lembretes matutinos automáticos dos novos eventos cadastrados no app.</p>
                    </div>
                    <button
                      type="button"
                      id="opt-toggle-plan-agenda"
                      onClick={togglePlanSetting}
                      className={`w-11 h-6 rounded-full py-0.5 px-0.5 transition-colors duration-200 relative focus:outline-none shrink-0 cursor-pointer ${
                        notificationPlan ? 'bg-[#002D5E]' : 'bg-slate-250'
                      }`}
                    >
                      <div className={`bg-white w-5 h-5 rounded-full shadow-xs transform transition-transform duration-200 ${
                        notificationPlan ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Configurações de Notificações */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 space-y-4 md:col-span-2" id="pref-cat-notifications">
                <span className="block text-[10px] font-black text-[#001939] uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <Bell className="w-4 h-4 text-indigo-600" />
                  <span>Configurações de Notificações</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: 'live', label: 'Cultos Ao Vivo' },
                    { key: 'events', label: 'Eventos' },
                    { key: 'prayers', label: 'Orações' },
                    { key: 'cells', label: 'Células' },
                    { key: 'studies', label: 'Estudos' }
                  ].map((item) => (
                    <div className="flex items-center justify-between gap-4 text-xs" key={item.key}>
                      <span className="font-extrabold text-[#001939]">{item.label}</span>
                      <button
                        type="button"
                        onClick={() => updateNotifPref(item.key, !notifPrefs[item.key])}
                        className={`w-11 h-6 rounded-full py-0.5 px-0.5 transition-colors duration-200 relative ${notifPrefs[item.key] ? 'bg-indigo-600' : 'bg-slate-250'}`}
                      >
                        <div className={`bg-white w-5 h-5 rounded-full shadow-xs transform transition-transform duration-200 ${notifPrefs[item.key] ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            {/* Local Storage & Cache Maintenance Dashboard */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 md:p-8 space-y-4" id="pref-block-cache">
              <span className="block text-[10px] font-black text-[#001939] uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <Database className="w-4 h-4 text-[#002D5E]" />
                <span>Sincronismo e Memória Interna</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100 font-semibold">
                <div className="space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase">Base de Usuários do App</span>
                  <p className="text-slate-800 text-[13px] font-black">Localmente Armazenados</p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase">Estado das Conexões</span>
                  <p className="text-emerald-600 text-[13px] font-extrabold">Sincronizado Offline</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-1">
                <span className="text-[11px] font-semibold text-slate-400">Versão de Produção do Software: v2.2.0</span>
                
                <button
                  type="button"
                  id="btn-clear-cache-perfil"
                  onClick={handleClearAppCache}
                  className="px-4 py-2 border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 text-[10px] uppercase tracking-wider font-extrabold rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  Limpar Ajustes do App
                </button>
              </div>
            </div>

          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
