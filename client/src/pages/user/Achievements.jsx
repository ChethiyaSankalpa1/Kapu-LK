import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { achievementAPI } from '../../services/api';
import { toast } from 'react-toastify';
import {
    Trophy, Flame, Star, Crown, Gift, Sparkles, Lock, CheckCircle2
} from 'lucide-react';
import { WalletSkeleton } from '../../components/ui/SkeletonLoader';
import BackButton from '../../components/common/BackButton';

const Achievements = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [userStats, setUserStats] = useState(null);
    const [achievements, setAchievements] = useState([]);
    const [checkingIn, setCheckingIn] = useState(false);

    const fetchInFlightRef = useRef(false);
    const lastFetchedIdRef = useRef(null);

    useEffect(() => {
        const fetchAchievements = async () => {
            if (fetchInFlightRef.current) return;
            if (lastFetchedIdRef.current === user?._id) return;
            fetchInFlightRef.current = true;
            setLoading(true);
            try {
                const res = await achievementAPI.getMyStats();
                const data = res.data || {};
                setUserStats(data.stats || data.userStats || { points: 0 });
                const list = data.achievements || [];
                setAchievements(list);
                lastFetchedIdRef.current = user?._id;
            } catch (error) {
                console.error('Failed to load achievements', error);
                toast.error('Failed to load achievements');
                setAchievements([]);
                setUserStats({ points: 0 });
            } finally {
                setLoading(false);
                fetchInFlightRef.current = false;
            }
        };
        if (user) fetchAchievements();
        return () => { fetchInFlightRef.current = false; };
    }, [user]);

    const handleDailyCheckIn = async () => {
        if (checkingIn) return;
        setCheckingIn(true);
        try {
            const res = await achievementAPI.dailyCheckIn();
            const earned = res.data?.pointsEarned || 10;
            toast.success(`Checked in! +${earned} points earned`);
            lastFetchedIdRef.current = null;
            const refreshed = await achievementAPI.getMyStats();
            const d = refreshed.data || {};
            setUserStats(d.stats || d.userStats || userStats);
            setAchievements(d.achievements || achievements);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Already checked in today');
        } finally {
            setCheckingIn(false);
        }
    };

    const earnedCount = achievements.filter(a => a.earned).length;
    const totalCount = achievements.length || 1;
    const overallProgress = Math.round((earnedCount / totalCount) * 100);

    if (loading) {
        return (
            <div className="w-full max-w-[1550px] mx-auto px-4 lg:px-8 pt-6 pb-16">
                <WalletSkeleton />
            </div>
        );
    }

    return (
        <div className="w-full max-w-[1550px] mx-auto px-4 lg:px-8 pt-6 pb-16">
            {/* Header */}
            <div className="glass-card rounded-3xl p-6 sm:p-8 mb-8 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                    <div>
                        <div className="mb-3">
                            <BackButton variant="ghost" label="Go Back" iconClassName="w-4 h-4" />
                        </div>
                        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-bold text-xs uppercase tracking-wider mb-2">
                            <Trophy className="w-3.5 h-3.5" />
                            <span>Milestones & Rewards</span>
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                            Achievements
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-0.5">
                            Complete daily tasks, earn points, and unlock badges as you build connections on LoveLK.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleDailyCheckIn}
                            disabled={checkingIn}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 text-slate-900 rounded-2xl font-black hover:opacity-90 transition shadow-lg shadow-yellow-500/20 text-xs sm:text-sm disabled:opacity-60"
                        >
                            <Flame className="w-4 h-4 text-orange-700 fill-orange-600" />
                            <span>{checkingIn ? 'Checking in...' : 'Daily Check-in (+10)'}</span>
                        </button>
                        <button
                            onClick={() => navigate('/wallet')}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold hover:from-purple-700 hover:to-pink-700 transition shadow-lg shadow-purple-500/20 text-xs sm:text-sm"
                        >
                            <Gift className="w-4 h-4" />
                            <span>Redeem Points</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                {/* Reward Points */}
                <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl shadow-indigo-500/20">
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                        </div>
                        <span className="text-white/90 text-sm font-bold uppercase tracking-wider">Reward Points</span>
                    </div>
                    <div className="text-4xl sm:text-5xl font-black mb-2 tracking-tight">
                        {userStats?.points || 0}
                    </div>
                    <div className="text-white/80 text-xs font-semibold">
                        Earn points via logins & activities
                    </div>
                </div>

                {/* Earned Badges */}
                <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 rounded-3xl p-6 sm:p-8 text-white shadow-2xl shadow-orange-500/20">
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <Crown className="w-5 h-5 text-yellow-200 fill-yellow-200" />
                        </div>
                        <span className="text-white/90 text-sm font-bold uppercase tracking-wider">Badges Earned</span>
                    </div>
                    <div className="text-4xl sm:text-5xl font-black mb-2 tracking-tight">
                        {earnedCount}
                        <span className="text-2xl sm:text-3xl font-bold text-white/60">/{totalCount}</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-yellow-300 transition-all duration-500" style={{ width: `${overallProgress}%` }} />
                    </div>
                </div>

                {/* Login Streak */}
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 rounded-3xl p-6 sm:p-8 text-white shadow-2xl shadow-emerald-500/20">
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <Flame className="w-5 h-5 text-orange-200 fill-orange-200" />
                        </div>
                        <span className="text-white/90 text-sm font-bold uppercase tracking-wider">Login Streak</span>
                    </div>
                    <div className="text-4xl sm:text-5xl font-black mb-2 tracking-tight">
                        {userStats?.loginStreak || 0}
                        <span className="text-xl sm:text-2xl font-bold text-white/70 ml-1">days</span>
                    </div>
                    <div className="text-white/80 text-xs font-semibold">
                        Keep logging in daily to unlock streak badges
                    </div>
                </div>
            </div>

            {/* Achievement Grid */}
            <div className="glass-card rounded-3xl p-6 sm:p-8 mb-10 shadow-sm">
                <div className="flex items-center justify-between mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
                    <div className="flex items-center gap-2.5">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                            All Milestones & Achievements
                        </h2>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 rounded-full">
                        {achievements.length > 0 ? `${earnedCount} of ${achievements.length} unlocked` : 'Loading milestones'}
                    </span>
                </div>

                {achievements.length === 0 ? (
                    <div className="text-center py-16 text-slate-500 dark:text-slate-400">
                        <Sparkles className="w-12 h-12 mx-auto mb-3 text-purple-300 dark:text-purple-700" />
                        <p className="text-sm font-semibold mb-1">No milestones loaded yet</p>
                        <p className="text-xs">Check back soon — we're loading your achievements.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        {achievements.map((achievement) => {
                            const target = achievement.target || achievement.condition?.target || 1;
                            const progress = Math.max(0, Math.min(target, achievement.progress || 0));
                            const percent = Math.min(100, Math.round((progress / target) * 100));
                            return (
                                <div
                                    key={achievement._id || achievement.name}
                                    className={`rounded-3xl p-5 border transition-all flex flex-col justify-between ${
                                        achievement.earned
                                            ? 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-amber-900/10 border-amber-300 dark:border-amber-700 shadow-lg shadow-amber-500/10'
                                            : 'bg-slate-50/80 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-800'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="text-3xl sm:text-4xl drop-shadow-sm">
                                                {achievement.icon || '🏆'}
                                            </div>
                                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                                                achievement.earned
                                                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                                                    : 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                                            }`}>
                                                {achievement.earned ? (
                                                    <><CheckCircle2 className="w-3 h-3" /> Unlocked</>
                                                ) : (
                                                    <><Lock className="w-3 h-3" /> +{achievement.points || 10} pts</>
                                                )}
                                            </span>
                                        </div>
                                        <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white mb-1.5">
                                            {achievement.name}
                                        </h3>
                                        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 min-h-[2rem]">
                                            {achievement.description}
                                        </p>
                                    </div>

                                    <div className="mt-5">
                                        <div className="flex justify-between items-center text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                                            <span>{achievement.earned ? 'Completed' : 'Progress'}</span>
                                            <span className="tabular-nums">
                                                {achievement.earned ? `${target} / ${target}` : `${progress} / ${target}`}
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-700 rounded-full ${
                                                    achievement.earned
                                                        ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500'
                                                        : 'bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500'
                                                }`}
                                                style={{ width: `${achievement.earned ? 100 : percent}%` }}
                                            />
                                        </div>
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

export default Achievements;
