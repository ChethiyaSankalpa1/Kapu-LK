import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { userAPI, messageAPI, notificationAPI, premiumAPI } from '../../services/api';
import { toast } from 'react-toastify';
import {
    User, CheckCircle, Clock, MessageCircle, Bell, Search, Filter, Heart, Send,
    Crown, Zap, X, Lock
} from 'lucide-react';
import ProfileCard from '../../components/ui/ProfileCard';

const Dashboard = () => {
    const { t } = useTranslation();
    const { user, premiumStatus, refreshPremiumStatus } = useAuth();
    const navigate = useNavigate();
    const [showPremiumModal, setShowPremiumModal] = useState(false);

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
        (user?.bio || '').trim().length > 0
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
        return m;
    };

    const [activeTab, setActiveTab] = useState('overview');

    const [featuredUsers, setFeaturedUsers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [overviewLoading, setOverviewLoading] = useState(true);
    const [showAllProfiles, setShowAllProfiles] = useState(false);

    const [matches, setMatches] = useState([]);
    const [matchesLoading, setMatchesLoading] = useState(false);

    const [conversations, setConversations] = useState([]);
    const [selectedConversationUser, setSelectedConversationUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [newMessage, setNewMessage] = useState('');
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

    const fetchOverviewUsers = useCallback(async () => {
        try {
            const response = await userAPI.getAllUsers();
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

            const filteredUsers = (response.data || [])
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
                }))
                .sort((a, b) => b.registeredDate - a.registeredDate);

            // Set featured users (most recent 6)
            setFeaturedUsers(filteredUsers.slice(0, 6));

            // Set all users for the view more section
            setAllUsers(filteredUsers);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error(t('dashboard.fetchUsersFailed', { defaultValue: 'Failed to fetch users' }));
        } finally {
            setOverviewLoading(false);
        }
    }, [user?._id]);

    const fetchMatches = useCallback(async () => {
        setMatchesLoading(true);
        try {
            const response = await userAPI.getMatches();
            setMatches(response.data);
        } catch (error) {
            toast.error(t('dashboard.loadMatchesFailed', { defaultValue: 'Failed to load matches' }));
        } finally {
            setMatchesLoading(false);
        }
    }, []);

    const fetchMessagesWithUser = useCallback(async (otherUserId) => {
        setMessagesLoading(true);
        try {
            const response = await messageAPI.getConversationWithUser(otherUserId);
            setMessages(response.data || []);
            await fetchConversations();
        } catch (error) {
            toast.error(t('dashboard.loadMessagesFailed', { defaultValue: 'Failed to load messages' }));
        } finally {
            setMessagesLoading(false);
        }
    }, [fetchConversations]);

    const handleOpenConversation = useCallback((otherUserId) => {
        const convo = conversations.find((c) => c.user && c.user._id === otherUserId);
        if (convo) {
            setSelectedConversationUser(convo.user);
        } else if (matches.length > 0) {
            const fromMatches = matches.find((m) => m._id === otherUserId);
            if (fromMatches) {
                setSelectedConversationUser(fromMatches);
            }
        }
        fetchMessagesWithUser(otherUserId);
    }, [conversations, matches, fetchMessagesWithUser]);

    useEffect(() => {
        if (isProfileComplete) {
            fetchOverviewUsers();
        } else {
            setOverviewLoading(false);
            setFeaturedUsers([]);
            setAllUsers([]);
        }
        fetchNotifications();
        fetchConversations();

        // periodic refresh for notifications every 20s
        const notifInterval = setInterval(() => {
            fetchNotifications();
        }, 20000);
        return () => clearInterval(notifInterval);
    }, [isProfileComplete, fetchOverviewUsers, fetchNotifications, fetchConversations]);

    useEffect(() => {
        if (activeTab === 'matches' && matches.length === 0) {
            fetchMatches();
        }
    }, [activeTab, matches.length, fetchMatches]);

    useEffect(() => {
        if (activeTab === 'messages' && pendingConversationUserId) {
            handleOpenConversation(pendingConversationUserId);
            setPendingConversationUserId(null);
        }
    }, [activeTab, pendingConversationUserId, handleOpenConversation]);

    const handleCardMessage = (otherUserId) => {
        setActiveTab('messages');
        setPendingConversationUserId(otherUserId);
    };

    const handleSendMessage = async () => {
        if (!selectedConversationUser || !newMessage.trim()) return;

        // Check limit
        if (
            selectedConversationUser.role !== 'admin' &&
            !premiumStatus?.isPremium &&
            (premiumStatus?.messagesSent || 0) >= FREE_LIMIT
        ) {
            setShowPremiumModal(true);
            return;
        }

        try {
            const payload = {
                to: selectedConversationUser._id,
                content: newMessage.trim(),
                type: 'text',
            };
            const response = await messageAPI.sendMessage(payload);
            setMessages((prev) => [...prev, response.data]);
            setNewMessage('');
            await fetchConversations();
            await refreshPremiumStatus();
        } catch (error) {
            if (error.response?.status === 403) {
                setShowPremiumModal(true);
            } else {
                toast.error(error.response?.data?.message || t('dashboard.sendMessageFailed', { defaultValue: 'Failed to send message' }));
            }
        }
    };

    const handleQuickLike = async (targetUserId) => {
        try {
            await messageAPI.sendMessage({
                to: targetUserId,
                content: 'sent you a like on Kapu LK',
                type: 'like',
            });
            toast.success(t('dashboard.likeSent', { defaultValue: 'Like sent' }));
            await fetchConversations();
            await refreshPremiumStatus();
        } catch (error) {
            if (error.response?.status === 403) {
                setShowPremiumModal(true);
            } else {
                toast.error(error.response?.data?.message || t('dashboard.sendLikeFailed', { defaultValue: 'Failed to send like' }));
            }
        }
    };

    const handleMarkAllNotificationsRead = async () => {
        try {
            await notificationAPI.markAllRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadNotificationCount(0);
            toast.success(t('dashboard.notificationsRead', { defaultValue: 'All notifications marked as read' }));
        } catch (error) {
            toast.error(t('dashboard.notificationsUpdateFailed', { defaultValue: 'Failed to update notifications' }));
        }
    };

    const handleSearch = async () => {
        setSearchLoading(true);
        try {
            const response = await userAPI.searchUsers(searchFilters);
            setSearchResults(response.data || []);
            toast.success(t('dashboard.profilesFound', { defaultValue: 'Found {{count}} profiles', count: response.data.length }));
        } catch (error) {
            toast.error(t('dashboard.searchFailed', { defaultValue: 'Search failed' }));
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
        <div className="min-h-screen">
            {/* Hero / Welcome banner */}
            <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 text-white">
                <div className="container mx-auto px-4 py-6 sm:py-10 md:py-16 flex flex-col md:flex-row md:items-center md:gap-8">
                    <div className="flex items-center mb-4 sm:mb-6 md:mb-0 space-x-3 sm:space-x-4 min-w-0">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white/40 shrink-0">
                            {user?.profileImageUrl ? (
                                <img
                                    src={user.profileImageUrl}
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <User className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs sm:text-sm uppercase tracking-wide text-white/80">{t('dashboard.title', { defaultValue: 'Kapu LK dashboard' })}</p>
                            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold truncate">
                                {t('dashboard.welcomeBack')}, {user?.name || t('common.member', { defaultValue: 'Member' })}!
                            </h1>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                                {user?.role === 'admin' ? (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/10 border border-white/30 text-xs font-semibold">
                                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                        {t('admin.title')}
                                    </span>
                                ) : user?.isApproved ? (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-500/20 border border-green-300 text-green-100 text-xs font-semibold">
                                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                        {t('dashboard.profileApproved', { defaultValue: 'Approved' })}
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-yellow-500/20 border border-yellow-300 text-yellow-100 text-xs font-semibold">
                                        <Clock className="w-3.5 h-3.5 mr-1.5" />
                                        {t('dashboard.pendingApproval', { defaultValue: 'Pending' })}
                                    </span>
                                )}
                                {premiumStatus?.isPremium && (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-yellow-400/30 border border-yellow-300 text-yellow-100 text-xs font-semibold">
                                        <Crown className="w-3.5 h-3.5 mr-1.5" />
                                        {t('profile.premiumMember')}
                                    </span>
                                )}
                            </div>
                            <div className="mt-2.5 flex flex-wrap gap-2 text-[10px] sm:text-xs">
                                <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20">
                                    <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                                    {t('dashboard.unreadMessages', { defaultValue: '{{count}} unread', count: unreadMessagesCount })}
                                </span>
                                <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20">
                                    <Bell className="w-3.5 h-3.5 mr-1.5" />
                                    {t('dashboard.unreadNotifications', { defaultValue: '{{count}} alerts', count: unreadNotificationCount })}
                                </span>
                                {!premiumStatus?.isPremium && (
                                    <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full bg-orange-500/20 border border-orange-300 text-orange-100">
                                        <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                                        {t('dashboard.messagesLeft', { defaultValue: '{{count}} left', count: messagesLeft })}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="md:ml-auto grid grid-cols-2 sm:flex sm:flex-row gap-2.5 w-full md:w-auto mt-4 md:mt-0">
                        <Link
                            to="/users"
                            className="col-span-1 inline-flex justify-center items-center gap-1.5 px-4 sm:px-6 py-3 rounded-xl bg-white text-purple-600 font-bold shadow-md hover:bg-gray-50 active:scale-95 transition-all text-sm w-full md:w-auto min-h-[44px]"
                        >
                            Browse
                        </Link>
                        <Link
                            to="/profile"
                            className="col-span-1 inline-flex justify-center items-center gap-1.5 px-4 sm:px-6 py-3 rounded-xl border-2 border-white/80 text-white font-bold hover:bg-white/15 active:scale-95 transition-all text-sm w-full md:w-auto min-h-[44px]"
                        >
                            {t('profile.editProfile')}
                        </Link>
                        {!premiumStatus?.isPremium && !premiumStatus?.premiumRequested && (
                            <Link
                                to="/premium"
                                className="col-span-2 sm:col-span-1 inline-flex justify-center items-center gap-2 px-4 sm:px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold shadow-lg hover:shadow-xl hover:from-amber-500 hover:to-orange-600 active:scale-95 transition-all text-sm w-full md:w-auto min-h-[44px]"
                            >
                                <Crown className="w-4 h-4" />
                                {t('dashboard.goPremium')}
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-3 sm:px-4 pb-8 sm:pb-12 -mt-2 sm:-mt-4 md:-mt-8 space-y-4 sm:space-y-6">
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/40 dark:border-gray-700/50 shadow-lg rounded-2xl p-2 mobile-tab-list w-full">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-3.5 py-2.5 rounded-full text-xs sm:text-sm font-bold flex items-center space-x-1.5 whitespace-nowrap transition-all duration-150 ${activeTab === 'overview'
                            ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md'
                            : 'bg-gray-100/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-200 hover:bg-gray-200/80 dark:hover:bg-gray-700'
                            }`}
                    >
                        <span>{t('dashboard.overview')}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('matches')}
                        className={`px-3.5 py-2.5 rounded-full text-xs sm:text-sm font-bold flex items-center space-x-1.5 whitespace-nowrap transition-all duration-150 ${activeTab === 'matches'
                            ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md'
                            : 'bg-gray-100/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-200 hover:bg-gray-200/80 dark:hover:bg-gray-700'
                            }`}
                    >
                        <Heart className="w-3.5 h-3.5" />
                        <span>{t('dashboard.matches')}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('messages')}
                        className={`px-3.5 py-2.5 rounded-full text-xs sm:text-sm font-bold flex items-center space-x-1.5 whitespace-nowrap transition-all duration-150 ${activeTab === 'messages'
                            ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md'
                            : 'bg-gray-100/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-200 hover:bg-gray-200/80 dark:hover:bg-gray-700'
                            }`}
                    >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{t('dashboard.messages')}</span>
                        {unreadMessagesCount > 0 && (
                            <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-[10px] rounded-full bg-red-500 text-white font-bold">
                                {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={`px-3.5 py-2.5 rounded-full text-xs sm:text-sm font-bold flex items-center space-x-1.5 whitespace-nowrap transition-all duration-150 ${activeTab === 'notifications'
                            ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md'
                            : 'bg-gray-100/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-200 hover:bg-gray-200/80 dark:hover:bg-gray-700'
                            }`}
                    >
                        <Bell className="w-3.5 h-3.5" />
                        <span>{t('dashboard.notifications')}</span>
                        {unreadNotificationCount > 0 && (
                            <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-[10px] rounded-full bg-red-500 text-white font-bold">
                                {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('search')}
                        className={`px-3.5 py-2.5 rounded-full text-xs sm:text-sm font-bold flex items-center space-x-1.5 whitespace-nowrap transition-all duration-150 ${activeTab === 'search'
                            ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md'
                            : 'bg-gray-100/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-200 hover:bg-gray-200/80 dark:hover:bg-gray-700'
                            }`}
                    >
                        <Search className="w-3.5 h-3.5" />
                        <span>{t('common.search')}</span>
                    </button>
                </div>

                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {!isProfileComplete && (
                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="glass-card">
                                    <h2 className="text-sm font-semibold text-gray-500 mb-2">Profile status</h2>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                        {user?.role === 'admin'
                                            ? 'Administrator account'
                                            : user?.isApproved
                                                ? 'Approved member'
                                                : 'Awaiting approval'}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        Keep your details up to date to get better matches.
                                    </p>
                                </div>

                                <div className="glass-card">
                                    <h2 className="text-sm font-semibold text-gray-500 mb-2">Next step</h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        {user?.isApproved || user?.role === 'admin'
                                            ? 'Browse profiles, view suggested matches and start conversations.'
                                            : 'Our admin team will review your profile shortly. You can still complete your details.'}
                                    </p>
                                </div>

                                <div className="glass-card">
                                    <h2 className="text-sm font-semibold text-gray-500 mb-2">Quick tips</h2>
                                    <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 list-disc list-inside">
                                        <li>Add a clear profile photo.</li>
                                        <li>Write a short, honest bio.</li>
                                        <li>Mention your interests for better compatibility.</li>
                                    </ul>
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
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recently Joined</h2>
                                <button
                                    onClick={() => setShowAllProfiles(!showAllProfiles)}
                                    className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center space-x-1"
                                >
                                    <span>{showAllProfiles ? 'Show Less' : 'View All Profiles'}</span>
                                </button>
                            </div>

                            {overviewLoading ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mx-auto"></div>
                                </div>
                            ) : featuredUsers.length > 0 ? (
                                <div className="space-y-8">
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {featuredUsers.map((u) => (
                                            <ProfileCard
                                                key={u._id}
                                                user={u}
                                                onView={() => navigate(`/users/${u._id}`)}
                                                isOwnProfile={u._id === user._id}
                                            />
                                        ))}
                                    </div>

                                    {showAllProfiles && allUsers.length > 6 && (
                                        <div className="mt-8">
                                            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">All Profiles</h3>
                                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {allUsers.slice(6).map((u) => (
                                                    <ProfileCard
                                                        key={u._id}
                                                        user={u}
                                                        onView={() => navigate(`/users/${u._id}`)}
                                                        isOwnProfile={u._id === user._id}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-gray-600 dark:text-gray-300">No profiles available yet. Check back soon!</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'matches' && (
                    <div className="glass-card">
                        {!isProfileComplete ? (
                            <div className="text-center py-8">
                                <p className="text-gray-700 dark:text-gray-300 mb-2">Complete your profile to view suggested matches.</p>
                                {missingFields().length > 0 && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Missing: {missingFields().join(', ')}</p>
                                )}
                                <Link to="/profile" className="inline-block btn-primary">Complete Profile</Link>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                                        <Heart className="w-6 h-6 text-pink-500" />
                                        <span>Suggested Matches</span>
                                    </h2>
                                </div>

                                {matchesLoading ? (
                                    <div className="text-center py-12">
                                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mx-auto"></div>
                                    </div>
                                ) : matches.length > 0 ? (
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {matches.map((m) => (
                                            <div key={m._id} className="relative">
                                                <ProfileCard
                                                    user={m}
                                                    onLike={() => handleQuickLike(m._id)}
                                                    onMessage={() => handleCardMessage(m._id)}
                                                    onShare={() => { }}
                                                    isOwnProfile={false}
                                                />
                                                <div className="absolute top-4 left-4 bg-white/90 dark:bg-gray-800/90 rounded-full px-3 py-1 text-xs font-semibold text-purple-700 dark:text-purple-300 shadow">
                                                    Compatibility: {m.compatibilityScore || 0}%
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <p className="text-gray-600 dark:text-gray-300">No matches found yet. Complete your profile and add interests for better suggestions.</p>
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
                    <div className="glass-card">
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
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-5 sm:p-6 transition-all duration-300">
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
                                            <select
                                                value={searchFilters.gender}
                                                onChange={(e) => setSearchFilters({ ...searchFilters, gender: e.target.value })}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm min-h-[44px]"
                                            >
                                                <option value="">All</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>

                                        {/* Age Range Grid */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Min Age</label>
                                                <input
                                                    type="number"
                                                    value={searchFilters.minAge}
                                                    onChange={(e) => setSearchFilters({ ...searchFilters, minAge: e.target.value })}
                                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200/70 dark:border-gray-700 bg-white dark:bg-gray-850 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm min-h-[44px]"
                                                    placeholder="18"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Max Age</label>
                                                <input
                                                    type="number"
                                                    value={searchFilters.maxAge}
                                                    onChange={(e) => setSearchFilters({ ...searchFilters, maxAge: e.target.value })}
                                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200/70 dark:border-gray-700 bg-white dark:bg-gray-850 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm min-h-[44px]"
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
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm min-h-[44px]"
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
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm min-h-[44px]"
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
                                            <RefreshCw className="w-4 h-4 text-gray-550" />
                                            <span>Reset</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Search Results */}
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-5">
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
            </div>

            {showPremiumModal && <PremiumModal />}
        </div>
    );
};

export default Dashboard;
