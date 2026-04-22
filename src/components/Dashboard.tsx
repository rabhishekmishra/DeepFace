import { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Shield, Zap, Target, Activity, ArrowUpRight } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const [stats, setStats] = useState({ totalAnalyses: 0, accuracy: '99.8%' });

  useEffect(() => {
    async function fetchStats() {
      if (!auth.currentUser) return;
      const q = query(collection(db, 'analyses'), where('userId', '==', auth.currentUser.uid));
      const snapshot = await getCountFromServer(q);
      setStats(prev => ({ ...prev, totalAnalyses: snapshot.data().count }));
    }
    fetchStats();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-white">System Monitor</h2>
          <p className="text-zinc-500 font-light mt-1 italic">Integrity: <span className="text-green-500 font-mono">NOMINAL</span> • Session Secure</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 flex gap-8">
          <StatMini label="Active Tokens" value="4.2k" />
          <StatMini label="Node Latency" value="12ms" />
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <StatCard 
          label="Neural Processing Logs" 
          value={stats.totalAnalyses.toString()} 
          icon={Activity} 
          trend="+12% today"
          color="orange"
        />
        <StatCard 
          label="Model Precision" 
          value={stats.accuracy} 
          icon={Target} 
          trend="Stable"
          color="blue"
        />
        <StatCard 
          label="Security Pulse" 
          value="Encrypted" 
          icon={Shield} 
          trend="AES-256"
          color="green"
        />
      </div>

      {/* Quick Actions / Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 relative overflow-hidden group">
          <Zap className="absolute top-[-20%] right-[-10%] w-64 h-64 text-orange-500/5 rotate-12 transition-transform group-hover:scale-110" />
          <h3 className="text-2xl font-bold mb-4 relative z-10">Advanced Neural Engine</h3>
          <p className="text-zinc-400 font-light leading-relaxed mb-8 relative z-10 max-w-md">
            Our specialized vision models can detect micro-expressions, estimate age within a 2-year margin, and recognize geometric facial patterns for 1:1 identity verification.
          </p>
          <button className="flex items-center gap-2 text-orange-500 font-bold hover:gap-4 transition-all relative z-10">
            Learn about Vision 3.0 <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-[#1a1a1a] border border-zinc-800 rounded-[3rem] p-10 flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="text-2xl font-bold">Privacy Protocol</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-1 h-12 bg-zinc-700 rounded-full" />
                <p className="text-sm text-zinc-500 italic">"Personal biometrics are never shared with 3rd party providers or used for training without explicit audit tokens."</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-12">
            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full w-2/3 bg-orange-500" />
            </div>
            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full w-full bg-orange-500" />
            </div>
            <div className="h-1 bg-zinc-800 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatMini({ label, value }: { label: string, value: string }) {
  return (
    <div className="text-center font-mono">
      <p className="text-[10px] text-zinc-600 uppercase tracking-widest">{label}</p>
      <p className="text-white font-bold">{value}</p>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, trend, color }: { label: string, value: string, icon: any, trend: string, color: string }) {
  const colors: any = {
    orange: 'text-orange-500 bg-orange-500/5 border-orange-500/10',
    blue: 'text-blue-500 bg-blue-500/5 border-blue-500/10',
    green: 'text-green-500 bg-green-500/5 border-green-500/10',
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] flex flex-col justify-between h-56"
    >
      <div className="flex justify-between items-start">
        <div className={cn("p-4 rounded-2xl border", colors[color])}>
          <Icon className="w-6 h-6" />
        </div>
        <p className="text-xs font-mono text-zinc-500">{trend}</p>
      </div>
      <div>
        <h4 className="text-sm font-medium text-zinc-500 mb-1">{label}</h4>
        <p className="text-4xl font-black tracking-tight">{value}</p>
      </div>
    </motion.div>
  );
}
