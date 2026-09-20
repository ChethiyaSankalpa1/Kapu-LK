import React, { useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BackButton = ({
  label,
  fallback = '/dashboard',
  className = '',
  iconClassName = 'w-5 h-5',
  showLabel = true,
  variant = 'solid',
}) => {
  const navigate = useNavigate();

  const handleBack = useCallback(() => {
    const prev = window.history.state;
    const canGoBack =
      prev &&
      typeof prev === 'object' &&
      typeof prev.idx === 'number' &&
      prev.idx > 0;

    if (canGoBack && typeof window.history.length === 'number' && window.history.length > 1) {
      try {
        const docOrigin = typeof window !== 'undefined' && window.location ? window.location.origin : null;
        const referrer = document.referrer;
        if (!referrer || !docOrigin || referrer.startsWith(docOrigin) || referrer === '') {
          navigate(-1);
          return;
        }
      } catch (e) {
        // ignore and fall through to fallback
      }
    }

    navigate(fallback, { replace: true });
  }, [navigate, fallback]);

  if (variant === 'solid') {
    return (
      <button
        onClick={handleBack}
        className={`inline-flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/60 shadow-xs transition shrink-0 ${className}`}
        aria-label="Back"
        title={label || 'Back'}
      >
        <ArrowLeft className={iconClassName} />
        {showLabel && label ? (
          <span className="pr-1 text-xs sm:text-sm font-semibold">{label}</span>
        ) : null}
      </button>
    );
  }

  if (variant === 'ghost') {
    return (
      <button
        onClick={handleBack}
        className={`inline-flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-semibold text-sm transition shrink-0 ${className}`}
        aria-label="Back"
        title={label || 'Back'}
      >
        <ArrowLeft className={iconClassName} />
        {showLabel && label ? <span>{label}</span> : null}
      </button>
    );
  }

  if (variant === 'soft') {
    return (
      <button
        onClick={handleBack}
        className={`inline-flex items-center gap-2 p-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition shrink-0 ${className}`}
        aria-label="Back"
        title={label || 'Back'}
      >
        <ArrowLeft className={`${iconClassName} text-gray-700 dark:text-gray-300`} />
        {showLabel && label ? (
          <span className="pr-1 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</span>
        ) : null}
      </button>
    );
  }

  return null;
};

export default BackButton;
