import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { userAPI, messageAPI, notificationAPI, achievementAPI, giftAPI, referralAPI, walletAPI } from '../../services/api';
import { toast } from 'react-toastify';
import {
    User, CheckCircle, Clock, MessageCircle, Bell, Search, Heart,
    Crown, Zap, X, RefreshCw, Trophy, Flame, Star, Share2, FileText, Calendar, Gift, Plus
} from 'lucide-react';
import ProfileCard from '../../components/ui/ProfileCard';
import CustomSelect from '../../components/ui/CustomSelect';
import PremiumPopup from '../../components/ui/PremiumPopup';

const Dashboard = () => {
    const { t } = useTranslation();
    const { user, premiumStatus, refreshPremiumStatus } = useAuth();
    const navigate = useNavigate();
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [showPremiumPopup, setShowPremiumPopup] = useState(false);
    const [gifts, setGifts] = useState([]);
    const [giftsLoading, setGiftsLoading] = useState(false);
    const [referralCode, setReferralCode] = useState(null);
    const [referralStats, setReferralStats] = useState(null);
    const [referralLoading, setReferralLoading] = useState(false);
    const [wallet, setWallet] = useState(null);
    const [showTopUpModal, setShowTopUpModal] = useState(false);
    const [topUpAmount, setTopUpAmount] = useState('');
    const [selectedBank, setSelectedBank] = useState('HNB');
    const [paymentSlip, setPaymentSlip] = useState(null);
    const [submittingPayment, setSubmittingPayment] = useState(false);

    const FREE_LIMIT = 5;
    const messagesLeft = premiumStatus?.isPremium
        ? t('common.unlimited', { defaultValue: 'Unlimited' })
        : Math.max(0, FREE_LIMIT - (premiumStatus?.messagesSent || 0));

    const isProfileComplete = Boolean(
        user?.age &&
        user?.gender &&
        (user?.district || user?.location) &&
        (user?.education || '').length > 0 &&
        (user?.occupation || user?.workplace) &&
        (user?.maritalStatus || '').length > 0 &&
        (user?.religion || '').length > 0 &&
        (user?.bio || '').trim().length > 0 &&
        user?.partnerPreferences?.minAge &&
        user?.partnerPreferences?.maxAge &&
        (user?.partnerPreferences?.religion || '').length > 0 &&
        (user?.partnerPreferences?.district || '').length > 0 &&
        (user?.partnerPreferences?.education || '').length > 0 &&
        (user?.partnerPreferences?.maritalStatus || '').length > 0
    );

    const missingFields = () => {
        if (!user) return [];
        const m = [];
        if (!user.age) m.push('Age');
        if (!user.gender) m.push('Gender');
        if (!(user.district || user.location)) m.push('District or Location');
        if (!(user.education || '').length) m.push('Education');
        if (!(user.occupation || user.workplace)) m.push('Occupation or Workplace');
        if (!(user.maritalStatus || '').length) m.push('Marital Status');
        if (!(user.religion || '').length) m.push('Religion');
        if (!((user.bio || '').trim().length)) m.push('Bio');
        if (!user.partnerPreferences?.minAge) m.push('Partner Min Age');
        if (!user.partnerPreferences?.maxAge) m.push('Partner Max Age');
        if (!(user.partnerPreferences?.religion || '').length) m.push('Partner Religion');
        if (!(user.partnerPreferences?.district || '').length) m.push('Partner District');
        if (!(user.partnerPreferences?.education || '').length) m.push('Partner Education');
        if (!(user.partnerPreferences?.maritalStatus || '').length) m.push('Partner Marital Status');
        return m;
    };

    const [activeTab, setActiveTab] = useState('overview');

    const [featuredUsers, setFeaturedUsers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [overviewLoading, setOverviewLoading] = useState(true);
    const [showAllProfiles, setShowAllProfiles] = useState(false);
    const [lastRandomizeTime, setLastRandomizeTime] = useState(null);

    const [matches, setMatches] = useState([]);
    const [matchesLoading, setMatchesLoading] = useState(false);

    const [conversations, setConversations] = useState([]);
    const [pendingConversationUserId, setPendingConversationUserId] = useState(null);

    const [notifications, setNotifications] = useState([]);
    const [notificationsLoading, setNotificationsLoading] = useState(false);

    const [searchFilters, setSearchFilters] = useState({
        gender: '',
        minAge: '',
        maxAge: '',
        location: '',
        interests: '',
    });
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);

    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
    const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

    // Gamification state
    const [userStats, setUserStats] = useState(null);
    const [achievements, setAchievements] = useState([]);

    // Premium popup logic - show every 10 minutes for non-premium users
    useEffect(() => {
        if (user?.isPremium || user?.role === 'admin') return;

        const TEN_MINUTES = 10 * 60 * 1000;

        const checkPopupTiming = () => {
            const lastShown = localStorage.getItem('premiumPopupLastShown');
            const now = Date.now();

            if (!lastShown || now - parseInt(lastShown) > TEN_MINUTES) {
                setShowPremiumPopup(true);
                localStorage.setItem('premiumPopupLastShown', now.toString());
            }
        };

        // Initial check after 30 seconds
        const initialTimer = setTimeout(checkPopupTiming, 30000);
        
        // Then check every 10 minutes
        const intervalTimer = setInterval(checkPopupTiming, TEN_MINUTES);

        return () => {
            clearTimeout(initialTimer);
            clearInterval(intervalTimer);
        };
    }, [user?.isPremium, user?.role]);

    const fetchConversations = useCallback(async () => {
        try {
            const response = await messageAPI.getConversations();
            const convos = response.data || [];
            setConversations(convos);
            const unread = convos.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
            setUnreadMessagesCount(unread);
        } catch (error) {
            // Silent fail to avoid noise on first load
        }
    }, []);

    const fetchNotifications = useCallback(async () => {
        setNotificationsLoading(true);
        try {
            const response = await notificationAPI.getNotifications();
            const items = response.data || [];
            setNotifications(items);
            setUnreadNotificationCount(items.filter((n) => !n.isRead).length);
        } catch (error) {
            // Silent on initial load
        } finally {
            setNotificationsLoading(false);
        }
    }, []);

    const fetchUserStats = useCallback(async () => {
        try {
            const response = await achievementAPI.getMyStats();
            setUserStats(response.data.stats);
            setAchievements(response.data.achievements || []);
        } catch (error) {
            console.error('Error fetching user stats:', error);
        }
    }, []);

    const fetchGifts = useCallback(async () => {
        setGiftsLoading(true);
        try {
            const response = await giftAPI.getGifts();
            setGifts(response.data || []);
        } catch (error) {
            console.error('Error fetching gifts:', error);
        } finally {
            setGiftsLoading(false);
        }
    }, []);

    const fetchReferralData = useCallback(async () => {
        setReferralLoading(true);
        try {
            const [codeRes, statsRes] = await Promise.all([
                referralAPI.getMyReferralCode(),
                referralAPI.getReferralStats()
            ]);
            setReferralCode(codeRes.data);
            setReferralStats(statsRes.data);
        } catch (error) {
            console.error('Error fetching referral data:', error);
        } finally {
            setReferralLoading(false);
        }
    }, []);

    const fetchWallet = useCallback(async () => {
        try {
            const response = await walletAPI.getWallet();
            setWallet(response.data);
        } catch (error) {
            console.error('Error fetching wallet:', error);
        }
    }, []);

    const fetchOverviewUsers = useCallback(async () => {
        setOverviewLoading(true);
        try {
            const now = Date.now();
            const TEN_MINUTES = 10 * 60 * 1000;
            
            // Check if we should randomize (every 10 minutes or first time)
            const shouldRandomize = !lastRandomizeTime || (now - lastRandomizeTime > TEN_MINUTES);
            
            const response = await userAPI.getAllUsers();
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            const users = response.data?.data || response.data || [];

            const filteredUsers = users
                .filter(u =>
                    u &&
                    u._id &&
                    u.role !== 'admin' &&
                    u.isApproved &&
                    u.isActive &&
                    u._id !== user?._id
                )
                .map(u => ({
                    ...u,
                    registeredDate: new Date(u.createdAt)
                }));

            // Randomize if needed
            let randomizedUsers = filteredUsers;
            if (shouldRandomize) {
                randomizedUsers = [...filteredUsers].sort(() => Math.random() - 0.5);
                setLastRandomizeTime(now);
            }

            // Set featured users (first 6 after randomization)
            setFeaturedUsers(randomizedUsers.slice(0, 6));

            // Set all users for the view more section
            setAllUsers(randomizedUsers);
        } catch (error) {
            console.error('Error fetching users:', error);
            if (error.response?.status === 401) {
                toast.error(t('toast.errors.unauthorized'));
            } else if (error.response?.status === 500) {
                toast.error(t('toast.errors.serverError'));
            } else {
                toast.error(t('toast.errors.unknownError'));
            }
            setFeaturedUsers([]);
            setAllUsers([]);
        } finally {
            setOverviewLoading(false);
        }
    }, [user?._id, t, lastRandomizeTime]);

    const fetchMatches = useCallback(async () => {
        setMatchesLoading(true);
        try {
            const response = await userAPI.getMatches();
            setMatches(response.data?.data || response.data || []);
        } catch (error) {
            console.error('Error fetching matches:', error);
            if (error.response?.status === 401) {
                toast.error(t('toast.errors.unauthorized'));
            } else if (error.response?.status === 500) {
                toast.error(t('toast.errors.serverError'));
            } else {
                toast.error(t('toast.errors.unknownError'));
            }
            setMatches([]);
        } finally {
            setMatchesLoading(false);
        }
    }, [t]);


    const handleOpenConversation = useCallback((otherUserId) => {
        const convo = conversations.find((c) => c.user && c.user._id === otherUserId);
        if (convo) {
            // User found in conversations
        } else if (matches.length > 0) {
            const fromMatches = matches.find((m) => m._id === otherUserId);
            if (fromMatches) {
                // User found in matches
            }
        }
    }, [conversations, matches]);

    useEffect(() => {
        if (isProfileComplete && (user?.isApproved || user?.role === 'admin')) {
            fetchOverviewUsers();
        } else {
            setOverviewLoading(false);
            setFeaturedUsers([]);
            setAllUsers([]);
        }
        fetchNotifications();
        fetchConversations();
        fetchUserStats();
        fetchGifts();
        fetchReferralData();
        fetchWallet();

        // periodic refresh for notifications every 20s
        const notifInterval = setInterval(() => {
            fetchNotifications();
        }, 20000);
        return () => clearInterval(notifInterval);
    }, [isProfileComplete, user?.isApproved, user?.role, fetchOverviewUsers, fetchNotifications, fetchConversations, fetchUserStats, fetchGifts, fetchReferralData, fetchWallet]);

    useEffect(() => {
        if (activeTab === 'matches' && matches.length === 0 && (user?.isApproved || user?.role === 'admin')) {
            fetchMatches();
        }
    }, [activeTab, matches.length, user?.isApproved, user?.role, fetchMatches]);

    useEffect(() => {
        if (activeTab === 'messages' && pendingConversationUserId) {
            handleOpenConversation(pendingConversationUserId);
            setPendingConversationUserId(null);
        }
    }, [activeTab, pendingConversationUserId, handleOpenConversation]);

    const handleCardMessage = (otherUserId) => {
        navigate(`/conversation/${otherUserId}`);
    };

    const handleQuickLike = async (targetUserId) => {
        try {
            await messageAPI.sendMessage({
                to: targetUserId,
                content: 'sent you a like on Kapu LK',
                type: 'like',
            });
            toast.success(t('toast.likes.likeSent'));
            await fetchConversations();
            await refreshPremiumStatus();
        } catch (error) {
            if (error.response?.status === 403) {
                setShowPremiumModal(true);
            } else {
                toast.error(error.response?.data?.message || t('toast.likes.likeFailed'));
            }
        }
    };

    const handleMarkAllNotificationsRead = async () => {
        try {
            await notificationAPI.markAllRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadNotificationCount(0);
            toast.success(t('toast.notifications.allRead'));
        } catch (error) {
            toast.error(t('toast.notifications.markAsReadFailed'));
        }
    };

    const handleSearch = async () => {
        setSearchLoading(true);
        try {
            const response = await userAPI.searchUsers(searchFilters);
            const filteredUsers = (response.data?.data || response.data || []).filter(u => u._id !== user?._id && u.role !== 'admin');
            setSearchResults(filteredUsers);
            toast.success(t('toast.search.profilesFound', { count: filteredUsers.length }));
        } catch (error) {
            toast.error(t('toast.search.searchFailed'));
        } finally {
            setSearchLoading(false);
        }
    };

    const handleResetSearch = () => {
        setSearchFilters({
            gender: '',
            minAge: '',
            maxAge: '',
            location: '',
            interests: '',
        });
        setSearchResults([]);
    };

    const handlePaymentSubmit = async () => {
        if (!topUpAmount || parseFloat(topUpAmount) < 100) {
            toast.error('Minimum top-up amount is 100 LKR');
            return;
        }
        if (!paymentSlip) {
            toast.error('Please upload your payment slip');
            return;
        }

        setSubmittingPayment(true);
        try {
            const formData = new FormData();
            formData.append('amount', parseFloat(topUpAmount));
            formData.append('bankName', selectedBank);
            formData.append('paymentSlip', paymentSlip);

            await walletAPI.createPaymentRequest(formData);
            toast.success('Payment request submitted! Admin will approve within 24 hours.');
            setShowTopUpModal(false);
            setTopUpAmount('');
            setPaymentSlip(null);
            setSelectedBank('HNB');
            fetchWallet();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit payment request');
        } finally {
            setSubmittingPayment(false);
        }
    };

    const PremiumModal = () => (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card max-w-lg w-full">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full">
                            <Crown className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                                {t('dashboard.upgradeTitle', { defaultValue: 'Upgrade to Premium' })}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300">
                                {t('dashboard.upgradeSubtitle', { defaultValue: 'Unlock unlimited messaging and more!' })}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowPremiumModal(false)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-xl p-4 mb-6">
                    <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 mb-2">
                        LKR 500
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        {t('dashboard.lifetimeAccess', { defaultValue: 'One-time payment, lifetime access' })}
                    </p>
                </div>

                <ul className="space-y-3 mb-6">
                    {[
                        t('premium.benefits.unlimitedMessages'),
                        t('premium.benefits.unlimitedLikes'),
                        t('premium.benefits.profileBoost'),
                        t('premium.benefits.premiumBadge'),
                        t('premium.benefits.advancedFilters'),
                        t('premium.benefits.seeWhoViewed')
                    ].map((benefit, i) => (
                        <li key={i} className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span>{benefit}</span>
                        </li>
                    ))}
                </ul>

                <div className="flex space-x-4">
                    <button
                        onClick={() => setShowPremiumModal(false)}
                        className="flex-1 btn-secondary"
                    >
                        {t('common.later', { defaultValue: 'Later' })}
                    </button>
                    <button
                        onClick={() => {
                            setShowPremiumModal(false);
                            navigate('/premium');
                        }}
                        className="flex-1 btn-primary flex items-center justify-center space-x-2"
                    >
                        <Zap className="w-5 h-5" />
                        <span>{t('dashboard.upgradeNow', { defaultValue: 'Upgrade Now' })}</span>
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-purple-950 dark:to-slate-900 text-slate-900 dark:text-white relative overflow-hidden page-transition">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-purple-300/40 dark:bg-purple-500/20 blur-3xl" />
                <div className="absolute top-20 right-20 h-80 w-80 rounded-full bg-pink-300/40 dark:bg-pink-500/20 blur-3xl" />
                <div className="absolute bottom-20 left-1/3 h-72 w-72 rounded-full bg-violet-300/40 dark:bg-violet-500/20 blur-3xl" />
            </div>

            {/* Hero / Welcome banner */}
            <div className="relative text-slate-900 dark:text-white">
                <div className="container mx-auto px-3 sm:px-4 pt-4 sm:pt-10 md:pt-14 pb-16 sm:pb-20 md:pb-24">
                    <div className="relative overflow-hidden rounded-3xl border border-white/60 dark:border-slate-700/60 bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl px-4 py-5 sm:px-6 sm:py-8 md:px-8 md:py-10 flex flex-col gap-5 md:flex-row md:items-center md:gap-8">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-purple-100 via-pink-50 to-transparent dark:from-purple-500/10 dark:to-transparent" />
                        <div className="absolute -right-12 -top-12 h-32 w-32 sm:h-40 sm:w-40 rounded-full bg-purple-300/40 dark:bg-white/10 blur-3xl" />
                        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-purple-200/50 to-transparent dark:via-white/20" />
                    </div>
                    <div className="relative z-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:space-x-4 min-w-0">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-500/20 dark:to-pink-500/20 flex items-center justify-center overflow-hidden border-2 border-purple-200 dark:border-purple-500/30 shrink-0 shadow-lg">
                            {user?.profileImageUrl ? (
                                <img
                                    src={user.profileImageUrl}
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <User className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-purple-600 dark:text-purple-400" />
                            )}
                        </div>
                        <div className="min-w-0 w-full">
                            <p className="text-[11px] sm:text-sm uppercase tracking-[0.24em] text-purple-600 dark:text-purple-400 font-semibold">{t('dashboard.title', { defaultValue: 'Kapu LK dashboard' })}</p>
                            <h1 className="mt-1 text-[1.75rem] sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-tight max-w-[14ch] sm:max-w-none bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                {t('dashboard.welcomeBack')}, {user?.name || t('common.member', { defaultValue: 'Member' })}!
                            </h1>
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] sm:text-sm">
                                {user?.role === 'admin' ? (
                                    <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-500/20 border border-purple-200 dark:border-purple-500/30 text-[11px] sm:text-xs font-semibold text-purple-700 dark:text-purple-300">
                                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                        {t('admin.title')}
                                    </span>
                                ) : user?.isApproved ? (
                                    <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-400/15 border border-emerald-200 dark:border-emerald-200/30 text-emerald-700 dark:text-emerald-50 text-[11px] sm:text-xs font-semibold">
                                        {t('dashboard.profileApproved', { defaultValue: 'Approved' })}
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-400/15 border border-amber-200 dark:border-amber-200/30 text-amber-700 dark:text-amber-50 text-[11px] sm:text-xs font-semibold">
                                        <Clock className="w-3.5 h-3.5 mr-1.5" />
                                        {t('dashboard.pendingApproval', { defaultValue: 'Pending' })}
                                    </span>
                                )}
                                {premiumStatus?.isPremium && (
                                    <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-yellow-50 dark:bg-yellow-400/20 border border-yellow-200 dark:border-yellow-200/30 text-yellow-700 dark:text-yellow-50 text-[11px] sm:text-xs font-semibold">
                                        <Crown className="w-3.5 h-3.5 mr-1.5" />
                                        {t('profile.premiumMember')}
                                    </span>
                                )}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2 text-[11px] sm:text-xs">
                                <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#f0f2f5] dark:bg-slate-950/25 border border-[#dbe4f0] dark:border-white/10 text-[#4b4f56] dark:text-white">
                                    <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                                    {t('dashboard.unreadMessages', { defaultValue: '{{count}} unread', count: unreadMessagesCount })}
                                </span>
                                <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#f0f2f5] dark:bg-slate-950/25 border border-[#dbe4f0] dark:border-white/10 text-[#4b4f56] dark:text-white">
                                    <Bell className="w-3.5 h-3.5 mr-1.5" />
                                    {t('dashboard.unreadNotifications', { defaultValue: '{{count}} alerts', count: unreadNotificationCount })}
                                </span>
                                {!premiumStatus?.isPremium && (
                                    <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-500/15 border border-orange-200 dark:border-orange-200/20 text-orange-700 dark:text-orange-50">
                                        <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                                        {t('dashboard.messagesLeft', { defaultValue: '{{count}} left', count: messagesLeft })}
                                    </span>
                                )}
                                {/* Gamification stats */}
                                {userStats && (
                                    <>
                                        <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-500/15 border border-purple-200 dark:border-purple-200/20 text-purple-700 dark:text-purple-50">
                                            <Star className="w-3.5 h-3.5 mr-1.5" />
                                            {userStats.points} pts
                                        </span>
                                        {userStats.loginStreak > 0 && (
                                            <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-500/15 border border-orange-200 dark:border-orange-200/20 text-orange-700 dark:text-orange-50">
                                                <Flame className="w-3.5 h-3.5 mr-1.5" />
                                                {userStats.loginStreak} day streak
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 md:ml-auto grid grid-cols-1 min-[420px]:grid-cols-2 md:flex md:flex-row gap-2.5 w-full md:w-auto mt-1 md:mt-0">
                        <Link
                            to="/users"
                            className="col-span-1 inline-flex justify-center items-center gap-1.5 px-4 sm:px-6 py-3.5 rounded-2xl bg-[#1877F2] text-white font-semibold shadow-md hover:bg-[#166fe5] active:scale-95 transition-all text-sm w-full md:w-auto min-h-[48px]"
                        >
                            Browse
                        </Link>
                        <Link
                            to="/profile"
                            className="col-span-1 inline-flex justify-center items-center gap-1.5 px-4 sm:px-6 py-3.5 rounded-2xl border border-[#ccd0d5] dark:border-white/20 bg-white dark:bg-slate-700 text-[#1c1e21] dark:text-white font-semibold hover:bg-[#f0f2f5] dark:hover:bg-slate-600 active:scale-95 transition-all text-sm w-full md:w-auto min-h-[48px] min-w-[140px] whitespace-nowrap"
                        >
                            {t('profile.editProfile', { defaultValue: 'Edit Profile' })}
                        </Link>
                        {!premiumStatus?.isPremium && !premiumStatus?.premiumRequested && (
                            <Link
                                to="/premium"
                                className="col-span-1 min-[420px]:col-span-2 md:col-span-1 inline-flex justify-center items-center gap-2 px-4 sm:px-6 py-3.5 rounded-2xl bg-[#42b72a] text-white font-semibold shadow-md hover:bg-[#36a420] active:scale-95 transition-all text-sm w-full md:w-auto min-h-[48px]"
                            >
                                <Crown className="w-4 h-4" />
                                {t('dashboard.goPremium')}
                            </Link>
                        )}
                    </div>
                </div>
                </div>
            </div>

            <div className="relative container mx-auto px-3 sm:px-4 pb-24 md:pb-12 -mt-8 sm:-mt-10 md:-mt-14 space-y-4 sm:space-y-6 z-10">
                <div className="glass-card p-2 mobile-tab-list w-full">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold flex items-center space-x-1.5 whitespace-nowrap transition-all duration-200 ${activeTab === 'overview'
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                            : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                            }`}
                    >
                        <span>{t('dashboard.overview')}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('matches')}
                        className={`px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold flex items-center space-x-1.5 whitespace-nowrap transition-all duration-200 ${activeTab === 'matches'
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                            : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                            }`}
                    >
                        <Heart className="w-3.5 h-3.5" />
                        <span>{t('dashboard.matches')}</span>
                    </button>
                    <button
                        onClick={() => navigate('/conversation')}
                        className="px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold flex items-center space-x-1.5 whitespace-nowrap transition-all duration-200 bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{t('dashboard.messages')}</span>
                        {unreadMessagesCount > 0 && (
                            <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-[10px] rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold">
                                {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={`px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold flex items-center space-x-1.5 whitespace-nowrap transition-all duration-200 ${activeTab === 'notifications'
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                            : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                            }`}
                    >
                        <Bell className="w-3.5 h-3.5" />
                        <span>{t('dashboard.notifications')}</span>
                        {unreadNotificationCount > 0 && (
                            <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-[10px] rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold">
                                {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('search')}
                        className={`px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold flex items-center space-x-1.5 whitespace-nowrap transition-all duration-200 ${activeTab === 'search'
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                            : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                            }`}
                    >
                        <Search className="w-3.5 h-3.5" />
                        <span>{t('common.search')}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('referrals')}
                        className={`px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold flex items-center space-x-1.5 whitespace-nowrap transition-all duration-200 ${activeTab === 'referrals'
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                            : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                            }`}
                    >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Referrals</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('stories')}
                        className={`px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold flex items-center space-x-1.5 whitespace-nowrap transition-all duration-200 ${activeTab === 'stories'
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                            : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                            }`}
                    >
                        <Heart className="w-3.5 h-3.5" />
                        <span>Stories</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('blog')}
                        className={`px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold flex items-center space-x-1.5 whitespace-nowrap transition-all duration-200 ${activeTab === 'blog'
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                            : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                            }`}
                    >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Blog</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('events')}
                        className={`px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold flex items-center space-x-1.5 whitespace-nowrap transition-all duration-200 ${activeTab === 'events'
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                            : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                            }`}
                    >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Events</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('gifts')}
                        className={`px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold flex items-center space-x-1.5 whitespace-nowrap transition-all duration-200 ${activeTab === 'gifts'
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                            : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                            }`}
                    >
                        <Gift className="w-3.5 h-3.5" />
                        <span>Gifts</span>
                    </button>
                </div>

                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {!isProfileComplete && (
                            <div className="bg-white dark:bg-slate-900/70 border border-[#e4e6eb] dark:border-amber-800 rounded-2xl p-4 sm:p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                                <div className="flex items-start gap-3 sm:gap-4">
                                    <div className="p-2 sm:p-3 bg-amber-100 dark:bg-amber-800 rounded-full shrink-0">
                                        <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 dark:text-amber-300" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base sm:text-lg font-bold text-amber-900 dark:text-amber-100 mb-1 sm:mb-2">
                                            {t('dashboard.completeProfile', { defaultValue: 'Complete Your Profile' })}
                                        </h3>
                                        <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300 mb-3 sm:mb-4">
                                            {t('dashboard.completeProfileDesc', { defaultValue: 'Please complete your profile to view other members and access all features.' })}
                                        </p>
                                        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                                            {missingFields().map((field, idx) => (
                                                <span key={idx} className="inline-flex items-center px-2 py-1 bg-white dark:bg-gray-800 rounded-md text-xs font-medium text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700">
                                                    {field}
                                                </span>
                                            ))}
                                        </div>
                                        <Link
                                            to="/profile"
                                            state={{ reason: 'complete_profile' }}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1877F2] text-white rounded-lg font-semibold hover:bg-[#166fe5] transition-all text-sm"
                                        >
                                            <User className="w-4 h-4" />
                                            {t('dashboard.completeNow', { defaultValue: 'Complete Now' })}
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isProfileComplete && (
                            <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
                                <div className="glass-card">
                                    <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">Profile status</h2>
                                    <p className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                                        {user?.role === 'admin'
                                            ? 'Administrator account'
                                            : user?.isApproved
                                                ? 'Approved member'
                                                : 'Awaiting approval'}
                                    </p>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                        Keep your details up to date to get better matches.
                                    </p>
                                </div>

                                <div className="glass-card">
                                    <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">Next step</h2>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                        {user?.isApproved || user?.role === 'admin'
                                            ? 'Browse profiles, view suggested matches and start conversations.'
                                            : 'Our admin team will review your profile shortly. You can still complete your details.'}
                                    </p>
                                </div>

                                <div className="glass-card">
                                    <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">Quick tips</h2>
                                    <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside">
                                        <li>Add a clear profile photo.</li>
                                        <li>Be honest in your bio.</li>
                                        <li>Check in daily for streaks!</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* Gamification Section */}
                        {userStats && (
                            <div className="glass-card">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <Trophy className="w-6 h-6 text-yellow-500" />
                                        Achievements & Progress
                                    </h2>
                                    <button
                                        onClick={() => achievementAPI.dailyCheckIn().then(() => {
                                            toast.success('Check-in successful! +10 LKR');
                                            fetchUserStats();
                                            fetchWallet();
                                        })}
                                        className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-pink-600 transition-all flex items-center gap-2 shadow-lg shadow-orange-500/20"
                                    >
                                        <Flame className="w-4 h-4" />
                                        Daily Check-in (+10 LKR)
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-center shadow-lg shadow-purple-500/20">
                                        <div className="text-3xl font-bold text-white mb-1">{userStats.points}</div>
                                        <div className="text-xs text-purple-100 font-medium">Total Points</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-center shadow-lg shadow-orange-500/20">
                                        <div className="text-3xl font-bold text-white mb-1">{userStats.loginStreak}</div>
                                        <div className="text-xs text-orange-100 font-medium">Day Streak</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl p-5 text-center shadow-lg shadow-pink-500/20">
                                        <div className="text-3xl font-bold text-white mb-1">{userStats.totalGiftsSent}</div>
                                        <div className="text-xs text-pink-100 font-medium">Gifts Sent</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-center shadow-lg shadow-blue-500/20">
                                        <div className="text-3xl font-bold text-white mb-1">{userStats.totalReferrals}</div>
                                        <div className="text-xs text-blue-100 font-medium">Referrals</div>
                                    </div>
                                </div>

                                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Recent Achievements</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                    {achievements.filter(a => a.earned).slice(0, 6).map((achievement) => (
                                        <div
                                            key={achievement._id}
                                            className="bg-white dark:bg-slate-800 rounded-xl p-4 text-center border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition"
                                            title={achievement.name}
                                        >
                                            <div className="text-4xl mb-2">{achievement.icon}</div>
                                            <div className="text-xs font-medium text-slate-900 dark:text-white truncate">{achievement.name}</div>
                                        </div>
                                    ))}
                                    {achievements.filter(a => a.earned).length === 0 && (
                                        <div className="col-span-full text-center py-8 text-slate-500 dark:text-slate-400 text-sm bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                            No achievements yet. Keep active to earn badges!
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Wallet Section */}
                        {wallet && (
                            <div className="glass-card">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <Crown className="w-6 h-6 text-yellow-500" />
                                        Wallet Balance
                                    </h2>
                                    <button
                                        onClick={() => setShowTopUpModal(true)}
                                        className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl text-sm font-semibold hover:from-green-600 hover:to-emerald-600 transition-all flex items-center gap-2 shadow-lg shadow-green-500/20"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Top Up Wallet
                                    </button>
                                </div>

                                <div className="bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 rounded-2xl p-8 text-center mb-6 shadow-2xl shadow-orange-500/30">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <Crown className="w-8 h-8 text-white" />
                                        <span className="text-white/90 text-sm font-medium">Available Balance</span>
                                    </div>
                                    <div className="text-5xl font-bold text-white mb-2">
                                        Rs. {wallet.balance.toLocaleString()}
                                    </div>
                                    <div className="text-white/80 text-sm">
                                        Sri Lankan Rupees (LKR)
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-green-50 dark:bg-green-500/10 rounded-xl p-4 text-center border border-green-200 dark:border-green-500/20">
                                        <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">{wallet.totalDeposits || 0}</div>
                                        <div className="text-xs text-green-700 dark:text-green-300 font-medium">Total Deposits</div>
                                    </div>
                                    <div className="bg-red-50 dark:bg-red-500/10 rounded-xl p-4 text-center border border-red-200 dark:border-red-500/20">
                                        <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">{wallet.totalSpent || 0}</div>
                                        <div className="text-xs text-red-700 dark:text-red-300 font-medium">Total Spent</div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Recent Transactions</h3>
                                    <button
                                        onClick={() => setActiveTab('wallet')}
                                        className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                                    >
                                        View All
                                    </button>
                                </div>
                            </div>
                        )}

                        {!user?.isApproved && user?.role !== 'admin' && (
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                                    <strong>Note:</strong> Your profile is pending admin approval. Once approved, you'll be
                                    able to see all profiles and contact other members.
                                </p>
                            </div>
                        )}

                        <div className="glass-card">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Recently Joined</h2>
                                <button
                                    onClick={() => setShowAllProfiles(!showAllProfiles)}
                                    className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center space-x-1 font-medium"
                                >
                                    <span>{showAllProfiles ? 'Show Less' : 'View All Profiles'}</span>
                                </button>
                            </div>

                            {overviewLoading ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-t-4 border-b-4 border-purple-500 mx-auto mb-4"></div>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">Loading profiles...</p>
                                </div>
                            ) : featuredUsers.length > 0 ? (
                                <div className="space-y-6 sm:space-y-8">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                        {featuredUsers.map((u) => (
                                            <ProfileCard
                                                key={u._id}
                                                user={u}
                                                onView={() => navigate(`/users/${u._id}`)}
                                                onMessage={() => handleCardMessage(u._id)}
                                                isOwnProfile={u._id === user._id}
                                            />
                                        ))}
                                    </div>

                                    {showAllProfiles && allUsers.length > 6 && (
                                        <div className="mt-6 sm:mt-8">
                                            <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 dark:text-white">All Profiles</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                                {allUsers.slice(6).map((u) => (
                                                    <ProfileCard
                                                        key={u._id}
                                                        user={u}
                                                        onView={() => navigate(`/users/${u._id}`)}
                                                        onMessage={() => handleCardMessage(u._id)}
                                                        isOwnProfile={u._id === user._id}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                                    <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">No profiles available yet. Check back soon!</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'matches' && (
                    <div className="glass-card">
                        {!isProfileComplete ? (
                            <div className="text-center py-8">
                                <p className="text-slate-700 dark:text-slate-300 mb-2">Complete your profile to view suggested matches.</p>
                                {missingFields().length > 0 && (
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Missing: {missingFields().join(', ')}</p>
                                )}
                                <Link to="/profile" className="inline-block btn-primary">Complete Profile</Link>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                                        <Heart className="w-6 h-6 text-pink-500" />
                                        <span>Suggested Matches</span>
                                    </h2>
                                </div>

                                {matchesLoading ? (
                                    <div className="text-center py-12">
                                        <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-t-4 border-b-4 border-purple-500 mx-auto mb-4"></div>
                                        <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">Finding matches...</p>
                                    </div>
                                ) : matches.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                        {matches.map((m) => (
                                            <div key={m._id} className="relative">
                                                <ProfileCard
                                                    user={m}
                                                    onView={() => navigate(`/users/${m._id}`)}
                                                    onLike={() => handleQuickLike(m._id)}
                                                    onMessage={() => handleCardMessage(m._id)}
                                                    onShare={() => { }}
                                                    isOwnProfile={false}
                                                />
                                                <div className="absolute top-4 left-4 bg-white/95 dark:bg-slate-800/90 rounded-full px-3 py-1 text-xs font-semibold text-purple-600 dark:text-purple-300 shadow-lg">
                                                    Compatibility: {m.compatibilityScore || 0}%
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Heart className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                                        <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">No matches found yet. Complete your profile and add interests for better suggestions.</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'messages' && (
                    <div className="glass-card">
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="md:col-span-1 border-r border-gray-200 dark:border-gray-700 pr-0 md:pr-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                                        <MessageCircle className="w-5 h-5 text-purple-500" />
                                        <span>Conversations</span>
                                    </h2>
                                </div>
                                {conversations.length === 0 ? (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">No conversations yet. Start by liking or messaging a profile.</p>
                                ) : (
                                    <div className="space-y-2 max-h-80 overflow-y-auto">
                                        {conversations.map((c) => (
                                            <button
                                                key={c.user._id}
                                                onClick={() => navigate(`/conversation/${c.user._id}`)}
                                                className="w-full text-left px-3 py-2 rounded-lg flex items-center justify-between border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{c.user.name}</p>
                                                    {c.lastMessage && (
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[140px]">
                                                            {c.lastMessage.content}
                                                        </p>
                                                    )}
                                                </div>
                                                {c.unreadCount > 0 && (
                                                    <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs rounded-full bg-red-500 text-white">
                                                        {c.unreadCount}
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="md:col-span-2 flex flex-col items-center justify-center min-h-[220px]">
                                <MessageCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                                <p className="text-gray-600 dark:text-gray-400">Select a conversation to open the full chat view</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <div className="rounded-3xl border border-[#dfe3e8] dark:border-white/10 bg-white dark:bg-slate-900/70 p-5 sm:p-6 shadow-[0_10px_28px_rgba(15,23,42,0.08)]">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                                <Bell className="w-6 h-6 text-purple-500" />
                                <span>Notifications</span>
                            </h2>
                            {notifications.length > 0 && (
                                <button
                                    onClick={handleMarkAllNotificationsRead}
                                    className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700"
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>

                        {notificationsLoading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mx-auto"></div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400">You have no notifications yet.</p>
                        ) : (
                            <div className="space-y-3 max-h-80 overflow-y-auto">
                                {notifications.map((n) => (
                                    <div
                                        key={n._id}
                                        className={`flex items-start justify-between px-3 py-2 rounded-lg border ${n.isRead
                                            ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                            : 'bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-700'
                                            }`}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <div className="mt-1">
                                                {n.type === 'message' && <MessageCircle className="w-5 h-5 text-purple-600" />}
                                                {n.type === 'profile_view' && <User className="w-5 h-5 text-purple-600" />}
                                                {n.type === 'match' && <Heart className="w-5 h-5 text-purple-600" />}
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-800 dark:text-white">{n.message}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'search' && (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-900/70 backdrop-blur-md rounded-3xl shadow-[0_10px_28px_rgba(15,23,42,0.08)] border border-[#dfe3e8] dark:border-white/10 p-5 sm:p-6 transition-all duration-300">
                            {!isProfileComplete ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-750 dark:text-gray-300 mb-3">Complete your profile to use advanced search.</p>
                                    {missingFields().length > 0 && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">Missing fields: {missingFields().join(', ')}</p>
                                    )}
                                    <Link to="/profile" className="inline-flex btn-primary">Complete Profile</Link>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between mb-5">
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            <Search className="w-5.5 h-5.5 text-purple-600 flex-shrink-0" />
                                            <span>Search Profiles</span>
                                        </h2>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {/* Gender */}
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Gender</label>
                                            <CustomSelect
                                                value={searchFilters.gender}
                                                onChange={(val) => setSearchFilters({ ...searchFilters, gender: val })}
                                                options={[
                                                    { value: '', label: 'All' },
                                                    { value: 'male', label: 'Male' },
                                                    { value: 'female', label: 'Female' },
                                                    { value: 'other', label: 'Other' }
                                                ]}
                                            />
                                        </div>

                                        {/* Age Range Grid */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Min Age</label>
                                                <input
                                                    type="number"
                                                    value={searchFilters.minAge}
                                                    onChange={(e) => setSearchFilters({ ...searchFilters, minAge: e.target.value })}
                                                    className="form-input"
                                                    placeholder="18"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Max Age</label>
                                                <input
                                                    type="number"
                                                    value={searchFilters.maxAge}
                                                    onChange={(e) => setSearchFilters({ ...searchFilters, maxAge: e.target.value })}
                                                    className="form-input"
                                                    placeholder="50"
                                                />
                                            </div>
                                        </div>

                                        {/* Location */}
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Location</label>
                                            <input
                                                type="text"
                                                value={searchFilters.location}
                                                onChange={(e) => setSearchFilters({ ...searchFilters, location: e.target.value })}
                                                className="form-input"
                                                placeholder="Enter location"
                                            />
                                        </div>

                                        {/* Interests */}
                                        <div className="sm:col-span-2 md:col-span-1">
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Interests</label>
                                            <input
                                                type="text"
                                                value={searchFilters.interests}
                                                onChange={(e) => setSearchFilters({ ...searchFilters, interests: e.target.value })}
                                                className="form-input"
                                                placeholder="e.g. music, travel"
                                            />
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-750">
                                        <button
                                            onClick={handleSearch}
                                            className="flex-1 btn-primary"
                                        >
                                            <Search className="w-4 h-4" />
                                            <span>Search</span>
                                        </button>
                                        <button
                                            onClick={handleResetSearch}
                                            className="flex-1 btn-secondary"
                                        >
                                            <RefreshCw className="w-4 h-4 text-gray-500" />
                                            <span>Reset</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Search Results */}
                        <div className="bg-white dark:bg-slate-900/70 backdrop-blur-md rounded-3xl shadow-[0_10px_28px_rgba(15,23,42,0.08)] border border-[#dfe3e8] dark:border-white/10 p-5">
                            {!isProfileComplete ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-600 dark:text-gray-300">Complete your profile to see search results.</p>
                                </div>
                            ) : searchLoading ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-500 mx-auto"></div>
                                </div>
                            ) : searchResults.length > 0 ? (
                                <>
                                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-4 flex items-center gap-1.5">
                                        <span>🔍</span>
                                        <span>{searchResults.length} profiles found</span>
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {searchResults.map((u) => (
                                            <ProfileCard
                                                key={u._id}
                                                user={u}
                                                onLike={() => handleQuickLike(u._id)}
                                                onMessage={() => handleCardMessage(u._id)}
                                                onShare={() => { }}
                                                isOwnProfile={false}
                                            />
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-gray-500 dark:text-gray-400">Use the filters above and click Search to find matching profiles.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'referrals' && (
                    <div className="glass-card p-6">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Share2 className="w-6 h-6 text-purple-500" />
                            Referrals
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">Share your referral code and earn rewards!</p>
                        
                        {referralLoading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-500 mx-auto"></div>
                                <p className="text-gray-600 dark:text-gray-300 mt-4">Loading referral data...</p>
                            </div>
                        ) : (
                            <>
                                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 text-center mb-6">
                                    <p className="text-sm text-purple-700 dark:text-purple-300 mb-2">Your Referral Code</p>
                                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-4">{referralCode?.code || 'N/A'}</p>
                                    <div className="flex items-center justify-center gap-2 text-sm text-purple-700 dark:text-purple-300">
                                        <span>Referral Link:</span>
                                        <code className="bg-white dark:bg-slate-800 px-2 py-1 rounded">
                                            {typeof window !== 'undefined' ? `${window.location.origin}/register?ref=${referralCode?.code || ''}` : ''}
                                        </code>
                                    </div>
                                </div>

                                {referralStats && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
                                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{referralStats.totalReferrals}</p>
                                            <p className="text-xs text-blue-700 dark:text-blue-300">Total Referrals</p>
                                        </div>
                                        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{referralStats.successfulReferrals}</p>
                                            <p className="text-xs text-green-700 dark:text-green-300">Successful</p>
                                        </div>
                                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 text-center">
                                            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{referralStats.pendingReferrals}</p>
                                            <p className="text-xs text-yellow-700 dark:text-yellow-300">Pending</p>
                                        </div>
                                        <div className="bg-pink-50 dark:bg-pink-900/20 rounded-xl p-4 text-center">
                                            <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">{referralStats.totalCreditsEarned}</p>
                                            <p className="text-xs text-pink-700 dark:text-pink-300">Credits Earned</p>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How it works</h3>
                                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                                        <li className="flex items-start gap-2">
                                            <span className="text-purple-500">1.</span>
                                            <span>Share your unique referral code with friends</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-purple-500">2.</span>
                                            <span>Friends register using your code</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-purple-500">3.</span>
                                            <span>When they complete their profile, you earn rewards!</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-purple-500">4.</span>
                                            <span>Earn 50 credits for each successful referral</span>
                                        </li>
                                    </ul>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'stories' && (
                    <div className="glass-card p-6">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Heart className="w-6 h-6 text-pink-500" />
                            Success Stories
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">Read inspiring stories from couples who found love on Kapu LK.</p>
                        <div className="text-center py-8">
                            <Heart className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">Coming soon! Share your success story.</p>
                        </div>
                    </div>
                )}

                {activeTab === 'blog' && (
                    <div className="glass-card p-6">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <FileText className="w-6 h-6 text-blue-500" />
                            Blog
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">Read articles about dating, relationships, and more.</p>
                        <div className="text-center py-8">
                            <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">Coming soon! Check back for articles.</p>
                        </div>
                    </div>
                )}

                {activeTab === 'events' && (
                    <div className="glass-card p-6">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Calendar className="w-6 h-6 text-green-500" />
                            Events
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">Join events and meet other members in person.</p>
                        <div className="text-center py-8">
                            <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">Coming soon! Check back for upcoming events.</p>
                        </div>
                    </div>
                )}

                {activeTab === 'gifts' && (
                    <div className="glass-card p-6">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Gift className="w-6 h-6 text-pink-500" />
                            Gift Shop
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">Send gifts to show your appreciation!</p>
                        {giftsLoading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-500 mx-auto"></div>
                                <p className="text-gray-600 dark:text-gray-300 mt-4">Loading gifts...</p>
                            </div>
                        ) : gifts.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {gifts.map((gift) => (
                                    <div key={gift._id} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700 text-center">
                                        <div className="text-4xl mb-2">{gift.emoji}</div>
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{gift.name}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {gift.price > 0 ? `${gift.price} pts` : 'Free'}
                                        </div>
                                        {gift.isRecommended && (
                                            <div className="flex items-center justify-center gap-1 mt-2 text-xs text-pink-600 dark:text-pink-400">
                                                <Heart className="w-3 h-3" />
                                                Popular
                                            </div>
                                        )}
                                        {gift.isPremium && (
                                            <div className="flex items-center justify-center gap-1 mt-1 text-xs text-yellow-600 dark:text-yellow-400">
                                                <Crown className="w-3 h-3" />
                                                Premium
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Gift className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">No gifts available right now.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {showPremiumModal && <PremiumModal />}
            {showPremiumPopup && (
                <PremiumPopup 
                    onClose={() => setShowPremiumPopup(false)} 
                    onUpgrade={() => navigate('/premium')} 
                />
            )}

            {/* Top Up Modal */}
            {showTopUpModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Top Up Wallet</h3>
                            <button
                                onClick={() => setShowTopUpModal(false)}
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition"
                            >
                                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Add funds to your wallet to send gifts and unlock premium features. Upload your bank payment slip for approval.
                        </p>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Bank</label>
                                <select
                                  value={selectedBank}
                                  onChange={(e) => setSelectedBank(e.target.value)}
                                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg"
                                >
                                  <option value="HNB">Hatton National Bank (HNB)</option>
                                  <option value="Sampath">Sampath Bank</option>
                                  <option value="BOC">Bank of Ceylon (BOC)</option>
                                  <option value="RDB">Regional Development Bank (RDB)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount (LKR)</label>
                                <input
                                    type="number"
                                    min="100"
                                    step="100"
                                    value={topUpAmount}
                                    onChange={(e) => setTopUpAmount(e.target.value)}
                                    placeholder="Enter amount"
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload Payment Slip</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setPaymentSlip(e.target.files[0])}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg"
                                />
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Crown className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    <span className="font-semibold text-blue-900 dark:text-blue-100">Bank Details</span>
                                </div>
                                <div className="text-sm text-blue-700 dark:text-blue-300 space-y-3">
                                    <div className="bg-white dark:bg-slate-700 rounded-lg p-3">
                                        <p className="font-semibold text-slate-900 dark:text-white">Hatton National Bank (HNB)</p>
                                        <p className="text-xs mt-1">Account: 018021102658</p>
                                        <p className="text-xs">Branch: Kandy</p>
                                        <p className="text-xs">Name: S. Kumarasinghe</p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-700 rounded-lg p-3">
                                        <p className="font-semibold text-slate-900 dark:text-white">Sampath Bank</p>
                                        <p className="text-xs mt-1">Account: Contact for details</p>
                                        <p className="text-xs">Branch: Wattegama</p>
                                        <p className="text-xs">Name: S. Kumarasinghe</p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-700 rounded-lg p-3">
                                        <p className="font-semibold text-slate-900 dark:text-white">Bank of Ceylon (BOC)</p>
                                        <p className="text-xs mt-1">Account: 00069058</p>
                                        <p className="text-xs">Branch: Kandy</p>
                                        <p className="text-xs">Name: R. Ratnayake</p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-700 rounded-lg p-3">
                                        <p className="font-semibold text-slate-900 dark:text-white">Regional Development Bank (RDB)</p>
                                        <p className="text-xs mt-1">Account: 409010110698</p>
                                        <p className="text-xs">Branch: Kandy</p>
                                        <p className="text-xs">Name: T. Dharmapriya</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handlePaymentSubmit}
                            disabled={submittingPayment}
                            className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submittingPayment ? 'Submitting...' : 'Submit Payment Request'}
                        </button>

                        <button
                            onClick={() => setShowTopUpModal(false)}
                            className="w-full py-3 mt-3 border border-gray-300 dark:border-slate-600 rounded-xl font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
