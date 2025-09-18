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
      className="usage-dashboard"
    >
      {/* Enhanced Header */}
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div className="d-flex align-items-center">
          <div className="me-3 p-3 rounded-3" style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <Activity size={24} className="text-primary" />
          </div>
          <div>
            <h3 className="text-white mb-1 fw-bold">Usage Dashboard</h3>
            <p className="text-light mb-0 small">Monitor your API usage and limits</p>
          </div>
        </div>
        <div className="d-flex align-items-center gap-3">
          {lastUpdated && (
            <div className="text-end">
              <small className="text-white d-block">Last updated</small>
              <small className="text-white fw-medium">{lastUpdated.toLocaleTimeString()}</small>
            </div>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchUsageData}
            disabled={loading}
            className="btn btn-outline btn-sm d-flex align-items-center gap-2"
          >
            <ArrowClockwise size={14} className={loading ? 'spinning' : ''} />
            <span className="d-none d-sm-inline">Refresh</span>
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
            <Card className="border-0 glass h-100 usage-card">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div className="d-flex align-items-center">
                    <div className="me-3 p-2 rounded-2" style={{
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
                      border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}>
                      <Server size={20} className="text-success" />
                    </div>
                    <div>
                      <h6 className="text-white mb-1 fw-bold">API Requests</h6>
                      <small className="text-white">Monthly usage</small>
                    </div>
                  </div>
                  <Badge 
                    bg={requestsStatus.variant}
                    className="d-flex align-items-center gap-1 px-3 py-2"
                    style={{ borderRadius: 'var(--radius-lg)' }}
                  >
                    <requestsStatus.icon size={12} />
                    {requestsStatus.text}
                  </Badge>
                </div>

                {isUnlimited ? (
                  <div className="text-center py-4">
                    <div className="mb-3 p-3 rounded-3 d-inline-block" style={{
                      background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%)',
                      border: '1px solid rgba(255, 193, 7, 0.2)'
                    }}>
                      <Lightning className="text-warning" size={32} />
                    </div>
                    <h5 className="text-warning mb-1 fw-bold">Unlimited</h5>
                    <small className="text-white">Enterprise Plan</small>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                          <h4 className="text-white mb-1 fw-bold">
                            {usageData.requests_count.toLocaleString()}
                          </h4>
                          <small className="text-white">
                            of {usageData.limits?.requests?.toLocaleString() || 'N/A'} requests
                          </small>
                        </div>
                        <div className="text-end">
                          <div className="h5 text-white mb-0 fw-bold">{requestsPercentage}%</div>
                          <small className="text-white">used</small>
                        </div>
                      </div>
                      <ProgressBar 
                        variant={getUsageColor(requestsPercentage)}
                        now={requestsPercentage}
                        style={{ 
                          height: '12px',
                          borderRadius: 'var(--radius-lg)',
                          background: 'rgba(255, 255, 255, 0.1)'
                        }}
                      />
                    </div>

                    <div className="d-flex justify-content-between align-items-center p-3 rounded-2" style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      <div>
                        <small className="text-white d-block">Remaining</small>
                        <small className="text-white fw-medium">
                          {usageData.remaining_requests?.toLocaleString() || 'N/A'}
                        </small>
                      </div>
                      <div className="text-end">
                        <small className="text-white d-block">Reset Date</small>
                        <small className="text-white fw-medium">
                          {new Date(usageData.month_start).toLocaleDateString()}
                        </small>
                      </div>
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
            <Card className="border-0 glass h-100 usage-card">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div className="d-flex align-items-center">
                    <div className="me-3 p-2 rounded-2" style={{
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)',
                      border: '1px solid rgba(139, 92, 246, 0.2)'
                    }}>
                      <Database size={20} className="text-primary" />
                    </div>
                    <div>
                      <h6 className="text-white mb-1 fw-bold">Projects</h6>
                      <small className="text-white">Active projects</small>
                    </div>
                  </div>
                  <Badge 
                    bg={projectsStatus.variant}
                    className="d-flex align-items-center gap-1 px-3 py-2"
                    style={{ borderRadius: 'var(--radius-lg)' }}
                  >
                    <projectsStatus.icon size={12} />
                    {projectsStatus.text}
                  </Badge>
                </div>

                {isUnlimited ? (
                  <div className="text-center py-4">
                    <div className="mb-3 p-3 rounded-3 d-inline-block" style={{
                      background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%)',
                      border: '1px solid rgba(255, 193, 7, 0.2)'
                    }}>
                      <Lightning className="text-warning" size={32} />
                    </div>
                    <h5 className="text-warning mb-1 fw-bold">Unlimited</h5>
                    <small className="text-white">Enterprise Plan</small>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                          <h4 className="text-white mb-1 fw-bold">
                            {usageData.projects_count}
                          </h4>
                          <small className="text-white">
                            of {usageData.limits?.projects || 'N/A'} projects
                          </small>
                        </div>
                        <div className="text-end">
                          <div className="h5 text-white mb-0 fw-bold">{projectsPercentage}%</div>
                          <small className="text-white">used</small>
                        </div>
                      </div>
                      <ProgressBar 
                        variant={getUsageColor(projectsPercentage)}
                        now={projectsPercentage}
                        style={{ 
                          height: '12px',
                          borderRadius: 'var(--radius-lg)',
                          background: 'rgba(255, 255, 255, 0.1)'
                        }}
                      />
                    </div>

                    <div className="d-flex justify-content-between align-items-center p-3 rounded-2" style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      <div>
                        <small className="text-white d-block">Remaining</small>
                        <small className="text-white fw-medium">
                          {usageData.remaining_projects || 'N/A'}
                        </small>
                      </div>
                      <div className="text-end">
                        <small className="text-white d-block">Current Plan</small>
                        <small className="text-white fw-medium">
                          {usageData.user_plan?.toUpperCase() || 'N/A'}
                        </small>
                      </div>
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
        
        .usage-dashboard {
          position: relative;
        }
        
        .usage-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        
        .usage-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6, #10b981);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .usage-card:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          border-color: rgba(59, 130, 246, 0.3);
        }
        
        .usage-card:hover::before {
          opacity: 1;
        }
        
        .cursor-pointer {
          cursor: pointer;
        }
        
        .progress-bar {
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
        }
        
        .progress-bar.bg-success {
          background: linear-gradient(90deg, #10b981, #059669);
        }
        
        .progress-bar.bg-warning {
          background: linear-gradient(90deg, #f59e0b, #d97706);
        }
        
        .progress-bar.bg-danger {
          background: linear-gradient(90deg, #ef4444, #dc2626);
        }
      `}</style>
    </motion.div>
  );
};

export default UsageDashboard;
