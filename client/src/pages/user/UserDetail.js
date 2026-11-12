import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { userAPI, messageAPI, supportAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import moment from 'moment';
import {
    ChevronLeft, ChevronRight, Heart, MessageSquare,
    Bookmark, Share2, MoreHorizontal, Shield, Phone, Mail,
    Crown, CheckCircle2, Calendar, Clock,
    Flag, Ban, Headphones, Lightbulb, User,
    MapPin, GraduationCap, Briefcase, Building, Users,
    Check, X, Target, Compass, Award, Sparkles
} from 'lucide-react';
import PremiumBadge from '../../components/ui/PremiumBadge';
import ProfileAvatar from '../../components/ui/ProfileAvatar';
import BackButton from '../../components/common/BackButton';

const UserDetail = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    // Data States
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [imgErrors, setImgErrors] = useState({});

    // Interaction States
    const [sendingInterest, setSendingInterest] = useState(false);
    const [interestSent, setInterestSent] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);

    // Modal States
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('fake_profile');
    const [reportDetails, setReportDetails] = useState('');
    const [submittingReport, setSubmittingReport] = useState(false);

    const [showBlockModal, setShowBlockModal] = useState(false);
    const [submittingBlock, setSubmittingBlock] = useState(false);

    const [showSupportModal, setShowSupportModal] = useState(false);
    const [supportSubject, setSupportSubject] = useState('');
    const [supportMessage, setSupportMessage] = useState('');
    const [submittingSupport, setSubmittingSupport] = useState(false);

    const moreMenuRef = useRef(null);

    // Close more menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
                setShowMoreMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Check saved state in localStorage
    useEffect(() => {
        if (!id) return;
        try {
            const savedList = JSON.parse(localStorage.getItem('kapu_saved_profiles') || '[]');
            setIsSaved(savedList.includes(id));
        } catch (e) {
            setIsSaved(false);
        }
    }, [id]);

    const fetchUser = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const response = await userAPI.getUserById(id);
            const userData = response.data;
            setUser(userData);
            setInterestSent(Boolean(userData.hasExpressedInterest));
            setIsBlocked(Boolean(userData.isBlockedByMe));
            setCurrentPhotoIndex(0);
        } catch (error) {
            console.error('Failed to load profile:', error);
            toast.error(t('users.detailFetchFailed', { defaultValue: 'Failed to fetch user details' }));
            navigate('/users');
        } finally {
            setLoading(false);
        }
    }, [id, navigate, t]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    if (!currentUser?.isApproved && currentUser?.role !== 'admin') {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 max-w-md w-full text-center border border-slate-200 dark:border-slate-700">
                    <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-8 h-8 text-amber-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Approval Required</h2>
                    <p className="text-slate-600 dark:text-slate-300 mb-6 text-sm leading-relaxed">
                        Your account has not yet been approved by an administrator. You must wait for account approval before viewing other member profiles.
                    </p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold hover:opacity-95 shadow-lg shadow-rose-500/25 transition cursor-pointer"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const isOwnProfile = currentUser && user && currentUser._id === user._id;

    // Photos handling
    const rawPhotos = user?.photos && Array.isArray(user.photos) && user.photos.length > 0
        ? user.photos
        : (user?.profileImageUrl ? [{ url: user.profileImageUrl, isMain: true, order: 0 }] : []);

    const photos = rawPhotos.filter(p => p && p.url);
    const profileSlides = user?.profileAvatar ? [{ isAvatar: true }, ...photos] : photos;

    const handlePrevPhoto = () => {
        if (profileSlides.length <= 1) return;
        setCurrentPhotoIndex(prev => (prev === 0 ? profileSlides.length - 1 : prev - 1));
    };

    const handleNextPhoto = () => {
        if (profileSlides.length <= 1) return;
        setCurrentPhotoIndex(prev => (prev === profileSlides.length - 1 ? 0 : prev + 1));
    };

    const handleExpressInterest = async () => {
        if (!user) return;
        if (isOwnProfile) {
            toast.info(t('users.cannotLikeSelf', { defaultValue: 'You cannot express interest in your own profile.' }));
            return;
        }
        if (interestSent) {
            toast.info(t('users.alreadyInterested', { defaultValue: 'You have already expressed interest in this profile.' }));
            return;
        }

        setSendingInterest(true);
        try {
            await messageAPI.sendMessage({
                to: user._id,
                content: 'sent you an interest on Kapu-LK',
                type: 'like',
            });
            setInterestSent(true);
            toast.success(t('users.interestSent', { defaultValue: 'Interest sent successfully!' }));
        } catch (error) {
            toast.error(error.response?.data?.message || t('users.interestFailed', { defaultValue: 'Failed to send interest' }));
        } finally {
            setSendingInterest(false);
        }
    };

    const handleToggleSave = () => {
        if (!id) return;
        try {
            const savedList = JSON.parse(localStorage.getItem('kapu_saved_profiles') || '[]');
            let updated;
            if (savedList.includes(id)) {
                updated = savedList.filter(item => item !== id);
                setIsSaved(false);
                toast.info('Profile removed from your saved list');
            } else {
                updated = [...savedList, id];
                setIsSaved(true);
                toast.success('Profile saved to your favorites');
            }
            localStorage.setItem('kapu_saved_profiles', JSON.stringify(updated));
        } catch (e) {
            toast.error('Failed to update favorites');
        }
    };

    const handleShareProfile = () => {
        const url = window.location.href;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url);
            toast.success('Profile link copied to clipboard!');
        } else {
            toast.info(url);
        }
        setShowMoreMenu(false);
    };

    const handleBlockToggle = async () => {
        if (!user) return;
        setSubmittingBlock(true);
        try {
            if (isBlocked) {
                await userAPI.unblockUser(user._id);
                setIsBlocked(false);
                toast.success(`Unblocked ${user.name}`);
            } else {
                await userAPI.blockUser(user._id);
                setIsBlocked(true);
                toast.success(`Blocked ${user.name}. You will no longer see each other.`);
            }
            setShowBlockModal(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update block status');
        } finally {
            setSubmittingBlock(false);
        }
    };

    const handleReportSubmit = async (e) => {
        e.preventDefault();
        if (!user) return;
        setSubmittingReport(true);
        try {
            await messageAPI.reportUser(user._id, reportReason, reportDetails.trim());
            toast.success('Thank you. Your report has been submitted for moderation review.');
            setShowReportModal(false);
            setReportDetails('');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit report');
        } finally {
            setSubmittingReport(false);
        }
    };

    const handleSupportSubmit = async (e) => {
        e.preventDefault();
        if (!supportSubject.trim() || !supportMessage.trim()) {
            toast.error('Please enter a subject and message.');
            return;
        }

        setSubmittingSupport(true);
        try {
            await supportAPI.createTicket({
                category: 'reporting',
                subject: `Support inquiry regarding user: ${user?.name || id} - ${supportSubject.trim()}`,
                message: supportMessage.trim(),
            });
            toast.success('Support inquiry submitted successfully. Our team will review it.');
            setShowSupportModal(false);
            setSupportSubject('');
            setSupportMessage('');
        } catch (error) {
            toast.error('Failed to submit support request');
        } finally {
            setSubmittingSupport(false);
        }
    };

    // Parse interests list
    const parseInterests = () => {
        if (Array.isArray(user?.interests)) return user.interests;
        if (typeof user?.interests === 'string' && user.interests.trim().length > 0) {
            return user.interests.split(',').map(i => i.trim()).filter(Boolean);
        }
        if (typeof user?.hobbies === 'string' && user.hobbies.trim().length > 0) {
            return user.hobbies.split(',').map(i => i.trim()).filter(Boolean);
        }
        return ['Travel', 'Music', 'Movies', 'Food', 'Reading', 'Fitness', 'Family'];
    };

    // Calculate Match Compatibility Score
    const calculateCompatibility = () => {
        if (!currentUser || !user || isOwnProfile) return null;
        let score = 65;
        const reasons = [];

        // 1. Location match
        const userLoc = (user.district || user.location || '').toLowerCase();
        const myLoc = (currentUser.district || currentUser.location || '').toLowerCase();
        if (userLoc && myLoc && userLoc === myLoc) {
            score += 15;
            reasons.push(`Both living in ${user.district || user.location}`);
        } else if (userLoc) {
            score += 5;
            reasons.push('Location in Sri Lanka');
        }

        // 2. Age compatibility
        const partnerPrefs = user.partnerPreferences || {};
        const myAge = currentUser.age || (currentUser.birthDate ? moment().diff(moment(currentUser.birthDate), 'years') : null);
        if (myAge && partnerPrefs.minAge && partnerPrefs.maxAge) {
            if (myAge >= partnerPrefs.minAge && myAge <= partnerPrefs.maxAge) {
                score += 10;
                reasons.push('Matches preferred partner age');
            }
        } else if (user.age && myAge && Math.abs(user.age - myAge) <= 5) {
            score += 10;
            reasons.push('Compatible age bracket');
        }

        // 3. Shared interests
        const userInterests = parseInterests().map(i => i.toLowerCase());
        const myInterests = (Array.isArray(currentUser.interests) ? currentUser.interests : (typeof currentUser.interests === 'string' ? currentUser.interests.split(',') : [])).map(i => i.trim().toLowerCase());
        const shared = userInterests.filter(i => myInterests.includes(i));
        if (shared.length > 0) {
            score += Math.min(shared.length * 5, 12);
            reasons.push(`${shared.length} shared interest${shared.length > 1 ? 's' : ''}`);
        }

        const finalScore = Math.min(Math.max(score, 65), 98);
        return { score: finalScore, reasons };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[80vh] bg-slate-50 dark:bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-600" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const interestsList = parseInterests();
    const activeSlide = profileSlides[currentPhotoIndex] || null;
    const activePhoto = activeSlide && !activeSlide.isAvatar ? activeSlide : null;
    const isPhotoError = activePhoto ? imgErrors[currentPhotoIndex] : true;

    const partnerPrefs = user.partnerPreferences || {};
    const partnerAgeRange = partnerPrefs.minAge && partnerPrefs.maxAge
        ? `${partnerPrefs.minAge} - ${partnerPrefs.maxAge}`
        : (partnerPrefs.minAge ? `${partnerPrefs.minAge}+` : 'Open');

    const compatibility = calculateCompatibility();

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b1118] text-slate-900 dark:text-slate-100 transition-colors duration-300 pb-28 md:pb-16">
            <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
                
                {/* Top Navigation Row: Back to Browse */}
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <BackButton variant="ghost" fallback="/users" label="Back to Discovery" iconClassName="w-4 h-4" className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-rose-600" />
                    
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-medium hidden sm:inline">Member ID: {user._id?.slice(-6).toUpperCase()}</span>
                    </div>
                </div>

                {/* Main 3-Column Responsive Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">

                    {/* ================= LEFT COLUMN: Photos & Safety (Desktop 4 cols / 12) ================= */}
                    <div className="lg:col-span-4 xl:col-span-4 space-y-4 sm:space-y-5">
                        
                        {/* Modern Full-Bleed Photo Card */}
                        <div className="bg-white dark:bg-[#131d27] rounded-3xl p-3 border border-slate-200/80 dark:border-slate-800/80 shadow-xl overflow-hidden">
                            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-gradient-to-br from-rose-100 via-pink-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 shadow-inner group">
                                {activeSlide?.isAvatar ? (
                                    <ProfileAvatar user={user} className="h-full w-full" avatarClassName="text-9xl" fallbackClassName="text-8xl font-extrabold text-white bg-gradient-to-br from-rose-600 via-pink-600 to-rose-700" />
                                ) : activePhoto && !isPhotoError ? (
                                    <img
                                        src={activePhoto.url}
                                        alt={user.name}
                                        onError={() => setImgErrors(prev => ({ ...prev, [currentPhotoIndex]: true }))}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-rose-600 via-pink-600 to-rose-700 text-white p-6 text-center">
                                        <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-4xl font-extrabold uppercase shadow-lg border border-white/30 mb-3">
                                            {user.name ? user.name.charAt(0) : 'U'}
                                        </div>
                                        <span className="text-base font-bold">{user.name}</span>
                                    </div>
                                )}

                                {/* Cinematic bottom gradient vignette */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

                                {/* Online / Active Status Badge (Top-Left) */}
                                <div className="absolute top-3 left-3 z-10">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold shadow-md border border-white/10">
                                        <span className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-300'}`} />
                                        <span>{user.isOnline ? 'Online now' : (user.lastActiveAt ? `Active ${moment(user.lastActiveAt).fromNow()}` : 'Active Member')}</span>
                                    </span>
                                </div>

                                {/* Floating Photo Info overlay on image */}
                                <div className="absolute bottom-3 left-3 right-3 z-10 flex items-end justify-between text-white">
                                    <div>
                                        <h2 className="text-xl font-extrabold tracking-tight drop-shadow-md flex items-center gap-1.5">
                                            <span>{user.name}</span>
                                            {user.age && <span>, {user.age}</span>}
                                        </h2>
                                        <p className="text-xs text-white/90 drop-shadow flex items-center gap-1 mt-0.5">
                                            <MapPin className="w-3.5 h-3.5 text-rose-400" />
                                            <span>{user.district || user.location || 'Sri Lanka'}</span>
                                        </p>
                                    </div>
                                    {profileSlides.length > 0 && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold shadow border border-white/10">
                                            <span>📷</span>
                                            <span>{currentPhotoIndex + 1}/{profileSlides.length}</span>
                                        </span>
                                    )}
                                </div>

                                {/* Carousel Navigation Arrows (Only if > 1 photo) */}
                                {profileSlides.length > 1 && (
                                    <>
                                        <button
                                            onClick={handlePrevPhoto}
                                            aria-label="Previous Photo"
                                            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center shadow-lg backdrop-blur-md hover:bg-black/80 transition active:scale-90 border border-white/20"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={handleNextPhoto}
                                            aria-label="Next Photo"
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center shadow-lg backdrop-blur-md hover:bg-black/80 transition active:scale-90 border border-white/20"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Additional Thumbnails Row */}
                            {profileSlides.length > 1 && (
                                <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
                                    {profileSlides.map((p, idx) => {
                                        const isSelected = idx === currentPhotoIndex;
                                        return (
                                            <button
                                                key={p._id || (p.isAvatar ? 'profile-avatar' : idx)}
                                                onClick={() => setCurrentPhotoIndex(idx)}
                                                className={`relative rounded-xl overflow-hidden aspect-square flex-1 h-14 sm:h-16 border-2 transition-all duration-200 cursor-pointer ${
                                                    isSelected
                                                        ? 'border-rose-600 ring-2 ring-rose-500/30 scale-102'
                                                        : 'border-transparent opacity-70 hover:opacity-100 hover:border-rose-300'
                                                }`}
                                            >
                                                {p.isAvatar ? (
                                                    <ProfileAvatar user={user} className="h-full w-full" avatarClassName="text-3xl" />
                                                ) : (
                                                    <img src={p.url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Match Compatibility Card */}
                        {compatibility && (
                            <div className="bg-gradient-to-br from-rose-500/10 via-pink-500/5 to-amber-500/10 dark:from-rose-950/40 dark:to-slate-900 rounded-3xl p-5 border border-rose-200/80 dark:border-rose-900/40 shadow-sm space-y-3.5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-sm">
                                            <Sparkles className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                                                Match Compatibility
                                            </h3>
                                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                                Based on preferences &amp; location
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-lg font-black text-rose-600 dark:text-rose-400">
                                        {compatibility.score}%
                                    </span>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 rounded-full transition-all duration-1000"
                                        style={{ width: `${compatibility.score}%` }}
                                    />
                                </div>

                                {compatibility.reasons.length > 0 && (
                                    <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5 pt-1">
                                        {compatibility.reasons.map((r, i) => (
                                            <li key={i} className="flex items-center gap-2">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                                <span>{r}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}

                        {/* Upgrade to See More Card */}
                        {(!currentUser?.isPremium || currentUser?.premiumPlan === 'bronze') && !isOwnProfile && (
                            <div className="bg-gradient-to-br from-amber-500/10 via-rose-500/5 to-amber-500/10 dark:from-amber-950/30 dark:to-slate-900 rounded-3xl p-5 border border-amber-500/20 dark:border-amber-500/30 shadow-sm space-y-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-sm shrink-0">
                                        <Crown className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-extrabold text-slate-900 dark:text-white">Upgrade to Premium</h3>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                            Get direct contact details, see who liked you, and unlock priority chat.
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    to="/premium"
                                    className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:opacity-95 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition"
                                >
                                    <span>View Premium Plans</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        )}

                        {/* Report or Block Card */}
                        {!isOwnProfile && (
                            <div className="bg-white dark:bg-[#131d27] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3">
                                <div className="flex items-center gap-2.5">
                                    <Shield className="w-5 h-5 text-rose-500 shrink-0" />
                                    <div>
                                        <h3 className="text-xs font-extrabold text-slate-900 dark:text-white">Report or Block</h3>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                            Help us keep Kapu-LK safe, verified, and respectful.
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 pt-1">
                                    <button
                                        onClick={() => setShowReportModal(true)}
                                        className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100/60 transition cursor-pointer"
                                    >
                                        <Flag className="w-3.5 h-3.5" />
                                        <span>Report Profile</span>
                                    </button>
                                    <button
                                        onClick={() => setShowBlockModal(true)}
                                        className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
                                    >
                                        <Ban className="w-3.5 h-3.5" />
                                        <span>{isBlocked ? 'Unblock' : 'Block User'}</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ================= CENTER COLUMN: Primary Details & Bio (Desktop 5 cols / 12) ================= */}
                    <div className="lg:col-span-5 xl:col-span-5 space-y-4 sm:space-y-5">
                        
                        {/* Profile Header Card */}
                        <div className="bg-white dark:bg-[#131d27] rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
                            <div>
                                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                        {user.name}
                                    </h1>
                                    {user.isVerified && (
                                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500 text-white shadow-xs" title="Verified Member">
                                            <Check className="w-3 h-3 stroke-[3]" />
                                        </span>
                                    )}
                                    {user.isPremium && (
                                        <PremiumBadge plan={user.premiumPlan} size="sm" />
                                    )}
                                </div>

                                {/* Metadata Row */}
                                <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-xs text-slate-600 dark:text-slate-400 font-medium">
                                    {user.age && (
                                        <span className="inline-flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5 text-rose-500" />
                                            <span>{user.age} years old</span>
                                        </span>
                                    )}
                                    {(user.district || user.location) && (
                                        <span className="inline-flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5 text-pink-500" />
                                            <span>{user.district || user.location}, Sri Lanka</span>
                                        </span>
                                    )}
                                    {user.lastActiveAt && (
                                        <span className="inline-flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                            <span>Last active {moment(user.lastActiveAt).fromNow()}</span>
                                        </span>
                                    )}
                                </div>

                                {/* Tagline / Quote */}
                                {user.bio && (
                                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 italic mt-3 font-medium bg-rose-50/50 dark:bg-rose-950/20 p-3 rounded-2xl border border-rose-100/60 dark:border-rose-900/30">
                                        "{user.bio.split('\n')[0].slice(0, 95)}{user.bio.length > 95 ? '...' : ''}"
                                    </p>
                                )}
                            </div>

                            {/* Romantic Action Pills */}
                            {!isOwnProfile && (
                                <div className="flex items-center gap-2 pt-1 flex-wrap">
                                    {/* Like / Express Interest Pill */}
                                    <button
                                        onClick={handleExpressInterest}
                                        disabled={sendingInterest || interestSent}
                                        className={`flex-1 min-w-[150px] inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl text-xs sm:text-sm font-bold shadow-lg transition-all active:scale-95 cursor-pointer ${
                                            interestSent
                                                ? 'bg-emerald-600 text-white shadow-emerald-500/25'
                                                : 'bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white shadow-rose-500/25'
                                        }`}
                                    >
                                        <Heart className={`w-4 h-4 ${interestSent ? 'fill-white' : ''}`} />
                                        <span>{interestSent ? 'Interest Sent' : (sendingInterest ? 'Sending...' : 'Like & Connect')}</span>
                                    </button>

                                    {/* Message Pill */}
                                    <button
                                        onClick={() => navigate(`/conversation/${user._id}`)}
                                        className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-300 bg-rose-50/50 dark:bg-rose-950/30 hover:bg-rose-100/60 dark:hover:bg-rose-900/40 text-xs sm:text-sm font-bold transition-all active:scale-95 shadow-xs cursor-pointer"
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                        <span>Message</span>
                                    </button>

                                    {/* Bookmark Pill */}
                                    <button
                                        onClick={handleToggleSave}
                                        className={`p-3 rounded-2xl border transition-all active:scale-90 cursor-pointer ${
                                            isSaved
                                                ? 'border-rose-600 bg-rose-100 dark:bg-rose-950 text-rose-600'
                                                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                                        }`}
                                        title={isSaved ? 'Saved' : 'Save profile'}
                                    >
                                        <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-rose-600' : ''}`} />
                                    </button>

                                    {/* More Menu Dropdown */}
                                    <div className="relative" ref={moreMenuRef}>
                                        <button
                                            onClick={() => setShowMoreMenu(!showMoreMenu)}
                                            className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                                            title="More options"
                                        >
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>

                                        {showMoreMenu && (
                                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#131d27] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                                                <button
                                                    onClick={handleShareProfile}
                                                    className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer"
                                                >
                                                    <Share2 className="w-3.5 h-3.5 text-rose-600" />
                                                    <span>Share Profile</span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(user._id);
                                                        toast.success('User ID copied to clipboard');
                                                        setShowMoreMenu(false);
                                                    }}
                                                    className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer"
                                                >
                                                    <Award className="w-3.5 h-3.5 text-rose-600" />
                                                    <span>Copy Profile ID</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* About Me Card */}
                        <div className="bg-white dark:bg-[#131d27] rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3">
                            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                <User className="w-4 h-4 text-rose-600" />
                                <span>About Me</span>
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                                {user.bio || 'No detailed biography provided yet. Express interest or send a message to learn more!'}
                            </p>
                        </div>

                        {/* Personal Information Card */}
                        <div className="bg-white dark:bg-[#131d27] rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
                            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-rose-600" />
                                <span>Personal Details &amp; Lifestyle</span>
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5 text-rose-500" /> Gender
                                    </span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">{user.gender || 'Not specified'}</span>
                                </div>

                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                                        <Compass className="w-3.5 h-3.5 text-pink-500" /> Religion
                                    </span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{user.religion || 'Open / Not specified'}</span>
                                </div>

                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                                        <Users className="w-3.5 h-3.5 text-rose-400" /> Caste
                                    </span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{user.caste || 'Open / Not specified'}</span>
                                </div>

                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                                        <GraduationCap className="w-3.5 h-3.5 text-blue-500" /> Education
                                    </span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px] text-right">{user.education || 'Not specified'}</span>
                                </div>

                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                                        <Heart className="w-3.5 h-3.5 text-rose-500" /> Marital Status
                                    </span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">{user.maritalStatus || 'Never Married'}</span>
                                </div>

                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                                        <Award className="w-3.5 h-3.5 text-amber-500" /> Height
                                    </span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{user.height || '5\' 4" (162 cm)'}</span>
                                </div>

                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                                        <Briefcase className="w-3.5 h-3.5 text-rose-500" /> Occupation
                                    </span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px] text-right">{user.occupation || 'Professional'}</span>
                                </div>

                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                                        <Building className="w-3.5 h-3.5 text-teal-500" /> Body Type
                                    </span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{user.bodyType || 'Average / Slim'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Row: Interests & Looking For Side-by-Side */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Interests Card */}
                            <div className="bg-white dark:bg-[#131d27] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3">
                                <h3 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                                    <span>Interests &amp; Hobbies</span>
                                </h3>
                                <div className="flex flex-wrap gap-1.5">
                                    {interestsList.map((tag, i) => (
                                        <span
                                            key={i}
                                            className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50/80 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/40"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Looking For Card */}
                            <div className="bg-white dark:bg-[#131d27] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3">
                                <h3 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Target className="w-4 h-4 text-rose-500" />
                                    <span>Looking For</span>
                                </h3>
                                <div className="space-y-2 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 dark:text-slate-400">Age Range</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-200">{partnerAgeRange}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 dark:text-slate-400">Marital Status</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">{partnerPrefs.maritalStatus || 'Never Married'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 dark:text-slate-400">Location</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-200">{partnerPrefs.district || 'Sri Lanka (Open)'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* ================= RIGHT COLUMN: Contact Info & Status (Desktop 3 cols / 12) ================= */}
                    <div className="lg:col-span-3 xl:col-span-3 space-y-4 sm:space-y-5">
                        
                        {/* Contact Information Card */}
                        <div className="bg-white dark:bg-[#131d27] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3.5">
                            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                <Phone className="w-4 h-4 text-rose-600" />
                                <span>Contact Details</span>
                            </h3>

                            <div className="space-y-3 text-xs">
                                {/* Phone Number */}
                                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                            <Phone className="w-3 h-3 text-slate-400" /> Phone Number
                                        </span>
                                        {user.phoneVisibility === 'premium_required' && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                                                <Crown className="w-3 h-3 text-amber-500" /> Premium
                                            </span>
                                        )}
                                    </div>
                                    <p className="font-bold text-slate-900 dark:text-white text-sm">
                                        {user.phoneVisibility === 'visible' && user.phoneNumber
                                            ? user.phoneNumber
                                            : (user.phoneVisibility === 'hidden_by_user' ? 'Private (Owner Choice)' : 'Private')}
                                    </p>
                                </div>

                                {/* Email Address */}
                                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                            <Mail className="w-3 h-3 text-slate-400" /> Email Address
                                        </span>
                                        {user.emailVisibility === 'premium_required' && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                                                <Crown className="w-3 h-3 text-amber-500" /> Premium
                                            </span>
                                        )}
                                    </div>
                                    <p className="font-bold text-slate-900 dark:text-white text-sm truncate">
                                        {user.emailVisibility === 'visible' && user.email
                                            ? user.email
                                            : (user.emailVisibility === 'hidden_by_user' ? 'Private (Owner Choice)' : 'Private')}
                                    </p>
                                </div>

                                {/* Unlock CTA if locked */}
                                {(user.phoneVisibility === 'premium_required' || user.emailVisibility === 'premium_required') && (
                                    <Link
                                        to="/premium"
                                        className="block text-center text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline pt-1"
                                    >
                                        Unlock Direct Contact with Premium →
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Account Status Card */}
                        <div className="bg-white dark:bg-[#131d27] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3.5">
                            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                <Shield className="w-4 h-4 text-rose-600" />
                                <span>Verification &amp; Trust</span>
                            </h3>

                            <div className="space-y-3 text-xs">
                                <div className="flex items-start gap-2.5">
                                    <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white">Verified Member</p>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Account verified on Kapu-LK</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2.5">
                                    <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 shrink-0 mt-0.5">
                                        <Calendar className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white">Member Since</p>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                            {user.createdAt ? moment(user.createdAt).format('MMMM D, YYYY') : 'July 2026'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2.5">
                                    <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 shrink-0 mt-0.5">
                                        <Crown className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white">
                                            {user.isPremium ? 'Premium Member' : 'Standard Member'}
                                        </p>
                                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold capitalize">
                                            {user.premiumPlan ? `${user.premiumPlan} Plan` : 'Free Tier'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Safety Tips Card */}
                        <div className="bg-rose-50/70 dark:bg-rose-950/30 rounded-3xl p-5 border border-rose-100 dark:border-rose-900/40 text-xs space-y-2.5 shadow-xs">
                            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold">
                                <Lightbulb className="w-4 h-4 text-rose-600 shrink-0" />
                                <span>Dating Safety Tips</span>
                            </div>
                            <p className="text-[11px] text-rose-800 dark:text-rose-300/90 leading-relaxed">
                                Get to know your match via chat before meeting. Never share sensitive bank details or passwords.
                            </p>
                            <Link
                                to="/privacy-policy"
                                className="inline-block text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline"
                            >
                                Read Safety Guidelines →
                            </Link>
                        </div>

                    </div>

                </div>

            </div>

            {/* ================= MODALS ================= */}

            {/* Report Profile Modal */}
            {showReportModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center font-bold">
                                    <Flag className="w-5 h-5" />
                                </div>
                                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Report Profile</h3>
                            </div>
                            <button
                                onClick={() => setShowReportModal(false)}
                                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleReportSubmit} className="space-y-3.5">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Reason for Report
                                </label>
                                <select
                                    value={reportReason}
                                    onChange={(e) => setReportReason(e.target.value)}
                                    className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                                >
                                    <option value="fake_profile">Fake Profile / Impersonation</option>
                                    <option value="inappropriate_photos">Inappropriate or Offensive Photos</option>
                                    <option value="harassment">Harassment / Abusive Behavior</option>
                                    <option value="scam_financial">Financial Scam / Money Request</option>
                                    <option value="underage">Underage Account</option>
                                    <option value="other">Other Violation</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Details (Optional)
                                </label>
                                <textarea
                                    value={reportDetails}
                                    onChange={(e) => setReportDetails(e.target.value)}
                                    placeholder="Please provide any additional context..."
                                    rows={3}
                                    className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none resize-none"
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowReportModal(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingReport}
                                    className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold shadow hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
                                >
                                    {submittingReport ? 'Submitting...' : 'Submit Report'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Block User Confirmation Modal */}
            {showBlockModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
                        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
                            <Ban className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                {isBlocked ? `Unblock ${user.name}?` : `Block ${user.name}?`}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {isBlocked
                                    ? 'Unblocking will allow you to see their profile and exchange messages again.'
                                    : 'They will no longer be able to message you, express interest, or view your profile.'}
                            </p>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => setShowBlockModal(false)}
                                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBlockToggle}
                                disabled={submittingBlock}
                                className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold shadow cursor-pointer ${
                                    isBlocked ? 'bg-rose-600 hover:bg-rose-700' : 'bg-rose-600 hover:bg-rose-700'
                                } disabled:opacity-50`}
                            >
                                {submittingBlock ? 'Updating...' : (isBlocked ? 'Confirm Unblock' : 'Confirm Block')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Contact Support Ticket Modal */}
            {showSupportModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center font-bold">
                                    <Headphones className="w-5 h-5" />
                                </div>
                                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Contact Safety Support</h3>
                            </div>
                            <button
                                onClick={() => setShowSupportModal(false)}
                                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSupportSubmit} className="space-y-3.5">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Subject
                                </label>
                                <input
                                    type="text"
                                    value={supportSubject}
                                    onChange={(e) => setSupportSubject(e.target.value)}
                                    placeholder="Brief summary of inquiry..."
                                    className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Message
                                </label>
                                <textarea
                                    value={supportMessage}
                                    onChange={(e) => setSupportMessage(e.target.value)}
                                    placeholder="Explain your question or concern in detail..."
                                    rows={4}
                                    className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none resize-none"
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowSupportModal(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingSupport}
                                    className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold shadow hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
                                >
                                    {submittingSupport ? 'Sending...' : 'Send to Support'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default UserDetail;
