import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Shield, Heart, HelpCircle } from 'lucide-react';

const SUPPORT_EMAIL = 'kapulk.support@gmail.com';

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-sm mt-auto">
      <div className="container mx-auto px-4 sm:px-6 py-12 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          
          {/* Column 1: Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-extrabold text-xl">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-md">
                <Heart className="w-5 h-5 fill-white" />
              </div>
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Kapu-LK
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Sri Lanka's premier matrimonial platform dedicated to connecting singles and families with dignity, safety, and authentic Porondam compatibility.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg w-fit border border-emerald-200 dark:border-emerald-800/40">
              <Shield className="w-3.5 h-3.5" />
              <span>100% Screened Profiles</span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="hover:text-purple-600 dark:hover:text-purple-400 transition">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/users" className="hover:text-purple-600 dark:hover:text-purple-400 transition">
                  Browse Profiles
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-purple-600 dark:hover:text-purple-400 transition">
                  Create Free Account
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-purple-600 dark:hover:text-purple-400 transition">
                  Member Login
                </Link>
              </li>
              <li>
                <Link to="/forgot-password" className="hover:text-purple-600 dark:hover:text-purple-400 transition">
                  Forgot Password
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Safety */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">
              Legal &amp; Privacy
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/privacy-policy" className="hover:text-purple-600 dark:hover:text-purple-400 transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a
                  href="/privacy-policy"
                  className="hover:text-purple-600 dark:hover:text-purple-400 transition"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="/privacy-policy"
                  className="hover:text-purple-600 dark:hover:text-purple-400 transition"
                >
                  Community Guidelines
                </a>
              </li>
              <li>
                <span className="text-slate-400 dark:text-slate-500">
                  10-Day Privacy Deletion Policy
                </span>
              </li>
            </ul>
          </div>

          {/* Column 4: Official Support & Contact */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-purple-600" />
              <span>Contact &amp; Support</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Need assistance with your account, profile verification, or payments? Contact our dedicated support desk:
            </p>
            <div className="pt-1">
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=Kapu-LK%20Support%20Inquiry`}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-semibold text-xs border border-purple-200 dark:border-purple-800/50 transition shadow-sm group"
              >
                <Mail className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                <span className="break-all">{SUPPORT_EMAIL}</span>
              </a>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Response time: within 12–24 hours
            </p>
          </div>

        </div>

        {/* Bottom Strip */}
        <div className="pt-8 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>
            &copy; {new Date().getFullYear()} Kapu-LK Matrimonial. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/privacy-policy" className="hover:text-purple-600 dark:hover:text-purple-400">
              Privacy
            </Link>
            <span>•</span>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-purple-600 dark:hover:text-purple-400">
              Helpdesk: {SUPPORT_EMAIL}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
