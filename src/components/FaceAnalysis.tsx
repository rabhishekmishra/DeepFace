import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, RefreshCw, AlertCircle, Info, Zap, Sparkles, Video, SwitchCamera, UserCheck, ShieldCheck } from 'lucide-react';
import { analyzeFace, FaceAnalysisResult, KNOWN_INDIVIDUALS } from '../lib/gemini';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const SAMPLE_IMAGES = [
  ...KNOWN_INDIVIDUALS.map(k => ({ name: k.name, url: k.refUrl })),
];

export default function FaceAnalysis() {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<FaceAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [highPrecision, setHighPrecision] = useState(true);
  const [runRecognition, setRunRecognition] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    setImage(null);
    setResult(null);
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError("Camera access denied or unavailable.");
      setIsCameraOpen(false);
    }
  };

  const captureAndAnalyze = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setImage(dataUrl);
      stopCamera();
      
      // Execute analysis directly with the captured data
      setAnalyzing(true);
      setError(null);
      try {
        const analysisJson = await analyzeFace(dataUrl, runRecognition);
        setResult(analysisJson);
        if (auth.currentUser) {
          await addDoc(collection(db, 'analyses'), {
            userId: auth.currentUser.uid,
            imageUrl: dataUrl,
            results: analysisJson,
            recognitionMode: runRecognition,
            createdAt: serverTimestamp()
          });
        }
      } catch (err: any) {
        setError(err.message || "Failed to analyze face");
      } finally {
        setAnalyzing(false);
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const useSample = (url: string) => {
    setImage(url);
    setResult(null);
    setError(null);
  };

  const runAnalysis = async () => {
    if (!image) return;
    setAnalyzing(true);
    setError(null);
    try {
      let imageData = image;
      
      // If it's a URL (not data:), we need to proxy or convert it.
      // Since fetch might hit CORS, let's try a workaround or inform the user.
      // For now, let's attempt to fetch it.
      if (image.startsWith('http')) {
        try {
          const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(image)}`;
          const response = await fetch(proxyUrl);
          const blob = await response.blob();
          imageData = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          console.warn("External image fetch failed, sending URL to AI (might fail)", e);
        }
      }

      const analysisJson = await analyzeFace(imageData, runRecognition);
      setResult(analysisJson);
      
      if (auth.currentUser) {
        await addDoc(collection(db, 'analyses'), {
          userId: auth.currentUser.uid,
          imageUrl: image,
          results: analysisJson,
          recognitionMode: runRecognition,
          createdAt: serverTimestamp()
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to analyze face");
    } finally {
      setAnalyzing(false);
    }
  };

  const clear = () => {
    stopCamera();
    setImage(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Face Analysis & Recognition</h2>
          <p className="text-zinc-500 font-light mt-1">Biometric profiling and identity verification suite.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Recognition Toggle */}
          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl">
             <UserCheck className={cn("w-4 h-4 transition-colors", runRecognition ? "text-blue-500" : "text-zinc-600")} />
             <span className="text-xs font-bold text-zinc-400">Recognition</span>
             <button 
              onClick={() => setRunRecognition(!runRecognition)}
              className={cn(
                "w-8 h-4 rounded-full relative transition-colors ml-2",
                runRecognition ? "bg-blue-500" : "bg-zinc-700"
              )}
             >
                <div className={cn("absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all", runRecognition ? "left-4.5" : "left-0.5")} />
             </button>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl">
             <Zap className={cn("w-4 h-4 transition-colors", highPrecision ? "text-orange-500" : "text-zinc-600")} />
             <span className="text-xs font-bold text-zinc-400">High Precision</span>
             <button 
              onClick={() => setHighPrecision(!highPrecision)}
              className={cn(
                "w-8 h-4 rounded-full relative transition-colors ml-2",
                highPrecision ? "bg-orange-500" : "bg-zinc-700"
              )}
             >
                <div className={cn("absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all", highPrecision ? "left-4.5" : "left-0.5")} />
             </button>
          </div>
          <button 
            onClick={clear}
            className="px-6 py-2 border border-zinc-800 rounded-xl text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            Clear
          </button>
          {!result && image && (
            <button 
              onClick={runAnalysis}
              disabled={analyzing}
              className="px-6 py-2 bg-orange-500 text-black rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-orange-600 disabled:opacity-50 transition-all shadow-lg shadow-orange-500/20"
            >
              {analyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {analyzing ? "Synthesizing..." : "Analyze & Recognize"}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Workspace */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative aspect-video bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden flex items-center justify-center group">
            {isCameraOpen ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
                <button 
                  onClick={captureAndAnalyze}
                  disabled={analyzing}
                  className="absolute bottom-6 px-10 py-4 bg-orange-500 text-black rounded-full font-bold flex items-center gap-3 shadow-2xl hover:scale-105 active:scale-95 transition-all shadow-orange-500/40"
                >
                  {analyzing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  {analyzing ? "Processing..." : "Capture & Recognize"}
                </button>
                <canvas ref={canvasRef} className="hidden" />
              </div>
            ) : image ? (
              <div className="relative w-full h-full flex items-center justify-center p-4">
                <img 
                  ref={imageRef}
                  src={image} 
                  className="max-w-full max-h-full object-contain shadow-2xl rounded-xl"
                  alt="Source"
                />
                
                {/* Bounding Boxes */}
                {result?.faces.map((face, i) => {
                  if (!imageRef.current) return null;
                  const [ymin, xmin, ymax, xmax] = face.box2d;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={cn(
                        "absolute border-2 rounded-lg pointer-events-none transition-colors",
                        face.identity ? "border-blue-500" : "border-orange-500"
                      )}
                      style={{
                        top: `${ymin / 10}%`,
                        left: `${xmin / 10}%`,
                        width: `${(xmax - xmin) / 10}%`,
                        height: `${(ymax - ymin) / 10}%`,
                      }}
                    >
                      <div className={cn(
                        "absolute -top-6 left-0 text-black text-[10px] px-2 py-0.5 font-bold whitespace-nowrap rounded-t-sm",
                        face.identity ? "bg-blue-500" : "bg-orange-500"
                      )}>
                        {face.identity ? `ID: ${face.identity.name.toUpperCase()}` : `FACE ${i + 1} • ${face.emotion.toUpperCase()}`}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center p-12">
                <div className="flex justify-center gap-6 mb-8">
                  <div className="text-center group cursor-pointer" onClick={startCamera}>
                    <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-500 group-hover:text-black transition-colors">
                      <Video className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-bold text-zinc-400 group-hover:text-white transition-colors">Live Camera</p>
                  </div>
                  <div className="text-center group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-500 group-hover:text-black transition-colors">
                      <Upload className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-bold text-zinc-400 group-hover:text-white transition-colors">Upload Image</p>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold mb-2">Initialize Biometric Feed</h3>
                <p className="text-zinc-500 text-sm max-w-xs mx-auto mb-8">Select a detection source to begin extraction of biometric and identity metadata.</p>

                <div className="flex flex-col items-center">
                  <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-3">System Calibration Gallery</p>
                  <div className="flex gap-2">
                    {SAMPLE_IMAGES.map((sample, i) => (
                      <button 
                        key={i}
                        onClick={() => useSample(sample.url)}
                        className="w-12 h-12 rounded-xl overflow-hidden border border-zinc-800 hover:border-orange-500 transition-colors group relative"
                      >
                        <img src={sample.url} className="w-full h-full object-cover" alt={sample.name} />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-[8px] font-bold text-white text-center px-1">{sample.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleUpload} 
                  className="hidden" 
                  accept="image/*"
                />
              </div>
            )}
            
            {analyzing && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-4" />
                <p className="text-lg font-bold tracking-widest text-orange-500 animate-pulse uppercase">Scanning {runRecognition ? 'Identities' : 'Biometrics'}</p>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold font-mono tracking-widest text-zinc-500 uppercase">Analysis Engine</h3>
              <Info className="w-4 h-4 text-zinc-600" />
            </div>

            <AnimatePresence mode="wait">
              {result ? (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  {result.detected ? (
                    result.faces.map((face, i) => (
                      <div key={i} className="space-y-4 p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                        <div className="flex items-center justify-between">
                          <span className={cn(
                            "text-xs font-bold font-mono px-2 py-1 rounded",
                            face.identity ? "text-blue-500 bg-blue-500/10" : "text-orange-500 bg-orange-500/10"
                          )}>
                            {face.identity ? "IDENTITY CONFIRMED" : `FACE #${i+1}`}
                          </span>
                          <span className="text-xs text-zinc-500">{(face.confidence * 100).toFixed(1)}% scan quality</span>
                        </div>

                        {face.identity && (
                           <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-2">
                             <div className="flex items-center gap-2">
                               <ShieldCheck className="w-4 h-4 text-blue-500" />
                               <span className="text-sm font-bold text-white">{face.identity.name}</span>
                             </div>
                             <div className="flex justify-between items-center text-[10px] uppercase font-bold text-zinc-500">
                               <span>Security Match Rating</span>
                               <span className="text-blue-500 font-mono">{(face.identity.confidence * 100).toFixed(0)}%</span>
                             </div>
                             <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${face.identity.confidence * 100}%` }}
                                  className="h-full bg-blue-500"
                                />
                             </div>
                           </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4">
                          <DataField label="Age" value={`${face.age} yrs`} />
                          <DataField label="Gender" value={face.gender} />
                          <DataField label="dominant Race" value={face.race} />
                          <DataField label="Primary State" value={face.emotion} />
                        </div>

                        {/* Emotion Breakdown Gauges */}
                        {face.emotionBreakdown && (
                          <div className="pt-4 border-t border-zinc-800/50 space-y-3">
                            <p className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider">Afective Sentiment Mapping</p>
                            <div className="space-y-2">
                              {Object.entries(face.emotionBreakdown).map(([emotion, value]) => {
                                const val = value as number;
                                return (
                                  <div key={emotion} className="space-y-1">
                                    <div className="flex justify-between text-[10px] uppercase font-bold">
                                      <span className={cn(face.emotion.toLowerCase() === emotion ? "text-orange-500" : "text-zinc-500")}>
                                        {emotion}
                                      </span>
                                      <span className="text-zinc-600 font-mono">{(val * 100).toFixed(0)}%</span>
                                    </div>
                                    <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                                      <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${val * 100}%` }}
                                        className={cn(
                                          "h-full rounded-full transition-all",
                                          face.emotion.toLowerCase() === emotion ? "bg-orange-500" : "bg-zinc-700"
                                        )}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        <div className="pt-4 border-t border-zinc-800/50">
                          <p className="text-[10px] font-mono uppercase text-zinc-500 mb-1">Visual Feature Summary</p>
                          <p className="text-sm text-zinc-300 font-light leading-relaxed italic">"{face.summary}"</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20">
                      <p className="text-zinc-500 italic">No faces detected in image.</p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center opacity-30 select-none">
                  <DatabaseIcon className="w-12 h-12 mb-4" />
                  <p className="text-sm font-mono uppercase tracking-widest">Awaiting Biometric String</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function DataField({ label, value }: { label: string, value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-mono uppercase text-zinc-600 tracking-tighter">{label}</p>
      <p className="text-lg font-bold text-white capitalize">{value}</p>
    </div>
  );
}

function DatabaseIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 2v20M2 12h20" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}
