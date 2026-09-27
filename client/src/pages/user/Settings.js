import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { userAPI, authAPI } from '../../services/api';
import {
    User, BellRing, Globe, Monitor, UserMinus, Trash2, HelpCircle,
    Info, Eye, EyeOff, ChevronRight, Save, AlertTriangle, Sun, Moon,
    ShieldCheck, Key, Palette, Gift, Download, FileText, Phone
} from 'lucide-react';
import PolicyViewerModal from '../../components/common/PolicyViewerModal';
import BackButton from '../../components/common/BackButton';
import ProfileAvatar from '../../components/ui/ProfileAvatar';
import { generateUserDataPDF } from '../../utils/pdfExport';

const Settings = () => {
    const { t } = useTranslation();
    const { user, updateUser, logout, darkMode, setDarkMode, language, setLanguage } = useAuth();
    const navigate = useNavigate();
    
    // Gifting opt-in state
    const [giftingOptIn, setGiftingOptIn] = useState(user?.giftingOptIn !== false);
    
    // Contact Info Privacy state
    const [showPhoneNumber, setShowPhoneNumber] = useState(user?.showPhoneNumber || false);
    const [showEmail, setShowEmail] = useState(user?.showEmail || false);
    
    const handlePhoneVisibilityChange = async (e) => {
        const newVal = e.target.checked;
        setShowPhoneNumber(newVal);
        try {
            await userAPI.updateProfile({ showPhoneNumber: newVal });
            updateUser({ showPhoneNumber: newVal });
            toast.success(newVal ? 'Phone number visibility enabled for Silver/Gold members' : 'Phone number hidden from all members');
        } catch (err) {
            setShowPhoneNumber(!newVal);
            toast.error('Failed to update phone visibility setting');
        }
    };

    const handleEmailVisibilityChange = async (e) => {
        const newVal = e.target.checked;
        setShowEmail(newVal);
        try {
            await userAPI.updateProfile({ showEmail: newVal });
            updateUser({ showEmail: newVal });
            toast.success(newVal ? 'Email visibility enabled for Silver/Gold members' : 'Email hidden from all members');
        } catch (err) {
            setShowEmail(!newVal);
            toast.error('Failed to update email visibility setting');
        }
    };
    
    // Theme state
    const [theme, setTheme] = useState(darkMode ? 'dark' : 'light');
    
    // Password state — separate show/hide per field for better UX
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    
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
    const [deleteReason, setDeleteReason] = useState('');
    const [deleting, setDeleting] = useState(false);
    
    // Privacy, Consent & Data Rights state
    const [exportingData, setExportingData] = useState(false);
    const [policyModalOpen, setPolicyModalOpen] = useState(false);
    const [policyModalTab, setPolicyModalTab] = useState('privacy');
    
    // Blocked users state
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [loadingBlocked, setLoadingBlocked] = useState(false);

    const fetchBlockedUsers = useCallback(async () => {
        try {
            setLoadingBlocked(true);
            const res = await userAPI.getBlockedUsers();
            setBlockedUsers(res.data || []);
        } catch (err) {
            console.error('Error fetching blocked users:', err);
        } finally {
            setLoadingBlocked(false);
        }
    }, []);

    useEffect(() => {
        fetchBlockedUsers();
    }, [fetchBlockedUsers]);

    const handleUnblockUser = async (targetId) => {
        try {
            await userAPI.unblockUser(targetId);
            toast.success('User unblocked successfully');
            fetchBlockedUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to unblock user');
        }
    };
    
    const languages = [
        { code: 'en', flag: '🇬🇧', label: 'English' },
        { code: 'si', flag: '🇱🇰', label: 'සිංහල' },
        { code: 'ta', flag: '🇮🇳', label: 'தமிழ்' },
    ];

    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
        setDarkMode(newTheme === 'dark');
    };

    const handleExportDataPDF = async () => {
        setExportingData(true);
        try {
            const res = await userAPI.exportUserData();
            generateUserDataPDF(res.data, user);
            toast.success('Official Personal Data PDF report generated successfully.');
        } catch (err) {
            console.error('Export user data PDF error:', err);
            toast.error('Failed to generate PDF report. Please try again.');
        } finally {
            setExportingData(false);
        }
    };

    const handleExportData = async () => {
        setExportingData(true);
        try {
            const res = await userAPI.exportUserData();
            const dataStr = JSON.stringify(res.data, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `kapu-lk-user-data-${user?.name?.toLowerCase().replace(/\s+/g, '-') || 'export'}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success('Your personal data archive was successfully exported and downloaded.');
        } catch (err) {
            console.error('Export user data error:', err);
            toast.error('Failed to export personal data. Please try again.');
        } finally {
            setExportingData(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordError('');

        if (newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match.');
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError('New password must be at least 6 characters.');
            return;
        }

        setChangingPassword(true);

        try {
            const res = await authAPI.changePassword({ currentPassword, newPassword });
            // Store the fresh token returned by the server so the session stays alive
            if (res.data?.token) {
                localStorage.setItem('token', res.data.token);
            }
            toast.success('Password changed successfully.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setPasswordError('');
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to change password. Please try again.';
            // Show specific validation messages inline; show other errors via toast
            if (
                msg === 'Current password is incorrect.' ||
                msg === 'New password must be different from your current password.'
            ) {
                setPasswordError(msg);
            } else {
                toast.error(msg);
            }
        } finally {
            setChangingPassword(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmation !== 'DELETE') {
            toast.error(t('toast.settings.deleteConfirmError', { defaultValue: 'Please type DELETE to confirm' }));
            return;
        }
        
        setDeleting(true);
        
        try {
            await userAPI.requestAccountDeletion({ confirmation: 'DELETE', reason: deleteReason });
            toast.success(t('toast.settings.accountDeleted', { defaultValue: 'Account and associated data deleted permanently.' }));
            logout();
            navigate('/');
        } catch (error) {
            toast.error(error.response?.data?.message || t('toast.settings.deleteFailed', { defaultValue: 'Failed to delete account' }));
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
            setDeleteConfirmation('');
            setDeleteReason('');
        }
    };

    const SettingCard = ({ icon: Icon, title, description, children, danger = false }) => (
        <div className={`bg-white dark:bg-gray-800 rounded-2xl border ${danger ? 'border-red-200 dark:border-red-800' : 'border-gray-200 dark:border-gray-700'} p-3.5 sm:p-5 shadow-sm overflow-hidden`}>
            <div className="flex items-start gap-3 sm:gap-3.5">
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${danger ? 'bg-red-100 dark:bg-red-900/20' : 'bg-purple-100 dark:bg-purple-900/20'}`}>
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${danger ? 'text-red-600 dark:text-red-400' : 'text-purple-600 dark:text-purple-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className={`text-xs sm:text-sm font-bold break-words ${danger ? 'text-red-900 dark:text-red-100' : 'text-gray-900 dark:text-white'}`}>{title}</h3>
                    {description && <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5 break-words leading-relaxed">{description}</p>}
                    <div className="mt-3">{children}</div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 md:pb-8">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="container mx-auto max-w-4xl px-4 py-3 sm:py-4">
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                        <BackButton variant="soft" />
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
                                    {/* Current Password */}
                                    <div className="relative">
                                        <input
                                            type={showCurrentPw ? 'text' : 'password'}
                                            value={currentPassword}
                                            onChange={(e) => { setCurrentPassword(e.target.value); setPasswordError(''); }}
                                            placeholder="Current Password"
                                            className="w-full px-4 py-3 pr-11 text-sm sm:text-base bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            required
                                            autoComplete="current-password"
                                            disabled={changingPassword}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPw(!showCurrentPw)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-0.5"
                                            aria-label={showCurrentPw ? 'Hide current password' : 'Show current password'}
                                        >
                                            {showCurrentPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>

                                    {/* New Password */}
                                    <div className="relative">
                                        <input
                                            type={showNewPw ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); }}
                                            placeholder="New Password (min. 6 characters)"
                                            className="w-full px-4 py-3 pr-11 text-sm sm:text-base bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            required
                                            autoComplete="new-password"
                                            disabled={changingPassword}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPw(!showNewPw)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-0.5"
                                            aria-label={showNewPw ? 'Hide new password' : 'Show new password'}
                                        >
                                            {showNewPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>

                                    {/* Confirm New Password */}
                                    <div className="relative">
                                        <input
                                            type={showConfirmPw ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                                            placeholder="Confirm New Password"
                                            className="w-full px-4 py-3 pr-11 text-sm sm:text-base bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            required
                                            autoComplete="new-password"
                                            disabled={changingPassword}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPw(!showConfirmPw)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-0.5"
                                            aria-label={showConfirmPw ? 'Hide confirm password' : 'Show confirm password'}
                                        >
                                            {showConfirmPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>

                                    {/* Inline error message */}
                                    {passwordError && (
                                        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
                                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                            <span>{passwordError}</span>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={changingPassword}
                                        className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {changingPassword ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                Change Password
                                            </>
                                        )}
                                    </button>
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

                            <SettingCard
                                icon={Phone}
                                title="Contact Info Privacy"
                                description="Control who can see your contact information. Note: Only Silver and Gold members can view your contact info if enabled."
                            >
                                <div className="space-y-3">
                                    <label className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl cursor-pointer">
                                        <span className="flex-1 text-sm sm:text-base text-gray-700 dark:text-gray-300 break-words">Show Phone Number to eligible Silver/Gold members</span>
                                        <input 
                                            type="checkbox" 
                                            checked={showPhoneNumber} 
                                            onChange={handlePhoneVisibilityChange}
                                            className="mt-0.5 w-5 h-5 text-purple-600 rounded shrink-0" 
                                        />
                                    </label>
                                    <label className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl cursor-pointer">
                                        <span className="flex-1 text-sm sm:text-base text-gray-700 dark:text-gray-300 break-words">Show Email Address to eligible Silver/Gold members</span>
                                        <input 
                                            type="checkbox" 
                                            checked={showEmail} 
                                            onChange={handleEmailVisibilityChange}
                                            className="mt-0.5 w-5 h-5 text-purple-600 rounded shrink-0" 
                                        />
                                    </label>
                                    <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800/30">
                                        🔒 Both toggles are off by default. Leaving them disabled keeps your contact details completely private from all members.
                                    </p>
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
                            {loadingBlocked ? (
                                <p className="text-xs text-gray-400 animate-pulse">Loading blocked accounts...</p>
                            ) : blockedUsers.length > 0 ? (
                                <div className="space-y-2">
                                    {blockedUsers.map((blockedUser) => (
                                        <div key={blockedUser._id || blockedUser.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                                            <div className="flex items-center space-x-3">
                                                <ProfileAvatar user={blockedUser} className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/40 shrink-0" avatarClassName="text-xl" fallbackClassName="text-xs font-bold text-purple-600 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/40" />
                                                <div>
                                                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200 block">{blockedUser.name}</span>
                                                    {blockedUser.location && <span className="text-xs text-gray-400 block">{blockedUser.location}</span>}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleUnblockUser(blockedUser._id || blockedUser.id)}
                                                className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-3 py-1.5 rounded-lg transition"
                                            >
                                                {t('settings.unblock', { defaultValue: 'Unblock' })}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('settings.noBlockedUsers', { defaultValue: 'You have not blocked any accounts.' })}</p>
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

                    {/* Privacy, Consent & Data Rights */}
                    <section>
                        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 shrink-0" />
                            Privacy, Consent & Data Rights
                        </h2>
                        <div className="space-y-4">
                            <SettingCard
                                icon={FileText}
                                title="Accepted Policy Versions"
                                description="Review your current legal agreements and accepted terms on Kapu-LK."
                            >
                                <div className="space-y-3">
                                    <div className="p-3.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-xs sm:text-sm space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">Current Policy Version:</span>
                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                v{user?.acknowledgedPrivacyPolicyVersion || '2.0'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">Agreement Date:</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {user?.acknowledgedPrivacyPolicyAt ? new Date(user.acknowledgedPrivacyPolicyAt).toLocaleDateString() : 'Verified on Registration'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">Retention Lifecycle:</span>
                                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                                                10-day inactivity deletion active
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPolicyModalTab('privacy');
                                                setPolicyModalOpen(true);
                                            }}
                                            className="px-4 py-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-xl text-xs sm:text-sm font-semibold transition"
                                        >
                                            Read Policies
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => navigate('/contact-admin')}
                                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-xs sm:text-sm font-medium transition"
                                        >
                                            Contact Privacy Support
                                        </button>
                                    </div>
                                </div>
                            </SettingCard>

                            <SettingCard
                                icon={Download}
                                title="Download Personal Data (PDF & JSON Archive)"
                                description="Under GDPR and Sri Lankan data rights (PDPA), you can download a complete certified report or JSON archive of your personal profile, statistics, wallet balance, and consent logs."
                            >
                                <div className="flex flex-wrap gap-2.5">
                                    <button
                                        type="button"
                                        onClick={handleExportDataPDF}
                                        disabled={exportingData}
                                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-sm"
                                    >
                                        {exportingData ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                <span>Generating PDF...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Download className="w-4 h-4" />
                                                <span>Download Data Report (PDF)</span>
                                            </>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleExportData}
                                        disabled={exportingData}
                                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50 text-gray-800 dark:text-gray-200 rounded-xl text-xs sm:text-sm font-semibold transition"
                                    >
                                        <FileText className="w-4 h-4 text-purple-600" />
                                        <span>Download JSON Archive</span>
                                    </button>
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
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2">
                            Optional: Tell us why you are deleting your account
                        </p>
                        <input
                            type="text"
                            value={deleteReason}
                            onChange={(e) => setDeleteReason(e.target.value)}
                            placeholder="e.g. Found my match, leaving platform..."
                            className="w-full px-4 py-2.5 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
                        />
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
                                    setDeleteReason('');
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

            {/* Policy Viewer Modal */}
            <PolicyViewerModal
                isOpen={policyModalOpen}
                onClose={() => setPolicyModalOpen(false)}
                initialTab={policyModalTab}
            />
        </div>
    );
};

export default Settings;
