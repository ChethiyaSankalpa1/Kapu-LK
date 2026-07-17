import React, { useState, useEffect } from 'react';
import { Crown, X, Sparkles, Zap, Heart, MessageSquare, Users } from 'lucide-react';

const PremiumPopup = ({ onClose, onUpgrade }) => {
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onClose]);

  const handleClose = () => {
    onClose();
  };

  const handleUpgrade = () => {
    onUpgrade();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-300">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-all z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-white/20 rounded-full">
                <Crown className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Upgrade to Premium</h2>
                <p className="text-white/90 text-sm">Unlock unlimited possibilities</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Price */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 px-6 py-3 rounded-2xl">
              <span className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                LKR 500
              </span>
              <span className="text-gray-600 dark:text-gray-400">/month</span>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
              <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
                <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-300" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Unlimited Messaging</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Send unlimited messages to anyone</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl">
              <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                <Zap className="w-5 h-5 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">No Message Cooldown</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Send messages instantly anytime</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-xl">
              <div className="p-2 bg-pink-100 dark:bg-pink-800 rounded-lg">
                <Heart className="w-5 h-5 text-pink-600 dark:text-pink-300" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Priority Matching</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Get better profile matches</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
              <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                <Users className="w-5 h-5 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Profile Visibility</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Stand out with premium badge</p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleUpgrade}
              className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 hover:from-amber-600 hover:via-orange-600 hover:to-pink-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Sparkles className="w-5 h-5" />
              Upgrade Now
            </button>
            
            <button
              onClick={handleClose}
              className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-xl transition-all active:scale-95"
            >
              Maybe Later
            </button>
          </div>

          {/* Timer */}
          <div className="text-center mt-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Auto-close in <span className="font-semibold text-amber-600 dark:text-amber-400">{timeLeft}s</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumPopup;
