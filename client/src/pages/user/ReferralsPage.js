import React from 'react';
import { Users } from 'lucide-react';
import ReferralDashboard from '../../components/ui/ReferralDashboard';
import BackButton from '../../components/common/BackButton';

const ReferralsPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-4 pb-24 md:py-8 transition-colors duration-300">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="flex items-center gap-3 mb-6">
                    <BackButton label="Back" />
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                            <Users className="w-7 h-7 text-indigo-500" />
                            <span>Referral Program & Rewards</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            Invite your single friends and earn wallet credits, premium rewards, and bonus points
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-150 dark:border-gray-800 p-6 sm:p-8 shadow-xs">
                    <ReferralDashboard />
                </div>
            </div>
        </div>
    );
};

export default ReferralsPage;
