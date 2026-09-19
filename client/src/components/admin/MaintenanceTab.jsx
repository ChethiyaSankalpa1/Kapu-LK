import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, Shield, Clock, Power, 
  Sparkles, Bell, Users, Calendar, Save
} from 'lucide-react';
import { maintenanceAPI, adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const AVAILABLE_FEATURES = [
  { id: 'messaging', name: 'Private Messaging & Chat' },
  { id: 'payments', name: 'Payments, Wallet & Premium Upgrades' },
  { id: 'profile_edit', name: 'Profile Editing & Updates' },
  { id: 'rewards', name: 'Achievements & Points Redemptions' },
  { id: 'uploads', name: 'Photo & Document Uploads' },
];

const MaintenanceTab = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const handleStartMaintenanceTestMode = async () => {
    try {
      const res = await adminAPI.startMaintenanceTesting();
      if (res.data?.token) {
        login(res.data.token, res.data.user);
        toast.success('Switched to Maintenance Test Mode as Demo Account!');
        navigate('/browse');
      }
    } catch (err) {
      toast.error('Failed to enter Maintenance Test Mode');
    }
  };

  const [formData, setFormData] = useState({
    isActive: false,
    scope: 'full',
    affectedFeatures: [],
    title: { en: "We'll Be Back Soon!", si: 'අපි ළඟදීම නැවත පැමිණෙන්නෙමු!', ta: 'நாங்கள் விரைவில் திரும்புவோம்!' },
    message: {
      en: 'Kapu-LK is currently undergoing scheduled platform maintenance and security upgrades. Your account and personal data remain completely safe and protected.',
      si: 'Kapu-LK පද්ධතියේ නියමිත නඩත්තු කටයුතු සහ ආරක්ෂණ යාවත්කාලීන කිරීම් මේ වන විට සිදුකෙරේ. ඔබගේ ගිණුම සහ දත්ත සම්පූර්ණයෙන්ම ආරක්ෂිතයි.',
      ta: 'Kapu-LK தற்போது திட்டமிடப்பட்ட பராமரிப்பு மற்றும் பாதுகாப்பு மேம்பாடுகளை மேற்கொள்கிறது. உங்கள் கணக்கு மற்றும் தரவு முற்றிலும் பாதுகாப்பாக உள்ளன.',
    },
    reason: 'Routine performance optimization & security hardening',
    expectedCompletionAt: '',
    scheduledStartAt: '',
    scheduledEndAt: '',
    supportContact: 'support@kapu-lk.com',
    comingSoon: {
      enabled: false,
      featureName: { en: 'AI Matchmaker & Instant Horoscopes', si: 'AI සහකරු ගැලපුම් හා ක්ෂණික කේන්දර පරීක්ෂාව', ta: 'AI பொருத்தம் & உடனடி ஜாதக ஆய்வு' },
      description: {
        en: 'Exciting new intelligent compatibility scoring and Sri Lankan astrological compatibility insights are launching soon!',
        si: 'නව බුද්ධිමත් ගැලපුම් ලකුණු සහ ශ්‍රී ලාංකීය ජ්‍යොතිෂ්‍ය ගැලපීම් පහසුකම් ළඟදීම!',
        ta: 'புதிய புத்திசாலித்தனமான பொருத்தம் மற்றும் ஜோதிட பகுப்பாய்வு வசதிகள் விரைவில் வரவுள்ளன!',
      },
      icon: 'Sparkles',
      launchDate: '',
      subscribedEmails: [],
    },
  });

  const [auditLog, setAuditLog] = useState([]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await maintenanceAPI.getAdminConfig();
      if (res.data?.config) {
        const c = res.data.config;
        setFormData({
          isActive: Boolean(c.isActive),
          scope: c.scope || 'full',
          affectedFeatures: c.affectedFeatures || [],
          title: c.title || { en: '', si: '', ta: '' },
          message: c.message || { en: '', si: '', ta: '' },
          reason: c.reason || '',
          expectedCompletionAt: c.expectedCompletionAt ? new Date(c.expectedCompletionAt).toISOString().slice(0, 16) : '',
          scheduledStartAt: c.scheduledStartAt ? new Date(c.scheduledStartAt).toISOString().slice(0, 16) : '',
          scheduledEndAt: c.scheduledEndAt ? new Date(c.scheduledEndAt).toISOString().slice(0, 16) : '',
          supportContact: c.supportContact || '',
          comingSoon: {
            enabled: Boolean(c.comingSoon?.enabled),
            featureName: c.comingSoon?.featureName || { en: '', si: '', ta: '' },
            description: c.comingSoon?.description || { en: '', si: '', ta: '' },
            icon: c.comingSoon?.icon || 'Sparkles',
            launchDate: c.comingSoon?.launchDate ? new Date(c.comingSoon.launchDate).toISOString().slice(0, 16) : '',
            subscribedEmails: c.comingSoon?.subscribedEmails || [],
          },
        });
        setAuditLog(c.auditLog || []);
      }
    } catch (err) {
      toast.error('Failed to load maintenance configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleToggleFeature = (featureId) => {
    setFormData((prev) => {
      const exists = prev.affectedFeatures.includes(featureId);
      return {
        ...prev,
        affectedFeatures: exists
          ? prev.affectedFeatures.filter((f) => f !== featureId)
          : [...prev.affectedFeatures, featureId],
      };
    });
  };

  const saveSettings = async (overrideData = {}) => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        ...overrideData,
        expectedCompletionAt: (overrideData.expectedCompletionAt !== undefined ? overrideData.expectedCompletionAt : formData.expectedCompletionAt) ? new Date(overrideData.expectedCompletionAt || formData.expectedCompletionAt) : null,
        scheduledStartAt: (overrideData.scheduledStartAt !== undefined ? overrideData.scheduledStartAt : formData.scheduledStartAt) ? new Date(overrideData.scheduledStartAt || formData.scheduledStartAt) : null,
        scheduledEndAt: (overrideData.scheduledEndAt !== undefined ? overrideData.scheduledEndAt : formData.scheduledEndAt) ? new Date(overrideData.scheduledEndAt || formData.scheduledEndAt) : null,
        comingSoon: {
          ...formData.comingSoon,
          launchDate: formData.comingSoon.launchDate ? new Date(formData.comingSoon.launchDate) : null,
        },
      };

      const res = await maintenanceAPI.updateAdminConfig(payload);
      toast.success(res.data?.message || 'Maintenance settings updated successfully!');
      fetchConfig();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save maintenance settings');
    } finally {
      setSaving(false);
      setShowConfirmModal(false);
      setPendingAction(null);
    }
  };

  const handleToggleMasterSwitch = () => {
    if (!formData.isActive) {
      // Enabling maintenance requires confirmation!
      setPendingAction({ isActive: true });
      setShowConfirmModal(true);
    } else {
      // Disabling can be done directly or through endMaintenanceNow
      saveSettings({ isActive: false });
    }
  };

  const handleEndMaintenanceNow = async () => {
    setSaving(true);
    try {
      const res = await maintenanceAPI.endMaintenanceNow();
      toast.success(res.data?.message || 'Maintenance ended immediately.');
      fetchConfig();
    } catch (err) {
      toast.error('Failed to end maintenance mode');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Status Banner */}
      <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm transition ${
        formData.isActive
          ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/60'
          : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            formData.isActive
              ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
              : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'
          }`}>
            <Power className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Maintenance Mode: {formData.isActive ? 'ACTIVE' : 'INACTIVE'}
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                formData.isActive
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-emerald-600 text-white'
              }`}>
                {formData.isActive ? `${formData.scope} Mode` : 'Normal Operations'}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
              {formData.isActive
                ? `Active for non-admin users. Administrators retain full access.`
                : 'All platform features and user endpoints are fully operational.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleStartMaintenanceTestMode}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-md flex items-center space-x-1.5"
            title="Securely switch session to demo tester account to preview client-side updates during maintenance"
          >
            <Sparkles className="w-4 h-4" />
            <span>Test Site in Maintenance Mode</span>
          </button>

          {formData.isActive && (
            <button
              type="button"
              onClick={handleEndMaintenanceNow}
              disabled={saving}
              className="px-4 py-2.5 bg-gray-900 hover:bg-black dark:bg-gray-700 dark:hover:bg-gray-600 text-white text-xs font-bold rounded-xl transition shadow-sm"
            >
              End Maintenance Now
            </button>
          )}

          <button
            type="button"
            onClick={handleToggleMasterSwitch}
            disabled={saving}
            className={`px-5 py-2.5 font-bold text-xs sm:text-sm rounded-xl transition shadow flex items-center gap-2 ${
              formData.isActive
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{formData.isActive ? 'Turn Off Maintenance' : 'Activate Maintenance Mode'}</span>
          </button>
        </div>
      </div>

      {/* Configuration Form */}
      <form onSubmit={(e) => { e.preventDefault(); saveSettings(); }} className="space-y-6">
        
        {/* Scope Selection Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6 shadow-sm space-y-4">
          <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            1. Scope & Impacted Features
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 ${
              formData.scope === 'full'
                ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
            }`}>
              <input
                type="radio"
                name="scope"
                value="full"
                checked={formData.scope === 'full'}
                onChange={() => setFormData(prev => ({ ...prev, scope: 'full' }))}
                className="mt-1 text-purple-600 focus:ring-purple-500"
              />
              <div>
                <span className="font-bold text-sm text-gray-900 dark:text-white block">Full-Site Maintenance</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 block">
                  All user-facing routes redirect to the branded "We'll Be Back Soon" countdown screen.
                </span>
              </div>
            </label>

            <label className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 ${
              formData.scope === 'feature_specific'
                ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
            }`}>
              <input
                type="radio"
                name="scope"
                value="feature_specific"
                checked={formData.scope === 'feature_specific'}
                onChange={() => setFormData(prev => ({ ...prev, scope: 'feature_specific' }))}
                className="mt-1 text-purple-600 focus:ring-purple-500"
              />
              <div>
                <span className="font-bold text-sm text-gray-900 dark:text-white block">Feature-Specific Maintenance</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 block">
                  Only selected features are disabled; general browsing and unaffected areas continue working.
                </span>
              </div>
            </label>
          </div>

          {/* Feature Checkboxes (if feature_specific) */}
          {formData.scope === 'feature_specific' && (
            <div className="p-4 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-700 rounded-xl space-y-3">
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Select features to disable:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {AVAILABLE_FEATURES.map((feat) => {
                  const checked = formData.affectedFeatures.includes(feat.id);
                  return (
                    <label key={feat.id} className="flex items-center gap-2.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleFeature(feat.id)}
                        className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span>{feat.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Messaging & Reason Card (Multilingual) */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6 shadow-sm space-y-4">
          <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600" />
            2. Screen Headings & Explanations (Multilingual)
          </h4>

          {/* English */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
              English (EN)
            </label>
            <input
              type="text"
              value={formData.title.en}
              onChange={(e) => setFormData(prev => ({ ...prev, title: { ...prev.title, en: e.target.value } }))}
              placeholder="Title (e.g. We'll Be Back Soon!)"
              className="w-full px-3.5 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 mb-2"
            />
            <textarea
              rows={2}
              value={formData.message.en}
              onChange={(e) => setFormData(prev => ({ ...prev, message: { ...prev.message, en: e.target.value } }))}
              placeholder="English message description"
              className="w-full px-3.5 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Sinhala */}
          <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
              සිංහල (Sinhala - SI)
            </label>
            <input
              type="text"
              value={formData.title.si}
              onChange={(e) => setFormData(prev => ({ ...prev, title: { ...prev.title, si: e.target.value } }))}
              placeholder="ශීර්ෂ පාඨය"
              className="w-full px-3.5 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 mb-2"
            />
            <textarea
              rows={2}
              value={formData.message.si}
              onChange={(e) => setFormData(prev => ({ ...prev, message: { ...prev.message, si: e.target.value } }))}
              placeholder="විස්තරය"
              className="w-full px-3.5 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Tamil */}
          <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
              தமிழ் (Tamil - TA)
            </label>
            <input
              type="text"
              value={formData.title.ta}
              onChange={(e) => setFormData(prev => ({ ...prev, title: { ...prev.title, ta: e.target.value } }))}
              placeholder="தலைப்பு"
              className="w-full px-3.5 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 mb-2"
            />
            <textarea
              rows={2}
              value={formData.message.ta}
              onChange={(e) => setFormData(prev => ({ ...prev, message: { ...prev.message, ta: e.target.value } }))}
              placeholder="விளக்கம்"
              className="w-full px-3.5 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Reason & Support Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Internal Maintenance Reason
              </label>
              <input
                type="text"
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="e.g. Database schema migration"
                className="w-full px-3.5 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Support / Emergency Contact
              </label>
              <input
                type="text"
                value={formData.supportContact}
                onChange={(e) => setFormData(prev => ({ ...prev, supportContact: e.target.value }))}
                placeholder="support@kapu-lk.com"
                className="w-full px-3.5 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Schedule & Timing Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6 shadow-sm space-y-4">
          <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            3. Timing, Countdown & Auto-Schedules
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Expected Return Time (Countdown)
              </label>
              <input
                type="datetime-local"
                value={formData.expectedCompletionAt}
                onChange={(e) => setFormData(prev => ({ ...prev, expectedCompletionAt: e.target.value }))}
                className="w-full px-3.5 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Auto-Start Schedule (Optional)
              </label>
              <input
                type="datetime-local"
                value={formData.scheduledStartAt}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduledStartAt: e.target.value }))}
                className="w-full px-3.5 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Auto-End Schedule (Optional)
              </label>
              <input
                type="datetime-local"
                value={formData.scheduledEndAt}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduledEndAt: e.target.value }))}
                className="w-full px-3.5 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Coming Soon Announcement Builder */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-600" />
              4. "Coming Soon / Under Construction" Teaser
            </h4>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.comingSoon.enabled}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  comingSoon: { ...prev.comingSoon, enabled: e.target.checked }
                }))}
                className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
              />
              <span>Display Teaser on Maintenance Screen</span>
            </label>
          </div>

          {formData.comingSoon.enabled && (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Feature Name (EN)</label>
                  <input
                    type="text"
                    value={formData.comingSoon.featureName.en}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      comingSoon: { ...prev.comingSoon, featureName: { ...prev.comingSoon.featureName, en: e.target.value } }
                    }))}
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Target Launch Date</label>
                  <input
                    type="datetime-local"
                    value={formData.comingSoon.launchDate}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      comingSoon: { ...prev.comingSoon, launchDate: e.target.value }
                    }))}
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Feature Description (EN)</label>
                <textarea
                  rows={2}
                  value={formData.comingSoon.description.en}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    comingSoon: { ...prev.comingSoon, description: { ...prev.comingSoon.description, en: e.target.value } }
                  }))}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl"
                />
              </div>

              <div className="p-3 bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800/40 rounded-xl text-xs flex items-center justify-between text-pink-900 dark:text-pink-200 font-medium">
                <span className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-pink-600" />
                  Total Early Access Subscribers:
                </span>
                <span className="font-bold text-sm bg-white dark:bg-gray-800 px-3 py-1 rounded-lg border border-pink-200 dark:border-pink-800">
                  {formData.comingSoon.subscribedEmails?.length || 0} users
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Save Changes Button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-xl transition shadow-md flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving Settings...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Maintenance Configuration</span>
              </>
            )}
          </button>
        </div>

      </form>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6 shadow-sm space-y-4">
        <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-600" />
          Maintenance Audit Trail (Last 50 Events)
        </h4>

        {auditLog.length === 0 ? (
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
            No maintenance events recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-gray-700 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-750 text-gray-900 dark:text-white font-semibold uppercase text-[11px] tracking-wider border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Admin</th>
                  <th className="py-2.5 px-3">Details / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {auditLog.map((log, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-750/50">
                    <td className="py-2.5 px-3 whitespace-nowrap text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        log.action.includes('ENABLED')
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                      {log.adminEmail || 'Admin'}
                    </td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">
                      {log.details || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal before activating maintenance */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-200 dark:border-red-800 space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-7 h-7" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Confirm Maintenance Activation
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Are you sure you want to activate <strong>{formData.scope === 'full' ? 'Full-Site' : 'Feature-Specific'}</strong> maintenance?
              {formData.scope === 'full' && ' Non-admin users will immediately see the maintenance screen.'}
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowConfirmModal(false); setPendingAction(null); }}
                className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => saveSettings(pendingAction || { isActive: true })}
                disabled={saving}
                className="px-5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow"
              >
                Confirm & Activate
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MaintenanceTab;
