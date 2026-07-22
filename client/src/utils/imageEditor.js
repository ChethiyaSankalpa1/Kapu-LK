const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

const getRadianAngle = (degreeValue) => (degreeValue * Math.PI) / 180;

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
    const maxSize = Math.max(image.width, image.height);
    const safeArea = Math.ceil(2 * ((maxSize / 2) * Math.sqrt(2)));

    canvas.width = safeArea;
    canvas.height = safeArea;

    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate(rotRad);
    ctx.filter = `brightness(${brightness}%)`;
    ctx.drawImage(image, -image.width / 2, -image.height / 2);

    const imageData = ctx.getImageData(0, 0, safeArea, safeArea);

    canvas.width = Math.round(croppedAreaPixels.width);
    canvas.height = Math.round(croppedAreaPixels.height);

    ctx.putImageData(
        imageData,
        Math.round(-safeArea / 2 + image.width / 2 - croppedAreaPixels.x),
        Math.round(-safeArea / 2 + image.height / 2 - croppedAreaPixels.y)
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob(
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
