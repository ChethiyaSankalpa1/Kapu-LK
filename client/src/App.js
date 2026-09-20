import React, { Suspense, lazy, useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import GiftReceiveModal from './components/ui/GiftReceiveModal';
import AchievementUnlockModal from './components/ui/AchievementUnlockModal';
import WalletTopupModal from './components/ui/WalletTopupModal';
import { notificationAPI } from './services/api';

// Route Guards
import AdminRoute from './routes/AdminRoute';
import UserRoute from './routes/UserRoute';
import PrivateRoute from './routes/PrivateRoute';

// Layout
import Navbar from './components/common/Navbar';
import MobileBottomNav from './components/common/MobileBottomNav';
import PrivacyPolicyModal from './components/common/PrivacyPolicyModal';
import SupportChatbot from './components/common/SupportChatbot';
import AdRotatorModal from './components/ui/AdRotatorModal';
import MaintenanceScreen from './components/common/MaintenanceScreen';
import AdminMaintenanceBar from './components/admin/AdminMaintenanceBar';
import MaintenanceTestModeBanner from './components/common/MaintenanceTestModeBanner';
import Footer from './components/common/Footer';
import { maintenanceAPI } from './services/api';

// Resilient chunk loader that automatically recovers from deployment hash mismatches
const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('chunk_reload_attempted') || 'false'
    );

    try {
      const component = await componentImport();
      window.sessionStorage.setItem('chunk_reload_attempted', 'false');
      return component;
    } catch (error) {
      console.warn('Chunk loading failed, attempting recovery reload...', error);
      if (!pageHasAlreadyBeenForceRefreshed) {
        window.sessionStorage.setItem('chunk_reload_attempted', 'true');
        window.location.reload();
        return new Promise(() => {}); // Wait for browser to reload
      }
      throw error;
    }
  });

class ChunkErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Captured by ChunkErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900 text-center">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-100 dark:border-gray-700">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              ↻
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Update Available
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
              A new version of the app is available. Please reload to load the latest features.
            </p>
            <button
              onClick={() => {
                window.sessionStorage.removeItem('chunk_reload_attempted');
                window.location.reload();
              }}
              className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-purple-500/25 transition-all"
            >
              Refresh App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Lazy-loaded pages with automatic deployment retry
const Home = lazyWithRetry(() => import('./pages/public/Home'));
const PrivacyPolicy = lazyWithRetry(() => import('./pages/public/PrivacyPolicy'));

