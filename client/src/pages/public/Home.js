import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../services/api';
import ProfileAvatar from '../../components/ui/ProfileAvatar';
import { 
    Heart, Shield, Sparkles, Search, CheckCircle2, Lock, ArrowRight, MapPin,
    Award, MessageCircle, Flame, Star, ChevronDown, 
    ShieldCheck, Zap, Smile
} from 'lucide-react';

const SRI_LANKAN_DISTRICTS = [
    'All Sri Lanka', 'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
    'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu',
    'Batticaloa', 'Ampara', 'Trincomalee', 'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa',
    'Badulla', 'Monaragala', 'Ratnapura', 'Kegalle', 'Overseas / Expat'
];

const SAMPLE_MEMBERS = [
    {
        name: 'Sanduni',
        age: 26,
        district: 'Colombo',
        occupation: 'Software Engineer',
        intent: 'Marriage / Long-term',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
        quote: 'Looking for someone who values kindness, laughing together, and travel.'
    },
    {
        name: 'Kavinda',
        age: 29,
        district: 'Kandy',
        occupation: 'Medical Doctor',
        intent: 'Serious Relationship',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
        quote: 'Passionate about outdoor hiking, books, and deep conversations over tea.'
    },
    {
        name: 'Nadeesha',
        age: 27,
        district: 'Galle',
        occupation: 'Financial Analyst',
        intent: 'Marriage & Family',
        image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
        quote: 'Love coastal sunsets, acoustic music, and someone with ambition and warmth.'
    },
    {
        name: 'Dinuka',
        age: 31,
        district: 'Gampaha',
        occupation: 'Architect',
        intent: 'Dating with Purpose',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
        quote: 'Creative thinker who appreciates art, weekend road trips, and honesty.'
    }
];

const SUCCESS_STORIES = [
    {
        couple: 'Kasun & Oshadi',
        location: 'Colombo & Kandy',
        time: 'Together 1 year',
        story: 'We were both tired of traditional arranged matchmaking that felt impersonal. On Kapu-LK, our shared values and interests made talking effortless. We are engaged to be married this December!',
        image: 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&w=600&q=80'
    },
    {
        couple: 'Raveen & Chamari',
        location: 'Galle & Matara',
        time: 'Married 6 months',
        story: 'The verified profiles gave us peace of mind from day one. Kapu-LK made it easy to connect with someone from the south who shared my culture, dreams, and family perspective.',
        image: 'https://images.unsplash.com/photo-1621252179027-94459d278660?auto=format&fit=crop&w=600&q=80'
    }
];

const FAQS = [
    {
        q: 'Is Kapu-LK free to join and use?',
        a: 'Yes! Joining Kapu-LK is completely free. You can create your detailed profile, upload photos, specify your preferences, and browse matches across Sri Lanka. Premium upgrades are optional for members desiring unlimited messaging and VIP visibility.'
    },
    {
        q: 'How does account verification work for new members?',
        a: 'Every new account and photograph submitted on Kapu-LK is carefully reviewed by our human admin team. This ensures our community remains 100% real, safe, and free from fake profiles, spam, and disrespectful behavior.'
    },
    {
        q: 'Is my personal contact information safe?',
        a: 'Absolutely. Your phone number and email address are strictly private and never displayed publicly on your profile card. You are in complete control of when and with whom you share your contact details.'
    },
    {
        q: 'How is Kapu-LK different from other dating apps in Sri Lanka?',
        a: 'Kapu-LK is custom-tailored for Sri Lankan young adults and families. We combine the modern, intuitive discovery experience of apps like Tinder and Hinge with the safety, cultural respect, and serious relationship intentions of traditional matchmaking.'
    },
    {
        q: 'Can I access Kapu-LK on mobile?',
        a: 'Yes, Kapu-LK is built mobile-first. It runs smoothly as a responsive web app on all Android and iPhone smartphones, complete with a convenient bottom navigation dock for instant discovery, matches, and chats.'
    }
];

