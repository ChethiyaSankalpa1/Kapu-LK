import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { premiumAPI, walletAPI } from '../../services/api';
import { toast } from 'react-toastify';
import {
  CheckCircle, Upload, Building, Sparkles, Wallet, Clock,
  Copy, Check, ShieldCheck, Zap, AlertCircle, ArrowRight, Smartphone, RefreshCw
} from 'lucide-react';
import PremiumBadge from '../../components/ui/PremiumBadge';
import BackButton from '../../components/common/BackButton';

const PAYMENT_METHODS = [
  { id: 'bank_transfer', label: 'Bank Transfer', icon: Building },
  { id: 'ez_cash', label: 'eZ Cash', icon: Smartphone },
  { id: 'binance', label: 'Binance Pay', icon: Zap },
];

const BANK_ACCOUNTS = [
  {
    key: 'sampath',
    bankName: 'Sampath Bank',
    accountNumber: '110552360840',
    accountHolder: 'S. Kumarasinghe',
    branch: 'Wattegama',
    color: 'from-amber-500/10 to-orange-500/10 border-orange-200 dark:border-orange-800',
  },
  {
    key: 'hnb',
    bankName: 'Hatton National Bank (HNB)',
    accountNumber: '018021102658',
    accountHolder: 'S. Kumarasinghe',
    branch: 'Kandy',
    color: 'from-blue-500/10 to-indigo-500/10 border-blue-200 dark:border-blue-800',
  },
  {
    key: 'boc',
    bankName: 'Bank of Ceylon (BOC)',
    accountNumber: '00069058',
    accountHolder: 'R. Ratnayake',
    branch: 'Kandy',
    color: 'from-yellow-500/10 to-amber-500/10 border-yellow-200 dark:border-yellow-800',
  },
  {
    key: 'rdb',
    bankName: 'Regional Development Bank (RDB)',
    accountNumber: '409010110698',
    accountHolder: 'T. Dharmapriya',
    branch: 'Kandy',
    color: 'from-emerald-500/10 to-teal-500/10 border-emerald-200 dark:border-emerald-800',
  },
];

