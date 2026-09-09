import React, { useState, useEffect, useCallback } from 'react';
import { supportAPI } from '../../services/api';
import { toast } from 'react-toastify';
import {
  LifeBuoy,
  Search,
  Send,
  CheckCircle2,
  Clock,
  MessageSquare,
  User,
  Shield,
  RefreshCw,
} from 'lucide-react';

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'login', label: 'Login & Registration' },
  { value: 'profile', label: 'Profile & Verification' },
  { value: 'messaging', label: 'Messaging' },
  { value: 'payments', label: 'Payments & Premium' },
  { value: 'reporting', label: 'Report User' },
  { value: 'privacy', label: 'Privacy & 10-Day Deletion' },
  { value: 'recovery', label: 'Account Recovery' },
  { value: 'technical', label: 'Technical Issues' },
  { value: 'other', label: 'Other' },
];

export default function SupportInboxTab() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
  });

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('in_progress');
  const [isReplying, setIsReplying] = useState(false);

  // Admin notes & status form
  const [adminNotes, setAdminNotes] = useState('');
  const [ticketPriority, setTicketPriority] = useState('medium');
  const [ticketStatus, setTicketStatus] = useState('open');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await supportAPI.getAdminTickets(params);
      if (res.data?.success) {
        const fetchedTickets = res.data.tickets || [];
        setTickets(fetchedTickets);
        if (res.data.statusCounts) {
          setStatusCounts(res.data.statusCounts);
        }
        // Update selectedTicket if already open
        setSelectedTicket((prev) => {
          if (!prev) return null;
          const updated = fetchedTickets.find((t) => t._id === prev._id);
          if (updated) {
            setAdminNotes(updated.adminNotes || '');
            setTicketPriority(updated.priority || 'medium');
            setTicketStatus(updated.status || 'open');
            return updated;
          }
          return prev;
        });
      }
    } catch (err) {
      console.error('Failed to fetch admin tickets:', err);
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, searchQuery]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTickets();
  };

  const handleSelectTicket = (t) => {
    setSelectedTicket(t);
    setAdminNotes(t.adminNotes || '');
    setTicketPriority(t.priority || 'medium');
    setTicketStatus(t.status || 'open');
    setReplyStatus(t.status === 'open' ? 'in_progress' : t.status);
    setReplyText('');
  };

  const handleSendAdminReply = async (e) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    setIsReplying(true);
    try {
      const res = await supportAPI.addAdminReply(selectedTicket._id, {
        text: replyText.trim(),
        status: replyStatus,
      });

      if (res.data?.success) {
        toast.success('Admin reply sent to user');
        setReplyText('');
        setSelectedTicket(res.data.ticket);
        fetchTickets();
      }
    } catch (err) {
      console.error('Failed to send admin reply:', err);
      toast.error('Failed to send admin reply');
    } finally {
      setIsReplying(false);
    }
  };

  const handleUpdateStatusAndNotes = async () => {
    if (!selectedTicket) return;

    setIsUpdatingStatus(true);
    try {
      const res = await supportAPI.updateTicketStatus(selectedTicket._id, {
        status: ticketStatus,
        priority: ticketPriority,
        adminNotes: adminNotes.trim(),
      });

      if (res.data?.success) {
        toast.success('Ticket metadata updated');
        setSelectedTicket(res.data.ticket);
        fetchTickets();
      }
    } catch (err) {
      console.error('Failed to update ticket:', err);
      toast.error('Failed to update ticket');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300';
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-300';
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 font-bold';
      case 'high':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400';
      case 'low':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            statusFilter === 'all'
              ? 'bg-purple-500/10 border-purple-500 shadow-sm'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Total Tickets</span>
            <LifeBuoy className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{statusCounts.all}</p>
        </button>

        <button
          onClick={() => setStatusFilter('open')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            statusFilter === 'open'
              ? 'bg-amber-500/10 border-amber-500 shadow-sm'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Open Tickets</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{statusCounts.open}</p>
        </button>

        <button
          onClick={() => setStatusFilter('in_progress')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            statusFilter === 'in_progress'
              ? 'bg-blue-500/10 border-blue-500 shadow-sm'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">In Progress</span>
            <MessageSquare className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{statusCounts.in_progress}</p>
        </button>

        <button
          onClick={() => setStatusFilter('resolved')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            statusFilter === 'resolved'
              ? 'bg-green-500/10 border-green-500 shadow-sm'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-green-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-green-600 dark:text-green-400">Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{statusCounts.resolved}</p>
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearch} className="w-full sm:w-80 relative flex items-center">
          <Search className="w-4 h-4 absolute left-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search #ticket, subject, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:ring-2 focus:ring-pink-500 focus:outline-none dark:text-white"
          />
        </form>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:ring-2 focus:ring-pink-500 focus:outline-none dark:text-white"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => fetchTickets()}
            title="Refresh"
            className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Two Column Layout: Ticket List & Conversation Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
        {/* Left Column: Tickets Table / Cards */}
        <div className="lg:col-span-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="p-3.5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-850/50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Inbox ({tickets.length})
            </h3>
            <span className="text-[11px] text-gray-400">Sorted by recent activity</span>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-700 overflow-y-auto max-h-[640px] flex-1">
            {loading ? (
              <div className="py-16 text-center text-gray-400 text-xs flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-pink-600" />
                Loading tickets...
              </div>
            ) : tickets.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-xs">
                <LifeBuoy className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                No support tickets found
              </div>
            ) : (
              tickets.map((t) => {
                const isSelected = selectedTicket?._id === t._id;
                const senderName = t.user?.name || t.guestName || 'Guest User';
                const senderEmail = t.user?.email || t.guestEmail || 'No email';
                return (
                  <div
                    key={t._id}
                    onClick={() => handleSelectTicket(t)}
                    className={`p-3.5 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-pink-50 dark:bg-pink-950/30 border-l-4 border-pink-600'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-750'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-gray-900 dark:text-white">
                          #{t.ticketNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                            t.status
                          )}`}
                        >
                          {t.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {new Date(t.lastActivityAt || t.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 line-clamp-1 mb-1">
                      {t.subject}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                      <span className="truncate max-w-[180px]" title={senderEmail}>
                        👤 {senderName}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-[10px] font-medium">
                        {t.category}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Ticket Inspector & Reply Center */}
        <div className="lg:col-span-7 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
          {selectedTicket ? (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-850/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-gray-900 dark:text-white">
                      #{selectedTicket.ticketNumber}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(
                        selectedTicket.status
                      )}`}
                    >
                      {selectedTicket.status?.toUpperCase()}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] uppercase ${getPriorityBadge(
                        selectedTicket.priority
                      )}`}
                    >
                      {selectedTicket.priority} priority
                    </span>
                  </div>

                  <span className="text-xs text-gray-500">
                    Created {new Date(selectedTicket.createdAt).toLocaleString()}
                  </span>
                </div>

                <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">
                  {selectedTicket.subject}
                </h2>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Requester:</span>{' '}
                    {selectedTicket.user?.name || selectedTicket.guestName || 'Guest'}{' '}
                    ({selectedTicket.user?.email || selectedTicket.guestEmail || 'No email'})
                  </span>
                  <span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Category:</span>{' '}
                    {selectedTicket.category}
                  </span>
                </div>
              </div>

              {/* Messages Thread */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50/30 dark:bg-gray-900/30 max-h-[380px]">
                {selectedTicket.messages?.map((msg, idx) => {
                  const isAdmin = msg.sender === 'admin';
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl text-xs ${
                        isAdmin
                          ? 'bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 text-purple-950 dark:text-purple-100 ml-6'
                          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 mr-6 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold mb-1 opacity-75">
                        <span className="flex items-center gap-1.5">
                          {isAdmin ? (
                            <>
                              <Shield className="w-3.5 h-3.5 text-purple-600" />
                              Admin Response
                            </>
                          ) : (
                            <>
                              <User className="w-3.5 h-3.5 text-blue-600" />
                              {selectedTicket.user?.name || selectedTicket.guestName || 'User'}
                            </>
                          )}
                        </span>
                        <span className="text-[10px] font-normal text-gray-400">
                          {new Date(msg.createdAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                    </div>
                  );
                })}
              </div>

              {/* Admin Quick Reply Box */}
              <form
                onSubmit={handleSendAdminReply}
                className="p-3.5 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <Send className="w-3.5 h-3.5 text-pink-600" />
                    Reply to User (Triggers In-App Notification)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <label className="text-gray-500 text-[11px]">Set Status:</label>
                    <select
                      value={replyStatus}
                      onChange={(e) => setReplyStatus(e.target.value)}
                      className="px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-xs"
                    >
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                      <option value="open">Open</option>
                    </select>
                  </div>
                </div>

                <textarea
                  rows={3}
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your official administrative reply..."
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-xs text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-pink-500 focus:outline-none resize-none"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isReplying || !replyText.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-semibold text-xs rounded-xl shadow disabled:opacity-40 flex items-center gap-2 transition-all"
                  >
                    {isReplying ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    Send Official Reply
                  </button>
                </div>
              </form>

              {/* Status, Priority & Internal Admin Notes Section */}
              <div className="p-3.5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850/60 flex flex-col sm:flex-row gap-3 items-end">
                <div className="w-full sm:w-1/3 space-y-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Status
                    </label>
                    <select
                      value={ticketStatus}
                      onChange={(e) => setTicketStatus(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Priority
                    </label>
                    <select
                      value={ticketPriority}
                      onChange={(e) => setTicketPriority(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="w-full sm:flex-1">
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Internal Admin Notes (Private)
                  </label>
                  <textarea
                    rows={2}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Private staff notes, investigation details..."
                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-2 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-pink-500 resize-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleUpdateStatusAndNotes}
                  disabled={isUpdatingStatus}
                  className="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs font-semibold rounded-xl shrink-0 transition-colors"
                >
                  {isUpdatingStatus ? 'Saving...' : 'Update Ticket'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400 text-xs">
              <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                Select a ticket from the inbox
              </p>
              <p className="text-gray-400 mt-1 max-w-sm">
                Review the user's issue, view conversation thread, update priority, and send an official administrative reply.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
