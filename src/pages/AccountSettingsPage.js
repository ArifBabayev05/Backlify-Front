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
  getUserLogStats,
  getRealApiUsageFromLogs,
  setXAuthUserId,
  getUserDebugInfo,
  getSubscriptionPlans
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
  const [userDebugInfo, setUserDebugInfo] = useState(null);
  const [debugInfoLoading, setDebugInfoLoading] = useState(false);
  const [plansData, setPlansData] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);


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
      // Get username from localStorage
      const username = localStorage.getItem('username') || user?.username;
      
      // Ensure XAuthUserId is set before making any API calls
      if (username) {
        setXAuthUserId(username);
        // Add a small delay to ensure the XAuthUserId is properly set
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Load user's APIs to get usage statistics
      const apisData = await apiRequest('/my-apis', { method: 'GET' });
      const userApis = apisData.apis || [];
      
      // Create user profile from available data
      const userProfile = {
        firstName: user?.username?.split(' ')[0] || 'User',
        lastName: user?.username?.split(' ')[1] || '',
        email: user?.email || 'user@example.com',
        company: 'Backlify User',
        phone: '+1 (555) 123-4567'
      };
      
      setUserProfile(userProfile);
      
      // Update profile form with user data
      setProfileForm({
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        email: userProfile.email,
        company: userProfile.company,
        phone: userProfile.phone
      });

      // Load real subscription data from getUserDebugInfo and getSubscriptionPlans
      if (username) {
        try {
          setDebugInfoLoading(true);
          setPlansLoading(true);
          
          // Load both debug info and plans data
          const [debugInfo, plans] = await Promise.all([
            getUserDebugInfo(username),
            getSubscriptionPlans()
          ]);
          
          setUserDebugInfo(debugInfo);
          setPlansData(plans);
          
          // Find current plan from plans data
          const currentPlanId = debugInfo?.user_plan || 'basic';
          const currentPlan = plans.find(p => p.id === currentPlanId) || plans[0];
          
          // Helper function to format limits
          const formatLimit = (limit) => {
            return limit === -1 ? 'Unlimited' : limit.toString();
          };
          
          const subscriptionData = {
            planName: currentPlan?.name || 'Basic Plan',
            plan: currentPlanId,
            status: 'active',
            price: currentPlan?.price || 0,
            currency: currentPlan?.currency || 'AZN',
            features: {
              apiCalls: formatLimit(debugInfo?.limits?.requests || 1000),
              maxProjects: formatLimit(debugInfo?.limits?.projects || 5)
            },
            usage: {
              requestsCount: debugInfo?.requests_count || 0,
              projectsCount: debugInfo?.projects_count || 0
            },
            isOverLimit: debugInfo?.isOverLimit || false,
            planFeatures: currentPlan?.features || []
          };
          setSubscription(subscriptionData);

          // Create API usage data from real debug info
          const requestsLimit = debugInfo?.limits?.requests || 1000;
          const apiUsageData = {
            totalCalls: debugInfo?.requests_count || 0,
            limit: requestsLimit,
            limitDisplay: requestsLimit === -1 ? 'Unlimited' : requestsLimit.toString(),
            thisMonth: debugInfo?.requests_count || 0,
            lastMonth: Math.max(0, (debugInfo?.requests_count || 0) - 10), // Estimate
            isOverLimit: debugInfo?.isOverLimit || false,
            remaining: debugInfo?.remaining_requests || 0,
            monthStart: debugInfo?.month_start || new Date().toISOString()
          };
          setApiUsage(apiUsageData);
        } catch (debugError) {
          console.warn('Could not load debug info or plans, using fallback:', debugError);
          // Fallback to basic plan
          const fallbackSubscription = {
            planName: 'Basic Plan',
            plan: 'basic',
            status: 'active',
            price: 0,
            currency: 'AZN',
            features: {
              apiCalls: '1000',
              maxProjects: '5'
            }
          };
          setSubscription(fallbackSubscription);
          
          const fallbackUsage = {
            totalCalls: 0,
            limit: 1000,
            limitDisplay: '1000',
            thisMonth: 0,
            lastMonth: 0,
            isOverLimit: false,
            remaining: 1000,
            monthStart: new Date().toISOString()
          };
          setApiUsage(fallbackUsage);
        } finally {
          setDebugInfoLoading(false);
          setPlansLoading(false);
        }
      } else {
        // Fallback if no username
        const fallbackSubscription = {
          planName: 'Basic Plan',
          plan: 'basic',
          status: 'active',
          price: 0,
          currency: 'AZN',
          features: {
            apiCalls: '1000',
            maxProjects: '5'
          }
        };
        setSubscription(fallbackSubscription);
        
        const fallbackUsage = {
          totalCalls: 0,
          limit: 1000,
          limitDisplay: '1000',
          thisMonth: 0,
          lastMonth: 0,
          isOverLimit: false,
          remaining: 1000,
          monthStart: new Date().toISOString()
        };
        setApiUsage(fallbackUsage);
      }

      // Load real request logs from admin endpoint
      const usernameForLogs = localStorage.getItem('username') || user?.username;
      try {
        // Get real usage data from logs
        const realUsageData = await getRealApiUsageFromLogs(null, usernameForLogs);
        
        // For request logs, we need to fetch actual logs from admin endpoint
        const logsResponse = await fetch(`https://backlify-v2.onrender.com/admin/logs?timeRange=last7days&XAuthUserId=${encodeURIComponent(usernameForLogs)}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (logsResponse.ok) {
          const logsData = await logsResponse.json();
          const logs = logsData.logs || [];
          
          // Process logs to get recent API requests
          const processedLogs = logs.slice(0, 10).map((log, index) => ({
            id: index + 1,
            timestamp: log.timestamp || new Date().toISOString(),
            endpoint: log.endpoint || log.path || 'Unknown',
            method: log.method || 'GET',
            status: log.status || log.status_code || 200,
            responseTime: log.responseTime || log.duration || 0,
            ip: log.ip || log.clientIP || 'Unknown'
          }));
          setRequestLogs(processedLogs);
          
          // Filter logs to only include API requests (is_api_request: true) and exclude api/user/plans
          const apiLogs = logs.filter(log => {
            const endpoint = log.endpoint || log.path || '';
            return log.is_api_request === true && 
                   endpoint.includes('/api/') && 
                   !endpoint.includes('/api/user/plans') && 
                   !endpoint.includes('/debug-user-info') &&
                   !endpoint.includes('/create-api-from-schema') &&
                   !endpoint.includes('/admin/');
          });
          
          // Create log statistics from filtered API data
          const totalRequests = apiLogs.length;
          const successfulRequests = apiLogs.filter(log => (log.status || log.status_code) >= 200 && (log.status || log.status_code) < 300).length;
          const successRate = totalRequests > 0 ? Math.round((successfulRequests / totalRequests) * 100) : 0;
          const avgResponseTime = totalRequests > 0 ? 
            Math.round(apiLogs.reduce((sum, log) => {
              let responseTime = 0;
              if (log.responseTime) {
                responseTime = parseFloat(log.responseTime) || 0;
              } else if (log.duration) {
                responseTime = parseFloat(log.duration) || 0;
              } else if (log.response_time) {
                responseTime = parseFloat(log.response_time) || 0;
              }
              return sum + responseTime;
            }, 0) / totalRequests) : 0;
          
          // Group endpoints by endpoint path to avoid duplicates and count requests
          const endpointGroups = {};
          apiLogs.forEach(log => {
            const endpoint = log.endpoint || log.path || 'Unknown';
            if (!endpointGroups[endpoint]) {
              endpointGroups[endpoint] = {
                endpoint: endpoint,
                count: 0,
                success: 0,
                totalResponseTime: 0
              };
            }
            endpointGroups[endpoint].count++;
            if ((log.status || log.status_code) >= 200 && (log.status || log.status_code) < 300) {
              endpointGroups[endpoint].success++;
            }
            // Parse response time - handle different formats
            let responseTime = 0;
            if (log.responseTime) {
              responseTime = parseFloat(log.responseTime) || 0;
            } else if (log.duration) {
              responseTime = parseFloat(log.duration) || 0;
            } else if (log.response_time) {
              responseTime = parseFloat(log.response_time) || 0;
            }
            endpointGroups[endpoint].totalResponseTime += responseTime;
          });
          
          // Convert to array and calculate averages
          const topEndpoints = Object.values(endpointGroups)
            .map(group => {
              const successRate = group.count > 0 ? (group.success / group.count) * 100 : 0;
              const avgResponseTime = group.count > 0 ? group.totalResponseTime / group.count : 0;
              
              return {
                endpoint: group.endpoint,
                count: group.count,
                success: Math.round(successRate * 10) / 10, // Round to 1 decimal place
                avgResponseTime: Math.round(avgResponseTime) // Round to whole number
              };
            })
            .sort((a, b) => b.count - a.count) // Sort by request count
            .slice(0, 10); // Take top 10 for better visibility
          
          const realStats = {
            summary: {
              totalRequests: totalRequests,
              successRate: successRate,
              avgResponseTime: avgResponseTime
            },
            topEndpoints: topEndpoints
          };
          
          // Debug logging
          console.log('Real API logs data:', {
            totalLogs: logs.length,
            apiLogs: apiLogs.length,
            topEndpoints: topEndpoints.length,
            sampleEndpoint: topEndpoints[0],
            sampleLog: apiLogs[0],
            successRate: successRate,
            avgResponseTime: avgResponseTime
          });
          
          setLogStats(realStats);
        } else {
          throw new Error('Failed to fetch logs');
        }
      } catch (logError) {
        console.warn('Could not load real logs, using fallback:', logError);
        // Fallback to empty array if logs fail
        setRequestLogs([]);
        
        // Fallback stats - show that no data is available
        const fallbackStats = {
          summary: {
            totalRequests: 0,
            successRate: 0,
            avgResponseTime: 0
          },
          topEndpoints: []
        };
        
        console.warn('Using fallback stats - no real data available');
        setLogStats(fallbackStats);
      }

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
    // If limit is -1 (unlimited), show 0% progress
    if (apiUsage.limit === -1) return 0;
    if (apiUsage.limit === 0) return 0;
    return Math.min((apiUsage.totalCalls / apiUsage.limit) * 100, 100);
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return 'danger';
    if (percentage >= 75) return 'warning';
    return 'success';
  };

  const getUsageStatus = (percentage) => {
    if (percentage >= 100) return { text: 'Limit Exceeded', variant: 'danger' };
    if (percentage >= 90) return { text: 'Near Limit', variant: 'warning' };
    if (percentage >= 75) return { text: 'High Usage', variant: 'info' };
    return { text: 'Normal', variant: 'success' };
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
      <NavBar />
      <div className="page-wrapper account-settings-page">
        
        <Container className="py-5">
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
                            <Card className="border-0 glass usage-card h-100">
                              <Card.Body className="p-4">
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                  <div className="d-flex align-items-center">
                                    <div className="me-3 p-2 rounded-2" style={{
                                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
                                      border: '1px solid rgba(16, 185, 129, 0.2)'
                                    }}>
                                      <Activity size={20} className="text-success" />
                                    </div>
                                    <div>
                                      <h5 className="text-white mb-1 fw-bold">API Usage</h5>
                                      <small className="text-white">Monthly usage</small>
                                    </div>
                                  </div>
                                  <Badge 
                                    bg={getUsageColor(getUsagePercentage())}
                                    className="d-flex align-items-center gap-1 px-3 py-2"
                                    style={{ borderRadius: 'var(--radius-lg)' }}
                                  >
                                    {getUsageStatus(getUsagePercentage()).text}
                                  </Badge>
                                </div>

                                {apiUsage?.limit === -1 ? (
                                  <div className="text-center py-4">
                                    <div className="mb-3 p-3 rounded-3 d-inline-block" style={{
                                      background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%)',
                                      border: '1px solid rgba(255, 193, 7, 0.2)'
                                    }}>
                                      <Star className="text-warning" size={32} />
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
                                            {apiUsage?.totalCalls?.toLocaleString() || 0}
                                          </h4>
                                          <small className="text-white">
                                            of {apiUsage?.limitDisplay || '1000'} requests
                                          </small>
                                        </div>
                                        <div className="text-end">
                                          <div className="h5 text-white mb-0 fw-bold">{getUsagePercentage().toFixed(1)}%</div>
                                          <small className="text-white">used</small>
                                        </div>
                                      </div>
                                      <ProgressBar 
                                        variant={getUsageColor(getUsagePercentage())}
                                        now={getUsagePercentage()}
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
                                          {apiUsage?.remaining?.toLocaleString() || 'N/A'}
                                        </small>
                                      </div>
                                      <div className="text-end">
                                        <small className="text-white d-block">Reset Date</small>
                                        <small className="text-white fw-medium">
                                          {apiUsage?.monthStart ? new Date(apiUsage.monthStart).toLocaleDateString() : 'N/A'}
                                        </small>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </Card.Body>
                            </Card>
                          </Col>

                          {/* Subscription Info */}
                          <Col lg={6}>
                            <Card className="border-0 glass usage-card h-100">
                              <Card.Body className="p-4">
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                  <div className="d-flex align-items-center">
                                    <div className="me-3 p-2 rounded-2" style={{
                                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)',
                                      border: '1px solid rgba(139, 92, 246, 0.2)'
                                    }}>
                                      <Star size={20} className="text-primary" />
                                    </div>
                                    <div>
                                      <h5 className="text-white mb-1 fw-bold">Subscription</h5>
                                      <small className="text-white">Current plan</small>
                                    </div>
                                  </div>
                                  <Badge 
                                    bg={subscription?.status === 'active' ? 'success' : 'secondary'}
                                    className="d-flex align-items-center gap-1 px-3 py-2"
                                    style={{ borderRadius: 'var(--radius-lg)' }}
                                  >
                                    {subscription?.status || 'inactive'}
                                  </Badge>
                                </div>

                                <div className="mb-4">
                                  <div className="d-flex align-items-center justify-content-between mb-3">
                                    <div>
                                      <h4 className="text-white mb-1 fw-bold">{subscription?.planName || 'Free Plan'}</h4>
                                      <small className="text-white">Current subscription</small>
                                    </div>
                                    <div className="text-end">
                                      <h5 className="text-white mb-1 fw-bold">
                                        {subscription?.price || 0} {subscription?.currency || 'AZN'}
                                      </h5>
                                      <small className="text-white">per month</small>
                                    </div>
                                  </div>
                                </div>

                                <div className="row g-3 mb-4">
                                  <div className="col-6">
                                    <div className="p-3 rounded-2" style={{
                                      background: 'rgba(255, 255, 255, 0.03)',
                                      border: '1px solid rgba(255, 255, 255, 0.05)'
                                    }}>
                                      <small className="text-white d-block mb-1">API Calls Limit</small>
                                      <div className="text-white fw-bold h5 mb-0">{subscription?.features?.apiCalls || '1000'}</div>
                                    </div>
                                  </div>
                                  <div className="col-6">
                                    <div className="p-3 rounded-2" style={{
                                      background: 'rgba(255, 255, 255, 0.03)',
                                      border: '1px solid rgba(255, 255, 255, 0.05)'
                                    }}>
                                      <small className="text-white d-block mb-1">Max Projects</small>
                                      <div className="text-white fw-bold h5 mb-0">{subscription?.features?.maxProjects || '5'}</div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Subscription Management Buttons */}
                                <div className="d-flex gap-2 flex-wrap">
                                  <Button 
                                    variant="primary" 
                                    size="sm"
                                    onClick={handleManageBilling}
                                    disabled={loading}
                                    className="d-flex align-items-center gap-2"
                                  >
                                    <Star size={16} />
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
                                      className="d-flex align-items-center gap-2"
                                    >
                                      <ArrowRight size={16} />
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
                            <Card className="border-0 glass" style={{ 
                              background: 'rgba(255, 255, 255, 0.05)',
                              backdropFilter: 'blur(12px)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}>
                              <Card.Body className="p-4">
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                  <div className="d-flex align-items-center">
                                    <div className="me-3 p-2 rounded-2" style={{
                                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                                      border: '1px solid rgba(59, 130, 246, 0.2)'
                                    }}>
                                      <BarChart size={20} className="text-primary" />
                                    </div>
                                    <div>
                                      <h5 className="text-white mb-1 fw-bold">Top Endpoints</h5>
                                      <small className="text-white">Most used API endpoints (Last 7 days)</small>
                                    </div>
                                  </div>
                                  <div className="d-flex align-items-center gap-3">
                                    <Badge 
                                      bg="info"
                                      className="d-flex align-items-center gap-1 px-3 py-2"
                                      style={{ borderRadius: 'var(--radius-lg)' }}
                                    >
                                      {logStats?.topEndpoints?.length || 0} endpoints
                                    </Badge>
                                    <Button 
                                      variant="outline-primary" 
                                      size="sm"
                                      onClick={() => loadUserData()}
                                      disabled={loading}
                                      className="d-flex align-items-center gap-2"
                                    >
                                      <Activity size={14} />
                                      Refresh
                                    </Button>
                                  </div>
                                </div>
                                
                                {logStats?.topEndpoints?.length > 0 ? (
                                  <div className="table-responsive">
                                    <Table variant="dark" className="mb-0">
                                      <thead>
                                        <tr>
                                          <th className="text-white fw-medium">Endpoint</th>
                                          <th className="text-white fw-medium">Requests</th>
                                          <th className="text-white fw-medium">Success Rate</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {logStats.topEndpoints.map((endpoint, index) => {
                                          // Validate endpoint data
                                          const isValidEndpoint = endpoint && 
                                            typeof endpoint.count === 'number' && 
                                            typeof endpoint.success === 'number' && 
                                            typeof endpoint.avgResponseTime === 'number';
                                          
                                          if (!isValidEndpoint) {
                                            console.warn('Invalid endpoint data:', endpoint);
                                            return null;
                                          }
                                          
                                          return (
                                            <tr key={index} className="border-0">
                                              <td className="text-light py-3">
                                                <div className="d-flex align-items-center">
                                                  <div className="me-2 p-1 rounded" style={{
                                                    background: 'rgba(59, 130, 246, 0.1)',
                                                    width: '24px',
                                                    height: '24px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                  }}>
                                                    <Activity size={12} className="text-primary" />
                                                  </div>
                                                  <span className="text-truncate" style={{ maxWidth: '200px' }} title={endpoint.endpoint}>
                                                    {endpoint.endpoint || 'Unknown'}
                                                  </span>
                                                </div>
                                              </td>
                                              <td className="text-white py-3 fw-medium">{endpoint.count.toLocaleString()}</td>
                                              <td className="py-3">
                                                <Badge 
                                                  bg={endpoint.success > 95 ? 'success' : endpoint.success > 90 ? 'warning' : 'danger'}
                                                  className="px-3 py-2"
                                                  style={{ borderRadius: 'var(--radius-md)' }}
                                                >
                                                  {endpoint.success.toFixed(1)}%
                                                </Badge>
                                              </td>
                                              
                                            </tr>
                                          );
                                        }).filter(Boolean)}
                                      </tbody>
                                    </Table>
                                  </div>
                                ) : (
                                  <div className="text-center py-5">
                                    <div className="mb-3 p-3 rounded-3 d-inline-block" style={{
                                      background: 'rgba(255, 255, 255, 0.05)',
                                      border: '1px solid rgba(255, 255, 255, 0.1)'
                                    }}>
                                      <BarChart size={32} className="text-white" />
                                    </div>
                                    <h6 className="text-white mb-2">No endpoint data available</h6>
                                    <small className="text-white mb-3 d-block">API usage data will appear here once you start making requests to your APIs</small>
                                    <Button 
                                      variant="outline-primary" 
                                      size="sm"
                                      onClick={() => loadUserData()}
                                      disabled={loading}
                                      className="d-flex align-items-center gap-2 mx-auto"
                                    >
                                      <Activity size={14} />
                                      {loading ? 'Loading...' : 'Refresh Data'}
                                    </Button>
                                  </div>
                                )}
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