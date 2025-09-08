// API Service utility to handle requests and token management
import { toast } from 'react-hot-toast';
import { getCachedResponse, setCachedResponse, clearCache } from './cacheService';
import { handleApiError, handleUsageLimitError } from './errorHandler';

const API_BASE_URL = 'https://backlify-v2.onrender.com';

// In-memory token storage (more secure than localStorage for tokens)
let accessToken = null;
let refreshToken = null;
let xAuthUserId = null;
let userPlan = null;

// Token management functions
export const setTokens = (access, refresh) => {
  accessToken = access;
  refreshToken = refresh;
};

// Set XAuthUserId
export const setXAuthUserId = (userId) => {
  xAuthUserId = userId;
};

// User plan management functions
export const setUserPlan = (plan) => {
  userPlan = plan;
  // Also store in localStorage for persistence
  if (plan) {
    localStorage.setItem('userPlan', plan);
  } else {
    localStorage.removeItem('userPlan');
  }
};

export const getUserPlan = () => {
  // First try to get from memory
  if (userPlan) {
    return userPlan;
  }
  
  // If not in memory, try to get from localStorage
  const storedPlan = localStorage.getItem('userPlan');
  if (storedPlan) {
    userPlan = storedPlan;
    return storedPlan;
  }
  
  return null;
};

// Helper function to get plan limits
export const getPlanLimits = (plan = null) => {
  const currentPlan = plan || getUserPlan() || 'basic';
  
  const limits = {
    basic: {
      projects: 2,
      requests: 1000,
      name: 'Basic Plan'
    },
    pro: {
      projects: 10,
      requests: 10000,
      name: 'Pro Plan'
    },
    enterprise: {
      projects: -1, // unlimited
      requests: -1, // unlimited
      name: 'Enterprise Plan'
    }
  };
  
  return limits[currentPlan] || limits.basic;
};

export const getXAuthUserId = () => xAuthUserId;
export const getAccessToken = () => accessToken;
export const getRefreshToken = () => refreshToken;

// Check if user is authenticated
export const isAuthenticated = () => {
  const hasAccessToken = !!accessToken;
  const hasRefreshToken = !!refreshToken;
  const hasLocalStorageToken = !!localStorage.getItem('accessToken');
  const hasLocalStorageRefreshToken = !!localStorage.getItem('refreshToken');
  
  console.log('Auth status:', {
    hasAccessToken,
    hasRefreshToken,
    hasLocalStorageToken,
    hasLocalStorageRefreshToken,
    xAuthUserId,
    accessToken: accessToken ? 'present' : 'missing',
    refreshToken: refreshToken ? 'present' : 'missing'
  });
  
  // If we have tokens in localStorage but not in memory, load them
  if (!hasAccessToken && hasLocalStorageToken) {
    console.log('Loading tokens from localStorage...');
    const savedAccessToken = localStorage.getItem('accessToken');
    const savedRefreshToken = localStorage.getItem('refreshToken');
    if (savedAccessToken && savedRefreshToken) {
      setTokens(savedAccessToken, savedRefreshToken);
      return true;
    }
  }
  
  return hasAccessToken || hasLocalStorageToken;
};

