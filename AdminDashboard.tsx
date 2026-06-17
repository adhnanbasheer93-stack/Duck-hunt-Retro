import React, { useState, useEffect } from 'react';
import { HighScore } from '../types';
import { fetchHighScoresFromFirebase, deleteHighScoreFromFirebase } from '../utils/firebase';
import { Trash2, X, RefreshCw, LogOut, ShieldAlert, Award, Hash, BarChart4 } from 'lucide-react';

interface AdminDashboardProps {
  onClose: () => void;
  onLogout: () => void;
}

export default function AdminDashboard({ onClose, onLogout }: AdminDashboardProps) {
  const [scores, setScores] = useState<HighScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalScores: 0,
    topScore: 0,
    averageScore: 0,
    averageAccuracy: 0,
  });

  const loadScores = async () => {
    setLoading(true);
    try {
      // Fetch up to 50 scores for the admin dashboard
      const result = await fetchHighScoresFromFirebase(50);
      setScores(result);
      
      // Calculate basic stats
      if (result.length > 0) {
        const total = result.length;
        const highest = Math.max(...result.map(s => s.score));
        const sumScores = result.reduce((sum, s) => sum + s.score, 0);
        const sumAccuracy = result.reduce((sum, s) => sum + s.accuracy, 0);
        
        setStats({
          totalScores: total,
          topScore: highest,
          averageScore: Math.round(sumScores / total),
          averageAccuracy: Math.round(sumAccuracy / total),
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScores();
  }, []);

  const handleDelete = async (id: string) => {
    if (!id) return;
    if (!confirm("Are you sure you want to permanently delete this leaderboard entry?")) return;
    
    setDeletingId(id);
    try {
      const success = await deleteHighScoreFromFirebase(id);
      if (success) {
        // Refresh local view
        setScores(prev => prev.filter(s => s.id !== id));
        // Recalculate stats
        const updated = scores.filter(s => s.id !== id);
        if (updated.length > 0) {
          const total = updated.length;
          const highest = Math.max(...updated.map(s => s.score));
          const sumScores = updated.reduce((sum, s) => sum + s.score, 0);
          const sumAccuracy = updated.reduce((sum, s) => sum + s.accuracy, 0);
          setStats({
            totalScores: total,
            topScore: highest,
            averageScore: Math.round(sumScores / total),
            averageAccuracy: Math.round(sumAccuracy / total),
          });
        } else {
          setStats({ totalScores: 0, topScore: 0, averageScore: 0, averageAccuracy: 0 });
        }
      } else {
        alert("Permission denied: Deletion rejected by Firestore rules.");
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div id="admin-dashboard-overlay" className="absolute inset-0 z-40 bg-black/95 flex flex-col items-center justify-start md:justify-center p-4 font-mono uppercase text-white select-none overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#0a0c10] border-8 border-double border-[#ff2e2e] p-6 md:p-8 shadow-[12px_12px_0px_#110000] my-8 md:my-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center pb-4 border-b-4 border-double border-zinc-805 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-1 px-2 border-2 border-[#ff2e2e] bg-[#220000] text-[#ff2e2e] font-black text-xs animate-pulse">
              [ADMIN MODE ACTIVE]
            </div>
            <h2 className="text-2xl font-sans font-black tracking-wider text-white">
              SIGHT COMMAND LEADERBOARD CONSOLE
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadScores}
              className="flex items-center gap-1 bg-zinc-900 border-2 border-zinc-700 px-3 py-1.5 text-[9px] font-bold hover:border-white cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>SYNC</span>
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 bg-red-950/40 border-2 border-[#ff2e2e] text-[#ff2e2e] px-3 py-1.5 text-[9px] font-bold hover:bg-[#ff2e2e] hover:text-black cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>SIGN OUT</span>
            </button>
            <button
              onClick={onClose}
              className="bg-zinc-900 border-2 border-zinc-700 p-1 px-2 hover:border-white cursor-pointer"
              title="Close System Dashboard"
            >
              <X className="w-5 h-5 text-zinc-400 hover:text-white" />
            </button>
          </div>
        </div>

        {/* Info text */}
        <div className="text-[8px] text-zinc-500 my-3 leading-normal font-mono normal-case">
          Logged in authorized administrator. You have write clearance to prune highscore entries directly on active Firestore collections. These operations reflect fully across public user devices instantly.
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 mt-4">
          <div className="bg-[#12161f] border-2 border-zinc-800 p-3 flex flex-col justify-between">
            <span className="text-[7.5px] text-zinc-500 font-bold flex items-center gap-1">
              <Hash className="w-3 h-3 text-[#42b6f5]" /> UNIQUE SCRIPTS
            </span>
            <span className="text-xl font-bold text-[#42b6f5] mt-1">
              {stats.totalScores} <span className="text-[9px] text-zinc-600 font-normal">ENTRIES</span>
            </span>
          </div>
          <div className="bg-[#12161f] border-2 border-zinc-800 p-3 flex flex-col justify-between">
            <span className="text-[7.5px] text-zinc-500 font-bold flex items-center gap-1">
              <Award className="w-3 h-3 text-yellow-400" /> MAX LEVEL
            </span>
            <span className="text-xl font-bold text-yellow-400 mt-1">
              {stats.topScore} <span className="text-[9px] text-zinc-650 font-normal">PTS</span>
            </span>
          </div>
          <div className="bg-[#12161f] border-2 border-zinc-800 p-3 flex flex-col justify-between">
            <span className="text-[7.5px] text-zinc-500 font-bold flex items-center gap-1">
              <BarChart4 className="w-3 h-3 text-emerald-400" /> AVERAGE SCORE
            </span>
            <span className="text-xl font-bold text-emerald-400 mt-1">
              {stats.averageScore} <span className="text-[9px] text-zinc-600 font-normal">PTS</span>
            </span>
          </div>
          <div className="bg-[#12161f] border-2 border-zinc-800 p-3 flex flex-col justify-between">
            <span className="text-[7.5px] text-zinc-500 font-bold flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-orange-400" /> AVG ACCURACY
            </span>
            <span className="text-xl font-bold text-orange-400 mt-1">
              {stats.averageAccuracy}%
            </span>
          </div>
        </div>

        {/* Database List */}
        <div className="border-4 border-double border-zinc-800 bg-[#03050a] p-4">
          <div className="text-[10px] text-zinc-400 font-bold flex justify-between border-b-2 border-zinc-800 pb-2 mb-2 px-2">
            <span>DATABASE FIELD RECORDS</span>
            <span>SHOWING TOP 50 SCORES</span>
          </div>

          {loading ? (
            <div className="text-xs text-zinc-600 py-12 text-center animate-pulse">
              PULLING RECORDS FROM CLOUD COORDINATE MATRIX...
            </div>
          ) : scores.length === 0 ? (
            <div className="text-xs text-zinc-500 py-12 text-center">
              [NO SECTOR RECORDS AVAILABLE IN CLOUD DATABASE]
            </div>
          ) : (
            <div className="max-h-[350px] overflow-y-auto pr-2 space-y-1">
              {scores.map((score, idx) => (
                <div 
                  key={score.id}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-zinc-950/60 p-2.5 border border-zinc-900 hover:border-zinc-700 transition-colors"
                >
                  {/* Left info */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-zinc-600 font-bold">#{idx + 1}</span>
                      <span className="text-xs font-black text-white">{score.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-[9px] text-zinc-400 font-mono">
                      <span>SCORE: <strong className="text-yellow-400 font-bold">{score.score}</strong></span>
                      <span>ACCURACY: <strong className="text-sky-400 font-bold">{score.accuracy}%</strong></span>
                      <span>DATE: <strong className="text-zinc-500 font-medium">{score.date}</strong></span>
                    </div>
                  </div>

                  {/* Document details + Action wrapper */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-900">
                    <span className="text-[6.5px] text-zinc-600 font-mono lower-case font-bold select-all bg-black px-1.5 py-0.5">
                      id: {score.id}
                    </span>
                    
                    <button
                      onClick={() => score.id && handleDelete(score.id)}
                      disabled={deletingId === score.id}
                      className="p-1 px-2.5 bg-red-950/20 text-[#ff2e2e] hover:bg-[#ff2e2e] hover:text-black border border-red-900/60 transition-colors cursor-pointer text-[8px] font-bold flex items-center gap-1 disabled:opacity-20 disabled:pointer-events-none"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{deletingId === score.id ? 'PRUNING...' : 'DELETE'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal footer back */}
        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white text-black font-black hover:bg-zinc-200 transition-colors cursor-pointer border-2 border-black tracking-widest text-xs"
          >
            DISMISS CONSOLE SYSTEM
          </button>
        </div>

      </div>
    </div>
  );
}
