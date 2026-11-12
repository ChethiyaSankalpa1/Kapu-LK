import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import {
    Camera, X, Sparkles, CheckCircle2,
    ShieldCheck, Loader2
} from 'lucide-react';
import { userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ProfileImageEditor from './ProfileImageEditor';

// Known placeholder and avatar URL patterns
const PLACEHOLDER_PATTERNS = [
    'placeholder',
    'default-avatar',
    'default_avatar',
    'default-profile',
    'default_profile',
    'dicebear',
    'ui-avatars',
    'pravatar',
    'multiavatar',
    'robohash',
    'couple-hero',
    '/images/default',
    'assets/default',
    'avatar/'
];

/**
 * Checks whether a user is eligible for the real photo reminder.
 * Returns true if the user is using an avatar, emoji, cartoon, default image,
 * or has no photo at all. Returns false if they already have a genuine personal photo.
 */
export const isEligibleForPhotoReminder = (user) => {
    if (!user || !user._id) return false;

    // 1. If user explicitly has an emoji avatar chosen (e.g. 'male-1', 'female-2', etc.)
    if (user.profileAvatar && typeof user.profileAvatar === 'string' && user.profileAvatar.trim() !== '') {
        return true;
    }

    // 2. If user has no profileImageUrl
    if (!user.profileImageUrl || typeof user.profileImageUrl !== 'string' || user.profileImageUrl.trim() === '') {
        return true;
    }

    // 3. If profileImageUrl points to an avatar generator or placeholder
    const lower = user.profileImageUrl.toLowerCase();
    if (PLACEHOLDER_PATTERNS.some((pat) => lower.includes(pat))) {
        return true;
    }

    // 4. If user.photos array exists, check if any real photo is uploaded
    if (Array.isArray(user.photos) && user.photos.length > 0) {
        const hasRealGalleryPhoto = user.photos.some((p) => {
            if (!p || !p.url) return false;
            const pLower = p.url.toLowerCase();
            return !PLACEHOLDER_PATTERNS.some((pat) => pLower.includes(pat));
        });
        if (hasRealGalleryPhoto && !user.profileAvatar) {
            return false;
        }
    }

    // User has a custom photo uploaded and no emoji avatar
    return false;
};

const COOLDOWN_HOURS = 24;
const COOLDOWN_MS = COOLDOWN_HOURS * 60 * 60 * 1000;

export const isReminderDismissed = (userId) => {
    if (!userId) return false;
    try {
        // 1. Suppressed during this browser session
        if (sessionStorage.getItem(`lovelk_photo_reminder_session_${userId}`) === 'true') {
            return true;
        }
        // 2. Suppressed within 24-hour cooldown
        const dismissedAt = localStorage.getItem(`lovelk_photo_reminder_dismissed_${userId}`);
        if (!dismissedAt) return false;
        const diff = Date.now() - parseInt(dismissedAt, 10);
        return diff < COOLDOWN_MS;
    } catch {
        return false;
    }
};

export const dismissReminder = (userId) => {
    if (!userId) return;
    try {
        sessionStorage.setItem(`lovelk_photo_reminder_session_${userId}`, 'true');
        localStorage.setItem(`lovelk_photo_reminder_dismissed_${userId}`, String(Date.now()));
    } catch {
        // Ignore storage errors
    }
};

export const clearReminderCooldown = (userId) => {
    if (!userId) return;
    try {
        sessionStorage.removeItem(`lovelk_photo_reminder_session_${userId}`);
        localStorage.removeItem(`lovelk_photo_reminder_dismissed_${userId}`);
    } catch {
        // Ignore
    }
};

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Modal Popup Reminder for User Dashboard
 */
export const ProfilePhotoReminderModal = ({ user, onPhotoUploaded }) => {
    const { updateUser } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [editorOpen, setEditorOpen] = useState(false);
    const [selectedImageSrc, setSelectedImageSrc] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!user || !user._id) return;
        // Check eligibility and cooldown
        if (isEligibleForPhotoReminder(user) && !isReminderDismissed(user._id)) {
            // Small pleasant delay so the dashboard loads smoothly first
            const timer = setTimeout(() => {
                setIsOpen(true);
            }, 800);
            return () => clearTimeout(timer);
        } else {
            setIsOpen(false);
        }
    }, [user]);

    const handleDismiss = () => {
        if (user?._id) {
            dismissReminder(user._id);
        }
        setIsOpen(false);
    };

    const handleChoosePhotoClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!ALLOWED_TYPES.includes(file.type)) {
            toast.error('කරුණාකර JPEG, PNG, හෝ WebP වර්ගයේ ඡායාරූපයක් තෝරන්න.');
            e.target.value = '';
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            toast.error('ඡායාරූපයේ ප්‍රමාණය 5MB ට වඩා අඩු විය යුතුය.');
            e.target.value = '';
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        setSelectedImageSrc(objectUrl);
        setEditorOpen(true);
        e.target.value = '';
    };

    const handleSaveCroppedPhoto = async ({ file }) => {
        setUploading(true);
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('isMain', 'true');

        try {
            const res = await userAPI.uploadPhoto(formData);
            const newUrl = res.data?.profileImageUrl || res.data?.photos?.[0]?.url || '';
            const newPhotos = res.data?.photos || [];

            // Update AuthContext & localStorage with cleared avatar and new photo
            const updatedUserData = {
                ...user,
                profileImageUrl: newUrl,
                photos: newPhotos,
                profileAvatar: '',
            };

            if (updateUser) {
                updateUser(updatedUserData);
            }

            if (onPhotoUploaded) {
                onPhotoUploaded(updatedUserData);
            }

            // Reset reminder state permanently for this user
            clearReminderCooldown(user?._id);

            toast.success('ඡායාරූපය සාර්ථකව උඩුගත කරන ලදී! ❤️');

            setEditorOpen(false);
            setSelectedImageSrc(null);
            setIsOpen(false);
        } catch (error) {
            console.error('Failed to upload photo from reminder:', error);
            const msg = error.response?.data?.message || 'ඡායාරූපය උඩුගත කිරීම අසාර්ථක විය. කරුණාකර නැවත උත්සාහ කරන්න.';
            toast.error(msg);
        } finally {
            setUploading(false);
        }
    };

    if (!isOpen) return null;

    const modalMarkup = (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileSelect}
            />

            {/* Photo Crop/Editor Modal */}
            {editorOpen && selectedImageSrc && (
                <ProfileImageEditor
                    imageSrc={selectedImageSrc}
                    open={editorOpen}
                    saving={uploading}
                    onClose={() => {
                        if (!uploading) {
                            setEditorOpen(false);
                            setSelectedImageSrc(null);
                        }
                    }}
                    onSave={handleSaveCroppedPhoto}
                />
            )}

            {/* Main Reminder Card */}
            <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-pink-100 dark:border-pink-900/40 overflow-hidden transform transition-all duration-300">
                {/* Purple & Pink Romantic Gradient Header */}
                <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 p-6 sm:p-7 text-white overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-24 h-24 rounded-full bg-pink-400/20 blur-lg pointer-events-none" />

                    {/* Close button */}
                    <button
                        type="button"
                        onClick={handleDismiss}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/15 hover:bg-white/25 text-white/90 transition"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-3.5">
                        <div className="relative w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-md shrink-0">
                            <Camera className="w-7 h-7 text-white" />
                            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-rose-500 border-2 border-white flex items-center justify-center text-[10px]">
                                ❤️
                            </span>
                        </div>
                        <div>
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold tracking-wide mb-1">
                                LoveLK Profile Boost
                            </span>
                            <h2 className="text-lg sm:text-xl font-black text-white leading-snug">
                                📸 ඔබේ සැබෑ ඡායාරූපයක් එක් කරන්න!
                            </h2>
                        </div>
                    </div>
                </div>

                {/* Professional Sinhala Message Body */}
                <div className="p-6 sm:p-7 space-y-4 text-gray-700 dark:text-gray-200">
                    <div className="space-y-3 leading-relaxed text-sm sm:text-base">
                        <p className="font-extrabold text-base sm:text-lg text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                            ආයුබෝවන්! ❤️
                        </p>

                        <p className="text-gray-600 dark:text-gray-300">
                            ඔබේ LoveLK පැතිකඩට තවමත් සැබෑ පුද්ගලික ඡායාරූපයක් එක් කර නොමැති බව අපට පෙනේ.
                        </p>

                        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/30 border border-purple-100 dark:border-purple-900/50 flex items-start gap-3">
                            <Sparkles className="w-5 h-5 text-pink-600 shrink-0 mt-0.5" />
                            <p className="text-xs sm:text-sm text-purple-950 dark:text-purple-200 font-medium leading-relaxed">
                                🥰 ඔබේ සැබෑ ඡායාරූපයක් එක් කිරීමෙන් අනෙකුත් සාමාජිකයින්ට ඔබව වඩාත් හොඳින් හඳුනාගැනීමටත්, විශ්වාසදායක සම්බන්ධතා ගොඩනගා ගැනීමටත් හැකි වේ.
                            </p>
                        </div>

                        <p className="text-sm sm:text-base font-semibold text-rose-600 dark:text-rose-400">
                            💕 ඔබේ පැතිකඩ වඩාත් ආකර්ෂණීය කරගන්න. අදම ඔබේ සැබෑ ඡායාරූපයක් එක් කරන්න!
                        </p>
                    </div>

                    {/* Trust Badges */}
                    <div className="pt-2 border-t border-gray-150 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            100% ආරක්ෂිතයි
                        </span>
                        <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />
                            5x වැඩි ප්‍රතිචාර
                        </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 flex flex-col sm:flex-row gap-3">
                        <button
                            type="button"
                            onClick={handleChoosePhotoClick}
                            disabled={uploading}
                            className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 hover:from-purple-700 hover:to-rose-600 text-white font-bold text-sm sm:text-base shadow-lg shadow-pink-500/25 active:scale-98 transition flex items-center justify-center gap-2"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>උඩුගත වෙමින් පවතී...</span>
                                </>
                            ) : (
                                <>
                                    <span>📸 සැබෑ ඡායාරූපයක් එක් කරන්න</span>
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={handleDismiss}
                            disabled={uploading}
                            className="py-3 px-5 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm transition text-center"
                        >
                            පසුව මතක් කරන්න
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalMarkup, document.body);
};

