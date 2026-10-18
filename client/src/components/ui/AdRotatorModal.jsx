import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Crown, X, Sparkles, Zap, Heart, MessageSquare, Users, Eye, AlertCircle, ArrowRight, ShieldCheck, Flame, User
} from 'lucide-react';

/**
 * Calculates accurate real profile completeness percentage and identifies missing fields.
 */
export const calculateProfileCompleteness = (user) => {
  if (!user) return { percentage: 0, missingItems: ['All details'], isComplete: false };

  const checks = [
    {
      key: 'photo',
      name: 'Profile Photo',
      isDone: Boolean(user.profileImageUrl || (user.photos && user.photos.length > 0)),
      weight: 20
    },
    {
      key: 'basic',
      name: 'Basic Info (Age, Gender, District)',
      isDone: Boolean(user.age && user.gender && (user.district || user.location || user.city)),
      weight: 20
    },
    {
      key: 'bio',
      name: 'About You / Bio',
      isDone: Boolean(user.bio && user.bio.trim().length > 0),
      weight: 20
    },
    {
      key: 'details',
      name: 'Education / Occupation / Religion',
      isDone: Boolean(user.education || user.occupation || user.religion || user.maritalStatus),
      weight: 20
    },
    {
      key: 'preferences',
      name: 'Partner Preferences / Interests',
      isDone: Boolean(user.interests || user.hobbies || (user.partnerPreferences && (user.partnerPreferences.minAge || user.partnerPreferences.gender))),
      weight: 20
    }
  ];

  const completed = checks.filter(c => c.isDone);
  const missing = checks.filter(c => !c.isDone).map(c => c.name);
  const totalScore = completed.reduce((sum, c) => sum + c.weight, 0);

  return {
    percentage: Math.min(100, totalScore),
    missingItems: missing,
    completedItems: completed.map(c => c.name),
    isComplete: totalScore >= 100
  };
};

const COOLDOWN_MS = 8 * 60 * 1000; // 8 minutes cooldown between dismissals

