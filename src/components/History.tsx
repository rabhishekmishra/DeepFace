import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, limit, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Trash2, X, Maximize2, ShieldCheck, Fingerprint, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';

interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string | null;
    email: string | null;
    emailVerified: boolean | null;
    isAnonymous: boolean | null;
  }
}

function handleFirestoreError(err: any, operation: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write', path: string | null = null) {
  const info: FirestoreErrorInfo = {
    error: err.message,
    operationType: operation,
    path,
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
    }
  };
  console.error("Firestore Error Detailed:", info);
  alert(`Security Error [${operation}]: ${err.message}\nPath: ${path}`);
}

export default function History() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Removing orderBy to check if index was the issue
    const q = query(
      collection(db, 'analyses'),
      where('userId', '==', auth.currentUser.uid),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort in memory to avoid indexing requirements for now
      docs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });
      setItems(docs);
      setLoading(false);
    }, (error) => {
      // If error is permission-denied, it might be due to missing fields in older records or rules mismatch
      console.error("Firestore Snapshot Error:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const [showConfirm, setShowConfirm] = useState<{ id: string | 'all', type: 'single' | 'all' } | null>(null);

  const handleDelete = async (itemId: string) => {
    setDeletingId(itemId);
    console.log(`[DEBUG] Initiating delete for document: ${itemId}`);
    try {
      await deleteDoc(doc(db, 'analyses', itemId));
      console.log(`[DEBUG] Delete call completed for: ${itemId}`);
      setItems(prev => prev.filter(item => item.id !== itemId));
      setShowConfirm(null);
    } catch (err: any) {
      console.error(`[DEBUG] Delete call failed for: ${itemId}`, err);
      handleFirestoreError(err, 'delete', `analyses/${itemId}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (!auth.currentUser) return;
    
    setClearing(true);
    try {
      const q = query(
        collection(db, 'analyses'),
        where('userId', '==', auth.currentUser.uid)
      );
      
      const snapshot = await getDocs(q);
      console.log(`[DEBUG] Clearing all archive, found ${snapshot.docs.length} documents.`);
      
      // Use batch for better performance and reliability
      const batchSize = 25;
      const docs = snapshot.docs;
      
      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = docs.slice(i, i + batchSize);
        await Promise.all(batch.map(docRef => deleteDoc(docRef.ref)));
      }
      
      setItems([]);
      setSelectedItem(null);
      setShowConfirm(null);
      alert("Archive wiped successfully.");
    } catch (err: any) {
      handleFirestoreError(err, 'delete', 'analyses (batch)');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-32 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-white flex items-center gap-4">
            <Fingerprint className="w-10 h-10 text-orange-500" />
            Audit Archive
          </h2>
          <p className="text-zinc-500 font-light mt-2 text-lg">Retrieve and manage previously archived face analysis records.</p>
        </div>
        <div className="flex items-center gap-4">
          {items.length > 0 && (
            <button 
              onClick={() => setShowConfirm({ id: 'all', type: 'all' })}
              disabled={clearing}
              className="px-6 py-2 border border-red-500/20 text-red-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {clearing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {clearing ? "PURGING ARCHIVE..." : "Clear All Archive"}
            </button>
          )}
          <span className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs font-mono text-zinc-400">
            {items.length} RECORDS
          </span>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="aspect-[4/5] bg-zinc-900/50 animate-pulse rounded-[2.5rem]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-40 text-center bg-zinc-900/10 rounded-[4rem] border-2 border-dashed border-zinc-800/50">
          <Calendar className="w-16 h-16 text-zinc-800 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-zinc-600">Archive Empty</h3>
          <p className="text-zinc-500 mt-2">Initialize analysis to populate history.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          <AnimatePresence>
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, delay: i * 0.03 }}
                onClick={() => setSelectedItem(item)}
                className="group bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] overflow-hidden hover:border-orange-500/30 hover:bg-zinc-900 transition-all cursor-pointer flex flex-col relative"
              >
                <div className="relative aspect-square overflow-hidden bg-black">
                  <img 
                    src={item.imageUrl} 
                    className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110" 
                    alt="History"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-60" />
                  
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowConfirm({ id: item.id, type: 'single' });
                      }}
                      disabled={deletingId === item.id}
                      className={cn(
                        "p-3 bg-black/60 backdrop-blur-xl rounded-2xl text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-all shadow-xl disabled:opacity-50",
                        deletingId === item.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      )}
                    >
                      {deletingId === item.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="absolute bottom-4 left-6 flex items-center gap-3">
                    <div className="px-3 py-1 bg-orange-500 text-black text-[10px] font-black uppercase rounded-lg shadow-lg">
                      {item.results.faces?.length || 0} DEEP SCANS
                    </div>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col space-y-4">
                  <div>
                    <p className="text-[10px] text-zinc-500 font-black mb-1 uppercase tracking-widest flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      {item.createdAt ? item.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'PENDING...'}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {item.results.faces?.slice(0, 2).map((face: any, idx: number) => (
                        <div key={idx} className="px-2 py-1 bg-zinc-800/50 rounded-lg border border-white/5 text-[9px] font-mono text-zinc-400 uppercase">
                          {face.emotion}
                        </div>
                      ))}
                      {(item.results.faces?.length || 0) > 2 && (
                        <div className="px-2 py-1 bg-zinc-800/50 rounded-lg border border-white/5 text-[9px] font-mono text-zinc-500 uppercase">
                          +{(item.results.faces?.length || 0) - 2} MORE
                        </div>
                      )}
                    </div>
                  </div>

                  <button 
                    className="w-full py-3 bg-zinc-800/50 hover:bg-white hover:text-black rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    Expand View
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Expanded View Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-10 bg-black/90 backdrop-blur-2xl"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-6xl bg-zinc-950 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col lg:flex-row relative"
            >
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute top-6 right-6 z-10 p-4 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-white hover:bg-white hover:text-black transition-all"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Image Section */}
              <div className="lg:w-1/2 relative bg-black aspect-video lg:aspect-auto">
                <img 
                  src={selectedItem.imageUrl} 
                  className="w-full h-full object-contain" 
                  alt="Expanded"
                />
                <div className="absolute bottom-10 left-10 p-6 bg-black/60 backdrop-blur-xl rounded-[2rem] border border-white/10 max-w-sm hidden sm:block">
                  <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2">Original Context</p>
                  <p className="text-zinc-300 text-sm leading-relaxed">System scan performed on {selectedItem.createdAt?.toDate().toLocaleString()}.</p>
                </div>
              </div>

              {/* Metadata Section */}
              <div className="lg:w-1/2 p-8 sm:p-12 overflow-y-auto max-h-[80vh] lg:max-h-auto scrollbar-none">
                <div className="space-y-8">
                  <div>
                    <h3 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">Archive Intelligence</h3>
                    <p className="text-zinc-500 font-mono text-xs uppercase tracking-tight">Audit ID: {selectedItem.id}</p>
                  </div>

                  <div className="space-y-6">
                    <p className="text-xs font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-900 pb-2">Detected Entities</p>
                    <div className="grid grid-cols-1 gap-4">
                      {selectedItem.results.faces?.map((face: any, idx: number) => (
                        <div key={idx} className="p-6 bg-zinc-900/50 rounded-3xl border border-white/5 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <ShieldCheck className="w-5 h-5 text-blue-500" />
                              <span className="text-xs font-black text-white uppercase tracking-widest">Subject {idx + 1}</span>
                            </div>
                            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-[10px] font-bold border border-blue-500/20">
                               Verified Node
                            </span>
                          </div>
                          
                          <div>
                            <p className="text-[10px] text-zinc-500 uppercase font-black mb-2 tracking-widest">Sentiment Analysis</p>
                            <p className="text-2xl font-black text-white lowercase tracking-tight">"{face.emotion}"</p>
                          </div>

                          <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                            <p className="text-[10px] text-zinc-500 italic leading-relaxed">"{face.recommendation}"</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-8 flex flex-col sm:flex-row gap-4">
                     <button 
                        onClick={() => setSelectedItem(null)}
                        className="flex-1 py-4 bg-white text-black font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all"
                     >
                        Close View
                     </button>
                     <button 
                        onClick={() => setShowConfirm({ id: selectedItem.id, type: 'single' })}
                        disabled={deletingId === selectedItem.id}
                        className="px-8 py-4 bg-red-500/10 text-red-500 border border-red-500/20 font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all shadow-xl shadow-red-500/10 disabled:opacity-50"
                     >
                        {deletingId === selectedItem.id ? "Deleting..." : "Delete Record"}
                     </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-3xl"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-zinc-950 border border-red-500/20 rounded-[2.5rem] p-10 text-center space-y-8 shadow-2xl"
            >
              <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto border border-red-500/20">
                <Trash2 className="w-10 h-10 text-red-500" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Confirm Deletion</h3>
                <p className="text-zinc-500 text-sm leading-relaxed font-light">
                  {showConfirm.type === 'all' 
                    ? `This will permanently eliminate ${items.length} records from the global biometric archive. This action is irreversible.` 
                    : "This specific analysis node will be permanently purged from your historical logs."}
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <button 
                  onClick={() => showConfirm.type === 'all' ? handleClearAll() : handleDelete(showConfirm.id)}
                  disabled={clearing || deletingId !== null}
                  className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                >
                  {(clearing || deletingId !== null) && <RefreshCw className="w-4 h-4 animate-spin" />}
                  Confirm & Execute
                </button>
                <button 
                  onClick={() => setShowConfirm(null)}
                  disabled={clearing || deletingId !== null}
                  className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] transition-all border border-white/5"
                >
                  Abort Operation
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
