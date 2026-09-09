import React, { useState, useEffect } from 'react';
import { 
  Heart, Shield, Clock, RefreshCw, Mail, Sparkles, 
  CheckCircle2, Bell, Globe 
} from 'lucide-react';
import { maintenanceAPI } from '../../services/api';
import { toast } from 'react-toastify';

const MaintenanceScreen = ({ maintenanceData, onRetry }) => {
  const [lang, setLang] = useState('en');
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  const title = maintenanceData?.title?.[lang] || maintenanceData?.title?.en || "We'll Be Back Soon!";
  const message = maintenanceData?.message?.[lang] || maintenanceData?.message?.en || 
    "Kapu-LK is currently undergoing scheduled platform maintenance and security upgrades. Your account and personal data remain completely safe.";
  const expectedCompletionAt = maintenanceData?.expectedCompletionAt;
  const comingSoon = maintenanceData?.comingSoon;

  // Countdown timer logic
  useEffect(() => {
    if (!expectedCompletionAt) return;
    const targetDate = new Date(expectedCompletionAt);

    const updateCountdown = () => {
      const now = Date.now();
      const diff = targetDate.getTime() - now;

      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [expectedCompletionAt]);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;

    setSubscribing(true);
    try {
      const res = await maintenanceAPI.subscribeComingSoon(email);
      setSubscribed(true);
      toast.success(res.data?.message || "You're subscribed! We'll notify you when this launches.");
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to subscribe. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-950 to-gray-950 text-white flex flex-col items-center justify-between p-4 sm:p-6 md:p-8 relative overflow-hidden">
      
      {/* Background Decorative Rings */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar: Brand & Language Switcher */}
      <header className="w-full max-w-4xl flex items-center justify-between z-10 py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-xl sm:text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-100 to-pink-200">
            Kapu-LK
          </span>
        </div>

        {/* Language selector */}
        <div className="flex items-center bg-white/10 backdrop-blur-md rounded-xl p-1 border border-white/15">
          <Globe className="w-3.5 h-3.5 text-purple-300 ml-2 mr-1" />
          {['en', 'si', 'ta'].map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                lang === l
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              {l === 'en' ? 'EN' : l === 'si' ? 'සිං' : 'தமி'}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content Card */}
      <main className="w-full max-w-2xl bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-10 shadow-2xl text-center space-y-6 sm:space-y-8 z-10 my-auto">
        
        {/* Animated Status Icon */}
        <div className="relative inline-block mx-auto">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-purple-500/30 to-pink-500/30 border border-purple-400/40 flex items-center justify-center shadow-inner">
            <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-purple-300 animate-pulse" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
          </span>
        </div>

        {/* Heading & Explanation */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            {title}
          </h1>
          <p className="text-purple-200 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
            {message}
          </p>
        </div>

        {/* Security Reassurance Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs sm:text-sm font-medium">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Your account, active chats, and photos are safe and untouched.</span>
        </div>

        {/* Live Countdown (if expected time provided) */}
        {timeLeft && (
          <div className="bg-black/30 border border-white/10 rounded-2xl p-4 sm:p-5">
            <p className="text-xs text-purple-300 uppercase tracking-wider font-bold mb-3">
              Estimated Return Time
            </p>
            <div className="flex items-center justify-center gap-3 sm:gap-6 text-center">
              <div className="bg-white/10 rounded-xl px-3 sm:px-4 py-2 min-w-[60px]">
                <span className="text-2xl sm:text-3xl font-bold font-mono text-white">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="block text-[10px] sm:text-xs text-gray-300 mt-0.5">Hours</span>
              </div>
              <span className="text-2xl font-bold text-purple-400">:</span>
              <div className="bg-white/10 rounded-xl px-3 sm:px-4 py-2 min-w-[60px]">
                <span className="text-2xl sm:text-3xl font-bold font-mono text-white">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="block text-[10px] sm:text-xs text-gray-300 mt-0.5">Minutes</span>
              </div>
              <span className="text-2xl font-bold text-purple-400">:</span>
              <div className="bg-white/10 rounded-xl px-3 sm:px-4 py-2 min-w-[60px]">
                <span className="text-2xl sm:text-3xl font-bold font-mono text-white">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="block text-[10px] sm:text-xs text-gray-300 mt-0.5">Seconds</span>
              </div>
            </div>
          </div>
        )}

        {/* Optional "Coming Soon" Announcement & Notify Me */}
        {comingSoon?.enabled && (
          <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-500/30 rounded-2xl p-5 text-left space-y-3">
            <div className="flex items-center gap-2 text-pink-300 font-bold text-xs sm:text-sm uppercase tracking-wide">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span>Coming Soon / Under Construction</span>
            </div>

            <h3 className="text-lg font-bold text-white">
              {comingSoon.featureName?.[lang] || comingSoon.featureName?.en || 'Exciting New Features'}
            </h3>

            <p className="text-xs sm:text-sm text-purple-200 leading-relaxed">
              {comingSoon.description?.[lang] || comingSoon.description?.en || 'We are building next-generation features to elevate your matchmaking experience.'}
            </p>

            {subscribed ? (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-emerald-300 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>You're on the early access notification list!</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 pt-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email for early access"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-black/40 border border-white/20 text-white placeholder-gray-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <button
                  type="submit"
                  disabled={subscribing}
                  className="px-5 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-semibold text-xs sm:text-sm rounded-xl transition shadow-md flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  {subscribing ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Bell className="w-3.5 h-3.5" />
                      <span>Notify Me</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onRetry || (() => window.location.reload())}
            className="px-6 py-3 bg-white text-gray-950 font-bold rounded-2xl hover:bg-gray-100 transition shadow-lg flex items-center gap-2 text-xs sm:text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Check Platform Status</span>
          </button>

          {maintenanceData?.supportContact && (
            <a
              href={`mailto:${maintenanceData.supportContact}?subject=Platform%20Maintenance%20Inquiry`}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-2xl border border-white/20 transition flex items-center gap-2 text-xs sm:text-sm"
            >
              <Mail className="w-4 h-4 text-purple-300" />
              <span>Contact Support</span>
            </a>
          )}
        </div>

      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 py-3 z-10">
        Kapu-LK Matrimonial & Matchmaking • All Rights Reserved © {new Date().getFullYear()}
      </footer>

    </div>
  );
};

export default MaintenanceScreen;
