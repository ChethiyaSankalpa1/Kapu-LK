import React, { useCallback, useState, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { Crop, RotateCw, SunMedium, X, Check, ZoomIn, ZoomOut, RotateCcw, RotateCcw as ResetIcon, Loader2 } from 'lucide-react';
import { createEditedImage } from '../../utils/imageEditor';

const ProfileImageEditor = ({ imageSrc, open, onClose, onSave, saving = false }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [brightness, setBrightness] = useState(100);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [processing, setProcessing] = useState(false);

    // Prevent body scrolling while modal is active
    useEffect(() => {
        if (!open) return;
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [open]);

    const handleCropComplete = useCallback((_, croppedPixels) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const handleClose = () => {
        if (processing || saving) return;
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
        setBrightness(100);
        setCroppedAreaPixels(null);
        onClose();
    };

    const handleSave = async () => {
        if (!imageSrc || !croppedAreaPixels || processing || saving) {
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
        } catch (err) {
            console.error('Error creating edited image:', err);
        } finally {
            setProcessing(false);
        }
    };

    const handleZoomIn = () => {
        setZoom((prev) => Math.min(Number((prev + 0.1).toFixed(2)), 3));
    };

    const handleZoomOut = () => {
        setZoom((prev) => Math.max(Number((prev - 0.1).toFixed(2)), 1));
    };

    const handleRotateLeft = () => {
        setRotation((prev) => (prev - 90 + 360) % 360);
    };

    const handleRotateRight = () => {
        setRotation((prev) => (prev + 90) % 360);
    };

    const handleReset = () => {
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
        setBrightness(100);
    };

    if (!open || !imageSrc) {
        return null;
    }

    const isBusy = processing || saving;

    return (
        <div
            className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto"
            onClick={(e) => {
                if (e.target === e.currentTarget && !isBusy) {
                    handleClose();
                }
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="image-editor-title"
        >
            <div className="w-full max-w-4xl bg-slate-900 border border-purple-500/30 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[94vh] lg:max-h-[88vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-950/80 border-b border-purple-500/20 shrink-0">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shrink-0 shadow-md">
                            <Crop className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div>
                            <h3 id="image-editor-title" className="text-base sm:text-lg font-bold text-white leading-tight">
                                Edit Profile Picture
                            </h3>
                            <p className="text-[11px] sm:text-xs text-purple-300">
                                Crop, rotate, and adjust brightness
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isBusy}
                        aria-label="Close image editor"
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all disabled:opacity-40 cursor-pointer"
                    >
                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </div>

                {/* Main Body */}
                <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-y-auto">
                    {/* Cropper Container */}
                    <div className="relative bg-slate-950 flex-1 min-h-[240px] sm:min-h-[300px] lg:min-h-[420px] max-h-[38vh] sm:max-h-[45vh] lg:max-h-none overflow-hidden shrink-0 lg:shrink flex items-center justify-center">
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            rotation={rotation}
                            aspect={1}
                            cropShape="round"
                            showGrid={false}
                            objectFit="contain"
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onRotationChange={setRotation}
                            onCropComplete={handleCropComplete}
                            style={{
                                containerStyle: {
                                    width: '100%',
                                    height: '100%',
                                    position: 'relative',
                                },
                            }}
                        />
                        {/* Overlay vignette */}
                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/40 via-transparent to-black/30" />
                    </div>

                    {/* Controls Panel */}
                    <div className="w-full lg:w-84 xl:w-96 bg-slate-900/95 p-4 sm:p-5 lg:p-6 space-y-4 sm:space-y-5 border-t lg:border-t-0 lg:border-l border-purple-500/20 overflow-y-auto flex flex-col justify-between">
                        <div className="space-y-4">
                            {/* Quick Action Buttons */}
                            <div className="grid grid-cols-4 gap-2">
                                <button
                                    type="button"
                                    onClick={handleZoomOut}
                                    disabled={isBusy || zoom <= 1}
                                    className="min-h-[44px] rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all flex flex-col items-center justify-center gap-0.5 disabled:opacity-40 cursor-pointer"
                                    title="Zoom Out"
                                >
                                    <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span className="text-[10px] text-purple-200">Zoom -</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleZoomIn}
                                    disabled={isBusy || zoom >= 3}
                                    className="min-h-[44px] rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all flex flex-col items-center justify-center gap-0.5 disabled:opacity-40 cursor-pointer"
                                    title="Zoom In"
                                >
                                    <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span className="text-[10px] text-purple-200">Zoom +</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleRotateLeft}
                                    disabled={isBusy}
                                    className="min-h-[44px] rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all flex flex-col items-center justify-center gap-0.5 disabled:opacity-40 cursor-pointer"
                                    title="Rotate Left (-90°)"
                                >
                                    <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span className="text-[10px] text-purple-200">-90°</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleRotateRight}
                                    disabled={isBusy}
                                    className="min-h-[44px] rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all flex flex-col items-center justify-center gap-0.5 disabled:opacity-40 cursor-pointer"
                                    title="Rotate Right (+90°)"
                                >
                                    <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span className="text-[10px] text-purple-200">+90°</span>
                                </button>
                            </div>

                            {/* Sliders Section */}
                            <div className="space-y-3.5 bg-white/5 p-3.5 rounded-2xl border border-purple-500/15">
                                {/* Zoom Slider */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-xs font-semibold text-purple-200 flex items-center gap-1.5">
                                            <ZoomIn className="w-3.5 h-3.5 text-purple-400" />
                                            <span>Zoom</span>
                                        </label>
                                        <span className="text-xs font-mono text-purple-300">{zoom.toFixed(1)}x</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={1}
                                        max={3}
                                        step={0.05}
                                        value={zoom}
                                        disabled={isBusy}
                                        onChange={(e) => setZoom(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500 disabled:opacity-40"
                                    />
                                </div>

                                {/* Rotation Slider */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-xs font-semibold text-purple-200 flex items-center gap-1.5">
                                            <RotateCw className="w-3.5 h-3.5 text-purple-400" />
                                            <span>Rotation</span>
                                        </label>
                                        <span className="text-xs font-mono text-purple-300">{rotation}°</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={0}
                                        max={360}
                                        step={1}
                                        value={rotation}
                                        disabled={isBusy}
                                        onChange={(e) => setRotation(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500 disabled:opacity-40"
                                    />
                                </div>

                                {/* Brightness Slider */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-xs font-semibold text-purple-200 flex items-center gap-1.5">
                                            <SunMedium className="w-3.5 h-3.5 text-amber-400" />
                                            <span>Brightness</span>
                                        </label>
                                        <span className="text-xs font-mono text-purple-300">{brightness}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={70}
                                        max={140}
                                        step={1}
                                        value={brightness}
                                        disabled={isBusy}
                                        onChange={(e) => setBrightness(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400 disabled:opacity-40"
                                    />
                                </div>
                            </div>

                            {/* Reset Button */}
                            <button
                                type="button"
                                onClick={handleReset}
                                disabled={isBusy}
                                className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-purple-200 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
                            >
                                <ResetIcon className="w-3.5 h-3.5" />
                                <span>Reset Adjustments</span>
                            </button>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-purple-500/20">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={isBusy}
                                className="min-h-[44px] py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold transition-all disabled:opacity-40 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isBusy || !croppedAreaPixels}
                                className="min-h-[44px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white text-xs sm:text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 cursor-pointer"
                            >
                                {isBusy ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" />
                                        <span>Save Photo</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileImageEditor;
