import React, { Suspense, lazy, useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

// Lazy-loaded pages
const Home = lazy(() => import('./pages/public/Home'));
const PrivacyPolicy = lazy(() => import('./pages/public/PrivacyPolicy'));

const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));

const Dashboard = lazy(() => import('./pages/user/Dashboard'));
const Profile = lazy(() => import('./pages/user/Profile'));
const Users = lazy(() => import('./pages/user/Users'));
const UserDetail = lazy(() => import('./pages/user/UserDetail'));
const PremiumPayment = lazy(() => import('./pages/user/PremiumPayment'));
const Conversation = lazy(() => import('./pages/user/Conversation'));
const ContactAdmin = lazy(() => import('./pages/user/ContactAdmin'));
const Settings = lazy(() => import('./pages/user/Settings'));
const Wallet = lazy(() => import('./pages/user/Wallet'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

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
    if (!user || isAdmin) return;

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

function App() {
  return (
    <AuthProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <div className="min-h-screen">
          <Navbar />
          <GlobalRealtimeMonitor />
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
                path="/contact-admin"
                element={
                  <UserRoute>
                    <ContactAdmin />
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
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
