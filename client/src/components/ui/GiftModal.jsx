import React, { useState, useEffect } from 'react';
import { giftAPI, walletAPI, premiumAPI, redemptionAPI } from '../../services/api';
import { X, Heart, Crown, Plus, Wallet, Star, Gift } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const GiftModal = ({ isOpen, onClose, recipientId, recipientName, onGiftSent }) => {
  const { user } = useAuth();
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [giftLoadError, setGiftLoadError] = useState('');
  const [selectedGift, setSelectedGift] = useState(null);
  const [giftRequestKey, setGiftRequestKey] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [sending, setSending] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletCurrency, setWalletCurrency] = useState('LKR');
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [transactionReference, setTransactionReference] = useState('');
  const [selectedBank, setSelectedBank] = useState('HNB');
  const [paymentSlip, setPaymentSlip] = useState(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [showRedeemPremium, setShowRedeemPremium] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [selectedPremiumPlan, setSelectedPremiumPlan] = useState(null);
  const [premiumPlans, setPremiumPlans] = useState([]);
  const [premiumPlansLoading, setPremiumPlansLoading] = useState(false);
  const [premiumPlansError, setPremiumPlansError] = useState('');
  const [redeemingPremium, setRedeemingPremium] = useState(false);
  const [showPremiumGift, setShowPremiumGift] = useState(false);
  const [selectedPremiumGiftPlan, setSelectedPremiumGiftPlan] = useState(null);
  const [premiumGiftRequestKey, setPremiumGiftRequestKey] = useState('');
  const [sendingPremiumGift, setSendingPremiumGift] = useState(false);
  const [premiumRedemptionPointsCost, setPremiumRedemptionPointsCost] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchGifts();
      fetchWallet();
      fetchPremiumPlans();
    }
  }, [isOpen]);

  const fetchGifts = async () => {
    setLoading(true);
    setGiftLoadError('');
    try {
      const response = await giftAPI.getGifts();
      const data = response.data;
      const availableGifts = Array.isArray(data) ? data : data?.gifts;
      if (!Array.isArray(availableGifts)) {
        throw new Error('The gifts service returned an unexpected response.');
      }
      setGifts(availableGifts);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load gifts';
      setGiftLoadError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchWallet = async () => {
    try {
      const response = await walletAPI.getWalletSummary();
      setWalletBalance(response.data.wallet?.balance || 0);
      setWalletCurrency(response.data.wallet?.currency || 'LKR');
      setUserPoints(response.data.userStats?.points || 0);
    } catch (error) {
      console.error('Failed to fetch wallet and points');
    }
  };

  const fetchPremiumPlans = async () => {
    setPremiumPlansLoading(true);
    setPremiumPlansError('');
    try {
      const response = await premiumAPI.getPlans();
      const plans = Array.isArray(response.data) ? response.data : [];
      setPremiumPlans(plans);
      try {
        const res = await redemptionAPI.getConfigs();
        const configs = Array.isArray(res.data) ? res.data : [];
        const premiumConfig = configs.find(c => c.rewardType === 'premium' && c.isActive);
        setPremiumRedemptionPointsCost(premiumConfig?.pointsCost ?? null);
      } catch (_redemptionErr) {
        setPremiumRedemptionPointsCost(null);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to load Premium plans';
      setPremiumPlansError(errorMessage);
      console.error(errorMessage, error);
    } finally {
      setPremiumPlansLoading(false);
    }
  };

  const giftCurrency = (gift) => gift.currency === 'POINTS' ? 'points' : (gift.currency || 'LKR');
  const canAffordGift = (gift) => gift.currency === 'POINTS'
    ? gift.price <= userPoints
    : gift.price <= walletBalance;

  const handleSendGift = async () => {
    if (!selectedGift) {
      toast.error('Please select a gift');
      return;
    }
    if (String(recipientId) === String(user?._id)) {
      toast.error('Cannot send a gift to yourself.');
      return;
    }

    if (!canAffordGift(selectedGift)) {
      if (selectedGift.currency === 'POINTS') {
        toast.error('Not enough reward points to send this gift.');
      } else {
        toast.error('Not enough balance! Please top up your wallet.');
        setShowTopUp(true);
      }
      return;
    }

    setSending(true);
    const requestKey = giftRequestKey || newRequestKey();
    setGiftRequestKey(requestKey);
    try {
      await giftAPI.sendGift({
        to: recipientId,
        giftId: selectedGift._id,
        message,
        isAnonymous,
        idempotencyKey: requestKey,
      });
      toast.success('Gift sent successfully!');
      setSelectedGift(null);
      setGiftRequestKey('');
      setMessage('');
      setIsAnonymous(false);
      await fetchWallet();
      if (onGiftSent) onGiftSent();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send gift');
    } finally {
      setSending(false);
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
    if (!transactionReference.trim()) {
      toast.error('Please enter the bank transaction reference');
      return;
    }

    setSubmittingPayment(true);
    try {
      const formData = new FormData();
      formData.append('amount', parseFloat(topUpAmount));
      formData.append('bankName', selectedBank);
      formData.append('transactionReference', transactionReference.trim());
      formData.append('paymentSlip', paymentSlip);

      await walletAPI.createPaymentRequest(formData);
      toast.success('Payment request submitted! Admin will approve within 24 hours.');
      setShowTopUp(false);
      setTopUpAmount('');
      setTransactionReference('');
      setPaymentSlip(null);
      setSelectedBank('HNB');
      fetchWallet(); // Refresh wallet balance
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit payment request');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const newRequestKey = () => (
    window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );

  const handlePremiumGift = async () => {
    if (!recipientId || !selectedPremiumGiftPlan) {
      toast.error('Choose a recipient and Premium plan');
      return;
    }
    if (String(recipientId) === String(user?._id)) {
      toast.error('Cannot gift Premium to yourself.');
      return;
    }
    if (selectedPremiumGiftPlan.price > walletBalance) {
      toast.error(`Not enough balance! You need ${selectedPremiumGiftPlan.price} ${selectedPremiumGiftPlan.currency || 'LKR'} to gift ${selectedPremiumGiftPlan.name}.`);
      setShowTopUp(true);
      return;
    }

    const requestKey = premiumGiftRequestKey || newRequestKey();
    setPremiumGiftRequestKey(requestKey);
    setSendingPremiumGift(true);
    try {
      await giftAPI.sendPremiumGift({
        to: recipientId,
        planBadge: selectedPremiumGiftPlan.badge,
        idempotencyKey: requestKey,
      });
      toast.success(`${selectedPremiumGiftPlan.name} gifted to ${recipientName}`);
      await fetchWallet();
      setShowPremiumGift(false);
      setSelectedPremiumGiftPlan(null);
      setPremiumGiftRequestKey('');
      if (onGiftSent) onGiftSent();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to gift Premium');
    } finally {
      setSendingPremiumGift(false);
    }
  };

  const handleRedeemPremium = async () => {
    if (!selectedPremiumPlan) {
      toast.error('Please select a premium plan');
      return;
    }

    // Find the redemption config for this plan
    const redemptionConfigs = await redemptionAPI.getConfigs();
    const premiumConfig = redemptionConfigs.data.find(
      config => config.rewardType === 'premium' && config.isActive
    );

    if (!premiumConfig) {
      toast.error('Premium redemption is not available at this time');
      return;
    }

    if (userPoints < premiumConfig.pointsCost) {
      toast.error(`You need ${premiumConfig.pointsCost} points to redeem premium. You have ${userPoints} points.`);
      return;
    }

    setRedeemingPremium(true);
    try {
      await redemptionAPI.redeemPoints({
        rewardType: 'premium',
        rewardId: selectedPremiumPlan._id,
        pointsCost: premiumConfig.pointsCost
      });
      toast.success('Premium redeemed successfully!');
      setShowRedeemPremium(false);
      setSelectedPremiumPlan(null);
      setUserPoints(prev => prev - premiumConfig.pointsCost);
      fetchWallet(); // Refresh wallet
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to redeem premium');
    } finally {
      setRedeemingPremium(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md sm:max-w-2xl max-h-[92vh] sm:max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
          <div className="min-w-0 flex-1 mr-2">
            <h2 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">Send a Gift</h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">to {recipientName}</p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 px-2.5 py-1 rounded-full">
              <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 dark:text-green-400" />
              <span className="text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400">{walletBalance} {walletCurrency}</span>
            </div>
            <div className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 px-2.5 py-1 rounded-full">
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs sm:text-sm font-semibold text-purple-600 dark:text-purple-400">{userPoints} pts</span>
            </div>
            <button
              onClick={() => setShowTopUp(true)}
              className="p-1.5 sm:p-2 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 transition"
              title="Top up wallet"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={() => setShowRedeemPremium(true)}
              className="p-1.5 sm:p-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition"
              title="Redeem premium"
            >
              <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={() => setShowPremiumGift(true)}
              className="p-1.5 sm:p-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 transition"
              title="Gift Premium"
            >
              <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500" />
              <span className="sr-only">Loading gifts</span>
            </div>
          ) : giftLoadError ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Gift className="w-10 h-10 text-gray-400 dark:text-gray-500 mb-3" />
              <p role="alert" className="text-sm text-gray-700 dark:text-gray-300">{giftLoadError}</p>
              <button
                type="button"
                onClick={fetchGifts}
                className="mt-3 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition"
              >
                Retry
              </button>
            </div>
          ) : gifts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Gift className="w-10 h-10 text-gray-400 dark:text-gray-500 mb-3" />
              <p className="font-semibold text-gray-800 dark:text-gray-200">No gifts are available right now</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Please check back soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
              {gifts.map((gift) => (
                <button
                  key={gift._id}
                  onClick={() => {
                    setSelectedGift(gift);
                    setGiftRequestKey('');
                  }}
                  className={`p-2.5 sm:p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center text-center ${
                    selectedGift?._id === gift._id
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700'
                  }`}
                >
                  <div className="text-3xl sm:text-4xl mb-1 sm:mb-2">{gift.emoji}</div>
                  <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate w-full">{gift.name}</div>
                  <div className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {gift.price > 0 ? `${gift.price} ${giftCurrency(gift)}` : 'Free'}
                  </div>
                  {gift.isRecommended && (
                    <div className="flex items-center gap-1 mt-1 text-[10px] sm:text-xs text-pink-600 dark:text-pink-400">
                      <Heart className="w-3 h-3" />
                      Popular
                    </div>
                  )}
                  {gift.isPremium && (
                    <div className="flex items-center gap-1 mt-1 text-[10px] sm:text-xs text-yellow-600 dark:text-yellow-400">
                      <Crown className="w-3 h-3" />
                      Premium
                    </div>
                  )}
                  {!canAffordGift(gift) && (
                    <div className="mt-1 text-[10px] sm:text-xs text-red-500 dark:text-red-400">
                      Need {gift.price - (gift.currency === 'POINTS' ? userPoints : walletBalance)} more {giftCurrency(gift)}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-slate-700 space-y-2.5 sm:space-y-4 flex-shrink-0 bg-white dark:bg-slate-800">
          {selectedGift && (
            <>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message (optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    setGiftRequestKey('');
                  }}
                  placeholder="Add a personal message..."
                  className="w-full px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-xs sm:text-sm resize-none"
                  rows={2}
                  maxLength={200}
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => {
                      setIsAnonymous(e.target.checked);
                      setGiftRequestKey('');
                    }}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Send anonymously</span>
                </label>

                <button
                  onClick={() => {
                    if (!canAffordGift(selectedGift)) {
                      if (selectedGift.currency === 'POINTS') {
                        toast.error('Not enough reward points to send this gift.');
                      } else {
                        setShowTopUp(true);
                      }
                    } else {
                      handleSendGift();
                    }
                  }}
                  disabled={sending}
                  className="flex-1 max-w-[240px] sm:max-w-none bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold hover:from-green-700 hover:to-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-1.5 sm:gap-2"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-t-2 border-b-2 border-white" />
                      Sending...
                    </>
                  ) : !canAffordGift(selectedGift) && selectedGift.currency !== 'POINTS' ? (
                    <>
                      <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      Top Up to Send
                    </>
                  ) : (
                    <>
                      <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      Send Gift ({selectedGift.price} {giftCurrency(selectedGift)})
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Top Up Modal */}
      {showTopUp && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Top Up Wallet</h3>
              <button
                onClick={() => setShowTopUp(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bank transaction reference</label>
                <input
                  type="text"
                  required
                  value={transactionReference}
                  onChange={(e) => setTransactionReference(e.target.value)}
                  placeholder="Enter the reference from your transfer"
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
                {paymentSlip && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Preview:</p>
                    <div className="relative w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <img
                        src={URL.createObjectURL(paymentSlip)}
                        alt="Payment slip preview"
                        className="w-full h-full object-contain"
                      />
                      <button
                        onClick={() => setPaymentSlip(null)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{paymentSlip.name}</p>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
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
              onClick={() => setShowTopUp(false)}
              className="w-full py-3 mt-3 border border-gray-300 dark:border-slate-600 rounded-xl font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Redeem Premium Modal */}
      {showPremiumGift && (
        <div className="fixed inset-0 z-[350] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Gift Premium</h3>
              <button onClick={() => setShowPremiumGift(false)} aria-label="Close Premium gift" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition">
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">To <span className="font-semibold text-gray-900 dark:text-white">{recipientName || 'selected member'}</span></p>
            <div className="space-y-2.5">
              {premiumPlansLoading ? (
                <div className="flex items-center justify-center py-8" role="status" aria-label="Loading Premium plans">
                  <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-amber-500" />
                </div>
              ) : premiumPlansError ? (
                <div className="py-6 text-center" role="alert">
                  <p className="text-sm text-gray-700 dark:text-gray-300">{premiumPlansError}</p>
                  <button type="button" onClick={fetchPremiumPlans} className="mt-3 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600">Retry</button>
                </div>
              ) : premiumPlans.filter((plan) => plan.isActive && ['bronze', 'silver', 'gold'].includes(plan.badge)).length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-600 dark:text-gray-300">No Premium plans are available right now.</p>
              ) : premiumPlans.filter((plan) => plan.isActive && ['bronze', 'silver', 'gold'].includes(plan.badge)).map((plan) => (
                <button
                  key={plan._id}
                  type="button"
                  aria-pressed={selectedPremiumGiftPlan?._id === plan._id}
                  onClick={() => {
                    setSelectedPremiumGiftPlan(plan);
                    setPremiumGiftRequestKey('');
                  }}
                  className={`w-full rounded-xl border-2 p-3.5 text-left transition ${selectedPremiumGiftPlan?._id === plan._id ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20' : 'border-gray-200 dark:border-slate-700 hover:border-amber-300'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-gray-900 dark:text-white">{plan.name}</span>
                    <span className="font-bold text-amber-700 dark:text-amber-400">{plan.price} {plan.currency || 'LKR'}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{plan.durationDays} days of Premium validity</p>
                </button>
              ))}
            </div>
            {selectedPremiumGiftPlan && (
              <div className="mt-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 p-3.5 text-sm text-amber-900 dark:text-amber-200">
                Confirm: gift {selectedPremiumGiftPlan.name} to {recipientName || 'this member'} for {selectedPremiumGiftPlan.price} {selectedPremiumGiftPlan.currency || 'LKR'} ({selectedPremiumGiftPlan.durationDays} days). Any active Premium validity will be extended.
              </div>
            )}
            <button
              type="button"
              onClick={handlePremiumGift}
              disabled={!selectedPremiumGiftPlan || sendingPremiumGift}
              className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:from-amber-600 hover:to-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingPremiumGift ? 'Processing payment...' : selectedPremiumGiftPlan && selectedPremiumGiftPlan.price > walletBalance ? 'Top Up Wallet' : selectedPremiumGiftPlan ? `Confirm Gift · ${selectedPremiumGiftPlan.price} ${selectedPremiumGiftPlan.currency || 'LKR'}` : 'Select a plan'}
            </button>
            <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">Wallet balance: {walletBalance} LKR</p>
          </div>
        </div>
      )}

      {/* Redeem Premium Modal */}
      {showRedeemPremium && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Redeem Premium</h3>
              <button
                onClick={() => setShowRedeemPremium(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
              Use your reward points to unlock premium membership. Select a plan below.
            </p>

            <div className="space-y-3 mb-6">
              {premiumPlans.filter(plan => plan.isActive).map((plan) => (
                <button
                  key={plan._id}
                  onClick={() => setSelectedPremiumPlan(plan)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    selectedPremiumPlan?._id === plan._id
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Crown className={`w-5 h-5 ${
                        plan.badge === 'gold' ? 'text-yellow-500' : 
                        plan.badge === 'silver' ? 'text-gray-400' : 'text-orange-400'
                      }`} />
                      <span className="font-bold text-gray-900 dark:text-white">{plan.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{plan.durationDays} days</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {plan.price} LKR or {plan.durationDays} days
                  </div>
                </button>
              ))}
            </div>

            {selectedPremiumPlan && (
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Your Points</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{userPoints}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Points Required</p>
                    <p className="text-2xl font-bold text-gray-600 dark:text-gray-300">
                      {typeof premiumRedemptionPointsCost === 'number' ? premiumRedemptionPointsCost : '—'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleRedeemPremium}
              disabled={
                !selectedPremiumPlan ||
                redeemingPremium ||
                (typeof premiumRedemptionPointsCost === 'number'
                  ? userPoints < premiumRedemptionPointsCost
                  : true)
              }
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {redeemingPremium ? 'Redeeming...' : 'Redeem Premium'}
            </button>

            <button
              onClick={() => setShowRedeemPremium(false)}
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

export default GiftModal;