const PremiumPayment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, premiumStatus, refreshPremiumStatus } = useAuth();

  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [payingWithWallet, setPayingWithWallet] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [selectedBank, setSelectedBank] = useState('Sampath Bank');
  const [copiedField, setCopiedField] = useState(null);

  const [formData, setFormData] = useState({
    accountHolderName: user?.name || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    transactionReference: '',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [paymentSlip, setPaymentSlip] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await premiumAPI.getPlans();
      setPlans(res.data);
      if (res.data && res.data.length > 0) {
        // Query param badge check or default to Silver / most popular
        const params = new URLSearchParams(location.search);
        const planParam = params.get('plan');
        const defaultPlan = res.data.find(p => p.badge === planParam) ||
                            res.data.find(p => p.badge === 'silver') ||
                            res.data[0];
        setSelectedPlan(defaultPlan);
      }
    } catch (err) {
      toast.error('Failed to load premium plans');
    } finally {
      setLoadingPlans(false);
    }
  }, [location.search]);

  const fetchWallet = useCallback(async () => {
    try {
      const res = await walletAPI.getWallet();
      setWalletBalance(res.data?.balance || 0);
    } catch (err) {
      console.error('Failed to fetch wallet');
    }
  }, []);

  useEffect(() => {
    fetchPlans();
    fetchWallet();
  }, [fetchPlans, fetchWallet]);

  const handleCopy = (text, fieldKey) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    toast.info(`Copied to clipboard: ${text}`);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG, and WebP images are allowed');
      return;
    }

    setPaymentSlip(file);
    const reader = new FileReader();
    reader.onloadend = () => setSlipPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleWalletPurchase = async () => {
    if (!selectedPlan) return;
    if (walletBalance < selectedPlan.price) {
      toast.error(`Insufficient wallet balance. You have ${walletBalance} LKR, need ${selectedPlan.price} LKR.`);
      return;
    }

    setPayingWithWallet(true);
    try {
      const res = await premiumAPI.purchaseWithWallet({
        planId: selectedPlan._id,
        badge: selectedPlan.badge,
      });
      toast.success(res.data?.message || `🎉 ${selectedPlan.name} activated successfully! Enjoy premium features.`);
      await refreshPremiumStatus();
      await fetchWallet();
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to purchase premium with wallet');
    } finally {
      setPayingWithWallet(false);
    }
  };

  const handleSubmitManualPayment = async (e) => {
    e.preventDefault();
    if (!selectedPlan) {
      toast.error('Please select a premium plan');
      return;
    }

    if (!formData.transactionReference?.trim()) {
      toast.error('Please enter the Transaction / Reference ID');
      return;
    }

    if (!paymentSlip) {
      toast.error('Please attach your payment receipt or transfer slip');
      return;
    }

    if (!formData.phoneNumber || !/^\d+$/.test(formData.phoneNumber.replace(/\D/g, ''))) {
      toast.error('Please provide a valid numeric phone number');
      return;
    }

    setSubmitting(true);
    try {
      const bankTitle = paymentMethod === 'ez_cash'
        ? 'eZ Cash'
        : paymentMethod === 'binance'
        ? 'Binance'
        : selectedBank;

      const data = new FormData();
      data.append('bank', bankTitle);
      data.append('paymentMethod', paymentMethod);
      data.append('accountHolderName', formData.accountHolderName);
      data.append('email', formData.email);
      data.append('phoneNumber', formData.phoneNumber.replace(/\D/g, ''));
      data.append('transactionReference', formData.transactionReference.trim());
      data.append('paymentDate', formData.paymentDate);
      data.append('paymentAmount', selectedPlan.price);
      data.append('planId', selectedPlan._id);
      data.append('planBadge', selectedPlan.badge);
      data.append('paymentSlip', paymentSlip);
      if (formData.notes) data.append('notes', formData.notes);

      await premiumAPI.createPaymentRequest(data);
      toast.success('Payment slip submitted successfully! Admin will verify and activate your plan.');
      await refreshPremiumStatus();
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit payment request');
    } finally {
      setSubmitting(false);
    }
  };

  const daysRemaining = premiumStatus?.premiumExpiresAt
    ? Math.max(0, Math.ceil((new Date(premiumStatus.premiumExpiresAt) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/40 to-pink-50/40 dark:from-slate-950 dark:via-purple-950/20 dark:to-slate-900 pt-4 pb-24 sm:py-8">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        {/* Navigation bar */}
        <div className="flex items-center justify-between mb-6">
          <BackButton variant="ghost" label="Back" iconClassName="w-4 h-4" />

          <button
            onClick={() => navigate('/wallet')}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:border-purple-300 text-xs sm:text-sm font-bold text-slate-800 dark:text-white transition"
          >
            <Wallet className="w-4 h-4 text-pink-600 dark:text-pink-400" />
            <span>Wallet: <strong className="text-emerald-600 dark:text-emerald-400">{walletBalance} LKR</strong></span>
          </button>
        </div>

        {/* Active Premium Member Banner */}
        {premiumStatus?.isPremium && (
          <div className="glass-card mb-8 p-6 sm:p-8 rounded-3xl border-2 border-amber-300 dark:border-amber-700/60 bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 dark:from-amber-950/30 dark:to-yellow-950/20 shadow-lg">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-3xl shadow-md shrink-0">
                  👑
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-black tracking-widest uppercase text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50 px-2.5 py-0.5 rounded-full">
                      Active Subscription
                    </span>
                    <PremiumBadge plan={premiumStatus?.premiumPlan || 'gold'} size="sm" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                    You're a {premiumStatus?.premiumPlan?.toUpperCase() || 'PREMIUM'} Member
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2 mt-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>
                      {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Expires today'} (Valid until{' '}
                      <strong>
                        {new Date(premiumStatus.premiumExpiresAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </strong>)
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <a
                  href="#plans-section"
                  className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs sm:text-sm font-bold hover:shadow-md transition text-center"
                >
                  Extend / Upgrade Plan
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Pending Request Review Banner */}
        {premiumStatus?.pendingRequest && (
          <div className="glass-card mb-8 p-6 rounded-3xl border-2 border-blue-300 dark:border-blue-700/60 bg-blue-50/50 dark:bg-blue-950/30">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-blue-900 dark:text-blue-200 text-sm sm:text-base">
                  Payment Verification Pending
                </h3>
                <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 mt-0.5">
                  Your manual payment slip for <strong>{premiumStatus.pendingRequest.planBadge?.toUpperCase()} Plan (LKR {premiumStatus.pendingRequest.paymentAmount})</strong> has been submitted. Our team is verifying your payment. Once approved, your membership will activate automatically!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Page Hero Header */}
        <div id="plans-section" className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-pink-500/10 to-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold text-xs uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-pink-500" />
            <span>LoveLK Premium Memberships</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
            Unlock Full Matchmaking Power
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-base">
            Select the membership plan that best suits your journey. Activate instantly with Wallet or via Bank/eZ Cash/Binance.
          </p>
        </div>

        {/* 3 Modern Premium Plan Cards */}
        {loadingPlans ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-purple-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {plans.map((plan) => {
              const isSelected = selectedPlan?._id === plan._id;
              const badgeIcon = plan.badge === 'gold' ? '🥇' : plan.badge === 'silver' ? '🥈' : '🥉';
              return (
                <div
                  key={plan._id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`relative rounded-3xl p-6 sm:p-7 cursor-pointer transition-all duration-300 flex flex-col justify-between border-2 ${
                    isSelected
                      ? 'border-purple-500 bg-white dark:bg-slate-900 shadow-2xl shadow-purple-500/20 scale-[1.02]'
                      : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 hover:border-purple-300 dark:hover:border-purple-700'
                  }`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-extrabold text-[11px] px-4 py-1 rounded-full shadow-md uppercase tracking-wider">
                      MOST POPULAR
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl">{badgeIcon}</span>
                      <PremiumBadge plan={plan.badge} size="md" />
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 min-h-[32px]">
                      {plan.description}
                    </p>

                    <div className="mb-6 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                          LKR {plan.price.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-purple-600 dark:text-purple-400 block mt-0.5">
                        {plan.durationDays} Days Membership
                      </span>
                    </div>

                    <ul className="space-y-2.5 mb-6">
                      {plan.features?.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedPlan(plan)}
                    className={`w-full py-3.5 rounded-2xl font-bold transition flex items-center justify-center gap-2 text-xs sm:text-sm ${
                      isSelected
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600'
                    }`}
                  >
                    {isSelected ? '✓ Selected Plan' : 'Select Plan'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Selected Plan Payment Options Section */}
        {selectedPlan && (
          <div className="space-y-8">
            {/* 1. Instant Wallet Checkout */}
            <div className="glass-card p-6 sm:p-8 rounded-3xl border-2 border-purple-200 dark:border-purple-800/60 bg-gradient-to-r from-purple-50/50 via-white to-pink-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-purple-950/40 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      Instant Wallet Checkout
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Pay instantly using your available wallet balance for immediate 0-delay activation.
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-800 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase">Wallet Balance</p>
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{walletBalance} LKR</p>
                </div>
              </div>

              {walletBalance >= selectedPlan.price ? (
                <button
                  onClick={handleWalletPurchase}
                  disabled={payingWithWallet}
                  className="w-full py-4 rounded-2xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-xl shadow-emerald-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {payingWithWallet ? (
                    'Processing Purchase...'
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      <span>Pay LKR {selectedPlan.price.toLocaleString()} from Wallet (Instant Activation)</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="flex-1 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs sm:text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Insufficient Wallet Balance: You have <strong>{walletBalance} LKR</strong> (Need{' '}
                      <strong>{(selectedPlan.price - walletBalance).toLocaleString()} LKR</strong> more).
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/wallet')}
                    className="px-6 py-3.5 rounded-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-md text-xs sm:text-sm flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <span>➕ Top Up Wallet</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* 2. Manual Payment Methods (Bank Transfer / eZ Cash / Binance) */}
            <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building className="w-5 h-5 text-purple-600" />
                  <span>Or Pay via Direct Transfer</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Transfer <strong>LKR {selectedPlan.price.toLocaleString()}</strong> for <strong>{selectedPlan.name}</strong> and upload proof for admin approval.
                </p>
              </div>

              {/* Payment Method Selector Tabs */}
              <div className="grid grid-cols-3 gap-2.5 mb-6">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  const isCurrent = paymentMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`py-3 px-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition border-2 ${
                        isCurrent
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-purple-300'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{method.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Bank Transfer Selection & Account Details */}
              {paymentMethod === 'bank_transfer' && (
                <div className="space-y-4 mb-6">
                  {/* PROMINENT REMARK NOTICE */}
                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/60 flex items-center gap-2.5 text-xs sm:text-sm text-amber-900 dark:text-amber-200 font-bold">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>IMPORTANT: Add TOPUP as the transfer remark/reference for fast verification.</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {BANK_ACCOUNTS.map((bank) => (
                      <div
                        key={bank.key}
                        onClick={() => setSelectedBank(bank.bankName)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition relative ${
                          selectedBank === bank.bankName
                            ? 'border-purple-600 bg-purple-50/60 dark:bg-purple-950/30 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 hover:border-purple-300 bg-white dark:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">{bank.bankName}</span>
                          <span className="text-[11px] text-slate-400">Branch: {bank.branch}</span>
                        </div>

                        <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl mb-1.5">
                          <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-300">{bank.accountNumber}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(bank.accountNumber, `bank_acc_${bank.key}`);
                            }}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
                            title="Copy Account Number"
                          >
                            {copiedField === `bank_acc_${bank.key}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                          <span>Name: <strong>{bank.accountHolder}</strong></span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(bank.accountHolder, `bank_name_${bank.key}`);
                            }}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
                            title="Copy Name"
                          >
                            {copiedField === `bank_name_${bank.key}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* eZ Cash Account Details */}
              {paymentMethod === 'ez_cash' && (
                <div className="mb-6 p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">eZ Cash Direct Transfer</span>
                      <h4 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">0764134658</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Recipient: LoveLK Official • Remark: TOPUP</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy('0764134658', 'ez_cash')}
                      className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                    >
                      {copiedField === 'ez_cash' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedField === 'ez_cash' ? 'Copied Number!' : 'Copy eZ Cash Number'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Binance Transfer Account Details */}
              {paymentMethod === 'binance' && (
                <div className="mb-6 p-5 rounded-2xl bg-yellow-50 dark:bg-yellow-950/30 border-2 border-yellow-400 dark:border-yellow-700">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-yellow-700 dark:text-yellow-300">Binance Pay / UID</span>
                      <h4 className="text-xl font-black text-slate-900 dark:text-white mt-0.5 font-mono">520375906</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Supported: USDT / BUSD • Enter your username in remarks</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy('520375906', 'binance_id')}
                      className="px-4 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                    >
                      {copiedField === 'binance_id' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedField === 'binance_id' ? 'Copied Binance ID!' : 'Copy Binance Pay ID'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Manual Submission Form */}
              <form onSubmit={handleSubmitManualPayment} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Payer / Account Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.accountHolderName}
                      onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm"
                      placeholder="Name on bank slip or sender name"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Transaction Reference / Slip ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.transactionReference}
                      onChange={(e) => setFormData({ ...formData, transactionReference: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-mono"
                      placeholder="e.g. TXN987263 / Ref Number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm"
                      placeholder="07XXXXXXXX"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Payment Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.paymentDate}
                      onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm"
                    />
                  </div>
                </div>

                {/* Slip Upload & Live Preview */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Upload Payment Slip / Receipt Screenshot * (Max 5MB)
                  </label>
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-4 text-center hover:border-purple-400 transition bg-slate-50/50 dark:bg-slate-800/30">
                    <input
                      type="file"
                      id="premium-slip"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="premium-slip" className="cursor-pointer block">
                      {slipPreview ? (
                        <div className="flex flex-col items-center">
                          <img
                            src={slipPreview}
                            alt="Slip Preview"
                            className="max-h-48 rounded-xl shadow-md mb-2 object-contain"
                          />
                          <span className="text-xs text-purple-600 font-bold hover:underline">
                            Click to replace slip image
                          </span>
                        </div>
                      ) : (
                        <div className="py-4">
                          <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                          <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Click to attach screenshot or photo of bank slip
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1">Supports JPG, PNG, WebP up to 5MB</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-2xl font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition disabled:opacity-50 text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg"
                >
                  {submitting ? (
                    'Uploading & Submitting...'
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>Submit Payment Slip for Verification (LKR {selectedPlan.price.toLocaleString()})</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PremiumPayment;

