import { motion } from 'motion/react';
import { Camera, Shield, Zap, Target } from 'lucide-react';

export default function Landing({ onStart }: { onStart: () => void }) {
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-black selection:bg-orange-500 selection:text-white">
      {/* Background Gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-900/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full" />
      </div>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-20 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl"
        >
          <h1 className="text-6xl md:text-9xl font-black tracking-tighter leading-none mb-6">
            VISIONARY <span className="text-orange-500">AI</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 font-light mb-10 max-w-2xl mx-auto leading-relaxed">
            Advanced facial analysis, verification, and emotional intelligence powered by next-generation neural networks.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onStart}
              className="px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-full font-semibold transition-all transform hover:scale-105 active:scale-95"
            >
              Get Started for Free
            </button>
            <button className="px-8 py-4 border border-white/10 hover:bg-white/5 text-white rounded-full font-semibold transition-all">
              View Documentation
            </button>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-6 md:px-20 pb-32 max-w-7xl mx-auto w-full relative z-10">
        {[
          { icon: Camera, title: "Face Analysis", desc: "Analyze real-time emotional states and facial expressions with high precision." },
          { icon: Target, title: "Face Verification", desc: "Compare two faces to verify identity with detailed confidence scores." },
          { icon: Zap, title: "Real-time Processing", desc: "Leverage lightning-fast inference for instant results from webcam or upload." },
          { icon: Shield, title: "Secure History", desc: "Automatically track and encrypt your analysis history for future reference." }
        ].map((feat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-orange-500/50 transition-colors group"
          >
            <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-6 border border-orange-500/20 group-hover:bg-orange-500 group-hover:text-black transition-all">
              <feat.icon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">{feat.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{feat.desc}</p>
          </motion.div>
        ))}
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-white/5 px-10 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
        <p>© 2026 Visionary AI Labs. All rights reserved.</p>
        <div className="flex gap-8 mt-4 md:mt-0">
          <a href="#" className="hover:text-white">Privacy</a>
          <a href="#" className="hover:text-white">Terms</a>
          <a href="#" className="hover:text-white">GitHub</a>
        </div>
      </footer>
    </div>
  );
}
