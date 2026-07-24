import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { adminAPI, messageAPI, userAPI, giftAPI, achievementAPI, successStoryAPI, blogAPI, eventAPI, redemptionAPI, walletAPI, premiumAPI } from '../../services/api';
import PremiumBadge from '../../components/ui/PremiumBadge';
import { toast } from 'react-toastify';
import {
  Users, User, UserCheck, Activity,
  CheckCircle, XCircle, Trash2, Shield, Crown, AlertTriangle, DollarSign, MessageSquare, MoreVertical,
  Eye, X, Heart, Phone, Star, Clock, Gift, Trophy, Heart as HeartIcon, FileText, Calendar, Plus, Edit
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

  // New feature states
  const [gifts, setGifts] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [successStories, setSuccessStories] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [, setRedemptionConfigs] = useState([]);
  const [, setRedemptions] = useState([]);
  const [walletPaymentRequests, setWalletPaymentRequests] = useState([]);
  
  // Premium Plan management states
  const [premiumPlans, setPremiumPlans] = useState([]);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planFormData, setPlanFormData] = useState({
    name: '',
    badge: 'bronze',
    price: 500,
    currency: 'LKR',
    durationDays: 7,
    description: '',
    features: '',
    isPopular: false,
    isActive: true,
  });
  
  // Gift management states
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [editingGift, setEditingGift] = useState(null);
  const [giftFormData, setGiftFormData] = useState({
    name: '',
    emoji: '',
    category: 'gifts',
    price: 0,
    currency: 'LKR',
    isPremium: false,
    isRecommended: false,
    isActive: true,
    rarity: 'common'
  });

  // Event management states
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventFormData, setEventFormData] = useState({
    title: '',
    description: '',
    eventType: 'social',
    startDate: '',
    endDate: '',
    location: { city: '', venue: '', address: '' },
    maxAttendees: 100,
    price: 0,
    imageUrl: '',
    isPublished: false,
    isFeatured: false
  });

  // Success Story management states
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [editingStory, setEditingStory] = useState(null);
  const [storyFormData, setStoryFormData] = useState({
    coupleName: '',
    story: '',
    imageUrl: '',
    weddingDate: '',
    isPublished: false,
    isFeatured: false
  });

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
      const [statsRes, usersRes, premiumRes, plansRes, conversationsRes, giftsRes, achievementsRes, storiesRes, blogRes, eventsRes, configsRes, redemptionsRes, walletReqsRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getAllUsers(),
        adminAPI.getPremiumRequests(),
        premiumAPI.getAllPlansAdmin(),
        messageAPI.getConversations(),
        giftAPI.getGifts(),
        achievementAPI.getAchievements(),
        successStoryAPI.getSuccessStories(),
        blogAPI.getBlogPosts(),
        eventAPI.getEvents(),
        redemptionAPI.getConfigs(),
        redemptionAPI.getAllRedemptions(),
        walletAPI.getAllPaymentRequests()
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setPremiumRequests(premiumRes.data);
      setPremiumPlans(plansRes.data || []);
      setConversations(conversationsRes.data);
      setUnreadMessagesCount(conversationsRes.data.reduce((sum, convo) => sum + (convo.unreadCount || 0), 0));
      setGifts(giftsRes.data);
      setAchievements(achievementsRes.data);
      setSuccessStories(storiesRes.data);
      setBlogPosts(blogRes.data);
      setEvents(eventsRes.data);
      setRedemptionConfigs(configsRes.data);
      setRedemptions(redemptionsRes.data);
      setWalletPaymentRequests(walletReqsRes.data || []);
    } catch (error) {
      console.error('Failed to fetch admin data', error);
      toast.error(t('admin.fetchFailed', { defaultValue: 'Failed to fetch data' }));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Premium Plan handlers
  const handleAddPlan = () => {
    setEditingPlan(null);
    setPlanFormData({
      name: '',
      badge: 'bronze',
      price: 500,
      currency: 'LKR',
      durationDays: 7,
      description: '',
      features: '',
      isPopular: false,
      isActive: true,
    });
    setShowPlanModal(true);
  };

  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
    setPlanFormData({
      name: plan.name,
      badge: plan.badge,
      price: plan.price,
      currency: plan.currency || 'LKR',
      durationDays: plan.durationDays,
      description: plan.description || '',
      features: Array.isArray(plan.features) ? plan.features.join(', ') : '',
      isPopular: plan.isPopular || false,
      isActive: plan.isActive !== false,
    });
    setShowPlanModal(true);
  };

  const handleSavePlan = async () => {
    try {
      const payload = {
        ...planFormData,
        price: parseFloat(planFormData.price),
        durationDays: parseInt(planFormData.durationDays, 10),
        features: planFormData.features ? planFormData.features.split(',').map(s => s.trim()).filter(Boolean) : [],
      };

      if (editingPlan) {
        await premiumAPI.updatePlan(editingPlan._id, payload);
        toast.success('Plan updated successfully');
      } else {
        await premiumAPI.createPlan(payload);
        toast.success('Plan created successfully');
      }
      setShowPlanModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save plan');
    }
  };

  const handleDeletePlan = async (id) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      try {
        await premiumAPI.deletePlan(id);
        toast.success('Plan deleted');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete plan');
      }
    }
  };

  const handleTogglePlan = async (id) => {
    try {
      await premiumAPI.togglePlan(id);
      toast.success('Plan status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update plan status');
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchConversations();
    }, 20000);

    return () => clearInterval(intervalId);
  }, []);

  const handleApproveWalletPayment = async (id) => {
    try {
      await walletAPI.approvePaymentRequest(id);
      toast.success('Wallet top-up approved & points added to user!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve payment request');
    }
  };

  const handleRejectWalletPayment = async (id) => {
    const reason = window.prompt('Enter rejection reason (optional):', '');
    if (reason !== null) {
      try {
        await walletAPI.rejectPaymentRequest(id, reason);
        toast.success('Wallet payment request rejected');
        fetchData();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to reject payment request');
      }
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
      toast.error(t('admin.rejectUserFailed', { defaultValue: 'Failed to revoke approval' }));
    }
  };

  // Gift management handlers
  const handleAddGift = () => {
    setEditingGift(null);
    setGiftFormData({
      name: '',
      emoji: '',
      category: 'gifts',
      price: 0,
      currency: 'LKR',
      isPremium: false,
      isRecommended: false,
      isActive: true,
      rarity: 'common'
    });
    setShowGiftModal(true);
  };

  const handleEditGift = (gift) => {
    setEditingGift(gift);
    setGiftFormData({
      name: gift.name,
      emoji: gift.emoji,
      category: gift.category,
      price: gift.price,
      currency: gift.currency || 'LKR',
      isPremium: gift.isPremium,
      isRecommended: gift.isRecommended,
      isActive: gift.isActive,
      rarity: gift.rarity
    });
    setShowGiftModal(true);
  };

  const handleSaveGift = async () => {
    try {
      if (editingGift) {
        await giftAPI.updateGift(editingGift._id, giftFormData);
        toast.success('Gift updated successfully');
      } else {
        await giftAPI.createGift(giftFormData);
        toast.success('Gift created successfully');
      }
      setShowGiftModal(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to save gift');
    }
  };

  const handleDeleteGift = async (giftId) => {
    if (window.confirm('Are you sure you want to delete this gift?')) {
      try {
        await giftAPI.deleteGift(giftId);
        toast.success('Gift deleted successfully');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete gift');
      }
    }
  };

  const handleToggleGiftActive = async (gift) => {
    try {
      await giftAPI.updateGift(gift._id, { ...gift, isActive: !gift.isActive });
      toast.success(`Gift ${gift.isActive ? 'disabled' : 'enabled'} successfully`);
      fetchData();
    } catch (error) {
      toast.error('Failed to toggle gift status');
    }
  };

  // Event management handlers
  const handleAddEvent = () => {
    setEditingEvent(null);
    setEventFormData({
      title: '',
      description: '',
      eventType: 'social',
      startDate: '',
      endDate: '',
      location: { city: '', venue: '', address: '' },
      maxAttendees: 100,
      price: 0,
      imageUrl: '',
      isPublished: false,
      isFeatured: false
    });
    setShowEventModal(true);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setEventFormData({
      title: event.title,
      description: event.description,
      eventType: event.eventType,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location || { city: '', venue: '', address: '' },
      maxAttendees: event.maxAttendees,
      price: event.price,
      imageUrl: event.imageUrl,
      isPublished: event.isPublished,
      isFeatured: event.isFeatured
    });
    setShowEventModal(true);
  };

  const handleSaveEvent = async () => {
    try {
      if (editingEvent) {
        await eventAPI.updateEvent(editingEvent._id, eventFormData);
        toast.success('Event updated successfully');
      } else {
        await eventAPI.createEvent(eventFormData);
        toast.success('Event created successfully');
      }
      setShowEventModal(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to save event');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await eventAPI.deleteEvent(eventId);
        toast.success('Event deleted successfully');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete event');
      }
    }
  };

  // Success Story management handlers
  const handleAddStory = () => {
    setEditingStory(null);
    setStoryFormData({
      coupleName: '',
      story: '',
      imageUrl: '',
      weddingDate: '',
      isPublished: false,
      isFeatured: false
    });
    setShowStoryModal(true);
  };

  const handleEditStory = (story) => {
    setEditingStory(story);
    setStoryFormData({
      coupleName: story.coupleName,
      story: story.story,
      imageUrl: story.imageUrl,
      weddingDate: story.weddingDate,
      isPublished: story.isPublished,
      isFeatured: story.isFeatured
    });
    setShowStoryModal(true);
  };

  const handleSaveStory = async () => {
    try {
      if (editingStory) {
        await successStoryAPI.updateStory(editingStory._id, storyFormData);
        toast.success('Story updated successfully');
      } else {
        await successStoryAPI.createSuccessStory(storyFormData);
        toast.success('Story created successfully');
      }
      setShowStoryModal(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to save story');
    }
  };

  const handleDeleteStory = async (storyId) => {
    if (window.confirm('Are you sure you want to delete this story?')) {
      try {
        await successStoryAPI.deleteSuccessStory(storyId);
        toast.success('Story deleted successfully');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete story');
      }
    }
  };

  const handleApproveStory = async (storyId) => {
    try {
      await successStoryAPI.approveSuccessStory(storyId);
      toast.success('Story approved successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to approve story');
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
            onClick={() => setActiveTab('plans')}
            className={`px-3 sm:px-4 py-2.5 rounded-full text-sm font-semibold flex items-center space-x-2 ${activeTab === 'plans'
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
          >
            <Crown className="w-4 h-4 text-yellow-500" />
            <span>Premium Plans</span>
          </button>
          <button
            onClick={() => setActiveTab('wallet-requests')}
            className={`px-3 sm:px-4 py-2.5 rounded-full text-sm font-semibold flex items-center space-x-2 ${activeTab === 'wallet-requests'
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Wallet Topups</span>
            {walletPaymentRequests.filter(r => r.status === 'pending').length > 0 && (
              <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                {walletPaymentRequests.filter(r => r.status === 'pending').length}
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
          <button
            onClick={() => setActiveTab('gifts')}
            className={`px-3 sm:px-4 py-2.5 rounded-full text-sm font-semibold flex items-center space-x-2 ${activeTab === 'gifts'
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
          >
            <Gift className="w-4 h-4" />
            <span>Gifts</span>
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`px-3 sm:px-4 py-2.5 rounded-full text-sm font-semibold flex items-center space-x-2 ${activeTab === 'achievements'
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Achievements</span>
          </button>
          <button
            onClick={() => setActiveTab('stories')}
            className={`px-3 sm:px-4 py-2.5 rounded-full text-sm font-semibold flex items-center space-x-2 ${activeTab === 'stories'
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
          >
            <HeartIcon className="w-4 h-4" />
            <span>Success Stories</span>
          </button>
          <button
            onClick={() => setActiveTab('blog')}
            className={`px-3 sm:px-4 py-2.5 rounded-full text-sm font-semibold flex items-center space-x-2 ${activeTab === 'blog'
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
          >
            <FileText className="w-4 h-4" />
            <span>Blog</span>
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-3 sm:px-4 py-2.5 rounded-full text-sm font-semibold flex items-center space-x-2 ${activeTab === 'events'
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Events</span>
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

        {/* Premium Plans tab */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Crown className="w-6 h-6 text-yellow-500" />
                  <span>Premium Membership Plans</span>
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Manage pricing, durations, features, and active status for subscription plans.
                </p>
              </div>
              <button
                onClick={handleAddPlan}
                className="btn-primary flex items-center justify-center space-x-2 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Plan</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {premiumPlans.map((plan) => (
                <div
                  key={plan._id}
                  className={`glass-card p-6 rounded-2xl relative border-2 flex flex-col justify-between ${
                    plan.isActive ? 'border-purple-200 dark:border-purple-900/50' : 'border-gray-200 dark:border-slate-800 opacity-70'
                  }`}
                >
                  {plan.isPopular && (
                    <span className="absolute -top-3 right-6 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full">
                      POPULAR
                    </span>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <PremiumBadge plan={plan.badge} size="md" />
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${plan.isActive ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-400'}`}>
                        {plan.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{plan.description}</p>

                    <div className="mb-4">
                      <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                        LKR {plan.price}
                      </span>
                      <span className="text-xs text-purple-600 dark:text-purple-400 font-bold block mt-0.5">
                        Duration: {plan.durationDays} Days
                      </span>
                    </div>

                    <div className="space-y-1.5 mb-6">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Features:</p>
                      {plan.features?.map((feat, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <button
                      onClick={() => handleEditPlan(plan)}
                      className="flex-1 py-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 rounded-lg text-xs font-bold hover:bg-purple-100 transition flex items-center justify-center gap-1"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleTogglePlan(plan._id)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                        plan.isActive
                          ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300 hover:bg-amber-100'
                          : 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-300 hover:bg-green-100'
                      }`}
                    >
                      {plan.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan._id)}
                      className="p-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 transition"
                      title="Delete plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'wallet-requests' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Wallet Top-up Payment Requests</h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Review payment slips & approve user points/balance
              </span>
            </div>

            {walletPaymentRequests.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-300">No wallet payment requests yet</p>
              </div>
            ) : (
              walletPaymentRequests.map((request) => {
                const userObj = request.user || {};
                const slipUrl = request.slipImageUrl?.startsWith('http')
                  ? request.slipImageUrl
                  : `${(process.env.REACT_APP_API_URL || 'https://kapu-lk-2.onrender.com').replace('/api', '')}${request.slipImageUrl?.startsWith('/') ? '' : '/'}${request.slipImageUrl?.replace(/\\/g, '/')}`;

                return (
                  <div key={request._id} className="glass-card p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          {userObj.profileImageUrl ? (
                            <img
                              src={userObj.profileImageUrl}
                              alt={userObj.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-green-600 dark:text-green-400 font-semibold">
                              {(userObj.name || 'U').charAt(0)}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1">
                          <h3 className="font-bold text-gray-900 dark:text-white">{userObj.name || 'User'}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{userObj.email}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            <strong>Bank:</strong> {request.bankName}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            <strong>Account Holder:</strong> {request.accountHolder || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            <strong>Amount:</strong> <span className="text-green-600 dark:text-green-400 font-bold">Rs. {request.amount} LKR</span>
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            <strong>Transaction Ref:</strong> {request.transactionReference}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            <strong>Date:</strong> {new Date(request.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-3 min-w-[200px]">
                        {request.slipImageUrl && (
                          <a
                            href={slipUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary text-center flex items-center justify-center space-x-1"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View Payment Slip</span>
                          </a>
                        )}

                        {request.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApproveWalletPayment(request._id)}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg font-semibold flex items-center justify-center space-x-1 transition"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Approve Points</span>
                            </button>
                            <button
                              onClick={() => handleRejectWalletPayment(request._id)}
                              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-lg font-semibold flex items-center justify-center space-x-1 transition text-sm"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>Reject</span>
                            </button>
                          </div>
                        )}

                        {request.status === 'approved' && (
                          <span className="text-center text-green-600 font-semibold bg-green-50 dark:bg-green-900/20 py-2 rounded-lg">
                            ✓ Approved & Points Credited
                          </span>
                        )}

                        {request.status === 'rejected' && (
                          <span className="text-center text-red-600 font-semibold bg-red-50 dark:bg-red-900/20 py-2 rounded-lg">
                            ✗ Rejected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
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

        {/* Gifts Management */}
        {activeTab === 'gifts' && (
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gifts Management</h2>
              <button
                onClick={handleAddGift}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg text-sm font-semibold hover:from-pink-600 hover:to-purple-600 transition-all flex items-center gap-2"
              >
                <Gift className="w-4 h-4" />
                Add Gift
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {gifts.map((gift) => (
                  <div key={gift._id} className={`bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center ${!gift.isActive ? 'opacity-50' : ''}`}>
                    <div className="text-4xl mb-2">{gift.emoji}</div>
                    <p className="font-semibold text-gray-900 dark:text-white">{gift.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Rs. {gift.price} {gift.currency}</p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      {gift.isPremium && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Premium</span>}
                      {gift.isRecommended && <span className="text-xs bg-pink-100 text-pink-800 px-2 py-1 rounded">Popular</span>}
                      {!gift.isActive && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Disabled</span>}
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-3">
                      <button
                        onClick={() => handleEditGift(gift)}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleGiftActive(gift)}
                        className="text-green-600 hover:text-green-700 text-sm"
                      >
                        {gift.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleDeleteGift(gift._id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {gifts.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">No gifts configured</p>
              )}
            </div>
          </div>
        )}

        {/* Achievements Management */}
        {activeTab === 'achievements' && (
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Achievements Management</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {achievements.map((achievement) => (
                  <div key={achievement._id} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center">
                    <div className="text-4xl mb-2">{achievement.icon}</div>
                    <p className="font-semibold text-gray-900 dark:text-white">{achievement.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{achievement.points} points</p>
                  </div>
                ))}
              </div>
              {achievements.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">No achievements configured</p>
              )}
            </div>
          </div>
        )}

        {/* Success Stories Management */}
        {activeTab === 'stories' && (
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Success Stories Management</h2>
              <button
                onClick={handleAddStory}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg text-sm font-semibold hover:from-pink-600 hover:to-purple-600 transition-all flex items-center gap-2"
              >
                <Heart className="w-4 h-4" />
                Add Story
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Couple</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Wedding Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Likes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {successStories.map((story) => (
                    <tr key={story._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-medium text-gray-900 dark:text-white">{story.coupleName}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {story.weddingDate ? new Date(story.weddingDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          story.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {story.status}
                        </span>
                        {story.isFeatured && (
                          <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                            Featured
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {story.likeCount || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {story.status !== 'approved' && (
                          <button
                            onClick={() => handleApproveStory(story._id)}
                            className="text-green-600 hover:text-green-700 mr-3"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => handleEditStory(story)}
                          className="text-blue-600 hover:text-blue-700 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteStory(story._id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {successStories.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">No success stories</p>
              )}
            </div>
          </div>
        )}

        {/* Blog Management */}
        {activeTab === 'blog' && (
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Blog Management</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Author</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {blogPosts.map((post) => (
                    <tr key={post._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-medium text-gray-900 dark:text-white">{post.title}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {post.author?.name || 'Admin'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          post.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {post.published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => {
                            if (window.confirm(post.published ? 'Unpublish this post?' : 'Publish this post?')) {
                              blogAPI.publishBlogPost(post._id).then(() => {
                                toast.success('Post status updated');
                                fetchData();
                              });
                            }
                          }}
                          className="text-purple-600 hover:text-purple-700 mr-3"
                        >
                          {post.published ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Delete this post?')) {
                              blogAPI.deleteBlogPost(post._id).then(() => {
                                toast.success('Post deleted');
                                fetchData();
                              });
                            }
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {blogPosts.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">No blog posts</p>
              )}
            </div>
          </div>
        )}

        {/* Events Management */}
        {activeTab === 'events' && (
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Events Management</h2>
              <button
                onClick={handleAddEvent}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg text-sm font-semibold hover:from-pink-600 hover:to-purple-600 transition-all flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Add Event
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Event</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Attendees</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {events.map((event) => (
                    <tr key={event._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-medium text-gray-900 dark:text-white">{event.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{event.eventType}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {new Date(event.startDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {event.location?.city || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {event.currentAttendees || 0} / {event.maxAttendees || '∞'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          event.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {event.isPublished ? 'Published' : 'Draft'}
                        </span>
                        {event.isFeatured && (
                          <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                            Featured
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleEditEvent(event)}
                          className="text-blue-600 hover:text-blue-700 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event._id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {events.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">No events</p>
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

      {/* Gift Modal */}
      {showGiftModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {editingGift ? 'Edit Gift' : 'Add New Gift'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gift Name</label>
                  <input
                    type="text"
                    value={giftFormData.name}
                    onChange={(e) => setGiftFormData({ ...giftFormData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Emoji</label>
                  <input
                    type="text"
                    value={giftFormData.emoji}
                    onChange={(e) => setGiftFormData({ ...giftFormData, emoji: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="🎁"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select
                    value={giftFormData.category}
                    onChange={(e) => setGiftFormData({ ...giftFormData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="flowers">Flowers</option>
                    <option value="hearts">Hearts</option>
                    <option value="food">Food</option>
                    <option value="drinks">Drinks</option>
                    <option value="gifts">Gifts</option>
                    <option value="special">Special</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price (LKR)</label>
                    <input
                      type="number"
                      value={giftFormData.price}
                      onChange={(e) => setGiftFormData({ ...giftFormData, price: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rarity</label>
                    <select
                      value={giftFormData.rarity}
                      onChange={(e) => setGiftFormData({ ...giftFormData, rarity: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="common">Common</option>
                      <option value="rare">Rare</option>
                      <option value="epic">Epic</option>
                      <option value="legendary">Legendary</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={giftFormData.isPremium}
                      onChange={(e) => setGiftFormData({ ...giftFormData, isPremium: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Premium</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={giftFormData.isRecommended}
                      onChange={(e) => setGiftFormData({ ...giftFormData, isRecommended: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Recommended</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={giftFormData.isActive}
                      onChange={(e) => setGiftFormData({ ...giftFormData, isActive: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveGift}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-semibold hover:from-pink-600 hover:to-purple-600 transition-all"
                >
                  {editingGift ? 'Update' : 'Create'}
                </button>
                <button
                  onClick={() => setShowGiftModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {editingEvent ? 'Edit Event' : 'Add New Event'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Title</label>
                  <input
                    type="text"
                    value={eventFormData.title}
                    onChange={(e) => setEventFormData({ ...eventFormData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea
                    value={eventFormData.description}
                    onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Type</label>
                    <select
                      value={eventFormData.eventType}
                      onChange={(e) => setEventFormData({ ...eventFormData, eventType: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="social">Social</option>
                      <option value="workshop">Workshop</option>
                      <option value="meetup">Meetup</option>
                      <option value="party">Party</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Attendees</label>
                    <input
                      type="number"
                      value={eventFormData.maxAttendees}
                      onChange={(e) => setEventFormData({ ...eventFormData, maxAttendees: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                    <input
                      type="datetime-local"
                      value={eventFormData.startDate}
                      onChange={(e) => setEventFormData({ ...eventFormData, startDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                    <input
                      type="datetime-local"
                      value={eventFormData.endDate}
                      onChange={(e) => setEventFormData({ ...eventFormData, endDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                    <input
                      type="text"
                      value={eventFormData.location.city}
                      onChange={(e) => setEventFormData({ ...eventFormData, location: { ...eventFormData.location, city: e.target.value } })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Venue</label>
                    <input
                      type="text"
                      value={eventFormData.location.venue}
                      onChange={(e) => setEventFormData({ ...eventFormData, location: { ...eventFormData.location, venue: e.target.value } })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                  <input
                    type="text"
                    value={eventFormData.location.address}
                    onChange={(e) => setEventFormData({ ...eventFormData, location: { ...eventFormData.location, address: e.target.value } })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image URL</label>
                  <input
                    type="text"
                    value={eventFormData.imageUrl}
                    onChange={(e) => setEventFormData({ ...eventFormData, imageUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="https://..."
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={eventFormData.isPublished}
                      onChange={(e) => setEventFormData({ ...eventFormData, isPublished: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Published</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={eventFormData.isFeatured}
                      onChange={(e) => setEventFormData({ ...eventFormData, isFeatured: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Featured</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveEvent}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-semibold hover:from-pink-600 hover:to-purple-600 transition-all"
                >
                  {editingEvent ? 'Update' : 'Create'}
                </button>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Story Modal */}
      {showStoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {editingStory ? 'Edit Success Story' : 'Add New Success Story'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Couple Name</label>
                  <input
                    type="text"
                    value={storyFormData.coupleName}
                    onChange={(e) => setStoryFormData({ ...storyFormData, coupleName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Story</label>
                  <textarea
                    value={storyFormData.story}
                    onChange={(e) => setStoryFormData({ ...storyFormData, story: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={5}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Wedding Date</label>
                  <input
                    type="date"
                    value={storyFormData.weddingDate}
                    onChange={(e) => setStoryFormData({ ...storyFormData, weddingDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image URL</label>
                  <input
                    type="text"
                    value={storyFormData.imageUrl}
                    onChange={(e) => setStoryFormData({ ...storyFormData, imageUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="https://..."
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={storyFormData.isPublished}
                      onChange={(e) => setStoryFormData({ ...storyFormData, isPublished: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Published</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={storyFormData.isFeatured}
                      onChange={(e) => setStoryFormData({ ...storyFormData, isFeatured: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Featured</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveStory}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-semibold hover:from-pink-600 hover:to-purple-600 transition-all"
                >
                  {editingStory ? 'Update' : 'Create'}
                </button>
                <button
                  onClick={() => setShowStoryModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingPlan ? 'Edit Premium Plan' : 'Create Premium Plan'}
              </h3>
              <button
                onClick={() => setShowPlanModal(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Plan Name</label>
                <input
                  type="text"
                  value={planFormData.name}
                  onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                  placeholder="e.g. Bronze Plan"
                  className="w-full px-3.5 py-2 border rounded-xl dark:bg-slate-700 dark:text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Badge Tier</label>
                  <select
                    value={planFormData.badge}
                    onChange={(e) => setPlanFormData({ ...planFormData, badge: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl dark:bg-slate-700 dark:text-white text-sm"
                  >
                    <option value="bronze">🥉 Bronze</option>
                    <option value="silver">🥈 Silver</option>
                    <option value="gold">🥇 Gold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Price (LKR)</label>
                  <input
                    type="number"
                    value={planFormData.price}
                    onChange={(e) => setPlanFormData({ ...planFormData, price: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl dark:bg-slate-700 dark:text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Duration (Days)</label>
                <input
                  type="number"
                  value={planFormData.durationDays}
                  onChange={(e) => setPlanFormData({ ...planFormData, durationDays: e.target.value })}
                  placeholder="e.g. 7, 14, 28"
                  className="w-full px-3 py-2 border rounded-xl dark:bg-slate-700 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={planFormData.description}
                  onChange={(e) => setPlanFormData({ ...planFormData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-xl dark:bg-slate-700 dark:text-white text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Features (comma separated)
                </label>
                <textarea
                  value={planFormData.features}
                  onChange={(e) => setPlanFormData({ ...planFormData, features: e.target.value })}
                  rows={3}
                  placeholder="Unlimited Messages, Priority Matching, Gold Badge"
                  className="w-full px-3 py-2 border rounded-xl dark:bg-slate-700 dark:text-white text-sm resize-none"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={planFormData.isPopular}
                    onChange={(e) => setPlanFormData({ ...planFormData, isPopular: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span>Popular Badge</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={planFormData.isActive}
                    onChange={(e) => setPlanFormData({ ...planFormData, isActive: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span>Active Plan</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSavePlan}
                  className="flex-1 btn-primary py-2.5"
                >
                  Save Plan
                </button>
                <button
                  onClick={() => setShowPlanModal(false)}
                  className="px-4 py-2.5 border rounded-xl text-gray-600 dark:text-gray-300 text-sm font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
