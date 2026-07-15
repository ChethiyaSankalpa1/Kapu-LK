import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Heart, Users, Shield, Star } from 'lucide-react';

const Home = () => {
    const { t } = useTranslation();
    const { user, loading } = useAuth();
    const navigate = useNavigate();

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

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-700 text-white py-10 sm:py-16 md:py-24 overflow-hidden relative">
                {/* Optional subtle background pattern overlay can go here */}
                <div className="container mx-auto px-4 text-center relative z-10">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold mb-4 sm:mb-6 leading-tight">{t('home.heroTitle', { defaultValue: 'Find Your Perfect Life Partner' })}</h1>
                    <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 text-pink-100 max-w-2xl mx-auto px-4">
                        {t('home.heroSubtitle', { defaultValue: 'Join thousands of people finding their soulmate through our trusted matrimonial service' })}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4">
                        <Link
                            to="/register"
                            className="bg-white text-purple-700 px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-bold text-base sm:text-lg shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all w-full sm:w-auto"
                        >
                            {t('home.getStarted', { defaultValue: 'Get Started' })}
                        </Link>
                        <Link
                            to="/login"
                            className="bg-transparent border-2 border-white/80 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-bold text-base sm:text-lg hover:bg-white hover:text-purple-700 transition-all w-full sm:w-auto"
                        >
                            {t('auth.loginBtn')}
                        </Link>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-10 sm:py-12 md:py-20 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
                <div className="container mx-auto px-4">
                    <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-center mb-8 sm:mb-12 md:mb-16 text-gray-900 dark:text-white">{t('home.whyChooseUs', { defaultValue: 'Why Choose Us' })}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                        <div className="glass-card text-center group">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <Users className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-gray-900 dark:text-white">{t('home.verifiedProfiles', { defaultValue: 'Verified Profiles' })}</h3>
                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                                {t('home.verifiedProfilesDesc', { defaultValue: 'All profiles are verified by our admin team to ensure authenticity and safety' })}
                            </p>
                        </div>

                        <div className="glass-card text-center group">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-pink-600 dark:text-pink-400" />
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-gray-900 dark:text-white">{t('home.privacyTitle', { defaultValue: '100% Privacy' })}</h3>
                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                                {t('home.privacyDesc', { defaultValue: 'Your personal information is secure and only visible to approved members' })}
                            </p>
                        </div>

                        <div className="glass-card text-center group">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <Star className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-gray-900 dark:text-white">{t('home.successStories', { defaultValue: 'Success Stories' })}</h3>
                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                                {t('home.successStoriesDesc', { defaultValue: 'Thousands of couples have found their perfect match through our platform' })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="py-10 sm:py-12 md:py-20 bg-gradient-to-br from-purple-700 to-indigo-800 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-48 sm:w-64 h-48 sm:h-64 rounded-full bg-white opacity-5 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 sm:w-80 h-64 sm:h-80 rounded-full bg-pink-500 opacity-10 blur-3xl"></div>
                
                <div className="container mx-auto px-4 text-center relative z-10">
                    <Heart className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto mb-4 sm:mb-6 text-pink-300 animate-pulse" />
                    <h2 className="text-xl sm:text-2xl md:text-4xl font-bold mb-3 sm:mb-4">{t('home.ctaTitle', { defaultValue: 'Ready to Find Your Soulmate?' })}</h2>
                    <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-purple-100 max-w-2xl mx-auto px-4">{t('home.ctaSubtitle', { defaultValue: 'Join our community today and start your journey to happiness' })}</p>
                    <Link
                        to="/register"
                        className="bg-white text-purple-700 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg shadow-2xl hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all inline-block w-full sm:w-auto"
                    >
                        {t('home.registerNow', { defaultValue: 'Register Now' })}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Home;
