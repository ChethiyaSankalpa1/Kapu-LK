import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, MessageCircle, Heart, CheckCircle, Briefcase, Eye } from 'lucide-react';
import PremiumBadge from './PremiumBadge';

const ProfileCard = ({
    user,
    onLike,
    onView,
    onMessage,
    isOwnProfile = false,
    liked = false,
    viewedAt = null,
    viewCount = 1,
    showViewedInfo = false,
}) => {
    const { t } = useTranslation();
    const [imgError, setImgError] = useState(false);
    const [isLiked, setIsLiked] = useState(liked);

    if (!user) return null;

    const firstName = user.name ? user.name.split(' ')[0] : t('common.member', { defaultValue: 'Member' });
    const location = user.district || user.location || 'Sri Lanka';
    const hasPhoto = Boolean(user.profileImageUrl) && !imgError;
    const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';

    const handleLikeClick = (e) => {
        e.stopPropagation();
        setIsLiked(!isLiked);
        if (onLike) {
            onLike(user._id);
        }
    };

    const handleViewClick = (e) => {
        if (e) e.stopPropagation();
        if (onView) {
            onView(user._id);
        }
    };

    const handleMessageClick = (e) => {
        if (e) e.stopPropagation();
        if (onMessage) {
            onMessage(user._id);
        }
    };

    return (
        <div
            onClick={handleViewClick}
            className="group relative bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl border border-gray-150 dark:border-gray-800 shadow-xs hover:shadow-xl dark:hover:shadow-purple-950/30 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer transform hover:-translate-y-1"
        >
            {/* Top Photo Area */}
            <div className="relative h-48 sm:h-56 w-full bg-gradient-to-br from-purple-100 via-pink-50 to-purple-200 dark:from-purple-950/40 dark:via-gray-900 dark:to-pink-950/30 overflow-hidden">
                {hasPhoto ? (
                    <img
                        src={user.profileImageUrl}
                        alt={user.name || 'User Profile'}
                        onError={() => setImgError(true)}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-indigo-500/10 dark:from-purple-900/30 dark:to-pink-900/20">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center font-black text-3xl sm:text-4xl shadow-md border-4 border-white dark:border-gray-800">
                            {initial}
                        </div>
                    </div>
                )}

                {/* Subtle dark gradient overlay on bottom of image for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                {/* Online Status Pill */}
                {user.isOnline && (
                    <span className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-bold text-white flex items-center gap-1.5 shadow-xs">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                        <span>Online</span>
                    </span>
                )}

                {/* Premium / Admin Badge (Top Left) */}
                {(user.isPremium || user.role === 'admin') && (
                    <div className="absolute top-2.5 left-2.5 z-10">
                        <PremiumBadge plan={user.premiumPlan} isAdmin={user.role === 'admin'} size="sm" />
                    </div>
                )}

                {/* Quick Like Heart Button (Top Right) */}
                {!isOwnProfile && (
                    <button
                        type="button"
                        onClick={handleLikeClick}
                        title={isLiked ? 'Liked' : 'Send Like'}
                        className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition-transform duration-200 hover:scale-115 active:scale-90 shadow-sm ${
                            isLiked
                                ? 'bg-pink-600 text-white shadow-pink-500/30'
                                : 'bg-white/85 dark:bg-gray-800/85 text-pink-600 dark:text-pink-400 hover:bg-white dark:hover:bg-gray-800'
                        }`}
                    >
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-white stroke-white' : 'fill-pink-500/20 stroke-pink-600'}`} />
                    </button>
                )}

                {/* Viewed time tag if in Visitors page */}
                {showViewedInfo && viewedAt && (
                    <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-purple-900/80 backdrop-blur-md rounded-full text-[9px] font-semibold text-purple-200 flex items-center gap-1">
                        <Eye className="w-2.5 h-2.5" />
                        {viewCount > 1 ? `${viewCount}x` : 'Viewed'}
                    </span>
                )}
            </div>

            {/* Content Details Area */}
            <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                    {/* Name, Age, and Verification */}
                    <div className="flex items-center justify-between gap-1.5">
                        <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate flex items-center gap-1.5">
                            <span>{firstName}</span>
                            {user.age && <span className="font-semibold text-gray-600 dark:text-gray-300">, {user.age}</span>}
                            {user.isApproved && (
                                <CheckCircle
                                    className="w-3.5 h-3.5 text-blue-500 fill-blue-500 text-white shrink-0"
                                    title="Verified Profile"
                                />
                            )}
                        </h3>
                    </div>

                    {/* Location */}
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-purple-500 shrink-0" />
                        <span>{location}</span>
                    </p>

                    {/* Sub-info: Occupation / Education / Bio */}
                    {(user.occupation || user.education || user.maritalStatus) && (
                        <p className="text-[11px] text-gray-600 dark:text-gray-400 truncate flex items-center gap-1 pt-0.5">
                            <Briefcase className="w-3 h-3 text-pink-500 shrink-0" />
                            <span>{user.occupation || user.education || user.maritalStatus}</span>
                        </p>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
                    <button
                        type="button"
                        onClick={handleViewClick}
                        className="w-full py-2 px-3 text-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-200 rounded-xl transition active:scale-95 flex items-center justify-center gap-1"
                    >
                        <span>{t('dashboard.viewProfile', { defaultValue: 'View' })}</span>
                    </button>

                    {!isOwnProfile && (
                        <button
                            type="button"
                            onClick={handleMessageClick}
                            className="w-full py-2 px-3 text-center bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-xs font-bold text-white rounded-xl shadow-xs hover:shadow-md hover:shadow-purple-500/20 transition active:scale-95 flex items-center justify-center gap-1.5"
                        >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>{t('dashboard.message', { defaultValue: 'Message' })}</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default React.memo(ProfileCard);

