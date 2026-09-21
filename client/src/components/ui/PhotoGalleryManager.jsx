import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { userAPI } from '../../services/api';
import { toast } from 'react-toastify';
import {
    Camera, Plus, Trash2, Star, ArrowLeft,
    ArrowRight, Loader2, Lock, Sparkles, AlertCircle,
    Edit3, RefreshCw
} from 'lucide-react';
import ProfileImageEditor from './ProfileImageEditor';

const MAX_PREMIUM_PHOTOS = 4;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const PhotoGalleryManager = ({ user, onPhotosUpdated }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    // Determine active premium status
    const isPremium = Boolean(
        user?.isPremium &&
        (!user?.premiumExpiresAt || new Date(user.premiumExpiresAt) > new Date())
    );

    const isExpired = Boolean(
        !isPremium &&
        (user?.premiumStatus === 'expired' || (Array.isArray(user?.photos) && user.photos.length > 1))
    );

    const maxPhotos = isPremium ? MAX_PREMIUM_PHOTOS : 1;

    const [photos, setPhotos] = useState(() => {
        if (Array.isArray(user?.photos) && user.photos.length > 0) {
            return user.photos;
        }
        if (user?.profileImageUrl) {
            return [{
                _id: 'main-0',
                url: user.profileImageUrl,
                isMain: true,
                order: 0,
            }];
        }
        return [];
    });

    const [uploading, setUploading] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [editorOpen, setEditorOpen] = useState(false);
    const [selectedImageSrc, setSelectedImageSrc] = useState(null);
    const [replacePhotoId, setReplacePhotoId] = useState(null);
    const [deleteModalPhoto, setDeleteModalPhoto] = useState(null);

    const fileInputRef = useRef(null);

    // Synchronize photos state when user prop changes
    React.useEffect(() => {
        if (Array.isArray(user?.photos) && user.photos.length > 0) {
            setPhotos(user.photos);
        } else if (user?.profileImageUrl) {
            setPhotos([{
                _id: 'main-0',
                url: user.profileImageUrl,
                isMain: true,
                order: 0,
            }]);
        } else {
            setPhotos([]);
        }
    }, [user?.photos, user?.profileImageUrl]);

    const handleFileSelect = (e, targetPhotoId = null) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!ALLOWED_TYPES.includes(file.type)) {
            toast.error(t('toast.profile.invalidFileType', { defaultValue: 'Please upload a JPEG, PNG, or WebP image.' }));
            e.target.value = '';
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            toast.error(t('toast.profile.fileTooLarge', { defaultValue: 'Photo must be under 5MB.' }));
            e.target.value = '';
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        setSelectedImageSrc(objectUrl);
        setReplacePhotoId(targetPhotoId);
        setEditorOpen(true);
        e.target.value = '';
    };

    const handleEditExisting = (photo) => {
        setSelectedImageSrc(photo.url);
        setReplacePhotoId(photo._id || photo.publicId);
        setEditorOpen(true);
    };

    const handleSaveEditedPhoto = async ({ file }) => {
        setUploading(true);
        const formData = new FormData();
        formData.append('photo', file);

        if (replacePhotoId && replacePhotoId !== 'main-0') {
            formData.append('replacePhotoId', replacePhotoId);
        }

        try {
            const res = await userAPI.uploadPhoto(formData);
            if (res.data?.photos) {
                setPhotos(res.data.photos);
                if (onPhotosUpdated) {
                    onPhotosUpdated(res.data.photos, res.data.profileImageUrl || '');
                }
            }
            toast.success(
                replacePhotoId
                    ? t('photos.replaceSuccess', { defaultValue: 'Photo updated successfully!' })
                    : t('photos.uploadSuccess', { defaultValue: 'Photo uploaded successfully!' })
            );
            setEditorOpen(false);
            setSelectedImageSrc(null);
            setReplacePhotoId(null);
        } catch (error) {
            console.error('Failed to upload/update photo:', error);
            const msg = error.response?.data?.message || t('photos.uploadFailed', { defaultValue: 'Failed to upload photo.' });
            toast.error(msg);
            if (error.response?.data?.requiresPremium) {
                navigate('/premium');
            }
        } finally {
            setUploading(false);
        }
    };

    const handleSetMain = async (photoId) => {
        setActionLoadingId(photoId);
        try {
            const res = await userAPI.setMainPhoto(photoId);
            if (res.data?.photos) {
                setPhotos(res.data.photos);
                if (onPhotosUpdated) {
                    onPhotosUpdated(res.data.photos, res.data.profileImageUrl);
                }
            }
            toast.success(t('photos.mainUpdated', { defaultValue: 'Primary profile photo updated!' }));
        } catch (error) {
            toast.error(error.response?.data?.message || t('photos.mainFailed', { defaultValue: 'Failed to update main photo.' }));
        } finally {
            setActionLoadingId(null);
        }
    };

    const confirmDeletePhoto = async () => {
        if (!deleteModalPhoto) return;
        const photoId = deleteModalPhoto._id || deleteModalPhoto.publicId;

        setActionLoadingId(photoId);
        setDeleteModalPhoto(null);

        try {
            const res = await userAPI.deletePhoto(photoId);
            const newPhotos = res.data?.photos || [];
            const newProfileImageUrl = res.data?.profileImageUrl || '';

            setPhotos(newPhotos);
            if (onPhotosUpdated) {
                onPhotosUpdated(newPhotos, newProfileImageUrl);
            }
            toast.success(t('photos.deleted', { defaultValue: 'Photo deleted successfully.' }));
        } catch (error) {
            console.error('Delete photo error:', error);
            toast.error(error.response?.data?.message || t('photos.deleteFailed', { defaultValue: 'Failed to delete photo.' }));
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleMoveOrder = async (index, direction) => {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= photos.length) return;

        const updated = [...photos];
        const temp = updated[index];
        updated[index] = updated[targetIndex];
        updated[targetIndex] = temp;

        setPhotos(updated);

        const photoIds = updated.map(p => p._id || p.publicId);
        try {
            const res = await userAPI.reorderPhotos(photoIds);
            if (res.data?.photos) {
                setPhotos(res.data.photos);
                if (onPhotosUpdated) {
                    onPhotosUpdated(res.data.photos, res.data.profileImageUrl);
                }
            }
        } catch (err) {
            toast.error('Failed to update photo order');
        }
    };

    // Calculate slots to display
    const visiblePhotos = photos.slice(0, isPremium ? MAX_PREMIUM_PHOTOS : Math.max(photos.length, 1));
    const emptyUploadSlotsCount = isPremium ? Math.max(0, MAX_PREMIUM_PHOTOS - photos.length) : (photos.length === 0 ? 1 : 0);
    const lockedSlotsCount = !isPremium ? (MAX_PREMIUM_PHOTOS - Math.max(photos.length, 1)) : 0;

    return (
        <div className="space-y-4">
            {/* Header info with counter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                        <span>Profile Photos</span>
                        {isPremium && (
                            <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-pink-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-[10px] font-bold flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-500" />
                                Premium 4-Photos
                            </span>
                        )}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {isPremium
                            ? 'Upload up to 4 photos. Set your favorite portrait as your main photo.'
                            : 'Free accounts can upload 1 profile photo. Upgrade to Premium for 4 photos.'}
                    </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
                        {photos.length} / {isPremium ? MAX_PREMIUM_PHOTOS : 1} {photos.length === 1 ? 'Photo' : 'Photos'}
                    </span>
                </div>
            </div>

            {/* Expired Premium Notice */}
            {isExpired && (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex-1 text-xs">
                        <p className="font-bold text-amber-900 dark:text-amber-200">
                            Premium Membership Expired
                        </p>
                        <p className="text-amber-700 dark:text-amber-300 mt-0.5">
                            Your additional profile photos are safely preserved. Renew Premium to re-activate full 4-photo gallery management.
                        </p>
                        <button
                            type="button"
                            onClick={() => navigate('/premium')}
                            className="mt-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-pink-600 text-white font-bold text-xs hover:opacity-90 transition shadow-xs cursor-pointer"
                        >
                            Renew Premium
                        </button>
                    </div>
                </div>
            )}

            {/* Photo Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {/* Uploaded Photos */}
                {visiblePhotos.map((photo, index) => {
                    const isMain = photo.isMain || (index === 0 && !visiblePhotos.some(p => p.isMain));
                    const photoKey = photo._id || photo.publicId || `photo-${index}`;
                    const isActing = actionLoadingId === (photo._id || photo.publicId);

                    return (
                        <div
                            key={photoKey}
                            className={`relative group rounded-2xl sm:rounded-3xl overflow-hidden aspect-square border-2 bg-gray-100 dark:bg-gray-800 shadow-sm transition-all duration-200 ${
                                isMain
                                    ? 'border-purple-600 ring-2 ring-purple-600/30 shadow-purple-500/10'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-400'
                            }`}
                        >
                            <img
                                src={photo.url}
                                alt={isMain ? 'Main portrait' : `Portrait ${index + 1}`}
                                className="w-full h-full object-cover select-none"
                            />

                            {/* Main Photo Badge */}
                            {isMain && (
                                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-md z-10">
                                    <Star className="w-3 h-3 fill-white" />
                                    <span>Main Photo</span>
                                </div>
                            )}

                            {/* Slot Tag */}
                            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/65 text-white text-[10px] font-semibold backdrop-blur-xs z-10">
                                #{index + 1}
                            </div>

                            {/* Hover / Touch Actions Overlay */}
                            <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex flex-col justify-between p-2 z-20">
                                {/* Top Action Row */}
                                <div className="flex items-center justify-end gap-1.5">
                                    {/* Crop / Edit Existing Photo */}
                                    <button
                                        type="button"
                                        onClick={() => handleEditExisting(photo)}
                                        disabled={isActing || uploading}
                                        className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-transform active:scale-95 shadow cursor-pointer"
                                        title="Crop & Adjust Photo"
                                        aria-label="Crop and adjust photo"
                                    >
                                        <Edit3 className="w-3.5 h-3.5" />
                                    </button>

                                    {/* Replace Photo */}
                                    <label
                                        className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-transform active:scale-95 shadow cursor-pointer"
                                        title="Replace Photo"
                                        aria-label="Replace photo"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        <input
                                            type="file"
                                            accept={ALLOWED_TYPES.join(',')}
                                            onChange={(e) => handleFileSelect(e, photo._id || photo.publicId)}
                                            className="hidden"
                                        />
                                    </label>

                                    {/* Delete Button (Always available for every photo) */}
                                    <button
                                        type="button"
                                        onClick={() => setDeleteModalPhoto(photo)}
                                        disabled={isActing || uploading}
                                        className="p-1.5 rounded-full bg-red-600/90 hover:bg-red-600 text-white transition-transform active:scale-95 shadow cursor-pointer"
                                        title="Delete Photo"
                                        aria-label="Delete photo"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {/* Bottom Actions Row */}
                                <div className="space-y-1.5">
                                    {/* Set as Main (for non-main photos in multi-photo mode) */}
                                    {isPremium && !isMain && (
                                        <button
                                            type="button"
                                            onClick={() => handleSetMain(photo._id || photo.publicId)}
                                            disabled={isActing || uploading}
                                            className="w-full py-1.5 px-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-95 text-white text-[11px] font-bold flex items-center justify-center gap-1 shadow transition cursor-pointer"
                                        >
                                            <Star className="w-3 h-3 fill-white" />
                                            <span>Set as Main</span>
                                        </button>
                                    )}

                                    {/* Reorder Buttons (only for Premium members with > 1 photo) */}
                                    {isPremium && photos.length > 1 && (
                                        <div className="flex items-center justify-center gap-1">
                                            {index > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleMoveOrder(index, -1)}
                                                    disabled={isActing || uploading}
                                                    className="p-1 rounded-lg bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
                                                    title="Move left"
                                                >
                                                    <ArrowLeft className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            {index < photos.length - 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleMoveOrder(index, 1)}
                                                    disabled={isActing || uploading}
                                                    className="p-1 rounded-lg bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
                                                    title="Move right"
                                                >
                                                    <ArrowRight className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Loading Spinner */}
                            {isActing && (
                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white z-30">
                                    <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Upload New Photo Slot */}
                {emptyUploadSlotsCount > 0 && (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="relative rounded-2xl sm:rounded-3xl aspect-square border-2 border-dashed border-purple-300 dark:border-purple-800/60 hover:border-purple-500 dark:hover:border-purple-500 bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-50 dark:hover:bg-purple-950/40 flex flex-col items-center justify-center gap-2 text-purple-600 dark:text-purple-400 transition-all group disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                        {uploading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Plus className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                            </div>
                        )}
                        <span className="text-xs font-bold">Add Photo</span>
                        <span className="text-[10px] text-gray-400">
                            {photos.length + 1} of {maxPhotos}
                        </span>
                    </button>
                )}

                {/* Locked Slots for Free Users */}
                {lockedSlotsCount > 0 && Array.from({ length: lockedSlotsCount }).map((_, i) => (
                    <div
                        key={`locked-slot-${i}`}
                        onClick={() => navigate('/premium')}
                        className="relative rounded-2xl sm:rounded-3xl aspect-square border-2 border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40 flex flex-col items-center justify-center p-2 text-center text-gray-400 hover:border-amber-400/60 hover:bg-amber-50/20 transition-all cursor-pointer group"
                    >
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40 flex items-center justify-center mb-1 transition-colors">
                            <Lock className="w-4 h-4 text-gray-400 group-hover:text-amber-600 dark:group-hover:text-amber-400" />
                        </div>
                        <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300 group-hover:text-amber-600">
                            Slot #{photos.length + 1 + (emptyUploadSlotsCount > 0 ? 1 : 0) + i}
                        </span>
                        <span className="text-[9px] text-gray-400 group-hover:text-amber-600 line-clamp-2 mt-0.5">
                            Premium members can add up to 4 profile photos.
                        </span>
                        <span className="mt-1 text-[10px] font-bold text-purple-600 dark:text-purple-400 group-hover:underline">
                            Upgrade
                        </span>
                    </div>
                ))}
            </div>

            {/* Hidden File Input for Add New */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileSelect(e, null)}
                accept={ALLOWED_TYPES.join(',')}
                className="hidden"
            />

            {/* Crop / Edit Modal */}
            {editorOpen && selectedImageSrc && (
                <ProfileImageEditor
                    imageSrc={selectedImageSrc}
                    open={editorOpen}
                    onClose={() => {
                        setEditorOpen(false);
                        setSelectedImageSrc(null);
                        setReplacePhotoId(null);
                    }}
                    onSave={handleSaveEditedPhoto}
                    saving={uploading}
                />
            )}

            {/* Custom Delete Confirmation Modal */}
            {deleteModalPhoto && typeof document !== 'undefined' && createPortal(
                <div
                    className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="delete-dialog-title"
                >
                    <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl p-5 sm:p-6 shadow-2xl border border-gray-200 dark:border-gray-800 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
                        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto shadow-inner">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 id="delete-dialog-title" className="text-base font-bold text-gray-900 dark:text-white">
                                Delete Photo?
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Are you sure you want to delete this photo? This action cannot be undone.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5 pt-2">
                            <button
                                type="button"
                                onClick={() => setDeleteModalPhoto(null)}
                                className="py-2.5 px-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-xs transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDeletePhoto}
                                className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition shadow-md shadow-red-600/20 cursor-pointer"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default PhotoGalleryManager;
