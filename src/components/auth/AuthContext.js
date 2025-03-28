import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  loginUser as apiLoginUser, 
  logoutUser as apiLogoutUser, 
  setTokens,
  getAccessToken,
  getRefreshToken,
  setXAuthUserId
} from '../../utils/apiService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize user state from localStorage on app load
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const username = localStorage.getItem('username');
        const email = localStorage.getItem('email');
        const savedAccessToken = localStorage.getItem('accessToken');
        const savedRefreshToken = localStorage.getItem('refreshToken');
        
        // If we have tokens in localStorage, restore them to memory
        if (savedAccessToken && savedRefreshToken) {
          setTokens(savedAccessToken, savedRefreshToken);
        }
        
        // If we have a username, set it as the XAuthUserId
        if (username) {
          setXAuthUserId(username);
        }
        
        if (username && email) {
          // Set the user data from localStorage
          setUser({ username, email });
        }
      } catch (error) {
        console.error('Error initializing auth state:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, []);

  // Login function - updated to use new token-based authentication
  const login = async (userData) => {
    // Store user data - use username as XAuthUserId
    setUser({
      username: userData.XAuthUserId, // Use XAuthUserId as username
      email: userData.email
    });
    
    // Store user identity in localStorage for persistence
    localStorage.setItem('username', userData.XAuthUserId);
    localStorage.setItem('email', userData.email);
    
    // Also set the XAuthUserId in the apiService
    setXAuthUserId(userData.XAuthUserId);
    
    // Store tokens in localStorage for persistence across page refreshes
    // Note: This is a compromise solution - HTTP-only cookies would be more secure
    // but require server-side setup. This is still more secure than storing just user ID.
    if (userData.accessToken && userData.refreshToken) {
      localStorage.setItem('accessToken', userData.accessToken);
      localStorage.setItem('refreshToken', userData.refreshToken);
    }
  };

  // Logout function - updated to clear tokens
  const logout = async () => {
    try {
      // Call API logout if appropriate
      await apiLogoutUser();
      
      // Clear user data
      setUser(null);
      
      // Remove from localStorage
      localStorage.removeItem('username');
      localStorage.removeItem('email');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if API call fails
      setUser(null);
      localStorage.removeItem('username');
      localStorage.removeItem('email');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  };

  // Check if user is authenticated - updated to check for token presence
  const isAuthenticated = () => {
    return !!user && !!getAccessToken();
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    // Expose token getters for components that need direct access
    getAccessToken,
    getRefreshToken
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