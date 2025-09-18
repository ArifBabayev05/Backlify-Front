import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, Button, Alert, Spinner } from 'react-bootstrap';
import { 
  CreditCard2Front, 
  ExclamationTriangle
} from 'react-bootstrap-icons';

import paymentService from '../../utils/paymentService';

const PaymentForm = ({ 
  orderData, 
  onPaymentSuccess, 
  onPaymentError,
  onPaymentRedirect 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Early return if orderData is not available
  if (!orderData) {
    return (
      <Card className="glass border-0">
        <Card.Body className="p-4 text-center">
          <div className="text-white">
            <h5>Loading payment information...</h5>
            <p className="text-white">Please wait while we prepare your payment details.</p>
          </div>
        </Card.Body>
      </Card>
    );
  }

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      await handleStandardPayment();
    } catch (error) {
      setError(error.message);
      onPaymentError?.(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStandardPayment = async () => {
    try {
      const result = await paymentService.createPaymentRequest({
        amount: orderData.total,
        orderId: orderData.id,
        description: orderData.description,
        currency: orderData.currency || 'AZN',
        language: 'az',
        userId: orderData.userId,
        planId: orderData.plan?.id,
        plan: orderData.plan
      });

      if (result.status === 'success') {
        onPaymentRedirect?.(result.redirect_url);
      } else {
        throw new Error(result.message || 'Payment request failed');
      }
    } catch (error) {
      console.error('Standard payment error:', error);
      throw error;
    }
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className="glass border-0">
        <Card.Body className="p-4">
          <motion.div variants={itemVariants} className="mb-4">
            <h3 className="text-white mb-3">
              <CreditCard2Front className="me-2" />
              Payment Method
            </h3>
          </motion.div>

          {/* Order Summary */}
          <motion.div variants={itemVariants} className="mb-4">
            <div className="p-4 rounded-3 d-inline-block text-start w-100" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
              <h5 className="text-white mb-3">Order Summary</h5>
              <div className="row g-3">
                <div className="col-6">
                  <small className="text-white">Order ID</small>
                  <div className="text-white fw-bold">{orderData.id}</div>
                </div>
                <div className="col-6">
                  <small className="text-white">Amount</small>
                  <div className="text-white fw-bold">
                    {paymentService.formatAmount(orderData.total, orderData.currency)}
                  </div>
                </div>
                <div className="col-12">
                  <small className="text-white">Description</small>
                  <div className="text-white">{orderData.description}</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Payment Method Info */}
          <motion.div variants={itemVariants} className="mb-4">
            <div className="p-3 rounded-3 d-flex align-items-center gap-3" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
              <CreditCard2Front size={24} className="text-primary" />
              <div>
                <h6 className="text-white mb-1">Pay with New Card</h6>
                <small className="text-white">You will be redirected to a secure payment page</small>
              </div>
            </div>
          </motion.div>

          {/* Error Display */}
          {error && (
            <motion.div variants={itemVariants} className="mb-4">
              <Alert variant="danger" className="border-0">
                <div className="d-flex align-items-start gap-3">
                  <ExclamationTriangle size={20} className="mt-1" />
                  <div>
                    <h6 className="mb-1">Payment Error</h6>
                    <p className="mb-0">{error}</p>
                  </div>
                </div>
              </Alert>
            </motion.div>
          )}

          {/* Payment Button */}
          <motion.div variants={itemVariants} className="text-center">
            <Button
              variant="primary"
              size="lg"
              onClick={handlePayment}
              disabled={loading}
              className="d-flex align-items-center gap-2 mx-auto"
              style={{
                background: 'linear-gradient(145deg, #3b82f6, #2563eb)',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                minWidth: '200px'
              }}
            >
              {loading ? (
                <>
                  <Spinner size="sm" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard2Front />
                  Pay Now
                </>
              )}
            </Button>
          </motion.div>
        </Card.Body>
      </Card>
    </motion.div>
  );
};

export default PaymentForm;