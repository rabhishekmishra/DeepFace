import { LayoutDashboard, Camera, Users, History as HistoryIcon, Fingerprint } from 'lucide-react';
import { Page } from '../App';
import { cn } from '../lib/utils';

export default function MobileNav({ activePage, onNavigate }: { activePage: Page, onNavigate: (p: Page) => void }) {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
    { id: 'analysis', icon: Camera, label: 'Analysis' },
    { id: 'recognition', icon: Fingerprint, label: 'Search' },
    { id: 'history', icon: HistoryIcon, label: 'History' },
  ];

  return (
    <nav className="md:hidden border-t border-zinc-800 bg-zinc-950/80 backdrop-blur-xl fixed bottom-0 left-0 right-0 z-50 px-6 h-20 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      {menuItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id as Page)}
          className="flex flex-col items-center gap-1 group relative py-2"
        >
          <div className={cn(
            "p-2 rounded-xl transition-all duration-300",
            activePage === item.id 
              ? "bg-orange-500 text-black scale-110" 
              : "text-zinc-500 group-hover:text-white"
          )}>
            <item.icon className="w-5 h-5" />
          </div>
          <span className={cn(
            "text-[9px] font-bold uppercase tracking-wider transition-opacity duration-300",
            activePage === item.id ? "opacity-100 text-orange-500" : "opacity-0"
          )}>
            {item.label}
          </span>
        </button>
      ))}
    </nav>
  );
}
