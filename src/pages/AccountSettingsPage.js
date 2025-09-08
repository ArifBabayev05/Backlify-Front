import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Container, Row, Col, Card, Button, Badge, Modal, Form, Tab, Tabs, ProgressBar, Table, Alert } from 'react-bootstrap';
import { 
  Person, 
  Key, 
  Star,
  Download,
  Save,
  Activity,
  BarChart,
  Calendar,
  Gear,
  ArrowRight
} from 'react-bootstrap-icons';
import { toast } from 'react-hot-toast';
import { useAuth } from '../components/auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import RequireAuth from '../components/auth/RequireAuth';
import NavBar from '../components/layout/NavBar';
import { 
  apiRequest,
  getUserProfile, 
  updateUserProfile, 
  changePassword, 
  getUserSubscription, 
  upgradeSubscription,
  getApiUsage, 
  getNotificationSettings, 
  updateNotificationSettings,
  getUserLogs,
  getUserLogStats
} from '../utils/apiService';

const AccountSettingsPage = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [apiUsage, setApiUsage] = useState(null);
  const [requestLogs, setRequestLogs] = useState([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [notificationSettings, setNotificationSettings] = useState(null);
  const [error, setError] = useState(null);
  const [logStats, setLogStats] = useState(null);
  const [timeRange, setTimeRange] = useState('last7days');


  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    phone: ''
  });

  // Settings state
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    twoFactorAuth: false,
    apiAccess: true
  });

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Load user data and subscription plans
  useEffect(() => {
    if (isAuthenticated() && !authLoading) {
      loadUserData();
    }
  }, [isAuthenticated, authLoading]);

  const loadUserData = async () => {
    // Check if user is authenticated before making API calls
    if (!isAuthenticated()) {
      setError('User not authenticated');
      return;
    }
    setLoading(true);
    setError(null);
    
    try {
      // Load user's APIs to get usage statistics
      const apisData = await apiRequest('/my-apis', { method: 'GET' });
      const userApis = apisData.apis || [];
      
      // Create mock user profile from available data
      const mockProfile = {
        firstName: user?.username?.split(' ')[0] || 'User',
        lastName: user?.username?.split(' ')[1] || '',
        email: user?.email || 'user@example.com',
        company: 'Backlify User',
        phone: '+1 (555) 123-4567'
      };
      
      setUserProfile(mockProfile);
      
      // Update profile form with mock data
      setProfileForm({
        firstName: mockProfile.firstName,
        lastName: mockProfile.lastName,
        email: mockProfile.email,
        company: mockProfile.company,
        phone: mockProfile.phone
      });

      // Create mock subscription data
      const mockSubscription = {
        planName: 'Free Plan',
        plan: 'basic',
        status: 'active',
        price: 0,
        currency: 'AZN',
        features: {
          apiCalls: 1000,
          maxProjects: 5
        }
      };
      setSubscription(mockSubscription);

      // Create mock API usage data based on actual APIs
      const mockUsage = {
        totalCalls: userApis.length * 50, // Mock usage based on number of APIs
        limit: 1000,
        thisMonth: userApis.length * 25,
        lastMonth: userApis.length * 20
      };
      setApiUsage(mockUsage);

      // Create mock request logs
      const mockLogs = userApis.slice(0, 10).map((api, index) => ({
        id: index + 1,
        timestamp: new Date(Date.now() - index * 3600000).toISOString(),
        endpoint: `/api/${api.id}/users`,
        method: 'GET',
        status: 200,
        responseTime: Math.floor(Math.random() * 200) + 50,
        ip: '192.168.1.1'
      }));
      setRequestLogs(mockLogs);

      // Create mock log statistics
      const mockStats = {
        summary: {
          totalRequests: mockLogs.length * 10,
          successRate: 95,
          avgResponseTime: 120
        },
        topEndpoints: userApis.slice(0, 5).map(api => ({
          endpoint: `/api/${api.id}/users`,
          count: Math.floor(Math.random() * 100) + 10,
          success: Math.floor(Math.random() * 90) + 5,
          avgResponseTime: Math.floor(Math.random() * 200) + 50
        }))
      };
      setLogStats(mockStats);

      // Create mock notification settings
      const mockNotifications = {
        emailNotifications: true,
        smsNotifications: false,
        marketingEmails: false,
        twoFactorAuth: false,
        apiAccess: true
      };
      setNotificationSettings(mockNotifications);
      setSettings(mockNotifications);

      // Mock user data loaded successfully

    } catch (error) {
      console.error('Error loading user data:', error);
      setError(error.message);
      toast.error(`Failed to load user data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Mock profile update - just update local state
      const updatedProfile = { ...profileForm };
      setUserProfile(updatedProfile);
      toast.success('Profile updated successfully (mock data)');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message);
      toast.error(`Failed to update profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Mock password change - just show success message
      toast.success('Password changed successfully (mock data)');
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      setError(error.message);
      toast.error(`Failed to change password: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsUpdate = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Mock settings update - just update local state
      setNotificationSettings(settings);
      toast.success('Settings updated successfully (mock data)');
    } catch (error) {
      console.error('Error updating settings:', error);
      setError(error.message);
      toast.error(`Failed to update settings: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeSubscription = async (plan) => {
    setLoading(true);
    setError(null);
    
    try {
      // Mock subscription upgrade
      toast.success(`Subscription upgrade to ${plan} initiated (mock data)`);
      
      // Update local subscription state
      const updatedSubscription = {
        ...subscription,
        planName: plan === 'pro' ? 'Pro Plan' : 'Enterprise Plan',
        plan: plan,
        price: plan === 'pro' ? 29 : 99,
        features: {
          apiCalls: plan === 'pro' ? 10000 : 50000,
          maxProjects: plan === 'pro' ? 25 : 100
        }
      };
      setSubscription(updatedSubscription);
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      setError(error.message);
      toast.error(`Failed to upgrade subscription: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (window.confirm('Are you sure you want to cancel your subscription? This action cannot be undone.')) {
      setLoading(true);
      setError(null);
      
      try {
        // This would be a new API endpoint for canceling subscription
        // For now, we'll show a message
        toast.info('Subscription cancellation feature will be available soon. Please contact support.');
      } catch (error) {
        console.error('Error canceling subscription:', error);
        setError(error.message);
        toast.error(`Failed to cancel subscription: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleManageBilling = () => {
    navigate('/payment/plans');
  };

  const handleTimeRangeChange = async (newTimeRange) => {
    setTimeRange(newTimeRange);
    setLoading(true);
    setError(null);
    
    try {
      // Mock log stats update based on time range
      const mockStats = {
        summary: {
          totalRequests: Math.floor(Math.random() * 1000) + 100,
          successRate: Math.floor(Math.random() * 10) + 90,
          avgResponseTime: Math.floor(Math.random() * 100) + 100
        },
        topEndpoints: [
          { endpoint: '/api/users', count: 150, success: 145, avgResponseTime: 120 },
          { endpoint: '/api/products', count: 120, success: 118, avgResponseTime: 95 },
          { endpoint: '/api/orders', count: 80, success: 78, avgResponseTime: 150 }
        ]
      };
      setLogStats(mockStats);
    } catch (error) {
      console.error('Error fetching log stats:', error);
      setError(error.message);
      toast.error(`Failed to load log statistics: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 200: return 'success';
      case 400: return 'warning';
      case 500: return 'danger';
      default: return 'secondary';
    }
  };

  const getUsagePercentage = () => {
    if (!apiUsage) return 0;
    return (apiUsage.totalCalls / apiUsage.limit) * 100;
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
    <RequireAuth>
      <div className="min-vh-100" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
        <NavBar />
        
        <Container className="py-5" style={{ marginTop: '80px' }}>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Header */}
            <motion.div variants={itemVariants} className="text-center mb-5">
              <h1 className="display-4 fw-bold text-white mb-3">
                <Person className="me-3" />
                Account Dashboard
              </h1>
              <p className="lead text-light">
                Manage your account settings, subscription, and API usage
              </p>
              {error && (
                <Alert variant="danger" className="mt-3">
                  <strong>Error:</strong> {error}
                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    className="ms-2"
                    onClick={() => {
                      setError(null);
                      loadUserData();
                    }}
                  >
                    Retry
                  </Button>
                </Alert>
              )}
            </motion.div>

            {/* Time Range Selector */}
            <motion.div variants={itemVariants} className="mb-4">
              <div className="d-flex justify-content-center">
                <div className="btn-group" role="group">
                  {['today', 'yesterday', 'last7days', 'last30days', 'last90days'].map((range) => (
                    <Button
                      key={range}
                      variant={timeRange === range ? 'primary' : 'outline-light'}
                      size="sm"
                      onClick={() => handleTimeRangeChange(range)}
                      disabled={loading}
                    >
                      {range === 'last7days' ? '7 Days' :
                       range === 'last30days' ? '30 Days' :
                       range === 'last90days' ? '90 Days' :
                       range.charAt(0).toUpperCase() + range.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div variants={itemVariants} className="mb-5">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="text-white mt-3">Loading account data...</p>
                </div>
              ) : (
                <Row className="g-4">
                  <Col md={3}>
                    <Card className="glass border-0 h-100">
                      <Card.Body className="text-center">
                        <div className="d-flex justify-content-center mb-3">
                          <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                            <Activity size={24} className="text-white" />
                          </div>
                        </div>
                                              <h5 className="text-white mb-1">{logStats?.summary?.totalRequests || 0}</h5>
                      <p className="text-white mb-0">Total Requests</p>
                      </Card.Body>
                    </Card>
                  </Col>
                <Col md={3}>
                  <Card className="glass border-0 h-100">
                    <Card.Body className="text-center">
                      <div className="d-flex justify-content-center mb-3">
                        <div className="rounded-circle bg-success d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                          <BarChart size={24} className="text-white" />
                        </div>
                      </div>
                      <h5 className="text-white mb-1">{logStats?.summary?.successRate || '0'}%</h5>
                      <p className="text-white mb-0">Success Rate</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="glass border-0 h-100">
                    <Card.Body className="text-center">
                      <div className="d-flex justify-content-center mb-3">
                        <div className="rounded-circle bg-warning d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                          <Star size={24} className="text-white" />
                        </div>
                      </div>
                      <h5 className="text-white mb-1">{subscription?.planName || 'Free'}</h5>
                      <p className="text-white mb-0">Current Plan</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="glass border-0 h-100">
                    <Card.Body className="text-center">
                      <div className="d-flex justify-content-center mb-3">
                        <div className="rounded-circle bg-info d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                          <Calendar size={24} className="text-white" />
                        </div>
                      </div>
                      <h5 className="text-white mb-1">{logStats?.summary?.avgResponseTime || 0}ms</h5>
                      <p className="text-white mb-0">Avg Response Time</p>
                    </Card.Body>
                  </Card>
                </Col>
                </Row>
              )}
            </motion.div>

            {/* Main Content */}
            <motion.div variants={itemVariants}>
              <Card className="glass border-0">
                <Card.Body className="p-0">
                  <Tabs
                    activeKey={activeTab}
                    onSelect={setActiveTab}
                    className="border-0"
                    fill
                  >
                    <Tab eventKey="overview" title={
                      <span className="d-flex align-items-center gap-2">
                        <BarChart size={16} />
                        Overview
                      </span>
                    }>
                      <div className="p-4">
                        <Row className="g-4">
                          {/* API Usage */}
                          <Col lg={6}>
                            <Card className="border-0" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                              <Card.Body>
                                <h5 className="text-white mb-3">API Usage</h5>
                                <div className="mb-3">
                                  <div className="d-flex justify-content-between mb-2">
                                    <span className="text-light">This Month</span>
                                    <span className="text-white fw-bold">
                                      {apiUsage?.totalCalls || 0} / {apiUsage?.limit || 0}
                                    </span>
                                  </div>
                                  <ProgressBar 
                                    now={getUsagePercentage()} 
                                    variant={getUsagePercentage() > 80 ? 'danger' : getUsagePercentage() > 60 ? 'warning' : 'success'}
                                    style={{ height: '8px' }}
                                  />
                                </div>
                                <div className="row g-3">
                                  <div className="col-6">
                                    <div className="text-center">
                                      <h6 className="text-success mb-1">{apiUsage?.thisMonth || 0}</h6>
                                      <small className="text-white">This Month</small>
                                    </div>
                                  </div>
                                  <div className="col-6">
                                    <div className="text-center">
                                      <h6 className="text-info mb-1">{apiUsage?.lastMonth || 0}</h6>
                                      <small className="text-white">Last Month</small>
                                    </div>
                                  </div>
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>

                          {/* Subscription Info */}
                          <Col lg={6}>
                            <Card className="border-0" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                              <Card.Body>
                                <h5 className="text-white mb-3">Subscription</h5>
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                  <div>
                                    <h6 className="text-white mb-1">{subscription?.planName || 'Free Plan'}</h6>
                                    <Badge bg={subscription?.status === 'active' ? 'success' : 'secondary'}>
                                      {subscription?.status || 'inactive'}
                                    </Badge>
                                  </div>
                                  <div className="text-end">
                                    <h6 className="text-white mb-1">
                                      {subscription?.price || 0} {subscription?.currency || 'AZN'}
                                    </h6>
                                    <small className="text-white">per month</small>
                                  </div>
                                </div>
                                <div className="row g-2 mb-3">
                                  <div className="col-6">
                                    <small className="text-white">API Calls Limit</small>
                                    <div className="text-white fw-bold">{subscription?.features?.apiCalls || 0}</div>
                                  </div>
                                  <div className="col-6">
                                    <small className="text-white">Max Projects</small>
                                    <div className="text-white fw-bold">{subscription?.features?.maxProjects || 0}</div>
                                  </div>
                                </div>
                                
                                {/* Subscription Management Buttons */}
                                <div className="d-flex gap-2 flex-wrap">
                                  <Button 
                                    variant="primary" 
                                    size="sm"
                                    onClick={handleManageBilling}
                                    disabled={loading}
                                  >
                                    <Star className="me-1" />
                                    Manage Billing
                                  </Button>
                                  
                                  {subscription?.plan !== 'enterprise' && (
                                    <Button 
                                      variant="outline-success" 
                                      size="sm"
                                      onClick={() => {
                                        const nextPlan = subscription?.plan === 'basic' ? 'pro' : 'enterprise';
                                        handleUpgradeSubscription(nextPlan);
                                      }}
                                      disabled={loading}
                                    >
                                      <ArrowRight className="me-1" />
                                      Upgrade Plan
                                    </Button>
                                  )}
                                  
                                  {subscription?.plan !== 'basic' && (
                                    <Button 
                                      variant="outline-danger" 
                                      size="sm"
                                      onClick={handleCancelSubscription}
                                      disabled={loading}
                                    >
                                      Cancel Subscription
                                    </Button>
                                  )}
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>

                          {/* Top Endpoints */}
                          <Col lg={12}>
                            <Card className="border-0" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                              <Card.Body>
                                <h5 className="text-white mb-3">Top Endpoints</h5>
                                <div className="table-responsive">
                                  <Table variant="dark" className="mb-0">
                                    <thead>
                                      <tr>
                                        <th>Endpoint</th>
                                        <th>Requests</th>
                                        <th>Success Rate</th>
                                        <th>Avg Time</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {logStats?.topEndpoints?.map((endpoint, index) => (
                                        <tr key={index}>
                                          <td className="text-light">{endpoint.endpoint}</td>
                                          <td className="text-white">{endpoint.count}</td>
                                          <td>
                                            <Badge bg={endpoint.success / endpoint.count * 100 > 95 ? 'success' : endpoint.success / endpoint.count * 100 > 90 ? 'warning' : 'danger'}>
                                              {((endpoint.success / endpoint.count) * 100).toFixed(1)}%
                                            </Badge>
                                          </td>
                                          <td>
                                            <Badge bg="info">{endpoint.avgResponseTime}ms</Badge>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </Table>
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>
                        </Row>
                      </div>
                    </Tab>

                    <Tab eventKey="profile" title={
                      <span className="d-flex align-items-center gap-2">
                        <Person size={16} />
                        Profile
                      </span>
                    }>
                      <div className="p-4">
                        <Row>
                          <Col lg={8}>
                            <Card className="border-0" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                              <Card.Body>
                                <h5 className="text-white mb-4">Personal Information</h5>
                                <Form>
                                  <Row className="g-3">
                                    <Col md={6}>
                                      <Form.Group>
                                        <Form.Label className="text-light">First Name</Form.Label>
                                        <Form.Control
                                          type="text"
                                          value={profileForm.firstName}
                                          onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})}
                                          className="bg-dark border-secondary text-white"
                                        />
                                      </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                      <Form.Group>
                                        <Form.Label className="text-light">Last Name</Form.Label>
                                        <Form.Control
                                          type="text"
                                          value={profileForm.lastName}
                                          onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})}
                                          className="bg-dark border-secondary text-white"
                                        />
                                      </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                      <Form.Group>
                                        <Form.Label className="text-light">Email</Form.Label>
                                        <Form.Control
                                          type="email"
                                          value={profileForm.email}
                                          onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                                          className="bg-dark border-secondary text-white"
                                        />
                                      </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                      <Form.Group>
                                        <Form.Label className="text-light">Phone</Form.Label>
                                        <Form.Control
                                          type="tel"
                                          value={profileForm.phone}
                                          onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                                          className="bg-dark border-secondary text-white"
                                        />
                                      </Form.Group>
                                    </Col>
                                    <Col md={12}>
                                      <Form.Group>
                                        <Form.Label className="text-light">Company</Form.Label>
                                        <Form.Control
                                          type="text"
                                          value={profileForm.company}
                                          onChange={(e) => setProfileForm({...profileForm, company: e.target.value})}
                                          className="bg-dark border-secondary text-white"
                                        />
                                      </Form.Group>
                                    </Col>
                                  </Row>
                                  <div className="d-flex gap-3 mt-4">
                                    <Button
                                      variant="primary"
                                      onClick={handleProfileUpdate}
                                      disabled={loading}
                                      className="d-flex align-items-center gap-2"
                                    >
                                      <Save size={16} />
                                      {loading ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                    <Button
                                      variant="outline-primary"
                                      onClick={() => setShowPasswordModal(true)}
                                      className="d-flex align-items-center gap-2"
                                    >
                                      <Key size={16} />
                                      Change Password
                                    </Button>
                                  </div>
                                </Form>
                              </Card.Body>
                            </Card>
                          </Col>
                        </Row>
                      </div>
                    </Tab>

                    <Tab eventKey="logs" title={
                      <span className="d-flex align-items-center gap-2">
                        <Activity size={16} />
                        Request Logs
                      </span>
                    }>
                      <div className="p-4">
                        <Card className="border-0" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                              <h5 className="text-white mb-0">Recent API Requests</h5>
                              <Button variant="outline-primary" size="sm">
                                <Download size={16} className="me-2" />
                                Export Logs
                              </Button>
                            </div>
                            <div className="table-responsive">
                              <Table variant="dark" className="mb-0">
                                <thead>
                                  <tr>
                                    <th>Timestamp</th>
                                    <th>Endpoint</th>
                                    <th>Method</th>
                                    <th>Status</th>
                                    <th>Response Time</th>
                                    <th>IP Address</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {requestLogs.map((log) => (
                                    <tr key={log.id}>
                                      <td className="text-light">{log.timestamp}</td>
                                      <td className="text-white">{log.endpoint}</td>
                                      <td>
                                        <Badge bg={log.method === 'GET' ? 'info' : log.method === 'POST' ? 'success' : 'warning'}>
                                          {log.method}
                                        </Badge>
                                      </td>
                                      <td>
                                        <Badge bg={getStatusColor(log.status)}>
                                          {log.status}
                                        </Badge>
                                      </td>
                                      <td className="text-white">{log.responseTime}ms</td>
                                      <td className="text-white">{log.ip}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </Table>
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                    </Tab>

                    <Tab eventKey="settings" title={
                      <span className="d-flex align-items-center gap-2">
                        <Gear size={16} />
                        Settings
                      </span>
                    }>
                      <div className="p-4">
                        <Row>
                          <Col lg={8}>
                            <Card className="border-0" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                              <Card.Body>
                                <h5 className="text-white mb-4">Notification Settings</h5>
                                <div className="d-flex flex-column gap-3">
                                  <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                      <h6 className="text-white mb-1">Email Notifications</h6>
                                      <small className="text-white">Receive notifications via email</small>
                                    </div>
                                    <Form.Check
                                      type="switch"
                                      checked={settings.emailNotifications}
                                      onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                                    />
                                  </div>
                                  <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                      <h6 className="text-white mb-1">SMS Notifications</h6>
                                      <small className="text-white">Receive notifications via SMS</small>
                                    </div>
                                    <Form.Check
                                      type="switch"
                                      checked={settings.smsNotifications}
                                      onChange={(e) => setSettings({...settings, smsNotifications: e.target.checked})}
                                    />
                                  </div>
                                  <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                      <h6 className="text-white mb-1">Marketing Emails</h6>
                                      <small className="text-white">Receive marketing and promotional emails</small>
                                    </div>
                                    <Form.Check
                                      type="switch"
                                      checked={settings.marketingEmails}
                                      onChange={(e) => setSettings({...settings, marketingEmails: e.target.checked})}
                                    />
                                  </div>
                                  <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                      <h6 className="text-white mb-1">Two-Factor Authentication</h6>
                                      <small className="text-white">Add an extra layer of security</small>
                                    </div>
                                    <Form.Check
                                      type="switch"
                                      checked={settings.twoFactorAuth}
                                      onChange={(e) => setSettings({...settings, twoFactorAuth: e.target.checked})}
                                    />
                                  </div>
                                </div>
                                <div className="mt-4">
                                  <Button
                                    variant="primary"
                                    onClick={handleSettingsUpdate}
                                    disabled={loading}
                                    className="d-flex align-items-center gap-2"
                                  >
                                    <Save size={16} />
                                    {loading ? 'Saving...' : 'Save Settings'}
                                  </Button>
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>
                        </Row>
                      </div>
                    </Tab>
                  </Tabs>
                </Card.Body>
              </Card>
            </motion.div>
          </motion.div>
        </Container>

        {/* Password Change Modal */}
        <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered>
          <Modal.Header closeButton className="bg-dark border-secondary">
            <Modal.Title className="text-white">Change Password</Modal.Title>
          </Modal.Header>
          <Modal.Body className="bg-dark">
            <Form>
              <Form.Group className="mb-3">
                <Form.Label className="text-light">Current Password</Form.Label>
                <Form.Control
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  className="bg-dark border-secondary text-white"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="text-light">New Password</Form.Label>
                <Form.Control
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  className="bg-dark border-secondary text-white"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="text-light">Confirm New Password</Form.Label>
                <Form.Control
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  className="bg-dark border-secondary text-white"
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer className="bg-dark border-secondary">
            <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handlePasswordChange} disabled={loading}>
              {loading ? 'Changing...' : 'Change Password'}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </RequireAuth>
  );
};

export default AccountSettingsPage;