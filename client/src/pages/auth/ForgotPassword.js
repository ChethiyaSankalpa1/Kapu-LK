import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, Eye, EyeOff, KeyRound, CheckCircle2, ArrowRight, ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import { authAPI } from '../../services/api';

const ForgotPassword = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    // Wizard Step: 1 = Email, 2 = Verify Code, 3 = New Password
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [digits, setDigits] = useState(['', '', '', '', '', '']);
    const [resetToken, setResetToken] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');

    const inputRefs = useRef([]);

    // Cooldown countdown
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(prev => prev - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    // Auto focus first OTP input when entering step 2
    useEffect(() => {
        if (step === 2 && inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, [step]);

    // Step 1: Request Code
    const handleRequestCode = async (e) => {
        e.preventDefault();
        if (!email.trim()) {
            setErrorMessage('Please enter your registered email address.');
            return;
        }

        setLoading(true);
        setErrorMessage('');

        try {
            const response = await authAPI.forgotPassword({ email: email.trim() });
            toast.success(response.data?.message || 'Verification code sent to your email.');
            setCooldown(60);
            setStep(2);
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to send reset code. Please try again.';
            setErrorMessage(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    // Digit Input Handler
    const handleDigitChange = (index, value) => {
        const cleaned = value.replace(/\D/g, '');
        if (!cleaned) {
            const newDigits = [...digits];
            newDigits[index] = '';
            setDigits(newDigits);
            return;
        }

        if (cleaned.length > 1) {
            const pasted = cleaned.slice(0, 6).split('');
            const newDigits = [...digits];
            pasted.forEach((ch, idx) => {
                newDigits[idx] = ch;
                if (inputRefs.current[idx]) {
                    inputRefs.current[idx].value = ch;
                }
            });
            setDigits(newDigits);
            const nextIdx = Math.min(pasted.length, 5);
            if (inputRefs.current[nextIdx]) inputRefs.current[nextIdx].focus();
            return;
        }

        const newDigits = [...digits];
        newDigits[index] = cleaned[0];
        setDigits(newDigits);
        setErrorMessage('');

        if (index < 5 && inputRefs.current[index + 1]) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const fullCode = digits.join('');
    const isCodeComplete = fullCode.length === 6;

    // Step 2: Verify Code
    const handleVerifyCode = async (e) => {
        e.preventDefault();
        if (!isCodeComplete) {
            setErrorMessage('Please enter all 6 digits of your verification code.');
            return;
        }

        setLoading(true);
        setErrorMessage('');

        try {
            const response = await authAPI.verifyResetCode({ email: email.trim(), code: fullCode });
            setResetToken(response.data.resetToken);
            toast.success('Code verified successfully! Please choose a new password.');
            setStep(3);
        } catch (error) {
            const msg = error.response?.data?.message || 'Invalid or expired verification code.';
            setErrorMessage(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    // Resend Code in Step 2
    const handleResendCode = async () => {
        if (cooldown > 0 || loading) return;
        setLoading(true);
        setErrorMessage('');

        try {
            const response = await authAPI.forgotPassword({ email: email.trim() });
            toast.success(response.data?.message || 'A fresh verification code has been sent.');
            setCooldown(60);
            setDigits(['', '', '', '', '', '']);
            if (inputRefs.current[0]) inputRefs.current[0].focus();
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to resend code. Please try again.';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Set New Password
    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (password.length < 6) {
            setErrorMessage('Password must be at least 6 characters long.');
            toast.error('Password must be at least 6 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            setErrorMessage('Passwords do not match.');
            toast.error('Passwords do not match.');
            return;
        }

        setLoading(true);
        setErrorMessage('');

        try {
            const response = await authAPI.resetPassword({ resetToken, password });
            toast.success(response.data.message || 'Password reset successful! Please log in.');
            navigate('/login');
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to reset password. Please request a new code.';
            setErrorMessage(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center py-10 px-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6 sm:p-10 border border-slate-100 dark:border-slate-700">
                
                {/* Step Indicator */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        step === 1 ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30' : 'bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400'
                    }`}>
                        1
                    </div>
                    <div className={`h-1 w-8 rounded-full transition-all ${step >= 2 ? 'bg-purple-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        step === 2 ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30' : step > 2 ? 'bg-purple-100 text-purple-600 dark:bg-purple-950' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                    }`}>
                        2
                    </div>
                    <div className={`h-1 w-8 rounded-full transition-all ${step >= 3 ? 'bg-purple-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        step === 3 ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                    }`}>
                        3
                    </div>
                </div>

                {/* Header */}
                <div className="text-center mb-6 sm:mb-8">
                    <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-purple-600 via-pink-600 to-rose-500 flex items-center justify-center shadow-lg shadow-purple-500/25 mb-4">
                        {step === 1 && <Mail className="w-8 h-8 text-white" />}
                        {step === 2 && <KeyRound className="w-8 h-8 text-white" />}
                        {step === 3 && <Lock className="w-8 h-8 text-white" />}
                    </div>
                    
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {step === 1 && t('auth.forgotPassword', { defaultValue: 'Forgot Password' })}
                        {step === 2 && t('auth.enterResetCode', { defaultValue: 'Verify 6-Digit Code' })}
                        {step === 3 && t('auth.createNewPassword', { defaultValue: 'Set New Password' })}
                    </h2>
                    
                    <p className="text-slate-600 dark:text-slate-300 mt-2 text-sm">
                        {step === 1 && t('auth.forgotPasswordSubtitle', { defaultValue: 'Enter your registered email and we will send you a 6-digit recovery code.' })}
                        {step === 2 && `Enter the 6-digit verification code sent to ${email}`}
                        {step === 3 && t('auth.resetPasswordSubtitle', { defaultValue: 'Choose a strong new password for your account.' })}
                    </p>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                    <div className="mb-6 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs sm:text-sm">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{errorMessage}</span>
                    </div>
                )}

                {/* ===================== STEP 1: ENTER EMAIL ===================== */}
                {step === 1 && (
                    <form onSubmit={handleRequestCode} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                {t('auth.email', { defaultValue: 'Email Address' })}
                            </label>
                            <div className="relative">
                                <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
                                    placeholder={t('auth.emailPlaceholder', { defaultValue: 'Enter your registered email' })}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !email.trim()}
                            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-purple-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>Sending Code...</span>
                                </>
                            ) : (
                                <>
                                    <span>Send Recovery Code</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                )}

                {/* ===================== STEP 2: VERIFY 6-DIGIT CODE ===================== */}
                {step === 2 && (
                    <form onSubmit={handleVerifyCode} className="space-y-6">
                        <div>
                            <label className="block text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                                {t('auth.enterCodePrompt', { defaultValue: 'Enter 6-Digit Code' })}
                            </label>
                            <div className="flex justify-center gap-2 sm:gap-3">
                                {digits.map((digit, idx) => (
                                    <input
                                        key={idx}
                                        ref={el => (inputRefs.current[idx] = el)}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength="1"
                                        value={digit}
                                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(idx, e)}
                                        className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-extrabold rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:border-purple-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-purple-500/20 transition-all outline-none"
                                    />
                                ))}
                            </div>
                            <p className="text-center text-xs text-slate-400 mt-3">
                                Code expires in 10 minutes. Single-use only.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !isCodeComplete}
                            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-purple-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>Verifying Code...</span>
                                </>
                            ) : (
                                <>
                                    <span>Verify Code</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>

                        <div className="flex items-center justify-between text-xs pt-2">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 flex items-center gap-1"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                <span>Change Email</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleResendCode}
                                disabled={cooldown > 0 || loading}
                                className="text-purple-600 dark:text-purple-400 font-bold hover:underline disabled:text-slate-400"
                            >
                                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
                            </button>
                        </div>
                    </form>
                )}

                {/* ===================== STEP 3: SET NEW PASSWORD ===================== */}
                {step === 3 && (
                    <form onSubmit={handleResetPassword} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                {t('auth.newPassword', { defaultValue: 'New Password' })}
                            </label>
                            <div className="relative">
                                <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="w-full pl-11 pr-11 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
                                    placeholder={t('auth.passwordPlaceholder', { defaultValue: 'Minimum 6 characters' })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                {t('auth.confirmNewPassword', { defaultValue: 'Confirm New Password' })}
                            </label>
                            <div className="relative">
                                <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="w-full pl-11 pr-11 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
                                    placeholder={t('auth.confirmPasswordPlaceholder', { defaultValue: 'Repeat password' })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !password || !confirmPassword}
                            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-purple-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>Resetting Password...</span>
                                </>
                            ) : (
                                <>
                                    <span>Update Password &amp; Sign In</span>
                                    <CheckCircle2 className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                )}

                {/* Back to Login Link */}
                <p className="text-center text-slate-600 dark:text-slate-400 mt-6 text-sm">
                    <Link to="/login" className="text-purple-600 dark:text-purple-400 hover:underline font-semibold inline-flex items-center gap-1">
                        <ArrowLeft className="w-4 h-4" />
                        <span>{t('common.back', { defaultValue: 'Back to' })} {t('auth.loginBtn', { defaultValue: 'Sign In' })}</span>
                    </Link>
                </p>

            </div>
        </div>
    );
};

export default ForgotPassword;
