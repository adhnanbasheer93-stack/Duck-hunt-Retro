import React, { useState } from 'react';
import { Shield, Chrome, X } from 'lucide-react';

interface AdminLoginModalProps {
  onClose: () => void;
  onGoogleSignIn: () => Promise<void>;
}

export default function AdminLoginModal({ onClose, onGoogleSignIn }: AdminLoginModalProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleClick = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await onGoogleSignIn();
      // App.tsx handles state updates and closing
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "GOOGLE AUTHENTICATION FAILED.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      id="admin-login-overlay" 
      className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-start md:justify-center p-4 font-mono uppercase text-white overflow-y-auto"
    >
      <div className="w-full max-w-md bg-[#0e1118] border-4 border-[#ff2e2e] p-6 shadow-[8px_8px_0px_#000000] relative my-auto animate-fadeIn">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-zinc-500 hover:text-white border-2 border-zinc-800 hover:border-zinc-500 p-1 bg-black/40 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 border-b-2 border-zinc-800 pb-3 mb-4">
          <Shield className="w-5 h-5 text-[#ff2e2e] animate-pulse" />
          <h3 className="text-sm font-black text-white tracking-wider">
            SECURITY CHECKPOINT CONSOLE
          </h3>
        </div>

        {/* Info */}
        <div className="text-[8px] text-zinc-400 normal-case mb-4 leading-relaxed font-mono">
          Sector-level clearance is required to verify write privileges and prune active leaderboard scores. Authentic admin status is verified server-side through Firebase OAuth token authentication.
        </div>

        {errorMsg && (
          <div className="mb-4 p-2 bg-[#220000] border-2 border-[#ff2e2e] text-[#ff2e2e] text-[8px] tracking-wider leading-relaxed">
            ⚠️ ERROR: {errorMsg}
          </div>
        )}

        <div className="space-y-3">
          {/* Google Login Button */}
          <button
            onClick={handleGoogleClick}
            disabled={loading}
            className="w-full bg-[#1a73e8] hover:bg-blue-500 text-white border-2 border-black p-3 text-[10px] font-black flex items-center justify-center gap-2 cursor-pointer shadow-[3px_3px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-transform disabled:opacity-50"
          >
            <Chrome className="w-4 h-4 shrink-0" />
            <span>{loading ? "AUTHENTICATING..." : "SIGN IN WITH GOOGLE"}</span>
          </button>

          {/* Warn user about iframes */}
          <div className="text-[7.5px] text-zinc-500 normal-case leading-normal p-2 bg-zinc-950 border border-zinc-900 rounded-none">
            <span className="text-[#ff2e2e] uppercase font-bold">⚠️ Sandbox Notice:</span> Google Auth popups may be blocked inside the AI Studio preview iframe. If the login popup is suppressed, please click the <strong className="text-sky-400">"Open in new tab"</strong> button at the top right of your screen to ensure successful authentication of your administrator session.
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-5 pt-3 border-t border-zinc-900 flex justify-between items-center text-[6px] text-zinc-650 tracking-wider">
          <span>SECURE PROTOCOL v1.4</span>
          <span>ADMIN AUTH LEVEL 1</span>
        </div>

      </div>
    </div>
  );
}
