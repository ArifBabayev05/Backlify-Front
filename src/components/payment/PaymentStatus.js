import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  ExclamationTriangle,
  ArrowRight,
  ArrowClockwise
} from 'react-bootstrap-icons';
import { toast } from 'react-hot-toast';
import paymentService from '../../utils/paymentService';

const PaymentStatus = ({ 
  orderId, 
  transactionId = null,
  onStatusUpdate,
  onRetry,
  onContinue 
}) => {
  const [status, setStatus] = useState('checking');
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastChecked, setLastChecked] = useState(null);

  const maxRetries = 3;
  const retryDelay = 2000; // 2 seconds

  useEffect(() => {
    if (orderId) {
      checkPaymentStatus();
    }
  }, [orderId]);

  const checkPaymentStatus = async () => {
    try {
      setStatus('checking');
      setError(null);

      const result = await paymentService.checkPaymentStatus(orderId, transactionId);
      
      setPaymentData(result);
      setStatus(result.status);
      setLastChecked(new Date());
      
      // Notify parent component of status update
      onStatusUpdate?.(result);

      // Show appropriate toast message
      if (result.status === 'success') {
        toast.success('Payment verified successfully!');
      } else if (result.status === 'failed') {
        toast.error('Payment verification failed');
      } else if (result.status === 'pending') {
        toast('Payment is still being processed...', { icon: '⏳' });
      }

    } catch (error) {
      console.error('Status check error:', error);
      setError(error.message);
      setStatus('error');
      
      // Auto-retry if we haven't exceeded max retries
      if (retryCount < maxRetries) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          checkPaymentStatus();
        }, retryDelay * (retryCount + 1)); // Exponential backoff
      } else {
        toast.error('Failed to verify payment status');
      }
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    checkPaymentStatus();
  };

  const handleContinue = () => {
    onContinue?.();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={48} className="text-success" />;
      case 'failed':
        return <XCircle size={48} className="text-danger" />;
      case 'pending':
        return <Clock size={48} className="text-warning" />;
      case 'checking':
        return <Spinner animation="border" variant="primary" />;
      case 'error':
        return <ExclamationTriangle size={48} className="text-danger" />;
      default:
        return <Clock size={48} className="text-white" />;
    }
  };

  const getStatusTitle = (status) => {
    switch (status) {
      case 'success':
        return 'Payment Successful';
      case 'failed':
        return 'Payment Failed';
      case 'pending':
        return 'Payment Pending';
      case 'checking':
        return 'Verifying Payment';
      case 'error':
        return 'Verification Error';
      default:
        return 'Payment Status';
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case 'success':
        return 'Your payment has been processed successfully. Thank you for your purchase!';
      case 'failed':
        return 'We\'re sorry, but your payment could not be processed. Please try again or contact support.';
      case 'pending':
        return 'Your payment is being processed. This may take a few minutes. Please wait...';
      case 'checking':
        return 'We\'re verifying your payment status. Please wait...';
      case 'error':
        return 'We encountered an error while verifying your payment. Please try again.';
      default:
        return 'Checking payment status...';
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      success: { variant: 'success', text: 'Completed' },
      failed: { variant: 'danger', text: 'Failed' },
      pending: { variant: 'warning', text: 'Pending' },
      checking: { variant: 'info', text: 'Checking' },
      error: { variant: 'danger', text: 'Error' }
    };
    
    const { variant, text } = variants[status] || variants.checking;
    
    return <Badge bg={variant}>{text}</Badge>;
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className="glass border-0">
        <Card.Body className="p-4 text-center">
          <motion.div variants={itemVariants} className="mb-4">
            <div className="d-flex justify-content-center mb-3">
              {getStatusIcon(status)}
            </div>
            <h3 className="text-white mb-2">{getStatusTitle(status)}</h3>
            <p className="text-light mb-3">{getStatusMessage(status)}</p>
            {getStatusBadge(status)}
          </motion.div>

          {/* Payment Details */}
          {paymentData && (
            <motion.div variants={itemVariants} className="mb-4">
              <div className="p-4 rounded-3 d-inline-block text-start" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                <h5 className="text-white mb-3">Payment Details</h5>
                <div className="row g-3">
                  <div className="col-6">
                    <small className="text-white">Transaction ID</small>
                    <div className="text-white fw-bold">{paymentData.transaction || 'N/A'}</div>
                  </div>
                  <div className="col-6">
                    <small className="text-white">Amount</small>
                    <div className="text-white fw-bold">
                      {paymentData.amount} {paymentData.currency}
                    </div>
                  </div>
                  <div className="col-6">
                    <small className="text-white">Order ID</small>
                    <div className="text-white fw-bold">{paymentData.order_id}</div>
                  </div>
                  <div className="col-6">
                    <small className="text-white">Status</small>
                    <div className="text-white fw-bold">
                      {getStatusBadge(paymentData.status)}
                    </div>
                  </div>
                  {paymentData.message && (
                    <div className="col-12">
                      <small className="text-white">Message</small>
                      <div className="text-white">{paymentData.message}</div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Error Display */}
          {error && (
            <motion.div variants={itemVariants} className="mb-4">
              <Alert variant="danger" className="border-0">
                <div className="d-flex align-items-start gap-3">
                  <ExclamationTriangle size={20} className="mt-1" />
                  <div>
                    <h6 className="mb-1">Verification Error</h6>
                    <p className="mb-0">{error}</p>
                  </div>
                </div>
              </Alert>
            </motion.div>
          )}

          {/* Retry Information */}
          {status === 'checking' && retryCount > 0 && (
            <motion.div variants={itemVariants} className="mb-4">
              <div className="text-white small">
                Retry attempt {retryCount} of {maxRetries}
              </div>
            </motion.div>
          )}

          {/* Last Checked Time */}
          {lastChecked && (
            <motion.div variants={itemVariants} className="mb-4">
              <div className="text-white small">
                Last checked: {lastChecked.toLocaleTimeString()}
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div variants={itemVariants} className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
            {status === 'success' && (
              <Button
                variant="primary"
                size="lg"
                onClick={handleContinue}
                className="d-flex align-items-center gap-2"
                style={{
                  background: 'linear-gradient(145deg, #3b82f6, #2563eb)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
                }}
              >
                Continue
                <ArrowRight />
              </Button>
            )}

            {(status === 'failed' || status === 'error') && (
              <>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleRetry}
                  disabled={status === 'checking'}
                  className="d-flex align-items-center gap-2"
                  style={{
                    background: 'linear-gradient(145deg, #3b82f6, #2563eb)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  {status === 'checking' ? (
                    <>
                      <Spinner size="sm" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <ArrowClockwise />
                      Try Again
                    </>
                  )}
                </Button>
                
                {onRetry && (
                  <Button
                    variant="outline-primary"
                    size="lg"
                    onClick={onRetry}
                    className="d-flex align-items-center gap-2"
                    style={{
                      borderRadius: '12px',
                      border: '2px solid rgba(59, 130, 246, 0.3)',
                      background: 'rgba(59, 130, 246, 0.05)'
                    }}
                  >
                    New Payment
                  </Button>
                )}
              </>
            )}

            {status === 'pending' && (
              <Button
                variant="outline-primary"
                size="lg"
                onClick={handleRetry}
                disabled={status === 'checking'}
                className="d-flex align-items-center gap-2"
                style={{
                  borderRadius: '12px',
                  border: '2px solid rgba(59, 130, 246, 0.3)',
                  background: 'rgba(59, 130, 246, 0.05)'
                }}
              >
                {status === 'checking' ? (
                  <>
                    <Spinner size="sm" />
                    Checking...
                  </>
                ) : (
                  <>
                    <ArrowClockwise />
                    Check Status
                  </>
                )}
              </Button>
            )}
          </motion.div>

          {/* Auto-refresh for pending payments */}
          {status === 'pending' && (
            <motion.div variants={itemVariants} className="mt-4">
              <div className="text-white small">
                This page will automatically refresh to check for updates
              </div>
            </motion.div>
          )}
        </Card.Body>
      </Card>
    </motion.div>
  );
};

export default PaymentStatus;
