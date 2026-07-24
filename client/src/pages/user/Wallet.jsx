import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { walletAPI, achievementAPI, giftAPI } from '../../services/api';
import { toast } from 'react-toastify';
import {
    Crown, Wallet, Trophy, Flame, Gift, ArrowUpRight, History,
    Plus, CreditCard, RefreshCw, Star, TrendingUp
} from 'lucide-react';

const Wallet = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [wallet, setWallet] = useState(null);
    const [userStats, setUserStats] = useState(null);
    const [achievements, setAchievements] = useState([]);
    const [gifts, setGifts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTopUpModal, setShowTopUpModal] = useState(false);
    const [topUpAmount, setTopUpAmount] = useState('');
    const [selectedBank, setSelectedBank] = useState('HNB');
    const [paymentSlip, setPaymentSlip] = useState(null);
    const [submittingPayment, setSubmittingPayment] = useState(false);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [walletRes, statsRes, achievementsRes, giftsRes, transactionsRes] = await Promise.all([
                walletAPI.getWallet(),
                achievementAPI.getMyStats(),
                achievementAPI.getAchievements(),
                giftAPI.getGifts(),
                walletAPI.getTransactions()
            ]);
            setWallet(walletRes.data);
            setUserStats(statsRes.data);
            setAchievements(achievementsRes.data);
            setGifts(giftsRes.data);
            setTransactions(transactionsRes.data.transactions || []);
        } catch (error) {
            toast.error('Failed to load wallet data');
        } finally {
            setLoading(false);
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
            fetchAllData();
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
            fetchAllData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Check-in failed');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
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
                                <Wallet className="w-8 h-8 text-white" />
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

                {/* Achievements */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm mb-8">
                    <div className="flex items-center gap-2 p-6 border-b border-gray-200 dark:border-slate-700">
                        <Trophy className="w-6 h-6 text-yellow-500" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Achievements</h2>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {achievements.filter(a => a.earned).map((achievement) => (
                                <div
                                    key={achievement._id}
                                    className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 text-center"
                                    title={achievement.name}
                                >
                                    <div className="text-4xl mb-2">{achievement.icon}</div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{achievement.name}</div>
                                </div>
                            ))}
                            {achievements.filter(a => a.earned).length === 0 && (
                                <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                                    No achievements yet. Keep active to earn badges!
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Available Gifts */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
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
            </div>

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
                                <ArrowUpRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />
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

export default Wallet;
