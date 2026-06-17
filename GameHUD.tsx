import { ShootingMode } from '../types';
import { Target, Heart, Crosshair, AlertTriangle } from 'lucide-react';

interface GameHUDProps {
  score: number;
  timeLeft: number;
  lives: number;
  maxLives: number;
  streak: number;
  totalShots: number;
  shootingMode: ShootingMode;
  onQuit: () => void;
  webcamActive: boolean;
}

export default function GameHUD({
  score,
  timeLeft,
  lives,
  maxLives,
  streak,
  totalShots,
  shootingMode,
  onQuit,
  webcamActive,
}: GameHUDProps) {
  
  // Format score with padded zeros
  const formattedScore = score.toString().padStart(6, '0');

  return (
    <div className="absolute top-0 left-0 right-0 z-50 bg-black/90 border-b-8 border-nes-green p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-6 font-mono uppercase text-white selection:bg-[#ff0000] select-none">
      
      {/* HUD left: Score and streak multipliers in brutalist blocks */}
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-center md:items-start">
          <span className="text-[10px] text-zinc-400 mb-1 tracking-wider">SCORE</span>
          <span className="text-2xl md:text-3xl tracking-widest text-[#63adff] font-extrabold leading-none">
            {formattedScore}
          </span>
        </div>

        {streak > 1 && (
          <div className="bg-nes-sky text-black border-2 border-black px-2.5 py-1 font-black animate-pulse flex items-center gap-1 shadow-[3px_3px_0px_#fff]">
            <span className="text-[8px] font-bold">STREAK:</span>
            <span className="text-[10px] font-black">X{streak}</span>
          </div>
        )}
      </div>

      {/* HUD center: Timer and lives represented by pure retro boxes from the spec */}
      <div className="flex items-center gap-8 md:gap-12">
        
        {/* Retro time counter styled in bold monospaced */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-zinc-400 mb-1 tracking-wider">TIME</span>
          <span className={`text-2xl md:text-3xl tracking-widest font-extrabold leading-none ${
            timeLeft <= 10 ? 'text-nes-red animate-pulse' : 'text-white'
          }`}>
            {timeLeft}S
          </span>
        </div>

        {/* Lives represented by the brutalist pixel boxes instead of icons! */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-zinc-400 mb-1 tracking-wider">LIVES</span>
          <div className="flex space-x-2">
            {Array.from({ length: maxLives }).map((_, idx) => (
              <div
                key={idx}
                className={`w-5 h-5 border-2 transition-all ${
                  idx < lives 
                    ? 'bg-nes-red border-white shadow-[2px_2px_0px_rgba(0,0,0,1)]' 
                    : 'bg-zinc-800 border-zinc-950'
                }`}
              />
            ))}
          </div>
        </div>

      </div>

      {/* HUD right: Controls & active shooter mode badge + END GAME trigger */}
      <div className="flex items-center gap-4">
        
        {/* Active control tracking badge */}
        <div className="hidden lg:flex flex-col items-end text-right">
          <span className="text-[8px] text-zinc-500 font-bold mb-0.5">SIGHT:</span>
          <span className="text-[9px] text-nes-sky font-black tracking-wider uppercase flex items-center gap-1 bg-zinc-950 px-2 py-0.5 border border-zinc-800">
            <Crosshair className="w-3 h-3 text-nes-sky" /> {webcamActive ? `${shootingMode}` : 'MOUSE'}
          </span>
        </div>

        {/* End Game Brutalist clicker */}
        <button
          onClick={onQuit}
          id="quit-btn"
          className="bg-nes-red border-4 border-white px-6 py-2.5 text-xs font-black hover:bg-black hover:text-nes-red transition-all active:translate-y-1 cursor-pointer leading-none uppercase shadow-[4px_4px_0px_#000]"
        >
          END GAME
        </button>
      </div>

    </div>
  );
}
