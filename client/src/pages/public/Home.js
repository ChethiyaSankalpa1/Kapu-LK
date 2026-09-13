import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { 
    Heart, Shield, Sparkles, Search, CheckCircle2, Lock, ScrollText, ArrowRight, MapPin, Award
} from 'lucide-react';

const SRI_LANKAN_DISTRICTS = [
    'All Sri Lanka', 'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
    'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu',
    'Batticaloa', 'Ampara', 'Trincomalee', 'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa',
    'Badulla', 'Monaragala', 'Ratnapura', 'Kegalle', 'Overseas / Expat'
];

const Home = () => {
    const { t } = useTranslation();
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    // Quick match finder state
    const [finderData, setFinderData] = useState({
        iAm: 'male',
        seeking: 'female',
        ageRange: '22-30',
        district: 'All Sri Lanka',
        religion: 'All'
    });

    useEffect(() => {
        if (!loading && user) {
            navigate((user?.role || '').toString().toLowerCase() === 'admin' ? '/admin' : '/dashboard');
        }
    }, [user, loading, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
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
        if (finderData.religion && finderData.religion !== 'All') {
            queryParams.set('religion', finderData.religion);
        }

        if (user) {
            navigate(`/users?${queryParams.toString()}`);
        } else {
            // Send new visitors to register with these preferences pre-selected
            navigate(`/register?gender=${finderData.iAm}&seeking=${finderData.seeking}&district=${encodeURIComponent(finderData.district)}`);
        }
    };

    return (
        <div className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
            {/* Hero Section */}
            <div className="relative overflow-hidden pt-6 pb-10 sm:pt-8 sm:pb-12 md:pt-10 md:pb-14 text-white">
                {/* Background Image */}
                <img src="/couple-hero.png" className="absolute inset-0 w-full h-full object-cover object-[70%_center]" alt="" aria-hidden="true" />

                {/* Overlay: darker left, lighter right */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/95 via-purple-950/80 to-purple-900/30" aria-hidden="true" />
                {/* Bottom fade: transparent to slate-950/30 */}
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950/30 to-transparent" aria-hidden="true" />

                <div className="container mx-auto px-4 relative z-10">
                    {/* Top Pill - centered on sm, left-aligned on md+ */}
                    <div className="flex justify-center md:justify-start mb-6">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/15 text-xs sm:text-sm font-semibold text-pink-200 shadow-sm animate-fade-in">
                            <Sparkles className="w-4 h-4 text-pink-400" />
                            <span>{t('home.heroPill', { defaultValue: "Sri Lanka's Most Trusted Modern Matrimony Platform" })}</span>
                        </div>
                    </div>

                    {/* Main Headline - centered on sm, left-aligned on md+ */}
                    <div className="max-w-4xl text-center md:text-left mb-10">
                        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.15] mb-4 sm:mb-6">
                            {t('home.heroTitle', { defaultValue: 'Find Your Perfect Life Partner' })}
                        </h1>
                        <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto md:mx-0 font-normal leading-relaxed">
                            {t('home.heroSubtitle', { defaultValue: 'Connect with genuine, verified Sri Lankan brides and grooms with shared values, traditions, and aspirations.' })}
                        </p>
                    </div>

                    {/* Interactive Quick Match Finder Widget - Glass styled */}
                    <div className="max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto md:ml-0 backdrop-blur-2xl bg-white/85 dark:bg-slate-900/80 border border-white/60 dark:border-slate-700/60 shadow-2xl shadow-purple-900/40 rounded-3xl p-5 sm:p-7 text-slate-900 dark:text-slate-100 mb-12 relative overflow-hidden">
                        {/* Top interior accent gradient strip */}
                        <div className="absolute top-0 left-5 right-5 h-0.5 bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-600 rounded-full" aria-hidden="true" />

                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                            <h2 className="text-base sm:text-lg font-bold">
                                {t('home.quickFinderTitle', { defaultValue: 'Quick Match Finder' })}
                            </h2>
                            <span className="ml-auto text-xs text-slate-400 font-medium hidden sm:inline">
                                {t('home.quickFinderSubtitle', { defaultValue: 'Filter by preferences in seconds' })}
                            </span>
                        </div>

                        <form onSubmit={handleQuickSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* I Am / Seeking */}
                            <div>
                                <label htmlFor="quick_find_iam" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                                    {t('home.iAm', { defaultValue: 'I Am A' })}
                                </label>
                                <select
                                    id="quick_find_iam"
                                    name="iAm"
                                    autoComplete="off"
                                    value={finderData.iAm}
                                    onChange={(e) => setFinderData({
                                        ...finderData,
                                        iAm: e.target.value,
                                        seeking: e.target.value === 'male' ? 'female' : 'male'
                                    })}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-0 text-sm font-medium focus:ring-2 focus:ring-purple-500 transition"
                                >
                                    <option value="male">{t('common.male', { defaultValue: 'Man' })}</option>
                                    <option value="female">{t('common.female', { defaultValue: 'Woman' })}</option>
                                </select>
                            </div>

                            {/* Looking For */}
                            <div>
                                <label htmlFor="quick_find_seeking" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                                    {t('home.seeking', { defaultValue: 'Looking For' })}
                                </label>
                                <select
                                    id="quick_find_seeking"
                                    name="seeking"
                                    autoComplete="off"
                                    value={finderData.seeking}
                                    onChange={(e) => setFinderData({ ...finderData, seeking: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-0 text-sm font-medium focus:ring-2 focus:ring-purple-500 transition"
                                >
                                    <option value="female">{t('common.female', { defaultValue: 'Woman' })}</option>
                                    <option value="male">{t('common.male', { defaultValue: 'Man' })}</option>
                                </select>
                            </div>

                            {/* Age Range */}
                            <div>
                                <label htmlFor="quick_find_agerange" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                                    {t('home.ageRange', { defaultValue: 'Age Range' })}
                                </label>
                                <select
                                    id="quick_find_agerange"
                                    name="ageRange"
                                    autoComplete="off"
                                    value={finderData.ageRange}
                                    onChange={(e) => setFinderData({ ...finderData, ageRange: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-0 text-sm font-medium focus:ring-2 focus:ring-purple-500 transition"
                                >
                                    <option value="18-25">18 - 25 yrs</option>
                                    <option value="22-30">22 - 30 yrs</option>
                                    <option value="25-35">25 - 35 yrs</option>
                                    <option value="30-42">30 - 42 yrs</option>
                                    <option value="40-60">40 - 60 yrs</option>
                                    <option value="all">{t('common.all', { defaultValue: 'Any Age' })}</option>
                                </select>
                            </div>

                            {/* District */}
                            <div>
                                <label htmlFor="quick_find_district" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                                    {t('home.district', { defaultValue: 'District' })}
                                </label>
                                <select
                                    id="quick_find_district"
                                    name="district"
                                    autoComplete="off"
                                    value={finderData.district}
                                    onChange={(e) => setFinderData({ ...finderData, district: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-0 text-sm font-medium focus:ring-2 focus:ring-purple-500 transition"
                                >
                                    {SRI_LANKAN_DISTRICTS.map((d) => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Submit Button */}
                            <div className="sm:col-span-2 lg:col-span-4 mt-2">
                                <button
                                    type="submit"
                                    className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-base shadow-lg shadow-pink-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 min-h-[48px]"
                                >
                                    <Search className="w-5 h-5" />
                                    <span>{t('home.searchMatchesBtn', { defaultValue: 'Find Compatible Matches' })}</span>
                                    <ArrowRight className="w-4 h-4 ml-1" />
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Live Preview Match Cards */}
                    <div className="max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto md:ml-0 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <div className="bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-pink-500/30 flex items-center justify-center font-bold text-pink-300">
                                S
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate">Sanduni, 26 • Colombo</p>
                                <p className="text-[11px] text-pink-200">Software Engineer • 96% Match</p>
                            </div>
                        </div>

                        <div className="bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center font-bold text-purple-300">
                                K
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate">Kavinda, 29 • Kandy</p>
                                <p className="text-[11px] text-purple-200">Doctor • Porondam Verified</p>
                            </div>
                        </div>

                        <div className="bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-500/30 flex items-center justify-center font-bold text-indigo-300">
                                N
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate">Nadeesha, 28 • Galle</p>
                                <p className="text-[11px] text-indigo-200">Accountant • Verified Member</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Trust Highlights Strip */}
            <div className="border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="flex flex-col items-center p-2">
                            <CheckCircle2 className="w-6 h-6 text-emerald-500 mb-1.5" />
                            <span className="text-xs sm:text-sm font-bold">{t('home.trust1', { defaultValue: '100% Verified Profiles' })}</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">{t('home.trust1Sub', { defaultValue: 'Admin authenticated members' })}</span>
                        </div>
                        <div className="flex flex-col items-center p-2">
                            <Lock className="w-6 h-6 text-purple-500 mb-1.5" />
                            <span className="text-xs sm:text-sm font-bold">{t('home.trust2', { defaultValue: 'Privacy Protected' })}</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">{t('home.trust2Sub', { defaultValue: 'Control who views your photos' })}</span>
                        </div>
                        <div className="flex flex-col items-center p-2">
                            <ScrollText className="w-6 h-6 text-amber-500 mb-1.5" />
                            <span className="text-xs sm:text-sm font-bold">{t('home.trust3', { defaultValue: 'Porondam Matching' })}</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">{t('home.trust3Sub', { defaultValue: 'Sri Lankan astrological compatibility' })}</span>
                        </div>
                        <div className="flex flex-col items-center p-2">
                            <MapPin className="w-6 h-6 text-rose-500 mb-1.5" />
                            <span className="text-xs sm:text-sm font-bold">{t('home.trust4', { defaultValue: '25 Districts & Global' })}</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">{t('home.trust4Sub', { defaultValue: 'Local and expat Sri Lankans' })}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modern Features Section */}
            <div className="py-14 sm:py-20">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <h2 className="text-2xl sm:text-4xl font-extrabold mb-3">
                            {t('home.whyChooseUs', { defaultValue: 'Designed for Sri Lankan Marriages' })}
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                            {t('home.featuresSubtitle', { defaultValue: 'We combine cultural traditions with modern technology to ensure a safe, respectful matchmaking experience.' })}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all duration-300">
                            <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6">
                                <Shield className="w-7 h-7" />
                            </div>
                            <h3 className="text-lg font-bold mb-2">{t('home.verifiedProfiles', { defaultValue: 'Manual Profile Screening' })}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                {t('home.verifiedProfilesDesc', { defaultValue: 'Every profile is reviewed by our administration team before being visible, eliminating spam and fake accounts.' })}
                            </p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all duration-300">
                            <div className="w-14 h-14 rounded-2xl bg-pink-100 dark:bg-pink-950/50 flex items-center justify-center text-pink-600 dark:text-pink-400 mb-6">
                                <Heart className="w-7 h-7" />
                            </div>
                            <h3 className="text-lg font-bold mb-2">{t('home.privacyTitle', { defaultValue: '100% Privacy & Safety' })}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                {t('home.privacyDesc', { defaultValue: 'Your contact numbers and sensitive details remain confidential until you choose to share them with verified matches.' })}
                            </p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all duration-300">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6">
                                <Award className="w-7 h-7" />
                            </div>
                            <h3 className="text-lg font-bold mb-2">{t('home.successStories', { defaultValue: 'Trusted Community' })}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                {t('home.successStoriesDesc', { defaultValue: 'Thousands of Sri Lankan families have successfully discovered meaningful relationships through our service.' })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modern CTA Strip */}
            <div className="py-12 sm:py-16 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white relative overflow-hidden">
                <div className="container mx-auto px-4 text-center relative z-10 max-w-3xl">
                    <Heart className="w-12 h-12 mx-auto mb-4 text-pink-400 animate-pulse" />
                    <h2 className="text-2xl sm:text-4xl font-extrabold mb-3">
                        {t('home.ctaTitle', { defaultValue: 'Ready to Meet Your Life Partner?' })}
                    </h2>
                    <p className="text-slate-300 text-sm sm:text-base mb-8 max-w-xl mx-auto">
                        {t('home.ctaSubtitle', { defaultValue: 'Create your free profile in just 2 minutes and start exploring genuine matches today.' })}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link
                            to="/register"
                            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-purple-900 font-bold text-base hover:bg-slate-100 shadow-xl transition active:scale-95"
                        >
                            {t('home.registerNow', { defaultValue: 'Create Free Profile' })}
                        </Link>
                        <Link
                            to="/login"
                            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-base transition"
                        >
                            {t('nav.login', { defaultValue: 'Already a Member? Sign In' })}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
