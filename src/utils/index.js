// Export all utility functions and hooks from one place

// API and auth related
export { default as apiService } from './apiService';
export { 
  apiRequest, 
  loginUser, 
  logoutUser, 
  setTokens, 
  clearTokens, 
  getAccessToken, 
  getRefreshToken, 
  setXAuthUserId, 
  getXAuthUserId 
} from './apiService';

// Fetch wrapper
export { default as fetchWithAuth } from './fetchWithAuth';

// Error handling
export { 
  handleApiError, 
  formatApiError, 
  getErrorMessageForStatus 
} from './errorHandler';

// Cache related
export { default as cacheService } from './cacheService';
export {
  getCachedResponse,
  setCachedResponse,
  clearCache,
  configureCacheDuration
} from './cacheService';

// Custom hooks
export { default as useCacheControl } from './useCacheControl'; 