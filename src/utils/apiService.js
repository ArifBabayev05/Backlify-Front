// API Service utility to handle requests and token management
import { toast } from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:3000';

// In-memory token storage (more secure than localStorage for tokens)
let accessToken = null;
let refreshToken = null;
let xAuthUserId = null;

// Token management functions
export const setTokens = (access, refresh) => {
  accessToken = access;
  refreshToken = refresh;
};

// Set XAuthUserId
export const setXAuthUserId = (userId) => {
  xAuthUserId = userId;
};

export const getXAuthUserId = () => xAuthUserId;
export const getAccessToken = () => accessToken;
export const getRefreshToken = () => refreshToken;
export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
  xAuthUserId = null;
};

// Refresh token function
export const refreshAccessToken = async () => {
  try {
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    
    if (!data.accessToken) {
      throw new Error('No access token returned');
    }

    // Update only the access token
    accessToken = data.accessToken;
    return accessToken;
  } catch (error) {
    console.error('Error refreshing token:', error);
    // Clear tokens on refresh failure
    clearTokens();
    // Force re-login
    window.location.href = '/login';
    throw error;
  }
};

// API request function with token handling
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Set up headers with authentication if token exists
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  // Always include XAuthUserId if available
  if (xAuthUserId) {
    headers['XAuthUserId'] = xAuthUserId;
  }

  // Create request config
  const config = {
    ...options,
    headers,
  };

  try {
    let response = await fetch(url, config);
    
    // Handle token expiration (401/403 responses)
    if (response.status === 401 || response.status === 403) {
      // Check if we have a refresh token
      if (refreshToken) {
        try {
          // Try to refresh the token
          await refreshAccessToken();
          
          // Update the Authorization header with the new access token
          config.headers['Authorization'] = `Bearer ${accessToken}`;
          
          // Retry the original request with the new token
          response = await fetch(url, config);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // If refresh fails, throw the original response
        }
      }
    }

    // Parse response
    const data = await response.json();

    // If response is still not ok after potential token refresh
    if (!response.ok) {
      const errorMessage = data.message || data.details || data.error || 'Request failed';
      const error = new Error(errorMessage);
      error.status = response.status;
      error.details = data.details || null;
      error.requestId = data.requestId || null;
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`API request failed (${url}):`, error);
    
    // Show toast for user feedback (except for refresh token requests)
    if (!endpoint.includes('/auth/refresh')) {
      toast.error(error.message || 'Request failed');
    }
    
    throw error;
  }
};

// Authentication-specific functions
export const loginUser = async (credentials) => {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  // Store tokens securely in memory
  if (data.accessToken && data.refreshToken) {
    setTokens(data.accessToken, data.refreshToken);
  }

  // Store XAuthUserId from the login response
  if (data.XAuthUserId) {
    setXAuthUserId(data.XAuthUserId);
  }

  return data;
};

export const logoutUser = async () => {
  // Clear tokens from memory
  clearTokens();
  
  // Optional: Call logout endpoint if the API has one
  try {
    if (accessToken) {
      await apiRequest('/auth/logout', {
        method: 'POST',
      });
    }
  } catch (error) {
    console.error('Logout request failed:', error);
    // Continue with local logout even if server logout fails
  }
};

export default {
  apiRequest,
  loginUser,
  logoutUser,
  setTokens,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setXAuthUserId,
  getXAuthUserId
}; 