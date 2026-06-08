import { useState, useEffect, useRef } from 'react';
import { 
  Check, 
  Trash2, 
  ArrowLeft, 
  Info, 
  Smartphone,
  ChevronRight,
  ShieldCheck,
  X,
  Church,
  Bell
} from 'lucide-react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import HomeLiveSection from './components/HomeLiveSection';
import CelulasSection from './components/CelulasSection';
import PerfilSection from './components/PerfilSection';
import LoginSection from './components/LoginSection';
import OracaoSection from './components/OracaoSection';
import DizimosSection from './components/DizimosSection';
import AoVivoSection from './components/AoVivoSection';
import EstudosSection from './components/EstudosSection';
import EventosSection from './components/EventosSection';
import AdminSection from './components/AdminSection';
import SuporteSection from './components/SuporteSection';

import { User, PrayerRequest, Cell, Contribution, ChurchEvent, ChurchStudy, RadioProgram } from './types';
import { 
  INITIAL_USER, 
  INITIAL_CONTRIBUTIONS 
} from './data';

import { auth, db, handleFirestoreError, OperationType, getUserDocId, syncFirebaseAuthWithEmailPassword } from './firebase';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  doc, 
  getDoc,
  setDoc, 
  addDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  limit,
  writeBatch,
  getDocs,
  getDocsFromServer
} from 'firebase/firestore';

interface AppNotification {
  id: string;
  title: string;
  text: string;
  time: string;
  unread: boolean;
  type?: 'home' | 'celulas' | 'perfil' | 'login' | 'oracao' | 'dizimos' | 'estudos' | 'aovivo' | 'eventos' | 'admin';
}

