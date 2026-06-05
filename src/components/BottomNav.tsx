import { 
  LogIn, 
  User, 
  HeartHandshake, 
  Coins, 
  BookOpen, 
  Video, 
  Calendar, 
  Users,
  ShieldAlert,
  Home,
  LifeBuoy
} from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  userLogged: boolean;
  isAdmin?: boolean;
  isVisitor?: boolean;
  pendingCount?: number;
}

export default function BottomNav({ currentTab, onNavigate, userLogged, isAdmin, isVisitor, pendingCount = 0 }: BottomNavProps) {
  const tabs = [
    { id: 'login', label: 'Login', icon: LogIn },
    ...(isAdmin ? [{ id: 'admin', label: 'Painel Admin', icon: ShieldAlert }] : []),
    { id: 'perfil', label: 'Perfil', icon: User },
    { id: 'home', label: 'Home', icon: Home },
    ...[
      { id: 'aovivo', label: 'Ao Vivo', icon: Video },
      { id: 'celulas', label: 'Células', icon: Users },
      { id: 'dizimos', label: 'Dízimos', icon: Coins },
      ...(!isVisitor ? [{ id: 'estudos', label: 'Estudos', icon: BookOpen }] : []),
      { id: 'eventos', label: 'Eventos', icon: Calendar },
      { id: 'oracao', label: 'Oração', icon: HeartHandshake },
      { id: 'suporte', label: 'Suporte', icon: LifeBuoy },
    ].sort((a, b) => a.label.localeCompare(b.label, 'pt-BR')),
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 bg-white/90 backdrop-blur-xl rounded-t-3xl shadow-[0px_-8px_24px_rgba(0,45,94,0.06)] border-t border-slate-200/50 py-3 pb-6 flex items-center">
      {/* Scrollable Container */}
      <div className="flex overflow-x-auto no-scrollbar px-6 gap-2 w-full snap-x scroll-smooth">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          const IconComponent = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`relative flex flex-col items-center justify-center px-4 py-2 min-w-[85px] rounded-2xl transition-all duration-300 transform cursor-pointer snap-center shrink-0 ${
                isActive
                  ? 'bg-[#002D5E] text-white scale-105 shadow-md font-bold'
                  : 'text-slate-400 hover:text-[#002D5E] hover:bg-slate-100/50'
              }`}
            >
              {tab.id === 'admin' && pendingCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center z-10">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#ff3b30] text-[8px] font-black text-white ring-1 ring-white items-center justify-center shadow-xs">
                    {pendingCount}
                  </span>
                </span>
              )}
              <IconComponent className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
              <span className="font-sans text-[11px] font-semibold uppercase tracking-wider mt-1 block">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
