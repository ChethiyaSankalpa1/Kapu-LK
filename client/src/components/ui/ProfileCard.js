import React from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, MapPin, Calendar, Crown, ChevronRight } from 'lucide-react';
import moment from 'moment';

const ProfileCard = ({ user, onLike, onView, isOwnProfile = false }) => {
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
                group relative bg-white dark:bg-slate-900/80 rounded-[1.35rem]
                border border-[#dfe3e8] dark:border-white/10 shadow-[0_10px_28px_rgba(15,23,42,0.08)] overflow-hidden
                transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(15,23,42,0.12)]
                ${compact ? 'cursor-pointer' : ''}
                w-full max-w-sm mx-auto
            `}
        >
            {/* Profile header with image */}
            <div className="relative p-3 pb-0">
                <div className="relative h-52 sm:h-56 w-full rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800">
                    {user?.profileImageUrl ? (
                        <img
                            src={user.profileImageUrl}
                            alt={user?.name}
                            className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="w-24 h-24 rounded-full bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
                                <span className="text-4xl font-extrabold text-[#1877F2] dark:text-blue-400">
                                    {user?.name?.charAt(0) || t('common.userInitial', { defaultValue: 'U' })}
                                </span>
                            </div>
                        </div>
                    )}
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent pointer-events-none opacity-80" />
                    
                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                        {/* Join date */}
                        <div className="bg-white/92 dark:bg-slate-900/85 backdrop-blur-md px-2.5 py-1.5 rounded-xl text-[#4b4f56] dark:text-white/90 text-[11px] font-medium flex items-center gap-1.5 border border-white/50 dark:border-white/10 shadow-sm">
                            <Calendar className="w-3 h-3" />
                            <span>{joinDate}</span>
                        </div>
                        
                        {/* Like button */}
                        {!isOwnProfile && !onView && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onLike) onLike(e);
                                }}
                                className="p-2.5 bg-white/92 hover:bg-[#1877F2] dark:bg-slate-900/85 dark:hover:bg-[#1877F2] backdrop-blur-md rounded-xl text-[#1877F2] hover:text-white dark:text-white transition-all duration-300 border border-white/50 dark:border-white/10 shadow-sm hover:scale-105 active:scale-95"
                            >
                                <Heart className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {/* Bottom Info inside Image */}
                    <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-bold text-white tracking-tight drop-shadow-md">
                                {user?.name || t('common.userName', { defaultValue: 'User Name' })}
                            </h3>
                            {user?.age && (
                                <span className="text-lg text-white/90 font-medium drop-shadow-md">, {user.age}</span>
                            )}
                            {user?.isPremium && (
                                <div className="ml-1 bg-yellow-500/20 text-yellow-300 p-1 rounded-full border border-yellow-500/30 backdrop-blur-sm">
                                    <Crown className="w-3.5 h-3.5" />
                                </div>
                            )}
                        </div>
                        {(user?.district || user?.location) && (
                            <div className="flex items-center text-white/80 text-sm font-medium">
                                <MapPin className="w-3.5 h-3.5 mr-1 text-pink-400" />
                                <span className="drop-shadow-sm">{user.district || user.location}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Card Footer Content */}
            <div className="px-5 pb-5 pt-4">
                {/* Description */}
                <p className="text-[#4b4f56] dark:text-gray-300 text-sm leading-relaxed line-clamp-2 mb-4 font-medium">
                    {description}
                </p>

                {/* View Profile Button */}
                {onView && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onView();
                        }}
                        className="w-full flex items-center justify-between px-5 py-3.5 bg-[#f0f2f5] dark:bg-slate-800/80 rounded-xl text-sm font-bold text-[#1c1e21] dark:text-white border border-[#e4e6eb] dark:border-gray-700 hover:bg-[#e7f3ff] dark:hover:bg-blue-900/30 hover:border-[#cfe1ff] dark:hover:border-blue-800 transition-all group-hover:shadow-md"
                    >
                        <span>{t('dashboard.viewProfile')}</span>
                        <div className="w-7 h-7 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm group-hover:bg-[#1877F2] group-hover:text-white transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </div>
                    </button>
                )}
            </div>
        </div>
    );
};

export default React.memo(ProfileCard);