const DEFAULT_TRANSMISSIONS = [
  {
    id: 'trans-default',
    youtubeUrl: 'https://www.youtube.com/embed/5qap5aO4i9A',
    title: 'Série Expositiva: Epístola de Filipenses',
    subtitle: 'Sermão: "Alegria nas Tribulações" • Rev. Roberto Silva',
    isLive: true,
    viewerCount: 42,
    isPublic: true,
    tags: ['Filipenses', 'Sermão', 'Expositivo']
  }
];

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const currentUserSession = localStorage.getItem('church_current_user');
    if (currentUserSession) {
      try {
        return JSON.parse(currentUserSession);
      } catch (e) {}
    }
    return null;
  });

  const [currentTab, setCurrentTab] = useState<string>(() => {
    const saved = localStorage.getItem('church_active_tab');
    const currentUserSession = localStorage.getItem('church_current_user');
    
    // Se temos uma aba salva, respeitamos ela integralmente para evitar redirecionamentos indesejados no refresh
    if (saved) return saved;
    
    // Se houver sessão mas nenhuma aba salva (raro), vai para home. Caso contrário, login.
    return currentUserSession ? 'home' : 'login';
  });
  const [showSoftNotifPrompt, setShowSoftNotifPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showSoftInstallPrompt, setShowSoftInstallPrompt] = useState(false);
  const [showInstallGuidance, setShowInstallGuidance] = useState(false);
  const [installPlatform, setInstallPlatform] = useState<'android' | 'ios'>('android');

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      const hasDismissedInstall = localStorage.getItem('church_install_prompt_dismissed');
      if (!hasDismissedInstall) {
        setTimeout(() => setShowSoftInstallPrompt(true), 5000);
      }
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    if (isIOS) {
      setInstallPlatform('ios');
      const hasDismissedInstall = localStorage.getItem('church_install_prompt_dismissed');
      if (isIOS && !isStandalone && !hasDismissedInstall) {
        setTimeout(() => setShowSoftInstallPrompt(true), 6000);
      }
    }
  }, []);

  const handleInstallClick = () => {
    setShowInstallGuidance(true);
  };

  // Real-time Firestore backed states with default fallback
  const [dbUsers, setDbUsers] = useState<User[]>(() => {
    const rawLocal = localStorage.getItem('church_users');
    if (rawLocal) {
      try {
        return JSON.parse(rawLocal);
      } catch (e) {
        console.warn("Error parsing initial local church_users:", e);
      }
    }
    return [];
  });
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [events, setEvents] = useState<ChurchEvent[]>(() => {
    try {
      const rawLocal = localStorage.getItem('church_events');
      if (rawLocal) {
        const parsed = JSON.parse(rawLocal);
        if (Array.isArray(parsed)) {
          const storedDeleted = localStorage.getItem('church_deleted_event_ids');
          const deletedSet = storedDeleted ? new Set<string>(JSON.parse(storedDeleted)) : new Set<string>();
          return parsed.filter((ev: any) => ev && ev.id && !deletedSet.has(ev.id));
        }
      }
    } catch (e) {
      console.warn("Error parsing initial local church_events:", e);
    }
    return [];
  });
  const [studies, setStudies] = useState<ChurchStudy[]>([]);
  const [radioPrograms, setRadioPrograms] = useState<RadioProgram[]>([]);
  const [transmissions, setTransmissions] = useState<any[]>([]);
  const [cargos, setCargos] = useState<string[]>([]);

  const [isAuthReady, setIsAuthReady] = useState(false);
  const userRef = useRef<User | null>(user);
  const eventsRef = useRef<ChurchEvent[]>(events);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    if (currentTab === 'home' && 'Notification' in window) {
      try {
        const permission = Notification.permission;
        console.log("[Push] Verificando permissão na Home:", permission);
        
        if (permission === 'default') {
          const hasDismissed = localStorage.getItem('church_soft_prompt_dismissed');
          const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
          
          if (!hasDismissed || isStandalone) {
            const timer = setTimeout(() => {
              console.log("[Push] Disparando banner de notificação.");
              setShowSoftNotifPrompt(true);
            }, 1500);
            return () => clearTimeout(timer);
          }
        }
      } catch (err) {
        console.warn("[Push] Ignorando verificação de permissão Notification na Home (regra iframe):", err);
      }
    }
  }, [currentTab]);

  const forceEventsSyncFromServer = async () => {
    if (!isAuthReady) return;
    console.log("[SWR Reset/Force Sync] Revalidando eventos diretamente com o Firestore da nuvem...");
    try {
      const snapshot = await getDocsFromServer(collection(db, 'events'));
      const list: ChurchEvent[] = [];
      
      snapshot.forEach((snapDoc) => {
        const id = snapDoc.id;
        if (id !== 'system_seeded_state' && !deletedEventIdsRef.current.has(id)) {
          const data = snapDoc.data() as ChurchEvent;
          let finalEvent: ChurchEvent = {
            id,
            ...data,
            confirmedUsers: data.confirmedUsers || []
          };
          
          // Last-Write-Wins (LWW) conflict checking
          const localEv = eventsRef.current.find(e => e.id === id);
          if (localEv && localEv.updatedAt && data.updatedAt) {
            const localTime = new Date(localEv.updatedAt).getTime();
            const serverTime = new Date(data.updatedAt).getTime();
            if (localTime > serverTime) {
              console.log(`[SWR Force Sync Conflict] Preservando o registro local do evento ${id} (atualização local mais recente).`);
              finalEvent = localEv;
            }
          }
          list.push(finalEvent);
        }
      });
      
      console.log(`[SWR Reset/Force Sync] Completado. ${list.length} eventos forçados diretamente do Firestore.`);
      try {
        localStorage.setItem('church_events', JSON.stringify(list));
      } catch (e) {
        console.warn("Erro ao salvar cache local via SWR force-sync:", e);
      }
      setEvents(list);
    } catch (err) {
      console.warn("[SWR Reset/Force Sync] Falha ao sincronizar diretamente via getDocsFromServer. Utilizando cache tolerante offline:", err);
      try {
        const cachedSnapshot = await getDocs(collection(db, 'events'));
        const list: ChurchEvent[] = [];
        cachedSnapshot.forEach((snapDoc) => {
          const id = snapDoc.id;
          if (id !== 'system_seeded_state' && !deletedEventIdsRef.current.has(id)) {
            const data = snapDoc.data() as ChurchEvent;
            list.push({
              id,
              ...data,
              confirmedUsers: data.confirmedUsers || []
            } as ChurchEvent);
          }
        });
        localStorage.setItem('church_events', JSON.stringify(list));
        setEvents(list);
      } catch (e) {
        console.error("[SWR Reset/Force Sync] Sincronização crítica falhou:", e);
      }
    }
  };

  // Força sync imediato ao detectar que o usuário acessou uma seção online do aplicativo
  useEffect(() => {
    if (!isAuthReady) return;
    
    // Lista de abas consideradas seções online do portal
    const onlineTabs = ['home', 'eventos', 'celulas', 'oracao', 'estudos', 'aovivo', 'admin', 'dizimos', 'perfil'];
    if (onlineTabs.includes(currentTab)) {
      console.log(`[SWR/LWW Trigger] Usuário acessou a seção online: "${currentTab}". Forçando sincronização imediata dos eventos.`);
      forceEventsSyncFromServer();
    }
  }, [currentTab, isAuthReady]);

  const handleDismissSoftPrompt = () => {
    setShowSoftNotifPrompt(false);
    try {
      localStorage.setItem('church_soft_prompt_dismissed', 'true');
    } catch (e) {
      console.warn("localStorage is blocked:", e);
    }
  };

  const handleNativePermissionRequest = async () => {
    if (!('Notification' in window)) {
      setShowSoftNotifPrompt(false);
      try {
        localStorage.setItem('church_soft_prompt_dismissed', 'true');
      } catch (e) {}
      showAlert("⚠️ Este dispositivo ou navegador não suporta notificações nativas.");
      return;
    }
    
    try {
      let permission: NotificationPermission;
      const requestResult = Notification.requestPermission();
      
      if (requestResult && typeof requestResult.then === 'function') {
        permission = await requestResult;
      } else {
        permission = await new Promise<NotificationPermission>((resolve) => {
          Notification.requestPermission(resolve);
        });
      }
      
      console.log('Permission result:', permission);
      setShowSoftNotifPrompt(false);
      try {
        localStorage.setItem('church_soft_prompt_dismissed', 'true');
      } catch (e) {}
      
      if (permission === 'granted') {
        setToast("✅ Notificações ativadas com sucesso!");
        showAlert("🔔 Notificações ativadas com sucesso!");
      } else {
        setToast("⚠️ Notificações não ativadas.");
        showAlert("⚠️ Permissão de notificações não concedida. Você pode alterar isso nas configurações do navegador.");
      }
    } catch (err) {
      console.error('Erro ao pedir permissão:', err);
      setShowSoftNotifPrompt(false);
      try {
        localStorage.setItem('church_soft_prompt_dismissed', 'true');
      } catch (e) {}
      
      const isIframe = window.self !== window.top;
      if (isIframe) {
        showAlert("ℹ️ Para autorizar as notificações do portal, abra o app fora da janela do AI Studio! Use o ícone de abrir em uma nova aba no canto superior direito para acessar diretamente no seu navegador.");
      } else {
        showAlert("⚠️ Erro ao solicitar notificações: certifique-se de que não estão bloqueadas nas preferências do seu navegador.");
      }
    }
  };

  // Background Firebase anonymous login and session restoration on startup
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      const handleAuthCheck = async () => {
        if (!fbUser) {
          const storedUserJson = localStorage.getItem('church_current_user');
          if (storedUserJson) {
            try {
              const parsedUser = JSON.parse(storedUserJson);
              if (parsedUser && parsedUser.email && parsedUser.password) {
                console.log("[Auth Restoration] Restoring session via email-password for:", parsedUser.email);
                const success = await syncFirebaseAuthWithEmailPassword(parsedUser.email, parsedUser.password);
                if (success) {
                  setIsAuthReady(true);
                  return;
                }
              }
            } catch (err) {
              console.warn("[Auth Restoration] Error parsing saved current user:", err);
            }
          }
          
          signInAnonymously(auth)
            .then(() => {
              setIsAuthReady(true);
            })
            .catch((err) => {
              console.warn("Anonymous sign-in failed (might be disabled, continuing anyway):", err);
              setIsAuthReady(true);
            });
        } else {
          const storedUserJson = localStorage.getItem('church_current_user');
          if (storedUserJson) {
            try {
              const parsedUser = JSON.parse(storedUserJson);
              if (parsedUser && parsedUser.email && fbUser.email && fbUser.email.toLowerCase() !== parsedUser.email.toLowerCase()) {
                console.log("[Auth Restoration] Email mismatch detected. Re-syncing auth for:", parsedUser.email);
                await syncFirebaseAuthWithEmailPassword(parsedUser.email, parsedUser.password);
              }
            } catch (err) {
              console.warn("[Auth Restoration] Error checking email matches:", err);
            }
          }
          setIsAuthReady(true);
        }
      };

      handleAuthCheck();
    });
    return () => unsubscribe();
  }, []);

  // Read/Unread mapping helper
  const getReadNotificationIds = (): string[] => {
    const saved = localStorage.getItem('church_read_notification_ids');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {}
    }
    return [];
  };

  const getDeletedNotificationIds = (): string[] => {
    const saved = localStorage.getItem('church_deleted_notification_ids');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {}
    }
    return [];
  };

  const markNotificationReadLocal = (id: string) => {
    const read = getReadNotificationIds();
    if (!read.includes(id)) {
      read.push(id);
      localStorage.setItem('church_read_notification_ids', JSON.stringify(read));
    }
  };

  const markNotificationsReadLocal = (ids: string[]) => {
    const read = getReadNotificationIds();
    let changed = false;
    ids.forEach(id => {
      if (!read.includes(id)) {
        read.push(id);
        changed = true;
      }
    });
    if (changed) {
      localStorage.setItem('church_read_notification_ids', JSON.stringify(read));
    }
  };

  const deleteNotificationLocal = (id: string) => {
    const deleted = getDeletedNotificationIds();
    if (!deleted.includes(id)) {
      deleted.push(id);
      localStorage.setItem('church_deleted_notification_ids', JSON.stringify(deleted));
    }
  };

  const deleteNotificationsLocal = (ids: string[]) => {
    const deleted = getDeletedNotificationIds();
    let changed = false;
    ids.forEach(id => {
      if (!deleted.includes(id)) {
        deleted.push(id);
        changed = true;
      }
    });
    if (changed) {
      localStorage.setItem('church_deleted_notification_ids', JSON.stringify(deleted));
    }
  };

  const addAppNotification = async (type: string, title: string, subtitle: string, targetTab: any) => {
    try {
      const docId = `nt-${type}-${Date.now()}`;
      await setDoc(doc(db, 'notifications', docId), {
        title: title,
        message: subtitle,
        createdAt: new Date().toISOString(),
        targetTab: targetTab,
        type: type
      });
    } catch (err) {
      console.warn("Failed to write notification to Firestore:", err);
      triggerPhoneNotification(type as any, title, subtitle);
    }
  };

  const prayersInitialSync = useRef(true);
  const eventsInitialSync = useRef(true);
  const getInitialDeletedEventIds = (): Set<string> => {
    try {
      const stored = localStorage.getItem('church_deleted_event_ids');
      return stored ? new Set<string>(JSON.parse(stored)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  };

  const deletedEventIdsRef = useRef<Set<string>>(getInitialDeletedEventIds());

  const saveDeletedEventId = (id: string) => {
    deletedEventIdsRef.current.add(id);
    try {
      localStorage.setItem('church_deleted_event_ids', JSON.stringify(Array.from(deletedEventIdsRef.current)));
    } catch (e) {
      console.warn("Failed to persist deleted event IDs:", e);
    }
  };
  
  const removeDeletedEventId = (id: string) => {
    deletedEventIdsRef.current.delete(id);
    try {
      localStorage.setItem('church_deleted_event_ids', JSON.stringify(Array.from(deletedEventIdsRef.current)));
    } catch (e) {
      console.warn("Failed to persist deleted event IDs:", e);
    }
  };

  // Sync Prayers
  useEffect(() => {
    if (!isAuthReady) return;
    console.log("[Sync] Iniciando ouvinte global: Prayers");
    const unsubscribe = onSnapshot(collection(db, 'prayers'), (snapshot) => {
      const list: PrayerRequest[] = [];

      // Detecção de novos itens para notificações
      if (!prayersInitialSync.current) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data() as PrayerRequest;
            // Notifica apenas se for de outro usuário para evitar eco local
            if (userRef.current && data.authorName?.trim().toLowerCase() !== userRef.current.name?.trim().toLowerCase()) {
               triggerPhoneNotification('prayer', '🙏 Novo Pedido de Oração!', `${data.authorName} postou: ${data.title}`);
            }
          }
        });
      }

      snapshot.forEach((snapDoc) => {
        if (snapDoc.id !== 'system_seeded_state') {
          list.push({ id: snapDoc.id, ...snapDoc.data() } as PrayerRequest);
        }
      });
      console.log(`[Sync] Prayers atualizados: ${list.length} registros.`);
      setPrayers(list);
      prayersInitialSync.current = false;
    }, (error) => {
      console.warn("Firestore Prayers fetch failed:", error);
    });
    return () => unsubscribe();
  }, [isAuthReady]);

  // Sync Cells
  useEffect(() => {
    if (!isAuthReady) return;
    console.log("[Sync] Iniciando ouvinte global: Cells");
    const unsubscribe = onSnapshot(collection(db, 'cells'), (snapshot) => {
      const list: Cell[] = [];
      snapshot.forEach((snapDoc) => {
        if (snapDoc.id !== 'system_seeded_state') {
          list.push({ id: snapDoc.id, ...snapDoc.data() } as Cell);
        }
      });
      console.log(`[Sync] Cells atualizadas: ${list.length} registros.`);
      setCells(list);
    }, (error) => {
      console.warn("Firestore Cells fetch failed:", error);
    });
    return () => unsubscribe();
  }, [isAuthReady]);

    const userEmail = user?.email || '';
    const isLeader = !!(user && (
      user.category?.includes('Pastor') || 
      user.category?.includes('Presbítero') || 
      user.category?.includes('Admin') ||
      user.category?.includes('Coordenador')
    ));

    useEffect(() => {
      if (!isAuthReady) return;
      
      let q = query(collection(db, 'contributions'));
      if (!isLeader && userEmail) {
        q = query(collection(db, 'contributions'), where('userEmail', '==', userEmail));
      }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty && userEmail) {
        const batch = writeBatch(db);
        batch.set(doc(db, 'contributions', 'system_seeded_state'), {
          title: '_system_seeded_',
          amountVal: 0,
          category: 'Célula',
          method: 'Pix',
          userEmail: userEmail || 'anonimo@email.com',
          date: ''
        });

        INITIAL_CONTRIBUTIONS.forEach((c) => {
          batch.set(doc(db, 'contributions', c.id), {
            ...c,
            userEmail: userEmail
          });
        });

        batch.commit()
          .then(() => {
            setContributions(INITIAL_CONTRIBUTIONS);
          })
          .catch((err) => console.error("Error committing contributions batch:", err));
      } else {
        const list: Contribution[] = [];
        snapshot.forEach((snapDoc) => {
          if (snapDoc.id !== 'system_seeded_state') {
            list.push({ id: snapDoc.id, ...snapDoc.data() } as Contribution);
          }
        });
        setContributions(list);
      }
      }, (error) => {
        console.warn("Firestore Contributions query failed:", error);
      });
      return () => unsubscribe();
    }, [userEmail, isLeader, isAuthReady]);

  // Sync Events (with Stale-While-Revalidate and Last-Write-Wins Conflict Resolution)
  useEffect(() => {
    if (!isAuthReady) return;
    console.log("[Sync] Iniciando ouvinte global: Events com revalidação SWR e LWW");
    const unsubscribe = onSnapshot(collection(db, 'events'), (snapshot) => {
      const list: ChurchEvent[] = [];

      eventsInitialSync.current = false;

      snapshot.forEach((snapDoc) => {
        const id = snapDoc.id;
        if (id !== 'system_seeded_state' && !deletedEventIdsRef.current.has(id)) {
          const data = snapDoc.data() as ChurchEvent;
          
          let finalEvent: ChurchEvent = {
            id,
            ...data,
            confirmedUsers: data.confirmedUsers || []
          };
          
          // Last-Write-Wins (LWW) conflict checking: compare event's updatedAt timestamp
          const localEv = eventsRef.current.find(e => e.id === id);
          if (localEv && localEv.updatedAt && data.updatedAt) {
            const localTime = new Date(localEv.updatedAt).getTime();
            const serverTime = new Date(data.updatedAt).getTime();
            if (localTime > serverTime) {
              console.log(`[Conflict Resolution] Preservando o registro local do evento ${id} (atualização local mais recente).`);
              finalEvent = localEv;
            }
          }
          list.push(finalEvent);
        }
      });

      console.log(`[Sync] SWR/LWW revalidation completada: ${list.length} eventos para cache.`);
      try {
        localStorage.setItem('church_events', JSON.stringify(list));
      } catch (e) {
        console.warn("Erro ao salvar cache local de eventos:", e);
      }
      setEvents(list);
      eventsInitialSync.current = false;
    }, (error) => {
      console.warn("Firestore Events fetch failed:", error);
    });
    return () => unsubscribe();
  }, [isAuthReady]);

  // Sync Studies
  useEffect(() => {
    if (!isAuthReady) return;
    console.log("[Sync] Iniciando ouvinte global: Studies");
    const unsubscribe = onSnapshot(collection(db, 'studies'), (snapshot) => {
      const list: ChurchStudy[] = [];
      snapshot.forEach((snapDoc) => {
        if (snapDoc.id !== 'system_seeded_state') {
          list.push({ id: snapDoc.id, ...snapDoc.data() } as ChurchStudy);
        }
      });
      console.log(`[Sync] Studies atualizados: ${list.length} registros.`);
      setStudies(list);
    }, (error) => {
      console.warn("Firestore Studies fetch failed:", error);
    });
    return () => unsubscribe();
  }, [isAuthReady]);

  // Sync Radio Programs
  useEffect(() => {
    if (!isAuthReady) return;
    console.log("[Sync] Iniciando ouvinte global: Radio");
    const unsubscribe = onSnapshot(collection(db, 'radioPrograms'), (snapshot) => {
      const list: RadioProgram[] = [];
      snapshot.forEach((snapDoc) => {
        if (snapDoc.id !== 'system_seeded_state') {
          list.push({ id: snapDoc.id, ...snapDoc.data() } as RadioProgram);
        }
      });
      console.log(`[Sync] RadioPrograms atualizados: ${list.length} registros.`);
      setRadioPrograms(list);
    }, (error) => {
      console.warn("Firestore Radio Programs fetch failed:", error);
    });
    return () => unsubscribe();
  }, [isAuthReady]);

  // Sync Transmissions
  useEffect(() => {
    if (!isAuthReady) return;
    console.log("[Sync] Iniciando ouvinte global: Transmissions");
    const unsubscribe = onSnapshot(collection(db, 'transmissions'), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((snapDoc) => {
        list.push({ id: snapDoc.id, ...snapDoc.data() });
      });
      console.log(`[Sync] Transmissions atualizadas: ${list.length} registros.`);
      setTransmissions(list);
    }, (error) => {
      console.warn("Firestore Transmissions fetch failed:", error);
    });
    return () => unsubscribe();
  }, [isAuthReady]);

  // Sync Custom Roles from Firestore with fallback & browser localStorage migration
  useEffect(() => {
    if (!isAuthReady) return;
    const unsubscribe = onSnapshot(collection(db, 'customRoles'), (snapshot) => {
      if (snapshot.empty) {
        const raw = localStorage.getItem('church_custom_roles');
        let initialRoles = [
          "Coordenador / Admin",
          "Pastor / Presbítero",
          "SAF",
          "UPH",
          "Visitante"
        ];
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              initialRoles = parsed;
            }
          } catch (e) {}
        }
        
        // Ensure standard essential options are listed
        const essentials = ["Visitante", "SAF", "UPH", "Membro Comungante", "Membro Não-Comungante", "Membro Não-Ativo"];
        let merged = [...initialRoles];
        essentials.forEach(item => {
          if (!merged.some(x => x.toLowerCase() === item.toLowerCase())) {
            merged.push(item);
          }
        });
        
        // Normalize name typography
        merged = merged.map(item => {
          if (item.toLowerCase() === "visitante") return "Visitante";
          if (item.toUpperCase() === "SAF") return "SAF";
          if (item.toUpperCase() === "UPH") return "UPH";
          if (item.toLowerCase() === "coordenador / admin" || item.toLowerCase() === "coordenador/admin") return "Coordenador / Admin";
          if (item.toLowerCase() === "pastor / presbítero" || item.toLowerCase() === "pastor/presbítero") return "Pastor / Presbítero";
          return item;
        });
        
        const sorted = Array.from(new Set(merged)).sort((a, b) => a.localeCompare(b, 'pt-BR'));
        
        const batch = writeBatch(db);
        sorted.forEach((roleName) => {
          const docId = getUserDocId(roleName);
          batch.set(doc(db, 'customRoles', docId), { name: roleName });
        });
        batch.commit()
          .then(() => {
            setCargos(sorted);
          })
          .catch((err) => console.error("Error seeding custom roles:", err));
      } else {
        const list: string[] = [];
        snapshot.forEach((snapDoc) => {
          const data = snapDoc.data();
          if (data && data.name) {
            list.push(data.name);
          }
        });

        const sorted = list.sort((a, b) => a.localeCompare(b, 'pt-BR'));
        localStorage.setItem('church_custom_roles', JSON.stringify(sorted));
        setCargos(sorted);
      }
    }, (error) => {
      console.warn("Firestore Custom Roles fetch failed:", error);
    });
    return () => unsubscribe();
  }, [isAuthReady]);

  const sessionStartTime = useRef(Date.now());
  const seenNotifIds = useRef<Set<string>>(new Set());
  const notificationsInitialSync = useRef(true);

  // Sync Notifications from Firestore
  useEffect(() => {
    if (!isAuthReady) return;
    console.log("[Sync] Iniciando ouvinte global: Notifications");

    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(50));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: AppNotification[] = [];
      const readIds = getReadNotificationIds();
      const deletedIds = getDeletedNotificationIds();

      const newItemsToTrigger: AppNotification[] = [];

      snapshot.forEach((snapDoc) => {
        const data = snapDoc.data();
        const id = snapDoc.id;
        
        // Skip deleted notifications
        if (deletedIds.includes(id)) {
          return;
        }

        let typeStr: any = data.type || data.targetTab || 'home';
        if (typeStr === 'event') typeStr = 'eventos';
        if (typeStr === 'prayer') typeStr = 'oracao';
        if (typeStr === 'study') typeStr = 'estudos';
        if (typeStr === 'live') typeStr = 'home';
        if (typeStr === 'cell') typeStr = 'celulas';

        const isUnread = !readIds.includes(id);

        const notifItem: AppNotification = {
          id: id,
          title: data.title || '',
          text: data.message || data.text || '',
          time: data.createdAt ? new Date(data.createdAt).toLocaleDateString('pt-BR') : 'Agora mesmo',
          unread: isUnread,
          type: typeStr
        };

        list.push(notifItem);

        // Track new notifications for trigger
        // Completely bypass clock drift/timezone sync issues:
        // Any incoming ID we haven't seen yet during our active session triggers a banner instantly!
        if (!notificationsInitialSync.current && !seenNotifIds.current.has(id)) {
          newItemsToTrigger.push(notifItem);
        }
        
        seenNotifIds.current.add(id);
      });

      // Populate seen ids initially if search is done
      if (notificationsInitialSync.current) {
        snapshot.forEach((snapDoc) => {
          seenNotifIds.current.add(snapDoc.id);
        });
        notificationsInitialSync.current = false;
      }

      setNotifications(list);

      // Trigger alerts/chimes for truly new notifications received in real-time
      newItemsToTrigger.forEach(item => {
        // Map types correctly
        let triggerType: any = item.type;
        if (triggerType === 'eventos') triggerType = 'event';
        if (triggerType === 'oracao') triggerType = 'prayer';
        if (triggerType === 'celulas') triggerType = 'cell';
        if (triggerType === 'estudos') triggerType = 'study';
        if (triggerType === 'home') triggerType = 'live';

        triggerPhoneNotification(triggerType, item.title, item.text);
      });

    }, (error) => {
      console.warn("Firestore notifications query failed:", error);
    });

    return () => unsubscribe();
  }, [isAuthReady]);

  // Sync Users from Firestore
  useEffect(() => {
    if (!isAuthReady) return;
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      if (snapshot.empty) {
        const batch = writeBatch(db);
        
        const defaultUsers: User[] = [
          {
            name: 'Fabio Nunes',
            email: 'fabiozeronunes@gmail.com',
            phone: '(11) 99999-7777',
            password: '1q2w3e4r',
            category: 'Coordenador / Admin ( Total )',
            avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDFzVPt8R12b6r0cJenxhGMSaRCVhnj5m2I1L63zIXLkZLH0Irma2hv_P5qK-GMNH3b3kCM43ZW9Q4PH9K2SiHy7-ODE2cNb2t8A_zr-BxvnChqsgjZT1LXBuf2HL7pp1fSDQrGvEk4mrCFhimqMvSUYOfz3wbz8iN8rRH9nRmA9gRdo6n7D4xRFLdEgI2ndKUZKvYauk-Nvw84QWoH51RjXus-LV6oWVbwI4n3EBJX3_zjwxm5Rnn2tM0Qd7UVF_wjMD9kxH-nvnE',
            planCount: 4,
            prayerCount: 2,
            eventCount: 1,
            ministry: 'Liderança',
            address: 'Bairro Centro',
            birthDate: '1985-08-20',
            status: 'Ativo'
          }
        ];

        defaultUsers.forEach((u) => {
          const docId = getUserDocId(u.email || '');
          batch.set(doc(db, 'users', docId), {
            ...u,
            updatedAt: new Date().toISOString()
          });
        });

        batch.commit()
          .then(() => {
            setDbUsers(defaultUsers);
            localStorage.setItem('church_users', JSON.stringify(defaultUsers));
          })
          .catch((err) => console.error("Error committing users batch:", err));
      } else {
        const fbList: User[] = [];
        const seenEmailsInSnapshot = new Set<string>();

        snapshot.forEach((snapDoc) => {
          const u = snapDoc.data() as User;
          if (u && u.email) {
            const normalizedEmail = u.email.trim().toLowerCase();
            
            // Ativamente excluir Ricardo Lima se ele ainda existir nas snapshots para resolver de vez a persistência antiga
            if (normalizedEmail === 'ricardo.lima@email.com' || (u.name && u.name.trim().toLowerCase() === 'ricardo lima')) {
              const docId = snapDoc.id;
              deleteDoc(doc(db, 'users', docId))
                .then(() => console.log('Excluído Ricardo Lima de forma definitiva do banco.'))
                .catch(err => console.warn('Erro ao limpar Ricardo Lima:', err));
              return; // Ignora e não adiciona à lista
            }

            // Ativamente excluir o pastor administrador de forma proativa do painel / banco
            if (normalizedEmail === 'admin@igreja.com') {
              const docId = snapDoc.id;
              deleteDoc(doc(db, 'users', docId))
                .then(() => console.log('Excluído pastor administrador do banco de forma definitiva.'))
                .catch(err => console.warn('Erro ao restaurar limpeza do admin:', err));
              return; // Ignora e não adiciona à lista
            }

            // Ativamente corrigir o nome de Fabio Nunes e sua categoria para Coordenador / Admin ( Total )
            if (normalizedEmail === 'fabiozeronunes@gmail.com') {
              const hasStartupMind = u.name?.includes('Startup Mind');
              const hasOldCategory = u.category !== 'Coordenador / Admin ( Total )';
              if (hasStartupMind || hasOldCategory || u.name !== 'Fabio Nunes') {
                const refreshed = {
                  ...u,
                  name: 'Fabio Nunes',
                  category: 'Coordenador / Admin ( Total )'
                };
                const docId = getUserDocId(normalizedEmail);
                setDoc(doc(db, 'users', docId), refreshed, { merge: true })
                  .then(() => console.log('Cadastro do Fabio Nunes foi corrigido com sucesso!'))
                  .catch(err => console.warn('Erro ao atualizar cadastro do Fabio Nunes:', err));
                
                // Usamos a versão limpa localmente para a listagem fluida instantânea
                u.name = 'Fabio Nunes';
                u.category = 'Coordenador / Admin ( Total )';
              }
            }

            if (!seenEmailsInSnapshot.has(normalizedEmail)) {
              seenEmailsInSnapshot.add(normalizedEmail);
              fbList.push({ ...u, id: snapDoc.id });
            } else {
              // Self-healing: delete duplicate user document to permanently clean Firestore
              const docId = snapDoc.id;
              const expectedId = getUserDocId(normalizedEmail);
              if (docId !== expectedId) {
                deleteDoc(doc(db, 'users', docId))
                  .then(() => console.log(`Normalized Cleanup: deleted duplicate Firestore user document: ${docId}`))
                  .catch(err => console.warn(`Normalized Cleanup: error deleting ${docId}:`, err));
              }
            }
          }
        });

        // Realtime notification detection logic based on docChanges removed to adhere to allowed categories only (new cells, prayer requests, events, studies, and transmissions)

        // Smart Merge of Local Users and Firestore Users
        let localUsers: User[] = [];
        const rawLocal = localStorage.getItem('church_users');
        if (rawLocal) {
          try {
            localUsers = JSON.parse(rawLocal);
          } catch (e) {
            console.warn("Error parsing local church_users:", e);
          }
        }

        const mergedList = [...fbList];
        let hasChanges = false;
        const batch = writeBatch(db);

        if (Array.isArray(localUsers) && localUsers.length > 0) {
          localUsers.forEach((localU) => {
            if (!localU.email) return;
            const normLocal = localU.email.trim().toLowerCase();
            const fbMatchIdx = mergedList.findIndex(
              (fbU) => fbU.email?.toLowerCase().trim() === normLocal
            );

            if (fbMatchIdx !== -1) {
              // Bidirectional Smart Sync to prevent loss of password or profile characteristics
              const fbU = mergedList[fbMatchIdx];
              let userModifiedForWeb = false;
              
              if (localU.password && !fbU.password) {
                fbU.password = localU.password;
                userModifiedForWeb = true;
              }
              if (localU.password && fbU.password && localU.password !== fbU.password) {
                // If local password was updated to a custom one while online is default, merge online
                if (localU.password !== '123' && fbU.password === '123') {
                  fbU.password = localU.password;
                  userModifiedForWeb = true;
                }
              }
              if (localU.phone && !fbU.phone) {
                fbU.phone = localU.phone;
                userModifiedForWeb = true;
              }
              if (localU.address && !fbU.address) {
                fbU.address = localU.address;
                userModifiedForWeb = true;
              }
              if (localU.birthDate && !fbU.birthDate) {
                fbU.birthDate = localU.birthDate;
                userModifiedForWeb = true;
              }
              
              if (userModifiedForWeb) {
                const docId = getUserDocId(fbU.email || '');
                batch.set(doc(db, 'users', docId), fbU, { merge: true });
                hasChanges = true;
              }
            }
          });
        }

        const finalDeduplicatedList: User[] = [];
        const uniqueKeys = new Set<string>();
        mergedList.forEach(u => {
          if (u.email) {
            const key = u.email.trim().toLowerCase();
            if (!uniqueKeys.has(key)) {
              uniqueKeys.add(key);
              finalDeduplicatedList.push(u);
            }
          }
        });

        if (hasChanges) {
          batch.commit()
            .then(() => console.log("Smart merge successfully synced local users to Firestore!"))
            .catch((err) => console.warn("Error committing merged users to Firestore:", err));
        }

        setDbUsers(finalDeduplicatedList);
        localStorage.setItem('church_users', JSON.stringify(finalDeduplicatedList));
      }
    }, (error) => {
      console.warn("Firestore Users fetch failed:", error);
    });
    return () => unsubscribe();
  }, [isAuthReady]);

  // Synchronize current logged-in user real-time state with dbUsers
  useEffect(() => {
    if (user && user.email) {
      const match = dbUsers.find(u => u.email?.trim().toLowerCase() === user.email?.trim().toLowerCase());
      if (match) {
        // Safe property-by-property verification (independent of JSON key orders)
        const keysToCompare: (keyof User)[] = ['name', 'email', 'phone', 'category', 'avatarUrl', 'status', 'ministry', 'address', 'birthDate', 'password'];
        const hasDifference = keysToCompare.some(k => match[k] !== user[k]);
        if (hasDifference) {
          setUser(match);
          localStorage.setItem('church_current_user', JSON.stringify(match));
        }
      }
    }
  }, [dbUsers, user]);

  const [showNotificationsList, setShowNotificationsList] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('church_app_notifications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {}
    }
    return [];
  });

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('church_app_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Custom alert feedback Toast message controller
  const [toast, setToast] = useState<string | null>(null);
  const [phoneNotification, setPhoneNotification] = useState<{ id: string; type: 'cell' | 'event' | 'prayer' | 'live' | 'study' | 'transmission'; title: string; subtitle: string } | null>(null);

  const triggerPhoneNotification = (type: 'cell' | 'event' | 'prayer' | 'live' | 'study' | 'transmission', title: string, subtitle: string) => {
    // Check if app-level notifications are blocked globally
    const isGlobalBlocked = localStorage.getItem('church_app_notifications_blocked') === 'true';
    if (isGlobalBlocked) {
      console.log(`[Push] Notification of type ${type} suppressed; globally blocked in app settings.`);
      return;
    }

    let preferences = {
      live: true,
      events: true,
      prayers: true,
      cells: true,
      studies: true
    };
    const saved = localStorage.getItem('church_notif_preferences');
    if (saved) {
      try {
        preferences = JSON.parse(saved);
      } catch (e) {}
    }

    const prefKeyMap: Record<'cell' | 'event' | 'prayer' | 'live' | 'study' | 'transmission', keyof typeof preferences> = {
      cell: 'cells',
      event: 'events',
      prayer: 'prayers',
      live: 'live',
      study: 'studies',
      transmission: 'live'
    };

    const isEnabled = preferences[prefKeyMap[type]];
    
    if (isEnabled) {
      console.log(`[Push] Notification trigger attempt: ${type}`, { title, subtitle });
      // Local App Toast/Popup
      setPhoneNotification(null);
      setTimeout(() => {
        setPhoneNotification({
          id: `phone-notif-${Date.now()}`,
          type,
          title,
          subtitle
        });
      console.log(`[Push] Local UI state updated for notification: ${type}`);
      }, 100);

       // System Native Notification via Service Worker
       try {
         if ('Notification' in window && 'serviceWorker' in navigator && Notification.permission === 'granted') {
           console.log(`[Push] Checking system notification permission...`, {
             swExists: 'serviceWorker' in navigator,
             permission: Notification.permission
           });
           navigator.serviceWorker.ready.then(registration => {
             console.log(`[Push] Sending system notification...`);
             registration.showNotification(title, {
               body: subtitle,
               icon: '/icon-512.png',
               badge: '/icon-512.png',
               tag: `notif-${Date.now()}`,
               data: window.location.origin
             });
           }).catch(err => {
             console.warn("[Push] SW ready error:", err);
           });
         } else {
           console.log(`[Push] System notification suppressed: permission not granted or SW not ready.`);
         }
       } catch (err) {
         console.warn("[Push] Native Notification API is blocked or errored (usually due to iframe constraints):", err);
       }
    }
  };

  // Keep push notification on-screen until manual dismissal
  // useEffect(() => {
  //   if (phoneNotification) {
  //     const timer = setTimeout(() => {
  //       setPhoneNotification(null);
  //     }, 8000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [phoneNotification]);

  // Gentle chime notification sound loop: plays every 1 minute if there are unread notifications
  useEffect(() => {
    const unreadCount = notifications.filter(n => n.unread).length;
    if (unreadCount === 0) return;

    const playChime = () => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        
        // Chime Note 1
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880.00, ctx.currentTime); // A5
        gain1.gain.setValueAtTime(0.12, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start();
        osc1.stop(ctx.currentTime + 0.4);
        setTimeout(() => ctx.close(), 1000);

        // Chime Note 2 (slightly higher, delayed for a bright chime effect)
        setTimeout(() => {
          try {
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(1109.73, ctx.currentTime); // C#6
            gain2.gain.setValueAtTime(0.12, ctx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start();
            osc2.stop(ctx.currentTime + 0.5);
          } catch (err) {}
        }, 120);
      } catch (err) {
        console.warn("Blocked/unsupported Web Audio play:", err);
      }
    };

    // Play once on initial trigger / change of unread notification list
    playChime();

    // Repeat every 1 minute
    // const intervalId = setInterval(() => {
    //   playChime();
    // }, 60000);

    // return () => clearInterval(intervalId);
  }, [notifications]);



  // Helper to map and resolve respective options of notifications clicked in the bell dropdown
  const getTargetTabForNotification = (notif: AppNotification): string => {
    if (notif.type) return notif.type;
    const title = (notif.title || '').toLowerCase();
    const text = (notif.text || '').toLowerCase();
    
    if (title.includes('culto d') || text.includes('transmissão') || text.includes('sintonize') || text.includes('ao vivo') || title.includes('ao vivo')) {
      return 'aovivo';
    }
    if (title.includes('oração') || text.includes('oração') || text.includes('pedido') || text.includes('interceda')) {
      return 'oracao';
    }
    if (title.includes('célula') || text.includes('célula') || text.includes('reunião da célula')) {
      return 'celulas';
    }
    if (title.includes('estudo') || text.includes('estudo') || text.includes('estudos')) {
      return 'estudos';
    }
    if (title.includes('dízimo') || title.includes('contribuição') || text.includes('repasse') || text.includes('dízimo') || text.includes('oferecido') || text.includes('oferta') || title.includes('repasse')) {
      return 'dizimos';
    }
    if (title.includes('evento') || title.includes('atividade') || text.includes('atividade') || text.includes('evento') || text.includes('eventos')) {
      return 'eventos';
    }
    return 'home';
  };

  // Load user session safely
  useEffect(() => {
    const currentUserSession = localStorage.getItem('church_current_user');
    if (currentUserSession) {
      try {
        const parsed = JSON.parse(currentUserSession);
        setUser(parsed);
      } catch (e) {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, []);

  const computedEvents = events.map(ev => {
    const isGoing = !!(
      user && user.email 
        ? ev.confirmedUsers?.some(email => email.trim().toLowerCase() === user.email?.trim().toLowerCase())
        : false
    );
    return {
      ...ev,
      going: isGoing
    };
  });

  const activeGoingCount = computedEvents.filter(e => e.going).length;
  const activePrayersCount = prayers.filter(p => 
    p.authorName?.trim().toLowerCase() === (user ? user.name?.trim().toLowerCase() : 'ricardo lima')
  ).length;

  const showAlert = (message: string) => {
    setToast(message);
  };

  const handleRedirect = (tab: string, elementId?: string) => {
    setCurrentTab(tab);
    localStorage.setItem('church_active_tab', tab);
    if (elementId) {
      setTimeout(() => {
        const el = document.getElementById(elementId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 500); 
    }
  };

  // Toast automatic disappear effect disabled for persistency
  // useEffect(() => {
  //   if (toast) {
  //     const timer = setTimeout(() => {
  //       setToast(null);
  //     }, 4000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [toast]);

  // Listen for global navigate to estudos tag events
  useEffect(() => {
    const handleEstudosNavigation = (e: any) => {
      const tag = e.detail?.tag;
      if (tag) {
        localStorage.setItem('pending_estudos_tag', tag);
        setCurrentTab('estudos');
        localStorage.setItem('church_active_tab', 'estudos');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('navigate-to-estudos-tag', handleEstudosNavigation);
    return () => window.removeEventListener('navigate-to-estudos-tag', handleEstudosNavigation);
  }, []);

  const handleNavigate = (tab: string) => {
    setCurrentTab(tab);
    localStorage.setItem('church_active_tab', tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Auto collapse notification list when navigating
    setShowNotificationsList(false);

    // Immediately mark notifications of this tab as read as they click on it
    const idsToMark: string[] = [];
    const nextNotifs = notifications.map(n => {
      if (n.unread && n.type === tab) {
        idsToMark.push(n.id);
        return { ...n, unread: false };
      }
      return n;
    });
    if (idsToMark.length > 0) {
      markNotificationsReadLocal(idsToMark);
      setNotifications(nextNotifs);
    }
  };

  const handleLoginSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    localStorage.setItem('church_current_user', JSON.stringify(authenticatedUser));
    setCurrentTab('home');
    localStorage.setItem('church_active_tab', 'home');
  };

  const handleAdminLogin = async () => {
    const adminEmail = 'fabiozeronunes@gmail.com';
    const docId = getUserDocId(adminEmail);
    let adminUser: User | null = null;
    
    // Dynamically synchronize the administrative user credentials with Firebase Auth
    try {
      await syncFirebaseAuthWithEmailPassword(adminEmail, '1q2w3e4r');
    } catch (authErr) {
      console.warn("Could not sync admin to Firebase Auth directly:", authErr);
    }
    
    try {
      const snap = await getDoc(doc(db, 'users', docId));
      if (snap.exists()) {
        adminUser = snap.data() as User;
        adminUser.name = 'Fabio Nunes';
        adminUser.category = 'Coordenador / Admin ( Total )';
        // Ensure defaults if fields are empty
        if (adminUser.status === undefined) adminUser.status = 'Ativo';
        if (adminUser.ministry === undefined) adminUser.ministry = 'Liderança';
        await setDoc(doc(db, 'users', docId), adminUser, { merge: true });
        console.log("Admin loaded successfully directly from Firestore online:", adminUser);
      }
    } catch (e) {
      console.warn("Error getting admin from Firestore directly on login:", e);
    }

    if (!adminUser) {
      // Fallback: check within dbUsers or generate defaults
      adminUser = dbUsers.find(u => u.email?.trim().toLowerCase() === adminEmail) || null;
      
      if (!adminUser) {
        adminUser = {
          name: 'Fabio Nunes',
          email: adminEmail,
          phone: '(11) 99999-7777',
          password: '1q2w3e4r',
          category: 'Coordenador / Admin ( Total )',
          avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDFzVPt8R12b6r0cJenxhGMSaRCVhnj5m2I1L63zIXLkZLH0Irma2hv_P5qK-GMNH3b3kCM43ZW9Q4PH9K2SiHy7-ODE2cNb2t8A_zr-BxvnChqsgjZT1LXBuf2HL7pp1fSDQrGvEk4mrCFhimqMvSUYOfz3wbz8iN8rRH9nRmA9gRdo6n7D4xRFLdEgI2ndKUZKvYauk-Nvw84QWoH51RjXus-LV6oWVbwI4n3EBJX3_zjwxm5Rnn2tM0Qd7UVF_wjMD9kxH-nvnE',
          planCount: 4,
          prayerCount: 2,
          eventCount: 1,
          ministry: 'Liderança',
          address: 'Bairro Centro',
          birthDate: '1985-08-20',
          status: 'Ativo',
          updatedAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', docId), adminUser);
      } else {
        adminUser.name = 'Fabio Nunes';
        adminUser.category = 'Coordenador / Admin ( Total )';
        await setDoc(doc(db, 'users', docId), adminUser, { merge: true });
      }
    }
    
    handleLoginSuccess(adminUser);
    showAlert('Seja bem-vindo de volta, Fabio Nunes! Sessão de administrador iniciada.');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('church_current_user');
    setCurrentTab('login');
    localStorage.setItem('church_active_tab', 'login');
    showAlert("Sua sessão foi encerrada com sucesso.");
  };

  const handleUpdateUser = (updatedUser: Partial<User>, targetEmail?: string) => {
    const emailToFind = (targetEmail || updatedUser.email || user?.email || '').trim().toLowerCase();
    
    // 1. If we are updating the current logged-in user, update the user state synchronously
    if (user?.email && user.email.trim().toLowerCase() === emailToFind) {
      setUser(prev => {
        if (!prev) return null;
        const nextUser = { ...prev, ...updatedUser };
        localStorage.setItem('church_current_user', JSON.stringify(nextUser));
        return nextUser;
      });
    }

    // 2. Synchronously update the dbUsers array in App.tsx
    if (emailToFind) {
      setDbUsers(prev => {
        const nextUsers = prev.map(u => {
          if (u.email?.trim().toLowerCase() === emailToFind) {
            return { ...u, ...updatedUser };
          }
          return u;
        });
        localStorage.setItem('church_users', JSON.stringify(nextUsers));
        return nextUsers;
      });

      // 3. Persist to Firestore
      const docId = getUserDocId(emailToFind);
      setDoc(doc(db, 'users', docId), {
        ...updatedUser,
        updatedAt: new Date().toISOString()
      }, { merge: true })
        .then(() => {
          console.log("Successfully synchronized user profile in Firestore online.");
        })
        .catch(err => {
          console.error("Error updating user in Firestore:", err);
          showAlert("Aviso: Não foi possível sincronizar o perfil com o servidor online (Permissão negada ou Sem conexão). O perfil continuará salvo localmente no dispositivo.");
          handleFirestoreError(err, OperationType.UPDATE, `users/${docId}`);
        });
    }
  };

  const handleDeleteUser = (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    setDbUsers(prev => {
      const nextUsers = prev.filter(u => (u.email || '').trim().toLowerCase() !== cleanEmail);
      localStorage.setItem('church_users', JSON.stringify(nextUsers));
      return nextUsers;
    });

    if (user?.email && user.email.trim().toLowerCase() === cleanEmail) {
      setUser(null);
      localStorage.removeItem('church_current_user');
      setCurrentTab('login');
    }
  };

  // --- FIRESTORE ACTIVE WRITERS ---

  // Handle post prayer
  const handleAddPrayer = async (newP: Omit<PrayerRequest, 'id' | 'timeAgo' | 'count' | 'userOred' | 'authorName' | 'avatarUrl'>) => {
    const isLeader = !!(user && (
      user.category?.includes('Pastor') || 
      user.category?.includes('Presbítero') || 
      user.category?.includes('Admin') ||
      user.category?.includes('Coordenador')
    ));

    const id = `pr-${Date.now()}`;
    const fresh: PrayerRequest = {
      id,
      category: newP.category,
      title: newP.title,
      description: newP.description,
      timeAgo: 'Agora mesmo',
      count: 0,
      visibilidade: newP.visibilidade,
      userOred: false,
      authorName: user ? user.name : 'Membro Anônimo',
      avatarUrl: user ? user.avatarUrl : 'https://lh3.googleusercontent.com/aida-public/AB6AXuCuon_BcHB_Ezo-GyWZ4hI-1tjYM4D6R-6QVR--h_YLSfgJfuNoAT3D0dR408jAte4iIR0YX8DdMjjf0WAB3LLf3TAWhS1m7wiEBEDhq3OQcSfcr6PAHPuqJJVOzJgNQ33o9TfbzR4PdJH1l80RMEMIT12VASsOkJWWinfpRqgIbPOOyKpSID2uqnTDnoXb6sYsYUf6k96KI6liIkZetYGqEYosB2wWAyfX4as38eya06G77-a3LNEJOmx1t2NNHu0-NXCsW1orVPs',
      aprovado: isLeader,
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'prayers', id), {
        ...fresh,
        authorEmail: user?.email || 'anonimo@email.com'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `prayers/${id}`);
    }

    // Trigger smartphone notification!
    triggerPhoneNotification('prayer', '🙏 Novo Pedido de Oração!', `Interceda pelo pedido: "${newP.title}".`);

    // Append a live system notification as well
    setNotifications(prev => [
      {
        id: `nt-new-${Date.now()}`,
        title: 'Pedido Enviado',
        text: `O seu pedido "${newP.title}" foi enviado com sucesso.`,
        time: 'Agora mesmo',
        unread: true,
        type: 'oracao'
      },
      ...prev
    ]);
  };

  // Handle toggle Orei supportive count
  const handleToggleOrei = async (prId: string) => {
    const prayer = prayers.find(p => p.id === prId);
    if (!prayer) return;
    const nextUserOred = !prayer.userOred;
    const nextCount = nextUserOred ? prayer.count + 1 : prayer.count - 1;
    try {
      await updateDoc(doc(db, 'prayers', prId), {
        userOred: nextUserOred,
        count: nextCount
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `prayers/${prId}`);
    }
  };

  // Handle deleting a prayer request
  const handleDeletePrayer = async (prId: string) => {
    // Atualização otimista local
    setPrayers(prev => prev.filter(p => p.id !== prId));
    
    try {
      await deleteDoc(doc(db, 'prayers', prId));
      showAlert("Seu pedido de oração e intercessão foi removido com sucesso.");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `prayers/${prId}`);
    }
  };

  // Handle editing a prayer request
  const handleEditPrayer = async (prId: string, updatedTitle: string, updatedDescription: string) => {
    try {
      await updateDoc(doc(db, 'prayers', prId), {
        title: updatedTitle,
        description: updatedDescription
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `prayers/${prId}`);
    }
  };

  // Handle cell join representation
  const handleToggleJoinCell = async (cellId: string) => {
    const cell = cells.find(c => c.id === cellId);
    if (!cell) return;
    try {
      await updateDoc(doc(db, 'cells', cellId), {
        joined: !cell.joined
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `cells/${cellId}`);
    }
  };

  // Handle post tithe/contribution
  const handleAddContribution = async (amountVal: number, category: Contribution['category'], method: Contribution['method'], title?: string, date?: string) => {
    const fTitle = title || `${category} ${category === 'Dízimo' ? 'Mensal' : 'Espontânea'}`;
    const fresh: Contribution = {
      id: `cont-${Date.now()}`,
      title: fTitle,
      date: date || 'Hoje, 2026',
      amountVal,
      category,
      method,
    };

    try {
      await setDoc(doc(db, 'contributions', fresh.id), {
        ...fresh,
        userEmail: user?.email || 'ricardo.lima@email.com'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `contributions/${fresh.id}`);
    }

    // Append a live system notification
    setNotifications(prev => [
      {
        id: `nt-new-${Date.now()}`,
        title: 'Contribuição Confirmada',
        text: `Seu repasse de R$ ${amountVal.toFixed(2)} foi registrado para: ${category}.`,
        time: 'Agora mesmo',
        unread: true,
        type: 'dizimos'
      },
      ...prev
    ]);

    // Trigger floating smartphone notification
    triggerPhoneNotification('live', '💰 Contribuição Recebida!', `Repasse de R$ ${amountVal.toFixed(2)} confirmado.`);
  };

  const handleDeleteContribution = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'contributions', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `contributions/${id}`);
    }
  };

  const handleCreateEventAndPublish = async (newEvent: Omit<ChurchEvent, 'id' | 'going'>) => {
    const id = `ev-${Date.now()}`;
    const freshEvent: ChurchEvent = {
      ...newEvent,
      id,
      going: false,
      updatedAt: new Date().toISOString()
    };
    
    // Optimistic update for UI and local storage cache
    setEvents((prev) => {
      const updated = [freshEvent, ...prev];
      try {
        localStorage.setItem('church_events', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      await setDoc(doc(db, 'events', id), freshEvent);
    } catch (error) {
      // Rollback on write failure (e.g. forbidden)
      setEvents((prev) => {
        const restored = prev.filter(e => e.id !== id);
        try {
          localStorage.setItem('church_events', JSON.stringify(restored));
        } catch (e) {}
        return restored;
      });
      handleFirestoreError(error, OperationType.WRITE, `events/${id}`);
    }
    
    // Trigger smartphone notification!
    triggerPhoneNotification('event', '📅 Novo Evento Cadastrado!', `Não perca: "${newEvent.title}" foi agendado.`);

    // Append a live system notification as well
    setNotifications((prev) => [
      {
        id: `nt-new-${Date.now()}`,
        title: 'Nova Atividade Publicada',
        text: `Foi cadastrada uma nova atividade: "${newEvent.title}". Visualize na aba Eventos!`,
        time: 'Agora mesmo',
        unread: true,
        type: 'eventos'
      },
      ...prev
    ]);

    // Add system notification for members
    addAppNotification('event', 'Nova Atividade Publicada', `Foi cadastrada uma nova atividade: "${newEvent.title}". Visualize na aba Eventos!`, 'eventos');
  };

  const handleDeleteEventAndPublish = async (id: string) => {
    console.log("Attempting to delete event:", id);
    
    // Save current state for rollback on failure
    const previousEvents = [...events];

    // Persist to deleted IDs set in LocalStorage so SWR doesn't resurrect it
    saveDeletedEventId(id);

    // Optimistic UI update: filter out the deleted event immediately so it vanishes instantly
    setEvents((prev) => {
      const updated = prev.filter((ev) => ev.id !== id);
      try {
        localStorage.setItem('church_events', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    
    try {
      await deleteDoc(doc(db, 'events', id));
      console.log("Successfully deleted event from Firestore:", id);
      showAlert('Atividade removida com sucesso do banco de dados online.');
    } catch (error) {
      console.error("Error deleting event:", error);
      
      // Rollback optimistic state
      setEvents(previousEvents);
      try {
        localStorage.setItem('church_events', JSON.stringify(previousEvents));
      } catch (e) {}
      
      removeDeletedEventId(id);
      
      showAlert('Erro ao excluir evento online: Permissão negada ou sem conexão.');
      handleFirestoreError(error, OperationType.DELETE, `events/${id}`);
    }
  };

  const handleUpdateEventAndPublish = async (updatedEvent: ChurchEvent) => {
    const previousEvents = [...events];
    const timestampedEvent = {
      ...updatedEvent,
      updatedAt: new Date().toISOString()
    };
    
    // Optimistic UI & local cache update
    setEvents((prev) => {
      const updated = prev.map((ev) => ev.id === timestampedEvent.id ? timestampedEvent : ev);
      try {
        localStorage.setItem('church_events', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      await setDoc(doc(db, 'events', timestampedEvent.id), timestampedEvent);
    } catch (error) {
      // Rollback on permission denied or actual write failure
      setEvents(previousEvents);
      try {
        localStorage.setItem('church_events', JSON.stringify(previousEvents));
      } catch (e) {}
      handleFirestoreError(error, OperationType.WRITE, `events/${timestampedEvent.id}`);
    }

    // Trigger smartphone notification!
    triggerPhoneNotification('event', '📅 Evento Atualizado!', `Atenção: o evento "${updatedEvent.title}" foi atualizado.`);

    // Append a live system notification as well
    setNotifications((prev) => [
      {
        id: `nt-update-${Date.now()}`,
        title: 'Atividade Atualizada',
        text: `As informações da atividade "${updatedEvent.title}" foram atualizadas.`,
        time: 'Agora mesmo',
        unread: true,
        type: 'eventos'
      },
      ...prev
    ]);

    // Add system notification for members
    addAppNotification('event', 'Atividade Atualizada', `As informações da atividade "${updatedEvent.title}" foram atualizadas.`, 'eventos');
  };

  // Add Studies state handlers
  const handleCreateStudyAndPublish = async (newStudy: Omit<ChurchStudy, 'id' | 'dateStr'>) => {
    const id = `std-${Date.now()}`;
    const freshStudy: ChurchStudy = {
      ...newStudy,
      id,
      dateStr: 'Hoje',
      updatedAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'studies', id), freshStudy);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `studies/${id}`);
    }

    // Add system notification for members
    addAppNotification('study', '📖 Novo Estudo Publicado!', `Confira o novo estudo: "${newStudy.title}"`, 'estudos');
  };

  const handleDeleteStudyAndPublish = async (id: string) => {
    // Optimistic UI update: filter out the deleted study immediately so it vanishes instantly
    setStudies((prev) => prev.filter((std) => std.id !== id));
    try {
      await deleteDoc(doc(db, 'studies', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `studies/${id}`);
    }
  };

  const handleUpdateStudyAndPublish = async (updatedStudy: ChurchStudy) => {
    try {
      await setDoc(doc(db, 'studies', updatedStudy.id), {
        ...updatedStudy,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `studies/${updatedStudy.id}`);
    }
  };

  // Radio Program handlers
  const handleCreateRadioProgram = async (newPrg: Omit<RadioProgram, 'id' | 'createdAt'>) => {
    const id = `rad-${Date.now()}`;
    const freshPrg: RadioProgram = {
      ...newPrg,
      id,
      createdAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'radioPrograms', id), freshPrg);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `radioPrograms/${id}`);
    }
    
    // Trigger system notification & phone notification
    triggerPhoneNotification('live', '📻 Novo Programa na Rádio IPBA!', `Ouça agora: "${freshPrg.title}" apresentado por ${freshPrg.speaker}.`);
    
    // Add system notification for members
    addAppNotification('live', '📻 Novo Programa na Rádio IPBA', `O programa "${freshPrg.title}" (${freshPrg.scheduledTime || 'Programação Agendada'}) já está disponível para ouvir na rádio da igreja!`, 'home');
  };

  const handleDeleteRadioProgram = async (id: string) => {
    // Optimistic UI update: filter out the deleted radio program immediately so it vanishes instantly
    setRadioPrograms((prev) => prev.filter((rad) => rad.id !== id));
    try {
      await deleteDoc(doc(db, 'radioPrograms', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `radioPrograms/${id}`);
    }
  };

  const handleUpdateRadioProgram = async (updatedPrg: RadioProgram) => {
    try {
      await setDoc(doc(db, 'radioPrograms', updatedPrg.id), updatedPrg);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `radioPrograms/${updatedPrg.id}`);
    }
  };

  const handleCreateCellAndPublish = async (newCell: Omit<Cell, 'id' | 'joined'>) => {
    const id = `c-${Date.now()}`;
    const freshCell: Cell = {
      ...newCell,
      id,
      joined: false,
      updatedAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'cells', id), freshCell);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `cells/${id}`);
    }

    // Trigger smartphone notification!
    triggerPhoneNotification('cell', '🏘️ Nova Célula Cadastrada!', `Reunião da Célula "${newCell.title}" no bairro ${newCell.neighborhood || 'Centro'} foi criada.`);

    // Add system notification for members
    addAppNotification('cell', '🏘️ Nova Célula Cadastrada!', `Reunião da Célula "${newCell.title}" no bairro ${newCell.neighborhood || 'Centro'} foi criada.`, 'celulas');
  };

  const handleDeleteCellAndPublish = async (id: string) => {
    console.log("Attempting to delete cell:", id);
    // Optimistic UI state update: filter out the deleted cell immediately so it vanishes instantly
    setCells((prev) => prev.filter((c) => c.id !== id));
    try {
      await deleteDoc(doc(db, 'cells', id));
      console.log("Successfully deleted cell from Firestore:", id);
    } catch (error) {
      console.error("Error deleting cell:", error);
      handleFirestoreError(error, OperationType.DELETE, `cells/${id}`);
    }
  };

  const handleUpdateCellAndPublish = async (updatedCell: Cell) => {
    try {
      await setDoc(doc(db, 'cells', updatedCell.id), {
        ...updatedCell,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `cells/${updatedCell.id}`);
    }
  };

  const handleUpdatePrayerVisibility = async (id: string, visibility: 'Público' | 'Pastoral') => {
    try {
      await updateDoc(doc(db, 'prayers', id), {
        visibilidade: visibility
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `prayers/${id}`);
    }
  };

  const handleSaveAllPrayers = async (updatedList: PrayerRequest[]) => {
    const batch = writeBatch(db);
    let approvedCount = 0;

    updatedList.forEach(p => {
      // Find original to see if it was just approved to send notification
      const original = prayers.find(orig => orig.id === p.id);
      const isNewlyApproved = p.aprovado && (!original || !original.aprovado);
      
      batch.set(doc(db, 'prayers', p.id), {
        ...p,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      if (isNewlyApproved) {
        approvedCount++;
        // We could add a notification per prayer, but maybe just one summary if many?
        // Let's add one notification since they are distinct requests
        addAppNotification('prayer', '🙏 Pedido de Oração Aprovado', `O pedido "${p.title}" foi aprovado para intercessão pública.`, 'oracao');
      }
    });

    try {
      await batch.commit();
      setPrayers(updatedList);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'prayers_batch');
    }
  };

  // Handle register/unregister church event
  const handleToggleGoingEvent = async (evId: string) => {
    const e = computedEvents.find(item => item.id === evId);
    if (!e) return;
    const isGoing = !e.going;
    const userEmail = user?.email || 'anonimo@email.com';
    let confirmedUsers = e.confirmedUsers || [];
    
    const normalizedEmail = userEmail.trim().toLowerCase();
    if (isGoing) {
      if (!confirmedUsers.some(email => email.trim().toLowerCase() === normalizedEmail)) {
        confirmedUsers = [...confirmedUsers, userEmail];
      }
    } else {
      confirmedUsers = confirmedUsers.filter(email => email.trim().toLowerCase() !== normalizedEmail);
    }

    try {
      await updateDoc(doc(db, 'events', evId), {
        going: isGoing,
        confirmedUsers: confirmedUsers
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `events/${evId}`);
    }
  };

  const clearAllNotifications = () => {
    const ids = notifications.map(n => n.id);
    deleteNotificationsLocal(ids);
    setNotifications([]);
    showAlert("Histórico de notificações limpo.");
  };

  const markAllNotificationsRead = () => {
    const ids = notifications.filter(n => n.unread).map(n => n.id);
    markNotificationsReadLocal(ids);
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    showAlert("Todas lidas!");
  };

  // Desativa as notificações do tipo da aba correspondente ao clicar/entrar nela
  useEffect(() => {
    if (currentTab) {
      const idsToMark: string[] = [];
      const nextNotifs = notifications.map(n => {
        if (n.unread && n.type === currentTab) {
          idsToMark.push(n.id);
          return { ...n, unread: false };
        }
        return n;
      });
      if (idsToMark.length > 0) {
        markNotificationsReadLocal(idsToMark);
        setNotifications(nextNotifs);
      }
    }
  }, [currentTab, notifications]);

  const tabNotifications: Record<string, number> = {};
  notifications.forEach(n => {
    if (n.unread && n.type) {
      // Normalização robusta de tipos para corresponder exatamente às abas do menu (BottomNav)
      let t = n.type.toLowerCase().trim();
      if (t === 'event' || t === 'eventos') {
        tabNotifications['eventos'] = (tabNotifications['eventos'] || 0) + 1;
      } else if (t === 'prayer' || t === 'oracao') {
        tabNotifications['oracao'] = (tabNotifications['oracao'] || 0) + 1;
      } else if (t === 'study' || t === 'estudos') {
        tabNotifications['estudos'] = (tabNotifications['estudos'] || 0) + 1;
      } else if (t === 'cell' || t === 'celulas') {
        tabNotifications['celulas'] = (tabNotifications['celulas'] || 0) + 1;
      } else if (t === 'live' || t === 'aovivo') {
        tabNotifications['aovivo'] = (tabNotifications['aovivo'] || 0) + 1;
      } else if (t === 'home') {
        tabNotifications['home'] = (tabNotifications['home'] || 0) + 1;
      } else {
        tabNotifications[t] = (tabNotifications[t] || 0) + 1;
      }
    }
  });

  // Somar pendências de usuários no badge do admin
  const pendingUsersCount = dbUsers.filter(u => u.status === 'Pendente').length;
  if (pendingUsersCount > 0) {
    tabNotifications['admin'] = (tabNotifications['admin'] || 0) + pendingUsersCount;
  }

  return (
    <div className="h-screen h-[100dvh] w-full bg-surface font-sans text-on-surface flex flex-col overflow-hidden relative">
      
      {/* Brand Top Header Bar Component */}
      <Header 
        user={user} 
        onNavigate={handleNavigate} 
        deferredPrompt={deferredPrompt}
        onInstall={handleInstallClick}
        onToggleNotifications={() => setShowNotificationsList(!showNotificationsList)}
        unreadCount={notifications.filter(n => n.unread).length}
      />

      {/* Soft PWA Installation Prompt Banner */}
      {showSoftInstallPrompt && !showSoftNotifPrompt && (
        <div className="fixed top-24 left-4 right-4 mx-auto max-w-sm bg-white rounded-3xl shadow-[0_20px_50px_rgba(16,185,129,0.3)] border-2 border-emerald-100 p-6 z-[9998] animate-banner-slide-in ring-8 ring-emerald-500/10">
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0 shadow-inner border border-emerald-100">
              <Smartphone className="w-7 h-7 text-emerald-600 animate-bounce" />
            </div>
            <div className="flex-grow space-y-1.5">
              <h3 className="text-base font-extrabold text-[#191c1d] tracking-tight">Criar Atalho no Navegador?</h3>
              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                Adicione um atalhado na sua tela de início para abrir o portal IPBA diretamente pelo navegador de internet (sem instalar aplicativo).
              </p>
              <div className="flex gap-3 pt-3">
                <button 
                  onClick={() => {
                    setShowSoftInstallPrompt(false);
                    if (deferredPrompt) {
                      deferredPrompt.prompt();
                      deferredPrompt.userChoice.then((choiceResult: any) => {
                        console.log("[PWA] User choice outcome:", choiceResult.outcome);
                        setDeferredPrompt(null);
                        setTimeout(() => {
                          setShowSoftNotifPrompt(true);
                        }, 800);
                      });
                    } else {
                      handleInstallClick();
                    }
                  }}
                  className="bg-emerald-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 cursor-pointer active:scale-95"
                >
                  Adicionar Atalho
                </button>
                <button 
                  onClick={() => {
                    setShowSoftInstallPrompt(false);
                    localStorage.setItem('church_install_prompt_dismissed', 'true');
                  }}
                  className="text-slate-400 px-4 py-3 text-[10px] font-bold uppercase tracking-widest hover:text-slate-600 cursor-pointer"
                >
                  Ignorar
                </button>
              </div>
            </div>
            <button 
              onClick={() => {
                setShowSoftInstallPrompt(false);
                localStorage.setItem('church_install_prompt_dismissed', 'true');
              }}
              className="text-slate-300 hover:text-slate-500 transition-colors p-1 -mt-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Soft Notification Prompt Banner - Estilo Adaptativo para PWA Standalone */}
      {showSoftNotifPrompt && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 flex flex-col items-center text-center">
            {/* Close Button */}
            <button 
              type="button"
              onClick={handleDismissSoftPrompt}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center p-2 shadow-inner border border-indigo-100 mb-4 mt-2">
              <Bell className="w-10 h-10 text-indigo-600 animate-bounce-slow" />
            </div>

            <h3 className="text-xl font-black text-[#002D5E] leading-tight">Receber Notificações do Portal?</h3>
            
            <p className="text-xs text-slate-600 mt-2 mb-5 leading-relaxed">
              Ative as notificações para receber avisos de cultos ao vivo, pedidos de oração urgentes, eventos oficiais e atualizações diretamente no seu celular.
            </p>

            {/* Link / Info Box */}
            <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3.5 mb-5 text-left text-[11px] text-slate-500 leading-relaxed">
              🔔 <strong>Avisos Rápidos:</strong> Fique tranquilo, nós respeitamos sua privacidade. Você receberá poucas notificações relevantes e poderá desativar a qualquer momento nas configurações do seu navegador.
            </div>

            <div className="w-full flex gap-3">
              <button
                type="button"
                onClick={handleDismissSoftPrompt}
                className="flex-1 py-3.5 border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors text-xs font-bold rounded-full cursor-pointer"
              >
                Agora Não
              </button>
              <button
                type="button"
                onClick={handleNativePermissionRequest}
                className="flex-grow-[1.5] py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition-all rounded-full shadow-md active:scale-95 cursor-pointer"
              >
                Sim, Autorizar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Single-Screen Render Router Canvas */}
      <main className="pt-24 pb-32 px-6 max-w-lg mx-auto w-full flex-grow overflow-y-auto no-scrollbar relative">
        
        {/* Render active section tab component */}
        {currentTab === 'home' && (
          <HomeLiveSection 
            onNavigate={handleNavigate} 
            userLogged={!!user}
            onShowAlert={showAlert}
            radioPrograms={radioPrograms}
            transmissions={transmissions}
            events={events}
          />
        )}

        {currentTab === 'celulas' && (
          <CelulasSection 
            cells={cells}
            onToggleJoin={handleToggleJoinCell}
            onShowAlert={showAlert}
          />
        )}

        {currentTab === 'perfil' && (
          user ? (
            <PerfilSection 
              user={user} 
              onLogout={handleLogout}
              onNavigate={handleNavigate}
              userPrayersCount={activePrayersCount}
              userEventsCount={activeGoingCount}
              userContributionsCount={contributions.length}
              onShowAlert={showAlert}
              onUpdateUser={handleUpdateUser}
              prayers={prayers}
              onDeletePrayer={handleDeletePrayer}
              onAdminLogin={handleAdminLogin}
              cargos={cargos}
            />
          ) : (
            <LoginSection 
              onLoginSuccess={handleLoginSuccess}
              onShowAlert={showAlert}
              dbUsers={dbUsers}
              onInstall={handleInstallClick}
            />
          )
        )}

        {currentTab === 'login' && (
          <LoginSection 
            onLoginSuccess={handleLoginSuccess}
            onShowAlert={showAlert}
            dbUsers={dbUsers}
            onInstall={handleInstallClick}
          />
        )}

        {currentTab === 'oracao' && (
          <OracaoSection 
            prayers={prayers}
            onSubmitPrayer={handleAddPrayer}
            onToggleOrei={handleToggleOrei}
            onDeletePrayer={handleDeletePrayer}
            onEditPrayer={handleEditPrayer}
            onShowAlert={showAlert}
            currentUserName={user ? user.name : undefined}
            currentUserCategory={user ? user.category : undefined}
          />
        )}

        {currentTab === 'dizimos' && (
          <DizimosSection 
            contributions={contributions}
            userLogged={!!user}
            onAddContribution={handleAddContribution}
            onShowAlert={showAlert}
            onNavigate={handleNavigate}
          />
        )}

        {currentTab === 'estudos' && (
          <EstudosSection 
            studies={studies}
            onShowAlert={showAlert}
          />
        )}

        {currentTab === 'aovivo' && (
          <AoVivoSection 
            userLogged={!!user}
            userName={user ? user.name : 'Ricardo Lima'}
            onShowAlert={showAlert}
            userCategory={user ? user.category : undefined}
            transmissions={transmissions}
            dbUsers={dbUsers}
          />
        )}

        {currentTab === 'eventos' && (
          <EventosSection 
            events={computedEvents}
            onToggleGoing={handleToggleGoingEvent}
            onShowAlert={showAlert}
            onNavigate={handleNavigate}
          />
        )}

        {currentTab === 'suporte' && (
          <SuporteSection 
            user={user}
            onShowAlert={showAlert}
            isAuthReady={isAuthReady}
          />
        )}

        {currentTab === 'admin' && (
          user && (user.category?.includes('Pastor / Presbítero') || user.category?.includes('Coordenador / Admin')) ? (
            <AdminSection
              events={computedEvents}
              cells={cells}
              prayers={prayers}
              contributions={contributions}
              currentUserIdEmail={user ? user.email : undefined}
              userCategory={user ? user.category : undefined}
              onAddEvent={handleCreateEventAndPublish}
              onDeleteEvent={handleDeleteEventAndPublish}
              onUpdateEvent={handleUpdateEventAndPublish}
              onAddCell={handleCreateCellAndPublish}
              onDeleteCell={handleDeleteCellAndPublish}
              onUpdateCell={handleUpdateCellAndPublish}
              onAddContribution={handleAddContribution}
              onDeleteContribution={handleDeleteContribution}
              onDeletePrayer={handleDeletePrayer}
              onUpdatePrayerVisibility={handleUpdatePrayerVisibility}
              onSaveAllPrayers={handleSaveAllPrayers}
              onShowAlert={showAlert}
              onNotifyCreated={triggerPhoneNotification}
              studies={studies}
              onAddStudy={handleCreateStudyAndPublish}
              onDeleteStudy={handleDeleteStudyAndPublish}
              onUpdateStudy={handleUpdateStudyAndPublish}
              radioPrograms={radioPrograms}
              onAddRadioProgram={handleCreateRadioProgram}
              onDeleteRadioProgram={handleDeleteRadioProgram}
              onUpdateRadioProgram={handleUpdateRadioProgram}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              dbUsers={dbUsers}
              propTransmissions={transmissions}
              propCargos={cargos}
              isAuthReady={isAuthReady}
            />
          ) : (
            <div className="bg-white p-6 rounded-3xl border border-rose-200 shadow-md text-center space-y-5 animate-fade-in text-slate-800">
              <div className="w-12 h-12 bg-rose-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6 text-red-650" />
              </div>
              <h2 className="text-base font-black text-rose-950 uppercase tracking-tight">Acesso Restrito ao Clero</h2>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Este painel é exclusivo para Pastores, Presbíteros e Coordenadores homologados pela Igreja Presbiteriana de Aquarius.
              </p>
              
              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-xs space-y-3">
                <p className="text-[#001939] font-black">Deseja simular o acesso de Administrador para teste rápido?</p>
                <button
                  onClick={() => {
                    handleUpdateUser({ category: 'Coordenador / Admin' });
                    showAlert("Promovido para Coordenador / Admin! Carregando painel de controle...");
                  }}
                  className="px-6 py-2.5 bg-[#001939] hover:bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full cursor-pointer transition-all shadow-sm flex items-center gap-1.5 mx-auto"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Ativar Liderança de Teste</span>
                </button>
              </div>
            </div>
          )
        )}

      </main>

      {/* Floating Notifications List Panel Overlay */}
      {showNotificationsList && (
        <div className="fixed top-20 right-6 w-[340px] max-w-[90vw] bg-white rounded-3xl shadow-2xl border border-slate-200 z-[60] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 ring-4 ring-black/5">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-[#191c1d] text-base">Notificações</h3>
              {notifications.filter(n => n.unread).length > 0 && (
                <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {notifications.filter(n => n.unread).length} novas
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={markAllNotificationsRead}
                className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline cursor-pointer"
              >
                Limpar
              </button>
              <button 
                onClick={() => setShowNotificationsList(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          <div className="max-h-[70vh] overflow-y-auto overflow-x-hidden no-scrollbar bg-slate-50/30">
            {notifications.length === 0 ? (
              <div className="py-12 px-6 text-center space-y-3">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Check className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-sm font-bold text-slate-700">Tudo em dia!</p>
                <p className="text-xs text-slate-400 font-semibold px-4">Você ainda não recebeu nenhuma notificação.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((n) => (
                  <div 
                    key={n.id} 
                    onClick={() => {
                      const target = getTargetTabForNotification(n);
                      handleNavigate(target);
                      setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, unread: false } : item));
                      setShowNotificationsList(false);
                    }}
                    className={`p-4 flex items-start gap-4 transition-all hover:bg-indigo-50/50 cursor-pointer relative group ${n.unread ? 'bg-indigo-50/20' : ''}`}
                  >
                    {n.unread && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r-full" />
                    )}
                    
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                      n.type === 'oracao' ? 'bg-rose-100 text-rose-600' :
                      n.type === 'aovivo' ? 'bg-red-100 text-red-600' :
                      n.type === 'eventos' ? 'bg-amber-100 text-amber-600' :
                      n.type === 'estudos' ? 'bg-indigo-100 text-indigo-600' :
                      'bg-[#002D5E] text-white'
                    }`}>
                      <Church className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className={`text-xs font-bold leading-tight ${n.unread ? 'text-[#191c1d]' : 'text-slate-600'}`}>{n.title}</h4>
                        <span className="text-[9px] text-slate-400 font-extrabold whitespace-nowrap uppercase tracking-tighter">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-semibold leading-relaxed line-clamp-2 pr-2">{n.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="p-3 bg-white border-t border-slate-100 text-center">
              <button 
                onClick={clearAllNotifications}
                className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline cursor-pointer"
              >
                Apagar Histórico
              </button>
            </div>
          )}
        </div>
      )}

      {/* Styled smartphone push notifications keyframes */}
      <style>{`
        @keyframes bannerSlideIn {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (min-width: 768px) {
          @keyframes bannerSlideIn {
            from {
              opacity: 0;
              transform: translateY(-40px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        }
        .animate-banner-slide-in {
          animation: bannerSlideIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes bounceSlow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-slow {
          animation: bounceSlow 2s ease-in-out infinite;
        }
        @keyframes slideInTopPush {
          0% { transform: translateY(-120px); opacity: 0; }
          60% { transform: translateY(12px); opacity: 1; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .phone-push-entered {
          animation: slideInTopPush 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>

      {/* Smartphone Floating Push Notification Alert */}
      {phoneNotification && (
        <div className="fixed top-5 left-0 right-0 px-4 flex justify-center z-[9999] pointer-events-none">
          <div 
            onClick={() => {
              const tabMap: Record<string, string> = {
                cell: 'celulas',
                event: 'eventos',
                prayer: 'oracao',
                live: 'aovivo',
                study: 'estudos',
                transmission: 'aovivo'
              };
              const targetTab = tabMap[phoneNotification.type];
              if (targetTab) {
                handleNavigate(targetTab);
              }
              setPhoneNotification(null);
            }}
            className="pointer-events-auto w-full max-w-[420px] bg-[#002d5e] border border-white/10 p-4 rounded-3xl shadow-2xl flex items-start gap-3.5 cursor-pointer transition-all hover:scale-[1.02] active:scale-98 text-white phone-push-entered"
          >
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-md p-1.5 border border-white/20 relative">
              <Bell className="w-6 h-6 text-[#002d5e] animate-bounce-slow" />
              {/* Badge visual consistente com o sino do topo e com o número total de não lidas */}
              <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 bg-red-500 border-2 border-white rounded-full shadow-sm animate-pulse flex items-center justify-center text-[8px] font-black text-white px-0.5">
                {notifications.filter(n => n.unread).length}
              </span>
            </div>
            <div className="flex-1 space-y-0.5 overflow-hidden text-left">
              <div className="flex justify-between items-center text-[10px] text-white/70 font-extrabold uppercase tracking-widest">
                <span>Notificação</span>
                <span>agora</span>
              </div>
              <h4 className="text-xs font-black text-white truncate leading-tight">
                {phoneNotification.title}
              </h4>
              <p className="text-[11px] text-white/90 leading-snug break-words">
                {phoneNotification.subtitle}
              </p>
              <div className="pt-1.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                <span className="text-[9px] text-white/75 font-extrabold uppercase tracking-wider block">
                  Toque para abrir no aplicativo
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPhoneNotification(null);
              }}
              className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              title="Fechar Notificação"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      )}

      {/* Floating alert toast container */}
      {toast && (
        <div className="fixed bottom-28 right-6 max-w-xs bg-slate-900 border border-slate-800 text-white p-4 rounded-xl shadow-2xl flex items-start gap-3 backdrop-blur z-50 text-xs font-semibold animate-fade-in">
          <Info className="w-5 h-5 text-[#a9c7ff] shrink-0 mt-0.5" />
          <p className="flex-1 text-white">{toast}</p>
          <button 
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* PWA Install Guidance Modal */}
      {showInstallGuidance && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-md animate-fade-in text-slate-800">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 flex flex-col items-center text-center">
            {/* Close Button */}
            <button 
              type="button"
              onClick={() => {
                setShowInstallGuidance(false);
                // Prompt for notification permission visually!
                setTimeout(() => {
                  setShowSoftNotifPrompt(true);
                }, 600);
              }}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Logo */}
            <div className="w-20 h-20 bg-[#002D5E] rounded-2xl flex items-center justify-center p-2 shadow-inner border border-[#002D5E]/20 mb-4 mt-2">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuADYMPvZcaOSpHUoz7xjXH4_NJcY25qztiFideOgHchUZKhDCIoAyq_MGHgParQMmKcwudjYsYMEG0TCr3XaZvoDPdwhgOP69aaiYWcXIUEoQX0Ra1DCbFOr3bTIMz7JLCMI4XJDTJ0bjECIZfhV06N7LfW5TN63vQqhOogP521OSWtqiXBFJbV9vtNdePlGu6ecRVcuNbWfGIZugLjKYMuloDE98xQMY7_Vw6y7T4gzlmYr-7m3DQqOwEyMuaNC6tgBxOSbbR0jgY"
                className="w-full h-full object-contain rounded-xl"
                alt="IPBA DIGITAL Logo"
              />
            </div>

            <h3 className="text-xl font-black text-[#002D5E] leading-tight">Criar Atalho no Navegador</h3>
            
            {deferredPrompt ? (
              /* Automatic Install Section */
              <div className="w-full mt-2">
                <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                  Para facilitar seu acesso direto, adicionaremos um **atalho simples na tela de início** para carregar o portal diretamente no ambiente do seu navegador através do link oficial.
                </p>

                {/* Link Box */}
                <div className="bg-[#002D5E]/5 border border-[#002D5E]/10 rounded-2xl p-3 mb-5 text-left">
                  <p className="text-[10px] font-bold text-[#002D5E] uppercase tracking-wider mb-1">Endereço do Atalho:</p>
                  <div className="text-[11px] font-mono text-[#002D5E] bg-white border border-slate-100 rounded-lg p-2 break-all select-all selection:bg-blue-100">
                    https://fabiozeronunes-remix-ipba-digital-a.vercel.app/
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowInstallGuidance(false);
                      // Trigger notifications permission request modal right after
                      setTimeout(() => {
                        setShowSoftNotifPrompt(true);
                      }, 600);
                    }}
                    className="flex-1 py-3.5 border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors text-xs font-bold rounded-full cursor-pointer"
                  >
                    Agora Não
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      deferredPrompt.prompt();
                      deferredPrompt.userChoice.then((choiceResult: any) => {
                        console.log("[PWA] User choice outcome:", choiceResult.outcome);
                        setDeferredPrompt(null);
                        setShowInstallGuidance(false);
                        // Trigger notifications permission request modal right after choice
                        setTimeout(() => {
                          setShowSoftNotifPrompt(true);
                        }, 800);
                      });
                    }}
                    className="flex-grow-[1.5] py-3.5 bg-[#002D5E] hover:bg-[#002D5E]/90 text-white transition-all text-xs font-extrabold rounded-full shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    Criar Atalho
                  </button>
                </div>
              </div>
            ) : (
              /* Manual Guidance Fallback Section */
              <div className="w-full mt-2">
                <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                  Para garantir que o portal abra sempre no ambiente do seu navegador e não em modo display standalone, adicione um atalho simples. Ele abrirá o portal direto no browser de internet sem ocupar a memória do celular.
                </p>

                {/* Platform Switcher Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                  <button
                    type="button"
                    onClick={() => setInstallPlatform('android')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      installPlatform === 'android'
                        ? 'bg-white text-[#002D5E] shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Android / Chrome
                  </button>
                  <button
                    type="button"
                    onClick={() => setInstallPlatform('ios')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      installPlatform === 'ios'
                        ? 'bg-white text-[#002D5E] shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    iOS / Safari
                  </button>
                </div>

                {/* Link Box */}
                <div className="bg-[#002D5E]/5 border border-[#002D5E]/10 rounded-2xl p-3 mb-4 text-left">
                  <p className="text-[10px] font-bold text-[#002D5E] uppercase tracking-wider mb-1">Endereço do Portal:</p>
                  <div className="text-[11px] font-mono text-[#002D5E] bg-white border border-slate-100 rounded-lg p-2 break-all select-all selection:bg-blue-100">
                    https://fabiozeronunes-remix-ipba-digital-a.vercel.app/
                  </div>
                </div>

                {/* Instructions List */}
                <div className="space-y-4 mb-5 text-left text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
                  {installPlatform === 'android' ? (
                    <>
                      <div className="flex gap-3 items-start">
                        <span className="w-5 h-5 rounded-full bg-[#002D5E]/10 text-[#002D5E] flex items-center justify-center font-black text-xs shrink-0 mt-0.5">1</span>
                        <p className="text-slate-600 leading-relaxed">
                          Toque no ícone de <strong>três pontos (⋮)</strong> no canto superior direito do seu navegador Chrome.
                        </p>
                      </div>
                      <div className="flex gap-3 items-start">
                        <span className="w-5 h-5 rounded-full bg-[#002D5E]/10 text-[#002D5E] flex items-center justify-center font-black text-xs shrink-0 mt-0.5">2</span>
                        <p className="text-slate-600 leading-relaxed">
                          Selecione a opção <strong>"Adicionar à tela de início"</strong> (ou <strong>"Adicionar à tela inicial"</strong>).
                        </p>
                      </div>
                      <div className="flex gap-3 items-start">
                        <span className="w-5 h-5 rounded-full bg-[#002D5E]/10 text-[#002D5E] flex items-center justify-center font-black text-xs shrink-0 mt-0.5">3</span>
                        <p className="text-slate-600 leading-relaxed">
                          Toque em <strong>"Adicionar"</strong>. Pronto! O atalho foi criado na tela principal e abrirá sempre no navegador.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex gap-3 items-start">
                        <span className="w-5 h-5 rounded-full bg-[#002D5E]/10 text-[#002D5E] flex items-center justify-center font-black text-xs shrink-0 mt-0.5">1</span>
                        <p className="text-slate-600 leading-relaxed">
                          Toque no botão de <strong>Compartilhar</strong> (ícone de um quadrado com uma seta para cima <span className="inline-block px-1 border border-slate-200 rounded text-[10px] bg-white font-mono">↑</span>) localizado na barra inferior do Safari.
                        </p>
                      </div>
                      <div className="flex gap-3 items-start">
                        <span className="w-5 h-5 rounded-full bg-[#002D5E]/10 text-[#002D5E] flex items-center justify-center font-black text-xs shrink-0 mt-0.5">2</span>
                        <p className="text-slate-600 leading-relaxed">
                          Role a lista de opções para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>.
                        </p>
                      </div>
                      <div className="flex gap-3 items-start">
                        <span className="w-5 h-5 rounded-full bg-[#002D5E]/10 text-[#002D5E] flex items-center justify-center font-black text-xs shrink-0 mt-0.5">3</span>
                        <p className="text-slate-600 leading-relaxed">
                          Toque em <strong>"Adicionar"</strong> no canto superior direito para confirmar.
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (deferredPrompt) {
                      deferredPrompt.prompt();
                      deferredPrompt.userChoice.then((choiceResult: any) => {
                        console.log("[PWA] User choice outcome:", choiceResult.outcome);
                        setDeferredPrompt(null);
                        setShowInstallGuidance(false);
                        setTimeout(() => {
                          setShowSoftNotifPrompt(true);
                        }, 800);
                      });
                    } else {
                      setShowInstallGuidance(false);
                      // Ask notification permission visually!
                      setTimeout(() => {
                        setShowSoftNotifPrompt(true);
                      }, 600);
                    }
                  }}
                  className="w-full py-3.5 bg-[#002D5E] hover:bg-[#002D5E]/90 text-white font-extrabold text-xs uppercase tracking-widest transition-all rounded-full shadow-md active:scale-95 cursor-pointer"
                >
                  Entendi, Adicionar Atalho
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Scrollable navigation bar Component */}
      <BottomNav 
        currentTab={currentTab} 
        onNavigate={handleNavigate}
        userLogged={!!user}
        isAdmin={!!(user && (user.category?.includes('Pastor / Presbítero') || user.category?.includes('Coordenador / Admin')))}
        isVisitor={user?.category === 'Visitante'}
        tabNotifications={tabNotifications}
      />
    </div>
  );
}
