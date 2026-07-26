import React from 'react';
import { Wallet, Sparkles } from 'lucide-react';

const WalletTopupModal = ({ isOpen, topupData, onClose }) => {
  if (!isOpen || !topupData) return null;

  return (
    <div className="fixed inset-0 z-[350] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
          <Wallet className="w-10 h-10 text-white" />
        </div>
        
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="w-6 h-6 text-yellow-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Congratulations!</h2>
          <Sparkles className="w-6 h-6 text-yellow-500" />
        </div>
        
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
          Your wallet has been topped up with <span className="font-bold text-green-600 dark:text-green-400">Rs. {topupData.amount} LKR</span>
        </p>
        
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            💰 Your balance is now updated and ready to use for gifts, premium features, and more!
          </p>
        </div>
        
        <button
          onClick={() => {
            onClose();
            if (topupData.notificationId) {
              // Mark notification as read
              fetch(`${process.env.REACT_APP_API_URL || 'https://kapu-lk-2.onrender.com'}/api/notifications/${topupData.notificationId}/read`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
              }).catch(() => {});
            }
          }}
          className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition shadow-lg"
        >
          Awesome, Thanks!
        </button>
      </div>
    </div>
  );
};

export default WalletTopupModal;
