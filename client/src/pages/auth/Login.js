import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authAPI, maintenanceAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { Eye, EyeOff, Heart, ShieldAlert, Sparkles, ArrowRight, Lock, User as UserIcon } from 'lucide-react';

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
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-rose-500"></div>
            </div>
        );
    }

    const { email, password } = formData;

    const onChange = (e) => {
        const { name, value } = e.target;
        const normalised = name === 'email' ? value.trim().toLowerCase() : value;
        setFormData({ ...formData, [name]: normalised });
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
        <div className="w-full flex-1 relative flex items-center justify-center py-10 sm:py-16 px-4 overflow-hidden min-h-[calc(100vh-4rem)]">
            {/* Background Hero Image */}
            <img
                src="/images/kapu-hero-cover.png"
                alt="Romantic couple sunset"
                className="absolute inset-0 w-full h-full object-cover object-[center_35%]"
            />
            
            {/* Multi-layer cinematic romantic gradients */}
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/95 via-rose-950/75 to-slate-950/90" aria-hidden="true" />
            <div className="absolute inset-0 bg-radial-at-c from-rose-500/10 via-transparent to-black/60 pointer-events-none" aria-hidden="true" />

            <div className="max-w-md w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/60 dark:border-rose-900/30 rounded-3xl shadow-2xl p-7 sm:p-9 relative z-10 transition-all duration-300">
                {/* Brand pill */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 text-xs font-bold tracking-wide uppercase mb-4 shadow-sm">
                        <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                        <span>Kapu-LK • Sri Lanka's Matchmaking</span>
                    </div>
                    
                    <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/30 mb-3">
                        <Heart className="w-7 h-7 sm:w-8 sm:h-8 text-white fill-white" />
                    </div>
                    
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {t('auth.welcomeBack', { defaultValue: 'Welcome Back' })}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-300 mt-1.5 text-xs sm:text-sm">
                        {t('auth.signInSubtitle', { defaultValue: 'Sign in to connect with genuine people' })}
                    </p>
                </div>

                {maintenanceInfo?.isActive && (
                    <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700/50 rounded-2xl flex items-start gap-3 text-xs sm:text-sm text-amber-800 dark:text-amber-200 shadow-sm">
                        <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-bold block text-sm">Platform Maintenance Break Active</span>
                            <span>Public access is temporarily paused. Only administrators may log in.</span>
                        </div>
                    </div>
                )}

                <form onSubmit={onSubmit} className="space-y-4 sm:space-y-5">
                    <div>
                        <label htmlFor="login-email-input" className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            {t('auth.email', { defaultValue: 'Email or Username' })}
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <UserIcon className="w-4 h-4" />
                            </div>
                            <input
                                id="login-email-input"
                                type="text"
                                name="email"
                                autoComplete="username email"
                                autoCapitalize="none"
                                autoCorrect="off"
                                spellCheck="false"
                                value={email}
                                onChange={onChange}
                                required
                                className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm outline-none transition bg-slate-50/50 dark:placeholder-slate-500"
                                placeholder={t('auth.emailPlaceholder', { defaultValue: 'Enter your email or username' })}
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label htmlFor="login-password-input" className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {t('auth.password', { defaultValue: 'Password' })}
                            </label>
                            <Link to="/forgot-password" className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 font-semibold hover:underline">
                                {t('auth.forgotPassword', { defaultValue: 'Forgot password?' })}
                            </Link>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <Lock className="w-4 h-4" />
                            </div>
                            <input
                                id="login-password-input"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={onChange}
                                required
                                className="w-full pl-10 pr-11 py-2.5 sm:py-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm outline-none transition bg-slate-50/50 dark:placeholder-slate-500"
                                placeholder={t('auth.passwordPlaceholder', { defaultValue: 'Enter your password' })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 hover:from-rose-700 hover:via-pink-700 hover:to-rose-600 text-white font-bold text-sm sm:text-base shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
                    >
                        {loading ? (
                            <span>{t('auth.signingIn', { defaultValue: 'Signing In...' })}</span>
                        ) : (
                            <>
                                <span>{t('auth.loginBtn', { defaultValue: 'Sign In' })}</span>
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>

                {/* Footer links */}
                <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center space-y-3">
                    <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                        {t('auth.noAccount', { defaultValue: "Don't have an account?" })}{' '}
                        <Link to="/register" className="text-rose-600 dark:text-rose-400 hover:text-rose-700 font-bold hover:underline">
                            {t('auth.registerBtn', { defaultValue: 'Join Free Today' })}
                        </Link>
                    </p>
                    <p className="text-slate-400 dark:text-slate-500 text-[11px]">
                        By continuing, you agree to Kapu-LK's{' '}
                        <Link to="/terms" className="hover:text-rose-600 dark:hover:text-rose-400 transition underline">Terms</Link>
                        {' '}and{' '}
                        <Link to="/privacy-policy" className="hover:text-rose-600 dark:hover:text-rose-400 transition underline">Privacy Policy</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
