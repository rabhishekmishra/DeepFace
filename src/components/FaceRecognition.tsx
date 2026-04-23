import React, { useState, useRef } from 'react';
import { RefreshCw, Users, ShieldCheck, ShieldAlert, Upload, Search, Fingerprint, Trash2 } from 'lucide-react';
import { batchIdentify } from '../lib/gemini';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function FaceRecognition() {
  const [refs, setRefs] = useState<string[]>([]);
  const [probe, setProbe] = useState<string | null>(null);
  const [identifying, setIdentifying] = useState(false);
  const [result, setResult] = useState<{ matchIndex: number | null; score: number; reason: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const probeInputRef = useRef<HTMLInputElement>(null);

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          setRefs(prev => [...prev, event.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
      setResult(null);
      setShowModal(false);
    }
  };

  const handleProbeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProbe(event.target?.result as string);
        setResult(null);
        setShowModal(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeRef = (index: number) => {
    setRefs(prev => prev.filter((_, i) => i !== index));
    setResult(null);
    setShowModal(false);
  };

  const runIdentification = async () => {
    if (!probe || refs.length === 0) return;

    setIdentifying(true);
    setResult(null);
    setShowModal(false);
    try {
      const data = await batchIdentify(probe, refs);
      setResult(data);
      setShowModal(true);

      // Save to history archive
      if (auth.currentUser) {
        await addDoc(collection(db, 'analyses'), {
          userId: auth.currentUser.uid,
          imageUrl: probe,
          results: {
            isRecognition: true,
            matchIndex: data.matchIndex,
            matchScore: data.score,
            reason: data.reason,
            gallerySize: refs.length,
            // Format for the history list to consume
            faces: [{
              emotion: data.matchIndex ? `Match: Subj ${data.matchIndex}` : "No Match",
              recommendation: data.reason,
              summary: `Scale-1:N probe scan across ${refs.length} candidates.`
            }]
          },
          createdAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIdentifying(false);
    }
  };

  const clearAll = () => {
    setRefs([]);
    setProbe(null);
    setResult(null);
    setShowModal(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Fingerprint className="w-8 h-8 text-orange-500" />
            Large-Scale Identity Search
          </h2>
          <p className="text-zinc-500 font-light mt-1">Scan a high-capacity gallery to isolate and identify subjects.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => galleryInputRef.current?.click()}
            className="px-6 py-2 bg-zinc-800 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-700 transition-all flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> Bulk Upload Gallery
          </button>
          <button 
            onClick={clearAll}
            className="px-6 py-2 border border-zinc-800 text-zinc-500 rounded-xl text-xs font-bold uppercase tracking-widest hover:text-red-400 hover:border-red-500/20 transition-all flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Reset
          </button>
        </div>
        <input 
          type="file" 
          ref={galleryInputRef} 
          onChange={handleGalleryUpload} 
          className="hidden" 
          multiple 
          accept="image/*" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Gallery Section */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
              <h3 className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-[0.2em]">Subject Gallery</h3>
              <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[10px] font-mono text-zinc-400">
                {refs.length} SAMPLES
              </span>
            </div>
            <span className="text-[10px] font-mono text-zinc-600 italic">Candidate pool for biometric matching</span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto p-2 scrollbar-none">
            {refs.map((img, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "aspect-square rounded-2xl border-2 overflow-hidden relative group transition-all duration-500",
                  result?.matchIndex === (i + 1) ? "border-blue-500 ring-4 ring-blue-500/20 scale-105 z-10 shadow-2xl" : "border-zinc-800"
                )}
              >
                <img src={img} className="w-full h-full object-cover" alt={`Ref ${i+1}`} />
                <div className="absolute top-2 left-2 w-6 h-6 bg-black/60 backdrop-blur-md rounded-lg flex items-center justify-center text-[10px] font-mono border border-white/10">
                  {i + 1}
                </div>
                <button 
                  onClick={() => removeRef(i)}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-md rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                {result?.matchIndex === (i + 1) && (
                  <div className="absolute inset-x-0 bottom-0 py-1.5 bg-blue-500 text-black text-center text-[10px] font-bold uppercase">
                    Match Found
                  </div>
                )}
              </motion.div>
            ))}
            
            <button 
              onClick={() => galleryInputRef.current?.click()}
              className="aspect-square rounded-2xl border-2 border-dashed border-zinc-800 bg-zinc-900/30 flex flex-col items-center justify-center gap-2 hover:border-zinc-600 hover:bg-zinc-800/50 transition-all group"
            >
              <Users className="w-6 h-6 text-zinc-700 group-hover:text-zinc-500" />
              <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Add Candidate</span>
            </button>
          </div>
        </div>

        {/* Target Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-[0.2em]">Identity Probe</h3>
          </div>
          <div 
            onClick={() => probeInputRef.current?.click()}
            className={cn(
              "aspect-square rounded-[3rem] border-2 overflow-hidden flex flex-col items-center justify-center cursor-pointer transition-all duration-500 relative group",
              probe ? "border-orange-500 bg-zinc-950 shadow-[0_0_50px_rgba(249,115,22,0.1)]" : "border-zinc-800 border-dashed bg-zinc-900/50 hover:bg-zinc-800/80"
            )}
          >
             <div className="absolute top-4 right-4 text-orange-500 z-10">
               <Fingerprint className="w-5 h-5 shadow-glow shadow-orange-500/20" />
             </div>
             {probe ? (
                <div className="relative w-full h-full group">
                  <img src={probe} className="w-full h-full object-cover" alt="Target" />
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setProbe(null);
                      setResult(null);
                      setShowModal(false);
                    }}
                    className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur-xl rounded-xl text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
             ) : (
                <div className="text-center">
                  <Search className="w-10 h-10 text-orange-500/30 mb-3 mx-auto" />
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em]">Target Sample</p>
                </div>
             )}
             <input type="file" ref={probeInputRef} onChange={handleProbeUpload} className="hidden" accept="image/*" />
          </div>
          
          <AnimatePresence mode="wait">
            {result && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "p-6 rounded-3xl border flex flex-col items-center text-center space-y-4",
                  result.matchIndex ? "bg-blue-500/5 border-blue-500/20" : "bg-red-500/5 border-red-500/20"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center shadow-lg",
                  result.matchIndex ? "bg-blue-500 text-black shadow-blue-500/20" : "bg-red-500 text-black shadow-red-500/20"
                )}>
                  {result.matchIndex ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                </div>
                <div>
                  <p className={cn("text-xs font-bold uppercase tracking-widest", result.matchIndex ? "text-blue-400" : "text-red-400")}>
                    {result.matchIndex ? `MATCH: SUBJECT ${result.matchIndex}` : "NO IDENTITY MATCH"}
                  </p>
                  <p className="text-lg font-mono text-white mt-1">{(result.score * 100).toFixed(0)}% Confidence</p>
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed font-light italic px-2">"{result.reason}"</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center pt-10 border-t border-zinc-900/50">
        <button
          onClick={runIdentification}
          disabled={!probe || refs.length === 0 || identifying}
          className="group flex flex-col items-center"
        >
          <div className={cn(
            "w-28 h-28 rounded-full border-2 flex items-center justify-center transition-all duration-500 active:scale-95 shadow-glow",
            (!probe || refs.length === 0) 
              ? "border-zinc-800 text-zinc-700" 
              : "border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-black shadow-orange-500/20 scale-110"
          )}>
            {identifying ? <RefreshCw className="w-12 h-12 animate-spin" /> : <Search className="w-12 h-12" />}
          </div>
          <p className={cn(
            "mt-8 font-bold font-mono tracking-[0.4em] text-[10px] transition-colors",
            (!probe || refs.length === 0) ? "text-zinc-700" : "text-zinc-500 group-hover:text-white"
          )}>
            {identifying ? "PERFORMING ANATOMICAL AUDIT" : "INITIATE IDENTITY SCAN"}
          </p>
        </button>
      </div>

      {/* Centered Result Overlay */}
      <AnimatePresence>
        {showModal && result && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={cn(
                "w-full max-w-lg p-10 rounded-[3rem] border-2 text-center shadow-2xl relative",
                result.matchIndex ? "bg-blue-500/5 border-blue-500/30" : "bg-red-500/5 border-red-500/30"
              )}
            >
              <div className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl",
                result.matchIndex ? "bg-blue-500 text-black shadow-blue-500/20" : "bg-red-500 text-black shadow-red-500/20"
              )}>
                {result.matchIndex ? <ShieldCheck className="w-12 h-12" /> : <ShieldAlert className="w-12 h-12" />}
              </div>

              <h3 className={cn(
                "text-3xl font-black mb-2 tracking-tighter uppercase",
                result.matchIndex ? "text-blue-400" : "text-red-400"
              )}>
                {result.matchIndex ? `MATCH: SUBJECT ${result.matchIndex}` : "NO BIOMETRIC MATCH"}
              </h3>
              
              <div className="flex items-center justify-center gap-3 mb-6">
                <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-mono text-zinc-400 border border-white/5">
                  {(result.score * 100).toFixed(1)}% CONFIDENCE
                </span>
              </div>

              <div className="p-6 bg-black/60 rounded-3xl border border-white/5 mb-8">
                <p className="text-sm font-light leading-relaxed italic text-zinc-300">"{result.reason}"</p>
              </div>

              <button 
                onClick={() => setShowModal(false)}
                className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-zinc-200 transition-colors uppercase tracking-widest text-xs"
              >
                Close Analysis
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


