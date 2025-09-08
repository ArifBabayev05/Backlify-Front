import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal, Button, Alert, Badge, ProgressBar, Row, Col } from 'react-bootstrap';
import { 
  ExclamationTriangle, 
  XCircle, 
  CheckCircle, 
  ArrowUp,
  Lightning,
  InfoCircle
} from 'react-bootstrap-icons';
import { toast } from 'react-hot-toast';
import { isUsageLimitError, extractUsageLimitInfo } from '../../utils/apiService';

const LimitNotifications = ({ 
  onUpgradeClick,
  onDismiss,
  autoHide = true,
  hideDelay = 10000 // 10 seconds
}) => {
  const [notifications, setNotifications] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);

  // Global error handler for API requests
  useEffect(() => {
    const handleApiError = (error) => {
      if (isUsageLimitError(error)) {
        const limitInfo = extractUsageLimitInfo(error);
        if (limitInfo) {
          showLimitNotification(limitInfo);
        }
      }
    };

    // Listen for global API errors
    window.addEventListener('apiError', handleApiError);
    
    return () => {
      window.removeEventListener('apiError', handleApiError);
    };
  }, []);

  const showLimitNotification = (limitInfo) => {
    const notification = {
      id: Date.now(),
      type: limitInfo.percentage >= 100 ? 'exceeded' : 'warning',
      limitInfo,
      timestamp: new Date()
    };

    setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep only last 5
    setCurrentNotification(notification);
    setShowModal(true);

    // Show toast notification
    if (limitInfo.percentage >= 100) {
      toast.error(`Usage limit exceeded! ${limitInfo.message}`, {
        duration: 8000,
        icon: '🚫'
      });
    } else {
      toast.warning(`Approaching usage limit: ${limitInfo.percentage}% used`, {
        duration: 6000,
        icon: '⚠️'
      });
    }

    // Auto-hide modal after delay
    if (autoHide) {
      setTimeout(() => {
        setShowModal(false);
      }, hideDelay);
    }
  };

  const handleUpgrade = () => {
    setShowModal(false);
    onUpgradeClick?.();
  };

  const handleDismiss = () => {
    setShowModal(false);
    onDismiss?.();
  };

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'exceeded':
        return <XCircle size={24} className="text-danger" />;
      case 'warning':
        return <ExclamationTriangle size={24} className="text-warning" />;
      default:
        return <InfoCircle size={24} className="text-info" />;
    }
  };

  const getNotificationVariant = (type) => {
    switch (type) {
      case 'exceeded':
        return 'danger';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getNotificationTitle = (type, limitInfo) => {
    if (type === 'exceeded') {
      return 'Usage Limit Exceeded';
    }
    return 'Usage Limit Warning';
  };

  const getNotificationMessage = (type, limitInfo) => {
    if (type === 'exceeded') {
      return `You have exceeded your monthly ${limitInfo.type} limit. Please upgrade your plan to continue using the service.`;
    }
    return `You are approaching your monthly ${limitInfo.type} limit (${limitInfo.percentage}% used). Consider upgrading your plan to avoid service interruption.`;
  };

  return (
    <>
      {/* Toast Notifications */}
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="position-fixed top-0 end-0 m-3"
            style={{ zIndex: 1060 }}
          >
            <Alert 
              variant={getNotificationVariant(notification.type)}
              className="border-0 shadow-lg"
              style={{ minWidth: '300px' }}
            >
              <div className="d-flex align-items-start gap-3">
                {getNotificationIcon(notification.type)}
                <div className="flex-grow-1">
                  <h6 className="mb-2">
                    {getNotificationTitle(notification.type, notification.limitInfo)}
                  </h6>
                  <p className="mb-2 small">
                    {getNotificationMessage(notification.type, notification.limitInfo)}
                  </p>
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-white">
                      {notification.timestamp.toLocaleTimeString()}
                    </small>
                    <Button
                      variant="outline-light"
                      size="sm"
                      onClick={() => dismissNotification(notification.id)}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              </div>
            </Alert>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Modal for Detailed Notification */}
      <Modal 
        show={showModal} 
        onHide={handleDismiss}
        centered
        size="lg"
        backdrop="static"
      >
        <Modal.Header 
          closeButton 
          className={`border-0 text-white ${
            currentNotification?.type === 'exceeded' ? 'bg-danger' : 'bg-warning'
          }`}
        >
          <Modal.Title className="d-flex align-items-center gap-2">
            {currentNotification && getNotificationIcon(currentNotification.type)}
            {currentNotification && getNotificationTitle(currentNotification.type, currentNotification.limitInfo)}
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body className="p-4">
          {currentNotification && (
            <>
              <div className="text-center mb-4">
                <h5 className="text-dark mb-3">
                  {getNotificationMessage(currentNotification.type, currentNotification.limitInfo)}
                </h5>
                
                {/* Usage Progress */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-white">
                      {currentNotification.limitInfo.type.charAt(0).toUpperCase() + 
                       currentNotification.limitInfo.type.slice(1)} Usage
                    </span>
                    <Badge 
                      bg={currentNotification.type === 'exceeded' ? 'danger' : 'warning'}
                      className="px-3 py-2"
                    >
                      {currentNotification.limitInfo.percentage}%
                    </Badge>
                  </div>
                  
                  <ProgressBar 
                    variant={currentNotification.type === 'exceeded' ? 'danger' : 'warning'}
                    now={currentNotification.limitInfo.percentage}
                    style={{ height: '12px' }}
                  />
                  
                  <div className="d-flex justify-content-between mt-2">
                    <small className="text-white">
                      Used: {currentNotification.limitInfo.current.toLocaleString()}
                    </small>
                    <small className="text-white">
                      Limit: {currentNotification.limitInfo.limit.toLocaleString()}
                    </small>
                  </div>
                </div>

                {/* Action Buttons */}
                <Row className="g-3">
                  <Col md={6}>
                    <Button
                      variant={currentNotification.type === 'exceeded' ? 'danger' : 'warning'}
                      size="lg"
                      className="w-100 d-flex align-items-center justify-content-center gap-2"
                      onClick={handleUpgrade}
                    >
                      <ArrowUp size={18} />
                      Upgrade Plan
                    </Button>
                  </Col>
                  <Col md={6}>
                    <Button
                      variant="outline-secondary"
                      size="lg"
                      className="w-100"
                      onClick={handleDismiss}
                    >
                      Continue with Current Plan
                    </Button>
                  </Col>
                </Row>
              </div>

              {/* Additional Information */}
              <Alert variant="info" className="border-0">
                <div className="d-flex align-items-start gap-3">
                  <InfoCircle size={20} className="mt-1" />
                  <div>
                    <h6 className="mb-2">What happens next?</h6>
                    <ul className="mb-0 small">
                      {currentNotification.type === 'exceeded' ? (
                        <>
                          <li>Your API requests will be blocked until the next billing cycle</li>
                          <li>Upgrading your plan will immediately restore service</li>
                          <li>Usage limits reset monthly on your billing date</li>
                        </>
                      ) : (
                        <>
                          <li>You'll receive notifications as you approach your limit</li>
                          <li>Consider upgrading to avoid service interruption</li>
                          <li>Monitor your usage in the dashboard</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </Alert>
            </>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

// Hook to use limit notifications
export const useLimitNotifications = (onUpgradeClick, onDismiss) => {
  const [notifications] = useState(() => new LimitNotifications({ onUpgradeClick, onDismiss }));
  
  useEffect(() => {
    return () => {
      // Cleanup if needed
    };
  }, []);

  return notifications;
};

export default LimitNotifications;
