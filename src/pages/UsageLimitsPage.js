import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Container, Row, Col, Card, Button, Tabs, Tab, Alert } from 'react-bootstrap';
import { 
  CreditCard2Front, 
  BarChart, 
  Bell,
  ArrowLeft,
  Gear
} from 'react-bootstrap-icons';
import { useAuth } from '../components/auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import RequireAuth from '../components/auth/RequireAuth';
import NavBar from '../components/layout/NavBar';
import PlanSelectionInterface from '../components/usage/PlanSelectionInterface';
import UsageDashboard from '../components/usage/UsageDashboard';
import LimitNotifications from '../components/usage/LimitNotifications';
import { getSubscriptionPlans, getApiUsageStats, getUserApis, getUserCurrentPlan, getRealApiUsageFromLogs, setXAuthUserId, getUserDebugInfo } from '../utils/apiService';
import { handleApiError } from '../utils/errorHandler';

const UsageLimitsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('plans');
  const [currentPlan, setCurrentPlan] = useState(null);
  const [userApis, setUserApis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [usageLoading, setUsageLoading] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [userDebugInfo, setUserDebugInfo] = useState(null);
  const [debugInfoLoading, setDebugInfoLoading] = useState(false);
  const [plansData, setPlansData] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);

  // Check if user is admin
  const isAdmin = user?.username === 'Admin';

  useEffect(() => {
    loadUserData();
    loadUserDebugInfo();
    loadPlansData();
  }, []);

  const loadUserData = async () => {
    try {
      // Get username from localStorage
      const username = localStorage.getItem('username') || user?.username;
      
      // Ensure XAuthUserId is set before making any API calls
      if (username) {
        setXAuthUserId(username);
        // Add a small delay to ensure the XAuthUserId is properly set
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Load subscription plans to get current plan info
      const plans = await getSubscriptionPlans();
      const basicPlan = plans.find(p => p.id === 'basic');
      
      // Get user's current plan from real data
      const currentUserPlan = await getUserCurrentPlan();
      const userPlan = plans.find(p => p.id === currentUserPlan.id) || basicPlan;
      setCurrentPlan(userPlan);
      
      // Load user APIs from real data using username from localStorage
      try {
        const apis = await getUserApis(username);
        setUserApis(apis);
      } catch (apiError) {
        console.warn('Could not fetch user APIs:', apiError);
        setUserApis([]);
      }
      
      setInitialDataLoaded(true);
      
    } catch (error) {
      console.error('Error loading user data:', error);
      handleApiError(error, 'UsageLimitsPage');
      setInitialDataLoaded(true);
    }
  };

  const loadUserDebugInfo = async () => {
    try {
      setDebugInfoLoading(true);
      const username = localStorage.getItem('username') || user?.username;
      const debugInfo = await getUserDebugInfo(username);
      setUserDebugInfo(debugInfo);
    } catch (error) {
      console.error('Error loading user debug info:', error);
      handleApiError(error, 'UsageLimitsPage');
    } finally {
      setDebugInfoLoading(false);
    }
  };

  const loadPlansData = async () => {
    try {
      setPlansLoading(true);
      const response = await fetch('https://backlify-v2.onrender.com/api/user/plans');
      const data = await response.json();
      
      if (data.success) {
        setPlansData(data.data);
      } else {
        throw new Error('Failed to load plans data');
      }
    } catch (error) {
      console.error('Error loading plans data:', error);
      handleApiError(error, 'UsageLimitsPage');
    } finally {
      setPlansLoading(false);
    }
  };

  const handlePlanSelect = (plan) => {
    setCurrentPlan(plan);
    // Navigate to payment page
    navigate('/payment/plans');
  };

  const handleUpgrade = (plan) => {
    setCurrentPlan(plan);
    // Navigate to payment page
    navigate('/payment/upgrade');
  };

  const handleUpgradeClick = () => {
    navigate('/payment/upgrade');
  };

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    if (tabKey === 'usage' && initialDataLoaded) {
      loadUsageData();
    }
  };

  const loadUsageData = async () => {
    try {
      setUsageLoading(true);
      // Load usage data only when needed
      const usageData = await getRealApiUsageFromLogs();
      // Handle usage data if needed
    } catch (error) {
      console.error('Error loading usage data:', error);
      handleApiError(error, 'UsageLimitsPage');
    } finally {
      setUsageLoading(false);
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

  // Remove the loading screen - show page immediately

  return (
    <RequireAuth>
        <NavBar />
      <div className="page-wrapper" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
        <LimitNotifications onUpgradeClick={handleUpgradeClick} />
        
        <Container className="py-5">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Professional Header */}
            <motion.div variants={itemVariants} className="mb-8">
              <div className="d-flex justify-content-between align-items-center mb-6">
                <div>
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate('/dashboard')}
                    className="btn btn-ghost btn-sm mb-4 d-flex align-items-center gap-2"
                  >
                    <ArrowLeft size={16} />
                    Back to Dashboard
                  </Button>
                  <h1 className="heading-2 text-white mb-3">
                    Usage Limits & Plans
                    {/* {!initialDataLoaded && (
                      <span className="ms-3">
                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </span>
                    )} */}
                  </h1>
                  <p className="body-large text-light">
                    Manage your subscription plan and monitor API usage
                  </p>
                </div>
                {isAdmin && (
                  <Button 
                    variant="secondary"
                    onClick={() => navigate('/admin/usage')}
                    className="btn btn-secondary btn-sm d-flex align-items-center gap-2"
                  >
                    <BarChart size={16} />
                    Admin Panel
                  </Button>
                )}
              </div>
            </motion.div>

            {/* Professional Tabs */}
            <motion.div variants={itemVariants}>
              <Tabs
                activeKey={activeTab}
                  onSelect={handleTabChange}
                  className="mb-6"
                style={{
                  '--bs-nav-tabs-border-color': 'rgba(255, 255, 255, 0.1)',
                  '--bs-nav-tabs-link-hover-border-color': 'rgba(59, 130, 246, 0.3)',
                  '--bs-nav-tabs-link-active-color': '#3b82f6',
                  '--bs-nav-tabs-link-active-bg': 'rgba(59, 130, 246, 0.1)',
                  '--bs-nav-tabs-link-active-border-color': 'rgba(59, 130, 246, 0.3)',
                }}
              >
                <Tab 
                  eventKey="plans" 
                  title={
                    <span className="d-flex align-items-center gap-2">
                      <CreditCard2Front size={16} />
                      <span className="body-base fw-medium">Subscription Plans</span>
                    </span>
                  }
                >
                  <motion.div
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    className="mt-6"
                  >
                    {!initialDataLoaded || debugInfoLoading || plansLoading ? (
                      <div className="text-center py-5">
                        <div className="spinner-border text-primary mb-3" role="status">
                          <span className="visually-hidden">Loading plan data...</span>
                        </div>
                        <p className="text-light">Loading your current plan...</p>
                      </div>
                    ) : (
                      <div className="row justify-content-center mt-3">
                        <div className="col-lg-8 mb-3">
                          {/* Current Plan Card */}
                          <div className="current-plan-card mb-4">
                            <div className="plan-header">
                              <div className="plan-icon-wrapper">
                                <div className="plan-icon">
                                  <CreditCard2Front size={24} />
                                </div>
                                {/* <div className="current-badge">Current Plan</div> */}
                              </div>
                              <h2 className="plan-title">
                                {(() => {
                                  const currentPlanId = userDebugInfo?.user_plan || 'basic';
                                  const plan = plansData.find(p => p.id === currentPlanId);
                                  return plan?.name || 'Basic Plan';
                                })()}
                              </h2>
                              <p className="plan-description">
                                {(() => {
                                  const currentPlanId = userDebugInfo?.user_plan || 'basic';
                                  const descriptions = {
                                    basic: 'Perfect for getting started',
                                    pro: 'Best for growing businesses',
                                    enterprise: 'For large-scale operations'
                                  };
                                  return descriptions[currentPlanId] || 'Perfect for getting started';
                                })()}
                              </p>
                            </div>
                            
                            <div className="plan-content">
                              <div className="row">
                                {/* What's Included Section */}
                                <div className="col-md-6">
                                  <h4 className="section-title">
                                    <CreditCard2Front size={18} />
                                    What's Included
                                  </h4>
                                  <div className="features-list">
                                    {(() => {
                                      const currentPlanId = userDebugInfo?.user_plan || 'basic';
                                      const plan = plansData.find(p => p.id === currentPlanId);
                                      return plan?.features?.map((feature, index) => (
                                        <div key={index} className="feature-item">
                                          <div className="check-icon">
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                              <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                          </div>
                                          <span className="feature-text">{feature}</span>
                                        </div>
                                      )) || [];
                                    })()}
                                  </div>
                                </div>
                                
                                {/* Usage Limits Section */}
                                <div className="col-md-6">
                                  <h4 className="section-title">
                                    <BarChart size={18} />
                                    Usage Limits
                                  </h4>
                                  <div className="limits-list">
                                  <div className="limit-item">
                                    <span className="limit-label">API Requests</span>
                                    <span className="limit-value">
                                      {userDebugInfo?.limits?.requests === -1
                                        ? 'Unlimited'
                                        : `${userDebugInfo?.limits?.requests || '1000'}/month`}
                                    </span>
                                  </div>
                                      
                                  <div className="limit-item">
                                    <span className="limit-label">Projects</span>
                                    <span className="limit-value">
                                      {userDebugInfo?.limits?.projects === -1
                                        ? 'Unlimited'
                                        : userDebugInfo?.limits?.projects || 'Unlimited'}
                                    </span>
                                  </div>

                                    <div className="limit-item">
                                      <span className="limit-label">Support</span>
                                      <span className="limit-value support">
                                        {(() => {
                                          const currentPlanId = userDebugInfo?.user_plan || 'basic';
                                          return currentPlanId === 'basic' ? 'Email' :
                                                 currentPlanId === 'pro' ? 'Priority' :
                                                 currentPlanId === 'enterprise' ? '24/7' : 'Email';
                                        })()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="plan-actions">
                                <button 
                                  className="btn-primary-action"
                                  onClick={() => navigate('/payment/upgrade')}
                                >
                                  <CreditCard2Front size={18} />
                                  See Other Plans
                                </button>
                                <button 
                                  className="btn-secondary-action"
                                  onClick={() => navigate('/dashboard')}
                                >
                                  Back to Dashboard
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Plan Comparison Hint */}
                          <div className="upgrade-hint-card">
                            <div className="hint-icon">
                              <CreditCard2Front size={24} />
                            </div>
                            <h4 className="hint-title">Need More Power?</h4>
                            <p className="hint-description">
                              Compare all available plans and find the perfect fit for your needs. 
                              Upgrade anytime with no long-term commitments.
                            </p>
                            <button 
                              className="btn-outline-action"
                              onClick={() => navigate('/payment/upgrade')}
                            >
                              <CreditCard2Front size={18} />
                              View All Plans
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </Tab>

                <Tab 
                  eventKey="usage" 
                  title={
                    <span className="d-flex align-items-center gap-2">
                      <BarChart size={16} />
                      <span className="body-base fw-medium">Usage Dashboard</span>
                    </span>
                  }
                >
                  <motion.div
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    className="mt-6"
                  >
                    {!initialDataLoaded ? (
                      <div className="text-center py-5">
                        <div className="spinner-border text-primary mb-3" role="status">
                          <span className="visually-hidden">Loading initial data...</span>
                        </div>
                        <p className="text-light">Loading initial data...</p>
                      </div>
                    ) : usageLoading ? (
                      <div className="text-center py-5">
                        <div className="spinner-border text-primary mb-3" role="status">
                          <span className="visually-hidden">Loading usage data...</span>
                        </div>
                        <p className="text-light">Loading usage statistics...</p>
                        <div className="progress mt-3" style={{ height: '4px', width: '300px', margin: '0 auto' }}>
                          <div 
                            className="progress-bar progress-bar-striped progress-bar-animated" 
                            role="progressbar" 
                            style={{ width: '100%' }}
                          ></div>
                        </div>
                      </div>
                    ) : userApis.length > 0 ? (
                      <div className='mt-3'>
                        {/* Combined Usage Overview */}
                        <Card className="border-0 glass mb-4">
                          <Card.Header className="bg-transparent border-0">
                            <h5 className="text-white mb-0">
                              <BarChart className="me-2" />
                              Overall Usage Summary
                            </h5>
                            <small className="text-white">
                              Combined usage across all your APIs ({userApis.length} API{userApis.length !== 1 ? 's' : ''})
                            </small>
                          </Card.Header>
                          <Card.Body>
                            <UsageDashboard 
                              apiId={userApis[0]?.apiId} // Use first API for combined view
                              onUpgradeClick={handleUpgradeClick}
                              useRealData={true}
                              username={localStorage.getItem('username') || user?.username}
                              showApiList={true}
                              userApis={userApis}
                            />
                          </Card.Body>
                        </Card>

                        {/* Individual API Details */}
                        {/* <Card className="border-0 glass">
                          <Card.Header className="bg-transparent border-0">
                            <h5 className="text-white mb-0">
                              <BarChart className="me-2" />
                              Individual API Details
                            </h5>
                            <small className="text-white">
                              Click on an API to view detailed usage statistics
                            </small>
                          </Card.Header>
                          <Card.Body>
                            <Row className="g-3">
                              {userApis.map((api, index) => (
                                <Col key={api.apiId} md={6} lg={4}>
                                  <Card 
                                    className="border-0 glass-card h-100 cursor-pointer"
                                    style={{ 
                                      background: 'rgba(255, 255, 255, 0.05)',
                                      backdropFilter: 'blur(10px)',
                                      border: '1px solid rgba(255, 255, 255, 0.1)',
                                      cursor: 'pointer',
                                      transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                      e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                      e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                    onClick={() => {
                                      // Navigate to detailed view or show modal
                                      console.log('View details for API:', api.apiId);
                                    }}
                                  >
                                    <Card.Body className="p-3">
                                      <div className="d-flex align-items-center mb-2">
                                        <div className="bg-primary rounded-circle p-2 me-3">
                                          <BarChart size={16} className="text-white" />
                                        </div>
                                        <div className="flex-grow-1">
                                          <h6 className="text-white mb-0 text-truncate" title={api.name}>
                                            {api.name}
                                          </h6>
                                          <small className="text-white">
                                            {api.apiId.substring(0, 8)}...
                                          </small>
                                        </div>
                                      </div>
                                      <div className="d-flex justify-content-between align-items-center">
                                        <small className="text-white">API #{index + 1}</small>
                                        <small className="text-primary">
                                          View Details →
                                        </small>
                                      </div>
                                    </Card.Body>
                                  </Card>
                                </Col>
                              ))}
                            </Row>
                          </Card.Body>
                        </Card> */}
                      </div>
                    ) : (
                      <Alert variant="info" className="text-center">
                        <BarChart className="me-2" />
                        No APIs found. Create an API to view usage statistics.
                        <Button 
                          variant="outline-primary" 
                          className="ms-3"
                          onClick={() => navigate('/landing')}
                        >
                          Create API
                        </Button>
                      </Alert>
                    )}
                  </motion.div>
                </Tab>

                <Tab 
                  eventKey="notifications" 
                  title={
                    <span className="d-flex align-items-center gap-2">
                      <Bell size={16} />
                      <span className="body-base fw-medium">Notifications</span>
                    </span>
                  }
                >
                  <motion.div
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    className="mt-6"
                  >
                    <Card className="border-0 glass mt-3">
                      <Card.Header className="bg-transparent border-0">
                        <h5 className="text-white mb-0">
                          <Bell className="me-2" />
                          Usage Notifications
                        </h5>
                      </Card.Header>
                      <Card.Body>
                        <Alert variant="info" className="border-0">
                                                  <div className="d-flex align-items-start gap-3">
                          <Gear size={20} className="mt-1" />
                            <div>
                              <h6 className="mb-2">Notification Settings</h6>
                              <p className="mb-2">
                                You'll receive notifications when approaching or exceeding your usage limits.
                              </p>
                              <ul className="mb-0 small">
                                <li>Warning at 90% of your monthly limit</li>
                                <li>Alert when limit is exceeded</li>
                                <li>Upgrade suggestions when appropriate</li>
                                <li>Monthly usage summary</li>
                              </ul>
                            </div>
                          </div>
                        </Alert>
                      </Card.Body>
                    </Card>
                  </motion.div>
                </Tab>
              </Tabs>
            </motion.div>
          </motion.div>
        </Container>
      </div>
    </RequireAuth>
  );
};

export default UsageLimitsPage;
