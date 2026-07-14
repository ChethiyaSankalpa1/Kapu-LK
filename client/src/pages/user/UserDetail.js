import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { userAPI, messageAPI, adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import {
    User, MapPin, Briefcase, GraduationCap, Heart,
    Phone, Mail, Calendar, Users as UsersIcon, ArrowLeft, Send, Crown,
    MessageSquare, Shield, TrendingUp, Clock, Home, Building, Target, CheckCircle2
} from 'lucide-react';

const UserDetail = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: currentUser, premiumStatus, isAdmin } = useAuth();
    const [user, setUser] = useState(null);
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sendingInterest, setSendingInterest] = useState(false);
    const [messageText, setMessageText] = useState(''); // for user-to-user message
    const [adminMessageText, setAdminMessageText] = useState(''); // for contact admin
    const [sendingMessage, setSendingMessage] = useState(false);
    const [sendingAdminMessage, setSendingAdminMessage] = useState(false);

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
    }, [id, navigate]);

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
    const isPremium = premiumStatus?.isPremium;

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
        if (!adminMessageText.trim()) {
            toast.error(t('messages.typeAdminPrompt', { defaultValue: 'Please type a message for admin' }));
            return;
        }
        setSendingAdminMessage(true);
        try {
            await messageAPI.sendMessage({
                to: admin._id,
                content: adminMessageText.trim(),
                type: 'text',
            });
            toast.success(t('messages.sentToAdmin', { defaultValue: 'Message sent to admin' }));
            setAdminMessageText('');
        } catch (error) {
            toast.error(error.response?.data?.message || t('messages.sendAdminFailed', { defaultValue: 'Failed to send message to admin' }));
        } finally {
            setSendingAdminMessage(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
            <div className="container mx-auto px-4 max-w-6xl">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 mb-8 transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                    <span className="text-lg font-medium">{t('common.back')}</span>
                </button>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column: Profile Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden sticky top-8">
                            {/* Profile Image Section */}
                            <div className="relative h-80 bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-600">
                                {user.profileImageUrl ? (
                                    <img
                                        src={user.profileImageUrl}
                                        alt={user.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <User className="w-40 h-40 text-white opacity-80" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                            </div>

                            {/* Profile Info Card */}
                            <div className="p-8 -mt-20 relative z-10">
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-3 mb-3">
                                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
                                        {user.isPremium && (
                                            <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 rounded-full">
                                                <Crown className="w-4 h-4 text-yellow-500" />
                                                <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-300">{t('profile.premiumMember')}</span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-300 text-base mb-6 leading-relaxed">{user.bio || t('profile.noBio', { defaultValue: 'No bio available yet' })}</p>

                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        {user.age && (
                                            <div className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                                <Calendar className="w-6 h-6 text-purple-600 mb-2" />
                                                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Age</span>
                                                <span className="text-xl font-bold text-gray-900 dark:text-white">{user.age}</span>
                                            </div>
                                        )}
                                        {user.gender && (
                                            <div className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                                <UsersIcon className="w-6 h-6 text-purple-600 mb-2" />
                                                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gender</span>
                                                <span className="text-xl font-bold text-gray-900 dark:text-white capitalize">{user.gender}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    {!isOwnProfile && (
                                        <div className="space-y-3">
                                            <button
                                                onClick={handleExpressInterest}
                                                disabled={sendingInterest}
                                                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3.5 px-6 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                <Heart className="w-5 h-5" />
                                                <span>{sendingInterest ? t('common.sending', { defaultValue: 'Sending...' }) : t('users.expressInterest', { defaultValue: 'Express Interest' })}</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Contact Admin (for non-admin users) */}
                            {!isAdmin && admin && (
                                <div className="p-6 pt-0">
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl p-5">
                                        <div className="flex items-center gap-3 mb-4">
                                            <Shield className="w-6 h-6 text-blue-600" />
                                            <div>
                                                <h3 className="font-bold text-gray-900 dark:text-white">{t('users.needHelp', { defaultValue: 'Need Help?' })}</h3>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">{t('users.contactAdminHelp', { defaultValue: 'Contact our admin' })}</p>
                                            </div>
                                        </div>
                                        <textarea
                                            value={adminMessageText}
                                            onChange={(e) => setAdminMessageText(e.target.value)}
                                            placeholder={t('messages.adminPlaceholder', { defaultValue: 'Write your message to admin...' })}
                                            className="w-full px-4 py-3 border border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                            rows={3}
                                        />
                                        <button
                                            onClick={handleContactAdmin}
                                            disabled={sendingAdminMessage}
                                            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                <User className="w-6 h-6 text-purple-600" />
                                Personal Information
                            </h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                {user.location && (
                                    <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/30 dark:to-gray-700/10 rounded-xl border border-gray-100 dark:border-gray-700">
                                        <MapPin className="w-6 h-6 text-purple-600 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Location</p>
                                            <p className="text-lg font-semibold text-gray-900 dark:text-white">{user.location}</p>
                                        </div>
                                    </div>
                                )}
                                {user.occupation && (
                                    <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/30 dark:to-gray-700/10 rounded-xl border border-gray-100 dark:border-gray-700">
                                        <Briefcase className="w-6 h-6 text-purple-600 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Occupation</p>
                                            <p className="text-lg font-semibold text-gray-900 dark:text-white">{user.occupation}</p>
                                        </div>
                                    </div>
                                )}
                                {user.education && (
                                    <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/30 dark:to-gray-700/10 rounded-xl border border-gray-100 dark:border-gray-700">
                                        <GraduationCap className="w-6 h-6 text-purple-600 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Education</p>
                                            <p className="text-lg font-semibold text-gray-900 dark:text-white">{user.education}</p>
                                        </div>
                                    </div>
                                )}
                                {user.religion && (
                                    <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/30 dark:to-gray-700/10 rounded-xl border border-gray-100 dark:border-gray-700">
                                        <Heart className="w-6 h-6 text-purple-600 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Religion</p>
                                            <p className="text-lg font-semibold text-gray-900 dark:text-white">{user.religion}</p>
                                        </div>
                                    </div>
                                )}
                                {user.maritalStatus && (
                                    <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/30 dark:to-gray-700/10 rounded-xl border border-gray-100 dark:border-gray-700">
                                        <Heart className="w-6 h-6 text-purple-600 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Marital Status</p>
                                            <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">{user.maritalStatus}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Contact Info Section */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                <Phone className="w-6 h-6 text-purple-600" />
                                {t('users.contactInformation', { defaultValue: 'Contact Information' })}
                            </h2>

                            {!isOwnProfile && !isPremium ? (
                                <div className="text-center py-12 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 rounded-xl border border-yellow-100 dark:border-yellow-800/30">
                                    <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{t('users.unlockContact', { defaultValue: 'Unlock Contact Details' })}</h3>
                                    <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">{t('users.unlockContactDesc', { defaultValue: 'Upgrade to Premium to view full contact information and connect with matches!' })}</p>
                                    <Link to="/premium" className="inline-block bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-8 py-3 rounded-xl font-bold hover:from-yellow-600 hover:to-orange-700 transition-all transform hover:scale-105">
                                        {t('dashboard.upgradeNow', { defaultValue: 'Get Premium Now' })}
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 gap-6">
                                    {user.phoneNumber && (
                                        <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-xl border border-green-100 dark:border-green-800/30">
                                            <Phone className="w-6 h-6 text-green-600" />
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Phone Number</p>
                                                <p className="text-lg font-semibold text-gray-900 dark:text-white">{user.phoneNumber}</p>
                                            </div>
                                        </div>
                                    )}
                                    {user.email && (
                                        <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 rounded-xl border border-blue-100 dark:border-blue-800/30">
                                            <Mail className="w-6 h-6 text-blue-600" />
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Email Address</p>
                                                <p className="text-lg font-semibold text-gray-900 dark:text-white">{user.email}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Send Message Section */}
                        {!isOwnProfile && (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                    <MessageSquare className="w-6 h-6 text-purple-600" />
                                    {t('dashboard.sendMessage')}
                                </h2>
                                <div className="space-y-4">
                                    <textarea
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        placeholder={t('messages.friendlyPlaceholder', { defaultValue: 'Type a friendly message to start a conversation...' })}
                                        className="w-full px-5 py-4 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                        rows={4}
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={sendingMessage}
                                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3.5 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-[1.01] disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <Send className="w-5 h-5" />
                                        <span>{sendingMessage ? t('messages.sendingMessage', { defaultValue: 'Sending Message...' }) : t('dashboard.sendMessage')}</span>
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