// Proactively refresh token before it expires
export const refreshTokenIfNeeded = async () => {
  if (!accessToken || !refreshToken) {
    return false;
  }
  
  try {
    // Check if token is close to expiring (within 5 minutes)
    const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
    const now = Date.now() / 1000;
    const timeUntilExpiry = tokenPayload.exp - now;
    
    // If token expires in less than 5 minutes, refresh it
    if (timeUntilExpiry < 300) {
      console.log('Token expires soon, refreshing...');
      await refreshAccessToken();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking token expiry:', error);
    return false;
  }
};
export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
  xAuthUserId = null;
  userPlan = null;
  localStorage.removeItem('userPlan');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

// Set up periodic token refresh
let tokenRefreshInterval = null;

export const startTokenRefresh = () => {
  // Clear any existing interval
  if (tokenRefreshInterval) {
    clearInterval(tokenRefreshInterval);
  }
  
  // Refresh token every 4 minutes (tokens typically last 1 hour)
  tokenRefreshInterval = setInterval(async () => {
    if (accessToken && refreshToken) {
      try {
        await refreshTokenIfNeeded();
      } catch (error) {
        console.error('Periodic token refresh failed:', error);
      }
    }
  }, 4 * 60 * 1000); // 4 minutes
};

export const stopTokenRefresh = () => {
  if (tokenRefreshInterval) {
    clearInterval(tokenRefreshInterval);
    tokenRefreshInterval = null;
  }
};

// Load tokens from localStorage into memory
export const loadTokensFromStorage = () => {
  try {
    const savedAccessToken = localStorage.getItem('accessToken');
    const savedRefreshToken = localStorage.getItem('refreshToken');
    const savedXAuthUserId = localStorage.getItem('username');
    const savedUserPlan = localStorage.getItem('userPlan');
    
    console.log('Loading tokens from localStorage:', {
      hasAccessToken: !!savedAccessToken,
      hasRefreshToken: !!savedRefreshToken,
      hasXAuthUserId: !!savedXAuthUserId,
      hasUserPlan: !!savedUserPlan
    });
    
    if (savedAccessToken && savedRefreshToken) {
      setTokens(savedAccessToken, savedRefreshToken);
      
      if (savedXAuthUserId) {
        setXAuthUserId(savedXAuthUserId);
      }
      
      if (savedUserPlan) {
        setUserPlan(savedUserPlan);
      }
      
      // Start token refresh
      startTokenRefresh();
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error loading tokens from storage:', error);
    return false;
  }
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
    
    // Also update localStorage with the new access token
    localStorage.setItem('accessToken', data.accessToken);
    
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
  
  // Check cache first for GET requests if caching is not explicitly disabled
  if ((!options.method || options.method === 'GET') && !options.skipCache) {
    const cachedResponse = getCachedResponse(endpoint, options);
    if (cachedResponse) {
      console.log(`[Cache] Using cached response for: ${endpoint}`);
      return cachedResponse;
    }
  }
  
  // Set up headers with authentication if token exists
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
    
    // Debug: Decode JWT to see what's in it
    try {
      const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
      console.log('JWT Token payload:', tokenPayload);
    } catch (error) {
      console.log('Could not decode JWT token:', error);
    }
  }

  // Always include XAuthUserId if available
  if (xAuthUserId) {
    headers['XAuthUserId'] = xAuthUserId;
    // Also include x-user-id for backend compatibility
    headers['x-user-id'] = xAuthUserId;
    console.log('Setting user ID headers:', { xAuthUserId, 'x-user-id': xAuthUserId });
  } else {
    console.log('No xAuthUserId available for headers');
  }
  
  // Also try to extract user ID from JWT token if available
  if (accessToken) {
    try {
      const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
      if (tokenPayload.username) {
        // Always set x-user-id from JWT username as fallback
        headers['x-user-id'] = tokenPayload.username;
        console.log('Using username from JWT as user ID:', tokenPayload.username);
      }
    } catch (error) {
      console.log('Could not extract user ID from JWT:', error);
    }
  }

  // Always include X-User-Plan if available
  const currentPlan = getUserPlan();
  if (currentPlan) {
    //headers['X-User-Plan'] = currentPlan;
  }

  // Create request config
  const config = {
    ...options,
    headers,
  };

  try {
    // Proactively refresh token if needed before making the request
    await refreshTokenIfNeeded();
    
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
      
      // Handle usage limit errors specifically
      if (isUsageLimitError(error)) {
        // Dispatch custom event for limit notifications
        const event = new CustomEvent('apiError', { 
          detail: { error, context: endpoint } 
        });
        window.dispatchEvent(event);
      }
      
      throw error;
    }

    // Cache successful GET responses if caching is not explicitly disabled
    if ((!options.method || options.method === 'GET') && !options.skipCache) {
      setCachedResponse(endpoint, options, data);
    }

    // If this was a mutation operation (POST, PUT, DELETE, etc), clear related cache entries
    if (options.method && options.method !== 'GET') {
      // Extract the base resource path to clear all related cache entries
      const resourcePath = endpoint.split('/')[1]; // e.g., 'my-apis' from '/my-apis/123'
      if (resourcePath) {
        console.log(`[Cache] Clearing cache for resource: ${resourcePath}`);
        clearCache(`/${resourcePath}`);
      }
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
  // Clear all cache on login to ensure fresh data
  clearCache();
  
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
    skipCache: true, // Always skip cache for auth requests
  });

  // Store tokens securely in memory
  if (data.accessToken && data.refreshToken) {
    setTokens(data.accessToken, data.refreshToken);
  }

  // Store XAuthUserId from the login response
  if (data.XAuthUserId) {
    setXAuthUserId(data.XAuthUserId);
  }
  
  // Also store user ID if available
  if (data.userId || data.id) {
    setXAuthUserId(data.userId || data.id);
  }

  // Store user plan if available in login response
  if (data.plan) {
    setUserPlan(data.plan);
  }

  // Start periodic token refresh
  startTokenRefresh();

  return data;
};