/**
 * Inline Banner Reminder for Profile Page and User Dashboard
 */
export const ProfilePhotoReminderBanner = ({ user, onPhotoUploaded, className = '' }) => {
    const { updateUser } = useAuth();
    const [editorOpen, setEditorOpen] = useState(false);
    const [selectedImageSrc, setSelectedImageSrc] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const fileInputRef = useRef(null);

    const eligible = isEligibleForPhotoReminder(user);

    if (!eligible || dismissed) return null;

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!ALLOWED_TYPES.includes(file.type)) {
            toast.error('කරුණාකර JPEG, PNG, හෝ WebP වර්ගයේ ඡායාරූපයක් තෝරන්න.');
            e.target.value = '';
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            toast.error('ඡායාරූපයේ ප්‍රමාණය 5MB ට වඩා අඩු විය යුතුය.');
            e.target.value = '';
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        setSelectedImageSrc(objectUrl);
        setEditorOpen(true);
        e.target.value = '';
    };

    const handleSaveCroppedPhoto = async ({ file }) => {
        setUploading(true);
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('isMain', 'true');

        try {
            const res = await userAPI.uploadPhoto(formData);
            const newUrl = res.data?.profileImageUrl || res.data?.photos?.[0]?.url || '';
            const newPhotos = res.data?.photos || [];

            const updatedUserData = {
                ...user,
                profileImageUrl: newUrl,
                photos: newPhotos,
                profileAvatar: '',
            };

            if (updateUser) {
                updateUser(updatedUserData);
            }

            if (onPhotoUploaded) {
                onPhotoUploaded(updatedUserData);
            }

            clearReminderCooldown(user?._id);

            toast.success('ඡායාරූපය සාර්ථකව උඩුගත කරන ලදී! ❤️');

            setEditorOpen(false);
            setSelectedImageSrc(null);
            setDismissed(true);
        } catch (error) {
            console.error('Failed to upload photo from banner:', error);
            const msg = error.response?.data?.message || 'ඡායාරූපය උඩුගත කිරීම අසාර්ථක විය. කරුණාකර නැවත උත්සාහ කරන්න.';
            toast.error(msg);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className={`relative overflow-hidden bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 dark:from-purple-950/40 dark:via-pink-950/30 dark:to-rose-950/40 border-2 border-pink-200 dark:border-pink-900/60 rounded-3xl p-4 sm:p-5 shadow-sm transition ${className}`}>
            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileSelect}
            />

            {/* Photo Crop/Editor Modal */}
            {editorOpen && selectedImageSrc && (
                <ProfileImageEditor
                    imageSrc={selectedImageSrc}
                    open={editorOpen}
                    saving={uploading}
                    onClose={() => {
                        if (!uploading) {
                            setEditorOpen(false);
                            setSelectedImageSrc(null);
                        }
                    }}
                    onSave={handleSaveCroppedPhoto}
                />
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-md shrink-0">
                        <Camera className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white">
                                📸 ඔබේ සැබෑ ඡායාරූපයක් එක් කරන්න!
                            </h3>
                            <span className="px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 text-[10px] font-bold">
                                LoveLK
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed">
                            🥰 සැබෑ පුද්ගලික ඡායාරූපයක් එක් කිරීමෙන් ඔබට 5 ගුණයකින් වැඩි ගැලපීම් (matches) සහ විශ්වාසය ලබා ගත හැක.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                    <button
                        type="button"
                        onClick={() => {
                            if (fileInputRef.current) fileInputRef.current.click();
                        }}
                        disabled={uploading}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-pink-500/20 active:scale-98 transition flex items-center justify-center gap-2"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>උඩුගත වෙමින්...</span>
                            </>
                        ) : (
                            <>
                                <Camera className="w-4 h-4" />
                                <span>📸 සැබෑ ඡායාරූපයක් එක් කරන්න</span>
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            dismissReminder(user?._id);
                            setDismissed(true);
                        }}
                        className="px-3 py-2.5 rounded-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xs font-semibold hover:bg-white/50 dark:hover:bg-gray-800/50 transition"
                    >
                        පසුව මතක් කරන්න
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfilePhotoReminderModal;
