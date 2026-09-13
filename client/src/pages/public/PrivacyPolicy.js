import React from 'react';
import { Shield, Lock, Cookie, Eye, AlertCircle, Mail, Clock, FileText } from 'lucide-react';

const PrivacyPolicy = () => {

  return (
    <div className="w-full flex-1 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl mb-4 sm:mb-6 shadow-lg">
            <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
            Privacy Policy
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
            Last Updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-8 lg:p-10 space-y-8 sm:space-y-10">
          
          {/* Introduction */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              Introduction
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
              Welcome to Kapu-LK ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our matrimonial platform. 
              Please read this Privacy Policy carefully before using our services.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              Information We Collect
            </h2>
            <div className="space-y-3 sm:space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 sm:p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm sm:text-base">Personal Information</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
                  We collect information you provide directly, including your name, email address, phone number, age, gender, location, 
                  education, occupation, religion, marital status, and other profile details you choose to share.
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 sm:p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm sm:text-base">Profile Photos</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
                  When you upload profile photos, we collect and store these images to display your profile to other users.
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 sm:p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm sm:text-base">Preferences and Interests</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
                  We collect information about your interests, hobbies, partner preferences, and other details that help us provide better matches.
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 sm:p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm sm:text-base">Messages and Communications</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
                  We collect the content of messages you send through our platform to facilitate communication between users.
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 sm:p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm sm:text-base">Account Information</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
                  We collect account-related information such as your username, password (encrypted), login history, and account activity.
                </p>
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              How We Use Your Information
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4 text-sm sm:text-base">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300 text-sm sm:text-base ml-4">
              <li>Provide, maintain, and improve our matrimonial services</li>
              <li>Process and facilitate matches between users based on preferences</li>
              <li>Enable communication between users through our messaging system</li>
              <li>Send you notifications about matches, messages, and account updates</li>
              <li>Verify your identity and protect against fraud</li>
              <li>Personalize your experience on our platform</li>
              <li>Analyze usage patterns to improve our services</li>
              <li>Comply with legal obligations and enforce our terms of service</li>
            </ul>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              Data Security
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, 
              alteration, disclosure, or destruction. These measures include:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300 text-sm sm:text-base ml-4 mt-4">
              <li>Encryption of sensitive data (passwords, messages) using industry-standard encryption</li>
              <li>Secure socket layer (SSL) technology for data transmission</li>
              <li>Regular security audits and updates</li>
              <li>Restricted access to personal data to authorized personnel only</li>
              <li>Secure storage on protected servers</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-300 mt-4 text-sm sm:text-base">
              However, no method of transmission over the internet is 100% secure. While we strive to protect your information, 
              we cannot guarantee absolute security.
            </p>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Cookie className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              Cookies and Similar Technologies
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
              We use cookies and similar technologies to enhance your experience, analyze usage, and assist in our marketing efforts. 
              Cookies are small files stored on your device that remember your preferences and login information. You can control 
              cookie settings through your browser preferences.
            </p>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              Third-Party Services
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
              We may use third-party services to operate our platform, including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300 text-sm sm:text-base ml-4 mt-4">
              <li>Cloud storage services (e.g., Cloudinary) for image hosting</li>
              <li>Authentication services for secure login</li>
              <li>Analytics services to understand platform usage</li>
              <li>Payment processors for premium subscriptions</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-300 mt-4 text-sm sm:text-base">
              These third parties have access to your information only to perform specific tasks on our behalf and are obligated 
              to protect your information.
            </p>
          </section>

          {/* User Rights */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              Your Rights
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
              You have the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300 text-sm sm:text-base ml-4 mt-4">
              <li>Access and review your personal information</li>
              <li>Update or correct your personal information</li>
              <li>Delete your account and associated data</li>
              <li>Opt-out of marketing communications</li>
              <li>Request a copy of your personal data</li>
              <li>Object to processing of your personal information</li>
            </ul>
          </section>

          {/* Account Security */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              Account Security
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
              You are responsible for maintaining the confidentiality of your account credentials. We recommend using a strong, 
              unique password and not sharing your login information with others. If you suspect unauthorized access to your account, 
              please contact us immediately.
            </p>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              Data Sharing Policy
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
              We do not sell, rent, or trade your personal information to third parties. We may share your information only in the 
              following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300 text-sm sm:text-base ml-4 mt-4">
              <li>With your explicit consent</li>
              <li>To comply with legal obligations or court orders</li>
              <li>To protect our rights, property, or safety</li>
              <li>With service providers who perform services on our behalf</li>
              <li>In connection with a business transfer or merger</li>
            </ul>
          </section>

          {/* 10-Day Inactivity & Data Retention Policy */}
          <section className="border-2 border-purple-200 dark:border-purple-800/60 rounded-2xl p-6 bg-purple-50/50 dark:bg-purple-950/20">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              10-Day Inactivity & Permanent Deletion Policy
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
              <p>
                To maintain a safe, active, and privacy-first matchmaking environment and minimize unnecessary data storage, 
                <strong> Kapu-LK considers accounts inactive after 10 consecutive days without login or meaningful activity</strong>.
              </p>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-purple-100 dark:border-purple-900 space-y-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">Scheduled Warning Notifications</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
                  <li><strong>5 Days Remaining (Day 5):</strong> First reminder notice delivered via in-app notification.</li>
                  <li><strong>2 Days Remaining (Day 8):</strong> Urgent warning notification informing you of pending account deletion.</li>
                  <li><strong>1 Day Remaining (Day 9):</strong> Final 24-hour alert before automated purge execution.</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-purple-100 dark:border-purple-900 space-y-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">Cancellation of Deletion</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  <strong>Logging in or performing any activity immediately cancels the deletion countdown</strong> and resets your activity status to active.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-purple-100 dark:border-purple-900 space-y-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">Permanent Cascade Purge Scope</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Once an account reaches 10 days of continuous inactivity without login, our automated cleanup engine permanently purges:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
                  <li>Personal profile, credentials, and verification records.</li>
                  <li>All uploaded photos and media from Cloudinary storage.</li>
                  <li>All sent and received chat messages and image attachments.</li>
                  <li>In-app notifications, device sessions, and authentication tokens.</li>
                  <li>Wallet balances, transaction histories, and point redemption records.</li>
                  <li>Match connections, gifts, and references in other users' blocklists.</li>
                </ul>
                <p className="text-red-600 dark:text-red-400 font-medium text-xs sm:text-sm mt-2">
                  ⚠️ Backup Limitations: Once executed, permanent deletion is irrevocable. Purged records cannot be restored from server logs or backups.
                </p>
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              Contact Us & Data Support
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
              If you have any questions regarding this Privacy Policy, your account retention, or wish to exercise your data rights, please reach out via our built-in <strong>Support Chatbot</strong>, the <strong>"Contact Admin"</strong> tab, or by emailing <a href="mailto:kapulk.support@gmail.com" className="text-purple-600 font-medium hover:underline">kapulk.support@gmail.com</a>.
            </p>
          </section>

          {/* Changes to Policy */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              Changes to This Privacy Policy
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
              We may update this Privacy Policy from time to time. When significant updates are made, existing users will be prompted to review and acknowledge the updated terms upon logging in. Continued use of the platform after acknowledgment represents agreement to the terms.
            </p>
          </section>

        </div>

        {/* Footer Note */}
        <div className="text-center mt-8 sm:mt-12">
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
            By using Kapu-LK, you agree to this Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
