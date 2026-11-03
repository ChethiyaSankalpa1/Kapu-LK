const path = require('path');
const fs = require('fs');
const cloudinary = require('../config/cloudinary');

const isCloudinaryConfigured = () => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloudinary_cloud_name' &&
    process.env.CLOUDINARY_API_KEY !== 'your_cloudinary_api_key'
  );
};

/**
 * Uploads a file buffer. Uses Cloudinary if configured; otherwise gracefully
 * saves to local disk in /uploads/{folder} so uploads never fail with a 500 error.
 *
 * Returns an object with { url, publicId } that also coerces to string (url)
 * for seamless compatibility with string-based callers.
 *
 * @param {Buffer} fileBuffer
 * @param {string} mimetype
 * @param {string} folder - 'payment-slips', 'profiles', 'gallery', 'chats'
 * @returns {Promise<{url: string, publicId: string, toString: () => string}>}
 */
const uploadFile = async (fileBuffer, mimetype, folder = 'payment-slips') => {
  if (isCloudinaryConfigured()) {
    try {
      const b64 = Buffer.from(fileBuffer).toString('base64');
      const dataURI = `data:${mimetype};base64,${b64}`;
      const result = await cloudinary.uploader.upload(dataURI, {
        folder: folder.replace(/[^a-zA-Z0-9_]/g, '_'),
        resource_type: 'auto',
      });
      if (result && result.secure_url) {
        const url = result.secure_url;
        const publicId = result.public_id || '';
        return {
          url,
          publicId,
          secure_url: url,
          toString() {
            return this.url;
          },
        };
      }
    } catch (err) {
      console.warn('[Uploader] Cloudinary upload failed, using local storage fallback:', err.message);
    }
  }

  // Local storage fallback
  let ext = 'jpg';
  if (mimetype === 'image/png') ext = 'png';
  else if (mimetype === 'image/webp') ext = 'webp';
  else if (mimetype === 'application/pdf') ext = 'pdf';

  const filename = `${folder}-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
  const targetDir = path.join(__dirname, '..', 'uploads', folder);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const filePath = path.join(targetDir, filename);
  fs.writeFileSync(filePath, fileBuffer);

  const localUrl = `/uploads/${folder}/${filename}`;
  return {
    url: localUrl,
    publicId: filename,
    secure_url: localUrl,
    toString() {
      return this.url;
    },
  };
};

module.exports = {
  uploadFile,
  isCloudinaryConfigured,
};
