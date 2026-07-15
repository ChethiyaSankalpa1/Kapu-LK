import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { adminAPI, messageAPI } from '../../services/api';
import { toast } from 'react-toastify';
import {
  Users, UserCheck, UserX, Activity,
  CheckCircle, XCircle, Trash2, Shield, Crown, AlertTriangle, DollarSign, MessageSquare
} from 'lucide-react';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [premiumRequests, setPremiumRequests] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchConversations();
    }, 20000);

    return () => clearInterval(intervalId);
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await messageAPI.getConversations();
      const items = response.data || [];
      setConversations(items);
      setUnreadMessagesCount(items.reduce((sum, convo) => sum + (convo.unreadCount || 0), 0));
    } catch (error) {
      console.error('Failed to fetch conversations', error);
    }
  };

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, premiumRes, conversationsRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getAllUsers(),
        adminAPI.getPremiumRequests(),
        messageAPI.getConversations(),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setPremiumRequests(premiumRes.data);
      const items = conversationsRes.data || [];
      setConversations(items);
      setUnreadMessagesCount(items.reduce((sum, convo) => sum + (convo.unreadCount || 0), 0));
    } catch (error) {
      toast.error(t('admin.fetchDataFailed', { defaultValue: 'Failed to fetch data' }));
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      await adminAPI.approveUser(userId);
      toast.success(t('admin.userApproved', { defaultValue: 'User approved successfully' }));
      fetchData();
    } catch (error) {
      toast.error(t('admin.approveUserFailed', { defaultValue: 'Failed to approve user' }));
    }
  };

  const handleRejectUser = async (userId) => {
    try {
      await adminAPI.rejectUser(userId);
      toast.success(t('admin.userApprovalRevoked', { defaultValue: 'User approval revoked' }));
      fetchData();
    } catch (error) {
      toast.error(t('admin.rejectUserFailed', { defaultValue: 'Failed to reject user' }));
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm(t('admin.confirmDeleteUser', { defaultValue: 'Are you sure you want to delete this user?' }))) return;

    try {
      await adminAPI.deleteUser(userId);
      toast.success(t('admin.userDeleted', { defaultValue: 'User deleted successfully' }));
      fetchData();
    } catch (error) {
      toast.error(t('admin.deleteUserFailed', { defaultValue: 'Failed to delete user' }));
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      await adminAPI.toggleStatus(userId);
      toast.success(t('admin.userStatusUpdated', { defaultValue: 'User status updated' }));
      fetchData();
    } catch (error) {
      toast.error(t('admin.updateStatusFailed', { defaultValue: 'Failed to update status' }));
    }
  };

  const handleTogglePremium = async (userId) => {
    try {
      await adminAPI.togglePremium(userId);
      toast.success(t('admin.userPremiumUpdated', { defaultValue: 'User premium status updated' }));
      fetchData();
    } catch (error) {
      toast.error(t('admin.updatePremiumFailed', { defaultValue: 'Failed to update premium status' }));
    }
  };

  const handleApprovePremium = async (requestId) => {
    try {
      await adminAPI.approvePremium(requestId);
      toast.success(t('admin.premiumApproved', { defaultValue: 'Premium approved' }));
      fetchData();
    } catch (error) {
      toast.error(t('admin.approvePremiumFailed', { defaultValue: 'Failed to approve premium' }));
    }
  };

  const handleRejectPremium = async (requestId) => {
    try {
      const reason = prompt(t('admin.premium.rejectReason'));
      if (reason !== null) {
        await adminAPI.rejectPremium(requestId, reason);
        toast.success(t('admin.premiumRejected', { defaultValue: 'Premium rejected' }));
        fetchData();
      }
    } catch (error) {
      toast.error(t('admin.rejectPremiumFailed', { defaultValue: 'Failed to reject premium' }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-5 sm:py-8">
      <div className="container mx-auto px-4 sm:px-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-5 sm:mb-8 flex items-center space-x-2">
          <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-purple-600" />
          <span>{t('admin.title')}</span>
        </h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4 mb-5 sm:mb-8">
          <div className="glass-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('admin.stats.totalUsers')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.totalUsers || 0}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="glass-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('admin.stats.approved')}</p>
                <p className="text-2xl font-bold text-green-600">{stats?.approvedUsers || 0}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="glass-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('admin.stats.active')}</p>
                <p className="text-2xl font-bold text-purple-600">{stats?.activeUsers || 0}</p>
              </div>
              <Activity className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="glass-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('admin.stats.premium')}</p>
                <p className="text-2xl font-bold text-yellow-600">{stats?.premiumUsers || 0}</p>
              </div>
              <Crown className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="glass-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('admin.stats.premiumRequests')}</p>
                <p className="text-2xl font-bold text-orange-600">{stats?.premiumRequests || 0}</p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="glass-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('admin.stats.messages')}</p>
                <p className="text-2xl font-bold text-indigo-600">{stats?.totalMessages || 0}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-indigo-500" />
            </div>
          </div>

          <div className="glass-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('admin.stats.complaints')}</p>
                <p className="text-2xl font-bold text-red-600">{stats?.totalComplaints || 0}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="glass-card p-2 mobile-tab-list mb-5 sm:mb-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 sm:px-4 py-2.5 rounded-full text-sm font-semibold flex items-center space-x-2 ${activeTab === 'users'
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
          >
            <Users className="w-4 h-4" />
            <span>{t('admin.tabs.users')}</span>
          </button>
          <button
            onClick={() => setActiveTab('premium')}
            className={`px-3 sm:px-4 py-2.5 rounded-full text-sm font-semibold flex items-center space-x-2 ${activeTab === 'premium'
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
          >
            <Crown className="w-4 h-4" />
            <span>{t('admin.tabs.premiumRequests')}</span>
            {premiumRequests.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {premiumRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`px-3 sm:px-4 py-2.5 rounded-full text-sm font-semibold flex items-center space-x-2 ${activeTab === 'messages'
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Messages</span>
            {unreadMessagesCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {unreadMessagesCount}
              </span>
            )}
          </button>
        </div>

        {/* Users Table */}
        {activeTab === 'users' && (
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('admin.tabs.users')}</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Approved</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Premium</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            {user.profileImageUrl ? (
                              <img
                                src={user.profileImageUrl}
                                alt={user.name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-purple-600 dark:text-purple-400 font-semibold">
                                {user.name.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div className="ml-3">
                            <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{user.age} years</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(user._id)}
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${user.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            }`}
                        >
                          {user.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.isApproved ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.isPremium ? (
                          <Crown className="w-5 h-5 text-yellow-500" />
                        ) : user.premiumRequested ? (
                          <span className="text-orange-500 text-sm">Pending</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => navigate(`/conversation/${user._id}`)}
                            className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            title="Message User"
                          >
                            <MessageSquare className="w-5 h-5" />
                            <span className="hidden sm:inline">Chat</span>
                          </button>
                          {!user.isApproved ? (
                            <button
                              onClick={() => handleApproveUser(user._id)}
                              className="text-green-600 hover:text-green-700"
                              title="Approve"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRejectUser(user._id)}
                              className="text-orange-600 hover:text-orange-700"
                              title="Revoke Approval"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleTogglePremium(user._id)}
                            className={`${user.isPremium ? 'text-yellow-600 hover:text-yellow-700' : 'text-gray-600 hover:text-gray-700'}`}
                            title={user.isPremium ? "Remove Premium" : "Add Premium"}
                          >
                            <Crown className="w-5 h-5" />
                          </button>
                          {user.role !== 'admin' && (
                            <button
                              onClick={() => handleDelete(user._id)}
                              className="text-red-600 hover:text-red-700"
                              title="Delete"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Premium Requests */}
        {activeTab === 'premium' && (
          <div className="space-y-4">
            {premiumRequests.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <Crown className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-300">No premium requests yet</p>
              </div>
            ) : (
              premiumRequests.map((request) => (
                <div key={request._id} className="glass-card p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        {request.user.profileImageUrl ? (
                          <img
                            src={request.user.profileImageUrl}
                            alt={request.user.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-purple-600 dark:text-purple-400 font-semibold">
                            {request.user.name.charAt(0)}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <h3 className="font-bold text-gray-900 dark:text-white">{request.user.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{request.user.email}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          <strong>Bank:</strong> {request.bank}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          <strong>Account:</strong> {request.accountHolderName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          <strong>Amount:</strong> Rs. {request.paymentAmount}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          <strong>Date:</strong> {new Date(request.paymentDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-3">
                      {request.paymentSlipUrl && (
                        <a
                          href={request.paymentSlipUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary text-center"
                        >
                          View Payment Slip
                        </a>
                      )}

                      {request.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApprovePremium(request._id)}
                            className="flex-1 btn-primary flex items-center justify-center space-x-1"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleRejectPremium(request._id)}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-semibold flex items-center justify-center space-x-1"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}

                      {request.status === 'approved' && (
                        <span className="text-center text-green-600 font-semibold">Approved</span>
                      )}
                      {request.status === 'rejected' && (
                        <div className="text-center">
                          <p className="text-red-600 font-semibold">Rejected</p>
                          {request.rejectionReason && (
                            <p className="text-sm text-gray-500">{request.rejectionReason}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">User Messages</h2>
              <button
                onClick={fetchConversations}
                className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
              >
                Refresh
              </button>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-300">No messages yet</p>
                </div>
              ) : (
                conversations.map((conversation) => (
                  <button
                    key={conversation.user?._id || conversation._id}
                    type="button"
                    onClick={() => navigate(`/conversation/${conversation.user._id}`)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center overflow-hidden">
                        {conversation.user?.profileImageUrl ? (
                          <img
                            src={conversation.user.profileImageUrl}
                            alt={conversation.user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-purple-600 dark:text-purple-400 font-semibold">
                            {conversation.user?.name?.charAt(0) || '?'}
                          </span>
                        )}
                      </div>

                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {conversation.user?.name || 'Unknown user'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1">
                          {conversation.lastMessage?.content || 'Open conversation'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {conversation.lastMessage?.createdAt && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(conversation.lastMessage.createdAt).toLocaleString()}
                        </span>
                      )}
                      {conversation.unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[28px] text-center">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
