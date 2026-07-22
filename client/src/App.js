import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Route Guards
import AdminRoute from './routes/AdminRoute';
import UserRoute from './routes/UserRoute';
import PrivateRoute from './routes/PrivateRoute';

// Layout
import Navbar from './components/common/Navbar';

// Lazy-loaded pages (reduces initial bundle size)
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

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

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
            autoClose={1500}
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
