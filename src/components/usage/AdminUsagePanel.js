import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Card, 
  Table, 
  Badge, 
  Button, 
  Row, 
  Col, 
  Alert, 
  Spinner,
  ProgressBar,
  Form,
  InputGroup,
  Modal,
  Tabs,
  Tab
} from 'react-bootstrap';
import { 
  BarChart, 
  People, 
  Server, 
  GraphUp,
  ArrowClockwise,
  Search,
  Download,
  Eye,
  Activity,
  Clock,
  ExclamationTriangle,
  Check,
  FileText,
  Signpost,
  Person,
  ClockHistory,
  ArrowLeftRight,
  Info
} from 'react-bootstrap-icons';
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { toast } from 'react-hot-toast';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f97316', '#f43f5e'];
const STATUS_COLORS = {
  200: '#10b981', 201: '#10b981', 204: '#10b981',
  304: '#f97316',
  400: '#f43f5e', 401: '#f43f5e', 403: '#f43f5e', 404: '#f43f5e',
  500: '#ef4444',
};

const AdminUsagePanel = ({ 
  refreshInterval = 60000
}) => {
  // State for usage statistics
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // State for logs functionality
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [logsStats, setLogsStats] = useState(null);
  const [logsLoading, setLogsLoading] = useState(false);
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [timeRange, setTimeRange] = useState('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomDateFields, setShowCustomDateFields] = useState(false);
  
  // Active tab
  const [activeTab, setActiveTab] = useState('overview');
  
  // Log details modal
  const [selectedLog, setSelectedLog] = useState(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logDetailTab, setLogDetailTab] = useState('overview');
  
  // User journey
  const [searchUsername, setSearchUsername] = useState('');
  const [userLogs, setUserLogs] = useState([]);
  const [userJourneyLoading, setUserJourneyLoading] = useState(false);
  const [selectedUsername, setSelectedUsername] = useState('');
  const [userJourneyStartDate, setUserJourneyStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [userJourneyEndDate, setUserJourneyEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [showUserJourneyDateRange, setShowUserJourneyDateRange] = useState(true);
  const [usernameSuggestions, setUsernameSuggestions] = useState([]);
  const [showUsernameSuggestions, setShowUsernameSuggestions] = useState(false);

  // Fetch usage stats data
  const fetchStatsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let data;
      try {
        const response = await fetch('https://backlify-v2.onrender.com/admin/usage-stats');
        if (!response.ok) throw new Error('Failed to fetch usage stats');
        data = await response.json();
      } catch (apiError) {
        console.warn('Usage stats API failed, using fallback data:', apiError);
        // Fallback data structure
        data = {
          user_stats: [],
          api_stats: [],
          total_logs: 0,
          month_start: new Date().toISOString()
        };
      }
      
      setStatsData(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching usage stats:', err);
      setError(err.message);
      toast.error('Failed to load usage statistics');
    } finally {
      setLoading(false);
    }
  };

  // Fetch logs data
  const fetchLogs = async () => {
    try {
      setLogsLoading(true);
      
      let queryParams = new URLSearchParams();
      
      if (timeRange === 'custom' && customStartDate && customEndDate) {
        queryParams.append('startDate', customStartDate);
        queryParams.append('endDate', customEndDate);
      } else {
        queryParams.append('timeRange', timeRange);
      }
      
      const response = await fetch(`https://backlify-v2.onrender.com/admin/logs?${queryParams.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.status}`);
      }
      
      const data = await response.json();
      const logsData = data.logs || [];
      setLogs(logsData);
    } catch (error) {
      console.error('Error fetching logs:', error);
      setError(`Failed to load logs: ${error.message}`);
    } finally {
      setLogsLoading(false);
    }
  };

  // Fetch logs stats
  const fetchLogsStats = async () => {
    try {
      let queryParams = new URLSearchParams();
      
      if (timeRange === 'custom' && customStartDate && customEndDate) {
        queryParams.append('startDate', customStartDate);
        queryParams.append('endDate', customEndDate);
      } else {
        queryParams.append('timeRange', timeRange);
      }
      
      const username = localStorage.getItem('username');
      if (username) {
        queryParams.append('XAuthUserId', username);
      }
      
      const response = await fetch(`https://backlify-v2.onrender.com/admin/logs/stats?${queryParams.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status}`);
      }
      
      const data = await response.json();
      setLogsStats(data);
    } catch (error) {
      console.error('Error fetching logs stats:', error);
    }
  };

  // Search user logs for journey
  const searchUserLogs = async () => {
    if (!searchUsername) return;
    
    try {
      setUserJourneyLoading(true);
      setSelectedUsername(searchUsername);
      
      let queryParams = new URLSearchParams();
      queryParams.append('XAuthUserId', searchUsername);
      
      if (showUserJourneyDateRange && userJourneyStartDate && userJourneyEndDate) {
        queryParams.append('startDate', userJourneyStartDate.split('T')[0]);
        queryParams.append('endDate', userJourneyEndDate.split('T')[0]);
      }
      
      const response = await fetch(`https://backlify-v2.onrender.com/admin/logs?${queryParams.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user logs: ${response.status}`);
      }
      
      const data = await response.json();
      let filteredLogs = data.logs || [];
      
      if (showUserJourneyDateRange && userJourneyStartDate && userJourneyEndDate) {
        const startDate = new Date(userJourneyStartDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(userJourneyEndDate);
        endDate.setHours(23, 59, 59, 999);
        
        filteredLogs = filteredLogs.filter(log => {
          const logDate = new Date(log.timestamp);
          return logDate >= startDate && logDate <= endDate;
        });
      }
      
      const sortedLogs = filteredLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      setUserLogs(sortedLogs);
    } catch (error) {
      console.error('Error fetching user logs:', error);
      setError(`Failed to load user logs: ${error.message}`);
    } finally {
      setUserJourneyLoading(false);
    }
  };

  // Fetch username suggestions
  const fetchUsernameSuggestions = async (query) => {
    if (query.length < 3) {
      setUsernameSuggestions([]);
      setShowUsernameSuggestions(false);
      return;
    }
    
    try {
      const response = await fetch('https://backlify-v2.onrender.com/admin/logs', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const logsData = await response.json();
        const userIds = logsData.logs
          ? [...new Set(logsData.logs.map(log => log.XAuthUserId))]
            .filter(userId => userId && userId.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 10)
          : [];
          
        setUsernameSuggestions(userIds);
        setShowUsernameSuggestions(userIds.length > 0);
      }
    } catch (error) {
      console.error('Error fetching username suggestions:', error);
      setUsernameSuggestions([]);
      setShowUsernameSuggestions(false);
    }
  };

  // Filter logs based on time range
  const filterLogsByTimeRange = () => {
    const now = new Date();
    let startDate;
    
    if (timeRange === 'custom' && customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      const endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999);
      
      setFilteredLogs(logs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= startDate && logDate <= endDate;
      }));
      return;
    }
    
    switch (timeRange) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'last7days':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'last30days':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 1);
    }
    
    setFilteredLogs(logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= startDate && logDate <= now;
    }));
  };

  useEffect(() => {
    fetchStatsData();
    fetchLogs();
    fetchLogsStats();
    
    const interval = setInterval(() => {
      fetchStatsData();
      fetchLogs();
      fetchLogsStats();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [refreshInterval, timeRange, customStartDate, customEndDate]);

  useEffect(() => {
    if (logs.length > 0) {
      filterLogsByTimeRange();
    }
  }, [logs, timeRange, customStartDate, customEndDate]);

  // Helper functions
  const getTotalRequests = () => {
    if (!statsData?.user_stats) return 0;
    return statsData.user_stats.reduce((total, user) => total + user.requests_count, 0);
  };

  const getTotalProjects = () => {
    if (!statsData?.user_stats) return 0;
    return statsData.user_stats.reduce((total, user) => total + user.projects_count, 0);
  };

  const getTopUsers = (limit = 10) => {
    if (!statsData?.user_stats) return [];
    return statsData.user_stats
      .sort((a, b) => b.requests_count - a.requests_count)
      .slice(0, limit);
  };

  const getTopApis = (limit = 10) => {
    if (!statsData?.api_stats) return [];
    return statsData.api_stats
      .sort((a, b) => b.requests_count - a.requests_count)
      .slice(0, limit);
  };

  const filteredUserStats = () => {
    if (!statsData?.user_stats) return [];
    
    let filtered = statsData.user_stats;
    
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.user_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterType === 'high-usage') {
      const avgRequests = getTotalRequests() / statsData.user_stats.length;
      filtered = filtered.filter(user => user.requests_count > avgRequests);
    }
    
    return filtered;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getStatusBadgeVariant = (status) => {
    if (status >= 200 && status < 300) return 'success';
    if (status >= 300 && status < 400) return 'warning';
    if (status >= 400 && status < 500) return 'danger';
    if (status >= 500) return 'danger';
    return 'secondary';
  };

  const hasError = (log) => {
    return log.status_code >= 400;
  };

  const getErrorDetails = (log) => {
    if (!log) return "No error details available";
    
    if (log.status_code >= 400) {
      try {
        if (log.response && log.response.body) {
          const responseBody = typeof log.response.body === 'string' ? 
            JSON.parse(log.response.body) : log.response.body;
            
          if (responseBody.error) return responseBody.error;
          if (responseBody.message) return responseBody.message;
          if (responseBody.errors) return JSON.stringify(responseBody.errors);
        }
        
        return `${log.status_code} ${log.response?.statusMessage || ''}`;
      } catch (e) {
        return `${log.status_code} ${log.response?.statusMessage || ''}`;
      }
    }
    
    return "No error detected";
  };

  const formatJSON = (json) => {
    try {
      if (typeof json === 'string') {
        return JSON.stringify(JSON.parse(json), null, 2);
      }
      return JSON.stringify(json, null, 2);
    } catch (e) {
      return json;
    }
  };

  const showLogDetails = (log) => {
    setSelectedLog(log);
    setShowLogModal(true);
    setLogDetailTab('overview');
  };

  const handleCloseModal = () => {
    setShowLogModal(false);
    setSelectedLog(null);
  };

  // Chart data preparation functions
  const prepareMethodData = () => {
    if (!logsStats) return [];
    
    return [
      { name: 'GET', value: logsStats.general_stats.get_count || 0 },
      { name: 'POST', value: logsStats.general_stats.post_count || 0 },
      { name: 'PUT', value: logsStats.general_stats.put_count || 0 },
      { name: 'DELETE', value: logsStats.general_stats.delete_count || 0 },
    ].filter(item => item.value > 0);
  };

  const prepareStatusData = () => {
    if (!logsStats) return [];
    
    return [
      { name: 'Success', value: logsStats.general_stats.success_count || 0 },
      { name: 'Client Error', value: logsStats.general_stats.client_error_count || 0 },
      { name: 'Server Error', value: logsStats.general_stats.server_error_count || 0 },
    ].filter(item => item.value > 0);
  };

  const prepareEndpointData = () => {
    if (!logsStats || !logsStats.top_endpoints) return [];
    
    return logsStats.top_endpoints.slice(0, 5).map(endpoint => ({
      name: endpoint.endpoint.split('/').pop() || endpoint.endpoint,
      fullPath: endpoint.endpoint,
      count: endpoint.request_count
    }));
  };

  const prepareUserData = () => {
    if (!logsStats || !logsStats.top_users) return [];
    
    return logsStats.top_users.slice(0, 5).map(user => ({
      name: user.XAuthUserId,
      value: user.request_count
    }));
  };

  // User journey helper functions
  const getActionType = (log) => {
    const endpoint = log.endpoint.toLowerCase();
    const method = log.method;
    
    if (endpoint.includes('/auth/register')) return 'register';
    if (endpoint.includes('/auth/login')) return 'login';
    if (endpoint.includes('/generate-schema')) return 'generate-schema';
    if (endpoint.includes('/modify-schema')) return 'modify-schema';
    if (endpoint.includes('/create-api-from-schema')) return 'create-api-from-schema';
    if (endpoint.includes('delete') && log.status_code >= 200 && log.status_code < 300) return 'delete';
    if (endpoint.includes('update') && log.status_code >= 200 && log.status_code < 300) return 'update';
    
    if (log.is_api_request && method === 'GET') return 'api-get';
    if (log.is_api_request && method === 'POST') return 'api-post';
    if (log.is_api_request && method === 'PUT') return 'api-put';
    if (log.is_api_request && method === 'DELETE') return 'api-delete';
    
    return 'other';
  };

  const getActionColor = (actionType) => {
    switch (actionType) {
      case 'register': return '#3b82f6';
      case 'login': return '#10b981';
      case 'generate-schema': return '#8b5cf6';
      case 'modify-schema': return '#f97316';
      case 'create-api-from-schema': return '#ec4899';
      case 'delete': return '#ef4444';
      case 'update': return '#f59e0b';
      case 'api-get': return '#06b6d4';
      case 'api-post': return '#10b981';
      case 'api-put': return '#f59e0b';
      case 'api-delete': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getActionIcon = (actionType) => {
    switch (actionType) {
       case 'register': return <Person size={12} />;
       case 'login': return <Person size={12} />;
      case 'generate-schema': return <FileText size={12} />;
      case 'modify-schema': return <FileText size={12} />;
      case 'create-api-from-schema': return <Server size={12} />;
      case 'delete': return <ExclamationTriangle size={12} />;
      case 'update': return <ArrowLeftRight size={12} />;
      case 'api-get': return <Eye size={12} />;
      case 'api-post': return <FileText size={12} />;
      case 'api-put': return <ArrowLeftRight size={12} />;
      case 'api-delete': return <ExclamationTriangle size={12} />;
       default: return <ClockHistory size={12} />;
    }
  };

  const getActionLabel = (actionType) => {
    switch (actionType) {
      case 'register': return 'Register';
      case 'login': return 'Login';
      case 'generate-schema': return 'Generate Schema';
      case 'modify-schema': return 'Modify Schema';
      case 'create-api-from-schema': return 'Create API from Schema';
      case 'delete': return 'Delete Operation';
      case 'update': return 'Update Operation';
      case 'api-get': return 'API GET Request';
      case 'api-post': return 'API POST Request';
      case 'api-put': return 'API PUT Request';
      case 'api-delete': return 'API DELETE Request';
      default: return 'Other Action';
    }
  };

  // Render user journey
  const renderUserJourney = () => {
    if (userJourneyLoading) {
      return (
        <div className="text-center my-5 py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-light">Loading user journey...</p>
        </div>
      );
    }

    if (userLogs.length === 0) {
      return (
        <div className="text-center my-5 py-5">
          <div className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-3" 
            style={{ 
              width: '80px', 
              height: '80px', 
              background: 'rgba(255, 255, 255, 0.1)',
            }}>
             <Signpost size={32} className="text-white-50" />
          </div>
          <h5 className="text-white mb-2">No user journey found</h5>
          <p className="text-white-50">
            {selectedUsername ? 
              `No logs found for user "${selectedUsername}"${showUserJourneyDateRange ? ' in the selected date range' : ''}. Try different parameters.` : 
              'Enter a username and search to view their journey.'}
          </p>
        </div>
      );
    }

    // Group logs by days
    const logsByDay = userLogs.reduce((groups, log) => {
      const date = new Date(log.timestamp);
      const formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
      
      if (!groups[formattedDate]) {
        groups[formattedDate] = [];
      }
      groups[formattedDate].push(log);
      return groups;
    }, {});

    const formatDateForDisplay = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
    };
    
    const startDateForDisplay = showUserJourneyDateRange && userJourneyStartDate ? 
      formatDateForDisplay(userJourneyStartDate) : 
      formatDateForDisplay(userLogs[0].timestamp);
      
    const endDateForDisplay = showUserJourneyDateRange && userJourneyEndDate ? 
      formatDateForDisplay(userJourneyEndDate) : 
      formatDateForDisplay(userLogs[userLogs.length - 1].timestamp);

    return (
      <div className="p-3">
        <div className="mb-4">
          <h5 className="text-white mb-2">User Journey for: <span className="text-info">{selectedUsername}</span></h5>
          <p className="text-white-50">
            Showing {userLogs.length} actions from {startDateForDisplay} to {endDateForDisplay}
          </p>
        </div>

        {Object.entries(logsByDay).map(([date, dayLogs]) => (
          <div key={date} className="mb-4">
            <div className="d-flex align-items-center mb-3">
              <div className="d-flex align-items-center justify-content-center rounded-circle me-2"
                style={{
                  width: '32px',
                  height: '32px',
                  background: 'rgba(255, 255, 255, 0.1)',
                }}>
                <Clock size={14} className="text-white" />
              </div>
              <h6 className="text-white m-0">{date}</h6>
            </div>

            <div className="position-relative" style={{ 
              paddingLeft: '16px', 
              borderLeft: '2px dashed rgba(255, 255, 255, 0.2)'
            }}>
              {dayLogs.map((log, index) => {
                const actionType = getActionType(log);
                const timestamp = new Date(log.timestamp);
                const formattedTime = `${timestamp.getHours().toString().padStart(2, '0')}:${timestamp.getMinutes().toString().padStart(2, '0')}:${timestamp.getSeconds().toString().padStart(2, '0')}`;
                
                const actionColor = getActionColor(actionType);
                const actionIcon = getActionIcon(actionType);
                const actionLabel = getActionLabel(actionType);
                
                return (
                  <div key={log.id} className="mb-4 position-relative" style={{ paddingLeft: '32px' }}>
                    <div 
                      className="position-absolute d-flex align-items-center justify-content-center"
                      style={{
                        width: '28px',
                        height: '28px',
                        left: '-14px',
                        background: actionColor,
                        borderRadius: '50%',
                        color: 'white',
                        fontSize: '12px',
                        zIndex: 1
                      }}
                    >
                      {actionIcon}
                    </div>
                    
                    <Card 
                      className="border-0 shadow-sm" 
                      style={{ 
                        background: 'rgba(30, 41, 59, 0.7)', 
                        borderRadius: '12px',
                        borderLeft: `4px solid ${actionColor}`
                      }}
                    >
                      <Card.Body className="p-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h6 className="text-white m-0 d-flex align-items-center">
                            <span className="me-2" style={{ color: actionColor }}>{actionLabel}</span>
                            <Badge 
                              bg={getStatusBadgeVariant(log.status_code)}
                              style={{ fontSize: '0.65rem' }}
                            >
                              {log.status_code}
                            </Badge>
                          </h6>
                          <small className="text-white-50">{formattedTime}</small>
                        </div>
                        
                        <p className="text-white-50 mb-2 small text-break">
                          <strong>Endpoint:</strong> {log.endpoint}
                        </p>
                        
                        <div className="d-flex gap-2 flex-wrap">
                          <Badge 
                            bg="secondary"
                            className="text-white"
                            style={{ fontWeight: 'normal', opacity: 0.7 }}
                          >
                            {log.method}
                          </Badge>
                          
                          {log.is_api_request && log.api_id && (
                            <Badge 
                              bg="info"
                              className="text-white"
                              style={{ fontWeight: 'normal', opacity: 0.7 }}
                            >
                              API ID: {log.api_id.substring(0, 8)}...{log.api_id.substring(log.api_id.length-8)}
                            </Badge>
                          )}
                          
                          <Badge 
                            bg="secondary"
                            className="text-white"
                            style={{ fontWeight: 'normal', opacity: 0.7 }}
                          >
                            {log.response_time_ms} ms
                          </Badge>
                        </div>
                        
                        <Button 
                          variant="link" 
                          size="sm"
                          className="p-0 mt-2 text-decoration-none"
                          onClick={() => showLogDetails(log)}
                          style={{ color: actionColor, fontSize: '0.8rem' }}
                        >
                          View Details
                        </Button>
                      </Card.Body>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
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

  if (loading && !statsData) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="text-white mt-3">Loading admin dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="text-center">
        <Activity className="me-2" />
        {error}
        <Button 
          variant="outline-danger" 
          size="sm" 
          className="ms-3"
          onClick={() => {
            fetchStatsData();
            fetchLogs();
            fetchLogsStats();
          }}
        >
          <ArrowClockwise size={14} />
          Retry
        </Button>
      </Alert>
    );
  }

  const topUsers = getTopUsers(5);
  const topApis = getTopApis(5);
  const filteredUsers = filteredUserStats();

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="text-white mb-0">
          <Activity className="me-2" />
          Admin Dashboard & Analytics
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
            onClick={() => {
              fetchStatsData();
              fetchLogs();
              fetchLogsStats();
            }}
            disabled={loading || logsLoading}
          >
            <ArrowClockwise size={14} className={loading || logsLoading ? 'spinning' : ''} />
          </Button>
        </div>
      </div>

      {/* Time Range Controls */}
      <motion.div variants={itemVariants} className="mb-4">
        <Card className="border-0 glass">
          <Card.Body className="p-3">
            <Row className="g-3 align-items-center">
              <Col md={3}>
                <Form.Select 
                  value={timeRange}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setTimeRange(newValue);
                    setShowCustomDateFields(newValue === 'custom');
                  }}
                  style={{
                    background: 'rgba(30, 41, 59, 0.9)',
                    color: 'white',
                    border: '1px solid rgba(59, 130, 246, 0.5)',
                  }}
                >
                  <option value="today">Today</option>
                  <option value="last7days">Last 7 Days</option>
                  <option value="last30days">Last 30 Days</option>
                  <option value="custom">Custom Range</option>
                </Form.Select>
              </Col>
              
              {showCustomDateFields && (
                <>
                  <Col md={3}>
                    <Form.Control
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      style={{
                        background: 'rgba(30, 41, 59, 0.9)',
                        color: 'white',
                        border: '1px solid rgba(59, 130, 246, 0.5)',
                      }}
                    />
                  </Col>
                  <Col md={3}>
                    <Form.Control
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      style={{
                        background: 'rgba(30, 41, 59, 0.9)',
                        color: 'white',
                        border: '1px solid rgba(59, 130, 246, 0.5)',
                      }}
                    />
                  </Col>
                  <Col md={2}>
                    <Button 
                      variant="primary"
                      onClick={() => {
                        fetchLogs();
                        fetchLogsStats();
                      }}
                      disabled={!customStartDate || !customEndDate}
                    >
                      Apply
                    </Button>
                  </Col>
                </>
              )}
            </Row>
          </Card.Body>
        </Card>
      </motion.div>

      {/* Main Dashboard Tabs */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
        style={{ borderBottom: 'none' }}
      >
        <Tab 
          eventKey="overview" 
          title={
            <span className={`px-3 py-2 rounded ${activeTab === 'overview' ? 'bg-primary text-white' : 'text-white-50'}`}>
              <GraphUp className="me-2" size={16} />
              Overview
            </span>
          }
        >
          {/* Summary Cards */}
          <Row className="g-4 mb-4">
            <Col md={3}>
              <motion.div variants={itemVariants}>
                <Card className="border-0 glass text-center">
                  <Card.Body className="p-4">
                    <People className="text-primary mb-3" size={32} />
                    <h3 className="text-white mb-1">{statsData?.user_stats?.length || 0}</h3>
                    <p className="text-white mb-0">Active Users</p>
                  </Card.Body>
                </Card>
              </motion.div>
            </Col>
            
            <Col md={3}>
              <motion.div variants={itemVariants}>
                <Card className="border-0 glass text-center">
                  <Card.Body className="p-4">
                    <Server className="text-success mb-3" size={32} />
                    <h3 className="text-white mb-1">{statsData?.api_stats?.length || 0}</h3>
                    <p className="text-white mb-0">Active APIs</p>
                  </Card.Body>
                </Card>
              </motion.div>
            </Col>
            
            <Col md={3}>
              <motion.div variants={itemVariants}>
                <Card className="border-0 glass text-center">
                  <Card.Body className="p-4">
                    <GraphUp className="text-warning mb-3" size={32} />
                    <h3 className="text-white mb-1">{logsStats?.general_stats?.total_requests || getTotalRequests()}</h3>
                    <p className="text-white mb-0">Total Requests</p>
                  </Card.Body>
                </Card>
              </motion.div>
            </Col>
            
            <Col md={3}>
              <motion.div variants={itemVariants}>
                <Card className="border-0 glass text-center">
                  <Card.Body className="p-4">
                    <Activity className="text-info mb-3" size={32} />
                    <h3 className="text-white mb-1">{getTotalProjects()}</h3>
                    <p className="text-white mb-0">Total Projects</p>
                  </Card.Body>
                </Card>
              </motion.div>
            </Col>
          </Row>

          {/* Charts Section */}
          {logsStats && (
            <Row className="g-4 mb-4">
              <Col lg={6}>
                <Card className="border-0 glass h-100">
                  <Card.Header className="bg-transparent border-0">
                    <h6 className="text-white mb-0">Request Methods</h6>
                  </Card.Header>
                  <Card.Body>
                    <div style={{ height: '300px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={prepareMethodData()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                          <YAxis stroke="rgba(255,255,255,0.5)" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                              borderColor: 'rgba(255,255,255,0.1)', 
                              color: 'white' 
                            }} 
                          />
                          <Bar dataKey="value" name="Requests" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col lg={6}>
                <Card className="border-0 glass h-100">
                  <Card.Header className="bg-transparent border-0">
                    <h6 className="text-white mb-0">Status Distribution</h6>
                  </Card.Header>
                  <Card.Body>
                    <div style={{ height: '300px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={prepareStatusData()}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {prepareStatusData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                              borderColor: 'rgba(255,255,255,0.1)', 
                              color: 'white' 
                            }} 
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {/* Top Users and APIs Tables */}
          <Row className="g-4">
            <Col lg={6}>
              <motion.div variants={itemVariants}>
                <Card className="border-0 glass h-100">
                  <Card.Header className="bg-transparent border-0 pb-0">
                    <h6 className="text-white mb-0">
                      <People className="me-2" />
                      Top Users by Requests
                    </h6>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <div className="table-responsive">
                      <Table hover className="mb-0">
                        <thead>
                          <tr>
                            <th className="text-white border-0">User ID</th>
                            <th className="text-white border-0">Requests</th>
                            <th className="text-white border-0">Projects</th>
                            <th className="text-white border-0">Usage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topUsers.map((user, index) => {
                            const maxRequests = Math.max(...topUsers.map(u => u.requests_count));
                            const percentage = maxRequests > 0 ? (user.requests_count / maxRequests) * 100 : 0;
                            
                            return (
                              <tr key={user.user_id}>
                                <td className="text-light">
                                  <div className="d-flex align-items-center">
                                    <Badge 
                                      bg="primary" 
                                      className="me-2"
                                      style={{ width: '20px', height: '20px', fontSize: '10px' }}
                                    >
                                      {index + 1}
                                    </Badge>
                                    {user.user_id}
                                  </div>
                                </td>
                                <td className="text-light">{user.requests_count.toLocaleString()}</td>
                                <td className="text-light">{user.projects_count}</td>
                                <td>
                                  <ProgressBar 
                                    variant="primary"
                                    now={percentage}
                                    style={{ height: '6px', width: '60px' }}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    </div>
                  </Card.Body>
                </Card>
              </motion.div>
            </Col>

            <Col lg={6}>
              <motion.div variants={itemVariants}>
                <Card className="border-0 glass h-100">
                  <Card.Header className="bg-transparent border-0 pb-0">
                    <h6 className="text-white mb-0">
                      <Server className="me-2" />
                      Top APIs by Requests
                    </h6>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <div className="table-responsive">
                      <Table hover className="mb-0">
                        <thead>
                          <tr>
                            <th className="text-white border-0">API ID</th>
                            <th className="text-white border-0">User</th>
                            <th className="text-white border-0">Requests</th>
                            <th className="text-white border-0">Usage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topApis.map((api, index) => {
                            const maxRequests = Math.max(...topApis.map(a => a.requests_count));
                            const percentage = maxRequests > 0 ? (api.requests_count / maxRequests) * 100 : 0;
                            
                            return (
                              <tr key={api.api_id}>
                                <td className="text-light">
                                  <div className="d-flex align-items-center">
                                    <Badge 
                                      bg="success" 
                                      className="me-2"
                                      style={{ width: '20px', height: '20px', fontSize: '10px' }}
                                    >
                                      {index + 1}
                                    </Badge>
                                    {api.api_id.substring(0, 8)}...
                                  </div>
                                </td>
                                <td className="text-light">{api.user_id}</td>
                                <td className="text-light">{api.requests_count.toLocaleString()}</td>
                                <td>
                                  <ProgressBar 
                                    variant="success"
                                    now={percentage}
                                    style={{ height: '6px', width: '60px' }}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    </div>
                  </Card.Body>
                </Card>
              </motion.div>
            </Col>
          </Row>
        </Tab>

        <Tab 
          eventKey="logs" 
          title={
            <span className={`px-3 py-2 rounded ${activeTab === 'logs' ? 'bg-primary text-white' : 'text-white-50'}`}>
              <FileText className="me-2" size={16} />
              System Logs
            </span>
          }
        >
          {/* Logs Analytics Charts */}
          {logsStats && (
            <Row className="g-4 mb-4">
              <Col lg={8}>
                <Card className="border-0 glass h-100">
                  <Card.Header className="bg-transparent border-0">
                    <h6 className="text-white mb-0">Top Endpoints</h6>
                  </Card.Header>
                  <Card.Body>
                    <div style={{ height: '300px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart
                          layout="vertical"
                          data={prepareEndpointData()}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis type="number" stroke="rgba(255,255,255,0.5)" />
                          <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.5)" width={100} />
                          <Tooltip 
                            formatter={(value) => [value, 'Requests']}
                            labelFormatter={(label, data) => {
                              if (data && data[0] && data[0].payload && data[0].payload.fullPath) {
                                return `Endpoint: ${data[0].payload.fullPath}`;
                              }
                              return 'Endpoint details';
                            }}
                            contentStyle={{ 
                              backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                              borderColor: 'rgba(255,255,255,0.1)', 
                              color: 'white'
                            }} 
                          />
                          <Bar dataKey="count" name="Requests" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col lg={4}>
                <Card className="border-0 glass h-100">
                  <Card.Header className="bg-transparent border-0">
                    <h6 className="text-white mb-0">System Stats</h6>
                  </Card.Header>
                  <Card.Body>
                    <div className="d-flex flex-column gap-3">
                      <div className="text-center p-3" style={{ background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>
                        <h4 className="text-primary mb-1">{logsStats.general_stats.total_requests || 0}</h4>
                        <small className="text-white-50">Total Requests</small>
                      </div>
                      <div className="text-center p-3" style={{ background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>
                        <h4 className="text-success mb-1">{logsStats.general_stats.unique_users || 0}</h4>
                        <small className="text-white-50">Unique Users</small>
                      </div>
                      <div className="text-center p-3" style={{ background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px' }}>
                        <h4 className="text-warning mb-1">{logsStats.general_stats.avg_response_time || 0} ms</h4>
                        <small className="text-white-50">Avg Response Time</small>
                      </div>
                      <div className="text-center p-3" style={{ background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
                        <h4 className="text-danger mb-1">
                          {logsStats.general_stats.total_requests ? 
                            `${Math.round((logsStats.general_stats.client_error_count + logsStats.general_stats.server_error_count) / logsStats.general_stats.total_requests * 100)}%` 
                            : '0%'}
                        </h4>
                        <small className="text-white-50">Error Rate</small>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {/* Recent Logs Table */}
          <Card className="border-0 glass">
            <Card.Header className="bg-transparent border-0">
              <h6 className="text-white mb-0">Recent System Logs</h6>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                <Table hover style={{ 
                  backgroundColor: 'transparent', 
                  color: 'white',
                  opacity: logsLoading ? 0.5 : 1,
                  transition: 'opacity 0.3s'
                }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'rgba(30, 41, 59, 0.95)', zIndex: 1 }}>
                    <tr>
                      <th className="text-white">Timestamp</th>
                      <th className="text-white">User</th>
                      <th className="text-white">Method</th>
                      <th className="text-white">Endpoint</th>
                      <th className="text-white">Status</th>
                      <th className="text-white">Response Time</th>
                      <th className="text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.length > 0 ? (
                      filteredLogs.slice(0, 50).map(log => (
                        <tr key={log.id} style={{ verticalAlign: 'middle' }}>
                          <td className="text-white-50">{formatTimestamp(log.timestamp)}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="d-flex align-items-center justify-content-center rounded-circle me-2" 
                                style={{ 
                                  width: '28px', 
                                  height: '28px', 
                                  background: 'rgba(255, 255, 255, 0.1)',
                                  flexShrink: 0
                                }}>
                                 <Person size={12} className="text-white-50" />
                              </div>
                              <span className="text-white">{log.XAuthUserId?.substring(0,20) || 'Unknown'}...</span>
                            </div>
                          </td>
                          <td>
                            <Badge bg={
                              log.method === 'GET' ? 'primary' : 
                              log.method === 'POST' ? 'success' : 
                              log.method === 'PUT' ? 'warning' : 
                              log.method === 'DELETE' ? 'danger' : 'secondary'
                            } className="text-white">
                              {log.method}
                            </Badge>
                          </td>
                          <td className="text-truncate" style={{ maxWidth: '200px' }}>
                            {log.endpoint}
                          </td>
                          <td>
                            <Badge bg={getStatusBadgeVariant(log.status_code)}>
                              {log.status_code}
                            </Badge>
                            {hasError(log) && (
                              <span className="ms-1 text-danger">
                                <ExclamationTriangle size={12} />
                              </span>
                            )}
                          </td>
                          <td>
                            <span className={log.response_time_ms > 1000 ? 'text-warning' : 'text-white-50'}>
                              {log.response_time_ms} ms
                            </span>
                          </td>
                          <td>
                            <Button 
                              variant="outline-light" 
                              size="sm"
                              onClick={() => showLogDetails(log)}
                              className="d-flex align-items-center gap-1"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            >
                              <Eye size={12} /> 
                              <span className="d-none d-md-inline">Details</span>
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-4 text-white-50">
                          {logsLoading ? "Loading logs..." : "No logs available"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Tab>

        <Tab 
          eventKey="user-journey" 
          title={
            <span className={`px-3 py-2 rounded ${activeTab === 'user-journey' ? 'bg-primary text-white' : 'text-white-50'}`}>
               <Signpost className="me-2" size={16} />
              User Journey
            </span>
          }
        >
          {/* User Journey Search */}
          <Row className="mb-4">
            <Col md={12}>
              <Card className="border-0 glass">
                <Card.Body className="p-3">
                  <Row className="g-3 align-items-center">
                    <Col md={4}>
                      <div className="position-relative" style={{ zIndex: 1060 }}>
                        <InputGroup>
                          <Form.Control
                            placeholder="Enter username..."
                            value={searchUsername}
                            onChange={(e) => {
                              setSearchUsername(e.target.value);
                              fetchUsernameSuggestions(e.target.value);
                            }}
                            autoComplete="off"
                            style={{
                              background: 'rgba(30, 41, 59, 0.9)',
                              color: 'white',
                              border: '1px solid rgba(59, 130, 246, 0.5)',
                            }}
                          />
                          <Button 
                            variant="primary"
                            onClick={searchUserLogs}
                            disabled={!searchUsername}
                          >
                            <Search size={16} />
                          </Button>
                        </InputGroup>
                        
                        {showUsernameSuggestions && usernameSuggestions.length > 0 && (
                          <div 
                            className="position-absolute w-100 mt-1"
                            style={{ 
                              zIndex: 1070,
                              maxHeight: '200px',
                              overflowY: 'auto',
                              background: 'rgba(15, 23, 42, 0.95)',
                              borderRadius: '8px',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                              backdropFilter: 'blur(8px)',
                              border: '1px solid rgba(59, 130, 246, 0.3)'
                            }}
                          >
                            {usernameSuggestions.map((username, index) => (
                              <div 
                                key={index} 
                                className="px-3 py-2 d-flex align-items-center"
                                onClick={() => {
                                  setSearchUsername(username);
                                  setShowUsernameSuggestions(false);
                                }}
                                style={{ 
                                  cursor: 'pointer',
                                  transition: 'background-color 0.2s',
                                  borderBottom: index < usernameSuggestions.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                                  color: 'white',
                                  fontSize: '0.875rem'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.4)'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                 <Person className="text-primary me-2" size={12} />
                                {username}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </Col>
                    
                    <Col md={2}>
                      <Button
                        variant={showUserJourneyDateRange ? "info" : "outline-info"}
                        onClick={() => setShowUserJourneyDateRange(!showUserJourneyDateRange)}
                        className="d-flex align-items-center gap-2"
                      >
                        <Clock size={16} /> Date Range
                      </Button>
                    </Col>
                    
                    {showUserJourneyDateRange && (
                      <>
                        <Col md={2}>
                          <Form.Control
                            type="date"
                            value={userJourneyStartDate}
                            onChange={(e) => setUserJourneyStartDate(e.target.value)}
                            style={{
                              background: 'rgba(30, 41, 59, 0.9)',
                              color: 'white',
                              border: '1px solid rgba(59, 130, 246, 0.5)',
                            }}
                          />
                        </Col>
                        <Col md={2}>
                          <Form.Control
                            type="date"
                            value={userJourneyEndDate}
                            onChange={(e) => setUserJourneyEndDate(e.target.value)}
                            style={{
                              background: 'rgba(30, 41, 59, 0.9)',
                              color: 'white',
                              border: '1px solid rgba(59, 130, 246, 0.5)',
                            }}
                          />
                        </Col>
                        <Col md={2}>
                          <Button 
                            variant="success"
                            onClick={searchUserLogs}
                            disabled={!userJourneyStartDate || !userJourneyEndDate || !searchUsername}
                            className="d-flex align-items-center gap-2"
                          >
                            <Check size={16} /> Apply
                          </Button>
                        </Col>
                      </>
                    )}
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* User Journey Timeline */}
          <Card className="border-0 glass">
            <Card.Body className="p-0">
              {renderUserJourney()}
            </Card.Body>
          </Card>
        </Tab>

        <Tab 
          eventKey="users" 
          title={
            <span className={`px-3 py-2 rounded ${activeTab === 'users' ? 'bg-primary text-white' : 'text-white-50'}`}>
              <People className="me-2" size={16} />
              Users & APIs
            </span>
          }
        >
          {/* Filters */}
          <motion.div variants={itemVariants} className="mb-4">
            <Card className="border-0 glass">
              <Card.Body className="p-3">
                <Row className="g-3">
                  <Col md={6}>
                    <InputGroup>
                      <InputGroup.Text>
                        <Search size={16} />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </InputGroup>
                  </Col>
                  <Col md={3}>
                    <Form.Select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                    >
                      <option value="all">All Users</option>
                      <option value="high-usage">High Usage</option>
                    </Form.Select>
                  </Col>
                  <Col md={3}>
                    <Button variant="outline-light" className="w-100">
                      <Download size={16} className="me-2" />
                      Export Data
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </motion.div>

          {/* All Users Table */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 glass">
              <Card.Header className="bg-transparent border-0 pb-0">
                <h6 className="text-white mb-0">
                  <People className="me-2" />
                  All Users ({filteredUsers.length})
                </h6>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead>
                      <tr>
                        <th className="text-white border-0">User ID</th>
                        <th className="text-white border-0">Requests</th>
                        <th className="text-white border-0">Projects</th>
                        <th className="text-white border-0">Status</th>
                        <th className="text-white border-0">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.user_id}>
                          <td className="text-light">{user.user_id}</td>
                          <td className="text-light">{user.requests_count.toLocaleString()}</td>
                          <td className="text-light">{user.projects_count}</td>
                          <td>
                            <Badge 
                              bg={user.requests_count > 1000 ? 'warning' : 'success'}
                              className="px-2 py-1"
                            >
                              {user.requests_count > 1000 ? 'High Usage' : 'Normal'}
                            </Badge>
                          </td>
                          <td>
                            <Button 
                              variant="outline-light" 
                              size="sm"
                              className="d-flex align-items-center gap-1"
                              onClick={() => {
                                setSearchUsername(user.user_id);
                                setActiveTab('user-journey');
                                searchUserLogs();
                              }}
                            >
                              <Eye size={14} />
                              View Journey
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </motion.div>
        </Tab>
      </Tabs>

      {/* Statistics Info */}
      <motion.div variants={itemVariants} className="mt-4">
        <Alert variant="info" className="border-0 glass">
          <div className="d-flex align-items-start gap-3">
            <Activity size={20} className="mt-1" />
            <div>
              <h6 className="mb-2">Dashboard Information</h6>
              <ul className="mb-0 small">
                <li>Data is updated every {refreshInterval / 1000} seconds</li>
                <li>Statistics are based on the selected time range</li>
                <li>Total logs processed: {statsData?.total_logs?.toLocaleString() || logsStats?.total_logs?.toLocaleString() || 'N/A'}</li>
                <li>High usage threshold: 1000+ requests per user</li>
                <li>User journey shows chronological activity timeline</li>
              </ul>
            </div>
          </div>
        </Alert>
      </motion.div>

      {/* Log Details Modal */}
      <Modal
        show={showLogModal}
        onHide={handleCloseModal}
        size="lg"
        centered
        backdrop="static"
        contentClassName="border-0"
        style={{ background: 'transparent' }}
      >
        <Modal.Header 
          closeButton 
          closeVariant="white"
          className="border-0 py-2 px-3"
          style={{ 
            background: '#1a2233',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px'
          }}
        >
          <Modal.Title className="d-flex align-items-center">
            {selectedLog ? (
              hasError(selectedLog) ? (
                <div className="d-flex align-items-center text-white">
                  <ExclamationTriangle className="text-danger me-2" />
                  <span>Request Details (ID: {selectedLog.id})</span>
                </div>
              ) : (
                <div className="d-flex align-items-center text-white">
                  <Check className="text-success me-2" />
                  <span>Request Details (ID: {selectedLog.id})</span>
                </div>
              )
            ) : (
              <span className="text-white">Request Details</span>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ 
          background: '#1a2233', 
          color: '#f8fafc',
          padding: '0',
          maxHeight: '80vh',
          overflowY: 'auto'
        }}>
          {selectedLog ? (
            <Tabs
              activeKey={logDetailTab}
              onSelect={(k) => setLogDetailTab(k)}
              className="px-3 pt-3 mb-0"
            >
              <Tab 
                eventKey="overview" 
                title={
                  <span className={`px-2 py-1 rounded ${logDetailTab === 'overview' ? 'text-dark' : 'text-white-50'}`}>
                    <Info className="me-1" size={14} /> Overview
                  </span>
                }
              >
                <div className="p-3">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div style={{ 
                        background: '#111827', 
                        borderRadius: '6px', 
                        padding: '16px',
                        height: '100%'
                      }}>
                        <h6 className="text-white-50 mb-3 pb-2 border-bottom border-secondary" style={{ fontSize: '14px' }}>Basic Information</h6>
                        <div className="mb-3">
                          <div className="text-white-50 mb-1" style={{ fontSize: '13px' }}>Timestamp:</div>
                          <div className="text-white" style={{ fontSize: '14px' }}>{formatTimestamp(selectedLog.timestamp)}</div>
                        </div>
                        <div className="mb-3">
                          <div className="text-white-50 mb-1" style={{ fontSize: '13px' }}>User:</div>
                          <div className="text-white" style={{ fontSize: '14px' }}>{selectedLog.XAuthUserId}</div>
                        </div>
                        <div className="mb-3">
                          <div className="text-white-50 mb-1" style={{ fontSize: '13px' }}>API ID:</div>
                          <div className="text-white" style={{ fontSize: '14px' }}>{selectedLog.api_id || 'N/A'}</div>
                        </div>
                        <div className="mb-0">
                          <div className="text-white-50 mb-1" style={{ fontSize: '13px' }}>Is API Request:</div>
                          <div className="text-white" style={{ fontSize: '14px' }}>{selectedLog.is_api_request ? 'Yes' : 'No'}</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div style={{ 
                        background: '#111827', 
                        borderRadius: '6px', 
                        padding: '16px',
                        height: '100%'
                      }}>
                        <h6 className="text-white-50 mb-3 pb-2 border-bottom border-secondary" style={{ fontSize: '14px' }}>Request Details</h6>
                        <div className="mb-3">
                          <div className="text-white-50 mb-1" style={{ fontSize: '13px' }}>Method:</div>
                          <Badge bg={
                            selectedLog.method === 'GET' ? 'primary' : 
                            selectedLog.method === 'POST' ? 'success' : 
                            selectedLog.method === 'PUT' ? 'warning' : 
                            selectedLog.method === 'DELETE' ? 'danger' : 'secondary'
                          } className="text-white px-2 py-1" style={{ fontSize: '12px' }}>
                            {selectedLog.method}
                          </Badge>
                        </div>
                        <div className="mb-3">
                          <div className="text-white-50 mb-1" style={{ fontSize: '13px' }}>Endpoint:</div>
                          <div className="text-white text-break" style={{ fontSize: '14px' }}>{selectedLog.endpoint}</div>
                        </div>
                        <div className="mb-3">
                          <div className="text-white-50 mb-1" style={{ fontSize: '13px' }}>Status Code:</div>
                          <Badge 
                            bg={getStatusBadgeVariant(selectedLog.status_code)}
                            className="text-white px-2 py-1" 
                            style={{ fontSize: '12px' }}
                          >
                            {selectedLog.status_code} {selectedLog.response?.statusMessage}
                          </Badge>
                        </div>
                        <div className="mb-0">
                          <div className="text-white-50 mb-1" style={{ fontSize: '13px' }}>Response Time:</div>
                          <div className={selectedLog.response_time_ms > 1000 ? 'text-warning' : 'text-white'} style={{ fontSize: '14px' }}>
                            {selectedLog.response_time_ms} ms
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {hasError(selectedLog) && (
                    <div className="mt-3" style={{ 
                      background: 'rgba(220, 38, 38, 0.1)', 
                      borderRadius: '6px',
                      borderLeft: '4px solid #ef4444',
                      padding: '16px'
                    }}>
                      <h6 className="text-danger mb-2" style={{ fontSize: '14px' }}>Error Details</h6>
                      <p className="mb-0 text-white" style={{ fontSize: '14px' }}>{getErrorDetails(selectedLog)}</p>
                    </div>
                  )}
                </div>
              </Tab>
              
              <Tab 
                eventKey="request" 
                title={
                  <span className={`px-2 py-1 rounded ${logDetailTab === 'request' ? 'text-dark' : 'text-white-50'}`}>
                    <FileText className="me-1" size={14} /> Request
                  </span>
                }
              >
                <div className="p-3">
                  <h6 className="text-white-50 mb-2" style={{ fontSize: '14px' }}>Request Headers</h6>
                  <pre style={{ 
                    background: '#111827', 
                    color: '#f8fafc', 
                    padding: '12px', 
                    borderRadius: '6px', 
                    maxHeight: '200px', 
                    overflowY: 'auto',
                    fontSize: '13px',
                    marginBottom: '24px' 
                  }}>
                    {selectedLog.request && selectedLog.request.headers ? 
                      formatJSON(selectedLog.request.headers) : 
                      'No header information available'}
                  </pre>
                  
                  {selectedLog.request && selectedLog.request.query && Object.keys(JSON.parse(selectedLog.request.query)).length > 0 && (
                    <>
                      <h6 className="text-white-50 mb-2" style={{ fontSize: '14px' }}>Query Parameters</h6>
                      <pre style={{ 
                        background: '#111827', 
                        color: '#f8fafc', 
                        padding: '12px', 
                        borderRadius: '6px', 
                        maxHeight: '200px', 
                        overflowY: 'auto',
                        fontSize: '13px',
                        marginBottom: '24px' 
                      }}>
                        {formatJSON(selectedLog.request.query)}
                      </pre>
                    </>
                  )}
                  
                  <h6 className="text-white-50 mb-2" style={{ fontSize: '14px' }}>Request Body</h6>
                  <pre style={{ 
                    background: '#111827', 
                    color: '#f8fafc', 
                    padding: '12px', 
                    borderRadius: '6px', 
                    maxHeight: '300px', 
                    overflowY: 'auto',
                    fontSize: '13px'
                  }}>
                    {selectedLog.request && selectedLog.request.body && selectedLog.request.body !== '{}' ? 
                      formatJSON(selectedLog.request.body) : 
                      'No body content'}
                  </pre>
                </div>
              </Tab>
              
              <Tab 
                eventKey="response" 
                title={
                  <span className={`px-2 py-1 rounded ${logDetailTab === 'response' ? 'text-dark' : 'text-white-50'}`}>
                    <ArrowLeftRight className="me-1" size={14} /> Response
                  </span>
                }
              >
                <div className="p-3">
                  <h6 className="text-white-50 mb-2" style={{ fontSize: '14px' }}>Response Headers</h6>
                  <pre style={{ 
                    background: '#111827', 
                    color: '#f8fafc', 
                    padding: '12px', 
                    borderRadius: '6px', 
                    maxHeight: '200px', 
                    overflowY: 'auto',
                    fontSize: '13px',
                    marginBottom: '24px' 
                  }}>
                    {selectedLog.response && selectedLog.response.headers ? 
                      formatJSON(selectedLog.response.headers) : 
                      'No header information available'}
                  </pre>
                  
                  <h6 className="text-white-50 mb-2" style={{ fontSize: '14px' }}>Response Body</h6>
                  <pre style={{ 
                    background: '#111827', 
                    color: '#f8fafc', 
                    padding: '12px', 
                    borderRadius: '6px', 
                    maxHeight: '300px', 
                    overflowY: 'auto',
                    fontSize: '13px'
                  }}>
                    {selectedLog.response && selectedLog.response.body ? 
                      formatJSON(selectedLog.response.body) : 
                      'No response body'}
                  </pre>
                </div>
              </Tab>
            </Tabs>
          ) : (
            <div className="p-4 text-center text-white-50">
              <p>No log details available</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={{ 
          background: '#1a2233', 
          borderTop: '1px solid rgba(255,255,255,0.1)',
          borderBottomLeftRadius: '8px',
          borderBottomRightRadius: '8px',
          padding: '12px 16px'
        }}>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={handleCloseModal}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '14px'
            }}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        .spinning {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .glass {
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .form-select:focus,
        .form-control:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 0.25rem rgba(59, 130, 246, 0.25);
        }
      `}</style>
    </motion.div>
  );
};

export default AdminUsagePanel;