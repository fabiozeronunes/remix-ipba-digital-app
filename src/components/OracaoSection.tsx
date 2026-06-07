import React, { useState } from 'react';
import { 
  HeartHandshake, 
  Send, 
  Heart, 
  Globe, 
  ShieldCheck, 
  Sparkles, 
  PenTool,
  Trash2
} from 'lucide-react';
import { PrayerRequest } from '../types';

interface OracaoSectionProps {
  prayers: PrayerRequest[];
  onSubmitPrayer: (prayer: Omit<PrayerRequest, 'id' | 'timeAgo' | 'count' | 'userOred' | 'authorName' | 'avatarUrl'>) => void;
  onToggleOrei: (prayerId: string) => void;
  onDeletePrayer?: (prayerId: string) => void;
  onEditPrayer?: (prayerId: string, title: string, description: string) => void;
  onShowAlert: (msg: string) => void;
  currentUserName?: string;
  currentUserCategory?: string;
}

export const CATEGORIES = ['Família', 'Saúde', 'Espiritual', 'Finanças', 'Gratidão'] as const;

export default function OracaoSection({ 
  prayers, 
  onSubmitPrayer, 
  onToggleOrei, 
  onDeletePrayer,
  onEditPrayer,
  onShowAlert, 
  currentUserName = 'Membro',
  currentUserCategory
}: OracaoSectionProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<typeof CATEGORIES[number]>('Família');
  const [description, setDescription] = useState('');
  const [visibilidade, setVisibilidade] = useState<'Público' | 'Pastoral'>('Público');
  const [activeWallTab, setActiveWallTab] = useState<'all' | 'mine'>('all');

  // Inline editing states for prayer wall
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      onShowAlert("Preencha o título e os detalhes do seu pedido de oração.");
      return;
    }

    onSubmitPrayer({
      category,
      title: title.trim(),
      description: description.trim(),
      visibilidade
    });

    onShowAlert(`Pedido de oração "${title}" enviado para o Mural ${visibilidade === 'Pastoral' ? 'Pastoral Restrito' : 'Público'}!`);
    setTitle('');
    setDescription('');
    setVisibilidade('Público');
  };

  return (
    <div className="space-y-10 animate-fade-in pb-12">
      {/* Inspirational Quote Header Block */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#002d5e] to-[#001939] p-8 text-white shadow-lg space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-white leading-tight">
          Em que podemos orar por você?
        </h2>
        <div className="h-1 w-12 bg-[#a9c7ff] rounded-full" />
        <blockquote className="text-sm italic opacity-90 leading-relaxed pr-2">
          "Não andeis ansiosos por coisa alguma; antes em tudo sejam os vossos pedidos conhecidos diante de Deus pela oração e súplica com ações de graças."
          <cite className="block mt-2 font-black text-xs not-italic text-[#d6e3ff] uppercase tracking-wider">
            — Filipenses 4:6
          </cite>
        </blockquote>
        
        {/* Visual Blur Decor */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-12 -mt-12 blur-2xl" />
      </section>

      {/* Post Prayer Request Form */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 ml-1">
          <PenTool className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-primary">Novo Pedido</h3>
        </div>

        <form 
          onSubmit={handleSubmit} 
          className="bg-surface-container-lowest p-6 rounded-xl space-y-6 shadow-sm border border-slate-100"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Título do Pedido */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-primary uppercase tracking-wider block">
                Título do Pedido
              </label>
              <input 
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary placeholder:text-slate-400 text-[#191c1d]" 
                placeholder="Ex: Saúde da Família" 
                type="text"
              />
            </div>

            {/* Categoria */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-primary uppercase tracking-wider block">
                Categoria
              </label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value as typeof CATEGORIES[number])}
                className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary text-[#191c1d]"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Descrição em detalhes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-primary uppercase tracking-wider block">
              Seu Pedido
            </label>
            <textarea 
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary placeholder:text-slate-400 text-[#191c1d]" 
              placeholder="Descreva seu pedido com detalhes para que possamos interceder..."
            />
          </div>

          {/* Visibilidade toggle selection */}
          <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-[#f3f4f5] rounded-xl gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#001939]/5 rounded-full flex items-center justify-center shrink-0">
                {visibilidade === 'Público' ? <Globe className="w-5 h-5 text-primary" /> : <ShieldCheck className="w-5 h-5 text-primary" />}
              </div>
              <div>
                <p className="font-bold text-xs text-primary leading-none">Visibilidade do Pedido</p>
                <p className="text-[10px] text-slate-500 mt-1">Quem pode ver e interceder por você?</p>
              </div>
            </div>

            {/* Selector buttons */}
            <div className="flex bg-[#e7e8e9] p-1 rounded-full border border-slate-200 self-start md:self-auto select-none">
              <button 
                type="button" 
                onClick={() => setVisibilidade('Público')}
                className={`px-5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  visibilidade === 'Público' 
                    ? 'bg-[#002d5e] text-white shadow-sm' 
                    : 'text-slate-600 hover:text-[#002d5e]'
                }`}
              >
                Público
              </button>
              <button 
                type="button" 
                onClick={() => setVisibilidade('Pastoral')}
                className={`px-5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  visibilidade === 'Pastoral' 
                    ? 'bg-[#002d5e] text-white shadow-sm' 
                    : 'text-slate-600 hover:text-[#002d5e]'
                }`}
              >
                Pastoral
              </button>
            </div>
          </div>

          {/* CTA Submit Button */}
          <button 
            type="submit" 
            className="w-full bg-[#002d5e] hover:bg-[#002d5e]/90 text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer pt-3 pb-3"
          >
            <Send className="w-4 h-4" />
            <span>Enviar Pedido de Oração</span>
          </button>
        </form>
      </section>

      {/* Mural de Intercessão list of prayer requests */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 ml-1">
            <HeartHandshake className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-primary">Mural de Intercessão</h3>
          </div>
          
          {/* Segmented Filter Tab Selection */}
          <div className="flex bg-[#f3f4f5] p-1 rounded-full border border-slate-200 select-none">
            <button 
              type="button" 
              onClick={() => setActiveWallTab('all')}
              className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeWallTab === 'all' 
                  ? 'bg-[#002d5e] text-white shadow-sm' 
                  : 'text-slate-600 hover:text-[#002d5e]'
              }`}
            >
              Todos ({prayers.filter(p => {
                const isLeader = !!(currentUserCategory && (
                  currentUserCategory.includes('Pastor') || 
                  currentUserCategory.includes('Presbítero') || 
                  currentUserCategory.includes('Admin') || 
                  currentUserCategory.includes('Coordenador')
                ));
                const isMine = p.authorName?.trim().toLowerCase() === currentUserName?.trim().toLowerCase();
                const isApproved = p.aprovado !== false;

                // Hidden if not approved and not mine and not leader
                if (!isApproved && !isMine && !isLeader) return false;

                if (p.visibilidade === 'Pastoral') {
                  return isMine || isLeader;
                }
                return true;
              }).length})
            </button>
            <button 
              type="button" 
              onClick={() => setActiveWallTab('mine')}
              className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeWallTab === 'mine' 
                  ? 'bg-[#002d5e] text-white shadow-sm' 
                  : 'text-slate-600 hover:text-[#002d5e]'
              }`}
            >
              Meus Pedidos ({prayers.filter(p => p.authorName?.trim().toLowerCase() === currentUserName?.trim().toLowerCase()).length})
            </button>
          </div>
        </div>

        {/* Filter prayers based on selected tab and user category */}
        {(() => {
          const isLeader = !!(currentUserCategory && (
            currentUserCategory.includes('Pastor') || 
            currentUserCategory.includes('Presbítero') || 
            currentUserCategory.includes('Admin') || 
            currentUserCategory.includes('Coordenador')
          ));

          const filteredPrayers = prayers.filter(p => {
            const isMine = p.authorName?.trim().toLowerCase() === currentUserName?.trim().toLowerCase();
            const isApproved = p.aprovado !== false;

            // Hidden if not approved and not mine and not leader
            if (!isApproved && !isMine && !isLeader) {
              return false;
            }
            
            if (activeWallTab === 'mine') {
              return isMine;
            }
            
            // Tab 'all'
            if (p.visibilidade === 'Pastoral') {
              return isMine || isLeader;
            }
            
            return true;
          });

          if (filteredPrayers.length === 0) {
            return (
              <div className="bg-[#f3f4f5] rounded-2xl p-8 text-center border-2 border-dashed border-slate-200">
                <p className="text-sm text-slate-500 font-extrabold">Nenhum pedido de oração encontrado nesta aba.</p>
                {activeWallTab === 'mine' && (
                  <p className="text-xs text-slate-400 mt-1 font-semibold">Preencha o formulário acima para registrar seu pedido de intercessão.</p>
                )}
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredPrayers.map((prayer) => {
                const isMine = prayer.authorName?.trim().toLowerCase() === currentUserName?.trim().toLowerCase();
                const isEditing = editingId === prayer.id;

                return (
                  <div 
                    key={prayer.id} 
                    className={`bg-surface-container-lowest p-6 rounded-xl border-t border-slate-100 flex flex-col justify-between shadow-sm relative group hover:shadow-md transition-all ${
                      prayer.category === 'Gratidão' 
                        ? 'border-l-4 border-[#d0825a]' 
                        : 'border-l-4 border-primary'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                            prayer.category === 'Gratidão' 
                              ? 'bg-[#ffdbcb] text-[#713615]' 
                              : 'bg-primary-fixed text-[#001b3d]'
                          }`}>
                            {prayer.category}
                          </span>
                          {prayer.visibilidade === 'Pastoral' && (
                            <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full text-[8.5px] font-extrabold uppercase tracking-wider">
                              Confidencial
                            </span>
                          )}
                          {prayer.aprovado === false && (
                            <span className="bg-amber-100 text-amber-850 border border-amber-200 px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider animate-pulse">
                              ⏳ Pendente de Aprovação
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-slate-500 italic uppercase tracking-tighter shrink-0 font-bold">
                            {prayer.timeAgo}
                          </span>
                          
                          {/* Inner edit button */}
                          {isMine && !isEditing && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(prayer.id);
                                setEditTitle(prayer.title);
                                setEditDesc(prayer.description);
                              }}
                              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 p-1 rounded-full transition-colors cursor-pointer shrink-0"
                              title="Editar pedido"
                            >
                              <PenTool className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Inner delete button */}
                          {(isMine || isLeader) && onDeletePrayer && (
                            <button
                              type="button"
                              onClick={() => {
                                onDeletePrayer(prayer.id);
                                onShowAlert("Pedido de oração removido.");
                              }}
                              className="bg-red-50 hover:bg-red-100 text-red-600 p-1 rounded-full transition-colors cursor-pointer shrink-0"
                              title="Remover pedido"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="space-y-3 pb-4">
                          <div className="space-y-1">
                            <label className="text-[9.5px] font-black text-primary uppercase tracking-wider block">Título do Pedido</label>
                            <input 
                              type="text" 
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full bg-[#f3f4f5] border-none rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:ring-1 focus:ring-primary text-[#191c1d]"
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[9.5px] font-black text-primary uppercase tracking-wider block">Detalhes do Pedido</label>
                            <textarea 
                              value={editDesc}
                              onChange={(e) => setEditDesc(e.target.value)}
                              rows={3}
                              className="w-full bg-[#f3f4f5] border-none rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:ring-1 focus:ring-primary text-[#191c1d]"
                            />
                          </div>

                          <div className="flex justify-end gap-2 text-xs select-none pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold uppercase rounded-lg cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!editTitle.trim() || !editDesc.trim()) {
                                  onShowAlert("Preencha todos os campos para salvar.");
                                  return;
                                }
                                if (onEditPrayer) {
                                  onEditPrayer(prayer.id, editTitle.trim(), editDesc.trim());
                                  onShowAlert("Pedido de oração atualizado localmente.");
                                }
                                setEditingId(null);
                              }}
                              className="px-3.5 py-1.5 bg-[#002d5e] hover:bg-[#002d5e]/90 text-white text-[10px] font-bold uppercase rounded-lg cursor-pointer"
                            >
                              Salvar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-[#191c1d] font-bold text-base mb-1 leading-tight group-hover:text-primary">
                            {prayer.title}
                          </p>
                          <p className="text-slate-605 text-sm leading-relaxed mb-6 font-semibold">
                            {prayer.description}
                          </p>
                        </>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        {/* Participant intercessors round stack avatars */}
                        <div className="flex items-center gap-2">
                          <img 
                            src={prayer.avatarUrl} 
                            alt={prayer.authorName} 
                            className="w-6 h-6 rounded-full object-cover border border-white"
                            title={`Autor: ${prayer.authorName}`}
                          />
                          <span className="text-[10px] font-extrabold text-slate-500">
                              {isMine ? "Você" : prayer.authorName}
                          </span>
                        </div>

                        {/* "Eu Orei" Toggle Action */}
                        <button 
                          onClick={() => {
                            onToggleOrei(prayer.id);
                            onShowAlert(prayer.userOred ? "Removido apoio de oração." : "Abençoado! Você intercedeu por este irmão.");
                          }}
                          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            prayer.userOred 
                              ? 'bg-rose-50 text-rose-600 border-rose-200' 
                              : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          <Heart className={`w-3 h-3 transition-transform ${
                            prayer.userOred ? 'fill-rose-600 text-rose-600 scale-110' : 'text-slate-500 group-hover:scale-105'
                          }`} />
                          <span>{prayer.userOred ? `Orei (${prayer.count})` : `Apoiar (${prayer.count})`}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </section>
    </div>
  );
}
