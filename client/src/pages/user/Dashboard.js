import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userAPI, messageAPI, notificationAPI, achievementAPI, walletAPI } from '../../services/api';
import { toast } from 'react-toastify';
import {
    User, CheckCircle, MessageCircle, Search, Heart,
    Crown, Flame, Calendar, Eye, MapPin, ChevronRight, ChevronLeft,
    Settings, Users, Layers, Activity, Edit3, Sparkles,
    BookOpen, Gift, UserPlus, HelpCircle, Wallet, Trophy, FileText
} from 'lucide-react';
import PremiumPopup from '../../components/ui/PremiumPopup';
import PremiumBadge from '../../components/ui/PremiumBadge';
import ProfileAvatar from '../../components/ui/ProfileAvatar';
import ProfileCard from '../../components/ui/ProfileCard';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, premiumStatus } = useAuth();
    const suggestedRef = useRef(null);

    const [showPremiumPopup, setShowPremiumPopup] = useState(false);

    const [featuredUsers, setFeaturedUsers] = useState([]);
    const [matches, setMatches] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [visitorCount, setVisitorCount] = useState(0);

    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
    const [userStats, setUserStats] = useState(null);
    const [walletBalance, setWalletBalance] = useState(0);

    const scrollSuggested = (direction) => {
        if (suggestedRef.current) {
            const scrollAmount = direction === 'left' ? -300 : 300;
            suggestedRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    // Profile completeness calculation
    const profileCompletenessItems = [
        { key: 'photo', label: 'Profile photo', done: Boolean(user?.profileImageUrl || user?.profileAvatar) },
        { key: 'basic', label: 'Basic information', done: Boolean(user?.age && user?.gender && (user?.district || user?.location)) },
        { key: 'about', label: 'About you', done: Boolean(user?.bio && user.bio.trim().length > 0) },
        { key: 'interests', label: 'Interests', done: Boolean(user?.interests || user?.hobbies) },
        { key: 'lookingFor', label: 'Looking for', done: Boolean(user?.partnerPreferences?.minAge && user?.partnerPreferences?.maxAge) },
    ];
    const completedCount = profileCompletenessItems.filter(i => i.done).length;
    const completenessPercentage = Math.round((completedCount / profileCompletenessItems.length) * 100);

    const isVisitorsAllowed = user?.role === 'admin' || (user?.isPremium && (user?.premiumPlan === 'silver' || user?.premiumPlan === 'gold' || premiumStatus?.premiumPlan === 'silver' || premiumStatus?.premiumPlan === 'gold'));

    // Fetch dashboard data
    const fetchDashboardData = useCallback(async () => {
        try {
            const [
                convsRes,
                notifsRes,
                statsRes,
                usersRes,
                matchesRes,
                visitorsRes,
                walletRes
            ] = await Promise.allSettled([
                messageAPI.getConversations(),
                notificationAPI.getNotifications(),
                achievementAPI.getMyStats(),
                userAPI.getAllUsers({ limit: 12 }),
                userAPI.getMatches(),
                isVisitorsAllowed ? userAPI.getProfileVisitors() : Promise.resolve({ data: { count: 0, visitors: [] } }),
                walletAPI.getWallet()
            ]);

            if (convsRes.status === 'fulfilled') {
                const convs = convsRes.value.data || [];
                const unread = convs.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
                setUnreadMessagesCount(unread);
            }

            if (notifsRes.status === 'fulfilled') {
                setNotifications(notifsRes.value.data || []);
            }

            if (statsRes.status === 'fulfilled') {
                setUserStats(statsRes.value.data?.stats || null);
            }

            if (usersRes.status === 'fulfilled') {
                const rawUsers = usersRes.value.data?.data || usersRes.value.data || [];
                const filtered = rawUsers.filter(u => u._id !== user?._id && u.role !== 'admin');
                setFeaturedUsers(filtered);
            }

            if (matchesRes.status === 'fulfilled') {
                const mList = matchesRes.value.data?.data || matchesRes.value.data || [];
                setMatches(mList);
            }

            if (visitorsRes.status === 'fulfilled') {
                setVisitorCount(visitorsRes.value.data?.count || visitorsRes.value.data?.visitors?.length || 0);
            }

            if (walletRes.status === 'fulfilled') {
                const wData = walletRes.value.data;
                const bal = typeof wData?.balance === 'number' ? wData.balance : (wData?.wallet?.balance || 0);
                setWalletBalance(bal);
            }
        } catch (error) {
            console.error('Dashboard data load error:', error);
        }
    }, [user?._id, isVisitorsAllowed]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // Calculate aggregated metrics
    const profileViewsCount = notifications
        .filter(n => n.type === 'profile_view')
        .reduce((sum, n) => sum + (n.viewCount || 1), 0) || visitorCount || 0;

    const matchesCount = matches.length;
    const loginStreak = userStats?.loginStreak || 1;

    // Helper for sending likes
    const handleQuickLike = async (targetUserId) => {
        try {
            await messageAPI.sendMessage({
                to: targetUserId,
                content: 'sent you a like on LoveLK',
                type: 'like',
            });
            toast.success('Like sent successfully! ❤️');
            fetchDashboardData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send like');
        }
    };

    const firstName = user?.name ? user.name.split(' ')[0] : 'Member';
    const isPremium = user?.isPremium || premiumStatus?.isPremium;
    const planName = (user?.premiumPlan || premiumStatus?.premiumPlan || 'bronze').toLowerCase();
    const daysRemaining = premiumStatus?.daysRemaining || 30;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300 pb-28 md:pb-12">

            {/* ========================================================================= */}
            {/* MOBILE DASHBOARD VIEW (Visible on screens < 768px)                       */}
            {/* NOTE: Top header is handled globally by Navbar.js (NO duplicate header!)   */}
            {/* ========================================================================= */}
            <div className="md:hidden px-4 pt-3 space-y-4 max-w-lg mx-auto">

                {/* Mobile Welcome Card with Tasteful LoveLK Cover Header */}
                <div className="relative bg-white dark:bg-gray-900 rounded-3xl border border-gray-150 dark:border-gray-800 shadow-sm overflow-hidden">
                    {/* Cover Banner Area */}
                    <div className="relative h-20 w-full overflow-hidden bg-purple-950">
                        <video
                            autoPlay
                            muted
                            loop
                            playsInline
                            preload="metadata"
                            poster="/images/love-connect-belong.jpg"
                            className="w-full h-full object-cover object-center opacity-90"
                        >
                            <source src="/video/PixVerse_V6_Image_Text_540P_Create_a_beautiful.mp4" type="video/mp4" />
                            <img
                                src="/images/love-connect-belong.jpg"
                                alt="LoveLK Cover"
                                className="w-full h-full object-cover object-center"
                            />
                        </video>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-purple-950/20 to-transparent pointer-events-none" />
                        <div className="absolute top-2.5 right-3 px-2 py-0.5 bg-black/40 backdrop-blur-md rounded-full text-[9px] font-extrabold text-white/90 tracking-wider uppercase border border-white/20 z-10">
                            LoveLK
                        </div>
                    </div>

                    {/* Card Content overlapping cover */}
                    <div className="px-4 pb-3.5 pt-0">
                        <div className="flex items-end justify-between -mt-7 mb-2">
                            <div className="flex items-end gap-3">
                                <div className="relative shrink-0">
                                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white dark:border-gray-900 shadow-md p-0.5 bg-purple-50">
                                        <ProfileAvatar user={user} className="w-full h-full rounded-full" avatarClassName="text-3xl" fallbackClassName="font-bold text-white bg-gradient-to-tr from-purple-600 to-pink-500" />
                                    </div>
                                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-gray-900 rounded-full shadow-sm" />
                                </div>

                                <div className="pb-0.5">
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-tight">Welcome back,</p>
                                    <h2 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-1 leading-snug">
                                        {firstName}! <span className="inline-block animate-bounce">👋</span>
                                    </h2>
                                </div>
                            </div>

                            <Link to="/profile" className="p-2 -mr-1 text-gray-400 hover:text-purple-600 transition-colors">
                                <ChevronRight className="w-5 h-5" />
                            </Link>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/50 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 rounded-full">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                Profile approved
                            </span>
                            <Link to="/wallet" className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 dark:bg-teal-950/50 border border-teal-200/80 dark:border-teal-800/50 text-[10px] font-bold text-teal-700 dark:text-teal-300 rounded-full hover:bg-teal-100 transition-colors">
                                <Wallet className="w-3 h-3 text-teal-600" />
                                Rs. {walletBalance}
                            </Link>
                            {isPremium ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/50 text-[10px] font-bold text-amber-700 dark:text-amber-300 rounded-full capitalize">
                                    <Crown className="w-3 h-3 text-amber-500 fill-amber-500" />
                                    {planName} Member
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 dark:bg-purple-950/50 border border-purple-200/80 dark:border-purple-800/50 text-[10px] font-bold text-purple-700 dark:text-purple-300 rounded-full">
                                    Free Member
                                </span>
                            )}
                        </div>

                        <p className="text-[11px] italic text-gray-500 dark:text-gray-400 mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
                            "Good things happen when you keep going!"
                        </p>
                    </div>
                </div>

                {/* Mobile 4 Stat Boxes (2x2 on small, 4-col on wide mobile) */}
                <div className="grid grid-cols-4 gap-2">
                    <div className="bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 rounded-2xl p-2.5 text-center">
                        <Eye className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                        <span className="block text-base font-extrabold text-gray-900 dark:text-white">{profileViewsCount}</span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Profile Views</span>
                    </div>

                    <div className="bg-pink-50/70 dark:bg-pink-950/30 border border-pink-100 dark:border-pink-900/40 rounded-2xl p-2.5 text-center">
                        <Heart className="w-5 h-5 text-pink-600 mx-auto mb-1 fill-pink-600" />
                        <span className="block text-base font-extrabold text-gray-900 dark:text-white">{matchesCount}</span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Matches</span>
                    </div>

                    <div className="relative bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-2xl p-2.5 text-center">
                        {unreadMessagesCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                                {unreadMessagesCount}
                            </span>
                        )}
                        <MessageCircle className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                        <span className="block text-base font-extrabold text-gray-900 dark:text-white">{unreadMessagesCount}</span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Messages</span>
                    </div>

                    <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-2.5 text-center">
                        <Users className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                        <span className="block text-base font-extrabold text-gray-900 dark:text-white">{visitorCount}</span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Visitors</span>
                    </div>
                </div>

                {/* Mobile Quick Actions (Side-by-Side) */}
                <div className="grid grid-cols-2 gap-3">
                    <Link
                        to="/users"
                        className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl shadow-md active:scale-98 transition"
                    >
                        <Search className="w-6 h-6 text-white shrink-0" />
                        <div>
                            <h3 className="text-xs font-bold leading-tight">Browse Profiles</h3>
                            <p className="text-[10px] text-purple-200">Find your match</p>
                        </div>
                    </Link>

                    <Link
                        to="/conversation"
                        className="flex items-center gap-3 p-3.5 bg-white dark:bg-gray-900 border border-purple-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-2xl shadow-sm active:scale-98 transition"
                    >
                        <MessageCircle className="w-6 h-6 text-purple-600 shrink-0" />
                        <div>
                            <h3 className="text-xs font-bold leading-tight">Messages</h3>
                            <p className="text-[10px] text-gray-500">Continue chatting</p>
                        </div>
                    </Link>
                </div>

                {/* Mobile Premium Banner */}
                {!isPremium ? (
                    <div className="relative bg-gradient-to-r from-pink-50 via-purple-50 to-pink-100 dark:from-pink-950/30 dark:to-purple-950/30 border border-pink-200 dark:border-pink-900/40 rounded-2xl p-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
                                <Crown className="w-5 h-5 text-white fill-white" />
                            </div>
                            <div>
                                <h3 className="text-xs font-extrabold text-gray-900 dark:text-white">Unlock More Possibilities</h3>
                                <p className="text-[10px] text-gray-600 dark:text-gray-300 leading-tight">Unlimited messaging & direct contact info!</p>
                            </div>
                        </div>

                        <Link
                            to="/premium"
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold rounded-xl shrink-0 shadow-sm"
                        >
                            View Plans →
                        </Link>
                    </div>
                ) : (
                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Crown className="w-7 h-7 text-amber-500 fill-amber-500 shrink-0" />
                            <div>
                                <h3 className="text-xs font-extrabold text-gray-900 dark:text-white capitalize">{planName} Member</h3>
                                <p className="text-[10px] text-amber-700 dark:text-amber-300">{daysRemaining} days remaining on your active plan</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Mobile Suggested Profiles Horizontal Swipe Carousel */}
                <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                            <Flame className="w-4 h-4 text-pink-600 fill-pink-600" />
                            Suggested for You
                        </h2>
                        <Link to="/users" className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-0.5">
                            See All <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    <div className="flex gap-3 overflow-x-auto pb-2 pt-1 hide-scrollbar scrollbar-none snap-x overscroll-x-contain">
                        {featuredUsers.slice(0, 8).map((u) => (
                            <div key={u._id} className="snap-start shrink-0 w-44">
                                <ProfileCard
                                    user={u}
                                    onView={() => navigate(`/users/${u._id}`)}
                                    onMessage={() => navigate(`/conversation/${u._id}`)}
                                    onLike={handleQuickLike}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mobile Recent Activity */}
                <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                            <Activity className="w-4 h-4 text-purple-600" />
                            Recent Activity
                        </h2>
                        <Link to="/activity" className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-0.5">
                            View All <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-150 dark:border-gray-800 p-3 space-y-2.5 shadow-sm">
                        {notifications.slice(0, 3).map((n) => (
                            <div key={n._id} className="flex items-center justify-between gap-2 py-1 border-b border-gray-100 dark:border-gray-800 last:border-0">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center shrink-0 text-purple-600">
                                        <Eye className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{n.message}</p>
                                        <p className="text-[10px] text-gray-400">Recent</p>
                                    </div>
                                </div>
                                <Eye className="w-4 h-4 text-gray-400 shrink-0" />
                            </div>
                        ))}
                        {notifications.length === 0 && (
                            <p className="text-xs text-gray-500 text-center py-2">No recent notifications yet.</p>
                        )}
                    </div>
                </div>
            </div>


            {/* ========================================================================= */}
            {/* DESKTOP DASHBOARD VIEW (Visible on desktop screens >= 768px)               */}
            {/* Uses wide max-w-[1550px] container to eliminate empty space                */}
            {/* ========================================================================= */}
            <div className="hidden md:block w-full max-w-[1550px] mx-auto px-4 lg:px-8 pt-6">
                
                <div className="grid grid-cols-12 gap-6 items-start">

                    {/* Left Sidebar Navigation (2 cols on lg) */}
                    <div className="col-span-12 md:col-span-3 lg:col-span-2 space-y-4 sticky top-20 max-h-[calc(100vh-5.5rem)] overflow-y-auto hide-scrollbar scrollbar-none min-w-0">
                        <div className="bg-white dark:bg-gray-900 rounded-3xl p-3.5 border border-gray-150 dark:border-gray-800 shadow-sm space-y-1">
                            {/* Section 1: Main Platform Navigation */}
                            <Link to="/dashboard" className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold text-sm">
                                <Layers className="w-4.5 h-4.5 text-purple-600 shrink-0" />
                                <span>Dashboard</span>
                            </Link>

                            <Link to="/users" className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-sm transition">
                                <Search className="w-4.5 h-4.5 text-gray-400 shrink-0" />
                                <span>Browse Profiles</span>
                            </Link>

                            <Link to="/matches" className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-sm transition">
                                <Heart className="w-4.5 h-4.5 text-pink-500 shrink-0" />
                                <span>Matches</span>
                            </Link>

                            <Link to="/conversation" className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-sm transition">
                                <div className="flex items-center gap-3 min-w-0">
                                    <MessageCircle className="w-4.5 h-4.5 text-blue-500 shrink-0" />
                                    <span className="truncate">Messages</span>
                                </div>
                                {unreadMessagesCount > 0 && (
                                    <span className="px-2 py-0.5 bg-pink-600 text-white rounded-full text-xs font-bold shrink-0">{unreadMessagesCount}</span>
                                )}
                            </Link>

                            <Link to="/visitors" className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-sm transition">
                                <Eye className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                                <span>Profile Visitors</span>
                            </Link>

                            <Link to="/profile" className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-sm transition">
                                <User className="w-4.5 h-4.5 text-gray-400 shrink-0" />
                                <span>My Profile</span>
                            </Link>

                            <Link to="/wallet" className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-sm transition">
                                <Wallet className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                                <span>Wallet</span>
                            </Link>

                            <Link to="/premium" className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-sm transition">
                                <Crown className="w-4.5 h-4.5 text-amber-500 shrink-0" />
                                <span>Wallet & Premium</span>
                            </Link>

                            <Link to="/achievements" className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-sm transition">
                                <Trophy className="w-4.5 h-4.5 text-yellow-500 shrink-0" />
                                <span>Achievements</span>
                            </Link>

                            <Link to="/settings" className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-sm transition">
                                <Settings className="w-4.5 h-4.5 text-gray-400 shrink-0" />
                                <span>Settings</span>
                            </Link>

                            {/* Divider Line */}
                            <div className="my-2 border-t border-gray-150 dark:border-gray-800" />

                            {/* Section 2: Discover & Community */}
                            <Link to="/stories" className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-sm transition">
                                <BookOpen className="w-4.5 h-4.5 text-purple-500 shrink-0" />
                                <span>Stories</span>
                            </Link>

                            <Link to="/blogs" className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-sm transition">
                                <BookOpen className="w-4.5 h-4.5 text-purple-500 shrink-0" />
                                <span>Blogs & Articles</span>
                            </Link>

                            <Link to="/events" className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-sm transition">
                                <Calendar className="w-4.5 h-4.5 text-indigo-500 shrink-0" />
                                <span>Events</span>
                            </Link>

                            <Link to="/gifts" className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-sm transition">
                                <Gift className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                                <span>Gifts</span>
                            </Link>

                            <Link to="/referrals" className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-sm transition">
                                <UserPlus className="w-4.5 h-4.5 text-amber-500 shrink-0" />
                                <span>Referrals</span>
                            </Link>

                            <Link to="/contact-admin" className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-sm transition">
                                <HelpCircle className="w-4.5 h-4.5 text-cyan-500 shrink-0" />
                                <span>Help & Support</span>
                            </Link>

                            {/* Divider Line */}
                            <div className="my-2 border-t border-gray-150 dark:border-gray-800" />

                            {/* Section 3: Legal */}
                            <Link to="/privacy-policy" className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-sm transition">
                                <FileText className="w-4.5 h-4.5 text-slate-500 shrink-0" />
                                <span>Privacy Policy</span>
                            </Link>
                        </div>

                        {/* Promotional Couple Video Card */}
                        <div className="rounded-3xl overflow-hidden shadow-sm border border-gray-150 dark:border-gray-800 relative bg-purple-950">
                            <video
                                autoPlay
                                muted
                                loop
                                playsInline
                                preload="metadata"
                                poster="/images/love-connect-belong.jpg"
                                className="w-full h-56 lg:h-64 object-cover object-center opacity-95"
                            >
                                <source src="/video/PixVerse_V6_Image_Text_540P_Create_a_beautiful.mp4" type="video/mp4" />
                                <img
                                    src="/images/love-connect-belong.jpg"
                                    alt="Love Connect Belong"
                                    className="w-full h-56 lg:h-64 object-cover"
                                />
                            </video>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                        </div>
                    </div>

                    {/* Center Main Dashboard Area (7 cols on lg - wider and responsive) */}
                    <div className="col-span-12 md:col-span-9 lg:col-span-7 min-w-0 space-y-6">

                        {/* Scenic Hero Header Card */}
                        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-150 dark:border-gray-800 shadow-sm overflow-hidden">
                            {/* Scenic Banner Cover with custom LoveLK hero cover video */}
                            <div className="h-44 sm:h-52 md:h-60 relative overflow-hidden bg-purple-950">
                                <video
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                    preload="metadata"
                                    poster="/images/lovelk-hero-cover.png"
                                    className="w-full h-full object-cover object-center opacity-90"
                                >
                                    <source src="/video/PixVerse_V6_Image_Text_540P_Create_a_beautiful.mp4" type="video/mp4" />
                                    <img
                                        src="/images/lovelk-hero-cover.png"
                                        alt="LoveLK Cover"
                                        className="w-full h-full object-cover object-center"
                                    />
                                </video>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-purple-950/20 to-black/20 pointer-events-none" />
                            </div>

                            {/* Clean Compact Profile Overview below Cover */}
                            <div className="px-6 pb-5 pt-0 relative">
                                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 -mt-12 sm:-mt-14 mb-3">
                                    <div className="flex items-end gap-4 min-w-0">
                                        <div className="relative shrink-0">
                                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-white dark:border-gray-900 shadow-xl bg-purple-100 dark:bg-purple-950">
                                                <ProfileAvatar user={user} className="w-full h-full" avatarClassName="text-5xl" fallbackClassName="text-3xl font-black text-white bg-gradient-to-tr from-purple-600 to-pink-500" />
                                            </div>
                                            <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-gray-900 rounded-full" />
                                        </div>

                                        <div className="pb-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white truncate">
                                                    {user?.name || firstName}
                                                </h2>
                                                {user?.isApproved && (
                                                    <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold rounded-full text-[11px] flex items-center gap-1 shrink-0">
                                                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                                                        <span>Profile approved</span>
                                                    </span>
                                                )}
                                                {isPremium && (
                                                    <PremiumBadge plan={planName} isAdmin={user?.role === 'admin'} size="sm" />
                                                )}
                                            </div>

                                            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                <span className="flex items-center gap-1 truncate">
                                                    <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                                    {user?.district || user?.location || 'Sri Lanka'}
                                                </span>
                                                <span className="flex items-center gap-1 shrink-0">
                                                    <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                    Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '2026'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <Link to="/profile" className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-bold rounded-xl text-gray-700 dark:text-gray-200 shadow-xs transition shrink-0">
                                        <Edit3 className="w-3.5 h-3.5" />
                                        <span>Edit Profile</span>
                                    </Link>
                                </div>

                                {/* 5-Stat Counter Strip */}
                                <div className="grid grid-cols-5 gap-2 sm:gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                    <div className="text-center min-w-0">
                                        <Eye className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                                        <span className="block text-lg font-black text-gray-900 dark:text-white truncate">{profileViewsCount}</span>
                                        <span className="text-[10px] sm:text-xs text-gray-400 uppercase font-bold truncate block">Profile views</span>
                                    </div>

                                    <div className="text-center min-w-0">
                                        <Heart className="w-5 h-5 text-pink-600 fill-pink-600 mx-auto mb-1" />
                                        <span className="block text-lg font-black text-gray-900 dark:text-white truncate">{matchesCount}</span>
                                        <span className="text-[10px] sm:text-xs text-gray-400 uppercase font-bold truncate block">Matches</span>
                                    </div>

                                    <div className="text-center min-w-0">
                                        <MessageCircle className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                                        <span className="block text-lg font-black text-gray-900 dark:text-white truncate">{unreadMessagesCount}</span>
                                        <span className="text-[10px] sm:text-xs text-gray-400 uppercase font-bold truncate block">Messages</span>
                                    </div>

                                    <div className="text-center min-w-0">
                                        <Users className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                                        <span className="block text-lg font-black text-gray-900 dark:text-white truncate">{visitorCount}</span>
                                        <span className="text-[10px] sm:text-xs text-gray-400 uppercase font-bold truncate block">Visitors (7d)</span>
                                    </div>

                                    <div className="text-center min-w-0">
                                        <Flame className="w-5 h-5 text-amber-500 fill-amber-500 mx-auto mb-1" />
                                        <span className="block text-lg font-black text-gray-900 dark:text-white truncate">{loginStreak}</span>
                                        <span className="text-[10px] sm:text-xs text-gray-400 uppercase font-bold truncate block">Day streak</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions Grid */}
                        <div>
                            <h3 className="text-base font-extrabold text-gray-900 dark:text-white mb-3">Quick Actions</h3>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
                                <Link to="/users" className="p-3 sm:p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 rounded-2xl text-center hover:shadow-md transition min-w-0">
                                    <Search className="w-5 sm:w-6 h-5 sm:h-6 text-purple-600 mx-auto mb-1 sm:mb-1.5" />
                                    <span className="block text-xs font-bold text-gray-900 dark:text-white truncate">Browse Profiles</span>
                                    <span className="text-[10px] text-gray-400 truncate block">Find your match</span>
                                </Link>

                                <Link to="/matches" className="p-3 sm:p-4 bg-pink-50 dark:bg-pink-950/30 border border-pink-100 dark:border-pink-900/40 rounded-2xl text-center hover:shadow-md transition min-w-0">
                                    <Heart className="w-5 sm:w-6 h-5 sm:h-6 text-pink-600 fill-pink-600 mx-auto mb-1 sm:mb-1.5" />
                                    <span className="block text-xs font-bold text-gray-900 dark:text-white truncate">My Matches</span>
                                    <span className="text-[10px] text-gray-400 truncate block">See matches</span>
                                </Link>

                                <Link to="/conversation" className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-2xl text-center hover:shadow-md transition relative min-w-0">
                                    {unreadMessagesCount > 0 && (
                                        <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-pink-600 text-white rounded-full text-[9px] font-bold">{unreadMessagesCount}</span>
                                    )}
                                    <MessageCircle className="w-5 sm:w-6 h-5 sm:h-6 text-blue-600 mx-auto mb-1 sm:mb-1.5" />
                                    <span className="block text-xs font-bold text-gray-900 dark:text-white truncate">Messages</span>
                                    <span className="text-[10px] text-gray-400 truncate block">Chat now</span>
                                </Link>

                                <Link to="/visitors" className="p-3 sm:p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl text-center hover:shadow-md transition min-w-0">
                                    <Eye className="w-5 sm:w-6 h-5 sm:h-6 text-emerald-600 mx-auto mb-1 sm:mb-1.5" />
                                    <span className="block text-xs font-bold text-gray-900 dark:text-white truncate">Visitors</span>
                                    <span className="text-[10px] text-gray-400 truncate block">Who viewed you</span>
                                </Link>

                                <Link to="/blogs" className="p-3 sm:p-4 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl text-center hover:shadow-md transition min-w-0">
                                    <BookOpen className="w-5 sm:w-6 h-5 sm:h-6 text-indigo-600 mx-auto mb-1 sm:mb-1.5" />
                                    <span className="block text-xs font-bold text-gray-900 dark:text-white truncate">Blogs & Articles</span>
                                    <span className="text-[10px] text-gray-400 truncate block">Read advice</span>
                                </Link>

                                <Link to="/premium" className="p-3 sm:p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 rounded-2xl text-center hover:shadow-md transition min-w-0">
                                    <Crown className="w-5 sm:w-6 h-5 sm:h-6 text-amber-500 fill-amber-500 mx-auto mb-1 sm:mb-1.5" />
                                    <span className="block text-xs font-bold text-gray-900 dark:text-white truncate">Go Premium</span>
                                    <span className="text-[10px] text-gray-400 truncate block">Unlock features</span>
                                </Link>
                            </div>
                        </div>

                        {/* Suggested for You Section with Left/Right Carousel Controls */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                                        <Flame className="w-5 h-5 text-pink-600 fill-pink-600" />
                                        Suggested for You
                                    </h3>
                                    <p className="text-xs text-gray-500">Profiles you might be interested in</p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => scrollSuggested('left')}
                                        className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-200 transition"
                                        aria-label="Previous profiles"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => scrollSuggested('right')}
                                        className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-200 transition"
                                        aria-label="Next profiles"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                    <Link to="/users" className="text-xs font-bold text-purple-600 hover:underline ml-2">
                                        View All →
                                    </Link>
                                </div>
                            </div>

                            <div
                                ref={suggestedRef}
                                className="flex gap-4 overflow-x-auto pb-2 pt-1 hide-scrollbar scrollbar-none snap-x scroll-smooth overscroll-x-contain"
                            >
                                {featuredUsers.map((u) => (
                                    <div key={u._id} className="snap-start shrink-0 w-48 sm:w-52">
                                        <ProfileCard
                                            user={u}
                                            onView={() => navigate(`/users/${u._id}`)}
                                            onMessage={() => navigate(`/conversation/${u._id}`)}
                                            onLike={handleQuickLike}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel (3 cols on lg) */}
                    <div className="col-span-12 md:col-span-12 lg:col-span-3 space-y-4">
                        
                        {/* Right Panel Premium Card */}
                        {!isPremium ? (
                            <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl p-5 text-white shadow-md relative overflow-hidden">
                                <Crown className="w-8 h-8 text-amber-300 fill-amber-300 mb-2" />
                                <h3 className="text-base font-extrabold leading-tight">Unlock More Possibilities</h3>
                                <p className="text-xs text-pink-100 mt-1 leading-relaxed">
                                    Get premium and enjoy unlimited messages, profile boost, direct contact info and more!
                                </p>

                                <Link
                                    to="/premium"
                                    className="mt-4 inline-block w-full text-center py-2 bg-white text-purple-700 rounded-xl font-bold text-xs shadow-sm hover:bg-pink-50 transition"
                                >
                                    View Premium Plans →
                                </Link>
                            </div>
                        ) : (
                            <div className="bg-gradient-to-br from-amber-500 to-yellow-600 rounded-3xl p-5 text-white shadow-md">
                                <Crown className="w-8 h-8 text-white fill-white mb-2" />
                                <h3 className="text-base font-extrabold capitalize">{planName} Member</h3>
                                <p className="text-xs text-amber-100 mt-1">{daysRemaining} days remaining on your active membership.</p>
                            </div>
                        )}

                        {/* Profile Completeness Card */}
                        <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-150 dark:border-gray-800 shadow-sm space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-extrabold text-gray-900 dark:text-white">Your Profile Completeness</h3>
                                <span className="text-xs font-black text-purple-600">{completenessPercentage}%</span>
                            </div>

                            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                                <div className="bg-gradient-to-r from-purple-600 to-pink-600 h-full rounded-full transition-all duration-500" style={{ width: `${completenessPercentage}%` }} />
                            </div>

                            <div className="space-y-2 pt-1 text-xs">
                                {profileCompletenessItems.map(item => (
                                    <div key={item.key} className="flex items-center gap-2">
                                        {item.done ? (
                                            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                                        ) : (
                                            <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-700 shrink-0" />
                                        )}
                                        <span className={item.done ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-400 font-medium'}>
                                            {item.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Activity Card */}
                        <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-150 dark:border-gray-800 shadow-sm space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-extrabold text-gray-900 dark:text-white">Recent Activity</h3>
                                <Link to="/activity" className="text-[11px] font-bold text-purple-600 hover:underline">View All</Link>
                            </div>

                            <div className="space-y-3">
                                {notifications.slice(0, 4).map((n) => (
                                    <div key={n._id} className="flex items-center gap-2.5 text-xs">
                                        <div className="w-7 h-7 rounded-full bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600 shrink-0">
                                            <Eye className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">{n.message}</p>
                                        </div>
                                    </div>
                                ))}
                                {notifications.length === 0 && (
                                    <p className="text-xs text-gray-400 text-center py-2">No recent activity.</p>
                                )}
                            </div>
                        </div>

                        {/* Tip of the Day Box */}
                        <div className="bg-pink-50 dark:bg-pink-950/30 border border-pink-100 dark:border-pink-900/40 rounded-3xl p-4 text-xs text-pink-800 dark:text-pink-300 flex items-start gap-2.5">
                            <Sparkles className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold">Tip of the Day</p>
                                <p className="text-pink-700 dark:text-pink-400 mt-0.5">A complete profile with a clear portrait photo gets 3x more matches! ✨</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Premium Popup */}
            {showPremiumPopup && (
                <PremiumPopup onClose={() => setShowPremiumPopup(false)} />
            )}
        </div>
    );
};

export default Dashboard;
