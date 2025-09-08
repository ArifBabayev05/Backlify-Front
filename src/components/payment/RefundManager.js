import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, Button, Form, Row, Col, Alert, Modal, Badge, Spinner } from 'react-bootstrap';
import { 
  ArrowClockwise, 
  ExclamationTriangle, 
  CheckCircle,
  XCircle,
  InfoCircle,
  CurrencyDollar
} from 'react-bootstrap-icons';
import { toast } from 'react-hot-toast';
import paymentService from '../../utils/paymentService';

const RefundManager = ({ 
  transactionId, 
  orderAmount, 
  currency = 'AZN',
  onRefundComplete,
  onRefundError 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [refundType, setRefundType] = useState('full');
  const [partialAmount, setPartialAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refundResult, setRefundResult] = useState(null);

  const handleRefund = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const amount = refundType === 'partial' ? parseFloat(partialAmount) : null;
      
      // Validate partial refund amount
      if (refundType === 'partial') {
        if (!amount || amount <= 0 || amount > orderAmount) {
          throw new Error('Invalid partial refund amount');
        }
      }

      const result = await paymentService.reversePayment(transactionId, amount);
      
      setRefundResult(result);
      toast.success(`Refund successful! Transaction ID: ${result.reversal_transaction}`);
      
      onRefundComplete?.(result);
      
      // Close modal after a delay
      setTimeout(() => {
        setShowModal(false);
        setRefundResult(null);
      }, 3000);
      
    } catch (error) {
      setError(error.message);
      toast.error(`Refund failed: ${error.message}`);
      onRefundError?.(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    if (!loading) {
      setShowModal(false);
      setRefundResult(null);
      setError(null);
      setRefundType('full');
      setPartialAmount('');
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
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
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Card className="glass border-0">
          <Card.Body className="p-4">
            <motion.div variants={itemVariants} className="mb-4">
              <h4 className="text-white mb-3">
                <ArrowClockwise className="me-2" />
                Refund Management
              </h4>
            </motion.div>

            <motion.div variants={itemVariants} className="mb-4">
              <div className="p-4 rounded-3" style={{ background: 'rgba(255, 193, 7, 0.1)' }}>
                <h6 className="text-white mb-3">Transaction Details</h6>
                <div className="row g-3">
                  <div className="col-6">
                    <small className="text-white">Transaction ID</small>
                    <div className="text-white fw-bold">{transactionId}</div>
                  </div>
                  <div className="col-6">
                    <small className="text-white">Original Amount</small>
                    <div className="text-white fw-bold">{formatAmount(orderAmount)}</div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Button
                variant="warning"
                size="lg"
                onClick={() => setShowModal(true)}
                className="d-flex align-items-center gap-2"
                style={{
                  background: 'linear-gradient(145deg, #ffc107, #e0a800)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 15px rgba(255, 193, 7, 0.3)'
                }}
              >
                <ArrowClockwise />
                Process Refund
              </Button>
            </motion.div>
          </Card.Body>
        </Card>
      </motion.div>

      {/* Refund Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <ArrowClockwise className="me-2" />
            Process Refund
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!refundResult ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={itemVariants} className="mb-4">
                <Alert variant="info" className="border-0">
                  <div className="d-flex align-items-start gap-3">
                    <InfoCircle size={20} className="mt-1" />
                    <div>
                      <h6 className="mb-1">Refund Information</h6>
                      <p className="mb-0">
                        Choose the type of refund you want to process. 
                        Refunds may take 3-5 business days to appear on the customer's statement.
                      </p>
                    </div>
                  </div>
                </Alert>
              </motion.div>

              <motion.div variants={itemVariants} className="mb-4">
                <Form.Group>
                  <Form.Label className="text-dark mb-3">Refund Type</Form.Label>
                  <div className="d-flex flex-column gap-3">
                    <Form.Check
                      type="radio"
                      id="full"
                      name="refundType"
                      value="full"
                      checked={refundType === 'full'}
                      onChange={(e) => setRefundType(e.target.value)}
                      label={
                        <div className="d-flex justify-content-between align-items-center">
                          <span>Full Refund</span>
                          <Badge bg="success">{formatAmount(orderAmount)}</Badge>
                        </div>
                      }
                    />
                    
                    <Form.Check
                      type="radio"
                      id="partial"
                      name="refundType"
                      value="partial"
                      checked={refundType === 'partial'}
                      onChange={(e) => setRefundType(e.target.value)}
                      label="Partial Refund"
                    />
                  </div>
                </Form.Group>
              </motion.div>

              {refundType === 'partial' && (
                <motion.div variants={itemVariants} className="mb-4">
                  <Form.Group>
                    <Form.Label className="text-dark">Refund Amount</Form.Label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <CurrencyDollar />
                      </span>
                      <Form.Control
                        type="number"
                        value={partialAmount}
                        onChange={(e) => setPartialAmount(e.target.value)}
                        placeholder="Enter refund amount"
                        min="0.01"
                        max={orderAmount}
                        step="0.01"
                        className="border-secondary"
                      />
                      <span className="input-group-text">{currency}</span>
                    </div>
                    <Form.Text className="text-white">
                      Maximum refund amount: {formatAmount(orderAmount)}
                    </Form.Text>
                  </Form.Group>
                </motion.div>
              )}

              {error && (
                <motion.div variants={itemVariants} className="mb-4">
                  <Alert variant="danger" className="border-0">
                    <div className="d-flex align-items-start gap-3">
                      <ExclamationTriangle size={20} className="mt-1" />
                      <div>
                        <h6 className="mb-1">Refund Error</h6>
                        <p className="mb-0">{error}</p>
                      </div>
                    </div>
                  </Alert>
                </motion.div>
              )}

              <motion.div variants={itemVariants} className="d-flex gap-3">
                <Button
                  variant="warning"
                  size="lg"
                  onClick={handleRefund}
                  disabled={loading || (refundType === 'partial' && (!partialAmount || parseFloat(partialAmount) <= 0))}
                  className="flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" />
                      Processing Refund...
                    </>
                  ) : (
                    <>
                      <ArrowClockwise />
                      Process Refund
                    </>
                  )}
                </Button>
                
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleCloseModal}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="text-center"
            >
              <motion.div variants={itemVariants} className="mb-4">
                <div className="d-flex justify-content-center mb-3">
                  <CheckCircle size={48} className="text-success" />
                </div>
                <h4 className="text-success mb-3">Refund Processed Successfully!</h4>
                <p className="text-white">
                  Your refund has been processed and will appear on the customer's statement within 3-5 business days.
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="mb-4">
                <div className="p-4 rounded-3 d-inline-block text-start" style={{ background: 'rgba(40, 167, 69, 0.1)' }}>
                  <h6 className="text-success mb-3">Refund Details</h6>
                  <div className="row g-3">
                    <div className="col-6">
                      <small className="text-white">Original Transaction</small>
                      <div className="text-white fw-bold">{refundResult.transaction}</div>
                    </div>
                    <div className="col-6">
                      <small className="text-white">Refund Transaction</small>
                      <div className="text-white fw-bold">{refundResult.reversal_transaction}</div>
                    </div>
                    <div className="col-6">
                      <small className="text-white">Refund Amount</small>
                      <div className="text-white fw-bold">{formatAmount(refundResult.amount)}</div>
                    </div>
                    <div className="col-6">
                      <small className="text-white">Status</small>
                      <div className="text-white fw-bold">
                        <Badge bg="success">{refundResult.status}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Button
                  variant="success"
                  size="lg"
                  onClick={handleCloseModal}
                  className="d-flex align-items-center gap-2"
                >
                  <CheckCircle />
                  Close
                </Button>
              </motion.div>
            </motion.div>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default RefundManager;
