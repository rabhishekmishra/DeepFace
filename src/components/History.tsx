import { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Trash2, ExternalLink, Search } from 'lucide-react';

export default function History() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'analyses'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(docs);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Audit History</h2>
          <p className="text-zinc-500 font-light mt-1">Archived facial analysis logs.</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search records..."
            className="bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-orange-500/50 transition-colors w-64"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-zinc-900/50 animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-32 text-center bg-zinc-900/20 rounded-[3rem] border border-dashed border-zinc-800">
          <Calendar className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500">No records found. Start an analysis to see history.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group bg-zinc-900 border border-zinc-800 rounded-[2rem] overflow-hidden hover:border-zinc-600 transition-all flex flex-col"
              >
                <div className="relative h-48 overflow-hidden bg-zinc-950">
                  <img 
                    src={item.imageUrl} 
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" 
                    alt="History"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
                  <div className="absolute bottom-4 left-6">
                    <span className="text-[10px] font-mono bg-orange-500 text-black px-2 py-0.5 rounded font-bold uppercase">
                      {item.results.faces?.length || 0} Faces Detected
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-xs text-zinc-500 font-mono mb-2 uppercase tracking-tight">
                      {item.createdAt?.toDate().toLocaleString() || 'Recent'}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {item.results.faces?.slice(0, 3).map((face: any, idx: number) => (
                        <span key={idx} className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-1 rounded-lg border border-zinc-700">
                          {face.emotion} • {face.gender[0]} • {face.age}
                        </span>
                      ))}
                      {(item.results.faces?.length || 0) > 3 && <span className="text-[10px] text-zinc-500">...</span>}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-auto">
                    <button className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2">
                       <ExternalLink className="w-3 h-3" />
                       Expand View
                    </button>
                    <button className="p-2 hover:bg-red-500/10 hover:text-red-400 text-zinc-600 rounded-xl transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
