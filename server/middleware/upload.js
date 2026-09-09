const multer = require('multer');
const { validateFileBuffer } = require('../utils/fileSignature');

// Use memory storage to inspect magic bytes before uploading to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
  }
};

const multerUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 1,
  },
});

/**
 * Middleware wrapper that executes multer and verifies magic bytes in the memory buffer.
 */
const upload = (fieldName) => {
  const single = multerUpload.single(fieldName);
  return (req, res, next) => {
    single(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      if (req.file && req.file.buffer) {
        const validation = validateFileBuffer(req.file.buffer, ['image/jpeg', 'image/png', 'image/webp']);
        if (!validation.valid) {
          return res.status(400).json({
            success: false,
            message: validation.reason || 'Invalid file content signature. File may be corrupted or disguised.',
          });
        }
      }
      next();
    });
  };
};

// Also expose standard multer instance properties for backward compatibility
upload.single = upload;
upload.multer = multerUpload;

module.exports = upload;