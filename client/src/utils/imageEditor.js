const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

const getRadianAngle = (degreeValue) => (degreeValue * Math.PI) / 180;

const calculateRotatedBoxSize = (width, height, rotation) => {
    const rotRad = getRadianAngle(rotation);
    return {
        width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
        height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
};

export const createEditedImage = async ({
    imageSrc,
    croppedAreaPixels,
    rotation = 0,
    brightness = 100,
}) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Canvas is not supported in this browser');
    }

    const rotRad = getRadianAngle(rotation);
    const { width: bBoxWidth, height: bBoxHeight } = calculateRotatedBoxSize(
        image.width,
        image.height,
        rotation
    );

    // Set canvas size to the rotated image's bounding box
    canvas.width = Math.ceil(bBoxWidth);
    canvas.height = Math.ceil(bBoxHeight);

    // Translate context to center, rotate, and draw
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rotRad);
    ctx.translate(-image.width / 2, -image.height / 2);

    if (brightness !== 100) {
        ctx.filter = `brightness(${brightness}%)`;
    }

    ctx.drawImage(image, 0, 0);

    // Create final cropped canvas
    const croppedCanvas = document.createElement('canvas');
    const croppedCtx = croppedCanvas.getContext('2d');

    if (!croppedCtx) {
        throw new Error('Canvas context not available');
    }

    croppedCanvas.width = Math.round(croppedAreaPixels.width);
    croppedCanvas.height = Math.round(croppedAreaPixels.height);

    croppedCtx.drawImage(
        canvas,
        Math.round(croppedAreaPixels.x),
        Math.round(croppedAreaPixels.y),
        Math.round(croppedAreaPixels.width),
        Math.round(croppedAreaPixels.height),
        0,
        0,
        Math.round(croppedAreaPixels.width),
        Math.round(croppedAreaPixels.height)
    );

    return new Promise((resolve, reject) => {
        croppedCanvas.toBlob(
            (file) => {
                if (!file) {
                    reject(new Error('Failed to create edited image'));
                    return;
                }

                const editedFile = new File([file], `profile-${Date.now()}.jpg`, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                });

                resolve({
                    file: editedFile,
                    previewUrl: URL.createObjectURL(editedFile),
                });
            },
            'image/jpeg',
            0.92
        );
    });
};
