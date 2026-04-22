import React, { useState, useRef } from 'react';
import { RefreshCw, Users, ShieldCheck, ShieldAlert, Upload, Search, Fingerprint, Trash2 } from 'lucide-react';
import { batchIdentify } from '../lib/gemini';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function FaceRecognition() {
  const [refs, setRefs] = useState<(string | null)[]>([null, null, null]);
  const [probe, setProbe] = useState<string | null>(null);
  const [identifying, setIdentifying] = useState(false);
  const [result, setResult] = useState<{ matchIndex: number | null; score: number; reason: string } | null>(null);

  const handleUpload = (index: number | 'probe') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const res = event.target?.result as string;
        if (index === 'probe') {
          setProbe(res);
        } else {
          const newRefs = [...refs];
          newRefs[index] = res;
          setRefs(newRefs);
        }
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const runIdentification = async () => {
    const validRefs = refs.filter((r): r is string => r !== null);
    if (!probe || validRefs.length === 0) return;

    setIdentifying(true);
    setResult(null);
    try {
      const data = await batchIdentify(probe, validRefs);
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIdentifying(false);
    }
  };

  const clearAll = () => {
    setRefs([null, null, null]);
    setProbe(null);
    setResult(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Fingerprint className="w-8 h-8 text-orange-500" />
            1:N Identity Search
          </h2>
          <p className="text-zinc-500 font-light mt-1">Identify a subject from a gallery of reference images.</p>
        </div>
        <button 
          onClick={clearAll}
          className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-red-400 transition-colors uppercase tracking-widest flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" /> Reset Workspace
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Gallery / References */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-[0.2em]">Reference Gallery (Up to 3)</h3>
            <span className="text-[10px] font-mono text-zinc-600 italic">Upload candidates for comparison</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {refs.map((ref, i) => (
              <RefSlot 
                key={i} 
                image={ref} 
                id={i + 1}
                highlight={result?.matchIndex === (i + 1)}
                onUpload={handleUpload(i)} 
              />
            ))}
          </div>
        </div>

        {/* Target / Probe */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-[0.2em]">Identity Probe</h3>
          </div>
          <ProbeSlot 
            image={probe} 
            onUpload={handleUpload('probe')} 
          />
        </div>
      </div>

      <div className="flex flex-col items-center justify-center pt-8 border-t border-zinc-900">
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "p-10 rounded-[3rem] text-center max-w-2xl w-full border-2 transition-all duration-500",
                result.matchIndex ? "border-blue-500/30 bg-blue-500/5 text-blue-400" : "border-red-500/30 bg-red-500/5 text-red-400"
              )}
            >
              <div className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl",
                result.matchIndex ? "bg-blue-500 text-black shadow-blue-500/20" : "bg-red-500 text-black shadow-red-500/20"
              )}>
                {result.matchIndex ? <ShieldCheck className="w-10 h-10" /> : <ShieldAlert className="w-10 h-10" />}
              </div>
              
              <h3 className="text-3xl font-black mb-2 tracking-tighter">
                {result.matchIndex ? `MATCH DETECTED: SUBJECT ${result.matchIndex}` : "NO IDENTITY MATCH"}
              </h3>
              <p className="text-2xl font-mono mb-6">{(result.score * 100).toFixed(1)}% Confidence Rating</p>
              
              <div className="p-4 bg-black/40 rounded-2xl border border-white/5 mb-8">
                <p className="text-sm font-light leading-relaxed italic text-zinc-300">"{result.reason}"</p>
              </div>

              <button 
                onClick={() => setResult(null)}
                className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white font-bold transition-all text-sm uppercase tracking-widest"
              >
                New Search
              </button>
            </motion.div>
          ) : (
            <button
              onClick={runIdentification}
              disabled={!probe || refs.every(r => r === null) || identifying}
              className="group flex flex-col items-center"
            >
              <div className={cn(
                "w-28 h-28 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                (!probe || refs.every(r => r === null)) 
                  ? "border-zinc-800 text-zinc-700" 
                  : "border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-black shadow-2xl hover:shadow-orange-500/40 scale-110"
              )}>
                {identifying ? <RefreshCw className="w-12 h-12 animate-spin" /> : <Search className="w-12 h-12" />}
              </div>
              <p className={cn(
                "mt-6 font-bold font-mono tracking-[0.3em] text-xs transition-colors",
                (!probe || refs.every(r => r === null)) ? "text-zinc-700" : "text-zinc-400 group-hover:text-white"
              )}>
                {identifying ? "PROCESSING NEURAL SCAN" : "INITIATE IDENTITY SEARCH"}
              </p>
            </button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface RefSlotProps {
  image: string | null;
  id: number;
  highlight?: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const RefSlot: React.FC<RefSlotProps> = ({ image, id, onUpload, highlight }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  
  return (
    <div 
      onClick={() => inputRef.current?.click()}
      className={cn(
        "aspect-square rounded-[2rem] border-2 overflow-hidden flex flex-col items-center justify-center cursor-pointer transition-all duration-500 relative group",
        image 
          ? highlight ? "border-blue-500 bg-blue-500/10 scale-105 z-10 shadow-2xl" : "border-zinc-800 bg-zinc-950" 
          : "border-zinc-800 border-dashed bg-zinc-900/50 hover:bg-zinc-800/80 hover:border-zinc-700"
      )}
    >
      <div className="absolute top-4 left-4 w-6 h-6 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-[10px] font-mono font-bold text-zinc-400 z-10 border border-white/10">
        0{id}
      </div>

      {image ? (
        <img src={image} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" alt="Reference" />
      ) : (
        <div className="text-center">
          <Upload className="w-8 h-8 text-zinc-700 mb-2 mx-auto group-hover:text-zinc-500 transition-colors" />
          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Add Ref</p>
        </div>
      )}
      <input type="file" ref={inputRef} onChange={onUpload} className="hidden" accept="image/*" />
    </div>
  );
};

interface ProbeSlotProps {
  image: string | null;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ProbeSlot: React.FC<ProbeSlotProps> = ({ image, onUpload }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  
  return (
    <div 
      onClick={() => inputRef.current?.click()}
      className={cn(
        "aspect-square rounded-[3rem] border-2 border-orange-500/20 bg-zinc-900/50 overflow-hidden flex flex-col items-center justify-center cursor-pointer transition-all duration-500 relative group",
        image ? "border-orange-500 shadow-[0_0_50px_rgba(249,115,22,0.1)]" : "border-zinc-800 border-dashed hover:border-orange-500/50"
      )}
    >
      <div className="absolute top-4 right-4 text-orange-500 z-10">
        <Fingerprint className="w-5 h-5" />
      </div>

      {image ? (
        <img src={image} className="w-full h-full object-cover" alt="Probe" />
      ) : (
        <div className="text-center">
          <Users className="w-10 h-10 text-orange-500/40 mb-3 mx-auto group-hover:text-orange-500 transition-colors" />
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em]">Target Sample</p>
        </div>
      )}
      <input type="file" ref={inputRef} onChange={onUpload} className="hidden" accept="image/*" />
    </div>
  );
};
