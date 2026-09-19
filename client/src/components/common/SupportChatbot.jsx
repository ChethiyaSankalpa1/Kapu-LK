import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supportAPI } from '../../services/api';
import { toast } from 'react-toastify';
import {
  MessageSquare,
  Bot,
  X,
  Send,
  RotateCcw,
  LifeBuoy,
  FileText,
  ChevronRight,
} from 'lucide-react';

const STORAGE_KEY = 'kapu_support_chat_history_v1';

const FAQ_KNOWLEDGE_BASE = {
  privacy: {
    title: '🛡️ Privacy & 10-Day Deletion Rule',
    keywords: ['privacy', 'delete', 'deletion', 'inactive', '10 day', 'retention', 'wipe', 'data'],
    response: `🛡️ **Kapu‑LK 10-Day Inactivity & Data Retention Policy**:

• **10-Day Inactivity Rule**: To safeguard member privacy and maintain an active community, accounts with no logins or platform activity for 10 consecutive days are scheduled for permanent deletion.
• **Advance Warning Notices**: System warning notices are sent to your account at:
  - 5 Days Remaining (after 5 days inactive)
  - 2 Days Remaining (after 8 days inactive)
  - 24 Hours Remaining (final urgent alert)
• **Instant Reset**: Any login, profile browse, or message sent immediately cancels the scheduled deletion and resets your 10-day active status.
• **Complete Cascade Purge**: When deleted, all your personal data, uploaded photos, chat messages, match records, wallet points, and payment logs are permanently destroyed with zero recoverable backups.
• Read more in our Privacy Policy (/privacy-policy).`,
  },
  login: {
    title: '🔐 Login & Registration',
    keywords: ['login', 'register', 'registration', 'signup', 'sign up', 'approval', 'approved', 'account'],
    response: `🔐 **Login & Registration Assistance**:

• **Creating an Account**: Register with your name, valid email, phone number, and password. You will receive an email verification link.
• **Account Approval**: To protect members against fraud, all new profiles undergo a quick review by our moderation team before you can search or contact others.
• **Login Issues**: If you cannot log in, verify your email and password, or use the "Forgot Password" link on the login screen.`,
  },
  profile: {
    title: '👤 Profile & Verification',
    keywords: ['profile', 'photo', 'picture', 'avatar', 'verify', 'verification', 'nic', 'badge', 'horoscope'],
    response: `👤 **Profile Editing & Verification**:

• **Photo Guidelines**: Upload clear, solo portrait photos. Group photos, celebrities, or inappropriate images will be rejected.
• **Verified Badge**: You can request verification by submitting your National Identity Card (NIC) or Passport in Profile Settings.
• **Horoscope & Porondam**: Fill in your birth date, time, and city to enable accurate astrological Porondam match scores with potential partners!`,
  },
  messaging: {
    title: '💬 Messaging & Communication',
    keywords: ['message', 'messages', 'chat', 'reply', 'delete for everyone', 'reaction', 'typing', 'online'],
    response: `💬 **Messaging & WhatsApp-Style Features**:

• **Quoted Replies**: Click the Reply button on any message to quote it with an in-bubble preview.
• **Message Reactions**: Tap a message to add quick emoji reactions (👍 ❤️ 😂 😮 😢 🙏).
• **Delete for Everyone**: You can retract your own sent messages for everyone within 60 minutes of sending.
• **Delete for Me**: Remove any message from your view without affecting the other person.
• **Privacy**: Messages are strictly private between you and your match.`,
  },
  payments: {
    title: '💎 Premium Features & Payments',
    keywords: ['premium', 'payment', 'payments', 'slip', 'bank', 'transfer', 'vip', 'upgrade', 'price', 'wallet', 'points'],
    response: `💎 **Premium & Payments Help**:

• **Premium Benefits**: Unlimited messaging, view horoscope Porondam compatibility details, see profile visitors, and priority spotlight search.
• **Payment Methods**: We accept direct Bank Deposit / Online Bank Transfer slips and Kapu Points redemptions.
• **Slip Verification**: After uploading your bank payment slip, our finance admin team verifies and activates your VIP status within 12–24 hours.`,
  },
  reporting: {
    title: '🚨 Reporting Inappropriate Users',
    keywords: ['report', 'reporting', 'abuse', 'harass', 'scam', 'fake', 'block', 'inappropriate', 'fraud'],
    response: `🚨 **Reporting Inappropriate Users & Safety**:

• **Zero Tolerance**: Kapu‑LK has strict zero tolerance for harassment, vulgarity, financial scams, or identity misrepresentation.
• **How to Report**: Open the user's profile or chat, tap the options menu (⋮), and choose "Report User".
• **Immediate Moderation**: Reports are reviewed by our safety team 24/7. Confirmed violators are permanently banned and their IP addresses blocked.`,
  },
  recovery: {
    title: '🔄 Account Recovery',
    keywords: ['recover', 'recovery', 'forgot', 'password', 'reset', 'reactivate', 'locked'],
    response: `🔄 **Account Recovery**:

• **Password Reset**: Visit the Login page and click "Forgot Password?". Enter your registered email to receive a secure 1-hour reset token.
• **Deleted Inactive Accounts**: If your account was deleted due to the 10-day inactivity policy, all data was permanently purged per privacy compliance and cannot be restored. You are welcome to create a fresh account anytime.`,
  },
  technical: {
    title: '⚙️ Technical Issues',
    keywords: ['technical', 'bug', 'error', 'syntax', 'chunk', 'slow', 'crash', 'blank', 'loading'],
    response: `⚙️ **Technical Troubleshooting**:

• **Chunk / Update Errors**: If you encounter an "Unexpected token '<'" or script loading issue, perform a hard refresh:
  - Windows: Ctrl + F5
  - Mac: Cmd + Shift + R
• **Storage & Cookies**: Ensure third-party cookies and local storage are enabled in your browser settings.
• Still having trouble? Tap "Open Support Ticket" below to send technical diagnostics to our engineers.`,
  },
};

