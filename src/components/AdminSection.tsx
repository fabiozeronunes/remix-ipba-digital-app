import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Check, 
  Calendar, 
  Users, 
  Coins, 
  HeartHandshake, 
  UserCheck, 
  Sparkles, 
  X, 
  MapPin, 
  Clock, 
  ShieldAlert,
  TrendingUp,
  Activity,
  User as UserIcon,
  Info,
  DollarSign,
  Edit2,
  Tv,
  Video,
  ChevronDown,
  BookOpen,
  FileText,
  Headphones,
  Save,
  Tag,
  Radio,
  MessageCircle,
  RefreshCw,
  LifeBuoy
} from 'lucide-react';
import { User, PrayerRequest, Cell, Contribution, ChurchEvent, ChurchStudy, RadioProgram, SupportOption, SupportTicket } from '../types';
import { db, getUserDocId, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc, deleteDoc, writeBatch, collection, addDoc, onSnapshot, updateDoc, getDocs } from 'firebase/firestore';

interface AdminSectionProps {
  events: ChurchEvent[];
  cells: Cell[];
  prayers: PrayerRequest[];
  contributions: Contribution[];
  currentUserIdEmail?: string;
  userCategory?: string;
  onAddEvent: (newEvent: Omit<ChurchEvent, 'id' | 'going'>) => void;
  onDeleteEvent: (id: string) => void;
  onUpdateEvent?: (updatedEvent: ChurchEvent) => void;
  onAddCell: (newCell: Omit<Cell, 'id' | 'joined'>) => void;
  onDeleteCell: (id: string) => void;
  onUpdateCell?: (updatedCell: Cell) => void;
  onAddContribution: (amountVal: number, category: Contribution['category'], method: Contribution['method'], title?: string, date?: string) => void;
  onDeleteContribution: (id: string) => void;
  onDeletePrayer: (id: string) => void;
  onUpdatePrayerVisibility: (id: string, visibility: 'Público' | 'Pastoral') => void;
  onSaveAllPrayers?: (updatedPrayers: PrayerRequest[]) => void;
  onShowAlert: (msg: string) => void;
  onNotifyCreated?: (type: 'cell' | 'event' | 'prayer' | 'live', title: string, subtitle: string) => void;
  studies: ChurchStudy[];
  onAddStudy: (newStudy: Omit<ChurchStudy, 'id' | 'dateStr'>) => void;
  onDeleteStudy: (id: string) => void;
  onUpdateStudy?: (updatedStudy: ChurchStudy) => void;
  radioPrograms?: RadioProgram[];
  onAddRadioProgram: (newPrg: Omit<RadioProgram, 'id' | 'createdAt'>) => void;
  onDeleteRadioProgram: (id: string) => void;
  onUpdateRadioProgram?: (updatedPrg: RadioProgram) => void;
  onUpdateUser?: (updated: any, targetEmail?: string) => void;
  dbUsers?: User[];
  propTransmissions?: any[];
  propCargos?: string[];
  isAuthReady?: boolean;
}

