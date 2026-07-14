import React from 'react';
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

// Public Pages
import Home from './pages/public/Home';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// User Pages
import Dashboard from './pages/user/Dashboard';
import Profile from './pages/user/Profile';
import Users from './pages/user/Users';
import UserDetail from './pages/user/UserDetail';
import PremiumPayment from './pages/user/PremiumPayment';
import Conversation from './pages/user/Conversation';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';

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
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
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
              path="/conversation/:userId"
              element={
                <PrivateRoute>
                  <Conversation />
                </PrivateRoute>
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
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
