import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { 
    Eye, EyeOff, Heart, Gift, ShieldCheck, Sparkles,
    ChevronDown, ChevronUp, Info, Calendar, AlertCircle, CheckCircle2,
    User as UserIcon, Mail, Lock, Phone, ArrowRight
} from 'lucide-react';
import PolicyViewerModal from '../../components/common/PolicyViewerModal';

const Register = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { login, user, loading: authLoading, language } = useAuth();
    const [searchParams] = useSearchParams();
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
        phoneNumber: '',
        birthDate: '',
        age: '',
        gender: 'male',
        interests: '',
        hobbies: '',
        referralCode: '',
        // Unified Consent Agreement
        agreedToAll: false,
        is18OrOlder: false,
        isAccurateInfo: false,
        acceptedTermsAndPrivacy: false,
        acceptedInactivityDeletion: false,
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showPrivacySummary, setShowPrivacySummary] = useState(false);
    const [policyModalOpen, setPolicyModalOpen] = useState(false);
    const [policyModalTab, setPolicyModalTab] = useState('privacy');
    const submitInFlightRef = useRef(false);

    // Check for referral code in URL
    useEffect(() => {
        const ref = searchParams.get('ref');
        if (ref) {
            setFormData(prev => ({ ...prev, referralCode: ref }));
        }
    }, [searchParams]);

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            navigate((user?.role || '').toString().toLowerCase() === 'admin' ? '/admin' : '/dashboard');
        }
    }, [user, navigate]);

    if (user || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-rose-500"></div>
            </div>
        );
    }

    const { 
        name, 
        username, 
        email, 
        password, 
        phoneNumber, 
        birthDate, 
        age, 
        gender, 
        is18OrOlder, 
        isAccurateInfo, 
        acceptedTermsAndPrivacy, 
        acceptedInactivityDeletion 
    } = formData;

    const calculateAge = (dobString) => {
        if (!dobString) return null;
        const birth = new Date(dobString);
        if (isNaN(birth.getTime())) return null;
        const diffMs = Date.now() - birth.getTime();
        return Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000));
    };

    const onChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            if (name === 'agreedToAll') {
                setFormData(prev => ({
                    ...prev,
                    agreedToAll: checked,
                    is18OrOlder: checked,
                    isAccurateInfo: checked,
                    acceptedTermsAndPrivacy: checked,
                    acceptedInactivityDeletion: checked,
                }));
                return;
            }
            setFormData(prev => ({ ...prev, [name]: checked }));
            return;
        }

        if (name === 'phoneNumber') {
            setFormData(prev => ({ ...prev, phoneNumber: value.replace(/\D/g, '') }));
            return;
        }

        if (name === 'birthDate') {
            const computedAge = calculateAge(value);
            setFormData(prev => ({
                ...prev,
                birthDate: value,
                age: computedAge !== null && computedAge > 0 ? String(computedAge) : prev.age,
            }));
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const openPolicyModal = (e, tab) => {
        e.preventDefault();
        e.stopPropagation();
        setPolicyModalTab(tab);
        setPolicyModalOpen(true);
    };

    const effectiveAge = birthDate ? calculateAge(birthDate) : (age ? Number(age) : null);
    const isAgeValid = effectiveAge !== null && effectiveAge >= 18 && effectiveAge <= 100;
    const allConsentsAccepted = Boolean(
        formData.agreedToAll ||
        (formData.is18OrOlder && formData.isAccurateInfo && formData.acceptedTermsAndPrivacy && formData.acceptedInactivityDeletion)
    );
    const isFormReady = allConsentsAccepted && isAgeValid && !loading;

    const onSubmit = async (e) => {
        e.preventDefault();

        if (submitInFlightRef.current) {
            return;
        }

        if (!isAgeValid) {
            toast.error(t('auth.ageRequired', { defaultValue: 'You must be at least 18 years of age to register on Kapu-LK.' }));
            return;
        }

        if (!allConsentsAccepted) {
            toast.error(t('auth.allConsentsRequired', { 
                defaultValue: 'Please accept the terms, guidelines, and privacy policy to continue.' 
            }));
            return;
        }

        if (phoneNumber && !/^\d+$/.test(phoneNumber)) {
            toast.error(t('auth.invalidPhone', { defaultValue: 'Phone number must contain only numbers.' }));
            return;
        }

        submitInFlightRef.current = true;
        setLoading(true);

        try {
            const payload = {
                ...formData,
                age: effectiveAge,
                agreedToTerms: true,
                policyVersions: {
                    privacyPolicy: '2.0',
                    termsOfService: '2.0',
                    communityGuidelines: '1.0',
                },
                language,
            };

            const response = await authAPI.register(payload);
            login(response.data, response.data.token);
            toast.success(t('toast.auth.registerSuccess', { defaultValue: 'Account created! Please check your email for the verification code.' }));
            navigate('/verify-email', { state: { email: formData.email } });
        } catch (error) {
            const msg = error.response?.data?.message || t('toast.auth.registerFailed', { defaultValue: 'Registration failed. Please check your inputs.' });
            toast.error(msg);
        } finally {
            setLoading(false);
            setTimeout(() => {
                submitInFlightRef.current = false;
            }, 1000);
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

            <div className="max-w-xl w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/60 dark:border-rose-900/30 rounded-3xl shadow-2xl p-6 sm:p-9 relative z-10 transition-all duration-300 my-4">
                
                {/* Brand Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 text-xs font-bold tracking-wide uppercase mb-3 shadow-sm">
                        <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                        <span>Kapu-LK • Sri Lanka's Modern Dating</span>
                    </div>

                    <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/30 mb-3">
                        <Heart className="w-7 h-7 sm:w-8 sm:h-8 text-white fill-white" />
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {t('auth.createAccount', { defaultValue: 'Create Your Profile' })}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-300 mt-1.5 text-xs sm:text-sm">
                        {t('auth.registerSubtitle', { defaultValue: 'Meet genuine people and find your special connection' })}
                    </p>
                </div>

                <form onSubmit={onSubmit} className="space-y-4">
                    
                    {/* Full Name & Username in 2 cols */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                            <label htmlFor="reg-name-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                {t('auth.fullName', { defaultValue: 'Full Name' })} <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <UserIcon className="w-4 h-4" />
                                </div>
                                <input
                                    id="reg-name-input"
                                    type="text"
                                    name="name"
                                    autoComplete="name"
                                    value={name}
                                    onChange={onChange}
                                    required
                                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs sm:text-sm outline-none transition bg-slate-50/50"
                                    placeholder={t('auth.fullNamePlaceholder', { defaultValue: 'Enter your full name' })}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="reg-username-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                {t('auth.username', { defaultValue: 'Username' })}
                                <span className="ml-1 text-[11px] text-slate-400">({t('auth.optional', { defaultValue: 'optional' })})</span>
                            </label>
                            <input
                                id="reg-username-input"
                                type="text"
                                name="username"
                                autoComplete="username"
                                value={username}
                                onChange={onChange}
                                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs sm:text-sm outline-none transition bg-slate-50/50"
                                placeholder={t('auth.usernamePlaceholder', { defaultValue: 'Choose a username' })}
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label htmlFor="reg-email-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            {t('auth.email', { defaultValue: 'Email Address' })} <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <Mail className="w-4 h-4" />
                            </div>
                            <input
                                id="reg-email-input"
                                type="email"
                                name="email"
                                autoComplete="email"
                                value={email}
                                onChange={onChange}
                                required
                                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs sm:text-sm outline-none transition bg-slate-50/50"
                                placeholder={t('auth.emailPlaceholder', { defaultValue: 'Enter your email' })}
                            />
                        </div>
                    </div>

                    {/* Password & Phone in 2 cols */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                            <label htmlFor="reg-password-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                {t('auth.password', { defaultValue: 'Password' })} <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <Lock className="w-4 h-4" />
                                </div>
                                <input
                                    id="reg-password-input"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    autoComplete="new-password"
                                    value={password}
                                    onChange={onChange}
                                    required
                                    minLength="6"
                                    className="w-full pl-9 pr-9 py-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs sm:text-sm outline-none transition bg-slate-50/50"
                                    placeholder={t('auth.passwordPlaceholder', { defaultValue: 'At least 6 chars' })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="reg-phone-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                {t('auth.phone', { defaultValue: 'Phone Number' })}
                                <span className="ml-1 text-[11px] text-slate-400">({t('auth.optional', { defaultValue: 'optional' })})</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <Phone className="w-4 h-4" />
                                </div>
                                <input
                                    id="reg-phone-input"
                                    type="tel"
                                    name="phoneNumber"
                                    autoComplete="tel"
                                    value={phoneNumber}
                                    onChange={onChange}
                                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs sm:text-sm outline-none transition bg-slate-50/50"
                                    placeholder={t('auth.phonePlaceholder', { defaultValue: 'e.g. 0771234567' })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Birth Date & Gender in 2 cols */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                            <label htmlFor="reg-dob-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                {t('auth.birthDate', { defaultValue: 'Date of Birth' })} <span className="text-rose-500">* (18+)</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <Calendar className="w-4 h-4" />
                                </div>
                                <input
                                    id="reg-dob-input"
                                    type="date"
                                    name="birthDate"
                                    value={birthDate}
                                    onChange={onChange}
                                    required
                                    max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs sm:text-sm outline-none transition bg-slate-50/50"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="reg-gender-select" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                {t('auth.gender', { defaultValue: 'Gender' })} <span className="text-rose-500">*</span>
                            </label>
                            <select
                                id="reg-gender-select"
                                name="gender"
                                value={gender}
                                onChange={onChange}
                                required
                                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs sm:text-sm outline-none transition bg-slate-50/50"
                            >
                                <option value="male">{t('auth.male', { defaultValue: 'Male' })}</option>
                                <option value="female">{t('auth.female', { defaultValue: 'Female' })}</option>
                                <option value="other">{t('auth.other', { defaultValue: 'Other' })}</option>
                            </select>
                        </div>
                    </div>

                    {/* Referral Code (optional) */}
                    <div>
                        <label htmlFor="reg-referral-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            {t('auth.referralCode', { defaultValue: 'Referral Code' })}
                            <span className="ml-1 text-[11px] text-slate-400">({t('auth.optional', { defaultValue: 'optional' })})</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <Gift className="w-4 h-4 text-rose-500" />
                            </div>
                            <input
                                id="reg-referral-input"
                                type="text"
                                name="referralCode"
                                value={formData.referralCode}
                                onChange={onChange}
                                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs sm:text-sm outline-none transition bg-slate-50/50 uppercase"
                                placeholder="e.g. FRIEND2026"
                            />
                        </div>
                    </div>

                    {/* Privacy & Trust info banner */}
                    <div className="p-3.5 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-900/40 rounded-2xl text-xs space-y-2">
                        <div className="flex items-center justify-between font-semibold text-rose-900 dark:text-rose-200">
                            <div className="flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                                <span>100% Privacy & Verification Guarantee</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowPrivacySummary(!showPrivacySummary)}
                                className="text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                                {showPrivacySummary ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                        {showPrivacySummary && (
                            <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 pt-1 border-t border-rose-200/50 dark:border-rose-900/30">
                                <li>• Your contact number and email are never publicly displayed.</li>
                                <li>• Profile photographs are verified for community safety.</li>
                                <li>• You control who can view and interact with your profile.</li>
                            </ul>
                        )}
                    </div>

                    {/* Consent Checkbox */}
                    <div className="pt-2">
                        <label className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                            <input
                                type="checkbox"
                                name="agreedToAll"
                                checked={formData.agreedToAll}
                                onChange={onChange}
                                className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 dark:border-slate-600 cursor-pointer accent-rose-600"
                            />
                            <span className="leading-relaxed">
                                I confirm that I am <strong>18 years of age or older</strong> and that my details are truthful. I have read and agree to the{' '}
                                <button
                                    type="button"
                                    onClick={(e) => openPolicyModal(e, 'privacy')}
                                    className="text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer"
                                >
                                    Privacy Policy
                                </button>
                                ,{' '}
                                <button
                                    type="button"
                                    onClick={(e) => openPolicyModal(e, 'terms')}
                                    className="text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer"
                                >
                                    Terms of Service
                                </button>
                                , and{' '}
                                <button
                                    type="button"
                                    onClick={(e) => openPolicyModal(e, 'guidelines')}
                                    className="text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer"
                                >
                                    Community Guidelines
                                </button>. <span className="text-rose-500">*</span>
                            </span>
                        </label>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={!isFormReady}
                        className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm sm:text-base transition-all shadow-lg flex items-center justify-center gap-2 ${
                            isFormReady
                                ? 'bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 hover:from-rose-700 hover:via-pink-700 hover:to-rose-600 text-white shadow-rose-500/25 hover:shadow-rose-500/40 cursor-pointer active:scale-[0.99]'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                        }`}
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>{t('auth.creatingAccount', { defaultValue: 'Creating Profile...' })}</span>
                            </>
                        ) : (
                            <>
                                <span>{t('auth.registerBtn', { defaultValue: 'Create Free Account' })}</span>
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>

                    {!isFormReady && (
                        <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
                            {!isAgeValid
                                ? 'Please enter a valid birth date (must be 18 years or older).'
                                : 'Please confirm the agreement checkbox above to proceed.'}
                        </p>
                    )}
                </form>

                {/* Login Redirect */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                        {t('auth.hasAccount', { defaultValue: 'Already have an account?' })}{' '}
                        <Link to="/login" className="text-rose-600 dark:text-rose-400 hover:text-rose-700 font-bold hover:underline">
                            {t('auth.loginBtn', { defaultValue: 'Sign In here' })}
                        </Link>
                    </p>
                </div>
            </div>

            {/* Non-destructive Policy Viewer Modal */}
            <PolicyViewerModal
                isOpen={policyModalOpen}
                onClose={() => setPolicyModalOpen(false)}
                initialTab={policyModalTab}
            />
        </div>
    );
};

export default Register;
