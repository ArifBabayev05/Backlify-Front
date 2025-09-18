import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, Pagination, Badge, Modal } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthContext';
import { FaPlus, FaServer, FaCalendarAlt, FaTable, FaChevronLeft, FaChevronRight, FaHome, FaFilter, FaSearch, FaChartLine, FaSyncAlt, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import { apiRequest } from '../utils/apiService';
import GlobalSpinner from '../components/common/GlobalSpinner';
import SpinnerLoading from '../components/common/SpinnerLoading';
import useCacheControl from '../utils/useCacheControl';
import { toast } from 'react-hot-toast';
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

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [apis, setApis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCached, setIsCached] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  
  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [apiToDelete, setApiToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  
  // Get cache control functions from our custom hook
  const { invalidateCache, forceRefresh } = useCacheControl();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [apisPerPage] = useState(6); // Show 6 APIs per page
  const [totalPages, setTotalPages] = useState(1);

  // Check if user is admin
  const isAdmin = user?.username == 'Admin' ;

  useEffect(() => {
    // When component mounts, check if we need a fresh reload
    const shouldRefresh = localStorage.getItem('refresh_dashboard') === 'true';
    
    // Always fetch APIs when the component mounts
    fetchUserApis(shouldRefresh);
    
    // Clear the refresh flag if it exists
    if (shouldRefresh) {
      localStorage.removeItem('refresh_dashboard');
    }
    
    // Set up background refresh (every 30 seconds)
    const refreshInterval = setInterval(() => {
      // Perform a background refresh without showing loading state
      backgroundRefresh();
    }, 30000); // 30 seconds
    
    // Cleanup the interval on component unmount
    return () => clearInterval(refreshInterval);
  }, []);
  
  // Function for doing a silent background refresh
  const backgroundRefresh = async () => {
    try {
      console.log('[Background] Checking for new APIs...');
      // Use the apiRequest utility with skipCache to get fresh data
      const data = await apiRequest('/my-apis', {
        method: 'GET',
        skipCache: true
      });
      
      // Sort APIs by creation date (newest first)
      const sortedApis = (data.apis || []).sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      // Compare with current data to see if there are any changes
      const currentApisJson = JSON.stringify(apis.map(api => api.apiId).sort());
      const newApisJson = JSON.stringify(sortedApis.map(api => api.apiId).sort());
      
      if (currentApisJson !== newApisJson) {
        console.log('[Background] New API data detected, updating...');
        // Update the state with new data
        setApis(sortedApis);
        setTotalPages(Math.ceil(sortedApis.length / apisPerPage));
        // Reset to first page if we have new data and clear any cached data
        setCurrentPage(1);
        invalidateCache('/my-apis');
      } else {
        console.log('[Background] No new API data');
      }
      
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error('[Background] Error checking for new APIs:', error);
      // Don't show errors for background refreshes
    }
  };

  const fetchUserApis = async (skipCache = false) => {
    try {
      setLoading(true);
      setError(null);
      setIsCached(false);
      
      // Use the apiRequest utility with caching
      const options = {
        method: 'GET',
        // Skip cache if requested
        ...(skipCache ? { skipCache: true } : {})
      };
      
      // Track if we're using cached data
      const startTime = performance.now();
      
      const data = await apiRequest('/my-apis', options);
      
      // If the request was very fast (<50ms), it likely came from cache
      const endTime = performance.now();
      setIsCached(endTime - startTime < 50);
      
      // Sort APIs by creation date (newest first)
      const sortedApis = (data.apis || []).sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      setApis(sortedApis);
      setTotalPages(Math.ceil(sortedApis.length / apisPerPage));
      setLastRefreshTime(new Date());
      console.log('APIs loaded:', sortedApis.length || 0);
    } catch (error) {
      console.error('Error fetching user APIs:', error);
      setError(`Failed to load your APIs: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    // Force refresh by skipping cache
    fetchUserApis(true);
  };

  const handleDeleteClick = (api, event) => {
    event.stopPropagation(); // Prevent card click
    setApiToDelete(api);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!apiToDelete) return;
    
    setDeleting(true);
    try {
      const response = await apiRequest(`/api/${apiToDelete.apiId}`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        toast.success('API deleted successfully');
        // Remove the API from the local state
        setApis(prevApis => prevApis.filter(api => api.apiId !== apiToDelete.apiId));
        // Update total pages
        setTotalPages(Math.ceil((apis.length - 1) / apisPerPage));
        // Reset to first page if current page is empty
        if (currentPage > Math.ceil((apis.length - 1) / apisPerPage)) {
          setCurrentPage(1);
        }
        // Invalidate cache
        invalidateCache('/my-apis');
      } else {
        throw new Error(response.message || 'Failed to delete API');
      }
    } catch (error) {
      console.error('Error deleting API:', error);
      toast.error(`Failed to delete API: ${error.message}`);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setApiToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setApiToDelete(null);
  };

  const handleApiSelect = (apiId) => {
    // Store the selected API ID in localStorage for use on the endpoints page
    localStorage.setItem('selectedApiId', apiId);
    localStorage.setItem('endpoint_origin', 'dashboard');
    navigate('/endpoints');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Get current apis for pagination
  const indexOfLastApi = currentPage * apisPerPage;
  const indexOfFirstApi = indexOfLastApi - apisPerPage;
  const currentApis = apis.slice(indexOfFirstApi, indexOfLastApi);
  
  // Change page
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Scroll to top of container when page changes
    window.scrollTo(0, 0);
  };

  // Generate pagination items
  const renderPaginationItems = () => {
    let items = [];
    
    // Add Previous button
    items.push(
      <Pagination.Prev 
        key="prev" 
        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        <FaChevronLeft />
      </Pagination.Prev>
    );
    
    // Show first page if not visible in current range
    if (currentPage > 3) {
      items.push(
        <Pagination.Item key={1} onClick={() => handlePageChange(1)}>
          1
        </Pagination.Item>
      );
      
      if (currentPage > 4) {
        items.push(<Pagination.Ellipsis key="ellipsis1" />);
      }
    }
    
    // Calculate range of pages to show
    const startPage = Math.max(1, currentPage - 1);
    const endPage = Math.min(totalPages, currentPage + 1);
    
    // Add numbered page buttons
    for (let number = startPage; number <= endPage; number++) {
      items.push(
        <Pagination.Item 
          key={number} 
          active={number === currentPage}
          onClick={() => handlePageChange(number)}
        >
          {number}
        </Pagination.Item>
      );
    }
    
    // Show last page if not visible in current range
    if (currentPage < totalPages - 2) {
      if (currentPage < totalPages - 3) {
        items.push(<Pagination.Ellipsis key="ellipsis2" />);
      }
      
      items.push(
        <Pagination.Item 
          key={totalPages} 
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </Pagination.Item>
      );
    }
    
    // Add Next button
    items.push(
      <Pagination.Next 
        key="next" 
        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        <FaChevronRight />
      </Pagination.Next>
    );
    
    return items;
  };

  // Generate random gradient for cards to provide visual interest
  const getRandomGradient = (index) => {
    const gradients = [
      'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
      'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
      'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
      'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    ];
    
    return gradients[index % gradients.length];
  };

  // Navigate to home/landing page
  const navigateToHome = () => {
    navigate('/');
  };

  // Navigate to logs dashboard
  const navigateToLogs = () => {
    navigate('/logs');
  };

  return (
    <>
      {/* Professional Navigation Bar */}
      <div className="navbar">
        <Container>
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center justify-content-center rounded-2 p-2" 
              style={{ 
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}>
              <FaServer className="text-primary" size={20} />
            </div>
            <h5 className="heading-5 text-white mb-0 d-none d-md-block">Backlify Dashboard</h5>
          </div>
          
          <div className="d-flex gap-3 align-items-center">
            {isAdmin && (
              <Button
                variant="secondary"
                size="sm"
                className="btn btn-secondary btn-sm d-flex align-items-center gap-2"
                onClick={navigateToLogs}
              >
                <FaChartLine size={14} /> 
                <span className="d-none d-md-inline">Logs Dashboard</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="btn btn-outline btn-sm d-flex align-items-center gap-2"
              onClick={() => navigate('/usage')}
            >
              <FaChartLine size={14} /> 
              <span className="d-none d-md-inline">Usage & Plans</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="btn btn-ghost btn-sm d-flex align-items-center gap-2"
              onClick={navigateToHome}
            >
              <FaHome size={14} /> 
              <span className="d-none d-md-inline">Home</span>
            </Button>
          </div>
        </Container>
      </div>

      <div className="page-wrapper" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: 'white',
        minHeight: '100vh'
      }}>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="min-vh-100 d-flex flex-column"
        >
        <Container className="pb-5">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="d-flex align-items-center justify-content-center mb-6">
            <div className="me-4 p-4 rounded-3" style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              boxShadow: '0 8px 32px rgba(59, 130, 246, 0.1)'
            }}>
              <FaServer size={32} className="text-primary" />
            </div>
            <div className="text-start">
              <h1 className="heading-2 text-gradient mb-3">
                My API Dashboard
              </h1>
              <p className="body-large text-light mb-0" style={{ maxWidth: '500px' }}>
                Manage and access your API endpoints with ease
              </p>
            </div>
          </div>
        </motion.div>

        {error && (
          <Alert 
            variant="danger" 
            className="mb-4 shadow-sm" 
            style={{ borderRadius: '10px', border: 'none' }}
          >
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="text-center my-5 py-5">
            <motion.div
              animate={{ 
                // rotate: 360,
                // transition: { duration: 1.5, repeat: Infinity, ease: "linear" } 
              }}
              className="mb-4"
              style={{ display: 'inline-block' }}
            >
              {/* <FaServer size={40} className="text-primary" /> */}
              {/* <Spinner animation="border" variant="primary" /> */}
              <SpinnerLoading />
            </motion.div>
            <p className="mt-3 text-light">Loading your APIs...</p>
          </div>
        ) : apis.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Card 
              className="border-0 shadow-lg mb-4 mx-auto"
              style={{ 
                background: 'rgba(30, 41, 59, 0.7)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                maxWidth: '600px'
              }}
            >
              <Card.Body className="text-center py-5">
                <div className="bg-primary bg-opacity-10 rounded-circle p-3 d-inline-flex mb-4">
                  <FaServer size={36} className="text-primary" />
                </div>
                <h3 className="text-light mb-3">No APIs Found</h3>
                <p className="text-light opacity-75 mb-4">
                  You don't have any APIs created yet. Start by creating your first API.
                </p>
                <Button 
                  variant="primary"
                  className="d-inline-flex align-items-center gap-2"
                  style={{
                    background: 'linear-gradient(145deg, #3b82f6, #2563eb)',
                    border: 'none',
                    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
                    borderRadius: '10px',
                    padding: '0.625rem 1.75rem',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.5)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.4)';
                  }}
                  onClick={navigateToHome}
                >
                  <FaPlus size={14} /> Create New API
                </Button>
              </Card.Body>
            </Card>
          </motion.div>
        ) : (
          <>
            {/* Professional Status Bar */}
            <div className="d-flex justify-content-between align-items-center mb-6">
              <div className="d-flex align-items-center gap-4">
                {isCached && (
                  <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-2" style={{ 
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    color: '#60a5fa'
                  }}>
                    <div className="p-1 rounded-1" style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
                      <FaSyncAlt size={12} />
                    </div>
                    <span className="caption text-primary">Using cached data</span>
                  </div>
                )}
                {lastRefreshTime && (
                  <div className="text-light">
                    <span className="caption text-white d-block">Last updated</span>
                    <span className="body-small text-white fw-medium">{lastRefreshTime.toLocaleTimeString()}</span>
                  </div>
                )}
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                className="btn btn-outline btn-sm d-flex align-items-center gap-2"
                disabled={loading}
              >
                <FaSyncAlt size={14} className={loading ? 'spinning' : ''} />
                <span>Refresh</span>
              </Button>
            </div>

            {/* Search Bar */}
            

            <motion.div variants={staggerItems}>
              <Row className="g-4">
                {currentApis.map((api, index) => (
                  <Col key={api.apiId} lg={4} md={6} className="mb-4">
                    <motion.div variants={itemVariant}>
                      <Card 
                        className="card h-100"
                        onClick={() => handleApiSelect(api.apiId)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div 
                          className="position-absolute top-0 start-0 w-100" 
                          style={{ 
                            height: '4px', 
                            background: getRandomGradient(index),
                            zIndex: 1
                          }}
                        />
                        <Card.Body className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-4">
                            <div className="d-flex align-items-center gap-3">
                              <div 
                                className="d-flex align-items-center justify-content-center rounded-2 p-2" 
                                style={{ 
                                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                                  border: '1px solid rgba(59, 130, 246, 0.2)'
                                }}
                              >
                                <FaServer className="text-primary" size={20} />
                              </div>
                              <div>
                                <h6 className="heading-6 text-white mb-1">
                                  {api.apiId.substring(0, 8)}
                                </h6>
                                <span className="caption text-white">API Endpoint</span>
                              </div>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                              {isRecent(api.createdAt) && (
                                <span 
                                  className="px-2 py-1 rounded-1 text-white caption" 
                                  style={{ 
                                    background: 'linear-gradient(90deg, #10b981, #059669)',
                                  }}
                                >
                                  New
                                </span>
                              )}
                              <Button
                                variant="outline-danger"
                                size="sm"
                                className="btn btn-outline-danger btn-sm d-flex align-items-center justify-content-center"
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  padding: '0',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  transition: 'all 0.2s ease'
                                }}
                                onClick={(e) => handleDeleteClick(api, e)}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                                }}
                              >
                                <FaTrash size={12} className="text-danger" />
                              </Button>
                            </div>
                          </div>

                          <div className="mb-4">
                            <div className="d-flex align-items-start gap-3">
                              <div className="p-1 rounded-1" style={{ background: 'rgba(139, 92, 246, 0.2)' }}>
                                <FaTable className="text-primary" size={14} />
                              </div>
                              <div>
                                <span className="caption text-white d-block mb-1">Tables</span>
                                <span className="body-small text-white">
                                  {api.tables.join(', ')}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="d-flex align-items-center justify-content-between pt-3" style={{ 
                            borderTop: '1px solid rgba(255, 255, 255, 0.1)' 
                          }}>
                            <div className="d-flex align-items-center gap-2">
                              <FaCalendarAlt className="text-white" size={12} />
                              <span className="caption text-white">
                                {formatDate(api.createdAt)}
                              </span>
                            </div>
                            <span className="caption text-primary">
                              View Details →
                            </span>
                          </div>
                        </Card.Body>
                      </Card>
                    </motion.div>
                  </Col>
                ))}
              </Row>
            </motion.div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-5">
                <Pagination 
                  style={{ 
                    '--bs-pagination-bg': 'rgba(30, 41, 59, 0.7)',
                    '--bs-pagination-border-color': 'rgba(255, 255, 255, 0.1)',
                    '--bs-pagination-hover-bg': 'rgba(59, 130, 246, 0.3)',
                    '--bs-pagination-hover-border-color': 'rgba(59, 130, 246, 0.5)',
                    '--bs-pagination-active-bg': 'rgba(59, 130, 246, 1)',
                    '--bs-pagination-active-border-color': 'rgba(59, 130, 246, 1)',
                    '--bs-pagination-color': 'rgba(255, 255, 255, 0.8)',
                    '--bs-pagination-hover-color': 'rgba(255, 255, 255, 1)',
                    '--bs-pagination-focus-color': 'rgba(255, 255, 255, 1)',
                    '--bs-pagination-active-color': 'rgba(255, 255, 255, 1)',
                    '--bs-pagination-disabled-color': 'rgba(255, 255, 255, 0.4)',
                    '--bs-pagination-disabled-bg': 'rgba(30, 41, 59, 0.5)',
                    '--bs-pagination-disabled-border-color': 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
                >
                  {renderPaginationItems()}
                </Pagination>
              </div>
            )}
          </>
        )}
        </Container>
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal 
        show={showDeleteModal} 
        onHide={handleDeleteCancel}
        centered
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header 
          closeButton 
          className="bg-dark border-secondary"
          style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}
        >
          <Modal.Title className="text-white d-flex align-items-center gap-2">
            <FaExclamationTriangle className="text-warning" />
            Delete API
          </Modal.Title>
        </Modal.Header>
        <Modal.Body 
          className="bg-dark"
          style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
        >
          <div className="text-center py-3">
            <div className="mb-4">
              <div className="d-inline-flex align-items-center justify-content-center rounded-circle p-3 mb-3" 
                style={{ 
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  width: '64px',
                  height: '64px'
                }}>
                <FaTrash className="text-danger" size={24} />
              </div>
              <h5 className="text-white mb-3">Are you sure you want to delete this API?</h5>
            </div>
            
            {apiToDelete && (
              <div className="mb-4 p-3 rounded-2" 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                <div className="text-start">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <FaServer className="text-primary" size={16} />
                    <span className="text-white fw-medium">API ID:</span>
                    <span className="text-light">{apiToDelete.apiId.substring(0, 8)}...</span>
                  </div>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <FaTable className="text-primary" size={14} />
                    <span className="text-white fw-medium">Tables:</span>
                    <span className="text-light">{apiToDelete.tables.join(', ')}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <FaCalendarAlt className="text-primary" size={14} />
                    <span className="text-white fw-medium">Created:</span>
                    <span className="text-light">{formatDate(apiToDelete.createdAt)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="alert alert-warning border-0 mb-4" 
              style={{ 
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                color: '#fbbf24'
              }}>
              <div className="d-flex align-items-start gap-3">
                <FaExclamationTriangle size={16} className="mt-1" />
                <div className="text-start">
                  <h6 className="mb-2 text-warning">Important Information</h6>
                  <ul className="mb-0 small text-start">
                    <li>This action will soft delete your API (data is preserved)</li>
                    <li>Your API will be removed from the active list</li>
                    <li>API cannot be automatically restored from the dashboard</li>
                    <li>To restore, you must contact support with your API ID</li>
                    <li>This action cannot be undone without support assistance</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="text-light small">
              <strong>API ID for support:</strong> {apiToDelete?.apiId}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer 
          className="bg-dark border-secondary"
          style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}
        >
          <Button 
            variant="secondary" 
            onClick={handleDeleteCancel}
            disabled={deleting}
            className="d-flex align-items-center gap-2"
          >
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteConfirm}
            disabled={deleting}
            className="d-flex align-items-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              border: 'none',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
            }}
          >
            {deleting ? (
              <>
                <Spinner size="sm" animation="border" />
                Deleting...
              </>
            ) : (
              <>
                <FaTrash size={14} />
                Delete API
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

// Helper function to determine if an API was created within the last 24 hours
const isRecent = (dateString) => {
  const createdDate = new Date(dateString);
  const now = new Date();
  const oneDayInMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  return (now - createdDate) < oneDayInMs;
};

export default DashboardPage; 