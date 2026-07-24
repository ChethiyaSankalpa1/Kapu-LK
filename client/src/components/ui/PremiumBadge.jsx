import React from 'react';
import { Crown, Shield, Award } from 'lucide-react';

const PremiumBadge = ({ plan, isAdmin, size = 'md', className = '' }) => {
  if (isAdmin) {
    return (
      <span className={`inline-flex items-center gap-1 font-bold rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : size === 'lg' ? 'px-3.5 py-1 text-sm' : 'px-2.5 py-0.5 text-xs'
      } ${className}`}>
        <Shield className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
        <span>Admin</span>
      </span>
    );
  }

  const badgeType = (plan || '').toString().toLowerCase();

  if (badgeType === 'gold') {
    return (
      <span className={`inline-flex items-center gap-1 font-extrabold rounded-full bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20 border border-amber-300 ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : size === 'lg' ? 'px-3.5 py-1 text-sm' : 'px-2.5 py-0.5 text-xs'
      } ${className}`}>
        <span>🥇</span>
        <Crown className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
        <span>Gold</span>
      </span>
    );
  }

  if (badgeType === 'silver') {
    return (
      <span className={`inline-flex items-center gap-1 font-bold rounded-full bg-gradient-to-r from-slate-200 via-slate-300 to-slate-400 text-slate-900 border border-slate-300 shadow-sm ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : size === 'lg' ? 'px-3.5 py-1 text-sm' : 'px-2.5 py-0.5 text-xs'
      } ${className}`}>
        <span>🥈</span>
        <Award className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
        <span>Silver</span>
      </span>
    );
  }

  if (badgeType === 'bronze') {
    return (
      <span className={`inline-flex items-center gap-1 font-bold rounded-full bg-gradient-to-r from-amber-700 via-orange-800 to-amber-900 text-amber-100 border border-amber-600/50 shadow-sm ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : size === 'lg' ? 'px-3.5 py-1 text-sm' : 'px-2.5 py-0.5 text-xs'
      } ${className}`}>
        <span>🥉</span>
        <Crown className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
        <span>Bronze</span>
      </span>
    );
  }

  if (plan) {
    return (
      <span className={`inline-flex items-center gap-1 font-bold rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-900 ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : size === 'lg' ? 'px-3.5 py-1 text-sm' : 'px-2.5 py-0.5 text-xs'
      } ${className}`}>
        <Crown className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
        <span>VIP</span>
      </span>
    );
  }

  return null;
};

export default PremiumBadge;
