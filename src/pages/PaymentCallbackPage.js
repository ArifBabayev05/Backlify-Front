import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Container, Button, Spinner } from 'react-bootstrap';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowRight, HouseDoor, Clock } from 'react-bootstrap-icons';
import { toast } from 'react-hot-toast';
import { useAuth } from '../components/auth/AuthContext';
import RequireAuth from '../components/auth/RequireAuth';

const PaymentCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user: currentUser } = useAuth();
  const [callbackStatus, setCallbackStatus] = useState('processing');
  const [callbackData, setCallbackData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Extract callback data from URL parameters
    const transactionId = searchParams.get('transaction_id');
    const status = searchParams.get('status');
    const amount = searchParams.get('amount');
    const currency = searchParams.get('currency');
    const signature = searchParams.get('signature');
    const timestamp = searchParams.get('timestamp');

    if (transactionId && status) {
      setCallbackData({
        transactionId,
        status,
        amount,
        currency: currency || 'USD',
        signature,
        timestamp
      });

      // Simulate processing the callback
      processCallback({
        transactionId,
        status,
        amount,
        currency: currency || 'USD',
        signature,
        timestamp
      });
    } else {
      setError('Invalid callback parameters received');
      setCallbackStatus('error');
    }
  }, [searchParams]);

  const processCallback = async (data) => {
    try {
      // Simulate API call to backend
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Here you would typically send this data to your backend
      // const response = await fetch('/api/payment/callback', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data)
      // });
      
      // For now, we'll simulate success
      if (data.status === 'success') {
        setCallbackStatus('success');
        toast.success('Payment callback processed successfully!');
      } else {
        setCallbackStatus('failed');
        toast.error('Payment callback processing failed');
      }
    } catch (err) {
      setError('Failed to process payment callback');
      setCallbackStatus('error');
      toast.error('Error processing payment callback');
    }
  };

  const handleContinue = () => {
    navigate('/dashboard');
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

  const renderStatusContent = () => {
    switch (callbackStatus) {
      case 'processing':
        return (
          <>
            <motion.div variants={itemVariants}>
              <div className="mb-4">
                <Clock 
                  size={80} 
                  className="text-warning mb-3"
                  style={{ filter: 'drop-shadow(0 0 20px rgba(255, 193, 7, 0.5))' }}
                />
              </div>
            </motion.div>

            <motion.h1 
              variants={itemVariants}
              className="display-4 fw-bold text-white mb-3"
            >
              Processing Payment Callback
            </motion.h1>

            <motion.p 
              variants={itemVariants}
              className="lead text-light mb-4"
            >
              We're processing your payment callback. Please wait while we verify the transaction.
            </motion.p>

            <motion.div variants={itemVariants}>
              <Spinner 
                animation="border" 
                variant="warning" 
                size="lg"
                className="mb-4"
              />
            </motion.div>
          </>
        );

      case 'success':
        return (
          <>
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
              Callback Processed Successfully!
            </motion.h1>

            <motion.p 
              variants={itemVariants}
              className="lead text-light mb-4"
            >
              Your payment callback has been processed and verified successfully.
            </motion.p>
          </>
        );

      case 'failed':
        return (
          <>
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
              Callback Processing Failed
            </motion.h1>

            <motion.p 
              variants={itemVariants}
              className="lead text-light mb-4"
            >
              We encountered an issue while processing your payment callback.
            </motion.p>
          </>
        );

      case 'error':
        return (
          <>
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
              Error Processing Callback
            </motion.h1>

            <motion.p 
              variants={itemVariants}
              className="lead text-light mb-4"
            >
              {error || 'An unexpected error occurred while processing the callback.'}
            </motion.p>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <RequireAuth>
      <div className="page-wrapper d-flex align-items-center" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
        <Container>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center"
          >
            {renderStatusContent()}

            {callbackData && (
              <motion.div 
                variants={itemVariants}
                className="mb-4"
              >
                <div className="glass rounded-3 p-4 d-inline-block text-start">
                  <h5 className="text-white mb-3">
                    📋 Callback Data
                  </h5>
                  <div className="row g-3">
                    <div className="col-6">
                      <small className="text-white">Transaction ID</small>
                      <div className="text-white fw-bold">{callbackData.transactionId}</div>
                    </div>
                    <div className="col-6">
                      <small className="text-white">Status</small>
                      <div className={`fw-bold ${
                        callbackData.status === 'success' ? 'text-success' : 'text-danger'
                      }`}>
                        {callbackData.status}
                      </div>
                    </div>
                    <div className="col-6">
                      <small className="text-white">Amount</small>
                      <div className="text-white fw-bold">
                        {callbackData.amount} {callbackData.currency}
                      </div>
                    </div>
                    <div className="col-6">
                      <small className="text-white">Timestamp</small>
                      <div className="text-white fw-bold">
                        {callbackData.timestamp || new Date().toISOString()}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {callbackStatus !== 'processing' && (
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
            )}

            <motion.div 
              variants={itemVariants}
              className="mt-5"
            >
              <p className="text-white small">
                This page handles payment callbacks from the payment system. 
                {callbackStatus === 'processing' && ' Please do not close this page.'}
              </p>
            </motion.div>
          </motion.div>
        </Container>
      </div>
    </RequireAuth>
  );
};

export default PaymentCallbackPage;
