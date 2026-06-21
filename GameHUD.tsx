import { ShootingMode } from '../types';
import { Crosshair } from 'lucide-react';

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
  onQuit,
  shootingMode,
  webcamActive,
}: GameHUDProps) {
  
  // Format score with padded zeros
  const formattedScore = score.toString().padStart(6, '0');

  return (
    <div id="game-status-hud" className="absolute top-0 left-0 right-0 z-50 bg-black/95 border-b-4 md:border-b-8 border-nes-green p-2 md:p-6 flex flex-row items-center justify-between gap-2 md:gap-6 font-mono uppercase text-white selection:bg-[#ff0000] select-none">
      
      {/* HUD left: Score and streak multipliers in brutalist blocks */}
      <div className="flex items-center gap-2 md:gap-6">
        <div className="flex flex-col items-start">
          <span className="text-[7px] md:text-[10px] text-zinc-400 mb-0.5 tracking-wider font-extrabold">SCORE</span>
          <span className="text-sm md:text-3xl tracking-widest text-[#63adff] font-extrabold leading-none">
            {formattedScore}
          </span>
        </div>

        {streak > 1 && (
          <div className="bg-nes-sky text-black border border-black md:border-2 px-1 py-0.5 md:px-2.5 md:py-1 font-black animate-pulse flex items-center gap-0.5 md:gap-1 shadow-[2px_2px_0px_#fff]">
            <span className="text-[6px] md:text-[8px] font-bold">STREAK:</span>
            <span className="text-[8px] md:text-[10px] font-black">X{streak}</span>
          </div>
        )}
      </div>

      {/* HUD center: Timer and lives represented by pure retro boxes */}
      <div className="flex items-center gap-3 sm:gap-6 md:gap-12">
        
        {/* Retro time counter */}
        <div className="flex flex-col items-center">
          <span className="text-[7px] md:text-[10px] text-zinc-400 mb-0.5 tracking-wider font-extrabold">TIME</span>
          <span className={`text-sm md:text-3xl tracking-widest font-extrabold leading-none ${
            timeLeft <= 10 ? 'text-nes-red animate-pulse' : 'text-white'
          }`}>
            {timeLeft}S
          </span>
        </div>

        {/* Lives represented by the brutalist pixel boxes instead of icons */}
        <div className="flex flex-col items-center">
          <span className="text-[7px] md:text-[10px] text-zinc-400 mb-0.5 tracking-wider font-extrabold">LIVES</span>
          <div className="flex space-x-1 md:space-x-2">
            {Array.from({ length: maxLives }).map((_, idx) => (
              <div
                key={idx}
                className={`w-3.5 h-3.5 md:w-5 md:h-5 border md:border-2 transition-all ${
                  idx < lives 
                    ? 'bg-nes-red border-white shadow-[1px_1px_0px_rgba(0,0,0,1)]' 
                    : 'bg-zinc-800 border-zinc-950'
                }`}
              />
            ))}
          </div>
        </div>

      </div>

      {/* HUD right: Controls & active shooter mode badge + END GAME trigger */}
      <div className="flex items-center gap-2 md:gap-4 font-extrabold">
        
        {/* Active control tracking badge - hidden on very small screens to fit cleanly */}
        <div className="hidden sm:flex flex-col items-end text-right">
          <span className="text-[6px] md:text-[8px] text-zinc-500 font-bold mb-0.5">SIGHT:</span>
          <span className="text-[7.5px] md:text-[9px] text-nes-sky font-black tracking-wider uppercase flex items-center gap-1 bg-zinc-950 px-1.5 md:px-2 py-0.5 border border-zinc-800">
            <Crosshair className="w-2.5 h-2.5 text-nes-sky" /> {webcamActive ? `${shootingMode}` : 'MOUSE'}
          </span>
        </div>

        {/* End Game Brutalist clicker */}
        <button
          onClick={onQuit}
          id="quit-btn"
          className="bg-nes-red border-2 md:border-4 border-white px-3 py-1.5 md:px-6 md:py-2.5 text-[10px] md:text-xs font-black hover:bg-black hover:text-nes-red transition-all active:translate-y-0.5 cursor-pointer leading-none uppercase shadow-[2px_2px_0px_#000]"
        >
          END GAME
        </button>
      </div>

    </div>
  );
}
