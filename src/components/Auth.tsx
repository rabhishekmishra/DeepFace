import { signInWithPopup, browserPopupRedirectResolver } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { motion } from "motion/react";
import { LogIn } from "lucide-react";

export default function Auth() {
  const handleLogin = async () => {
    try {
      // Using explicit resolver helps with "Pending promise was never set" errors in some environments
      await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-10 rounded-[2.5rem] bg-zinc-900 border border-zinc-800 text-center"
      >
        <div className="w-20 h-20 bg-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-3 shadow-2xl shadow-orange-500/20">
          <LogIn className="w-10 h-10 text-black" />
        </div>
        <h2 className="text-3xl font-bold mb-4">Welcome Back</h2>
        <p className="text-zinc-400 mb-10 font-light">Access your facial analysis dashboard and history.</p>
        
        <button
          onClick={handleLogin}
          className="w-full py-4 px-6 bg-white text-black rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all active:scale-95"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
          Continue with Google
        </button>
        
        <p className="mt-8 text-xs text-zinc-500">
          By continuing, you agree to Visionary AI's Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}
