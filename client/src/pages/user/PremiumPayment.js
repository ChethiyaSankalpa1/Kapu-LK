import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { premiumAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { Crown, CreditCard, CheckCircle, ArrowLeft, Upload, Building, Banknote } from 'lucide-react';

const PremiumPayment = () => {
    const navigate = useNavigate();
    const { user, premiumStatus, refreshPremiumStatus, refreshUser } = useAuth();

    const [formData, setFormData] = useState({
        bank: '',
        accountHolderName: '',
        email: user?.email || '',
        phoneNumber: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentAmount: '500',
    });
    const [paymentSlip, setPaymentSlip] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const canViewBankDetails = Boolean(user?.isApproved || user?.role === 'admin');

    const BANKS = [
        { name: 'Hatton National Bank (HNB)', account: '018021102658', branch: 'Kandy', holder: 'S. Kumarasinghe' },
        { name: 'Sampath Bank', account: 'Contact for details', branch: 'Wattegama', holder: 'S. Kumarasinghe' },
        { name: 'Bank of Ceylon (BOC)', account: '00069058', branch: 'Kandy', holder: 'R. Ratnayake' },
        { name: 'Regional Development Bank (RDB)', account: '409010110698', branch: 'Kandy', holder: 'T. Dharmapriya' },
    ];

    useEffect(() => {
        if (canViewBankDetails) {
            return undefined;
        }

        refreshUser();

        const intervalId = setInterval(() => {
            refreshUser();
        }, 15000);

        return () => clearInterval(intervalId);
    }, [canViewBankDetails, refreshUser]);

    const handleSubmit = async (e) => {
        e.preventDefault();
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
            const formDataToSend = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                formDataToSend.append(key, value);
            });
            formDataToSend.append('paymentSlip', paymentSlip);

            await premiumAPI.createPaymentRequest(formDataToSend);
            toast.success('Payment request submitted successfully! Waiting for admin approval.');
            await refreshPremiumStatus();
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit payment');
        } finally {
            setSubmitting(false);
        }
    };

    if (premiumStatus?.isPremium) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-2xl mx-auto glass-card text-center">
                    <Crown className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
                        You're Already Premium!
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-8">
                        Enjoy all premium features including unlimited messaging.
                    </p>
                    <button onClick={() => navigate('/dashboard')} className="btn-primary">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (premiumStatus?.premiumRequested) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-2xl mx-auto glass-card text-center">
                    <CheckCircle className="w-20 h-20 text-blue-500 mx-auto mb-6" />
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
                        Request Pending!
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-8">
                        Your payment is being reviewed by our admin team. Once approved, you'll get premium access!
                    </p>
                    <button onClick={() => navigate('/dashboard')} className="btn-primary">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const selectedBank = BANKS.find(b => b.name === formData.bank);

    return (
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-12">
            <button onClick={() => navigate('/dashboard')} className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 mb-5 sm:mb-8 hover:text-purple-600 dark:hover:text-purple-400 transition">
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Dashboard</span>
            </button>

            <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-5 sm:gap-8">
                {/* Bank Details */}
                <div className="space-y-6">
                    <div className="glass-card">
                        <div className="flex items-center space-x-3 mb-6">
                            <Crown className="w-8 h-8 text-yellow-500" />
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                                Premium Membership
                            </h2>
                        </div>

                        <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 mb-2">
                            LKR 500
                        </p>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            One-time payment for lifetime access
                        </p>

                        <ul className="space-y-3 mb-8">
                            {['Unlimited Messaging', 'Unlimited Likes', 'Profile Boost', 'Premium Badge', 'Advanced Filters', 'Profile Viewers'].map((benefit, i) => (
                                <li key={i} className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <span>{benefit}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="glass-card">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center space-x-2">
                            <Building className="w-6 h-6" />
                            <span>Select a Bank</span>
                        </h3>
                        <div className="space-y-3">
                            {BANKS.map((bank, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    disabled={!canViewBankDetails}
                                    onClick={() => setFormData({ ...formData, bank: bank.name })}
                                    className={`w-full text-left p-4 rounded-xl border-2 transition-all relative overflow-hidden ${formData.bank === bank.name
                                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                                        } ${!canViewBankDetails ? 'cursor-not-allowed' : ''}`}
                                >
                                    <div className={!canViewBankDetails ? 'blur-sm select-none' : ''}>
                                        <p className="font-bold text-gray-800 dark:text-white">{bank.name}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Account: {bank.account}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Branch: {bank.branch}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Name: {bank.holder}</p>
                                    </div>
                                    {!canViewBankDetails && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-gray-900/60 text-center px-4">
                                            <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                                Account approval required to view bank details
                                            </p>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {selectedBank && (
                        <div className="glass-card border-2 border-green-300 dark:border-green-700">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center space-x-2">
                                <Banknote className="w-5 h-5 text-green-600" />
                                <span>Transfer Details</span>
                            </h3>
                            <p className="text-gray-700 dark:text-gray-300">
                                Please transfer <span className="font-bold text-purple-600 dark:text-purple-400">LKR 500</span> to the selected bank account.
                            </p>
                        </div>
                    )}
                </div>

                {/* Payment Form */}
                <div className="glass-card">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center space-x-2">
                        <CreditCard className="w-6 h-6" />
                        <span>Submit Payment Details</span>
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Account Holder Name
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.accountHolderName}
                                onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500"
                                placeholder="Your name as per bank"
                            />
                        </div>

                        <div className="grid grid-cols-1 min-[440px]:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500"
                                    placeholder="your@email.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value.replace(/\D/g, '') })}
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500"
                                    placeholder="07XXXXXXXX"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 min-[440px]:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Payment Date
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.paymentDate}
                                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Amount (LKR)
                                </label>
                                <input
                                    type="number"
                                    required
                                    value={formData.paymentAmount}
                                    readOnly
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-600 text-gray-800 dark:text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Upload Payment Slip
                            </label>
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-5 sm:p-6 text-center">
                                <input
                                    type="file"
                                    id="slip"
                                    accept="image/*,.pdf"
                                    onChange={(e) => setPaymentSlip(e.target.files[0])}
                                    className="hidden"
                                />
                                <label htmlFor="slip" className="cursor-pointer">
                                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    {paymentSlip ? (
                                        <p className="text-green-600 font-medium">{paymentSlip.name}</p>
                                    ) : (
                                        <p className="text-gray-500">Click to upload slip</p>
                                    )}
                                </label>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!formData.bank || submitting || !canViewBankDetails}
                            className="w-full btn-primary flex items-center justify-center space-x-2"
                        >
                            {submitting ? (
                                <span>Submitting...</span>
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    <span>Submit Payment Request</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PremiumPayment;
