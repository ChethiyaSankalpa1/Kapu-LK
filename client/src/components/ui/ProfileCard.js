import React from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Calendar, Crown, Sparkles, MessageCircle } from 'lucide-react';
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
                group relative bg-white dark:bg-slate-900/90 rounded-[1.5rem] sm:rounded-[1.35rem]
                border border-gray-100 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden
                transition-all duration-500 ease-out transform hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)]
                ${compact ? 'cursor-pointer' : ''}
                w-full max-w-sm mx-auto
            `}
        >
            {/* Profile header with image */}
            <div className="relative p-3 pb-0">
                <div className="relative h-64 sm:h-56 w-full rounded-2xl overflow-hidden bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 dark:from-purple-900/30 dark:via-pink-900/20 dark:to-blue-900/30">
                    {user?.profileImageUrl ? (
                        <img
                            src={user.profileImageUrl}
                            alt={user?.name}
                            className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="w-28 h-28 rounded-full bg-white/80 dark:bg-slate-800/80 shadow-xl flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
                                <span className="text-5xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                    {user?.name?.charAt(0) || t('common.userInitial', { defaultValue: 'U' })}
                                </span>
                            </div>
                        </div>
                    )}
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
                    
                    {/* Premium Sparkles Effect */}
                    {user?.isPremium && (
                        <div className="absolute top-3 right-3">
                            <div className="relative">
                                <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
                                <div className="absolute inset-0 bg-yellow-400/30 blur-xl rounded-full"></div>
                            </div>
                        </div>
                    )}
                    
                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                        {/* Join date */}
                        <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full text-gray-700 dark:text-white/90 text-[11px] font-semibold flex items-center gap-1.5 border border-white/60 dark:border-white/15 shadow-lg">
                            <Calendar className="w-3 h-3" />
                            <span>{joinDate}</span>
                        </div>
                    </div>

                    {/* Bottom Info inside Image */}
                    <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-2xl sm:text-xl font-bold text-white tracking-tight drop-shadow-lg">
                                {user?.name || t('common.userName', { defaultValue: 'User Name' })}
                            </h3>
                            {user?.age && (
                                <span className="text-lg sm:text-base text-white/95 font-semibold drop-shadow-md">, {user.age}</span>
                            )}
                            {user?.isPremium && (
                                <div className="ml-1 bg-gradient-to-r from-yellow-400 to-orange-500 p-1.5 rounded-full border-2 border-white/30 backdrop-blur-sm shadow-lg">
                                    <Crown className="w-4 h-4 text-white" />
                                </div>
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
            <div className="px-5 pb-5 pt-4">
                {/* Description */}
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed line-clamp-2 mb-4 font-medium">
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
                            className="flex-1 flex items-center justify-center px-4 py-3.5 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl text-sm font-bold text-gray-800 dark:text-white border border-purple-100 dark:border-purple-800/30 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 transition-all group-hover:shadow-lg"
                        >
                            <span>{t('dashboard.viewProfile')}</span>
                        </button>
                        {onMessage && !isOwnProfile && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onMessage();
                                }}
                                className="flex items-center justify-center px-4 py-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl text-sm font-bold text-gray-800 dark:text-white border border-blue-100 dark:border-blue-800/30 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-all group-hover:shadow-lg"
                                title={t('dashboard.sendMessage', { defaultValue: 'Send Message' })}
                            >
                                <MessageCircle className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(ProfileCard);

