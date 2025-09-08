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
import { getSubscriptionPlans, getApiUsageStats, getUserApis, getUserCurrentPlan, getRealApiUsageFromLogs, setXAuthUserId } from '../utils/apiService';
import { handleApiError } from '../utils/errorHandler';

const UsageLimitsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('plans');
  const [currentPlan, setCurrentPlan] = useState(null);
  const [userApis, setUserApis] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check if user is admin
  const isAdmin = user?.username === 'Admin';

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
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
      
    } catch (error) {
      console.error('Error loading user data:', error);
      handleApiError(error, 'UsageLimitsPage');
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <RequireAuth>
        <div className="min-vh-100 d-flex align-items-center justify-content-center" 
             style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-light">Loading usage limits...</p>
          </motion.div>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div className="min-vh-100" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
        <NavBar />
        <LimitNotifications onUpgradeClick={handleUpgradeClick} />
        
        <Container className="py-5">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Header */}
            <motion.div variants={itemVariants} className="mb-5">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <Button 
                    variant="outline-light" 
                    onClick={() => navigate('/dashboard')}
                    className="mb-3"
                  >
                    <ArrowLeft className="me-2" />
                    Back to Dashboard
                  </Button>
                  <h1 className="display-5 fw-bold text-white mb-2">
                    Usage Limits & Plans
                  </h1>
                  <p className="lead text-light">
                    Manage your subscription plan and monitor API usage
                  </p>
                </div>
                {isAdmin && (
                  <Button 
                    variant="outline-success"
                    onClick={() => navigate('/admin/usage')}
                    className="d-flex align-items-center gap-2"
                  >
                    <BarChart size={16} />
                    Admin Panel
                  </Button>
                )}
              </div>
            </motion.div>

            {/* Tabs */}
            <motion.div variants={itemVariants}>
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-4"
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
                      Subscription Plans
                    </span>
                  }
                >
                  <motion.div
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <PlanSelectionInterface
                      currentPlan={currentPlan}
                      onPlanSelect={handlePlanSelect}
                      onUpgrade={handleUpgrade}
                      showUsageInfo={true}
                    />
                  </motion.div>
                </Tab>

                <Tab 
                  eventKey="usage" 
                  title={
                    <span className="d-flex align-items-center gap-2">
                      <BarChart size={16} />
                      Usage Dashboard
                    </span>
                  }
                >
                  <motion.div
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {userApis.length > 0 ? (
                      <div>
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
                        <Card className="border-0 glass">
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
                        </Card>
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
                      Notifications
                    </span>
                  }
                >
                  <motion.div
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <Card className="border-0 glass">
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
