import React from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, MapPin, Calendar, Crown } from 'lucide-react';
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
        bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700
        overflow-hidden transition-all duration-200
        hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600
        ${compact ? 'cursor-pointer' : ''}
        w-full max-w-xs mx-auto
      `}
        >
            {/* Profile header with image */}
            <div className="relative">
                <div className="h-52 bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 dark:from-pink-900/30 dark:via-purple-900/30 dark:to-indigo-900/30 overflow-hidden">
                    {user?.profileImageUrl ? (
                        <img
                            src={user.profileImageUrl}
                            alt={user?.name}
                            className="w-full h-full object-cover object-center"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="w-24 h-24 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-md flex items-center justify-center">
                                <span className="text-4xl font-semibold text-pink-500">
                                    {user?.name?.charAt(0) || t('common.userInitial', { defaultValue: 'U' })}
                                </span>
                            </div>
                        </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/45 to-transparent pointer-events-none" />
                </div>

                <div className="absolute left-4 bottom-4 right-20">
                    <div className="inline-flex max-w-full items-center gap-2 rounded-full bg-white/90 dark:bg-gray-900/80 px-3 py-1.5 shadow-sm backdrop-blur-sm">
                        <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                            {user?.name || t('common.userName', { defaultValue: 'User Name' })}
                        </h3>
                        {user?.isPremium && (
                            <Crown className="w-4 h-4 shrink-0 text-yellow-500" />
                        )}
                        {user?.age && (
                            <span className="shrink-0 text-sm text-gray-500 dark:text-gray-300">• {user.age}</span>
                        )}
                    </div>
                </div>

                {/* Like button */}
                {!isOwnProfile && !onView && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onLike) onLike(e);
                        }}
                        className="absolute top-2 right-2 p-2 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-md text-pink-500 hover:bg-pink-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <Heart className="w-5 h-5" />
                    </button>
                )}

                {/* Join date */}
                <div className="absolute top-3 right-3 bg-white/90 dark:bg-gray-800/90 px-2 py-1 rounded-full text-xs text-gray-500 dark:text-gray-400 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {joinDate}
                    </div>
                </div>
            </div>

            {/* Card content */}
            <div className="px-5 py-5 text-center">
                {/* Location */}
                {(user?.district || user?.location) && (
                    <div className="flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm mb-3">
                        <MapPin className="w-3.5 h-3.5 mr-1" />
                        <span>{user.district || user.location}</span>
                    </div>
                )}

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-3 mb-1">
                    {description}
                </p>

                {/* View Profile Button */}
                {onView && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onView();
                        }}
                        className="mt-3 px-4 py-1.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-medium rounded-full hover:opacity-90 transition-opacity"
                    >
                        {t('dashboard.viewProfile')}
                    </button>
                )}
            </div>
        </div>
    );
};

export default ProfileCard;
