import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api');

const api = axios.create({
    baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 Unauthorized globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Avoid redirecting if already on login or register page
            if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    forgotPassword: (data) => api.post('/auth/forgot-password', data),
    resetPassword: (token, data) => api.post(`/auth/reset-password/${token}`, data),
    getMe: () => api.get('/auth/me'),
    uploadProfileImage: (formData) => api.post('/auth/upload-profile-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// User API
export const userAPI = {
    getAllUsers: (params = {}) => api.get('/users', { params }),
    getUserById: (id) => api.get(`/users/${id}`),
    updateProfile: (data) => api.put('/users/profile', data),
    searchUsers: (params = {}) => api.get('/users/search', { params }),
    getMatches: (params = {}) => api.get('/users/matches', { params }),
    getAdminUser: () => api.get('/users/admin'),
};

// Premium API
export const premiumAPI = {
    getPlans: () => api.get('/premium/plans'),
    getAllPlansAdmin: () => api.get('/premium/admin/plans'),
    createPlan: (data) => api.post('/premium/admin/plans', data),
    updatePlan: (id, data) => api.put(`/premium/admin/plans/${id}`, data),
    deletePlan: (id) => api.delete(`/premium/admin/plans/${id}`),
    togglePlan: (id) => api.put(`/premium/admin/plans/${id}/toggle`),
    createPaymentRequest: (formData) => api.post('/premium/request', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    getStatus: () => api.get('/premium/status'),
    purchaseWithWallet: (data) => api.post('/premium/purchase-with-wallet', data),
};

// Admin API
export const adminAPI = {
    getAllUsers: () => api.get('/admin/users'),
    getStats: () => api.get('/admin/stats'),
    approveUser: (id) => api.put(`/admin/users/${id}/approve`),
    rejectUser: (id) => api.put(`/admin/users/${id}/reject`),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),
    updateRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
    toggleStatus: (id) => api.put(`/admin/users/${id}/toggle-active`),
    togglePremium: (id, data) => api.put(`/admin/users/${id}/toggle-premium`, data),
    createAdmin: () => api.post('/admin/create-admin'),
    getPremiumRequests: () => api.get('/admin/premium-requests'),
    approvePremium: (id) => api.put(`/admin/premium-requests/${id}/approve`),
    rejectPremium: (id, reason) => api.put(`/admin/premium-requests/${id}/reject`, { rejectionReason: reason }),
    deletePremiumRequest: (id) => api.delete(`/admin/premium-requests/${id}`),
};

export const messageAPI = {
    getConversations: () => api.get('/messages'),
    getConversationWithUser: (userId) => api.get(`/messages/${userId}`),
    sendMessage: (data) => api.post('/messages', data),
    uploadChatImage: (formData) => api.post('/messages/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    editMessage: (messageId, data) => api.put(`/messages/${messageId}`, data),
    deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
    addReaction: (messageId, emoji) => api.post(`/messages/${messageId}/reaction`, { emoji }),
};

export const notificationAPI = {
    getNotifications: () => api.get('/notifications'),
    markAllRead: () => api.put('/notifications/mark-all-read'),
    markAsRead: (id) => api.put(`/notifications/${id}/read`),
};

// Gift API
export const giftAPI = {
    getGifts: () => api.get('/gifts'),
    sendGift: (data) => api.post('/gifts/send', data),
    getGiftHistory: (type = 'all') => api.get('/gifts/history', { params: { type } }),
    createGift: (data) => api.post('/gifts/admin', data),
    updateGift: (id, data) => api.put(`/gifts/admin/${id}`, data),
    deleteGift: (id) => api.delete(`/gifts/admin/${id}`),
};

// Achievement API
export const achievementAPI = {
    getAchievements: () => api.get('/achievements'),
    getMyStats: () => api.get('/achievements/my-stats'),
    dailyCheckIn: () => api.post('/achievements/check-in'),
    createAchievement: (data) => api.post('/achievements/admin', data),
    updateAchievement: (id, data) => api.put(`/achievements/admin/${id}`, data),
    deleteAchievement: (id) => api.delete(`/achievements/admin/${id}`),
};

// Referral API
export const referralAPI = {
    getMyReferralCode: () => api.get('/referrals/my-code'),
    applyReferralCode: (code) => api.post('/referrals/apply', { code }),
    completeReferral: (id) => api.post(`/referrals/${id}/complete`),
    getReferralHistory: () => api.get('/referrals/history'),
    getReferralStats: () => api.get('/referrals/stats'),
};

// Success Story API
export const successStoryAPI = {
    getSuccessStories: (params = {}) => api.get('/success-stories', { params }),
    getSuccessStory: (id) => api.get(`/success-stories/${id}`),
    createSuccessStory: (data) => api.post('/success-stories', data),
    likeSuccessStory: (id) => api.post(`/success-stories/${id}/like`),
    approveSuccessStory: (id) => api.put(`/success-stories/${id}/approve`),
    featureSuccessStory: (id, isFeatured) => api.put(`/success-stories/${id}/feature`, { isFeatured }),
    deleteSuccessStory: (id) => api.delete(`/success-stories/${id}`),
};

// Blog API
export const blogAPI = {
    getBlogPosts: (params = {}) => api.get('/blog', { params }),
    getBlogPost: (slug) => api.get(`/blog/${slug}`),
    createBlogPost: (data) => api.post('/blog', data),
    updateBlogPost: (id, data) => api.put(`/blog/${id}`, data),
    publishBlogPost: (id) => api.put(`/blog/${id}/publish`),
    likeBlogPost: (id) => api.post(`/blog/${id}/like`),
    addComment: (id, content) => api.post(`/blog/${id}/comments`, { content }),
    deleteBlogPost: (id) => api.delete(`/blog/${id}`),
};

// Event API
export const eventAPI = {
    getEvents: (params = {}) => api.get('/events', { params }),
    getEvent: (id) => api.get(`/events/${id}`),
    createEvent: (data) => api.post('/events', data),
    updateEvent: (id, data) => api.put(`/events/${id}`, data),
    rsvpEvent: (id) => api.post(`/events/${id}/rsvp`),
    markAttended: (id) => api.post(`/events/${id}/attend`),
    likeEvent: (id) => api.post(`/events/${id}/like`),
    deleteEvent: (id) => api.delete(`/events/${id}`),
};

// Typing API
export const typingAPI = {
    setTyping: (conversationWith, isTyping) => api.post('/typing', { conversationWith, isTyping }),
    getTypingStatus: (userId) => api.get(`/typing/${userId}`),
};

// Wallet API
export const walletAPI = {
    getWallet: () => api.get('/wallet'),
    getTransactions: (params = {}) => api.get('/wallet/transactions', { params }),
    createPaymentRequest: (formData) => api.post('/wallet/payment-request', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    getPaymentRequests: () => api.get('/wallet/payment-requests'),
    // Admin wallet routes
    getAllPaymentRequests: (params = {}) => api.get('/wallet/admin/payment-requests', { params }),
    approvePaymentRequest: (id) => api.put(`/wallet/admin/payment-requests/${id}/approve`),
    rejectPaymentRequest: (id, reason) => api.put(`/wallet/admin/payment-requests/${id}/reject`, { rejectionReason: reason }),
    deletePaymentRequest: (id) => api.delete(`/wallet/admin/payment-requests/${id}`),
};

// Redemption API
export const redemptionAPI = {
    getConfigs: () => api.get('/redemption/configs'),
    getHistory: () => api.get('/redemption/history'),
    redeemPoints: (data) => api.post('/redemption/redeem', data),
    // Admin redemption routes
    getAllRedemptions: () => api.get('/redemption/admin/all'),
    createRedemptionConfig: (data) => api.post('/redemption/admin/config', data),
    updateRedemptionConfig: (id, data) => api.put(`/redemption/admin/config/${id}`, data),
    deleteRedemptionConfig: (id) => api.delete(`/redemption/admin/config/${id}`),
};

export default api;
