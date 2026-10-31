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
    const chosenAvatar = PROFILE_AVATARS.find((option) => option.id === user?.profileAvatar);
    const hasPhoto = Boolean(user?.profileImageUrl && !imageFailed);
    const imageUrl = !chosenAvatar && hasPhoto ? user.profileImageUrl : '';
    const defaultAvatarId = user?.gender === 'female' ? 'female-1' : 'male-1';
    const defaultAvatar = PROFILE_AVATARS.find((o) => o.id === defaultAvatarId) || PROFILE_AVATARS[0];
    const activeAvatar = chosenAvatar || (!imageUrl ? defaultAvatar : null);

    return (
        <div className={`relative flex items-center justify-center overflow-hidden ${className}`}>
            {imageUrl ? (
                <img
                    src={imageUrl}
                    alt={user?.name || 'Profile'}
                    onError={() => setImageFailed(true)}
                    className={imageClassName}
                />
            ) : (
                <span className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${activeAvatar?.color || 'from-sky-300 to-cyan-500'} ${avatarClassName}`} aria-label={`${activeAvatar?.label || 'Avatar'} avatar`}>
                    {activeAvatar?.emoji || '👤'}
                </span>
            )}
        </div>
    );
};

export default ProfileAvatar;
