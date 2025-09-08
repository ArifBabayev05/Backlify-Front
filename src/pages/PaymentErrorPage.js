import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Container, Button, Alert } from 'react-bootstrap';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, ArrowLeft, ArrowClockwise, HouseDoor, ExclamationTriangle } from 'react-bootstrap-icons';
import { toast } from 'react-hot-toast';
import { useAuth } from '../components/auth/AuthContext';
import RequireAuth from '../components/auth/RequireAuth';

const PaymentErrorPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user: currentUser } = useAuth();
  const [errorDetails, setErrorDetails] = useState(null);

  useEffect(() => {
    // Extract error details from URL parameters
    const errorCode = searchParams.get('error_code');
    const errorMessage = searchParams.get('error_message');
    const transactionId = searchParams.get('transaction_id');

    if (errorCode || errorMessage) {
      setErrorDetails({
        errorCode: errorCode || 'UNKNOWN_ERROR',
        errorMessage: errorMessage || 'An unexpected error occurred during payment processing',
        transactionId: transactionId || 'N/A'
      });
    }

    // Show error toast
    toast.error('Payment failed. Please try again.');
  }, [searchParams]);

  const handleRetry = () => {
    // Navigate back to payment page or retry
    navigate('/dashboard');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/landing');
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

  const getErrorIcon = (errorCode) => {
    switch (errorCode) {
      case 'INSUFFICIENT_FUNDS':
        return '💳';
      case 'CARD_DECLINED':
        return '❌';
      case 'EXPIRED_CARD':
        return '⏰';
      case 'INVALID_CARD':
        return '⚠️';
      default:
        return '❌';
    }
  };

  const getErrorSuggestions = (errorCode) => {
    switch (errorCode) {
      case 'INSUFFICIENT_FUNDS':
        return 'Please check your account balance and try again with a different payment method.';
      case 'CARD_DECLINED':
        return 'Your card was declined. Please try a different card or contact your bank.';
      case 'EXPIRED_CARD':
        return 'Your card has expired. Please update your payment information.';
      case 'INVALID_CARD':
        return 'Please check your card details and try again.';
      default:
        return 'Please try again or contact support if the problem persists.';
    }
  };

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
                <XCircle 
                  size={80} 
                  className="text-danger mb-3"
                  style={{ filter: 'drop-shadow(0 0 20px rgba(220, 53, 69, 0.5))' }}
                />
              </div>
            </motion.div>

            <motion.h1 
              variants={itemVariants}
              className="display-4 fw-bold text-white mb-3"
            >
              Payment Failed
            </motion.h1>

            <motion.p 
              variants={itemVariants}
              className="lead text-light mb-4"
            >
              We're sorry, but your payment could not be processed. Please review the details below and try again.
            </motion.p>

            {errorDetails && (
              <motion.div 
                variants={itemVariants}
                className="mb-4"
              >
                <Alert 
                  variant="danger" 
                  className="text-start border-0"
                  style={{
                    background: 'rgba(220, 53, 69, 0.1)',
                    border: '1px solid rgba(220, 53, 69, 0.3)',
                    borderRadius: '12px'
                  }}
                >
                  <div className="d-flex align-items-start gap-3">
                    <div className="fs-1">
                      {getErrorIcon(errorDetails.errorCode)}
                    </div>
                    <div className="flex-grow-1">
                      <h5 className="text-danger mb-2">
                        <ExclamationTriangle className="me-2" />
                        Error Details
                      </h5>
                      <div className="row g-3 mb-3">
                        <div className="col-6">
                          <small className="text-white">Error Code</small>
                          <div className="text-white fw-bold">{errorDetails.errorCode}</div>
                        </div>
                        <div className="col-6">
                          <small className="text-white">Transaction ID</small>
                          <div className="text-white fw-bold">{errorDetails.transactionId}</div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <small className="text-white">Error Message</small>
                        <div className="text-white">{errorDetails.errorMessage}</div>
                      </div>
                      <div className="p-3 rounded" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                        <small className="text-white">Suggestion:</small>
                        <div className="text-white">{getErrorSuggestions(errorDetails.errorCode)}</div>
                      </div>
                    </div>
                  </div>
                </Alert>
              </motion.div>
            )}

            <motion.div 
              variants={itemVariants}
              className="d-flex flex-column flex-sm-row gap-3 justify-content-center"
            >
              <Button
                variant="danger"
                size="lg"
                onClick={handleRetry}
                className="px-4 py-2 d-flex align-items-center gap-2"
                style={{
                  background: 'linear-gradient(145deg, #dc3545, #c82333)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 15px rgba(220, 53, 69, 0.3)'
                }}
              >
                <ArrowClockwise />
                Try Again
              </Button>
              
              <Button
                variant="outline-light"
                size="lg"
                onClick={handleGoBack}
                className="px-4 py-2 d-flex align-items-center gap-2"
                style={{
                  borderRadius: '12px',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.05)'
                }}
              >
                <ArrowLeft />
                Go Back
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
                Need help? Contact our support team at support@backlify.com
              </p>
            </motion.div>
          </motion.div>
        </Container>
      </div>
    </RequireAuth>
  );
};

export default PaymentErrorPage;
