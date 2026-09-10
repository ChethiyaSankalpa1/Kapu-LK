import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { Mail, AlertCircle, RefreshCw, LogOut, ArrowRight, ShieldCheck, Pencil } from 'lucide-react';

const VerifyEmail = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, updateUser, logout } = useAuth();

    // Support email from route state, user context, or localStorage
    const initialEmail = location.state?.email || user?.email || localStorage.getItem('unverified_email') || '';
    const [email, setEmail] = useState(initialEmail);

    const [digits, setDigits] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [cooldown, setCooldown] = useState(60);
    const [errorMessage, setErrorMessage] = useState('');
    const [showChangeEmail, setShowChangeEmail] = useState(false);
    const [newEmailInput, setNewEmailInput] = useState('');
    const [changingEmail, setChangingEmail] = useState(false);
    const inputRefs = useRef([]);

    // Save unverified email to localStorage for reload persistence
    useEffect(() => {
        if (email) {
            localStorage.setItem('unverified_email', email);
        }
    }, [email]);

    // Redirect if already verified
    useEffect(() => {
        if (user && user.emailVerified && user.role !== 'admin') {
            navigate('/dashboard');
        } else if (user && user.role === 'admin') {
            navigate('/admin');
        }
    }, [user, navigate]);

    // Cooldown countdown timer for resend button
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(prev => prev - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    // Auto-focus first input on mount
    useEffect(() => {
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, []);

    const handleDigitChange = (index, value) => {
        const cleaned = value.replace(/\D/g, '');
        if (!cleaned) {
            const newDigits = [...digits];
            newDigits[index] = '';
            setDigits(newDigits);
            return;
        }

        // Handle paste of complete 6-digit code
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
            if (inputRefs.current[nextIdx]) {
                inputRefs.current[nextIdx].focus();
            }
            return;
        }

        const newDigits = [...digits];
        newDigits[index] = cleaned[0];
        setDigits(newDigits);
        setErrorMessage('');

        // Move to next digit input
        if (index < 5 && inputRefs.current[index + 1]) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length > 0) {
            const newDigits = [...digits];
            for (let i = 0; i < 6; i++) {
                newDigits[i] = pasted[i] || '';
            }
            setDigits(newDigits);
            const focusIndex = Math.min(pasted.length, 5);
            if (inputRefs.current[focusIndex]) {
                inputRefs.current[focusIndex].focus();
            }
        }
    };

    const fullCode = digits.join('');
    const isCodeComplete = fullCode.length === 6;

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!isCodeComplete) {
            setErrorMessage('Please enter all 6 digits of your verification code.');
            return;
        }

        setLoading(true);
        setErrorMessage('');

        try {
            const res = await authAPI.verifyEmail({ code: fullCode, email });
            toast.success(res.data.message || 'Email verified successfully!');

            if (user) {
                updateUser({ ...user, emailVerified: true, isEmailVerified: true });
            }
            localStorage.removeItem('unverified_email');

            // Navigate to profile setup if not completed, otherwise to dashboard
            navigate('/profile', { state: { reason: 'complete_profile' } });
        } catch (err) {
            const msg = err.response?.data?.message || 'Verification failed. Please check the code and try again.';
            setErrorMessage(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (cooldown > 0 || resending) return;
        setResending(true);
        setErrorMessage('');

        try {
            const res = await authAPI.resendVerificationCode({ email });
            toast.success(res.data.message || 'A new verification code has been sent.');
            setCooldown(60);
            setDigits(['', '', '', '', '', '']);
            if (inputRefs.current[0]) inputRefs.current[0].focus();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to resend verification code. Please try again.';
            toast.error(msg);
            if (err.response?.data?.retryAfter) {
                setCooldown(err.response.data.retryAfter);
            }
        } finally {
            setResending(false);
        }
    };

    const handleChangeEmail = async (e) => {
        e.preventDefault();
        const cleanNewEmail = newEmailInput.trim().toLowerCase();
        if (!cleanNewEmail || !/^\S+@\S+\.\S+$/.test(cleanNewEmail)) {
            toast.error('Please enter a valid email address');
            return;
        }
        if (cleanNewEmail === email.toLowerCase()) {
            toast.error('New email must be different from current email');
            return;
        }

        setChangingEmail(true);
        setErrorMessage('');

        try {
            const res = await authAPI.changeVerificationEmail({
                oldEmail: email,
                newEmail: cleanNewEmail,
            });

            toast.success(res.data.message || 'Email updated! Verification code sent.');
            setEmail(cleanNewEmail);
            localStorage.setItem('unverified_email', cleanNewEmail);
            if (user) {
                updateUser({ ...user, email: cleanNewEmail });
            }

            setShowChangeEmail(false);
            setNewEmailInput('');
            setCooldown(60);
            setDigits(['', '', '', '', '', '']);
            if (inputRefs.current[0]) inputRefs.current[0].focus();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to update email. Please try again.';
            toast.error(msg);
            if (err.response?.data?.retryAfter) {
                setCooldown(err.response.data.retryAfter);
            }
        } finally {
            setChangingEmail(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            localStorage.removeItem('unverified_email');
            navigate('/login');
        } catch (err) {
            navigate('/login');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center py-10 px-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6 sm:p-10 border border-slate-100 dark:border-slate-700">
                
                {/* Header Icon */}
                <div className="text-center mb-6 sm:mb-8">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-gradient-to-tr from-purple-600 via-pink-600 to-rose-500 flex items-center justify-center shadow-lg shadow-purple-500/25 mb-4">
                        <Mail className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {t('auth.verifyEmailTitle', { defaultValue: 'Verify Your Email' })}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-300 mt-2 text-sm">
                        {t('auth.verifyEmailSubtitle', { defaultValue: 'We sent a 6-digit verification code to' })}
                    </p>
                    <p className="text-purple-600 dark:text-purple-400 font-semibold text-sm mt-0.5 break-all">
                        {email || 'your registered email address'}
                    </p>

                    {/* Change Email Toggle / Inline Form */}
                    {!showChangeEmail ? (
                        <button
                            type="button"
                            onClick={() => {
                                setNewEmailInput('');
                                setShowChangeEmail(true);
                            }}
                            className="inline-flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold mt-2 hover:underline cursor-pointer transition"
                        >
                            <Pencil className="w-3 h-3" />
                            <span>Wrong email? Change it here</span>
                        </button>
                    ) : (
                        <form onSubmit={handleChangeEmail} className="mt-3.5 p-3.5 bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 rounded-2xl text-left space-y-2.5">
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Enter your correct email address:
                            </label>
                            <input
                                type="email"
                                required
                                value={newEmailInput}
                                onChange={(e) => setNewEmailInput(e.target.value)}
                                placeholder="name@example.com"
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                            <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setShowChangeEmail(false)}
                                    disabled={changingEmail}
                                    className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={changingEmail || !newEmailInput.trim()}
                                    className="px-3.5 py-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm cursor-pointer"
                                >
                                    {changingEmail ? 'Updating...' : 'Update & Send Code'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Verification Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                            {t('auth.enterCodePrompt', { defaultValue: 'Enter 6-Digit Code' })}
                        </label>
                        
                        {/* 6 Digit Input Group */}
                        <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
                            {digits.map((digit, idx) => (
                                <input
                                    key={idx}
                                    ref={el => (inputRefs.current[idx] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength="1"
                                    value={digit}
                                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(idx, e)}
                                    aria-label={`Digit ${idx + 1}`}
                                    className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-extrabold rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:border-purple-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-purple-500/20 transition-all outline-none"
                                />
                            ))}
                        </div>
                    </div>

                    {/* Error Banner */}
                    {errorMessage && (
                        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs sm:text-sm">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading || !isCodeComplete}
                        className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Verifying...</span>
                            </>
                        ) : (
                            <>
                                <span>Verify &amp; Continue</span>
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>

                {/* Resend Code Action */}
                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700/60 text-center">
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-2">
                        Didn't receive the email? Check your spam folder or
                    </p>
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={cooldown > 0 || resending}
                        className="text-purple-600 dark:text-purple-400 font-bold hover:underline disabled:text-slate-400 dark:disabled:text-slate-600 text-xs sm:text-sm transition cursor-pointer"
                    >
                        {resending ? (
                            'Sending new code...'
                        ) : cooldown > 0 ? (
                            `Resend code in ${cooldown}s`
                        ) : (
                            'Resend Verification Code'
                        )}
                    </button>
                </div>

                {/* Switch Account / Logout */}
                <div className="mt-6 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 transition"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign out / Switch account</span>
                    </button>
                    <div className="flex items-center gap-1 text-slate-400">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Secured by Kapu-LK</span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default VerifyEmail;
