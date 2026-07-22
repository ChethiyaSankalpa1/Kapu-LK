import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { messageAPI, userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import moment from 'moment';
import {
  ArrowLeft, Send, User, MessageSquare, Crown,
  Check, CheckCheck, Shield, Smile, Paperclip,
  Image, Search, X, Edit2, Trash2, MoreVertical
} from 'lucide-react';

const Conversation = () => {
  const { t } = useTranslation();
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  // Conversations List State
  const [conversations, setConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [listLoading, setListLoading] = useState(true);

  // Active Chat State
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  
  // Cache for chat data
  const chatCacheRef = useRef(new Map());

  // UI Interactive States
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');
  const [showMessageMenu, setShowMessageMenu] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
      }
    }, 100);
  }, []);

  // Fetch all conversations for the sidebar
  const fetchConversationsList = useCallback(async (silent = false) => {
    if (!silent) setListLoading(true);
    try {
      const response = await messageAPI.getConversations();
      setConversations(response.data || []);
    } catch (error) {
      console.error('Failed to load conversations list', error);
    } finally {
      if (!silent) setListLoading(false);
    }
  }, []);

  const prevMsgCountRef = useRef(0);

  // Fetch messages for the active conversation
  const fetchChatMessages = useCallback(async (silent = false, page = 1) => {
    if (!userId) return;
    if (!silent) setChatLoading(true);
    try {
      // Check cache first
      const cacheKey = `${userId}_page_${page}`;
      if (chatCacheRef.current.has(cacheKey) && page === 1) {
        const cached = chatCacheRef.current.get(cacheKey);
        const cacheAge = Date.now() - cached.timestamp;
        // Use cache if less than 30 seconds old
        if (cacheAge < 30000) {
          setMessages(cached.messages);
          setOtherUser(cached.otherUser);
          prevMsgCountRef.current = cached.messages.length;
          if (!silent) setChatLoading(false);
          return;
        }
      }

      const [messagesRes, userRes] = await Promise.all([
        messageAPI.getConversationWithUser(userId, page),
        userAPI.getUserById(userId)
      ]);

      const response = messagesRes.data;
      const newMsgs = response.messages || [];
      
      // Update cache
      chatCacheRef.current.set(cacheKey, {
        messages: newMsgs,
        otherUser: userRes.data,
        timestamp: Date.now(),
      });
      
      // Clean old cache entries (keep only last 5 per user)
      const userCacheKeys = Array.from(chatCacheRef.current.keys())
        .filter(key => key.startsWith(userId))
        .sort((a, b) => {
          const pageA = parseInt(a.split('_page_')[1]);
          const pageB = parseInt(b.split('_page_')[1]);
          return pageB - pageA;
        });
      
      userCacheKeys.slice(5).forEach(key => chatCacheRef.current.delete(key));
      
      // Simulate typing indicator if there is a new message from the other user
      if (prevMsgCountRef.current > 0 && newMsgs.length > prevMsgCountRef.current) {
        const lastMsg = newMsgs[newMsgs.length - 1];
        const isFromOther = lastMsg.from._id === userId || lastMsg.from === userId;
        
        if (isFromOther) {
          setIsTyping(true);
          scrollToBottom('smooth');
          setTimeout(() => {
            setMessages(newMsgs);
            prevMsgCountRef.current = newMsgs.length;
            setIsTyping(false);
            scrollToBottom('smooth');
          }, 1500);
          setOtherUser(userRes.data);
          return;
        }
      }

      setMessages(newMsgs);
      prevMsgCountRef.current = newMsgs.length;
      setOtherUser(userRes.data);
    } catch (error) {
      console.error('Failed to load chat messages', error);
    } finally {
      if (!silent) setChatLoading(false);
    }
  }, [userId, scrollToBottom]);

  // Initial load
  useEffect(() => {
    fetchConversationsList();
  }, [fetchConversationsList]);

  // Load chat on userId change
  useEffect(() => {
    if (userId) {
      setMessages([]);
      prevMsgCountRef.current = 0;
      setOtherUser(null);
      fetchChatMessages(false);
      setShowEmojiPicker(false);
    }
  }, [userId, fetchChatMessages]);

  // Scroll to bottom on messages change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom('auto');
    }
  }, [messages.length, scrollToBottom]);

  // Set up polling interval for real-time update
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversationsList(true);
      if (userId) {
        fetchChatMessages(true);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [userId, fetchConversationsList, fetchChatMessages]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!messageText.trim()) return;

    const textToSend = messageText.trim();
    setMessageText('');
    setShowEmojiPicker(false);

    // Generate unique ID for this message
    const tempId = `${currentUser._id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Optimistically add message
    const optimisticMsg = {
      _id: tempId,
      from: currentUser._id,
      to: userId,
      content: textToSend,
      type: 'text',
      createdAt: new Date().toISOString(),
      isRead: false,
      isOptimistic: true
    };

    setMessages(prev => {
      // Check for duplicates by content and recent timestamp
      const isDuplicate = prev.some(msg => 
        msg.content === textToSend && 
        msg.from === currentUser._id &&
        Date.now() - new Date(msg.createdAt).getTime() < 5000
      );
      
      if (isDuplicate) return prev;
      return [...prev, optimisticMsg];
    });
    scrollToBottom('smooth');
    setSending(true);

    try {
      await messageAPI.sendMessage({
        to: userId,
        content: textToSend,
        type: 'text'
      });
      
      // Remove optimistic message - polling will handle refresh
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
      
      // Invalidate cache for this conversation
      const cacheKey = `${userId}_page_1`;
      chatCacheRef.current.delete(cacheKey);
    } catch (error) {
      toast.error(error.response?.data?.message || t('toast.messaging.sendFailed'));
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
      setMessageText(textToSend);
    } finally {
      setSending(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(t('toast.messaging.invalidImageType'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('toast.messaging.imageTooLarge'));
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setUploadingImage(true);
    try {
      const uploadRes = await messageAPI.uploadChatImage(formData);
      const imageUrl = uploadRes.data.imageUrl;

      // Send the image message
      await messageAPI.sendMessage({
        to: userId,
        content: imageUrl,
        type: 'image'
      });

      fetchChatMessages(true);
      fetchConversationsList(true);
      toast.success(t('toast.messaging.imageSendSuccess'));
    } catch (error) {
      toast.error(error.response?.data?.message || t('toast.messaging.imageUploadFailed'));
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const insertEmoji = (emoji) => {
    setMessageText(prev => prev + emoji);
  };

  const handleEditMessage = (message) => {
    setEditingMessage(message);
    setEditText(message.content);
    setMessageText(message.content);
    setShowMessageMenu(null);
  };

  const handleSaveEdit = async () => {
    if (!editingMessage || !editText.trim()) return;

    try {
      await messageAPI.editMessage(editingMessage._id, { content: editText.trim() });
      setMessages(prev => prev.map(msg => 
        msg._id === editingMessage._id 
          ? { ...msg, content: editText.trim(), edited: true }
          : msg
      ));
      setEditingMessage(null);
      setEditText('');
      setMessageText('');
      toast.success('Message edited successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to edit message');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await messageAPI.deleteMessage(messageId);
      setMessages(prev => prev.map(msg => 
        msg._id === messageId 
          ? { ...msg, deleted: true, content: 'This message was deleted.' }
          : msg
      ));
      setShowMessageMenu(null);
      toast.success('Message deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete message');
    }
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setEditText('');
    setMessageText('');
  };

  const getOnlineStatusText = (userObj) => {
    if (!userObj) return '';
    if (userObj.isOnline) return 'Online';
    if (userObj.lastLogin) {
      const lastActive = moment(userObj.lastLogin);
      if (moment().diff(lastActive, 'minutes') < 5) return 'Online';
      return `Last active ${lastActive.fromNow()}`;
    }
    return 'Offline';
  };

  const isUserOnline = (userObj) => {
    if (!userObj) return false;
    // Only return true if explicitly marked as online
    if (userObj.isOnline === true) return true;
    // Don't assume online based on lastLogin - this was causing false positives
    return false;
  };

  // Popular emojis list for light-weight picker
  const popularEmojis = [
    '😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰',
    '😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','😎','🤩','🥳','😏','😒',
    '😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡',
    '🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🫣','🤭','🤫','🙏',
    '👍','👎','👊','✊','🤛','🤜','🤞','🤟','🤘','👌','👋','💪','🙏','❤️','🧡','💛',
    '💚','💙','💜','🖤','🤍','💔','🔥','✨','🌟','⭐','🎉','🍕','🍺'
  ];

  // Filter conversations based on query
  const filteredConversations = conversations.filter(c => 
    c.user && c.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[100dvh] md:h-[calc(100vh-4rem)] bg-[#d1dbd4] dark:bg-[#111b21] transition-colors duration-500 overflow-hidden page-transition">
      <div className="h-full flex max-w-7xl mx-auto bg-[#f0f2f5] dark:bg-[#111b21] shadow-2xl overflow-hidden">
        
        {/* ================= SIDEBAR: Conversation List ================= */}
        <div className={`w-full md:w-[360px] lg:w-[400px] flex flex-col h-full border-r border-[#d1d7db] dark:border-[#222d34] shrink-0 bg-white dark:bg-[#111b21] ${
          userId ? 'hidden md:flex' : 'flex'
        }`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-[#d1d7db] dark:border-[#222d34] bg-[#f0f2f5] dark:bg-[#202c33] shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 -ml-2 bg-white dark:bg-[#111b21] hover:bg-slate-100 dark:hover:bg-[#0b141a] rounded-full transition-all"
                aria-label="Back to dashboard"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </button>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#128c7e]" />
                <span>Messages</span>
              </h1>
            </div>
            
            {/* Search Box */}
            <div className="mt-3.5 relative">
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-[#d1d7db] dark:border-[#2a3942] bg-white dark:bg-[#111b21] text-sm text-slate-900 dark:text-white pl-10 pr-10 py-3 outline-none focus:border-[#25d366] transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto chat-scrollbar bg-white dark:bg-[#111b21]">
            {listLoading ? (
              <div className="flex flex-col items-center justify-center h-48 gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500" />
                <span className="text-xs text-slate-400">Loading chats...</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center h-48">
                <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {searchQuery ? 'No chats found matching query' : 'No conversations yet'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {searchQuery ? 'Check spelling or try another name' : 'Start matches or like profiles to message!'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#edf1f3] dark:divide-[#222d34]">
                {filteredConversations.map((c) => {
                  const active = userId === c.user._id;
                  const online = isUserOnline(c.user);
                  return (
                    <button
                      key={c.user._id}
                      onClick={() => navigate(`/conversation/${c.user._id}`)}
                      className={`w-full text-left px-4 py-3.5 flex gap-3.5 items-center transition-all ${
                        active 
                          ? 'bg-[#f0f2f5] dark:bg-[#202c33]'
                          : 'bg-white dark:bg-[#111b21] hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#25d366] to-[#128c7e] flex items-center justify-center overflow-hidden border border-white dark:border-[#2a3942] shadow-sm">
                          {c.user.profileImageUrl ? (
                            <img
                              src={c.user.profileImageUrl}
                              alt={c.user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-lg font-bold text-white uppercase">{c.user.name.charAt(0)}</span>
                          )}
                        </div>
                        {online && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#25d366] border-2 border-white dark:border-[#111b21] rounded-full" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                            {c.user.name}
                          </p>
                          {c.lastMessage && (
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap ml-2">
                              {moment(c.lastMessage.createdAt).format('LT')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[190px]">
                            {c.lastMessage?.type === 'image' ? (
                              <span className="flex items-center gap-1 text-[#128c7e] dark:text-[#25d366] font-medium">
                                <Image className="w-3.5 h-3.5" /> Photo
                              </span>
                            ) : c.lastMessage?.type === 'like' ? (
                              <span className="text-pink-500 font-semibold">❤️ Liked profile</span>
                            ) : (
                              c.lastMessage?.content
                            )}
                          </p>
                          {c.unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full bg-[#25d366] text-[#103529] shadow-sm">
                              {c.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ================= WORKSPACE: Message Feed ================= */}
        <div className={`flex-1 flex flex-col h-full bg-[#efeae2] dark:bg-[#0b141a] overflow-hidden ${
          !userId ? 'hidden md:flex items-center justify-center p-8 bg-[#efeae2] dark:bg-[#0b141a]' : 'flex'
        }`}>
          {userId ? (
            <>
              {/* Header */}
              <div className="py-3 px-3 sm:px-4 md:px-5 flex items-center justify-between bg-[#f0f2f5] dark:bg-[#202c33] border-b border-[#d1d7db] dark:border-[#222d34] shrink-0 z-10 min-h-[64px]">
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0">
                  <button
                    onClick={() => navigate('/conversation')}
                    className="p-2 sm:p-2.5 -ml-1 sm:-ml-2 bg-white dark:bg-[#111b21] hover:bg-slate-200 dark:hover:bg-[#0b141a] rounded-full transition-all md:hidden shrink-0 shadow-sm border border-gray-200 dark:border-[#2a3942]"
                    aria-label="Back to conversations list"
                  >
                    <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-slate-800 dark:text-slate-200" />
                  </button>
                  
                  {otherUser ? (
                    <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0">
                      {/* Avatar */}
                      <Link to={`/users/${otherUser._id}`} className="relative block group shrink-0">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-gradient-to-tr from-[#25d366] to-[#128c7e] flex items-center justify-center overflow-hidden border-2 border-white dark:border-[#2a3942] shadow-md group-hover:scale-105 transition-transform">
                          {otherUser.profileImageUrl ? (
                            <img
                              src={otherUser.profileImageUrl}
                              alt={otherUser.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
                          )}
                        </div>
                        {isUserOnline(otherUser) && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 bg-[#25d366] border-2 border-white dark:border-[#111b21] rounded-full" />
                        )}
                      </Link>

                      {/* Name & status */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <Link to={`/users/${otherUser._id}`} className="text-sm sm:text-base md:text-lg font-bold text-slate-900 dark:text-white hover:text-[#128c7e] transition-colors leading-tight truncate block">
                            {otherUser.name || otherUser.profileName || 'Unknown User'}
                          </Link>
                          {otherUser.isPremium && <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500 shrink-0" />}
                          {otherUser.role === 'admin' && <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 shrink-0" />}
                        </div>
                        <span className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 mt-0.5 sm:mt-1 block font-medium">
                          {getOnlineStatusText(otherUser)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium">Loading...</div>
                  )}
                </div>
              </div>

              {/* Messages scroll area */}
              <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 space-y-3 sm:space-y-4 chat-scrollbar whatsapp-chat-bg relative">
                {chatLoading && messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-white/70 dark:bg-[#111b21]/70 rounded-3xl m-4 border border-dashed border-slate-200 dark:border-[#222d34]">
                    <MessageSquare className="w-14 h-14 text-[#7b8b95] dark:text-slate-700 mb-3 animate-pulse" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Say Hello!</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                      Start your matrimonial conversation. Keep it polite, respect privacy, and find your matches.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {messages.map((msg, index) => {
                      const isCurrentUser = msg.from._id === currentUser._id || msg.from === currentUser._id;
                      
                      // Show date headers when day changes
                      const showDateHeader = index === 0 || 
                        moment(msg.createdAt).format('LL') !== moment(messages[index - 1].createdAt).format('LL');

                      return (
                        <div key={msg._id || index} className="space-y-2 animate-slide-up">
                          {showDateHeader && (
                            <div className="flex justify-center my-3">
                              <span className="bg-white/90 dark:bg-[#1f2c34] text-[10px] font-bold text-gray-500 dark:text-gray-400 px-3 py-1 rounded-lg shadow-sm uppercase tracking-wider">
                                {moment(msg.createdAt).calendar(null, {
                                  sameDay: '[Today]',
                                  lastDay: '[Yesterday]',
                                  lastWeek: 'dddd',
                                  sameElse: 'MMMM D, YYYY'
                                })}
                              </span>
                            </div>
                          )}

                          <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] sm:max-w-[78%] md:max-w-[72%] rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-sm relative group ${
                              isCurrentUser
                                ? 'bg-[#d9fdd3] text-gray-900 rounded-tr-sm'
                                : 'bg-white dark:bg-[#202c33] text-gray-900 dark:text-white rounded-tl-sm border border-[#e9edef] dark:border-[#26353d]'
                            }`}>
                              
                              {/* Message Content */}
                              {msg.deleted ? (
                                <p className="text-[13px] sm:text-[14px] italic text-gray-500 dark:text-gray-400">{msg.content}</p>
                              ) : msg.type === 'image' ? (
                                <div className="space-y-1.5">
                                  <img
                                    src={msg.content}
                                    alt="Shared in Chat"
                                    className="rounded-lg max-w-full max-h-[280px] sm:max-h-[320px] object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                    onClick={() => window.open(msg.content, '_blank')}
                                  />
                                </div>
                              ) : msg.type === 'like' ? (
                                <p className="text-xs sm:text-sm italic font-semibold flex items-center gap-1.5 py-1 text-pink-500">
                                  ❤️ Sent you a profile like!
                                </p>
                              ) : (
                                <p className="text-[13px] sm:text-[14px] leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                              )}

                              {/* Message Footer Info */}
                              <div className={`flex items-center justify-end gap-1 text-[11px] mt-1 ${
                                isCurrentUser ? 'text-[#667781]' : 'text-gray-400 dark:text-[#8696a0]'
                              }`}>
                                <span>{moment(msg.createdAt).format('LT')}</span>
                                {msg.edited && <span className="text-[10px] italic">(Edited)</span>}
                                {isCurrentUser && (
                                  msg.isRead ? (
                                    <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] shrink-0" />
                                  ) : (
                                    <Check className="w-3.5 h-3.5 text-[#667781] shrink-0" />
                                  )
                                )}
                              </div>

                              {/* Message Actions Menu - Only for sender and not deleted */}
                              {isCurrentUser && !msg.deleted && (
                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowMessageMenu(showMessageMenu === msg._id ? null : msg._id);
                                    }}
                                    className="p-1.5 rounded-full bg-white/80 dark:bg-slate-700/80 hover:bg-white dark:hover:bg-slate-600 shadow-sm"
                                  >
                                    <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                  </button>
                                  
                                  {showMessageMenu === msg._id && (
                                    <div className="absolute top-8 right-0 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 py-1 min-w-[120px] z-10">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditMessage(msg);
                                        }}
                                        className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                        Edit
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteMessage(msg._id);
                                        }}
                                        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Typing indicator bubble */}
                    {isTyping && (
                      <div className="flex justify-start animate-slide-up">
                        <div className="bg-white dark:bg-[#202c33] rounded-2xl rounded-tl-sm p-3 px-4 border border-[#e9edef] dark:border-[#26353d] shadow-sm flex items-center gap-1">
                          <span className="w-2 h-2 bg-[#8696a0] rounded-full animate-bounce-dots" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-[#8696a0] rounded-full animate-bounce-dots" style={{ animationDelay: '200ms' }} />
                          <span className="w-2 h-2 bg-[#8696a0] rounded-full animate-bounce-dots" style={{ animationDelay: '400ms' }} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-2 sm:p-2.5 md:p-3 bg-[#f0f2f5] dark:bg-[#202c33] border-t border-[#d1d7db] dark:border-[#222d34] shrink-0 relative z-20 safe-bottom">
                {/* Emoji Picker dropdown */}
                {showEmojiPicker && (
                  <div
                    ref={emojiPickerRef}
                    className="absolute bottom-16 left-3 w-72 max-w-[95%] bg-white dark:bg-[#111b21] border border-gray-200 dark:border-[#26353d] rounded-2xl shadow-2xl p-3 z-[100] animate-scale-in animate-in fade-in slide-in-from-bottom-2 duration-150"
                  >
                    <div className="flex justify-between items-center pb-2 mb-2 border-b border-gray-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-gray-500 uppercase">Popular Emojis</span>
                      <button onClick={() => setShowEmojiPicker(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto chat-scrollbar">
                      {popularEmojis.map((emoji, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => insertEmoji(emoji)}
                          className="text-xl p-1 hover:bg-green-50 dark:hover:bg-[#202c33] rounded-lg active:scale-90 transition-all"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input Controls */}
                <form onSubmit={editingMessage ? handleSaveEdit : handleSendMessage} className="flex items-center gap-2">
                  {editingMessage && (
                    <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-[#f0f2f5] dark:bg-[#2a3942] rounded-full text-xs text-gray-600 dark:text-gray-300">
                      <span>Editing message</span>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  {/* Emoji Trigger */}
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-[#374248] transition-colors ${
                      showEmojiPicker ? 'text-[#128c7e]' : 'text-gray-500 dark:text-gray-400'
                    }`}
                    aria-label="Add Emoji"
                  >
                    <Smile className="w-5 h-5" />
                  </button>

                  {/* Image sharing trigger - hide when editing */}
                  {!editingMessage && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage || sending}
                      className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-[#374248] text-gray-500 dark:text-gray-400 disabled:opacity-40 transition-colors"
                      aria-label="Send Image"
                    >
                      {uploadingImage ? (
                        <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Paperclip className="w-5 h-5" />
                      )}
                    </button>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />

                  {/* Message Input text field */}
                  <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-full px-4 py-2.5">
                    <textarea
                      value={messageText}
                      onChange={(e) => {
                        setMessageText(e.target.value);
                        setEditText(e.target.value);
                      }}
                      placeholder={editingMessage ? 'Edit your message...' : t('messages.typeMessage', { defaultValue: 'Type a message...' })}
                      className="w-full bg-transparent text-slate-900 dark:text-white focus:outline-none outline-none resize-none text-sm min-h-[36px] max-h-[120px] transition-all leading-normal"
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (editingMessage) {
                            handleSaveEdit();
                          } else {
                            handleSendMessage();
                          }
                        }
                      }}
                    />
                  </div>

                  {/* Send/Save Button */}
                  <button
                    type="submit"
                    disabled={sending || uploadingImage || !messageText.trim()}
                    className="bg-[#00a884] hover:bg-[#128c7e] disabled:opacity-40 disabled:bg-gray-300 text-white p-2.5 rounded-full transition-all shrink-0 flex items-center justify-center"
                    aria-label={editingMessage ? "Save Edit" : "Send Message"}
                  >
                    {editingMessage ? <Check className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                  </button>
                </form>
              </div>
            </>
          ) : (
            // Empty view on desktop when no conversation is selected
            <div className="flex flex-col items-center justify-center text-center p-8 max-w-sm">
              <div className="w-20 h-20 rounded-3xl bg-white dark:bg-[#202c33] flex items-center justify-center text-[#128c7e] dark:text-[#25d366] mb-6 shadow-lg">
                <MessageSquare className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">Kapu LK Messenger</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Select a chat to start messaging in the new WhatsApp-style layout.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                <Link to="/users" className="text-xs bg-[#dcf8c6] hover:bg-[#cdebb8] text-[#103529] dark:bg-[#103529] dark:text-[#dcf8c6] font-bold px-4 py-2 rounded-full transition-colors">
                  Find matches
                </Link>
                <Link to="/dashboard" className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold px-4 py-2 rounded-full transition-colors">
                  Back to Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Conversation;
