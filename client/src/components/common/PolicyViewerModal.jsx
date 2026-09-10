import React, { useState } from 'react';
import { X, ExternalLink, Shield, FileText, Users, Clock, AlertTriangle } from 'lucide-react';

const PolicyViewerModal = ({ isOpen, onClose, initialTab = 'privacy' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Kapu-LK Legal & Safety Policies
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Version 2.0 • Effective September 2026
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition"
              title="Open full page in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-400 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-850 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition ${
              activeTab === 'privacy'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            Privacy Policy
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition ${
              activeTab === 'terms'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            Terms of Service
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guidelines')}
            className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition ${
              activeTab === 'guidelines'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Community Guidelines
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          
          {/* Privacy Policy Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/50 rounded-xl">
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-semibold mb-1">
                  <Clock className="w-4 h-4 shrink-0" />
                  10-Day Account Inactivity & Deletion Policy
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Accounts with no authenticated activity for 10 consecutive days are permanently deleted to safeguard user data. Warning notices are sent at 5 days, 2 days, and 1 day remaining. Any login or authenticated request immediately cancels deletion.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-base mb-2">1. Data Collected</h4>
                <p className="text-xs sm:text-sm">
                  We collect account registration details (name, email, age, gender, location, verified phone number), profile photos, partner preferences, and chat communications for legitimate matchmaking purposes.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-base mb-2">2. How Data Is Protected</h4>
                <p className="text-xs sm:text-sm">
                  We enforce end-to-end access controls, HTTP-only secure cookies, encrypted chat payloads, strict rate-limiting, and sanitized database queries.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-base mb-2">3. Permanent Cascade Deletion</h4>
                <p className="text-xs sm:text-sm">
                  When an account is deleted—whether requested by the user or triggered by the 10-day inactivity cycle—all associated profile records, chat history, uploaded photos, notifications, and transactions are permanently destroyed with zero orphaned records.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-base mb-2">4. Your Data Rights</h4>
                <p className="text-xs sm:text-sm">
                  You have the right to access, inspect, export (JSON format), rectify, or permanently delete your personal data at any time directly through your Account Settings.
                </p>
              </div>
            </div>
          )}

          {/* Terms of Service Tab */}
          {activeTab === 'terms' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-semibold mb-1">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Legal Eligibility & Age Requirement (18+)
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  You must be at least 18 years of age and legally eligible to enter into matrimony under applicable Sri Lankan law. Providing false age or fraudulent identity information is strictly prohibited.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-base mb-2">1. Profile Accuracy</h4>
                <p className="text-xs sm:text-sm">
                  Users agree that all information provided—including marital status, religion, caste, occupation, and family background—is truthful and accurate to the best of their knowledge.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-base mb-2">2. Genuine Matchmaking Intent</h4>
                <p className="text-xs sm:text-sm">
                  Kapu-LK is designed exclusively for genuine matrimonial and relationship matchmaking. Any commercial solicitation, financial requests, or deceptive practices will result in immediate permanent account termination.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-base mb-2">3. Subscription & Points</h4>
                <p className="text-xs sm:text-sm">
                  Premium memberships and points are non-transferable and subject to our fair usage and verification standards.
                </p>
              </div>
            </div>
          )}

          {/* Community Guidelines Tab */}
          {activeTab === 'guidelines' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-base mb-2">1. Respectful & Dignified Interaction</h4>
                <p className="text-xs sm:text-sm">
                  Treat all members with kindness and cultural sensitivity. Harassment, hateful speech, abusive messages, or uninvited spam will never be tolerated.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-base mb-2">2. Safety First: Financial Protection</h4>
                <p className="text-xs sm:text-sm">
                  Never send money, bank credentials, or gifts to anyone you meet online. Report any member asking for loans, emergency funds, or suspicious wire transfers immediately using our Report feature or Support Helpdesk.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-base mb-2">3. Verified Identity</h4>
                <p className="text-xs sm:text-sm">
                  Use clear, authentic photos of yourself. Impersonating other individuals, uploading copyrighted photos, or using deceptive imagery is a violation of our community standards.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 flex items-center justify-between">
          <a
            href="mailto:kapulk.support@gmail.com"
            className="text-xs text-purple-600 dark:text-purple-400 font-semibold hover:underline"
          >
            Support: kapulk.support@gmail.com
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition"
          >
            I Understand & Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default PolicyViewerModal;
