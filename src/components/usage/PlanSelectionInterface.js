import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, Button, Badge, Row, Col, Alert, Spinner, ProgressBar } from 'react-bootstrap';
import { 
  CheckCircle, 
  Star, 
  Lightning, 
  Gem,
  ArrowRight,
  InfoCircle,
  Award,
  Thunderbolt,
  Server,
  Database
} from 'react-bootstrap-icons';
import { toast } from 'react-hot-toast';
import { getSubscriptionPlans, setXAuthUserId } from '../../utils/apiService';

const PlanSelectionInterface = ({ 
  currentPlan = null,
  onPlanSelect,
  onUpgrade,
  loading = false,
  showUsageInfo = true
}) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);

  // Load subscription plans from API
  useEffect(() => {
    const loadPlans = async () => {
      try {
        setPlansLoading(true);
        
        // Ensure XAuthUserId is set before making API calls
        const username = localStorage.getItem('username');
        if (username) {
          setXAuthUserId(username);
        }
        
        const apiPlans = await getSubscriptionPlans();
        
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
                <Award size={24} />,
          color: plan.id === 'basic' ? 'secondary' :
                 plan.id === 'pro' ? 'primary' :
                 'warning',
          isUnlimited: plan.id === 'enterprise'
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

  const getUsageLimitText = (plan) => {
    if (plan.isUnlimited) {
      return 'Unlimited';
    }
    
    const requestsFeature = plan.features.find(f => f.includes('requests'));
    if (requestsFeature) {
      return requestsFeature;
    }
    
    return 'Limited';
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
                   className={`card h-100 position-relative ${
                     plan.popular ? 'popular-plan' : ''
                   }`}
                   style={{
                     background: plan.popular 
                       ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.08) 100%)'
                       : 'rgba(255, 255, 255, 0.05)',
                     border: plan.popular ? '2px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                     cursor: 'pointer',
                     transform: selectedPlan?.id === plan.id ? 'translateY(-8px) scale(1.02)' : 'translateY(0)',
                     transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                     backdropFilter: 'blur(12px)',
                     boxShadow: plan.popular 
                       ? '0 25px 50px -12px rgba(59, 130, 246, 0.25)' 
                       : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                   }}
                   onClick={() => handlePlanSelect(plan)}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.transform = 'translateY(-12px) scale(1.03)';
                     e.currentTarget.style.boxShadow = plan.popular 
                       ? '0 32px 64px -12px rgba(59, 130, 246, 0.35)' 
                       : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.transform = selectedPlan?.id === plan.id ? 'translateY(-8px) scale(1.02)' : 'translateY(0)';
                     e.currentTarget.style.boxShadow = plan.popular 
                       ? '0 25px 50px -12px rgba(59, 130, 246, 0.25)' 
                       : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                   }}
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

                  {plan.isUnlimited && (
                    <div className="position-absolute top-0 end-0 m-3">
                      <Badge 
                        bg="warning" 
                        className="px-2 py-1 rounded-pill d-flex align-items-center gap-1"
                        style={{ fontSize: '0.7rem' }}
                      >
                        <Thunderbolt size={12} />
                        Unlimited
                      </Badge>
                    </div>
                  )}

                   <Card.Body className="card-body text-center">
                     <div className="mb-6">
                       <div 
                         className={`d-inline-flex align-items-center justify-content-center rounded-3 mb-4 ${
                           plan.color === 'primary' ? 'text-primary' :
                           plan.color === 'warning' ? 'text-warning' : 'text-secondary'
                         }`}
                         style={{ 
                           width: '80px', 
                           height: '80px',
                           background: `linear-gradient(135deg, rgba(${
                             plan.color === 'primary' ? '59, 130, 246' :
                             plan.color === 'warning' ? '255, 193, 7' : '108, 117, 125'
                           }, 0.1), rgba(${
                             plan.color === 'primary' ? '59, 130, 246' :
                             plan.color === 'warning' ? '255, 193, 7' : '108, 117, 125'
                           }, 0.05))`,
                           border: `1px solid rgba(${
                             plan.color === 'primary' ? '59, 130, 246' :
                             plan.color === 'warning' ? '255, 193, 7' : '108, 117, 125'
                           }, 0.2)`,
                           boxShadow: `0 8px 32px rgba(${
                             plan.color === 'primary' ? '59, 130, 246' :
                             plan.color === 'warning' ? '255, 193, 7' : '108, 117, 125'
                           }, 0.1)`
                         }}
                       >
                         {plan.icon}
                       </div>
                       
                       <h3 className="heading-4 text-white mb-3">{plan.name}</h3>
                       <p className="body-base text-light mb-4">{plan.description}</p>
                       
                       <div className="mb-4">
                         <div className="heading-2 text-white mb-2">
                           {formatPrice(plan.price, plan.currency, plan.period)}
                         </div>
                         {plan.period !== 'forever' && (
                           <span className="caption text-white">billed monthly</span>
                         )}
                       </div>
                     </div>

                     {/* Usage Limits Display */}
                     {showUsageInfo && (
                       <div className="mb-6 p-4 rounded-2" style={{ 
                         background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                         border: '1px solid rgba(255, 255, 255, 0.15)',
                         backdropFilter: 'blur(8px)'
                       }}>
                         <h6 className="heading-6 text-white mb-4">Usage Limits</h6>
                         <div className="d-flex justify-content-between align-items-center mb-3">
                           <div className="d-flex align-items-center gap-2">
                             <div className="p-1 rounded-1" style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
                               <Server size={14} className="text-primary" />
                             </div>
                             <span className="body-small text-light">API Requests</span>
                           </div>
                           <span className="body-small text-white fw-medium">
                             {getUsageLimitText(plan)}
                           </span>
                         </div>
                         <div className="d-flex justify-content-between align-items-center">
                           <div className="d-flex align-items-center gap-2">
                             <div className="p-1 rounded-1" style={{ background: 'rgba(139, 92, 246, 0.2)' }}>
                               <Database size={14} className="text-primary" />
                             </div>
                             <span className="body-small text-light">Projects</span>
                           </div>
                           <span className="body-small text-white fw-medium">
                             {plan.features.find(f => f.includes('Projects')) || 'Unlimited'}
                           </span>
                         </div>
                       </div>
                     )}

                     <div className="mb-6">
                       <h6 className="heading-6 text-white mb-4">Features included:</h6>
                       <ul className="list-unstyled">
                         {plan.features.map((feature, featureIndex) => (
                           <li key={featureIndex} className="text-light mb-3 d-flex align-items-start gap-3">
                             <div className="p-1 rounded-1" style={{ background: 'rgba(16, 185, 129, 0.2)' }}>
                               <CheckCircle className="text-success" size={14} />
                             </div>
                             <span className="body-small">{feature}</span>
                           </li>
                         ))}
                       </ul>
                     </div>

                     {plan.limitations.length > 0 && (
                       <div className="mb-6">
                         <h6 className="heading-6 text-white mb-4">Limitations:</h6>
                         <ul className="list-unstyled">
                           {plan.limitations.map((limitation, limitationIndex) => (
                             <li key={limitationIndex} className="text-light mb-2 d-flex align-items-start gap-3">
                               <div className="p-1 rounded-1" style={{ background: 'rgba(239, 68, 68, 0.2)' }}>
                                 <div className="text-danger" style={{ width: '14px', height: '14px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>•</div>
                               </div>
                               <span className="body-small">{limitation}</span>
                             </li>
                           ))}
                         </ul>
                       </div>
                     )}

                    <div className="mt-auto">
                      {isCurrentPlan ? (
                        <Button
                          variant="secondary"
                          size="lg"
                          className="btn btn-secondary btn-lg w-100"
                          disabled
                        >
                          <CheckCircle size={16} className="me-2" />
                          Current Plan
                        </Button>
                      ) : isUpgrade ? (
                        <Button
                          variant="primary"
                          size="lg"
                          className="btn btn-primary btn-lg w-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpgrade(plan);
                          }}
                          disabled={loading}
                        >
                          <ArrowRight size={16} className="me-2" />
                          Upgrade to {plan.name}
                        </Button>
                      ) : (
                        <Button
                          variant={status.variant === 'primary' ? 'primary' : 'outline'}
                          size="lg"
                          className={`btn btn-${status.variant === 'primary' ? 'primary' : 'outline'} btn-lg w-100`}
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
        <Alert variant="info" className="border-0">
          <div className="d-flex align-items-start gap-3">
            <InfoCircle size={20} className="mt-1" />
            <div className="text-white">
              <h6 className="mb-2 text-white">Plan Information</h6>
              <ul className="mb-0 small">
                <li className="text-white">All plans include real-time usage monitoring</li>
                <li className="text-white">You can upgrade or downgrade at any time</li>
                <li className="text-white">Usage limits reset monthly</li>
                <li className="text-white">Enterprise plans have unlimited usage</li>
                <li className="text-white">Get notifications when approaching limits</li>
              </ul>
            </div>
          </div>
        </Alert>
      </motion.div>
    </motion.div>
  );
};

export default PlanSelectionInterface;
