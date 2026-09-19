/**
 * Sri Lankan Mobile Operator Prefixes:
 * 070 - Mobitel
 * 071 - Mobitel
 * 072 - Hutch
 * 074 - Dialog
 * 075 - Airtel
 * 076 - Dialog
 * 077 - Dialog
 * 078 - Hutch
 */

// Mobile prefixes allowed/used in Sri Lanka
const SL_MOBILE_PREFIXES = ['070', '071', '072', '074', '075', '076', '077', '078'];

/**
 * Checks whether a text contains a Sri Lankan mobile number.
 * Handles spaces, hyphens, dots, brackets, slashes, +94, 0094, 94 prefixes, and spaced digits.
 * Accurately avoids false positives on harmless dates, times, years, heights, prices, etc.
 * 
 * @param {string} text 
 * @returns {boolean}
 */
function containsSriLankanPhoneNumber(text) {
  if (!text || typeof text !== 'string') return false;

  // 1. Regular expression for International format (+94 or 0094 or word-boundary 94)
  // followed by optional separator, optional leading 0, 7, valid second digit, and 7 remaining digits
  const internationalRegex = /(?:(?:\+94|0094)\s*\(?0?\)?|(?:\b94\s*\(?0?\)?))[\s.-]*7[\s.-]*[01245678](?:[\s.-]*\d){7}(?!\d)/i;
  if (internationalRegex.test(text)) {
    return true;
  }

  // 2. Regular expression for Local format starting with 07[01245678]
  // Must NOT be preceded by digits (to prevent matching part of a larger number or order ID)
  // Must be followed by exactly 7 digits with optional spaces/dots/dashes between digits
  const localRegex = /(?:^|[^\d+])(0[\s.-]*7[\s.-]*[01245678](?:[\s.-]*\d){7})(?!\d)/i;
  if (localRegex.test(text)) {
    return true;
  }

  // 3. Fallback check: extract digit sequences after normalizing word separators
  // For strings with interspersed characters like "0 7 7 - 1 2 3 4 5 6 7" or "call: 077.123.4567"
  // Match candidate phone-like tokens (sequences containing digits, spaces, dots, hyphens)
  const candidateTokens = text.match(/(?:\+?\d[\d\s.-]{8,}\d)/g);
  if (candidateTokens) {
    for (const token of candidateTokens) {
      // Extract only the raw digits
      const digitsOnly = token.replace(/\D/g, '');
      
      // If 10 digits starting with 07[01245678]
      if (digitsOnly.length === 10 && /^07[01245678]\d{7}$/.test(digitsOnly)) {
        return true;
      }

      // If 11 digits starting with 947[01245678]
      if (digitsOnly.length === 11 && /^947[01245678]\d{7}$/.test(digitsOnly)) {
        return true;
      }

      // If 12 digits starting with 00947[01245678]
      if (digitsOnly.length === 12 && /^00947[01245678]\d{7}$/.test(digitsOnly)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Checks whether a text contains an email address (standard or common obfuscation).
 * @param {string} text 
 * @returns {boolean}
 */
function containsEmailAddress(text) {
  if (!text || typeof text !== 'string') return false;

  // Standard email format
  const standardEmailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  if (standardEmailRegex.test(text)) {
    return true;
  }

  // Obfuscated email formats e.g. "name [at] domain [dot] com" or "name(at)domain.com"
  const obfuscatedEmailRegex = /[a-zA-Z0-9._%+-]+\s*(?:@|\[at\]|\(at\))\s*[a-zA-Z0-9.-]+\s*(?:\.|\(dot\)|\[dot\])\s*[a-zA-Z]{2,}/i;
  if (obfuscatedEmailRegex.test(text)) {
    return true;
  }

  return false;
}

/**
 * Combined checker for contact info restriction.
 * @param {string} text 
 * @returns {{ hasRestrictedInfo: boolean, type: 'phone' | 'email' | null }}
 */
function containsRestrictedContactInfo(text) {
  if (containsSriLankanPhoneNumber(text)) {
    return { hasRestrictedInfo: true, type: 'phone' };
  }
  if (containsEmailAddress(text)) {
    return { hasRestrictedInfo: true, type: 'email' };
  }
  return { hasRestrictedInfo: false, type: null };
}

module.exports = {
  SL_MOBILE_PREFIXES,
  containsSriLankanPhoneNumber,
  containsEmailAddress,
  containsRestrictedContactInfo,
};
