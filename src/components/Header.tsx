import { Bell, User } from 'lucide-react';
import { User as UserType } from '../types';

interface HeaderProps {
  user: UserType | null;
  onNavigate: (tab: string) => void;
  deferredPrompt: any;
  onInstall: () => void;
  onToggleNotifications: () => void;
  unreadCount: number;
}

export default function Header({ 
  user, 
  onNavigate, 
  deferredPrompt, 
  onInstall, 
  onToggleNotifications, 
  unreadCount 
}: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 w-full z-50 backdrop-blur-lg flex justify-between items-center px-6 py-4 shadow-md bg-[#002D5E] text-white">
      {/* IPB Digital Logo and Wordmark */}
      <div 
        className="flex items-center gap-3 cursor-pointer select-none"
        onClick={() => onNavigate('home')}
      >
        <img 
          alt="IPB Logo" 
          className="h-12 md:h-14 w-auto object-contain brightness-100" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuADYMPvZcaOSpHUoz7xjXH4_NJcY25qztiFideOgHchUZKhDCIoAyq_MGHgParQMmKcwudjYsYMEG0TCr3XaZvoDPdwhgOP69aaiYWcXIUEoQX0Ra1DCbFOr3bTIMz7JLCMI4XJDTJ0bjECIZfhV06N7LfW5TN63vQqhOogP521OSWtqiXBFJbV9vtNdePlGu6ecRVcuNbWfGIZugLjKYMuloDE98xQMY7_Vw6y7T4gzlmYr-7m3DQqOwEyMuaNC6tgBxOSbbR0jgY"
        />
      </div>

       <div className="flex items-center gap-2 md:gap-4">
        {/* Notification Bell */}
        {user && (
          <button 
            onClick={onToggleNotifications}
            className="p-2.5 rounded-full hover:bg-white/10 transition-colors relative active:scale-90 cursor-pointer"
            aria-label="Notificações"
          >
            <Bell className="w-5 h-5 md:w-6 md:h-6 text-white" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 border-2 border-[#002D5E] rounded-full flex items-center justify-center text-[10px] font-bold animate-bounce">
                {unreadCount > 9 ? '+' : unreadCount}
              </span>
            )}
          </button>
        )}
        {/* User Session Portal */}
        {user ? (
          <button 
            onClick={() => onNavigate('perfil')}
            className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full font-semibold text-xs md:text-sm hover:bg-white/20 transition-all active:scale-95 bg-white/10 text-white cursor-pointer"
          >
            <img 
              src={user.avatarUrl} 
              alt={user.name} 
              className="w-5 h-5 rounded-full object-cover border border-white/40" 
            />
            <span className="hidden md:inline">{user.name}</span>
            <span className="md:hidden">Painel</span>
          </button>
        ) : (
          <button 
            onClick={() => onNavigate('login')}
            className="flex items-center gap-2 px-3  py-1.5 md:px-4 md:py-2 rounded-full font-semibold text-sm hover:bg-white/20 transition-all active:scale-95 bg-white/10 text-white cursor-pointer"
          >
            <User className="w-4 h-4" />
            <span>Acessar Painel</span>
          </button>
        )}
      </div>
    </header>
  );
}
