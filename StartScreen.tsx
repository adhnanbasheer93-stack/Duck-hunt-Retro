import { GameSettings, ShootingMode, HighScore } from '../types';
import { Camera, Gamepad2, Volume2, VolumeX, Trophy, Target } from 'lucide-react';
import { useState, useEffect } from 'react';

interface StartScreenProps {
  settings: GameSettings;
  onChangeSettings: (settings: GameSettings) => void;
  onStartGame: () => void;
  highScores: HighScore[];
  webcamActive: boolean;
  onToggleWebcam: () => void;
  hasTriedCamera: boolean;
  cameraError: string | null;
  isAdmin: boolean;
  onOpenDashboard: () => void;
  onLogin: () => void;
}

// Retro 8-bit classic Duck Hunt duck pixel map (16x13)
// G: green head, Y: yellow beak, K: black eye/feather, W: white neck, R: red chest, B: brown wings, O: orange feet, _: space
const duckMap = [
  "____GGGGG_______",
  "___GGGGGGGG_____",
  "___KGGYYGG______",
  "____GYYYY_______",
  "_____WWW________",
  "___RRRRRRR______",
  "__RRRRRRRRR_____",
  "_BBBBBBBBBBB____",
  "KBBBBBBBBBBBBK__",
  "_KKKKKKKK_KKK___",
  "___OO___OO______",
  "___OO___OO______",
];

const colorPalette: Record<string, string> = {
  'G': '#1db531', // Bright Green
  'Y': '#fc9803', // Yellow-gold
  'K': '#000000', // Black
  'W': '#ffffff', // White
  'R': '#7d2402', // Dark Red/Rust
  'B': '#ab6c2b', // Light Brown
  'O': '#f06400', // Orange feet
  '_': 'transparent'
};

