import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, X, Wallet, Gift as GiftIcon } from 'lucide-react';

const GiftReceiveModal = ({ isOpen, giftData, onClose }) => {
  const navigate = useNavigate();
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (isOpen) {
      // Generate dynamic confetti particles
      const newParticles = Array.from({ length: 30 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * -20,
        size: Math.random() * 8 + 4,
        color: ['#ec4899', '#a855f7', '#eab308', '#3b82f6', '#10b981'][Math.floor(Math.random() * 5)],
        delay: Math.random() * 2,
        duration: Math.random() * 2 + 2,
      }));
      setParticles(newParticles);
    }
  }, [isOpen]);

  if (!isOpen || !giftData) return null;

  const { giftEmoji, giftName, senderName, message, pointsEarned = 10, isAnonymous } = giftData;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
      {/* Particle Confetti Container */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full animate-bounce"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              opacity: 0.8,
            }}
          />
        ))}
      </div>

      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-purple-200 dark:border-purple-900/50 text-center animate-in zoom-in-95 duration-300">
        {/* Glow Header */}
        <div className="bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600 p-8 text-white relative overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Floating Sparkles & Gift Emoji */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-6xl shadow-xl mb-4 animate-bounce">
              {giftEmoji || '🎁'}
            </div>
            <div className="inline-flex items-center gap-1.5 bg-yellow-400/90 text-slate-950 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider mb-1 shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>You Received a Gift!</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              {giftName || 'Special Gift'}
            </h2>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4 border border-purple-100 dark:border-purple-800/40">
            <p className="text-xs uppercase font-bold text-purple-600 dark:text-purple-400 tracking-wider">From</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {isAnonymous ? '🕵️ Anonymous Admirer' : senderName || 'A Match'}
            </p>

            {message && (
              <div className="mt-3 pt-3 border-t border-purple-200/60 dark:border-purple-800/60 text-sm text-slate-700 dark:text-slate-200 italic">
                "{message}"
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 py-2.5 px-4 rounded-xl font-bold text-sm">
            <Wallet className="w-4 h-4" />
            <span>+ {pointsEarned} Reward Points Added to Wallet</span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5 pt-2">
            <button
              onClick={() => {
                onClose();
                navigate('/wallet');
              }}
              className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/25 transition active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <GiftIcon className="w-4 h-4" />
              <span>View in Gift History & Wallet</span>
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GiftReceiveModal;
