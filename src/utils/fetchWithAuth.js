// Utility wrapper for fetch that automatically adds authentication
import { apiRequest } from './apiService';

/**
 * Wrapper for apiRequest to simplify migration from direct fetch calls
 * @param {string} url - Full URL to fetch
 * @param {object} options - Fetch options
 * @returns {Promise} - Promise that resolves to the parsed JSON response
 */
const fetchWithAuth = async (url, options = {}) => {
  // Extract the endpoint from the full URL
  // This handles URLs like 'https://backlify-v2.onrender.com/my-apis'
  const urlObj = new URL(url);
  const endpoint = urlObj.pathname;
  
  // Use apiRequest with the extracted endpoint
  return apiRequest(endpoint, options);
};

export default fetchWithAuth; 