import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Shield, Heart, HelpCircle, MapPin, Clock } from 'lucide-react';

const SUPPORT_EMAIL = 'kapulk.support@gmail.com';
const CURRENT_YEAR = new Date().getFullYear();

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm mt-auto overflow-hidden">
      {/* Gradient accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">

          {/* Col 1 — Brand */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2.5 w-fit group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-900/40 group-hover:scale-105 transition-transform shrink-0">
                <Heart className="w-5 h-5 fill-white text-white" />
              </div>
              <span className="text-xl font-extrabold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Kapu-LK
              </span>
            </Link>

            <p className="text-xs leading-relaxed text-slate-400 max-w-[220px]">
              Sri Lanka's premier matrimonial platform connecting singles and families with dignity, safety, and authentic Porondam compatibility.
            </p>

            <div className="flex flex-col gap-2">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-lg w-fit border border-emerald-800/50">
                <Shield className="w-3.5 h-3.5 shrink-0" />
                <span>100% Screened Profiles</span>
              </div>
              <div className="inline-flex items-center gap-2 text-xs text-slate-500 px-1">
                <MapPin className="w-3 h-3 text-slate-600 shrink-0" />
                <span>Serving all Sri Lanka</span>
              </div>
            </div>
          </div>

          {/* Col 2 — Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs">
              {[
                { to: '/', label: 'Home' },
                { to: '/users', label: 'Browse Profiles' },
                { to: '/register', label: 'Create Free Account' },
                { to: '/login', label: 'Member Login' },
                { to: '/forgot-password', label: 'Forgot Password' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-slate-400 hover:text-purple-400 transition-colors duration-150"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest">
              Legal &amp; Privacy
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/privacy-policy" className="text-slate-400 hover:text-purple-400 transition-colors duration-150">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="text-slate-400 hover:text-purple-400 transition-colors duration-150">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="text-slate-400 hover:text-purple-400 transition-colors duration-150">
                  Community Guidelines
                </Link>
              </li>
              <li className="text-slate-500 cursor-default select-none">
                10-Day Data Deletion Policy
              </li>
            </ul>
          </div>

          {/* Col 4 — Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              Support
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Need help with your account, profile, or payments?
            </p>

            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=Kapu-LK%20Support%20Inquiry`}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/70 border border-purple-800/40 hover:border-purple-700/60 text-purple-300 hover:text-purple-200 font-medium text-xs transition-all group shadow-sm min-w-0"
            >
              <Mail className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="break-all leading-snug min-w-0">{SUPPORT_EMAIL}</span>
            </a>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <Clock className="w-3 h-3 shrink-0" />
              <span>Response within 12–24 hours</span>
            </div>
          </div>

        </div>

        {/* Bottom strip */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p className="flex items-center gap-1.5 text-center sm:text-left">
            <span>© {CURRENT_YEAR} Kapu-LK Matrimonial. All rights reserved.</span>
          </p>
          <p className="flex items-center gap-1.5 text-slate-600">
            Made with
            <Heart className="w-3 h-3 fill-pink-500 text-pink-500 inline" />
            in Sri Lanka
          </p>
          <div className="flex items-center gap-4">
            <Link to="/privacy-policy" className="hover:text-purple-400 transition-colors">
              Privacy
            </Link>
            <span className="text-slate-700">•</span>
            <Link to="/privacy-policy" className="hover:text-purple-400 transition-colors">
              Terms
            </Link>
            <span className="text-slate-700">•</span>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-purple-400 transition-colors">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