export default function AdminSection({
  events,
  cells,
  prayers,
  contributions,
  currentUserIdEmail,
  userCategory,
  onAddEvent,
  onDeleteEvent,
  onUpdateEvent,
  onAddCell,
  onDeleteCell,
  onUpdateCell,
  onAddContribution,
  onDeleteContribution,
  onDeletePrayer,
  onUpdatePrayerVisibility,
  onSaveAllPrayers,
  onShowAlert,
  onNotifyCreated,
  studies,
  onAddStudy,
  onDeleteStudy,
  onUpdateStudy,
  radioPrograms = [],
  onAddRadioProgram,
  onDeleteRadioProgram,
  onUpdateRadioProgram,
  onUpdateUser,
  dbUsers: propDbUsers,
  propTransmissions,
  propCargos,
  isAuthReady = true
}: AdminSectionProps) {
  const [activeSubTab, setActiveSubTab] = useState<'events' | 'prayers' | 'treasury' | 'roles' | 'members' | 'cells' | 'live' | 'studies' | 'radio' | 'event_confirmations' | 'support_options'>(() => {
    return (localStorage.getItem('church_admin_active_subtab') as any) || 'events';
  });
  const [confirmDelete, setConfirmDelete] = useState<{ id: string, type: string, action: () => void, name: string } | null>(null);
  const [openCargoDropdownId, setOpenCargoDropdownId] = useState<string | null>(null);

  // Support Feature Admin states
  const [supportOptionsList, setSupportOptionsList] = useState<SupportOption[]>([]);
  const [newOptionInput, setNewOptionInput] = useState('');
  const [supportTicketsList, setSupportTicketsList] = useState<SupportTicket[]>([]);

  useEffect(() => {
    if (!isAuthReady) return;
    const unsubscribe = onSnapshot(collection(db, 'supportOptions'), (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SupportOption[];
      setSupportOptionsList(fetched);
    }, (error) => {
      console.error('Support Options fetch error:', error);
      handleFirestoreError(error, OperationType.LIST, 'supportOptions');
    });
    return () => unsubscribe();
  }, [isAuthReady]);

  useEffect(() => {
    if (!isAuthReady) return;
    const unsubscribe = onSnapshot(collection(db, 'supportTickets'), (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SupportTicket[];
      fetched.sort((a,b) => b.createdAt.localeCompare(a.createdAt));
      setSupportTicketsList(fetched);
    }, (error) => {
      console.error('Support Tickets fetch error:', error);
      handleFirestoreError(error, OperationType.LIST, 'supportTickets');
    });
    return () => unsubscribe();
  }, [isAuthReady]);


  useEffect(() => {
    localStorage.setItem('church_admin_active_subtab', activeSubTab);
  }, [activeSubTab]);
  
  // Storage for local users list to sync role updates and membership
  const [dbUsers, setDbUsers] = useState<User[]>([]);

  // Synchronize state with real-time Firestore propDbUsers
  useEffect(() => {
    if (propDbUsers) {
      setDbUsers(propDbUsers);
    }
  }, [propDbUsers]);

  const pendingCount = dbUsers.filter(u => u.status === 'Pendente').length;

  // Synchronize state with real-time Firestore propCargos
  useEffect(() => {
    if (propCargos) {
      setCargos(propCargos);
    }
  }, [propCargos]);

  // Synchronize state with real-time Firestore propTransmissions
  useEffect(() => {
    if (propTransmissions) {
      setTransmissions(propTransmissions);
    }
  }, [propTransmissions]);

  // Storage for dynamic roles list (Cargos)
  const [cargos, setCargos] = useState<string[]>([]);
  const [newCargoName, setNewCargoName] = useState('');
  const [editingCargoIndex, setEditingCargoIndex] = useState<number | null>(null);
  const [editingCargoName, setEditingCargoName] = useState('');
  const [editingMemberEmail, setEditingMemberEmail] = useState<string | null>(null);
  const [selectedCargos, setSelectedCargos] = useState<string[]>([]);
  const [memberToDeleteKey, setMemberToDeleteKey] = useState<string | null>(null);

  // States for Member Registration Form (Admin only)
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [editingMember, setEditingMember] = useState<User | null>(null);

  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberPassword, setNewMemberPassword] = useState('123');
  const [newMemberCategory, setNewMemberCategory] = useState('Membro Comungante');
  const [newMemberMinistry, setNewMemberMinistry] = useState('');
  const [newMemberBirthDate, setNewMemberBirthDate] = useState('');
  const [newMemberAddress, setNewMemberAddress] = useState('');
  const [newMemberStatus, setNewMemberStatus] = useState<'Ativo' | 'Pendente' | 'Suspenso'>('Ativo');
  const [newMemberAvatarUrl, setNewMemberAvatarUrl] = useState('https://lh3.googleusercontent.com/aida-public/AB6AXuDFzVPt8R12b6r0cJenxhGMSaRCVhnj5m2I1L63zIXLkZLH0Irma2hv_P5qK-GMNH3b3kCM43ZW9Q4PH9K2SiHy7-ODE2cNb2t8A_zr-BxvnChqsgjZT1LXBuf2HL7pp1fSDQrGvEk4mrCFhimqMvSUYOfz3wbz8iN8rRH9nRmA9gRdo6n7D4xRFLdEgI2ndKUZKvYauk-Nvw84QWoH51RjXus-LV6oWVbwI4n3EBJX3_zjwxm5Rnn2tM0Qd7UVF_wjMD9kxH-nvnE');

  // Storage for dynamic Youtube Live Config
  const [liveUrl, setLiveUrl] = useState('');
  const [liveTitle, setLiveTitle] = useState('');
  const [liveSubtitle, setLiveSubtitle] = useState('');
  const [liveDate, setLiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [liveTime, setLiveTime] = useState('19:00');
  const [liveIsLive, setLiveIsLive] = useState(true);
  const [liveViewerCount, setLiveViewerCount] = useState(42);
  const [liveIsPublic, setLiveIsPublic] = useState(true);
  const [liveTagsInput, setLiveTagsInput] = useState('');
  const [editingTransId, setEditingTransId] = useState<string | null>(null);
  const [transmissions, setTransmissions] = useState<any[]>(() => {
    const raw = localStorage.getItem('church_transmissions_list');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {}
    }
    return [
      {
        id: 'trans-default',
        youtubeUrl: 'https://www.youtube.com/embed/5qap5aO4i9A',
        title: 'Série Expositiva: Epístola de Filipenses',
        subtitle: 'Sermão: "Alegria nas Tribulações" • Rev. Roberto Silva',
        isLive: true,
        viewerCount: 42,
        isPublic: true
      }
    ];
  });

  const [localPrayers, setLocalPrayers] = useState<PrayerRequest[]>(prayers);

  useEffect(() => {
    setLocalPrayers(prayers);
  }, [prayers]);

  const loadCargos = () => {
    if (propCargos) {
      setCargos(propCargos);
      return;
    }
    const defaultCargos = [
      "Coordenador / Admin",
      "Pastor / Presbítero",
      "SAF",
      "UPH",
      "Visitante",
      "Membro Comungante",
      "Membro Não-Comungante",
      "Membro Não-Ativo"
    ];
    const raw = localStorage.getItem('church_custom_roles');
    if (raw) {
      try {
        let parsed: string[] = JSON.parse(raw);
        
        // Replace VISITANTE with "Visitante"
        parsed = parsed.map(c => c === "VISITANTE" ? "Visitante" : c);
        
        const essentials = ["Visitante", "SAF", "UPH", "Membro Comungante", "Membro Não-Comungante", "Membro Não-Ativo"];
        let updated = [...parsed];
        
        essentials.forEach(item => {
          if (!updated.some(x => x.toLowerCase() === item.toLowerCase())) {
            updated.push(item);
          }
        });
        
        // Normalize casing for essentials
        updated = updated.map(item => {
          if (item.toLowerCase() === "visitante") return "Visitante";
          if (item.toUpperCase() === "SAF") return "SAF";
          if (item.toUpperCase() === "UPH") return "UPH";
          return item;
        });

        // Unique values only, filtered and sorted alphabetically
        const sorted = Array.from(new Set(updated))
          .sort((a, b) => a.localeCompare(b, 'pt-BR'));
        
        localStorage.setItem('church_custom_roles', JSON.stringify(sorted));
        setCargos(sorted);
      } catch (e) {
        setCargos(defaultCargos);
      }
    } else {
      localStorage.setItem('church_custom_roles', JSON.stringify(defaultCargos));
      setCargos(defaultCargos);
    }
  };

  const loadLiveConfig = () => {
    const raw = localStorage.getItem('church_youtube_live');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setLiveUrl(parsed.youtubeUrl || '');
        setLiveTitle(parsed.title || '');
        setLiveSubtitle(parsed.subtitle || '');
        setLiveIsLive(parsed.isLive !== false);
        setLiveViewerCount(parsed.viewerCount || 42);
      } catch (e) {}
    } else {
      const defaultLive = {
        youtubeUrl: 'https://www.youtube.com/embed/5qap5aO4i9A',
        title: 'Série Expositiva: Epístola de Filipenses',
        subtitle: 'Sermão: "Alegria nas Tribulações" • Rev. Roberto Silva',
        isLive: true,
        viewerCount: 42
      };
      localStorage.setItem('church_youtube_live', JSON.stringify(defaultLive));
      setLiveUrl(defaultLive.youtubeUrl);
      setLiveTitle(defaultLive.title);
      setLiveSubtitle(defaultLive.subtitle);
      setLiveIsLive(defaultLive.isLive);
      setLiveViewerCount(defaultLive.viewerCount);
    }
  };

  useEffect(() => {
    loadCargos();
    loadLiveConfig();
  }, [currentUserIdEmail]);

  const handleToggleCargo = (cargoName: string) => {
    const cleanCargo = cargoName.trim();
    setSelectedCargos(prev => {
      if (prev.includes(cleanCargo)) {
        return prev.filter(c => c !== cleanCargo);
      } else {
        return [...prev, cleanCargo];
      }
    });
  };

  const handleSaveSingleMember = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const matchedUser = dbUsers.find(u => u.email?.trim().toLowerCase() === cleanEmail);
    if (matchedUser) {
      try {
        // Sort assigned cargo names alphabetically
        const sortedCargos = [...selectedCargos]
          .map(c => c === "VISITANTE" ? "Visitante" : c)
          .sort((a, b) => a.localeCompare(b, 'pt-BR'));
        
        const finalRoleStr = sortedCargos.join(', ');
        const updatedUser = { 
          ...matchedUser, 
          category: finalRoleStr,
          updatedAt: new Date().toISOString()
        };

        const docId = getUserDocId(cleanEmail);
        await setDoc(doc(db, 'users', docId), updatedUser, { merge: true });

        // Instantly update local state in AdminSection
        setDbUsers(prev => {
          return prev.map(u => {
            if (u.email?.trim().toLowerCase() === cleanEmail) {
              return updatedUser;
            }
            return u;
          });
        });

        // Synchronously update Parent App's users state
        if (onUpdateUser) {
          onUpdateUser(updatedUser, cleanEmail);
        }

        // If this is the current logged-in user, synchronously update active session in localStorage
        if (cleanEmail === currentUserIdEmail?.trim().toLowerCase()) {
          const rawSession = localStorage.getItem('church_current_user');
          if (rawSession) {
            try {
              const sessionUser: User = JSON.parse(rawSession);
              sessionUser.category = finalRoleStr;
              localStorage.setItem('church_current_user', JSON.stringify(sessionUser));
            } catch (e) {
              console.warn("Erro ao atualizar localStorage da sessão:", e);
            }
          }
        }

        onShowAlert(`Cargos salvos com sucesso para ${matchedUser.name.split(' ')[0]}!`);
        setEditingMemberEmail(null);
      } catch (err) {
        console.error("Error saving member in Firestore:", err);
        onShowAlert("Erro ao salvar os cargos do membro.");
      }
    }
  };

  // --- Dynamic Cargo (Roles) Modification Methods ---
  const handleCreateCargo = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newCargoName.trim();
    if (!clean) return;
    if (cargos.some(c => c.toLowerCase() === clean.toLowerCase())) {
      onShowAlert("Este cargo já existe no sistema!");
      return;
    }
    const updated = [...cargos, clean].sort((a,b) => a.localeCompare(b, 'pt-BR'));
    setCargos(updated);
    localStorage.setItem('church_custom_roles', JSON.stringify(updated));
    setNewCargoName('');
    try {
      const docId = getUserDocId(clean);
      await setDoc(doc(db, 'customRoles', docId), { name: clean });
      onShowAlert(`Cargo "${clean}" cadastrado e ordenado com sucesso!`);
    } catch (err) {
      onShowAlert("Erro ao salvar cargo no Firebase.");
    }
  };

  const handleSaveEditCargo = async (idx: number) => {
    const clean = editingCargoName.trim();
    if (!clean) return;
    const oldName = cargos[idx];
    if (cargos.some(c => c.toLowerCase() === clean.toLowerCase()) && oldName.toLowerCase() !== clean.toLowerCase()) {
      onShowAlert("Este cargo com este nome já existe!");
      return;
    }
    const updated = [...cargos];
    updated[idx] = clean;
    const sorted = updated.sort((a,b) => a.localeCompare(b, 'pt-BR'));
    setCargos(sorted);
    localStorage.setItem('church_custom_roles', JSON.stringify(sorted));
    setEditingCargoIndex(null);
    setEditingCargoName('');
    
    try {
      const oldDocId = getUserDocId(oldName);
      const newDocId = getUserDocId(clean);
      await deleteDoc(doc(db, 'customRoles', oldDocId));
      await setDoc(doc(db, 'customRoles', newDocId), { name: clean });
    } catch (err) {}
    
    // Also update all users with this role to the new role name in Firestore (supporting comma-separated list of cargos)
    const updatedUsers = dbUsers.map(u => {
      if (!u.category) return u;
      const roles = u.category.split(',').map(c => c.trim()).filter(Boolean);
      if (roles.includes(oldName)) {
        const nextRoles = roles.map(r => r === oldName ? clean : r);
        return { ...u, category: nextRoles.sort().join(', ') };
      }
      return u;
    });
    
    updatedUsers.forEach(async (u) => {
      // Find if this specific user was modified
      const originalUser = dbUsers.find(x => x.email?.toLowerCase() === u.email?.toLowerCase());
      if (originalUser && originalUser.category !== u.category && u.email) {
        try {
          const docId = getUserDocId(u.email);
          await setDoc(doc(db, 'users', docId), u, { merge: true });
        } catch (err) {}
      }
    });
    onShowAlert(`Cargo alterado para "${clean}" e todos os membros com este cargo foram atualizados.`);
  };

  const handleDeleteCargo = async (cargoName: string) => {
    // Correctly check if any member has this role inside their comma-separated roles list
    const isUsed = dbUsers.some(u => {
      if (!u.category) return false;
      const roles = u.category.split(',').map(c => c.trim()).filter(Boolean);
      return roles.includes(cargoName);
    });
    if (isUsed) {
      onShowAlert(`Não é possível excluir o cargo "${cargoName}" pois existem membros utilizando-o.`);
      return;
    }
    const updated = cargos.filter(c => c !== cargoName).sort((a,b) => a.localeCompare(b, 'pt-BR'));
    setCargos(updated);
    localStorage.setItem('church_custom_roles', JSON.stringify(updated));
    try {
      const docId = getUserDocId(cargoName);
      await deleteDoc(doc(db, 'customRoles', docId));
      onShowAlert(`Cargo "${cargoName}" excluído com sucesso.`);
    } catch (err) {
      onShowAlert("Erro ao excluir o cargo no Firebase.");
    }
  };

  // --- Dynamic Members Moderation and Approval Methods ---
  const handleApproveMember = async (email: string) => {
    try {
      const docId = getUserDocId(email);
      await setDoc(doc(db, 'users', docId), { status: 'Ativo', updatedAt: new Date().toISOString() }, { merge: true });
      
      // Update local state immediately for instant feedback
      setDbUsers(prev => prev.map(u => {
        if ((u.email || '').trim().toLowerCase() === email.trim().toLowerCase()) {
          return { ...u, status: 'Ativo', updatedAt: new Date().toISOString() };
        }
        return u;
      }));

      // Notify parent component if applicable
      const matched = dbUsers.find(u => (u.email || '').trim().toLowerCase() === email.trim().toLowerCase());
      if (matched && onUpdateUser) {
        onUpdateUser({ ...matched, status: 'Ativo', updatedAt: new Date().toISOString() }, email);
      }

      onShowAlert("Cadastro de membro aprovado com sucesso!");
    } catch (err: any) {
      console.error("Error approving member:", err);
      onShowAlert(`Erro ao aprovar membro: ${err.message || err}`);
    }
  };

  const handleSuspendMember = async (email: string) => {
    try {
      const docId = getUserDocId(email);
      await setDoc(doc(db, 'users', docId), { status: 'Suspenso', updatedAt: new Date().toISOString() }, { merge: true });
      
      // Update local state immediately for instant feedback
      setDbUsers(prev => prev.map(u => {
        if ((u.email || '').trim().toLowerCase() === email.trim().toLowerCase()) {
          return { ...u, status: 'Suspenso', updatedAt: new Date().toISOString() };
        }
        return u;
      }));

      // Notify parent component if applicable
      const matched = dbUsers.find(u => (u.email || '').trim().toLowerCase() === email.trim().toLowerCase());
      if (matched && onUpdateUser) {
        onUpdateUser({ ...matched, status: 'Suspenso', updatedAt: new Date().toISOString() }, email);
      }

      onShowAlert("Cadastro de membro suspenso com sucesso!");
    } catch (err: any) {
      console.error("Error suspending member:", err);
      onShowAlert(`Erro ao suspender membro: ${err.message || err}`);
    }
  };

  const handleDeleteMember = async (email: string) => {
    if (email.toLowerCase() === 'fabiozeronunes@gmail.com') {
      onShowAlert("Não é permitido excluir o usuário Administrador / Coordenador principal!");
      return;
    }
    try {
      const docId = getUserDocId(email);
      await deleteDoc(doc(db, 'users', docId));

      // Clean/update local storage 'church_users' immediately on delete to prevent any resurrection synchronization races
      const rawLocal = localStorage.getItem('church_users');
      if (rawLocal) {
        try {
          const parsedLocal: User[] = JSON.parse(rawLocal);
          const nextLocal = parsedLocal.filter(u => (u.email || '').trim().toLowerCase() !== email.trim().toLowerCase());
          localStorage.setItem('church_users', JSON.stringify(nextLocal));
        } catch (e) {
          console.error("Erro ao remover do localStorage localmente:", e);
        }
      }

      // Update local state immediately for instant, responsive UI feedback
      setDbUsers(prev => prev.filter(u => (u.email || '').trim().toLowerCase() !== email.trim().toLowerCase()));

      onShowAlert("Membro removido definitivamente dos cadastros da congregação.");
    } catch (err: any) {
      console.error("Error deleting member:", err);
      onShowAlert(`Erro ao excluir membro de forma definitiva: ${err.message || err}`);
    }
  };

  const handleUpdateMemberByAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    const oldEmail = (editingMember.email || '').trim().toLowerCase();
    const newEmail = newMemberEmail.trim().toLowerCase();
    const cleanName = newMemberName.trim();

    if (!cleanName || !newEmail) {
      onShowAlert("Por favor, preencha o nome e o e-mail do membro!");
      return;
    }

    // If email has changed, check if the new email is already taken by another user
    if (newEmail !== oldEmail) {
      const emailExists = dbUsers.some(u => (u.email || '').trim().toLowerCase() === newEmail);
      if (emailExists) {
        onShowAlert(`O e-mail "${newEmail}" já está cadastrado para outro membro.`);
        return;
      }
    }

    // Payload of updated fields
    const updatedUserPayload = {
      ...editingMember,
      name: cleanName,
      email: newEmail,
      phone: newMemberPhone.trim(),
      category: newMemberCategory,
      ministry: newMemberMinistry.trim(),
      birthDate: newMemberBirthDate || '',
      address: newMemberAddress.trim() || '',
      status: newMemberStatus,
      avatarUrl: newMemberAvatarUrl,
      updatedAt: new Date().toISOString()
    };

    if (newMemberPassword.trim()) {
      updatedUserPayload.password = newMemberPassword.trim();
    }

    try {
      const oldDocId = getUserDocId(oldEmail);
      const newDocId = getUserDocId(newEmail);

      // If email has changed, delete the old document in Firestore
      if (oldDocId !== newDocId) {
        await deleteDoc(doc(db, 'users', oldDocId));
      }

      // Write/Merge the new payload
      await setDoc(doc(db, 'users', newDocId), updatedUserPayload, { merge: true });

      // Clean/update local storage 'church_users' immediately to prevent any synchronization races
      const rawLocal = localStorage.getItem('church_users');
      if (rawLocal) {
        try {
          const parsedLocal: User[] = JSON.parse(rawLocal);
          // Remove old email and insert/update new user info
          let nextLocal = parsedLocal.filter(u => (u.email || '').trim().toLowerCase() !== oldEmail);
          nextLocal.push(updatedUserPayload);
          localStorage.setItem('church_users', JSON.stringify(nextLocal));
        } catch (e) {
          console.error("Erro ao atualizar localStorage localmente:", e);
        }
      }

      // If the admin edited their own account, update the currently logged-in user!
      const currentSessionRaw = localStorage.getItem('church_current_user');
      if (currentSessionRaw) {
        try {
          const loggedU: User = JSON.parse(currentSessionRaw);
          if ((loggedU.email || '').trim().toLowerCase() === oldEmail) {
            localStorage.setItem('church_current_user', JSON.stringify(updatedUserPayload));
          }
        } catch (e) {}
      }

      // Synchronously notify Parent App to update its users real-time state instantly
      if (onUpdateUser) {
        onUpdateUser(updatedUserPayload, newEmail);
      }

      onShowAlert(`Dados do membro "${updatedUserPayload.name}" atualizados com sucesso!`);
      
      setEditingMember(null);
      setShowAddMemberForm(false);
      // Reset fields
      setNewMemberName('');
      setNewMemberEmail('');
      setNewMemberPhone('');
      setNewMemberCategory('Membro Comungante');
      setNewMemberMinistry('');
      setNewMemberBirthDate('');
      setNewMemberAddress('');
      setNewMemberStatus('Ativo');
      setNewMemberPassword('');
    } catch (err) {
      console.error("Erro ao atualizar membro:", err);
      onShowAlert("Ocorreu um erro ao atualizar os dados do membro.");
    }
  };

  const handleRegisterMemberByAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newMemberEmail.trim().toLowerCase();
    const cleanName = newMemberName.trim();

    if (!cleanName || !cleanEmail) {
      onShowAlert("Por favor, preencha o nome e o e-mail do membro!");
      return;
    }

    // Verificar se o e-mail já existe
    const emailExists = dbUsers.some(u => (u.email || '').trim().toLowerCase() === cleanEmail);
    if (emailExists) {
      onShowAlert(`O email "${cleanEmail}" já está cadastrado para outro membro.`);
      return;
    }

    // Gerar ou usar a senha fornecida
    const pass = newMemberPassword.trim() || '123';

    // Lista de avatares aleatórios da igreja/geral
    const randomAvatars = [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDFzVPt8R12b6r0cJenxhGMSaRCVhnj5m2I1L63zIXLkZLH0Irma2hv_P5qK-GMNH3b3kCM43ZW9Q4PH9K2SiHy7-ODE2cNb2t8A_zr-BxvnChqsgjZT1LXBuf2HL7pp1fSDQrGvEk4mrCFhimqMvSUYOfz3wbz8iN8rRH9nRmA9gRdo6n7D4xRFLdEgI2ndKUZKvYauk-Nvw84QWoH51RjXus-LV6oWVbwI4n3EBJX3_zjwxm5Rnn2tM0Qd7UVF_wjMD9kxH-nvnE',
      'https://lh3.googleusercontent.com/raw/59737.png',
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150',
      'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=150'
    ];
    // Usa o selecionado (ou o default do estado, ou um aleatório)
    const avatar = newMemberAvatarUrl || randomAvatars[0];

    const newUserPayload: User = {
      name: cleanName,
      category: newMemberCategory,
      avatarUrl: avatar,
      planCount: 0,
      prayerCount: 0,
      eventCount: 0,
      email: cleanEmail,
      phone: newMemberPhone.trim(),
      birthDate: newMemberBirthDate || '',
      address: newMemberAddress.trim() || '',
      ministry: newMemberMinistry.trim() || '',
      password: pass,
      status: newMemberStatus,
      updatedAt: new Date().toISOString()
    };

    try {
      const docId = getUserDocId(cleanEmail);
      await setDoc(doc(db, 'users', docId), newUserPayload);
      onShowAlert(`Membro "${cleanName}" cadastrado com sucesso!`);
      
      // Limpar campos
      setNewMemberName('');
      setNewMemberEmail('');
      setNewMemberPhone('');
      setNewMemberPassword('123');
      setNewMemberCategory('Membro Comungante');
      setNewMemberMinistry('');
      setNewMemberBirthDate('');
      setNewMemberAddress('');
      setNewMemberStatus('Ativo');
      setShowAddMemberForm(false);
    } catch (err) {
      console.error("Erro ao cadastrar membro:", err);
      onShowAlert("Ocorreu um erro ao salvar o membro no banco de dados.");
    }
  };

  // --- Dynamic YouTube LIVE Config Method ---
  const handleSaveLiveTransmission = async (isNew: boolean) => {
    // Convert watch/share URL link formats to robust iframe embeds
    let formattedUrl = liveUrl.trim();
    if (formattedUrl) {
      if (formattedUrl.includes('watch?v=')) {
        const parts = formattedUrl.split('watch?v=');
        const videoId = parts[1]?.split('&')[0];
        if (videoId) {
          formattedUrl = `https://www.youtube.com/embed/${videoId}`;
        }
      } else if (formattedUrl.includes('youtu.be/')) {
        const parts = formattedUrl.split('youtu.be/');
        const videoId = parts[1]?.split('?')[0];
        if (videoId) {
          formattedUrl = `https://www.youtube.com/embed/${videoId}`;
        }
      }
    }

    const tagsArr = liveTagsInput.split(',').map(tag => tag.trim()).filter(Boolean);

    const payload = {
      id: isNew ? `trans-${Date.now()}` : (editingTransId || `trans-${Date.now()}`),
      youtubeUrl: formattedUrl,
      title: liveTitle.trim() || 'Transmissão Ao Vivo',
      subtitle: liveSubtitle.trim() || 'Culto da Família',
      date: `${liveDate}T${liveTime}`,
      isLive: liveIsLive,
      viewerCount: Number(liveViewerCount) || 0,
      isPublic: liveIsPublic,
      tags: tagsArr,
      updatedAt: new Date().toISOString()
    };

    let updatedList;
    if (!isNew && editingTransId) {
      updatedList = transmissions.map(t => t.id === editingTransId ? payload : t);
      try {
        await setDoc(doc(db, 'transmissions', payload.id), payload);
        onShowAlert("Transmissão editada e salva com sucesso!");
      } catch (err) {
        onShowAlert("Erro ao atualizar transmissão no Firebase.");
      }
    } else {
      updatedList = [...transmissions, payload];
      try {
        await setDoc(doc(db, 'transmissions', payload.id), payload);
        onShowAlert("Nova transmissão criada e salva com sucesso!");
      } catch (err) {
        onShowAlert("Erro ao criar nova transmissão no Firebase.");
      }
    }





    


    setEditingTransId(null);
    setLiveUrl('');
    setLiveTitle('');
    setLiveSubtitle('');
    setLiveIsLive(true);
    setLiveViewerCount(10);
    setLiveIsPublic(true);
    setLiveTagsInput('');

    if (onNotifyCreated) {
      onNotifyCreated('live', '📡 Transmissão Atualizada!', payload.title);
    }
  };

  const handleSaveLiveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveLiveTransmission(editingTransId === null);
  };

  const handleEditTransmissionClick = (t: any) => {
    setEditingTransId(t.id);
    setLiveUrl(t.youtubeUrl || '');
    setLiveTitle(t.title || '');
    setLiveSubtitle(t.subtitle || '');
    setLiveDate(t.date ? t.date.split('T')[0] : new Date().toISOString().split('T')[0]);
    setLiveTime(t.date && t.date.includes('T') ? t.date.split('T')[1].substring(0, 5) : '19:00');
    setLiveIsLive(t.isLive !== false);
    setLiveViewerCount(t.viewerCount || 0);
    setLiveIsPublic(t.isPublic !== false);
    setLiveTagsInput(t.tags ? t.tags.join(', ') : '');
    onShowAlert(`A transmissão "${t.title}" foi carregada no formulário de edição!`);
  };

  const handleDeleteTransmissionClick = async (id: string, title: string) => {
    const action = async () => {
      const updated = transmissions.filter(t => t.id !== id);
      setTransmissions(updated);
      
      try {
        await deleteDoc(doc(db, 'transmissions', id));
        localStorage.setItem('church_transmissions_list', JSON.stringify(updated));
        onShowAlert(`Transmissão "${title}" excluída com sucesso!`);
      } catch (err) {
        onShowAlert("Erro ao excluir transmissão no Firebase.");
      }
      
      // Escolher transmissão ativa
      if (updated.length > 0) {
        localStorage.setItem('church_youtube_live', JSON.stringify(updated[0]));
      } else {
        localStorage.removeItem('church_youtube_live');
      }
    };

    setConfirmDelete({
      id,
      type: 'Transmissão',
      action,
      name: title
    });
  };

  const handleNewTransmissionClick = () => {
    setEditingTransId(null);
    setLiveUrl('');
    setLiveTitle('');
    setLiveSubtitle('');
    setLiveIsLive(true);
    setLiveViewerCount(10);
    setLiveIsPublic(true);
    setLiveTagsInput('');
    setLiveTime('19:00');
    onShowAlert("Formulário redefinido para criar nova transmissão.");
  };

  const handleForcedSyncTransmissions = () => {
    const rawLocal = localStorage.getItem('church_transmissions_list');
    let localParsed: any[] = [];
    if (rawLocal) {
      try {
        localParsed = JSON.parse(rawLocal);
      } catch (e) {
        console.warn("Erro ao fazer parse do localStorage:", e);
      }
    }

    const firestoreList = propTransmissions || [];

    const hasOutdatedParity = () => {
      if (localParsed.length !== firestoreList.length) return true;
      for (const fItem of firestoreList) {
        const lItem = localParsed.find((l: any) => l.id === fItem.id);
        if (!lItem) return true;
        if (
          lItem.title !== fItem.title ||
          lItem.subtitle !== fItem.subtitle ||
          lItem.youtubeUrl !== fItem.youtubeUrl ||
          lItem.isLive !== fItem.isLive ||
          lItem.viewerCount !== fItem.viewerCount ||
          lItem.isPublic !== fItem.isPublic
        ) {
          return true;
        }
      }
      return false;
    };

    const isOutdated = hasOutdatedParity();

    // Force update localStorage regardless to ensure parity alignment
    localStorage.setItem('church_transmissions_list', JSON.stringify(firestoreList));

    if (firestoreList.length > 0) {
      const activeLiveRaw = localStorage.getItem('church_youtube_live');
      if (activeLiveRaw) {
        try {
          const currentActive = JSON.parse(activeLiveRaw);
          const freshActive = firestoreList.find((t: any) => t.id === currentActive.id);
          if (freshActive) {
            localStorage.setItem('church_youtube_live', JSON.stringify(freshActive));
          } else {
            localStorage.setItem('church_youtube_live', JSON.stringify(firestoreList[0]));
          }
        } catch (e) {
          localStorage.setItem('church_youtube_live', JSON.stringify(firestoreList[0]));
        }
      } else {
        localStorage.setItem('church_youtube_live', JSON.stringify(firestoreList[0]));
      }
    } else {
      localStorage.removeItem('church_youtube_live');
    }

    // Update internal transmissions state
    setTransmissions(firestoreList);

    if (isOutdated) {
      onShowAlert("Sincronização concluída! Diferenças encontradas foram corrigidas e o localStorage foi atualizado com as transmissões do Firestore.");
    } else {
      onShowAlert("Paridade confirmada! O localStorage já estava perfeitamente sincronizado com as transmissões do Firestore.");
    }
  };

  const handleForcedSyncCargos = async () => {
    const rawLocal = localStorage.getItem('church_custom_roles');
    let localParsed: string[] = [];
    if (rawLocal) {
      try {
        localParsed = JSON.parse(rawLocal);
      } catch (e) {
        console.warn("Erro ao ler localStorage de cargos:", e);
      }
    }

    const firestoreList = propCargos || [];

    // Encontra diferenças bidirecionais
    const missingInFirestore = localParsed.filter(
      (local) => !firestoreList.some((fs) => fs.toLowerCase() === local.toLowerCase())
    );

    const missingInLocal = firestoreList.filter(
      (fs) => !localParsed.some((local) => local.toLowerCase() === fs.toLowerCase())
    );

    const isOutdated = missingInFirestore.length > 0 || missingInLocal.length > 0;

    let finalCargos = [...firestoreList];

    if (missingInFirestore.length > 0) {
      try {
        const batch = writeBatch(db);
        missingInFirestore.forEach((extraRole) => {
          const docId = getUserDocId(extraRole);
          batch.set(doc(db, 'customRoles', docId), { name: extraRole });
          if (!finalCargos.includes(extraRole)) {
            finalCargos.push(extraRole);
          }
        });
        await batch.commit();
      } catch (err) {
        console.error("Erro ao sincronizar cargos locais adicionais no Firebase:", err);
      }
    }

    if (missingInLocal.length > 0) {
      missingInLocal.forEach((fsRole) => {
        if (!finalCargos.includes(fsRole)) {
          finalCargos.push(fsRole);
        }
      });
    }

    // Ordenar de forma alfabética pt-BR
    finalCargos = Array.from(new Set(finalCargos)).sort((a, b) => a.localeCompare(b, 'pt-BR'));

    localStorage.setItem('church_custom_roles', JSON.stringify(finalCargos));
    setCargos(finalCargos);

    if (isOutdated) {
      onShowAlert("Sincronização concluída! As funções do aplicativo local e do banco de dados online foram alinhadas e atualizadas com sucesso.");
    } else {
      onShowAlert("Paridade confirmada! As funções já estão perfeitamente sincronizadas entre o ambiente local e o banco de dados online.");
    }
  };

  // --- Add Event Form States ---
  const [evTitle, setEvTitle] = useState('');
  const [evDay, setEvDay] = useState(1);
  const [evMonth, setEvMonth] = useState('Mai');
  const [evTime, setEvTime] = useState('19:30');
  const [evEndTime, setEvEndTime] = useState('21:00');
  const [evLocation, setEvLocation] = useState('');
  const [evDescription, setEvDescription] = useState('');
  const [evDateStr, setEvDateStr] = useState('');
  const [evIsPaid, setEvIsPaid] = useState(false);
  const [evValue, setEvValue] = useState(0);
  const [evMural, setEvMural] = useState(false);
  const [evNotificar, setEvNotificar] = useState(false);
  const [evNeighborhood, setEvNeighborhood] = useState('');
  const [evCity, setEvCity] = useState('');
  const [evRoom, setEvRoom] = useState('');  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evTitle.trim() || !evLocation.trim()) {
      onShowAlert("Preencha ao menos o título e local da atividade.");
      return;
    }

    onAddEvent({
      title: evTitle.trim(),
      day: evDay,
      month: evMonth,
      timeStr: evTime,
      timeEnd: evEndTime,
      location: evLocation.trim(),
      description: evDescription.trim(),
      dateStr: evDateStr || `Sáb, ${evDay} de ${evMonth}`,
      isPaid: evIsPaid,
      value: evIsPaid ? evValue : 0,
      mural: evMural,
      notificarDiariamente: evNotificar,
      neighborhood: evNeighborhood,
      city: evCity,
      room: evRoom
    });

    onShowAlert(`Atividade "${evTitle}" cadastrada e integrada ao menu de Membros!`);
    
    // Reset Form
    setEvTitle('');
    setEvDay(12);
    setEvMonth('Jun');
    setEvTime('19:30');
    setEvLocation('');
    setEvDescription('');
    setEvDateStr('');
    setEvIsPaid(false);
    setEvValue(0);
    setEvMural(false);
    setEvNotificar(false);
    setEvNeighborhood('');
    setEvCity('');
    setEvRoom('');
  };

  // --- Add Cell Form States ---
  const [cellTitle, setCellTitle] = useState('');
  const [cellLeader, setCellLeader] = useState('');
  const [cellLeaderAvatar, setCellLeaderAvatar] = useState('https://lh3.googleusercontent.com/aida-public/AB6AXuDFzVPt8R12b6r0cJenxhGMSaRCVhnj5m2I1L63zIXLkZLH0Irma2hv_P5qK-GMNH3b3kCM43ZW9Q4PH9K2SiHy7-ODE2cNb2t8A_zr-BxvnChqsgjZT1LXBuf2HL7pp1fSDQrGvEk4mrCFhimqMvSUYOfz3wbz8iN8rRH9nRmA9gRdo6n7D4xRFLdEgI2ndKUZKvYauk-Nvw84QWoH51RjXus-LV6oWVbwI4n3EBJX3_zjwxm5Rnn2tM0Qd7UVF_wjMD9kxH-nvnE');
  const [cellDay, setCellDay] = useState('Quintas-feiras');
  const [cellTime, setCellTime] = useState('20h00');
  const [cellAddress, setCellAddress] = useState('');
  const [cellNeighborhood, setCellNeighborhood] = useState('');
  const [cellCity, setCellCity] = useState('');
  const [cellDistance, setCellDistance] = useState('2.0km de você');

  // --- States for Editing Cell Data ---
  const [editingCellId, setEditingCellId] = useState<string | null>(null);
  const [editCellTitle, setEditCellTitle] = useState('');
  const [editCellLeader, setEditCellLeader] = useState('');
  const [editCellSchedule, setEditCellSchedule] = useState('');
  const [editCellNeighborhood, setEditCellNeighborhood] = useState('');
  const [editCellAddress, setEditCellAddress] = useState('');

  // --- States for Editing Event Data ---
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editEvTitle, setEditEvTitle] = useState('');
  const [editEvAddress, setEditEvAddress] = useState('');
  const [editEvDay, setEditEvDay] = useState(1);
  const [editEvMonth, setEditEvMonth] = useState('Mai');
  const [editEvTime, setEditEvTime] = useState('19:30');
  const [editEvLocation, setEditEvLocation] = useState('');
  const [editEvDescription, setEditEvDescription] = useState('');
  const [editEvDateStr, setEditEvDateStr] = useState('');
  const [editEvEndTime, setEditEvEndTime] = useState('21:00');
  const [editEvIsPaid, setEditEvIsPaid] = useState(false);
  const [editEvValue, setEditEvValue] = useState(0);
  const [editEvMural, setEditEvMural] = useState(false);
  const [editEvNotificar, setEditEvNotificar] = useState(false);
  const [editEvNeighborhood, setEditEvNeighborhood] = useState('');
  const [editEvCity, setEditEvCity] = useState('');

  const handleCreateCell = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cellTitle.trim() || !cellLeader.trim() || !cellAddress.trim()) {
      onShowAlert("Preencha o título, líder e endereço da célula.");
      return;
    }

    onAddCell({
      title: cellTitle.trim(),
      leaderName: cellLeader.trim(),
      leaderAvatar: cellLeaderAvatar,
      schedule: `${cellDay}, ${cellTime}`,
      address: cellAddress.trim(),
      neighborhood: cellNeighborhood.trim() || 'Aquarius',
      city: cellCity.trim() || 'São Paulo',
      distance: cellDistance
    });

    onShowAlert(`Célula "${cellTitle}" adicionada para localização geográfica.`);
    
    // Reset Form
    setCellTitle('');
    setCellLeader('');
    setCellDay('Quintas-feiras');
    setCellTime('20h00');
    setCellAddress('');
    setCellNeighborhood('');
    setCellCity('');
  };

  // --- Add/Edit Church Studies Form States & Actions ---
  const [stTitle, setStTitle] = useState('');
  const [stAuthor, setStAuthor] = useState('');
  const [stContent, setStContent] = useState('');
  const [stVideoUrl, setStVideoUrl] = useState('');
  const [stAttachmentName, setStAttachmentName] = useState('');
  const [stAttachmentUrl, setStAttachmentUrl] = useState('');
  const [stAudioUrl, setStAudioUrl] = useState('');
  const [stAudioName, setStAudioName] = useState('');
  const [stTags, setStTags] = useState('');

  // Local helper for loading status
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: boolean }>({});

  // Editing state for Studies
  const [editingStudyId, setEditingStudyId] = useState<string | null>(null);

  // Radio IPBA program creation states
  const [radTitle, setRadTitle] = useState('');
  const [radSpeaker, setRadSpeaker] = useState('');
  const [radScheduledTime, setRadScheduledTime] = useState('Diariamente às 14h00');
  const [radAudioUrl, setRadAudioUrl] = useState('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'); 
  const [radAudioName, setRadAudioName] = useState('programacao_agendada_default.mp3');
  const [radTags, setRadTags] = useState('Mensagem, Fé');
  const [radFileProgress, setRadFileProgress] = useState(false);
  const [editingRadioId, setEditingRadioId] = useState<string | null>(null);

  const handleRadioFileRead = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRadFileProgress(true);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setRadAudioUrl(dataUrl);
      setRadAudioName(file.name);
      setRadFileProgress(false);
      onShowAlert(`Áudio "${file.name}" de agendamento carregado por completo!`);
    };
    reader.onerror = () => {
      setRadFileProgress(false);
      onShowAlert("Falha ao ler o arquivo de áudio.");
    };
    reader.readAsDataURL(file);
  };

  const handleCreateRadioSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!radTitle.trim()) {
      onShowAlert("Por favor, preencha o título do programa.");
      return;
    }
    if (!radSpeaker.trim()) {
      onShowAlert("Por favor, informe o locutor/pastor do programa.");
      return;
    }

    const tagsArr = radTags.split(',').map(t => t.trim()).filter(Boolean);

    if (editingRadioId && onUpdateRadioProgram) {
      onUpdateRadioProgram({
        id: editingRadioId,
        title: radTitle.trim(),
        speaker: radSpeaker.trim(),
        scheduledTime: radScheduledTime.trim(),
        audioUrl: radAudioUrl,
        audioName: radAudioName,
        tags: tagsArr,
        createdAt: new Date().toISOString()
      });
      onShowAlert("Programa de rádio atualizado com sucesso!");
    } else {
      onAddRadioProgram({
        title: radTitle.trim(),
        speaker: radSpeaker.trim(),
        scheduledTime: radScheduledTime.trim(),
        audioUrl: radAudioUrl,
        audioName: radAudioName,
        tags: tagsArr
      });
    }

    // Clear form & stop editing mode
    setEditingRadioId(null);
    setRadTitle('');
    setRadSpeaker('');
    setRadScheduledTime('Diariamente às 14h00');
    setRadAudioUrl('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3');
    setRadAudioName('programacao_agendada_default.mp3');
    setRadTags('Mensagem, Fé');
  };
  const [editStTitle, setEditStTitle] = useState('');
  const [editStAuthor, setEditStAuthor] = useState('');
  const [editStContent, setEditStContent] = useState('');
  const [editStVideoUrl, setEditStVideoUrl] = useState('');
  const [editStAttachmentName, setEditStAttachmentName] = useState('');
  const [editStAttachmentUrl, setEditStAttachmentUrl] = useState('');
  const [editStAudioUrl, setEditStAudioUrl] = useState('');
  const [editStAudioName, setEditStAudioName] = useState('');
  const [editStTags, setEditStTags] = useState('');

  const handleFileRead = (
    e: React.ChangeEvent<HTMLInputElement>,
    targetType: 'audio' | 'video' | 'attachment',
    isEdit: boolean = false
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show loading
    const fieldKey = `${targetType}-${isEdit ? 'edit' : 'new'}`;
    setUploadProgress(prev => ({ ...prev, [fieldKey]: true }));

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (isEdit) {
        if (targetType === 'audio') {
          setEditStAudioUrl(dataUrl);
          setEditStAudioName(file.name);
        } else if (targetType === 'video') {
          setEditStVideoUrl(dataUrl);
        } else if (targetType === 'attachment') {
          setEditStAttachmentUrl(dataUrl);
          setEditStAttachmentName(file.name);
        }
      } else {
        if (targetType === 'audio') {
          setStAudioUrl(dataUrl);
          setStAudioName(file.name);
        } else if (targetType === 'video') {
          setStVideoUrl(dataUrl);
        } else if (targetType === 'attachment') {
          setStAttachmentUrl(dataUrl);
          setStAttachmentName(file.name);
        }
      }
      setUploadProgress(prev => ({ ...prev, [fieldKey]: false }));
      onShowAlert(`Upload de ${file.name} finalizado e armazenado com sucesso!`);
    };
    reader.onerror = () => {
      setUploadProgress(prev => ({ ...prev, [fieldKey]: false }));
      onShowAlert("Erro ao ler o arquivo selecionado para upload.");
    };
    reader.readAsDataURL(file);
  };

  const handleCreateStudy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stTitle.trim() || !stContent.trim()) {
      onShowAlert("Preencha ao menos o título e o conteúdo escrito do estudo.");
      return;
    }

    const parsedTags = stTags ? stTags.split(',').map(tag => tag.trim()).filter(Boolean) : [];

    onAddStudy({
      title: stTitle.trim(),
      authorName: stAuthor.trim() || 'Pastor Administrador',
      content: stContent.trim(),
      videoUrl: stVideoUrl.trim(),
      attachmentName: stAttachmentName.trim(),
      attachmentUrl: stAttachmentUrl.trim(),
      audioUrl: stAudioUrl.trim(),
      audioName: stAudioName.trim(),
      tags: parsedTags,
    });

    onShowAlert(`Estudo Bíblico "${stTitle}" publicado com sucesso!`);

    // Reset fields
    setStTitle('');
    setStAuthor('');
    setStContent('');
    setStVideoUrl('');
    setStAttachmentName('');
    setStAttachmentUrl('');
    setStAudioUrl('');
    setStAudioName('');
    setStTags('');
  };

  const handleUpdateStudySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudyId || !editStTitle.trim() || !editStContent.trim()) {
      onShowAlert("Preencha os campos obrigatórios para salvar.");
      return;
    }

    const parsedEditTags = editStTags ? editStTags.split(',').map(tag => tag.trim()).filter(Boolean) : [];

    if (onUpdateStudy) {
      onUpdateStudy({
        id: editingStudyId,
        title: editStTitle.trim(),
        authorName: editStAuthor.trim() || 'Pastor Administrador',
        dateStr: 'Hoje',
        content: editStContent.trim(),
        videoUrl: editStVideoUrl.trim(),
        attachmentName: editStAttachmentName.trim(),
        attachmentUrl: editStAttachmentUrl.trim(),
        audioUrl: editStAudioUrl.trim(),
        audioName: editStAudioName.trim(),
        tags: parsedEditTags,
      });
      onShowAlert(`Estudo atualizado com sucesso.`);
    }
    setEditingStudyId(null);
  };

  // --- Add Offline Manual Receipt Form States ---
  const [treasuryCategory, setTreasuryCategory] = useState<Contribution['category']>('Oferta');
  const [treasuryMethod, setTreasuryMethod] = useState<Contribution['method']>('Pix');
  const [treasuryAmount, setTreasuryAmount] = useState('');
  const [treasuryTitle, setTreasuryTitle] = useState('');

  const handleCreateContribution = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(treasuryAmount);
    if (isNaN(parsed) || parsed <= 0) {
      onShowAlert("Forneça um valor financeiro válido.");
      return;
    }

    const categoryText = treasuryCategory;
    const fallbackTitle = treasuryTitle.trim() || `${categoryText} registrada em Culto (Manual)`;
    onAddContribution(parsed, categoryText, treasuryMethod, fallbackTitle, "Hoje, 2026");
    onShowAlert(`Lançamento manual de R$ ${parsed.toFixed(2)} inserido com sucesso na tesouraria.`);
    
    setTreasuryAmount('');
    setTreasuryTitle('');
  };

  // Total finances sum calculation
  const totalAmountSum = contributions.reduce((sum, item) => sum + item.amountVal, 0);
  const totalContributedGoal = 2000;
  const progressPercent = Math.min(Math.round((totalAmountSum / totalContributedGoal) * 100), 100);

  return (
    <div className="space-y-6 animate-fade-in pb-12 text-[#2c323f]">
      
      {/* Dynamic Banner Indicator */}
      <section className="relative overflow-hidden rounded-3xl bg-[#001939] p-6 text-white shadow-xl select-none flex items-center justify-between">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2.5px 2.5px, white 1px, transparent 0)', backgroundSize: '30px 30px' }} />
        <div className="space-y-1 z-10">
          <span className="text-amber-400 text-[10px] font-black uppercase tracking-[0.2em] block">
            PAINEL DO ADMINISTRADOR
          </span>
          <h1 className="font-display font-black text-2xl tracking-tight leading-tight">
            Controle Unificado
          </h1>
          <p className="text-slate-300 text-[11px] leading-relaxed max-w-sm">
            Adicione eventos, células, aprove pedidos de oração, regule o caixa e atribua cargos de liderança.
          </p>
        </div>
        <div className="bg-amber-400 text-[#001939] p-3 rounded-2xl shrink-0 shadow-md">
          <Activity className="w-6 h-6 animate-pulse" />
        </div>
      </section>

      {/* Sub-navigation tabs grid */}
      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-1 bg-white p-1 rounded-2xl border border-slate-200/60 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveSubTab('events')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl cursor-pointer transition-all ${
            activeSubTab === 'events' ? 'bg-[#002d5e] text-amber-400 font-extrabold shadow' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-4 h-4 shrink-0" />
          <span className="text-[10px] mt-1 font-extrabold uppercase tracking-wide">Eventos</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('prayers')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl cursor-pointer transition-all ${
            activeSubTab === 'prayers' ? 'bg-[#002d5e] text-amber-400 font-extrabold shadow' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <HeartHandshake className="w-4 h-4 shrink-0" />
          <span className="text-[10px] mt-1 font-extrabold uppercase tracking-wide">Orações</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('roles')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl cursor-pointer transition-all ${
            activeSubTab === 'roles' ? 'bg-[#002d5e] text-amber-400 font-extrabold shadow' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <UserCheck className="w-4 h-4 shrink-0" />
          <span className="text-[10px] mt-1 font-extrabold uppercase tracking-wide">Cargos 🛠️</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('members')}
          className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-xl cursor-pointer transition-all ${
            activeSubTab === 'members' ? 'bg-[#002d5e] text-amber-400 font-extrabold shadow' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center z-10">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4.5 w-4.5 bg-[#ff3b30] text-[9px] font-black text-white ring-2 ring-white items-center justify-center shadow-md">
                {pendingCount}
              </span>
            </span>
          )}
          <UserIcon className="w-4 h-4 shrink-0" />
          <span className="text-[10px] mt-1 font-extrabold uppercase tracking-wide">Membros 👥</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('cells')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl cursor-pointer transition-all ${
            activeSubTab === 'cells' ? 'bg-[#002d5e] text-amber-400 font-extrabold shadow' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span className="text-[10px] mt-1 font-extrabold uppercase tracking-wide">Células</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('live')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl cursor-pointer transition-all ${
            activeSubTab === 'live' ? 'bg-[#002d5e] text-amber-400 font-extrabold shadow' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Video className="w-4 h-4 shrink-0" />
          <span className="text-[10px] mt-1 font-extrabold uppercase tracking-wide">AO VIVO 🎥</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('studies')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl cursor-pointer transition-all ${
            activeSubTab === 'studies' ? 'bg-[#002d5e] text-amber-400 font-extrabold shadow' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="w-4 h-4 shrink-0" />
          <span className="text-[10px] mt-1 font-extrabold uppercase tracking-wide">Estudos 📖</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('radio')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl cursor-pointer transition-all ${
            activeSubTab === 'radio' ? 'bg-[#002d5e] text-amber-400 font-extrabold shadow' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Radio className="w-4 h-4 shrink-0" />
          <span className="text-[10px] mt-1 font-extrabold uppercase tracking-wide">Rádio 📻</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('support_options')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl cursor-pointer transition-all ${
            activeSubTab === 'support_options' ? 'bg-[#002d5e] text-amber-400 font-extrabold shadow' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <LifeBuoy className="w-4 h-4 shrink-0" />
          <span className="text-[10px] mt-1 font-extrabold uppercase tracking-wide">Erros/Suporte 🛠️</span>
        </button>
      </div>



      {activeSubTab === 'event_confirmations' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm animate-fade-in">
          <h2 className="text-xl font-black text-[#001939] mb-6">Confirmações de Eventos</h2>
          {events.length === 0 ? (
            <p className="text-slate-500 text-sm">Nenhum evento cadastrado.</p>
          ) : (
            <div className="space-y-4">
              {events.map(ev => (
                <div key={ev.id} className="p-4 border border-slate-100 rounded-2xl bg-slate-50">
                  <h3 className="font-extrabold text-sm text-[#001939] mb-3">{ev.title}</h3>
                  <div className="flex gap-3">
                    <button className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700">Confirmados ({ev.confirmedUsers?.length || 0})</button>
                    <button className="flex-1 py-2 text-xs font-bold text-white bg-red-600 rounded-xl hover:bg-red-700">Não Confirmados ({Math.max(0, 100 - (ev.confirmedUsers?.length || 0))})</button>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <p className="text-[10px] font-black text-[#001939] uppercase tracking-widest border-b border-slate-200 pb-1 flex items-center justify-between">
                      <span>Lista de Confirmados</span>
                      <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[9px]">{ev.confirmedUsers?.length || 0}</span>
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {ev.confirmedUsers && ev.confirmedUsers.length > 0 ? (
                        ev.confirmedUsers.map(email => {
                          const member = (dbUsers || []).find(u => (u.email || '').toLowerCase() === email.toLowerCase());
                          const displayName = member ? member.name : email;
                          const phone = member?.phone || '';
                          const whatsappLink = phone ? `https://wa.me/55${phone.replace(/\D/g, '')}` : null;
                          
                          return (
                            <div key={email} className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-left-2 duration-300">
                              <div className="flex flex-col">
                                <span className="text-[11px] font-black text-slate-800 leading-tight">{displayName}</span>
                                {member && <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tight">{member.category?.split(',')[0]}</span>}
                              </div>
                              {phone && whatsappLink && (
                                <a 
                                  href={whatsappLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="flex items-center gap-1.5 bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black hover:bg-emerald-600 transition-all shadow-md active:scale-95"
                                >
                                  <MessageCircle className="w-3.5 h-3.5"/> {phone}
                                </a>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-[11px] text-slate-400 italic py-2 text-center">Ainda não há participações confirmadas.</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RENDER EVENT SUB-TAB COMPONENT */}
      {activeSubTab === 'events' && (
        <div className="space-y-6 animate-fade-in text-left">
          
          {/* Create event card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
            <h3 className="font-extrabold text-[#001939] text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Plus className="w-5 h-5 text-indigo-750" />
              <span>Cadastrar Novo Evento ou Atividade</span>
            </h3>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Título do Evento</label>
                <input
                  type="text"
                  required
                  value={evTitle}
                  onChange={(e) => setEvTitle(e.target.value)}
                  className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-primary text-[#191c1d] font-bold"
                  placeholder="Ex: Culto de Jovens Aliança"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Dia (Número)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={evDay}
                    onChange={(e) => setEvDay(parseInt(e.target.value) || 1)}
                    className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-primary text-[#191c1d] font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Mês</label>
                  <select
                    value={evMonth}
                    onChange={(e) => setEvMonth(e.target.value)}
                    className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-primary text-[#191c1d] font-bold"
                  >
                    <option value="Jan">Janeiro (Jan)</option>
                    <option value="Fev">Fevereiro (Fev)</option>
                    <option value="Mar">Março (Mar)</option>
                    <option value="Abr">Abril (Abr)</option>
                    <option value="Mai">Maio (Mai)</option>
                    <option value="Jun">Junho (Jun)</option>
                    <option value="Jul">Julho (Jul)</option>
                    <option value="Ago">Agosto (Ago)</option>
                    <option value="Set">Setembro (Set)</option>
                    <option value="Out">Outubro (Out)</option>
                    <option value="Nov">Novembro (Nov)</option>
                    <option value="Dez">Dezembro (Dez)</option>
                  </select>
                </div>
              </div>

                {/* Event Timing */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Início</label>
                    <input
                      type="text"
                      required
                      value={evTime}
                      onChange={(e) => setEvTime(e.target.value)}
                      className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-primary text-[#191c1d] font-bold"
                      placeholder="Ex: 19:00"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Término</label>
                    <input
                      type="text"
                      value={evEndTime}
                      onChange={(e) => setEvEndTime(e.target.value)}
                      className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-primary text-[#191c1d] font-bold"
                      placeholder="Ex: 21:00"
                    />
                  </div>
                </div>

                {/* Location and Route Hint */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Sala / Local</label>
                  <input
                    type="text"
                    value={evRoom}
                    onChange={(e) => setEvRoom(e.target.value)}
                    className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-primary text-[#191c1d]"
                    placeholder="Ex: Sala A"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Endereço do Evento</label>
                  <input
                    type="text"
                    required
                    value={evLocation}
                    onChange={(e) => setEvLocation(e.target.value)}
                    className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-primary text-[#191c1d]"
                    placeholder="Ex: Templo Principal"
                  />
                  <div className="text-[9px] text-primary font-medium mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3"/> Rota disponível no Maps na visualização do evento.
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Bairro</label>
                    <input
                      type="text"
                      value={evNeighborhood}
                      onChange={(e) => setEvNeighborhood(e.target.value)}
                      className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-primary text-[#191c1d]"
                      placeholder="Ex: Centro"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Cidade</label>
                    <input
                      type="text"
                      value={evCity}
                      onChange={(e) => setEvCity(e.target.value)}
                      className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-primary text-[#191c1d]"
                      placeholder="Ex: São Paulo"
                    />
                  </div>
                </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Tipo de Evento</span>
                  <select
                    value={evIsPaid ? "paid" : "free"}
                    onChange={(e) => setEvIsPaid(e.target.value === "paid")}
                    className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-primary text-[#191c1d] font-bold"
                  >
                    <option value="free">Gratuito</option>
                    <option value="paid">Pago</option>
                  </select>
                </div>
                {evIsPaid && (
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Valor (R$)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={evValue}
                        onChange={(e) => setEvValue(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-primary text-[#191c1d] font-bold"
                        placeholder="Ex: 50.00"
                      />
                    </div>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Texto Visual do Calendário (Opcional)</span>
                <input
                  type="text"
                  value={evDateStr}
                  onChange={(e) => setEvDateStr(e.target.value)}
                  className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary text-[#191c1d]"
                  placeholder="Ex: Sab, 30 de Maio (Deixe em branco para autogerar)"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Descrição do Evento</label>
                <textarea
                  value={evDescription}
                  onChange={(e) => setEvDescription(e.target.value)}
                  className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-primary text-[#191c1d] min-h-[70px]"
                  placeholder="Descrição sobre a atividade que será exibida para os membros da comunidade..."
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={evMural}
                    onChange={(e) => setEvMural(e.target.checked)}
                    className="accent-primary"
                  />
                  Salvar no Mural
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={evNotificar}
                    onChange={(e) => setEvNotificar(e.target.checked)}
                    className="accent-primary"
                  />
                  Notificar diariamente
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-sky-700 hover:bg-sky-800 text-white font-bold uppercase tracking-widest text-[10px] rounded-xl shadow-xs transition-colors cursor-pointer text-center block"
              >
                SALVAR EVENTO
              </button>
            </form>
          </div>

          {/* Current list manager */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm space-y-3">
            <h3 className="font-extrabold text-[#001939] text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Calendar className="w-5 h-5 text-indigo-750" />
              <span>Gerenciar Atividades Cadastradas</span>
            </h3>

            <div className="space-y-2.5 max-h-80 overflow-y-auto no-scrollbar">
              {events.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-6">Nenhum evento atualmente ativo.</p>
              ) : (
                events.map((ev) => {
                  const isEditingThisEvent = editingEventId === ev.id;
                  
                  if (editingEventId && !isEditingThisEvent) return null;

                  if (isEditingThisEvent) {
                    return (
                      <form
                        key={ev.id}
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!editEvTitle.trim() || !editEvLocation.trim()) {
                            onShowAlert("Preencha o título e local do evento.");
                            return;
                          }
                          const updatedEvent: ChurchEvent = {
                            ...ev,
                            title: editEvTitle.trim(),
                            day: Number(editEvDay) || 1,
                            month: editEvMonth.trim(),
                            timeStr: editEvTime.trim(),
                            timeEnd: editEvEndTime.trim(),
                            location: editEvLocation.trim(),
                            address: editEvAddress.trim(),
                            description: editEvDescription.trim(),
                            dateStr: editEvDateStr.trim() || `${editEvDay} de ${editEvMonth}`,
                            isPaid: editEvIsPaid,
                            value: editEvIsPaid ? editEvValue : 0,
                            mural: editEvMural,
                            notificarDiariamente: editEvNotificar,
                          };
                          if (onUpdateEvent) {
                            onUpdateEvent(updatedEvent);
                          } else {
                            const loaded = localStorage.getItem('church_events');
                            if (loaded) {
                              const parsed: ChurchEvent[] = JSON.parse(loaded);
                              const next = parsed.map(item => item.id === ev.id ? updatedEvent : item);
                              localStorage.setItem('church_events', JSON.stringify(next));
                            }
                          }
                          setEditingEventId(null);
                          onShowAlert(`Atividade "${editEvTitle}" editada com sucesso!`);
                        }}
                        className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-3 block text-left"
                      >
                        <p className="text-[10px] text-indigo-750 font-black uppercase tracking-wider">Editar Evento</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[9px] text-[#2c323f]/50 font-black uppercase tracking-wider block">Título da Atividade</label>
                            <input
                              type="text"
                              required
                              value={editEvTitle}
                              onChange={(e) => setEditEvTitle(e.target.value)}
                              className="w-full bg-[#f3f4f5] border-none rounded-xl px-3 py-2 text-xs text-[#191c1d] font-bold outline-none"
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[9px] text-[#2c323f]/50 font-black uppercase tracking-wider block">Local / Sala</label>
                            <input
                              type="text"
                              required
                              value={editEvLocation}
                              onChange={(e) => setEditEvLocation(e.target.value)}
                              className="w-full bg-[#f3f4f5] border-none rounded-xl px-3 py-2 text-xs text-[#191c1d] outline-none"
                            />
                          </div>
                          <div className="space-y-1 col-span-2">
                            <label className="text-[9px] text-[#2c323f]/50 font-black uppercase tracking-wider block">Endereço</label>
                            <input
                              type="text"
                              required
                              value={editEvAddress}
                              onChange={(e) => setEditEvAddress(e.target.value)}
                              className="w-full bg-[#f3f4f5] border-none rounded-xl px-3 py-2 text-xs text-[#191c1d] outline-none"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 col-span-2">
                            <div className="space-y-1">
                              <label className="text-[9px] text-[#2c323f]/50 font-black uppercase tracking-wider block">Bairro</label>
                              <input
                                type="text"
                                value={editEvNeighborhood}
                                onChange={(e) => setEditEvNeighborhood(e.target.value)}
                                className="w-full bg-[#f3f4f5] border-none rounded-xl px-3 py-2 text-xs text-[#191c1d] outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] text-[#2c323f]/50 font-black uppercase tracking-wider block">Cidade</label>
                              <input
                                type="text"
                                value={editEvCity}
                                onChange={(e) => setEditEvCity(e.target.value)}
                                className="w-full bg-[#f3f4f5] border-none rounded-xl px-3 py-2 text-xs text-[#191c1d] outline-none"
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                             <label className="text-[9px] text-[#2c323f]/50 font-black uppercase tracking-wider block">Mural</label>
                             <input
                               type="checkbox"
                               checked={editEvMural}
                               onChange={(e) => setEditEvMural(e.target.checked)}
                               className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                             />
                          </div>
                          <div className="space-y-1">
                             <label className="text-[9px] text-[#2c323f]/50 font-black uppercase tracking-wider block">Notificar</label>
                             <input
                               type="checkbox"
                               checked={editEvNotificar}
                               onChange={(e) => setEditEvNotificar(e.target.checked)}
                               className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                             />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] text-[#2c323f]/50 font-black uppercase tracking-wider block">Descrição</label>
                          <textarea
                            value={editEvDescription}
                            onChange={(e) => setEditEvDescription(e.target.value)}
                            className="w-full bg-[#f3f4f5] border-none rounded-xl px-3 py-2 text-xs text-[#191c1d] outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                             <label className="text-[9px] text-[#2c323f]/50 font-black uppercase tracking-wider block">Início</label>
                             <input
                               type="text"
                               required
                               value={editEvTime}
                               onChange={(e) => setEditEvTime(e.target.value)}
                               className="w-full bg-[#f3f4f5] border-none rounded-xl px-3 py-2 text-xs text-[#191c1d] outline-none"
                             />
                          </div>
                          <div className="space-y-1">
                             <label className="text-[9px] text-[#2c323f]/50 font-black uppercase tracking-wider block">Término</label>
                             <input
                               type="text"
                               required
                               value={editEvEndTime}
                               onChange={(e) => setEditEvEndTime(e.target.value)}
                               className="w-full bg-[#f3f4f5] border-none rounded-xl px-3 py-2 text-xs text-[#191c1d] outline-none"
                             />
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                           <label className="flex items-center gap-2 text-[9px] text-[#2c323f]/50 font-black uppercase tracking-wider">
                              <input
                                type="checkbox"
                                checked={editEvIsPaid}
                                onChange={(e) => setEditEvIsPaid(e.target.checked)}
                              />
                              Atividade Paga?
                           </label>
                           {editEvIsPaid && (
                              <input
                                type="number"
                                placeholder="Valor"
                                value={editEvValue}
                                onChange={(e) => setEditEvValue(parseFloat(e.target.value) || 0)}
                                className="w-20 bg-[#f3f4f5] border-none rounded-xl px-3 py-2 text-xs text-[#191c1d] outline-none"
                              />
                           )}
                        </div>

                        <div className="flex gap-4">
                           <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                             <input
                               type="checkbox"
                               checked={editEvMural}
                               onChange={(e) => setEditEvMural(e.target.checked)}
                               className="accent-primary"
                             />
                             Salvar no Mural
                           </label>
                           <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                             <input
                               type="checkbox"
                               checked={editEvNotificar}
                               onChange={(e) => setEditEvNotificar(e.target.checked)}
                               className="accent-primary"
                             />
                             Notificar diariamente
                           </label>
                        </div>



                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div className="space-y-1">
                            <label className="text-[9px] text-[#2c323f]/50 font-black uppercase tracking-wider block">Dia (Nº)</label>
                            <input
                              type="number"
                              required
                              value={editEvDay}
                              onChange={(e) => setEditEvDay(Number(e.target.value))}
                              className="w-full bg-[#f3f4f5] border-none rounded-xl px-3 py-2 text-xs text-[#191c1d] outline-none font-semibold"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] text-[#2c323f]/50 font-black uppercase tracking-wider block">Mês (ex: Mai)</label>
                            <input
                              type="text"
                              required
                              value={editEvMonth}
                              onChange={(e) => setEditEvMonth(e.target.value)}
                              className="w-full bg-[#f3f4f5] border-none rounded-xl px-3 py-2 text-xs text-[#191c1d] outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] text-[#2c323f]/50 font-black uppercase tracking-wider block">Horário</label>
                            <input
                              type="text"
                              required
                              value={editEvTime}
                              onChange={(e) => setEditEvTime(e.target.value)}
                              className="w-full bg-[#f3f4f5] border-none rounded-xl px-3 py-2 text-xs text-[#191c1d] outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] text-[#2c323f]/50 font-black uppercase tracking-wider block">Data formatada</label>
                            <input
                              type="text"
                              value={editEvDateStr}
                              placeholder="Ex: Sáb, 12 de Jun"
                              onChange={(e) => setEditEvDateStr(e.target.value)}
                              className="w-full bg-[#f3f4f5] border-none rounded-xl px-3 py-2 text-xs text-[#191c1d] outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] text-[#2c323f]/50 font-black uppercase tracking-wider block">Breve Descrição / Informação</label>
                          <textarea
                            value={editEvDescription}
                            onChange={(e) => setEditEvDescription(e.target.value)}
                            className="w-full bg-[#f3f4f5] border-none rounded-xl px-3 py-2 text-xs text-[#191c1d] outline-none h-16 resize-none no-scrollbar font-sans"
                          />
                        </div>

                        <div className="flex gap-2 justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingEventId(null)}
                            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider rounded-xl cursor-pointer transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-6 py-3 bg-indigo-700 hover:bg-indigo-800 text-white font-black uppercase text-[10px] tracking-widest rounded-xl cursor-pointer transition-all shadow-sm"
                          >
                            Salvar Alterações
                          </button>
                        </div>
                      </form>
                    );
                  }

                  return (
                    <div key={ev.id} className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <h4 className="text-sm font-black text-[#191c1d]">{ev.title}</h4>
                          <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-indigo-600" />
                            {ev.dateStr} • {ev.timeStr} às {ev.timeEnd || '??:??'}
                          </p>
                          <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5">
                             <MapPin className="w-3 h-3 text-red-600" />
                             {ev.location} - {ev.address || 'Sem endereço específico'}
                          </p>
                        </div>
                        <div className="flex gap-1.5">
                        <button
                            type="button"
                            onClick={() => {
                              setEditingEventId(ev.id);
                              setEditEvTitle(ev.title || '');
                              setEditEvDay(ev.day || 1);
                              setEditEvMonth(ev.month || 'Mai');
                              setEditEvTime(ev.timeStr || '');
                              setEditEvLocation(ev.location || '');
                              setEditEvDescription(ev.description || '');
                              setEditEvDateStr(ev.dateStr || '');
                              setEditEvEndTime(ev.timeEnd || '21:00');
                              setEditEvIsPaid(!!ev.isPaid);
                              setEditEvValue(ev.value || 0);
                              setEditEvMural(!!ev.mural);
                              setEditEvNotificar(!!ev.notificarDiariamente);
                              setEditEvAddress(ev.address || '');
                              setEditEvNeighborhood(ev.neighborhood || '');
                              setEditEvCity(ev.city || '');
                            }}
                            className="p-2 text-indigo-650 hover:bg-indigo-50 hover:text-indigo-800 transition-colors rounded-lg cursor-pointer"
                            title="Editar Atividade"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setConfirmDelete({ id: ev.id, type: 'Evento', action: () => { onDeleteEvent(ev.id); onShowAlert(`Atividade "${ev.title}" removida.`); }, name: ev.title })}
                            className="p-2 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors rounded-lg cursor-pointer"
                            title="Excluir Atividade"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                          {ev.isPaid && (
                             <button className="flex items-center gap-1.5 text-[9px] font-bold uppercase text-white bg-emerald-600 px-3 py-1.5 rounded-lg hover:bg-emerald-700">
                                <DollarSign className="w-3 h-3"/> Pix (R$ {ev.value?.toFixed(2)})
                             </button>
                          )}
                          <button className="flex items-center gap-1.5 text-[9px] font-bold uppercase text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100">
                             <MapPin className="w-3 h-3"/> Rota Mapa
                          </button>
                      </div>

                      {/* Integrated Confirmation section */}
                      <div className="pt-3 border-t border-slate-100">
                           <div className="flex items-center justify-between mb-2">
                             <p className="text-[10px] text-indigo-900 font-black uppercase tracking-wider">Confirmados ({ev.confirmedUsers?.length || 0})</p>
                             <Users className="w-3.5 h-3.5 text-indigo-400" />
                           </div>
                           <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto no-scrollbar">
                             {ev.confirmedUsers && ev.confirmedUsers.length > 0 ? (
                               ev.confirmedUsers.map(email => {
                                 const member = (dbUsers || []).find(u => (u.email || '').toLowerCase() === email.toLowerCase());
                                 const displayName = member ? member.name : email;
                                 const phone = member?.phone || '';
                                 const whatsappLink = phone ? `https://wa.me/55${phone.replace(/\D/g, '')}` : null;
                                 
                                 return (
                                   <div key={email} className="flex items-center justify-between bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100/50 group transition-all hover:bg-white hover:shadow-sm">
                                     <div className="flex flex-col">
                                       <span className="text-[10px] font-extrabold text-slate-800 leading-tight">{displayName}</span>
                                       {member && <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tight">{member.category?.split(',')[0]}</span>}
                                     </div>
                                     {phone && whatsappLink && (
                                       <a 
                                         href={whatsappLink} 
                                         target="_blank" 
                                         rel="noopener noreferrer" 
                                         className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg text-[9px] font-black hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                       >
                                         <MessageCircle className="w-3 h-3"/> {phone}
                                       </a>
                                     )}
                                   </div>
                                 );
                               })
                             ) : (
                               <p className="text-[10px] text-slate-400 italic font-semibold py-1">Nenhuma confirmação ainda.</p>
                             )}
                           </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* RENDER PRAYER ACCORDION / SUB-TAB DESIGN */}
      {activeSubTab === 'prayers' && (
        <div className="space-y-6 animate-fade-in text-left">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-[#001939] text-sm flex items-center gap-1.5">
                <HeartHandshake className="w-5 h-5 text-[#ba1a1a]" />
                <span>Moderação & Aprovação de Orações</span>
              </h3>
              <span className="text-[10px] bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded font-black uppercase">
                {localPrayers.length} Pedidos
              </span>
            </div>

            {/* Authorization Notice Banner */}
            {(() => {
              const isAuthorizedToApprove = !!(userCategory && (
                userCategory.includes('Pastor') || 
                userCategory.includes('Presbítero') || 
                userCategory.includes('Admin') || 
                userCategory.includes('Coordenador')
              ));

              return (
                <div className={`p-3.5 rounded-xl text-xs font-semibold border flex items-center gap-2.5 ${
                  isAuthorizedToApprove 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                    : 'bg-amber-50 text-amber-800 border-amber-100'
                }`}>
                  <span className="text-base">{isAuthorizedToApprove ? '🟢' : '⚠️'}</span>
                  <div>
                    <p className="font-bold">
                      {isAuthorizedToApprove 
                        ? `Seu cargo (${userCategory}) está autorizado para aprovação.` 
                        : `Acesso leitura-apenas para o cargo (${userCategory || 'Visitante'}).`}
                    </p>
                    <p className="text-[10px] opacity-90 mt-0.5 font-medium">
                      Somente membros com cargos de pastor, presbítero ou administrador podem aprovar novas orações pendentes.
                    </p>
                  </div>
                </div>
              );
            })()}

            <div className="space-y-4 max-h-[480px] overflow-y-auto no-scrollbar pt-2">
              {localPrayers.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-8">Nenhum pedido de intercessão cadastrado.</p>
              ) : (
                localPrayers.map((prayer) => {
                  const isApproved = prayer.aprovado !== false;
                  const isAuthorizedToApprove = !!(userCategory && (
                    userCategory.includes('Pastor') || 
                    userCategory.includes('Presbítero') || 
                    userCategory.includes('Admin') || 
                    userCategory.includes('Coordenador')
                  ));

                  return (
                    <div key={prayer.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs shadow-xs">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase bg-indigo-100 text-indigo-700 border border-indigo-150">
                              {prayer.category}
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold">Por: {prayer.authorName}</span>
                            
                            {/* Status badge for approval */}
                            {isApproved ? (
                              <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wide">
                                Aprovado / Ativo
                              </span>
                            ) : (
                              <span className="bg-amber-100 text-amber-850 border border-amber-250 px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wide animate-pulse">
                                Aguardando Aprovação
                              </span>
                            )}
                          </div>
                          <h4 className="font-black text-sm text-[#191c1d] mt-1.5 leading-snug">{prayer.title}</h4>
                          <p className="text-slate-650 font-semibold mt-0.5 leading-relaxed">{prayer.description}</p>
                        </div>

                        <span className={`text-[9px] uppercase font-black px-2 py-1 rounded shrink-0 ${
                          prayer.visibilidade === 'Público' ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {prayer.visibilidade}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2.5 border-t border-slate-200/60">
                        <span className="text-[9.5px] text-slate-500 font-extrabold uppercase">
                          {prayer.count} Apoios de Oração
                        </span>

                        <div className="flex flex-wrap items-center gap-2 self-end select-none">
                          {/* Button 1: Aprovar */}
                          <button
                            type="button"
                            disabled={!isAuthorizedToApprove || isApproved}
                            onClick={() => {
                              setLocalPrayers(prev => prev.map(p => p.id === prayer.id ? { ...p, aprovado: true } : p));
                              onShowAlert(`Aprovou o pedido "${prayer.title}". Lembre-se de salvar.`);
                            }}
                            className={`px-2 py-1.5 text-[9px] font-bold uppercase rounded border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                              isApproved 
                                ? 'bg-slate-100 border-slate-200 text-slate-405'
                                : 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                          >
                            Aprovar
                          </button>

                          {/* Button 2: Reverter Aprovação */}
                          <button
                            type="button"
                            disabled={!isAuthorizedToApprove || !isApproved}
                            onClick={() => {
                              setLocalPrayers(prev => prev.map(p => p.id === prayer.id ? { ...p, aprovado: false } : p));
                              onShowAlert(`Aprovação desfeita para "${prayer.title}". Lembre-se de salvar.`);
                            }}
                            className={`px-2 py-1.5 text-[9px] font-bold uppercase rounded border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                              !isApproved 
                                ? 'bg-slate-100 border-slate-200 text-slate-405'
                                : 'bg-amber-500 border-amber-500 text-white hover:bg-amber-600'
                            }`}
                          >
                            Reverter Aprovação
                          </button>

                          {/* Button 3: Tornar Restrito Pastoral */}
                          <button
                            type="button"
                            disabled={!isAuthorizedToApprove}
                            onClick={() => {
                              const nextV = prayer.visibilidade === 'Público' ? 'Pastoral' : 'Público';
                              setLocalPrayers(prev => prev.map(p => p.id === prayer.id ? { ...p, visibilidade: nextV } : p));
                              onShowAlert(`Visibilidade de "${prayer.title}" alterada localmente para ${nextV === 'Pastoral' ? 'Restrito Pastoral' : 'Público'}. Lembre-se de salvar.`);
                            }}
                            className={`px-2 py-1.5 text-[9px] font-bold uppercase rounded border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                              prayer.visibilidade === 'Pastoral'
                                ? 'bg-purple-100 border-purple-200 text-purple-700 hover:bg-purple-200'
                                : 'bg-white border-slate-250 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {prayer.visibilidade === 'Pastoral' ? 'Tornar Público' : 'Tornar Restrito Pastoral'}
                          </button>

                          <button
                            onClick={() => setConfirmDelete({ 
                              id: prayer.id, 
                              type: 'Pedido de Oração', 
                              action: () => {
                                setLocalPrayers(prev => prev.filter(p => p.id !== prayer.id));
                                onDeletePrayer(prayer.id);
                                onShowAlert(`Pedido de Oração removido.`);
                              }, 
                              name: prayer.title 
                            })}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg cursor-pointer"
                            title="Remover pedido permanentemente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Commit save button */}
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (onSaveAllPrayers) {
                    onSaveAllPrayers(localPrayers);
                    onShowAlert("Pedidos de oração salvos e commitados com sucesso!");
                  } else {
                    onShowAlert("Erro interno: Ação de salvar indisponível no momento.");
                  }
                }}
                className="px-6 py-2.5 bg-[#002d5e] hover:bg-opacity-90 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <span>Salvar Pedidos</span>
              </button>
            </div>
          </div>
        </div>
      )}



      {/* RENDER DYNAMIC CARGOS (ROLES) SUB-TAB */}
      {activeSubTab === 'roles' && (
        <div className="space-y-6 animate-fade-in text-left">
          {/* Header row to trigger cargo force sync */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-slate-50 p-4 rounded-2xl border border-slate-200 gap-3">
            <div className="text-xs">
              <p className="font-extrabold text-[#001939]">Gerenciador de Cargos e Funções</p>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                Garanta a paridade das funções eclesiásticas entre o app local e o banco de dados online.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleForcedSyncCargos}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[10px] uppercase tracking-wider rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors"
                title="Sincronizar cargos locais com o Firestore"
              >
                <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
                <span>Sincronização Forçada de Cargos</span>
              </button>
            </div>
          </div>

          {/* Create new cargo form */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
            <h3 className="font-extrabold text-[#001939] text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Plus className="w-5 h-5 text-indigo-750" />
              <span>Criar cargo/função</span>
            </h3>

            <form onSubmit={handleCreateCargo} className="flex gap-2">
              <input
                type="text"
                required
                value={newCargoName}
                onChange={(e) => setNewCargoName(e.target.value)}
                className="flex-1 bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-primary text-[#191c1d] font-bold"
                placeholder="Ex: Diácono, Diaconisa, Pastor Auxiliar..."
              />
              <button
                type="submit"
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold uppercase text-[10px] tracking-wider rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Salvar Cargo
              </button>
            </form>
          </div>

          {/* List and manage current cargos */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm space-y-3">
            <h3 className="font-extrabold text-[#001939] text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <UserCheck className="w-5 h-5 text-indigo-750" />
              <span>Editar & Excluir Cargos do Aplicativo</span>
            </h3>

            <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
              {cargos.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-6">Nenhum cargo cadastrado.</p>
              ) : (
                cargos.map((cargo, idx) => (
                  <div key={cargo} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4 text-xs">
                    {editingCargoIndex === idx ? (
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={editingCargoName}
                          onChange={(e) => setEditingCargoName(e.target.value)}
                          className="flex-1 bg-white border border-slate-305 rounded-lg px-2.5 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-650 text-[#191c1d] font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEditCargo(idx)}
                          className="px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg cursor-pointer"
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCargoIndex(null)}
                          className="px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold rounded-lg cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="font-bold text-slate-800">
                          {cargo}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCargoIndex(idx);
                              setEditingCargoName(cargo);
                            }}
                            className="p-1.5 text-slate-500 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                            title="Editar Nome do Cargo"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleDeleteCargo(cargo)}
                            className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors rounded-lg cursor-pointer"
                            title="Deletar Cargo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* RENDER MEMBERS MODERATION AND ACCOUNT APPROVALS COMPONENT */}
      {activeSubTab === 'members' && (
        <div className="space-y-6 animate-fade-in text-left">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-[#001939] text-sm flex items-center gap-1.5">
                <Users className="w-5 h-5 text-indigo-750" />
                <span>Gestão Total de Membros (Aprovações & Contas)</span>
              </h3>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-150 px-2 py-0.5 rounded font-black uppercase">
                {dbUsers.length} Cadastrados
              </span>
            </div>

            <p className="text-[11px] text-[#2c323f]/60 font-medium leading-relaxed">
              Consulte a lista de membros de sua igreja local. Você pode aprovar novas inscrições de membros e excluir contas de teste ou duplicidades instantaneamente.
            </p>

            {/* Admin Add Member Trigger Button */}
            <div className="pt-1.5 pb-2">
              <button
                type="button"
                onClick={() => setShowAddMemberForm(!showAddMemberForm)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wide cursor-pointer transition-all shadow-sm ${
                  showAddMemberForm
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-[#002d5e] hover:bg-[#001c3d] text-white'
                }`}
              >
                <Plus className="w-4 h-4" />
                {showAddMemberForm ? "Fechar Formulário" : "Cadastrar Novo Membro 👤"}
              </button>
            </div>

            {/* Admin Add/Edit Member Form Box */}
            {showAddMemberForm && (
              <form onSubmit={editingMember ? handleUpdateMemberByAdmin : handleRegisterMemberByAdmin} className="bg-slate-50 border border-slate-200/80 p-5 rounded-3xl space-y-4 animate-fade-in text-xs shadow-xs">
                <div className="border-b border-slate-200 pb-2.5">
                  <h4 className="font-extrabold text-[#001939] text-xs uppercase tracking-wide flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-[#002d5e]" />
                    <span>{editingMember ? 'Editar Dados do Membro' : 'Cadastrar Novo Membro (Cadastro Direto Admin)'}</span>
                  </h4>
                  <p className="text-[10px] text-slate-550 font-medium mt-0.5">
                    {editingMember ? 'Atualize as informações do membro' : 'O membro será adicionado instantaneamente à base de dados com as informações fornecidas.'}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nome */}
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-black text-slate-500">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: João da Silva"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white text-slate-800 font-bold"
                    />
                  </div>

                  {/* E-mail (Disabled if editing) */}
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-black text-slate-500">Endereço de E-mail *</label>
                    <input
                      type="email"
                      required
                      placeholder="Ex: joao@email.com"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white text-slate-800 font-semibold"
                    />
                  </div>

                  {/* WhatsApp */}
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-black text-slate-500">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      placeholder="Ex: (11) 99999-9999"
                      value={newMemberPhone}
                      onChange={(e) => setNewMemberPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white text-slate-800 font-medium"
                    />
                  </div>

                  {/* Senha */}
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-black text-slate-500">Senha de Acesso</label>
                    <input
                      type="text"
                      placeholder="Padrão: 123"
                      value={newMemberPassword}
                      onChange={(e) => setNewMemberPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white text-slate-800 font-mono font-bold"
                    />
                  </div>

                  {/* Cargo/Categoria */}
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-black text-slate-500">Cargo / Função Primária *</label>
                    <select
                      value={newMemberCategory}
                      onChange={(e) => setNewMemberCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white font-bold text-slate-700"
                    >
                      {newMemberCategory && newMemberCategory.includes(',') && !cargos.includes(newMemberCategory) && (
                        <option value={newMemberCategory}>{newMemberCategory}</option>
                      )}
                      {cargos.map((cargoOpt) => (
                        <option key={cargoOpt} value={cargoOpt}>
                          {cargoOpt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Ministério */}
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-black text-slate-500">Ministério Atuante</label>
                    <input
                      type="text"
                      placeholder="Ex: Som & Mídia, Louvor, SAF..."
                      value={newMemberMinistry}
                      onChange={(e) => setNewMemberMinistry(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white text-slate-800"
                    />
                  </div>

                  {/* Nascimento */}
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-black text-slate-500">Data de Nascimento</label>
                    <input
                      type="date"
                      value={newMemberBirthDate}
                      onChange={(e) => setNewMemberBirthDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white font-semibold text-slate-700"
                    />
                  </div>

                  {/* Status Inicial */}
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-black text-slate-500">Status Inicial</label>
                    <select
                      value={newMemberStatus}
                      onChange={(e) => setNewMemberStatus(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white font-bold text-slate-805"
                    >
                      <option value="Ativo">Ativo ✅</option>
                      <option value="Pendente">Pendente ⏳</option>
                      <option value="Suspenso">Suspenso 🛑</option>
                    </select>
                  </div>

                  {/* Endereço */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="block text-[10px] uppercase font-black text-slate-500">Endereço Residencial</label>
                    <input
                      type="text"
                      placeholder="Ex: Alameda Lorena, 880 - Jardins, São Paulo"
                      value={newMemberAddress}
                      onChange={(e) => setNewMemberAddress(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white text-slate-800"
                    />
                  </div>

                  {/* Avatar Picker / Selection */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-[10px] uppercase font-black text-slate-500">Escolha um Avatar de Perfil</label>
                    <div className="flex gap-2.5 flex-wrap pt-0.5">
                      {[
                        'https://lh3.googleusercontent.com/aida-public/AB6AXuDFzVPt8R12b6r0cJenxhGMSaRCVhnj5m2I1L63zIXLkZLH0Irma2hv_P5qK-GMNH3b3kCM43ZW9Q4PH9K2SiHy7-ODE2cNb2t8A_zr-BxvnChqsgjZT1LXBuf2HL7pp1fSDQrGvEk4mrCFhimqMvSUYOfz3wbz8iN8rRH9nRmA9gRdo6n7D4xRFLdEgI2ndKUZKvYauk-Nvw84QWoH51RjXus-LV6oWVbwI4n3EBJX3_zjwxm5Rnn2tM0Qd7UVF_wjMD9kxH-nvnE',
                        'https://lh3.googleusercontent.com/aida-public/AB6AXuCAw9f0m9zhnseECjh851sbC_y6zLT72KxZLFVCXdRwDIWH1CC-47FIiUxUXqTuB95Spni3XDvS7u1c-glbKjtQ2aiQke9uLjXjx-PV80NSNENNsu_daFFwxaV4mbyOOaA9-ScMxItwTnqLmvpGA-Dd2xJWBIz5zJZspCQG6fQDPZ6kwo3E_MeyjhrwVP4B2tYvr6V3HBeiGN899eENqjHE6bBz6N_K14zK1XoogBk6NAT1WsQyx2fJXpIuYiRJK92dLfb6Zkrbf9c',
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
                        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
                        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150',
                        'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=150'
                      ].map((imgUrl, i) => (
                        <button
                          type="button"
                          key={i}
                          onClick={() => setNewMemberAvatarUrl(imgUrl)}
                          className={`w-11 h-11 rounded-full overflow-hidden border-2 cursor-pointer transition-all ${
                            newMemberAvatarUrl === imgUrl ? 'border-indigo-600 scale-105 shadow-md ring-2 ring-indigo-100' : 'border-slate-300 hover:border-slate-400'
                          }`}
                        >
                          <img src={imgUrl} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-200">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-all cursor-pointer shadow-md uppercase tracking-wide text-[10px]"
                  >
                    {editingMember ? 'Salvar Alterações 💾' : 'Salvar Novo Cadastro 💾'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddMemberForm(false);
                      setEditingMember(null);
                       // Reset fields
                      setNewMemberName('');
                      setNewMemberEmail('');
                      setNewMemberPhone('');
                      setNewMemberCategory('Membro Comungante');
                      setNewMemberMinistry('');
                      setNewMemberBirthDate('');
                      setNewMemberAddress('');
                      setNewMemberStatus('Ativo');
                    }}
                    className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-extrabold rounded-xl border border-slate-200 transition-all cursor-pointer shadow-xs uppercase tracking-wide text-[10px]"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3 max-h-[485px] overflow-y-auto no-scrollbar pt-2">
              {dbUsers.map((mbr, idx) => {
                const isPending = mbr.status === 'Pendente';
                const isSuspended = mbr.status === 'Suspenso';
                const key = `${mbr.email || 'no-email'}-${idx}`;
                const isConfirmingDelete = memberToDeleteKey === key;

                return (
                  <div key={key} className="relative p-5 bg-slate-50 border border-slate-200 rounded-3xl flex flex-col gap-3 text-xs w-full min-h-[140px] shadow-xs">
                    {isConfirmingDelete ? (
                      <div className="flex flex-col items-center justify-center py-4 px-2 text-center space-y-3 animate-fade-in w-full">
                        <p className="font-extrabold text-red-700 text-[11px] uppercase tracking-wide flex items-center gap-1.5">
                          <span>Confirmar Exclusão de Membro ⚠️</span>
                        </p>
                        <p className="text-slate-700 font-bold max-w-md leading-relaxed text-[11px]">
                          Tem certeza que deseja excluir permanentemente o cadastro de <span className="font-black text-slate-900">"{mbr.name}"</span>? Esta ação não poderá ser desfeita.
                        </p>
                        <div className="flex justify-center gap-3 w-full max-w-xs pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              handleDeleteMember(mbr.email || '');
                              setMemberToDeleteKey(null);
                            }}
                            className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl transition-all cursor-pointer shadow-xs uppercase tracking-wide text-[10px]"
                          >
                            Sim, Excluir 🗑️
                          </button>
                          <button
                            type="button"
                            onClick={() => setMemberToDeleteKey(null)}
                            className="flex-1 py-2 bg-white hover:bg-slate-100 text-slate-700 font-extrabold rounded-xl border border-slate-200 transition-all cursor-pointer shadow-xs uppercase tracking-wide text-[10px]"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Trash Icon absolute at the top-right corner of the card */}
                        <button
                          type="button"
                          onClick={() => {
                            setMemberToDeleteKey(key);
                          }}
                          className="absolute top-4 right-4 p-2 text-red-505 hover:bg-red-50 hover:text-red-700 transition-colors border border-slate-200 rounded-xl cursor-pointer shadow-xs bg-white shrink-0 z-10"
                          title="Remover Membro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full pr-12">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-250 shadow-xs shrink-0 bg-white">
                          <img src={mbr.avatarUrl} alt={mbr.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-black text-[#191c1d] leading-tight text-sm">{mbr.name}</h4>
                            {isPending && <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-250 px-2 py-0.2 rounded font-black uppercase">Pendente</span>}
                            {isSuspended && <span className="text-[9px] bg-red-100 text-red-800 border border-red-250 px-2 py-0.2 rounded font-black uppercase">Suspenso</span>}
                            {(!isPending && !isSuspended) && <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.2 rounded font-black uppercase">Ativo</span>}
                          </div>
                          <p className="text-[10px] text-[#2c323f]/55 font-bold mt-0.5">
                            {mbr.email || 'Sem e-mail'}
                          </p>
                          
                          {mbr.phone ? (
                            <div className="mt-2.5">
                              <a 
                                href={`https://wa.me/55${mbr.phone.replace(/\D/g, '')}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20ba5a] active:scale-95 text-white py-1.5 px-3 rounded-xl text-[10px] font-black shadow-xs transition-transform cursor-pointer"
                                title="Chamar no WhatsApp"
                                id={`whatsapp-btn-${idx}`}
                              >
                                <MessageCircle className="w-3.5 h-3.5 fill-white text-white shrink-0"/>
                                <span>WhatsApp: {mbr.phone}</span>
                              </a>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-semibold block mt-1.5">Sem telefone cadastrado</span>
                          )}
                          
                          
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-black uppercase bg-indigo-100/60 border border-indigo-150 text-indigo-700 px-1.5 py-0.5 rounded">
                              Cargo: {mbr.category}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMember(mbr);
                            setNewMemberName(mbr.name || '');
                            setNewMemberEmail(mbr.email || '');
                            setNewMemberPhone(mbr.phone || '');
                            setNewMemberCategory(mbr.category || 'Membro Comungante');
                            setNewMemberMinistry(mbr.ministry || '');
                            setNewMemberBirthDate(mbr.birthDate || '');
                            setNewMemberAddress(mbr.address || '');
                            setNewMemberStatus(mbr.status as any || 'Ativo');
                            setNewMemberAvatarUrl(mbr.avatarUrl || '');
                            setShowAddMemberForm(true);
                          }}
                          className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold rounded-lg text-[10px] hover:bg-indigo-100 cursor-pointer shadow-xs transition-all uppercase tracking-wide w-full"
                        >
                          Editar Perfil ✏️
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => {
                            const key = mbr.email || String(idx);
                            setEditingMemberEmail(prev => {
                              if (prev === key) {
                                return null;
                              } else {
                                const currentCategory = mbr.category || '';
                                const initial = currentCategory.split(',').map(c => c.trim()).filter(Boolean);
                                setSelectedCargos(initial);
                                return key;
                              }
                            });
                          }}
                          className={`px-3.5 py-1.5 font-bold text-[10px] uppercase tracking-wide rounded-lg cursor-pointer shadow-xs border transition-all w-full ${
                            editingMemberEmail === (mbr.email || String(idx))
                              ? 'bg-[#002d5e] text-amber-400 border-[#002d5e]'
                              : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          {editingMemberEmail === (mbr.email || String(idx)) ? "Fechar Edição ✖" : "Editar Funções ⚙️"}
                        </button>

                        {!isPending && !isSuspended && (
                           <button
                             type="button"
                             onClick={() => handleSuspendMember(mbr.email || '')}
                             className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] uppercase tracking-wide rounded-lg cursor-pointer shadow-xs transition-all col-span-2 w-full"
                           >
                             Suspender 🛑
                           </button>
                        )}
                        {isSuspended && (
                           <button
                             type="button"
                             onClick={() => handleApproveMember(mbr.email || '')}
                             className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wide rounded-lg cursor-pointer shadow-xs transition-all col-span-2 w-full"
                           >
                             Reativar ✅
                           </button>
                        )}
                        
                        {isPending && (
                          <button
                            type="button"
                            onClick={() => handleApproveMember(mbr.email || '')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wide rounded-lg cursor-pointer shadow-xs transition-all col-span-2 w-full"
                          >
                            Aprovar Membro ✅
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Inline Centered Multiple Cargo Selector with custom radio-button styled circles */}
                    {editingMemberEmail === (mbr.email || String(idx)) && (
                      <div className="mt-2 pt-3 border-t border-slate-200/60 w-full flex flex-col items-center animate-fade-in">
                        <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider pb-2 text-center w-full">
                          Atribuir Cargos / Funções na Igreja (Marque os botões circulares abaixo):
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 w-full max-w-xl mx-auto justify-center">
                          {cargos.map((cargoOpt) => {
                            const isChecked = selectedCargos.includes(cargoOpt);
                            return (
                              <button 
                                type="button"
                                key={cargoOpt} 
                                onClick={() => handleToggleCargo(cargoOpt)}
                                className={`flex items-center gap-2 text-[10px] font-extrabold p-2 px-3 rounded-xl transition-colors border cursor-pointer select-none justify-center w-full ${isChecked ? 'bg-indigo-50 border-indigo-150 text-indigo-850 shadow-xs' : 'bg-white border-slate-150 hover:bg-slate-100 text-slate-600'}`}
                              >
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isChecked ? 'border-indigo-600 bg-indigo-600' : 'border-slate-350 bg-white'}`}>
                                  {isChecked && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                                <span className="leading-tight shrink-0">{cargoOpt}</span>
                              </button>
                            );
                          })}
                        </div>
                        <div className="mt-3.5 pt-3.5 border-t border-slate-200/60 flex justify-end w-full max-w-xl mx-auto">
                          <button
                            type="button"
                            onClick={() => handleSaveSingleMember(mbr.email || '')}
                            className="px-5 py-2 bg-[#002d5e] hover:bg-opacity-90 text-white text-[10px] font-black uppercase tracking-wider rounded-xl shadow-md cursor-pointer transition-all"
                          >
                            Salvar Funções de {mbr.name.split(' ')[0]}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
              })}
            </div>

          </div>
        </div>
      )}

      {/* RENDER LIVE YOUTUBE MEDIA CONTROL COMPONENT */}
      {activeSubTab === 'live' && (
        <div className="space-y-6 animate-fade-in text-left">
          
          {/* Header row to trigger creating a new stream */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-slate-50 p-4 rounded-2xl border border-slate-200 gap-3">
            <div className="text-xs">
              <p className="font-extrabold text-[#001939]">Gerenciador de Transmissões</p>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                {transmissions.length} transmissões cadastradas no total
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleForcedSyncTransmissions}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[10px] uppercase tracking-wider rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors"
                title="Sincronizar localStorage com o Firestore"
              >
                <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
                <span>Sincronização Forçada</span>
              </button>
              <button
                onClick={handleNewTransmissionClick}
                className="px-3 py-1.5 bg-[#002d5e] hover:bg-slate-900 text-amber-400 font-extrabold text-[10px] uppercase tracking-wider rounded-lg shadow-xs cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Transmissão</span>
              </button>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
            <h3 className="font-extrabold text-[#001939] text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Tv className="w-5 h-5 text-red-650" />
              <span>
                {editingTransId ? `Editar Transmissão: ${liveTitle || 'Sem Título'}` : 'Criar Nova Transmissão (Ao Vivo YT)'}
              </span>
            </h3>

            <form onSubmit={handleSaveLiveConfig} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Link ou Embed URL do YouTube</label>
                <input
                  type="text"
                  required
                  value={liveUrl}
                  onChange={(e) => setLiveUrl(e.target.value)}
                  className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-primary text-[#191c1d] font-bold"
                  placeholder="Ex: https://www.youtube.com/embed/5qap5aO4i9A ou link convencional"
                />
                <span className="text-[9px] text-slate-400 block font-semibold">Transformamos automaticamente links convencionais/compartilhar do celular.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Título da Série / Celebração</label>
                  <input
                    type="text"
                    required
                    value={liveTitle}
                    onChange={(e) => setLiveTitle(e.target.value)}
                    className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-primary text-[#191c1d]"
                    placeholder="Ex: Série Expositiva: Epístola de Filipenses"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Sermão, Pastor e Data</label>
                  <input
                    type="text"
                    required
                    value={liveSubtitle}
                    onChange={(e) => setLiveSubtitle(e.target.value)}
                    className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-primary text-[#191c1d]"
                    placeholder='Ex: Sermão: "Alegria nas Tribulações" • Rev. Roberto Silva'
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Data da Transmissão</label>
                  <input
                    type="date"
                    required
                    value={liveDate}
                    onChange={(e) => setLiveDate(e.target.value)}
                    className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-primary text-[#191c1d] font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Horário da Transmissão</label>
                  <input
                    type="time"
                    required
                    value={liveTime}
                    onChange={(e) => setLiveTime(e.target.value)}
                    className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-primary text-[#191c1d] font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Estimativa de Espectadores</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={liveViewerCount}
                    onChange={(e) => setLiveViewerCount(Number(e.target.value) || 0)}
                    className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-primary text-[#191c1d] font-bold"
                  />
                </div>

                <div className="space-y-1 flex flex-col justify-end pb-1.5">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isLiveCheckbox"
                      checked={liveIsLive}
                      onChange={(e) => setLiveIsLive(e.target.checked)}
                      className="w-4 h-4 text-[#ba1a1a] focus:ring-primary border-slate-300 rounded"
                    />
                    <label htmlFor="isLiveCheckbox" className="text-xs font-extrabold text-[#001939] cursor-pointer">
                      Sinal de transmissão Ao Vivo ATIVA (Vermelha)
                    </label>
                  </div>
                </div>
              </div>

              {/* Tags de Categoria do Vídeo */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
                  Tags da Transmissão (Separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={liveTagsInput}
                  onChange={(e) => setLiveTagsInput(e.target.value)}
                  className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-primary text-[#191c1d]"
                  placeholder="Ex: Teologia, Culto, Domingo, Família"
                />
                <span className="text-[9px] text-slate-400 block font-semibold">
                  As tags ajudam os membros a catalogar e filtrar as transmissões salvas.
                </span>
              </div>

              {/* Visão Pública vs Visão Privada Toggles */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
                  Visibilidade do Vídeo
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLiveIsPublic(true)}
                    className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      liveIsPublic
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                  >
                    <span className="text-base">🌐</span>
                    <span>Vídeo Público</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLiveIsPublic(false)}
                    className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      !liveIsPublic
                        ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-xs'
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                  >
                    <span className="text-base">🔒</span>
                    <span>Vídeo Privado</span>
                  </button>
                </div>
                <span className="text-[9px] text-slate-400 block font-semibold">
                  Vídeos privados são ocultados de membros regulares e ficam restritos apenas aos perfis autorizados (Administrador, Pastor e Presbítero).
                </span>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                {editingTransId ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSaveLiveTransmission(false)}
                      className="w-full sm:flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-widest text-[10px] rounded-xl shadow-xs transition-colors cursor-pointer text-center block"
                    >
                      Salvar Transmissão Editada
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveLiveTransmission(true)}
                      className="w-full sm:flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-widest text-[10px] rounded-xl shadow-xs transition-colors cursor-pointer text-center block"
                    >
                      Salvar como Nova
                    </button>
                    <button
                      type="button"
                      onClick={handleNewTransmissionClick}
                      className="w-full sm:w-auto px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase tracking-widest text-[10px] rounded-xl transition-colors cursor-pointer text-center block"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSaveLiveTransmission(true)}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-widest text-[10px] rounded-xl shadow-xs transition-colors cursor-pointer text-center block"
                  >
                    Salvar Nova Transmissão
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* List existing transmissions */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm space-y-3">
            <h3 className="font-extrabold text-[#001939] text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Tv className="w-5 h-5 text-indigo-750" />
              <span>Lista de Transmissões do Aplicativo</span>
            </h3>

            <div className="space-y-3">
              {transmissions.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-6">Nenhuma transmissão salva.</p>
              ) : (
                transmissions.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1.5 text-left">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                          t.isLive ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-100 text-slate-600 border-slate-250'
                        }`}>
                          {t.isLive ? 'Ao Vivo' : 'Gravado'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                          t.isPublic !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {t.isPublic !== false ? 'Público' : 'Privado 🔒'}
                        </span>
                        {t.date && (
                          <span className="text-[9px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {new Date(t.date).toLocaleDateString('pt-BR')} {t.date.includes('T') ? new Date(t.date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : ''}
                          </span>
                        )}
                        <span className="text-[9px] font-semibold text-slate-400">
                          {t.viewerCount} espectadores
                        </span>
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 text-sm leading-tight">{t.title}</h4>
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{t.subtitle}</p>
                        {t.tags && t.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {t.tags.map((tg: string, idx: number) => (
                              <span key={idx} className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded text-[8px] font-black uppercase tracking-wider">
                                🏷️ {tg}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleEditTransmissionClick(t)}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-250 rounded-xl font-bold uppercase text-[9px] text-primary shadow-xs cursor-pointer"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteTransmissionClick(t.id, t.title)}
                        className="p-2 hover:bg-rose-50 border border-slate-150 hover:border-rose-250 rounded-xl text-red-600 cursor-pointer"
                        title="Excluir Transmissão"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* RENDER CELLS MANAGEMENT COMPONENT */}
      {activeSubTab === 'cells' && (
        <div className="space-y-6 animate-fade-in text-left">
          
          {/* Create Cell card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
            <h3 className="font-extrabold text-[#001939] text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Plus className="w-5 h-5 text-indigo-750" />
              <span>Cadastrar Nova Célula / Grupo</span>
            </h3>

            <form onSubmit={handleCreateCell} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Nome do Pequeno Grupo</label>
                  <input
                    type="text"
                    required
                    value={cellTitle}
                    onChange={(e) => setCellTitle(e.target.value)}
                    className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-primary text-[#191c1d] font-bold"
                    placeholder="Ex: Célula Betânia"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Nome do Líder Responsável</label>
                  <input
                    type="text"
                    required
                    value={cellLeader}
                    onChange={(e) => setCellLeader(e.target.value)}
                    className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-primary text-[#191c1d]"
                    placeholder="Ex: Diácono André Lima"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Dia</label>
                  <input
                    type="text"
                    required
                    value={cellDay}
                    onChange={(e) => setCellDay(e.target.value)}
                    className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-primary text-[#191c1d] font-semibold"
                    placeholder="Ex: Quintas-feiras"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Horário</label>
                  <input
                    type="text"
                    required
                    value={cellTime}
                    onChange={(e) => setCellTime(e.target.value)}
                    className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-primary text-[#191c1d] font-semibold"
                    placeholder="Ex: 20h00"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Endereço Completo</label>
                <input
                  type="text"
                  required
                  value={cellAddress}
                  onChange={(e) => setCellAddress(e.target.value)}
                  className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-primary text-[#191c1d]"
                  placeholder="Ex: Alameda das Flores, 120"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Cidade</label>
                  <input
                    type="text"
                    required
                    value={cellCity}
                    onChange={(e) => setCellCity(e.target.value)}
                    className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-primary text-[#191c1d]"
                    placeholder="Ex: Cabo Frio"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Bairro</label>
                  <input
                    type="text"
                    required
                    value={cellNeighborhood}
                    onChange={(e) => setCellNeighborhood(e.target.value)}
                    className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-primary text-[#191c1d]"
                    placeholder="Ex: Centro"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#002d5e] hover:bg-[#002d5e]/90 text-white font-bold uppercase tracking-widest text-[10px] rounded-xl shadow-md transition-all cursor-pointer text-center block"
              >
                Salvar Célula
              </button>
            </form>
          </div>

          {/* Current cells lists */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
            <h3 className="font-extrabold text-[#001939] text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Users className="w-5 h-5 text-indigo-750" />
              <span>EDITAR CÉLULA/GRUPO</span>
            </h3>

            <div className="space-y-2.5 max-h-80 overflow-y-auto no-scrollbar">
              {cells.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-6">Nenhuma célula lançada.</p>
              ) : (
                cells.map((gp) => {
                  const isEditingThisCell = editingCellId === gp.id;
                  if (isEditingThisCell) {
                    return (
                      <form
                        key={gp.id}
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!editCellTitle.trim() || !editCellLeader.trim() || !editCellAddress.trim()) {
                            onShowAlert("Preencha todos os campos obrigatórios da Célula.");
                            return;
                          }
                          const updatedCell: Cell = {
                            ...gp,
                            title: editCellTitle.trim(),
                            leaderName: editCellLeader.trim(),
                            schedule: editCellSchedule.trim(),
                            neighborhood: editCellNeighborhood.trim(),
                            address: editCellAddress.trim(),
                          };
                          if (onUpdateCell) {
                            onUpdateCell(updatedCell);
                          } else {
                            const loaded = localStorage.getItem('church_cells');
                            if (loaded) {
                              const parsed: Cell[] = JSON.parse(loaded);
                              const next = parsed.map(c => c.id === gp.id ? updatedCell : c);
                              localStorage.setItem('church_cells', JSON.stringify(next));
                            }
                          }
                          setEditingCellId(null);
                          onShowAlert(`Célula "${editCellTitle}" editada com sucesso!`);
                        }}
                        className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-4 block text-left"
                      >
                        <p className="text-[11px] text-[#002d5e] font-extrabold uppercase tracking-widest border-b border-slate-200 pb-1.5 mb-2">Editar Célula</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Nome do Grupo</label>
                            <input
                              type="text"
                              required
                              value={editCellTitle}
                              onChange={(e) => setEditCellTitle(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-[#191c1d] font-bold outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Líder Responsável</label>
                            <input
                              type="text"
                              required
                              value={editCellLeader}
                              onChange={(e) => setEditCellLeader(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-[#191c1d] font-semibold outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Horário e Dia</label>
                            <input
                              type="text"
                              required
                              value={editCellSchedule}
                              onChange={(e) => setEditCellSchedule(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-[#191c1d] font-semibold outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Bairro de Reunião</label>
                            <input
                              type="text"
                              required
                              value={editCellNeighborhood}
                              onChange={(e) => setEditCellNeighborhood(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-[#191c1d] font-semibold outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Endereço Completo</label>
                          <input
                            type="text"
                            required
                            value={editCellAddress}
                            onChange={(e) => setEditCellAddress(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-[#191c1d] font-semibold outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          />
                        </div>

                        <div className="flex gap-2 justify-end pt-2">
                          <button
                            type="button"
                            onClick={() => setEditingCellId(null)}
                            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold uppercase text-[10px] tracking-wider rounded-xl cursor-pointer transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-[#002d5e] hover:bg-[#002d5e]/90 text-white font-bold uppercase text-[10px] tracking-wider rounded-xl cursor-pointer transition-colors"
                          >
                            Salvar Dados
                          </button>
                        </div>
                      </form>
                    );
                  }

                  return (
                    <div key={gp.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
                      <div className="space-y-0.5 truncate">
                        <h4 className="text-xs font-black text-[#191c1d] truncate">{gp.title}</h4>
                        <p className="text-[10px] text-[#2c323f]/50 block">Líder: {gp.leaderName} • {gp.schedule}</p>
                        <p className="text-[9px] text-slate-400 truncate">{gp.address} ({gp.neighborhood})</p>
                      </div>
                      
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCellId(gp.id);
                            setEditCellTitle(gp.title || '');
                            setEditCellLeader(gp.leaderName || '');
                            setEditCellSchedule(gp.schedule || '');
                            setEditCellNeighborhood(gp.neighborhood || '');
                            setEditCellAddress(gp.address || '');
                          }}
                          className="p-2 text-indigo-650 hover:bg-indigo-50 hover:text-indigo-800 transition-colors rounded-lg cursor-pointer"
                          title="Editar Dados da Célula"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setConfirmDelete({ id: gp.id, type: 'Célula', action: () => { onDeleteCell(gp.id); onShowAlert(`Célula "${gp.title}" removida.`); }, name: gp.title })}
                          className="p-2 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors rounded-lg cursor-pointer"
                          title="Excluir Célula"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* RENDER STUDIES MANAGEMENT COMPONENT */}
      {activeSubTab === 'studies' && (
        <div className="space-y-6 animate-fade-in text-left">
          
          {/* Create Study card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
            <h3 className="font-extrabold text-[#001939] text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Plus className="w-5 h-5 text-indigo-750" />
              <span>Publicar Novo Estudo Bíblico da Igreja</span>
            </h3>

            <form onSubmit={handleCreateStudy} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Título do Estudo *</label>
                  <input
                    type="text"
                    required
                    value={stTitle}
                    onChange={(e) => setStTitle(e.target.value)}
                    className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-primary text-[#191c1d] font-semibold"
                    placeholder="Ex: Teologia Bíblica e Oração"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Autor (Quem escreveu/ministrou)</label>
                  <input
                    type="text"
                    value={stAuthor}
                    onChange={(e) => setStAuthor(e.target.value)}
                    className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-primary text-[#191c1d] font-semibold"
                    placeholder="Ex: Pastor Roberto Silva"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2 md:col-span-1">
                  <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Tags do Estudo (separadas por vírgula)</label>
                  <input
                    type="text"
                    value={stTags}
                    onChange={(e) => setStTags(e.target.value)}
                    className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-primary text-[#191c1d] font-semibold"
                    placeholder="Ex: Fé, Teologia, Célula, Casais"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Conteúdo Escrito (Texto / Roteiro Completo)</label>
                <textarea
                  required
                  rows={6}
                  value={stContent}
                  onChange={(e) => setStContent(e.target.value)}
                  className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-primary text-[#191c1d] font-semibold leading-relaxed"
                  placeholder="Cole ou redija o roteiro de estudos, perguntas para a célula e ensinamentos bíblicos..."
                />
              </div>

              {/* PODCAST AUDIO MEDIA SECTION */}
              <div className="p-4 bg-amber-50/40 rounded-2xl border border-amber-100 space-y-3">
                <p className="text-[10px] font-black uppercase text-amber-800 tracking-wider flex items-center gap-1">
                  <BookOpen className="w-4 h-4 text-amber-600" />
                  Mídia de Áudio (Estilo Podcast 🎙️)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] text-amber-900 font-black uppercase tracking-wider block">Nome do Áudio / Podcast</label>
                    <input
                      type="text"
                      value={stAudioName}
                      onChange={(e) => setStAudioName(e.target.value)}
                      className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 text-xs outline-none text-[#191c1d] font-semibold"
                      placeholder="Ex: podcast_estudos_01.mp3"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-amber-900 font-black uppercase tracking-wider block">URL do Áudio (Opcional - se já estiver online)</label>
                    <input
                      type="text"
                      value={stAudioUrl}
                      onChange={(e) => setStAudioUrl(e.target.value)}
                      className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 text-xs outline-none text-[#191c1d]"
                      placeholder="Ex: https://site.com/audios/podcast01.mp3"
                    />
                  </div>
                </div>

                {/* Upload track Zone */}
                <div className="bg-white border border-dashed border-amber-300 rounded-xl p-3.5 flex flex-col items-center justify-center text-center gap-1.5 hover:bg-amber-50/20 transition-all">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => handleFileRead(e, 'audio')}
                    className="hidden"
                    id="audio-upload-new"
                  />
                  <label htmlFor="audio-upload-new" className="cursor-pointer flex flex-col items-center gap-1 w-full">
                    {uploadProgress['audio-new'] ? (
                      <span className="text-xs font-bold text-amber-700 animate-pulse">Lendo faixa de áudio... Por favor aguarde...</span>
                    ) : (
                      <>
                        <Headphones className="w-5 h-5 text-amber-600" />
                        <span className="text-[10px] font-black text-amber-950 uppercase">Clique para fazer Upload do Áudio (Podcast MP3/WAV)</span>
                        {stAudioUrl ? (
                          <span className="text-[9px] text-green-700 font-extrabold bg-green-50 px-2.5 py-1 rounded-full border border-green-200 mt-1">
                            ✓ Áudio Carregado com Sucesso ({stAudioName || 'podcast_upload.mp3'})
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-400">Arraste ou clique para selecionar arquivo local</span>
                        )}
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* VIDEO SECTION */}
              <div className="p-4 bg-indigo-50/35 rounded-2xl border border-indigo-100 space-y-3">
                <p className="text-[10px] font-black uppercase text-indigo-950 tracking-wider flex items-center gap-1">
                  <Video className="w-4 h-4 text-indigo-750" />
                  Mídia de Vídeo (Pregação / Aula 🎥)
                </p>
                <div className="space-y-1">
                  <label className="text-[9px] text-indigo-950 font-black uppercase tracking-wider block">Link do Vídeo do Youtube (Opcional)</label>
                  <input
                    type="text"
                    value={stVideoUrl}
                    onChange={(e) => setStVideoUrl(e.target.value)}
                    className="w-full bg-white border border-indigo-150 rounded-xl px-4 py-3 text-xs outline-none text-[#191c1d]"
                    placeholder="Ex: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  />
                </div>

                {/* Upload video Zone */}
                <div className="bg-white border border-dashed border-indigo-250 rounded-xl p-3.5 flex flex-col items-center justify-center text-center gap-1.5 hover:bg-indigo-50/20 transition-all">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleFileRead(e, 'video')}
                    className="hidden"
                    id="video-upload-new"
                  />
                  <label htmlFor="video-upload-new" className="cursor-pointer flex flex-col items-center gap-1 w-full">
                    {uploadProgress['video-new'] ? (
                      <span className="text-xs font-bold text-indigo-750 animate-pulse">Lendo vídeo... Por favor aguarde...</span>
                    ) : (
                      <>
                        <Video className="w-5 h-5 text-indigo-650" />
                        <span className="text-[10px] font-black text-[#002d5e] uppercase">Clique para fazer Upload do Vídeo (MP4/Mídia Local)</span>
                        {stVideoUrl?.startsWith('data:video') ? (
                          <span className="text-[9px] text-green-700 font-extrabold bg-green-50 px-2.5 py-1 rounded-full border border-green-200 mt-1">
                            ✓ Vídeo Local Carregado com Sucesso (Pronto para assistir e baixar)
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-400">Arraste ou clique para selecionar arquivo local</span>
                        )}
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* ATTACHMENT SECTION */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <p className="text-[10px] font-black uppercase text-slate-700 tracking-wider flex items-center gap-1">
                  <FileText className="w-4 h-4 text-slate-600" />
                  Arquivos Auxiliares e Anexos (PDF / Word / Imagens 📎)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-600 font-black uppercase tracking-wider block">Nome do Arquivo Anexo (Opcional)</label>
                    <input
                      type="text"
                      value={stAttachmentName}
                      onChange={(e) => setStAttachmentName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs outline-none text-[#191c1d]"
                      placeholder="Ex: Roteiro_Semana_1.pdf"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-600 font-black uppercase tracking-wider block">Link do Arquivo (Opcional - se houver)</label>
                    <input
                      type="text"
                      value={stAttachmentUrl}
                      onChange={(e) => setStAttachmentUrl(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs outline-none text-[#191c1d]"
                      placeholder="Ex: https://site.com/arquivos/doc.pdf"
                    />
                  </div>
                </div>

                {/* Upload attachment Zone */}
                <div className="bg-white border border-dashed border-slate-300 rounded-xl p-3.5 flex flex-col items-center justify-center text-center gap-1.5 hover:bg-slate-50 transition-all">
                  <input
                    type="file"
                    accept="*/*"
                    onChange={(e) => handleFileRead(e, 'attachment')}
                    className="hidden"
                    id="attach-upload-new"
                  />
                  <label htmlFor="attach-upload-new" className="cursor-pointer flex flex-col items-center gap-1 w-full">
                    {uploadProgress['attachment-new'] ? (
                      <span className="text-xs font-bold text-slate-700 animate-pulse">Lendo documento... Por favor aguarde...</span>
                    ) : (
                      <>
                        <FileText className="w-5 h-5 text-slate-500" />
                        <span className="text-[10px] font-black text-slate-700 uppercase">Clique para fazer Upload do Arquivo Anexo</span>
                        {stAttachmentUrl?.startsWith('data:') ? (
                          <span className="text-[9px] text-green-700 font-extrabold bg-green-50 px-2.5 py-1 rounded-full border border-green-200 mt-1">
                            ✓ Arquivo Carregado com Sucesso ({stAttachmentName || 'anexo_uploaded.pdf'})
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-400">Selecione arquivos PDF, DOCX, XLSX ou Imagens para baixar</span>
                        )}
                      </>
                    )}
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-750 text-white font-black uppercase tracking-wider text-[11px] rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4 text-emerald-300" />
                <span>Salvar e Publicar Estudo 💾</span>
              </button>
            </form>
          </div>

          {/* List existing studies to edit & delete */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
            <h3 className="font-extrabold text-[#001939] text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <BookOpen className="w-5 h-5 text-indigo-750" />
              <span>Gerenciar Estudos Publicados</span>
            </h3>

            <div className="space-y-3">
              {studies.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-6">Nenhum estudo bíblico cadastrado.</p>
              ) : (
                studies.map((study) => {
                  if (editingStudyId === study.id) {
                    return (
                      <form 
                        key={study.id} 
                        onSubmit={handleUpdateStudySubmit} 
                        className="p-4 bg-slate-50 border-2 border-indigo-250 rounded-2xl space-y-3.5 text-left"
                      >
                        <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Editando Estudo</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <label className="text-[9px] text-[#2c323f]/50 font-black uppercase tracking-wider block">Título do Estudo</label>
                            <input
                              type="text"
                              required
                              value={editStTitle}
                              onChange={(e) => setEditStTitle(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#191c1d] outline-none font-bold"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] text-[#2c323f]/50 font-black uppercase tracking-wider block">Autor</label>
                            <input
                              type="text"
                              required
                              value={editStAuthor}
                              onChange={(e) => setEditStAuthor(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#191c1d] outline-none"
                            />
                          </div>

                          <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                            <label className="text-[9px] text-[#2c323f]/50 font-black uppercase tracking-wider block">Tags (separadas por vírgula)</label>
                            <input
                              type="text"
                              value={editStTags}
                              onChange={(e) => setEditStTags(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#191c1d] outline-none font-semibold"
                              placeholder="Ex: Teologia, Fé, Casais"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] text-[#2c323f]/50 font-black uppercase tracking-wider block">Conteúdo Escrito</label>
                          <textarea
                            required
                            rows={4}
                            value={editStContent}
                            onChange={(e) => setEditStContent(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#191c1d] outline-none font-semibold leading-relaxed"
                          />
                        </div>

                        {/* EDIT AUDIO / PODCAST */}
                        <div className="p-3 bg-amber-50/20 border border-amber-100 rounded-xl space-y-2">
                          <p className="text-[9px] font-black text-amber-800 uppercase tracking-wider leading-none">Mídia de Áudio (Podcast 🎙️)</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={editStAudioName}
                              onChange={(e) => setEditStAudioName(e.target.value)}
                              placeholder="Nome do áudio"
                              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-[#191c1d]"
                            />
                            <input
                              type="text"
                              value={editStAudioUrl}
                              onChange={(e) => setEditStAudioUrl(e.target.value)}
                              placeholder="URL do arquivo de áudio"
                              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-[#191c1d]"
                            />
                          </div>
                          
                          <div className="bg-white border border-dashed border-amber-250 rounded-lg p-2.5 flex flex-col items-center justify-center text-center">
                            <input
                              type="file"
                              accept="audio/*"
                              onChange={(e) => handleFileRead(e, 'audio', true)}
                              className="hidden"
                              id="audio-upload-edit"
                            />
                            <label htmlFor="audio-upload-edit" className="cursor-pointer flex flex-col items-center gap-0.5">
                              {uploadProgress['audio-edit'] ? (
                                <span className="text-[10px] font-bold text-amber-700 animate-pulse">Lendo áudio...</span>
                              ) : (
                                <>
                                  <Headphones className="w-4 h-4 text-amber-600" />
                                  <span className="text-[9px] font-extrabold text-[#001939] uppercase">Upload de Novo Áudio (Substituir local)</span>
                                  {editStAudioUrl ? (
                                    <span className="text-[8px] text-green-600 font-bold bg-green-50 px-1 py-0.5 rounded leading-none mt-0.5">
                                      ✓ Carregado: {editStAudioName || 'podcast.mp3'}
                                    </span>
                                  ) : null}
                                </>
                              )}
                            </label>
                          </div>
                        </div>

                        {/* EDIT VIDEO */}
                        <div className="p-3 bg-indigo-50/20 border border-indigo-100 rounded-xl space-y-2">
                          <p className="text-[9px] font-black text-indigo-900 uppercase tracking-wider leading-none">Mídia de Vídeo (Youtube ou MP4 🎥)</p>
                          <input
                            type="text"
                            value={editStVideoUrl}
                            onChange={(e) => setEditStVideoUrl(e.target.value)}
                            placeholder="URL do vídeo (Youtube ou link mp4)"
                            className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-[#191c1d]"
                          />
                          
                          <div className="bg-white border border-dashed border-indigo-200 rounded-lg p-2.5 flex flex-col items-center justify-center text-center">
                            <input
                              type="file"
                              accept="video/*"
                              onChange={(e) => handleFileRead(e, 'video', true)}
                              className="hidden"
                              id="video-upload-edit"
                            />
                            <label htmlFor="video-upload-edit" className="cursor-pointer flex flex-col items-center gap-0.5">
                              {uploadProgress['video-edit'] ? (
                                <span className="text-[10px] font-bold text-indigo-750 animate-pulse">Lendo vídeo...</span>
                              ) : (
                                <>
                                  <Video className="w-4 h-4 text-indigo-650" />
                                  <span className="text-[9px] font-extrabold text-indigo-950 uppercase">Upload de Novo Vídeo (Substituir local)</span>
                                  {editStVideoUrl?.startsWith('data:video') ? (
                                    <span className="text-[8px] text-green-600 font-bold bg-green-50 px-1 py-0.5 rounded leading-none mt-0.5">
                                      ✓ Vídeo local carregado com sucesso
                                    </span>
                                  ) : null}
                                </>
                              )}
                            </label>
                          </div>
                        </div>

                        {/* EDIT ATTACHMENT */}
                        <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl space-y-2">
                          <p className="text-[9px] font-black text-slate-700 uppercase tracking-wider leading-none">Anexo / Arquivos (📎)</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={editStAttachmentName}
                              onChange={(e) => setEditStAttachmentName(e.target.value)}
                              placeholder="Nome do anexo"
                              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-[#191c1d]"
                            />
                            <input
                              type="text"
                              value={editStAttachmentUrl}
                              onChange={(e) => setEditStAttachmentUrl(e.target.value)}
                              placeholder="URL do arquivo"
                              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-[#191c1d]"
                            />
                          </div>

                          <div className="bg-white border border-dashed border-slate-300 rounded-lg p-2.5 flex flex-col items-center justify-center text-center">
                            <input
                              type="file"
                              accept="*/*"
                              onChange={(e) => handleFileRead(e, 'attachment', true)}
                              className="hidden"
                              id="attach-upload-edit"
                            />
                            <label htmlFor="attach-upload-edit" className="cursor-pointer flex flex-col items-center gap-0.5">
                              {uploadProgress['attachment-edit'] ? (
                                <span className="text-[10px] font-bold text-slate-700 animate-pulse">Lendo anexo...</span>
                              ) : (
                                <>
                                  <FileText className="w-4 h-4 text-slate-500" />
                                  <span className="text-[9px] font-extrabold text-slate-850 uppercase">Upload de Novo Arquivo (Substituir local)</span>
                                  {editStAttachmentUrl?.startsWith('data:') ? (
                                    <span className="text-[8px] text-green-600 font-bold bg-green-50 px-1 py-0.5 rounded leading-none mt-0.5">
                                      ✓ Carregado: {editStAttachmentName || 'anexo_edit.pdf'}
                                    </span>
                                  ) : null}
                                </>
                              )}
                            </label>
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingStudyId(null)}
                            className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold uppercase text-[9px] tracking-wider rounded-lg cursor-pointer transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-3 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-bold uppercase text-[9px] tracking-wider rounded-lg cursor-pointer transition-colors"
                          >
                            Gravar Alterações
                          </button>
                        </div>
                      </form>
                    );
                  }

                  return (
                    <div key={study.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4 text-left">
                      <div className="space-y-0.5 truncate flex-1">
                        <span className="text-[8px] uppercase font-bold text-indigo-750 bg-indigo-50 border border-indigo-150 px-1.5 py-0.5 rounded">AUTOR: {study.authorName}</span>
                        <h4 className="text-xs font-black text-[#191c1d] truncate mt-1">{study.title}</h4>
                        <p className="text-[10px] text-[#2c323f]/50 block line-clamp-1">{study.content}</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          {study.audioUrl && (
                            <span className="text-[7.5px] font-black text-amber-700 bg-amber-50 rounded px-1.5 py-0.5 border border-amber-200 flex items-center gap-0.5">
                              🎙️ PODCAST / ÁUDIO
                            </span>
                          )}
                          {study.videoUrl && (
                            <span className="text-[7.5px] font-black text-indigo-750 bg-indigo-50 rounded px-1.5 py-0.5 border border-indigo-150 flex items-center gap-0.5">
                              🎥 VÍDEO
                            </span>
                          )}
                          {(study.attachmentUrl || study.attachmentName) && (
                            <span className="text-[7.5px] font-black text-slate-700 bg-slate-100 rounded px-1.5 py-0.5 border border-slate-200 flex items-center gap-0.5">
                              📎 ANEXO ({study.attachmentName || 'PDF'})
                            </span>
                          )}
                          {study.tags && study.tags.length > 0 && (
                            <span className="text-[7.5px] font-black text-[#047857] bg-[#ecfdf5] rounded px-1.5 py-0.5 border border-[#a7f3d0] flex items-center gap-0.5">
                              🏷️ TAGS: {study.tags.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingStudyId(study.id);
                            setEditStTitle(study.title || '');
                            setEditStAuthor(study.authorName || '');
                            setEditStContent(study.content || '');
                            setEditStVideoUrl(study.videoUrl || '');
                            setEditStAttachmentName(study.attachmentName || '');
                            setEditStAttachmentUrl(study.attachmentUrl || '');
                            setEditStAudioUrl(study.audioUrl || '');
                            setEditStAudioName(study.audioName || '');
                            setEditStTags((study.tags || []).join(', '));
                          }}
                          className="p-2 text-indigo-650 hover:bg-indigo-50 hover:text-indigo-850 transition-colors rounded-lg cursor-pointer"
                          title="Editar estudo"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setConfirmDelete({
                            id: study.id,
                            type: 'Estudo Bíblico',
                            action: () => {
                              onDeleteStudy(study.id);
                              onShowAlert(`Estudo Bíblico "${study.title}" removido com sucesso.`);
                            },
                            name: study.title
                          })}
                          className="p-2 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors rounded-lg cursor-pointer"
                          title="Excluir estudo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'radio' && (
        <div className="space-y-6 animate-fade-in text-left">
          
          {/* Create Program / Agendar Card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
            <h3 className="font-extrabold text-[#001939] text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
              {editingRadioId ? <Edit2 className="w-5 h-5 text-indigo-750 animate-pulse" /> : <Plus className="w-5 h-5 text-indigo-750 animate-pulse" />}
              <span>{editingRadioId ? `Editar Programa: "${radTitle}"` : 'Criar Programa & Programação Agendada (Rádio IPBA)'}</span>
            </h3>

            <form onSubmit={handleCreateRadioSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wide block">
                    Nome do Programa / Título da transmissão
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Momentos de Fé e Esperança"
                    value={radTitle}
                    onChange={(e) => setRadTitle(e.target.value)}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-xs text-[#191c1d] outline-none font-bold transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wide block">
                    Locutor / Pastor Apresentador
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Rev. Roberto Silva"
                    value={radSpeaker}
                    onChange={(e) => setRadSpeaker(e.target.value)}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-xs text-[#191c1d] outline-none font-semibold transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wide block">
                    Programação Agendada (Dias, Horários ou Tags Temporais)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Diariamente às 14h00, Sábados às 20h"
                    value={radScheduledTime}
                    onChange={(e) => setRadScheduledTime(e.target.value)}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-xs text-[#191c1d] outline-none font-semibold transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wide block">
                    Tags de Categoria (Separar com vírgulas)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Fé, Devocional, Clássicos, Ao Vivo"
                    value={radTags}
                    onChange={(e) => setRadTags(e.target.value)}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-xs text-[#191c1d] outline-none font-semibold transition-all"
                  />
                  <span className="text-[9px] text-slate-400 block font-medium">As tags permitem aos membros filtrar e catalogar as programações.</span>
                </div>
              </div>

              {/* Send Audio Section */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wide block">
                  Enviar Áudio da Programação Agendada (MP3 ou link)
                </span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] text-[#2c323f]/50 font-black uppercase tracking-wider block">
                      URL Direta do Áudio (Opcional - link de rádio, podcast ou CDN)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3"
                      value={radAudioUrl}
                      onChange={(e) => {
                        setRadAudioUrl(e.target.value);
                        setRadAudioName(e.target.value.substring(e.target.value.lastIndexOf('/') + 1) || 'Streaming Externo');
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#191c1d] outline-none"
                    />
                  </div>

                  <div className="bg-[#f8fafc] border-2 border-dashed border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors">
                    <input
                      type="file"
                      accept="audio/*"
                      id="radio-audio-upload"
                      onChange={handleRadioFileRead}
                      className="hidden"
                    />
                    <label htmlFor="radio-audio-upload" className="cursor-pointer flex flex-col items-center gap-1.5 w-full">
                      {radFileProgress ? (
                        <span className="text-[10px] font-bold text-indigo-650 animate-pulse">Lendo e comprimindo áudio...</span>
                      ) : (
                        <>
                          <Headphones className="w-5 h-5 text-indigo-500" />
                          <span className="text-[10px] font-extrabold text-slate-700 uppercase">Fazer Upload de arquivo MP3</span>
                          <span className="text-[9px] text-slate-400">Arraste ou clique para selecionar do dispositivo</span>
                          {radAudioUrl.startsWith('data:') && (
                            <span className="text-[8.5px] text-emerald-600 font-extrabold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md mt-1">
                              ✓ Áudio carregado: {radAudioName}
                            </span>
                          )}
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-2">
                <button
                  type="submit"
                  disabled={radFileProgress}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-350 text-white font-extrabold uppercase text-xs tracking-wider rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-2"
                >
                  <span>{editingRadioId ? 'Salvar Edição de Programação 🎙️' : 'Salvar e Transmitir na Rádio 🎙️'}</span>
                </button>

                {editingRadioId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRadioId(null);
                      setRadTitle('');
                      setRadSpeaker('');
                      setRadScheduledTime('Diariamente às 14h00');
                      setRadAudioUrl('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3');
                      setRadAudioName('programacao_agendada_default.mp3');
                      setRadTags('Mensagem, Fé');
                      onShowAlert("Edição cancelada.");
                    }}
                    className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold uppercase text-xs tracking-wider rounded-xl cursor-pointer transition-colors"
                  >
                    Cancelar Edição
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Excluir Programas Card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
            <h3 className="font-extrabold text-[#001939] text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Radio className="w-5 h-5 text-indigo-750" />
              <span>Gerenciar Programação no Ar</span>
            </h3>

            <div className="space-y-3">
              {radioPrograms.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-6 font-semibold">Nenhum programa agendado na Rádio IPBA.</p>
              ) : (
                radioPrograms.map((prog) => (
                  <div key={prog.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4 text-left shadow-xs">
                    <div className="space-y-0.5 truncate flex-1">
                      <span className="text-[8.5px] uppercase font-black text-indigo-750 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded tracking-wider">
                        {prog.scheduledTime || 'Sem Agendamento'}
                      </span>
                      <h4 className="text-xs font-black text-[#191c1d] truncate mt-1">{prog.title}</h4>
                      <p className="text-[10px] text-[#2c323f]/60 font-semibold block">Locutor / Pastor: {prog.speaker}</p>
                      
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-[7.5px] font-black text-slate-700 bg-slate-100 rounded px-1.5 py-0.5 border border-slate-200 flex items-center gap-0.5 uppercase">
                          🎵 ÁUDIO: {prog.audioName || 'Streaming'}
                        </span>
                        {prog.tags && prog.tags.length > 0 && (
                          <span className="text-[7.5px] font-black text-emerald-700 bg-emerald-50 rounded px-1.5 py-0.5 border border-emerald-200 flex items-center gap-0.5 font-bold">
                            🏷️ TAGS: {prog.tags.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingRadioId(prog.id);
                          setRadTitle(prog.title || '');
                          setRadSpeaker(prog.speaker || '');
                          setRadScheduledTime(prog.scheduledTime || '');
                          setRadAudioUrl(prog.audioUrl || '');
                          setRadAudioName(prog.audioName || 'Streaming');
                          setRadTags(prog.tags ? prog.tags.join(', ') : '');
                          onShowAlert(`Programa "${prog.title}" carregado para edição.`);
                        }}
                        className="p-2 bg-white text-indigo-750 hover:bg-slate-100 transition-colors border border-slate-200 rounded-xl cursor-pointer font-bold text-[10px] px-3 shadow-xs"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete({
                          id: prog.id,
                          type: 'Programa de Rádio',
                          action: () => {
                            onDeleteRadioProgram(prog.id);
                            onShowAlert(`Programa "${prog.title}" foi removido da Rádio.`);
                          },
                          name: prog.title
                        })}
                        className="p-2.5 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors rounded-xl cursor-pointer"
                        title="Excluir do ar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {activeSubTab === 'support_options' && (
        <div className="space-y-6 animate-fade-in text-left">
          
          {/* Card: Manage Dropdown Options */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
            <h3 className="font-extrabold text-[#001939] text-base flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <LifeBuoy className="w-5 h-5 text-indigo-750 animate-spin-slow" />
              <span>Gerenciar Opções do Seletor de Erros / Suporte</span>
            </h3>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Adicione ou remova opções de preenchimento para o seletor "Tipo de Erro / Assunto" que os membros visualizam no formulário de contato de Suporte.
            </p>

            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newOptionInput.trim()) {
                  onShowAlert("Por favor, digite o título da opção.");
                  return;
                }
                if (supportOptionsList.some(opt => opt.name.toLowerCase() === newOptionInput.trim().toLowerCase())) {
                  onShowAlert("Esta opção de erro já está cadastrada.");
                  return;
                }
                try {
                  await addDoc(collection(db, 'supportOptions'), {
                    name: newOptionInput.trim()
                  });
                  onShowAlert(`Opção "${newOptionInput}" criada com sucesso!`);
                  setNewOptionInput('');
                } catch (err) {
                  console.error(err);
                  onShowAlert("Erro ao criar opção.");
                }
              }} 
              className="flex flex-col sm:flex-row gap-2 max-w-xl"
            >
              <input
                type="text"
                required
                placeholder="Ex: Erro no Pix do Dízimo"
                value={newOptionInput}
                onChange={(e) => setNewOptionInput(e.target.value)}
                className="flex-1 bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-[#191c1d] outline-none font-bold transition-all"
              />
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#002d5e] hover:bg-slate-800 text-white font-extrabold uppercase text-[10px] tracking-wider rounded-xl cursor-pointer transition-colors shadow-sm shrink-0 whitespace-nowrap"
              >
                + Adicionar Opção
              </button>
            </form>

            <div className="space-y-2 pt-2">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Opções Cadastradas no Banco</h4>
              {supportOptionsList.length === 0 ? (
                <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 text-[11px] text-slate-500 italic font-semibold">
                  Nenhuma opção cadastrada. O app está utilizando as categorias fallback automáticas (Erro de Login, Problemas com Dízimo, etc).
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {supportOptionsList.map((opt) => (
                    <div key={opt.id} className="flex items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-150 rounded-xl">
                      <span className="text-xs font-bold text-slate-800 truncate">{opt.name}</span>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete({
                          id: opt.id || '',
                          type: 'Opção de Suporte',
                          action: async () => {
                            if (!opt.id) return;
                            try {
                              await deleteDoc(doc(db, 'supportOptions', opt.id));
                              onShowAlert(`Opção "${opt.name}" removida.`);
                            } catch (err) {
                              console.error(err);
                              onShowAlert("Erro ao remover opção.");
                            }
                          },
                          name: opt.name
                        })}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                        title="Remover opção"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Card: Monitor User Support Tickets */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-[#001939] text-base flex items-center gap-1.5">
                <FileText className="w-5 h-5 text-indigo-750" />
                <span>Chamados de Suporte Registrados</span>
              </h3>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-sans">
                {supportTicketsList.length} chamados
              </span>
            </div>

            {supportTicketsList.length === 0 ? (
              <p className="text-slate-500 text-xs italic py-4 text-center">Nenhum chamado de suporte cadastrado no sistema ainda.</p>
            ) : (
              <div className="space-y-3">
                {supportTicketsList.map((ticket) => {
                  const isResolved = ticket.status === 'Resolvido';
                  return (
                    <div 
                      key={ticket.id} 
                      className={`p-4 rounded-2xl border transition-all text-xs select-none ${
                        isResolved ? 'bg-emerald-50/40 border-emerald-150/60 text-slate-700' : 'bg-white border-slate-200/80'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-sm text-[#001939]">{ticket.name}</span>
                            <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-850 text-[9px] font-black uppercase">
                              {ticket.category}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium block">
                            Enviado em: {new Date(ticket.createdAt).toLocaleString('pt-BR')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                            isResolved 
                              ? 'bg-emerald-100 border-emerald-250 text-emerald-800' 
                              : 'bg-amber-100 border-amber-250 text-amber-800'
                          }`}>
                            {ticket.status || 'Pendente'}
                          </span>
                        </div>
                      </div>

                      <p className="text-slate-700 leading-relaxed font-medium bg-slate-50/50 p-3 rounded-xl border border-slate-100 whitespace-pre-line mb-3">
                        {ticket.text}
                      </p>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            if (!ticket.id) return;
                            const nextStatus = isResolved ? 'Pendente' : 'Resolvido';
                            try {
                              await updateDoc(doc(db, 'supportTickets', ticket.id), { status: nextStatus });
                              onShowAlert(`Chamado alterado para "${nextStatus}"!`);
                            } catch (err) {
                              console.error(err);
                              onShowAlert("Erro ao atualizar status.");
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border cursor-pointer select-none transition-colors ${
                            isResolved 
                              ? 'bg-white hover:bg-amber-50 text-amber-800 border-amber-200' 
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-xs'
                          }`}
                        >
                          {isResolved ? '↩ Reabrir Chamado' : '✔ Marcar como Resolvido'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete({
                            id: ticket.id || '',
                            type: 'Chamado de Suporte',
                            action: async () => {
                              if (!ticket.id) return;
                              try {
                                await deleteDoc(doc(db, 'supportTickets', ticket.id));
                                onShowAlert("Chamado excluído.");
                              } catch (err) {
                                console.error(err);
                                onShowAlert("Erro ao excluir chamado.");
                              }
                            },
                            name: ticket.name
                          })}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors border border-rose-100"
                          title="Excluir Chamado"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}


      {/* FOOTER METADATA SECURITY COMPONENT */}
      <div className="bg-slate-100 border border-slate-200 p-4 rounded-xl text-left text-[11px] font-sans text-slate-500 leading-normal">
        <div className="flex gap-2">
          <ShieldAlert className="w-5 h-5 text-indigo-750 shrink-0 mt-0.5 animate-pulse" />
          <p>
            As ações deste painel de controle são gravadas sob as credenciais de auditoria do clero. Quaisquer mudanças em eventos, aprovação de pedidos e estorno de caixas são atualizados em tempo real no banco local de todos os membros.
          </p>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-bold">Excluir {confirmDelete.type}?</h3>
            <p className="text-slate-600">Tem certeza que deseja excluir "{confirmDelete.name}"? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3 mt-4">
              <button className="flex-1 px-4 py-2 bg-slate-100 rounded-lg text-slate-700 font-bold" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-bold" onClick={() => { confirmDelete.action(); setConfirmDelete(null); }}>Confirmar Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
