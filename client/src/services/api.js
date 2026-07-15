import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
    getAllUsers: () => api.get('/users'),
    getUserById: (id) => api.get(`/users/${id}`),
    updateProfile: (data) => api.put('/users/profile', data),
    searchUsers: (params) => api.get('/users/search', { params }),
    getMatches: () => api.get('/users/matches'),
    getAdminUser: () => api.get('/users/admin'),
};

// Premium API
export const premiumAPI = {
    createPaymentRequest: (formData) => api.post('/premium/request', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    getStatus: () => api.get('/premium/status'),
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
    togglePremium: (id) => api.put(`/admin/users/${id}/toggle-premium`),
    createAdmin: () => api.post('/admin/create-admin'),
    getPremiumRequests: () => api.get('/admin/premium-requests'),
    approvePremium: (id) => api.put(`/admin/premium-requests/${id}/approve`),
    rejectPremium: (id, reason) => api.put(`/admin/premium-requests/${id}/reject`, { rejectionReason: reason }),
};

export const messageAPI = {
    getConversations: () => api.get('/messages'),
    getConversationWithUser: (userId) => api.get(`/messages/${userId}`),
    sendMessage: (data) => api.post('/messages', data),
};

export const notificationAPI = {
    getNotifications: () => api.get('/notifications'),
    markAllRead: () => api.put('/notifications/mark-all-read'),
    markAsRead: (id) => api.put(`/notifications/${id}/read`),
};

export default api;
