import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Heart, Lock } from 'lucide-react';
import { toast } from 'react-toastify';
import { authAPI } from '../../services/api';

const ResetPassword = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { token } = useParams();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password.length < 6) {
            toast.error(t('auth.passwordMin', { defaultValue: 'Password must be at least 6 characters long' }));
            return;
        }

        if (password !== confirmPassword) {
            toast.error(t('auth.passwordMismatch', { defaultValue: 'Passwords do not match' }));
            return;
        }

        setLoading(true);
        try {
            const response = await authAPI.resetPassword(token, { password });
            toast.success(response.data.message);
            navigate('/login');
        } catch (error) {
            toast.error(error.response?.data?.message || t('auth.resetPasswordFailed', { defaultValue: 'Failed to reset password' }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full flex-1 bg-gray-50 flex items-center justify-center py-8 sm:py-12 px-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 sm:p-8">
                <div className="text-center mb-6 sm:mb-8">
                    <Heart className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-primary-600 mb-3 sm:mb-4" />
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('auth.resetPassword', { defaultValue: 'Reset Password' })}</h2>
                    <p className="text-gray-600 mt-2">
                        {t('auth.resetPasswordSubtitle', { defaultValue: 'Choose a new password for your account.' })}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.password')}</label>
                        <div className="relative">
                            <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder={t('auth.passwordPlaceholder', { defaultValue: 'Enter your password' })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.confirmPassword')}</label>
                        <div className="relative">
                            <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder={t('auth.confirmPasswordPlaceholder', { defaultValue: 'Confirm your password' })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword((prev) => !prev)}
                                className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700"
                            >
                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition disabled:bg-gray-400 font-semibold"
                    >
                        {loading
                            ? t('auth.resettingPassword', { defaultValue: 'Resetting password...' })
                            : t('auth.resetPassword', { defaultValue: 'Reset Password' })}
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

export default ResetPassword;
