import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/common/BackButton';
import {
  Heart,
  ShieldCheck,
  Sparkles,
  Lock,
  MessageCircle,
  Gift,
  Search,
  CheckCircle2,
  ArrowRight,
  Shield,
  Star,
  EyeOff,
  Clock,
  Compass,
  FileText,
  HelpCircle,
} from 'lucide-react';

const About = () => {
  const { user } = useAuth();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="w-full flex-1 bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/20 dark:from-slate-900 dark:via-purple-950/20 dark:to-slate-900 text-slate-800 dark:text-slate-100 min-h-screen overflow-x-hidden">
      
      {/* Top Navigation Back Button Container */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl pt-6">
        <BackButton label="Back" fallback="/" />
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-6 pb-16 sm:pb-24 lg:pb-28">
        {/* Subtle romantic ambient background circles */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] sm:w-[700px] sm:h-[700px] bg-gradient-to-tr from-purple-400/20 via-pink-400/20 to-rose-400/10 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '6s' }} />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl text-center relative z-10">
          
          {/* Logo & Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 border border-purple-200 dark:border-purple-800/60 shadow-sm mb-6 sm:mb-8 animate-fade-in">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-white fill-white" />
            </div>
            <span className="text-xs sm:text-sm font-semibold bg-gradient-to-r from-purple-700 to-pink-600 dark:from-purple-300 dark:to-pink-300 bg-clip-text text-transparent">
              LoveLK • Modern &amp; Trusted Matrimonial Platform
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight max-w-4xl mx-auto leading-[1.15] mb-6">
            Connecting Hearts, Creating{' '}
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 bg-clip-text text-transparent">
              Meaningful Connections
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed mb-8 sm:mb-10 font-normal">
            LoveLK (Kapu-LK) is designed to help adults discover genuine, lasting relationships in a safe, friendly, and respectful Sri Lankan environment built on trust, cultural values, and modern privacy standards.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 max-w-md mx-auto">
            {user ? (
              <Link
                to="/users"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold text-base shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-2.5"
              >
                <Search className="w-5 h-5" />
                <span>Browse Profiles</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold text-base shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-2.5"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Join LoveLK Free</span>
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-base hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all flex items-center justify-center gap-2.5"
                >
                  <span>Member Login</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>

          {/* Highlight metrics */}
          <div className="mt-12 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto pt-8 border-t border-slate-200/60 dark:border-slate-800">
            <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-purple-100 dark:border-slate-700/50">
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-600 dark:text-purple-400 mb-1">100%</div>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">Screened Profiles</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-purple-100 dark:border-slate-700/50">
              <div className="text-2xl sm:text-3xl font-extrabold text-pink-600 dark:text-pink-400 mb-1">24/7</div>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">Privacy Protection</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-purple-100 dark:border-slate-700/50">
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-600 dark:text-purple-400 mb-1">Sri Lanka</div>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">Islandwide &amp; Global</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-purple-100 dark:border-slate-700/50">
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 mb-1">Porondam</div>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">Astrology Matching</div>
            </div>
          </div>

        </div>
      </section>

      {/* Our Story & Our Mission */}
      <section className="py-12 sm:py-16 bg-white dark:bg-slate-800/80 border-y border-slate-200/80 dark:border-slate-700/80">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-stretch">
            
            {/* Our Story Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-purple-50/50 to-pink-50/30 dark:from-slate-900/80 dark:to-purple-950/20 border border-purple-100 dark:border-slate-700 space-y-4 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-5">
                  <Compass className="w-6 h-6" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3">
                  Our Story
                </h2>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed space-y-3">
                  LoveLK (Kapu-LK) was created with a clear vision: to reimagine traditional Sri Lankan matchmaking for the modern digital age. We recognized that finding a life partner requires more than casual browsing—it demands mutual respect, cultural alignment, verified security, and privacy.
                </p>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mt-3">
                  By blending traditional values with smart compatibility matching, horoscope Porondam insights, and privacy controls, LoveLK provides a dignified space where singles and families connect with confidence.
                </p>
              </div>
            </div>

            {/* Our Mission Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-pink-50/50 to-rose-50/30 dark:from-slate-900/80 dark:to-pink-950/20 border border-pink-100 dark:border-slate-700 space-y-4 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-400 flex items-center justify-center mb-5">
                  <Heart className="w-6 h-6 fill-current" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3">
                  Our Mission
                </h2>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  Our mission is to empower adults to discover genuine love, companionship, and lifelong partners in a safe, secure, and user-centric platform.
                </p>
                <ul className="mt-4 space-y-2.5 text-sm sm:text-base text-slate-700 dark:text-slate-200">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Fostering authentic and verified profile interactions</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Protecting member privacy and personal data rights</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Offering transparent, accessible matrimonial tools for everyone</span>
                  </li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Why LoveLK */}
      <section className="py-12 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Why Choose LoveLK?
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              Built specifically with safety, compatibility, and simplicity at heart.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Screened &amp; Verified Profiles
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Profiles undergo administrative review and identity check options to maintain a high-quality community of genuine members.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400 flex items-center justify-center mb-4">
                <Star className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Astrology &amp; Porondam Compatibility
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Enter your horoscope details to compute astrological compatibility scores, traditional Porondam matches, and Nekatha insights.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
                <EyeOff className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Smart Privacy Controls
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Toggle your phone number and email address visibility. You decide when and with whom to share your contact details.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Rich Direct Messaging
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Private messaging with quoted replies, emoji reactions, photo attachments, and automatic message auto-purge for data safety.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                <Gift className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Virtual Gifts &amp; Badges
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Express interest by sending virtual gifts and earning achievement badges as you engage with the community.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Privacy &amp; Data Deletion Policy
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Automatic cascade deletion for accounts inactive over 10 days to minimize sensitive data footprint, along with PDF export.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* How LoveLK Works */}
      <section className="py-12 sm:py-20 bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-pink-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-pink-400 mb-2 block">
              Simple Step-by-Step Guide
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-4">
              How LoveLK Works
            </h2>
            <p className="text-sm sm:text-base text-purple-200">
              Start your journey toward a meaningful relationship in three easy steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            
            {/* Step 1 */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 hover:border-white/30 transition-all flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-xl font-black text-white shadow-lg mb-6">
                1
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Create Your Profile</h3>
              <p className="text-sm text-purple-100 leading-relaxed">
                Register in seconds, add details about your background, education, partner preferences, and horoscope details.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 hover:border-white/30 transition-all flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center text-xl font-black text-white shadow-lg mb-6">
                2
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Discover People</h3>
              <p className="text-sm text-purple-100 leading-relaxed">
                Use intuitive filters, district location preferences, and horoscope Porondam scores to explore compatible profiles.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 hover:border-white/30 transition-all flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-purple-500 flex items-center justify-center text-xl font-black text-white shadow-lg mb-6">
                3
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Connect &amp; Build Relationships</h3>
              <p className="text-sm text-purple-100 leading-relaxed">
                Send messages, express interest with gifts, request contact details safely, and take your connection forward.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Safety & Privacy Section */}
      <section className="py-12 sm:py-20 bg-white dark:bg-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-purple-50 via-pink-50/50 to-slate-50 dark:from-slate-900 dark:via-purple-950/40 dark:to-slate-900 border border-purple-100 dark:border-slate-700 space-y-6">
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                  Safety, Privacy &amp; Member Protection
                </h2>
                <p className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 font-semibold">
                  Built on respect and data integrity
                </p>
              </div>
            </div>

            <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
              We believe online matchmaking must always prioritize security. LoveLK implements state-of-the-art encryption, HTTP-only authentication, profile blocking, and continuous moderation to help protect users from harassment or fraudulent activity.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span>Password encryption &amp; secure sessions</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span>36h / 48h Chat Message Retention &amp; TTL Purge</span>
              </div>
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span>Downloadable A4 PDF Profile Data Export</span>
              </div>
              <div className="flex items-center gap-2.5">
                <HelpCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span>Dedicated Support Center &amp; Helpdesk</span>
              </div>
            </div>

            {/* Links to legal policies */}
            <div className="pt-4 border-t border-purple-100 dark:border-slate-700/80 flex flex-wrap items-center gap-3 text-xs sm:text-sm">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Legal Policies:</span>
              <Link to="/privacy-policy" className="text-purple-600 hover:text-purple-700 dark:text-purple-400 font-medium underline">
                Privacy Policy
              </Link>
              <span>•</span>
              <Link to="/privacy-policy" className="text-purple-600 hover:text-purple-700 dark:text-purple-400 font-medium underline">
                Terms of Service
              </Link>
              <span>•</span>
              <Link to="/privacy-policy" className="text-purple-600 hover:text-purple-700 dark:text-purple-400 font-medium underline">
                Community Guidelines
              </Link>
              <span>•</span>
              <Link to="/contact-admin" className="text-purple-600 hover:text-purple-700 dark:text-purple-400 font-medium underline">
                Contact Support
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* Final Call to Action Section */}
      <section className="py-16 sm:py-24 text-center relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl relative z-10">
          
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex items-center justify-center mx-auto mb-6 shadow-xl shadow-purple-500/20">
            <Heart className="w-8 h-8 fill-white text-white" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white mb-4">
            Ready to Find Your Connection?
          </h2>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
            Join thousands of adults looking for authentic matchmaking in Sri Lanka. Take the first step today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <Link
                to="/users"
                className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-700 hover:to-rose-700 text-white font-bold text-base shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                <span>Browse Profiles</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-700 hover:to-rose-700 text-white font-bold text-base shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                  <span>Create Free Account</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold text-base hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                >
                  Member Login
                </Link>
              </>
            )}
          </div>

        </div>
      </section>

    </div>
  );
};

export default About;
