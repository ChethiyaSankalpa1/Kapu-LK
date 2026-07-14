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
            <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white py-20">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-5xl font-bold mb-6">{t('home.heroTitle', { defaultValue: 'Find Your Perfect Life Partner' })}</h1>
                    <p className="text-xl mb-8">
                        {t('home.heroSubtitle', { defaultValue: 'Join thousands of people finding their soulmate through our trusted matrimonial service' })}
                    </p>
                    <div className="space-x-4">
                        <Link
                            to="/register"
                            className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition inline-block"
                        >
                            {t('home.getStarted', { defaultValue: 'Get Started' })}
                        </Link>
                        <Link
                            to="/login"
                            className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition inline-block"
                        >
                            {t('auth.loginBtn')}
                        </Link>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-16 bg-gray-50 dark:bg-gray-900">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">{t('home.whyChooseUs', { defaultValue: 'Why Choose Us' })}</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center">
                            <Users className="w-16 h-16 mx-auto mb-4 text-purple-600" />
                            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{t('home.verifiedProfiles', { defaultValue: 'Verified Profiles' })}</h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                {t('home.verifiedProfilesDesc', { defaultValue: 'All profiles are verified by our admin team to ensure authenticity and safety' })}
                            </p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center">
                            <Shield className="w-16 h-16 mx-auto mb-4 text-purple-600" />
                            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{t('home.privacyTitle', { defaultValue: '100% Privacy' })}</h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                {t('home.privacyDesc', { defaultValue: 'Your personal information is secure and only visible to approved members' })}
                            </p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center">
                            <Star className="w-16 h-16 mx-auto mb-4 text-purple-600" />
                            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{t('home.successStories', { defaultValue: 'Success Stories' })}</h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                {t('home.successStoriesDesc', { defaultValue: 'Thousands of couples have found their perfect match through our platform' })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="py-16 bg-gradient-to-r from-pink-600 to-purple-600 text-white">
                <div className="container mx-auto px-4 text-center">
                    <Heart className="w-20 h-20 mx-auto mb-6" />
                    <h2 className="text-3xl font-bold mb-4">{t('home.ctaTitle', { defaultValue: 'Ready to Find Your Soulmate?' })}</h2>
                    <p className="text-xl mb-8">{t('home.ctaSubtitle', { defaultValue: 'Join our community today and start your journey to happiness' })}</p>
                    <Link
                        to="/register"
                        className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition inline-block"
                    >
                        {t('home.registerNow', { defaultValue: 'Register Now' })}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Home;
