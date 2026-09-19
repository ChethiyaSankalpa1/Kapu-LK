import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { walletAPI, achievementAPI, giftAPI, redemptionAPI } from '../../services/api';
import { toast } from 'react-toastify';
import {
    Crown, Wallet as WalletIcon, Trophy, Flame, Gift, ArrowUpRight, History,
    Plus, CreditCard, RefreshCw, Star, TrendingUp, Sparkles, X, Copy, Check,
    Building, Smartphone, Zap, AlertCircle, ShieldCheck, ArrowDownLeft, Clock
} from 'lucide-react';
import { WalletSkeleton } from '../../components/ui/SkeletonLoader';

const TOPUP_METHODS = [
    { id: 'bank_transfer', label: 'Bank Transfer', icon: Building },
    { id: 'ez_cash', label: 'eZ Cash', icon: Smartphone },
    { id: 'binance', label: 'Binance Pay', icon: Zap },
];

const BANK_ACCOUNTS = [
    {
        key: 'sampath',
        bankName: 'Sampath Bank',
        accountNumber: '110552360840',
        accountHolder: 'S. Kumarasinghe',
        branch: 'Wattegama',
    },
    {
        key: 'hnb',
        bankName: 'Hatton National Bank (HNB)',
        accountNumber: '018021102658',
        accountHolder: 'S. Kumarasinghe',
        branch: 'Kandy',
    },
    {
        key: 'boc',
        bankName: 'Bank of Ceylon (BOC)',
        accountNumber: '00069058',
        accountHolder: 'R. Ratnayake',
        branch: 'Kandy',
    },
    {
        key: 'rdb',
        bankName: 'Regional Development Bank (RDB)',
        accountNumber: '409010110698',
        accountHolder: 'T. Dharmapriya',
        branch: 'Kandy',
    },
];

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
    { _id: 'def_1', name: '🌅 Daily Check-in', description: 'Log in to LoveLK daily', icon: '🌅', points: 5, target: 1, progress: 0, earned: false },
    { _id: 'def_2', name: '💬 Social Butterfly', description: 'Send 10 messages in chat', icon: '💬', points: 15, target: 10, progress: 0, earned: false },
    { _id: 'def_3', name: '🎁 Generous Heart', description: 'Send a gift to a match', icon: '🎁', points: 20, target: 1, progress: 0, earned: false },
    { _id: 'def_4', name: '🔥 7-Day Streak', description: 'Log in 7 consecutive days', icon: '🔥', points: 50, target: 7, progress: 0, earned: false },
    { _id: 'def_5', name: '👑 Royal Supporter', description: 'Send 5 gifts to matches', icon: '👑', points: 75, target: 5, progress: 0, earned: false }
];

