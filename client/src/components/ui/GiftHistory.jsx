import React, { useState, useEffect } from 'react';
import { giftAPI } from '../../services/api';
import { Heart, Calendar, User } from 'lucide-react';
import moment from 'moment';

const GiftHistory = ({ userId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, sent, received

  useEffect(() => {
    fetchHistory();
  }, [filter]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await giftAPI.getGiftHistory(filter);
      setHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch gift history:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['all', 'sent', 'received'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === type
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Gift History List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500" />
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Heart className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No gifts {filter === 'all' ? '' : filter === 'sent' ? 'sent' : 'received'} yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <div
              key={item._id}
              className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-slate-700"
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">{item.gift?.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {item.gift?.name}
                    </span>
                    {item.isAnonymous && (
                      <span className="text-xs bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                        Anonymous
                      </span>
                    )}
                  </div>
                  {item.message && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{item.message}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {filter === 'sent' ? (
                        <span>To: {item.to?.name}</span>
                      ) : (
                        <span>From: {item.from?.name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{moment(item.createdAt).fromNow()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GiftHistory;
