import { useCallback } from 'react';
import { clearCache, configureCacheDuration } from './cacheService';

/**
 * Custom hook that provides cache control functions to components
 * @param {object} options - Hook configuration options
 * @returns {object} - Object containing cache control functions
 */
const useCacheControl = (options = {}) => {
  /**
   * Clear all cache or specific endpoint cache
   * @param {string} endpoint - Optional specific endpoint to clear
   */
  const invalidateCache = useCallback((endpoint = null) => {
    clearCache(endpoint);
  }, []);

  /**
   * Configure caching duration for specific endpoints
   * @param {string} endpoint - Endpoint pattern
   * @param {number} durationMs - Duration in milliseconds
   */
  const setCacheDuration = useCallback((endpoint, durationMs) => {
    configureCacheDuration(endpoint, durationMs);
  }, []);

  /**
   * Helper to disable caching for API requests
   * @returns {object} - Object to spread in apiRequest options
   */
  const disableCache = useCallback(() => {
    return { skipCache: true };
  }, []);

  /**
   * Helper that ensures fresh data from the API by skipping cache once
   * @returns {object} - Object to spread in apiRequest options
   */
  const forceRefresh = useCallback(() => {
    return { skipCache: true };
  }, []);

  return {
    invalidateCache,
    setCacheDuration,
    disableCache,
    forceRefresh
  };
};

export default useCacheControl; 