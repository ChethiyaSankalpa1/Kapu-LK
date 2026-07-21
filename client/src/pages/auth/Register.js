import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { Eye, EyeOff, Heart } from 'lucide-react';

const Register = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { login, user, loading: authLoading, language } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
        phoneNumber: '',
        age: '',
        gender: 'male',
        interests: '',
        hobbies: '',
        agreedToTerms: false,
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Redirect if already logged in
    React.useEffect(() => {
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

    const { name, username, email, password, phoneNumber, age, gender, agreedToTerms } = formData;

    const onChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name === 'phoneNumber' ? value.replace(/\D/g, '') : value,
        });
    };

    const onSubmit = async (e) => {
        e.preventDefault();

        if (!agreedToTerms) {
            toast.error(t('auth.termsRequired', { defaultValue: 'You must agree to the terms and privacy policy to create an account.' }));
            return;
        }

        if (phoneNumber && !/^\d+$/.test(phoneNumber)) {
            toast.error(t('auth.invalidPhone', { defaultValue: 'Phone number must contain only numbers.' }));
            return;
        }

        setLoading(true);

        try {
            const response = await authAPI.register({ ...formData, language });
            login(response.data, response.data.token);
            toast.success(t('toast.auth.registerSuccess'));
            navigate('/profile');
        } catch (error) {
            toast.error(error.response?.data?.message || t('toast.auth.registerFailed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-8 sm:py-12 px-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl sm:rounded-lg shadow-lg p-6 sm:p-8">
                <div className="text-center mb-6 sm:mb-8">
                    <Heart className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-primary-600 mb-3 sm:mb-4" />
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{t('auth.createAccount', { defaultValue: 'Create Account' })}</h2>
                    <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm sm:text-base">{t('auth.registerSubtitle', { defaultValue: 'Join us to find your perfect match' })}</p>
                </div>

                <form onSubmit={onSubmit} className="space-y-3 sm:space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.fullName', { defaultValue: 'Full Name' })}</label>
                        <input
                            type="text"
                            name="name"
                            value={name}
                            onChange={onChange}
                            required
                            className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                            placeholder={t('auth.fullNamePlaceholder', { defaultValue: 'Enter your full name' })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.username', { defaultValue: 'Username' })}</label>
                        <input
                            type="text"
                            name="username"
                            value={username}
                            onChange={onChange}
                            required
                            className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                            placeholder={t('auth.usernamePlaceholder', { defaultValue: 'Choose a unique username' })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.email')}</label>
                        <input
                            type="email"
                            name="email"
                            value={email}
                            onChange={onChange}
                            required
                            className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                            placeholder={t('auth.emailPlaceholder', { defaultValue: 'Enter your email' })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.password')}</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={password}
                                onChange={onChange}
                                required
                                minLength="6"
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

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.phone', { defaultValue: 'Phone Number' })}</label>
                        <input
                            type="tel"
                            name="phoneNumber"
                            value={phoneNumber}
                            onChange={onChange}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                            placeholder={t('auth.phonePlaceholder', { defaultValue: 'Enter your phone number' })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.age', { defaultValue: 'Age' })}</label>
                            <input
                                type="number"
                                name="age"
                                value={age}
                                onChange={onChange}
                                min="18"
                                max="100"
                                className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                                placeholder={t('auth.age', { defaultValue: 'Age' })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.gender', { defaultValue: 'Gender' })}</label>
                            <select
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

                    <div className="pt-2">
                        <label className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-300">
                            <input
                                type="checkbox"
                                name="agreedToTerms"
                                checked={agreedToTerms}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        agreedToTerms: e.target.checked,
                                    })
                                }
                                className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded"
                            />
                            <span className="text-xs sm:text-sm">
                                {t('auth.termsIntro', { defaultValue: 'I have read and agree to the' })}
                                <span className="font-semibold"> {t('auth.termsAndConditions', { defaultValue: 'Terms & Conditions' })}</span> {t('auth.and', { defaultValue: 'and' })}
                                <Link to="/privacy-policy" className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                                    {t('auth.privacyPolicy', { defaultValue: 'Privacy Policy' })}
                                </Link> {t('auth.platformTerms', { defaultValue: 'of this matrimonial platform.' })}
                            </span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary-600 text-white py-3 sm:py-3.5 rounded-lg hover:bg-primary-700 transition disabled:bg-gray-400 font-semibold text-sm sm:text-base"
                    >
                        {loading ? t('auth.creatingAccount', { defaultValue: 'Creating Account...' }) : t('auth.registerBtn')}
                    </button>
                </form>

                <p className="text-center text-gray-600 dark:text-gray-300 mt-6 text-sm sm:text-base">
                    {t('auth.hasAccount')}{' '}
                    <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
                        {t('auth.loginBtn')}
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
