import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { userAPI } from '../../services/api';
import { toast } from 'react-toastify';
import {
    Camera, Plus, Trash2, Star, ArrowLeft,
    ArrowRight, Loader2
} from 'lucide-react';
import ProfileImageEditor from './ProfileImageEditor';

const MAX_PHOTOS = 4;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const PhotoGalleryManager = ({ user, onPhotosUpdated }) => {
    const { t } = useTranslation();
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

    const fileInputRef = useRef(null);

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

    const handleSaveEditedPhoto = async ({ file }) => {
        setUploading(true);
        const formData = new FormData();
        formData.append('photo', file);

        try {
            // If replacing, delete previous photo first if exists
            if (replacePhotoId && photos.length > 1) {
                try {
                    await userAPI.deletePhoto(replacePhotoId);
                } catch (delErr) {
                    console.warn('Replace cleanup note:', delErr.message);
                }
            }

            const res = await userAPI.uploadPhoto(formData);
            if (res.data?.photos) {
                setPhotos(res.data.photos);
                if (onPhotosUpdated) {
                    onPhotosUpdated(res.data.photos, res.data.profileImageUrl);
                }
            }
            toast.success(t('photos.uploadSuccess', { defaultValue: 'Photo uploaded successfully!' }));
        } catch (error) {
            console.error('Failed to upload photo:', error);
            toast.error(error.response?.data?.message || t('photos.uploadFailed', { defaultValue: 'Failed to upload photo.' }));
        } finally {
            setUploading(false);
            setEditorOpen(false);
            setSelectedImageSrc(null);
            setReplacePhotoId(null);
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

    const handleDeletePhoto = async (photoId) => {
        if (photos.length <= 1) {
            toast.info(t('photos.minOneRequired', { defaultValue: 'You must have at least 1 profile photo.' }));
            return;
        }

        if (!window.confirm(t('photos.deleteConfirm', { defaultValue: 'Are you sure you want to delete this photo?' }))) {
            return;
        }

        setActionLoadingId(photoId);
        try {
            const res = await userAPI.deletePhoto(photoId);
            if (res.data?.photos) {
                setPhotos(res.data.photos);
                if (onPhotosUpdated) {
                    onPhotosUpdated(res.data.photos, res.data.profileImageUrl);
                }
            }
            toast.success(t('photos.deleted', { defaultValue: 'Photo deleted successfully.' }));
        } catch (error) {
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

    const emptySlotsCount = Math.max(0, MAX_PHOTOS - photos.length);

    return (
        <div className="space-y-4">
            {/* Header info with counter */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Camera className="w-4 h-4 text-purple-600" />
                        <span>Profile Photos</span>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Upload 1 to 4 clear photos. Choose your best portrait as the main photo.
                    </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                    {photos.length} / {MAX_PHOTOS} Photos
                </span>
            </div>

            {/* Photo Slots Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {photos.map((photo, index) => {
                    const isMain = photo.isMain || (index === 0 && !photos.some(p => p.isMain));
                    const isActing = actionLoadingId === (photo._id || photo.publicId);

                    return (
                        <div
                            key={photo._id || photo.publicId || index}
                            className={`relative group rounded-2xl overflow-hidden aspect-square border-2 bg-gray-100 dark:bg-gray-800 shadow-sm transition-all duration-200 ${
                                isMain
                                    ? 'border-purple-600 ring-2 ring-purple-600/30'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-400'
                            }`}
                        >
                            <img
                                src={photo.url}
                                alt={`Profile slot ${index + 1}`}
                                className="w-full h-full object-cover"
                            />

                            {/* Main Badge */}
                            {isMain && (
                                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-md">
                                    <Star className="w-3 h-3 fill-white" />
                                    <span>Main</span>
                                </div>
                            )}

                            {/* Slot Index Tag */}
                            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-semibold backdrop-blur-xs">
                                {index + 1}/{MAX_PHOTOS}
                            </div>

                            {/* Actions Overlay */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                                <div className="flex items-center justify-end gap-1">
                                    {/* Delete Button */}
                                    {photos.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleDeletePhoto(photo._id || photo.publicId)}
                                            disabled={isActing}
                                            className="p-1.5 rounded-full bg-red-600/90 hover:bg-red-600 text-white transition-transform active:scale-95 shadow"
                                            title="Delete photo"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    {/* Set as Main */}
                                    {!isMain && (
                                        <button
                                            type="button"
                                            onClick={() => handleSetMain(photo._id || photo.publicId)}
                                            disabled={isActing}
                                            className="w-full py-1 px-2 rounded-lg bg-white/90 hover:bg-white text-purple-900 text-[11px] font-bold flex items-center justify-center gap-1 shadow transition"
                                        >
                                            <Star className="w-3 h-3 text-purple-600" />
                                            <span>Set as Main</span>
                                        </button>
                                    )}

                                    {/* Reorder Arrows */}
                                    <div className="flex items-center justify-center gap-1">
                                        {index > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => handleMoveOrder(index, -1)}
                                                className="p-1 rounded-md bg-white/30 hover:bg-white/50 text-white text-xs"
                                                title="Move left"
                                            >
                                                <ArrowLeft className="w-3 h-3" />
                                            </button>
                                        )}
                                        {index < photos.length - 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleMoveOrder(index, 1)}
                                                className="p-1 rounded-md bg-white/30 hover:bg-white/50 text-white text-xs"
                                                title="Move right"
                                            >
                                                <ArrowRight className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Loading spinner */}
                            {isActing && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                                    <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Upload New Photo Slot */}
                {emptySlotsCount > 0 && (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="relative rounded-2xl aspect-square border-2 border-dashed border-purple-300 dark:border-purple-800/60 hover:border-purple-500 dark:hover:border-purple-500 bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-50 dark:hover:bg-purple-950/40 flex flex-col items-center justify-center gap-2 text-purple-600 dark:text-purple-400 transition-all group disabled:opacity-50 cursor-pointer shadow-xs"
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
                            {photos.length + 1} of {MAX_PHOTOS}
                        </span>
                    </button>
                )}
            </div>

            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileSelect(e)}
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
        </div>
    );
};

export default PhotoGalleryManager;
