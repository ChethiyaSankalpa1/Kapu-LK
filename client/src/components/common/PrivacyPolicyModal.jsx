import React, { useState } from 'react';
import { Shield, Clock, AlertTriangle, CheckCircle, ExternalLink, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const PrivacyPolicyModal = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dismissedLocally, setDismissedLocally] = useState(false);

  // Check local device persistence so user is never trapped
  const isLocallyAcknowledged = user?._id && localStorage.getItem(`privacy_acknowledged_${user._id}`);

  // Only show if user is logged in, has not acknowledged, and hasn't locally dismissed
  const shouldShow =
    user &&
    !user.acknowledgedPrivacyPolicyAt &&
    !isLocallyAcknowledged &&
    !dismissedLocally;

  if (!shouldShow) return null;

  const handleAccept = async () => {
    setLoading(true);
    try {
      await userAPI.acknowledgePrivacyPolicy({ version: '2026.09' });
      if (user?._id) {
        localStorage.setItem(`privacy_acknowledged_${user._id}`, new Date().toISOString());
      }
      await refreshUser().catch(() => {});
      setDismissedLocally(true);
      toast.success('Privacy policy acknowledged. Thank you!');
    } catch (err) {
      console.warn('Backend acknowledgment sync note:', err?.message || err);
      // Fallback: save locally so user is never blocked while backend redeploys
      if (user?._id) {
        localStorage.setItem(`privacy_acknowledged_${user._id}`, new Date().toISOString());
      }
      setDismissedLocally(true);
      toast.success('Privacy policy acknowledged. Thank you!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-purple-100 dark:border-gray-700 max-h-[90vh] flex flex-col justify-between">
        <div className="space-y-4 overflow-y-auto pr-1">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Updated Privacy Policy
                </h2>
                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                  Effective September 2026
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDismissedLocally(true)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            We have updated the Kapu-LK Privacy Policy to better protect member privacy and outline our automated account retention and data lifecycle guidelines.
          </p>

          {/* Key Updates Highlight Box */}
          <div className="bg-purple-50 dark:bg-purple-950/30 rounded-2xl p-4 border border-purple-200 dark:border-purple-800/60 space-y-3 text-xs sm:text-sm">
            <div className="flex items-start gap-2 text-purple-900 dark:text-purple-200 font-semibold">
              <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
              <span>10-Day Account Inactivity Rule:</span>
            </div>
            <p className="text-gray-700 dark:text-gray-300 pl-6 leading-relaxed">
              Accounts with no login or browsing activity for <strong>10 consecutive days</strong> are permanently deleted to eliminate unnecessary storage of sensitive personal data.
            </p>

            <div className="flex items-start gap-2 text-purple-900 dark:text-purple-200 font-semibold pt-1">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <span>Warning Schedule:</span>
            </div>
            <p className="text-gray-700 dark:text-gray-300 pl-6 leading-relaxed">
              You will receive automated warning notifications at <strong>5 days</strong>, <strong>2 days</strong>, and <strong>1 day</strong> remaining before deletion. <strong>Any login or active use immediately resets your countdown to active.</strong>
            </p>

            <div className="flex items-start gap-2 text-purple-900 dark:text-purple-200 font-semibold pt-1">
              <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span>Permanent Purge:</span>
            </div>
            <p className="text-gray-700 dark:text-gray-300 pl-6 leading-relaxed">
              Expired accounts undergo a complete cascade deletion (photos, chat messages, notifications, and wallet records are permanently removed with 0 orphaned records).
            </p>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between pt-1">
            <span>Please review and acknowledge to continue using Kapu-LK.</span>
            <Link
              to="/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1 font-medium"
            >
              Read Full Policy <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-5 border-t border-gray-100 dark:border-gray-700 mt-4 flex flex-col gap-2">
          <button
            onClick={handleAccept}
            disabled={loading}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-2xl font-semibold shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                I Understand & Accept
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setDismissedLocally(true)}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 py-1 text-center font-medium transition-colors"
          >
            Remind me later
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyModal;
