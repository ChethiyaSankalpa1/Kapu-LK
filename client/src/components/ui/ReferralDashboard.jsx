import React, { useState, useEffect } from 'react';
import { referralAPI } from '../../services/api';
import { Share2, Users, CreditCard, Copy, Check, Gift } from 'lucide-react';
import { toast } from 'react-toastify';

const ReferralDashboard = () => {
  const [referralCode, setReferralCode] = useState(null);
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    setLoading(true);
    try {
      const [codeRes, statsRes, historyRes] = await Promise.all([
        referralAPI.getMyReferralCode(),
        referralAPI.getReferralStats(),
        referralAPI.getReferralHistory()
      ]);
      setReferralCode(codeRes.data);
      setStats(statsRes.data);
      setHistory(historyRes.data);
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/register?ref=${referralCode?.code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = async () => {
    const link = `${window.location.origin}/register?ref=${referralCode?.code}`;
    const text = `Join Kapu LK and find your perfect match! Use my referral code: ${referralCode?.code}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Kapu LK',
          text,
          url: link
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      copyReferralLink();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Referral Code Card */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-white/20 rounded-full">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Invite Friends & Earn Credits</h2>
            <p className="text-purple-100 text-sm">Share your unique referral code</p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-100 mb-1">Your Referral Code</p>
              <p className="text-2xl font-bold tracking-wider">{referralCode?.code || 'Loading...'}</p>
            </div>
            <button
              onClick={copyReferralLink}
              className="p-3 bg-white/20 hover:bg-white/30 rounded-lg transition"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={shareReferral}
            className="flex-1 bg-white text-purple-600 py-3 rounded-xl font-semibold hover:bg-purple-50 transition flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share Link
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-purple-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Referrals</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalReferrals}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Successful</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.successfulReferrals}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Credits Earned</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCreditsEarned}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-orange-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Pending</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingReferrals}</p>
          </div>
        </div>
      )}

      {/* Referral History */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
        <div className="p-4 border-b border-gray-200 dark:border-slate-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Referral History</h3>
        </div>
        <div className="p-4">
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No referrals yet. Start sharing your code!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {item.referred?.name || 'Anonymous User'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      item.status === 'completed' || item.status === 'rewarded'
                        ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                        : item.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400'
                    }`}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                    {item.creditsEarned > 0 && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">+{item.creditsEarned} credits</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReferralDashboard;
