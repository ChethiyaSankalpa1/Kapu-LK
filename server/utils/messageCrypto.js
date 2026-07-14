const crypto = require('crypto');

const getEncryptionKey = () => {
  const baseSecret = process.env.MESSAGE_ENCRYPTION_KEY || process.env.JWT_SECRET || 'kapu-lk-message-secret';
  return crypto.createHash('sha256').update(baseSecret).digest();
};

exports.encryptMessage = (plainText) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]);

  return {
    encryptedContent: encrypted.toString('hex'),
    iv: iv.toString('hex'),
  };
};

exports.decryptMessage = (encryptedContent, iv) => {
  if (!encryptedContent) return '';
  if (!iv) return encryptedContent;

  try {
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      getEncryptionKey(),
      Buffer.from(iv, 'hex')
    );
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedContent, 'hex')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  } catch (error) {
    return encryptedContent;
  }
};
