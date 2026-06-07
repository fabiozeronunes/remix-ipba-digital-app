import { 
  BookOpen, 
  HeartHandshake, 
  CalendarCheck, 
  ChevronRight, 
  LogOut, 
  Camera, 
  CreditCard, 
  History, 
  Award, 
  Settings, 
  Lock,
  Moon,
  Sun,
  ShieldAlert,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Check,
  X,
  User as UserIcon,
  Shield,
  Key,
  Eye,
  EyeOff,
  Smartphone,
  Laptop,
  Upload,
  Bell
} from 'lucide-react';
import { User, PrayerRequest } from '../types';
import React, { useState, useEffect } from 'react';

interface PerfilSectionProps {
  user: User;
  onLogout: () => void;
  onNavigate: (tab: string) => void;
  userPrayersCount: number;
  userEventsCount: number;
  userContributionsCount: number;
  onShowAlert: (msg: string) => void;
  onUpdateUser: (updatedUser: Partial<User>) => void;
  prayers: PrayerRequest[];
  onDeletePrayer?: (id: string) => void;
  onAdminLogin?: () => void;
  cargos?: string[];
}

export default function PerfilSection({ 
  user, 
  onLogout, 
  onNavigate,
  userPrayersCount,
  userEventsCount,
  userContributionsCount,
  onShowAlert,
  onUpdateUser,
  prayers,
  onDeletePrayer,
  onAdminLogin,
  cargos: propCargos
}: PerfilSectionProps) {
  const isEligibleForAdminMode = (category?: string) => {
    if (!category) return false;
    const catLower = category.toLowerCase();
    return catLower.includes('coordenador') || 
           catLower.includes('admin') || 
           catLower.includes('pastor') || 
           catLower.includes('presbítero') || 
           catLower.includes('presbitero');
  };

  const [themeDark, setThemeDark] = useState(false);
  const [profilePlans, setProfilePlans] = useState(12);
  const [showMyPrayersControl, setShowMyPrayersControl] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  
  // Form states initialized dynamically
  const [editName, setEditName] = useState(user.name);
  const [editCategory, setEditCategory] = useState(user.category);
  const [editEmail, setEditEmail] = useState(user.email || '');
  const [editPhone, setEditPhone] = useState(user.phone || '');
  const [editBirthDate, setEditBirthDate] = useState(user.birthDate || '');
  const [editAddress, setEditAddress] = useState(user.address || '');
  const [editMinistry, setEditMinistry] = useState(user.ministry || '');
  const [editAvatar, setEditAvatar] = useState(user.avatarUrl);

  const [cargos, setCargos] = useState<string[]>(() => {
    if (propCargos && propCargos.length > 0) {
      return propCargos;
    }
    const raw = localStorage.getItem('church_custom_roles');
    if (raw) {
      try {
        const parsed: string[] = JSON.parse(raw);
        return parsed.filter(c => c !== "Membro Não-Comungante");
      } catch (e) {}
    }
    return [
      "Pastor / Presbítero",
      "Coordenador / Admin",
      "Membro Comungante",
      "Visitante Regular"
    ];
  });

  useEffect(() => {
    if (propCargos && propCargos.length > 0) {
      setCargos(propCargos);
      return;
    }
    const raw = localStorage.getItem('church_custom_roles');
    if (raw) {
      try {
        const parsed: string[] = JSON.parse(raw);
        setCargos(parsed.filter(c => c !== "Membro Não-Comungante"));
      } catch (e) {}
    }
  }, [propCargos, isEditing]);

  // File Upload Ref
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Security and Password States
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showNotificationsControl, setShowNotificationsControl] = useState(false);
  const [appNotificationsBlocked, setAppNotificationsBlocked] = useState<boolean>(() => {
    return localStorage.getItem('church_app_notifications_blocked') === 'true';
  });
  const [systemNotifPermission, setSystemNotifPermission] = useState<string>(() => {
    return 'Notification' in window ? Notification.permission : 'unsupported';
  });

  const handleBlockNotifications = async () => {
    setAppNotificationsBlocked(true);
    localStorage.setItem('church_app_notifications_blocked', 'true');
    onShowAlert("🚫 Notificações bloqueadas com sucesso no aplicativo.");
    await handleRequestSystemPermission();
  };

  const handleUnblockNotifications = async () => {
    setAppNotificationsBlocked(false);
    localStorage.setItem('church_app_notifications_blocked', 'false');
    onShowAlert("🔔 Notificações desbloqueadas com sucesso no aplicativo!");
    await handleRequestSystemPermission();
  };

  const handleRequestSystemPermission = async () => {
    if (!('Notification' in window)) {
      onShowAlert("Seu navegador não suporta notificações nativas.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setSystemNotifPermission(permission);
      if (permission === 'granted') {
        onShowAlert("Excelente! As notificações do sistema foram ativadas com sucesso.");
      } else if (permission === 'denied') {
        onShowAlert("As notificações foram bloqueadas. Para receber alertas, você precisa liberar nas configurações do seu navegador.");
      }
    } catch (err) {
      console.warn("Erro ao solicitar permissão:", err);
    }
  };

  const [notifPreferences, setNotifPreferences] = useState(() => {
    const saved = localStorage.getItem('church_notif_preferences');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      live: true,
      events: true,
      prayers: true,
      cells: true,
      studies: true
    };
  });

  const handleToggleNotifPreference = (key: 'live' | 'events' | 'prayers' | 'cells' | 'studies') => {
    const nextPrf = { ...notifPreferences, [key]: !notifPreferences[key] };
    setNotifPreferences(nextPrf);
    localStorage.setItem('church_notif_preferences', JSON.stringify(nextPrf));
  };

  const [sessionDevices, setSessionDevices] = useState([
    { id: '1', name: 'iPhone 15 Pro • São Paulo, SP', desc: 'Sessão atual • Ativo agora', isCurrent: true },
    { id: '2', name: 'MacBook Air • Navegador Chrome', desc: 'Último acesso: Há 2 horas', isCurrent: false },
    { id: '3', name: 'Navegador Safari • Tablet iPad', desc: 'Último acesso: Há 5 dias', isCurrent: false }
  ]);

  // Handle local image file loading
  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        onShowAlert("A foto é muito pesada! Por favor, escolha uma imagem com até 8MB.");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setEditAvatar(reader.result);
          onShowAlert("Foto selecionada! Clique em 'Salvar Alterações' para salvar o perfil com o novo avatar local.");
        }
      };
      reader.onerror = () => {
        onShowAlert("Erro ao carregar a imagem selecionada.");
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle password submission
  const handleVerifyPasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      onShowAlert("Por favor, digite sua senha atual.");
      return;
    }
    
    // Check current password (default '123' if not yet defined)
    const actualPassword = user.password || '123';
    if (currentPassword !== actualPassword) {
      onShowAlert("A senha atual informada está incorreta.");
      return;
    }

    if (newPassword.length < 6) {
      onShowAlert("A nova senha precisa ter no mínimo 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      onShowAlert("As novas senhas informadas não batem.");
      return;
    }

    // Persist and synchronize the new password
    onUpdateUser({ password: newPassword });

    onShowAlert("Sua senha foi redefinida com sucesso no banco de dados local!");
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsChangingPassword(false);
  };

  const terminateOtherSessions = () => {
    setSessionDevices(prev => prev.filter(device => device.isCurrent));
    onShowAlert("Todas as outras sessões em outros smartphones e aparelhos foram derrubadas com sucesso!");
  };

  // Avatar presets list for quick swapping
  const AVATAR_PRESETS = [
    { name: 'Ricardo (Padrão)', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCAw9f0m9zhnseECjh851sbC_y6zLT72KxZLFVCXdRwDIWH1CC-47FIiUxUXqTuB95Spni3XDvS7u1c-glbKjtQ2aiQke9uLjXjx-PV80NSNENNsu_daFFwxaV4mbyOOaA9-ScMxItwTnqLmvpGA-Dd2xJWBIz5zJZspCQG6fQDPZ6kwo3E_MeyjhrwVP4B2tYvr6V3HBeiGN899eENqjHE6bBz6N_K14zK1XoogBk6NAT1WsQyx2fJXpIuYiRJK92dLfb6Zkrbf9c' },
    { name: 'Pastor Roberto', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCuon_BcHB_Ezo-GyWZ4hI-1tjYM4D6R-6QVR--h_YLSfgJfuNoAT3D0dR408jAte4iIR0YX8DdMjjf0WAB3LLf3TAWhS1m7wiEBEDhq3OQcSfcr6PAHPuqJJVOzJgNQ33o9TfbzR4PdJH1l80RMEMIT12VASsOkJWWinfpRqgIbPOOyKpSID2uqnTDnoXb6sYsYUf6k96KI6liIkZetYGqEYosB2wWAyfX4as38eya06G77-a3LNEJOmx1t2NNHu0-NXCsW1orVPs' },
    { name: 'Ana Souza', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDFzVPt8R12b6r0cJenxhGMSaRCVhnj5m2I1L63zIXLkZLH0Irma2hv_P5qK-GMNH3b3kCM43ZW9Q4PH9K2SiHy7-ODE2cNb2t8A_zr-BxvnChqsgjZT1LXBuf2HL7pp1fSDQrGvEk4mrCFhimqMvSUYOfz3wbz8iN8rRH9nRmA9gRdo6n7D4xRFLdEgI2ndKUZKvYauk-Nvw84QWoH51RjXus-LV6oWVbwI4n3EBJX3_zjwxm5Rnn2tM0Qd7UVF_wjMD9kxH-nvnE' },
    { name: 'Marcos Oliveira', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB17FMtiuULNqk4h9CsuAGoM84ej4v-4k9DSAWBlDBBR7GmKPkUJNV7sXpxg4pAmT4Oh8bfnkx9sR3Cevp6WQSic9H6FOCXaegaeGAW0WNxHj1JQNER3LvwvI1jYDabpduh0sWKZ1riE8c5CX4RKMdgHgoOYM7xxJlaZGT7mzRrZ_PUGg0AWvefB6_QEthHc9yeiSMn0zjNpX2W5J8Ktsq-ilqO2J2WxcnDAyi3pL1HFiG5RPWH5YRGgwZVaGdaSA3Z-GPbQBUwEpo' }
  ];

  const handleEditInit = () => {
    setEditName(user.name);
    setEditCategory(user.category);
    setEditEmail(user.email || '');
    setEditPhone(user.phone || '');
    setEditBirthDate(user.birthDate || '');
    setEditAddress(user.address || '');
    setEditMinistry(user.ministry || '');
    setEditAvatar(user.avatarUrl);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      onShowAlert("O nome completo do membro é obrigatório.");
      return;
    }

    onUpdateUser({
      name: editName.trim(),
      category: user.category,
      email: editEmail.trim(),
      phone: editPhone.trim(),
      birthDate: editBirthDate,
      address: editAddress.trim(),
      ministry: editMinistry,
      avatarUrl: editAvatar
    });

    setIsEditing(false);
    onShowAlert("Perfil atualizado com sucesso no cadastro da igreja local!");
  };

  const toggleReadingPlan = () => {
    setProfilePlans(prev => prev + 1);
    onShowAlert("Parabéns! Mais um dia de leitura devocional registrado com sucesso!");
  };

  const triggerFeatureFeedback = (feature: string) => {
    onShowAlert(`A área de "${feature}" é atualizada automaticamente em sincronia com os servidores da igreja.`);
  };

  if (isEditing) {
    return (
      <div className="space-y-6 animate-fade-in pb-12 text-[#2c323f]">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={handleCancel}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer text-slate-700"
            title="Voltar"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display font-extrabold text-2xl text-indigo-950 tracking-tight">
              Editar Cadastro
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 font-semibold">
              Altere os seus dados de membro cadastrados na comunidade
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6 bg-white p-6 rounded-3xl border border-slate-200/60 shadow-md">
          {/* Avatar Edit Section */}
          <div className="flex flex-col items-center space-y-4 pb-4 border-b border-slate-100">
            <span className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider block self-start">
              Foto de Perfil
            </span>
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-300 shadow-md">
              <img 
                className="w-full h-full object-cover" 
                alt="Selected Profile Avatar" 
                src={editAvatar} 
                referrerPolicy="no-referrer"
              />
            </div>
            
            {/* Presets Grid */}
            <div className="w-full space-y-2">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider text-center">
                Selecione uma foto rápida ou insira o link abaixo:
              </p>
              <div className="flex items-center justify-center gap-3">
                {AVATAR_PRESETS.map((preset, index) => (
                  <button
                    key={`preset-${index}`}
                    type="button"
                    onClick={() => setEditAvatar(preset.url)}
                    className={`w-11 h-11 rounded-full overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                      editAvatar === preset.url ? 'border-indigo-600 scale-110 ring-2 ring-indigo-100' : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                    title={preset.name}
                  >
                    <img src={preset.url} alt={preset.name} className="w-full h-full object-cover animate-fade-in" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            </div>

            {/* Local Image Upload Option */}
            <div className="w-full flex flex-col items-center gap-2 pt-1 pb-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                Ou use uma foto salva no dispositivo:
              </span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer border border-indigo-100/60 active:scale-[0.98] w-full max-w-xs"
              >
                <Camera className="w-4 h-4 text-indigo-600" />
                <span>Escolher do Smartphone</span>
              </button>
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleLocalImageUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Custom URL Input */}
            <div className="w-full space-y-1">
              <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                Ou insira endereço de imagem (URL):
              </label>
              <input 
                type="url"
                value={editAvatar}
                onChange={(e) => setEditAvatar(e.target.value)}
                className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary text-[#191c1d]"
                placeholder="Insira a URL da foto..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nome Completo */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Nome Completo</span>
              </label>
              <input 
                required
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary placeholder:text-slate-400 text-[#191c1d] font-semibold" 
                placeholder="Seu nome" 
              />
            </div>

            {/* E-mail */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>E-mail</span>
              </label>
              <input 
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary placeholder:text-slate-400 text-[#191c1d]" 
                placeholder="parceiro@email.com" 
              />
            </div>

            {/* Telefone */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>WhatsApp / Celular</span>
              </label>
              <input 
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary placeholder:text-slate-400 text-[#191c1d]" 
                placeholder="(00) 00000-0000" 
              />
            </div>

            {/* Data de Nascimento */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Data de Nascimento</span>
              </label>
              <input 
                type="date"
                value={editBirthDate}
                onChange={(e) => setEditBirthDate(e.target.value)}
                className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary text-[#191c1d]" 
              />
            </div>

            {/* Ministério de Atuação */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Ministério de Foco</span>
              </label>
              <input 
                type="text"
                value={editMinistry}
                onChange={(e) => setEditMinistry(e.target.value)}
                className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary placeholder:text-slate-400 text-[#191c1d]" 
                placeholder="Ex: Diaconato, Louvor, Som & Mídia" 
              />
            </div>
          </div>

          {/* Endereço Completo */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Endereço Residencial</span>
            </label>
            <input 
              type="text"
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary placeholder:text-slate-400 text-[#191c1d]" 
              placeholder="Rua, Número, Bairro, Cidade - UF" 
            />
          </div>

          {/* Action Buttons */}
          <div className="flex select-none gap-3 pt-4 border-t border-slate-100">
            <button 
              type="button"
              onClick={handleCancel}
              className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase tracking-wider text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <X className="w-4 h-4" />
              <span>Cancelar</span>
            </button>
            <button 
              type="submit"
              className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-wider text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (isChangingPassword) {
    return (
      <div className="space-y-6 animate-fade-in pb-12 text-[#2c323f]">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => {
              setIsChangingPassword(false);
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
            }}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer text-slate-700"
            title="Voltar"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display font-extrabold text-2xl text-indigo-950 tracking-tight flex items-center gap-2">
              <Shield className="w-6 h-6 text-indigo-600 animate-pulse" />
              <span>Segurança e Senha</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 font-semibold font-sans">
              Gerencie suas credenciais de acesso e segurança da conta do portal do membro
            </p>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-md space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Key className="w-5 h-5 text-indigo-600" />
            <h2 className="font-extrabold text-sm text-indigo-950 uppercase tracking-wide">Alterar Senha de Acesso</h2>
          </div>

          <form onSubmit={handleVerifyPasswordChange} className="space-y-4">
            {/* Current Password */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Senha Atual</label>
              <div className="relative">
                <input 
                  required
                  type={showPasswords ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-[#f3f4f5] border-none rounded-xl pl-4 pr-10 py-3 text-sm outline-none focus:ring-2 focus:ring-primary text-[#191c1d] font-semibold" 
                  placeholder="Sua senha atual" 
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#191c1d]"
                >
                  {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password and Confirm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Nova Senha</label>
                <input 
                  required
                  type={showPasswords ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary text-[#191c1d] font-semibold" 
                  placeholder="Mínimo de 6 dígitos" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Confirmar Nova Senha</label>
                <input 
                  required
                  type={showPasswords ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary text-[#191c1d] font-semibold" 
                  placeholder="Repita a nova senha" 
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-wider text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Atualizar Senha</span>
            </button>
          </form>
        </div>

        {/* Two-Factor Authentication Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <h3 className="font-extrabold text-[#191c1d] text-sm leading-tight">Autenticação de Dois Fatores (2FA)</h3>
                <p className="text-[10px] text-slate-405 text-slate-500 mt-0.5 font-semibold">Exigir código por SMS ou WhatsApp ao entrar</p>
              </div>
            </div>
            
            <button 
              type="button"
              onClick={() => {
                const updated = !twoFactorEnabled;
                setTwoFactorEnabled(updated);
                onShowAlert(updated ? "Verificação de 2 fatores ativada! Você receberá códigos por WhatsApp e e-mail no próximo login." : "Verificação em duas etapas desativada.");
              }}
              className={`w-12 h-6 rounded-full p-1 relative flex items-center cursor-pointer transition-colors duration-200 shrink-0 ${
                twoFactorEnabled ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${twoFactorEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        {/* Active Connected Devices List */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider block">Aparelhos Conectados</span>
            {sessionDevices.length > 1 && (
              <button 
                type="button"
                onClick={terminateOtherSessions}
                className="text-[10px] text-red-500 hover:underline font-extrabold uppercase tracking-wider"
              >
                Derrubar Outros
              </button>
            )}
          </div>

          <div className="space-y-4">
            {sessionDevices.map((device) => (
              <div key={device.id} className="flex items-start justify-between">
                <div className="flex gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                    {device.name.includes('iPhone') || device.name.includes('iPad') ? (
                      <Smartphone className="w-4 h-4" />
                    ) : (
                      <Laptop className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{device.name}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold">{device.desc}</p>
                  </div>
                </div>
                {device.isCurrent && (
                  <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-extrabold uppercase tracking-wide border border-emerald-100 animate-pulse">
                    Ativo
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const myPrayers = prayers.filter(p => 
    p.authorName?.trim().toLowerCase() === user.name?.trim().toLowerCase()
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Profile Header Block */}
      <section className="flex flex-col items-center text-center space-y-4 pt-4">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-200 shadow-lg relative">
            <img 
              className="w-full h-full object-cover group-hover:scale-105 transition-all" 
              alt={`${user.name} Profile Picture`} 
              src={user.avatarUrl} 
            />
          </div>
          <button 
            onClick={() => onShowAlert("Para alterar sua imagem de cadastro, envie uma foto nítida para a secretaria de sua igreja local.")}
            className="absolute bottom-0 right-0 bg-[#001939] text-white p-2.5 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer border border-[#d6e3ff]"
            title="Alterar foto"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        <div>
          <h1 className="font-display font-extrabold text-3xl text-primary tracking-tight">
            {user.name}
          </h1>
          <p className="font-sans text-xs uppercase tracking-widest font-extrabold text-slate-500 mt-1">
            {user.category}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button 
            onClick={handleEditInit}
            className="px-6 py-2.5 rounded-full border border-slate-300 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-all cursor-pointer"
          >
            Editar Perfil
          </button>
        </div>
      </section>

      {/* Spiritual stats (Asymmetric Bento Style) */}
      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Readings */}
        <div 
          onClick={toggleReadingPlan}
          className="bg-surface-container-lowest p-5 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between border-l-4 border-[#001939] cursor-pointer select-none group"
          title="Clique para registrar progresso de hoje!"
        >
          <BookOpen className="w-6 h-6 text-primary mb-3" />
          <div>
            <p className="text-3xl font-black text-primary transition-transform group-hover:scale-105">{profilePlans}</p>
            <p className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">
              Dias de Leitura Devocional
            </p>
          </div>
        </div>

        {/* Requests */}
        <div 
          onClick={() => onNavigate('oracao')}
          className="bg-surface-container-lowest p-5 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
        >
          <HeartHandshake className="w-6 h-6 text-[#ba1a1a] mb-3" />
          <div>
            <p className="text-3xl font-black text-primary transition-transform group-hover:scale-105">{userPrayersCount}</p>
            <p className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">
              Pedidos de Oração Ativos
            </p>
          </div>
        </div>

        {/* Calendar Events (Spans full in mobile) */}
        <div 
          onClick={() => onNavigate('eventos')}
          className="bg-[#002d5e] p-5 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between col-span-2 md:col-span-1 text-white cursor-pointer group"
        >
          <CalendarCheck className="w-6 h-6 text-[#a9c7ff] mb-3" />
          <div>
            <p className="text-3xl font-black text-[#d6e3ff] transition-transform group-hover:scale-105">{userEventsCount}</p>
            <p className="font-sans text-[10px] font-bold uppercase tracking-wider text-[#a9c7ff] mt-1">
              Eventos Confirmados
            </p>
          </div>
        </div>
      </section>

      {/* Ficha de Membro (Dados Pessoais / Cadastrais) */}
      <section className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm space-y-4 text-[#2c323f]">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-extrabold text-base text-indigo-950 tracking-tight flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-indigo-600" />
            <span>Ficha de Membro</span>
          </h3>
          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-extrabold uppercase tracking-wider border border-emerald-100 animate-pulse">
            Cadastro Ativo
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs">
          {user.email && (
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">E-mail</span>
                <span className="font-bold text-slate-800 break-all">{user.email}</span>
              </div>
            </div>
          )}

          {user.phone && (
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Telefone / WhatsApp</span>
                <span className="font-bold text-slate-800">{user.phone}</span>
              </div>
            </div>
          )}

          {user.birthDate && (
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Data de Nascimento</span>
                <span className="font-bold text-slate-800">
                  {new Date(user.birthDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          )}

          {user.ministry && (
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <Briefcase className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Área / Ministério</span>
                <span className="font-bold text-slate-800">{user.ministry}</span>
              </div>
            </div>
          )}
        </div>

        {user.address && (
          <div className="flex items-start gap-2.5 border-t border-slate-100 pt-3 text-xs">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Endereço Residencial</span>
              <span className="font-bold text-slate-800">{user.address}</span>
            </div>
          </div>
        )}
      </section>

      {/* Tonal Options List */}
      <section className="bg-surface-container-low rounded-2xl overflow-hidden shadow-sm">
        <nav className="flex flex-col divide-y divide-slate-200/50">
          


          <div
            onClick={() => onNavigate('dizimos')}
            className="flex items-center justify-between p-5 hover:bg-slate-200/40 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="font-bold text-sm text-[#191c1d] block">Minhas Contribuições</span>
                <span className="text-[10px] text-slate-500 font-semibold">{userContributionsCount} registros recentes</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>

          <div className="flex flex-col">
            <div 
              onClick={() => setShowMyPrayersControl(!showMyPrayersControl)}
              className="flex items-center justify-between p-5 hover:bg-slate-200/40 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
                  <History className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <span className="font-bold text-sm text-[#191c1d] block">Histórico / Controle de Oração</span>
                  <span className="text-[10px] text-slate-500 font-semibold">{myPrayers.length} pedidos registrados por você</span>
                </div>
              </div>
              <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${showMyPrayersControl ? 'rotate-90 text-primary' : 'group-hover:translate-x-1'}`} />
            </div>

            {showMyPrayersControl && (
              <div className="bg-[#f0f2f5] p-5 border-t border-slate-200/60 space-y-4 animate-fade-in divide-y divide-slate-100/40">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest block">Painel de Controle de Pedidos</span>
                  <button 
                    onClick={() => onNavigate('oracao')} 
                    className="text-[10px] text-indigo-700 font-extrabold hover:underline uppercase tracking-wide cursor-pointer text-right shrink-0"
                  >
                    Novo Pedido no Mural +
                  </button>
                </div>

                {myPrayers.length === 0 ? (
                  <div className="py-6 px-4 text-center bg-white rounded-2xl border border-slate-200/50">
                    <p className="text-xs text-slate-500 font-bold">Você não possui pedidos de oração cadastrados.</p>
                    <button 
                      onClick={() => onNavigate('oracao')}
                      className="mt-3 px-4 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow cursor-pointer inline-block hover:opacity-90 transition-opacity"
                    >
                      Cadastrar Pedido Agora
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 pt-3 max-h-80 overflow-y-auto no-scrollbar">
                    {myPrayers.map((prayer) => (
                      <div key={prayer.id} className="p-4 bg-white rounded-xl border border-slate-250/60 flex flex-col justify-between shadow-xs space-y-3 text-left">
                        <div>
                          <div className="flex justify-between items-start">
                            <span className="px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {prayer.category}
                            </span>
                            <span className="text-[8px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded font-black uppercase shrink-0">
                              {prayer.visibilidade}
                            </span>
                          </div>
                          <span className="font-extrabold text-sm text-[#191c1d] mt-2 block leading-snug">{prayer.title}</span>
                          <p className="text-slate-600 text-xs mt-1 leading-relaxed font-semibold">{prayer.description}</p>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                          <span className="text-[9.5px] text-slate-400 font-extrabold uppercase tracking-tight">
                            {prayer.count} {prayer.count === 1 ? 'irmão orou' : 'irmãos apoiaram'}
                          </span>
                          
                          <div className="flex items-center gap-2 select-none shrink-0 self-end">
                            <button
                              onClick={() => {
                                if (onDeletePrayer) onDeletePrayer(prayer.id);
                                onShowAlert(`Pedido "${prayer.title}" marcado como Graça Alcançada! Glória a Deus! 🎉`);
                              }}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 text-emerald-700 text-[9px] font-black uppercase tracking-wider rounded-lg cursor-pointer transition-colors"
                            >
                              Graça Alcançada! 🎉
                            </button>
                            
                            {onDeletePrayer && (
                              <button
                                onClick={() => onDeletePrayer(prayer.id)}
                                className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-[9px] font-black uppercase tracking-wider rounded-lg cursor-pointer transition-colors"
                                title="Excluir do banco local"
                              >
                                Excluir
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div 
            onClick={() => triggerFeatureFeedback('Estudos')}
            className="flex items-center justify-between p-5 hover:bg-slate-200/40 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
                <Award className="w-5 h-5 text-primary" />
              </div>
              <span className="font-bold text-sm text-[#191c1d]">Meus Cursos e Estudos</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>

          {/* Configuração de Notificações */}
          <div className="flex flex-col">
            <div 
              onClick={() => setShowNotificationsControl(!showNotificationsControl)}
              className="flex items-center justify-between p-5 hover:bg-slate-200/40 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#e8eefd] flex items-center justify-center">
                  <Bell className="w-5 h-5 text-indigo-700" />
                </div>
                <div>
                  <span className="font-bold text-sm text-[#191c1d] block">Configuração de Notificações</span>
                  <span className="text-[10px] text-slate-500 font-semibold">Selecione os avisos que deseja receber no app</span>
                </div>
              </div>
              <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${showNotificationsControl ? 'rotate-90 text-indigo-600' : 'group-hover:translate-x-1'}`} />
            </div>

            {showNotificationsControl && (
              <div className="bg-[#f0f2f5] p-5 border-t border-slate-200/60 space-y-4 animate-fade-in text-[#2c323f]">
                {/* Status e Controle de Permissão de Notificações */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4 mb-2">
                  {appNotificationsBlocked ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center shrink-0 border border-red-100">
                          <ShieldAlert className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-[#191c1d] leading-tight">Notificações Bloqueadas</h4>
                          <p className="text-[10px] text-red-500 font-semibold mt-0.5 uppercase tracking-wide">
                            Você bloqueou todos os alertas neste aparelho
                          </p>
                        </div>
                      </div>
                      
                      <button 
                        type="button"
                        onClick={handleUnblockNotifications}
                        className="w-full py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all cursor-pointer shadow-md active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        <span>DESBLOQUEAR NOTIFICAÇÕES</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {systemNotifPermission === 'granted' ? (
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0 border border-emerald-100">
                            <ShieldAlert className="w-5 h-5 text-emerald-500" />
                          </div>
                          <div>
                            <h4 className="text-xs font-extrabold text-[#191c1d] leading-tight">Notificações Desbloqueadas</h4>
                            <p className="text-[10px] text-emerald-600 font-bold mt-0.5 uppercase tracking-wide flex items-center gap-1">
                              <Check className="w-3 h-3 stroke-[3px]" />
                              <span>Pronto para receber alertas push</span>
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3 text-left">
                          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0 border border-amber-100">
                            <Bell className="w-5 h-5 text-amber-500 animate-pulse" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-xs font-extrabold text-[#191c1d] tracking-tight">Notificações Desbloqueadas</h4>
                            <p className="text-[10px] text-slate-500 font-semibold leading-normal">
                              {systemNotifPermission === 'denied' 
                                ? 'Permitido no app, mas bloqueado no seu navegador.' 
                                : 'Alertas permitidos no aplicativo.'}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex flex-col gap-2 pt-1">
                        {systemNotifPermission !== 'granted' && (
                          <button 
                            type="button"
                            onClick={handleUnblockNotifications}
                            className="w-full py-2.5 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all cursor-pointer border border-indigo-100 active:scale-95 flex items-center justify-center gap-1.5"
                          >
                            <span>DESBLOQUEAR NOTIFICAÇÕES</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                        
                        <button 
                          type="button"
                          onClick={handleBlockNotifications}
                          className="w-full py-2.5 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-100/80 transition-all cursor-pointer border border-red-200 active:scale-95 flex items-center justify-center gap-1.5"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Bloquear Notificações</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-[10px] font-black text-indigo-950 uppercase tracking-widest block pb-1 border-b border-slate-300">
                  Canais de Notificação Ativos
                </p>

                <div className="space-y-3 pt-2">
                  {[
                    { key: 'live', label: 'Transmissões Ao Vivo', desc: 'Avisar quando a igreja iniciar um culto ou live' },
                    { key: 'events', label: 'Eventos e Atividades', desc: 'Notificações de novos eventos, datas e agendas' },
                    { key: 'prayers', label: 'Novos Pedidos de Oração', desc: 'Alertas quando irmãos postarem pedidos de intercessão' },
                    { key: 'cells', label: 'Avisos da sua Célula', desc: 'Lembretes e agendas semanais da célula local' },
                    { key: 'studies', label: 'Novos Estudos Bíblicos', desc: 'Alertas de novos estudos bíblicos e devocionais' }
                  ].map((item) => (
                    <div 
                      key={item.key} 
                      onClick={() => handleToggleNotifPreference(item.key as any)}
                      className="bg-white p-3.5 rounded-xl border border-slate-200/80 cursor-pointer flex items-center justify-between gap-3 shadow-xs hover:border-indigo-200/80 transition-colors text-left"
                    >
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-[#191c1d] block leading-tight">{item.label}</span>
                        <span className="text-[10.5px] text-slate-400 font-semibold block leading-snug">{item.desc}</span>
                      </div>
                      
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                        notifPreferences[item.key as keyof typeof notifPreferences] 
                          ? 'bg-indigo-600 border-indigo-600 text-white' 
                          : 'border-slate-300 bg-slate-50'
                      }`}>
                        {notifPreferences[item.key as keyof typeof notifPreferences] && (
                          <Check className="w-3.5 h-3.5 stroke-[3px]" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div 
            onClick={() => {
              setThemeDark(!themeDark);
              onShowAlert(themeDark ? "Modo claro preferido." : "Ajustado tema escuro de leitura sagrada.");
            }}
            className="flex items-center justify-between p-5 hover:bg-slate-200/40 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
                {themeDark ? <Sun className="w-5 h-5 text-primary" /> : <Moon className="w-5 h-5 text-primary" />}
              </div>
              <div>
                <span className="font-bold text-sm text-[#191c1d] block">Ajustes Visuais</span>
                <span className="text-[10px] text-slate-500 font-semibold">{themeDark ? 'Tema Escuro Ativo' : 'Tema Claro Ativo'}</span>
              </div>
            </div>
            <div className="w-12 h-6 bg-slate-300 rounded-full p-1 relative flex items-center cursor-pointer transition-colors duration-200">
              <div className={`w-4 h-4 rounded-full bg-primary transform transition-transform ${themeDark ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </div>

          <div 
            onClick={() => setIsChangingPassword(true)}
            className="flex items-center justify-between p-5 hover:bg-slate-200/40 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <span className="font-bold text-sm text-[#191c1d]">Segurança e Senha</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </nav>
      </section>

      {/* Logout Action */}
      <section className="space-y-4">
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 p-5 rounded-xl border border-red-200 text-red-600 font-bold uppercase tracking-wider text-xs hover:bg-red-50/50 transition-all active:scale-[0.98] cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair da Conta</span>
        </button>

        <p className="text-center text-slate-400 text-[10px] uppercase tracking-widest font-extrabold select-none">
          Portal do Membro Versão 2.4.0 • 2026
        </p>
      </section>
    </div>
  );
}
