import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Toaster } from 'react-hot-toast';
import { Modal, Button } from 'react-bootstrap';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Import pages
import LandingPage from './pages/LandingPage';
import IntroPage from './pages/IntroPage';
import SchemaPage from './pages/SchemaPage';
import EndpointsPage from './pages/EndpointsPage';
import DashboardPage from './pages/DashboardPage';
import LogsDashboardPage from './pages/LogsDashboardPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentErrorPage from './pages/PaymentErrorPage';
import PaymentCallbackPage from './pages/PaymentCallbackPage';
import PrivacyPage from './pages/PrivacyPage';
import AccountSettingsPage from './pages/AccountSettingsPage';
import PaymentDemoPage from './pages/PaymentDemoPage';
import UsageLimitsPage from './pages/UsageLimitsPage';
import AdminUsagePage from './pages/AdminUsagePage';

// Import components
import NavBar from './components/layout/NavBar';
import { AuthProvider } from './components/auth/AuthContext';
import { useAuth } from './components/auth/AuthContext';
import RequireAuth from './components/auth/RequireAuth';
import AuthPage from './pages/auth/AuthPage';

function App() {
  const [showMobileWarning, setShowMobileWarning] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem('dismissMobileWarning') === 'true';
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileUa = /Mobi|Android|iPhone|iPod/i.test(userAgent);
      const isSmallTouch = (window.innerWidth <= 768 && (('ontouchstart' in window) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0)));
      if (!dismissed && (isMobileUa || isSmallTouch)) {
        setShowMobileWarning(true);
      }
    } catch (e) {
      // no-op: do not block rendering if detection fails
    }
  }, []);

  const handleDismissMobileWarning = () => {
    try { localStorage.setItem('dismissMobileWarning', 'true'); } catch (e) {}
    setShowMobileWarning(false);
  };

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID"}>
      <AuthProvider>
        <Router>
          <AppRoutes />
          <Modal show={showMobileWarning} onHide={handleDismissMobileWarning} centered>
            <Modal.Header closeButton>
              <Modal.Title style={{ color: 'white' }}>Best Experience on Desktop</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ color: 'white' }}>
              Backlify may not be fully optimized for mobile devices yet. For the best experience, please use a desktop or laptop computer. A dedicated mobile app is coming soon. You can continue on your phone if you prefer, but some features may be limited or feel less responsive.
            </Modal.Body>
            <Modal.Footer>
              <Button variant="primary" onClick={handleDismissMobileWarning}>
                Continue anyway
              </Button>
            </Modal.Footer>
          </Modal>
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: '#363636',
                color: '#fff',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)'
              },
            }}
          />
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

// Component that contains routes and conditionally renders NavBar
function AppRoutes() {
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <>
      {isAuthenticated() && location.pathname === '/landing' && <NavBar />}
      <Routes>
        <Route path="/" element={isAuthenticated() ? <Navigate to="/landing" replace /> : <IntroPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/login" element={isAuthenticated() ? <Navigate to="/landing" replace /> : <AuthPage />} />
        <Route path="/register" element={isAuthenticated() ? <Navigate to="/landing" replace /> : <AuthPage />} />
        <Route path="/dashboard" element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        } />
        <Route path="/schema" element={
          <RequireAuth>
            <SchemaPage />
          </RequireAuth>
        } />
        <Route path="/endpoints" element={
          <RequireAuth>
            <EndpointsPage />
          </RequireAuth>
        } />
        <Route path="/logs" element={
          <RequireAuth>
            <LogsDashboardPage />
          </RequireAuth>
        } />
        {/* Payment Routes */}
        <Route path="/payment/plans" element={
          <RequireAuth>
            <PaymentDemoPage />
          </RequireAuth>
        } />
        <Route path="/payment/upgrade" element={
          <RequireAuth>
            <PaymentDemoPage />
          </RequireAuth>
        } />
        <Route path="/payment/success" element={
          <RequireAuth>
            <PaymentSuccessPage />
          </RequireAuth>
        } />
        <Route path="/payment/error" element={
          <RequireAuth>
            <PaymentErrorPage />
          </RequireAuth>
        } />
        <Route path="/payment/callback" element={
          <RequireAuth>
            <PaymentCallbackPage />
          </RequireAuth>
        } />
        
        {/* Account Management Routes */}
        <Route path="/account" element={
          <RequireAuth>
            <AccountSettingsPage />
          </RequireAuth>
        } />
        <Route path="/account/subscription" element={
          <RequireAuth>
            <AccountSettingsPage />
          </RequireAuth>
        } />
        <Route path="/account/billing" element={
          <RequireAuth>
            <AccountSettingsPage />
          </RequireAuth>
        } />
        
        {/* Usage Limits Routes */}
        <Route path="/usage" element={
          <RequireAuth>
            <UsageLimitsPage />
          </RequireAuth>
        } />
        <Route path="/admin/usage" element={
          <RequireAuth>
            <AdminUsagePage />
          </RequireAuth>
        } />
        
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="*" element={<Navigate to={isAuthenticated() ? "/landing" : "/"} replace />} />
      </Routes>
    </>
  );
}

export default App;
