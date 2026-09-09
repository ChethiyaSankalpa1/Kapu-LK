import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// useAuth import removed
import { walletAPI, achievementAPI, giftAPI, redemptionAPI } from '../../services/api';
import { toast } from 'react-toastify';
import {
    Crown, Wallet as WalletIcon, Trophy, Flame, Gift, ArrowUpRight, History,
    Plus, CreditCard, RefreshCw, Star, TrendingUp, Sparkles, X
} from 'lucide-react';
import { WalletSkeleton } from '../../components/ui/SkeletonLoader';

const DEFAULT_REDEMPTION_OPTIONS = [
    {
        _id: 'default_premium_1d',
        rewardType: 'premium',
        rewardName: '1-Day Premium Membership',
        pointsCost: 150,
        description: 'Unlock 24 hours of full Premium access & messaging'
    },
    {
        _id: 'default_premium_7d',
        rewardType: 'premium',
        rewardName: '7 Days Premium Membership',
        pointsCost: 450,
        description: 'Unlock 7 full days of Premium membership'
    },
    {
        _id: 'default_premium_30d',
        rewardType: 'premium',
        rewardName: '30 Days Premium Membership',
        pointsCost: 1200,
        description: 'Unlock a full month of Premium membership'
    },
    {
        _id: 'default_wallet',
        rewardType: 'wallet',
        rewardName: 'Rs. 500 Wallet Cash',
        pointsCost: 500,
        description: 'Add 500 LKR directly to your wallet balance'
    },
    {
        _id: 'default_boost',
        rewardType: 'boost',
        rewardName: '7-Day Profile Boost',
        pointsCost: 300,
        description: 'Boost profile visibility to 5x more matches'
    },
    {
        _id: 'default_badge',
        rewardType: 'badge',
        rewardName: 'VIP Profile Badge',
        pointsCost: 200,
        description: 'Show a gold VIP badge on your profile card'
    }
];

const DEFAULT_ACHIEVEMENTS_LIST = [
    { _id: 'def_1', name: '🌅 Daily Check-in', description: 'Log in to Kapu LK daily', icon: '🌅', points: 5, target: 1, progress: 0, earned: false },
    { _id: 'def_2', name: '💬 Social Butterfly', description: 'Send 10 messages in chat', icon: '💬', points: 15, target: 10, progress: 0, earned: false },
    { _id: 'def_3', name: '🎁 Generous Heart', description: 'Send a gift to a match', icon: '🎁', points: 20, target: 1, progress: 0, earned: false },
    { _id: 'def_4', name: '🔥 7-Day Streak', description: 'Log in 7 consecutive days', icon: '🔥', points: 50, target: 7, progress: 0, earned: false },
    { _id: 'def_5', name: '👑 Royal Supporter', description: 'Send 5 gifts to matches', icon: '👑', points: 75, target: 5, progress: 0, earned: false }
];