export const logoutUser = async () => {
  // Clear all cache on logout
  clearCache();
  
  // Stop token refresh and clear tokens from memory
  stopTokenRefresh();
  clearTokens();
  
  // Optional: Call logout endpoint if the API has one
  try {
    if (accessToken) {
      await apiRequest('/auth/logout', {
        method: 'POST',
        skipCache: true, // Always skip cache for auth requests
      });
    }
  } catch (error) {
    console.error('Logout request failed:', error);
    // Continue with local logout even if server logout fails
  }
};

// ===== ACCOUNT SETTINGS FUNCTIONS =====

// Get user profile
export const getUserProfile = async () => {
  try {
    const response = await apiRequest('/api/user/profile', {
      method: 'GET'
    });
    
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.error || 'Failed to fetch profile');
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (profileData) => {
  try {
    const response = await apiRequest('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.error || 'Failed to update profile');
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Change password
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await apiRequest('/api/user/change-password', {
      method: 'PUT',
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });
    
    if (response.success) {
      return true;
    } else {
      throw new Error(response.error || 'Failed to change password');
    }
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};

// Get user subscription
export const getUserSubscription = async () => {
  try {
    const response = await apiRequest('/api/user/subscription', {
      method: 'GET'
    });
    
    if (response.success) {
      // Set user plan if available in response
      if (response.data && response.data.plan) {
        setUserPlan(response.data.plan);
      }
      return response.data;
    } else {
      throw new Error(response.error || 'Failed to fetch subscription');
    }
  } catch (error) {
    console.error('Error fetching subscription:', error);
    throw error;
  }
};

// Upgrade subscription
export const upgradeSubscription = async (plan) => {
  try {
    const response = await apiRequest('/api/user/subscription/upgrade', {
      method: 'POST',
      body: JSON.stringify({ plan })
    });
    
    if (response.success) {
      // Set user plan after successful upgrade
      setUserPlan(plan);
      return response.data;
    } else {
      throw new Error(response.error || 'Failed to upgrade subscription');
    }
  } catch (error) {
    console.error('Error upgrading subscription:', error);
    throw error;
  }
};

// Get API usage statistics
export const getApiUsage = async (period = 'month', startDate = null, endDate = null) => {
  try {
    let url = '/api/user/usage?';
    const params = new URLSearchParams();
    
    if (period) params.append('period', period);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    url += params.toString();

    const response = await apiRequest(url, {
      method: 'GET'
    });
    
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.error || 'Failed to fetch usage data');
    }
  } catch (error) {
    console.error('Error fetching API usage:', error);
    throw error;
  }
};

// Get request logs
export const getRequestLogs = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined) {
        params.append(key, filters[key]);
      }
    });

    const url = `/api/user/logs?${params.toString()}`;

    const response = await apiRequest(url, {
      method: 'GET'
    });
    
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.error || 'Failed to fetch logs');
    }
  } catch (error) {
    console.error('Error fetching request logs:', error);
    throw error;
  }
};

// Get notification settings
export const getNotificationSettings = async () => {
  try {
    const response = await apiRequest('/api/user/notifications/settings', {
      method: 'GET'
    });
    
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.error || 'Failed to fetch notification settings');
    }
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    throw error;
  }
};

