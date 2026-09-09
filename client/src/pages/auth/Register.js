import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { 
    Eye, EyeOff, Heart, Gift, ShieldCheck, 
    ChevronDown, ChevronUp, Info, Calendar, AlertCircle, CheckCircle2 
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
        // 4 Mandatory Consent Agreements (Unchecked by default)
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
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600"></div>
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
        is18OrOlder && isAccurateInfo && acceptedTermsAndPrivacy && acceptedInactivityDeletion
    );
    const isFormReady = allConsentsAccepted && isAgeValid && !loading;

    const onSubmit = async (e) => {
        e.preventDefault();

        if (!isAgeValid) {
            toast.error(t('auth.ageRequired', { defaultValue: 'You must be at least 18 years of age to register on Kapu-LK.' }));
            return;
        }

        if (!allConsentsAccepted) {
            toast.error(t('auth.allConsentsRequired', { 
                defaultValue: 'Please review and accept all 4 required Privacy and Consent agreements before continuing.' 
            }));
            return;
        }

        if (phoneNumber && !/^\d+$/.test(phoneNumber)) {
            toast.error(t('auth.invalidPhone', { defaultValue: 'Phone number must contain only numbers.' }));
            return;
        }

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
            toast.success(t('toast.auth.registerSuccess', { defaultValue: 'Account registered successfully!' }));
            navigate('/profile');
        } catch (error) {
            const msg = error.response?.data?.message || t('toast.auth.registerFailed', { defaultValue: 'Registration failed. Please check your inputs.' });
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-8 sm:py-12 px-4">
            <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
                
                {/* Brand Header */}
                <div className="text-center mb-6 sm:mb-8">
                    <Heart className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-primary-600 mb-3 sm:mb-4" />
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                        {t('auth.createAccount', { defaultValue: 'Create Account' })}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm sm:text-base">
                        {t('auth.registerSubtitle', { defaultValue: 'Join Sri Lanka\'s trusted matrimonial platform' })}
                    </p>
                </div>

                <form onSubmit={onSubmit} className="space-y-4">
                    
                    {/* Full Name */}
                    <div>
                        <label htmlFor="reg-name-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('auth.fullName', { defaultValue: 'Full Name' })} <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="reg-name-input"
                            type="text"
                            name="name"
                            autoComplete="name"
                            value={name}
                            onChange={onChange}
                            required
                            className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                            placeholder={t('auth.fullNamePlaceholder', { defaultValue: 'Enter your full name' })}
                        />
                    </div>

                    {/* Username */}
                    <div>
                        <label htmlFor="reg-username-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('auth.username', { defaultValue: 'Username' })} <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="reg-username-input"
                            type="text"
                            name="username"
                            autoComplete="username"
                            value={username}
                            onChange={onChange}
                            required
                            className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                            placeholder={t('auth.usernamePlaceholder', { defaultValue: 'Choose a unique username' })}
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label htmlFor="reg-email-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('auth.email', { defaultValue: 'Email Address' })} <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="reg-email-input"
                            type="email"
                            name="email"
                            autoComplete="email"
                            value={email}
                            onChange={onChange}
                            required
                            className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                            placeholder={t('auth.emailPlaceholder', { defaultValue: 'Enter your email' })}
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label htmlFor="reg-password-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('auth.password', { defaultValue: 'Password' })} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                id="reg-password-input"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                autoComplete="new-password"
                                value={password}
                                onChange={onChange}
                                required
                                minLength="6"
                                className="w-full px-4 py-2.5 sm:py-3 pr-12 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                                placeholder={t('auth.passwordPlaceholder', { defaultValue: 'At least 6 characters' })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(prev => !prev)}
                                className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Phone Number */}
                    <div>
                        <label htmlFor="reg-phone-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('auth.phone', { defaultValue: 'Phone Number' })}
                        </label>
                        <input
                            id="reg-phone-input"
                            type="tel"
                            name="phoneNumber"
                            autoComplete="tel"
                            value={phoneNumber}
                            onChange={onChange}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                            placeholder={t('auth.phonePlaceholder', { defaultValue: 'Enter your phone number' })}
                        />
                    </div>

                    {/* Birth Date and Age Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <label htmlFor="reg-birth-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                                <Calendar className="w-4 h-4 text-purple-600" />
                                {t('auth.birthDate', { defaultValue: 'Date of Birth' })} <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="reg-birth-input"
                                type="date"
                                name="birthDate"
                                max={new Date(Date.now() - 18 * 365.25 * 24 * 3600 * 1000).toISOString().split('T')[0]}
                                value={birthDate}
                                onChange={onChange}
                                required
                                className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                            />
                        </div>

                        <div>
                            <label htmlFor="reg-gender-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('auth.gender', { defaultValue: 'Gender' })} <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="reg-gender-select"
                                name="gender"
                                value={gender}
                                onChange={onChange}
                                className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                            >
                                <option value="male">{t('common.male', { defaultValue: 'Male' })}</option>
                                <option value="female">{t('common.female', { defaultValue: 'Female' })}</option>
                                <option value="other">{t('common.other', { defaultValue: 'Other' })}</option>
                            </select>
                        </div>
                    </div>

                    {/* Age Status Feedback */}
                    {effectiveAge !== null && (
                        <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                            isAgeValid 
                                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                        }`}>
                            {isAgeValid ? (
                                <>
                                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                                    <span>Age verified: <strong>{effectiveAge} years old</strong> (Eligible to register)</span>
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                                    <span>Age: <strong>{effectiveAge} years old</strong>. You must be at least 18 years old to join Kapu-LK.</span>
                                </>
                            )}
                        </div>
                    )}

                    {/* Referral Code (Optional) */}
                    <div>
                        <label htmlFor="reg-referral-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                            <Gift className="w-4 h-4 text-purple-500" />
                            {t('auth.referralCode', { defaultValue: 'Referral Code (Optional)' })}
                        </label>
                        <input
                            id="reg-referral-input"
                            type="text"
                            name="referralCode"
                            autoComplete="off"
                            value={formData.referralCode}
                            onChange={onChange}
                            className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                            placeholder={t('auth.referralCodePlaceholder', { defaultValue: 'Enter referral code for bonus rewards' })}
                        />
                    </div>

                    {/* SECTION: Privacy & Consent */}
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                                <ShieldCheck className="w-5 h-5 text-purple-600" />
                                <span>Privacy & Consent</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowPrivacySummary(prev => !prev)}
                                className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-medium"
                            >
                                {showPrivacySummary ? 'Hide summary' : 'Read privacy summary'}
                                {showPrivacySummary ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                        </div>

                        {/* Collapsible Key Privacy Summary */}
                        {showPrivacySummary && (
                            <div className="p-3.5 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-700 rounded-xl text-xs space-y-2 text-gray-700 dark:text-gray-300 animate-fade-in">
                                <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                                    <Info className="w-4 h-4 text-purple-600" />
                                    Summary of Key Privacy & Data Terms
                                </p>
                                <ul className="list-disc list-inside space-y-1 pl-1">
                                    <li><strong>What data is collected:</strong> Name, verified phone, age/DOB, preferences, profile photos, and encrypted chat messages.</li>
                                    <li><strong>How it is used:</strong> Exclusively for legitimate matrimonial matchmaking and account security.</li>
                                    <li><strong>Who can see it:</strong> Registered, verified members based on your privacy settings.</li>
                                    <li><strong>How it is protected:</strong> SSL/TLS encryption, secure HTTP-only cookies, and sanitized queries.</li>
                                    <li><strong>10-Day Inactivity Rule:</strong> Accounts inactive for 10 consecutive days are permanently deleted after warnings at 5d, 2d, and 1d. Any login cancels deletion.</li>
                                    <li><strong>User rights:</strong> Access, update, download your complete data export (JSON), or request permanent deletion at any time via Account Settings.</li>
                                </ul>
                            </div>
                        )}

                        {/* Document Links Modal Launcher (Never clears form state) */}
                        <div className="p-3 bg-purple-50/70 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl text-xs text-gray-700 dark:text-gray-300 flex flex-wrap items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">Review policies:</span>
                            <button
                                type="button"
                                onClick={(e) => openPolicyModal(e, 'privacy')}
                                className="underline font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                            >
                                Privacy Policy
                            </button>
                            <span>•</span>
                            <button
                                type="button"
                                onClick={(e) => openPolicyModal(e, 'terms')}
                                className="underline font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                            >
                                Terms of Service
                            </button>
                            <span>•</span>
                            <button
                                type="button"
                                onClick={(e) => openPolicyModal(e, 'guidelines')}
                                className="underline font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                            >
                                Community Guidelines
                            </button>
                        </div>

                        {/* 4 Required Checkboxes (Unchecked by default) */}
                        <div className="space-y-2.5 pt-1">
                            
                            {/* Checkbox 1: 18+ */}
                            <label className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    name="is18OrOlder"
                                    checked={is18OrOlder}
                                    onChange={onChange}
                                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                />
                                <span>
                                    I confirm that I am <strong>18 years of age or older</strong> and legally eligible to use Kapu‑LK. <span className="text-red-500">*</span>
                                </span>
                            </label>

                            {/* Checkbox 2: Accurate Info */}
                            <label className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    name="isAccurateInfo"
                                    checked={isAccurateInfo}
                                    onChange={onChange}
                                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                />
                                <span>
                                    I confirm that the information provided in my profile is <strong>accurate and truthful</strong>. <span className="text-red-500">*</span>
                                </span>
                            </label>

                            {/* Checkbox 3: Policies Agreement */}
                            <label className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    name="acceptedTermsAndPrivacy"
                                    checked={acceptedTermsAndPrivacy}
                                    onChange={onChange}
                                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                />
                                <span>
                                    I have read and agree to the{' '}
                                    <button
                                        type="button"
                                        onClick={(e) => openPolicyModal(e, 'privacy')}
                                        className="text-purple-600 font-semibold hover:underline"
                                    >
                                        Privacy Policy
                                    </button>
                                    ,{' '}
                                    <button
                                        type="button"
                                        onClick={(e) => openPolicyModal(e, 'terms')}
                                        className="text-purple-600 font-semibold hover:underline"
                                    >
                                        Terms of Service
                                    </button>
                                    , and{' '}
                                    <button
                                        type="button"
                                        onClick={(e) => openPolicyModal(e, 'guidelines')}
                                        className="text-purple-600 font-semibold hover:underline"
                                    >
                                        Community Guidelines
                                    </button>
                                    . <span className="text-red-500">*</span>
                                </span>
                            </label>

                            {/* Checkbox 4: 10-Day Inactivity Deletion Rule */}
                            <label className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    name="acceptedInactivityDeletion"
                                    checked={acceptedInactivityDeletion}
                                    onChange={onChange}
                                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                />
                                <span>
                                    I understand and accept that inactive accounts are <strong>permanently deleted after 10 days of inactivity</strong> following advance warning notices. <span className="text-red-500">*</span>
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={!isFormReady}
                        className={`w-full py-3 sm:py-3.5 rounded-xl font-semibold text-sm sm:text-base transition shadow-md flex items-center justify-center gap-2 ${
                            isFormReady
                                ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-500/25 cursor-pointer'
                                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-80'
                        }`}
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                {t('auth.creatingAccount', { defaultValue: 'Creating Account...' })}
                            </>
                        ) : (
                            t('auth.registerBtn', { defaultValue: 'Create Account' })
                        )}
                    </button>

                    {/* Helpful helper text when button is disabled */}
                    {!isFormReady && (
                        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                            {!isAgeValid
                                ? 'Please enter a valid birth date (must be at least 18 years of age).'
                                : 'Please accept all 4 required consent checkboxes above to activate account registration.'}
                        </p>
                    )}
                </form>

                {/* Login Redirect */}
                <p className="text-center text-gray-600 dark:text-gray-300 mt-6 text-sm sm:text-base">
                    {t('auth.hasAccount', { defaultValue: 'Already have an account?' })}{' '}
                    <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
                        {t('auth.loginBtn', { defaultValue: 'Log In' })}
                    </Link>
                </p>
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