const Wallet = () => {
    // useAuth() was here but unused
    const navigate = useNavigate();
    const [wallet, setWallet] = useState(null);
    const [userStats, setUserStats] = useState(null);
    const [achievements, setAchievements] = useState(DEFAULT_ACHIEVEMENTS_LIST);
    const [gifts, setGifts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [redemptionConfigs, setRedemptionConfigs] = useState(DEFAULT_REDEMPTION_OPTIONS);
    const [redemptionHistory, setRedemptionHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTopUpModal, setShowTopUpModal] = useState(false);
    const [topUpAmount, setTopUpAmount] = useState('');
    const [selectedBank, setSelectedBank] = useState('HNB');
    const [paymentSlip, setPaymentSlip] = useState(null);
    const [submittingPayment, setSubmittingPayment] = useState(false);
    const [selectedRewardId, setSelectedRewardId] = useState(null);
    const [confirmingReward, setConfirmingReward] = useState(null);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            // Load wallet summary (wallet, stats, transactions in 1 request)
            const summaryRes = await walletAPI.getWalletSummary();
            const summary = summaryRes.data || {};
            
            setWallet(summary.wallet);
            setUserStats(summary.userStats);
            setTransactions(summary.transactions || []);
            setLoading(false);

            // Load secondary data in background without blocking UI
            Promise.all([
                achievementAPI.getMyStats().then(res => {
                    if (res.data?.achievements && res.data.achievements.length > 0) {
                        setAchievements(res.data.achievements);
                    }
                }),
                giftAPI.getGifts().then(res => setGifts(res.data || [])),
                redemptionAPI.getConfigs().then(res => {
                    if (res.data && res.data.length > 0) {
                        setRedemptionConfigs(res.data);
                    }
                }),
                redemptionAPI.getHistory().then(res => setRedemptionHistory(res.data || []))
            ]).catch(err => console.error('Error loading background data:', err));
        } catch (error) {
            toast.error('Failed to load wallet data');
            setLoading(false);
        }
    };

    const fetchSummaryOnly = async () => {
        try {
            const summaryRes = await walletAPI.getWalletSummary();
            const summary = summaryRes.data || {};
            setWallet(summary.wallet);
            setUserStats(summary.userStats);
            setTransactions(summary.transactions || []);
        } catch (error) {
            // Silent catch
        }
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
            fetchSummaryOnly();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit payment request');
        } finally {
            setSubmittingPayment(false);
        }
    };

    const handleDailyCheckIn = async () => {
        try {
            await achievementAPI.dailyCheckIn();
            toast.success('Check-in successful! +10 LKR');
            fetchSummaryOnly();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Check-in failed');
        }
    };

    const handleInitiateRedeem = (config) => {
        if (!userStats || userStats.points < config.pointsCost) {
            toast.error(`You need ${config.pointsCost} points to redeem this reward. Current balance: ${userStats?.points || 0} points.`);
            return;
        }
        setConfirmingReward(config);
    };

    const handleConfirmRedeem = async () => {
        if (!confirmingReward || selectedRewardId) return;
        const config = confirmingReward;

        setSelectedRewardId(config._id);
        try {
            await redemptionAPI.redeemPoints({
                configId: config._id,
                rewardType: config.rewardType,
                rewardName: config.rewardName,
                pointsCost: config.pointsCost,
            });
            toast.success(`Successfully redeemed ${config.rewardName}!`);
            setConfirmingReward(null);
            fetchSummaryOnly();
            redemptionAPI.getHistory().then(res => setRedemptionHistory(res.data || [])).catch(() => {});
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to redeem reward');
        } finally {
            setSelectedRewardId(null);
        }
    };


    if (loading) {
        return <WalletSkeleton />;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Wallet & Rewards</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your balance, points, and rewards</p>
                    </div>
                    <button
                        onClick={() => setShowTopUpModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition shadow-lg shadow-green-500/20"
                    >
                        <Plus className="w-5 h-5" />
                        Top Up Wallet
                    </button>
                </div>

                {/* Balance Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Wallet Balance */}
                    <div className="bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 rounded-2xl p-8 shadow-2xl shadow-orange-500/30">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <WalletIcon className="w-8 h-8 text-white" />
                                <span className="text-white/90 text-sm font-medium">Wallet Balance</span>
                            </div>
                            <button onClick={fetchAllData} className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition">
                                <RefreshCw className="w-5 h-5 text-white" />
                            </button>
                        </div>
                        <div className="text-5xl font-bold text-white mb-2">
                            Rs. {wallet?.balance?.toLocaleString() || 0}
                        </div>
                        <div className="text-white/80 text-sm">Sri Lankan Rupees (LKR)</div>
                    </div>

                    {/* Reward Points */}
                    <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-8 shadow-2xl shadow-purple-500/30">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Star className="w-8 h-8 text-white" />
                                <span className="text-white/90 text-sm font-medium">Reward Points</span>
                            </div>
                            <button
                                onClick={handleDailyCheckIn}
                                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-medium transition"
                            >
                                <Flame className="w-4 h-4" />
                                Daily Check-in
                            </button>
                        </div>
                        <div className="text-5xl font-bold text-white mb-2">
                            {userStats?.points || 0}
                        </div>
                        <div className="text-white/80 text-sm">Total Points Earned</div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Total Deposits</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            Rs. {wallet?.totalDeposits?.toLocaleString() || 0}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <CreditCard className="w-5 h-5 text-red-600 dark:text-red-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Total Spent</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            Rs. {wallet?.totalSpent?.toLocaleString() || 0}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Day Streak</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {userStats?.loginStreak || 0}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <Gift className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Gifts Sent</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {userStats?.totalGiftsSent || 0}
                        </div>
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm mb-8">
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                            <History className="w-6 h-6 text-gray-900 dark:text-white" />
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Transactions</h2>
                        </div>
                        <button
                            onClick={() => navigate('/dashboard', { state: { activeTab: 'wallet' } })}
                            className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium flex items-center gap-1"
                        >
                            View All
                            <ArrowUpRight className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="p-6">
                        {transactions.length > 0 ? (
                            <div className="space-y-3">
                                {transactions.slice(0, 5).map((tx) => (
                                    <div key={tx._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white">{tx.type}</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {new Date(tx.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className={`font-bold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                            {tx.type === 'credit' ? '+' : '-'} Rs. {tx.amount?.toLocaleString() || 0}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                No transactions yet
                            </div>
                        )}
                    </div>
                </div>

                {/* Daily Tasks & Achievements */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm mb-8">
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                            <Trophy className="w-6 h-6 text-yellow-500" />
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Daily Tasks & Achievements</h2>
                        </div>
                        <span className="text-xs font-semibold px-3 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 rounded-full">
                            Earn points every day
                        </span>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {((achievements && achievements.length > 0) ? achievements : DEFAULT_ACHIEVEMENTS_LIST).map((achievement) => {
                                const target = achievement.target || achievement.condition?.target || 1;
                                const progress = achievement.progress || 0;
                                const percent = Math.min(100, Math.round((progress / target) * 100));
                                return (
                                    <div
                                        key={achievement._id || achievement.name}
                                        className={`rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                                            achievement.earned 
                                                ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-300 dark:border-yellow-700 shadow-sm'
                                                : 'bg-gray-50 dark:bg-slate-700/40 border-gray-200 dark:border-slate-700'
                                        }`}
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-3xl">{achievement.icon || '🏆'}</span>
                                                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-md">
                                                    +{achievement.points || 10} pts
                                                </span>
                                            </div>
                                            <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                                {achievement.name}
                                            </h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                                {achievement.description}
                                            </p>
                                        </div>

                                        <div className="mt-4">
                                            <div className="flex justify-between items-center text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">
                                                <span>{achievement.earned ? 'Unlocked 🏆' : 'Progress'}</span>
                                                <span>{achievement.earned ? 'Completed' : `${progress} / ${target}`}</span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-slate-600 h-2 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full transition-all duration-500 ${
                                                        achievement.earned ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : 'bg-purple-500'
                                                    }`} 
                                                    style={{ width: `${achievement.earned ? 100 : percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Available Gifts */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm mb-8">
                    <div className="flex items-center gap-2 p-6 border-b border-gray-200 dark:border-slate-700">
                        <Gift className="w-6 h-6 text-pink-500" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Available Gifts</h2>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {gifts.filter(g => g.isActive).map((gift) => (
                                <div
                                    key={gift._id}
                                    className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 text-center"
                                >
                                    <div className="text-4xl mb-2">{gift.emoji}</div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{gift.name}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Rs. {gift.price}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Points Redemption */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2 p-6 border-b border-gray-200 dark:border-slate-700">
                        <Sparkles className="w-6 h-6 text-purple-500" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Redeem Points</h2>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {redemptionConfigs.map((config) => (
                                <div
                                    key={config._id}
                                    className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700"
                                >
                                    <div className="flex items-center gap-2 mb-3">
                                        <Star className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                        <span className="font-semibold text-gray-900 dark:text-white">{config.rewardName}</span>
                                    </div>
                                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-4">
                                        {config.pointsCost} Points
                                    </div>
                                    <button
                                        onClick={() => handleInitiateRedeem(config)}
                                        disabled={!!selectedRewardId || (userStats?.points || 0) < config.pointsCost}
                                        className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm text-sm"
                                    >
                                        {selectedRewardId === config._id ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                <span>Redeeming...</span>
                                            </>
                                        ) : (userStats?.points || 0) < config.pointsCost ? (
                                            'Insufficient Points'
                                        ) : (
                                            'Redeem Reward'
                                        )}
                                    </button>
                                </div>
                            ))}
                            {redemptionConfigs.length === 0 && (
                                <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                                    No rewards available at the moment.
                                </div>
                            )}
                        </div>

                        {/* Redemption History */}
                        {redemptionHistory.length > 0 && (
                            <div className="mt-8">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Redemptions</h3>
                                <div className="space-y-3">
                                    {redemptionHistory.slice(0, 5).map((redemption) => (
                                        <div
                                            key={redemption._id}
                                            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl"
                                        >
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-white">{redemption.rewardName}</div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {new Date(redemption.createdAt).toLocaleDateString()} • {redemption.pointsCost} points
                                                </div>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                redemption.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                redemption.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                            }`}>
                                                {redemption.status}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Top Up Modal */}
            {showTopUpModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Top Up Wallet</h3>
                            <button
                                onClick={() => setShowTopUpModal(false)}
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition"
                            >
                                <ArrowUpRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
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
                                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-sm"
                                />
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Crown className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    <span className="font-semibold text-blue-900 dark:text-blue-100 text-sm">Transfer Details</span>
                                </div>
                                <div className="text-sm text-blue-700 dark:text-blue-300">
                                    {selectedBank === 'HNB' && (
                                      <div className="bg-white dark:bg-slate-700 rounded-lg p-3">
                                          <p className="font-semibold text-slate-900 dark:text-white">Hatton National Bank (HNB)</p>
                                          <p className="text-xs mt-1">Account: <span className="font-mono font-bold">018021102658</span></p>
                                          <p className="text-xs">Branch: Kandy</p>
                                          <p className="text-xs">Name: S. Kumarasinghe</p>
                                      </div>
                                    )}
                                    {selectedBank === 'Sampath' && (
                                      <div className="bg-white dark:bg-slate-700 rounded-lg p-3">
                                          <p className="font-semibold text-slate-900 dark:text-white">Sampath Bank</p>
                                          <p className="text-xs mt-1">Account: Contact for details</p>
                                          <p className="text-xs">Branch: Wattegama</p>
                                          <p className="text-xs">Name: S. Kumarasinghe</p>
                                      </div>
                                    )}
                                    {selectedBank === 'BOC' && (
                                      <div className="bg-white dark:bg-slate-700 rounded-lg p-3">
                                          <p className="font-semibold text-slate-900 dark:text-white">Bank of Ceylon (BOC)</p>
                                          <p className="text-xs mt-1">Account: <span className="font-mono font-bold">00069058</span></p>
                                          <p className="text-xs">Branch: Kandy</p>
                                          <p className="text-xs">Name: R. Ratnayake</p>
                                      </div>
                                    )}
                                    {selectedBank === 'RDB' && (
                                      <div className="bg-white dark:bg-slate-700 rounded-lg p-3">
                                          <p className="font-semibold text-slate-900 dark:text-white">Regional Development Bank (RDB)</p>
                                          <p className="text-xs mt-1">Account: <span className="font-mono font-bold">409010110698</span></p>
                                          <p className="text-xs">Branch: Kandy</p>
                                          <p className="text-xs">Name: T. Dharmapriya</p>
                                      </div>
                                    )}
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

            {/* Points Redemption Confirmation Modal */}
            {confirmingReward && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                Confirm Points Redemption
                            </h3>
                            <button
                                onClick={() => setConfirmingReward(null)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-100 dark:border-purple-900/40 mb-4">
                            <p className="text-xs text-purple-600 dark:text-purple-300 font-semibold uppercase tracking-wider mb-1">
                                Selected Reward
                            </p>
                            <p className="text-base font-bold text-gray-900 dark:text-white">
                                {confirmingReward.rewardName}
                            </p>
                            <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-900/60 flex items-center justify-between text-xs">
                                <span className="text-gray-600 dark:text-gray-300">Cost:</span>
                                <span className="font-bold text-purple-600 dark:text-purple-400 text-sm">
                                    {confirmingReward.pointsCost} Points
                                </span>
                            </div>
                            <div className="mt-1 flex items-center justify-between text-xs">
                                <span className="text-gray-600 dark:text-gray-300">Current Balance:</span>
                                <span className="font-semibold text-gray-800 dark:text-gray-200">
                                    {userStats?.points || 0} Points
                                </span>
                            </div>
                            <div className="mt-1 flex items-center justify-between text-xs font-semibold">
                                <span className="text-gray-600 dark:text-gray-300">Remaining After:</span>
                                <span className="text-green-600 dark:text-green-400">
                                    {(userStats?.points || 0) - confirmingReward.pointsCost} Points
                                </span>
                            </div>
                        </div>

                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
                            Points will be deducted atomically from your balance. This action cannot be reversed once processed.
                        </p>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleConfirmRedeem}
                                disabled={selectedRewardId === confirmingReward._id}
                                className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl text-sm transition shadow disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {selectedRewardId === confirmingReward._id ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    'Confirm & Redeem'
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setConfirmingReward(null)}
                                disabled={!!selectedRewardId}
                                className="px-4 py-2.5 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Wallet;
