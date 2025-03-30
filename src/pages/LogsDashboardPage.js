import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Table, Badge, Tabs, Tab, Form, Modal, InputGroup } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthContext';
import { FaServer, FaHome, FaChartLine, FaClock, FaUsers, FaUserAlt, FaExclamationTriangle, FaCheck, FaEye, FaFileCode, FaInfoCircle, FaExchangeAlt, FaSearch, FaHistory, FaRoute, FaUser } from 'react-icons/fa';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import SpinnerLoading from '../components/common/SpinnerLoading';

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } }
};

const staggerItems = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariant = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.3 } }
};

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f97316', '#f43f5e'];
const STATUS_COLORS = {
  200: '#10b981', // success - green
  201: '#10b981',
  204: '#10b981',
  304: '#f97316', // not modified - orange
  400: '#f43f5e', // client error - red
  401: '#f43f5e',
  403: '#f43f5e',
  404: '#f43f5e',
  500: '#ef4444', // server error - bright red
};

const LogsDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomDateFields, setShowCustomDateFields] = useState(false);
  
  // For detailed log view
  const [selectedLog, setSelectedLog] = useState(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // For user journey view
  const [searchUsername, setSearchUsername] = useState('');
  const [userLogs, setUserLogs] = useState([]);
  const [userJourneyLoading, setUserJourneyLoading] = useState(false);
  const [selectedUsername, setSelectedUsername] = useState('');
  const [activeDashboardTab, setActiveDashboardTab] = useState('dashboard');
  const [userJourneyStartDate, setUserJourneyStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [userJourneyEndDate, setUserJourneyEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [showUserJourneyDateRange, setShowUserJourneyDateRange] = useState(true);
  const [usernameSuggestions, setUsernameSuggestions] = useState([]);
  const [showUsernameSuggestions, setShowUsernameSuggestions] = useState(false);

  const isAdmin = user?.username == 'Admin' || user?.username == 'aa';
  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    
    console.log('Current timeRange:', timeRange);
    
    // Fetch logs and stats
    fetchLogs();
    fetchStats();
  }, [isAdmin, timeRange, customStartDate, customEndDate, navigate]);

  // Filter logs based on selected time range
  useEffect(() => {
    if (logs.length > 0) {
      filterLogsByTimeRange();
    }
  }, [logs, timeRange, customStartDate, customEndDate]);

  const filterLogsByTimeRange = () => {
    const now = new Date();
    let startDate;
    
    if (timeRange === 'custom' && customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      const endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999); // Set to end of day
      
      setFilteredLogs(logs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= startDate && logDate <= endDate;
      }));
      
      return;
    }
    
    switch (timeRange) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0); // Start of today
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
        startDate.setDate(now.getDate() - 1); // Default to 1 day
    }
    
    setFilteredLogs(logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= startDate && logDate <= now;
    }));
    
    console.log(`Filtered logs from ${startDate.toISOString()} to ${now.toISOString()}`);
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      // Create a proper query string with the correct time range parameters
      let queryParams = new URLSearchParams();
      
      if (timeRange === 'custom' && customStartDate && customEndDate) {
        queryParams.append('startDate', customStartDate);
        queryParams.append('endDate', customEndDate);
      } else {
        queryParams.append('timeRange', timeRange);
      }
      
      // Append the query string to the URL
      const response = await fetch(`http://localhost:3000/admin/logs?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched logs data with parameters:', queryParams.toString(), data);
      const logsData = data.logs || [];
      setLogs(logsData);
      // We'll set filtered logs in the useEffect
    } catch (error) {
      console.error('Error fetching logs:', error);
      setError(`Failed to load logs: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Create a proper query string with the correct time range parameters
      let queryParams = new URLSearchParams();
      
      if (timeRange === 'custom' && customStartDate && customEndDate) {
        queryParams.append('startDate', customStartDate);
        queryParams.append('endDate', customEndDate);
      } else {
        queryParams.append('timeRange', timeRange);
      }
      
      // Append the query string to the URL
      const response = await fetch(`http://localhost:3000/admin/logs/stats?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched stats data with parameters:', queryParams.toString(), data);
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleTimeRangeChange = (e) => {
    const newValue = e.target.value;
    console.log('Changing time range to:', newValue);
    setTimeRange(newValue);
    
    if (newValue === 'custom') {
      setShowCustomDateFields(true);
    } else {
      setShowCustomDateFields(false);
      // Refetch stats with the new timeRange
      fetchStats();
    }
  };

  const handleCustomStartDateChange = (e) => {
    setCustomStartDate(e.target.value);
  };

  const handleCustomEndDateChange = (e) => {
    setCustomEndDate(e.target.value);
  };

  const navigateToHome = () => {
    navigate('/dashboard');
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

  // Format data for charts
  const prepareMethodData = () => {
    if (!stats) return [];
    
    return [
      { name: 'GET', value: stats.general_stats.get_count || 0 },
      { name: 'POST', value: stats.general_stats.post_count || 0 },
      { name: 'PUT', value: stats.general_stats.put_count || 0 },
      { name: 'DELETE', value: stats.general_stats.delete_count || 0 },
    ].filter(item => item.value > 0);
  };

  const prepareStatusData = () => {
    if (!stats) return [];
    
    return [
      { name: 'Success', value: stats.general_stats.success_count || 0 },
      { name: 'Client Error', value: stats.general_stats.client_error_count || 0 },
      { name: 'Server Error', value: stats.general_stats.server_error_count || 0 },
    ].filter(item => item.value > 0);
  };

  const prepareEndpointData = () => {
    if (!stats || !stats.top_endpoints) return [];
    
    return stats.top_endpoints.slice(0, 5).map(endpoint => ({
      name: endpoint.endpoint.split('/').pop() || endpoint.endpoint,
      fullPath: endpoint.endpoint,
      count: endpoint.request_count
    }));
  };

  const prepareUserData = () => {
    if (!stats || !stats.top_users) return [];
    
    return stats.top_users.slice(0, 5).map(user => ({
      name: user.XAuthUserId,
      value: user.request_count
    }));
  };

  // JSON pretty formatter
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

  // Show the detailed log modal
  const showLogDetails = (log) => {
    setSelectedLog(log);
    setShowLogModal(true);
    setActiveTab('overview');
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowLogModal(false);
    setSelectedLog(null);
  };

  // Determine if a request contains an error
  const hasError = (log) => {
    return log.status_code >= 400;
  };

  // Extract error details from response or request
  const getErrorDetails = (log) => {
    if (!log) return "No error details available";
    
    if (log.status_code >= 400) {
      try {
        // Try to extract error message from response body if it's JSON
        if (log.response && log.response.body) {
          const responseBody = typeof log.response.body === 'string' ? 
            JSON.parse(log.response.body) : log.response.body;
            
          if (responseBody.error) return responseBody.error;
          if (responseBody.message) return responseBody.message;
          if (responseBody.errors) return JSON.stringify(responseBody.errors);
        }
        
        // If no structured error info found, return status info
        return `${log.status_code} ${log.response?.statusMessage || ''}`;
      } catch (e) {
        return `${log.status_code} ${log.response?.statusMessage || ''}`;
      }
    }
    
    return "No error detected";
  };

  // Function to handle filtering
  const applyFilters = () => {
    console.log('Applying filters with timeRange:', timeRange);
    fetchLogs();
    fetchStats();
  };

  const searchUserLogs = async () => {
    if (!searchUsername) return;
    
    try {
      setUserJourneyLoading(true);
      setSelectedUsername(searchUsername);
      
      let queryParams = new URLSearchParams();
      queryParams.append('XAuthUserId', searchUsername);
      
      // Add date range parameters if they are provided
      if (showUserJourneyDateRange && userJourneyStartDate && userJourneyEndDate) {
        // Format dates to match backend expectations - YYYY-MM-DD
        // Make sure there's no time component by using split('T')[0]
        const formattedStartDate = userJourneyStartDate.split('T')[0];
        const formattedEndDate = userJourneyEndDate.split('T')[0];
        
        queryParams.append('startDate', formattedStartDate);
        queryParams.append('endDate', formattedEndDate);
        
        console.log(`Sending date filter to backend: ${formattedStartDate} to ${formattedEndDate}`);
      }
      
      const url = `http://localhost:3000/admin/logs?${queryParams.toString()}`;
      console.log('Fetching user logs from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user logs: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched user journey logs:', data);
      
      // Server should filter by date range, but let's double-check the filtering here
      // just in case the backend doesn't support date filtering correctly
      let filteredLogs = data.logs || [];
      
      if (showUserJourneyDateRange && userJourneyStartDate && userJourneyEndDate) {
        // Create date objects with time set to beginning and end of day for proper comparison
        const startDate = new Date(userJourneyStartDate);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(userJourneyEndDate);
        endDate.setHours(23, 59, 59, 999); // Set to end of day
        
        console.log(`Client-side filtering: ${startDate.toISOString()} to ${endDate.toISOString()}`);
        
        const beforeFilter = filteredLogs.length;
        filteredLogs = filteredLogs.filter(log => {
          const logDate = new Date(log.timestamp);
          return logDate >= startDate && logDate <= endDate;
        });
        
        console.log(`Filtered ${beforeFilter} logs to ${filteredLogs.length} logs by date range`);
        
        // If we still have logs from other dates, log them for debugging
        if (filteredLogs.length > 0) {
          const dateGroups = {};
          filteredLogs.forEach(log => {
            const date = new Date(log.timestamp).toLocaleDateString();
            if (!dateGroups[date]) dateGroups[date] = 0;
            dateGroups[date]++;
          });
          console.log('Logs by date after filtering:', dateGroups);
        }
      }
      
      // Sort logs by timestamp
      const sortedLogs = filteredLogs.sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
      );
      
      setUserLogs(sortedLogs);
    } catch (error) {
      console.error('Error fetching user logs:', error);
      setError(`Failed to load user logs: ${error.message}`);
    } finally {
      setUserJourneyLoading(false);
    }
  };

  // New function to fetch username suggestions
  const fetchUsernameSuggestions = async (query) => {
    if (query.length < 3) {
      setUsernameSuggestions([]);
      setShowUsernameSuggestions(false);
      return;
    }
    
    try {
      // Try to get unique usernames from existing logs first as a more reliable approach
      const response = await fetch(`http://localhost:3000/admin/logs`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const logsData = await response.json();
        const userIds = logsData.logs
          ? [...new Set(logsData.logs.map(log => log.XAuthUserId))]
            .filter(userId => userId && userId.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 10) // Limit to 10 suggestions
          : [];
          
        console.log('Found username suggestions:', userIds);
        setUsernameSuggestions(userIds);
        setShowUsernameSuggestions(userIds.length > 0);
        return;
      }
      
      // Fallback to dedicated endpoint if first approach fails
      const userSearchResponse = await fetch(`http://localhost:3000/admin/users/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (userSearchResponse.ok) {
        const data = await userSearchResponse.json();
        if (data.users && data.users.length > 0) {
          setUsernameSuggestions(data.users);
          setShowUsernameSuggestions(data.users.length > 0);
        }
      }
    } catch (error) {
      console.error('Error fetching username suggestions:', error);
      setUsernameSuggestions([]);
      setShowUsernameSuggestions(false);
    }
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchUsername(value);
    fetchUsernameSuggestions(value);
  };

  const handleUsernameSelect = (username) => {
    setSearchUsername(username);
    setShowUsernameSuggestions(false);
  };

  const handleUserJourneyStartDateChange = (e) => {
    setUserJourneyStartDate(e.target.value);
  };

  const handleUserJourneyEndDateChange = (e) => {
    setUserJourneyEndDate(e.target.value);
  };

  const toggleUserJourneyDateRange = () => {
    setShowUserJourneyDateRange(!showUserJourneyDateRange);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    searchUserLogs();
  };

  const applyUserJourneyDateFilter = () => {
    if (searchUsername && showUserJourneyDateRange && userJourneyStartDate && userJourneyEndDate) {
      searchUserLogs();
    }
  };

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
    
    // For API calls to endpoints created by the user
    if (log.is_api_request && method === 'GET') return 'api-get';
    if (log.is_api_request && method === 'POST') return 'api-post';
    if (log.is_api_request && method === 'PUT') return 'api-put';
    if (log.is_api_request && method === 'DELETE') return 'api-delete';
    
    return 'other';
  };

  const getActionTime = (log) => {
    return new Date(log.timestamp).toLocaleString();
  };

  const getActionColor = (actionType) => {
    switch (actionType) {
      case 'register': return '#3b82f6'; // blue
      case 'login': return '#10b981'; // green
      case 'generate-schema': return '#8b5cf6'; // purple
      case 'modify-schema': return '#f97316'; // orange
      case 'create-api-from-schema': return '#ec4899'; // pink
      case 'delete': return '#ef4444'; // red
      case 'update': return '#f59e0b'; // amber
      case 'api-get': return '#06b6d4'; // cyan
      case 'api-post': return '#10b981'; // green
      case 'api-put': return '#f59e0b'; // amber
      case 'api-delete': return '#ef4444'; // red
      default: return '#6b7280'; // gray
    }
  };

  const getActionIcon = (actionType) => {
    switch (actionType) {
      case 'register': return <FaUser />;
      case 'login': return <FaUser />;
      case 'generate-schema': return <FaFileCode />;
      case 'modify-schema': return <FaFileCode />;
      case 'create-api-from-schema': return <FaServer />;
      case 'delete': return <FaExclamationTriangle />;
      case 'update': return <FaExchangeAlt />;
      case 'api-get': return <FaEye />;
      case 'api-post': return <FaFileCode />;
      case 'api-put': return <FaExchangeAlt />;
      case 'api-delete': return <FaExclamationTriangle />;
      default: return <FaHistory />;
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

  // Render the user journey timeline
  const renderUserJourney = () => {
    if (userJourneyLoading) {
      return (
        <div className="text-center my-5 py-5">
          <SpinnerLoading />
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
            <FaRoute size={32} className="text-white-50" />
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
      // Format date in a consistent way: "DD.MM.YYYY"
      const date = new Date(log.timestamp);
      const formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
      
      if (!groups[formattedDate]) {
        groups[formattedDate] = [];
      }
      groups[formattedDate].push(log);
      return groups;
    }, {});

    // Format start and end dates consistently for display
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

        {Object.entries(logsByDay).map(([date, dayLogs], dayIndex) => (
          <div key={date} className="mb-4">
            <div className="d-flex align-items-center mb-3">
              <div className="d-flex align-items-center justify-content-center rounded-circle me-2"
                style={{
                  width: '32px',
                  height: '32px',
                  background: 'rgba(255, 255, 255, 0.1)',
                }}>
                <FaClock size={14} className="text-white" />
              </div>
              <h6 className="text-white m-0">{date}</h6>
            </div>

            <div className="position-relative" style={{ 
              paddingLeft: '16px', 
              borderLeft: '2px dashed rgba(255, 255, 255, 0.2)'
            }}>
              {dayLogs.map((log, index) => {
                const actionType = getActionType(log);
                // Format time for display: "HH:MM:SS"
                const timestamp = new Date(log.timestamp);
                const formattedTime = `${timestamp.getHours().toString().padStart(2, '0')}:${timestamp.getMinutes().toString().padStart(2, '0')}:${timestamp.getSeconds().toString().padStart(2, '0')}`;
                
                const actionColor = getActionColor(actionType);
                const actionIcon = getActionIcon(actionType);
                const actionLabel = getActionLabel(actionType);
                
                return (
                  <div key={log.id} className="mb-4 position-relative" style={{ paddingLeft: '32px' }}>
                    {/* Timeline dot */}
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
                    
                    {/* Action card */}
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

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="min-vh-100 d-flex flex-column"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: 'white',
        paddingTop: '1rem',
        paddingBottom: '3rem',
        overflowY: 'auto',
        height: '100vh'
      }}
    >
      {/* Navigation Bar */}
      <div className="position-fixed top-0 start-0 w-100 py-2 px-4" style={{ 
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        zIndex: 1000
      }}>
        <Container fluid>
          <div className="d-flex align-items-center justify-content-between flex-wrap">
            <div className="d-flex align-items-center mb-2 mb-md-0">
              <div className="d-flex align-items-center justify-content-center rounded-circle me-2" 
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  background: 'rgba(16, 185, 129, 0.2)',
                }}>
                <FaChartLine className="text-success" size={20} />
              </div>
              <h5 className="m-0 text-white d-none d-md-block">Admin Logs Dashboard</h5>
            </div>
            
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <div className="d-flex gap-2 me-2">
                <Button
                  variant={activeDashboardTab === 'dashboard' ? 'primary' : 'outline-primary'}
                  size="sm"
                  className="d-flex align-items-center gap-1"
                  onClick={() => setActiveDashboardTab('dashboard')}
                  style={{
                    borderRadius: '8px',
                    fontSize: '0.8rem'
                  }}
                >
                  <FaChartLine size={12} /> <span>Dashboard</span>
                </Button>
                
                <Button
                  variant={activeDashboardTab === 'user-journey' ? 'primary' : 'outline-primary'}
                  size="sm"
                  className="d-flex align-items-center gap-1"
                  onClick={() => setActiveDashboardTab('user-journey')}
                  style={{
                    borderRadius: '8px',
                    fontSize: '0.8rem'
                  }}
                >
                  <FaRoute size={12} /> <span>User Journey</span>
                </Button>
              </div>
              
              {activeDashboardTab === 'dashboard' && (
                <div className="d-flex flex-wrap gap-2">
                  <Form.Select 
                    size="sm" 
                    onChange={handleTimeRangeChange}
                    value={timeRange}
                    style={{
                      background: 'rgba(30, 41, 59, 0.9)',
                      color: 'white',
                      border: '1px solid rgba(59, 130, 246, 0.5)',
                      borderRadius: '8px',
                      width: 'auto',
                      paddingRight: '2rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                    }}
                    className="form-select-sm"
                  >
                    <option value="today">Today</option>
                    <option value="last7days">Last 7 Days</option>
                    <option value="last30days">Last 30 Days</option>
                    <option value="custom">Custom Range</option>
                  </Form.Select>
                  
                  {showCustomDateFields && (
                    <>
                      <Form.Control
                        type="date"
                        size="sm"
                        value={customStartDate}
                        onChange={handleCustomStartDateChange}
                        style={{
                          background: 'rgba(30, 41, 59, 0.9)',
                          color: 'white',
                          border: '1px solid rgba(59, 130, 246, 0.5)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          width: 'auto',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                        }}
                      />
                      <Form.Control
                        type="date"
                        size="sm"
                        value={customEndDate}
                        onChange={handleCustomEndDateChange}
                        style={{
                          background: 'rgba(30, 41, 59, 0.9)',
                          color: 'white',
                          border: '1px solid rgba(59, 130, 246, 0.5)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          width: 'auto',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                        }}
                      />
                      <Button 
                        variant="primary"
                        size="sm"
                        onClick={applyFilters}
                        disabled={!customStartDate || !customEndDate}
                        style={{
                          borderRadius: '8px',
                          background: 'rgba(59, 130, 246, 0.8)',
                          border: 'none',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                        }}
                      >
                        Apply Filters
                      </Button>
                    </>
                  )}
                </div>
              )}
              
              {activeDashboardTab === 'user-journey' && (
                <div className="d-flex flex-wrap gap-2 align-items-center">
                  <div className="position-relative" style={{ minWidth: '220px', zIndex: 1060 }}>
                    <InputGroup size="sm">
                      <Form.Control
                        placeholder="Enter username..."
                        aria-label="Search username"
                        value={searchUsername}
                        onChange={handleSearchInputChange}
                        autoComplete="off"
                        style={{
                          background: 'rgba(30, 41, 59, 0.9)',
                          color: 'white',
                          border: '1px solid rgba(59, 130, 246, 0.5)',
                          borderRadius: '8px 0 0 8px',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                        }}
                      />
                      <Button 
                        variant="primary"
                        type="submit"
                        onClick={handleSearchSubmit}
                        disabled={!searchUsername}
                        style={{
                          borderRadius: '0 8px 8px 0',
                          background: 'rgba(59, 130, 246, 0.8)',
                          border: 'none',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                        }}
                      >
                        <FaSearch size={12} />
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
                            onClick={() => handleUsernameSelect(username)}
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
                            <FaUserAlt className="text-primary me-2" size={12} />
                            {username}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant={showUserJourneyDateRange ? "info" : "outline-info"}
                    size="sm"
                    onClick={toggleUserJourneyDateRange}
                    style={{
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <FaClock size={12} /> <span>Date Range</span>
                  </Button>
                  
                  {showUserJourneyDateRange && (
                    <>
                      <Form.Control
                        type="date"
                        size="sm"
                        value={userJourneyStartDate}
                        onChange={handleUserJourneyStartDateChange}
                        style={{
                          background: 'rgba(30, 41, 59, 0.9)',
                          color: 'white',
                          border: '1px solid rgba(59, 130, 246, 0.5)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          width: 'auto',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                        }}
                      />
                      <Form.Control
                        type="date"
                        size="sm"
                        value={userJourneyEndDate}
                        onChange={handleUserJourneyEndDateChange}
                        style={{
                          background: 'rgba(30, 41, 59, 0.9)',
                          color: 'white',
                          border: '1px solid rgba(59, 130, 246, 0.5)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          width: 'auto',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                        }}
                      />
                      <Button 
                        variant="success"
                        size="sm"
                        onClick={applyUserJourneyDateFilter}
                        disabled={!userJourneyStartDate || !userJourneyEndDate || !searchUsername}
                        style={{
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <FaCheck size={12} /> Apply Date Filter
                      </Button>
                    </>
                  )}
                </div>
              )}
              
              <Button
                variant="outline-light"
                className="d-flex align-items-center gap-2"
                onClick={navigateToHome}
                style={{
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem'
                }}
              >
                <FaHome size={14} /> <span className="d-none d-md-inline">Back to Dashboard</span>
              </Button>
            </div>
          </div>
        </Container>
      </div>

      <Container className="pb-5 mt-5 pt-5">
        {activeDashboardTab === 'dashboard' && (
          <>
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-4"
            >
              <h1 className="display-5 fw-bold mb-2" style={{ 
                background: 'linear-gradient(90deg, #10b981, #059669)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-1px'
              }}>
                System Logs &amp; Analytics
              </h1>
              <p className="lead text-light opacity-75 mx-auto" style={{ maxWidth: '700px' }}>
                Monitor API usage, track performance metrics, and analyze system behavior
              </p>
            </motion.div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="alert alert-danger mb-4 shadow-sm" style={{ borderRadius: '10px', border: 'none' }}>
                  {error}
                </div>
              </motion.div>
            )}

            {loading && !stats ? (
              <div className="text-center my-5 py-5">
                <motion.div
                  className="mb-4"
                  style={{ display: 'inline-block' }}
                >
                  <SpinnerLoading />
                </motion.div>
                <p className="mt-3 text-light">Loading system analytics...</p>
              </div>
            ) : (
              <>
                {/* Stats Overview Cards */}
                {stats && (
                  <motion.div
                    variants={staggerItems}
                    className="mb-5"
                  >
                    <Row className="g-4">
                      <Col lg={3} md={6}>
                        <motion.div variants={itemVariant}>
                          <Card className="border-0 h-100 shadow-lg" style={{ 
                            background: 'rgba(30, 41, 59, 0.7)', 
                            borderRadius: '16px',
                            backdropFilter: 'blur(10px)'
                          }}>
                            <Card.Body className="d-flex flex-column">
                              <div className="d-flex align-items-center mb-3">
                                <div className="d-flex align-items-center justify-content-center rounded-circle me-3" 
                                  style={{ 
                                    width: '48px', 
                                    height: '48px', 
                                    background: 'rgba(59, 130, 246, 0.15)'
                                  }}>
                                  <FaServer className="text-primary" size={20} />
                                </div>
                                <div>
                                  <h6 className="text-white-50 mb-0">Total Requests</h6>
                                  <h2 className="text-white mb-0">{stats.general_stats.total_requests || 0}</h2>
                                </div>
                              </div>
                              <div className="mt-auto pt-2 border-top border-dark">
                                <small className="text-white-50">
                                  From {new Date(stats.start_date).toLocaleDateString()} to {new Date(stats.end_date).toLocaleDateString()}
                                </small>
                              </div>
                            </Card.Body>
                          </Card>
                        </motion.div>
                      </Col>
                      <Col lg={3} md={6}>
                        <motion.div variants={itemVariant}>
                          <Card className="border-0 h-100 shadow-lg" style={{ 
                            background: 'rgba(30, 41, 59, 0.7)', 
                            borderRadius: '16px',
                            backdropFilter: 'blur(10px)'
                          }}>
                            <Card.Body className="d-flex flex-column">
                              <div className="d-flex align-items-center mb-3">
                                <div className="d-flex align-items-center justify-content-center rounded-circle me-3" 
                                  style={{ 
                                    width: '48px', 
                                    height: '48px', 
                                    background: 'rgba(16, 185, 129, 0.15)'
                                  }}>
                                  <FaUsers className="text-success" size={20} />
                                </div>
                                <div>
                                  <h6 className="text-white-50 mb-0">Unique Users</h6>
                                  <h2 className="text-white mb-0">{stats.general_stats.unique_users || 0}</h2>
                                </div>
                              </div>
                              <div className="mt-auto pt-2 border-top border-dark">
                                <small className="text-white-50">
                                  Active users in selected time period
                                </small>
                              </div>
                            </Card.Body>
                          </Card>
                        </motion.div>
                      </Col>
                      <Col lg={3} md={6}>
                        <motion.div variants={itemVariant}>
                          <Card className="border-0 h-100 shadow-lg" style={{ 
                            background: 'rgba(30, 41, 59, 0.7)', 
                            borderRadius: '16px',
                            backdropFilter: 'blur(10px)'
                          }}>
                            <Card.Body className="d-flex flex-column">
                              <div className="d-flex align-items-center mb-3">
                                <div className="d-flex align-items-center justify-content-center rounded-circle me-3" 
                                  style={{ 
                                    width: '48px', 
                                    height: '48px', 
                                    background: 'rgba(245, 158, 11, 0.15)'
                                  }}>
                                  <FaClock className="text-warning" size={20} />
                                </div>
                                <div>
                                  <h6 className="text-white-50 mb-0">Avg Response Time</h6>
                                  <h2 className="text-white mb-0">{stats.general_stats.avg_response_time || 0} ms</h2>
                                </div>
                              </div>
                              <div className="mt-auto pt-2 border-top border-dark">
                                <small className="text-white-50">
                                  Max: {stats.general_stats.max_response_time || 0} ms
                                </small>
                              </div>
                            </Card.Body>
                          </Card>
                        </motion.div>
                      </Col>
                      <Col lg={3} md={6}>
                        <motion.div variants={itemVariant}>
                          <Card className="border-0 h-100 shadow-lg" style={{ 
                            background: 'rgba(30, 41, 59, 0.7)', 
                            borderRadius: '16px',
                            backdropFilter: 'blur(10px)'
                          }}>
                            <Card.Body className="d-flex flex-column">
                              <div className="d-flex align-items-center mb-3">
                                <div className="d-flex align-items-center justify-content-center rounded-circle me-3" 
                                  style={{ 
                                    width: '48px', 
                                    height: '48px', 
                                    background: 'rgba(239, 68, 68, 0.15)'
                                  }}>
                                  <FaExclamationTriangle className="text-danger" size={20} />
                                </div>
                                <div>
                                  <h6 className="text-white-50 mb-0">Error Rate</h6>
                                  <h2 className="text-white mb-0">
                                    {stats.general_stats.total_requests ? 
                                      `${Math.round((stats.general_stats.client_error_count + stats.general_stats.server_error_count) / stats.general_stats.total_requests * 100)}%` 
                                      : '0%'}
                                  </h2>
                                </div>
                              </div>
                              <div className="mt-auto pt-2 border-top border-dark">
                                <small className="text-white-50">
                                  {stats.general_stats.client_error_count || 0} client / {stats.general_stats.server_error_count || 0} server errors
                                </small>
                              </div>
                            </Card.Body>
                          </Card>
                        </motion.div>
                      </Col>
                    </Row>
                  </motion.div>
                )}

                {/* Charts Section */}
                {stats && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <Row className="g-4 mb-5">
                      <Col lg={6}>
                        <Card className="border-0 shadow-lg h-100" style={{ 
                          background: 'rgba(30, 41, 59, 0.7)', 
                          borderRadius: '16px',
                          backdropFilter: 'blur(10px)'
                        }}>
                          <Card.Body>
                            <h5 className="text-white mb-4">Request Methods</h5>
                            <div style={{ height: '300px' }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={prepareMethodData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                                  <Legend />
                                  <Bar dataKey="value" name="Requests" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                      
                      <Col lg={6}>
                        <Card className="border-0 shadow-lg h-100" style={{ 
                          background: 'rgba(30, 41, 59, 0.7)', 
                          borderRadius: '16px',
                          backdropFilter: 'blur(10px)'
                        }}>
                          <Card.Body>
                            <h5 className="text-white mb-4">Status Code Distribution</h5>
                            <div style={{ height: '300px' }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={prepareStatusData()}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
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
                                  <Legend />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>

                    <Row className="g-4 mb-5">
                      <Col lg={7}>
                        <Card className="border-0 shadow-lg h-100" style={{ 
                          background: 'rgba(30, 41, 59, 0.7)', 
                          borderRadius: '16px',
                          backdropFilter: 'blur(10px)'
                        }}>
                          <Card.Body>
                            <h5 className="text-white mb-4">Top Endpoints</h5>
                            <div style={{ height: '300px' }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  layout="vertical"
                                  data={prepareEndpointData()}
                                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                  <XAxis type="number" stroke="rgba(255,255,255,0.5)" />
                                  <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.5)" width={100} />
                                  <Tooltip 
                                    formatter={(value, name) => [value, 'Requests']}
                                    labelFormatter={(label, data) => {
                                      if (data && data[0] && data[0].payload && data[0].payload.fullPath) {
                                        return `Endpoint: ${data[0].payload.fullPath}`;
                                      }
                                      return 'Endpoint details unavailable';
                                    }}
                                    contentStyle={{ 
                                      backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                                      borderColor: 'rgba(255,255,255,0.1)', 
                                      color: 'white'
                                    }} 
                                  />
                                  <Bar dataKey="count" name="Requests" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                      
                      <Col lg={5}>
                        <Card className="border-0 shadow-lg h-100" style={{ 
                          background: 'rgba(30, 41, 59, 0.7)', 
                          borderRadius: '16px',
                          backdropFilter: 'blur(10px)'
                        }}>
                          <Card.Body>
                            <h5 className="text-white mb-4">Top Users</h5>
                            <div style={{ height: '300px' }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={prepareUserData()}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={true}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                    nameKey="name"
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                  >
                                    {prepareUserData().map((entry, index) => (
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
                  </motion.div>
                )}

                {/* Logs Table - modified to include action buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Card className="border-0 shadow-lg" style={{ 
                    background: 'rgba(30, 41, 59, 0.7)', 
                    borderRadius: '16px',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <Card.Body>
                      <h5 className="text-white mb-4">Recent System Logs</h5>
                      <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                        <Table variant="dark" hover style={{ 
                          backgroundColor: 'transparent', 
                          color: 'white',
                          opacity: loading ? 0.5 : 1,
                          transition: 'opacity 0.3s'
                        }}>
                          <thead style={{ position: 'sticky', top: 0, background: 'rgba(30, 41, 59, 0.95)', zIndex: 1 }}>
                            <tr>
                              <th>Timestamp</th>
                              <th>User</th>
                              <th>Method</th>
                              <th>Endpoint</th>
                              <th>Status</th>
                              <th>Response Time</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredLogs.length > 0 ? (
                              filteredLogs.map(log => (
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
                                        <FaUserAlt size={12} className="text-white-50" />
                                      </div>
                                      <span className="text-white">{log.XAuthUserId.substring(0,30)}</span>
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
                                        <FaExclamationTriangle size={12} />
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
                                      <FaEye size={12} /> 
                                      <span className="d-none d-md-inline">Details</span>
                                    </Button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="7" className="text-center py-4 text-white-50">
                                  {loading ? "Loading logs..." : "No logs available"}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </Table>
                      </div>
                    </Card.Body>
                  </Card>
                </motion.div>
              </>
            )}
          </>
        )}
        
        {activeDashboardTab === 'user-journey' && (
          <>
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-4"
            >
              <h1 className="display-5 fw-bold mb-2" style={{ 
                background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-1px'
              }}>
                User Journey Timeline
              </h1>
              <p className="lead text-light opacity-75 mx-auto" style={{ maxWidth: '700px' }}>
                Visualize user activity flow and track actions across the system
              </p>
            </motion.div>
            
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="alert alert-danger mb-4 shadow-sm" style={{ borderRadius: '10px', border: 'none' }}>
                  {error}
                </div>
              </motion.div>
            )}
            
            <Card className="border-0 shadow-lg" style={{ 
              background: 'rgba(30, 41, 59, 0.7)', 
              borderRadius: '16px',
              backdropFilter: 'blur(10px)'
            }}>
              <Card.Body className="p-0">
                {renderUserJourney()}
              </Card.Body>
            </Card>
          </>
        )}
      </Container>

      {/* Detailed Log Modal */}
      <Modal
        show={showLogModal}
        onHide={handleCloseModal}
        size="lg"
        aria-labelledby="log-details-modal"
        centered
        backdrop="static"
        contentClassName="border-0"
        style={{ 
          background: 'transparent'
        }}
      >
        <Modal.Header 
          closeButton 
          closeVariant="white"
          className="border-0 py-2 px-3"
          style={{ 
            background: '#1a2233',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Modal.Title id="log-details-modal" className="d-flex align-items-center">
            {selectedLog ? (
              hasError(selectedLog) ? (
                <div className="d-flex align-items-center text-white">
                  <FaExclamationTriangle className="text-danger me-2" />
                  <span style={{ fontWeight: 500 }}>Request Details (ID: {selectedLog.id})</span>
                </div>
              ) : (
                <div className="d-flex align-items-center text-white">
                  <FaCheck className="text-success me-2" />
                  <span style={{ fontWeight: 500 }}>Request Details (ID: {selectedLog.id})</span>
                </div>
              )
            ) : (
              <div className="d-flex align-items-center text-white">
                <span style={{ fontWeight: 500 }}>Request Details</span>
              </div>
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
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="px-3 pt-3 mb-0"
              style={{ borderBottom: 'none' }}
            >
              <Tab 
                eventKey="overview" 
                title={
                  <span className={`px-2 py-1 rounded ${activeTab === 'overview' ? 'text-dark' : 'text-white-50'}`}>
                    <FaInfoCircle className="me-1" size={14} /> Overview
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
                  <span className={`px-2 py-1 rounded ${activeTab === 'request' ? 'text-dark' : 'text-white-50'}`}>
                    <FaFileCode className="me-1" size={14} /> Request
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
                  <span className={`px-2 py-1 rounded ${activeTab === 'response' ? 'text-dark' : 'text-white-50'}`}>
                    <FaExchangeAlt className="me-1" size={14} /> Response
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

      {/* Add this CSS to the bottom of the component to style the dropdown options */}
      <style jsx="true">{`
        .form-select-sm option {
          background-color: #1a2233;
          color: white;
          padding: 10px;
        }
        
        .form-select-sm:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 0.25rem rgba(59, 130, 246, 0.25);
        }
      `}</style>

    </motion.div>
  );
};

export default LogsDashboardPage; 