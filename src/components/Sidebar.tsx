import { LayoutDashboard, Camera, Users, History, Database, HelpCircle, Fingerprint } from 'lucide-react';
import { Page } from '../App';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function Sidebar({ activePage, onNavigate }: { activePage: Page, onNavigate: (p: Page) => void }) {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
    { id: 'analysis', icon: Camera, label: 'Face Analysis' },
    { id: 'recognition', icon: Fingerprint, label: 'Identity Search' },
    { id: 'history', icon: History, label: 'History' },
  ];

  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-900/20 hidden md:flex flex-col p-6">
      <div className="flex-1 space-y-2">
        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest pl-3 mb-4">Main Navigation</p>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id as Page)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group text-sm font-medium",
              activePage === item.id 
                ? "bg-orange-500 text-black shadow-lg shadow-orange-500/20" 
                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {item.label}
          </button>
        ))}
      </div>

      <div className="pt-6 border-t border-zinc-800 space-y-2">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all text-sm">
          <Database className="w-5 h-5" />
          API Status
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all text-sm">
          <HelpCircle className="w-5 h-5" />
          Documentation
        </button>
      </div>
    </aside>
  );
}