export default function StartScreen({
  settings,
  onChangeSettings,
  onStartGame,
  highScores,
  webcamActive,
  onToggleWebcam,
  hasTriedCamera,
  cameraError,
  isAdmin,
  onOpenDashboard,
  onLogin,
}: StartScreenProps) {
  const [activeTab, setActiveTab] = useState<'GAME' | 'LEADERBOARD'>('GAME');
  const [flapState, setFlapState] = useState(0);

  // Animate the duck wings flapping on start menu!
  useEffect(() => {
    const inter = setInterval(() => {
      setFlapState((prev) => (prev + 1) % 2);
    }, 280);
    return () => clearInterval(inter);
  }, []);

  const selectGameMode = (mode: 'EASY' | 'NORMAL' | 'HARD') => {
    onChangeSettings({ ...settings, difficulty: mode });
  };

  const handleShootModeToggle = (mode: ShootingMode) => {
    onChangeSettings({ ...settings, shootingMode: mode });
  };

  const toggleSound = () => {
    onChangeSettings({ ...settings, soundEnabled: !settings.soundEnabled });
  };

  return (
    <div id="start-screen-overlay" className="absolute inset-0 z-30 overflow-y-auto flex flex-col items-center justify-start md:justify-center bg-[#000411]/90 p-4 md:p-8 font-mono uppercase text-white select-none">
      
      {/* Outer NES-accurate 3D Style Screen Cabinet */}
      <div className="w-full max-w-3xl bg-[#0a0c10] border-8 border-double border-white p-6 md:p-8 shadow-[16px_16px_0px_#000000] rounded-none animate-fadeIn flex flex-col items-stretch gap-6 my-4 md:my-auto">
        
        {/* Top Header: Retro NES Game Intro screen Layout */}
        <div className="text-center pb-4 border-b-4 border-double border-zinc-800 flex flex-col items-center">
          
          {/* Authentic 3D text styling of the iconic "DUCK HUNT" title */}
          <h1 className="text-5xl md:text-7xl font-sans font-black tracking-widest text-[#ff2e2e] drop-shadow-[4px_4px_0px_#000000] [text-shadow:5px_5px_0px_#fcae1e] animate-pulse">
            DUCK HUNT
          </h1>
          
          <div className="inline-block bg-[#168a2d] border-2 border-white px-3 py-1 text-[9px] md:text-xs font-bold mt-3 tracking-widest text-white shadow-[3px_3px_0px_#000000]">
            SUPREME LIGHT-GUN PORT
          </div>
          
          <p className="text-[7.5px] text-zinc-500 mt-2 font-mono tracking-widest max-w-lg leading-relaxed">
            AIM WITH SCREEN SIGHT MATRIX • OPTIONAL WEBCAM REALISTIC AR GUN DETECTOR MODES
          </p>
        </div>

        {/* Central Display: authentic details + animated pixel duck + retro form options */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch my-1">
          
          {/* Main Left Side: NES Selectors & pointer indicators */}
          <div className="md:col-span-7 flex flex-col justify-between gap-5 md:pr-4 md:border-r border-dashed border-zinc-800">
            <div>
              <div className="text-[9px] text-[#42b6f5] font-extrabold tracking-widest flex items-center gap-1.5 mb-4 border-b border-zinc-900 pb-1.5">
                <Gamepad2 className="w-3.5 h-3.5 text-[#168a2d]" /> [01] CONFIG GAME MATRIX
              </div>

              {/* GAME DIFFICULTY / FLYING VELOCITIES */}
              <div className="mb-4">
                <span className="block text-[8px] text-zinc-400 font-bold mb-2 tracking-widest">
                  &gt; SELECT COMBAT SPEED:
                </span>
                <div className="flex flex-col gap-1.5">
                  {(['EASY', 'NORMAL', 'HARD'] as const).map((diff) => {
                    const isSelected = settings.difficulty === diff;
                    return (
                      <button
                        key={diff}
                        onClick={() => selectGameMode(diff)}
                        className={`flex items-center gap-3 w-full py-1.5 px-3 text-[10px] text-left border-2 rounded-none cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#1e2029] border-white text-yellow-400 font-extrabold shadow-[2px_2px_0px_rgba(255,255,255,0.15)]'
                            : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        <span className="text-yellow-400 text-[11px] font-bold">
                          {isSelected ? '👉' : '   '}
                        </span>
                        <span>SPEED MODIFIER: {diff}</span>
                        {isSelected && <span className="ml-auto text-[7px] bg-[#ff2e2e] text-white px-1 py-0.5 rounded-none animate-pulse">ACTIVE</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SYSTEM CALIBRATION BADGE (Camera Index Touch Style) */}
              <div className="mb-4 border-t-2 border-dotted border-zinc-900 pt-3">
                <span className="block text-[8px] text-zinc-400 font-bold mb-2 tracking-widest">
                  &gt; ACTIVE AIM CONTROL:
                </span>
                <div className="bg-[#121c0e] border-2 border-emerald-950 p-2 text-left">
                  <div className="text-[9px] text-[#22c55e] font-black flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-ping"></span>
                    REAL-TIME INDEX-TOUCH LIGHT-GUN SENSOR
                  </div>
                  <div className="text-[6.5px] text-zinc-400 mt-1 leading-normal font-mono normal-case">
                    Simply point at the screen with your index finger in view of the webcam, and touch/overlap the ducks directly with your index fingertip to shoot them instantly! Touch/mouse inputs have been deactivated to preserve the premium spatial arcade experience.
                  </div>
                </div>
              </div>

              {/* CAMERA CO-PROCESSOR ENABLER */}
              <div className="border-t-2 border-dotted border-zinc-900 pt-3 flex items-center justify-between gap-2.5">
                <div className="flex-1">
                  <div className="text-[9px] text-white font-extrabold flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-zinc-400" /> WEBCAM LIGHT-GUN SENSOR
                  </div>
                  <div className="text-[6.5px] text-zinc-500 mt-0.5 leading-normal font-mono normal-case">
                    Connects webcam for physical light-gun simulation. Track the reticle by pointing and touch ducks directly with your index fingertip to shoot them!
                  </div>
                </div>

                <button
                  onClick={onToggleWebcam}
                  className={`px-3 py-1 text-[8.5px] border-2 rounded-none cursor-pointer transition-all font-black shrink-0 ${
                    webcamActive
                      ? 'bg-[#168a2d] text-white border-white shadow-[2px_2px_0px_rgba(255,255,255,0.25)]'
                      : 'bg-zinc-950 text-zinc-600 border-zinc-900'
                  }`}
                >
                  {webcamActive ? 'SENSOR [ON]' : 'SENSOR [OFF]'}
                </button>
              </div>

            </div>

            {/* SOUND INTEGRATOR BUTTON */}
            <div className="flex justify-between items-center bg-[#020306] p-2.5 border-2 border-dashed border-zinc-800">
              <span className="text-[7.5px] text-zinc-400 font-bold flex items-center gap-2">
                {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400 animate-bounce" /> : <VolumeX className="w-4 h-4 text-[#ff2e2e]" />}
                8-BIT SYNTH AUDIO EFFECTS
              </span>
              <button
                onClick={toggleSound}
                className={`px-2 py-0.5 text-[8px] border-2 rounded-none cursor-pointer transition-all font-black ${
                  settings.soundEnabled ? 'bg-zinc-800 text-white border-white' : 'bg-red-950/20 text-[#ff2e2e] border-[#ff2e2e]'
                }`}
              >
                {settings.soundEnabled ? 'MUTE SOUND' : 'ACTIVATE'}
              </button>
            </div>

          </div>

          {/* Right Side Column: Pixel-Art Duck, Bullet score dictionaries */}
          <div className="md:col-span-5 flex flex-col justify-between gap-4">
            
            {/* The Authentic 8-bit Flapping Duck Profile Display */}
            <div className="bg-[#03050a] border-2 border-zinc-800 p-4 flex flex-col items-center justify-center text-center">
              
              {/* Box frame with Retro CRT vibes */}
              <div className="text-[8px] text-yellow-400 uppercase tracking-wider mb-2 flex items-center gap-1 font-bold">
                <Target className="w-3.5 h-3.5 text-[#42b6f5]" /> MAIN MALLARD SENSING INDEX
              </div>

              {/* Animated HTML Pixel Canvas Simulation of the original NES Mallard duck! */}
              <div className="p-3 bg-[#4286f5] border-4 border-double border-white shadow-[4px_4px_0px_#000] relative w-36 h-32 flex flex-col justify-center items-center overflow-hidden mb-2">
                
                {/* 8-bit clouds simulation backdrop */}
                <div className="absolute top-2 left-2 w-8 h-2.5 bg-white/40 block"></div>
                <div className="absolute top-4 right-4 w-10 h-3 bg-white/40 block"></div>
                
                {/* Pixel Art Duck Grid Renderer */}
                <div className="flex flex-col gap-0 select-none scale-[1.3] origin-center">
                  {duckMap.map((row, rIdx) => {
                    // Slight wings offset for flapping!
                    const isWingRow = rIdx >= 6 && rIdx <= 9;
                    const offsetClass = isWingRow && flapState === 1 ? 'translate-y-px text-right scale-x-95' : '';

                    return (
                      <div key={rIdx} className={`flex gap-0 ${offsetClass}`}>
                        {Array.from(row).map((char, cIdx) => {
                          const pxColor = colorPalette[char] || 'transparent';
                          return (
                            <div
                              key={cIdx}
                              className="w-[3px] h-[3px] shrink-0"
                              style={{ backgroundColor: pxColor }}
                            />
                          );
                        })}
                      </div>
                    );
                  })}
                </div>

                <div className="absolute bottom-1 right-2 text-[6px] tracking-tight text-white font-mono uppercase bg-black/60 px-1 py-0.5 font-bold">
                  FLAP INDICT: OK
                </div>
              </div>

              <div className="space-y-1 text-[7px] text-zinc-400 font-mono text-left w-full">
                <div className="flex items-center justify-between">
                  <span>MALLARD TARGET:</span> <span className="text-[#aada39] font-black">+10 PTS</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>GOLDEN PHEASANT:</span> <span className="text-yellow-400 font-black">+50 PTS</span>
                </div>
                <div className="flex items-center justify-between border-t border-zinc-900 pt-1 mt-1 font-extrabold text-[#ff2e2e]">
                  <span>BOSS DUCK (SIGHT MULTIPLES):</span> <span>+150 PTS</span>
                </div>
              </div>
            </div>

            {/* High Scores block */}
            <div className="bg-[#03050a] border-2 border-zinc-800 p-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="text-[8px] text-[#ff2e2e] tracking-widest uppercase flex items-center gap-1.5 border-b border-zinc-900 pb-1 font-bold">
                  🏆 TOP DUCK HUNTER RECORDS
                </div>

                {highScores.length === 0 ? (
                  <div className="text-[7.5px] text-zinc-600 py-3 tracking-widest text-center font-bold">
                    [NO SECTOR RECORDS RECORDED]
                  </div>
                ) : (
                  <div className="space-y-1.5 mt-2 max-h-24 overflow-y-auto pr-1">
                    {highScores.slice(0, 3).map((score, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[7.5px] text-zinc-300 font-mono">
                        <span className="flex items-center gap-1">
                          <span className="text-zinc-600">{idx + 1}.</span>
                          <span className="font-bold text-white max-w-[80px] truncate">{score.name}</span>
                        </span>
                        <span className="text-[#42b6f5] font-black">{score.score} PTS</span>
                      </div>
                    ))}
                  </div>
                )}
                {isAdmin && (
                  <button
                    id="view-admin-dashboard-btn"
                    onClick={onOpenDashboard}
                    className="mt-3 w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-[9px] font-black border-2 border-black cursor-pointer shadow-[3px_3px_0px_#000] text-center animate-bounce duration-1000"
                  >
                    🖥️ VIEW ADMIN DASHBOARD
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Dynamic Warning for Camera/Hardware Access */}
        {webcamActive && hasTriedCamera && cameraError && (
          <div className="w-full py-2 bg-red-950/20 border-2 border-[#ff2e2e] text-[#ff2e2e] text-[7.5px] leading-relaxed tracking-wider text-center animate-pulse">
            ⚠️ WEBCAM HARNESS FAILURE: {cameraError}. SENSOR BLOCKED AND GAME LOADED MOUSE EMULATOR INSTEAD.
          </div>
        )}

        {webcamActive && !hasTriedCamera && (
          <div className="w-full py-1.5 bg-yellow-950/10 border-2 border-dashed border-yellow-800/80 text-yellow-500 text-[7px] tracking-widest text-center">
            ⚡ PHYSICAL SENSORS ACTIVE: BROWSER WILL ASK FOR PRIVATE WEBCAM SIGHT ACCESS.
          </div>
        )}

        {/* Action Button: Giant solid console style selection block with triple borders */}
        <div className="w-full pt-4 border-t-4 border-double border-zinc-800">
          <button
            onClick={onStartGame}
            id="start-btn"
            className="group relative w-full h-14 text-center cursor-pointer select-none"
          >
            <div className="absolute inset-0 bg-[#168a2d] border-2 border-black translate-x-1.5 translate-y-1.5"></div>
            <div className="absolute inset-0 bg-white text-black border-2 border-black flex justify-center items-center gap-3 text-sm md:text-lg font-black active:translate-x-0.5 active:translate-y-0.5 transition-transform">
              <span>START GAME</span>
              <span className="text-[8px] bg-[#ff2e2e] text-white py-0.5 px-2 font-black border border-black animate-bounce rounded-none">READY!</span>
            </div>
          </button>
        </div>

      </div>

      {/* NES vintage footer label */}
      <div className="mt-4 flex flex-col items-center gap-1.5">
        <div className="text-[6.5px] text-zinc-700 tracking-[0.25em] font-mono text-center font-extrabold max-w-lg leading-relaxed">
          &copy; 1984 NINTENDO CO., LTD. • 2026 WEB SIMULATOR PORT FACTORY INC. ALL TARGETS LICENSED.
        </div>
        <button
          id="admin-gateway-btn"
          onClick={onLogin}
          className="text-[7px] text-zinc-600 hover:text-zinc-400 tracking-wider font-bold transition-all cursor-pointer bg-zinc-950/40 px-2 py-0.5 border border-zinc-900/60 hover:border-zinc-800"
        >
          {isAdmin ? "🔒 SECURE SYSTEM: SIGNED IN AS COMMAND ADMIN" : "🔐 SECURE SYSTEMS GATEWAY"}
        </button>
      </div>

    </div>
  );
}
