import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { notificationAPI } from '../../services/api';
import { toast } from 'react-toastify';
import moment from 'moment';
import {
    Activity, RefreshCw, Eye, Heart, MessageCircle,
    Gift, Sparkles, Trophy, ChevronRight, Crown
} from 'lucide-react';
import PremiumBadge from '../../components/ui/PremiumBadge';
import ProfileAvatar from '../../components/ui/ProfileAvatar';
import BackButton from '../../components/common/BackButton';

const ActivityPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, views, matches, messages, gifts, system

    const fetchActivities = useCallback(async () => {
        setLoading(true);
        try {
            const res = await notificationAPI.getNotifications();
            if (res.data) {
                // notificationAPI.getNotifications might return res.data or res.data.notifications
                const list = Array.isArray(res.data) ? res.data : (res.data.notifications || res.data.data || []);
                setNotifications(list);
            }
        } catch (error) {
            console.error('Error fetching activities:', error);
            toast.error(t('activity.fetchFailed', { defaultValue: 'Failed to load activity log' }));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchActivities();
    }, [fetchActivities]);

    const handleMarkAllAsRead = async () => {
        try {
            if (notificationAPI.markAllAsRead) {
                await notificationAPI.markAllAsRead();
            } else if (notificationAPI.markAsRead) {
                await notificationAPI.markAsRead('all');
            }
            toast.success(t('activity.markedAllRead', { defaultValue: 'All activities marked as read' }));
            setNotifications(prev => prev.map(n => ({ ...n, read: true, isRead: true })));
        } catch (error) {
            // Fallback optimistic update
            setNotifications(prev => prev.map(n => ({ ...n, read: true, isRead: true })));
        }
    };

    const getActivityIcon = (type) => {
        switch (type) {
            case 'profile_view':
            case 'view':
                return <Eye className="w-4 h-4 text-purple-600" />;
            case 'match':
            case 'like':
            case 'interest':
                return <Heart className="w-4 h-4 text-pink-600 fill-pink-600" />;
            case 'message':
            case 'chat':
                return <MessageCircle className="w-4 h-4 text-blue-600" />;
            case 'gift':
                return <Gift className="w-4 h-4 text-amber-600" />;
            case 'achievement':
                return <Trophy className="w-4 h-4 text-yellow-600" />;
            case 'premium_activated':
            case 'wallet_topup':
                return <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />;
            default:
                return <Sparkles className="w-4 h-4 text-purple-600" />;
        }
    };

    const getActivityBadgeBg = (type) => {
        switch (type) {
            case 'profile_view':
            case 'view':
                return 'bg-purple-100 dark:bg-purple-950/60 text-purple-600';
            case 'match':
            case 'like':
            case 'interest':
                return 'bg-pink-100 dark:bg-pink-950/60 text-pink-600';
            case 'message':
            case 'chat':
                return 'bg-blue-100 dark:bg-blue-950/60 text-blue-600';
            case 'gift':
                return 'bg-amber-100 dark:bg-amber-950/60 text-amber-600';
            case 'achievement':
                return 'bg-yellow-100 dark:bg-yellow-950/60 text-yellow-600';
            default:
                return 'bg-purple-100 dark:bg-purple-950/60 text-purple-600';
        }
    };

    const handleItemClick = (item) => {
        if (item.relatedUser?._id || item.relatedUser) {
            const uid = item.relatedUser?._id || item.relatedUser;
            if (item.type === 'message' || item.type === 'chat') {
                navigate(`/conversation/${uid}`);
            } else {
                navigate(`/users/${uid}`);
            }
        } else if (item.link) {
            navigate(item.link);
        } else if (item.type === 'gift') {
            navigate('/gifts');
        } else if (item.type === 'premium_activated') {
            navigate('/premium');
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'all') return true;
        if (filter === 'views') return n.type === 'profile_view' || n.type === 'view';
        if (filter === 'matches') return n.type === 'match' || n.type === 'like' || n.type === 'interest';
        if (filter === 'messages') return n.type === 'message' || n.type === 'chat';
        if (filter === 'gifts') return n.type === 'gift';
        if (filter === 'system') return !['profile_view', 'view', 'match', 'like', 'interest', 'message', 'chat', 'gift'].includes(n.type);
        return true;
    });

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-24 md:pb-12 transition-colors duration-300">
            {/* Top Bar / Header */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <BackButton variant="soft" />
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-sm">
                                <Activity className="w-4 h-4" />
                            </div>
                            <div>
                                <h1 className="text-base sm:text-lg font-bold">Recent Activity</h1>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                    {notifications.length} total event{notifications.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {notifications.length > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 px-3 py-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/40 transition"
                            >
                                Mark all read
                            </button>
                        )}
                        <button
                            onClick={fetchActivities}
                            disabled={loading}
                            className="p-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition disabled:opacity-50"
                            title="Refresh"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1.5 overflow-x-auto hide-scrollbar py-2 border-t border-gray-100 dark:border-gray-800/60">
                    {[
                        { id: 'all', label: 'All', icon: Activity },
                        { id: 'views', label: 'Views', icon: Eye },
                        { id: 'matches', label: 'Matches & Likes', icon: Heart },
                        { id: 'messages', label: 'Messages', icon: MessageCircle },
                        { id: 'gifts', label: 'Gifts', icon: Gift },
                        { id: 'system', label: 'System & Perks', icon: Sparkles },
                    ].map(tab => {
                        const Icon = tab.icon;
                        const active = filter === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setFilter(tab.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                                    active
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm'
                                        : 'bg-gray-100 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-150 dark:border-gray-800 flex items-center gap-3.5 animate-pulse">
                                <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-gray-800 shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                                    <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-10 border border-gray-150 dark:border-gray-800 text-center max-w-md mx-auto my-8 shadow-sm">
                        <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 mx-auto flex items-center justify-center mb-3">
                            <Activity className="w-7 h-7" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">No activity yet</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-5">
                            {filter === 'all'
                                ? "When people view your profile, send you likes, or message you, they'll show up here!"
                                : `No ${filter} activities found. Try switching to 'All' or browse profiles to get discovered.`}
                        </p>
                        <Link
                            to="/users"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-xl shadow hover:shadow-md transition"
                        >
                            <Heart className="w-4 h-4" />
                            <span>Browse Matches</span>
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-150 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800/80 shadow-sm overflow-hidden">
                        {filteredNotifications.map((n) => {
                            const isRead = n.read || n.isRead;
                            const relUser = n.relatedUser && typeof n.relatedUser === 'object' ? n.relatedUser : null;
                            const userName = relUser?.name || 'A user';

                            return (
                                <div
                                    key={n._id}
                                    onClick={() => handleItemClick(n)}
                                    className={`p-4 flex items-center gap-3.5 transition cursor-pointer hover:bg-purple-50/40 dark:hover:bg-purple-950/20 ${
                                        !isRead ? 'bg-purple-50/20 dark:bg-purple-950/10' : ''
                                    }`}
                                >
                                    {/* Avatar / Icon */}
                                    <div className="relative shrink-0">
                                        <ProfileAvatar user={relUser || { name: userName }} className="w-11 h-11 rounded-full border border-purple-100 dark:border-purple-900/50 bg-gradient-to-br from-purple-500 to-pink-500 shadow-sm" avatarClassName="text-2xl" fallbackClassName="text-sm font-bold text-white bg-gradient-to-br from-purple-500 to-pink-500" />
                                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center shadow border-2 border-white dark:border-gray-900 ${getActivityBadgeBg(n.type)}`}>
                                            {getActivityIcon(n.type)}
                                        </div>
                                    </div>

                                    {/* Text info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className={`text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 ${!isRead ? 'font-bold' : ''}`}>
                                                {n.message || `${userName} interacted with your profile`}
                                            </p>
                                            {relUser?.isPremium && (
                                                <PremiumBadge plan={relUser.premiumPlan} size="xs" />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                                            <span>{n.createdAt ? moment(n.createdAt).fromNow() : 'Recently'}</span>
                                            {n.viewCount && n.viewCount > 1 && (
                                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300 font-bold text-[10px]">
                                                    {n.viewCount} times
                                                </span>
                                            )}
                                            {!isRead && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-pink-500 shrink-0" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Action button / arrow */}
                                    <div className="shrink-0 flex items-center gap-2">
                                        {relUser && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/users/${relUser._id || relUser}`);
                                                }}
                                                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/50 transition"
                                            >
                                                <span>View</span>
                                            </button>
                                        )}
                                        <ChevronRight className="w-4 h-4 text-gray-400" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityPage;
