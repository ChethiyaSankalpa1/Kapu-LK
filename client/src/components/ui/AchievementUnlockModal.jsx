import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Sparkles, X, ArrowRight } from 'lucide-react';

const AchievementUnlockModal = ({ isOpen, achievement, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen || !achievement) return null;

  const { name, icon, points, description } = achievement;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-yellow-400/50 text-center animate-in zoom-in-95 duration-300">
        {/* Glow Header */}
        <div className="bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 p-6 text-slate-950 relative overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-slate-950/10 hover:bg-slate-950/20 text-slate-950 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl bg-white/40 border border-white/60 flex items-center justify-center text-5xl shadow-xl mb-3 animate-pulse">
              {icon || '🏆'}
            </div>
            <div className="inline-flex items-center gap-1.5 bg-slate-950 text-yellow-400 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              <span>Achievement Unlocked!</span>
            </div>
            <h3 className="text-xl font-black text-slate-950 tracking-tight">
              {name || 'New Achievement'}
            </h3>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
            {description || 'Congratulations on unlocking this achievement!'}
          </p>

          <div className="inline-flex items-center justify-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 text-amber-800 dark:text-yellow-300 py-2 px-4 rounded-xl font-black text-sm">
            <Trophy className="w-4 h-4 text-amber-600 dark:text-yellow-400" />
            <span>+ {points || 50} Points Earned!</span>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => {
                onClose();
                navigate('/wallet');
              }}
              className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 shadow-md transition active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>View Achievements & Wallet</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementUnlockModal;
