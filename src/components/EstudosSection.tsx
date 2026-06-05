import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  Video, 
  FileText, 
  Calendar, 
  User, 
  ArrowLeft, 
  ExternalLink, 
  Share2,
  BookMarked,
  Download,
  Headphones,
  Tag,
  Eye,
  EyeOff
} from 'lucide-react';
import { ChurchStudy } from '../types';

interface EstudosSectionProps {
  onShowAlert: (msg: string) => void;
  studies: ChurchStudy[];
}

export default function EstudosSection({ onShowAlert, studies }: EstudosSectionProps) {
  const [activeStudyId, setActiveStudyId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Toggle states for viewing media details inside Study
  const [showAudio, setShowAudio] = useState(true);
  const [showVideo, setShowVideo] = useState(true);
  const [showAttachment, setShowAttachment] = useState(true);

  // Listen for navigation event
  useEffect(() => {
    const pending = localStorage.getItem('pending_estudos_tag');
    if (pending) {
      setSelectedTag(pending);
      setActiveStudyId(null);
      localStorage.removeItem('pending_estudos_tag');
    }

    const handleNavigate = (e: any) => {
      const tag = e.detail?.tag;
      if (tag) {
        setSelectedTag(tag);
        setActiveStudyId(null); // Reset study detail view
      }
    };
    window.addEventListener('navigate-to-estudos-tag', handleNavigate);
    return () => window.removeEventListener('navigate-to-estudos-tag', handleNavigate);
  }, []);

  // Auto Reset toggles to open state when active study changes
  useEffect(() => {
    setShowAudio(true);
    setShowVideo(true);
    setShowAttachment(true);
  }, [activeStudyId]);
  
  // Storage for favorited studies to make it feel more interactive and complete
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('church_study_favorites');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  const handleToggleFavorite = (id: string, name: string) => {
    let next: string[];
    if (favorites.includes(id)) {
      next = favorites.filter(f => f !== id);
      onShowAlert(`Estudo "${name}" removido dos favoritos.`);
    } else {
      next = [...favorites, id];
      onShowAlert(`Estudo "${name}" salvo nos favoritos.`);
    }
    setFavorites(next);
    localStorage.setItem('church_study_favorites', JSON.stringify(next));
  };

  const handleShareStudy = (study: ChurchStudy) => {
    const text = `📖 Estudo Bíblico: *${study.title}*\nEscrito por: ${study.authorName}\n\nConfira no aplicativo da Igreja Local!`;
    if (navigator.share) {
      navigator.share({
        title: study.title,
        text: text,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      onShowAlert("Estudo copiado para área de transferência!");
    }
  };

  const getYoutubeEmbedUrl = (url?: string) => {
    if (!url) return '';
    try {
      let videoId = '';
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      if (match && match[2].length === 11) {
        videoId = match[2];
      } else {
        const urlParts = url.split('/');
        const lastPart = urlParts[urlParts.length - 1];
        if (lastPart.length === 11) {
          videoId = lastPart;
        }
      }
      return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
    } catch (e) {
      return '';
    }
  };

  const filteredStudies = studies.filter(study => {
    const matchesSearch = 
      study.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      study.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      study.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!selectedTag) return matchesSearch;
    return matchesSearch && study.tags ? study.tags.includes(selectedTag) : false;
  });

  const allTags = Array.from(
    new Set(studies.flatMap(s => s.tags || []))
  );

  const selectedStudy = studies.find(s => s.id === activeStudyId);

  // If viewing details of a study
  if (selectedStudy) {
    const embedUrl = getYoutubeEmbedUrl(selectedStudy.videoUrl);
    const isFav = favorites.includes(selectedStudy.id);

    return (
      <div className="space-y-6 animate-fade-in pb-16">
        {/* Navigation Breadcrumb */}
        <button
          type="button"
          onClick={() => setActiveStudyId(null)}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-650 uppercase tracking-wider bg-slate-50 border border-slate-200/80 px-3.5 py-1.5 rounded-full cursor-pointer transition-colors max-w-max"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Estudos</span>
        </button>

        {/* Study Content Core Area */}
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xs overflow-hidden">
          {/* Header Cover Banner */}
          <div className="bg-gradient-to-r from-indigo-900 to-[#002D5E] p-6 text-white space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 bg-white/5 rounded-full shrink-0 -translate-y-8 translate-x-8 blur-lg select-none" />
            
            <div className="flex items-center gap-2">
              <span className="bg-indigo-600/60 uppercase text-[9px] tracking-widest px-2 py-0.5 rounded font-black border border-white/10 select-none">
                Estudos Bíblicos
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
              {selectedStudy.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-slate-300 text-xs">
              <div className="flex items-center gap-1.5 font-bold">
                <User className="w-4 h-4 text-indigo-400" />
                <span>{selectedStudy.authorName}</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-slate-350">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>{selectedStudy.dateStr}</span>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6 text-[#2c323f]">
            {/* Tags list if they exist on the study */}
            {selectedStudy.tags && selectedStudy.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-100">
                <Tag className="w-3.5 h-3.5 text-slate-450" />
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Tags:</span>
                {selectedStudy.tags.map(t => (
                  <span 
                    key={t}
                    className="bg-indigo-50 border border-indigo-150 text-indigo-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            {/* Action Bar for Study */}
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-400">Excelente leitura!</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleFavorite(selectedStudy.id, selectedStudy.title)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isFav 
                      ? 'bg-amber-50 border-amber-300 text-amber-700' 
                      : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <BookMarked className={`w-4 h-4 ${isFav ? 'fill-amber-500 text-amber-500' : ''}`} />
                  <span>{isFav ? 'Favoritado' : 'Favoritar'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleShareStudy(selectedStudy)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold hover:border-slate-300 hover:bg-slate-50 text-slate-500 transition-all cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Compartilhar</span>
                </button>
              </div>
            </div>

            {/* Media Visibility Toggles / Painel de Mídias (Opcional - Fechar vídeo, áudio, anexo) */}
            {(selectedStudy.audioUrl || selectedStudy.videoUrl || selectedStudy.attachmentUrl || selectedStudy.attachmentName) && (
              <div className="bg-[#f8fafc] border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-black text-[#002D5E] uppercase tracking-wider text-[10px] block">
                    Painel de Mídias Auxiliares
                  </span>
                  <span className="text-[9px] font-bold text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    Clique para Fechar/Abrir
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2.5">
                  {selectedStudy.audioUrl && (
                    <button
                      type="button"
                      onClick={() => setShowAudio(prev => !prev)}
                      className={`px-3 py-2 rounded-xl border text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                        showAudio 
                          ? 'bg-amber-400/10 border-amber-400/40 text-amber-800 hover:bg-amber-400/15' 
                          : 'bg-white border-slate-200 text-slate-450 hover:bg-slate-50'
                      }`}
                    >
                      <Headphones className="w-4 h-4 text-amber-500" />
                      <span>{showAudio ? 'Fechar Podcast' : 'Abrir Podcast'}</span>
                      {showAudio ? <Eye className="w-3.5 h-3.5 text-amber-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                  )}

                  {selectedStudy.videoUrl && (
                    <button
                      type="button"
                      onClick={() => setShowVideo(prev => !prev)}
                      className={`px-3 py-2 rounded-xl border text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                        showVideo 
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-900 hover:bg-indigo-100/40' 
                          : 'bg-white border-slate-200 text-slate-450 hover:bg-slate-50'
                      }`}
                    >
                      <Video className="w-4 h-4 text-indigo-650" />
                      <span>{showVideo ? 'Fechar Vídeo' : 'Abrir Vídeo'}</span>
                      {showVideo ? <Eye className="w-3.5 h-3.5 text-indigo-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                  )}

                  {(selectedStudy.attachmentUrl || selectedStudy.attachmentName) && (
                    <button
                      type="button"
                      onClick={() => setShowAttachment(prev => !prev)}
                      className={`px-3 py-2 rounded-xl border text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                        showAttachment 
                          ? 'bg-slate-100 border-slate-250 text-slate-800 hover:bg-slate-150' 
                          : 'bg-white border-slate-200 text-slate-450 hover:bg-slate-50'
                      }`}
                    >
                      <FileText className="w-4 h-4 text-slate-550" />
                      <span>{showAttachment ? 'Fechar Anexos' : 'Abrir Anexos'}</span>
                      {showAttachment ? <Eye className="w-3.5 h-3.5 text-slate-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* AUDIO / PODCAST PLAYER (If audioUrl exists and is allowed to display) */}
            {selectedStudy.audioUrl && (
              showAudio ? (
                <div className="p-5 bg-slate-905 border border-slate-800 bg-[#001939] text-white rounded-2xl space-y-3.5 shadow-md relative animate-fade-in">
                  {/* Quick self collapse button in top-right */}
                  <button 
                    onClick={() => setShowAudio(false)}
                    className="absolute top-2 right-2 text-white/50 hover:text-white transition-colors p-1"
                    title="Fechar Áudio"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center text-slate-950 shrink-0 shadow-sm animate-pulse">
                      <Headphones className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest leading-none">Podcast / Estudo em Áudio</p>
                      <p className="text-xs font-bold text-slate-100 truncate mt-1">
                        {selectedStudy.audioName || "Ouvir Estudo Bíblico (Áudio)"}
                      </p>
                    </div>
                    
                    {/* Dedicated audio download button */}
                    <a
                      href={selectedStudy.audioUrl}
                      download={selectedStudy.audioName || "podcast_estudo.mp3"}
                      className="p-2.5 bg-slate-800/80 hover:bg-slate-700 hover:text-amber-400 text-slate-300 rounded-xl transition-colors cursor-pointer"
                      title="Baixar Faixa de Áudio"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>

                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/5">
                    <audio 
                      controls 
                      className="w-full h-9 focus:outline-none" 
                      src={selectedStudy.audioUrl}
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-400/5 rounded-2xl border border-dashed border-amber-300/40 text-center flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800/80 flex items-center gap-1.5 leading-none">
                    <Headphones className="w-4 h-4 text-amber-500" />
                    O player de Áudio/Podcast foi fechado para melhorar a leitura.
                  </span>
                  <button 
                    onClick={() => setShowAudio(true)}
                    className="text-[10px] font-extrabold uppercase text-amber-700 hover:underline bg-white px-2.5 py-1 rounded-lg border border-amber-200 cursor-pointer"
                  >
                    Abrir Áudio
                  </button>
                </div>
              )
            )}

            {/* EMBEDDED VIDEO OR UPLOADED VIDEO IF EXISTS and is allowed to display */}
            {selectedStudy.videoUrl && (
              showVideo ? (
                <div className="space-y-2 relative border border-slate-100 p-4 rounded-2xl bg-slate-50/20 shadow-xs animate-fade-in">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase text-indigo-950 tracking-widest flex items-center gap-1.5">
                      <Video className="w-4 h-4 text-indigo-650" />
                      Vídeo do Estudo / Pregação
                    </p>
                    
                    <div className="flex items-center gap-3">
                      {/* Download option for video */}
                      <a
                        href={selectedStudy.videoUrl}
                        download="video_estudo.mp4"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-indigo-700 font-extrabold flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Baixar Vídeo (MP4)</span>
                      </a>

                      {/* Quick close link */}
                      <button 
                        onClick={() => setShowVideo(false)}
                        className="text-[10px] text-slate-400 hover:text-red-650 font-bold flex items-center gap-0.5"
                        title="Fechar Vídeo"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Fechar</span>
                      </button>
                    </div>
                  </div>

                  {embedUrl ? (
                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-black">
                      <iframe
                        className="absolute top-0 left-0 w-full h-full"
                        src={embedUrl}
                        title={selectedStudy.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-black">
                      <video 
                        controls 
                        className="w-full aspect-video max-h-[340px]" 
                        src={selectedStudy.videoUrl} 
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-indigo-50/30 rounded-2xl border border-dashed border-indigo-250/45 text-center flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900/80 flex items-center gap-1.5 leading-none">
                    <Video className="w-4 h-4 text-indigo-650" />
                    O player de Vídeo foi fechado para facilitar sua leitura do texto.
                  </span>
                  <button 
                    onClick={() => setShowVideo(true)}
                    className="text-[10px] font-extrabold uppercase text-indigo-800 hover:underline bg-white px-2.5 py-1 rounded-lg border border-indigo-200 cursor-pointer"
                  >
                    Abrir Vídeo
                  </button>
                </div>
              )
            )}

            {/* Written Study Text Content */}
            <div className="space-y-2.5">
              <p className="text-[10px] font-black uppercase text-indigo-950 tracking-widest block pb-1 border-b border-slate-100">
                Conteúdo do Estudo
              </p>
              <div className="text-sm font-medium leading-relaxed whitespace-pre-wrap font-sans text-slate-800 bg-slate-50/50 p-4 rounded-2xl border border-slate-101">
                {selectedStudy.content}
              </div>
            </div>

            {/* ATTACHMENTS IF THEY EXIST and are allowed to display */}
            {(selectedStudy.attachmentUrl || selectedStudy.attachmentName) && (
              showAttachment ? (
                <div className="pt-4 border-t border-slate-150 space-y-2 animate-fade-in relative">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase text-indigo-950 tracking-widest">
                      Arquivos e Anexos Disponíveis
                    </p>
                    {/* Quick self collapse button */}
                    <button 
                      onClick={() => setShowAttachment(false)}
                      className="text-[9px] text-[#2c323f]/50 hover:text-red-650 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Fechar Anexo</span>
                    </button>
                  </div>
                  
                  <a
                    href={selectedStudy.attachmentUrl}
                    download={selectedStudy.attachmentName || "anexo_estudo.pdf"}
                    target="_blank"
                    rel="noreferrer referrer"
                    className="inline-flex items-center gap-3 p-3 bg-indigo-50/60 border border-indigo-150 rounded-2xl text-xs text-indigo-900 font-extrabold hover:bg-indigo-100/60 transition-colors w-full cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <span className="block font-black truncate text-indigo-950 leading-tight">
                        {selectedStudy.attachmentName || 'Download_Estudo.pdf'}
                      </span>
                      <span className="block text-[10px] text-indigo-600 font-bold uppercase tracking-wider">
                        Clique para baixar arquivo anexo
                      </span>
                    </div>
                    <Download className="w-4 h-4 text-indigo-600 shrink-0" />
                  </a>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5 leading-none">
                    <FileText className="w-4 h-4 text-slate-550" />
                    O painel de Documentos/Anexos foi fechado de sua visualização.
                  </span>
                  <button 
                    onClick={() => setShowAttachment(true)}
                    className="text-[10px] font-extrabold uppercase text-slate-700 hover:underline bg-white px-2.5 py-1 rounded-lg border border-slate-200 cursor-pointer"
                  >
                    Abrir Anexo
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    );
  }

  // Study List main view
  return (
    <div className="space-y-6 animate-fade-in pb-16 text-[#2c323f]">
      {/* Title Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <h1 className="font-display font-extrabold text-3xl text-indigo-950 tracking-tight">Estudos IPBA</h1>
        </div>
        <p className="text-xs text-slate-550 font-bold uppercase tracking-wider ml-1 text-indigo-750">Crescimento espiritual, discipulado e teologia reformada</p>
      </div>

      {/* Search Input Box */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por títulos, pastores ou versículos..."
          className="w-full bg-white pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 placeholder:text-slate-400 font-bold text-[#191c1d] shadow-xs"
        />
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {/* Tags Filter Row */}
      {allTags.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Filtrar por Tags:</p>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border whitespace-nowrap cursor-pointer ${
                !selectedTag
                  ? 'bg-indigo-600 border-indigo-700 text-white shadow-xs'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              Todas as tags (Exibir Tudo)
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border whitespace-nowrap cursor-pointer ${
                  selectedTag === tag
                    ? 'bg-indigo-600 border-indigo-700 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Studies Dashboard Matrix */}
      {filteredStudies.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/60 text-slate-400 space-y-2">
          <p className="text-sm font-semibold">Nenhum estudo bíblico foi encontrado para essa busca.</p>
          <p className="text-xs text-slate-400">Tente buscar por termos genéricos ou selecione outra tag no filtro acima.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredStudies.map((study) => {
            const isFav = favorites.includes(study.id);
            const hasVideo = !!study.videoUrl;
            const hasFile = !!study.attachmentUrl || !!study.attachmentName;
            const hasAudio = !!study.audioUrl;

            return (
              <div
                key={study.id}
                onClick={() => setActiveStudyId(study.id)}
                className="bg-white rounded-2xl p-5 border border-slate-200/70 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-4 text-left group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] uppercase font-black text-indigo-600 tracking-wider bg-indigo-50/75 border border-indigo-100 rounded px-2 py-0.5 select-none">
                      ESTUDOS IPBA
                    </span>
                    <div className="flex items-center gap-1.5">
                      {hasAudio && <Headphones className="w-3.5 h-3.5 text-amber-500 inline" title="Possui Podcast / Áudio" />}
                      {hasVideo && <Video className="w-3.5 h-3.5 text-indigo-600 inline" title="Possui mídia de vídeo" />}
                      {hasFile && <FileText className="w-3.5 h-3.5 text-slate-400 inline" title="Possui arquivo anexado" />}
                    </div>
                  </div>

                  <h3 className="font-extrabold text-[#191c1d] group-hover:text-indigo-950 transition-colors leading-tight text-sm">
                    {study.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-semibold">
                    {study.content}
                  </p>

                  {/* Render tag list inside single cards */}
                  {study.tags && study.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {study.tags.map(t => (
                        <span 
                          key={t} 
                          className="text-[8.5px] bg-[#f1f5f9] text-[#475569] border border-slate-200 px-1.5 py-0.5 rounded font-black tracking-wide uppercase"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#002D5E] font-black">{study.authorName}</span>
                    <span className="text-[9px] text-slate-400 font-bold">{study.dateStr}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px] text-indigo-600 font-extrabold group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                      Ler agora
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
