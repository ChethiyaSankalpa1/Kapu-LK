import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { messageAPI, userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import moment from 'moment';
import {
  ArrowLeft, Send, User, MessageSquare, Crown,
  Clock, Check, CheckCheck, Shield, Smile, Paperclip,
  Image, Search, X
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

  // UI Interactive States
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

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
      setConversations(response.data || []);
    } catch (error) {
      console.error('Failed to load conversations list', error);
    } finally {
      if (!silent) setListLoading(false);
    }
  }, []);

  // Fetch messages for the active conversation
  const fetchChatMessages = useCallback(async (silent = false) => {
    if (!userId) return;
    if (!silent) setChatLoading(true);
    try {
      const [messagesRes, userRes] = await Promise.all([
        messageAPI.getConversationWithUser(userId),
        userAPI.getUserById(userId)
      ]);

      const newMsgs = messagesRes.data || [];
      
      // Simulate typing indicator if there is a new message from the other user
      if (messages.length > 0 && newMsgs.length > messages.length) {
        const lastMsg = newMsgs[newMsgs.length - 1];
        const isFromOther = lastMsg.from._id === userId || lastMsg.from === userId;
        
        if (isFromOther) {
          setIsTyping(true);
          scrollToBottom('smooth');
          setTimeout(() => {
            setMessages(newMsgs);
            setIsTyping(false);
            scrollToBottom('smooth');
          }, 1500);
          setOtherUser(userRes.data);
          return;
        }
      }

      setMessages(newMsgs);
      setOtherUser(userRes.data);
    } catch (error) {
      console.error('Failed to load chat messages', error);
    } finally {
      if (!silent) setChatLoading(false);
    }
  }, [userId, messages.length, scrollToBottom]);

  // Initial load
  useEffect(() => {
    fetchConversationsList();
  }, [fetchConversationsList]);

  // Load chat on userId change
  useEffect(() => {
    if (userId) {
      setMessages([]);
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
    }, 4000);
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

    // Optimistically add message
    const tempId = Date.now().toString();
    const optimisticMsg = {
      _id: tempId,
      from: currentUser._id,
      to: userId,
      content: textToSend,
      type: 'text',
      createdAt: new Date().toISOString(),
      isRead: false
    };

    setMessages(prev => [...prev, optimisticMsg]);
    scrollToBottom('smooth');
    setSending(true);

    try {
      await messageAPI.sendMessage({
        to: userId,
        content: textToSend,
        type: 'text'
      });
      // Refresh list and chat
      fetchChatMessages(true);
      fetchConversationsList(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message');
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
      toast.error('Only image files are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image file size must be less than 5MB');
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
      toast.success('Image sent successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const insertEmoji = (emoji) => {
    setMessageText(prev => prev + emoji);
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
    if (userObj.isOnline) return true;
    if (userObj.lastLogin) {
      return moment().diff(moment(userObj.lastLogin), 'minutes') < 5;
    }
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
    <div className="h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] bg-gray-100 dark:bg-slate-950 transition-colors duration-300 overflow-hidden">
      <div className="h-full flex max-w-7xl mx-auto border-x border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
        
        {/* ================= SIDEBAR: Conversation List ================= */}
        <div className={`w-full md:w-[360px] lg:w-[400px] flex flex-col h-full border-r border-gray-200 dark:border-slate-800 shrink-0 ${
          userId ? 'hidden md:flex' : 'flex'
        }`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-100 dark:border-slate-850 bg-white dark:bg-slate-900 shrink-0">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              <span>Messages</span>
            </h1>
            
            {/* Search Box */}
            <div className="mt-3.5 relative">
              <input
                type="text"
                placeholder="Search or start new chat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 dark:bg-slate-850 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-700 rounded-xl py-2 px-3.5 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3.5 top-3" />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 p-0.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full text-gray-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto chat-scrollbar bg-gray-50/50 dark:bg-slate-900/40">
            {listLoading ? (
              <div className="flex flex-col items-center justify-center h-48 gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500" />
                <span className="text-xs text-gray-400">Loading chats...</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center h-48">
                <MessageSquare className="w-10 h-10 text-gray-300 dark:text-slate-700 mb-2" />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'No chats found matching query' : 'No conversations yet'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {searchQuery ? 'Check spelling or try another name' : 'Start matches or like profiles to message!'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-105 dark:divide-slate-800">
                {filteredConversations.map((c) => {
                  const active = userId === c.user._id;
                  const online = isUserOnline(c.user);
                  return (
                    <button
                      key={c.user._id}
                      onClick={() => navigate(`/conversation/${c.user._id}`)}
                      className={`w-full text-left px-4 py-3.5 flex gap-3.5 items-center transition-all ${
                        active 
                          ? 'bg-purple-50/70 dark:bg-purple-950/20 border-l-4 border-purple-600'
                          : 'bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-pink-400 to-purple-600 flex items-center justify-center overflow-hidden border border-gray-150 dark:border-slate-700 shadow-sm">
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
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                            {c.user.name}
                          </p>
                          {c.lastMessage && (
                            <span className="text-[10px] text-gray-400 dark:text-gray-505 whitespace-nowrap ml-2">
                              {moment(c.lastMessage.createdAt).format('LT')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[190px]">
                            {c.lastMessage?.type === 'image' ? (
                              <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium">
                                <Image className="w-3.5 h-3.5" /> Photo
                              </span>
                            ) : c.lastMessage?.type === 'like' ? (
                              <span className="text-pink-500 font-semibold">❤️ Liked profile</span>
                            ) : (
                              c.lastMessage?.content
                            )}
                          </p>
                          {c.unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full bg-purple-600 text-white shadow-sm">
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
        <div className={`flex-1 flex flex-col h-full bg-gray-50 dark:bg-slate-950 ${
          !userId ? 'hidden md:flex items-center justify-center p-8 bg-gray-50 dark:bg-slate-950' : 'flex'
        }`}>
          {userId ? (
            <>
              {/* Header */}
              <div className="py-3 px-4 flex items-center justify-between bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate('/conversation')}
                    className="p-2 -ml-2 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-all md:hidden"
                    aria-label="Back to conversations list"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </button>
                  
                  {otherUser && (
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <Link to={`/users/${otherUser._id}`} className="relative block group">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-pink-400 to-purple-600 flex items-center justify-center overflow-hidden border border-gray-150 dark:border-slate-700 shadow-sm group-hover:scale-105 transition-transform">
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
                        {isUserOnline(otherUser) && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full" />
                        )}
                      </Link>

                      {/* Name & status */}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Link to={`/users/${otherUser._id}`} className="text-sm sm:text-base font-bold text-gray-900 dark:text-white hover:text-purple-600 transition-colors leading-none">
                            {otherUser.name}
                          </Link>
                          {otherUser.isPremium && <Crown className="w-3.5 h-3.5 text-yellow-500 shrink-0" />}
                          {otherUser.role === 'admin' && <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                        </div>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 block font-medium">
                          {getOnlineStatusText(otherUser)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages scroll area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-scrollbar bg-[#f4f3f0] dark:bg-slate-950 bg-opacity-70 dark:bg-opacity-100 relative">
                {chatLoading && messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-white/40 dark:bg-slate-900/10 rounded-3xl m-4 border border-dashed border-gray-200 dark:border-slate-800">
                    <MessageSquare className="w-14 h-14 text-purple-300 dark:text-slate-700 mb-3 animate-pulse" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Say Hello!</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
                      Start your matrimonial conversation. Keep it polite, respect privacy, and find your matches.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {messages.map((msg, index) => {
                      const isCurrentUser = msg.from._id === currentUser._id || msg.from === currentUser._id;
                      
                      // Show date headers when day changes
                      const showDateHeader = index === 0 || 
                        moment(msg.createdAt).format('LL') !== moment(messages[index - 1].createdAt).format('LL');

                      return (
                        <div key={msg._id || index} className="space-y-2 animate-slide-up">
                          {showDateHeader && (
                            <div className="flex justify-center my-3">
                              <span className="bg-white/80 dark:bg-slate-800 text-[10px] font-bold text-gray-500 dark:text-gray-400 px-3 py-1 rounded-full shadow-sm uppercase tracking-wider">
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
                            <div className={`max-w-[75%] rounded-2xl p-2.5 px-3.5 shadow-sm relative ${
                              isCurrentUser
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-none'
                                : 'bg-white dark:bg-slate-900 text-gray-950 dark:text-white rounded-tl-none border border-gray-150 dark:border-slate-800'
                            }`}>
                              
                              {/* Message Content */}
                              {msg.type === 'image' ? (
                                <div className="space-y-1.5">
                                  <img
                                    src={msg.content}
                                    alt="Shared in Chat"
                                    className="rounded-lg max-w-full max-h-[300px] object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                    onClick={() => window.open(msg.content, '_blank')}
                                  />
                                </div>
                              ) : msg.type === 'like' ? (
                                <p className="text-sm italic font-semibold flex items-center gap-1.5 py-1 text-pink-500">
                                  ❤️ Sent you a profile like!
                                </p>
                              ) : (
                                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                              )}

                              {/* Message Footer Info */}
                              <div className={`flex items-center justify-end gap-1 text-[9px] mt-1 ${
                                isCurrentUser ? 'text-purple-200' : 'text-gray-400 dark:text-gray-500'
                              }`}>
                                <span>{moment(msg.createdAt).format('LT')}</span>
                                {isCurrentUser && (
                                  msg.isRead ? (
                                    <CheckCheck className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                                  ) : (
                                    <Check className="w-3.5 h-3.5 text-purple-200 shrink-0" />
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Typing indicator bubble */}
                    {isTyping && (
                      <div className="flex justify-start animate-slide-up">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl rounded-tl-none p-3 px-4 border border-gray-150 dark:border-slate-800 shadow-sm flex items-center gap-1">
                          <span className="w-2 h-2 bg-purple-500 dark:bg-purple-400 rounded-full animate-bounce-dots" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-purple-500 dark:bg-purple-400 rounded-full animate-bounce-dots" style={{ animationDelay: '200ms' }} />
                          <span className="w-2 h-2 bg-purple-500 dark:bg-purple-400 rounded-full animate-bounce-dots" style={{ animationDelay: '400ms' }} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 shrink-0 relative z-20">
                {/* Emoji Picker dropdown */}
                {showEmojiPicker && (
                  <div
                    ref={emojiPickerRef}
                    className="absolute bottom-16 left-3 w-72 max-w-[95%] bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl p-3 z-[100] animate-scale-in animate-in fade-in slide-in-from-bottom-2 duration-150"
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
                          className="text-xl p-1 hover:bg-purple-50 dark:hover:bg-slate-800 rounded-lg active:scale-90 transition-all"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input Controls */}
                <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Emoji Trigger */}
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors ${
                        showEmojiPicker ? 'text-purple-600 bg-purple-50 dark:bg-slate-800' : 'text-gray-500 dark:text-gray-400'
                      }`}
                      aria-label="Add Emoji"
                    >
                      <Smile className="w-5.5 h-5.5" />
                    </button>

                    {/* Image sharing trigger */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage || sending}
                      className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400 disabled:opacity-40 transition-colors shrink-0"
                      aria-label="Send Image"
                    >
                      {uploadingImage ? (
                        <div className="w-5.5 h-5.5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Paperclip className="w-5.5 h-5.5" />
                      )}
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  {/* Message Input text field */}
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={t('messages.typeMessage', { defaultValue: 'Type a message...' })}
                    className="flex-1 bg-gray-50 dark:bg-slate-850 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none text-sm min-h-[44px] max-h-[120px] transition-all leading-normal"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={sending || uploadingImage || !messageText.trim()}
                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white p-3 rounded-xl shadow-md transition-all shrink-0 active:scale-95 flex items-center justify-center min-h-[44px] w-11 h-11"
                    aria-label="Send Message"
                  >
                    <Send className="w-5.5 h-5.5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            // Empty view on desktop when no conversation is selected
            <div className="flex flex-col items-center justify-center text-center p-8 max-w-sm">
              <div className="w-20 h-20 rounded-3xl bg-purple-50 dark:bg-slate-800 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6 shadow-md shadow-purple-500/10">
                <MessageSquare className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2">LoveLK Messenger</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Redesigned chat interface inspired by professional messaging platforms. Select a match to start private, secure, and encrypted conversations.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                <Link to="/users" className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 font-bold px-3 py-1.5 rounded-full transition-colors">
                  Find matches
                </Link>
                <Link to="/dashboard" className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-slate-800 dark:text-gray-300 font-bold px-3 py-1.5 rounded-full transition-colors">
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
