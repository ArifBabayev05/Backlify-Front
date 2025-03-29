/**
 * Cache Service - Provides caching mechanisms for API responses
 * Uses localStorage for persistent caching between sessions
 */

// Cache configuration
const DEFAULT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const CACHE_PREFIX = 'backlify_cache_';

/**
 * Get a cached response for a specific endpoint
 * @param {string} endpoint - API endpoint path
 * @param {object} options - Request options (method, body, etc.)
 * @returns {object|null} - Cached response or null if not found/expired
 */
export const getCachedResponse = (endpoint, options = {}) => {
  try {
    // Only cache GET requests by default
    if (options.method && options.method !== 'GET') {
      return null;
    }

    // Create a unique cache key based on the endpoint and request options
    const cacheKey = generateCacheKey(endpoint, options);
    
    // Try to get from localStorage
    const cachedItem = localStorage.getItem(`${CACHE_PREFIX}${cacheKey}`);
    
    if (!cachedItem) {
      return null;
    }
    
    const { data, expiry } = JSON.parse(cachedItem);
    
    // Check if the cache has expired
    if (Date.now() > expiry) {
      // Remove expired cache
      localStorage.removeItem(`${CACHE_PREFIX}${cacheKey}`);
      return null;
    }
    
    return data;
  } catch (error) {
    console.warn('Cache retrieval error:', error);
    return null;
  }
};

/**
 * Save response data to cache
 * @param {string} endpoint - API endpoint path
 * @param {object} options - Request options (method, body, etc.)
 * @param {object} data - Response data to cache
 * @param {number} duration - Cache duration in milliseconds (optional)
 */
export const setCachedResponse = (endpoint, options = {}, data, duration = DEFAULT_CACHE_DURATION) => {
  try {
    // Only cache GET requests by default
    if (options.method && options.method !== 'GET') {
      return;
    }
    
    // Skip caching if data is undefined or null
    if (data === undefined || data === null) {
      return;
    }

    const cacheKey = generateCacheKey(endpoint, options);
    const expiry = Date.now() + duration;
    
    localStorage.setItem(
      `${CACHE_PREFIX}${cacheKey}`, 
      JSON.stringify({ data, expiry })
    );
  } catch (error) {
    console.warn('Cache storage error:', error);
    // Fail silently - caching errors shouldn't break the application
  }
};

/**
 * Clear all cached responses or specific endpoint cache
 * @param {string} endpoint - Optional endpoint to clear specific cache
 * @param {object} options - Optional request options to clear specific cache
 */
export const clearCache = (endpoint = null, options = {}) => {
  try {
    if (endpoint) {
      // Clear specific cache
      const cacheKey = generateCacheKey(endpoint, options);
      localStorage.removeItem(`${CACHE_PREFIX}${cacheKey}`);
    } else {
      // Clear all cache items with our prefix
      Object.keys(localStorage)
        .filter(key => key.startsWith(CACHE_PREFIX))
        .forEach(key => localStorage.removeItem(key));
    }
  } catch (error) {
    console.warn('Cache clearing error:', error);
  }
};

/**
 * Generate a unique cache key for an endpoint and options
 * @param {string} endpoint - API endpoint
 * @param {object} options - Request options
 * @returns {string} - Unique cache key
 */
const generateCacheKey = (endpoint, options = {}) => {
  // Create a deterministic key from the endpoint and query parameters
  const method = options.method || 'GET';
  
  // For GET requests, the body is usually ignored, so we don't include it in the key
  // For other methods, we need to include the body in the key
  const bodyString = method !== 'GET' && options.body 
    ? JSON.stringify(options.body) 
    : '';
  
  // Extract query parameters from the endpoint
  const urlParts = endpoint.split('?');
  const path = urlParts[0];
  const query = urlParts.length > 1 ? urlParts[1] : '';
  
  // Combine all components into a single string and hash it
  return `${method}_${path}_${query}_${bodyString}`.replace(/[^a-z0-9]/gi, '_');
};

/**
 * Set a custom cache duration for specific endpoints
 * @param {string} endpoint - API endpoint pattern (can be regex-like)
 * @param {number} duration - Cache duration in milliseconds
 */
export const configureCacheDuration = (endpoint, duration) => {
  // This could be expanded to support more complex cache configuration
  try {
    const cacheConfig = JSON.parse(localStorage.getItem(`${CACHE_PREFIX}config`) || '{}');
    cacheConfig[endpoint] = duration;
    localStorage.setItem(`${CACHE_PREFIX}config`, JSON.stringify(cacheConfig));
  } catch (error) {
    console.warn('Cache configuration error:', error);
  }
};

export default {
  getCachedResponse,
  setCachedResponse,
  clearCache,
  configureCacheDuration
}; 