import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Container, Button, Card, Row, Col, Badge, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  CheckCircle, 
  ArrowRight, 
  HouseDoor, 
  CreditCard2Front, 
  Star, 
  Lightning, 
  Gem,
  Shield,
  Clock,
  Gift
} from 'react-bootstrap-icons';
import { toast } from 'react-hot-toast';
import { useAuth } from '../components/auth/AuthContext';
import RequireAuth from '../components/auth/RequireAuth';
import { getUserSubscription } from '../utils/apiService';

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user: currentUser } = useAuth();
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Extract payment details from URL parameters
        const transactionId = searchParams.get('transaction_id');
        const amount = searchParams.get('amount');
        const currency = searchParams.get('currency');
        const status = searchParams.get('status');

        if (transactionId) {
          setPaymentDetails({
            transactionId,
            amount,
            currency: currency || 'AZN',
            status: status || 'success'
          });
        }

        // Load current subscription to show upgrade confirmation
        try {
          const subscriptionData = await getUserSubscription();
          setSubscription(subscriptionData);
        } catch (error) {
          console.error('Error loading subscription:', error);
        }

        // Show success toast
        toast.success('Payment completed successfully!');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [searchParams]);

  const handleContinue = () => {
    navigate('/dashboard');
  };

  const handleGoHome = () => {
    navigate('/landing');
  };

  const getPlanIcon = (planId) => {
    switch (planId) {
      case 'basic':
        return <Lightning size={24} className="text-secondary" />;
      case 'pro':
        return <Star size={24} className="text-primary" />;
      case 'enterprise':
        return <Gem size={24} className="text-warning" />;
      default:
        return <Star size={24} className="text-primary" />;
    }
  };

  const getPlanName = (planId) => {
    switch (planId) {
      case 'basic':
        return 'Basic Plan';
      case 'pro':
        return 'Pro Plan';
      case 'enterprise':
        return 'Enterprise Plan';
      default:
        return 'Unknown Plan';
    }
  };

  const getPlanColor = (planId) => {
    switch (planId) {
      case 'basic':
        return 'secondary';
      case 'pro':
        return 'primary';
      case 'enterprise':
        return 'warning';
      default:
        return 'primary';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
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

  if (loading) {
    return (
      <RequireAuth>
        <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
          <div className="text-center">
            <Spinner animation="border" variant="primary" size="lg" />
            <p className="text-white mt-3">Loading your subscription details...</p>
          </div>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div className="min-vh-100 d-flex align-items-center" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
        <Container>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center"
          >
            <motion.div variants={itemVariants}>
              <div className="mb-4">
                <CheckCircle 
                  size={80} 
                  className="text-success mb-3"
                  style={{ filter: 'drop-shadow(0 0 20px rgba(40, 167, 69, 0.5))' }}
                />
              </div>
            </motion.div>

            <motion.h1 
              variants={itemVariants}
              className="display-4 fw-bold text-white mb-3"
            >
              Payment Successful!
            </motion.h1>

            <motion.p 
              variants={itemVariants}
              className="lead text-light mb-4"
            >
              Your subscription has been upgraded successfully. Welcome to your new plan!
            </motion.p>

            {/* Subscription Upgrade Confirmation */}
            {subscription && (
              <motion.div 
                variants={itemVariants}
                className="mb-5"
              >
                <Row className="justify-content-center">
                  <Col lg={8}>
                    <Card className="border-0 glass">
                      <Card.Body className="p-4">
                        <div className="text-center mb-4">
                          <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3" 
                               style={{ 
                                 width: '80px', 
                                 height: '80px',
                                 background: `rgba(${
                                   getPlanColor(subscription.plan) === 'primary' ? '59, 130, 246' :
                                   getPlanColor(subscription.plan) === 'warning' ? '255, 193, 7' : '108, 117, 125'
                                 }, 0.1)`
                               }}>
                            {getPlanIcon(subscription.plan)}
                          </div>
                          <h4 className="text-white mb-2">
                            🎉 Welcome to {getPlanName(subscription.plan)}!
                          </h4>
                          <p className="text-white">
                            Your subscription has been successfully upgraded and is now active.
                          </p>
                        </div>

                        <Alert variant="success" className="border-0 mb-4" style={{ background: 'rgba(40, 167, 69, 0.1)' }}>
                          <div className="d-flex align-items-center gap-2">
                            <Gift size={20} className="text-success" />
                            <div>
                              <strong>What's Next?</strong>
                              <div className="small mt-1">
                                You now have access to all {getPlanName(subscription.plan)} features. 
                                Your new limits are active immediately!
                              </div>
                            </div>
                          </div>
                        </Alert>

                        <Row className="g-3">
                          <Col md={6}>
                            <div className="d-flex align-items-center gap-3 p-3 rounded" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                              <Shield size={24} className="text-success" />
                              <div>
                                <div className="text-white fw-bold small">Secure & Instant</div>
                                <div className="text-white small">Activated immediately</div>
                              </div>
                            </div>
                          </Col>
                          <Col md={6}>
                            <div className="d-flex align-items-center gap-3 p-3 rounded" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                              <Clock size={24} className="text-primary" />
                              <div>
                                <div className="text-white fw-bold small">24/7 Support</div>
                                <div className="text-white small">Always here to help</div>
                              </div>
                            </div>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </motion.div>
            )}

            {/* Payment Details */}
            {paymentDetails && (
              <motion.div 
                variants={itemVariants}
                className="mb-4"
              >
                <div className="glass rounded-3 p-4 d-inline-block text-start">
                  <h5 className="text-white mb-3">
                    <CreditCard2Front className="me-2" />
                    Payment Details
                  </h5>
                  <div className="row g-3">
                    <div className="col-6">
                      <small className="text-white">Transaction ID</small>
                      <div className="text-white fw-bold">{paymentDetails.transactionId}</div>
                    </div>
                    <div className="col-6">
                      <small className="text-white">Amount</small>
                      <div className="text-white fw-bold">
                        {paymentDetails.amount} {paymentDetails.currency}
                      </div>
                    </div>
                    <div className="col-6">
                      <small className="text-white">Status</small>
                      <div className="text-success fw-bold">
                        <CheckCircle className="me-1" />
                        {paymentDetails.status}
                      </div>
                    </div>
                    <div className="col-6">
                      <small className="text-white">Date</small>
                      <div className="text-white fw-bold">
                        {new Date().toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <motion.div 
              variants={itemVariants}
              className="d-flex flex-column flex-sm-row gap-3 justify-content-center"
            >
              <Button
                variant="primary"
                size="lg"
                onClick={handleContinue}
                className="px-4 py-2 d-flex align-items-center gap-2"
                style={{
                  background: 'linear-gradient(145deg, #3b82f6, #2563eb)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
                }}
              >
                Continue to Dashboard
                <ArrowRight />
              </Button>
              
              <Button
                variant="outline-light"
                size="lg"
                onClick={handleGoHome}
                className="px-4 py-2 d-flex align-items-center gap-2"
                style={{
                  borderRadius: '12px',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.05)'
                }}
              >
                <HouseDoor />
                Go to Home
              </Button>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              className="mt-5"
            >
              <p className="text-white small">
                A confirmation email has been sent to {currentUser?.email || 'your email address'}
              </p>
            </motion.div>
          </motion.div>
        </Container>
      </div>
    </RequireAuth>
  );
};

export default PaymentSuccessPage;
