import React, { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';
import { Crop, RotateCw, SunMedium, X, Check, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
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

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 0.1, 3));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 0.1, 1));
    };

    const handleRotateLeft = () => {
        setRotation(prev => (prev - 90 + 360) % 360);
    };

    const handleRotateRight = () => {
        setRotation(prev => (prev + 90) % 360);
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

    return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-purple-500/30">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-black/30 border-b border-purple-500/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Crop className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Edit Profile Picture</h3>
                            <p className="text-xs text-purple-300">Adjust and crop your photo</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={processing || saving}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex flex-col lg:flex-row">
                    {/* Cropper Area */}
                    <div className="relative bg-black/50 flex-1 min-h-[400px] lg:min-h-[500px]">
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
                            classes={{
                                containerClassName: 'rounded-none',
                            }}
                        />
                        
                        {/* Overlay gradient */}
                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/50 via-transparent to-black/50" />
                    </div>

                    {/* Controls Panel */}
                    <div className="w-full lg:w-80 bg-black/40 backdrop-blur-sm p-6 space-y-6 border-l border-purple-500/20">
                        {/* Quick Actions */}
                        <div className="grid grid-cols-4 gap-2">
                            <button
                                onClick={handleZoomOut}
                                className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all flex items-center justify-center"
                                title="Zoom Out"
                            >
                                <ZoomOut className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleZoomIn}
                                className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all flex items-center justify-center"
                                title="Zoom In"
                            >
                                <ZoomIn className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleRotateLeft}
                                className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all flex items-center justify-center"
                                title="Rotate Left"
                            >
                                <RotateCcw className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleRotateRight}
                                className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all flex items-center justify-center"
                                title="Rotate Right"
                            >
                                <RotateCw className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Sliders */}
                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium text-purple-300 flex items-center gap-2">
                                        <ZoomIn className="w-4 h-4" />
                                        Zoom
                                    </label>
                                    <span className="text-xs text-white/70">{zoom.toFixed(1)}x</span>
                                </div>
                                <input
                                    type="range"
                                    min={1}
                                    max={3}
                                    step={0.05}
                                    value={zoom}
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium text-purple-300 flex items-center gap-2">
                                        <RotateCw className="w-4 h-4" />
                                        Rotation
                                    </label>
                                    <span className="text-xs text-white/70">{rotation}°</span>
                                </div>
                                <input
                                    type="range"
                                    min={0}
                                    max={360}
                                    step={1}
                                    value={rotation}
                                    onChange={(e) => setRotation(Number(e.target.value))}
                                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium text-purple-300 flex items-center gap-2">
                                        <SunMedium className="w-4 h-4" />
                                        Brightness
                                    </label>
                                    <span className="text-xs text-white/70">{brightness}%</span>
                                </div>
                                <input
                                    type="range"
                                    min={70}
                                    max={140}
                                    step={1}
                                    value={brightness}
                                    onChange={(e) => setBrightness(Number(e.target.value))}
                                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                />
                            </div>
                        </div>

                        {/* Reset Button */}
                        <button
                            onClick={handleReset}
                            className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all"
                        >
                            Reset All
                        </button>

                        {/* Action Buttons */}
                        <div className="space-y-3 pt-4 border-t border-purple-500/20">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={processing || saving}
                                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={processing || saving || !croppedAreaPixels}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25"
                            >
                                <Check className="w-5 h-5" />
                                <span>{processing || saving ? 'Saving...' : 'Save Changes'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileImageEditor;
