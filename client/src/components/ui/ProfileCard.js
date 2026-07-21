import React from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Calendar, Crown, MessageCircle } from 'lucide-react';
import moment from 'moment';

const ProfileCard = ({ user, onLike, onView, onMessage, isOwnProfile = false }) => {
    const { t } = useTranslation();
    const compact = Boolean(onView);

    // Generate a description based on available profile information
    const generateDescription = () => {
        const details = [];
        if (user?.occupation) details.push(user.occupation);
        if (user?.education) details.push(t('profile.educationIn', { defaultValue: 'educated in {{value}}', value: user.education }));
        if (user?.maritalStatus) details.push(user.maritalStatus.toLowerCase());

        if (details.length > 0) {
            return details.join(' • ');
        }
        return t('profile.defaultDescription', { defaultValue: 'Looking to connect with like-minded individuals.' });
    };

    const description = generateDescription();
    const joinDate = user?.createdAt ? moment(user.createdAt).format('MMM YYYY') : t('profile.recently', { defaultValue: 'Recently' });

    return (
        <div
            onClick={onView || undefined}
            className={`
                group relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl
                border border-white/60 dark:border-slate-700/60 shadow-2xl overflow-hidden
                transition-all duration-500 ease-out transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/20 dark:hover:shadow-purple-500/30 hover:scale-[1.02]
                ${compact ? 'cursor-pointer' : ''}
                w-full max-w-sm mx-auto
            `}
        >
            {/* Profile header with image */}
            <div className="relative p-3 pb-0">
                <div className="relative h-72 sm:h-64 w-full rounded-3xl overflow-hidden bg-gradient-to-br from-purple-200 via-pink-100 to-violet-200 dark:from-purple-900/40 dark:via-pink-900/30 dark:to-violet-900/40">
                    {/* Story ring effect */}
                    <div className="absolute inset-2 rounded-2xl border-2 border-gradient-to-r from-purple-500 via-pink-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    
                    {user?.profileImageUrl ? (
                        <img
                            src={user.profileImageUrl}
                            alt={user?.name}
                            className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="w-32 h-32 rounded-full bg-white/90 dark:bg-slate-800/90 shadow-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-105 border-4 border-purple-200 dark:border-purple-500/30">
                                <span className="text-6xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-violet-600 bg-clip-text text-transparent">
                                    {user?.name?.charAt(0) || t('common.userInitial', { defaultValue: 'U' })}
                                </span>
                            </div>
                        </div>
                    )}
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
                    
                    {/* Premium Sparkles Effect */}
                    {user?.isPremium && (
                        <div className="absolute top-4 right-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 blur-lg opacity-60 animate-pulse" />
                                <div className="relative bg-gradient-to-r from-yellow-400 to-orange-500 p-2 rounded-full border-2 border-white/50 backdrop-blur-sm shadow-xl">
                                    <Crown className="w-5 h-5 text-white" />
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Top Badges */}
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                        {/* Join date */}
                        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-full text-slate-700 dark:text-white/90 text-[11px] font-semibold flex items-center gap-1.5 border border-white/60 dark:border-slate-600/60 shadow-lg">
                            <Calendar className="w-3 h-3 text-purple-600" />
                            <span>{joinDate}</span>
                        </div>
                    </div>

                    {/* Bottom Info inside Image */}
                    <div className="absolute bottom-5 left-5 right-5">
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-2xl sm:text-xl font-bold text-white tracking-tight drop-shadow-lg">
                                {user?.name || t('common.userName', { defaultValue: 'User Name' })}
                            </h3>
                            {user?.age && (
                                <span className="text-lg sm:text-base text-white/95 font-semibold drop-shadow-md bg-black/30 px-2 py-0.5 rounded-full backdrop-blur-sm">, {user.age}</span>
                            )}
                        </div>
                        {(user?.district || user?.location) && (
                            <div className="flex items-center text-white/90 text-sm font-medium">
                                <MapPin className="w-4 h-4 mr-1.5 text-pink-400" />
                                <span className="drop-shadow-sm">{user.district || user.location}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Card Footer Content */}
            <div className="px-6 pb-6 pt-5">
                {/* Description */}
                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed line-clamp-2 mb-5 font-medium">
                    {description}
                </p>

                {/* Action Buttons */}
                {onView && (
                    <div className="flex gap-3">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onView();
                            }}
                            className="flex-1 flex items-center justify-center px-4 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/50 hover:from-purple-700 hover:to-pink-700 transition-all active:scale-95"
                        >
                            <span>{t('dashboard.viewProfile')}</span>
                        </button>
                        {onMessage && !isOwnProfile && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onMessage();
                                }}
                                className="flex items-center justify-center px-4 py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-white rounded-2xl text-sm font-bold border-2 border-slate-200 dark:border-slate-700 shadow-sm hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all active:scale-95"
                                title={t('dashboard.sendMessage', { defaultValue: 'Send Message' })}
                            >
                                <MessageCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(ProfileCard);

