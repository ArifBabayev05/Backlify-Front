import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Container, Row, Col, Card, Button, Alert, Badge, Spinner } from 'react-bootstrap';
import { 
  CreditCard2Front, 
  Star, 
  ArrowRight,
  CheckCircle,
  InfoCircle,
  ArrowLeft,
  Shield,
  Lock,
  Clock
} from 'react-bootstrap-icons';
import { toast } from 'react-hot-toast';
import { useAuth } from '../components/auth/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import RequireAuth from '../components/auth/RequireAuth';
import NavBar from '../components/layout/NavBar';
import PaymentForm from '../components/payment/PaymentForm';
import PaymentStatus from '../components/payment/PaymentStatus';
import SubscriptionPlans from '../components/payment/SubscriptionPlans';
import RefundManager from '../components/payment/RefundManager';
import paymentService from '../utils/paymentService';
import { upgradeSubscription, getUserSubscription, isAuthenticated, loadTokensFromStorage } from '../utils/apiService';

const PaymentDemoPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState('plans'); // plans, payment, status, refund
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  // Load current subscription and clear pending orders when component mounts
  useEffect(() => {
    paymentService.clearPendingOrder();
    loadCurrentSubscription();
  }, []);

  // Handle routing based on URL path
  useEffect(() => {
    const path = location.pathname;
    if (path === '/payment/upgrade') {
      setCurrentStep('plans');
    } else if (path === '/payment/plans') {
      setCurrentStep('plans');
    }
  }, [location.pathname]);

  // Load current subscription
  const loadCurrentSubscription = async () => {
    try {
      setSubscriptionLoading(true);
      const subscription = await getUserSubscription();
      setCurrentSubscription(subscription);
    } catch (error) {
      console.error('Error loading subscription:', error);
      // Set default subscription if API fails
      setCurrentSubscription({ plan: 'basic', status: 'active' });
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const handlePlanSelect = async (plan) => {
    try {
      setLoading(true);
      setSelectedPlan(plan);
      
      // Try to load tokens from storage first
      loadTokensFromStorage();
      
      // Check authentication before making API call
      if (!isAuthenticated()) {
        console.log('Authentication failed. LocalStorage contents:', {
          accessToken: localStorage.getItem('accessToken'),
          refreshToken: localStorage.getItem('refreshToken'),
          username: localStorage.getItem('username'),
          email: localStorage.getItem('email')
        });
        toast.error('Please log in to upgrade your subscription');
        navigate('/auth');
        return;
      }
      
      // Clear any previous payment results and pending orders
      setPaymentResult(null);
      paymentService.clearPendingOrder();
      
      // Call real API to upgrade subscription
      const upgradeResult = await upgradeSubscription(plan.id);
      
      if (upgradeResult.redirectUrl) {
        // Get user ID for payment
        const userId = user?.username || localStorage.getItem('username');
        
        // Create order data for payment form
        const order = {
          id: upgradeResult.orderId || paymentService.generateOrderId(),
          total: plan.price,
          currency: plan.currency,
          description: `${plan.name} - Monthly Subscription`,
          plan: plan,
          redirectUrl: upgradeResult.redirectUrl,
          userId: userId
        };
        
        setOrderData(order);
        setCurrentStep('payment');
        toast.success(`Selected ${plan.name} plan`);
      } else {
        throw new Error('No redirect URL received from server');
      }
    } catch (error) {
      console.error('Error selecting plan:', error);
      toast.error(`Failed to select plan: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPlans = () => {
    setCurrentStep('plans');
    setSelectedPlan(null);
    setOrderData(null);
    setPaymentResult(null);
    navigate('/payment/plans');
  };

  const handleBackToAccount = () => {
    navigate('/account');
  };

  const handlePaymentSuccess = async (result) => {
    setPaymentResult(result);
    setCurrentStep('status');
    toast.success('Payment completed successfully!');
    
    // Reload subscription to get updated plan
    try {
      await loadCurrentSubscription();
    } catch (error) {
      console.error('Error reloading subscription:', error);
    }
  };

  const handlePaymentError = (error) => {
    toast.error(`Payment failed: ${error.message}`);
  };

  const handlePaymentRedirect = (url) => {
    // Show loading toast
    toast.loading('Redirecting to payment gateway...', { id: 'redirect' });
    console.log('Redirect URL:', url);
    
    // Redirect to the payment gateway
    setTimeout(() => {
      window.location.href = url;
    }, 1000); // Small delay to show the loading message
  };

  const handleStatusUpdate = (status) => {
    console.log('Payment status updated:', status);
  };

  const handleRetryPayment = () => {
    setCurrentStep('payment');
    setPaymentResult(null);
    
    // Clear any pending orders and generate a new order ID for retry
    paymentService.clearPendingOrder();
    if (orderData) {
      const newOrderData = {
        ...orderData,
        id: paymentService.generateOrderId()
      };
      setOrderData(newOrderData);
    }
  };

  const handleContinue = () => {
    setCurrentStep('refund');
  };

  const handleRefundComplete = (result) => {
    toast.success('Refund processed successfully!');
    console.log('Refund result:', result);
  };

  const handleRefundError = (error) => {
    toast.error(`Refund failed: ${error.message}`);
  };

  const debugAuth = () => {
    console.log('=== AUTH DEBUG ===');
    console.log('User from context:', user);
    console.log('LocalStorage contents:', {
      accessToken: localStorage.getItem('accessToken'),
      refreshToken: localStorage.getItem('refreshToken'),
      username: localStorage.getItem('username'),
      email: localStorage.getItem('email'),
      userPlan: localStorage.getItem('userPlan')
    });
    console.log('isAuthenticated():', isAuthenticated());
    console.log('==================');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 'plans':
        return (
          <motion.div variants={itemVariants}>
            <div className="mb-4">
              <Button 
                variant="outline-light" 
                onClick={handleBackToAccount}
                className="mb-3"
              >
                <ArrowLeft className="me-2" />
                Back to Account
              </Button>
            </div>
            <SubscriptionPlans
              currentPlan={currentSubscription}
              onPlanSelect={handlePlanSelect}
              onUpgrade={handlePlanSelect}
              loading={loading || subscriptionLoading}
            />
          </motion.div>
        );

      case 'payment':
        return (
          <motion.div variants={itemVariants}>
            <div className="mb-4">
              <Button 
                variant="outline-light" 
                onClick={handleBackToPlans}
                className="mb-3"
              >
                <ArrowLeft className="me-2" />
                Back to Plans
              </Button>
            </div>
            <Row className="justify-content-center">
              <Col lg={8}>
                {loading ? (
                  <Card className="glass border-0">
                    <Card.Body className="p-4 text-center">
                      <Spinner animation="border" variant="primary" className="mb-3" />
                      <h5 className="text-white">Preparing your payment...</h5>
                      <p className="text-white">Please wait while we set up your payment details.</p>
                    </Card.Body>
                  </Card>
                ) : orderData ? (
                  <PaymentForm
                    orderData={orderData}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                    onPaymentRedirect={handlePaymentRedirect}
                  />
                ) : (
                  <Card className="glass border-0">
                    <Card.Body className="p-4 text-center">
                      <h5 className="text-white">Payment Information Not Available</h5>
                      <p className="text-white">Please go back and select a plan to continue.</p>
                      <Button 
                        variant="primary" 
                        onClick={handleBackToPlans}
                        className="mt-3"
                      >
                        Back to Plans
                      </Button>
                    </Card.Body>
                  </Card>
                )}
              </Col>
            </Row>
          </motion.div>
        );

      case 'status':
        return (
          <motion.div variants={itemVariants}>
            <Row className="justify-content-center">
              <Col lg={6}>
                <PaymentStatus
                  orderId={orderData?.id}
                  transactionId={paymentResult?.transaction}
                  onStatusUpdate={handleStatusUpdate}
                  onRetry={handleRetryPayment}
                  onContinue={handleContinue}
                />
              </Col>
            </Row>
          </motion.div>
        );

      case 'refund':
        return (
          <motion.div variants={itemVariants}>
            <Row className="justify-content-center">
              <Col lg={6}>
                <RefundManager
                  transactionId={paymentResult?.transaction}
                  orderAmount={orderData?.total}
                  currency={orderData?.currency}
                  onRefundComplete={handleRefundComplete}
                  onRefundError={handleRefundError}
                />
              </Col>
            </Row>
          </motion.div>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'plans':
        return 'Choose Your Plan';
      case 'payment':
        return 'Complete Payment';
      case 'status':
        return 'Payment Status';
      case 'refund':
        return 'Refund Management';
      default:
        return 'Payment Demo';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'plans':
        return 'Select a subscription plan to get started with Backlify';
      case 'payment':
        return 'Choose your payment method and complete the transaction';
      case 'status':
        return 'Verify your payment status and transaction details';
      case 'refund':
        return 'Manage refunds for completed transactions';
      default:
        return 'Epoint Payment Gateway Integration Demo';
    }
  };

  return (
    <RequireAuth>
      <NavBar />
      <div className="page-wrapper" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
        <Container className="py-5">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="text-center mb-5">
              <h1 className="display-4 fw-bold text-white mb-3">
                <CreditCard2Front className="me-3" />
                {getStepTitle()}
              </h1>
              <p className="lead text-light mb-4">
                {getStepDescription()}
              </p>
              
              {/* Step Indicator */}
              <div className="d-flex justify-content-center mb-4">
                <div className="d-flex align-items-center gap-3">
                  {['plans', 'payment', 'status', 'refund'].map((step, index) => (
                    <div key={step} className="d-flex align-items-center">
                      <div
                        className={`rounded-circle d-flex align-items-center justify-content-center ${
                          currentStep === step
                            ? 'bg-primary text-white'
                            : ['plans', 'payment', 'status', 'refund'].indexOf(currentStep) > index
                            ? 'bg-success text-white'
                            : 'bg-secondary text-white'
                        }`}
                        style={{ width: '40px', height: '40px' }}
                      >
                        {['plans', 'payment', 'status', 'refund'].indexOf(currentStep) > index ? (
                          <CheckCircle size={20} />
                        ) : (
                          <span className="fw-bold">{index + 1}</span>
                        )}
                      </div>
                      {index < 3 && (
                        <div
                          className={`mx-2 ${
                            ['plans', 'payment', 'status', 'refund'].indexOf(currentStep) > index
                              ? 'border-success'
                              : 'border-secondary'
                          }`}
                          style={{ width: '40px', height: '2px', borderTop: '2px solid' }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>



            {/* Security and Trust Information */}
            <motion.div variants={itemVariants} className="mb-5">
              <Row className="g-4">
                <Col md={4}>
                  <Card className="border-0 glass h-100">
                    <Card.Body className="text-center p-4">
                      <Shield size={40} className="text-success mb-3" />
                      <h6 className="text-white mb-2">Bank-Level Security</h6>
                      <p className="text-white small mb-0">
                        Your payment information is encrypted and processed securely through Epoint's PCI-compliant infrastructure.
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="border-0 glass h-100">
                    <Card.Body className="text-center p-4">
                      <Lock size={40} className="text-primary mb-3" />
                      <h6 className="text-white mb-2">Instant Activation</h6>
                      <p className="text-white small mb-0">
                        Your subscription is activated immediately after successful payment. No waiting, no delays.
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="border-0 glass h-100">
                    <Card.Body className="text-center p-4">
                      <Clock size={40} className="text-warning mb-3" />
                      <h6 className="text-white mb-2">24/7 Support</h6>
                      <p className="text-white small mb-0">
                        Our support team is available around the clock to help with any questions or issues.
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </motion.div>

            {/* Step Content */}
            {renderStepContent()}

            {/* Navigation Buttons */}
            <motion.div variants={itemVariants} className="mt-5 text-center">
              <div className="d-flex justify-content-center gap-3">
                {currentStep !== 'plans' && (
                  <Button
                    variant="outline-light"
                    onClick={() => {
                      const steps = ['plans', 'payment', 'status', 'refund'];
                      const currentIndex = steps.indexOf(currentStep);
                      if (currentIndex > 0) {
                        const newStep = steps[currentIndex - 1];
                        setCurrentStep(newStep);
                        
                        // Reset state when going back to plans
                        if (newStep === 'plans') {
                          setSelectedPlan(null);
                          setOrderData(null);
                          setPaymentResult(null);
                        }
                      }
                    }}
                    className="d-flex align-items-center gap-2"
                  >
                    ← Back
                  </Button>
                )}
                
                {currentStep === 'plans' && selectedPlan && (
                  <Button
                    variant="primary"
                    onClick={() => setCurrentStep('payment')}
                    className="d-flex align-items-center gap-2"
                  >
                    Continue to Payment
                    <ArrowRight />
                  </Button>
                )}
                
                {currentStep === 'payment' && (
                  <Button
                    variant="outline-primary"
                    onClick={() => setCurrentStep('plans')}
                    className="d-flex align-items-center gap-2"
                  >
                    Change Plan
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        </Container>
      </div>
    </RequireAuth>
  );
};

export default PaymentDemoPage;
