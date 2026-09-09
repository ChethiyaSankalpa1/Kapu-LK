import React, { useState } from 'react';
import { Shield, Clock, CheckCircle } from 'lucide-react';
import { userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import PolicyViewerModal from './PolicyViewerModal';

const CURRENT_POLICY_VERSION = '2.0';

const PrivacyPolicyModal = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [policyModalTab, setPolicyModalTab] = useState('privacy');

  // 4 Required Checkboxes (Unchecked by default)
  const [consents, setConsents] = useState({
    is18OrOlder: false,
    isAccurateInfo: false,
    acceptedTermsAndPrivacy: false,
    acceptedInactivityDeletion: false,
  });

  // Check if user already acknowledged version 2.0
  const isAcknowledged =
    user?.acknowledgedPrivacyPolicyVersion === CURRENT_POLICY_VERSION &&
    user?.acknowledgedPrivacyPolicyAt;

  // Unskippable re-consent modal when major policy update occurs
  const shouldShow = user && !isAcknowledged;

  if (!shouldShow) return null;

  const { is18OrOlder, isAccurateInfo, acceptedTermsAndPrivacy, acceptedInactivityDeletion } = consents;
  const allConsentsChecked = is18OrOlder && isAccurateInfo && acceptedTermsAndPrivacy && acceptedInactivityDeletion;

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setConsents((prev) => ({ ...prev, [name]: checked }));
  };

  const openPolicyTab = (tab) => {
    setPolicyModalTab(tab);
    setPolicyModalOpen(true);
  };

  const handleAccept = async () => {
    if (!allConsentsChecked) {
      toast.error('Please check all 4 required consent agreements to continue using Kapu-LK.');
      return;
    }

    setLoading(true);
    try {
      await userAPI.acknowledgePrivacyPolicy({
        version: CURRENT_POLICY_VERSION,
        is18OrOlder: true,
        isAccurateInfo: true,
        acceptedTermsAndPrivacy: true,
        acceptedInactivityDeletion: true,
        consentSource: 'policy_update_modal',
      });
      await refreshUser().catch(() => {});
      toast.success('Privacy policy acknowledged successfully. Thank you!');
    } catch (err) {
      console.warn('Backend acknowledgment sync note:', err?.message || err);
      toast.error(err.response?.data?.message || 'Failed to record policy consent. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-purple-100 dark:border-gray-700 max-h-[92vh] flex flex-col justify-between overflow-hidden">
          
          <div className="space-y-4 overflow-y-auto pr-1">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Updated Privacy & Terms Notice
                </h2>
                <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
                  Policy Version 2.0 • Unskippable Update
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              We have updated our platform policies to ensure strict compliance with age verification, data protection, and our 10-day inactivity retention lifecycle. Please review and confirm your consent below to continue using your account.
            </p>

            {/* Key Updates Highlight Box */}
            <div className="bg-purple-50 dark:bg-purple-950/30 rounded-2xl p-4 border border-purple-200 dark:border-purple-800/60 space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-start gap-2 text-purple-900 dark:text-purple-200 font-semibold">
                <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
                <span>10-Day Inactivity Deletion Rule:</span>
              </div>
              <p className="text-gray-700 dark:text-gray-300 pl-6 text-xs leading-relaxed">
                Accounts inactive for 10 consecutive days are permanently purged along with all messages, photos, notifications, and transactions. Automated warnings are sent at 5 days, 2 days, and 1 day remaining. Any login resets the countdown.
              </p>

              <div className="flex items-start gap-2 text-purple-900 dark:text-purple-200 font-semibold pt-1">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <span>Data Rights & Portability:</span>
              </div>
              <p className="text-gray-700 dark:text-gray-300 pl-6 text-xs leading-relaxed">
                You can download a complete JSON export of your personal data or request immediate account deletion at any time in Account Settings.
              </p>
            </div>

            {/* Review Policy Links */}
            <div className="p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl text-xs flex flex-wrap items-center gap-2">
              <span className="font-semibold text-gray-800 dark:text-gray-200">Read policies:</span>
              <button
                type="button"
                onClick={() => openPolicyTab('privacy')}
                className="underline font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400"
              >
                Privacy Policy
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => openPolicyTab('terms')}
                className="underline font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400"
              >
                Terms of Service
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => openPolicyTab('guidelines')}
                className="underline font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400"
              >
                Community Guidelines
              </button>
            </div>

            {/* 4 Required Consent Checkboxes */}
            <div className="space-y-2.5 pt-1">
              
              <label className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="is18OrOlder"
                  checked={is18OrOlder}
                  onChange={handleCheckboxChange}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span>
                  I confirm that I am <strong>18 years of age or older</strong> and legally eligible to use Kapu‑LK. <span className="text-red-500">*</span>
                </span>
              </label>

              <label className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="isAccurateInfo"
                  checked={isAccurateInfo}
                  onChange={handleCheckboxChange}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span>
                  I confirm that the information provided in my profile is <strong>accurate and truthful</strong>. <span className="text-red-500">*</span>
                </span>
              </label>

              <label className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="acceptedTermsAndPrivacy"
                  checked={acceptedTermsAndPrivacy}
                  onChange={handleCheckboxChange}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span>
                  I have read and agree to the{' '}
                  <button type="button" onClick={() => openPolicyTab('privacy')} className="text-purple-600 font-semibold underline">
                    Privacy Policy
                  </button>
                  ,{' '}
                  <button type="button" onClick={() => openPolicyTab('terms')} className="text-purple-600 font-semibold underline">
                    Terms
                  </button>
                  , and{' '}
                  <button type="button" onClick={() => openPolicyTab('guidelines')} className="text-purple-600 font-semibold underline">
                    Guidelines
                  </button>
                  . <span className="text-red-500">*</span>
                </span>
              </label>

              <label className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="acceptedInactivityDeletion"
                  checked={acceptedInactivityDeletion}
                  onChange={handleCheckboxChange}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span>
                  I understand and accept that inactive accounts are <strong>permanently deleted after 10 days of inactivity</strong> following advance warning notices. <span className="text-red-500">*</span>
                </span>
              </label>
            </div>
          </div>

          {/* Accept Button */}
          <div className="pt-4 mt-2 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={handleAccept}
              disabled={!allConsentsChecked || loading}
              className={`w-full py-3.5 px-6 font-semibold text-sm sm:text-base rounded-2xl transition shadow-lg flex items-center justify-center gap-2 ${
                allConsentsChecked && !loading
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-purple-500/25 cursor-pointer'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-80'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Recording Consent...</span>
                </>
              ) : (
                <span>Accept Updated Terms & Continue</span>
              )}
            </button>
            {!allConsentsChecked && (
              <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
                All 4 checkboxes must be accepted to continue using your account.
              </p>
            )}
          </div>
        </div>
      </div>

      <PolicyViewerModal
        isOpen={policyModalOpen}
        onClose={() => setPolicyModalOpen(false)}
        initialTab={policyModalTab}
      />
    </>
  );
};

export default PrivacyPolicyModal;
