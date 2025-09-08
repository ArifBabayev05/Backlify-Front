import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, Button, Badge, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { 
  CheckCircle, 
  Star, 
  Lightning, 
  Gem,
  ArrowRight,
  InfoCircle
} from 'react-bootstrap-icons';
import { toast } from 'react-hot-toast';
import subscriptionService from '../../utils/subscriptionService';

const SubscriptionPlans = ({ 
  currentPlan = null,
  onPlanSelect,
  onUpgrade,
  loading = false 
}) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);

  // Load subscription plans from API
  useEffect(() => {
    const loadPlans = async () => {
      try {
        setPlansLoading(true);
        const apiPlans = await subscriptionService.getSubscriptionPlans();
        
        // Transform API data to match component structure
        const transformedPlans = apiPlans.map(plan => ({
          ...plan,
          period: plan.price === 0 ? 'forever' : 'month',
          description: plan.id === 'basic' ? 'Perfect for getting started' :
                      plan.id === 'pro' ? 'Best for growing businesses' :
                      'For large-scale operations',
          limitations: plan.id === 'basic' ? [
            'Limited API calls',
            'No priority support',
            'Basic analytics'
          ] : [],
          popular: plan.id === 'pro',
          icon: plan.id === 'basic' ? <Lightning size={24} /> :
                plan.id === 'pro' ? <Star size={24} /> :
                <Gem size={24} />,
          color: plan.id === 'basic' ? 'secondary' :
                 plan.id === 'pro' ? 'primary' :
                 'warning'
        }));
        
        setPlans(transformedPlans);
      } catch (error) {
        console.error('Error loading subscription plans:', error);
        toast.error('Failed to load subscription plans');
      } finally {
        setPlansLoading(false);
      }
    };

    loadPlans();
  }, []);

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    
    if (plan.id === currentPlan?.id) {
      toast('This is your current plan', { icon: 'ℹ️' });
      return;
    }

    if (plan.id === 'basic' && currentPlan?.id !== 'basic') {
      toast.error('Cannot downgrade to basic plan. Contact support for assistance.');
      return;
    }

    onPlanSelect?.(plan);
  };

  const handleUpgrade = (plan) => {
    onUpgrade?.(plan);
  };

  const formatPrice = (price, currency, period) => {
    if (price === 0) return 'Free';
    
    const formattedPrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
    
    return `${formattedPrice}/${period}`;
  };

  const getPlanStatus = (plan) => {
    if (currentPlan?.id === plan.id) {
      return { text: 'Current Plan', variant: 'success' };
    }
    
    if (currentPlan && plan.price > currentPlan.price) {
      return { text: 'Upgrade', variant: 'primary' };
    }
    
    if (currentPlan && plan.price < currentPlan.price) {
      return { text: 'Downgrade', variant: 'secondary' };
    }
    
    return { text: 'Select Plan', variant: 'primary' };
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="text-center mb-5">
        <motion.h2 variants={itemVariants} className="display-5 fw-bold text-white mb-3">
          Choose Your Plan
        </motion.h2>
        <motion.p variants={itemVariants} className="lead text-light">
          Select the plan that best fits your needs. You can upgrade or downgrade at any time.
        </motion.p>
      </div>

      {plansLoading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="text-white mt-3">Loading subscription plans...</p>
        </div>
      ) : (
        <Row className="g-4">
          {plans.map((plan, index) => {
          const status = getPlanStatus(plan);
          const isCurrentPlan = currentPlan?.id === plan.id;
          const isUpgrade = currentPlan && plan.price > currentPlan.price;
          
          return (
            <Col key={plan.id} md={4}>
              <motion.div
                variants={itemVariants}
                className="h-100"
              >
                <Card 
                  className={`h-100 border-0 position-relative ${
                    plan.popular ? 'popular-plan' : 'glass'
                  }`}
                  style={{
                    background: plan.popular 
                      ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)'
                      : 'rgba(255, 255, 255, 0.05)',
                    border: plan.popular ? '2px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    transform: selectedPlan?.id === plan.id ? 'scale(1.02)' : 'scale(1)',
                    transition: 'transform 0.2s ease'
                  }}
                  onClick={() => handlePlanSelect(plan)}
                >
                  {plan.popular && (
                    <div className="position-absolute top-0 start-50 translate-middle">
                      <Badge 
                        bg="primary" 
                        className="px-3 py-2 rounded-pill"
                        style={{ fontSize: '0.8rem' }}
                      >
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <Card.Body className="p-4 text-center">
                    <div className="mb-4">
                      <div 
                        className={`d-inline-flex align-items-center justify-content-center rounded-circle mb-3 ${
                          plan.color === 'primary' ? 'text-primary' :
                          plan.color === 'warning' ? 'text-warning' : 'text-secondary'
                        }`}
                        style={{ 
                          width: '60px', 
                          height: '60px',
                          background: `rgba(${
                            plan.color === 'primary' ? '59, 130, 246' :
                            plan.color === 'warning' ? '255, 193, 7' : '108, 117, 125'
                          }, 0.1)`
                        }}
                      >
                        {plan.icon}
                      </div>
                      
                      <h4 className="text-white mb-2">{plan.name}</h4>
                      <p className="text-white mb-3">{plan.description}</p>
                      
                      <div className="mb-4">
                        <div className="display-6 fw-bold text-white">
                          {formatPrice(plan.price, plan.currency, plan.period)}
                        </div>
                        {plan.period !== 'forever' && (
                          <small className="text-white">billed monthly</small>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <h6 className="text-white mb-3">Features included:</h6>
                      <ul className="list-unstyled">
                        {plan.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="text-light mb-2 d-flex align-items-start">
                            <CheckCircle className="text-success me-2 mt-1" size={16} />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {plan.limitations.length > 0 && (
                      <div className="mb-4">
                        <h6 className="text-white mb-3">Limitations:</h6>
                        <ul className="list-unstyled">
                          {plan.limitations.map((limitation, limitationIndex) => (
                            <li key={limitationIndex} className="text-white mb-1 small">
                              • {limitation}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="mt-auto">
                      {isCurrentPlan ? (
                        <Button
                          variant="success"
                          size="lg"
                          className="w-100"
                          disabled
                        >
                          <CheckCircle className="me-2" />
                          Current Plan
                        </Button>
                      ) : isUpgrade ? (
                        <Button
                          variant="primary"
                          size="lg"
                          className="w-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpgrade(plan);
                          }}
                          disabled={loading}
                        >
                          <ArrowRight className="me-2" />
                          Upgrade to {plan.name}
                        </Button>
                      ) : (
                        <Button
                          variant={status.variant}
                          size="lg"
                          className="w-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlanSelect(plan);
                          }}
                          disabled={loading}
                        >
                          {status.text}
                        </Button>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </motion.div>
            </Col>
          );
        })}
              </Row>
      )}

      {/* Additional Information */}
      <motion.div variants={itemVariants} className="mt-5">
        <Alert variant="info" className="border-0 glass">
          <div className="d-flex align-items-start gap-3">
            <InfoCircle size={20} className="mt-1" />
            <div>
              <h6 className="mb-2">Plan Information</h6>
              <ul className="mb-0 small">
                <li>All plans include a 14-day free trial</li>
                <li>You can upgrade or downgrade at any time</li>
                <li>No setup fees or hidden charges</li>
                <li>Cancel anytime with no penalties</li>
                <li>Enterprise plans include custom pricing and features</li>
              </ul>
            </div>
          </div>
        </Alert>
      </motion.div>
    </motion.div>
  );
};

export default SubscriptionPlans;
