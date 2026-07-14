import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { messageAPI, userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import {
  ArrowLeft, Send, User, MessageSquare, Crown,
  Clock, CheckCircle2, MoreVertical, Shield
} from 'lucide-react';

const Conversation = () => {
  const { t } = useTranslation();
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isAdmin } = useAuth();
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const fetchData = async () => {
    try {
      const [messagesRes, userRes] = await Promise.all([
        messageAPI.getConversationWithUser(userId),
        userAPI.getUserById(userId)
      ]);
      setMessages(messagesRes.data);
      setOtherUser(userRes.data);
    } catch (error) {
      toast.error(t('messages.loadFailed', { defaultValue: 'Failed to load conversation' }));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    setSending(true);
    try {
      await messageAPI.sendMessage({
        to: userId,
        content: messageText.trim(),
        type: 'text'
      });
      toast.success(t('messages.sentSuccess', { defaultValue: 'Message sent!' }));
      setMessageText('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || t('messages.sendFailed', { defaultValue: 'Failed to send message' }));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-600"></div>
      </div>
    );
  }

  if (!otherUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t('common.userNotFound', { defaultValue: 'User not found' })}</h1>
        <Link
          to="/"
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-lg"
        >
          {t('common.goHome', { defaultValue: 'Go Home' })}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 max-w-4xl h-screen flex flex-col">
        {/* Header */}
        <div className="py-6 flex items-center justify-between bg-white dark:bg-gray-800 rounded-b-3xl shadow-xl border-b border-gray-100 dark:border-gray-700 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-all"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-gradient-to-r from-pink-400 to-purple-600 flex items-center justify-center overflow-hidden shadow-lg">
                {otherUser.profileImageUrl ? (
                  <img
                    src={otherUser.profileImageUrl}
                    alt={otherUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-white" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{otherUser.name}</h2>
                  {otherUser.isPremium && <Crown className="w-4 h-4 text-yellow-500" />}
                  {otherUser.role === 'admin' && <Shield className="w-4 h-4 text-blue-600" />}
                </div>
                {otherUser.age && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{otherUser.age} years old</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-6 pb-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="w-24 h-24 text-gray-300 dark:text-gray-600 mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('messages.emptyTitle', { defaultValue: 'No messages yet' })}</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md">{t('messages.emptySubtitle', { defaultValue: 'Send the first message to start a conversation!' })}</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isCurrentUser = msg.from._id === currentUser._id || msg.from === currentUser._id;
              return (
                <div
                  key={msg._id || index}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] p-5 rounded-2xl shadow-lg ${isCurrentUser
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-sm'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-sm border border-gray-100 dark:border-gray-700'
                      }`}
                  >
                    <p className="text-base leading-relaxed mb-2">{msg.content}</p>
                    <div className={`flex items-center gap-2 text-xs ${isCurrentUser ? 'text-purple-100' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                      <Clock className="w-3 h-3" />
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isCurrentUser && (
                        <CheckCircle2 className="w-3 h-3" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className="pb-6">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-4 flex gap-4 items-end">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={t('messages.typeMessage')}
              className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-2xl px-5 py-4 focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 outline-none resize-none transition-all"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={sending || !messageText.trim()}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-4 rounded-2xl shadow-lg transition-all transform hover:scale-105 active:scale-95"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Conversation;
