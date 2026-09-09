const fs = require('fs');

/**
 * Validates a file buffer against known safe magic byte signatures.
 * Disallows SVG (which can contain embedded scripts) and executables.
 */
function validateFileBuffer(buffer, allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']) {
  if (!buffer || buffer.length < 4) {
    return { valid: false, reason: 'File is empty or too small' };
  }

  // Actively block SVGs, XML, and HTML (Stored XSS vectors)
  const prefix = buffer.slice(0, 512).toString('utf8').toLowerCase();
  if (
    prefix.includes('<svg') ||
    prefix.includes('<?xml') ||
    prefix.includes('<html') ||
    prefix.includes('<script')
  ) {
    return { valid: false, reason: 'SVG and HTML file uploads are forbidden for security reasons' };
  }

  // Actively block executable binaries (MZ for Windows PE)
  if (buffer[0] === 0x4d && buffer[1] === 0x5a) {
    return { valid: false, reason: 'Executable binaries are strictly prohibited' };
  }

  // Check JPEG (FF D8 FF)
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    if (allowedTypes.includes('image/jpeg')) {
      return { valid: true, mimeType: 'image/jpeg', ext: 'jpg' };
    }
  }

  // Check PNG (89 50 4E 47 0D 0A 1A 0A)
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    if (allowedTypes.includes('image/png')) {
      return { valid: true, mimeType: 'image/png', ext: 'png' };
    }
  }

  // Check WebP (RIFF....WEBP)
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    if (allowedTypes.includes('image/webp')) {
      return { valid: true, mimeType: 'image/webp', ext: 'webp' };
    }
  }

  // Check PDF (%PDF -> 25 50 44 46)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    if (allowedTypes.includes('application/pdf')) {
      return { valid: true, mimeType: 'application/pdf', ext: 'pdf' };
    }
  }

  return { valid: false, reason: 'File content does not match allowed types or header signatures' };
}

/**
 * Validates a file stored on disk by reading its first 512 bytes.
 */
function validateFileOnDisk(filePath, allowedTypes) {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(512);
    const bytesRead = fs.readSync(fd, buffer, 0, 512, 0);
    fs.closeSync(fd);
    return validateFileBuffer(buffer.slice(0, bytesRead), allowedTypes);
  } catch (err) {
    return { valid: false, reason: err.message };
  }
}

module.exports = {
  validateFileBuffer,
  validateFileOnDisk,
};