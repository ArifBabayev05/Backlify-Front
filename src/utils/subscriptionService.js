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
        // Add missing properties to API data
        const enhancedPlans = result.data.map((plan, index) => ({
          ...plan,
          isPopular: index === 1, // Make the second plan (Pro) popular
          buttonText: this.getButtonText(plan.id, plan.name),
          description: plan.description || this.getDescription(plan.id, plan.name)
        }));
        
        // Cache the result
        this.cache.set(cacheKey, {
          data: enhancedPlans,
          timestamp: Date.now()
        });
        
        return enhancedPlans;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      
      // Return fallback data if API fails
      return this.getFallbackPlans();
    }
  }

  // Get button text for a plan
  getButtonText(planId, planName) {
    const buttonTexts = {
      'basic': 'Start Free',
      'starter': 'Start Free',
      'developer': 'Start Free',
      'pro': 'Start Trial',
      'professional': 'Start Trial',
      'enterprise': 'Contact Sales',
      'custom': 'Contact Sales'
    };
    
    return buttonTexts[planId] || buttonTexts[planName?.toLowerCase()] || 'Get Started';
  }

  // Get description for a plan
  getDescription(planId, planName) {
    const descriptions = {
      'basic': 'Perfect for learning and prototyping',
      'starter': 'Perfect for learning and prototyping',
      'developer': 'Perfect for learning and prototyping',
      'pro': 'For growing businesses and teams',
      'professional': 'For growing businesses and teams',
      'enterprise': 'For large organizations',
      'custom': 'For large organizations'
    };
    
    return descriptions[planId] || descriptions[planName?.toLowerCase()] || 'Choose this plan';
  }

  // Fallback plans if API is unavailable
  getFallbackPlans() {
    return [
      {
        id: "basic",
        name: "Basic Plan",
        price: 0,
        currency: "AZN",
        description: "Perfect for learning and prototyping",
        features: [
          "Basic API access",
          "1000 requests/month",
          "Email support"
        ],
        buttonText: "Start Free"
      },
      {
        id: "pro",
        name: "Pro Plan",
        price: 9.99,
        currency: "AZN",
        description: "For growing businesses and teams",
        features: [
          "Pro API access",
          "10000 requests/month",
          "Priority support"
        ],
        isPopular: true,
        buttonText: "Start Trial"
      },
      {
        id: "enterprise",
        name: "Enterprise Plan",
        price: 29.99,
        currency: "AZN",
        description: "For large organizations",
        features: [
          "Enterprise API access",
          "Unlimited requests",
          "24/7 support",
          "Custom integrations"
        ],
        buttonText: "Contact Sales"
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
