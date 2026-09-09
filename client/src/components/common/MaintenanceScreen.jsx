import React, { useState, useEffect } from 'react';
import { 
  Heart, Shield, Clock, RefreshCw, Mail, Sparkles, 
  CheckCircle2, Bell, Globe, Lock, Key, Eye, EyeOff, 
  X, AlertTriangle, Power 
} from 'lucide-react';
import { maintenanceAPI, authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const MaintenanceScreen = ({ maintenanceData, onRetry, onAdminLoginSuccess }) => {
  const { login } = useAuth();
  const [lang, setLang] = useState('en');
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  // Admin Login Modal State
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');

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

  // Keyboard shortcut: Ctrl + Shift + A or Cmd + Shift + A to open Admin Login
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setAdminError('');
        setAdminModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const handleAdminLogin = async (e, shouldEndMaintenance = false) => {
    if (e) e.preventDefault();
    if (!adminEmail || !adminPassword) {
      setAdminError('Please enter both email and password.');
      return;
    }

    setAdminLoading(true);
    setAdminError('');

    try {
      const res = await authAPI.login({
        email: adminEmail.trim().toLowerCase(),
        password: adminPassword,
      });

      const user = res.data?.user || res.data;
      const role = (user?.role || '').toLowerCase();

      if (role !== 'admin') {
        setAdminError(
          'Access Restricted: This account does not have administrator privileges. Only administrators can access Kapu-LK during maintenance mode.'
        );
        setAdminLoading(false);
        return;
      }

      // 1. Authenticate in context & save token
      await login(user, res.data.token);

      // 2. If admin elected to immediately end maintenance break
      if (shouldEndMaintenance) {
        try {
          await maintenanceAPI.endMaintenanceNow();
          toast.success('🎉 Maintenance break deactivated! Kapu-LK is now live for all visitors.');
          window.dispatchEvent(
            new CustomEvent('kapu_maintenance_event', {
              detail: { maintenance: false, isActive: false },
            })
          );
        } catch (mErr) {
          toast.warn('Admin authenticated, but failed to auto-deactivate maintenance. You can end it from the top banner.');
        }
      } else {
        toast.success('Welcome back, Admin. Maintenance mode is active.');
      }

      setAdminModalOpen(false);
      if (onAdminLoginSuccess) {
        onAdminLoginSuccess();
      }
    } catch (err) {
      setAdminError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-950 to-gray-950 text-white flex flex-col items-center justify-between p-4 sm:p-6 md:p-8 relative overflow-hidden">
      
      {/* Background Decorative Rings */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar: Brand, Language Switcher & Staff Login */}
      <header className="w-full max-w-4xl flex items-center justify-between z-10 py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-xl sm:text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-100 to-pink-200">
            Kapu-LK
          </span>
        </div>

        <div className="flex items-center gap-2">
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

          {/* Admin / Staff Login Button */}
          <button
            type="button"
            onClick={() => {
              setAdminError('');
              setAdminModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white border border-white/20 rounded-xl text-xs font-semibold transition shadow-sm"
            title="Staff & Administrator Portal (Ctrl+Shift+A)"
          >
            <Lock className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden sm:inline">Staff Access</span>
          </button>
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
            className="px-6 py-3 bg-white text-gray-950 font-bold rounded-2xl hover:bg-gray-100 transition shadow-lg flex items-center gap-2 text-xs sm:text-sm cursor-pointer"
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
      <footer className="text-center text-xs text-gray-400 py-3 z-10 flex flex-col sm:flex-row items-center justify-center gap-2">
        <span>Kapu-LK Matrimonial & Matchmaking • All Rights Reserved © {new Date().getFullYear()}</span>
        <span className="hidden sm:inline">•</span>
        <button
          type="button"
          onClick={() => {
            setAdminError('');
            setAdminModalOpen(true);
          }}
          className="text-purple-300 hover:text-purple-100 underline transition cursor-pointer flex items-center gap-1"
        >
          <Lock className="w-3 h-3 text-purple-400" />
          <span>Staff & Administrator Portal</span>
        </button>
      </footer>

      {/* Administrator & Staff Login Modal */}
      {adminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-gray-900 border border-purple-500/30 text-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative space-y-5">
            
            {/* Close button */}
            <button
              type="button"
              onClick={() => setAdminModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white">
                  Staff & Admin Portal
                </h3>
                <p className="text-xs text-purple-200">
                  Authenticate to preview or end maintenance break
                </p>
              </div>
            </div>

            {/* Security Notice */}
            <div className="p-3 bg-purple-950/60 border border-purple-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-purple-200">
              <Shield className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <span>
                Public registration and standard member logins are paused. Only authorized Kapu-LK administrators may sign in.
              </span>
            </div>

            {/* Error Banner */}
            {adminError && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-2xl flex items-start gap-2 text-xs text-rose-300">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{adminError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={(e) => handleAdminLogin(e, false)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-purple-200 uppercase tracking-wider mb-1.5">
                  Admin Email
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@kapu.lk"
                  required
                  autoFocus
                  className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/20 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-2.5 pr-10 rounded-xl bg-black/50 border border-white/20 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2.5">
                {/* Button 1: Enter Platform (Preview) */}
                <button
                  type="submit"
                  disabled={adminLoading}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
                >
                  {adminLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      <span>Log In & Enter Platform (Preview Mode)</span>
                    </>
                  )}
                </button>

                {/* Button 2: End Maintenance Break Now */}
                <button
                  type="button"
                  onClick={(e) => handleAdminLogin(e, true)}
                  disabled={adminLoading}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-xl shadow transition flex items-center justify-center gap-2 text-xs sm:text-sm border border-emerald-400/40 disabled:opacity-50 cursor-pointer"
                  title="Logs in and immediately restores public access for everyone"
                >
                  <Power className="w-4 h-4 text-emerald-200" />
                  <span>Log In & End Maintenance Break Now</span>
                </button>
              </div>
            </form>

            <div className="text-center">
              <span className="text-[11px] text-gray-400">
                Tip: You can also press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white text-[10px] font-mono border border-white/20">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white text-[10px] font-mono border border-white/20">Shift</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white text-[10px] font-mono border border-white/20">A</kbd> to open this portal anytime.
              </span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default MaintenanceScreen;
