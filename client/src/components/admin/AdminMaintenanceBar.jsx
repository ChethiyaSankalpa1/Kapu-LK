import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Power, Settings, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { maintenanceAPI } from '../../services/api';
import { toast } from 'react-toastify';

const AdminMaintenanceBar = ({ maintenanceData, onEndMaintenance }) => {
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const scopeLabel = maintenanceData?.scope === 'feature_specific' 
    ? `Feature Specific (${(maintenanceData?.affectedFeatures || []).join(', ')})`
    : 'Full Site Public Break';

  const handleEndMaintenance = async () => {
    setLoading(true);
    try {
      await maintenanceAPI.endMaintenanceNow();
      toast.success('🎉 Maintenance break deactivated! Kapu-LK is now live for all visitors.');
      
      // Notify other parts of application
      window.dispatchEvent(
        new CustomEvent('kapu_maintenance_event', { 
          detail: { maintenance: false, isActive: false } 
        })
      );

      if (onEndMaintenance) {
        await onEndMaintenance();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deactivate maintenance mode');
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  if (!maintenanceData?.isActive) return null;

  return (
    <>
      {/* Sticky Global Admin Top Bar */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-amber-600 via-rose-600 to-purple-700 text-white shadow-lg border-b border-white/20 px-3 py-2 sm:px-4 sm:py-2.5 transition-all">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm">
          
          {/* Left: Indicator & Status */}
          <div className="flex items-center gap-2 text-center sm:text-left">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>

            <div className="flex items-center gap-1.5 font-bold tracking-wide">
              <ShieldAlert className="w-4 h-4 text-amber-200 shrink-0 hidden xs:inline" />
              <span className="uppercase text-amber-100 font-extrabold">Maintenance Break Active</span>
              <span className="hidden md:inline text-white/70">•</span>
              <span className="hidden md:inline font-normal text-white/90">
                Regular visitors see the maintenance screen ({scopeLabel})
              </span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Direct End Maintenance Button */}
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={loading}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-xl shadow transition flex items-center gap-1.5 text-xs sm:text-sm disabled:opacity-50"
              title="Deactivate maintenance mode and restore full public access"
            >
              {loading ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Power className="w-3.5 h-3.5" />
              )}
              <span>End Maintenance Now</span>
            </button>

            {/* Manage In Admin Dashboard */}
            <Link
              to="/admin"
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white font-medium rounded-xl border border-white/30 transition flex items-center gap-1 text-xs"
              title="Open Admin Dashboard Maintenance Controls"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 text-left space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Deactivate Maintenance Mode?
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Instantly restore full access for all users
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              This will immediately turn off the maintenance screen and re-open <strong>Kapu-LK</strong> to all visitors and regular members across web and mobile.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEndMaintenance}
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow transition flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Power className="w-4 h-4" />
                )}
                <span>Yes, End Maintenance Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminMaintenanceBar;
