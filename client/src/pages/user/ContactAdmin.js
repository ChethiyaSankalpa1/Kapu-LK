import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { userAPI, messageAPI, supportAPI } from '../../services/api';
import { toast } from 'react-toastify';
import {
  Shield,
  Send,
  Clock,
  X,
  Image as ImageIcon,
  AlertCircle,
  HelpCircle,
  CreditCard,
  User as UserIcon,
  Settings,
  Bug,
  FileText,
  LifeBuoy,
  MessageSquare,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import BackButton from '../../components/common/BackButton';

const ContactAdmin = () => {
  const { t } = useTranslation();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'my-tickets'
  const [admin, setAdmin] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [subjectText, setSubjectText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [issueType, setIssueType] = useState('technical');
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

  // My Tickets State
  const [myTickets, setMyTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [expandedTicketId, setExpandedTicketId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const issueTypes = [
    { id: 'bug', category: 'technical', label: 'Bug Report', icon: Bug, color: 'red' },
    { id: 'payment', category: 'payments', label: 'Payment Issue', icon: CreditCard, color: 'yellow' },
    { id: 'profile', category: 'profile', label: 'Profile Issue', icon: UserIcon, color: 'blue' },
    { id: 'account', category: 'recovery', label: 'Account Settings', icon: Settings, color: 'purple' },
    { id: 'report', category: 'reporting', label: 'Report User', icon: AlertCircle, color: 'orange' },
    { id: 'technical', category: 'technical', label: 'Technical Support', icon: HelpCircle, color: 'cyan' },
    { id: 'other', category: 'other', label: 'Other', icon: FileText, color: 'gray' },
  ];

  const fetchAdmin = useCallback(async () => {
    if (isAdmin) {
      setLoading(false);
      return;
    }
    try {
      const adminUser = await userAPI.getAdminUser();
      if (adminUser?.data) {
        setAdmin(adminUser.data);
      }
    } catch (err) {
      console.warn('Admin user fetch note:', err.message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  const fetchMyTickets = useCallback(async () => {
    if (isAdmin || !user) return;
    setLoadingTickets(true);
    try {
      const res = await supportAPI.getMyTickets();
      if (res.data?.success) {
        setMyTickets(res.data.tickets || []);
      }
    } catch (err) {
      console.error('Failed to fetch user support tickets:', err);
    } finally {
      setLoadingTickets(false);
    }
  }, [isAdmin, user]);

  useEffect(() => {
    fetchAdmin();
    fetchMyTickets();
  }, [fetchAdmin, fetchMyTickets]);

  const handleSendMessage = async () => {
    const trimmedMsg = messageText.trim();
    if (!trimmedMsg && attachments.length === 0) {
      toast.error('Please describe your issue before submitting.');
      return;
    }

    setSending(true);
    try {
      const selectedObj = issueTypes.find((t) => t.id === issueType) || issueTypes[5];
      const category = selectedObj.category;
      const subject = subjectText.trim() || `[${selectedObj.label}] Support Inquiry`;
      const fullText = trimmedMsg || 'See attached screenshots.';

      // 1. Submit ticket directly to Admin Support Inbox
      const res = await supportAPI.createTicket({
        category,
        subject,
        message: fullText,
        priority: 'medium',
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Support ticket submitted! Our team will respond shortly.');
      } else {
        toast.success('Support ticket submitted successfully!');
      }

      // 2. Secondary direct message to admin if admin model exists
      if (admin?._id) {
        await messageAPI
          .sendMessage({
            to: admin._id,
            content: `[${selectedObj.label}] ${fullText}`,
            type: 'text',
            attachments: attachments,
          })
          .catch((err) => console.warn('Direct message notice:', err.message));
      }

      // Reset form
      setMessageText('');
      setSubjectText('');
      setAttachments([]);

      // Refresh user's ticket list & switch to My Tickets tab
      await fetchMyTickets();
      setActiveTab('my-tickets');
    } catch (error) {
      console.error('Submit ticket error:', error);
      const errMsg = error.response?.data?.message || 'Failed to submit support ticket. Please try again.';
      toast.error(errMsg);
    } finally {
      setSending(false);
    }
  };

  const handleSendReply = async (ticketId) => {
    if (!replyText.trim()) return;
    setSendingReply(true);
    try {
      const res = await supportAPI.addUserReply(ticketId, replyText.trim());
      if (res.data?.success) {
        toast.success('Reply sent to support team');
        setReplyText('');
        await fetchMyTickets();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const newAttachments = [];

    for (const file of files) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        toast.error(`Invalid image format: ${file.name}`);
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`Image exceeds 5MB limit: ${file.name}`);
        continue;
      }

      const preview = URL.createObjectURL(file);
      newAttachments.push({
        file,
        preview,
        name: file.name,
        size: file.size,
      });
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    setUploading(false);
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[index].preview);
      copy.splice(index, 1);
      return copy;
    });
  };

  if (isAdmin) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto glass-card text-center p-8 rounded-3xl">
          <Shield className="w-20 h-20 text-purple-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
            Administrator Mode
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            You are logged in as an administrator. Manage member support requests directly in the Admin Dashboard Support Inbox.
          </p>
          <button onClick={() => navigate('/admin')} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg transition">
            Go to Admin Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pt-6 pb-24 md:py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <BackButton variant="ghost" label={t('common.back')} iconClassName="w-6 h-6" className="text-lg font-medium" />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl mb-4 shadow-lg">
            <LifeBuoy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Support Center
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-sm sm:text-base">
            Have a question or technical issue? Submit a formal ticket directly to our administration team. We typically respond within 12–24 hours.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-white dark:bg-gray-800 p-1.5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition ${
              activeTab === 'create'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Open New Ticket</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('my-tickets');
              fetchMyTickets();
            }}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition relative ${
              activeTab === 'my-tickets'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>My Support Tickets</span>
            {myTickets.length > 0 && (
              <span className="ml-1 px-2 py-0.5 text-[10px] bg-pink-500 text-white rounded-full font-extrabold">
                {myTickets.length}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: CREATE NEW SUPPORT TICKET */}
        {activeTab === 'create' && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-150 dark:border-gray-700 space-y-6">
            
            {/* Admin Info Banner */}
            <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-800/50 rounded-2xl p-4 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <h3 className="font-bold text-gray-900 dark:text-white">
                  Kapu-LK Administration Support
                </h3>
                <p>
                  Submit your request below. Your ticket will be queued directly into our admin dashboard for review.
                </p>
              </div>
            </div>

            {/* Issue Category Selection */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">
                1. Select Support Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {issueTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = issueType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setIssueType(type.id)}
                      className={`p-3 rounded-2xl border text-left transition flex flex-col items-center text-center justify-center gap-1.5 ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/20'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300 hover:border-purple-300'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500'}`} />
                      <span className="text-xs font-semibold">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subject Line */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                2. Subject Line (Optional)
              </label>
              <input
                type="text"
                value={subjectText}
                onChange={(e) => setSubjectText(e.target.value)}
                placeholder="Brief summary of your question or issue..."
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 text-sm"
              />
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                3. Detailed Message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Please describe your issue or question in detail..."
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 resize-none text-sm"
                rows={5}
              />
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                4. Attach Screenshots (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-center hover:border-purple-400 transition cursor-pointer">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploading}
                />
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                  <ImageIcon className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-1" />
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {uploading ? 'Processing...' : 'Click to attach image files'}
                  </p>
                  <p className="text-[11px] text-gray-400">JPEG, PNG, WebP (max 5MB each)</p>
                </label>
              </div>

              {attachments.length > 0 && (
                <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {attachments.map((att, idx) => (
                    <div key={idx} className="relative group">
                      <img src={att.preview} alt={att.name} className="w-full h-20 object-cover rounded-xl" />
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-80 hover:opacity-100 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSendMessage}
              disabled={sending || (!messageText.trim() && attachments.length === 0)}
              className={`w-full py-4 px-6 font-bold text-base rounded-2xl shadow-lg transition flex items-center justify-center gap-2 ${
                !sending && (messageText.trim() || attachments.length > 0)
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white cursor-pointer shadow-purple-500/25'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              {sending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting Support Ticket...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Submit Support Ticket to Admin</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* TAB 2: MY SUPPORT TICKETS LIST & REPLIES */}
        {activeTab === 'my-tickets' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Your Support Tickets
              </h2>
              <button
                type="button"
                onClick={fetchMyTickets}
                className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1 hover:underline"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingTickets ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {loadingTickets ? (
              <div className="py-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto" />
              </div>
            ) : myTickets.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 text-center border border-gray-150 dark:border-gray-700 space-y-3">
                <LifeBuoy className="w-12 h-12 text-gray-400 mx-auto" />
                <h3 className="font-bold text-gray-900 dark:text-white">No Tickets Found</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  You haven't submitted any support tickets yet. Click "Open New Ticket" above to submit an issue.
                </p>
              </div>
            ) : (
              myTickets.map((t) => {
                const isExpanded = expandedTicketId === t._id;
                const statusBadge = {
                  open: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
                  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
                  resolved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
                  closed: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
                }[t.status || 'open'];

                return (
                  <div
                    key={t._id}
                    className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-150 dark:border-gray-700 shadow-sm space-y-3 transition"
                  >
                    <div
                      onClick={() => setExpandedTicketId(isExpanded ? null : t._id)}
                      className="flex items-start justify-between cursor-pointer select-none"
                    >
                      <div className="space-y-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                            {t.ticketNumber}
                          </span>
                          <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${statusBadge}`}>
                            {t.status?.replace('_', ' ') || 'Open'}
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base truncate">
                          {t.subject}
                        </h3>
                        <p className="text-[11px] text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Last activity: {new Date(t.lastActivityAt || t.createdAt).toLocaleString()}</span>
                        </p>
                      </div>

                      <button type="button" className="p-1 text-gray-400 hover:text-gray-600">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>

                    {/* Expanded Conversation View */}
                    {isExpanded && (
                      <div className="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
                        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                          {(t.messages || []).map((m, idx) => {
                            const isUser = m.sender === 'user';
                            return (
                              <div
                                key={idx}
                                className={`p-3.5 rounded-2xl text-xs sm:text-sm max-w-[85%] ${
                                  isUser
                                    ? 'bg-purple-50 dark:bg-purple-950/40 text-gray-800 dark:text-gray-200 ml-auto border border-purple-100 dark:border-purple-800/50'
                                    : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 border border-indigo-100 dark:border-indigo-800/50'
                                }`}
                              >
                                <div className="font-bold mb-1 flex items-center justify-between text-[11px] opacity-75">
                                  <span>{isUser ? 'You' : 'Kapu-LK Support Team'}</span>
                                  <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                              </div>
                            );
                          })}
                        </div>

                        {/* Reply Input Box */}
                        {t.status !== 'closed' && (
                          <div className="flex items-center gap-2 pt-2">
                            <input
                              type="text"
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSendReply(t._id);
                              }}
                              placeholder="Type a follow-up reply..."
                              className="flex-1 px-4 py-2.5 text-xs sm:text-sm border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleSendReply(t._id)}
                              disabled={sendingReply || !replyText.trim()}
                              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs transition disabled:opacity-50"
                            >
                              Reply
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Footer Support Email Note */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Need direct email support? Email us directly at{' '}
            <a href="mailto:kapulk.support@gmail.com" className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">
              kapulk.support@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContactAdmin;
