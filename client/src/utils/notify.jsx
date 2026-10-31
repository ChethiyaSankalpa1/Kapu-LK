import React from 'react';
import { toast as rawToast } from 'react-toastify';
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';

/**
 * Strips childish cartoon emojis from legacy notification strings
 */
const stripEmojis = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}❤️💕✨📸💬🖼️👋🌟💎🔒😢🌍🎨📧✓🎉]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

/**
 * Maps raw messages to enterprise titles and human-friendly copy
 */
const normalizeNotification = (type, input) => {
  if (!input) {
    return {
      title: type === 'error' ? 'Error' : type === 'success' ? 'Success' : 'Notice',
      message: '',
    };
  }

  // If already an object with title and message
  if (typeof input === 'object' && (input.title || input.message)) {
    return {
      title: input.title || (type === 'error' ? 'Notice' : 'Success'),
      message: stripEmojis(input.message || ''),
    };
  }

  const raw = stripEmojis(String(input));

  // Common authentication & password scenarios
  if (/password.*(wrong|incorrect|invalid|mismatch)|invalid credentials/i.test(raw)) {
    return {
      title: 'Incorrect Credentials',
      message: 'The email or password you entered is incorrect. Please verify and try again.',
    };
  }

  if (/user not found|account not found|user no longer exists/i.test(raw)) {
    return {
      title: 'Account Not Found',
      message: 'No account was found with the provided details. Please verify your information.',
    };
  }

  if (/network error|failed to fetch|econnrefused/i.test(raw)) {
    return {
      title: 'Connection Issue',
      message: 'Unable to reach the server. Please check your internet connection.',
    };
  }

  if (/unauthorized|session expired|please sign in/i.test(raw)) {
    return {
      title: 'Session Expired',
      message: 'Your active session has expired. Please sign in again to continue.',
    };
  }

  if (/forbidden|permission/i.test(raw)) {
    return {
      title: 'Access Restricted',
      message: 'You do not have administrative permission to complete this action.',
    };
  }

  if (/maintenance/i.test(raw)) {
    return {
      title: 'System Maintenance',
      message: raw,
    };
  }

  if (/avatar saved|using uploaded photo/i.test(raw)) {
    return {
      title: 'Avatar Updated',
      message: 'Your profile picture preference has been saved successfully.',
    };
  }

  if (/profile updated/i.test(raw)) {
    return {
      title: 'Profile Saved',
      message: 'Your personal profile information has been saved successfully.',
    };
  }

  if (/photo uploaded/i.test(raw)) {
    return {
      title: 'Photo Uploaded',
      message: 'Your image has been verified and added to your profile.',
    };
  }

  if (/message sent/i.test(raw)) {
    return {
      title: 'Message Sent',
      message: 'Your message has been delivered to the recipient.',
    };
  }

  if (/like sent|connect request/i.test(raw)) {
    return {
      title: 'Connection Request Sent',
      message: 'Your interest has been delivered.',
    };
  }

  // If the message contains a colon (e.g. "Notice: Details...")
  if (raw.includes(': ') && raw.indexOf(': ') < 35) {
    const [head, ...rest] = raw.split(': ');
    return {
      title: head.trim(),
      message: rest.join(': ').trim(),
    };
  }

  // Default fallback with clean category titles
  const defaultTitles = {
    success: 'Action Completed',
    error: 'Action Failed',
    warning: 'Please Note',
    info: 'Information',
  };

  return {
    title: defaultTitles[type] || 'Notification',
    message: raw,
  };
};

/**
 * Enterprise Toast Notification Card
 */
const ToastCard = ({ type, title, message }) => {
  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />,
    info: <Info className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />,
  };

  const borders = {
    success: 'border-l-emerald-500',
    error: 'border-l-rose-500',
    warning: 'border-l-amber-500',
    info: 'border-l-indigo-500',
  };

  return (
    <div className={`flex items-start gap-3 w-full border-l-4 ${borders[type] || borders.info} pl-3 py-1`}>
      <div className="mt-0.5 shrink-0">{icons[type] || icons.info}</div>
      <div className="flex-1 min-w-0 pr-1">
        {title && (
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight mb-0.5">
            {title}
          </h4>
        )}
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
          {message}
        </p>
      </div>
    </div>
  );
};

/**
 * Enhanced notification dispatchers
 */
export const notify = {
  success: (content, options = {}) => {
    const { title, message } = normalizeNotification('success', content);
    return rawToast.success(<ToastCard type="success" title={title} message={message} />, {
      autoClose: 3200,
      icon: false,
      ...options,
    });
  },

  error: (content, options = {}) => {
    const { title, message } = normalizeNotification('error', content);
    return rawToast.error(<ToastCard type="error" title={title} message={message} />, {
      autoClose: 4500,
      icon: false,
      ...options,
    });
  },

  warning: (content, options = {}) => {
    const { title, message } = normalizeNotification('warning', content);
    return rawToast.warn(<ToastCard type="warning" title={title} message={message} />, {
      autoClose: 3800,
      icon: false,
      ...options,
    });
  },

  info: (content, options = {}) => {
    const { title, message } = normalizeNotification('info', content);
    return rawToast.info(<ToastCard type="info" title={title} message={message} />, {
      autoClose: 3500,
      icon: false,
      ...options,
    });
  },

  dismiss: rawToast.dismiss,
};

/**
 * Patch global react-toastify so ALL calls throughout the entire codebase
 * immediately render with the enterprise layout without rewriting 36 files.
 */
let patched = false;
export const initNotificationSystem = () => {
  if (patched) return;
  patched = true;

  const originalSuccess = rawToast.success;
  const originalError = rawToast.error;
  const originalWarn = rawToast.warn;
  const originalInfo = rawToast.info;

  rawToast.success = (content, options) => {
    // Prevent double wrapping if already a React element
    if (React.isValidElement(content)) return originalSuccess(content, options);
    const { title, message } = normalizeNotification('success', content);
    return originalSuccess(<ToastCard type="success" title={title} message={message} />, {
      icon: false,
      ...options,
    });
  };

  rawToast.error = (content, options) => {
    if (React.isValidElement(content)) return originalError(content, options);
    const { title, message } = normalizeNotification('error', content);
    return originalError(<ToastCard type="error" title={title} message={message} />, {
      icon: false,
      ...options,
    });
  };

  rawToast.warn = (content, options) => {
    if (React.isValidElement(content)) return originalWarn(content, options);
    const { title, message } = normalizeNotification('warning', content);
    return originalWarn(<ToastCard type="warning" title={title} message={message} />, {
      icon: false,
      ...options,
    });
  };

  rawToast.info = (content, options) => {
    if (React.isValidElement(content)) return originalInfo(content, options);
    const { title, message } = normalizeNotification('info', content);
    return originalInfo(<ToastCard type="info" title={title} message={message} />, {
      icon: false,
      ...options,
    });
  };
};

export default notify;
