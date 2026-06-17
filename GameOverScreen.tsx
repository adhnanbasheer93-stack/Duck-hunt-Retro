import React, { useState } from 'react';
import { HighScore } from '../types';
import { RotateCcw, Trophy, Award, Target, MessageSquare } from 'lucide-react';

interface GameOverScreenProps {
  score: number;
  totalShots: number;
  totalHits: number;
  onRestart: () => void;
  onSaveScore: (name: string, score: number, accuracy: number) => void;
  highScores: HighScore[];
}

export default function GameOverScreen({
  score,
  totalShots,
  totalHits,
  onRestart,
  onSaveScore,
  highScores,
}: GameOverScreenProps) {
  const [initials, setInitials] = useState('');
  const [hasSaved, setHasSaved] = useState(false);

  const accuracy = totalShots > 0 ? Math.round((totalHits / totalShots) * 100) : 0;

  // Let's create a dynamic nostalgic comment based on performance
  let dogSpeech = '';
  let dogStyle = 'Laughing'; // Laughing, Neutral, Proud
  if (score === 0) {
    dogSpeech = "HEHEHEHE! Did you keep your eyes closed? Play again!";
    dogStyle = 'Laughing';
  } else if (accuracy < 30) {
    dogSpeech = "The ducks are laughing! Steady those hands!";
    dogStyle = 'Laughing';
  } else if (accuracy >= 80 && score > 300) {
    dogSpeech = "UNBELIEVABLE! You have the reflexes of a legend!";
    dogStyle = 'Proud';
  } else if (score > 150) {
    dogSpeech = "Fantastic shooting! Retain your focus!";
    dogStyle = 'Proud';
  } else {
    dogSpeech = "Not bad, hunter! Have another go at it!";
    dogStyle = 'Neutral';
  }

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!initials.trim()) return;
    onSaveScore(initials.trim(), score, accuracy);
    setHasSaved(true);
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-start md:justify-center bg-black/95 p-6 md:p-12 font-mono uppercase text-white selection:bg-nes-red select-none overflow-y-auto">
      
      {/* Brutalist Hero Game Over Title */}
      <h1 className="text-4xl md:text-6xl font-black text-nes-red tracking-widest drop-shadow-[6px_6px_0px_#000000] [text-shadow:4px_4px_0px_#000000] mb-8 mt-4 md:mt-0 text-center animate-pulse">
        GAME OVER
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl h-auto items-stretch">
        
        {/* Dynamic retro stats card in thick Blood Red Brutalism */}
        <div className="bg-black border-4 border-nes-red p-6 brutalist-shadow-red flex flex-col justify-between">
          <div>
            <div className="text-xs text-[#63adff] font-extrabold pb-3 mb-5 border-b-4 border-dotted border-nes-red uppercase flex items-center gap-2.5">
              <Award className="w-5 h-5 text-nes-sky" /> HUNT SENSORY STATUS
            </div>

            <div className="space-y-5 mb-5 text-[10px] tracking-wider">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 font-bold">FINAL SCORE:</span>
                <span className="text-white text-xl font-black">{score.toString().padStart(6, '0')}</span>
              </div>

              <div className="flex justify-between items-center bg-zinc-950 p-3 border-2 border-zinc-900 shadow-[3px_3px_0px_#000]">
                <span className="text-zinc-400 flex items-center gap-2 font-bold">
                  <Target className="w-4 h-4 text-nes-red" /> ACCURACY:
                </span>
                <span className="text-nes-sky font-black text-xl">{accuracy}%</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-500 font-bold">MALLARDS ESCAPED:</span>
                <span className="text-nes-red font-black">[{Math.max(0, 15 - totalHits)}]</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-500 font-bold">DUCKS RETRIEVED:</span>
                <span className="text-nes-green font-black">[{totalHits}]</span>
              </div>
            </div>

            {/* Speeches or Retro Dog Advice */}
            <div className="mt-5 bg-zinc-950 border-4 border-[#855E42] p-4 relative flex gap-4 items-center">
              <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
                {/* 8-bit visual proxy of the dog */}
                <div className="text-2xl animate-bounce">🐶</div>
                <div className={`text-[6px] font-black px-1 py-0.5 border border-black ${
                  dogStyle === 'Laughing' ? 'bg-nes-red text-white' : 'bg-nes-green text-white'
                }`}>
                  {dogStyle === 'Laughing' ? 'LAUGHING' : dogStyle === 'Proud' ? 'PROUD' : 'HELPFUL'}
                </div>
              </div>
              <p className="text-[8px] text-zinc-300 font-mono normal-case leading-relaxed">
                "{dogSpeech}"
              </p>
            </div>
          </div>

          {/* High Score Submission Panel */}
          {!hasSaved ? (
            <form onSubmit={handleSaveSubmit} className="mt-6 border-t border-zinc-805 pt-5">
              <div className="text-[10px] text-yellow-400 font-black mb-3 tracking-wider normal-case">enter your name and be in the leaderboard.</div>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={initials}
                  onChange={(e) => setInitials(e.target.value)}
                  placeholder="YOUR NAME"
                  className="bg-zinc-950 text-center text-white text-sm uppercase px-4 py-2.5 focus:outline-none border-4 border-zinc-800 focus:border-nes-sky flex-1 tracking-widest font-black placeholder-zinc-800"
                />
                <button
                  type="submit"
                  disabled={!initials.trim()}
                  className={`px-5 py-2.5 text-[10px] uppercase font-black border-4 cursor-pointer transition-all ${
                    initials.trim()
                      ? 'bg-nes-sky text-black border-white shadow-[3px_3px_0px_#000] -translate-x-0.5 -translate-y-0.5'
                      : 'bg-zinc-950 text-zinc-700 border-zinc-900 cursor-not-allowed'
                  }`}
                >
                  SAVE
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-6 text-center py-3 bg-nes-green text-white border-4 border-black font-black text-[9px] shadow-[4px_4px_0px_#0055FF]">
              ✓ HUNTER SCORE COMMITTED TO RECORD
            </div>
          )}

        </div>

        {/* Screen Right: Hall of Fame inside a bright brutalist frame */}
        <div className="bg-black border-4 border-white p-6 brutalist-shadow-green flex flex-col justify-between">
          <div>
            <div className="text-xs text-yellow-400 font-extrabold pb-3 mb-5 border-b-4 border-dotted border-white uppercase flex items-center gap-2.5">
              <Trophy className="w-5 h-5 text-yellow-400 animate-pulse" /> HIGH-SPEED HALL OF GLORY
            </div>

            {highScores.length === 0 ? (
              <div className="text-[8.5px] text-zinc-500 text-center py-12 tracking-widest leading-relaxed">
                ZERO MATRIX ENTRIES RECORDED CURRENTLY. SECURE DOMINANCE NOW!
              </div>
            ) : (
              <div className="space-y-2.5 overflow-y-auto max-h-56">
                {highScores.map((h, idx) => (
                  <div
                    key={idx}
                    className={`flex justify-between items-center text-[9px] p-2.5 border-2 border-zinc-900 rounded-none ${
                      idx === 0 ? 'bg-yellow-400 text-black font-black border-black shadow-[3px_3px_0px_#fff]' : 'bg-zinc-950 text-zinc-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-[8px] font-bold opacity-60">#{idx + 1}</span>
                      <span className="font-extrabold tracking-widest">{h.name}</span>
                    </span>
                    <span className="font-mono font-black">{h.score} PTS [{h.accuracy}% ACC]</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onRestart}
            className="mt-6 w-full py-4 text-xs font-black uppercase transition-all bg-white text-black border-4 border-black shadow-[6px_6px_0px_#000] hover:bg-zinc-100 active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_#000] cursor-pointer flex justify-center items-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            <span>RESTART GAME</span>
          </button>
        </div>

      </div>

    </div>
  );
}
