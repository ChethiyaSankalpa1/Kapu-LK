import React from 'react';
import { AlertTriangle, Clock, Mail } from 'lucide-react';

const FeatureMaintenanceBanner = ({ featureName, message, expectedCompletionAt, supportContact }) => {
  return (
    <div className="w-full bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded-2xl p-4 sm:p-5 shadow-sm text-amber-900 dark:text-amber-200 animate-fadeIn">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-200/70 dark:bg-amber-900/50 flex items-center justify-center shrink-0 text-amber-700 dark:text-amber-300">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm sm:text-base font-bold text-amber-950 dark:text-amber-100">
            {featureName ? `${featureName} is Temporarily Unavailable` : 'Feature Under Maintenance'}
          </h4>
          <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
            {message || 'This specific feature is currently undergoing scheduled maintenance. All other platform features continue to function normally.'}
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-amber-700 dark:text-amber-400">
            {expectedCompletionAt && (
              <div className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>Expected back: {new Date(expectedCompletionAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )}
            {supportContact && (
              <a
                href={`mailto:${supportContact}`}
                className="flex items-center gap-1.5 underline font-semibold hover:text-amber-900 dark:hover:text-amber-200"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Need assistance? Contact Support</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureMaintenanceBanner;