// Update notification settings
export const updateNotificationSettings = async (settings) => {
  try {
    const response = await apiRequest('/api/user/notifications/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
    
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.error || 'Failed to update notification settings');
    }
  } catch (error) {
    console.error('Error updating notification settings:', error);
    throw error;
  }
};

// ===== USER LOGS FUNCTIONS =====

// Get user logs with filters
export const getUserLogs = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    // Add filters to query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params.append(key, value);
      }
    });

    const url = `/api/user/logs?${params.toString()}`;

    const response = await apiRequest(url, {
      method: 'GET'
    });
    
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.error || 'Failed to fetch user logs');
    }
  } catch (error) {
    console.error('Error fetching user logs:', error);
    throw error;
  }
};

// Get user log statistics
export const getUserLogStats = async (timeRange = 'last7days', startDate = null, endDate = null) => {
  try {
    const params = new URLSearchParams();
    
    if (timeRange) params.append('timeRange', timeRange);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const url = `/api/user/logs/stats?${params.toString()}`;

    const response = await apiRequest(url, {
      method: 'GET'
    });
    
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.error || 'Failed to fetch user log statistics');
    }
  } catch (error) {
    console.error('Error fetching user log statistics:', error);
    throw error;
  }
};

// ===== API USAGE LIMITS FUNCTIONS =====

// Get user's created APIs from logs using admin endpoint
export const getUserApis = async (username = null) => {
  try {
    // Use the admin logs endpoint directly like LogsDashboardPage
    let url = 'https://backlify-v2.onrender.com/admin/logs?timeRange=last30days';

    // Get username from parameter or localStorage
    const actualUsername = username || localStorage.getItem('username');
    
    // If username is available, filter by that user
    if (actualUsername) {
      url += `&XAuthUserId=${encodeURIComponent(actualUsername)}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch logs: ${response.status}`);
    }
    
    const data = await response.json();
    const logs = data.logs || [];
    
    // Extract unique API IDs from logs where is_api_request = true
    const apiIds = [...new Set(logs
      .filter(log => log.api_id && log.is_api_request)
      .map(log => log.api_id)
    )];
    
    // Create API objects with names
    const apis = apiIds.map(apiId => ({
      apiId: apiId,
      name: `API ${apiId.substring(0, 8)}...`
    }));
    
    return apis;
  } catch (error) {
    console.error('Error fetching user APIs from logs:', error);
    throw error;
  }
};

// Get user's current plan from logs using admin endpoint
export const getUserCurrentPlan = async () => {
  try {
    // Use the admin logs endpoint directly like LogsDashboardPage
    let url = 'https://backlify-v2.onrender.com/admin/logs?timeRange=last30days';


    // Get username from localStorage
    const username = localStorage.getItem('username');
    if (username) {
      url += `&XAuthUserId=${encodeURIComponent(username)}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch logs: ${response.status}`);
    }
    
    const data = await response.json();
    const logs = data.logs || [];
    
    if (logs.length > 0) {
      // Extract plan from the most recent log
      const latestLog = logs[0];
      
      // Try to extract plan from response body
      try {
        if (latestLog.response && latestLog.response.body) {
          const responseBody = JSON.parse(latestLog.response.body);
          if (responseBody.user_plan) {
            return { id: responseBody.user_plan, name: `${responseBody.user_plan.charAt(0).toUpperCase() + responseBody.user_plan.slice(1)} Plan` };
          }
        }
      } catch (e) {
        // Keep default plan
      }
      
      // Default to basic plan if no plan info found
      return { id: 'basic', name: 'Basic Plan' };
    } else {
      // Default to basic plan if no logs found
      return { id: 'basic', name: 'Basic Plan' };
    }
  } catch (error) {
    console.error('Error fetching user current plan:', error);
    // Return basic plan as fallback
    return { id: 'basic', name: 'Basic Plan' };
  }
};

// Get available subscription plans
export const getSubscriptionPlans = async () => {
  try {
    const response = await apiRequest('/api/user/plans', {
      method: 'GET'
    });
    
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.error || 'Failed to fetch subscription plans');
    }
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    throw error;
  }
};