const Home = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    const [finderData, setFinderData] = useState({
        iAm: 'male',
        seeking: 'female',
        ageRange: '22-30',
        district: 'All Sri Lanka',
        intent: 'all'
    });

    const [openFaq, setOpenFaq] = useState(null);
    const [featuredProfiles, setFeaturedProfiles] = useState([]);

    useEffect(() => {
        let isMounted = true;
        userAPI.getFeaturedUsers()
            .then((res) => {
                if (isMounted && Array.isArray(res.data) && res.data.length > 0) {
                    setFeaturedProfiles(res.data);
                }
            })
            .catch(() => {});
        return () => { isMounted = false; };
    }, []);

    useEffect(() => {
        if (!loading && user) {
            navigate((user?.role || '').toString().toLowerCase() === 'admin' ? '/admin' : '/dashboard');
        }
    }, [user, loading, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-rose-600"></div>
            </div>
        );
    }

    const handleQuickSearch = (e) => {
        e.preventDefault();
        const [minAge, maxAge] = finderData.ageRange === 'all' 
            ? ['', ''] 
            : finderData.ageRange.split('-');

        const queryParams = new URLSearchParams();
        if (finderData.seeking) queryParams.set('gender', finderData.seeking);
        if (minAge) queryParams.set('minAge', minAge);
        if (maxAge) queryParams.set('maxAge', maxAge);
        if (finderData.district && finderData.district !== 'All Sri Lanka') {
            queryParams.set('location', finderData.district);
        }

        if (user) {
            navigate(`/users?${queryParams.toString()}`);
        } else {
            navigate(`/register?gender=${finderData.iAm}&seeking=${finderData.seeking}&district=${encodeURIComponent(finderData.district)}`);
        }
    };

    return (
        <div className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
            
            {/* HERO SECTION */}
            <section className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24 text-white">
                {/* Hero Scenic Background Image */}
                <div className="absolute inset-0 bg-slate-950">
                    <img 
                        src="/images/kapu-hero-cover.png"
                        alt="Kapu-LK Romantic Sunset"
                        className="w-full h-full object-cover object-[center_35%] opacity-85 scale-105 transform animate-fade-in"
                    />
                    {/* Multi-layered cinematic gradient overlays */}
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-rose-950/80 to-purple-950/60" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-black/20" />
                </div>

                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 max-w-7xl">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                        
                        {/* Hero Text Copy (7 cols) */}
                        <div className="lg:col-span-7 text-center lg:text-left space-y-6">
                            
                            {/* Verification Pill */}
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-semibold text-rose-200 shadow-sm">
                                <Sparkles className="w-4 h-4 text-rose-400" />
                                <span>Sri Lanka's Modern Dating &amp; Matchmaking Platform</span>
                                <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
                            </div>

                            {/* Emotional Headline */}
                            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12]">
                                Your Story Starts With <br />
                                <span className="bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
                                    A Connection.
                                </span>
                            </h1>

                            {/* Supporting Text */}
                            <p className="text-base sm:text-lg text-slate-200 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
                                Meet genuine people, discover meaningful connections, and find someone special with Kapu-LK. A safe, respectful space designed for young adults and singles across Sri Lanka.
                            </p>

                            {/* CTAs */}
                            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4">
                                <Link
                                    to="/register"
                                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 hover:from-rose-500 hover:to-pink-500 text-white font-extrabold text-base shadow-xl shadow-rose-600/30 active:scale-95 transition-all text-center flex items-center justify-center gap-2"
                                >
                                    <Heart className="w-5 h-5 fill-white" />
                                    <span>Join Free Today</span>
                                    <ArrowRight className="w-4 h-4" />
                                </Link>

                                <Link
                                    to="/users"
                                    className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/25 text-white font-bold text-base transition-all text-center flex items-center justify-center gap-2"
                                >
                                    <Search className="w-4 h-4 text-rose-300" />
                                    <span>Find Your Match</span>
                                </Link>
                            </div>

                            {/* Social Proof Stats Strip */}
                            <div className="pt-4 grid grid-cols-3 gap-3 max-w-md mx-auto lg:mx-0 text-left border-t border-white/15">
                                <div>
                                    <span className="block text-xl sm:text-2xl font-black text-rose-300">100%</span>
                                    <span className="text-[11px] text-slate-300">Admin Verified</span>
                                </div>
                                <div>
                                    <span className="block text-xl sm:text-2xl font-black text-pink-300">25</span>
                                    <span className="text-[11px] text-slate-300">Districts &amp; Global</span>
                                </div>
                                <div>
                                    <span className="block text-xl sm:text-2xl font-black text-amber-300">18+</span>
                                    <span className="text-[11px] text-slate-300">Safe &amp; Private</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Match Finder Glass Widget (5 cols) */}
                        <div className="lg:col-span-5">
                            <div className="backdrop-blur-2xl bg-white/90 dark:bg-slate-900/90 border border-white/60 dark:border-slate-700/60 shadow-2xl shadow-rose-950/50 rounded-3xl p-5 sm:p-7 text-slate-900 dark:text-slate-100 relative overflow-hidden">
                                
                                {/* Accent gradient line */}
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500" />

                                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                                    <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600">
                                        <Heart className="w-5 h-5 fill-rose-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                                            Quick Match Finder
                                        </h2>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                            Discover singles matching your exact preferences
                                        </p>
                                    </div>
                                </div>

                                <form onSubmit={handleQuickSearch} className="space-y-3.5">
                                    {/* I Am / Looking For Row */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                                                I Am A
                                            </label>
                                            <select
                                                value={finderData.iAm}
                                                onChange={(e) => setFinderData({
                                                    ...finderData,
                                                    iAm: e.target.value,
                                                    seeking: e.target.value === 'male' ? 'female' : 'male'
                                                })}
                                                className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-rose-500 outline-none transition"
                                            >
                                                <option value="male">Man</option>
                                                <option value="female">Woman</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                                                Seeking A
                                            </label>
                                            <select
                                                value={finderData.seeking}
                                                onChange={(e) => setFinderData({ ...finderData, seeking: e.target.value })}
                                                className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-rose-500 outline-none transition"
                                            >
                                                <option value="female">Woman</option>
                                                <option value="male">Man</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Age Range */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                                            Age Preference
                                        </label>
                                        <select
                                            value={finderData.ageRange}
                                            onChange={(e) => setFinderData({ ...finderData, ageRange: e.target.value })}
                                            className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-rose-500 outline-none transition"
                                        >
                                            <option value="18-24">18 - 24 years</option>
                                            <option value="22-30">22 - 30 years</option>
                                            <option value="25-35">25 - 35 years</option>
                                            <option value="30-45">30 - 45 years</option>
                                            <option value="40-60">40 - 60 years</option>
                                            <option value="all">Any Age</option>
                                        </select>
                                    </div>

                                    {/* District Location */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                                            District / Location
                                        </label>
                                        <select
                                            value={finderData.district}
                                            onChange={(e) => setFinderData({ ...finderData, district: e.target.value })}
                                            className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-rose-500 outline-none transition"
                                        >
                                            {SRI_LANKAN_DISTRICTS.map((d) => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Submit Action */}
                                    <button
                                        type="submit"
                                        className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-sm shadow-lg shadow-rose-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
                                    >
                                        <Search className="w-4 h-4" />
                                        <span>Find Compatible Matches</span>
                                        <ArrowRight className="w-4 h-4 ml-0.5" />
                                    </button>

                                    <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 pt-1">
                                        🔒 Free registration • 100% confidential • Respectful
                                    </p>
                                </form>
                            </div>
                        </div>

                    </div>
                </div>
            </section>


            {/* TRUST & SAFETY HIGHLIGHTS STRIP */}
            <section className="border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                        <div className="flex flex-col items-center">
                            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 mb-2">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Admin Verified Profiles</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">Manual review for every member</span>
                        </div>

                        <div className="flex flex-col items-center">
                            <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 mb-2">
                                <Lock className="w-6 h-6" />
                            </div>
                            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Privacy &amp; Contact Shield</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">Phone &amp; email never made public</span>
                        </div>

                        <div className="flex flex-col items-center">
                            <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 mb-2">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Respectful 18+ Community</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">Strict zero-tolerance for harassment</span>
                        </div>

                        <div className="flex flex-col items-center">
                            <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 mb-2">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">All 25 Districts &amp; Expats</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">Local islandwide and overseas diaspora</span>
                        </div>
                    </div>
                </div>
            </section>


            {/* DISCOVER FEATURED MEMBERS PREVIEW */}
            <section className="py-14 sm:py-20 bg-slate-50 dark:bg-slate-950">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                    
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-bold mb-2">
                                <Flame className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
                                <span>Featured Profiles</span>
                            </div>
                            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                                Meet Genuine Sri Lankan Singles
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                                Discover verified profiles looking for sincere relationships, shared values, and life companionship.
                            </p>
                        </div>

                        <Link
                            to="/users"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-slate-800 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 text-xs sm:text-sm font-bold shadow-xs transition shrink-0"
                        >
                            <span>Explore All Profiles</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {/* Member Cards Carousel Grid (Real Profiles from App) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {(featuredProfiles.length > 0 ? featuredProfiles : SAMPLE_MEMBERS).slice(0, 8).map((m, idx) => {
                            const isReal = Boolean(m._id);
                            const name = isReal ? (m.name ? m.name.split(' ')[0] : 'Member') : m.name;
                            const age = m.age ? `, ${m.age}` : '';
                            const location = m.district || m.location || 'Sri Lanka';
                            const occupation = m.occupation || m.education || 'Member';
                            const quote = m.bio 
                                ? (m.bio.split('\n')[0].slice(0, 95) + (m.bio.length > 95 ? '...' : '')) 
                                : (m.quote || 'Looking for meaningful connections on Kapu-LK.');
                            const intentPill = m.isPremium 
                                ? '⭐ VIP Member' 
                                : (m.maritalStatus ? m.maritalStatus : (m.intent || 'Verified Single'));

                            return (
                                <div
                                    key={m._id || idx}
                                    className="group bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl dark:hover:shadow-rose-950/30 transition-all duration-300 flex flex-col transform hover:-translate-y-1.5"
                                >
                                    {/* Portrait Photo */}
                                    <div className="relative aspect-[4/5] overflow-hidden bg-slate-200 dark:bg-slate-800">
                                        {isReal ? (
                                            m.profileImageUrl ? (
                                                <img
                                                    src={m.profileImageUrl}
                                                    alt={name}
                                                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <ProfileAvatar
                                                    user={m}
                                                    className="w-full h-full"
                                                    avatarClassName="text-7xl"
                                                    fallbackClassName="text-4xl font-extrabold text-white bg-gradient-to-tr from-rose-600 to-pink-600"
                                                />
                                            )
                                        ) : (
                                            <img
                                                src={m.image}
                                                alt={name}
                                                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                                                loading="lazy"
                                            />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent pointer-events-none" />

                                        {/* Intent / Status pill */}
                                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-bold text-white shadow-xs capitalize">
                                            {intentPill}
                                        </div>

                                        {/* Verification badge */}
                                        <div className="absolute top-3 right-3 p-1 rounded-full bg-rose-600 text-white shadow-sm" title="Verified Member">
                                            <CheckCircle2 className="w-3.5 h-3.5 fill-white text-rose-600" />
                                        </div>

                                        {/* Overlay info */}
                                        <div className="absolute bottom-3 left-3 right-3 text-white">
                                            <h3 className="text-lg font-black leading-tight flex items-center gap-1.5">
                                                <span>{name}{age}</span>
                                            </h3>
                                            <p className="text-xs text-slate-200 flex items-center gap-1 mt-0.5">
                                                <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                                                <span>{location} • {occupation}</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Quote */}
                                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                        <p className="text-xs text-slate-600 dark:text-slate-300 italic line-clamp-2">
                                            "{quote}"
                                        </p>

                                        <Link
                                            to={isReal ? `/users/${m._id}` : '/register'}
                                            className="w-full py-2 px-3 text-center rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-600 hover:text-white text-rose-700 dark:text-rose-300 font-bold text-xs transition duration-200 flex items-center justify-center gap-1.5"
                                        >
                                            <MessageCircle className="w-3.5 h-3.5" />
                                            <span>Connect With {name}</span>
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                </div>
            </section>


            {/* HOW KAPU-LK WORKS */}
            <section className="py-14 sm:py-20 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
                    
                    <div className="text-center max-w-2xl mx-auto mb-14">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 text-xs font-bold mb-2">
                            <Zap className="w-3.5 h-3.5 text-pink-600" />
                            <span>Simple &amp; Respectful</span>
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                            How Kapu-LK Works
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
                            A seamless journey from initial discovery to real-life companionship.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                        {/* Step 1 */}
                        <div className="relative bg-slate-50 dark:bg-slate-950 rounded-3xl p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center space-y-4">
                            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center text-xl font-black shadow-xs">
                                1
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                Create Your Genuine Profile
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                Share your background, hobbies, education, career, and partner preferences. Choose a custom avatar or upload genuine photographs.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="relative bg-slate-50 dark:bg-slate-950 rounded-3xl p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center space-y-4">
                            <div className="w-14 h-14 mx-auto rounded-2xl bg-pink-100 dark:bg-pink-950/60 text-pink-600 flex items-center justify-center text-xl font-black shadow-xs">
                                2
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                Discover Compatible Matches
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                Use modern swipe discovery or filter by age, district, religion, and lifestyle. Discover verified singles aligned with your values.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="relative bg-slate-50 dark:bg-slate-950 rounded-3xl p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center space-y-4">
                            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center text-xl font-black shadow-xs">
                                3
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                Connect &amp; Meet Safely
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                Send likes, spark conversations with built-in icebreakers, and chat in private WhatsApp-style messaging when you both express mutual interest.
                            </p>
                        </div>
                    </div>

                </div>
            </section>


            {/* WHY CHOOSE KAPU-LK – 4 PILLARS */}
            <section className="py-14 sm:py-20 bg-slate-50 dark:bg-slate-950">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
                    <div className="text-center max-w-2xl mx-auto mb-14">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-bold mb-2">
                            <Star className="w-3.5 h-3.5 text-rose-600" />
                            <span>The Kapu-LK Difference</span>
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                            Built Specifically for Sri Lanka
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
                            Combining modern dating app excitement with the sincerity and respect our culture values.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                                <Shield className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1.5">
                                    Zero Tolerance for Fake Accounts
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                    No bots, no fabricated profiles. Our dedicated moderation team reviews every submission before activation, creating an authentic, trustworthy community.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-pink-100 dark:bg-pink-950/60 text-pink-600 flex items-center justify-center shrink-0">
                                <Smile className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1.5">
                                    Engaging, Fun &amp; Intuitive
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                    Enjoy Tinder and Bumble-style swipe interactions, attractive profile cards, gift reactions, and rich icebreaker prompts that make starting conversations natural.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center shrink-0">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1.5">
                                    Islandwide &amp; Diaspora Reach
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                    Whether you live in Colombo, Kandy, Galle, Jaffna, or are a Sri Lankan expat living in Australia, the UK, or the Middle East, discover singles from your hometown.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
                                <Award className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1.5">
                                    Serious &amp; Meaningful Intentions
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                    From dating with marriage in mind to lifelong partnerships, members clearly specify their intentions so nobody wastes time on misaligned expectations.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </section>


            {/* SUCCESS STORIES SECTION */}
            <section className="py-14 sm:py-20 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
                    <div className="text-center max-w-2xl mx-auto mb-14">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-bold mb-2">
                            <Heart className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
                            <span>Real Love Stories</span>
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                            They Found Their Person on Kapu-LK
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
                            Inspiring journeys of Sri Lankan couples who started with a single hello.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {SUCCESS_STORIES.map((s, idx) => (
                            <div 
                                key={idx}
                                className="bg-slate-50 dark:bg-slate-950 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-6 items-center"
                            >
                                <img
                                    src={s.image}
                                    alt={s.couple}
                                    className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl object-cover object-center shadow-md shrink-0"
                                />
                                <div className="space-y-2 text-center sm:text-left">
                                    <div className="flex items-center justify-center sm:justify-start gap-1 text-amber-500">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                        ))}
                                    </div>
                                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                                        {s.couple}
                                    </h3>
                                    <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                                        {s.location} • {s.time}
                                    </p>
                                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">
                                        "{s.story}"
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>


            {/* FREQUENTLY ASKED QUESTIONS (ACCORDION) */}
            <section className="py-14 sm:py-20 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
                            Everything you need to know about starting your dating journey with Kapu-LK.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {FAQS.map((faq, idx) => {
                            const isOpen = openFaq === idx;
                            return (
                                <div
                                    key={idx}
                                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs"
                                >
                                    <button
                                        type="button"
                                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                                        className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 dark:text-white"
                                    >
                                        <span>{faq.q}</span>
                                        <ChevronDown className={`w-4 h-4 text-rose-600 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {isOpen && (
                                        <div className="px-4 pb-5 sm:px-5 sm:pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                                            {faq.a}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>


            {/* EMOTIONAL BOTTOM CTA BANNER */}
            <section className="py-16 sm:py-20 bg-gradient-to-r from-rose-900 via-pink-900 to-slate-950 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-500/20 via-transparent to-transparent pointer-events-none" />

                <div className="container mx-auto px-4 text-center relative z-10 max-w-3xl space-y-5">
                    <div className="w-16 h-16 mx-auto rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-rose-400 shadow-xl">
                        <Heart className="w-8 h-8 fill-rose-400 animate-pulse" />
                    </div>

                    <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                        Ready to Meet Your Someone Special?
                    </h2>

                    <p className="text-slate-200 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                        Join thousands of genuine Sri Lankan singles looking for love, shared happiness, and lifelong companionship on Kapu-LK.
                    </p>

                    <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link
                            to="/register"
                            className="w-full sm:w-auto px-9 py-4 rounded-2xl bg-white hover:bg-slate-100 text-rose-900 font-extrabold text-base shadow-2xl active:scale-95 transition-all text-center flex items-center justify-center gap-2"
                        >
                            <span>Create Free Profile</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link
                            to="/login"
                            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/25 text-white font-bold text-base transition-all text-center"
                        >
                            Already a Member? Sign In
                        </Link>
                    </div>

                    <p className="text-[11px] text-slate-400 pt-2">
                        18+ Adults Only • Strict Privacy Controls • Sri Lanka &amp; Global Expats
                    </p>
                </div>
            </section>

        </div>
    );
};

export default Home;
