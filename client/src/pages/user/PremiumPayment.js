import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { premiumAPI, walletAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { Crown, CreditCard, CheckCircle, ArrowLeft, Upload, Building, Banknote, Sparkles, Wallet, Shield } from 'lucide-react';
import PremiumBadge from '../../components/ui/PremiumBadge';

const PremiumPayment = () => {
  const navigate = useNavigate();
  const { user, premiumStatus, refreshPremiumStatus } = useAuth();

  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [payingWithWallet, setPayingWithWallet] = useState(false);

  const [formData, setFormData] = useState({
    bank: 'Hatton National Bank (HNB)',
    accountHolderName: '',
    email: user?.email || '',
    phoneNumber: '',
    paymentDate: new Date().toISOString().split('T')[0],
  });
  const [paymentSlip, setPaymentSlip] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const BANKS = [
    { name: 'Hatton National Bank (HNB)', account: '018021102658', branch: 'Kandy', holder: 'S. Kumarasinghe' },
    { name: 'Sampath Bank', account: 'Contact for details', branch: 'Wattegama', holder: 'S. Kumarasinghe' },
    { name: 'Bank of Ceylon (BOC)', account: '00069058', branch: 'Kandy', holder: 'R. Ratnayake' },
    { name: 'Regional Development Bank (RDB)', account: '409010110698', branch: 'Kandy', holder: 'T. Dharmapriya' },
  ];

  useEffect(() => {
    fetchPlans();
    fetchWallet();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await premiumAPI.getPlans();
      setPlans(res.data);
      if (res.data && res.data.length > 0) {
        // Default select Silver or middle plan
        const defaultPlan = res.data.find(p => p.badge === 'silver') || res.data[0];
        setSelectedPlan(defaultPlan);
      }
    } catch (err) {
      toast.error('Failed to load premium plans');
    } finally {
      setLoadingPlans(false);
    }
  };

  const fetchWallet = async () => {
    try {
      const res = await walletAPI.getWallet();
      setWalletBalance(res.data.balance || 0);
    } catch (err) {
      console.error('Failed to fetch wallet');
    }
  };

  const handleWalletPurchase = async () => {
    if (!selectedPlan) return;
    if (walletBalance < selectedPlan.price) {
      toast.error(`Insufficient wallet balance. You need ${selectedPlan.price} LKR.`);
      return;
    }

    setPayingWithWallet(true);
    try {
      await premiumAPI.purchaseWithWallet({
        planId: selectedPlan._id,
        badge: selectedPlan.badge,
      });
      toast.success(`🎉 ${selectedPlan.name} activated successfully! Enjoy premium features.`);
      await refreshPremiumStatus();
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to purchase premium');
    } finally {
      setPayingWithWallet(false);
    }
  };

  const handleSubmitBankSlip = async (e) => {
    e.preventDefault();
    if (!selectedPlan) {
      toast.error('Please select a premium plan');
      return;
    }
    if (!formData.bank) {
      toast.error('Please select a bank');
      return;
    }
    if (!paymentSlip) {
      toast.error('Please upload payment slip');
      return;
    }
    if (!/^\d+$/.test(formData.phoneNumber)) {
      toast.error('Phone number must contain only numbers');
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('bank', formData.bank);
      data.append('accountHolderName', formData.accountHolderName);
      data.append('email', formData.email);
      data.append('phoneNumber', formData.phoneNumber);
      data.append('paymentDate', formData.paymentDate);
      data.append('paymentAmount', selectedPlan.price);
      data.append('planId', selectedPlan._id);
      data.append('planBadge', selectedPlan.badge);
      data.append('paymentSlip', paymentSlip);

      await premiumAPI.createPaymentRequest(data);
      toast.success('Payment request submitted successfully! Admin will approve within 24 hours.');
      await refreshPremiumStatus();
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit payment request');
    } finally {
      setSubmitting(false);
    }
  };

  if (premiumStatus?.isPremium) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto glass-card text-center p-8 rounded-3xl border border-yellow-400/40">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center mx-auto mb-6 shadow-xl text-4xl">
            👑
          </div>
          <div className="mb-4">
            <PremiumBadge plan={premiumStatus?.premiumPlan || 'gold'} size="lg" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">
            You're an Active Premium Member!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
            Enjoy unlimited messaging, boosted visibility, priority matching, and exclusive badges across LoveLK.
          </p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (premiumStatus?.premiumRequested) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto glass-card text-center p-8 rounded-3xl">
          <CheckCircle className="w-20 h-20 text-blue-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-3">
            Payment Review Pending!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
            Your bank transfer slip is being verified by our admin team. Once approved, your Premium Plan will activate automatically!
          </p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 pt-6 pb-24 sm:py-12">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-6 hover:text-purple-600 dark:hover:text-purple-400 transition"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-semibold">Back to Dashboard</span>
      </button>

      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold text-xs uppercase tracking-wider mb-4">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <span>Choose Your Premium Experience</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
          Unlock Unlimited Connections
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg">
          Select the membership duration that best suits your matchmaking goals.
        </p>
      </div>

      {/* Modern 3-Tier Premium Plans */}
      {loadingPlans ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-purple-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
          {plans.map((plan) => {
            const isSelected = selectedPlan?._id === plan._id;
            const badgeIcon = plan.badge === 'gold' ? '🥇' : plan.badge === 'silver' ? '🥈' : '🥉';
            return (
              <div
                key={plan._id}
                onClick={() => setSelectedPlan(plan)}
                className={`relative rounded-3xl p-6 sm:p-8 cursor-pointer transition-all duration-300 flex flex-col justify-between border-2 ${
                  isSelected
                    ? 'border-purple-500 bg-white dark:bg-slate-900 shadow-2xl shadow-purple-500/20 scale-[1.02]'
                    : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 hover:border-purple-300 dark:hover:border-purple-700'
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-extrabold text-xs px-4 py-1 rounded-full shadow-md">
                    MOST POPULAR
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-3xl">{badgeIcon}</div>
                    <PremiumBadge plan={plan.badge} size="md" />
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 min-h-[32px]">
                    {plan.description}
                  </p>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                        LKR {plan.price}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                      Valid for {plan.durationDays} Days
                    </span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features?.map((feat, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPlan(plan)}
                  className={`w-full py-3.5 rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm ${
                    isSelected
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600'
                  }`}
                >
                  {isSelected ? 'Selected Plan' : 'Select Plan'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Plan Details & Payment Options */}
      {selectedPlan && (
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Instant Wallet Purchase Card */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-purple-200 dark:border-purple-800/50 bg-gradient-to-r from-purple-50/50 via-white to-pink-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-purple-950/40">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Instant Wallet Checkout
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Pay instantly using your wallet balance for immediate plan activation.
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Available Balance</p>
                <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{walletBalance} LKR</p>
              </div>
            </div>

            <button
              onClick={handleWalletPurchase}
              disabled={payingWithWallet || walletBalance < selectedPlan.price}
              className="w-full py-4 rounded-2xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-xl shadow-emerald-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2 text-base"
            >
              {payingWithWallet ? (
                'Processing Purchase...'
              ) : walletBalance < selectedPlan.price ? (
                `Need ${selectedPlan.price - walletBalance} LKR More in Wallet`
              ) : (
                `Pay LKR ${selectedPlan.price} from Wallet (Instant Activation)`
              )}
            </button>
          </div>

          {/* Bank Slip Upload Option */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Building className="w-6 h-6 text-purple-600" />
              <span>Or Pay via Bank Transfer</span>
            </h3>

            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Select Bank Account
                </label>
                <div className="space-y-3">
                  {BANKS.map((b, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFormData({ ...formData, bank: b.name })}
                      className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all ${
                        formData.bank === b.name
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-purple-300'
                      }`}
                    >
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{b.name}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Account: <span className="font-mono">{b.account}</span></p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Name: {b.holder}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Transfer Form */}
              <form onSubmit={handleSubmitBankSlip} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.accountHolderName}
                    onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                    placeholder="Full name on bank slip"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value.replace(/\D/g, '') })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                      placeholder="07XXXXXXXX"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Upload Bank Transfer Slip
                  </label>
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-4 text-center">
                    <input
                      type="file"
                      id="bank-slip"
                      accept="image/*"
                      onChange={(e) => setPaymentSlip(e.target.files[0])}
                      className="hidden"
                    />
                    <label htmlFor="bank-slip" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      {paymentSlip ? (
                        <p className="text-emerald-600 font-bold text-xs truncate">{paymentSlip.name}</p>
                      ) : (
                        <p className="text-xs text-slate-500">Click to attach image</p>
                      )}
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-2xl font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                >
                  {submitting ? 'Submitting Request...' : `Submit Payment Slip (LKR ${selectedPlan.price})`}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PremiumPayment;
