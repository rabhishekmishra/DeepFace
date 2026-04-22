import { User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { LogOut, Bell, Settings } from 'lucide-react';

export default function Navbar({ user }: { user: User }) {
  return (
    <nav className="h-16 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center font-bold text-black text-xs">V</div>
        <span className="font-bold tracking-tight text-lg">VISIONARY</span>
      </div>

      <div className="flex items-center gap-6 text-zinc-400">
        <button className="hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        <button className="hover:text-white transition-colors">
          <Settings className="w-5 h-5" />
        </button>
        <div className="h-4 w-[1px] bg-zinc-800 mx-2" />
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-white leading-none mb-1">{user?.displayName || 'Guest User'}</p>
            <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">Member</p>
          </div>
          <img src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName || 'Guest'}`} className="w-9 h-9 rounded-xl border border-zinc-700" alt="Avatar" />
          {user?.uid && (
            <button 
              onClick={() => auth.signOut()}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 hover:text-red-400"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
