import React, { useState, useEffect, useCallback } from 'react';
import { inactivityAPI } from '../../services/api';
import { toast } from 'react-toastify';
import {
  Shield,
  Clock,
  AlertTriangle,
  Trash2,
  RefreshCw,
  Users,
  RotateCcw,
} from 'lucide-react';

export default function InactivityTab() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [runningCleanup, setRunningCleanup] = useState(false);
  const [cancelUserId, setCancelUserId] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inactivityAPI.getStatus();
      if (res.data?.success) {
        setStatus(res.data);
      }
    } catch (err) {
      console.error('Failed to load inactivity status:', err);
      toast.error('Failed to load inactivity status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleRunCleanup = async () => {
    if (
      !window.confirm(
        'Are you sure you want to run the inactivity cleanup now? This will immediately process 5d, 2d, and 1d warning alerts, and permanently cascade purge accounts inactive for 10+ days.'
      )
    ) {
      return;
    }

    setRunningCleanup(true);
    try {
      const res = await inactivityAPI.runCleanup();
      if (res.data?.success) {
        toast.success(
          `Cleanup finished! Purged: ${res.data.summary?.purgedUsers || 0} users. Warnings sent: 1d (${res.data.summary?.warnings1d || 0}), 2d (${res.data.summary?.warnings2d || 0}), 5d (${res.data.summary?.warnings5d || 0})`
        );
        fetchStatus();
      }
    } catch (err) {
      console.error('Failed to run cleanup:', err);
      toast.error('Cleanup failed');
    } finally {
      setRunningCleanup(false);
    }
  };

  const handleCancelDeletion = async (e) => {
    e.preventDefault();
    if (!cancelUserId.trim()) return;

    setCancelling(true);
    try {
      const res = await inactivityAPI.cancelDeletion(cancelUserId.trim());
      if (res.data?.success) {
        toast.success(`Pending deletion cancelled for ${res.data.user?.name || cancelUserId}`);
        setCancelUserId('');
        fetchStatus();
      }
    } catch (err) {
      console.error('Failed to cancel deletion:', err);
      toast.error(err.response?.data?.message || 'Failed to cancel deletion');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Policy Overview Card */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 text-white rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-6 h-6" />
              <h2 className="text-xl font-bold">10-Day Account Inactivity & Retention Engine</h2>
            </div>
            <p className="text-sm text-pink-100 max-w-2xl leading-relaxed">
              Enforces privacy compliance by auto-purging inactive user profiles and related
              records (messages, pictures, notifications, and transactions) after 10 days of zero
              activity, following advance warning notices at 5 days, 2 days, and 24 hours.
            </p>
          </div>

          <button
            onClick={handleRunCleanup}
            disabled={runningCleanup}
            className="px-5 py-3 bg-white text-rose-700 hover:bg-rose-50 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2 shrink-0 disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${runningCleanup ? 'animate-spin' : ''}`} />
            {runningCleanup ? 'Running Engine...' : 'Run Purge & Warnings Now'}
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase">Pending 10-Day Purge</span>
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-extrabold text-red-600 dark:text-red-400">
            {status?.pendingPurgeCount ?? (loading ? '...' : 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Inactive &ge; 10 days without activity</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase">Final Notice (1d Left)</span>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
            {status?.warning1dCount ?? (loading ? '...' : 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Inactive 9–10 days (24h remaining)</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase">2-Day Notice (8d Inactive)</span>
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
            {status?.warning2dCount ?? (loading ? '...' : 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Inactive 8–9 days</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase">5-Day Notice (5d Inactive)</span>
            <Users className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">
            {status?.warning5dCount ?? (loading ? '...' : 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Inactive 5–8 days</p>
        </div>
      </div>

      {/* Manual User Review & Cancellation */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-pink-600" />
          Manual Exemption / Cancel Pending Deletion
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Enter a User ID or Email to reset their inactivity timer, cancel all pending warning
          flags, and mark their account as active.
        </p>

        <form onSubmit={handleCancelDeletion} className="flex flex-col sm:flex-row gap-3 max-w-xl">
          <input
            type="text"
            required
            value={cancelUserId}
            onChange={(e) => setCancelUserId(e.target.value)}
            placeholder="Enter User MongoDB ID (e.g. 64f1a2b...)"
            className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-pink-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={cancelling || !cancelUserId.trim()}
            className="px-5 py-2.5 bg-pink-600 hover:bg-pink-700 disabled:opacity-40 text-white font-semibold text-xs rounded-xl shadow transition-all shrink-0"
          >
            {cancelling ? 'Resetting...' : 'Reset & Cancel Deletion'}
          </button>
        </form>
      </div>
    </div>
  );
}
