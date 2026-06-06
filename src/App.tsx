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

import { auth, db, handleFirestoreError, OperationType, getUserDocId } from './firebase';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  writeBatch,
  getDocs
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
    if (currentUserSession) {
      return saved && saved !== 'login' ? saved : 'home';
    }
    return 'login';
  });
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
  const [dbUsers, setDbUsers] = useState<User[]>([]);
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [studies, setStudies] = useState<ChurchStudy[]>([]);
  const [radioPrograms, setRadioPrograms] = useState<RadioProgram[]>([]);
  const [transmissions, setTransmissions] = useState<any[]>([]);
  const [cargos, setCargos] = useState<string[]>([]);
  const [showSoftNotifPrompt, setShowSoftNotifPrompt] = useState(false);

  useEffect(() => {
    // Detecção robusta de PWA / Modo Standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone || document.referrer.includes('android-app://');
    
    // Debug logs para o console
    console.log("[Notificações] Modo Standalone detectado:", isStandalone);
    console.log("[Notificações] Estado atual da permissão:", 'Notification' in window ? Notification.permission : 'Não suportado');
    
    const hasDismissed = localStorage.getItem('church_soft_prompt_dismissed');
    
    // Se estiver no modo standalone, damos prioridade máxima ao banner se a permissão for default
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        // No modo app instalado, se ele nunca aceitou, sempre mostramos o banner (ignoramos descarte do navegador)
        const shouldShow = isStandalone ? true : !hasDismissed;
        
        if (shouldShow) {
          console.log("[Notificações] Agendando exibição do banner estratégico...");
          const timer = setTimeout(() => {
            console.log("[Notificações] Mostrando banner agora!");
            setShowSoftNotifPrompt(true);
          }, 3000);
          return () => clearTimeout(timer);
        }
      }
    }
  }, []);

  const handleNativePermissionRequest = async () => {
    if (!('Notification' in window)) return;
    
    try {
      const permission = await Notification.requestPermission();
      console.log('Permission result:', permission);
      setShowSoftNotifPrompt(false);
      localStorage.setItem('church_soft_prompt_dismissed', 'true');
      
      if (permission === 'granted') {
        setToast("✅ Notificações ativadas com sucesso!");
      } else {
        setToast("⚠️ Notificações não ativadas.");
      }
    } catch (err) {
      console.error('Erro ao pedir permissão:', err);
      setShowSoftNotifPrompt(false);
    }
  };

  const handleDismissSoftPrompt = () => {
    setShowSoftNotifPrompt(false);
    localStorage.setItem('church_soft_prompt_dismissed', 'true');
  };

  const [isAuthReady, setIsAuthReady] = useState(false);
  const userRef = useRef<User | null>(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Background Firebase anonymous login to ensure all queries succeed if not signed in with Google
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (!fbUser) {
        signInAnonymously(auth)
          .then(() => {
            setIsAuthReady(true);
          })
          .catch((err) => {
            console.warn("Anonymous sign-in failed (might be disabled, continuing anyway):", err);
            setIsAuthReady(true);
          });
      } else {
        setIsAuthReady(true);
      }
    });
    return () => unsubscribe();
  }, []);

  const addAppNotification = (type: string, title: string, subtitle: string, targetTab: any) => {
    // 1. Trigger the Top Toast (Phone Push UI)
    triggerPhoneNotification(type as any, title, subtitle);
    
    // 2. Add to history list
    const newNotif: AppNotification = {
      id: `nt-${type}-${Date.now()}`,
      title: title,
      text: subtitle,
      time: 'Agora mesmo',
      unread: true,
      type: targetTab
    };
    
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Sync Prayers
  useEffect(() => {
    if (!isAuthReady) return;
    let isInitialRun = true;
    const unsubscribe = onSnapshot(collection(db, 'prayers'), (snapshot) => {
      const list: PrayerRequest[] = [];
      snapshot.forEach((snapDoc) => {
        if (snapDoc.id !== 'system_seeded_state') {
          list.push({ id: snapDoc.id, ...snapDoc.data() } as PrayerRequest);
        }
      });

      // Realtime prayer notifications
      if (!isInitialRun) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' && change.doc.id !== 'system_seeded_state') {
            const data = change.doc.data() as PrayerRequest;
            const currentUser = userRef.current;
            if (currentUser && data.authorEmail?.toLowerCase() === currentUser.email?.toLowerCase()) return;
            
            if (data.aprovado) {
              addAppNotification('prayer', '🙏 Novo Pedido de Oração!', `Interceda pelo pedido: "${data.title}".`, 'oracao');
            }
          }
        });
      }

      isInitialRun = false;
      setPrayers(list);
    }, (error) => {
      console.warn("Firestore Prayers fetch failed:", error);
    });
    return () => unsubscribe();
  }, [isAuthReady]);

  // Sync Cells
  useEffect(() => {
    if (!isAuthReady) return;
    let isInitialRun = true;
    const unsubscribe = onSnapshot(collection(db, 'cells'), (snapshot) => {
      const list: Cell[] = [];
      snapshot.forEach((snapDoc) => {
        if (snapDoc.id !== 'system_seeded_state') {
          list.push({ id: snapDoc.id, ...snapDoc.data() } as Cell);
        }
      });

      // Realtime cell notifications
      if (!isInitialRun) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' && change.doc.id !== 'system_seeded_state') {
            const data = change.doc.data() as Cell;
            addAppNotification('cell', '🏘️ Nova Célula Cadastrada!', `Reunião da Célula "${data.title}" foi criada.`, 'celulas');
          }
        });
      }

      isInitialRun = false;
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

  // Sync Events
  useEffect(() => {
    if (!isAuthReady) return;
    let isInitialRun = true;
    const unsubscribe = onSnapshot(collection(db, 'events'), (snapshot) => {
      const list: ChurchEvent[] = [];
      snapshot.forEach((snapDoc) => {
        if (snapDoc.id !== 'system_seeded_state') {
          const data = snapDoc.data() as ChurchEvent;
          list.push({ 
            id: snapDoc.id, 
            ...data,
            confirmedUsers: data.confirmedUsers || []
          } as ChurchEvent);
        }
      });

      // Realtime notification detection logic based on docChanges
      if (!isInitialRun) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' && change.doc.id !== 'system_seeded_state') {
            const data = change.doc.data() as ChurchEvent;
            addAppNotification('event', '📅 Novo Evento!', `Não perca: "${data.title}" foi agendado.`, 'eventos');
          }
        });
      }

      isInitialRun = false;
      setEvents(list);
    }, (error) => {
      console.warn("Firestore Events fetch failed:", error);
    });
    return () => unsubscribe();
  }, [isAuthReady]);

  // Sync Studies
  useEffect(() => {
    if (!isAuthReady) return;
    let isInitialRun = true;
    const unsubscribe = onSnapshot(collection(db, 'studies'), (snapshot) => {
      const list: ChurchStudy[] = [];
      snapshot.forEach((snapDoc) => {
        if (snapDoc.id !== 'system_seeded_state') {
          list.push({ id: snapDoc.id, ...snapDoc.data() } as ChurchStudy);
        }
      });

      // Realtime study notifications
      if (!isInitialRun) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' && change.doc.id !== 'system_seeded_state') {
            const data = change.doc.data() as ChurchStudy;
            addAppNotification('study' as any, '📖 Novo Estudo Publicado!', `Confira o novo estudo: "${data.title}"`, 'estudos');
          }
        });
      }

      isInitialRun = false;
      setStudies(list);
    }, (error) => {
      console.warn("Firestore Studies fetch failed:", error);
    });
    return () => unsubscribe();
  }, [isAuthReady]);

  // Sync Radio Programs
  useEffect(() => {
    if (!isAuthReady) return;
    const unsubscribe = onSnapshot(collection(db, 'radioPrograms'), (snapshot) => {
      const list: RadioProgram[] = [];
      snapshot.forEach((snapDoc) => {
        if (snapDoc.id !== 'system_seeded_state') {
          list.push({ id: snapDoc.id, ...snapDoc.data() } as RadioProgram);
        }
      });
      setRadioPrograms(list);
    }, (error) => {
      console.warn("Firestore Radio Programs fetch failed:", error);
    });
    return () => unsubscribe();
  }, [isAuthReady]);

  // Sync Transmissions
  useEffect(() => {
    if (!isAuthReady) return;
    let isInitialRun = true;
    const unsubscribe = onSnapshot(collection(db, 'transmissions'), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((snapDoc) => {
        list.push({ id: snapDoc.id, ...snapDoc.data() });
      });

      // Realtime transmission/live notifications
      if (!isInitialRun) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' && change.doc.id !== 'system_seeded_state') {
            const data = change.doc.data();
            addAppNotification('live', '📡 Nova Transmissão Agendada!', `Título: "${data.title}"`, 'aovivo');
          }
        });
      }

      isInitialRun = false;
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

  // Sync Users from Firestore
  useEffect(() => {
    if (!isAuthReady) return;
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      if (snapshot.empty) {
        const batch = writeBatch(db);
        
        const defaultUsers: User[] = [
          {
            name: 'Ricardo Lima',
            category: 'Membro Comungante',
            avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCAw9f0m9zhnseECjh851sbC_y6zLT72KxZLFVCXdRwDIWH1CC-47FIiUxUXqTuB95Spni3XDvS7u1c-glbKjtQ2aiQke9uLjXjx-PV80NSNENNsu_daFFwxaV4mbyOOaA9-ScMxItwTnqLmvpGA-Dd2xJWBIz5zJZspCQG6fQDPZ6kwo3E_MeyjhrwVP4B2tYvr6V3HBeiGN899eENqjHE6bBz6N_K14zK1XoogBk6NAT1WsQyx2fJXpIuYiRJK92dLfb6Zkrbf9c',
            planCount: 12,
            prayerCount: 5,
            eventCount: 3,
            email: 'ricardo.lima@email.com',
            phone: '(11) 98765-4321',
            birthDate: '1990-04-15',
            address: 'Alameda Lorena, 880 - Jardins, São Paulo',
            ministry: 'Som & Mídia',
            password: '123',
            status: 'Ativo'
          },
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
              fbList.push(u);
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
      // Local App Toast/Popup
      setPhoneNotification(null);
      setTimeout(() => {
        setPhoneNotification({
          id: `phone-notif-${Date.now()}`,
          type,
          title,
          subtitle
        });
      }, 100);

      // Auto-dismiss notification after 8 seconds
      setTimeout(() => {
        setPhoneNotification(prev => prev && prev.title === title ? null : prev);
      }, 8000);

      // System Native Notification via Service Worker
      if ('serviceWorker' in navigator && Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(title, {
            body: subtitle,
            icon: '/icon-512.png',
            badge: '/icon-512.png',
            tag: type,
            data: window.location.origin
          });
        });
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
  };

  const handleLoginSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    localStorage.setItem('church_current_user', JSON.stringify(authenticatedUser));
    setCurrentTab('home');
    localStorage.setItem('church_active_tab', 'home');
  };

  const handleAdminLogin = async () => {
    const adminEmail = 'fabiozeronunes@gmail.com';
    let adminUser = dbUsers.find(u => u.email?.trim().toLowerCase() === adminEmail);
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
        status: 'Ativo'
      };
      
      const docId = getUserDocId(adminEmail);
      await setDoc(doc(db, 'users', docId), adminUser);
    } else {
      adminUser.name = 'Fabio Nunes';
      adminUser.category = 'Coordenador / Admin ( Total )';
      const docId = getUserDocId(adminEmail);
      await setDoc(doc(db, 'users', docId), adminUser, { merge: true });
    }
    
    handleLoginSuccess(adminUser);
    showAlert('Seja bem-vindo de volta, Fabio Nunes! Sessão de administrador iniciada.');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('church_current_user');
    setCurrentTab('home');
    localStorage.setItem('church_active_tab', 'home');
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
        .catch(err => console.error("Error updating user in Firestore:", err));
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
    try {
      await setDoc(doc(db, 'events', id), freshEvent);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `events/${id}`);
    }
    
    // Trigger smartphone notification!
    triggerPhoneNotification('event', '📅 Novo Evento Cadastrado!', `Não perca: "${newEvent.title}" foi agendado.`);

    // Add system notification for members
    setNotifications(prev => [
      {
        id: `nt-ev-${Date.now()}`,
        title: 'Nova Atividade Publicada',
        text: `Foi cadastrada uma nova atividade: "${newEvent.title}". Visualize na aba Eventos!`,
        time: 'Agora mesmo',
        unread: true,
        type: 'eventos'
      },
      ...prev
    ]);
  };

  const handleDeleteEventAndPublish = async (id: string) => {
    console.log("Attempting to delete event:", id);
    // Optimistic UI update: filter out the deleted event immediately so it vanishes instantly
    setEvents((prev) => prev.filter((ev) => ev.id !== id));
    try {
      await deleteDoc(doc(db, 'events', id));
      console.log("Successfully deleted event from Firestore:", id);
    } catch (error) {
      console.error("Error deleting event:", error);
      handleFirestoreError(error, OperationType.DELETE, `events/${id}`);
    }
  };

  const handleUpdateEventAndPublish = async (updatedEvent: ChurchEvent) => {
    try {
      await setDoc(doc(db, 'events', updatedEvent.id), {
        ...updatedEvent,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `events/${updatedEvent.id}`);
    }

    // Trigger smartphone notification!
    triggerPhoneNotification('event', '📅 Evento Atualizado!', `Atenção: o evento "${updatedEvent.title}" foi atualizado.`);

    // Add system notification for members
    setNotifications(prev => [
      {
        id: `nt-ev-upd-${Date.now()}`,
        title: 'Atividade Atualizada',
        text: `As informações da atividade "${updatedEvent.title}" foram atualizadas.`,
        time: 'Agora mesmo',
        unread: true,
        type: 'eventos'
      },
      ...prev
    ]);
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
    setNotifications(prev => [
      {
        id: `nt-rad-${Date.now()}`,
        title: '📻 Novo Programa na Rádio IPBA',
        text: `O programa "${freshPrg.title}" (${freshPrg.scheduledTime || 'Programação Agendada'}) já está disponível para ouvir na rádio da igreja!`,
        time: 'Agora mesmo',
        unread: true,
        type: 'home'
      },
      ...prev
    ]);
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
    setNotifications([]);
    showAlert("Histórico de notificações limpo.");
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    showAlert("Todas lidas!");
  };

  return (
    <>
      <div className="min-h-screen bg-surface font-sans text-on-surface flex flex-col relative pb-24">
      
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
        <div className="fixed bottom-24 md:top-28 left-1/2 -translate-x-1/2 w-[94%] max-w-md bg-white rounded-3xl shadow-[0_-20px_60px_rgba(16,185,129,0.35)] md:shadow-[0_20px_50px_rgba(16,185,129,0.3)] border-2 border-emerald-100 p-6 z-[9998] animate-banner-slide-in ring-8 ring-emerald-500/10">
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0 shadow-inner border border-emerald-100">
              <Smartphone className="w-7 h-7 text-emerald-600 animate-bounce" />
            </div>
            <div className="flex-grow space-y-1.5">
              <h3 className="text-base font-extrabold text-[#191c1d] tracking-tight">Instalar App IPBA?</h3>
              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                Adicione o app à sua tela inicial para acesso rápido, transmissões estáveis e notificações em tempo real.
              </p>
              <div className="flex gap-3 pt-3">
                <button 
                  onClick={() => {
                    setShowSoftInstallPrompt(false);
                    handleInstallClick();
                  }}
                  className="bg-emerald-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 cursor-pointer active:scale-95"
                >
                  Instalar Agora
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
        <div className="fixed bottom-24 md:top-28 left-1/2 -translate-x-1/2 w-[94%] max-w-md bg-white rounded-3xl shadow-[0_-20px_60px_rgba(79,70,229,0.35)] md:shadow-[0_20px_50px_rgba(79,70,229,0.3)] border-2 border-indigo-100 p-6 z-[9999] animate-banner-slide-in ring-8 ring-indigo-500/10">
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0 shadow-inner border border-indigo-100">
              <Bell className="w-7 h-7 text-indigo-600 animate-bounce-slow" />
            </div>
            <div className="flex-grow space-y-1.5">
              <h3 className="text-base font-extrabold text-[#191c1d] tracking-tight">Ativar Notificações no App?</h3>
              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                Agora que você instalou a IPB Digital, ative os avisos para não perder cultos ao vivo e intercessões da igreja.
              </p>
              <div className="flex gap-3 pt-3">
                <button 
                  onClick={handleNativePermissionRequest}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 cursor-pointer active:scale-95"
                >
                  Sim, Ativar
                </button>
                <button 
                  onClick={handleDismissSoftPrompt}
                  className="text-slate-400 px-4 py-3 text-[10px] font-bold uppercase tracking-widest hover:text-slate-600 cursor-pointer"
                >
                  Agora não
                </button>
              </div>
            </div>
            <button 
              onClick={handleDismissSoftPrompt}
              className="text-slate-300 hover:text-slate-500 transition-colors p-1 -mt-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Main Single-Screen Render Router Canvas */}
      <main className="pt-24 px-6 max-w-lg mx-auto w-full flex-grow relative">
        
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
              onSaveAllPrayers={(updatedList) => setPrayers(updatedList)}
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
            transform: translate(-50%, 40px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        @media (min-width: 768px) {
          @keyframes bannerSlideIn {
            from {
              opacity: 0;
              transform: translate(-50%, -40px);
            }
            to {
              opacity: 1;
              transform: translate(-50%, 0);
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
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-md p-1.5 border border-white/20">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuADYMPvZcaOSpHUoz7xjXH4_NJcY25qztiFideOgHchUZKhDCIoAyq_MGHgParQMmKcwudjYsYMEG0TCr3XaZvoDPdwhgOP69aaiYWcXIUEoQX0Ra1DCbFOr3bTIMz7JLCMI4XJDTJ0bjECIZfhV06N7LfW5TN63vQqhOogP521OSWtqiXBFJbV9vtNdePlGu6ecRVcuNbWfGIZugLjKYMuloDE98xQMY7_Vw6y7T4gzlmYr-7m3DQqOwEyMuaNC6tgBxOSbbR0jgY"
                className="w-full h-full object-contain rounded"
                alt="Logo IPB"
              />
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
              onClick={() => setShowInstallGuidance(false)}
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

            <h3 className="text-xl font-black text-[#002D5E] leading-tight">Instalar IPBA DIGITAL</h3>
            <p className="text-xs text-slate-605 mt-2 mb-5 leading-relaxed">
              Esta ação criará um **ícone de atalho diretamente na tela inicial do seu smartphone**, permitindo acessar o portal com apenas um toque para acesso rápido, transmissões integradas e notificações.
            </p>

            {deferredPrompt ? (
              /* Direct Install Option */
              <div className="w-full space-y-4">
                <div className="bg-[#00a63e]/10 border border-[#00a63e]/20 rounded-2xl p-4 text-left">
                  <div className="flex gap-2.5 items-start">
                    <div className="p-1.5 bg-[#00a63e] rounded-lg text-white">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#002D5E]">Instalação Imediata Disponível</p>
                      <p className="text-[11px] text-slate-650 leading-normal mt-0.5">
                        Seu smartphone ou navegador é perfeitamente compatível para instalar o aplicativo agora mesmo.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowInstallGuidance(false)}
                    className="flex-1 py-3 border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors text-xs font-bold rounded-full cursor-pointer"
                  >
                    Agora não
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      deferredPrompt.prompt();
                      deferredPrompt.userChoice.then((choiceResult: any) => {
                        setDeferredPrompt(null);
                        setShowInstallGuidance(false);
                      });
                    }}
                    className="flex-1 py-3 bg-[#00a63e] hover:bg-[#00a63e]/90 text-white transition-all text-xs font-bold rounded-full shadow-md active:scale-95 cursor-pointer"
                  >
                    Instalar
                  </button>
                </div>
              </div>
            ) : (
              /* Manual Guidance Option */
              <div className="w-full">
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

                {/* Instructions List */}
                <div className="space-y-3.5 mb-5 text-left text-xs bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  {installPlatform === 'android' ? (
                    <>
                      <div className="flex gap-3 items-start">
                        <span className="w-5 h-5 rounded-full bg-[#002D5E]/10 text-[#002D5E] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</span>
                        <p className="text-slate-600 leading-relaxed">
                          Toque no ícone de <strong>três pontos (⋮)</strong> no canto superior direito do seu navegador Chrome.
                        </p>
                      </div>
                      <div className="flex gap-3 items-start">
                        <span className="w-5 h-5 rounded-full bg-[#002D5E]/10 text-[#002D5E] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</span>
                        <p className="text-slate-600 leading-relaxed">
                          Selecione a opção <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex gap-3 items-start">
                        <span className="w-5 h-5 rounded-full bg-[#002D5E]/10 text-[#002D5E] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</span>
                        <p className="text-slate-600 leading-relaxed">
                          Toque no botão <strong>Compartilhar</strong> (ícone de um quadrado com uma seta para cima <span className="inline-block px-1 border border-slate-200 rounded text-[10px] bg-white">↑</span>) na barra de navegação.
                        </p>
                      </div>
                      <div className="flex gap-3 items-start">
                        <span className="w-5 h-5 rounded-full bg-[#002D5E]/10 text-[#002D5E] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</span>
                        <p className="text-slate-600 leading-relaxed">
                          Role as opções para baixo e selecione <strong>"Adicionar à Tela de Início"</strong>.
                        </p>
                      </div>
                      <div className="flex gap-3 items-start">
                        <span className="w-5 h-5 rounded-full bg-[#002D5E]/10 text-[#002D5E] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</span>
                        <p className="text-slate-600 leading-relaxed">
                          Toque em <strong>"Adicionar"</strong> no canto superior direito para finalizar.
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowInstallGuidance(false)}
                  className="w-full py-3.5 bg-[#5d9b9b] hover:bg-[#5d9b9b]/90 text-white font-extrabold text-xs uppercase tracking-widest transition-all rounded-full shadow-md active:scale-95 cursor-pointer"
                >
                  Entendi
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Scrollable navigation bar Component */}
    </div>
    <BottomNav 
        currentTab={currentTab} 
        onNavigate={handleNavigate}
        userLogged={!!user}
        isAdmin={!!(user && (user.category?.includes('Pastor / Presbítero') || user.category?.includes('Coordenador / Admin')))}
        isVisitor={user?.category === 'Visitante'}
        pendingCount={dbUsers.filter(u => u.status === 'Pendente').length}
      />
    </>
  );
}
