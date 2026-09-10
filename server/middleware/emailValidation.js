/**
 * Email validation middleware
 * Ensures email addresses are properly normalized and validated before processing
 */

const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.toLowerCase().trim();
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(normalized);
};

const normalizeEmail = (email) => {
  if (!email || typeof email !== 'string') return null;
  return email.toLowerCase().trim();
};

/**
 * Middleware to validate and normalize email in request body
 */
const validateEmail = (fieldName = 'email') => {
  return (req, res, next) => {
    const email = req.body[fieldName];
    
    if (!email) {
      return res.status(400).json({ message: `${fieldName} is required` });
    }
    
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }
    
    // Normalize the email
    req.body[fieldName] = normalizeEmail(email);
    
    next();
  };
};

module.exports = {
  isValidEmail,
  normalizeEmail,
  validateEmail,
};