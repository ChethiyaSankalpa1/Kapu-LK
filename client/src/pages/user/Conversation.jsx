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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <div className="container mx-auto px-3 sm:px-4 max-w-2xl h-[100dvh] flex flex-col">
        {/* Header */}
        <div className="py-3 px-4 flex items-center justify-between bg-white dark:bg-gray-800 rounded-b-2xl shadow-md border-b border-gray-100 dark:border-gray-700 mb-4 mt-0 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-r from-pink-400 to-purple-600 flex items-center justify-center overflow-hidden shadow">
                {otherUser.profileImageUrl ? (
                  <img
                    src={otherUser.profileImageUrl}
                    alt={otherUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-none">{otherUser.name}</h2>
                  {otherUser.isPremium && <Crown className="w-3.5 h-3.5 text-yellow-500 shrink-0" />}
                  {otherUser.role === 'admin' && <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                </div>
                {otherUser.age && (
                  <p className="text-xs text-gray-550 dark:text-gray-400 mt-0.5">{otherUser.age} years old</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-4 px-1 hide-scrollbar">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1.5">{t('messages.emptyTitle', { defaultValue: 'No messages yet' })}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">{t('messages.emptySubtitle', { defaultValue: 'Send the first message to start a conversation!' })}</p>
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
                    className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-sm ${isCurrentUser
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-none'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-none border border-gray-100 dark:border-gray-700'
                      }`}
                  >
                    <p className="text-sm leading-relaxed mb-1.5 break-words">{msg.content}</p>
                    <div className={`flex items-center gap-1.5 text-[10px] ${isCurrentUser ? 'text-purple-100' : 'text-gray-400'
                      }`}>
                      <Clock className="w-3 h-3" />
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isCurrentUser && (
                        <CheckCircle2 className="w-3 h-3 text-purple-200" />
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
        <form onSubmit={handleSendMessage} className="pb-4 shrink-0">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-2.5 flex gap-2.5 items-center">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={t('messages.typeMessage')}
              className="flex-1 bg-gray-55 dark:bg-gray-750 border border-gray-205 dark:border-gray-650 text-gray-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none text-sm min-h-[40px] max-h-[100px]"
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
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl shadow-md transition-all shrink-0 active:scale-95 min-h-[40px]"
              aria-label="Send"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Conversation;
