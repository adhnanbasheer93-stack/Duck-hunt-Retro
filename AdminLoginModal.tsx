import React, { useState } from 'react';
import { Shield, KeyRound, Chrome, X, CheckCircle, AlertTriangle } from 'lucide-react';

interface AdminLoginModalProps {
  onClose: () => void;
  onGoogleSignIn: () => Promise<void>;
  onPasscodeSignIn: (passcode: string) => boolean;
}

export default function AdminLoginModal({ onClose, onGoogleSignIn, onPasscodeSignIn }: AdminLoginModalProps) {
  const [usePasscode, setUsePasscode] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!passcode.trim()) {
      setErrorMsg("KEYWORD CELL CANNOT BE EMPTY.");
      return;
    }

    const success = onPasscodeSignIn(passcode);
    if (success) {
      onClose();
    } else {
      setErrorMsg("ACCESS DENIED: KEY DECRYPTION FAILURE.");
      setPasscode('');
    }
  };

  const handleGoogleClick = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await onGoogleSignIn();
      // App.tsx handles onAuthStateChanged and will close/refresh accordingly
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
      <div className="w-full max-w-md bg-[#0e1118] border-4 border-[#ff2e2e] p-6 shadow-[8px_8px_0px_#000000] relative my-auto">
        
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
          Sector level clearance is required to verify write privileges and prune active leaderboard scores. Authorized administrator endpoint for <strong className="text-white">adhnanbasheer93@gmail.com</strong>.
        </div>

        {errorMsg && (
          <div className="mb-4 p-2 bg-[#220000] border-2 border-[#ff2e2e] text-[#ff2e2e] text-[8px] tracking-wider leading-relaxed">
            ⚠️ ERROR: {errorMsg}
          </div>
        )}

        {!usePasscode ? (
          /* Main Choice Screen */
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
            <div className="text-[7.5px] text-zinc-500 normal-case leading-normal p-2 bg-zinc-950 border border-zinc-900 rounded-none mb-2">
              <span className="text-[#ff2e2e] uppercase font-bold">⚠️ Sandbox Notice:</span> Google Auth popups may be blocked inside the AI Studio preview iframe. If the widget fails, please click the <strong className="text-sky-400">"Open in new tab"</strong> button at the top right of your screen to log in, or use the simulator passcode option below.
            </div>

            <div className="text-center py-1 text-[8px] text-zinc-650">
              — OR CHOOSE ALTERNATIVE METHOD —
            </div>

            {/* Passcode Trigger Button */}
            <button
              onClick={() => setUsePasscode(true)}
              className="w-full bg-[#1c2331] hover:bg-zinc-800 text-zinc-300 hover:text-white border-2 border-zinc-700 p-2 text-[9px] font-black flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>ENTER DEVELOPER PASSCODE</span>
            </button>

          </div>
        ) : (
          /* Passcode Input Screen */
          <form onSubmit={handlePasscodeSubmit} className="space-y-4">
            
            <div className="space-y-2">
              <label className="block text-[9px] text-zinc-400 font-bold">
                ENTER ACCESS PASSCODE KEY:
              </label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                autoFocus
                placeholder="••••••••••••••"
                className="w-full bg-black border-2 border-zinc-800 focus:border-[#ff2e2e] px-3 py-2 text-xs font-mono text-center text-yellow-400 tracking-widest outline-none uppercase"
              />
            </div>

            {/* Notice what the passcode is */}
            <div className="p-2 bg-yellow-950/20 border border-yellow-800/60 text-yellow-500 text-[7.5px] leading-relaxed normal-case">
              💡 <strong className="uppercase">Local Passcode Option:</strong> Use the developer override passcode <code className="bg-black px-1 text-white font-bold font-mono text-[8px]">duckhuntadmin</code> to simulate authorization locally in the sandbox preview.
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setUsePasscode(false);
                  setErrorMsg(null);
                }}
                className="flex-1 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 py-2 text-[9px] font-bold cursor-pointer transition-colors"
              >
                GO BACK
              </button>
              <button
                type="submit"
                className="flex-1 bg-[#ff2e2e] text-black hover:bg-[#ff5252] border-2 border-black py-2 text-[9px] font-black cursor-pointer shadow-[2px_2px_0px_#000] transition-colors"
              >
                CHECK KEY
              </button>
            </div>

          </form>
        )}

        {/* Modal Footer warning */}
        <div className="mt-5 pt-3 border-t border-zinc-900 flex justify-between items-center text-[6px] text-zinc-650 tracking-wider">
          <span>PORT STATUS: VERIFIED v1.0.4</span>
          <span>ADMINISTRATIVE PORT ONLY</span>
        </div>

      </div>
    </div>
  );
}
