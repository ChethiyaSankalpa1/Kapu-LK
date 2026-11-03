import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Heart, Lock, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

const TermsOfService = () => {
  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex items-center justify-center shadow-lg">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Terms of Service
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Last updated: November 2026 • Version 2.0 • Applicable to all Kapu-LK users
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-8 text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed border border-slate-200 dark:border-slate-800">
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            1. Welcome to Kapu-LK
          </h2>
          <p>
            Kapu-LK (&quot;we&quot;, &quot;our&quot;, or &quot;the Platform&quot;) is Sri Lanka&apos;s premier matrimonial and matchmaking service designed to connect individuals seeking meaningful, long-term relationships and marriage. By registering, accessing, or using our services, you confirm that you have read, understood, and agreed to these Terms of Service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            2. Eligibility &amp; Accurate Information
          </h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>You must be at least 18 years old to create an account on Kapu-LK.</li>
            <li>You must provide truthful, authentic, and accurate personal details (including age, location, occupation, and marital status).</li>
            <li>Creating fake, parody, or impersonation profiles is strictly prohibited and leads to immediate account termination.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-purple-500" />
            3. Account Security &amp; Safety
          </h2>
          <p>
            You are responsible for maintaining the confidentiality of your login credentials. We strongly advise:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Never sharing financial credentials, OTPs, or passwords with anyone on the platform.</li>
            <li>Meeting in public places for in-person dates and informing trusted family or friends.</li>
            <li>Reporting any suspicious, abusive, or fraudulent behaviour immediately to our administration team.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
            4. Premium Memberships &amp; Wallet Top-Ups
          </h2>
          <p>
            Kapu-LK offers optional Premium Memberships (Bronze, Silver, Gold) providing extended matchmaking benefits. All payments (Bank Transfer, eZ Cash, Binance Pay, or Wallet) are subject to manual or automatic verification.
          </p>
          <p>
            Once a premium package is activated, it is active for the specified duration (10, 21, or 60 days). Memberships are non-transferable.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            5. Content &amp; Photo Guidelines
          </h2>
          <p>
            Photos uploaded to your profile must be recent, clear photos of yourself. We strictly forbid:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Nudity, sexually suggestive, or explicit content.</li>
            <li>Photos containing weapons, hate speech, or offensive symbols.</li>
            <li>Copyrighted images or images of celebrities / other third parties.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            6. Termination &amp; Account Deletion
          </h2>
          <p>
            You can delete your account at any time through Account Settings. Kapu-LK reserves the right to suspend or terminate accounts that violate our community guidelines, abuse private messaging limits, or engage in scamming activities.
          </p>
        </section>

        <section className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Have questions regarding our terms? Contact our support team at{' '}
            <a href="mailto:support@kapu-lk.com" className="text-purple-600 dark:text-purple-400 underline font-semibold">
              support@kapu-lk.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService;
