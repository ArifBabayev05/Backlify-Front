import { toast } from 'react-hot-toast';
import { isUsageLimitError, extractUsageLimitInfo } from './apiService';

// Global error handler for API requests
export const handleApiError = (error, context = '') => {
  console.error(`API Error${context ? ` in ${context}` : ''}:`, error);

  // Check if it's a usage limit error
  if (isUsageLimitError(error)) {
    const limitInfo = extractUsageLimitInfo(error);
    
    if (limitInfo) {
      // Dispatch custom event for limit notifications
      const event = new CustomEvent('apiError', { 
        detail: { error, limitInfo, context } 
      });
      window.dispatchEvent(event);
      
      // Don't show additional toast for limit errors as notifications handle it
      return;
    }
  }

  // Handle other types of errors
  let errorMessage = 'An unexpected error occurred';
  
  if (error.message) {
    errorMessage = error.message;
  } else if (error.status) {
    switch (error.status) {
      case 400:
        errorMessage = 'Invalid request. Please check your input.';
        break;
      case 401:
        errorMessage = 'Authentication required. Please log in again.';
        break;
      case 403:
        errorMessage = 'Access denied. You don\'t have permission for this action.';
        break;
      case 404:
        errorMessage = 'Resource not found.';
        break;
      case 429:
        errorMessage = 'Too many requests. Please try again later.';
        break;
      case 500:
        errorMessage = 'Server error. Please try again later.';
        break;
      default:
        errorMessage = `Request failed with status ${error.status}`;
    }
  }

  // Show error toast
  toast.error(errorMessage, {
    duration: 5000,
    position: 'top-right'
  });
};

// Enhanced API request wrapper with error handling
export const apiRequestWithErrorHandling = async (apiRequest, endpoint, options = {}) => {
  try {
    return await apiRequest(endpoint, options);
  } catch (error) {
    handleApiError(error, endpoint);
    throw error; // Re-throw for component-level handling if needed
  }
};

// Usage limit specific error handler
export const handleUsageLimitError = (error, onUpgradeClick) => {
  if (!isUsageLimitError(error)) {
    return false;
  }

  const limitInfo = extractUsageLimitInfo(error);
  if (!limitInfo) {
    return false;
  }

  // Show appropriate notification based on usage level
  if (limitInfo.percentage >= 100) {
    toast.error(
      `Usage limit exceeded! ${limitInfo.message}`,
      {
        duration: 8000,
        icon: '🚫',
        action: onUpgradeClick ? {
          label: 'Upgrade Plan',
          onClick: onUpgradeClick
        } : undefined
      }
    );
  } else if (limitInfo.percentage >= 90) {
    toast.warning(
      `Approaching usage limit: ${limitInfo.percentage}% used`,
      {
        duration: 6000,
        icon: '⚠️',
        action: onUpgradeClick ? {
          label: 'Upgrade Plan',
          onClick: onUpgradeClick
        } : undefined
      }
    );
  }

  return true;
};

// Network error handler
export const handleNetworkError = (error) => {
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    toast.error('Network error. Please check your internet connection.', {
      duration: 5000
    });
    return true;
  }
  return false;
};

// Global error boundary handler
export const handleGlobalError = (error, errorInfo) => {
  console.error('Global error:', error, errorInfo);
  
  // Don't show toast for React error boundaries as they're usually handled by components
  // Just log for debugging
};

export default {
  handleApiError,
  apiRequestWithErrorHandling,
  handleUsageLimitError,
  handleNetworkError,
  handleGlobalError
};