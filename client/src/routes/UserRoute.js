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
    // Step 2 (Email): Block unverified users from all protected pages.
    // /verify-email itself is a public route, so the guard only fires for
    // everything else, preventing a redirect loop.
    if (!user.emailVerified && location.pathname !== '/verify-email') {
        return <Navigate to="/verify-email" state={{ email: user.email }} replace />;
    }

    // Step 3: Profile completeness check — only after email is verified.
    const isProfileComplete = Boolean(
        user?.profileImageUrl &&
        user?.age &&
        user?.gender &&
        (user?.district || user?.location) &&
        (user?.education || '').length > 0 &&
        (user?.occupation || user?.workplace) &&
        (user?.maritalStatus || '').length > 0 &&
        (user?.religion || '').length > 0 &&
        (user?.bio || '').trim().length > 0 &&
        user?.partnerPreferences?.minAge &&
        user?.partnerPreferences?.maxAge &&
        (user?.partnerPreferences?.religion || '').length > 0 &&
        (user?.partnerPreferences?.district || '').length > 0 &&
        (user?.partnerPreferences?.education || '').length > 0 &&
        (user?.partnerPreferences?.maritalStatus || '').length > 0
    );

    if (!isProfileComplete && location.pathname !== '/profile') {
        return <Navigate to="/profile" state={{ reason: 'complete_profile' }} replace />;
    }

    return children;
};

export default UserRoute;