// Get API usage statistics for a specific API
export const getApiUsageStats = async (apiId) => {
  try {
    const response = await apiRequest(`/api/${apiId}/usage`, {
      method: 'GET'
    });
    
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.error || 'Failed to fetch API usage statistics');
    }
  } catch (error) {
    console.error('Error fetching API usage statistics:', error);
    throw error;
  }
};

// Get real usage data from logs for a specific API using admin endpoint
export const getRealApiUsageFromLogs = async (apiId, username = null) => {
  try {
    // Use the admin logs endpoint directly like LogsDashboardPage
    let url = 'https://backlify-v2.onrender.com/admin/logs?timeRange=last30days';
    
    // Get username from parameter or localStorage
    const actualUsername = username || localStorage.getItem('username');
    // If username is available, filter by that user
    if (actualUsername) {
      url += `&XAuthUserId=${encodeURIComponent(actualUsername)}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch logs: ${response.status}`);
    }
    
    const data = await response.json();
    const logs = data.logs || [];
    
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Filter logs for current month and specific API
    const currentMonthLogs = logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= monthStart && logDate <= now && log.api_id === apiId;
    });
    
    // Count API requests (is_api_request = true) for this specific API
    const apiRequests = currentMonthLogs.filter(log => log.is_api_request === true);
    const requestCount = apiRequests.length;
    
    // Count projects (non-API requests that create APIs) - this is global, not per API
    const allCurrentMonthLogs = logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= monthStart && logDate <= now;
    });
    
    const projectLogs = allCurrentMonthLogs.filter(log => 
      log.endpoint === '/create-api-from-schema' && log.status_code === 200
    );
    const projectCount = projectLogs.length;
    
    // Determine user plan from logs (look for plan info in response)
    let userPlan = 'basic';
    if (currentMonthLogs.length > 0) {
      const latestLog = currentMonthLogs[0];
      // Try to extract plan from response body
      try {
        if (latestLog.response && latestLog.response.body) {
          const responseBody = JSON.parse(latestLog.response.body);
          if (responseBody.user_plan) {
            userPlan = responseBody.user_plan;
          }
        }
      } catch (e) {
        // Keep default plan
      }
    }
    
    // Define limits based on plan
    const limits = {
      basic: { requests: 1000, projects: 2 },
      pro: { requests: 10000, projects: 10 },
      enterprise: { requests: -1, projects: -1 } // unlimited
    };
    
    const currentLimits = limits[userPlan] || limits.basic;
    
    return {
      api_id: apiId,
      user_id: xAuthUserId || 'unknown',
      user_plan: userPlan,
      month_start: monthStart.toISOString(),
      requests_count: requestCount,
      projects_count: projectCount,
      limits: currentLimits,
      remaining_requests: currentLimits.requests === -1 ? -1 : Math.max(0, currentLimits.requests - requestCount),
      remaining_projects: currentLimits.projects === -1 ? -1 : Math.max(0, currentLimits.projects - projectCount)
    };
  } catch (error) {
    console.error('Error fetching real API usage from logs:', error);
    throw error;
  }
};

// Get admin usage statistics
export const getAdminUsageStats = async () => {
  try {
    const response = await apiRequest('/api/user/usage/stats', {
      method: 'GET'
    });
    
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.error || 'Failed to fetch admin usage statistics');
    }
  } catch (error) {
    console.error('Error fetching admin usage statistics:', error);
    throw error;
  }
};

