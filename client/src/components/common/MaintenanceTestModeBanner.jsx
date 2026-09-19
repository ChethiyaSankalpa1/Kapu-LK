import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const MaintenanceTestModeBanner = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  // Check if current session user is in Maintenance Testing Mode
  if (!user || (!user.isMaintenanceTesting && !user.isDemoAccount)) {
    return null;
  }

  const handleReturnToAdmin = async () => {
    try {
      const res = await adminAPI.stopMaintenanceTesting();
      if (res.data && res.data.token) {
        login(res.data.token, res.data.user);
        toast.success('Returned to Admin session successfully');
        navigate('/admin');
      }
    } catch (error) {
      toast.error('Failed to exit Maintenance Test Mode');
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-600 via-purple-600 to-indigo-600 text-white px-4 py-2 text-xs font-bold shadow-lg sticky top-0 z-50 flex flex-wrap items-center justify-between gap-2 border-b border-amber-400/30">
      <div className="flex items-center space-x-2">
        <span className="flex h-2.5 w-2.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-300"></span>
        </span>
        <ShieldAlert className="w-4 h-4 text-amber-200 shrink-0" />
        <span>MAINTENANCE TEST MODE — You are previewing LoveLK as a Demo Tester account while Maintenance Mode is ACTIVE.</span>
      </div>

      <button
        onClick={handleReturnToAdmin}
        className="px-3 py-1 bg-white text-purple-900 rounded-lg font-black text-xs hover:bg-amber-100 transition shadow-sm flex items-center space-x-1 shrink-0"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Admin Dashboard</span>
      </button>
    </div>
  );
};

export default MaintenanceTestModeBanner;
