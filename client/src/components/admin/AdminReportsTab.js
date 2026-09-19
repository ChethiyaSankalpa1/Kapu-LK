import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../services/api';
import { toast } from 'react-toastify';
import {
  AlertTriangle, Trash2, Eye, ShieldAlert
} from 'lucide-react';

const AdminReportsTab = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actionType, setActionType] = useState('reviewed'); // reviewed, action_taken, dismissed
  const [suspendUser, setSuspendUser] = useState(false);
  const [resolving, setResolving] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getReports();
      setReports(res.data || []);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      toast.error('Failed to load complaints/reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleOpenResolveModal = (report) => {
    setSelectedReport(report);
    setResolutionNotes(report.resolutionNotes || '');
    setActionType(report.status === 'pending' ? 'action_taken' : report.status);
    setSuspendUser(false);
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReport) return;

    setResolving(true);
    try {
      await adminAPI.updateReportStatus(selectedReport._id, {
        status: actionType,
        resolutionNotes,
        action: suspendUser ? 'suspend_user' : 'none',
      });
      toast.success('Complaint status updated successfully');
      setSelectedReport(null);
      fetchReports();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update report status');
    } finally {
      setResolving(false);
    }
  };

  const handleDeleteReport = async (id) => {
    if (window.confirm('Are you sure you want to delete this report record?')) {
      try {
        await adminAPI.deleteReport(id);
        toast.success('Report record deleted');
        fetchReports();
      } catch (error) {
        toast.error('Failed to delete report');
      }
    }
  };

  const filteredReports = reports.filter((r) => {
    if (filter === 'pending') return r.status === 'pending';
    if (filter === 'action_taken') return r.status === 'action_taken';
    if (filter === 'dismissed') return r.status === 'dismissed';
    return true;
  });

  const pendingCount = reports.filter((r) => r.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <span>User Complaints & Safety Reports</span>
            {pendingCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                {pendingCount} Pending
              </span>
            )}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Review user-reported profiles, investigate safety issues, issue warnings or suspend accounts.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition ${filter === 'all' ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'}`}
          >
            All ({reports.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg transition ${filter === 'pending' ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 font-bold shadow-sm' : 'text-gray-600 dark:text-gray-400'}`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('action_taken')}
            className={`px-3 py-1.5 rounded-lg transition ${filter === 'action_taken' ? 'bg-white dark:bg-slate-700 text-green-600 dark:text-green-400 font-bold shadow-sm' : 'text-gray-600 dark:text-gray-400'}`}
          >
            Action Taken
          </button>
          <button
            onClick={() => setFilter('dismissed')}
            className={`px-3 py-1.5 rounded-lg transition ${filter === 'dismissed' ? 'bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300 shadow-sm' : 'text-gray-600 dark:text-gray-400'}`}
          >
            Dismissed
          </button>
        </div>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-2xl border border-gray-100 dark:border-slate-800">
          <ShieldAlert className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <h3 className="font-bold text-gray-900 dark:text-white mb-1">No Complaints Found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">There are no reports matching the selected filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredReports.map((report) => {
            const reporter = report.reporter || {};
            const reported = report.reportedUser || {};

            return (
              <div
                key={report._id}
                className={`glass-card p-5 rounded-2xl border transition ${
                  report.status === 'pending'
                    ? 'border-red-200 dark:border-red-900/50 bg-red-50/20 dark:bg-red-950/10'
                    : 'border-gray-100 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  {/* Reporter & Reported Info */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                    {/* Reporter */}
                    <div className="flex items-center space-x-3 bg-gray-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-gray-100 dark:border-slate-700/50 min-w-[200px]">
                      <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0">
                        {reporter.profileImageUrl ? (
                          <img src={reporter.profileImageUrl} alt={reporter.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="font-bold text-purple-600 dark:text-purple-300 text-xs">{(reporter.name || 'R').charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Reporter</span>
                        <h4 className="font-bold text-xs text-gray-900 dark:text-white">{reporter.name || 'User'}</h4>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">{reporter.email}</p>
                      </div>
                    </div>

                    <div className="hidden sm:block text-gray-300 font-bold">➔</div>

                    {/* Reported User */}
                    <div className="flex items-center space-x-3 bg-red-50/60 dark:bg-red-950/30 p-2.5 rounded-xl border border-red-100 dark:border-red-900/40 min-w-[220px]">
                      <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
                        {reported.profileImageUrl ? (
                          <img src={reported.profileImageUrl} alt={reported.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="font-bold text-red-600 dark:text-red-300 text-xs">{(reported.name || 'U').charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-red-500 block">Reported Account</span>
                        <h4 className="font-bold text-xs text-gray-900 dark:text-white">{reported.name || 'Reported User'}</h4>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">{reported.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Reason & Details */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 uppercase">
                        {report.reason}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                        report.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                        report.status === 'action_taken' ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' :
                        'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300'
                      }`}>
                        {report.status}
                      </span>
                    </div>

                    {report.details && (
                      <p className="text-xs text-gray-700 dark:text-gray-300 italic bg-gray-50 dark:bg-slate-800/40 p-2 rounded-lg border border-gray-100 dark:border-slate-800">
                        "{report.details}"
                      </p>
                    )}

                    <span className="text-[11px] text-gray-400 block pt-0.5">
                      Submitted: {new Date(report.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => handleOpenResolveModal(report)}
                      className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review / Resolve</span>
                    </button>
                    <button
                      onClick={() => handleDeleteReport(report._id)}
                      className="p-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 transition"
                      title="Delete Report"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-purple-50 dark:bg-purple-950/20">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span>Review & Resolve Complaint</span>
              </h3>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="p-6 space-y-4">
              <div className="space-y-2 text-xs">
                <p><strong>Reporter:</strong> {selectedReport.reporter?.name} ({selectedReport.reporter?.email})</p>
                <p><strong>Reported Account:</strong> <span className="text-red-600 dark:text-red-400 font-bold">{selectedReport.reportedUser?.name}</span> ({selectedReport.reportedUser?.email})</p>
                <p><strong>Reason:</strong> <span className="font-bold">{selectedReport.reason}</span></p>
                {selectedReport.details && <p className="p-2 bg-gray-50 dark:bg-slate-800 rounded-lg italic">"{selectedReport.details}"</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block">
                  Action Status *
                </label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-xs font-semibold"
                >
                  <option value="action_taken">Action Taken (Warning Issued / Suspended)</option>
                  <option value="reviewed">Reviewed (No Penalty Required)</option>
                  <option value="dismissed">Dismiss (Invalid / False Report)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block">
                  Resolution Notes / Internal Remarks
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Record investigation findings or notes for other admins..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-950/30 rounded-xl">
                <input
                  type="checkbox"
                  id="suspendUserCheckbox"
                  checked={suspendUser}
                  onChange={(e) => setSuspendUser(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                />
                <label htmlFor="suspendUserCheckbox" className="text-xs font-bold text-red-700 dark:text-red-400 cursor-pointer">
                  Immediately suspend reported user account ({selectedReport.reportedUser?.name})
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  disabled={resolving}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition disabled:opacity-50"
                >
                  {resolving ? 'Saving...' : 'Save Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReportsTab;
