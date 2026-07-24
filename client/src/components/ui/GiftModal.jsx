import React, { useState, useEffect } from 'react';
import { giftAPI, walletAPI } from '../../services/api';
import { X, Heart, Crown, Plus, Wallet } from 'lucide-react';
import { toast } from 'react-toastify';

const GiftModal = ({ isOpen, onClose, recipientId, recipientName }) => {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGift, setSelectedGift] = useState(null);
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [sending, setSending] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [selectedBank, setSelectedBank] = useState('HNB');
  const [paymentSlip, setPaymentSlip] = useState(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchGifts();
      fetchWallet();
    }
  }, [isOpen]);

  const fetchGifts = async () => {
    setLoading(true);
    try {
      const response = await giftAPI.getGifts();
      setGifts(response.data);
    } catch (error) {
      toast.error('Failed to load gifts');
    } finally {
      setLoading(false);
    }
  };

  const fetchWallet = async () => {
    try {
      const response = await walletAPI.getWallet();
      setWalletBalance(response.data.balance || 0);
    } catch (error) {
      console.error('Failed to fetch wallet balance');
    }
  };

  const handleSendGift = async () => {
    if (!selectedGift) {
      toast.error('Please select a gift');
      return;
    }

    if (selectedGift.price > walletBalance) {
      toast.error('Not enough balance! Please top up your wallet.');
      setShowTopUp(true);
      return;
    }

    setSending(true);
    try {
      await giftAPI.sendGift({
        to: recipientId,
        giftId: selectedGift._id,
        message,
        isAnonymous
      });
      toast.success('Gift sent successfully!');
      onClose();
      setSelectedGift(null);
      setMessage('');
      setIsAnonymous(false);
      setWalletBalance(prev => prev - selectedGift.price);
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

    setSubmittingPayment(true);
    try {
      const formData = new FormData();
      formData.append('amount', parseFloat(topUpAmount));
      formData.append('bankName', selectedBank);
      formData.append('paymentSlip', paymentSlip);

      await walletAPI.createPaymentRequest(formData);
      toast.success('Payment request submitted! Admin will approve within 24 hours.');
      setShowTopUp(false);
      setTopUpAmount('');
      setPaymentSlip(null);
      setSelectedBank('HNB');
      fetchWallet(); // Refresh wallet balance
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit payment request');
    } finally {
      setSubmittingPayment(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Send a Gift</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">to {recipientName}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 px-3 py-1.5 rounded-full">
              <Wallet className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">{walletBalance} LKR</span>
            </div>
            <button
              onClick={() => setShowTopUp(true)}
              className="p-2 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 transition"
              title="Top up wallet"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {gifts.map((gift) => (
                <button
                  key={gift._id}
                  onClick={() => setSelectedGift(gift)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedGift?._id === gift._id
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700'
                  }`}
                >
                  <div className="text-4xl mb-2">{gift.emoji}</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{gift.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {gift.price > 0 ? `${gift.price} LKR` : 'Free'}
                  </div>
                  {gift.isRecommended && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-pink-600 dark:text-pink-400">
                      <Heart className="w-3 h-3" />
                      Popular
                    </div>
                  )}
                  {gift.isPremium && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-yellow-600 dark:text-yellow-400">
                      <Crown className="w-3 h-3" />
                      Premium
                    </div>
                  )}
                  {gift.price > walletBalance && (
                    <div className="mt-1 text-xs text-red-500 dark:text-red-400">
                      Need {gift.price - walletBalance} more LKR
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-700 space-y-4">
          {selectedGift && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message (optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a personal message..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-sm resize-none"
                  rows={2}
                  maxLength={200}
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Send anonymously</span>
              </label>

              <button
                onClick={() => {
                  if (selectedGift.price > walletBalance) {
                    setShowTopUp(true);
                  } else {
                    handleSendGift();
                  }
                }}
                disabled={sending}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
                    Sending...
                  </>
                ) : selectedGift.price > walletBalance ? (
                  <>
                    <Wallet className="w-4 h-4" />
                    Top Up to Send
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4" />
                    Send Gift ({selectedGift.price} LKR)
                  </>
                )}
              </button>
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
    </div>
  );
};

export default GiftModal;
