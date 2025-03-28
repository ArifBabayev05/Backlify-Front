// Error handler utility for API responses
import { toast } from 'react-hot-toast';

/**
 * Maps HTTP status codes to user-friendly messages
 * @param {number} statusCode - HTTP status code
 * @returns {string} - User-friendly error message
 */
export const getErrorMessageForStatus = (statusCode) => {
  switch (statusCode) {
    case 400:
      return 'Bad request: Missing or invalid input.';
    case 401:
      return 'Your session has expired. Please log in again.';
    case 403:
      return 'You do not have permission to access this resource.';
    case 404:
      return 'The requested resource was not found.';
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
    case 501:
    case 502:
    case 503:
    case 504:
      return 'The server encountered an error. Please try again later.';
    default:
      return 'An unexpected error occurred.';
  }
};

/**
 * Formats API error response into a user-friendly message
 * @param {Error} error - Error object from API request
 * @returns {string} - Formatted error message
 */
export const formatApiError = (error) => {
  if (!error) return 'An unknown error occurred';

  // Extract details from the error object
  const status = error.status || 500;
  const message = error.message || getErrorMessageForStatus(status);
  const details = error.details || '';
  const requestId = error.requestId || '';

  // Build error message
  let formattedMessage = message;
  
  // If there are additional details, add them
  if (details && details !== message) {
    formattedMessage += `: ${details}`;
  }
  
  // For development, add request ID for debugging
  if (requestId && process.env.NODE_ENV === 'development') {
    formattedMessage += ` (Request ID: ${requestId})`;
  }
  
  return formattedMessage;
};

/**
 * Handles API errors by displaying a toast notification
 * @param {Error} error - Error object from API request
 * @param {boolean} showToast - Whether to show a toast notification (default: true)
 * @returns {string} - Formatted error message
 */
export const handleApiError = (error, showToast = true) => {
  const message = formatApiError(error);
  
  if (showToast) {
    toast.error(message);
  }
  
  return message;
};

export default {
  getErrorMessageForStatus,
  formatApiError,
  handleApiError
}; 