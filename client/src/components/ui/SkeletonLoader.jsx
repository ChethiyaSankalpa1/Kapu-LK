import React from 'react';

export const CardSkeleton = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700/60 animate-pulse"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 w-24 bg-gray-200 dark:bg-slate-700 rounded-md" />
            <div className="h-8 w-8 bg-gray-200 dark:bg-slate-700 rounded-full" />
          </div>
          <div className="h-10 w-36 bg-gray-300 dark:bg-slate-600 rounded-lg mb-3" />
          <div className="h-4 w-28 bg-gray-200 dark:bg-slate-700 rounded-md" />
        </div>
      ))}
    </>
  );
};

export const StatsSkeleton = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm animate-pulse border border-gray-100 dark:border-slate-700/60"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 bg-gray-200 dark:bg-slate-700 rounded-full" />
            <div className="h-4 w-20 bg-gray-200 dark:bg-slate-700 rounded-md" />
          </div>
          <div className="h-7 w-24 bg-gray-300 dark:bg-slate-600 rounded-md" />
        </div>
      ))}
    </div>
  );
};

export const WalletSkeleton = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="h-4 w-64 bg-gray-200 dark:bg-slate-700 rounded-md animate-pulse" />
          </div>
          <div className="h-12 w-40 bg-gray-300 dark:bg-slate-700 rounded-xl animate-pulse" />
        </div>

        {/* Balance Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-44 bg-gray-200 dark:bg-slate-800 rounded-2xl p-8 animate-pulse shadow-sm" />
          <div className="h-44 bg-gray-200 dark:bg-slate-800 rounded-2xl p-8 animate-pulse shadow-sm" />
        </div>

        {/* Stats Grid Skeleton */}
        <StatsSkeleton />

        {/* List Skeleton */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm space-y-4 animate-pulse">
          <div className="h-6 w-48 bg-gray-200 dark:bg-slate-700 rounded-md mb-6" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 dark:bg-slate-700/50 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ListSkeleton = ({ rows = 4 }) => {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-4 bg-gray-100 dark:bg-slate-700/50 rounded-xl"
        >
          <div className="space-y-2">
            <div className="h-4 w-32 bg-gray-200 dark:bg-slate-600 rounded-md" />
            <div className="h-3 w-24 bg-gray-200 dark:bg-slate-600 rounded-md" />
          </div>
          <div className="h-5 w-16 bg-gray-300 dark:bg-slate-600 rounded-md" />
        </div>
      ))}
    </div>
  );
};

export default CardSkeleton;
