import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { userAPI, messageAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import {
    User, MapPin, Briefcase, GraduationCap, Heart,
    Calendar, Users as UsersIcon, ArrowLeft, Send, Crown,
    MessageSquare, Shield, Paperclip, X, Image as ImageIcon,
    Clock, CheckCircle, Award, Star, Activity
} from 'lucide-react';
import PremiumBadge from '../../components/ui/PremiumBadge';

const UserDetail = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: currentUser, isAdmin } = useAuth();
    const [user, setUser] = useState(null);
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sendingInterest, setSendingInterest] = useState(false);
    const [messageText, setMessageText] = useState(''); // for user-to-user message
    const [adminMessageText, setAdminMessageText] = useState(''); // for contact admin
    const [sendingMessage, setSendingMessage] = useState(false);
    const [sendingAdminMessage, setSendingAdminMessage] = useState(false);
    const [adminAttachments, setAdminAttachments] = useState([]);
    const [attachmentPreviews, setAttachmentPreviews] = useState([]);

    const fetchUser = useCallback(async () => {
        try {
            const response = await userAPI.getUserById(id);
            setUser(response.data);
        } catch (error) {
            toast.error(t('users.detailFetchFailed', { defaultValue: 'Failed to fetch user details' }));
            navigate('/users');
        } finally {
            setLoading(false);
        }
    }, [id, navigate, t]);

    const fetchAdmin = useCallback(async () => {
        if (isAdmin) return; // If current user is admin, don't fetch
        try {
            const adminUser = await userAPI.getAdminUser();
            setAdmin(adminUser.data);
        } catch (err) {
            console.error('Failed to fetch admin', err);
            // If we can't fetch admin, just don't show contact admin section
            setAdmin(null);
        }
    }, [isAdmin]);

    useEffect(() => {
        fetchUser();
        fetchAdmin();
    }, [fetchUser, fetchAdmin]);

    const isOwnProfile = currentUser && user && currentUser._id === user._id;

    const handleExpressInterest = async () => {
        if (!user) return;
        if (isOwnProfile) {
            toast.info(t('users.cannotLikeSelf', { defaultValue: 'You cannot express interest in your own profile.' }));
            return;
        }
        setSendingInterest(true);
        try {
            await messageAPI.sendMessage({
                to: user._id,
                content: 'sent you an interest on LoveLK',
                type: 'like',
            });
            toast.success(t('users.interestSent', { defaultValue: 'Interest sent successfully' }));
        } catch (error) {
            toast.error(error.response?.data?.message || t('users.interestFailed', { defaultValue: 'Failed to send interest' }));
        } finally {
            setSendingInterest(false);
        }
    };

    const handleSendMessage = async () => {
        if (!user) return;
        if (!messageText.trim()) {
            toast.error(t('messages.typePrompt', { defaultValue: 'Please type a message' }));
            return;
        }
        if (isOwnProfile) {
            toast.info(t('messages.cannotMessageSelf', { defaultValue: 'You cannot send a message to yourself.' }));
            return;
        }
        setSendingMessage(true);
        try {
            await messageAPI.sendMessage({
                to: user._id,
                content: messageText.trim(),
                type: 'text',
            });
            toast.success(t('messages.sentSuccess', { defaultValue: 'Message sent' }));
            setMessageText('');
        } catch (error) {
            toast.error(error.response?.data?.message || t('messages.sendFailed', { defaultValue: 'Failed to send message' }));
        } finally {
            setSendingMessage(false);
        }
    };

    const handleContactAdmin = async () => {
        if (!admin) return;
        if (!adminMessageText.trim() && adminAttachments.length === 0) {
            toast.error(t('messages.typeAdminPrompt', { defaultValue: 'Please type a message or attach a file for admin' }));
            return;
        }
        setSendingAdminMessage(true);
        try {
            await messageAPI.sendMessage({
                to: admin._id,
                content: adminMessageText.trim() || 'Attached files',
                type: 'text',
                attachments: adminAttachments
            });
            toast.success(t('messages.sentToAdmin', { defaultValue: 'Message sent to admin' }));
            setAdminMessageText('');
            setAdminAttachments([]);
            setAttachmentPreviews([]);
        } catch (error) {
            toast.error(error.response?.data?.message || t('messages.sendAdminFailed', { defaultValue: 'Failed to send message to admin' }));
        } finally {
            setSendingAdminMessage(false);
        }
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = files.filter(file => {
            const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
            const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
            if (!isValidType) {
                toast.error('Only images and PDF files are allowed');
                return false;
            }
            if (!isValidSize) {
                toast.error('File size must be less than 5MB');
                return false;
            }
            return true;
        });

        setAdminAttachments(prev => [...prev, ...validFiles]);

        // Create previews for images
        validFiles.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setAttachmentPreviews(prev => [...prev, {
                        file,
                        preview: reader.result,
                        type: 'image'
                    }]);
                };
                reader.readAsDataURL(file);
            } else {
                setAttachmentPreviews(prev => [...prev, {
                    file,
                    preview: null,
                    type: 'file',
                    name: file.name
                }]);
            }
        });
    };

    const removeAttachment = (index) => {
        setAdminAttachments(prev => prev.filter((_, i) => i !== index));
        setAttachmentPreviews(prev => prev.filter((_, i) => i !== index));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
            </div>
        );
    }

    if (!currentUser?.isApproved && currentUser?.role !== 'admin') {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 max-w-md w-full text-center border border-gray-250/30">
                    <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl text-amber-500">🔒</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Approval Required</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        Your account has not yet been approved by an administrator. You must wait for account approval before you can browse, search, or view other member profiles.
                    </p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="btn-primary w-full py-3"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pt-5 pb-24 md:py-8 transition-colors duration-300">
            <div className="container mx-auto px-4 max-w-6xl">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 mb-6 sm:mb-8 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="text-base sm:text-lg font-semibold">{t('common.back', { defaultValue: 'Back' })}</span>
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                    {/* Left Column: Profile Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden sticky top-8">
                            {/* Profile Image Section */}
                            <div className="relative h-64 sm:h-80 bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-600">
                                {user.profileImageUrl ? (
                                    <img
                                        src={user.profileImageUrl}
                                        alt={user.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <User className="w-24 sm:w-36 h-24 sm:h-36 text-white opacity-80" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                            </div>

                            {/* Profile Info Card */}
                            <div className="px-4 sm:px-6 pb-6 -mt-16 sm:-mt-20 relative z-10">
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 sm:p-6 border border-gray-100 dark:border-gray-700">
                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{user.name}</h1>
                                        {user.isPremium && (
                                            <PremiumBadge plan={user.premiumPlan} size="sm" />
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">{user.bio || t('profile.noBio', { defaultValue: 'No bio available yet' })}</p>

                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-2 gap-3.5 mb-6">
                                        {user.age && (
                                            <div className="flex flex-col items-center justify-center p-3.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                                <Calendar className="w-5 h-5 text-purple-600 mb-1.5" />
                                                <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-bold">Age</span>
                                                <span className="text-lg font-extrabold text-gray-900 dark:text-white mt-0.5">{user.age}</span>
                                            </div>
                                        )}
                                        {user.gender && (
                                            <div className="flex flex-col items-center justify-center p-3.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                                <UsersIcon className="w-5 h-5 text-purple-600 mb-1.5" />
                                                <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-bold font-semibold">Gender</span>
                                                <span className="text-lg font-extrabold text-gray-900 dark:text-white mt-0.5 capitalize">{user.gender}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    {!isOwnProfile && (
                                        <div className="space-y-3">
                                            <button
                                                onClick={handleExpressInterest}
                                                disabled={sendingInterest}
                                                className="w-full btn-primary text-sm py-3"
                                            >
                                                <Heart className="w-4.5 h-4.5" />
                                                <span>{sendingInterest ? t('common.sending', { defaultValue: 'Sending...' }) : t('users.expressInterest', { defaultValue: 'Express Interest' })}</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Contact Admin (for non-admin users) */}
                            {!isAdmin && admin && (
                                <div className="px-4 sm:px-6 pb-6 pt-0">
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border border-blue-100/50 dark:border-blue-800/40 rounded-2xl p-5">
                                        <div className="flex items-center gap-3 mb-4">
                                            <Shield className="w-5.5 h-5.5 text-blue-600 shrink-0" />
                                            <div>
                                                <h3 className="font-bold text-sm text-gray-900 dark:text-white">{t('users.needHelp', { defaultValue: 'Need Help?' })}</h3>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{t('users.contactAdminHelp', { defaultValue: 'Contact our admin' })}</p>
                                            </div>
                                        </div>
                                        <textarea
                                            value={adminMessageText}
                                            onChange={(e) => setAdminMessageText(e.target.value)}
                                            placeholder={t('messages.adminPlaceholder', { defaultValue: 'Write your message to admin...' })}
                                            className="w-full px-3.5 py-2.5 border border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm rounded-xl mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[80px]"
                                            rows={3}
                                        />
                                        
                                        {/* File Attachments */}
                                        <div className="mb-3">
                                            <input
                                                type="file"
                                                id="admin-attachments"
                                                multiple
                                                accept="image/*,.pdf"
                                                onChange={handleFileSelect}
                                                className="hidden"
                                            />
                                            <label
                                                htmlFor="admin-attachments"
                                                className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition"
                                            >
                                                <Paperclip className="w-4 h-4" />
                                                <span>Attach Files</span>
                                            </label>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                                (Images & PDF, max 5MB each)
                                            </span>
                                        </div>

                                        {/* Attachment Previews */}
                                        {attachmentPreviews.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {attachmentPreviews.map((attachment, index) => (
                                                    <div
                                                        key={index}
                                                        className="relative group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2"
                                                    >
                                                        {attachment.type === 'image' ? (
                                                            <img
                                                                src={attachment.preview}
                                                                alt={`Attachment ${index + 1}`}
                                                                className="w-16 h-16 object-cover rounded"
                                                            />
                                                        ) : (
                                                            <div className="w-16 h-16 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded">
                                                                <ImageIcon className="w-8 h-8 text-gray-400" />
                                                            </div>
                                                        )}
                                                        <button
                                                            onClick={() => removeAttachment(index)}
                                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <button
                                            onClick={handleContactAdmin}
                                            disabled={sendingAdminMessage}
                                            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-650 hover:to-indigo-650 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px]"
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                            <span>{sendingAdminMessage ? t('common.sending', { defaultValue: 'Sending...' }) : t('users.contactAdmin', { defaultValue: 'Contact Admin' })}</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Detailed Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Personal Info Section */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-5 sm:p-8 border border-gray-100 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2.5">
                                <User className="w-5.5 h-5.5 text-purple-600" />
                                Personal Information
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {user.location && (
                                    <div className="flex items-start gap-3.5 p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700/20 dark:to-gray-700/5 rounded-xl border border-gray-100/60 dark:border-gray-700">
                                        <MapPin className="w-5.5 h-5.5 text-purple-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Location</p>
                                            <p className="text-base font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{user.location}</p>
                                        </div>
                                    </div>
                                )}
                                {user.occupation && (
                                    <div className="flex items-start gap-3.5 p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700/20 dark:to-gray-700/5 rounded-xl border border-gray-100/60 dark:border-gray-700">
                                        <Briefcase className="w-5.5 h-5.5 text-purple-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Occupation</p>
                                            <p className="text-base font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{user.occupation}</p>
                                        </div>
                                    </div>
                                )}
                                {user.education && (
                                    <div className="flex items-start gap-3.5 p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700/20 dark:to-gray-700/5 rounded-xl border border-gray-100/60 dark:border-gray-700">
                                        <GraduationCap className="w-5.5 h-5.5 text-purple-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Education</p>
                                            <p className="text-base font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{user.education}</p>
                                        </div>
                                    </div>
                                )}
                                {user.religion && (
                                    <div className="flex items-start gap-3.5 p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700/20 dark:to-gray-700/5 rounded-xl border border-gray-100/60 dark:border-gray-700">
                                        <Heart className="w-5.5 h-5.5 text-purple-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Religion</p>
                                            <p className="text-base font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{user.religion}</p>
                                        </div>
                                    </div>
                                )}
                                {user.maritalStatus && (
                                    <div className="flex items-start gap-3.5 p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700/20 dark:to-gray-700/5 rounded-xl border border-gray-100/60 dark:border-gray-700">
                                        <Heart className="w-5.5 h-5.5 text-purple-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Marital Status</p>
                                            <p className="text-base font-semibold text-gray-800 dark:text-gray-200 mt-0.5 capitalize">{user.maritalStatus}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Account Status Section */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-5 sm:p-8 border border-gray-100 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2.5">
                                <Activity className="w-5.5 h-5.5 text-purple-600" />
                                Account Status
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {user.createdAt && (
                                    <div className="flex items-start gap-3.5 p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700/20 dark:to-gray-700/5 rounded-xl border border-gray-100/60 dark:border-gray-700">
                                        <Clock className="w-5.5 h-5.5 text-purple-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Member Since</p>
                                            <p className="text-base font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{new Date(user.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                )}
                                {user.lastActive && (
                                    <div className="flex items-start gap-3.5 p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700/20 dark:to-gray-700/5 rounded-xl border border-gray-100/60 dark:border-gray-700">
                                        <Activity className="w-5.5 h-5.5 text-purple-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Last Active</p>
                                            <p className="text-base font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{new Date(user.lastActive).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-start gap-3.5 p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700/20 dark:to-gray-700/5 rounded-xl border border-gray-100/60 dark:border-gray-700">
                                    <Crown className="w-5.5 h-5.5 text-purple-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Premium Status</p>
                                        <p className="text-base font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{user.isPremium ? 'Premium Member' : 'Free Member'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3.5 p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700/20 dark:to-gray-700/5 rounded-xl border border-gray-100/60 dark:border-gray-700">
                                    <CheckCircle className="w-5.5 h-5.5 text-purple-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Verification Status</p>
                                        <p className="text-base font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{user.isVerified ? 'Verified' : 'Not Verified'}</p>
                                    </div>
                                </div>
                                {user.profileCompletion !== undefined && (
                                    <div className="flex items-start gap-3.5 p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700/20 dark:to-gray-700/5 rounded-xl border border-gray-100/60 dark:border-gray-700">
                                        <Award className="w-5.5 h-5.5 text-purple-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Profile Completion</p>
                                            <p className="text-base font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{user.profileCompletion}%</p>
                                        </div>
                                    </div>
                                )}
                                {user.interests && user.interests.length > 0 && (
                                    <div className="flex items-start gap-3.5 p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700/20 dark:to-gray-700/5 rounded-xl border border-gray-100/60 dark:border-gray-700">
                                        <Star className="w-5.5 h-5.5 text-purple-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Interests</p>
                                            <p className="text-base font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{user.interests.join(', ')}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Send Message Section */}
                        {!isOwnProfile && (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-5 sm:p-8 border border-gray-100 dark:border-gray-700">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2.5">
                                    <MessageSquare className="w-5.5 h-5.5 text-purple-600" />
                                    {t('dashboard.sendMessage')}
                                </h2>
                                <div className="space-y-4">
                                    <textarea
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        placeholder={t('messages.friendlyPlaceholder', { defaultValue: 'Type a friendly message to start a conversation...' })}
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none min-h-[100px]"
                                        rows={4}
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={sendingMessage}
                                        className="w-full btn-primary text-sm py-3"
                                    >
                                        <Send className="w-4.5 h-4.5" />
                                        <span>{sendingMessage ? t('messages.sendingMessage', { defaultValue: 'Sending...' }) : t('dashboard.sendMessage')}</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDetail;
