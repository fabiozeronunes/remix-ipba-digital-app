export interface User {
  name: string;
  category: string;
  avatarUrl: string;
  planCount: number;
  prayerCount: number;
  eventCount: number;
  email?: string;
  phone?: string;
  birthDate?: string;
  address?: string;
  ministry?: string;
  password?: string;
  status?: 'Ativo' | 'Pendente' | 'Suspenso';
  updatedAt?: string;
}

export interface PrayerRequest {
  id: string;
  category: 'Saúde' | 'Gratidão' | 'Família' | 'Espiritual' | 'Finanças';
  title: string;
  description: string;
  timeAgo: string;
  count: number;
  visibilidade: 'Público' | 'Pastoral';
  userOred: boolean;
  authorName: string;
  avatarUrl: string;
  aprovado?: boolean;
  authorEmail?: string;
  updatedAt?: string;
}

export interface Cell {
  id: string;
  title: string;
  leaderName: string;
  leaderAvatar: string;
  schedule: string;
  address: string;
  neighborhood: string;
  distance: string;
  joined: boolean;
  city?: string;
  updatedAt?: string;
}

export interface Contribution {
  id: string;
  title: string;
  date: string;
  amountVal: number;
  category: 'Dízimo' | 'Oferta' | 'Missões' | 'Obra Social' | 'Evento';
  method: 'Pix';
}

export interface ChurchEvent {
  id: string;
  title: string;
  dateStr: string;
  day: number;
  month: string;
  timeStr: string;
  timeEnd?: string;
  location: string;
  address?: string;
  description: string;
  going: boolean;
  isPaid?: boolean;
  value?: number;
  confirmedUsers?: string[];
  mural?: boolean;
  notificarDiariamente?: boolean;
  neighborhood?: string;
  city?: string;
  room?: string;
  updatedAt?: string;
}

export interface BibleBook {
  name: string;
  abbrev: string;
  chapters: number;
}

export interface ChurchStudy {
  id: string;
  title: string;
  authorName: string;
  dateStr: string;
  content: string;
  attachmentUrl?: string;
  attachmentName?: string;
  videoUrl?: string;
  audioUrl?: string;
  audioName?: string;
  tags?: string[];
  updatedAt?: string;
}

export interface RadioProgram {
  id: string;
  title: string;
  speaker: string;
  audioUrl: string;
  audioName?: string;
  scheduledTime?: string;
  tags?: string[];
  createdAt: string;
  date?: string;
}

export interface SupportOption {
  id?: string;
  name: string;
}

export interface SupportTicket {
  id?: string;
  name: string;
  email?: string;
  category: string;
  text: string;
  createdAt: string;
  status?: string;
}

export interface Notification {
  id?: string;
  title: string;
  message: string;
  createdAt: string;
  adminEmail?: string;
  targetTab?: string;
  targetElementId?: string;
  eventName?: string;
  eventDate?: string;
}

