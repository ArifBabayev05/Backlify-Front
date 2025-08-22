import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Toaster } from 'react-hot-toast';
import { Modal, Button } from 'react-bootstrap';

// Import pages
import LandingPage from './pages/LandingPage';
import IntroPage from './pages/IntroPage';
import SchemaPage from './pages/SchemaPage';
import EndpointsPage from './pages/EndpointsPage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import LogsDashboardPage from './pages/LogsDashboardPage';

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
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Modal show={showMobileWarning} onHide={handleDismissMobileWarning} centered>
          <Modal.Header closeButton>
            <Modal.Title style={{ color: 'black' }}>Best Experience on Desktop</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ color: 'black' }}>
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
        <Route path="*" element={<Navigate to={isAuthenticated() ? "/landing" : "/"} replace />} />
      </Routes>
    </>
  );
}

export default App;
