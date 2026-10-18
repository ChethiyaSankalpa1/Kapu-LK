import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const UserRoute = ({ children }) => {
    const { user, isAdmin, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    // Block admins from user pages entirely
    if (isAdmin) {
        return <Navigate to="/admin" />;
    }

    // Enforce onboarding order: Terms → Email Verification → Profile → App
    //
    // Step 1 (Terms): The PrivacyPolicyModal renders as a full-screen overlay and
    // is suppressed only on /verify-email. It handles terms acceptance visually.
    // After the user accepts, it redirects them to /verify-email automatically.
    //
    // Block unverified users from all protected pages
    if (!user.emailVerified && location.pathname !== '/verify-email') {
        return <Navigate to="/verify-email" state={{ email: user.email }} replace />;
    }

    return children;
};

export default UserRoute;
