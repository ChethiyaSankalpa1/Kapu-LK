import axios from 'axios';

const getApiBaseUrl = () => {
    if (typeof window !== 'undefined') {
        const host = window.location.hostname;
        // When hosted on vercel.app, use same-origin /api rewrite proxy to eliminate CORS,
        // prevent Edge Tracking Prevention blocks, and improve speed
        if (host.endsWith('vercel.app')) {
            return '/api';
        }
    }
    return process.env.REACT_APP_API_URL || 
      (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api');
};

const API_URL = getApiBaseUrl();

const api = axios.create({
    baseURL: API_URL,
    timeout: 45000,
    withCredentials: true,
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 Unauthorized with token refresh rotation
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response &&
            error.response.status === 401 &&
            !originalRequest._retry &&
            originalRequest.url &&
            !originalRequest.url.includes('/auth/login') &&
            !originalRequest.url.includes('/auth/register') &&
            !originalRequest.url.includes('/auth/refresh')
        ) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshResponse = await axios.post(
                    `${API_URL}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );
                const newToken = refreshResponse.data.token;
                if (newToken) {
                    localStorage.setItem('token', newToken);
                    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                    processQueue(null, newToken);
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return api(originalRequest);
                }
            } catch (refreshErr) {
                processQueue(refreshErr, null);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshErr);
            } finally {
                isRefreshing = false;
            }
        }

        if (error.response && error.response.status === 503 && error.response.data?.maintenance) {
            window.dispatchEvent(
                new CustomEvent('kapu_maintenance_event', { detail: error.response.data })
            );
        }

        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
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
    refreshToken: () => api.post('/auth/refresh'),
    logout: () => api.post('/auth/logout'),
    verifyEmail: (data) => api.post('/auth/verify-email', data),
    resendVerificationCode: (data = {}) => api.post('/auth/resend-verification-code', data),
    changeVerificationEmail: (data) => api.post('/auth/change-verification-email', data),
    forgotPassword: (data) => api.post('/auth/forgot-password', data),
    verifyResetCode: (data) => api.post('/auth/verify-reset-code', data),
    resetPassword: (tokenOrData, maybeData) => {
        if (typeof tokenOrData === 'string') {
            return api.post(`/auth/reset-password/${tokenOrData}`, maybeData);
        }
        return api.post('/auth/reset-password', tokenOrData);
    },
    getMe: () => api.get('/auth/me'),
    setup2FA: () => api.post('/auth/2fa/setup'),
    verify2FA: (code) => api.post('/auth/2fa/verify', { code }),
    disable2FA: (password) => api.post('/auth/2fa/disable', { password }),
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
    blockUser: (id) => api.post(`/users/${id}/block`),
    unblockUser: (id) => api.post(`/users/${id}/unblock`),
    acknowledgePrivacyPolicy: (data = {}) => api.post('/users/acknowledge-privacy-policy', data),
    getConsentHistory: () => api.get('/users/consent-history'),
    exportUserData: () => api.get('/users/export-data'),
    requestAccountDeletion: (data) => api.post('/users/request-deletion', data),
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
    getAllUsers: (params = {}) => api.get('/admin/users', { params }),
    getDashboardStats: () => api.get('/admin/stats'),
    approveUser: (id) => api.put(`/admin/users/${id}/approve`),
    rejectUser: (id) => api.put(`/admin/users/${id}/reject`),
    updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
    toggleUserStatus: (id) => api.put(`/admin/users/${id}/toggle-active`),
    toggleStatus: (id) => api.put(`/admin/users/${id}/toggle-active`),
    togglePremiumStatus: (id, data) => api.put(`/admin/users/${id}/toggle-premium`, data),
    togglePremium: (id, data) => api.put(`/admin/users/${id}/toggle-premium`, data),
    removePremium: (id) => api.put(`/admin/users/${id}/toggle-premium`, { plan: 'remove' }),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),
    getAllRequests: () => api.get('/admin/premium-requests'),
    approveRequest: (id) => api.put(`/admin/premium-requests/${id}/approve`),
    approvePremium: (id) => api.put(`/admin/premium-requests/${id}/approve`),
    rejectRequest: (id, reason) => api.put(`/admin/premium-requests/${id}/reject`, { rejectionReason: reason }),
    rejectPremium: (id, reason) => api.put(`/admin/premium-requests/${id}/reject`, { rejectionReason: reason }),
    deletePremiumRequest: (id) => api.delete(`/admin/premium-requests/${id}`),
    seedSriLankanContent: () => api.post('/admin/seed-sri-lankan-content'),
};

export const messageAPI = {
    getConversations: () => api.get('/messages'),
    getConversationWithUser: (userId, params = {}) => api.get(`/messages/${userId}`, { params }),
    sendMessage: (data) => api.post('/messages', data),
    uploadChatImage: (formData) => api.post('/messages/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    editMessage: (messageId, data) => api.put(`/messages/${messageId}`, data),
    deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
    deleteForMe: (messageId) => api.delete(`/messages/${messageId}/for-me`),
    deleteForEveryone: (messageId) => api.delete(`/messages/${messageId}/for-everyone`),
    addReaction: (messageId, emoji) => api.post(`/messages/${messageId}/reaction`, { emoji }),
    reportUser: (reportedUserId, reason, details) => api.post('/messages/report', { reportedUserId, reason, details }),
};

export const inactivityAPI = {
    getStatus: () => api.get('/admin/inactivity/status'),
    runCleanup: () => api.post('/admin/inactivity/run-cleanup'),
    cancelDeletion: (userId) => api.post(`/admin/inactivity/cancel/${userId}`),
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
    updateStory: (id, data) => api.put(`/success-stories/${id}`, data),
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
    getWalletSummary: () => api.get('/wallet/summary'),
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

// Support Ticket API
export const supportAPI = {
    createTicket: (data) => api.post('/support/tickets', data),
    getMyTickets: () => api.get('/support/my-tickets'),
    getTicketById: (id) => api.get(`/support/tickets/${id}`),
    addUserReply: (id, text) => api.post(`/support/tickets/${id}/reply`, { text }),
    getAdminTickets: (params = {}) => api.get('/support/admin/tickets', { params }),
    addAdminReply: (id, data) => api.post(`/support/admin/tickets/${id}/reply`, data),
    updateTicketStatus: (id, data) => api.put(`/support/admin/tickets/${id}`, data),
};

// Maintenance API
export const maintenanceAPI = {
    getStatus: () => api.get('/maintenance/status'),
    subscribeComingSoon: (email) => api.post('/maintenance/coming-soon/subscribe', { email }),
    getAdminConfig: () => api.get('/maintenance/admin'),
    updateAdminConfig: (data) => api.put('/maintenance/admin', data),
    endMaintenanceNow: () => api.post('/maintenance/admin/end'),
};

export default api;
