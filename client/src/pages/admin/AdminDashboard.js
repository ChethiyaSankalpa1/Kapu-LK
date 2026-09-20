import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { adminAPI, messageAPI, userAPI, giftAPI, achievementAPI, successStoryAPI, blogAPI, eventAPI, redemptionAPI, walletAPI, premiumAPI, maintenanceAPI } from '../../services/api';
import PremiumBadge from '../../components/ui/PremiumBadge';
import { toast } from 'react-toastify';
import {
  Users, User, UserCheck, Activity,
  CheckCircle, XCircle, Trash2, Shield, ShieldCheck, Crown, AlertTriangle, DollarSign, MessageSquare, MoreVertical,
  Eye, X, Heart, Phone, Star, Clock, Gift, Trophy, Heart as HeartIcon, FileText, Calendar, Plus, Edit, LifeBuoy, Power, LogOut,
  LayoutDashboard, Search, Bell, Sparkles, ArrowUpRight
} from 'lucide-react';
import SupportInboxTab from '../../components/admin/SupportInboxTab';
import InactivityTab from '../../components/admin/InactivityTab';
import MaintenanceTab from '../../components/admin/MaintenanceTab';
import AdminReportsTab from '../../components/admin/AdminReportsTab';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [premiumRequests, setPremiumRequests] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [reportsList, setReportsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [inspectedUser, setInspectedUser] = useState(null);
  const [inspectorLoading, setInspectorLoading] = useState(false);
  const [maintenanceStatus, setMaintenanceStatus] = useState(null);

  const checkMaintenanceStatus = useCallback(async () => {
    try {
      const res = await maintenanceAPI.getStatus();
      setMaintenanceStatus(res.data);
    } catch (e) {
      // fail safe
    }
  }, []);

  useEffect(() => {
    checkMaintenanceStatus();
  }, [checkMaintenanceStatus]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // New feature states
  const [gifts, setGifts] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [successStories, setSuccessStories] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [redemptionConfigs, setRedemptionConfigs] = useState([]);
  const [walletPaymentRequests, setWalletPaymentRequests] = useState([]);
  
  // Redemption config management states
  const [showRedemptionModal, setShowRedemptionModal] = useState(false);
  const [editingRedemptionConfig, setEditingRedemptionConfig] = useState(null);
  const [redemptionFormData, setRedemptionFormData] = useState({
    rewardType: 'premium',
    rewardName: '',
    pointsCost: 100,
    isActive: true,
    metadata: {}
  });
  
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

  // Blog management states
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [editingBlogPost, setEditingBlogPost] = useState(null);
  const [blogFormData, setBlogFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: 'dating',
    tags: '',
    coverImage: '',
    isPublished: true,
    isFeatured: false
  });

  // Premium grant modal states
  const [showPremiumGrantModal, setShowPremiumGrantModal] = useState(false);
  const [selectedUserForPremium, setSelectedUserForPremium] = useState(null);
  const [premiumGrantData, setPremiumGrantData] = useState({
    plan: 'gold',
    durationDays: 28
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
      const [statsRes, usersRes, premiumRes, plansRes, conversationsRes, giftsRes, achievementsRes, storiesRes, blogRes, eventsRes, configsRes, walletReqsRes, reportsRes] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getAllUsers(),
        adminAPI.getAllRequests(),
        premiumAPI.getAllPlansAdmin(),
        messageAPI.getConversations(),
        giftAPI.getGifts(),
        achievementAPI.getAchievements(),
        successStoryAPI.getAdminSuccessStories(),
        blogAPI.getAdminBlogPosts(),
        eventAPI.getEvents(),
        redemptionAPI.getConfigs(),
        walletAPI.getAllPaymentRequests(),
        adminAPI.getReports().catch(() => ({ data: [] }))
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
      setWalletPaymentRequests(walletReqsRes.data || []);
      setReportsList(reportsRes.data || []);
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

  const handleDeleteWalletPayment = async (id) => {
    try {
      await walletAPI.deletePaymentRequest(id);
      toast.success('Wallet payment request deleted');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete payment request');
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

  const handleEditRedemptionConfig = (config) => {
    setEditingRedemptionConfig(config);
    setRedemptionFormData({
      rewardType: config.rewardType,
      rewardName: config.rewardName,
      pointsCost: config.pointsCost,
      isActive: config.isActive,
      metadata: config.metadata || {}
    });
    setShowRedemptionModal(true);
  };

  const handleSaveRedemptionConfig = async () => {
    try {
      if (editingRedemptionConfig) {
        await redemptionAPI.updateRedemptionConfig(editingRedemptionConfig._id, redemptionFormData);
        toast.success('Config updated successfully');
      } else {
        await redemptionAPI.createRedemptionConfig(redemptionFormData);
        toast.success('Config created successfully');
      }
      setShowRedemptionModal(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to save config');
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

  // Blog management handlers
  const handleAddBlog = () => {
    setEditingBlogPost(null);
    setBlogFormData({
      title: '',
      content: '',
      excerpt: '',
      category: 'dating',
      tags: '',
      coverImage: '',
      isPublished: true,
      isFeatured: false
    });
    setShowBlogModal(true);
  };

  const handleEditBlog = (post) => {
    setEditingBlogPost(post);
    setBlogFormData({
      title: post.title || '',
      content: post.content || '',
      excerpt: post.excerpt || '',
      category: post.category || 'dating',
      tags: Array.isArray(post.tags) ? post.tags.join(', ') : (post.tags || ''),
      coverImage: post.coverImage || post.featuredImage || '',
      isPublished: post.isPublished !== undefined ? Boolean(post.isPublished) : Boolean(post.published),
      isFeatured: Boolean(post.featured || post.isFeatured)
    });
    setShowBlogModal(true);
  };

  const handleSaveBlog = async (e) => {
    if (e) e.preventDefault();
    try {
      if (editingBlogPost) {
        await blogAPI.updateBlogPost(editingBlogPost._id, blogFormData);
        toast.success('Blog post updated successfully');
      } else {
        await blogAPI.createBlogPost(blogFormData);
        toast.success('Blog post created and published!');
      }
      setShowBlogModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save blog post');
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

  const handleTogglePremium = async (userId, plan = 'remove') => {
    try {
      await adminAPI.togglePremium(userId, { plan });
      toast.success(t('admin.userPremiumUpdated', { defaultValue: 'User premium status updated' }));
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || t('admin.updatePremiumFailed', { defaultValue: 'Failed to update premium status' }));
    }
  };

  const handleGrantPremium = (user) => {
    setSelectedUserForPremium(user);
    setPremiumGrantData({
      plan: user.premiumPlan || 'gold',
      durationDays: 28
    });
    setShowPremiumGrantModal(true);
    setActiveDropdown(null);
  };

  const handleSavePremiumGrant = async () => {
    try {
      await adminAPI.togglePremium(selectedUserForPremium._id, premiumGrantData);
      toast.success(`Premium ${premiumGrantData.plan.toUpperCase()} granted to ${selectedUserForPremium.name} for ${premiumGrantData.durationDays} days`);
      setShowPremiumGrantModal(false);
      setSelectedUserForPremium(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to grant premium');
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

  const handleSeedSriLankanContent = async () => {
    if (!window.confirm('This will clear existing events, blogs, and success stories and add Sri Lankan content. Continue?')) {
      return;
    }
    try {
      const response = await adminAPI.seedSriLankanContent();
      toast.success(`✅ ${response.data.message}: ${response.data.events} events, ${response.data.blogs} blogs, ${response.data.successStories} stories`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to seed content');
    }
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

  const pendingPaymentReqs = walletPaymentRequests.filter(r => r.status === 'pending').length;
  const pendingComplaints = reportsList.filter(r => r.status === 'pending').length;
  const totalPendingBadges = pendingPaymentReqs + premiumRequests.length + pendingComplaints;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-gray-900 dark:text-gray-100 flex flex-col font-sans">
      {/* 1. TOP HEADER BAR */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 shadow-sm">
        {/* Left: Brand */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-pink-500/20">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="text-lg font-black bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent block leading-tight">LoveLK</span>
              <span className="text-[10px] text-gray-400 font-semibold block leading-tight">Find Your Perfect Match</span>
            </div>
          </div>
        </div>

        {/* Center: Search */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-4 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5" />
          <input
            type="text"
            placeholder="Search users by name, email, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-12 py-2 rounded-full border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/60 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
          <span className="absolute right-3 text-[10px] font-bold text-gray-400 bg-gray-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">Ctrl K</span>
        </div>

        {/* Right: Quick actions, notifications, admin profile, status */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 text-xs font-bold hover:bg-purple-100 transition"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>View Site</span>
          </button>

          <button
            onClick={() => setActiveTab('support')}
            className="relative p-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {totalPendingBadges > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {totalPendingBadges}
              </span>
            )}
          </button>

          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition group"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>

          <div className="hidden sm:flex items-center space-x-2 pl-1 sm:pl-2 border-l border-gray-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 text-white font-bold flex items-center justify-center text-xs shadow-sm shadow-purple-500/30">
              A
            </div>
            <span className="hidden md:block text-xs font-bold text-gray-800 dark:text-gray-200">Admin</span>
          </div>

          <div className="hidden md:flex items-center space-x-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <span>System Online</span>
          </div>
        </div>
      </header>

      {/* 2. BODY LAYOUT (SIDEBAR + MAIN CONTENT AREA) */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR */}
        <aside className="w-64 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 p-4 shrink-0 hidden lg:flex flex-col justify-between overflow-y-auto max-h-[calc(100vh-61px)] sticky top-[61px]">
          <div className="space-y-6">
            {/* OVERVIEW */}
            <div>
              <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-2">Overview</p>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition ${
                    activeTab === 'dashboard'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </div>
                </button>
              </div>
            </div>

            {/* USER MANAGEMENT */}
            <div>
              <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-2">User Management</p>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab('users')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition ${
                    activeTab === 'users'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Users className="w-4 h-4" />
                    <span>Users</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('support')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition ${
                    activeTab === 'support'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <LifeBuoy className="w-4 h-4 text-pink-500" />
                    <span>Support Inbox</span>
                  </div>
                  {unreadMessagesCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      {unreadMessagesCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('reports')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition ${
                    activeTab === 'reports'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span>Complaints</span>
                  </div>
                  {pendingComplaints > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      {pendingComplaints}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('inactivity')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition ${
                    activeTab === 'inactivity'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Clock className="w-4 h-4 text-rose-500" />
                    <span>Inactivity Engine</span>
                  </div>
                </button>
              </div>
            </div>

            {/* MONETIZATION & PAYMENTS */}
            <div>
              <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-2">Monetization</p>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab('plans')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition ${
                    activeTab === 'plans'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Crown className="w-4 h-4 text-yellow-500" />
                    <span>Premium Plans</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('wallet-requests')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition ${
                    activeTab === 'wallet-requests'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    <span>Wallet & Payments</span>
                  </div>
                  {pendingPaymentReqs > 0 && (
                    <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      {pendingPaymentReqs}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* CONTENT & ENGAGEMENT */}
            <div>
              <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-2">Content & Media</p>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab('blog')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition ${
                    activeTab === 'blog'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <FileText className="w-4 h-4" />
                    <span>Blog & Articles</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('events')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition ${
                    activeTab === 'events'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Calendar className="w-4 h-4" />
                    <span>Events</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('stories')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition ${
                    activeTab === 'stories'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <HeartIcon className="w-4 h-4 text-pink-500" />
                    <span>Success Stories</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('gifts')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition ${
                    activeTab === 'gifts'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Gift className="w-4 h-4 text-purple-400" />
                    <span>Gifts & Rewards</span>
                  </div>
                </button>
              </div>
            </div>

            {/* SYSTEM & SECURITY */}
            <div>
              <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-2">System & Settings</p>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab('maintenance')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition ${
                    activeTab === 'maintenance'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Power className="w-4 h-4 text-amber-500" />
                    <span>Maintenance Mode</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('achievements')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition ${
                    activeTab === 'achievements'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>Achievements</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('redemption')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition ${
                    activeTab === 'redemption'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span>Redemptions</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar Footer Actions */}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800 space-y-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition"
            >
              <div className="flex items-center space-x-2.5">
                <ArrowUpRight className="w-4 h-4" />
                <span>View Public Site</span>
              </div>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition"
            >
              <div className="flex items-center space-x-2.5">
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </div>
            </button>
          </div>

          {/* Bottom Promo Card */}
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg space-y-2">
            <div className="flex items-center space-x-2 font-bold text-xs">
              <Crown className="w-4 h-4 text-yellow-300" />
              <span>Keep LoveLK Safe</span>
            </div>
            <p className="text-[11px] text-purple-100 leading-tight">
              Your administrative moderation creates genuine Sri Lankan matchmaking connections.
            </p>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-[calc(100vh-61px)] space-y-6">
          {/* Mobile navigation tab list */}
          <div className="lg:hidden flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
            <button onClick={() => setActiveTab('dashboard')} className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 ${activeTab === 'dashboard' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300'}`}>Dashboard</button>
            <button onClick={() => setActiveTab('users')} className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 ${activeTab === 'users' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300'}`}>Users</button>
            <button onClick={() => setActiveTab('reports')} className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 ${activeTab === 'reports' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300'}`}>Complaints ({pendingComplaints})</button>
            <button onClick={() => setActiveTab('wallet-requests')} className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 ${activeTab === 'wallet-requests' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300'}`}>Wallet Topups ({pendingPaymentReqs})</button>
            <button onClick={() => setActiveTab('plans')} className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 ${activeTab === 'plans' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300'}`}>Plans</button>
            <button onClick={() => setActiveTab('support')} className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 ${activeTab === 'support' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300'}`}>Support</button>
            <button onClick={() => setActiveTab('maintenance')} className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 ${activeTab === 'maintenance' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300'}`}>Maintenance</button>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100 transition flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>

          {/* Maintenance Active Alert Banner */}
          {maintenanceStatus?.isActive && (
            <div className="p-4 bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-2xl shadow-md flex items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-6 h-6 text-yellow-300 shrink-0" />
                <div>
                  <h4 className="font-bold text-xs sm:text-sm">Platform Maintenance Mode is Active ({maintenanceStatus.scope})</h4>
                  <p className="text-[11px] text-red-100">Public visitors see the maintenance screen. Admins bypass automatically.</p>
                </div>
              </div>
              <button onClick={() => setActiveTab('maintenance')} className="px-3 py-1.5 bg-white text-red-700 rounded-xl text-xs font-black hover:bg-red-50 transition">
                Manage
              </button>
            </div>
          )}

          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Header section */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <Shield className="w-6 h-6 text-purple-600" />
                    <span>Admin Dashboard</span>
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Manage users, payments, content and keep LoveLK safe, secure and active.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleSeedSriLankanContent}
                    className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-xs font-bold hover:from-emerald-600 hover:to-teal-700 transition flex items-center gap-1.5 shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Seed Sri Lankan Content</span>
                  </button>
                </div>
              </div>

              {/* 7 Key Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                <div className="glass-card p-4 rounded-2xl border border-gray-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">↑ 12%</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Users</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white">{stats?.totalUsers || users.length || 0}</p>
                </div>

                <div className="glass-card p-4 rounded-2xl border border-gray-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <UserCheck className="w-5 h-5 text-emerald-500" />
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">Verified</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Approved Users</p>
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{stats?.approvedUsers || users.filter(u => u.isApproved).length || 0}</p>
                </div>

                <div className="glass-card p-4 rounded-2xl border border-gray-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <Activity className="w-5 h-5 text-purple-500" />
                    <span className="text-[10px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded">7 Days</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Active Users</p>
                  <p className="text-xl font-black text-purple-600 dark:text-purple-400">{stats?.activeUsers || 0}</p>
                </div>

                <div className="glass-card p-4 rounded-2xl border border-gray-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <Crown className="w-5 h-5 text-yellow-500" />
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">VIP</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Premium Members</p>
                  <p className="text-xl font-black text-amber-500">{stats?.premiumUsers || users.filter(u => u.isPremium).length || 0}</p>
                </div>

                <div className="glass-card p-4 rounded-2xl border border-gray-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign className="w-5 h-5 text-emerald-500" />
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">Topups</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Pending Requests</p>
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{pendingPaymentReqs + premiumRequests.length}</p>
                </div>

                <div className="glass-card p-4 rounded-2xl border border-gray-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <MessageSquare className="w-5 h-5 text-indigo-500" />
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded">Live</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Messages Today</p>
                  <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">{stats?.totalMessages || conversations.length || 0}</p>
                </div>

                <div className="glass-card p-4 rounded-2xl border border-gray-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded">Safety</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Complaints</p>
                  <p className="text-xl font-black text-red-600 dark:text-red-400">{pendingComplaints}</p>
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div className="glass-card p-5 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-3">
                <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Administrative Quick Actions</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <button onClick={() => setActiveTab('users')} className="p-3 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 rounded-xl text-xs font-bold text-purple-700 dark:text-purple-300 transition text-center flex flex-col items-center gap-1.5">
                    <UserCheck className="w-5 h-5 text-purple-600" />
                    <span>Approve Users</span>
                  </button>
                  <button onClick={() => setActiveTab('wallet-requests')} className="p-3 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 transition text-center flex flex-col items-center gap-1.5">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    <span>Verify Payments</span>
                  </button>
                  <button onClick={() => setActiveTab('plans')} className="p-3 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 transition text-center flex flex-col items-center gap-1.5">
                    <Crown className="w-5 h-5 text-amber-600" />
                    <span>Manage Plans</span>
                  </button>
                  <button onClick={() => setActiveTab('reports')} className="p-3 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 rounded-xl text-xs font-bold text-red-700 dark:text-red-300 transition text-center flex flex-col items-center gap-1.5">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span>Review Complaints</span>
                  </button>
                  <button onClick={() => setActiveTab('support')} className="p-3 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 rounded-xl text-xs font-bold text-indigo-700 dark:text-indigo-300 transition text-center flex flex-col items-center gap-1.5">
                    <LifeBuoy className="w-5 h-5 text-indigo-600" />
                    <span>Support Tickets</span>
                  </button>
                  <button onClick={() => setActiveTab('maintenance')} className="p-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 transition text-center flex flex-col items-center gap-1.5">
                    <Power className="w-5 h-5 text-amber-500" />
                    <span>Maintenance</span>
                  </button>
                </div>
              </div>

              {/* Tables & Overview Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Users Table */}
                <div className="lg:col-span-2 glass-card p-5 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-600" />
                      <span>Recent User Registrations</span>
                    </h3>
                    <button onClick={() => setActiveTab('users')} className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline">
                      View All Users ➔
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 dark:bg-slate-800/60 text-gray-500 uppercase font-bold text-[10px]">
                        <tr>
                          <th className="p-2.5 rounded-l-lg">User</th>
                          <th className="p-2.5">Email</th>
                          <th className="p-2.5">Location</th>
                          <th className="p-2.5">Status</th>
                          <th className="p-2.5 rounded-r-lg text-right">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                        {users.slice(0, 5).map((u) => (
                          <tr key={u._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition">
                            <td className="p-2.5 flex items-center space-x-2 font-semibold text-gray-900 dark:text-white">
                              <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0">
                                {u.profileImageUrl ? (
                                  <img src={u.profileImageUrl} alt={u.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  <span className="font-bold text-purple-600 text-[10px]">{(u.name || 'U').charAt(0)}</span>
                                )}
                              </div>
                              <span className="truncate max-w-[120px]">{u.name}</span>
                            </td>
                            <td className="p-2.5 text-gray-500 dark:text-gray-400 truncate max-w-[140px]">{u.email}</td>
                            <td className="p-2.5 text-gray-700 dark:text-gray-300">{u.location || 'Sri Lanka'}</td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.isApproved ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'}`}>
                                {u.isApproved ? 'Active' : 'Pending'}
                              </span>
                            </td>
                            <td className="p-2.5 text-right text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right Side Column: System Status & Recent Payments */}
                <div className="space-y-6">
                  {/* System Status Checklist */}
                  <div className="glass-card p-5 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-3">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>System Operational Status</span>
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-slate-800/40">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Website & Platform</span>
                        <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Operational</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-slate-800/40">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Database Engine</span>
                        <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Operational</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-slate-800/40">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Payment Verification</span>
                        <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Operational</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-slate-800/40">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Cloudinary File Storage</span>
                        <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Operational</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENTS */}
          {activeTab === 'reports' && <AdminReportsTab />}
          {activeTab === 'support' && <SupportInboxTab />}
          {activeTab === 'inactivity' && <InactivityTab />}
          {activeTab === 'maintenance' && <MaintenanceTab />}

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
                                    handleGrantPremium(user);
                                    setActiveDropdown(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-yellow-600 dark:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                  <Crown className="w-4 h-4" />
                                  <span>Grant Premium</span>
                                </button>
                                {user.isPremium && (
                                  <button
                                    onClick={() => {
                                      handleTogglePremium(user._id);
                                      setActiveDropdown(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                  >
                                    <X className="w-4 h-4" />
                                    <span>Remove Premium</span>
                                  </button>
                                )}
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
              premiumRequests.map((request) => {
                const userObj = request.user || {};
                const slipUrl = request.paymentSlipUrl?.startsWith('http')
                  ? request.paymentSlipUrl
                  : request.paymentSlipUrl ? `${(typeof window !== 'undefined' && window.location.hostname.endsWith('vercel.app')) ? '' : (process.env.REACT_APP_API_URL || 'https://kapu-lk-2.onrender.com').replace('/api', '')}${request.paymentSlipUrl.startsWith('/') ? '' : '/'}${request.paymentSlipUrl.replace(/\\/g, '/')}` : null;

                return (
                  <div key={request._id} className="glass-card p-6 rounded-2xl border border-gray-100 dark:border-slate-800">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                          {userObj.profileImageUrl ? (
                            <img
                              src={userObj.profileImageUrl}
                              alt={userObj.name || 'User'}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-purple-600 dark:text-purple-400 font-bold text-lg">
                              {(userObj.name || 'U').charAt(0)}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-gray-900 dark:text-white">{userObj.name || 'User'}</h3>
                            {request.planName && (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm">
                                {request.planName}
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 uppercase">
                              {request.paymentMethod ? request.paymentMethod.replace('_', ' ') : 'Bank Transfer'}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{userObj.email} {userObj.phoneNumber ? `• ${userObj.phoneNumber}` : ''}</p>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 pt-1 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                            <p><strong>Bank / Channel:</strong> {request.bank || 'Direct Transfer'}</p>
                            <p><strong>Account / Payer:</strong> {request.accountHolderName || request.payerName || 'N/A'}</p>
                            {request.payerPhone && <p><strong>Payer Phone:</strong> {request.payerPhone}</p>}
                            <p><strong>Amount:</strong> <span className="text-purple-600 dark:text-purple-400 font-bold">Rs. {request.paymentAmount} LKR</span></p>
                            {request.transactionReference && (
                              <p className="sm:col-span-2"><strong>Transaction Ref:</strong> <code className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-xs text-purple-600 dark:text-purple-400 font-semibold">{request.transactionReference}</code></p>
                            )}
                            {request.notes && (
                              <p className="sm:col-span-2 text-xs text-gray-500 italic"><strong>Remark:</strong> {request.notes}</p>
                            )}
                            <p className="text-xs text-gray-400"><strong>Date:</strong> {new Date(request.paymentDate || request.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-3 min-w-[200px]">
                        {slipUrl && (
                          <a
                            href={slipUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary text-center flex items-center justify-center space-x-1 py-2 text-xs font-bold"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View Payment Slip</span>
                          </a>
                        )}

                        {request.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApprovePremium(request._id)}
                              className="flex-1 btn-primary flex items-center justify-center space-x-1 py-2 text-xs font-bold"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleRejectPremium(request._id)}
                              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-lg font-semibold flex items-center justify-center space-x-1 text-xs transition"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>Reject</span>
                            </button>
                          </div>
                        )}

                        {request.status === 'approved' && (
                          <div className="flex items-center space-x-2">
                            <span className="flex-1 text-center text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-900/20 py-2 rounded-lg text-xs">
                              ✓ Approved & Active
                            </span>
                            <button
                              onClick={() => handleDeletePremiumRequest(request._id)}
                              className="bg-red-50 hover:bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 py-2 px-3 rounded-lg transition"
                              title="Delete Request"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        {request.status === 'rejected' && (
                          <div className="flex items-center space-x-2">
                            <span className="flex-1 text-center text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-900/20 py-2 rounded-lg text-xs">
                              ✗ Rejected
                            </span>
                            <button
                              onClick={() => handleDeletePremiumRequest(request._id)}
                              className="bg-red-50 hover:bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 py-2 px-3 rounded-lg transition"
                              title="Delete Request"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
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
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Wallet Top-up Payment Requests</h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Review payment slips & verify bank/eZ Cash/Binance transfers before crediting wallet balance.
                </p>
              </div>
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
                  : request.slipImageUrl ? `${(typeof window !== 'undefined' && window.location.hostname.endsWith('vercel.app')) ? '' : (process.env.REACT_APP_API_URL || 'https://kapu-lk-2.onrender.com').replace('/api', '')}${request.slipImageUrl.startsWith('/') ? '' : '/'}${request.slipImageUrl.replace(/\\/g, '/')}` : null;

                return (
                  <div key={request._id} className="glass-card p-6 rounded-2xl border border-gray-100 dark:border-slate-800">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                          {userObj.profileImageUrl ? (
                            <img
                              src={userObj.profileImageUrl}
                              alt={userObj.name || 'User'}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-green-600 dark:text-green-400 font-bold text-lg">
                              {(userObj.name || 'U').charAt(0)}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-gray-900 dark:text-white">{userObj.name || 'User'}</h3>
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 uppercase">
                              {request.paymentMethod ? request.paymentMethod.replace('_', ' ') : 'Bank Transfer'}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{userObj.email} {userObj.phoneNumber ? `• ${userObj.phoneNumber}` : ''}</p>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 pt-1 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                            <p><strong>Bank / Gateway:</strong> {request.bankName || 'Direct'}</p>
                            <p><strong>Account / Payer:</strong> {request.accountHolder || request.payerName || 'N/A'}</p>
                            {request.payerPhone && <p><strong>Payer Phone:</strong> {request.payerPhone}</p>}
                            <p><strong>Amount:</strong> <span className="text-green-600 dark:text-green-400 font-bold">Rs. {request.amount} LKR</span></p>
                            {request.transactionReference && (
                              <p className="sm:col-span-2"><strong>Transaction Ref:</strong> <code className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-xs text-green-600 dark:text-green-400 font-semibold">{request.transactionReference}</code></p>
                            )}
                            {request.notes && (
                              <p className="sm:col-span-2 text-xs text-gray-500 italic"><strong>Remark:</strong> {request.notes}</p>
                            )}
                            <p className="text-xs text-gray-400"><strong>Date:</strong> {new Date(request.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-3 min-w-[200px]">
                        {slipUrl && (
                          <a
                            href={slipUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary text-center flex items-center justify-center space-x-1 py-2 text-xs font-bold"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View Payment Slip</span>
                          </a>
                        )}

                        {request.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApproveWalletPayment(request._id)}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg font-semibold flex items-center justify-center space-x-1 transition text-xs shadow-md shadow-green-600/20"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Approve & Credit</span>
                            </button>
                            <button
                              onClick={() => handleRejectWalletPayment(request._id)}
                              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-lg font-semibold flex items-center justify-center space-x-1 transition text-xs"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>Reject</span>
                            </button>
                          </div>
                        )}

                        {request.status === 'approved' && (
                          <div className="flex items-center space-x-2">
                            <span className="flex-1 text-center text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-900/20 py-2 rounded-lg text-xs">
                              ✓ Approved & Credited
                            </span>
                            <button
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this payment request?')) {
                                  handleDeleteWalletPayment(request._id);
                                }
                              }}
                              className="bg-red-50 hover:bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 py-2 px-3 rounded-lg transition"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        {request.status === 'rejected' && (
                          <div className="flex items-center space-x-2">
                            <span className="flex-1 text-center text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-900/20 py-2 rounded-lg text-xs">
                              ✗ Rejected
                            </span>
                            <button
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this payment request?')) {
                                  handleDeleteWalletPayment(request._id);
                                }
                              }}
                              className="bg-red-50 hover:bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 py-2 px-3 rounded-lg transition"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Blogs & Articles Management</h2>
              <button
                onClick={handleAddBlog}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-xs font-bold shadow-md hover:from-purple-700 hover:to-pink-700 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Article</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Title & Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Author</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {blogPosts.map((post) => {
                    const isPub = post.isPublished !== undefined ? Boolean(post.isPublished) : Boolean(post.published);
                    return (
                      <tr key={post._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900 dark:text-white line-clamp-1">{post.title}</p>
                          <span className="text-[10px] uppercase font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-full inline-block mt-1">
                            {post.category || 'Dating'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {post.author?.name || 'Admin'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                            isPub ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                          }`}>
                            {isPub ? 'Published' : 'Draft / Hidden'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-bold space-x-2">
                          <button
                            onClick={() => {
                              blogAPI.publishBlogPost(post._id).then(() => {
                                toast.success(isPub ? 'Article moved to Draft' : 'Article Published!');
                                fetchData();
                              }).catch(() => toast.error('Failed to change publish status'));
                            }}
                            className={`px-3 py-1 rounded-lg transition ${
                              isPub ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                          >
                            {isPub ? 'Unpublish' : 'Publish Now'}
                          </button>

                          <button
                            onClick={() => handleEditBlog(post)}
                            className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 transition"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this article?')) {
                                blogAPI.deleteBlogPost(post._id).then(() => {
                                  toast.success('Article deleted successfully');
                                  fetchData();
                                }).catch(() => toast.error('Failed to delete article'));
                              }
                            }}
                            className="px-3 py-1 bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 transition"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {blogPosts.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">No articles found. Click "Add Article" above to create one.</p>
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

        {/* Redemption Configs Management */}
        {activeTab === 'redemption' && (
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Redemption Configs Management</h2>
              <button
                onClick={() => {
                  setEditingRedemptionConfig(null);
                  setRedemptionFormData({
                    rewardType: 'premium',
                    rewardName: '',
                    pointsCost: 100,
                    isActive: true,
                    metadata: {}
                  });
                  setShowRedemptionModal(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg text-sm font-semibold hover:from-pink-600 hover:to-purple-600 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Config
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Reward Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Points Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {redemptionConfigs.map((config) => (
                    <tr key={config._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-medium text-gray-900 dark:text-white">{config.rewardName}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 capitalize">
                        {config.rewardType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {config.pointsCost} points
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          config.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {config.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleEditRedemptionConfig(config)}
                          className="text-blue-600 hover:text-blue-700 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Delete this config?')) {
                              redemptionAPI.deleteRedemptionConfig(config._id).then(() => {
                                toast.success('Config deleted');
                                fetchData();
                              }).catch(err => {
                                toast.error('Failed to delete config');
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
              {redemptionConfigs.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">No redemption configs</p>
              )}
            </div>
          </div>
        )}
      </main>
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
                  <label htmlFor="gift_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gift Name</label>
                  <input
                    id="gift_name"
                    name="name"
                    type="text"
                    value={giftFormData.name}
                    onChange={(e) => setGiftFormData({ ...giftFormData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="gift_emoji" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Emoji</label>
                  <input
                    id="gift_emoji"
                    name="emoji"
                    type="text"
                    value={giftFormData.emoji}
                    onChange={(e) => setGiftFormData({ ...giftFormData, emoji: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="🎁"
                  />
                </div>
                <div>
                  <label htmlFor="gift_category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select
                    id="gift_category"
                    name="category"
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
                    <label htmlFor="gift_price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price (LKR)</label>
                    <input
                      id="gift_price"
                      name="price"
                      type="number"
                      value={giftFormData.price}
                      onChange={(e) => setGiftFormData({ ...giftFormData, price: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="gift_rarity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rarity</label>
                    <select
                      id="gift_rarity"
                      name="rarity"
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
                  <label htmlFor="gift_is_premium" className="flex items-center gap-2 cursor-pointer">
                    <input
                      id="gift_is_premium"
                      name="isPremium"
                      type="checkbox"
                      checked={giftFormData.isPremium}
                      onChange={(e) => setGiftFormData({ ...giftFormData, isPremium: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Premium</span>
                  </label>
                  <label htmlFor="gift_is_recommended" className="flex items-center gap-2 cursor-pointer">
                    <input
                      id="gift_is_recommended"
                      name="isRecommended"
                      type="checkbox"
                      checked={giftFormData.isRecommended}
                      onChange={(e) => setGiftFormData({ ...giftFormData, isRecommended: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Recommended</span>
                  </label>
                  <label htmlFor="gift_is_active" className="flex items-center gap-2 cursor-pointer">
                    <input
                      id="gift_is_active"
                      name="isActive"
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
                  <label htmlFor="event_title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Title</label>
                  <input
                    id="event_title"
                    name="title"
                    type="text"
                    value={eventFormData.title}
                    onChange={(e) => setEventFormData({ ...eventFormData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="event_description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea
                    id="event_description"
                    name="description"
                    value={eventFormData.description}
                    onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="event_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Type</label>
                    <select
                      id="event_type"
                      name="eventType"
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
                    <label htmlFor="event_max_attendees" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Attendees</label>
                    <input
                      id="event_max_attendees"
                      name="maxAttendees"
                      type="number"
                      value={eventFormData.maxAttendees}
                      onChange={(e) => setEventFormData({ ...eventFormData, maxAttendees: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="event_start_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                    <input
                      id="event_start_date"
                      name="startDate"
                      type="datetime-local"
                      value={eventFormData.startDate}
                      onChange={(e) => setEventFormData({ ...eventFormData, startDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="event_end_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                    <input
                      id="event_end_date"
                      name="endDate"
                      type="datetime-local"
                      value={eventFormData.endDate}
                      onChange={(e) => setEventFormData({ ...eventFormData, endDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="event_city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                    <input
                      id="event_city"
                      name="city"
                      type="text"
                      value={eventFormData.location.city}
                      onChange={(e) => setEventFormData({ ...eventFormData, location: { ...eventFormData.location, city: e.target.value } })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="event_venue" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Venue</label>
                    <input
                      id="event_venue"
                      name="venue"
                      type="text"
                      value={eventFormData.location.venue}
                      onChange={(e) => setEventFormData({ ...eventFormData, location: { ...eventFormData.location, venue: e.target.value } })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="event_address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                  <input
                    id="event_address"
                    name="address"
                    type="text"
                    value={eventFormData.location.address}
                    onChange={(e) => setEventFormData({ ...eventFormData, location: { ...eventFormData.location, address: e.target.value } })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="event_image_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image URL</label>
                  <input
                    id="event_image_url"
                    name="imageUrl"
                    type="text"
                    value={eventFormData.imageUrl}
                    onChange={(e) => setEventFormData({ ...eventFormData, imageUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="https://..."
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label htmlFor="event_is_published" className="flex items-center gap-2 cursor-pointer">
                    <input
                      id="event_is_published"
                      name="isPublished"
                      type="checkbox"
                      checked={eventFormData.isPublished}
                      onChange={(e) => setEventFormData({ ...eventFormData, isPublished: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Published</span>
                  </label>
                  <label htmlFor="event_is_featured" className="flex items-center gap-2 cursor-pointer">
                    <input
                      id="event_is_featured"
                      name="isFeatured"
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
                  <label htmlFor="story_couple_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Couple Name</label>
                  <input
                    id="story_couple_name"
                    name="coupleName"
                    type="text"
                    value={storyFormData.coupleName}
                    onChange={(e) => setStoryFormData({ ...storyFormData, coupleName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="story_content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Story</label>
                  <textarea
                    id="story_content"
                    name="story"
                    value={storyFormData.story}
                    onChange={(e) => setStoryFormData({ ...storyFormData, story: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={5}
                  />
                </div>
                <div>
                  <label htmlFor="story_wedding_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Wedding Date</label>
                  <input
                    id="story_wedding_date"
                    name="weddingDate"
                    type="date"
                    value={storyFormData.weddingDate}
                    onChange={(e) => setStoryFormData({ ...storyFormData, weddingDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="story_image_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image URL</label>
                  <input
                    id="story_image_url"
                    name="imageUrl"
                    type="text"
                    value={storyFormData.imageUrl}
                    onChange={(e) => setStoryFormData({ ...storyFormData, imageUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="https://..."
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label htmlFor="story_is_published" className="flex items-center gap-2 cursor-pointer">
                    <input
                      id="story_is_published"
                      name="isPublished"
                      type="checkbox"
                      checked={storyFormData.isPublished}
                      onChange={(e) => setStoryFormData({ ...storyFormData, isPublished: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Published</span>
                  </label>
                  <label htmlFor="story_is_featured" className="flex items-center gap-2 cursor-pointer">
                    <input
                      id="story_is_featured"
                      name="isFeatured"
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

      {/* Blog Article Modal */}
      {showBlogModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {editingBlogPost ? 'Edit Blog Article' : 'Add New Blog Article'}
              </h3>
              <form onSubmit={handleSaveBlog} className="space-y-4">
                <div>
                  <label htmlFor="blog_title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                  <input
                    id="blog_title"
                    name="title"
                    type="text"
                    required
                    value={blogFormData.title}
                    onChange={(e) => setBlogFormData({ ...blogFormData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Article headline..."
                  />
                </div>
                <div>
                  <label htmlFor="blog_excerpt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Excerpt / Short Summary</label>
                  <textarea
                    id="blog_excerpt"
                    name="excerpt"
                    value={blogFormData.excerpt}
                    onChange={(e) => setBlogFormData({ ...blogFormData, excerpt: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={2}
                    placeholder="Brief description shown on cards..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="blog_category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                    <select
                      id="blog_category"
                      name="category"
                      value={blogFormData.category}
                      onChange={(e) => setBlogFormData({ ...blogFormData, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="dating">Dating & Relationships</option>
                      <option value="love">Love & Romance</option>
                      <option value="lifestyle">Lifestyle</option>
                      <option value="advice">Dating Advice</option>
                      <option value="success">Success Stories</option>
                      <option value="news">Platform News</option>
                      <option value="wellness">Wellness</option>
                      <option value="culture">Sri Lankan Culture</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="blog_tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (comma separated)</label>
                    <input
                      id="blog_tags"
                      name="tags"
                      type="text"
                      value={blogFormData.tags}
                      onChange={(e) => setBlogFormData({ ...blogFormData, tags: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="relationships, tips, sri lanka..."
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="blog_content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Article Content *</label>
                  <textarea
                    id="blog_content"
                    name="content"
                    required
                    value={blogFormData.content}
                    onChange={(e) => setBlogFormData({ ...blogFormData, content: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={8}
                    placeholder="Write the full article content here. Use blank lines between paragraphs for formatting."
                  />
                </div>
                <div>
                  <label htmlFor="blog_cover_image" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cover Image URL</label>
                  <input
                    id="blog_cover_image"
                    name="coverImage"
                    type="text"
                    value={blogFormData.coverImage}
                    onChange={(e) => setBlogFormData({ ...blogFormData, coverImage: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="https://images.unsplash.com/..."
                  />
                  {blogFormData.coverImage && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 h-32">
                      <img
                        src={blogFormData.coverImage}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-6 pt-2">
                  <label htmlFor="blog_is_published" className="flex items-center gap-2 cursor-pointer">
                    <input
                      id="blog_is_published"
                      name="isPublished"
                      type="checkbox"
                      checked={blogFormData.isPublished}
                      onChange={(e) => setBlogFormData({ ...blogFormData, isPublished: e.target.checked })}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Publish Immediately</span>
                  </label>
                  <label htmlFor="blog_is_featured" className="flex items-center gap-2 cursor-pointer">
                    <input
                      id="blog_is_featured"
                      name="isFeatured"
                      type="checkbox"
                      checked={blogFormData.isFeatured}
                      onChange={(e) => setBlogFormData({ ...blogFormData, isFeatured: e.target.checked })}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Featured Article</span>
                  </label>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-md shadow-purple-500/20"
                  >
                    {editingBlogPost ? 'Update Article' : blogFormData.isPublished ? 'Create & Publish' : 'Create Draft'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBlogModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Redemption Config Modal */}
      {showRedemptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {editingRedemptionConfig ? 'Edit Redemption Config' : 'Add New Redemption Config'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="redemption_reward_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reward Type</label>
                  <select
                    id="redemption_reward_type"
                    name="rewardType"
                    value={redemptionFormData.rewardType}
                    onChange={(e) => setRedemptionFormData({ ...redemptionFormData, rewardType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="premium">Premium</option>
                    <option value="wallet">Wallet Cash</option>
                    <option value="boost">Profile Boost</option>
                    <option value="badge">Badge</option>
                    <option value="gift">Gift</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="redemption_reward_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reward Name</label>
                  <input
                    id="redemption_reward_name"
                    name="rewardName"
                    type="text"
                    value={redemptionFormData.rewardName}
                    onChange={(e) => setRedemptionFormData({ ...redemptionFormData, rewardName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g. 7 Days Premium Membership"
                  />
                </div>
                <div>
                  <label htmlFor="redemption_points_cost" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Points Cost</label>
                  <input
                    id="redemption_points_cost"
                    name="pointsCost"
                    type="number"
                    value={redemptionFormData.pointsCost}
                    onChange={(e) => setRedemptionFormData({ ...redemptionFormData, pointsCost: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="1"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label htmlFor="redemption_is_active" className="flex items-center gap-2 cursor-pointer">
                    <input
                      id="redemption_is_active"
                      name="isActive"
                      type="checkbox"
                      checked={redemptionFormData.isActive}
                      onChange={(e) => setRedemptionFormData({ ...redemptionFormData, isActive: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveRedemptionConfig}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-semibold hover:from-pink-600 hover:to-purple-600 transition-all"
                >
                  {editingRedemptionConfig ? 'Update' : 'Create'}
                </button>
                <button
                  onClick={() => setShowRedemptionModal(false)}
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
                <label htmlFor="plan_name" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Plan Name</label>
                <input
                  id="plan_name"
                  name="name"
                  type="text"
                  value={planFormData.name}
                  onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                  placeholder="e.g. Bronze Plan"
                  className="w-full px-3.5 py-2 border rounded-xl dark:bg-slate-700 dark:text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="plan_badge" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Badge Tier</label>
                  <select
                    id="plan_badge"
                    name="badge"
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
                  <label htmlFor="plan_price" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Price (LKR)</label>
                  <input
                    id="plan_price"
                    name="price"
                    type="number"
                    value={planFormData.price}
                    onChange={(e) => setPlanFormData({ ...planFormData, price: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl dark:bg-slate-700 dark:text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="plan_duration_days" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Duration (Days)</label>
                <input
                  id="plan_duration_days"
                  name="durationDays"
                  type="number"
                  value={planFormData.durationDays}
                  onChange={(e) => setPlanFormData({ ...planFormData, durationDays: e.target.value })}
                  placeholder="e.g. 7, 14, 28"
                  className="w-full px-3 py-2 border rounded-xl dark:bg-slate-700 dark:text-white text-sm"
                />
              </div>

              <div>
                <label htmlFor="plan_description" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  id="plan_description"
                  name="description"
                  value={planFormData.description}
                  onChange={(e) => setPlanFormData({ ...planFormData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-xl dark:bg-slate-700 dark:text-white text-sm resize-none"
                />
              </div>

              <div>
                <label htmlFor="plan_features" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Features (comma separated)
                </label>
                <textarea
                  id="plan_features"
                  name="features"
                  value={planFormData.features}
                  onChange={(e) => setPlanFormData({ ...planFormData, features: e.target.value })}
                  rows={3}
                  placeholder="Unlimited Messages, Priority Matching, Gold Badge"
                  className="w-full px-3 py-2 border rounded-xl dark:bg-slate-700 dark:text-white text-sm resize-none"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label htmlFor="plan_is_popular" className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    id="plan_is_popular"
                    name="isPopular"
                    type="checkbox"
                    checked={planFormData.isPopular}
                    onChange={(e) => setPlanFormData({ ...planFormData, isPopular: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span>Popular Badge</span>
                </label>
                <label htmlFor="plan_is_active" className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    id="plan_is_active"
                    name="isActive"
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

      {/* Premium Grant Modal */}
      {showPremiumGrantModal && selectedUserForPremium && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Grant Premium Access
              </h3>
              <button
                onClick={() => setShowPremiumGrantModal(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-semibold">User:</span> {selectedUserForPremium.name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedUserForPremium.email}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="grant_plan" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Premium Plan</label>
                <select
                  id="grant_plan"
                  name="plan"
                  value={premiumGrantData.plan}
                  onChange={(e) => setPremiumGrantData({ ...premiumGrantData, plan: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl dark:bg-slate-700 dark:text-white text-sm"
                >
                  <option value="bronze">🥉 Bronze (7 days)</option>
                  <option value="silver">🥈 Silver (14 days)</option>
                  <option value="gold">🥇 Gold (28 days)</option>
                </select>
              </div>

              <div>
                <label htmlFor="grant_duration_days" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Duration (Days)</label>
                <input
                  id="grant_duration_days"
                  name="durationDays"
                  type="number"
                  value={premiumGrantData.durationDays}
                  onChange={(e) => setPremiumGrantData({ ...premiumGrantData, durationDays: parseInt(e.target.value) || 1 })}
                  min="1"
                  max="365"
                  className="w-full px-3 py-2 border rounded-xl dark:bg-slate-700 dark:text-white text-sm"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Custom duration in days (1-365)
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSavePremiumGrant}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all"
              >
                Grant Premium
              </button>
              <button
                onClick={() => setShowPremiumGrantModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
