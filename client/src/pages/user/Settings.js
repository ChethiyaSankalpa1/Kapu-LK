import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../../services/api';
import {
    User, BellRing, Globe, Monitor, UserMinus, Trash2, HelpCircle,
    Info, Eye, EyeOff, ChevronRight, ArrowLeft, Save, AlertTriangle, Sun, Moon,
    ShieldCheck, Key, Palette, Gift
} from 'lucide-react';

const Settings = () => {
    const { t } = useTranslation();
    const { user, updateUser, logout, darkMode, setDarkMode, language, setLanguage } = useAuth();
    const navigate = useNavigate();
    
    // Gifting opt-in state
    const [giftingOptIn, setGiftingOptIn] = useState(user?.giftingOptIn !== false);
    
    // Theme state
    const [theme, setTheme] = useState(darkMode ? 'dark' : 'light');
    
    // Password state
    const [showPassword, setShowPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);
    
    const handleGiftingOptInChange = async (e) => {
        const newVal = e.target.checked;
        setGiftingOptIn(newVal);
        try {
            await userAPI.updateProfile({ giftingOptIn: newVal });
            updateUser({ giftingOptIn: newVal });
            toast.success(newVal ? 'Gifting enabled successfully' : 'Gifting disabled successfully');
        } catch (err) {
            setGiftingOptIn(!newVal); // rollback
            toast.error('Failed to update gifting preferences');
        }
    };
    
    // Delete account state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [deleting, setDeleting] = useState(false);
    
    // Blocked users state
    const [blockedUsers] = useState([]);
    
    const languages = [
        { code: 'en', flag: '🇬🇧', label: 'English' },
        { code: 'si', flag: '🇱🇰', label: 'සිංහල' },
        { code: 'ta', flag: '🇮🇳', label: 'தமிழ்' },
    ];

    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
        setDarkMode(newTheme === 'dark');
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            toast.error(t('toast.settings.passwordMismatch'));
            return;
        }
        
        if (newPassword.length < 6) {
            toast.error(t('toast.settings.passwordMinLength'));
            return;
        }
        
        setChangingPassword(true);
        
        try {
            // Add API call to change password here
            // await userAPI.changePassword({ currentPassword, newPassword });
            
            toast.success(t('toast.settings.passwordChanged'));
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            toast.error(error.response?.data?.message || t('toast.settings.passwordChangeFailed'));
        } finally {
            setChangingPassword(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmation !== 'DELETE') {
            toast.error(t('toast.settings.deleteConfirmError'));
            return;
        }
        
        setDeleting(true);
        
        try {
            // Add API call to delete account here
            // await userAPI.deleteAccount();
            
            toast.success(t('toast.settings.accountDeleted'));
            logout();
            navigate('/');
        } catch (error) {
            toast.error(error.response?.data?.message || t('toast.settings.deleteFailed'));
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
            setDeleteConfirmation('');
        }
    };

    const SettingCard = ({ icon: Icon, title, description, children, danger = false }) => (
        <div className={`bg-white dark:bg-gray-800 rounded-2xl border ${danger ? 'border-red-200 dark:border-red-800' : 'border-gray-200 dark:border-gray-700'} p-4 sm:p-6 shadow-sm overflow-hidden`}>
            <div className="flex items-start gap-3 sm:gap-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${danger ? 'bg-red-100 dark:bg-red-900/20' : 'bg-purple-100 dark:bg-purple-900/20'}`}>
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${danger ? 'text-red-600 dark:text-red-400' : 'text-purple-600 dark:text-purple-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className={`text-base sm:text-lg font-semibold break-words ${danger ? 'text-red-900 dark:text-red-100' : 'text-gray-900 dark:text-white'}`}>{title}</h3>
                    {description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 break-words">{description}</p>}
                    <div className="mt-4">{children}</div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-8">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="container mx-auto max-w-4xl px-4 py-3 sm:py-4">
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition shrink-0"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        </button>
                        <div className="min-w-0">
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white break-words">{t('settings.title')}</h1>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 break-words">{t('settings.subtitle')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl">
                <div className="space-y-4 sm:space-y-6">
                    {/* Account Settings */}
                    <section>
                        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                            <User className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 shrink-0" />
                            {t('settings.accountSettings')}
                        </h2>
                        <div className="space-y-4">
                            <SettingCard
                                icon={User}
                                title={t('settings.profileInfo')}
                                description={t('settings.profileInfoDesc')}
                            >
                                <button
                                    onClick={() => navigate('/profile')}
                                    className="w-full sm:w-auto inline-flex items-center justify-between sm:justify-start gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                                >
                                    {t('settings.editProfile')}
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </SettingCard>
                        </div>
                    </section>

                    {/* Privacy & Security */}
                    <section>
                        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 shrink-0" />
                            {t('settings.privacySecurity')}
                        </h2>
                        <div className="space-y-4">
                            <SettingCard
                                icon={Key}
                                title={t('settings.changePassword')}
                                description={t('settings.changePasswordDesc')}
                            >
                                <form onSubmit={handlePasswordChange} className="space-y-3 sm:space-y-4">
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            placeholder={t('settings.currentPassword')}
                                            className="w-full px-4 py-3 text-sm sm:text-base bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder={t('settings.newPassword')}
                                        className="w-full px-4 py-3 text-sm sm:text-base bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        required
                                    />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder={t('settings.confirmNewPassword')}
                                        className="w-full px-4 py-3 text-sm sm:text-base bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        required
                                    />
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <button
                                            type="submit"
                                            disabled={changingPassword}
                                            className="w-full sm:flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {changingPassword ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    {t('settings.changingPassword')}
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4" />
                                                    {t('settings.changePassword')}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </SettingCard>
                        </div>
                    </section>

                    {/* Preferences */}
                    <section>
                        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                            <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 shrink-0" />
                            {t('settings.preferences')}
                        </h2>
                        <div className="space-y-4">
                            <SettingCard
                                icon={Palette}
                                title={t('settings.theme')}
                                description={t('settings.themeDesc')}
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <button
                                        onClick={() => handleThemeChange('light')}
                                        className={`w-full px-4 py-3 rounded-xl border-2 transition flex items-center justify-center gap-2 text-sm sm:text-base ${
                                            theme === 'light'
                                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                                        }`}
                                    >
                                        <Sun className="w-5 h-5" />
                                        {t('settings.light')}
                                    </button>
                                    <button
                                        onClick={() => handleThemeChange('dark')}
                                        className={`w-full px-4 py-3 rounded-xl border-2 transition flex items-center justify-center gap-2 text-sm sm:text-base ${
                                            theme === 'dark'
                                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                                        }`}
                                    >
                                        <Moon className="w-5 h-5" />
                                        {t('settings.dark')}
                                    </button>
                                    <button
                                        onClick={() => handleThemeChange('system')}
                                        className={`w-full px-4 py-3 rounded-xl border-2 transition flex items-center justify-center gap-2 text-sm sm:text-base ${
                                            theme === 'system'
                                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                                        }`}
                                    >
                                        <Monitor className="w-5 h-5" />
                                        {t('settings.system')}
                                    </button>
                                </div>
                            </SettingCard>

                            <SettingCard
                                icon={Globe}
                                title={t('settings.language')}
                                description={t('settings.languageDesc')}
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {languages.map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={() => setLanguage(lang.code)}
                                            className={`w-full px-4 py-3 rounded-xl border-2 transition flex items-center justify-center sm:justify-start gap-2 text-sm sm:text-base ${
                                                language === lang.code
                                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                                            }`}
                                        >
                                            <span className="text-xl">{lang.flag}</span>
                                            {lang.label}
                                        </button>
                                    ))}
                                </div>
                            </SettingCard>

                            <SettingCard
                                icon={BellRing}
                                title={t('settings.notificationPreferences')}
                                description={t('settings.notificationPreferencesDesc')}
                            >
                                <div className="space-y-3">
                                    <label className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl cursor-pointer">
                                        <span className="flex-1 text-sm sm:text-base text-gray-700 dark:text-gray-300 break-words">{t('settings.emailNotifications')}</span>
                                        <input type="checkbox" defaultChecked className="mt-0.5 w-5 h-5 text-purple-600 rounded shrink-0" />
                                    </label>
                                    <label className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl cursor-pointer">
                                        <span className="flex-1 text-sm sm:text-base text-gray-700 dark:text-gray-300 break-words">{t('settings.pushNotifications')}</span>
                                        <input type="checkbox" defaultChecked className="mt-0.5 w-5 h-5 text-purple-600 rounded shrink-0" />
                                    </label>
                                    <label className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl cursor-pointer">
                                        <span className="flex-1 text-sm sm:text-base text-gray-700 dark:text-gray-300 break-words">{t('settings.messageNotifications')}</span>
                                        <input type="checkbox" defaultChecked className="mt-0.5 w-5 h-5 text-purple-600 rounded shrink-0" />
                                    </label>
                                </div>
                            </SettingCard>

                            <SettingCard
                                icon={Gift}
                                title={t('settings.giftingPreferences', { defaultValue: 'Gifting Preferences' })}
                                description={t('settings.giftingPreferencesDesc', { defaultValue: 'Manage whether other members can send you gifts' })}
                            >
                                <div className="space-y-3">
                                    <label className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl cursor-pointer">
                                        <span className="flex-1 text-sm sm:text-base text-gray-700 dark:text-gray-300 break-words">Allow other members to send me gifts</span>
                                        <input 
                                            type="checkbox" 
                                            checked={giftingOptIn} 
                                            onChange={handleGiftingOptInChange}
                                            className="mt-0.5 w-5 h-5 text-purple-600 rounded shrink-0" 
                                        />
                                    </label>
                                </div>
                            </SettingCard>
                        </div>
                    </section>

                    {/* Blocked Users */}
                    <section>
                        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                            <UserMinus className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 shrink-0" />
                            {t('settings.blockedUsers')}
                        </h2>
                        <SettingCard
                            icon={UserMinus}
                            title={t('settings.manageBlocked')}
                            description={t('settings.manageBlockedDesc')}
                        >
                            {blockedUsers.length > 0 ? (
                                <div className="space-y-2">
                                    {blockedUsers.map((blockedUser, index) => (
                                        <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                                            <span className="text-gray-700 dark:text-gray-300 break-words">{blockedUser.name}</span>
                                            <button className="w-full sm:w-auto text-left sm:text-right text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium">
                                                {t('settings.unblock')}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400">{t('settings.noBlockedUsers')}</p>
                            )}
                        </SettingCard>
                    </section>

                    {/* Help & Support */}
                    <section>
                        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 shrink-0" />
                            {t('settings.helpSupport')}
                        </h2>
                        <div className="space-y-4">
                            <SettingCard
                                icon={HelpCircle}
                                title={t('settings.contactSupport')}
                                description={t('settings.contactSupportDesc')}
                            >
                                <button
                                    onClick={() => navigate('/contact-admin')}
                                    className="w-full sm:w-auto inline-flex items-center justify-between sm:justify-start gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                                >
                                    {t('settings.contactAdmin')}
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </SettingCard>
                        </div>
                    </section>

                    {/* About */}
                    <section>
                        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                            <Info className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 shrink-0" />
                            {t('settings.about')}
                        </h2>
                        <div className="space-y-4">
                            <SettingCard
                                icon={Info}
                                title={t('settings.aboutApp')}
                                description={t('settings.aboutAppDesc')}
                            >
                                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 break-words">
                                    <p>{t('settings.appDescription')}</p>
                                    <p>{t('settings.copyright')}</p>
                                </div>
                            </SettingCard>
                        </div>
                    </section>

                    {/* Danger Zone */}
                    <section>
                        <h2 className="text-base sm:text-lg font-semibold text-red-600 dark:text-red-400 mb-3 sm:mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                            {t('settings.dangerZone')}
                        </h2>
                        <div className="space-y-4">
                            <SettingCard
                                icon={Trash2}
                                title={t('settings.deleteAccount')}
                                description={t('settings.deleteAccountDesc')}
                                danger
                            >
                                <button
                                    onClick={() => setShowDeleteModal(true)}
                                    className="w-full sm:w-auto px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition"
                                >
                                    {t('settings.deleteAccount')}
                                </button>
                            </SettingCard>
                        </div>
                    </section>
                </div>
            </div>

            {/* Delete Account Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white break-words">Delete Account</h3>
                        </div>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 break-words">
                            {t('settings.deleteAccountWarning')}
                        </p>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 break-words">
                            {t('settings.typeDelete')}
                        </p>
                        <input
                            type="text"
                            value={deleteConfirmation}
                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                            placeholder="DELETE"
                            className="w-full px-4 py-3 text-sm sm:text-base bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
                        />
                        <div className="flex flex-col-reverse sm:flex-row gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setDeleteConfirmation('');
                                }}
                                disabled={deleting}
                                className="w-full sm:flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition disabled:opacity-50"
                            >
                                {t('settings.cancel')}
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleting || deleteConfirmation !== 'DELETE'}
                                className="w-full sm:flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {deleting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        {t('settings.deleting')}
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        {t('settings.deleteAccount')}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
