import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, Row, Col, ProgressBar, Badge, Alert, Spinner, Button } from 'react-bootstrap';
import { 
  Activity, 
  Server, 
  Database, 
  GraphUp,
  ExclamationTriangle,
  CheckCircle,
  ArrowClockwise,
  Lightning
} from 'react-bootstrap-icons';
import { toast } from 'react-hot-toast';
import { getApiUsageStats, getRealApiUsageFromLogs, getUserDebugInfo, setXAuthUserId } from '../../utils/apiService';

const UsageDashboard = ({ 
  apiId, 
  refreshInterval = 30000, // 30 seconds
  onUpgradeClick,
  useRealData = false,
  username = null,
  showApiList = false,
  userApis = []
}) => {
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchUsageData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Ensure XAuthUserId is set before making API calls
      const actualUsername = username || localStorage.getItem('username');
      if (actualUsername) {
        setXAuthUserId(actualUsername);
      }
      
      let data;
      if (useRealData) {
        // Use the new debug endpoint for real data
        data = await getUserDebugInfo(actualUsername);
      } else if (apiId) {
        // Use mock API endpoint for specific API
        data = await getApiUsageStats(apiId);
      } else {
        // Use debug endpoint as fallback
        data = await getUserDebugInfo(actualUsername);
      }
      
      setUsageData(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching usage data:', err);
      setError(err.message);
      toast.error('Failed to load usage statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsageData();
    
    // Set up auto-refresh
    const interval = setInterval(fetchUsageData, refreshInterval);
    
    return () => clearInterval(interval);
  }, [apiId, refreshInterval, useRealData, username]);

  const getUsagePercentage = (current, limit) => {
    if (!limit || limit === 0) return 0;
    return Math.min(Math.round((current / limit) * 100), 100);
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return 'danger';
    if (percentage >= 75) return 'warning';
    return 'success';
  };

  const getUsageStatus = (percentage) => {
    if (percentage >= 100) return { text: 'Limit Exceeded', variant: 'danger', icon: ExclamationTriangle };
    if (percentage >= 90) return { text: 'Near Limit', variant: 'warning', icon: ExclamationTriangle };
    if (percentage >= 75) return { text: 'High Usage', variant: 'info', icon: GraphUp };
    return { text: 'Normal', variant: 'success', icon: CheckCircle };
  };

  const isUnlimited = usageData?.user_plan === 'enterprise';

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

  if (loading && !usageData) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="text-white mt-3">Loading usage statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="text-center">
        <ExclamationTriangle className="me-2" />
        {error}
        <Button 
          variant="outline-danger" 
          size="sm" 
          className="ms-3"
          onClick={fetchUsageData}
        >
          <ArrowClockwise size={14} />
          Retry
        </Button>
      </Alert>
    );
  }

  if (!usageData) {
    return (
      <Alert variant="info" className="text-center">
        <Lightning className="me-2" />
        No usage data available
      </Alert>
    );
  }

  const requestsPercentage = getUsagePercentage(usageData.requests_count, usageData.limits?.requests);
  const projectsPercentage = getUsagePercentage(usageData.projects_count, usageData.limits?.projects);
  
  const requestsStatus = getUsageStatus(requestsPercentage);
  const projectsStatus = getUsageStatus(projectsPercentage);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="text-white mb-0">
          <Activity className="me-2" />
          Usage Dashboard
        </h4>
        <div className="d-flex align-items-center gap-3">
          {lastUpdated && (
            <small className="text-white">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </small>
          )}
          <Button 
            variant="outline-light" 
            size="sm"
            onClick={fetchUsageData}
            disabled={loading}
          >
            <ArrowClockwise size={14} className={loading ? 'spinning' : ''} />
          </Button>
        </div>
      </div>

      {/* API List Section */}
      {showApiList && userApis.length > 0 && (
        <motion.div variants={itemVariants} className="mb-4">
          <Card className="border-0 glass">
            <Card.Body className="p-3">
              <h6 className="text-white mb-3">
                <Server className="me-2" />
                Your APIs ({userApis.length})
              </h6>
              <div className="d-flex flex-wrap gap-2">
                {userApis.map((api, index) => (
                  <Badge 
                    key={api.apiId}
                    bg="secondary" 
                    className="d-flex align-items-center gap-1 px-3 py-2"
                    style={{ fontSize: '0.8rem' }}
                  >
                    <Server size={12} />
                    {api.name} ({api.apiId.substring(0, 8)}...)
                  </Badge>
                ))}
              </div>
            </Card.Body>
          </Card>
        </motion.div>
      )}

      <Row className="g-4">
        {/* API Requests Usage */}
        <Col md={6}>
          <motion.div variants={itemVariants}>
            <Card className="border-0 glass h-100">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="text-white mb-0">
                    <Server className="me-2" />
                    API Requests
                  </h6>
                  <Badge 
                    bg={requestsStatus.variant}
                    className="d-flex align-items-center gap-1"
                  >
                    <requestsStatus.icon size={12} />
                    {requestsStatus.text}
                  </Badge>
                </div>

                {isUnlimited ? (
                  <div className="text-center py-3">
                    <Lightning className="text-warning mb-2" size={32} />
                    <h5 className="text-warning mb-0">Unlimited</h5>
                    <small className="text-white">Enterprise Plan</small>
                  </div>
                ) : (
                  <>
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-light">
                          {usageData.requests_count.toLocaleString()} / {usageData.limits?.requests?.toLocaleString() || 'N/A'}
                        </span>
                        <span className="text-white">
                          {requestsPercentage}%
                        </span>
                      </div>
                      <ProgressBar 
                        variant={getUsageColor(requestsPercentage)}
                        now={requestsPercentage}
                        style={{ height: '8px' }}
                      />
                    </div>

                    <div className="d-flex justify-content-between">
                      <small className="text-white">
                        Remaining: {usageData.remaining_requests?.toLocaleString() || 'N/A'}
                      </small>
                      <small className="text-white">
                        Reset: {new Date(usageData.month_start).toLocaleDateString()}
                      </small>
                    </div>
                  </>
                )}
              </Card.Body>
            </Card>
          </motion.div>
        </Col>

        {/* Projects Usage */}
        <Col md={6}>
          <motion.div variants={itemVariants}>
            <Card className="border-0 glass h-100">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="text-white mb-0">
                    <Database className="me-2" />
                    Projects
                  </h6>
                  <Badge 
                    bg={projectsStatus.variant}
                    className="d-flex align-items-center gap-1"
                  >
                    <projectsStatus.icon size={12} />
                    {projectsStatus.text}
                  </Badge>
                </div>

                {isUnlimited ? (
                  <div className="text-center py-3">
                    <Lightning className="text-warning mb-2" size={32} />
                    <h5 className="text-warning mb-0">Unlimited</h5>
                    <small className="text-white">Enterprise Plan</small>
                  </div>
                ) : (
                  <>
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-light">
                          {usageData.projects_count} / {usageData.limits?.projects || 'N/A'}
                        </span>
                        <span className="text-white">
                          {projectsPercentage}%
                        </span>
                      </div>
                      <ProgressBar 
                        variant={getUsageColor(projectsPercentage)}
                        now={projectsPercentage}
                        style={{ height: '8px' }}
                      />
                    </div>

                    <div className="d-flex justify-content-between">
                      <small className="text-white">
                        Remaining: {usageData.remaining_projects || 'N/A'}
                      </small>
                      <small className="text-white">
                        Plan: {usageData.user_plan?.toUpperCase() || 'N/A'}
                      </small>
                    </div>
                  </>
                )}
              </Card.Body>
            </Card>
          </motion.div>
        </Col>

        {/* Usage Warnings */}
        {(requestsPercentage >= 90 || projectsPercentage >= 90) && !isUnlimited && (
          <Col md={12}>
            <motion.div variants={itemVariants}>
              <Alert 
                variant={requestsPercentage >= 100 || projectsPercentage >= 100 ? 'danger' : 'warning'}
                className="border-0"
              >
                <div className="d-flex align-items-start gap-3">
                  <ExclamationTriangle size={20} className="mt-1" />
                  <div className="flex-grow-1">
                    <h6 className="mb-2">
                      {requestsPercentage >= 100 || projectsPercentage >= 100 
                        ? 'Usage Limit Exceeded!' 
                        : 'Approaching Usage Limit'
                      }
                    </h6>
                    <p className="mb-3">
                      {requestsPercentage >= 100 || projectsPercentage >= 100
                        ? 'You have exceeded your monthly usage limit. Please upgrade your plan to continue using the service.'
                        : 'You are approaching your monthly usage limit. Consider upgrading your plan to avoid service interruption.'
                      }
                    </p>
                    {onUpgradeClick && (
                      <Button 
                        variant={requestsPercentage >= 100 || projectsPercentage >= 100 ? 'danger' : 'warning'}
                        onClick={onUpgradeClick}
                        className="me-2"
                      >
                        Upgrade Plan
                      </Button>
                    )}
                    <Button 
                      variant="outline-light" 
                      size="sm"
                      onClick={fetchUsageData}
                    >
                      <ArrowClockwise size={14} />
                      Refresh
                    </Button>
                  </div>
                </div>
              </Alert>
            </motion.div>
          </Col>
        )}
      </Row>

      <style jsx>{`
        .spinning {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }
        
        .glass-card:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        
        .cursor-pointer {
          cursor: pointer;
        }
      `}</style>
    </motion.div>
  );
};

export default UsageDashboard;
