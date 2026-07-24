import React, { useState, useEffect } from 'react';
import { giftAPI, achievementAPI } from '../../services/api';
import { X, Heart, Crown, Plus, Zap } from 'lucide-react';
import { toast } from 'react-toastify';

const GiftModal = ({ isOpen, onClose, recipientId, recipientName }) => {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGift, setSelectedGift] = useState(null);
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [sending, setSending] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [showTopUp, setShowTopUp] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchGifts();
      fetchUserPoints();
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

  const fetchUserPoints = async () => {
    try {
      const response = await achievementAPI.getMyStats();
      setUserPoints(response.data.stats.points);
    } catch (error) {
      console.error('Failed to fetch user points');
    }
  };

  const handleSendGift = async () => {
    if (!selectedGift) {
      toast.error('Please select a gift');
      return;
    }

    if (selectedGift.price > userPoints) {
      toast.error('Not enough points! Please top up your balance.');
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
      setUserPoints(prev => prev - selectedGift.price);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send gift');
    } finally {
      setSending(false);
    }
  };

  const handleTopUp = (amount) => {
    toast.info('Top-up feature coming soon! For now, earn points by completing daily achievements.');
    setShowTopUp(false);
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
            <div className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 px-3 py-1.5 rounded-full">
              <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">{userPoints} pts</span>
            </div>
            <button
              onClick={() => setShowTopUp(true)}
              className="p-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition"
              title="Top up points"
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
                    {gift.price > 0 ? `${gift.price} pts` : 'Free'}
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
                  {gift.price > userPoints && (
                    <div className="mt-1 text-xs text-red-500 dark:text-red-400">
                      Need {gift.price - userPoints} more pts
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
                onClick={handleSendGift}
                disabled={sending || selectedGift.price > userPoints}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
                    Sending...
                  </>
                ) : selectedGift.price > userPoints ? (
                  <>
                    <Zap className="w-4 h-4" />
                    Top Up to Send
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4" />
                    Send Gift ({selectedGift.price} pts)
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
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Top Up Points</h3>
              <button
                onClick={() => setShowTopUp(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Purchase points to send gifts and unlock premium features. Or earn points by completing daily achievements!
            </p>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleTopUp(100)}
                className="w-full p-4 border-2 border-purple-200 dark:border-purple-700 rounded-xl hover:border-purple-500 dark:hover:border-purple-500 transition flex items-center justify-between"
              >
                <div className="text-left">
                  <div className="font-semibold text-gray-900 dark:text-white">100 Points</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Basic Pack</div>
                </div>
                <div className="text-lg font-bold text-purple-600 dark:text-purple-400">$1.99</div>
              </button>
              
              <button
                onClick={() => handleTopUp(500)}
                className="w-full p-4 border-2 border-purple-200 dark:border-purple-700 rounded-xl hover:border-purple-500 dark:hover:border-purple-500 transition flex items-center justify-between relative"
              >
                <div className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs px-2 py-1 rounded-full">Popular</div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900 dark:text-white">500 Points</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Value Pack</div>
                </div>
                <div className="text-lg font-bold text-purple-600 dark:text-purple-400">$7.99</div>
              </button>
              
              <button
                onClick={() => handleTopUp(1000)}
                className="w-full p-4 border-2 border-purple-200 dark:border-purple-700 rounded-xl hover:border-purple-500 dark:hover:border-purple-500 transition flex items-center justify-between relative"
              >
                <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">Best Value</div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900 dark:text-white">1000 Points</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Premium Pack</div>
                </div>
                <div className="text-lg font-bold text-purple-600 dark:text-purple-400">$14.99</div>
              </button>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span className="font-semibold text-purple-900 dark:text-purple-100">Earn Free Points!</span>
              </div>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Complete daily achievements like check-ins, sending messages, and referring friends to earn points without spending!
              </p>
            </div>

            <button
              onClick={() => setShowTopUp(false)}
              className="w-full py-3 border border-gray-300 dark:border-slate-600 rounded-xl font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
            >
              Maybe Later
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GiftModal;
