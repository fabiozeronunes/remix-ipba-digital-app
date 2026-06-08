import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, addDoc, setDoc, doc, query, orderBy, where, serverTimestamp } from 'firebase/firestore';
import { User, SupportOption, SupportTicket } from '../types';
import { LifeBuoy, Send, User as UserIcon, AlertCircle, CheckCircle2, ClipboardList, HelpCircle } from 'lucide-react';

interface SuporteSectionProps {
  user: User | null;
  onShowAlert: (msg: string) => void;
  isAuthReady?: boolean;
}

const DEFAULT_OPTIONS = [
  "Erro no Login",
  "Problema com Dízimo/Contribuição",
  "Não consigo acessar Estudos",
  "Erro ao marcar presença em Eventos",
  "Outro Problema de Sistema"
];

export default function SuporteSection({ user, onShowAlert, isAuthReady = true }: SuporteSectionProps) {
  const [nome, setNome] = useState(user ? user.name : '');
  const [selectedOption, setSelectedOption] = useState('');
  const [texto, setTexto] = useState('');
  const [options, setOptions] = useState<SupportOption[]>([]);
  const [sending, setSending] = useState(false);
  const [myTickets, setMyTickets] = useState<SupportTicket[]>([]);

  // Synchronize user name when user changes
  useEffect(() => {
    if (user) {
      setNome(user.name);
    }
  }, [user]);

  // Fetch support options from Firestore
  useEffect(() => {
    if (!isAuthReady) return;
    const unsub = onSnapshot(
      collection(db, 'supportOptions'),
      (snapshot) => {
        const fetched = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as SupportOption[];
        setOptions(fetched);

        if (fetched.length > 0 && !selectedOption) {
          setSelectedOption(fetched[0].name);
        } else if (fetched.length === 0 && !selectedOption) {
          setSelectedOption(DEFAULT_OPTIONS[0]);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'supportOptions');
      }
    );
    return unsub;
  }, [isAuthReady]);

  // Fetch recent tickets submitted by this user
  useEffect(() => {
    if (!isAuthReady) return;
    if (!user?.email) {
      setMyTickets([]);
      return;
    }

    const queryPath = 'supportTickets';
    const q = query(
      collection(db, queryPath),
      where('email', '==', user.email)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const fetched = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() })) as SupportTicket[];
        
        const sorted = fetched.sort((a,b) => b.createdAt.localeCompare(a.createdAt));
        setMyTickets(sorted);
      },
      (error) => {
        // If we get an error, it might be because the composite index is missing or permissions (though with where it should work)
        console.warn("Support tickets query error:", error);
        handleFirestoreError(error, OperationType.LIST, queryPath);
      }
    );
    return unsub;
  }, [user?.email, isAuthReady]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim()) {
      onShowAlert("Por favor, informe seu nome.");
      return;
    }
    const currentOpt = selectedOption || (options.length > 0 ? options[0].name : DEFAULT_OPTIONS[0]);
    if (!currentOpt) {
      onShowAlert("Por favor, selecione uma opção de assunto/erro.");
      return;
    }
    if (!texto.trim()) {
      onShowAlert("Por favor, descreva o problema no campo de texto.");
      return;
    }

    setSending(true);
    try {
      const payload: Omit<SupportTicket, 'id'> = {
        name: nome.trim(),
        email: user?.email || '',
        category: currentOpt,
        text: texto.trim(),
        createdAt: new Date().toISOString(),
        status: 'Pendente'
      };

      const payload = {
        name: nome.trim(),
        email: user?.email || '',
        category: currentOpt,
        text: texto.trim(),
        createdAt: new Date().toISOString(),
        status: 'Pendente'
      };

      console.log("[Support] Submitting ticket for:", user?.email);
      const docRef = await addDoc(collection(db, 'supportTickets'), payload);
      await setDoc(doc(db, 'supportTickets', docRef.id), { ...payload, id: docRef.id });
      onShowAlert("Chamado de suporte enviado com sucesso!");
      setTexto('');
    } catch (err: any) {
      console.error("[Support] Error creating support ticket: ", err, "Auth user:", auth.currentUser?.email);
      const errorMessage = err?.message || "Erro desconhecido";
      onShowAlert(`Erro ao enviar o chamado de suporte: ${errorMessage}. Verifique se você está logado.`);
    } finally {
      setSending(false);
    }
  };

  const activeOptions = options.length > 0 ? options.map(o => o.name) : DEFAULT_OPTIONS;

  return (
    <div id="suporte-section-container" className="pt-24 pb-32 px-4 md:px-8 max-w-4xl mx-auto space-y-8 animate-fade-in text-slate-800">
      
      {/* Visual Header Banner */}
      <div className="bg-gradient-to-r from-[#002D5E] to-slate-800 p-6 md:p-8 rounded-3xl text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
          <LifeBuoy className="w-64 h-64 rotate-12 text-white" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <LifeBuoy className="w-5 h-5 text-indigo-300 animate-spin-slow" />
              <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-indigo-200">Suporte ao Usuário</span>
            </div>
            <h1 className="text-xl md:text-3xl font-black uppercase tracking-tight font-sans">Central de Suporte</h1>
            <p className="text-xs text-slate-300 mt-1 max-w-lg font-semibold leading-relaxed">
              Encontrou algum erro ou precisa de auxílio? Envie uma mensagem para nossa equipe pastoral e técnica utilizando o formulário abaixo.
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-3 bg-white/10 p-3 rounded-2xl border border-white/10">
            <HelpCircle className="w-6 h-6 text-indigo-300" />
            <div className="text-left">
              <div className="text-[10px] font-extrabold text-slate-300 uppercase leading-none">Canal Direto</div>
              <div className="text-[11px] font-black tracking-tight text-white mt-0.5 leading-none">CONSELHO PRESBITERAL</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Support Request Form */}
        <div className="md:col-span-2 bg-white border border-slate-200/80 p-6 md:p-8 rounded-3xl shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
            <ClipboardList className="w-5 h-5 text-[#002D5E]" />
            <span className="font-extrabold text-[#002D5E] font-sans uppercase text-sm tracking-tight">Formulário de Abertura</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-slate-600">
            
            {/* Campo Nome */}
            <div className="space-y-1.5">
              <label htmlFor="user-support-name" className="block text-[10px] uppercase font-black text-slate-500">Seu Nome completo *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <UserIcon className="h-4 w-4 text-slate-400" />
                </span>
                <input
                  id="user-support-name"
                  type="text"
                  required
                  placeholder="Seu Nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-slate-50 focus:bg-white text-slate-800 font-bold transition-all text-sm"
                />
              </div>
            </div>

            {/* Menu Escolher Opções */}
            <div className="space-y-1.5">
              <label htmlFor="user-support-category" className="block text-[10px] uppercase font-black text-slate-500">Selecione o Tipo de Erro / Assunto *</label>
              <select
                id="user-support-category"
                value={selectedOption || (activeOptions[0] || '')}
                onChange={(e) => setSelectedOption(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-slate-50 focus:bg-white text-slate-800 font-bold transition-all text-sm decoration-clone"
              >
                {activeOptions.map((opt, i) => (
                  <option key={i} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Campo de Texto */}
            <div className="space-y-1.5">
              <label htmlFor="user-support-message" className="block text-[10px] uppercase font-black text-slate-500">Descreva detalhadamente o erro ou problema *</label>
              <textarea
                id="user-support-message"
                required
                rows={5}
                placeholder="Por favor, explique o que aconteceu. Se possível cite qual tela ou funcionalidade apresentou o erro..."
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-slate-50 focus:bg-white text-slate-850 font-medium tracking-tight transition-all text-sm"
              />
            </div>

            {/* Botão Enviar */}
            <button
              id="btn-submit-support"
              type="submit"
              disabled={sending}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3 cursor-pointer select-none text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md ${
                sending ? 'bg-slate-450 cursor-not-allowed opacity-80' : 'bg-[#002D5E] hover:bg-slate-800 hover:shadow-lg active:scale-98'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>{sending ? 'Sincronizando no Sistema...' : 'Enviar Chamado de Suporte'}</span>
            </button>
          </form>
        </div>

        {/* Support Sidebar Info / Recent Tickets */}
        <div className="space-y-4">
          
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 text-indigo-900 border-b border-indigo-50 pb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs uppercase font-black font-sans tracking-wider">Como Funciona?</h3>
            </div>
            <ul className="text-[10px] space-y-3 font-semibold text-slate-500 leading-relaxed list-none">
              <li className="flex gap-2">
                <span className="text-emerald-600">✔</span>
                <span>Seu chamado é arquivado com segurança na base de dados (Firestore) da Igreja.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-600">✔</span>
                <span>Os administradores recebem e analisam cada relatório pelo Painel Admin.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-600">✔</span>
                <span>Você pode sugerir novas categorias de erros ao Conselho caso necessário.</span>
              </li>
            </ul>
          </div>

          {/* User's recent tickets history (if logged in and has tickets) */}
          {user && (
            <div className="bg-white border border-slate-200 p-5 rounded-3xl space-y-3 shadow-xs">
              <div className="flex items-center justify-between text-slate-700 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4 text-slate-500" />
                  <h3 className="text-[10px] uppercase font-black font-sans tracking-wide">Meus Chamados</h3>
                </div>
                <span className="text-[10px] font-black font-sans px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{myTickets.length}</span>
              </div>

              {myTickets.length === 0 ? (
                <p className="text-[10px] text-slate-400 italic py-2 text-center">Você não enviou nenhum relatório recentemente.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                  {myTickets.map((ticket, i) => (
                    <div key={ticket.id || i} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-extrabold text-[10px] text-[#002D5E] truncate max-w-[120px]">{ticket.category}</span>
                        <span className={`text-[8px] font-black font-sans uppercase tracking-widest px-1.5 py-0.5 rounded-full ${
                          ticket.status === 'Resolvido' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {ticket.status || 'Pendente'}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-500 line-clamp-2 leading-snug">{ticket.text}</p>
                      <span className="text-[8px] text-slate-400 block text-right font-light">
                        {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
