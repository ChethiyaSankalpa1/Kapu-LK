import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Heart } from 'lucide-react';
import { toast } from 'react-toastify';
import { authAPI } from '../../services/api';

const ForgotPassword = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await authAPI.forgotPassword({ email });
            toast.success(response.data.message);
            setEmail('');
        } catch (error) {
            toast.error(error.response?.data?.message || t('auth.resetEmailFailed', { defaultValue: 'Failed to send reset email' }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8 sm:py-12 px-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 sm:p-8">
                <div className="text-center mb-6 sm:mb-8">
                    <Heart className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-primary-600 mb-3 sm:mb-4" />
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('auth.forgotPassword')}</h2>
                    <p className="text-gray-600 mt-2">
                        {t('auth.forgotPasswordSubtitle', { defaultValue: 'Enter your email and we will send you a password reset link.' })}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.email')}</label>
                        <div className="relative">
                            <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder={t('auth.emailPlaceholder', { defaultValue: 'Enter your email' })}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition disabled:bg-gray-400 font-semibold"
                    >
                        {loading
                            ? t('auth.sendingResetLink', { defaultValue: 'Sending reset link...' })
                            : t('auth.sendResetLink', { defaultValue: 'Send reset link' })}
                    </button>
                </form>

                <p className="text-center text-gray-600 mt-6">
                    <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
                        {t('common.back')} {t('auth.loginBtn')}
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;
