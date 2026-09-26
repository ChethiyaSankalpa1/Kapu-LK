import React, { useState } from 'react';

export const PROFILE_AVATARS = [
    { id: 'male-1', label: 'Male', emoji: '👨🏻', color: 'from-sky-300 to-cyan-500' },
    { id: 'male-2', label: 'Male', emoji: '👨🏽‍🦱', color: 'from-emerald-300 to-teal-500' },
    { id: 'male-3', label: 'Male', emoji: '👨🏿‍🦰', color: 'from-amber-300 to-orange-500' },
    { id: 'female-1', label: 'Female', emoji: '👩🏻', color: 'from-rose-300 to-pink-500' },
    { id: 'female-2', label: 'Female', emoji: '👩🏽‍🦱', color: 'from-violet-300 to-fuchsia-500' },
    { id: 'female-3', label: 'Female', emoji: '👩🏿‍🦰', color: 'from-yellow-300 to-amber-500' },
    { id: 'neutral-1', label: 'Neutral', emoji: '🧑🏻', color: 'from-indigo-300 to-blue-500' },
    { id: 'neutral-2', label: 'Neutral', emoji: '🧑🏽‍🦱', color: 'from-lime-300 to-green-500' },
    { id: 'neutral-3', label: 'Neutral', emoji: '🧑🏿‍🦰', color: 'from-orange-300 to-red-500' },
];

const ProfileAvatar = ({
    user,
    className = '',
    imageClassName = 'h-full w-full object-cover',
    avatarClassName = 'text-4xl',
    fallbackClassName = 'text-xl font-bold text-white',
}) => {
    const [imageFailed, setImageFailed] = useState(false);
    const avatar = PROFILE_AVATARS.find((option) => option.id === user?.profileAvatar);
    const imageUrl = !avatar && !imageFailed ? user?.profileImageUrl : '';
    const initial = user?.name?.charAt(0)?.toUpperCase() || 'U';

    return (
        <div className={`relative flex items-center justify-center overflow-hidden ${className}`}>
            {imageUrl ? (
                <img
                    src={imageUrl}
                    alt={user?.name || 'Profile'}
                    onError={() => setImageFailed(true)}
                    className={imageClassName}
                />
            ) : avatar ? (
                <span className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${avatar.color} ${avatarClassName}`} aria-label={`${avatar.label} avatar`}>
                    {avatar.emoji}
                </span>
            ) : (
                <span className={`flex h-full w-full items-center justify-center ${fallbackClassName}`}>
                    {initial}
                </span>
            )}
        </div>
    );
};

export default ProfileAvatar;