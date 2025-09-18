// Subscription Service for fetching plans and managing subscriptions
const API_BASE_URL = 'https://backlify-v2.onrender.com/api';

class SubscriptionService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Get subscription plans from API
  async getSubscriptionPlans() {
    const cacheKey = 'subscription_plans';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      // Get username from localStorage
      const username = localStorage.getItem('username');
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Add username header if available
      if (username) {
        headers['x-user-id'] = username;
      }
      
      const response = await fetch(`${API_BASE_URL}/user/plans`, {
        method: 'GET',
        headers: headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Cache the result
        this.cache.set(cacheKey, {
          data: result.data,
          timestamp: Date.now()
        });
        
        return result.data;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      
      // Return fallback data if API fails
      return this.getFallbackPlans();
    }
  }

  // Fallback plans if API is unavailable
  getFallbackPlans() {
    return [
      {
        id: "basic",
        name: "Basic Plan",
        price: 0,
        currency: "AZN",
        features: [
          "Basic API access",
          "1000 requests/month",
          "Email support"
        ]
      },
      {
        id: "pro",
        name: "Pro Plan",
        price: 0.01,
        currency: "AZN",
        features: [
          "Pro API access",
          "10000 requests/month",
          "Priority support",
          "Custom domains"
        ]
      },
      {
        id: "enterprise",
        name: "Enterprise Plan",
        price: 0.02,
        currency: "AZN",
        features: [
          "Enterprise API access",
          "Unlimited requests",
          "24/7 support",
          "Custom integrations",
          "SLA guarantee"
        ]
      }
    ];
  }

  // Get plan by ID
  async getPlanById(planId) {
    const plans = await this.getSubscriptionPlans();
    return plans.find(plan => plan.id === planId);
  }

  // Format price for display
  formatPrice(price, currency = 'AZN') {
    if (price === 0) {
      return 'Free';
    }
    return `${price} ${currency}`;
  }

  // Get plan features as formatted list
  getPlanFeatures(plan) {
    return plan.features || [];
  }

  // Clear cache (useful for testing or when data needs to be refreshed)
  clearCache() {
    this.cache.clear();
  }
}

// Create singleton instance
const subscriptionService = new SubscriptionService();

export default subscriptionService;
