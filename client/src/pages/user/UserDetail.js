import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { userAPI, messageAPI, supportAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import moment from 'moment';
import {
    ArrowLeft, ChevronLeft, ChevronRight, Heart, MessageSquare,
    Bookmark, Share2, MoreHorizontal, Shield, Phone, Mail,
    Crown, CheckCircle2, Calendar, Clock,
    Flag, Ban, Headphones, Lightbulb, User,
    MapPin, GraduationCap, Briefcase, Building, Users,
    Check, X, Target, Compass, Award
} from 'lucide-react';
import PremiumBadge from '../../components/ui/PremiumBadge';

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

    const isOwnProfile = currentUser && user && currentUser._id === user._id;

    // Photos handling
    const rawPhotos = user?.photos && Array.isArray(user.photos) && user.photos.length > 0
        ? user.photos
        : (user?.profileImageUrl ? [{ url: user.profileImageUrl, isMain: true, order: 0 }] : []);

    const photos = rawPhotos.filter(p => p && p.url);

    const handlePrevPhoto = () => {
        if (photos.length <= 1) return;
        setCurrentPhotoIndex(prev => (prev === 0 ? photos.length - 1 : prev - 1));
    };

    const handleNextPhoto = () => {
        if (photos.length <= 1) return;
        setCurrentPhotoIndex(prev => (prev === photos.length - 1 ? 0 : prev + 1));
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
                content: 'sent you an interest on LoveLK',
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[80vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    // Parse interests list
    const parseInterests = () => {
        if (Array.isArray(user.interests)) return user.interests;
        if (typeof user.interests === 'string' && user.interests.trim().length > 0) {
            return user.interests.split(',').map(i => i.trim()).filter(Boolean);
        }
        if (typeof user.hobbies === 'string' && user.hobbies.trim().length > 0) {
            return user.hobbies.split(',').map(i => i.trim()).filter(Boolean);
        }
        return ['Travel', 'Music', 'Movies', 'Food', 'Reading', 'Fitness', 'Family'];
    };

    const interestsList = parseInterests();
    const activePhoto = photos[currentPhotoIndex] || null;
    const isPhotoError = activePhoto ? imgErrors[currentPhotoIndex] : true;

    const partnerPrefs = user.partnerPreferences || {};
    const partnerAgeRange = partnerPrefs.minAge && partnerPrefs.maxAge
        ? `${partnerPrefs.minAge} - ${partnerPrefs.maxAge}`
        : (partnerPrefs.minAge ? `${partnerPrefs.minAge}+` : 'Open');

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b1118] text-slate-900 dark:text-slate-100 transition-colors duration-300 pb-28 md:pb-16">
            <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
                
                {/* Top Navigation Row: Back to Browse */}
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <button
                        onClick={() => navigate('/users')}
                        className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-400 transition"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Browse</span>
                    </button>
                </div>

                {/* Main 3-Column Responsive Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">

                    {/* ================= LEFT COLUMN: Photos & Safety (Desktop 4 cols / 12) ================= */}
                    <div className="lg:col-span-4 xl:col-span-4 space-y-4 sm:space-y-5">
                        
                        {/* Main Photo Card */}
                        <div className="bg-white dark:bg-[#131d27] rounded-3xl p-3 border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
                            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-gradient-to-br from-purple-100 via-pink-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 shadow-inner group">
                                {activePhoto && !isPhotoError ? (
                                    <img
                                        src={activePhoto.url}
                                        alt={user.name}
                                        onError={() => setImgErrors(prev => ({ ...prev, [currentPhotoIndex]: true }))}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-700 text-white p-6 text-center">
                                        <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-4xl font-extrabold uppercase shadow-lg border border-white/30 mb-3">
                                            {user.name ? user.name.charAt(0) : 'U'}
                                        </div>
                                        <span className="text-base font-bold">{user.name}</span>
                                    </div>
                                )}

                                {/* Online / Active Status Badge (Top-Left) */}
                                <div className="absolute top-3 left-3 z-10">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold shadow-md">
                                        <span className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-300'}`} />
                                        <span>{user.isOnline ? 'Online now' : (user.lastActiveAt ? `Active ${moment(user.lastActiveAt).fromNow()}` : 'Member')}</span>
                                    </span>
                                </div>

                                {/* Carousel Navigation Arrows (Only if > 1 photo) */}
                                {photos.length > 1 && (
                                    <>
                                        <button
                                            onClick={handlePrevPhoto}
                                            aria-label="Previous Photo"
                                            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 dark:bg-black/60 text-slate-900 dark:text-white flex items-center justify-center shadow-lg backdrop-blur-xs hover:bg-white dark:hover:bg-black transition active:scale-90"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={handleNextPhoto}
                                            aria-label="Next Photo"
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 dark:bg-black/60 text-slate-900 dark:text-white flex items-center justify-center shadow-lg backdrop-blur-xs hover:bg-white dark:hover:bg-black transition active:scale-90"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </>
                                )}

                                {/* Photo Count Indicator (Bottom-Right) */}
                                {photos.length > 0 && (
                                    <div className="absolute bottom-3 right-3 z-10">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md text-white text-[11px] font-bold shadow">
                                            <span>📷</span>
                                            <span>{currentPhotoIndex + 1}/{photos.length}</span>
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Additional Thumbnails Row (Desktop / Mobile if multiple photos) */}
                            {photos.length > 1 && (
                                <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
                                    {photos.slice(0, 4).map((p, idx) => {
                                        const isSelected = idx === currentPhotoIndex;
                                        return (
                                            <button
                                                key={p._id || idx}
                                                onClick={() => setCurrentPhotoIndex(idx)}
                                                className={`relative rounded-xl overflow-hidden aspect-square flex-1 h-14 sm:h-16 border-2 transition-all duration-200 ${
                                                    isSelected
                                                        ? 'border-purple-600 ring-2 ring-purple-600/30 scale-102'
                                                        : 'border-transparent opacity-70 hover:opacity-100 hover:border-purple-300'
                                                }`}
                                            >
                                                <img
                                                    src={p.url}
                                                    alt={`Thumbnail ${idx + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Upgrade to See More Card */}
                        {(!currentUser?.isPremium || currentUser?.premiumPlan === 'bronze') && !isOwnProfile && (
                            <div className="bg-gradient-to-br from-amber-500/10 via-pink-500/5 to-purple-500/10 dark:from-amber-950/30 dark:to-purple-950/30 rounded-3xl p-5 border border-amber-500/20 dark:border-amber-500/30 shadow-sm space-y-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-sm shrink-0">
                                        <Crown className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Upgrade to See More</h3>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                            Get full access to all photos, direct contact details, and priority compatibility with {user.name?.split(' ')[0] || 'this user'}.
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    to="/premium"
                                    className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:opacity-95 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition"
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
                                            Help us keep LoveLK safe, verified, and respectful.
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 pt-1">
                                    <button
                                        onClick={() => setShowReportModal(true)}
                                        className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100/60 dark:hover:bg-rose-900/30 transition shadow-xs"
                                    >
                                        <Flag className="w-3.5 h-3.5" />
                                        <span>Report Profile</span>
                                    </button>
                                    <button
                                        onClick={() => setShowBlockModal(true)}
                                        className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700/60 transition shadow-xs"
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
                                    <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                        {user.name}
                                    </h1>
                                    {user.isVerified && (
                                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white shadow-xs" title="Verified Member">
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
                                            <Calendar className="w-3.5 h-3.5 text-purple-600" />
                                            <span>{user.age} years old</span>
                                        </span>
                                    )}
                                    {(user.district || user.location) && (
                                        <span className="inline-flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5 text-pink-600" />
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
                                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 italic mt-3 font-medium bg-purple-50/50 dark:bg-purple-950/20 p-2.5 rounded-xl border border-purple-100/50 dark:border-purple-900/30">
                                        "{user.bio.split('\n')[0].slice(0, 90)}{user.bio.length > 90 ? '...' : ''}"
                                    </p>
                                )}
                            </div>

                            {/* Action Buttons Row */}
                            {!isOwnProfile && (
                                <div className="flex items-center gap-2 pt-1 flex-wrap">
                                    {/* Express Interest */}
                                    <button
                                        onClick={handleExpressInterest}
                                        disabled={sendingInterest || interestSent}
                                        className={`flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 ${
                                            interestSent
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-700 hover:to-rose-700 text-white shadow-purple-500/25'
                                        }`}
                                    >
                                        <Heart className={`w-4 h-4 ${interestSent ? 'fill-white' : ''}`} />
                                        <span>{interestSent ? 'Interest Sent' : (sendingInterest ? 'Sending...' : 'Express Interest')}</span>
                                    </button>

                                    {/* Message */}
                                    <button
                                        onClick={() => navigate(`/conversation/${user._id}`)}
                                        className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-300 bg-purple-50/40 dark:bg-purple-950/30 hover:bg-purple-100/60 dark:hover:bg-purple-900/40 text-xs sm:text-sm font-bold transition-all active:scale-95 shadow-xs"
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                        <span>Message</span>
                                    </button>

                                    {/* Save / Favorite */}
                                    <button
                                        onClick={handleToggleSave}
                                        className={`p-3 rounded-2xl border transition-all active:scale-90 ${
                                            isSaved
                                                ? 'border-purple-600 bg-purple-100 dark:bg-purple-950 text-purple-600'
                                                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                                        }`}
                                        title={isSaved ? 'Saved' : 'Save profile'}
                                    >
                                        <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-purple-600' : ''}`} />
                                    </button>

                                    {/* More Menu Dropdown */}
                                    <div className="relative" ref={moreMenuRef}>
                                        <button
                                            onClick={() => setShowMoreMenu(!showMoreMenu)}
                                            className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                                            title="More options"
                                        >
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>

                                        {showMoreMenu && (
                                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#131d27] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                                                <button
                                                    onClick={handleShareProfile}
                                                    className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 flex items-center gap-2"
                                                >
                                                    <Share2 className="w-3.5 h-3.5 text-purple-600" />
                                                    <span>Share Profile</span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(user._id);
                                                        toast.success('User ID copied to clipboard');
                                                        setShowMoreMenu(false);
                                                    }}
                                                    className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 flex items-center gap-2"
                                                >
                                                    <Award className="w-3.5 h-3.5 text-purple-600" />
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
                                <User className="w-4 h-4 text-purple-600" />
                                <span>About Me</span>
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                                {user.bio || 'No detailed biography provided yet. Express interest or send a message to learn more!'}
                            </p>
                        </div>

                        {/* Personal Information Card */}
                        <div className="bg-white dark:bg-[#131d27] rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
                            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-purple-600" />
                                <span>Personal Information</span>
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5 text-purple-500" /> Gender
                                    </span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">{user.gender || 'Not specified'}</span>
                                </div>

                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                                        <Compass className="w-3.5 h-3.5 text-pink-500" /> Religion
                                    </span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{user.religion || 'Not specified'}</span>
                                </div>

                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                                        <Users className="w-3.5 h-3.5 text-indigo-500" /> Caste
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
                                        <Briefcase className="w-3.5 h-3.5 text-purple-500" /> Occupation
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
                                    <Heart className="w-4 h-4 text-pink-600 fill-pink-600" />
                                    <span>Interests</span>
                                </h3>
                                <div className="flex flex-wrap gap-1.5">
                                    {interestsList.map((tag, i) => (
                                        <span
                                            key={i}
                                            className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700"
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
                                <Phone className="w-4 h-4 text-purple-600" />
                                <span>Contact Information</span>
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
                                        className="block text-center text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline pt-1"
                                    >
                                        Unlock Direct Contact with Silver/Gold →
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Account Status Card */}
                        <div className="bg-white dark:bg-[#131d27] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3.5">
                            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                <Shield className="w-4 h-4 text-purple-600" />
                                <span>Account Status</span>
                            </h3>

                            <div className="space-y-3 text-xs">
                                <div className="flex items-start gap-2.5">
                                    <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white">Verified Profile</p>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">This profile has been verified</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2.5">
                                    <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 shrink-0 mt-0.5">
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
                                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                                        <Clock className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white">Last Active</p>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                            {user.lastActiveAt ? moment(user.lastActiveAt).fromNow() : 'Recently'}
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

                        {/* Need Help? Card */}
                        <div className="bg-white dark:bg-[#131d27] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3">
                            <div className="flex items-center gap-2.5">
                                <Headphones className="w-4 h-4 text-blue-600 shrink-0" />
                                <div>
                                    <h3 className="text-xs font-extrabold text-slate-900 dark:text-white">Need Help?</h3>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                        If you notice anything suspicious or inappropriate, please let us know.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowSupportModal(true)}
                                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold transition shadow-xs"
                            >
                                <Headphones className="w-3.5 h-3.5 text-blue-500" />
                                <span>Contact Support</span>
                            </button>
                        </div>

                        {/* Safety Tips Card */}
                        <div className="bg-pink-50 dark:bg-pink-950/30 rounded-3xl p-5 border border-pink-100 dark:border-pink-900/40 text-xs space-y-2.5 shadow-xs">
                            <div className="flex items-center gap-2 text-pink-700 dark:text-pink-300 font-bold">
                                <Lightbulb className="w-4 h-4 text-pink-600 shrink-0" />
                                <span>Safety Tips</span>
                            </div>
                            <p className="text-[11px] text-pink-800 dark:text-pink-300/90 leading-relaxed">
                                Always be respectful and take time to get to know each other. Never share personal financial or bank information online.
                            </p>
                            <Link
                                to="/privacy-policy"
                                className="inline-block text-[11px] font-bold text-pink-700 dark:text-pink-300 hover:underline"
                            >
                                Read Our Safety Guide →
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
                                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
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
                                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingReport}
                                    className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold shadow hover:bg-rose-700 disabled:opacity-50"
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
                                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBlockToggle}
                                disabled={submittingBlock}
                                className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold shadow ${
                                    isBlocked ? 'bg-purple-600 hover:bg-purple-700' : 'bg-rose-600 hover:bg-rose-700'
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
                                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center font-bold">
                                    <Headphones className="w-5 h-5" />
                                </div>
                                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Contact Safety Support</h3>
                            </div>
                            <button
                                onClick={() => setShowSupportModal(false)}
                                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
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
                                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingSupport}
                                    className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow hover:bg-blue-700 disabled:opacity-50"
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
