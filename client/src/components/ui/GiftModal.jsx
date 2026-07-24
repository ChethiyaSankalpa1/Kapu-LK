import React, { useState, useEffect } from 'react';
import { giftAPI } from '../../services/api';
import { X, Heart, Crown } from 'lucide-react';
import { toast } from 'react-toastify';

const GiftModal = ({ isOpen, onClose, recipientId, recipientName }) => {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGift, setSelectedGift] = useState(null);
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchGifts();
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

  const handleSendGift = async () => {
    if (!selectedGift) {
      toast.error('Please select a gift');
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
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send gift');
    } finally {
      setSending(false);
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
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
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
                  {gift.isPremium && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-yellow-600 dark:text-yellow-400">
                      <Crown className="w-3 h-3" />
                      Premium
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
                disabled={sending}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4" />
                    Send Gift
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GiftModal;
