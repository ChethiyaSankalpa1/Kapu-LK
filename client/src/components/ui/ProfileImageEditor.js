import React, { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';
import { Crop, RotateCw, SunMedium, X, Check } from 'lucide-react';
import { createEditedImage } from '../../utils/imageEditor';

const ProfileImageEditor = ({ imageSrc, open, onClose, onSave, saving }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [brightness, setBrightness] = useState(100);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [processing, setProcessing] = useState(false);

    const handleCropComplete = useCallback((_, croppedPixels) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const handleClose = () => {
        if (processing || saving) {
            return;
        }

        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
        setBrightness(100);
        setCroppedAreaPixels(null);
        onClose();
    };

    const handleSave = async () => {
        if (!imageSrc || !croppedAreaPixels) {
            return;
        }

        setProcessing(true);

        try {
            const editedImage = await createEditedImage({
                imageSrc,
                croppedAreaPixels,
                rotation,
                brightness,
            });

            await onSave(editedImage);
            handleClose();
        } finally {
            setProcessing(false);
        }
    };

    if (!open || !imageSrc) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
            <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Edit Profile Picture</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Crop and adjust your photo before uploading it.</p>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={processing || saving}
                        className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="relative bg-slate-950 min-h-[320px] sm:min-h-[460px]">
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            rotation={rotation}
                            aspect={1}
                            cropShape="round"
                            showGrid={false}
                            objectFit="cover"
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onRotationChange={setRotation}
                            onCropComplete={handleCropComplete}
                        />
                    </div>

                    <div className="p-4 sm:p-6 space-y-5 bg-slate-50 dark:bg-slate-900/60">
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2">
                                    <Crop className="w-4 h-4" />
                                    Zoom
                                </label>
                                <input
                                    type="range"
                                    min={1}
                                    max={3}
                                    step={0.01}
                                    value={zoom}
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="w-full accent-purple-600"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2">
                                    <RotateCw className="w-4 h-4" />
                                    Rotation
                                </label>
                                <input
                                    type="range"
                                    min={0}
                                    max={360}
                                    step={1}
                                    value={rotation}
                                    onChange={(e) => setRotation(Number(e.target.value))}
                                    className="w-full accent-purple-600"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2">
                                    <SunMedium className="w-4 h-4" />
                                    Brightness
                                </label>
                                <input
                                    type="range"
                                    min={70}
                                    max={140}
                                    step={1}
                                    value={brightness}
                                    onChange={(e) => setBrightness(Number(e.target.value))}
                                    className="w-full accent-purple-600"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
                                <p className="text-xs text-slate-500 dark:text-slate-400">Zoom</p>
                                <p className="font-semibold text-slate-900 dark:text-white">{zoom.toFixed(2)}x</p>
                            </div>
                            <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
                                <p className="text-xs text-slate-500 dark:text-slate-400">Rotate</p>
                                <p className="font-semibold text-slate-900 dark:text-white">{rotation}°</p>
                            </div>
                            <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
                                <p className="text-xs text-slate-500 dark:text-slate-400">Light</p>
                                <p className="font-semibold text-slate-900 dark:text-white">{brightness}%</p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-4 text-sm text-slate-600 dark:text-slate-300">
                            Use the round frame to control exactly how the profile picture appears across the app.
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={processing || saving}
                                className="flex-1 px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={processing || saving || !croppedAreaPixels}
                                className="flex-1 px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                            >
                                <Check className="w-4 h-4" />
                                <span>{processing || saving ? 'Saving...' : 'Apply & Upload'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileImageEditor;
