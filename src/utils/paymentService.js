/**
 * Epoint Payment Gateway Service
 * Simplified version - handles only basic payment operations
 */

class PaymentService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'https://backlify-v2.onrender.com';
  }

  /**
   * Create a standard payment request
   * @param {Object} paymentData - Payment information
   * @returns {Promise<Object>} Payment response
   */
  async createPaymentRequest(paymentData) {
    try {
      // Get user ID from localStorage or from the payment data
      const userId = paymentData.userId || localStorage.getItem('username') || localStorage.getItem('XAuthUserId');
      
      if (!userId) {
        throw new Error('User ID is required for payment request');
      }

      // Get plan ID
      const planId = paymentData.planId || paymentData.plan?.id;
      
      if (!planId) {
        throw new Error('Plan ID is required for payment request');
      }

      console.log('Payment request data:', {
        userId,
        planId,
        plan: paymentData.plan,
        amount: paymentData.amount,
        orderId: paymentData.orderId
      });

      const response = await fetch(`${this.baseURL}/api/epoint/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`,
          'x-user-id': userId
        },
        body: JSON.stringify({
          amount: paymentData.amount,
          order_id: paymentData.orderId,
          description: paymentData.description || 'Payment',
          currency: paymentData.currency || 'AZN',
          language: paymentData.language || 'az',
          user_id: userId,
          plan_id: paymentData.planId || paymentData.plan?.id
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        // Store order ID for later verification
        localStorage.setItem('pending_order_id', paymentData.orderId);
        return result;
      } else {
        throw new Error(result.message || 'Payment request failed');
      }
    } catch (error) {
      console.error('Payment request error:', error);
      throw error;
    }
  }

  /**
   * Check payment status
   * @param {string} orderId - Order ID to check
   * @param {string} transactionId - Optional transaction ID
   * @returns {Promise<Object>} Payment status
   */
  async checkPaymentStatus(orderId, transactionId = null) {
    try {
      // Get user ID from localStorage
      const userId = localStorage.getItem('username') || localStorage.getItem('XAuthUserId');
      
      const response = await fetch(`${this.baseURL}/api/epoint/check-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`,
          'x-user-id': userId
        },
        body: JSON.stringify({
          order_id: orderId,
          transaction_id: transactionId,
          user_id: userId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error('Status check failed');
      }
    } catch (error) {
      console.error('Status check error:', error);
      throw error;
    }
  }

  /**
   * Get authentication token
   * @returns {string} Auth token
   */
  getAuthToken() {
    return localStorage.getItem('accessToken') || '';
  }

  /**
   * Generate unique order ID
   * @returns {string} Unique order ID
   */
  generateOrderId() {
    const timestamp = Math.floor(Date.now() / 1000); // seconds
    const ms = Date.now() % 1000; // milliseconds part
    
    return `${timestamp}${ms}`;
  }

  /**
   * Clear pending order data from localStorage
   */
  clearPendingOrder() {
    localStorage.removeItem('pending_order_id');
    localStorage.removeItem('pending_card_registration');
    localStorage.removeItem('pre_auth_transaction');
    localStorage.removeItem('pre_auth_order_id');
  }

  /**
   * Format amount for display
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency code
   * @returns {string} Formatted amount
   */
  formatAmount(amount, currency = 'AZN') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }
}

// Create and export a singleton instance
const paymentService = new PaymentService();
export default paymentService;