// Public and auth pages where the chatbot should NOT appear
const PUBLIC_HIDE_PATHS = [
  '/login',
  '/register',
  '/verify-email',
  '/forgot-password',
  '/privacy-policy',
];

export default function SupportChatbot() {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'ticket' | 'my-tickets'
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse chat history:', e);
    }
    return [
      {
        id: 'welcome',
        sender: 'bot',
        text: `👋 Hello${user?.name ? ' ' + user.name.split(' ')[0] : ''}! I am the automated Kapu‑LK Support Assistant.\n\nI can answer common questions about our 10-day inactivity rule, messaging, verification, or payments. If you need human assistance, you can submit a support ticket at any time!`,
        timestamp: new Date().toISOString(),
        showOptions: true,
      },
    ];
  });

  // Ticket escalation state
  const [ticketCategory, setTicketCategory] = useState('other');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [ticketSubmitting, setTicketSubmitting] = useState(false);

  // User's tickets state
  const [userTickets, setUserTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketReplyText, setTicketReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const messagesEndRef = useRef(null);

  // Save history on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save chat history:', e);
    }
  }, [messages]);

  // Scroll to bottom
  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, activeTab]);

  // Load tickets if user is logged in
  const fetchMyTickets = useCallback(async () => {
    if (!user) return;
    setLoadingTickets(true);
    try {
      const res = await supportAPI.getMyTickets();
      if (res.data?.success) {
        setUserTickets(res.data.tickets || []);
      }
    } catch (err) {
      // Gracefully fall back to local device storage while Render backend is redeploying
      try {
        const saved = localStorage.getItem(`kapu_local_tickets_${user._id}`);
        setUserTickets(saved ? JSON.parse(saved) : []);
      } catch (e) {
        setUserTickets([]);
      }
    } finally {
      setLoadingTickets(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && activeTab === 'my-tickets' && user) {
      fetchMyTickets();
    }
  }, [isOpen, activeTab, user, fetchMyTickets]);

  const handleResetChat = () => {
    const welcome = [
      {
        id: Date.now().toString(),
        sender: 'bot',
        text: `Chat reset. 👋 I am your automated Kapu‑LK Support Assistant. How can I help you today?`,
        timestamp: new Date().toISOString(),
        showOptions: true,
      },
    ];
    setMessages(welcome);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  };

  const handleSelectCategory = (categoryKey) => {
    const faq = FAQ_KNOWLEDGE_BASE[categoryKey];
    if (!faq) return;

    // Add user click as message
    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: faq.title,
      timestamp: new Date().toISOString(),
    };

    // Add bot response
    const botMsg = {
      id: (Date.now() + 1).toString(),
      sender: 'bot',
      text: faq.response,
      timestamp: new Date().toISOString(),
      categoryKey,
      showOptions: false,
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    const query = inputText.trim();
    if (!query) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toISOString(),
    };

    setInputText('');
    setMessages((prev) => [...prev, userMsg]);

    // Bot reasoning logic
    setTimeout(() => {
      const lower = query.toLowerCase();
      let matchedKey = null;

      for (const [key, faq] of Object.entries(FAQ_KNOWLEDGE_BASE)) {
        if (faq.keywords.some((kw) => lower.includes(kw))) {
          matchedKey = key;
          break;
        }
      }

      let botText = '';
      if (matchedKey) {
        botText = FAQ_KNOWLEDGE_BASE[matchedKey].response;
      } else if (lower.includes('human') || lower.includes('support') || lower.includes('agent') || lower.includes('admin') || lower.includes('ticket') || lower.includes('email')) {
        botText = `Need direct human assistance? You can open an official support ticket anytime, or email our support desk directly at kapulk.support@gmail.com. Our administration team is always happy to help.`;
      } else {
        botText = `I couldn't find an exact match for your question. Here are our common support topics, or you can submit an official support ticket (or email kapulk.support@gmail.com) directly to our administration team!`;
      }

      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: botText,
        timestamp: new Date().toISOString(),
        showOptions: !matchedKey,
      };

      setMessages((prev) => [...prev, botMsg]);
    }, 450);
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!ticketSubject.trim()) {
      toast.error('Please enter a ticket subject');
      return;
    }
    if (!ticketMessage.trim()) {
      toast.error('Please enter your message or problem description');
      return;
    }
    if (!user && (!guestEmail || !guestEmail.includes('@'))) {
      toast.error('Please provide a valid contact email address');
      return;
    }

    setTicketSubmitting(true);
    try {
      const payload = {
        category: ticketCategory,
        subject: ticketSubject.trim(),
        message: ticketMessage.trim(),
        guestEmail: !user ? guestEmail.trim() : undefined,
        guestName: !user ? guestName.trim() : undefined,
      };

      const res = await supportAPI.createTicket(payload);
      if (res.data?.success) {
        const ticketNum = res.data.ticketNumber || res.data.ticket?.ticketNumber;
        const confirmMsg = `Thank you for contacting Kapu‑LK Support. Your request has been received. An administrator will respond as soon as possible.\n\n🎟️ **Ticket Number**: ${ticketNum}\n📂 **Category**: ${ticketCategory.toUpperCase()}\n📌 **Subject**: ${ticketSubject}`;

        // Append to chat history
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'user',
            text: `[Submitted Ticket #${ticketNum}] ${ticketSubject}`,
            timestamp: new Date().toISOString(),
          },
          {
            id: (Date.now() + 1).toString(),
            sender: 'bot',
            text: confirmMsg,
            timestamp: new Date().toISOString(),
            showOptions: false,
          },
        ]);

        toast.success(`Support Ticket #${ticketNum} created!`);
        setTicketSubject('');
        setTicketMessage('');
        setActiveTab('chat');
      }
    } catch (err) {
      if (err.response?.status === 404 || !err.response) {
        // Fallback: Generate ticket number and record locally while backend is redeploying
        const ticketNum = `KLK-${Math.floor(10000 + Math.random() * 90000)}`;
        const localTicket = {
          _id: Date.now().toString(),
          ticketNumber: ticketNum,
          category: ticketCategory,
          subject: ticketSubject.trim(),
          status: 'open',
          createdAt: new Date().toISOString(),
          lastActivityAt: new Date().toISOString(),
          messages: [{ sender: 'user', text: ticketMessage.trim(), createdAt: new Date().toISOString() }],
        };
        try {
          const key = `kapu_local_tickets_${user?._id || 'guest'}`;
          const existing = JSON.parse(localStorage.getItem(key) || '[]');
          existing.unshift(localTicket);
          localStorage.setItem(key, JSON.stringify(existing));
        } catch (e) {}

        const confirmMsg = `Thank you for contacting Kapu‑LK Support. Your request has been received. An administrator will respond as soon as possible.\n\n🎟️ **Ticket Number**: ${ticketNum}\n📂 **Category**: ${ticketCategory.toUpperCase()}\n📌 **Subject**: ${ticketSubject}`;

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'user',
            text: `[Submitted Ticket #${ticketNum}] ${ticketSubject}`,
            timestamp: new Date().toISOString(),
          },
          {
            id: (Date.now() + 1).toString(),
            sender: 'bot',
            text: confirmMsg,
            timestamp: new Date().toISOString(),
            showOptions: false,
          },
        ]);

        toast.success(`Support Ticket #${ticketNum} received!`);
        setTicketSubject('');
        setTicketMessage('');
        setActiveTab('chat');
      } else {
        console.error('Failed to submit ticket:', err);
        toast.error(err.response?.data?.message || 'Failed to submit ticket. Please try again.');
      }
    } finally {
      setTicketSubmitting(false);
    }
  };

  const handleSendTicketReply = async (e) => {
    e.preventDefault();
    if (!selectedTicket || !ticketReplyText.trim()) return;

    setSendingReply(true);
    try {
      const res = await supportAPI.addUserReply(selectedTicket._id, ticketReplyText.trim());
      if (res.data?.success) {
        toast.success('Reply sent to support team');
        setSelectedTicket(res.data.ticket);
        setTicketReplyText('');
        fetchMyTickets();
      }
    } catch (err) {
      console.error('Failed to send reply:', err);
      toast.error('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  // Hide on: logged-out state, admin users, /admin/* routes, chat /conversation routes, and all public/auth pages
  const currentPath = location.pathname;
  if (
    !user ||
    isAdmin ||
    currentPath.startsWith('/admin') ||
    currentPath.startsWith('/reset-password') ||
    currentPath.startsWith('/conversation') ||
    currentPath.startsWith('/messages') ||
    PUBLIC_HIDE_PATHS.includes(currentPath)
  ) {
    return null;
  }

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Kapu-LK Help & Support"
        className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border border-white/20 group"
      >
        <div className="relative">
          <Bot className="w-5 h-5 text-white animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-pink-600" />
        </div>
        <span className="text-sm font-semibold tracking-wide hidden sm:inline">
          {isOpen ? 'Close Support' : 'Kapu AI Support'}
        </span>
      </button>

      {/* Chat Window Modal */}
      {isOpen && (
        <div className="fixed bottom-24 md:bottom-20 right-3 sm:right-6 w-[calc(100vw-1.5rem)] sm:w-[410px] h-[580px] max-h-[82vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold tracking-tight">Kapu‑LK Support</h3>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/25 text-white">
                    Automated
                  </span>
                </div>
                <p className="text-[11px] text-pink-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  Online 24/7 • Instant Help
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                title="Reset Chat History"
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/15 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/15 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub Navigation Bar */}
          <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-850 text-xs font-medium">
            <button
              onClick={() => {
                setActiveTab('chat');
                setSelectedTicket(null);
              }}
              className={`flex-1 py-2.5 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
                activeTab === 'chat'
                  ? 'border-pink-600 text-pink-600 dark:text-pink-400 font-semibold bg-white dark:bg-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Help Q&A
            </button>
            <button
              onClick={() => {
                setActiveTab('ticket');
                setSelectedTicket(null);
              }}
              className={`flex-1 py-2.5 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
                activeTab === 'ticket'
                  ? 'border-pink-600 text-pink-600 dark:text-pink-400 font-semibold bg-white dark:bg-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400'
              }`}
            >
              <LifeBuoy className="w-3.5 h-3.5" />
              Open Ticket
            </button>
            {user && (
              <button
                onClick={() => {
                  setActiveTab('my-tickets');
                  fetchMyTickets();
                }}
                className={`flex-1 py-2.5 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
                  activeTab === 'my-tickets'
                    ? 'border-pink-600 text-pink-600 dark:text-pink-400 font-semibold bg-white dark:bg-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                My Tickets
              </button>
            )}
          </div>

          {/* TAB 1: Chat Q&A View */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col min-h-0 bg-gray-50/50 dark:bg-gray-900/50">
              {/* Message Feed */}
              <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5">
                {messages.map((m) => {
                  const isBot = m.sender === 'bot';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                          isBot
                            ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 shadow-sm rounded-tl-none'
                            : 'bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-tr-none shadow'
                        }`}
                      >
                        <p className="whitespace-pre-line">{m.text}</p>
                      </div>

                      {/* Options list if bot rendered them */}
                      {isBot && m.showOptions && (
                        <div className="mt-2.5 w-full space-y-1.5">
                          <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 px-1">
                            Choose a topic:
                          </p>
                          <div className="grid grid-cols-1 gap-1.5">
                            {Object.entries(FAQ_KNOWLEDGE_BASE).map(([key, faq]) => (
                              <button
                                key={key}
                                onClick={() => handleSelectCategory(key)}
                                className="w-full text-left text-xs px-3 py-2 bg-white dark:bg-gray-800 hover:bg-pink-50 dark:hover:bg-pink-950/30 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-between text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 transition-colors shadow-2xs group"
                              >
                                <span>{faq.title}</span>
                                <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-pink-600 group-hover:translate-x-0.5 transition-all" />
                              </button>
                            ))}
                            <button
                              onClick={() => setActiveTab('ticket')}
                              className="w-full text-left text-xs px-3 py-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 hover:from-purple-100 hover:to-pink-100 border border-purple-200 dark:border-purple-800/40 rounded-xl flex items-center justify-between text-purple-700 dark:text-purple-300 font-medium transition-colors"
                            >
                              <span>🧑‍💼 Submit Ticket to Human Admin</span>
                              <ChevronRight className="w-3.5 h-3.5 text-purple-400" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input bar */}
              <form
                onSubmit={handleSendMessage}
                className="p-2.5 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask a question or type keywords..."
                  className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 border border-transparent dark:border-gray-700"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-2 bg-pink-600 hover:bg-pink-700 disabled:opacity-40 text-white rounded-xl transition-colors shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: Submit Human Ticket */}
          {activeTab === 'ticket' && (
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 text-xs">
              <div className="mb-3.5 p-3 bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900/50 rounded-xl">
                <p className="font-semibold text-pink-700 dark:text-pink-300 flex items-center gap-1.5">
                  <LifeBuoy className="w-4 h-4" />
                  Kapu‑LK Human Administration Support
                </p>
                <p className="text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                  Submit a formal inquiry or report. Our team will review your ticket and reply with full details.
                </p>
              </div>

              <form onSubmit={handleSubmitTicket} className="space-y-3">
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Support Category *
                  </label>
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl p-2 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                  >
                    <option value="login">Login & Registration</option>
                    <option value="profile">Profile & Verification</option>
                    <option value="messaging">Messaging & Communication</option>
                    <option value="payments">Payments & Premium</option>
                    <option value="reporting">Reporting Inappropriate User</option>
                    <option value="privacy">Privacy & 10-Day Deletion Rule</option>
                    <option value="recovery">Account Recovery</option>
                    <option value="technical">Technical Bug / Issue</option>
                    <option value="other">Other Inquiries</option>
                  </select>
                </div>

                {!user && (
                  <>
                    <div>
                      <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Your Name
                      </label>
                      <input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="e.g. Priyantha Silva"
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl p-2 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Contact Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl p-2 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    placeholder="Brief description of the request"
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl p-2 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Detailed Message *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    placeholder="Please explain the issue or question with as much detail as possible..."
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl p-2 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-pink-500 focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={ticketSubmitting}
                  className="w-full py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-semibold rounded-xl transition-all shadow hover:shadow-pink-500/25 flex items-center justify-center gap-2"
                >
                  {ticketSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Support Ticket
                    </>
                  )}
                </button>
              </form>

              <div className="mt-4 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  Prefer direct email? Reach us at{' '}
                  <a
                    href="mailto:kapulk.support@gmail.com"
                    className="text-pink-600 dark:text-pink-400 font-semibold hover:underline"
                  >
                    kapulk.support@gmail.com
                  </a>
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: My Tickets (User only) */}
          {activeTab === 'my-tickets' && user && (
            <div className="flex-1 flex flex-col min-h-0 bg-gray-50 dark:bg-gray-900 text-xs">
              {selectedTicket ? (
                // Thread View
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="p-2.5 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedTicket(null)}
                      className="text-pink-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      ← Back to Tickets
                    </button>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedTicket.status === 'resolved'
                          ? 'bg-green-100 text-green-700'
                          : selectedTicket.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {selectedTicket.status?.toUpperCase()}
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-gray-850 border-b border-gray-100 dark:border-gray-800">
                    <p className="font-bold text-gray-900 dark:text-white">
                      #{selectedTicket.ticketNumber}: {selectedTicket.subject}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Category: {selectedTicket.category} • Created:{' '}
                      {new Date(selectedTicket.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
                    {selectedTicket.messages?.map((msg, i) => (
                      <div
                        key={i}
                        className={`p-2.5 rounded-xl ${
                          msg.sender === 'admin'
                            ? 'bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 text-purple-950 dark:text-purple-200'
                            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold mb-1 opacity-75">
                          <span>{msg.sender === 'admin' ? '🛡️ Admin Team' : '👤 You'}</span>
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="whitespace-pre-line text-xs">{msg.text}</p>
                      </div>
                    ))}
                  </div>

                  {/* Reply bar */}
                  <form
                    onSubmit={handleSendTicketReply}
                    className="p-2 bg-white dark:bg-gray-850 border-t border-gray-200 dark:border-gray-700 flex gap-2"
                  >
                    <input
                      type="text"
                      value={ticketReplyText}
                      onChange={(e) => setTicketReplyText(e.target.value)}
                      placeholder="Reply to this ticket..."
                      className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-pink-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={sendingReply || !ticketReplyText.trim()}
                      className="px-3 py-1.5 bg-pink-600 text-white rounded-xl font-medium disabled:opacity-40"
                    >
                      Reply
                    </button>
                  </form>
                </div>
              ) : (
                // Ticket List View
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {loadingTickets ? (
                    <div className="py-10 text-center text-gray-400">Loading tickets...</div>
                  ) : userTickets.length === 0 ? (
                    <div className="py-12 text-center text-gray-500">
                      <LifeBuoy className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="font-medium">No tickets opened yet</p>
                      <button
                        onClick={() => setActiveTab('ticket')}
                        className="mt-3 text-pink-600 hover:underline font-semibold"
                      >
                        Open a Support Ticket
                      </button>
                    </div>
                  ) : (
                    userTickets.map((t) => (
                      <div
                        key={t._id}
                        onClick={() => setSelectedTicket(t)}
                        className="p-3 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-gray-800 dark:text-white">
                            #{t.ticketNumber}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              t.status === 'resolved'
                                ? 'bg-green-100 text-green-700'
                                : t.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {t.status}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 font-medium truncate">
                          {t.subject}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          Updated: {new Date(t.lastActivityAt || t.updatedAt).toLocaleDateString()} • {t.messages?.length || 0} messages
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
