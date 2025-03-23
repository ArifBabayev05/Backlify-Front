import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const RequireAuth = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // If still loading auth state, show nothing (or a spinner)
  if (loading) {
    return <div className="d-flex justify-content-center m-5">Loading...</div>;
  }

  // If not authenticated, redirect to login with the current location as state
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated, render the protected component
  return children;
};

export default RequireAuth; 