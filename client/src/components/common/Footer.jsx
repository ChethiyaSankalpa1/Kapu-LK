import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Shield, Heart, HelpCircle, MapPin, Clock, Sparkles } from 'lucide-react';

const SUPPORT_EMAIL = 'kapulk.support@gmail.com';
const CURRENT_YEAR = new Date().getFullYear();

const Footer = () => {
  return (
    <footer className="bg-[#0a0d14] text-slate-400 text-sm mt-auto overflow-hidden border-t border-rose-950/30">
      {/* Romantic gradient accent bar with subtle glow */}
      <div className="h-1 w-full bg-gradient-to-r from-rose-600 via-pink-500 to-amber-500 shadow-sm shadow-rose-500/30" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 max-w-7xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 mb-8 sm:mb-10">

          {/* Col 1 — Brand */}
          <div className="sm:col-span-2 lg:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2.5 w-fit group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 via-pink-600 to-rose-500 flex items-center justify-center shadow-lg shadow-rose-900/50 group-hover:scale-105 transition-transform shrink-0">
                <Heart className="w-5 h-5 fill-white text-white" />
              </div>
              <span className="text-2xl font-extrabold bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300 bg-clip-text text-transparent tracking-tight">
                Kapu-LK
              </span>
            </Link>

            <p className="text-xs leading-relaxed text-slate-400 max-w-[260px]">
              Sri Lanka's modern dating &amp; matchmaking platform connecting genuine young adults with romance, dignity, and authentic compatibility.
            </p>

            <div className="flex flex-col gap-2 pt-1">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/50 px-3 py-1.5 rounded-xl w-fit border border-emerald-900/50 shadow-xs">
                <Shield className="w-3.5 h-3.5 shrink-0" />
                <span>100% Verified Members</span>
              </div>
              <div className="inline-flex items-center gap-2 text-xs text-rose-300/90 px-1 font-medium">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>All 25 Sri Lankan Districts &amp; Expats</span>
              </div>
            </div>
          </div>

          {/* Col 2 — Discovery & Dating */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-extrabold text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>Discovery</span>
            </h4>
            <ul className="space-y-2.5 text-xs">
              {[
                { to: '/', label: 'Home Page' },
                { to: '/users', label: 'Discover Matches' },
                { to: '/about', label: 'About Kapu-LK' },
                { to: '/register', label: 'Join Free Today' },
                { to: '/login', label: 'Member Sign In' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-slate-400 hover:text-rose-400 transition-colors duration-150 inline-block"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Trust & Safety */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-extrabold text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-rose-400" />
              <span>Trust &amp; Safety</span>
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/privacy-policy" className="text-slate-400 hover:text-rose-400 transition-colors duration-150">
                  Privacy Policy &amp; Data Rights
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-slate-400 hover:text-rose-400 transition-colors duration-150">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="text-slate-400 hover:text-rose-400 transition-colors duration-150">
                  Community Guidelines
                </Link>
              </li>
              <li className="text-slate-500 cursor-default select-none">
                10-Day Account Auto-Purge Policy
              </li>
              <li className="text-rose-400/90 font-medium cursor-default select-none">
                🔞 18+ Adults Only Platform
              </li>
            </ul>
          </div>

          {/* Col 4 — Support */}
          <div className="space-y-3.5 min-w-0">
            <h4 className="text-xs font-extrabold text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>Safety Helpdesk</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Have questions about your profile, matches, or report a concern?
            </p>

            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=Kapu-LK%20Support%20Inquiry`}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-900/40 hover:border-rose-700/60 text-rose-300 hover:text-rose-200 font-medium text-xs transition-all group shadow-sm min-w-0"
            >
              <Mail className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform text-rose-400" />
              <span className="break-all leading-snug min-w-0">{SUPPORT_EMAIL}</span>
            </a>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <Clock className="w-3 h-3 shrink-0 text-slate-500" />
              <span>Moderation response within 12–24h</span>
            </div>
          </div>

        </div>

        {/* Bottom strip */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p className="flex items-center gap-1.5 text-center sm:text-left">
            <span>© {CURRENT_YEAR} Kapu-LK (KapuLK.online). All rights reserved. Sri Lanka.</span>
          </p>
          <p className="flex items-center gap-1.5 text-slate-500">
            Made with
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 inline animate-pulse" />
            for Sri Lankan Connections
          </p>
          <div className="flex items-center gap-4">
            <Link to="/about" className="hover:text-rose-400 transition-colors">
              About
            </Link>
            <span className="text-slate-800">•</span>
            <Link to="/privacy-policy" className="hover:text-rose-400 transition-colors">
              Privacy
            </Link>
            <span className="text-slate-800">•</span>
            <Link to="/terms" className="hover:text-rose-400 transition-colors">
              Terms
            </Link>
            <span className="text-slate-800">•</span>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-rose-400 transition-colors">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
