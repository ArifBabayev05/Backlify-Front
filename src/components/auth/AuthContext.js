import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize user state from localStorage on app load
  useEffect(() => {
    const XAuthUserId = localStorage.getItem('XAuthUserId');
    const email = localStorage.getItem('email');
    
    if (XAuthUserId && email) {
      setUser({ XAuthUserId, email });
    }
    
    setLoading(false);
  }, []);

  // Login function
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('XAuthUserId', userData.XAuthUserId);
    localStorage.setItem('email', userData.email);
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('XAuthUserId');
    localStorage.removeItem('email');
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user;
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 