import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { messageAPI, userAPI, typingAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import moment from 'moment';
import {
  ArrowLeft, Send, User, MessageSquare,
  Check, CheckCheck, Smile, Paperclip,
  Image, Search, X, Edit2, Trash2, MoreVertical, Gift,
  CornerUpLeft, Copy
} from 'lucide-react';
import GiftModal from '../../components/ui/GiftModal';
import PremiumBadge from '../../components/ui/PremiumBadge';

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

  // UI Interactive States
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');
  const [showMessageMenu, setShowMessageMenu] = useState(null);
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [replyingToMessage, setReplyingToMessage] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const textInputRef = useRef(null);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }, 50);
  }, []);

  // Fetch all conversations for the sidebar
  const fetchConversationsList = useCallback(async (silent = false) => {
    if (!silent) setListLoading(true);
    try {
      const response = await messageAPI.getConversations();
      setConversations(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to load conversations list', error);
      setConversations([]);
    } finally {
      if (!silent) setListLoading(false);
    }
  }, []);

  const prevMsgCountRef = useRef(0);

  // Fetch messages for the active conversation
  const fetchChatMessages = useCallback(async (silent = false) => {
    if (!userId) return;
    if (!silent) setChatLoading(true);
    try {
      const [messagesRes, userRes] = await Promise.all([
        messageAPI.getConversationWithUser(userId),
        userAPI.getUserById(userId)
      ]);

      console.log('Messages response:', messagesRes.data);
      const newMsgs = Array.isArray(messagesRes.data) ? messagesRes.data : [];
      
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
      setMessages([]);
    } finally {
      if (!silent) setChatLoading(false);
    }
  }, [userId, scrollToBottom]);

  // Initial load & body scroll locking on mobile
  useEffect(() => {
    fetchConversationsList();
    
    const handleResize = () => {
      if (window.innerWidth < 768) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'unset';
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      document.body.style.overflow = 'unset';
    };
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

  // Check typing status
  const checkTypingStatus = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await typingAPI.getTypingStatus(userId);
      setIsTyping(response.data.isTyping);
    } catch (error) {
      // Silently fail
    }
  }, [userId]);

  // Set up polling interval for real-time update
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversationsList(true);
      if (userId) {
        fetchChatMessages(true);
        checkTypingStatus();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [userId, fetchConversationsList, fetchChatMessages, checkTypingStatus]);

  // Set typing status when user types
  useEffect(() => {
    if (!userId) return;
    
    let typingTimeout;
    
    const setTypingStatus = async (isTyping) => {
      try {
        await typingAPI.setTyping(userId, isTyping);
      } catch (error) {
        // Silently fail
      }
    };

    if (messageText.trim()) {
      setTypingStatus(true);
      // Clear previous timeout
      if (typingTimeout) clearTimeout(typingTimeout);
      // Set new timeout to stop typing after 3 seconds of inactivity
      typingTimeout = setTimeout(() => {
        setTypingStatus(false);
      }, 3000);
    } else {
      setTypingStatus(false);
    }

    return () => {
      if (typingTimeout) clearTimeout(typingTimeout);
    };
  }, [messageText, userId]);

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
    const activeReplyTo = replyingToMessage;
    setMessageText('');
    setReplyingToMessage(null);
    setShowEmojiPicker(false);

    // Optimistically add message
    const tempId = Date.now().toString();
    const optimisticMsg = {
      _id: tempId,
      from: currentUser._id,
      to: userId,
      content: textToSend,
      type: 'text',
      createdAt: new Date().toISOString(),
      isRead: false,
      replyTo: activeReplyTo ? {
        _id: activeReplyTo._id,
        content: activeReplyTo.content,
        from: activeReplyTo.from,
        type: activeReplyTo.type,
      } : null,
    };

    setMessages(prev => [...prev, optimisticMsg]);
    scrollToBottom('smooth');
    setSending(true);

    try {
      await messageAPI.sendMessage({
        to: userId,
        content: textToSend,
        type: 'text',
        replyTo: activeReplyTo ? activeReplyTo._id : null,
      });
      // Refresh list and chat
      fetchChatMessages(true);
      fetchConversationsList(true);
    } catch (error) {
      toast.error(error.response?.data?.message || t('toast.messaging.sendFailed'));
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
      setMessageText(textToSend);
      setReplyingToMessage(activeReplyTo);
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
      setMessages(prev => Array.isArray(prev) ? prev.map(msg => 
        msg._id === editingMessage._id 
          ? { ...msg, content: editText.trim(), edited: true }
          : msg
      ) : []);
      setEditingMessage(null);
      setEditText('');
      setMessageText('');
      toast.success('Message edited successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to edit message');
    }
  };


  const handleDeleteForMe = async (messageId) => {
    try {
      await messageAPI.deleteForMe(messageId);
      setMessages(prev => Array.isArray(prev) ? prev.filter(msg => msg._id !== messageId) : []);
      setShowMessageMenu(null);
      toast.success('Message deleted for you');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete message');
    }
  };

  const handleDeleteForEveryone = async (messageId) => {
    try {
      await messageAPI.deleteForEveryone(messageId);
      setMessages(prev => Array.isArray(prev) ? prev.map(msg => 
        msg._id === messageId 
          ? { ...msg, isDeletedForEveryone: true, content: 'This message was deleted', reactions: [] }
          : msg
      ) : []);
      setShowMessageMenu(null);
      toast.success('Message deleted for everyone');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete message for everyone');
    }
  };

  const handleCopyMessage = (content) => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    toast.success('Message copied to clipboard');
    setShowMessageMenu(null);
  };

  const startReply = (message) => {
    setReplyingToMessage(message);
    setShowMessageMenu(null);
    setShowReactionPicker(null);
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 100);
  };

  const scrollToMessage = (msgId) => {
    if (!msgId) return;
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-purple-400');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-purple-400');
      }, 1500);
    }
  };

  const handleAddReaction = async (messageId, emoji) => {
    try {
      const response = await messageAPI.addReaction(messageId, emoji);
      setMessages(prev => Array.isArray(prev) ? prev.map(msg => 
        msg._id === messageId 
          ? response.data
          : msg
      ) : []);
      setShowReactionPicker(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add reaction');
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
  const filteredConversations = Array.isArray(conversations) ? conversations.filter(c =>
    c?.user && c.user.name && c.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  return (
    <div className="fixed top-14 sm:top-16 left-0 right-0 bottom-0 bg-[#d1dbd4] dark:bg-[#111b21] transition-colors duration-500 page-transition pb-0 sm:pb-0">
      <div className="h-full flex w-full max-w-7xl mx-auto bg-[#f0f2f5] dark:bg-[#111b21] shadow-2xl overflow-hidden">
        
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
        <div className={`flex-1 flex flex-col h-full bg-[#efeae2] dark:bg-[#0b141a] pb-0 sm:pb-0 overflow-hidden ${
          !userId ? 'hidden md:flex items-center justify-center p-8 bg-[#efeae2] dark:bg-[#0b141a]' : 'flex'
        }`}>
          {userId ? (
            <>
              {/* Header */}
              <div className="py-2.5 sm:py-3 px-3 sm:px-4 flex items-center justify-between bg-[#f0f2f5] dark:bg-[#202c33] border-b border-[#d1d7db] dark:border-[#222d34] shrink-0 z-10">
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={() => navigate('/conversation')}
                    className="p-2 -ml-1 sm:-ml-2 bg-white dark:bg-[#111b21] hover:bg-slate-100 dark:hover:bg-[#0b141a] rounded-full transition-all md:hidden"
                    aria-label="Back to conversations list"
                  >
                    <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                  </button>
                  
                  {otherUser && (
                    <div className="flex items-center gap-2 sm:gap-3">
                      {/* Avatar */}
                      <Link to={`/users/${otherUser._id}`} className="relative block group">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full bg-gradient-to-tr from-[#25d366] to-[#128c7e] flex items-center justify-center overflow-hidden border-2 border-white dark:border-[#2a3942] shadow-sm group-hover:scale-105 transition-transform">
                          {otherUser.profileImageUrl ? (
                            <img
                              src={otherUser.profileImageUrl}
                              alt={otherUser.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          )}
                        </div>
                        {isUserOnline(otherUser) && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#25d366] border-2 border-white dark:border-[#111b21] rounded-full" />
                        )}
                      </Link>

                      {/* Name & status */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Link to={`/users/${otherUser._id}`} className="text-sm sm:text-base font-bold text-slate-900 dark:text-white hover:text-[#128c7e] transition-colors leading-none truncate">
                            {otherUser.name}
                          </Link>
                          {(otherUser.isPremium || otherUser.role === 'admin') && (
                            <PremiumBadge plan={otherUser.premiumPlan} isAdmin={otherUser.role === 'admin'} size="sm" />
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block font-medium">
                          {getOnlineStatusText(otherUser)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages scroll area */}
              <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 space-y-3 sm:space-y-4 chat-scrollbar whatsapp-chat-bg relative min-h-0">
                {chatLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500" />
                  </div>
                ) : !Array.isArray(messages) || messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-white/70 dark:bg-[#111b21]/70 rounded-3xl m-4 border border-dashed border-slate-200 dark:border-[#222d34]">
                    <MessageSquare className="w-14 h-14 text-[#7b8b95] dark:text-slate-700 mb-3 animate-pulse" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Say Hello!</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                      Start your matrimonial conversation. Keep it polite, respect privacy, and find your matches.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {Array.isArray(messages) && messages.map((msg, index) => {
                      const isCurrentUser = msg.from._id === currentUser._id || msg.from === currentUser._id;
                      
                      // Show date headers when day changes
                      const showDateHeader = index === 0 || 
                        moment(msg.createdAt).format('LL') !== moment((messages || [])[index - 1]?.createdAt).format('LL');

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
                            <div
                              id={`msg-${msg._id}`}
                              className={`max-w-[85%] sm:max-w-[78%] md:max-w-[72%] rounded-2xl px-3 py-2 sm:px-3.5 sm:py-2.5 shadow-sm relative group transition-all ${
                                isCurrentUser
                                  ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-gray-900 dark:text-white rounded-tr-sm'
                                  : 'bg-white dark:bg-[#202c33] text-gray-900 dark:text-white rounded-tl-sm border border-[#e9edef] dark:border-[#26353d]'
                              }`}
                            >
                              {/* Quoted Reply Preview Inside Bubble */}
                              {msg.replyTo && (
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    scrollToMessage(msg.replyTo._id);
                                  }}
                                  className={`mb-2 p-2 rounded-xl text-xs cursor-pointer hover:opacity-85 transition-opacity border-l-4 ${
                                    isCurrentUser
                                      ? 'bg-black/5 dark:bg-black/20 border-emerald-600'
                                      : 'bg-gray-100 dark:bg-slate-700/60 border-purple-500'
                                  }`}
                                >
                                  <div className="font-semibold flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-400">
                                    <CornerUpLeft className="w-3 h-3" />
                                    <span>
                                      {msg.replyTo.from?._id === currentUser._id || msg.replyTo.from === currentUser._id
                                        ? 'You'
                                        : (otherUser?.name || 'User')}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-gray-600 dark:text-gray-300 truncate mt-0.5">
                                    {msg.replyTo.content || (msg.replyTo.type === 'image' ? '📷 Photo' : 'Message')}
                                  </p>
                                </div>
                              )}

                              {/* Message Content */}
                              {msg.isDeletedForEveryone || msg.deleted ? (
                                <p className="text-[13px] sm:text-[14px] italic text-gray-500 dark:text-gray-400 flex items-center gap-1.5 py-0.5">
                                  <Trash2 className="w-3.5 h-3.5 opacity-60" />
                                  <span>{msg.content || 'This message was deleted'}</span>
                                </p>
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
                              ) : msg.type === 'gift' ? (
                                <div className="text-xs sm:text-sm font-semibold flex items-start gap-2 py-2 px-3 text-pink-700 dark:text-pink-200 bg-pink-50/90 dark:bg-pink-950/70 rounded-xl border border-pink-200 dark:border-pink-800 shadow-sm my-0.5">
                                  <Gift className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
                                  <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                                </div>
                              ) : (
                                <p className="text-[13px] sm:text-[14px] leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                              )}

                              {/* Message Footer Info */}
                              <div className={`flex items-center justify-end gap-1 text-[11px] mt-1 ${
                                isCurrentUser ? 'text-[#667781] dark:text-[#8696a0]' : 'text-gray-400 dark:text-[#8696a0]'
                              }`}>
                                <span>{moment(msg.createdAt).format('LT')}</span>
                                {msg.edited && <span className="text-[10px] italic">(Edited)</span>}
                                {isCurrentUser && (
                                  <div className="flex items-center gap-1">
                                    {msg.isRead ? (
                                      <div className="flex items-center gap-1 group/tick relative">
                                        <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] shrink-0" />
                                        {msg.readAt && (
                                          <span className="absolute bottom-full right-0 mb-1 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover/tick:opacity-100 transition-opacity whitespace-nowrap">
                                            Read {moment(msg.readAt).format('LT')}
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <Check className="w-3.5 h-3.5 text-[#667781] dark:text-[#8696a0] shrink-0" />
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Floating Reactions Bar (Top overlay) */}
                              {showReactionPicker === msg._id && !msg.deleted && !msg.isDeletedForEveryone && (
                                <div
                                  className={`absolute -top-11 ${
                                    isCurrentUser ? 'right-0' : 'left-0'
                                  } bg-white dark:bg-[#1f2c34] rounded-full shadow-2xl border border-gray-200 dark:border-gray-700 px-2 py-1 flex items-center gap-1 z-30 animate-scale-in`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => (
                                    <button
                                      key={emoji}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddReaction(msg._id, emoji);
                                        setShowReactionPicker(null);
                                      }}
                                      className="w-7 h-7 text-base hover:scale-125 transition-transform flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                                      aria-label={`React with ${emoji}`}
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() => setShowReactionPicker(null)}
                                    className="w-6 h-6 text-xs text-gray-400 hover:text-gray-600 rounded-full flex items-center justify-center"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              )}

                              {/* Message Hover Actions Trigger */}
                              {!msg.deleted && !msg.isDeletedForEveryone && (
                                <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {/* Quick Reaction Button */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowReactionPicker(showReactionPicker === msg._id ? null : msg._id);
                                      setShowMessageMenu(null);
                                    }}
                                    className="p-1 rounded-full bg-white/90 dark:bg-slate-700/90 hover:bg-white dark:hover:bg-slate-600 text-gray-600 dark:text-gray-300 shadow-sm"
                                    title="React"
                                  >
                                    <Smile className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Context Menu Trigger */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowMessageMenu(showMessageMenu === msg._id ? null : msg._id);
                                      setShowReactionPicker(null);
                                    }}
                                    className="p-1 rounded-full bg-white/90 dark:bg-slate-700/90 hover:bg-white dark:hover:bg-slate-600 text-gray-600 dark:text-gray-300 shadow-sm"
                                    title="More Options"
                                  >
                                    <MoreVertical className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Action Dropdown Menu */}
                                  {showMessageMenu === msg._id && (
                                    <div
                                      className="absolute top-7 right-0 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 py-1.5 min-w-[150px] z-20 text-xs text-gray-700 dark:text-gray-200 divide-y divide-gray-100 dark:divide-gray-700"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <div className="py-1">
                                        <button
                                          type="button"
                                          onClick={() => startReply(msg)}
                                          className="w-full px-3 py-1.5 text-left hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                                        >
                                          <CornerUpLeft className="w-3.5 h-3.5 text-purple-600" />
                                          Reply
                                        </button>
                                        {msg.type === 'text' && (
                                          <button
                                            type="button"
                                            onClick={() => handleCopyMessage(msg.content)}
                                            className="w-full px-3 py-1.5 text-left hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                                          >
                                            <Copy className="w-3.5 h-3.5 text-blue-500" />
                                            Copy Text
                                          </button>
                                        )}
                                        {isCurrentUser && msg.type === 'text' && (
                                          <button
                                            type="button"
                                            onClick={() => handleEditMessage(msg)}
                                            className="w-full px-3 py-1.5 text-left hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                                          >
                                            <Edit2 className="w-3.5 h-3.5 text-amber-500" />
                                            Edit
                                          </button>
                                        )}
                                      </div>

                                      <div className="py-1">
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteForMe(msg._id)}
                                          className="w-full px-3 py-1.5 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                          Delete for Me
                                        </button>
                                        {isCurrentUser && moment().diff(moment(msg.createdAt), 'minutes') < 60 && (
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteForEveryone(msg._id)}
                                            className="w-full px-3 py-1.5 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 font-medium"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Delete for Everyone
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Message Reactions Display */}
                              {msg.reactions && msg.reactions.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {msg.reactions.map((reaction, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center gap-1 bg-white/80 dark:bg-slate-700/80 rounded-full px-2 py-0.5 text-xs shadow-xs border border-gray-200 dark:border-slate-600"
                                      title={reaction.user?.name || 'Anonymous'}
                                    >
                                      <span>{reaction.emoji}</span>
                                    </div>
                                  ))}
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
              <div className="p-2 sm:p-3 bg-[#f0f2f5] dark:bg-[#202c33] border-t border-[#d1d7db] dark:border-[#222d34] shrink-0 relative z-50">
                {/* Emoji Picker dropdown */}
                {showEmojiPicker && (
                  <div
                    ref={emojiPickerRef}
                    className="absolute bottom-full left-2 sm:left-3 mb-2 w-72 max-w-[95%] bg-white dark:bg-[#111b21] border border-gray-200 dark:border-[#26353d] rounded-2xl shadow-2xl p-3 z-[200] animate-scale-in animate-in fade-in slide-in-from-bottom-2 duration-150"
                  >
                    <div className="flex justify-between items-center pb-2 mb-2 border-b border-gray-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-gray-500 uppercase">Popular Emojis</span>
                      <button onClick={() => setShowEmojiPicker(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto chat-scrollbar">
                      {Array.isArray(popularEmojis) && popularEmojis.map((emoji, index) => (
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

                {/* Replying To Preview Banner */}
                {replyingToMessage && (
                  <div className="flex items-center justify-between p-2.5 mb-2 bg-white dark:bg-[#1f2c34] rounded-2xl border-l-4 border-purple-600 shadow-sm animate-fadeIn">
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400">
                        <CornerUpLeft className="w-3.5 h-3.5" />
                        <span>
                          Replying to{' '}
                          {replyingToMessage.from === currentUser._id || replyingToMessage.from?._id === currentUser._id
                            ? 'yourself'
                            : (otherUser?.name || 'User')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 truncate mt-0.5">
                        {replyingToMessage.content || (replyingToMessage.type === 'image' ? '📷 Photo' : 'Message')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyingToMessage(null)}
                      className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                      title="Cancel reply"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Input Controls */}
                <form onSubmit={editingMessage ? handleSaveEdit : handleSendMessage} className="flex gap-1 sm:gap-1.5 md:gap-2 items-end">
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
                  
                  <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 bg-white dark:bg-[#2a3942] rounded-full px-1 py-1">
                    {/* Emoji Trigger */}
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`p-1.5 sm:p-2 md:p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#374248] transition-colors ${
                        showEmojiPicker ? 'text-[#128c7e] bg-green-50 dark:bg-[#374248]' : 'text-gray-500 dark:text-gray-400'
                      }`}
                      aria-label="Add Emoji"
                    >
                      <Smile className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5.5 md:h-5.5" />
                    </button>

                    {/* Image sharing trigger - hide when editing */}
                    {!editingMessage && (
                      <>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage || sending}
                          className="p-1.5 sm:p-2 md:p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#374248] text-gray-500 dark:text-gray-400 disabled:opacity-40 transition-colors shrink-0"
                          aria-label="Send Image"
                        >
                          {uploadingImage ? (
                            <div className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5.5 md:h-5.5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Paperclip className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5.5 md:h-5.5" />
                          )}
                        </button>

                        {/* Gift button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (otherUser && otherUser.giftingOptIn === false) {
                              toast.error(`${otherUser.name} has disabled receiving gifts.`);
                            } else {
                              setShowGiftModal(true);
                            }
                          }}
                          disabled={sending}
                          className="p-1.5 sm:p-2 md:p-2.5 rounded-full hover:bg-pink-100 dark:hover:bg-pink-900/30 text-pink-500 dark:text-pink-400 disabled:opacity-40 transition-colors shrink-0"
                          aria-label="Send Gift"
                        >
                          <Gift className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5.5 md:h-5.5" />
                        </button>
                      </>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  {/* Message Input text field */}
                  <div className="flex-1 bg-white dark:bg-[#2a3942] border border-[#d1d7db] dark:border-[#2a3942] rounded-[20px] sm:rounded-[24px] md:rounded-[28px] px-2.5 sm:px-3 md:px-4 py-1.5">
                    <textarea
                      ref={textInputRef}
                      value={messageText}
                      onChange={(e) => {
                        setMessageText(e.target.value);
                        setEditText(e.target.value);
                      }}
                      placeholder={editingMessage ? 'Edit your message...' : t('messages.typeMessage', { defaultValue: 'Type a message...' })}
                      className="w-full bg-transparent text-slate-900 dark:text-white focus:outline-none outline-none resize-none text-xs sm:text-sm min-h-[32px] sm:min-h-[36px] md:min-h-[40px] max-h-[100px] sm:max-h-[120px] transition-all leading-normal pt-1.5 sm:pt-2"
                      rows={1}
                      onFocus={() => {
                        setTimeout(() => scrollToBottom('smooth'), 200);
                      }}
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
                    className="bg-[#00a884] hover:bg-[#128c7e] disabled:opacity-40 text-white rounded-full transition-all shrink-0 flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 shadow-sm"
                    aria-label={editingMessage ? "Save Edit" : "Send Message"}
                  >
                    {editingMessage ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" /> : <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />}
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

      {/* Gift Modal */}
      {showGiftModal && otherUser && (
        <GiftModal
          isOpen={showGiftModal}
          onClose={() => setShowGiftModal(false)}
          onGiftSent={() => {
            fetchChatMessages(true);
            fetchConversationsList(true);
          }}
          recipientId={userId}
          recipientName={otherUser.name}
        />
      )}
    </div>
  );
};

export default Conversation;