const Wallet = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [wallet, setWallet] = useState(null);
    const [userStats, setUserStats] = useState(null);
    const [achievements, setAchievements] = useState(DEFAULT_ACHIEVEMENTS_LIST);
    const [gifts, setGifts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [txFilter, setTxFilter] = useState('all');
    const [redemptionConfigs, setRedemptionConfigs] = useState(DEFAULT_REDEMPTION_OPTIONS);
    const [redemptionHistory, setRedemptionHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    // Top up modal states
    const [showTopUpModal, setShowTopUpModal] = useState(false);
    const [topUpMethod, setTopUpMethod] = useState('bank_transfer');
    const [selectedBank, setSelectedBank] = useState('Sampath Bank');
    const [topUpAmount, setTopUpAmount] = useState('');
    const [payerName, setPayerName] = useState(user?.name || '');
    const [payerPhone, setPayerPhone] = useState(user?.phoneNumber || '');
    const [transactionReference, setTransactionReference] = useState('');
    const [topUpNotes, setTopUpNotes] = useState('');
    const [paymentSlip, setPaymentSlip] = useState(null);
    const [slipPreview, setSlipPreview] = useState(null);
    const [submittingPayment, setSubmittingPayment] = useState(false);
    const [copiedKey, setCopiedKey] = useState(null);

    // Redemption modal states
    const [selectedRewardId, setSelectedRewardId] = useState(null);
    const [confirmingReward, setConfirmingReward] = useState(null);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [summaryRes, reqsRes] = await Promise.all([
                walletAPI.getWalletSummary(),
                walletAPI.getPaymentRequests().catch(() => ({ data: [] })),
            ]);
            const summary = summaryRes.data || {};
            setWallet(summary.wallet);
            setUserStats(summary.userStats);
            setTransactions(summary.transactions || []);
            setPendingRequests(reqsRes.data || []);
            setLoading(false);

            // Load secondary items in background
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
            const [summaryRes, reqsRes] = await Promise.all([
                walletAPI.getWalletSummary(),
                walletAPI.getPaymentRequests().catch(() => ({ data: [] })),
            ]);
            const summary = summaryRes.data || {};
            setWallet(summary.wallet);
            setUserStats(summary.userStats);
            setTransactions(summary.transactions || []);
            setPendingRequests(reqsRes.data || []);
        } catch (error) {
            // Silent catch
        }
    };

    const handleCopy = (text, key) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        toast.info(`Copied: ${text}`);
        setTimeout(() => setCopiedKey(null), 2500);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be under 5MB');
            return;
        }

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            toast.error('Only JPG, PNG, and WebP images are allowed');
            return;
        }

        setPaymentSlip(file);
        const reader = new FileReader();
        reader.onloadend = () => setSlipPreview(reader.result);
        reader.readAsDataURL(file);
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        const parsedAmount = parseFloat(topUpAmount);
        if (!parsedAmount || isNaN(parsedAmount) || parsedAmount < 100) {
            toast.error('Minimum top-up amount is 100 LKR');
            return;
        }

        if (!transactionReference?.trim()) {
            toast.error('Please enter the Transaction Reference ID');
            return;
        }

        if (!paymentSlip) {
            toast.error('Please upload your payment receipt or transfer slip');
            return;
        }

        setSubmittingPayment(true);
        try {
            const bankTitle = topUpMethod === 'ez_cash'
                ? 'eZ Cash'
                : topUpMethod === 'binance'
                ? 'Binance'
                : selectedBank;

            const formData = new FormData();
            formData.append('amount', parsedAmount);
            formData.append('paymentMethod', topUpMethod);
            formData.append('bankName', bankTitle);
            formData.append('payerName', payerName || user?.name || '');
            formData.append('payerPhone', (payerPhone || user?.phoneNumber || '').replace(/\D/g, ''));
            formData.append('transactionReference', transactionReference.trim());
            formData.append('paymentSlip', paymentSlip);
            if (topUpNotes) formData.append('notes', topUpNotes);

            await walletAPI.createPaymentRequest(formData);
            toast.success('Top-up request submitted successfully! Your funds will be credited upon admin verification.');
            setShowTopUpModal(false);
            setTopUpAmount('');
            setTransactionReference('');
            setPaymentSlip(null);
            setSlipPreview(null);
            setTopUpNotes('');
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
            toast.success('Check-in successful! +10 Points earned');
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

    // Filter transactions
    const filteredTransactions = transactions.filter((tx) => {
        if (txFilter === 'deposits') return tx.type === 'deposit';
        if (txFilter === 'purchases') return tx.type === 'purchase';
        if (txFilter === 'rewards') return tx.type === 'reward' || tx.type === 'bonus';
        return true;
    });

    if (loading) {
        return <WalletSkeleton />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 dark:from-slate-950 dark:via-purple-950/20 dark:to-slate-900 py-6 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto">
                {/* Header with Title & Action CTAs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold text-xs uppercase tracking-wider mb-2">
                            <WalletIcon className="w-3.5 h-3.5" />
                            <span>LoveLK Financial Hub</span>
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                            Wallet & Balances
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-0.5">
                            Manage your cash balance, send gifts, redeem points, and top up securely.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowTopUpModal(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-bold hover:from-emerald-700 hover:to-teal-700 transition shadow-lg shadow-emerald-500/20 text-xs sm:text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add Funds / Top Up</span>
                        </button>

                        <button
                            onClick={() => navigate('/premium')}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold hover:from-purple-700 hover:to-pink-700 transition shadow-lg shadow-purple-500/20 text-xs sm:text-sm"
                        >
                            <Crown className="w-4 h-4 text-yellow-300" />
                            <span>Buy Premium</span>
                        </button>
                    </div>
                </div>

                {/* Primary Balance Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Wallet Balance Card */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-pink-600 to-rose-500 rounded-3xl p-6 sm:p-8 text-white shadow-2xl shadow-purple-500/20">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                    <WalletIcon className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-white/90 text-sm font-bold uppercase tracking-wider">Available Cash</span>
                            </div>

                            <button
                                onClick={fetchSummaryOnly}
                                className="p-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm transition"
                                title="Refresh balance"
                            >
                                <RefreshCw className="w-4 h-4 text-white" />
                            </button>
                        </div>

                        <div className="text-4xl sm:text-5xl font-black mb-2 tracking-tight">
                            Rs. {wallet?.balance?.toLocaleString() || 0}
                        </div>
                        <div className="text-white/80 text-xs font-semibold flex items-center justify-between">
                            <span>Sri Lankan Rupees (LKR)</span>
                            <span className="bg-white/20 px-3 py-1 rounded-full text-[11px]">Instant Checkout Enabled</span>
                        </div>
                    </div>

                    {/* Reward Points Card */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl shadow-indigo-500/20">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                    <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                                </div>
                                <span className="text-white/90 text-sm font-bold uppercase tracking-wider">Reward Points</span>
                            </div>

                            <button
                                onClick={handleDailyCheckIn}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-xl text-xs font-extrabold transition shadow-md"
                            >
                                <Flame className="w-4 h-4 text-orange-600 fill-orange-600" />
                                <span>Daily Check-in (+10)</span>
                            </button>
                        </div>

                        <div className="text-4xl sm:text-5xl font-black mb-2 tracking-tight">
                            {userStats?.points || 0}
                        </div>
                        <div className="text-white/80 text-xs font-semibold flex items-center justify-between">
                            <span>Earn points via logins & activities</span>
                            <span className="bg-white/20 px-3 py-1 rounded-full text-[11px]">Redeem for Cash/VIP</span>
                        </div>
                    </div>
                </div>

                {/* Lifetime Activity Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    <div className="glass-card p-4 rounded-2xl">
                        <div className="flex items-center gap-2 mb-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                            <span>Total Deposits</span>
                        </div>
                        <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                            Rs. {wallet?.totalDeposited?.toLocaleString() || 0}
                        </p>
                    </div>

                    <div className="glass-card p-4 rounded-2xl">
                        <div className="flex items-center gap-2 mb-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                            <CreditCard className="w-4 h-4 text-rose-500" />
                            <span>Total Spent</span>
                        </div>
                        <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                            Rs. {wallet?.totalSpent?.toLocaleString() || 0}
                        </p>
                    </div>

                    <div className="glass-card p-4 rounded-2xl">
                        <div className="flex items-center gap-2 mb-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                            <Flame className="w-4 h-4 text-amber-500" />
                            <span>Login Streak</span>
                        </div>
                        <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                            {userStats?.loginStreak || 0} Days
                        </p>
                    </div>

                    <div className="glass-card p-4 rounded-2xl">
                        <div className="flex items-center gap-2 mb-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                            <Gift className="w-4 h-4 text-pink-500" />
                            <span>Gifts Sent</span>
                        </div>
                        <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                            {userStats?.totalGiftsSent || 0}
                        </p>
                    </div>
                </div>

                {/* Pending Top-Up Requests Alert (if any) */}
                {pendingRequests.filter(r => r.status === 'pending').length > 0 && (
                    <div className="mb-8 p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center shrink-0">
                                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm sm:text-base text-amber-900 dark:text-amber-200">
                                    You have {pendingRequests.filter(r => r.status === 'pending').length} Pending Top-Up Request(s)
                                </h4>
                                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                                    Our admin team verifies transfer slips within 24 hours. Your wallet will be credited automatically.
                                </p>
                            </div>
                        </div>

                        <span className="px-3.5 py-1.5 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 text-xs font-bold uppercase tracking-wider">
                            In Review
                        </span>
                    </div>
                )}

                {/* Transaction History Section */}
                <div className="glass-card rounded-3xl p-6 sm:p-8 mb-10 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
                        <div className="flex items-center gap-2.5">
                            <History className="w-5 h-5 text-purple-600" />
                            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                                Transaction History
                            </h2>
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                            {[
                                { id: 'all', label: 'All' },
                                { id: 'deposits', label: 'Top-ups' },
                                { id: 'purchases', label: 'Purchases' },
                                { id: 'rewards', label: 'Rewards' },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setTxFilter(tab.id)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                                        txFilter === tab.id
                                            ? 'bg-purple-600 text-white shadow-sm'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {filteredTransactions.length > 0 ? (
                        <div className="space-y-3">
                            {filteredTransactions.map((tx) => {
                                const isPositive = tx.type === 'deposit' || tx.type === 'reward' || tx.type === 'bonus';
                                return (
                                    <div
                                        key={tx._id}
                                        className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-purple-200 transition"
                                    >
                                        <div className="flex items-center gap-3.5 min-w-0">
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                                                isPositive
                                                    ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                                                    : 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                                            }`}>
                                                {isPositive ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                            </div>

                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                                                    {tx.description || tx.type?.toUpperCase()}
                                                </p>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                                    {new Date(tx.createdAt).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <p className={`font-black text-xs sm:text-sm ${
                                                isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                                            }`}>
                                                {isPositive ? '+' : '-'} Rs. {tx.amount?.toLocaleString() || 0}
                                            </p>
                                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                                                {tx.status || 'Completed'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                            <History className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                            <p className="text-xs sm:text-sm font-semibold">No transactions recorded under this filter.</p>
                        </div>
                    )}
                </div>

                {/* Daily Tasks & Achievements */}
                <div className="glass-card rounded-3xl p-6 sm:p-8 mb-10 shadow-sm">
                    <div className="flex items-center justify-between mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
                        <div className="flex items-center gap-2.5">
                            <Trophy className="w-5 h-5 text-amber-500" />
                            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                                Daily Tasks & Milestones
                            </h2>
                        </div>
                        <span className="text-xs font-bold px-3 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 rounded-full">
                            Earn points every day
                        </span>
                    </div>

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
                                            ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-300 dark:border-amber-700 shadow-sm'
                                            : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-3xl">{achievement.icon || '🏆'}</span>
                                            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-md">
                                                +{achievement.points || 10} pts
                                            </span>
                                        </div>
                                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                                            {achievement.name}
                                        </h3>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                            {achievement.description}
                                        </p>
                                    </div>

                                    <div className="mt-4">
                                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                                            <span>{achievement.earned ? 'Unlocked 🏆' : 'Progress'}</span>
                                            <span>{achievement.earned ? 'Completed' : `${progress} / ${target}`}</span>
                                        </div>
                                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full transition-all duration-500 ${
                                                    achievement.earned ? 'bg-gradient-to-r from-amber-400 to-yellow-500' : 'bg-purple-600'
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

                {/* Available Gifts */}
                {gifts.length > 0 && (
                    <div className="glass-card rounded-3xl p-6 sm:p-8 mb-10 shadow-sm">
                        <div className="flex items-center gap-2.5 mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
                            <Gift className="w-5 h-5 text-pink-500" />
                            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                                Available Match Gifts
                            </h2>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {gifts.filter(g => g.isActive).map((gift) => (
                                <div
                                    key={gift._id}
                                    className="bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl p-4 text-center border border-slate-100 dark:border-slate-800"
                                >
                                    <div className="text-4xl mb-2">{gift.emoji}</div>
                                    <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">{gift.name}</div>
                                    <div className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-1">Rs. {gift.price}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Points Redemption Grid */}
                <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-sm">
                    <div className="flex items-center gap-2.5 mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                            Redeem Reward Points
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {redemptionConfigs.map((config) => (
                            <div
                                key={config._id}
                                className="bg-gradient-to-br from-purple-50/50 via-white to-pink-50/50 dark:from-slate-800/80 dark:to-purple-950/30 rounded-2xl p-6 border-2 border-purple-100 dark:border-purple-900/50 flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                        <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                                            {config.rewardName}
                                        </h3>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                                        {config.description}
                                    </p>
                                    <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mb-4">
                                        {config.pointsCost} Points
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleInitiateRedeem(config)}
                                    disabled={!!selectedRewardId || (userStats?.points || 0) < config.pointsCost}
                                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm text-xs sm:text-sm"
                                >
                                    {selectedRewardId === config._id ? (
                                        'Redeeming...'
                                    ) : (userStats?.points || 0) < config.pointsCost ? (
                                        `Need ${config.pointsCost - (userStats?.points || 0)} More Pts`
                                    ) : (
                                        'Redeem Now'
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top Up Modal */}
            {showTopUpModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-8 max-h-[92vh] overflow-y-auto border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
                                    <Plus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                                    Add Funds to Wallet
                                </h3>
                            </div>
                            <button
                                onClick={() => setShowTopUpModal(false)}
                                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6">
                            Choose your preferred payment method below, complete the transfer, and upload your payment slip. Funds will be credited after admin review.
                        </p>

                        {/* Method Selector Tabs */}
                        <div className="grid grid-cols-3 gap-2.5 mb-6">
                            {TOPUP_METHODS.map((m) => {
                                const Icon = m.icon;
                                const isCurrent = topUpMethod === m.id;
                                return (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => setTopUpMethod(m.id)}
                                        className={`py-2.5 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition border-2 ${
                                            isCurrent
                                                ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                                                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-emerald-300'
                                        }`}
                                    >
                                        <Icon className="w-3.5 h-3.5 shrink-0" />
                                        <span>{m.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Method 1: Bank Transfer Details */}
                        {topUpMethod === 'bank_transfer' && (
                            <div className="space-y-3.5 mb-6">
                                {/* PROMINENT REMARK NOTICE */}
                                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/60 flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200 font-bold">
                                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                    <span>IMPORTANT: Add TOPUP as the transfer remark/reference.</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {BANK_ACCOUNTS.map((bank) => (
                                        <div
                                            key={bank.key}
                                            onClick={() => setSelectedBank(bank.bankName)}
                                            className={`p-3.5 rounded-2xl border-2 cursor-pointer transition ${
                                                selectedBank === bank.bankName
                                                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30'
                                                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                                            }`}
                                        >
                                            <p className="font-bold text-xs text-slate-900 dark:text-white">{bank.bankName}</p>
                                            <div className="flex items-center justify-between bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg my-1.5 border border-slate-200 dark:border-slate-700">
                                                <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300">{bank.accountNumber}</span>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCopy(bank.accountNumber, `topup_bank_${bank.key}`);
                                                    }}
                                                    className="p-1 rounded text-slate-400 hover:text-slate-600"
                                                >
                                                    {copiedKey === `topup_bank_${bank.key}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                Branch: {bank.branch} • Holder: {bank.accountHolder}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Method 2: eZ Cash Details */}
                        {topUpMethod === 'ez_cash' && (
                            <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[11px] font-bold uppercase text-amber-700 dark:text-amber-300">eZ Cash Number</p>
                                        <h4 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">0764134658</h4>
                                        <p className="text-xs text-slate-500">Holder: LoveLK Official • Add TOPUP in remarks</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleCopy('0764134658', 'topup_ez')}
                                        className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
                                    >
                                        {copiedKey === 'topup_ez' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                        <span>{copiedKey === 'topup_ez' ? 'Copied' : 'Copy'}</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Method 3: Binance Transfer Details */}
                        {topUpMethod === 'binance' && (
                            <div className="mb-6 p-4 rounded-2xl bg-yellow-50 dark:bg-yellow-950/30 border-2 border-yellow-400 dark:border-yellow-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[11px] font-bold uppercase text-yellow-700 dark:text-yellow-300">Binance Pay / UID</p>
                                        <h4 className="text-lg font-black text-slate-900 dark:text-white mt-0.5 font-mono">520375906</h4>
                                        <p className="text-xs text-slate-500">Supported: USDT / BUSD • Add your username in notes</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleCopy('520375906', 'topup_binance')}
                                        className="px-3.5 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
                                    >
                                        {copiedKey === 'topup_binance' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                        <span>{copiedKey === 'topup_binance' ? 'Copied' : 'Copy'}</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Top-up Form */}
                        <form onSubmit={handlePaymentSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Amount to Top Up (LKR) *
                                    </label>
                                    <input
                                        type="number"
                                        min="100"
                                        step="50"
                                        required
                                        value={topUpAmount}
                                        onChange={(e) => setTopUpAmount(e.target.value)}
                                        placeholder="Min. 100 LKR"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-bold"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Transaction / Reference ID *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={transactionReference}
                                        onChange={(e) => setTransactionReference(e.target.value)}
                                        placeholder="e.g. TXN102938 / Ref Number"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Payer Name
                                    </label>
                                    <input
                                        type="text"
                                        value={payerName}
                                        onChange={(e) => setPayerName(e.target.value)}
                                        placeholder="Name on bank slip"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={payerPhone}
                                        onChange={(e) => setPayerPhone(e.target.value)}
                                        placeholder="07XXXXXXXX"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm"
                                    />
                                </div>
                            </div>

                            {/* Slip Upload & Live Preview */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Upload Payment Slip / Screenshot * (Max 5MB)
                                </label>
                                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-4 text-center hover:border-emerald-400 transition bg-slate-50/50 dark:bg-slate-800/30">
                                    <input
                                        type="file"
                                        id="topup-slip"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    <label htmlFor="topup-slip" className="cursor-pointer block">
                                        {slipPreview ? (
                                            <div className="flex flex-col items-center">
                                                <img
                                                    src={slipPreview}
                                                    alt="Slip Preview"
                                                    className="max-h-40 rounded-xl shadow-md mb-2 object-contain"
                                                />
                                                <span className="text-xs text-emerald-600 font-bold hover:underline">
                                                    Click to replace slip image
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="py-2">
                                                <Plus className="w-7 h-7 text-slate-400 mx-auto mb-1.5" />
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                    Click to attach receipt or screenshot
                                                </p>
                                                <p className="text-[10px] text-slate-400 mt-0.5">Supports JPG, PNG, WebP up to 5MB</p>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={submittingPayment}
                                    className="flex-1 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-bold transition disabled:opacity-50 text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                                >
                                    {submittingPayment ? (
                                        'Submitting Request...'
                                    ) : (
                                        <>
                                            <ShieldCheck className="w-4 h-4" />
                                            <span>Submit Top-Up for Verification</span>
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setShowTopUpModal(false)}
                                    className="px-5 py-3.5 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-700 dark:text-slate-300 text-xs sm:text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Points Redemption Confirmation Modal */}
            {confirmingReward && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                <span>Confirm Reward Redemption</span>
                            </h3>
                            <button
                                onClick={() => setConfirmingReward(null)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-2xl border border-purple-100 dark:border-purple-900/40 mb-4">
                            <p className="text-xs text-purple-600 dark:text-purple-300 font-bold uppercase tracking-wider mb-1">
                                Selected Reward
                            </p>
                            <p className="text-base font-bold text-slate-900 dark:text-white">
                                {confirmingReward.rewardName}
                            </p>
                            <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-900/60 flex items-center justify-between text-xs">
                                <span className="text-slate-600 dark:text-slate-300">Cost:</span>
                                <span className="font-bold text-purple-600 dark:text-purple-400 text-sm">
                                    {confirmingReward.pointsCost} Points
                                </span>
                            </div>
                            <div className="mt-1 flex items-center justify-between text-xs">
                                <span className="text-slate-600 dark:text-slate-300">Current Balance:</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {userStats?.points || 0} Points
                                </span>
                            </div>
                            <div className="mt-1 flex items-center justify-between text-xs font-semibold">
                                <span className="text-slate-600 dark:text-slate-300">Remaining After:</span>
                                <span className="text-emerald-600 dark:text-emerald-400">
                                    {(userStats?.points || 0) - confirmingReward.pointsCost} Points
                                </span>
                            </div>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
                            Points will be deducted atomically from your balance. This reward will activate immediately.
                        </p>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleConfirmRedeem}
                                disabled={selectedRewardId === confirmingReward._id}
                                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {selectedRewardId === confirmingReward._id ? (
                                    'Processing...'
                                ) : (
                                    'Confirm & Redeem'
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setConfirmingReward(null)}
                                disabled={!!selectedRewardId}
                                className="px-4 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition"
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
