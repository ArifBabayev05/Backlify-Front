import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Toaster } from 'react-hot-toast';

// Import pages
import LandingPage from './pages/LandingPage';
import SchemaPage from './pages/SchemaPage';
import EndpointsPage from './pages/EndpointsPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Import components
import NavBar from './components/layout/NavBar';
import { AuthProvider } from './components/auth/AuthContext';
import RequireAuth from './components/auth/RequireAuth';

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
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
  
  return (
    <>
      {location.pathname === '/' && <NavBar />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
