import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { adminAPI, messageAPI, userAPI } from '../../services/api';
import { toast } from 'react-toastify';
import {
  Users, User, UserCheck, Activity,
  CheckCircle, XCircle, Trash2, Shield, Crown, AlertTriangle, DollarSign, MessageSquare, MoreVertical,
  Eye, X, Heart, Phone, Star, Clock
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
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [inspectedUser, setInspectedUser] = useState(null);
  const [inspectorLoading, setInspectorLoading] = useState(false);

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

  const fetchData = useCallback(async () => {
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
      setConversations(conversationsRes.data);
      setUnreadMessagesCount(conversationsRes.data.reduce((sum, convo) => sum + (convo.unreadCount || 0), 0));
    } catch (error) {
      console.error('Failed to fetch admin data', error);
      toast.error(t('admin.fetchFailed', { defaultValue: 'Failed to fetch data' }));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchConversations();
    }, 20000);

    return () => clearInterval(intervalId);
  }, []);

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

  const handleDeletePremiumRequest = async (requestId) => {
    if (!window.confirm(t('admin.confirmDeletePremiumRequest', { defaultValue: 'Are you sure you want to delete this premium request?' }))) return;

    try {
      await adminAPI.deletePremiumRequest(requestId);
      toast.success(t('admin.premiumRequestDeleted', { defaultValue: 'Premium request deleted successfully' }));
      fetchData();
    } catch (error) {
      toast.error(t('admin.deletePremiumRequestFailed', { defaultValue: 'Failed to delete premium request' }));
    }
  };

  const handleInspectUser = async (userId) => {
    setInspectorLoading(true);
    try {
      // Use the user data already available from the users array
      const userToInspect = users.find(u => u._id === userId);
      if (userToInspect) {
        setInspectedUser(userToInspect);
        setActiveDropdown(null);
      } else {
        // Fallback to API call if user not found in array
        const response = await userAPI.getUserById(userId);
        setInspectedUser(response.data);
        setActiveDropdown(null);
      }
    } catch (error) {
      console.error('Error inspecting user:', error);
      toast.error(t('admin.fetchUserFailed', { defaultValue: 'Failed to fetch user details' }));
    } finally {
      setInspectorLoading(false);
    }
  };

  const closeInspector = () => {
    setInspectedUser(null);
  };

  const calculateProfileCompletion = (user) => {
    if (!user) return 0;
    const fields = [
      'name', 'profileName', 'phoneNumber', 'age', 'gender', 'bio',
      'location', 'education', 'occupation', 'religion', 'maritalStatus',
      'height', 'weight', 'interests', 'hobbies', 'profileImageUrl'
    ];
    const filledFields = fields.filter(field => user[field] && user[field] !== '');
    return Math.round((filledFields.length / fields.length) * 100);
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
                          <span className="text-green-600 dark:text-green-400 font-medium">Approved</span>
                        ) : (
                          <span className="text-red-600 dark:text-red-400 font-medium">Pending</span>
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
                        <div className="relative">
                          <button
                            onClick={() => setActiveDropdown(activeDropdown === user._id ? null : user._id)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title="Actions"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                          </button>
                          
                          {activeDropdown === user._id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    handleInspectUser(user._id);
                                    setActiveDropdown(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  <span>Inspect Profile</span>
                                </button>
                                <button
                                  onClick={() => {
                                    navigate(`/conversation/${user._id}`);
                                    setActiveDropdown(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                  <span>Chat</span>
                                </button>
                                {!user.isApproved ? (
                                  <button
                                    onClick={() => {
                                      handleApproveUser(user._id);
                                      setActiveDropdown(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Approve</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      handleRejectUser(user._id);
                                      setActiveDropdown(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-orange-600 dark:text-orange-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    <span>Revoke Approval</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    handleTogglePremium(user._id);
                                    setActiveDropdown(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                  <Crown className="w-4 h-4" />
                                  <span>{user.isPremium ? 'Remove Premium' : 'Add Premium'}</span>
                                </button>
                                <button
                                  onClick={() => {
                                    handleToggleStatus(user._id);
                                    setActiveDropdown(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                  <Activity className="w-4 h-4" />
                                  <span>{user.isActive ? 'Deactivate' : 'Activate'}</span>
                                </button>
                                {user.role !== 'admin' && (
                                  <button
                                    onClick={() => {
                                      handleDelete(user._id);
                                      setActiveDropdown(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    <span>Delete</span>
                                  </button>
                                )}
                              </div>
                            </div>
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
                        <div className="flex space-x-2">
                          <span className="flex-1 text-center text-green-600 font-semibold">Approved</span>
                          <button
                            onClick={() => handleDeletePremiumRequest(request._id)}
                            className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-semibold flex items-center justify-center space-x-1"
                            title="Delete Request"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}

                      {request.status === 'rejected' && (
                        <div className="flex space-x-2">
                          <span className="flex-1 text-center text-red-600 font-semibold">Rejected</span>
                          <button
                            onClick={() => handleDeletePremiumRequest(request._id)}
                            className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-semibold flex items-center justify-center space-x-1"
                            title="Delete Request"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
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

      {/* User Profile Inspector Modal */}
      {inspectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Eye className="w-5 h-5" />
                User Profile Inspector
              </h2>
              <button
                onClick={closeInspector}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
              {inspectorLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-500"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Profile Header */}
                  <div className="flex items-start gap-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="w-24 h-24 rounded-xl bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {inspectedUser.profileImageUrl ? (
                        <img
                          src={inspectedUser.profileImageUrl}
                          alt={inspectedUser.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl text-white font-bold">
                          {inspectedUser.name?.charAt(0) || '?'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {inspectedUser.name}
                        </h3>
                        {inspectedUser.isPremium && (
                          <Crown className="w-5 h-5 text-yellow-500" />
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mb-3">
                        {inspectedUser.bio || 'No bio provided'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          inspectedUser.isActive 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {inspectedUser.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                          {inspectedUser.role}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          {inspectedUser.gender}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Profile Completion */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Profile Completion</span>
                      <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                        {calculateProfileCompletion(inspectedUser)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                        style={{ width: `${calculateProfileCompletion(inspectedUser)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-purple-600" />
                      Personal Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Age</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{inspectedUser.age || '-'}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Location</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{inspectedUser.location || '-'}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Education</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{inspectedUser.education || '-'}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Occupation</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{inspectedUser.occupation || '-'}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Religion</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{inspectedUser.religion || '-'}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Marital Status</p>
                        <p className="font-semibold text-gray-900 dark:text-white capitalize">{inspectedUser.maritalStatus || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Phone className="w-5 h-5 text-purple-600" />
                      Contact Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Phone Number</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{inspectedUser.phoneNumber || '-'}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Email</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{inspectedUser.email || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Interests & Hobbies */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-purple-600" />
                      Interests & Hobbies
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Interests</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{inspectedUser.interests || '-'}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Hobbies</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{inspectedUser.hobbies || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Account Status */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-purple-600" />
                      Account Status
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Account Status</p>
                        <p className={`font-semibold ${inspectedUser.isActive ? 'text-green-600' : 'text-red-600'}`}>
                          {inspectedUser.isActive ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Premium Status</p>
                        <p className={`font-semibold ${inspectedUser.isPremium ? 'text-yellow-600' : 'text-gray-600'}`}>
                          {inspectedUser.isPremium ? 'Premium' : 'Free'}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Approval Status</p>
                        <p className={`font-semibold ${inspectedUser.isApproved ? 'text-green-600' : 'text-orange-600'}`}>
                          {inspectedUser.isApproved ? 'Approved' : 'Pending'}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Messages Sent</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{inspectedUser.messagesSent || 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-purple-600" />
                      Recent Activity
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last Login</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {inspectedUser.lastLogin ? new Date(inspectedUser.lastLogin).toLocaleString() : 'Never'}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last Message Sent</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {inspectedUser.lastMessageSentAt ? new Date(inspectedUser.lastMessageSentAt).toLocaleString() : 'Never'}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Account Created</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {inspectedUser.createdAt ? new Date(inspectedUser.createdAt).toLocaleString() : '-'}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last Updated</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {inspectedUser.updatedAt ? new Date(inspectedUser.updatedAt).toLocaleString() : '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Partner Preferences */}
                  {inspectedUser.partnerPreferences && (
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Star className="w-5 h-5 text-purple-600" />
                        Partner Preferences
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.entries(inspectedUser.partnerPreferences).map(([key, value]) => (
                          value && (
                            <div key={key} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 capitalize">{key}</p>
                              <p className="font-semibold text-gray-900 dark:text-white capitalize">{value}</p>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
