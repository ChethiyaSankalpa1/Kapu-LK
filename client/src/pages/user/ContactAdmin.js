import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { userAPI, messageAPI, supportAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { Shield, Send, Clock, CheckCircle, X, Image as ImageIcon, AlertCircle, HelpCircle, CreditCard, User as UserIcon, Settings, Bug, FileText, Mail } from 'lucide-react';
import BackButton from '../../components/common/BackButton';

const ContactAdmin = () => {
    const { t } = useTranslation();
    const { isAdmin } = useAuth();
    const navigate = useNavigate();
    const [admin, setAdmin] = useState(null);
    const [messageText, setMessageText] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [conversations, setConversations] = useState([]);
    const [issueType, setIssueType] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [uploading, setUploading] = useState(false);

    const issueTypes = [
        { id: 'bug', label: 'Bug Report', icon: Bug, color: 'red' },
        { id: 'payment', label: 'Payment Issue', icon: CreditCard, color: 'yellow' },
        { id: 'profile', label: 'Profile Issue', icon: UserIcon, color: 'blue' },
        { id: 'account', label: 'Account Settings', icon: Settings, color: 'purple' },
        { id: 'report', label: 'Report User', icon: AlertCircle, color: 'orange' },
        { id: 'technical', label: 'Technical Support', icon: HelpCircle, color: 'cyan' },
        { id: 'other', label: 'Other', icon: FileText, color: 'gray' },
    ];

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
            toast.error(t('toast.contact.adminNotAvailable'));
        } finally {
            setLoading(false);
        }
    }, [isAdmin, t]);

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
        if (!messageText.trim() && attachments.length === 0) {
            toast.error(t('toast.contact.emptyMessage'));
            return;
        }
        setSending(true);
        try {
            const categoryMap = {
                bug: 'technical',
                payment: 'payments',
                profile: 'profile',
                account: 'recovery',
                report: 'reporting',
                technical: 'technical',
                other: 'other',
            };
            const mappedCategory = categoryMap[issueType] || 'other';
            const issueLabel = issueTypes.find(t => t.id === issueType)?.label || 'General Issue';
            const fullMessageText = messageText.trim() || 'See attached screenshots.';

            // 1. Submit ticket to Admin Support Inbox
            await supportAPI.createTicket({
                category: mappedCategory,
                subject: `[${issueLabel}] Support Request`,
                message: fullMessageText,
                priority: 'medium',
            }).catch(ticketErr => console.warn('Ticket creation secondary error:', ticketErr));

            // 2. Direct message to admin if admin is available
            if (admin?._id) {
                await messageAPI.sendMessage({
                    to: admin._id,
                    content: `[${issueLabel}] ${fullMessageText}`,
                    type: 'text',
                    attachments: attachments,
                }).catch(msgErr => console.warn('Direct message secondary error:', msgErr));
            }

            toast.success(t('toast.contact.messageSent'));
            setMessageText('');
            setIssueType('');
            setAttachments([]);
            await fetchConversations();
        } catch (error) {
            toast.error(error.response?.data?.message || t('toast.contact.messageFailed'));
        } finally {
            setSending(false);
        }
    };

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        const newAttachments = [];

        for (const file of files) {
            // Validate file type
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
            if (!validTypes.includes(file.type)) {
                toast.error(t('toast.contact.invalidAttachment') + `: ${file.name}`);
                continue;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error(t('toast.contact.attachmentTooLarge') + `: ${file.name}`);
                continue;
            }

            // Create preview
            const preview = URL.createObjectURL(file);
            newAttachments.push({
                file,
                preview,
                name: file.name,
                size: file.size,
            });
        }

        setAttachments(prev => [...prev, ...newAttachments]);
        setUploading(false);
    };

    const removeAttachment = (index) => {
        setAttachments(prev => {
            const newAttachments = [...prev];
            URL.revokeObjectURL(newAttachments[index].preview);
            newAttachments.splice(index, 1);
            return newAttachments;
        });
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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pt-8 pb-24 md:py-8">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="mb-6">
                    <BackButton variant="ghost" label={t('common.back')} iconClassName="w-6 h-6" className="text-lg font-medium" />
                </div>

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl mb-4 shadow-lg">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                        Support Center
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        We're here to help! Select an issue type below and describe your problem. Our team typically responds within 24 hours.
                    </p>
                </div>

                {/* Admin Info Card */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/50 rounded-2xl p-6 mb-8">
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                            <Shield className="w-7 h-7 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-1 text-lg">
                                {admin?.name || 'Admin Support Team'}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                Need help? Contact our admin team for assistance with your account, profile, payments, or any technical issues.
                            </p>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>Response time: Within 24 hours</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                    <a
                                        href="mailto:kapulk.support@gmail.com"
                                        className="text-purple-600 dark:text-purple-400 font-semibold hover:underline"
                                    >
                                        kapulk.support@gmail.com
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {conversations.length > 0 && (
                    <div className="mb-8 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-300 mb-2">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-medium">Conversation Started</span>
                        </div>
                        <p className="text-sm text-green-600 dark:text-green-400">
                            You have an ongoing conversation with admin. Continue below.
                        </p>
                    </div>
                )}

                <div className="glass-card rounded-2xl p-6 sm:p-8">
                    {/* Issue Type Selection */}
                    <div className="mb-8">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                            What type of issue are you experiencing?
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {issueTypes.map((type) => {
                                const Icon = type.icon;
                                const colorClasses = {
                                    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400',
                                    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-600 dark:text-yellow-400',
                                    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
                                    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400',
                                    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400',
                                    cyan: 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400',
                                    gray: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400',
                                };
                                return (
                                    <button
                                        key={type.id}
                                        onClick={() => setIssueType(type.id)}
                                        className={`p-3 rounded-xl border-2 transition-all ${
                                            issueType === type.id
                                                ? `${colorClasses[type.color]} border-current ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900`
                                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-purple-300 dark:hover:border-purple-700'
                                        }`}
                                    >
                                        <Icon className="w-6 h-6 mx-auto mb-2" />
                                        <span className="text-xs font-medium">{type.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Message Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Describe your issue
                        </label>
                        <textarea
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            placeholder="Please provide detailed information about your issue..."
                            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                            rows={6}
                        />
                    </div>

                    {/* File Upload */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Attach screenshots (optional)
                        </label>
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:border-purple-400 dark:hover:border-purple-600 transition-colors">
                            <input
                                type="file"
                                id="file-upload"
                                multiple
                                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                                onChange={handleFileSelect}
                                className="hidden"
                                disabled={uploading}
                            />
                            <label
                                htmlFor="file-upload"
                                className="cursor-pointer flex flex-col items-center"
                            >
                                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3">
                                    <ImageIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {uploading ? 'Uploading...' : 'Click to upload images'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    JPEG, PNG, WebP, GIF (max 5MB each)
                                </p>
                            </label>
                        </div>

                        {/* Image Previews */}
                        {attachments.length > 0 && (
                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {attachments.map((attachment, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={attachment.preview}
                                            alt={attachment.name}
                                            className="w-full h-24 object-cover rounded-lg"
                                        />
                                        <button
                                            onClick={() => removeAttachment(index)}
                                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                                            {attachment.name}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={handleSendMessage}
                        disabled={sending || !admin || (!messageText.trim() && attachments.length === 0)}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 text-lg"
                    >
                        {sending ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                <span>Sending...</span>
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                <span>Send to Support Team</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Help Section */}
                <div className="mt-8 text-center space-y-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        For urgent matters, please include detailed information and screenshots to help us resolve your issue faster.
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Prefer direct email? Contact us directly at{' '}
                        <a
                            href="mailto:kapulk.support@gmail.com"
                            className="text-purple-600 dark:text-purple-400 font-semibold hover:underline"
                        >
                            kapulk.support@gmail.com
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ContactAdmin;
