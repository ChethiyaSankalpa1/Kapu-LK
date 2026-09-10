import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authAPI, maintenanceAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { Eye, EyeOff, Heart, ShieldAlert } from 'lucide-react';

const Login = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { login, user, loading: authLoading } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [maintenanceInfo, setMaintenanceInfo] = useState(null);

    // Check maintenance status
    React.useEffect(() => {
        maintenanceAPI.getStatus().then((res) => {
            if (res.data?.isActive && res.data?.scope === 'full') {
                setMaintenanceInfo(res.data);
            }
        }).catch(() => {});
    }, []);

    // Redirect if already logged in
    React.useEffect(() => {
        if (user) {
            const role = (user?.role || '').toString().toLowerCase();
            if (role === 'admin') {
                navigate('/admin');
            } else if (!user.emailVerified) {
                navigate('/verify-email', { state: { email: user.email } });
            } else {
                navigate('/dashboard');
            }
        }
    }, [user, navigate]);

    if (user || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600"></div>
            </div>
        );
    }

    const { email, password } = formData;

    const onChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await authAPI.login(formData);
            const userRole = (response.data?.role || response.data?.user?.role || '').toString().toLowerCase();

            if (maintenanceInfo?.isActive && userRole !== 'admin') {
                toast.error('Platform is currently in maintenance mode. Only administrators may log in.');
                setLoading(false);
                return;
            }

            login(response.data, response.data.token);
            toast.success(t('toast.auth.loginSuccess'));

            if (userRole === 'admin') {
                navigate('/admin');
            } else if (response.data?.requiresEmailVerification || response.data?.emailVerified === false) {
                navigate('/verify-email', { state: { email: formData.email } });
            } else {
                navigate('/dashboard');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || t('toast.auth.loginFailed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-8 sm:py-12 px-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl sm:rounded-lg shadow-lg p-6 sm:p-8">
                <div className="text-center mb-6 sm:mb-8">
                    <Heart className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-primary-600 mb-3 sm:mb-4" />
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{t('auth.welcomeBack', { defaultValue: 'Welcome Back' })}</h2>
                    <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm sm:text-base">{t('auth.signInSubtitle', { defaultValue: 'Sign in to your account' })}</p>
                </div>

                {maintenanceInfo?.isActive && (
                    <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700/50 rounded-xl flex items-start gap-3 text-xs sm:text-sm text-amber-800 dark:text-amber-200 shadow-sm">
                        <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-bold block text-sm">Platform Maintenance Break Active</span>
                            <span>Public access is temporarily paused. Only administrators may log in to preview or deactivate maintenance.</span>
                        </div>
                    </div>
                )}

                <form onSubmit={onSubmit} className="space-y-4 sm:space-y-6">
                    <div>
                        <label htmlFor="login-email-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.email')}</label>
                        <input
                            id="login-email-input"
                            type="text"
                            name="email"
                            autoComplete="username email"
                            value={email}
                            onChange={onChange}
                            required
                            className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                            placeholder={t('auth.emailPlaceholder', { defaultValue: 'Enter your email or username' })}
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label htmlFor="login-password-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('auth.password')}</label>
                            <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                                {t('auth.forgotPassword')}
                            </Link>
                        </div>
                        <div className="relative">
                            <input
                                id="login-password-input"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={onChange}
                                required
                                className="w-full px-4 py-2.5 sm:py-3 pr-12 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                                placeholder={t('auth.passwordPlaceholder', { defaultValue: 'Enter your password' })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                aria-label={showPassword ? t('auth.hidePassword', { defaultValue: 'Hide password' }) : t('auth.showPassword', { defaultValue: 'Show password' })}
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary-600 text-white py-3 sm:py-3.5 rounded-lg hover:bg-primary-700 transition disabled:bg-gray-400 font-semibold text-sm sm:text-base"
                    >
                        {loading ? t('auth.signingIn', { defaultValue: 'Signing In...' }) : t('auth.loginBtn')}
                    </button>
                </form>

                <p className="text-center text-gray-600 dark:text-gray-300 mt-6 text-sm sm:text-base">
                    {t('auth.noAccount')}{' '}
                    <Link to="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
                        {t('auth.registerBtn')}
                    </Link>
                </p>
                <p className="text-center text-gray-500 dark:text-gray-400 mt-4 text-xs">
                    <Link to="/privacy-policy" className="hover:text-purple-600 dark:hover:text-purple-400 transition">
                        Privacy Policy
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
