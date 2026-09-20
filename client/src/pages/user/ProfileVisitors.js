import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../services/api';
import { toast } from 'react-toastify';
import moment from 'moment';
import {
    Eye, Crown, RefreshCw, Sparkles,
    MessageCircle
} from 'lucide-react';
import ProfileCard from '../../components/ui/ProfileCard';
import BackButton from '../../components/common/BackButton';

const ProfileVisitors = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user: currentUser, premiumStatus, isAdmin } = useAuth();

    const [visitors, setVisitors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isPremiumRequired, setIsPremiumRequired] = useState(false);

    const planName = (currentUser?.premiumPlan || premiumStatus?.premiumPlan || 'free').toLowerCase();
    const isPremiumEligible = isAdmin || (currentUser?.isPremium && (planName === 'silver' || planName === 'gold'));

    const fetchVisitors = useCallback(async () => {
        setLoading(true);
        try {
            const res = await userAPI.getProfileVisitors();
            if (res.data?.success) {
                setVisitors(res.data.visitors || []);
                setIsPremiumRequired(false);
            }
        } catch (error) {
            if (error.response?.status === 403 && error.response?.data?.isPremiumRequired) {
                setIsPremiumRequired(true);
            } else if (!isPremiumEligible) {
                setIsPremiumRequired(true);
            } else {
                toast.error(error.response?.data?.message || t('visitors.fetchFailed', { defaultValue: 'Failed to load profile visitors' }));
            }
        } finally {
            setLoading(false);
        }
    }, [isPremiumEligible, t]);

    useEffect(() => {
        if (!isPremiumEligible) {
            setIsPremiumRequired(true);
            setLoading(false);
        } else {
            fetchVisitors();
        }
    }, [isPremiumEligible, fetchVisitors]);

    const handleView = (userId) => {
        navigate(`/users/${userId}`);
    };

    const handleMessage = (userId) => {
        navigate(`/conversation/${userId}`);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-4 pb-20 md:py-8 transition-colors duration-300">
            <div className="container mx-auto px-4 max-w-6xl">
                
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <BackButton label="Back" />
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
                                <Eye className="w-7 h-7 text-emerald-500" />
                                <span>{t('visitors.title', { defaultValue: 'Profile Visitors' })}</span>
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                Members who recently visited your profile
                            </p>
                        </div>
                    </div>

                    {!isPremiumRequired && (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={fetchVisitors}
                                disabled={loading}
                                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/60 text-xs font-semibold shadow-xs transition"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-600' : 'text-gray-500'}`} />
                                <span>{t('common.refresh', { defaultValue: 'Refresh' })}</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Main Content */}
                {loading ? (
                    <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-gray-150 dark:border-gray-800 shadow-xs">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-emerald-500 mx-auto mb-4"></div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Loading your visitors...</p>
                    </div>
                ) : isPremiumRequired ? (
                    /* Locked Premium State for Free & Bronze users */
                    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-150 dark:border-gray-800 shadow-xl overflow-hidden max-w-2xl mx-auto text-center p-8 sm:p-10">
                        <div className="w-20 h-20 bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/20 text-white">
                            <Crown className="w-10 h-10 fill-white stroke-white" />
                        </div>

                        <span className="inline-block px-3.5 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300 font-bold rounded-full text-xs uppercase tracking-wider mb-3">
                            Silver & Gold Feature
                        </span>

                        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-3">
                            Unlock Profile Visitors
                        </h2>

                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed mb-6 max-w-lg mx-auto">
                            Find out who is interested in you! Upgrade to a <strong>Silver</strong> or <strong>Gold</strong> plan to see the complete list of members who viewed your profile, their photos, and reach out to them directly.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 text-left max-w-lg mx-auto">
                            <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-2xl border border-purple-100 dark:border-purple-900/40 text-xs">
                                <p className="font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5 mb-1">
                                    <Eye className="w-4 h-4 text-purple-600 shrink-0" />
                                    <span>Full History</span>
                                </p>
                                <p className="text-purple-700 dark:text-purple-300 text-[11px]">See every profile visit in real-time</p>
                            </div>

                            <div className="p-3 bg-pink-50 dark:bg-pink-950/30 rounded-2xl border border-pink-100 dark:border-pink-900/40 text-xs">
                                <p className="font-bold text-pink-900 dark:text-pink-200 flex items-center gap-1.5 mb-1">
                                    <MessageCircle className="w-4 h-4 text-pink-600 shrink-0" />
                                    <span>Direct Chat</span>
                                </p>
                                <p className="text-pink-700 dark:text-pink-300 text-[11px]">Message visitors before they move on</p>
                            </div>

                            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-100 dark:border-amber-900/40 text-xs">
                                <p className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 mb-1">
                                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                                    <span>Match 3x Faster</span>
                                </p>
                                <p className="text-amber-700 dark:text-amber-300 text-[11px]">Connect with people already interested</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <Link
                                to="/premium"
                                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-purple-500/25 transition active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Crown className="w-4 h-4 fill-white stroke-white" />
                                <span>Upgrade to Silver / Gold</span>
                            </Link>
                            <Link
                                to="/dashboard"
                                className="w-full sm:w-auto px-6 py-3.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold text-sm rounded-2xl transition"
                            >
                                Back to Dashboard
                            </Link>
                        </div>
                    </div>
                ) : visitors.length > 0 ? (
                    /* Visitors List */
                    <div>
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-150 dark:border-gray-800 shadow-xs mb-6 flex items-center justify-between">
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                                <span>{visitors.length} {visitors.length === 1 ? 'member visited' : 'members visited'} your profile</span>
                            </p>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Showing recent visits</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {visitors.map((v) => {
                                const visitorUser = v.user || v;
                                return (
                                    <div key={v.id || visitorUser._id} className="flex flex-col">
                                        <ProfileCard
                                            user={visitorUser}
                                            onView={() => handleView(visitorUser._id)}
                                            onMessage={() => handleMessage(visitorUser._id)}
                                            showViewedInfo={true}
                                            viewedAt={v.lastViewedAt}
                                            viewCount={v.viewCount || 1}
                                        />
                                        {v.lastViewedAt && (
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center mt-1.5 font-medium">
                                                Visited {moment(v.lastViewedAt).fromNow()}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    /* Empty state for Silver/Gold users with no visitors yet */
                    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-150 dark:border-gray-800 p-10 text-center max-w-lg mx-auto shadow-xs">
                        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/40 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                            <Eye className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Profile Visitors Yet</h3>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                            Complete your profile information and upload high-quality photos to increase your profile views!
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
                            <Link
                                to="/profile"
                                className="btn-primary text-xs py-2.5 px-5"
                            >
                                Edit Profile
                            </Link>
                            <Link
                                to="/users"
                                className="btn-secondary text-xs py-2.5 px-5"
                            >
                                Browse Other Profiles
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileVisitors;
