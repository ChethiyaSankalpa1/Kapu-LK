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
  Flame,
} from 'lucide-react';

const About = () => {
  const { user } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="w-full flex-1 bg-gradient-to-br from-slate-50 via-rose-50/30 to-pink-50/20 dark:from-slate-950 dark:via-rose-950/20 dark:to-slate-900 text-slate-800 dark:text-slate-100 min-h-screen overflow-x-hidden">
      
      {/* Top Navigation Back Button Container */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl pt-6">
        <BackButton label="Back to Home" fallback="/" />
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-6 pb-16 sm:pb-24 lg:pb-28">
        {/* Subtle romantic ambient background circles */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] sm:w-[700px] sm:h-[700px] bg-gradient-to-tr from-rose-400/20 via-pink-400/20 to-amber-400/10 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '6s' }} />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl text-center relative z-10">
          
          {/* Logo & Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-rose-100 to-pink-100 dark:from-rose-950/60 dark:to-pink-950/60 border border-rose-200 dark:border-rose-800/60 shadow-sm mb-6 sm:mb-8">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-rose-600 via-pink-600 to-amber-500 flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-white fill-white" />
            </div>
            <span className="text-xs sm:text-sm font-bold bg-gradient-to-r from-rose-700 via-pink-600 to-amber-600 dark:from-rose-300 dark:to-amber-300 bg-clip-text text-transparent">
              Kapu-LK • Sri Lanka's Modern Dating &amp; Matchmaking Platform
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight max-w-4xl mx-auto leading-[1.15] mb-6">
            Your Story Starts With A{' '}
            <span className="bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 bg-clip-text text-transparent">
              Meaningful Connection
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed mb-8 sm:mb-10 font-normal">
            Kapu-LK is reimagining modern dating and matchmaking for Sri Lankans. Discover genuine young adults, explore compatible matches, and connect with people looking for real, lasting relationships in a safe and welcoming space.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 max-w-md mx-auto">
            {user ? (
              <Link
                to="/users"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 hover:from-rose-700 hover:via-pink-700 hover:to-rose-600 text-white font-bold text-base shadow-xl shadow-rose-500/25 hover:shadow-rose-500/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-2.5"
              >
                <Flame className="w-5 h-5" />
                <span>Start Discovery</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 hover:from-rose-700 hover:via-pink-700 hover:to-rose-600 text-white font-bold text-base shadow-xl shadow-rose-500/25 hover:shadow-rose-500/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-2.5"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Join Kapu-LK Free</span>
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-base hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all flex items-center justify-center gap-2.5"
                >
                  <span>Member Login</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>

          {/* Highlight metrics */}
          <div className="mt-12 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto pt-8 border-t border-rose-100 dark:border-slate-800">
            <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/60 backdrop-blur-sm border border-rose-100 dark:border-slate-700/50">
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 mb-1">100%</div>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">Verified Profiles</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/60 backdrop-blur-sm border border-rose-100 dark:border-slate-700/50">
              <div className="text-2xl sm:text-3xl font-extrabold text-pink-600 dark:text-pink-400 mb-1">24/7</div>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">Privacy &amp; Safety</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/60 backdrop-blur-sm border border-rose-100 dark:border-slate-700/50">
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 mb-1">25 Districts</div>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">Across Sri Lanka</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/60 backdrop-blur-sm border border-rose-100 dark:border-slate-700/50">
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-500 dark:text-amber-400 mb-1">Porondam</div>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">Horoscope Compatibility</div>
            </div>
          </div>

        </div>
      </section>

      {/* Our Story & Our Mission */}
      <section className="py-12 sm:py-16 bg-white dark:bg-slate-900 border-y border-rose-100 dark:border-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-stretch">
            
            {/* Our Story Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-rose-50/60 to-pink-50/40 dark:from-slate-900/80 dark:to-rose-950/20 border border-rose-100 dark:border-slate-800 space-y-4 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-5">
                  <Compass className="w-6 h-6" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-3">
                  Our Story
                </h2>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  Kapu-LK was born out of a simple need: Sri Lankan young adults were stuck between outdated matrimonial websites and foreign dating apps that don't understand our culture.
                </p>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mt-3">
                  We built Kapu-LK (accessible at KapuLK.online) to bridge that gap — combining the interactive swipe feel of modern dating apps with the respect, privacy, and traditional compatibility that Sri Lankans value.
                </p>
              </div>
            </div>

            {/* Our Mission Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-pink-50/60 to-amber-50/40 dark:from-slate-900/80 dark:to-pink-950/20 border border-pink-100 dark:border-slate-800 space-y-4 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-400 flex items-center justify-center mb-5">
                  <Heart className="w-6 h-6 fill-current" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-3">
                  Our Mission
                </h2>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  To empower adults across Sri Lanka to discover genuine relationships, companionship, and lifelong partners in a safe, transparent, and enjoyable dating environment.
                </p>
                <ul className="mt-4 space-y-2.5 text-sm sm:text-base text-slate-700 dark:text-slate-200">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <span>Zero fake profiles — authentic and verified community</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <span>Complete privacy protection — your phone &amp; email stay protected</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <span>Modern interactive experience tailored for mobile devices</span>
                  </li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Why Kapu-LK */}
      <section className="py-12 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
              Why Choose Kapu-LK?
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              Built specifically with safety, compatibility, and romance at heart.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Tinder-Style Discovery
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Swipe through high-quality profile cards or browse in a classic grid. Like profiles you love and connect when the interest is mutual.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 flex items-center justify-center mb-4">
                <Star className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Porondam &amp; Compatibility
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Astrological compatibility scores and Porondam insights combined with shared interests and lifestyle preferences.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
                <EyeOff className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Full Privacy Control
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                You decide when and with whom to share contact info. Photos are verified and protected against unauthorized use.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Match-Based Chat
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Start real-time conversations with mutual matches, share photo messages, and build rapport safely inside the platform.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                <Gift className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Virtual Gifts &amp; Badges
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Break the ice effortlessly by sending charming virtual gifts and unlocking special profile achievements.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Admin Review &amp; Trust
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Every member profile is reviewed before full activation, ensuring that only genuine, serious singles participate.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* How Kapu-LK Works */}
      <section className="py-12 sm:py-20 bg-gradient-to-br from-slate-950 via-rose-950 to-slate-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-rose-400 mb-2 block">
              3 Simple Steps
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-4">
              How Kapu-LK Works
            </h2>
            <p className="text-sm sm:text-base text-rose-200">
              Start your journey toward meaningful romance in minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            
            {/* Step 1 */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 hover:border-white/30 transition-all flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-xl font-black text-white shadow-lg mb-6">
                1
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Create Free Profile</h3>
              <p className="text-sm text-rose-100 leading-relaxed">
                Sign up in 60 seconds, upload your favorite photos, and share your interests, lifestyle, and relationship goals.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 hover:border-white/30 transition-all flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center text-xl font-black text-white shadow-lg mb-6">
                2
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Discover &amp; Swipe</h3>
              <p className="text-sm text-rose-100 leading-relaxed">
                Explore profiles filtered by age, district, and interests. Swipe right on people who catch your attention.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 hover:border-white/30 transition-all flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-xl font-black text-white shadow-lg mb-6">
                3
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Match &amp; Connect</h3>
              <p className="text-sm text-rose-100 leading-relaxed">
                When interest is mutual, chat in real time, break the ice with gifts, and build a lasting relationship.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Safety & Privacy Section */}
      <section className="py-12 sm:py-20 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-rose-50 via-pink-50/50 to-slate-50 dark:from-slate-900 dark:via-rose-950/40 dark:to-slate-900 border border-rose-100 dark:border-slate-800 space-y-6">
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  Safety, Trust &amp; Member Protection
                </h2>
                <p className="text-xs sm:text-sm text-rose-600 dark:text-rose-400 font-semibold">
                  Built on respect and data integrity (18+ Adults Only)
                </p>
              </div>
            </div>

            <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
              We believe modern dating must always prioritize personal security. Kapu-LK enforces verified emails, HTTP-only session tokens, profile blocking, and proactive community moderation to keep your dating experience positive and safe.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>Encrypted passwords &amp; secure session cookies</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>Match-authorized direct messaging &amp; auto-purge</span>
              </div>
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>One-click account and data deletion rights</span>
              </div>
              <div className="flex items-center gap-2.5">
                <HelpCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>Dedicated moderation team &amp; 24/7 report review</span>
              </div>
            </div>

            {/* Links to legal policies */}
            <div className="pt-4 border-t border-rose-100 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs sm:text-sm">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Legal:</span>
              <Link to="/privacy-policy" className="text-rose-600 hover:text-rose-700 dark:text-rose-400 font-medium underline">
                Privacy Policy
              </Link>
              <span>•</span>
              <Link to="/terms" className="text-rose-600 hover:text-rose-700 dark:text-rose-400 font-medium underline">
                Terms of Service
              </Link>
              <span>•</span>
              <Link to="/contact-admin" className="text-rose-600 hover:text-rose-700 dark:text-rose-400 font-medium underline">
                Contact Support
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* Final Call to Action Section */}
      <section className="py-16 sm:py-24 text-center relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl relative z-10">
          
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-rose-600 via-pink-600 to-amber-500 text-white flex items-center justify-center mx-auto mb-6 shadow-xl shadow-rose-500/25">
            <Heart className="w-8 h-8 fill-white text-white" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white mb-4">
            Ready to Find Your Connection?
          </h2>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
            Join young adults looking for authentic matchmaking and dating in Sri Lanka. Your story begins today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <Link
                to="/users"
                className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white font-bold text-base shadow-xl shadow-rose-500/25 hover:shadow-rose-500/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                <span>Browse Discoveries</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white font-bold text-base shadow-xl shadow-rose-500/25 hover:shadow-rose-500/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
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
