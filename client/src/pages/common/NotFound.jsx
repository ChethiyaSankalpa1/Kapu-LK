import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search, HeartCrack } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Animated Icon */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-purple-500/20 via-pink-500/20 to-rose-500/20 flex items-center justify-center border border-purple-200 dark:border-purple-800/50 shadow-inner">
            <HeartCrack className="w-12 h-12 text-pink-500 animate-pulse" />
          </div>
          <span className="absolute -top-2 -right-2 px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-600 text-white shadow-md">
            404
          </span>
        </div>

        {/* Heading & Explanations */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Page Not Found
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            The page you are looking for might have been moved, renamed, or is temporarily unavailable. Let&apos;s get you back on track!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center justify-center gap-2 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>

          <Link
            to="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xs sm:text-sm hover:from-purple-700 hover:to-pink-700 transition flex items-center justify-center gap-2 shadow-md"
          >
            <Home className="w-4 h-4" />
            <span>Return Home</span>
          </Link>

          <Link
            to="/browse"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold text-xs sm:text-sm hover:bg-purple-100 transition flex items-center justify-center gap-2 border border-purple-200 dark:border-purple-800/50"
          >
            <Search className="w-4 h-4" />
            <span>Browse Profiles</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
