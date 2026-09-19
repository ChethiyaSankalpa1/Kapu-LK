import React, { useState } from 'react';
import { AlertTriangle, X, ShieldAlert, CheckCircle } from 'lucide-react';
import { messageAPI } from '../../services/api';
import { toast } from 'react-toastify';

const REPORT_REASONS = [
  { id: 'Inappropriate Content or Messages', label: 'Inappropriate Content or Messages' },
  { id: 'Harassment or Offensive Behavior', label: 'Harassment or Offensive Behavior' },
  { id: 'Fake Profile or Impersonation', label: 'Fake Profile or Impersonation' },
  { id: 'Scam, Fraud or Money Request', label: 'Scam, Fraud or Financial Demands' },
  { id: 'Inappropriate Photos or Bio', label: 'Inappropriate Photos or Bio' },
  { id: 'Other Safety Concern', label: 'Other Safety Concern' },
];

const ReportUserModal = ({ isOpen, onClose, reportedUser }) => {
  const [reason, setReason] = useState(REPORT_REASONS[0].id);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !reportedUser) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) {
      toast.error('Please select a reason for reporting');
      return;
    }

    setSubmitting(true);
    try {
      await messageAPI.reportUser({
        reportedUserId: reportedUser._id || reportedUser.id,
        reason,
        details,
      });
      setSubmitted(true);
      toast.success('Report submitted successfully. Our team will review this case.');
      setTimeout(() => {
        setSubmitted(false);
        setDetails('');
        onClose();
      }, 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-red-50/50 dark:bg-red-950/20">
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 font-bold">
            <ShieldAlert className="w-5 h-5" />
            <span>Report Profile</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto text-green-600 dark:text-green-400">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Report Received</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Thank you for keeping LoveLK safe. Our administrative safety team will review <strong>{reportedUser.name}</strong> promptly and take appropriate action.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-2xl">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0">
                {reportedUser.profileImageUrl ? (
                  <img
                    src={reportedUser.profileImageUrl}
                    alt={reportedUser.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="font-bold text-purple-600 dark:text-purple-400">
                    {(reportedUser.name || 'U').charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-900 dark:text-white">{reportedUser.name}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">Reporting user to platform admins</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block">
                Reason for Report *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                {REPORT_REASONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block">
                Additional Details (Optional)
              </label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Provide specific details or messages context to help admins investigate..."
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"
              />
            </div>

            <div className="flex items-center space-x-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>False or abusive reports may lead to account penalties.</span>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 transition flex items-center space-x-1.5 disabled:opacity-50"
              >
                {submitting ? (
                  <span>Submitting...</span>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4" />
                    <span>Submit Report</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReportUserModal;