// Get real admin usage statistics from logs using admin endpoint
export const getRealAdminUsageStats = async () => {
  try {
    // Use the admin logs endpoint directly like LogsDashboardPage
    let url = 'https://backlify-v2.onrender.com/admin/logs?timeRange=last30days';
    
    // Get username from localStorage and add to URL
    const username = localStorage.getItem('username');
    if (username) {
      url += `&XAuthUserId=${encodeURIComponent(username)}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch logs: ${response.status}`);
    }
    
    const data = await response.json();
    const logs = data.logs || [];
    
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Filter logs for current month
    const currentMonthLogs = logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= monthStart && logDate <= now;
    });
    
    // Count API requests
    const apiRequests = currentMonthLogs.filter(log => log.is_api_request === true);
    
    // Count projects (API creation requests)
    const projectLogs = currentMonthLogs.filter(log => 
      log.endpoint === '/create-api-from-schema' && log.status_code === 200
    );
    
    // Get unique users
    const uniqueUsers = [...new Set(currentMonthLogs.map(log => log.XAuthUserId))];
    
    // Get unique APIs
    const uniqueApis = [...new Set(apiRequests.map(log => log.api_id))];
    
    // Calculate user stats
    const userStats = uniqueUsers.map(userId => {
      const userLogs = currentMonthLogs.filter(log => log.XAuthUserId === userId);
      const userApiRequests = userLogs.filter(log => log.is_api_request === true);
      const userProjects = userLogs.filter(log => 
        log.endpoint === '/create-api-from-schema' && log.status_code === 200
      );
      
      return {
        user_id: userId,
        requests_count: userApiRequests.length,
        projects_count: userProjects.length
      };
    });
    
    // Calculate API stats
    const apiStats = uniqueApis.map(apiId => {
      const apiLogs = apiRequests.filter(log => log.api_id === apiId);
      const userForApi = apiLogs.length > 0 ? apiLogs[0].XAuthUserId : 'unknown';
      
      return {
        api_id: apiId,
        requests_count: apiLogs.length,
        user_id: userForApi
      };
    });
    
    return {
      month_start: monthStart.toISOString(),
      user_stats: userStats,
      api_stats: apiStats,
      total_logs: currentMonthLogs.length
    };
  } catch (error) {
    console.error('Error fetching real admin usage statistics:', error);
    throw error;
  }
};

// Get user debug information from the debug endpoint
export const getUserDebugInfo = async (username = null) => {
  try {
    // Get username from parameter or localStorage
    const actualUsername = username || localStorage.getItem('username');
    
    if (!actualUsername) {
      throw new Error('No username provided');
    }

    const url = `https://backlify-v2.onrender.com/debug-user-info?XAuthUserId=${encodeURIComponent(actualUsername)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch debug info: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch debug information');
    }
    
    // Transform the response to match the expected format for UsageDashboard
    const debugData = data.debug;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return {
      api_id: 'all', // This is for all APIs combined
      user_id: debugData.userId,
      user_plan: debugData.userPlan,
      month_start: monthStart.toISOString(),
      requests_count: debugData.usage.requestsCount,
      projects_count: debugData.usage.projectsCount,
      limits: debugData.limits,
      remaining_requests: Math.max(0, debugData.limits.requests - debugData.usage.requestsCount),
      remaining_projects: Math.max(0, debugData.limits.projects - debugData.usage.projectsCount),
      is_over_limit: debugData.isOverLimit,
      log_count: debugData.logCount,
      all_log_count: debugData.allLogCount
    };
  } catch (error) {
    console.error('Error fetching user debug info:', error);
    throw error;
  }
};

// Check if error is related to usage limits
export const isUsageLimitError = (error) => {
  return error.status === 403 && 
         error.message && 
         (error.message.includes('limit') || 
          error.message.includes('exceeded') || 
          error.message.includes('quota'));
};

// Extract usage limit information from error
export const extractUsageLimitInfo = (error) => {
  if (!isUsageLimitError(error)) {
    return null;
  }

  const message = error.message;
  const current = error.details?.current;
  const limit = error.details?.limit;
  const type = error.details?.type || 'requests';

  return {
    message,
    current: current || 0,
    limit: limit || 0,
    type,
    percentage: limit ? Math.round((current / limit) * 100) : 0
  };
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
  getXAuthUserId,
  setUserPlan,
  getUserPlan,
  getPlanLimits,
  // Account Settings functions
  getUserProfile,
  updateUserProfile,
  changePassword,
  getUserSubscription,
  upgradeSubscription,
  getApiUsage,
  getRequestLogs,
  getNotificationSettings,
  updateNotificationSettings,
  // User Logs functions
  getUserLogs,
  getUserLogStats,
  // API Usage Limits functions
  getUserApis,
  getUserCurrentPlan,
  getSubscriptionPlans,
  getApiUsageStats,
  getRealApiUsageFromLogs,
  getAdminUsageStats,
  getRealAdminUsageStats,
  getUserDebugInfo,
  isUsageLimitError,
  extractUsageLimitInfo
}; 