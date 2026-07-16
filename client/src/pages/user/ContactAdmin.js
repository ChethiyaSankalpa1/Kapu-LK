import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { userAPI, messageAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { Shield, Send, ArrowLeft, Clock, CheckCircle } from 'lucide-react';

const ContactAdmin = () => {
    const { t } = useTranslation();
    const { isAdmin } = useAuth();
    const navigate = useNavigate();
    const [admin, setAdmin] = useState(null);
    const [messageText, setMessageText] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [conversations, setConversations] = useState([]);

    const fetchAdmin = useCallback(async () => {
        if (isAdmin) {
            setLoading(false);
            return;
        }
        try {
            const adminUser = await userAPI.getAdminUser();
            setAdmin(adminUser.data);
        } catch (err) {
            console.error('Failed to fetch admin', err);
            toast.error('Failed to load admin information');
        } finally {
            setLoading(false);
        }
    }, [isAdmin]);

    const fetchConversations = useCallback(async () => {
        if (isAdmin) return;
        try {
            const response = await messageAPI.getConversations();
            const adminConversation = response.data.find(c => c.user?.role === 'admin');
            if (adminConversation) {
                setConversations([adminConversation]);
            }
        } catch (err) {
            console.error('Failed to fetch conversations', err);
        }
    }, [isAdmin]);

    useEffect(() => {
        fetchAdmin();
        fetchConversations();
    }, [fetchAdmin, fetchConversations]);

    const handleSendMessage = async () => {
        if (!admin) {
            toast.error('Admin not available');
            return;
        }
        if (!messageText.trim()) {
            toast.error('Please type a message');
            return;
        }
        setSending(true);
        try {
            await messageAPI.sendMessage({
                to: admin._id,
                content: messageText.trim(),
                type: 'text',
            });
            toast.success('Message sent to admin successfully');
            setMessageText('');
            await fetchConversations();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    if (isAdmin) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-2xl mx-auto glass-card text-center">
                    <Shield className="w-20 h-20 text-purple-500 mx-auto mb-6" />
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
                        Admin Dashboard
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-8">
                        You are an admin. Access your dashboard from the navigation menu.
                    </p>
                    <button onClick={() => navigate('/admin')} className="btn-primary">
                        Go to Admin Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 mb-8 transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                    <span className="text-lg font-medium">{t('common.back')}</span>
                </button>

                <div className="glass-card">
                    <div className="flex items-center gap-3 mb-6">
                        <Shield className="w-8 h-8 text-purple-600" />
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Contact Admin
                        </h1>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl p-6 mb-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                                <Shield className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                                    {admin?.name || 'Admin Support'}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                    Need help? Contact our admin team for assistance with your account, profile, or any issues.
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                    <Clock className="w-4 h-4" />
                                    <span>Response time: Within 24 hours</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {conversations.length > 0 && (
                        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <div className="flex items-center gap-2 text-green-700 dark:text-green-300 mb-2">
                                <CheckCircle className="w-5 h-5" />
                                <span className="font-medium">Conversation Started</span>
                            </div>
                            <p className="text-sm text-green-600 dark:text-green-400">
                                You have an ongoing conversation with admin. Continue below.
                            </p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Your Message
                            </label>
                            <textarea
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                placeholder="Describe your issue or question..."
                                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                rows={6}
                            />
                        </div>

                        <button
                            onClick={handleSendMessage}
                            disabled={sending || !admin}
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3.5 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {sending ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                    <span>Sending...</span>
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    <span>Send Message to Admin</span>
                                </>
                            )}
                        </button>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Common Issues</h4>
                        <div className="grid md:grid-cols-2 gap-3">
                            {[
                                'Profile approval',
                                'Premium upgrade',
                                'Account settings',
                                'Report a user',
                                'Payment issues',
                                'Technical support'
                            ].map((issue, i) => (
                                <button
                                    key={i}
                                    onClick={() => setMessageText(`I need help with: ${issue}`)}
                                    className="text-left px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
                                >
                                    {issue}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactAdmin;