const AdRotatorModal = ({ isOpenOverride = false, onCloseOverride = null }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, premiumStatus } = useAuth();

  const [isVisible, setIsVisible] = useState(false);
  const [adIndex, setAdIndex] = useState(1);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Allow manual preview or testing via custom window event (e.g. from developer console or admin preview)
  useEffect(() => {
    const handleTrigger = () => {
      setAdIndex(getSavedAdIndex());
      setIsVisible(true);
    };
    window.addEventListener('lovelk_trigger_ad', handleTrigger);
    return () => window.removeEventListener('lovelk_trigger_ad', handleTrigger);
  }, []);

  // Detect virtual keyboard on mobile to avoid covering chat / input elements
  useEffect(() => {
    const handleFocusIn = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) {
        setIsKeyboardOpen(true);
      }
    };
    const handleFocusOut = () => {
      setTimeout(() => {
        const activeTag = document.activeElement?.tagName?.toLowerCase();
        if (activeTag !== 'input' && activeTag !== 'textarea' && !document.activeElement?.isContentEditable) {
          setIsKeyboardOpen(false);
        }
      }, 150);
    };

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);

    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  // Determine if current route is excluded from ads
  const isExcludedRoute = useCallback(() => {
    const path = location.pathname.toLowerCase();
    const excludedPrefixes = [
      '/login',
      '/register',
      '/verify-email',
      '/forgot-password',
      '/reset-password',
      '/admin',
      '/maintenance',
      '/messages',
      '/conversations',
      '/chat',
      '/premium',
      '/payment',
      '/profile',
      '/settings'
    ];
    return excludedPrefixes.some(prefix => path.startsWith(prefix));
  }, [location.pathname]);

  // Read rotation index from localStorage
  const getSavedAdIndex = () => {
    try {
      const saved = localStorage.getItem('lovelk_ad_rotation_index');
      const idx = parseInt(saved, 10);
      if (idx >= 1 && idx <= 6) return idx;
    } catch (e) {
      // fallback
    }
    return 1;
  };

  // Check ad eligibility and schedule trigger
  useEffect(() => {
    if (isOpenOverride) {
      setAdIndex(getSavedAdIndex());
      setIsVisible(true);
      return;
    }

    // Eligibility check: Only non-admin free users see ads promoting Premium
    const isFreeUser = user && !user.isAdmin && user.role !== 'admin' && !user.isPremium && !premiumStatus?.isPremium;
    if (!isFreeUser || isExcludedRoute() || isKeyboardOpen) {
      setIsVisible(false);
      return;
    }

    // Cooldown check
    const lastDismissed = localStorage.getItem('lovelk_ad_last_dismissed');
    if (lastDismissed) {
      const elapsed = Date.now() - parseInt(lastDismissed, 10);
      if (elapsed < COOLDOWN_MS) {
        setIsVisible(false);
        return;
      }
    }

    const currentIndex = getSavedAdIndex();
    setAdIndex(currentIndex);

    // Natural 5-second delay on page view
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, [user, premiumStatus, location.pathname, isExcludedRoute, isKeyboardOpen, isOpenOverride]);

  // Handle dismissal & advance rotation index
  const handleDismiss = () => {
    const nextIdx = (adIndex % 6) + 1;
    try {
      localStorage.setItem('lovelk_ad_rotation_index', nextIdx.toString());
      localStorage.setItem('lovelk_ad_last_dismissed', Date.now().toString());
    } catch (e) {
      console.error('Error saving ad state:', e);
    }
    setIsVisible(false);
    if (onCloseOverride) onCloseOverride();
  };

  const handleAction = (targetPath) => {
    handleDismiss();
    if (targetPath) {
      navigate(targetPath);
    }
  };

  if (!isVisible) return null;

  const profileInfo = calculateProfileCompleteness(user);

  // Render Ad Content based on adIndex (1-6)
  const renderAdContent = () => {
    switch (adIndex) {
      // ==========================================
      // AD 1: Get More Connections (Premium)
      // ==========================================
      case 1:
        return {
          title: "Get More Connections 💖",
          badge: "Ad 1/6 • LoveLK Premium",
          subtitle: "Upgrade to LoveLK Premium to send unlimited direct messages and match 3x faster.",
          gradientHeader: "from-pink-600 via-purple-600 to-rose-500",
          features: [
            { icon: MessageSquare, text: "Send unlimited direct messages to all members" },
            { icon: Eye, text: "See who viewed your profile with Silver & Gold" },
            { icon: Sparkles, text: "Top priority ranking in daily suggested matches" }
          ],
          priceText: "Plans start at only LKR 500 for 10 Days",
          ctaText: "Go Premium",
          ctaPath: "/premium"
        };

      // ==========================================
      // AD 2: Unlock Premium Features (Premium)
      // ==========================================
      case 2:
        return {
          title: "Unlock Premium Features 👑",
          badge: "Ad 2/6 • VIP Access",
          subtitle: "Gain direct contact privileges, zero reply cooldowns, and a VIP Gold profile badge.",
          gradientHeader: "from-amber-500 via-pink-600 to-purple-700",
          features: [
            { icon: Zap, text: "Zero message cooldown timers between replies" },
            { icon: Crown, text: "Exclusive VIP Gold badge & verified highlight status" },
            { icon: Users, text: "Direct phone number & email contact access" }
          ],
          priceText: "Bronze (LKR 500) • Silver (LKR 1,300) • Gold (LKR 3,000)",
          ctaText: "Upgrade to Premium",
          ctaPath: "/premium"
        };

      // ==========================================
      // AD 3: Stand Out & Get Noticed (Premium)
      // ==========================================
      case 3:
        return {
          title: "Stand Out & Get Noticed 🌟",
          badge: "Ad 3/6 • Profile Visibility",
          subtitle: "Boost your listing to the top of daily search results and see who is interested in you.",
          gradientHeader: "from-purple-700 via-indigo-600 to-pink-600",
          features: [
            { icon: Eye, text: "Full list of profile visitors (Silver & Gold plans)" },
            { icon: Flame, text: "Featured banner card styling in match list" },
            { icon: Heart, text: "Receive 5x more match requests daily" }
          ],
          priceText: "Choose the perfect plan for your matchmaking journey",
          ctaText: "View Plans",
          ctaPath: "/premium"
        };

      // ==========================================
      // AD 4: Profile Spotlight Tip (Helpful & polite)
      // ==========================================
      case 4:
        return {
          title: "Make a Great Impression ✨",
          badge: "Tip • Matchmaking Advice",
          subtitle: "Profiles with a clear photo and a detailed bio receive up to 3x more responses from verified members.",
          gradientHeader: "from-pink-600 via-purple-600 to-indigo-600",
          features: [
            { icon: User, text: "Add clear portrait photos to build instant trust" },
            { icon: Heart, text: "Share your genuine hobbies, values & interests" },
            { icon: Sparkles, text: "Specify your partner preferences for tailored matches" }
          ],
          ctaText: "Review My Profile",
          ctaPath: "/profile"
        };

      // ==========================================
      // AD 5: Trust & Community Safety (Security)
      // ==========================================
      case 5:
        return {
          title: "Safe & Verified Community 🛡️",
          badge: "Safety • Verified Members",
          subtitle: "Your privacy and safety come first. We protect our community with strict moderation and verified profiles.",
          gradientHeader: "from-emerald-600 via-teal-600 to-cyan-700",
          features: [
            { icon: ShieldCheck, text: "Strict screening of verified member profiles" },
            { icon: Eye, text: "Complete control over your photo and contact visibility" },
            { icon: Users, text: "Report and block controls available at all times" }
          ],
          ctaText: "Browse Verified Matches",
          ctaPath: "/users"
        };

      // ==========================================
      // AD 6: Discover Meaningful Connections (Community)
      // ==========================================
      case 6:
      default:
        return {
          title: "Find Your Ideal Match 💖",
          badge: "Explore • LoveLK Community",
          subtitle: "Every day, Sri Lankan singles connect on LoveLK to find genuine, lifelong partnerships.",
          gradientHeader: "from-violet-600 via-purple-600 to-pink-500",
          features: [
            { icon: Flame, text: "Smart algorithms matching your lifestyle & values" },
            { icon: Users, text: "Members across all districts in Sri Lanka and abroad" },
            { icon: Sparkles, text: "Filter by district, religion, education, and lifestyle" }
          ],
          ctaText: "Discover Matches",
          ctaPath: "/users"
        };
    }
  };

  const adData = renderAdContent();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-purple-150 dark:border-purple-900/40 relative">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3.5 right-3.5 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-all z-20 backdrop-blur-md"
          aria-label="Close Ad"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className={`bg-gradient-to-r ${adData.gradientHeader} p-6 text-white relative overflow-hidden`}>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-white/10 rounded-full blur-xl"></div>

          <div className="relative z-10">
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-bold tracking-wider uppercase mb-2 text-white shadow-sm">
              {adData.badge}
            </span>
            <h3 className="text-2xl font-extrabold tracking-tight">{adData.title}</h3>
            <p className="text-white/90 text-xs mt-1 leading-relaxed">{adData.subtitle}</p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Real Profile Progress Bar for Ads 4-6 */}
          {typeof adData.profileProgress === 'number' && (
            <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-purple-600" /> Real Profile Completion
                </span>
                <span className="text-purple-700 dark:text-purple-400 font-extrabold text-sm">
                  {adData.profileProgress}%
                </span>
              </div>
              <div className="w-full bg-purple-200 dark:bg-purple-900 rounded-full h-3 overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-r from-pink-500 to-purple-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${adData.profileProgress}%` }}
                ></div>
              </div>

              {/* Missing Fields list */}
              {adData.missingList && adData.missingList.length > 0 && (
                <div className="mt-2 pt-2 border-t border-purple-100 dark:border-purple-900/30">
                  <p className="text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Missing Information:
                  </p>
                  <ul className="text-[11px] text-gray-600 dark:text-gray-400 space-y-0.5 pl-4 list-disc">
                    {adData.missingList.slice(0, 3).map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 100% Complete Tip */}
              {adData.profileProgress === 100 && (
                <p className="text-xs text-purple-800 dark:text-purple-300 flex items-center gap-1.5 font-semibold mt-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> {adData.tip || "Your profile has reached maximum 100% completeness!"}
                </p>
              )}
            </div>
          )}

          {/* Premium Features List for Ads 1-3 */}
          {adData.features && (
            <div className="space-y-2.5">
              {adData.features.map((feat, idx) => {
                const FeatIcon = feat.icon;
                return (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-lg shrink-0">
                      <FeatIcon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                      {feat.text}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {adData.priceText && (
            <p className="text-[11px] text-center font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 py-1.5 px-3 rounded-xl">
              {adData.priceText}
            </p>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => handleAction(adData.ctaPath)}
              className="w-full bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-700 hover:to-indigo-700 text-white font-bold py-3 px-5 rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all flex items-center justify-center gap-2 text-sm active:scale-98"
            >
              {adData.ctaText}
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleDismiss}
              className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 font-semibold py-2.5 px-4 rounded-xl text-xs transition-all"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdRotatorModal;
