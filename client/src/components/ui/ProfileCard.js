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
                group relative bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl rounded-[1.5rem] 
                border border-white/40 dark:border-gray-700/50 shadow-xl overflow-hidden 
                transition-all duration-300 transform hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-purple-500/20
                ${compact ? 'cursor-pointer' : ''}
                w-full max-w-sm mx-auto
            `}
        >
            {/* Profile header with image */}
            <div className="relative p-2">
                <div className="relative h-56 sm:h-64 w-full rounded-2xl overflow-hidden bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 dark:from-pink-900/40 dark:via-purple-900/40 dark:to-indigo-900/40">
                    {user?.profileImageUrl ? (
                        <img
                            src={user.profileImageUrl}
                            alt={user?.name}
                            className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="w-24 h-24 rounded-[2rem] bg-white/90 dark:bg-gray-800/90 shadow-xl flex items-center justify-center rotate-3 transition-transform duration-500 group-hover:rotate-0 group-hover:scale-110">
                                <span className="text-4xl font-extrabold bg-gradient-to-br from-pink-500 to-purple-600 bg-clip-text text-transparent">
                                    {user?.name?.charAt(0) || t('common.userInitial', { defaultValue: 'U' })}
                                </span>
                            </div>
                        </div>
                    )}
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none opacity-80" />
                    
                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                        {/* Join date */}
                        <div className="bg-black/30 backdrop-blur-md px-2.5 py-1.5 rounded-xl text-white/90 text-[11px] font-medium flex items-center gap-1.5 border border-white/10">
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
                                className="p-2.5 bg-white/20 hover:bg-pink-500 backdrop-blur-md rounded-xl text-white transition-all duration-300 border border-white/20 shadow-lg hover:shadow-pink-500/50 hover:scale-110 active:scale-95"
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
            <div className="px-5 pb-5 pt-2">
                {/* Description */}
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-2 mb-4 font-medium">
                    {description}
                </p>

                {/* View Profile Button */}
                {onView && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onView();
                        }}
                        className="w-full flex items-center justify-between px-5 py-3.5 bg-gray-50 dark:bg-gray-800/80 rounded-xl text-sm font-bold text-gray-900 dark:text-white border border-gray-100 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:border-purple-200 dark:hover:border-purple-800 transition-all group-hover:shadow-md"
                    >
                        <span>{t('dashboard.viewProfile')}</span>
                        <div className="w-7 h-7 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm group-hover:bg-purple-500 group-hover:text-white transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </div>
                    </button>
                )}
            </div>
        </div>
    );
};

export default React.memo(ProfileCard);