const Login = lazyWithRetry(() => import('./pages/auth/Login'));
const Register = lazyWithRetry(() => import('./pages/auth/Register'));
const VerifyEmail = lazyWithRetry(() => import('./pages/auth/VerifyEmail'));
const ForgotPassword = lazyWithRetry(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazyWithRetry(() => import('./pages/auth/ResetPassword'));

const Dashboard = lazyWithRetry(() => import('./pages/user/Dashboard'));
const Profile = lazyWithRetry(() => import('./pages/user/Profile'));
const Users = lazyWithRetry(() => import('./pages/user/Users'));
const UserDetail = lazyWithRetry(() => import('./pages/user/UserDetail'));
const PremiumPayment = lazyWithRetry(() => import('./pages/user/PremiumPayment'));
const Conversation = lazyWithRetry(() => import('./pages/user/Conversation'));
const ContactAdmin = lazyWithRetry(() => import('./pages/user/ContactAdmin'));
const Settings = lazyWithRetry(() => import('./pages/user/Settings'));
const Wallet = lazyWithRetry(() => import('./pages/user/Wallet'));
const Achievements = lazyWithRetry(() => import('./pages/user/Achievements'));
const ProfileVisitors = lazyWithRetry(() => import('./pages/user/ProfileVisitors'));
const Stories = lazyWithRetry(() => import('./pages/user/Stories'));
const EventsPage = lazyWithRetry(() => import('./pages/user/EventsPage'));
const GiftsPage = lazyWithRetry(() => import('./pages/user/GiftsPage'));
const ReferralsPage = lazyWithRetry(() => import('./pages/user/ReferralsPage'));
const ActivityPage = lazyWithRetry(() => import('./pages/user/ActivityPage'));
const BlogPage = lazyWithRetry(() => import('./pages/user/BlogPage'));

const AdminDashboard = lazyWithRetry(() => import('./pages/admin/AdminDashboard'));

// Global component to monitor real-time gifts and achievements
const GlobalRealtimeMonitor = () => {
  const { user, isAdmin } = useAuth();
  const [giftData, setGiftData] = useState(null);
  const [achievementData, setAchievementData] = useState(null);
  const [walletTopupData, setWalletTopupData] = useState(null);
  const seenNotifsRef = useRef(new Set());

  // Listen for local custom events
  useEffect(() => {
    const handleGiftEvent = (e) => {
      if (e.detail) setGiftData(e.detail);
    };

    const handleAchievementEvent = (e) => {
      if (e.detail) setAchievementData(e.detail);
    };

    window.addEventListener('gift_received_event', handleGiftEvent);
    window.addEventListener('achievement_unlocked_event', handleAchievementEvent);

    return () => {
      window.removeEventListener('gift_received_event', handleGiftEvent);
      window.removeEventListener('achievement_unlocked_event', handleAchievementEvent);
    };
  }, []);

  // Poll notifications for real-time gift & achievement alerts
  useEffect(() => {
    if (!user || isAdmin || !user.emailVerified) return;

    const checkNotifications = async () => {
      try {
        const res = await notificationAPI.getNotifications();
        const notifs = res.data || [];

        for (const notif of notifs) {
          // Only show if not seen AND not already read
          if (!seenNotifsRef.current.has(notif._id) && !notif.isRead) {
            seenNotifsRef.current.add(notif._id);

            if (notif.type === 'gift_received') {
              // Parse gift notification
              const sender = notif.relatedUser?.name || 'A Match';
              const match = notif.message?.match(/\((.*?)\)/);
              const giftStr = match ? match[1] : 'Gift 🎁';
              const parts = giftStr.split(' ');
              const emoji = parts[parts.length - 1] || '🎁';
              const name = parts.slice(0, parts.length - 1).join(' ') || giftStr;

              setGiftData({
                giftEmoji: emoji,
                giftName: name,
                senderName: sender,
                message: notif.message,
                pointsEarned: 10,
                isAnonymous: notif.message?.includes('Someone'),
                notificationId: notif._id,
              });
            } else if (notif.type === 'achievement') {
              const nameMatch = notif.message?.match(/"(.*?)"/);
              const title = nameMatch ? nameMatch[1] : 'New Achievement';
              const ptsMatch = notif.message?.match(/(\d+)\s*points/);
              const points = ptsMatch ? parseInt(ptsMatch[1], 10) : 50;

              setAchievementData({
                name: title,
                icon: '🏆',
                description: 'Awesome job! You just unlocked a new milestone.',
                points,
                notificationId: notif._id,
              });
            } else if (notif.type === 'wallet_topup') {
              const amountMatch = notif.message?.match(/Rs\. (\d+(?:,\d+)*)/);
              const amount = amountMatch ? amountMatch[1] : '0';

              setWalletTopupData({
                amount: amount,
                message: notif.message,
                notificationId: notif._id,
              });
            }
          }
        }
      } catch (err) {
        // Silent catch
      }
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 15000);
    return () => clearInterval(interval);
  }, [user, isAdmin]);

  return (
    <>
      <GiftReceiveModal
        isOpen={Boolean(giftData)}
        giftData={giftData}
        onClose={() => {
          setGiftData(null);
          if (giftData?.notificationId) {
            notificationAPI.markAsRead(giftData.notificationId).catch(() => {});
          }
        }}
      />
      <AchievementUnlockModal
        isOpen={Boolean(achievementData)}
        achievement={achievementData}
        onClose={() => {
          setAchievementData(null);
          if (achievementData?.notificationId) {
            notificationAPI.markAsRead(achievementData.notificationId).catch(() => {});
          }
        }}
      />
      <WalletTopupModal
        isOpen={Boolean(walletTopupData)}
        topupData={walletTopupData}
        onClose={() => {
          setWalletTopupData(null);
          if (walletTopupData?.notificationId) {
            notificationAPI.markAsRead(walletTopupData.notificationId).catch(() => {});
          }
        }}
      />
    </>
  );
};

const MaintenanceGate = ({ children }) => {
  const { user } = useAuth();
  const [maintenanceData, setMaintenanceData] = useState(null);

  const checkMaintenance = useCallback(async () => {
    try {
      const res = await maintenanceAPI.getStatus();
      if (res.data?.isActive) {
        setMaintenanceData(res.data);
      } else {
        setMaintenanceData(null);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    checkMaintenance();
    const interval = setInterval(checkMaintenance, 30000);

    const handleMaintenanceEvent = (e) => {
      if (e.detail?.maintenance !== undefined) {
        if (e.detail.maintenance === false || e.detail.isActive === false) {
          setMaintenanceData(null);
        } else {
          setMaintenanceData(e.detail);
        }
      }
    };

    window.addEventListener('kapu_maintenance_event', handleMaintenanceEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener('kapu_maintenance_event', handleMaintenanceEvent);
    };
  }, [checkMaintenance]);

  const isAdmin = (user?.role || '').toLowerCase() === 'admin';
  const isMaintenanceTester = Boolean(user?.isMaintenanceTesting || user?.isDemoAccount);
  const isDirectStaffPath = 
    typeof window !== 'undefined' && 
    (window.location.pathname === '/login' || window.location.pathname === '/admin');

  // If full maintenance is active and user is NOT an admin or authorized maintenance tester, display branded MaintenanceScreen
  if (maintenanceData?.isActive && maintenanceData?.scope === 'full' && !isAdmin && !isMaintenanceTester && !isDirectStaffPath) {
    return (
      <MaintenanceScreen 
        maintenanceData={maintenanceData} 
        onRetry={checkMaintenance} 
        onAdminLoginSuccess={checkMaintenance} 
      />
    );
  }

  return (
    <>
      {/* Floating banner when admin is testing in maintenance mode as demo user */}
      <MaintenanceTestModeBanner />

      {/* Global Top Admin Bar when maintenance is active and admin is logged in */}
      {maintenanceData?.isActive && isAdmin && (
        <AdminMaintenanceBar 
          maintenanceData={maintenanceData} 
          onEndMaintenance={async () => {
            setMaintenanceData(null);
            await checkMaintenance();
          }} 
        />
      )}
      {children}
    </>
  );
};

// Route-aware layout: hides the public footer on all /admin/* and /conversation/* full-screen chat pages
const AppLayout = ({ children }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isChatRoute = location.pathname.startsWith('/conversation') || location.pathname.startsWith('/messages');

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <MobileBottomNav />
      <GlobalRealtimeMonitor />
      <PrivacyPolicyModal />
      <SupportChatbot />
      <AdRotatorModal />
      <main className={`flex-1 ${isChatRoute ? 'pb-0' : 'pb-20 md:pb-0'}`}>
        {children}
      </main>
      {/* Public footer is hidden on admin pages and full-screen chat pages */}
      {!isAdminRoute && !isChatRoute && <Footer />}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <MaintenanceGate>
          <AppLayout>
            <ChunkErrorBoundary>
              <Suspense
                fallback={
                  <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-purple-500" />
                  </div>
                }
              >
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />

                {/* User Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <UserRoute>
                      <Dashboard />
                    </UserRoute>
                  }
                />
                <Route
                  path="/premium"
                  element={
                    <UserRoute>
                      <PremiumPayment />
                    </UserRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <UserRoute>
                      <Profile />
                    </UserRoute>
                  }
                />
                <Route
                  path="/users"
                  element={
                    <UserRoute>
                      <Users />
                    </UserRoute>
                  }
                />
                <Route
                  path="/browse"
                  element={
                    <UserRoute>
                      <Users />
                    </UserRoute>
                  }
                />
                <Route
                  path="/matches"
                  element={
                    <UserRoute>
                      <Users isMatchesOnly={true} />
                    </UserRoute>
                  }
                />
                <Route
                  path="/visitors"
                  element={
                    <UserRoute>
                      <ProfileVisitors />
                    </UserRoute>
                  }
                />
                <Route
                  path="/profile-visitors"
                  element={
                    <UserRoute>
                      <ProfileVisitors />
                    </UserRoute>
                  }
                />
                <Route
                  path="/activity"
                  element={
                    <UserRoute>
                      <ActivityPage />
                    </UserRoute>
                  }
                />
                <Route
                  path="/users/:id"
                  element={
                    <UserRoute>
                      <UserDetail />
                    </UserRoute>
                  }
                />
                <Route
                  path="/conversation"
                  element={
                    <PrivateRoute>
                      <Conversation />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/conversation/:userId"
                  element={
                    <PrivateRoute>
                      <Conversation />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/messages"
                  element={
                    <PrivateRoute>
                      <Conversation />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/messages/:userId"
                  element={
                    <PrivateRoute>
                      <Conversation />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/contact-admin"
                  element={
                    <UserRoute>
                      <ContactAdmin />
                    </UserRoute>
                  }
                />
                <Route
                  path="/stories"
                  element={
                    <UserRoute>
                      <Stories />
                    </UserRoute>
                  }
                />
                <Route
                  path="/events"
                  element={
                    <UserRoute>
                      <EventsPage />
                    </UserRoute>
                  }
                />
                <Route
                  path="/blogs"
                  element={
                    <UserRoute>
                      <BlogPage />
                    </UserRoute>
                  }
                />
                <Route
                  path="/blog"
                  element={
                    <UserRoute>
                      <BlogPage />
                    </UserRoute>
                  }
                />
                <Route
                  path="/gifts"
                  element={
                    <UserRoute>
                      <GiftsPage />
                    </UserRoute>
                  }
                />
                <Route
                  path="/referrals"
                  element={
                    <UserRoute>
                      <ReferralsPage />
                    </UserRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <UserRoute>
                      <Settings />
                    </UserRoute>
                  }
                />
                <Route
                  path="/wallet"
                  element={
                    <UserRoute>
                      <Wallet />
                    </UserRoute>
                  }
                />
                <Route
                  path="/achievements"
                  element={
                    <UserRoute>
                      <Achievements />
                    </UserRoute>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />
              </Routes>
              </Suspense>
            </ChunkErrorBoundary>
          </AppLayout>
          <ToastContainer
            position="top-right"
            autoClose={1800}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            toastClassName="kapu-toast"
            bodyClassName="kapu-toast-body"
            progressClassName="kapu-toast-progress"
            closeButton={false}
          />
        </MaintenanceGate>
      </Router>
    </AuthProvider>
  );
}

export default App;
