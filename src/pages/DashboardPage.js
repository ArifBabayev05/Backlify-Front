import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, Pagination } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthContext';
import { FaPlus, FaServer, FaCalendarAlt, FaTable, FaChevronLeft, FaChevronRight, FaHome, FaFilter, FaSearch, FaChartLine } from 'react-icons/fa';

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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [apisPerPage] = useState(6); // Show 6 APIs per page
  const [totalPages, setTotalPages] = useState(1);

  // Check if user is admin
  const isAdmin = user?.username === 'aa' || user?.username === 'Admin';

  useEffect(() => {
    fetchUserApis();
  }, []);

  const fetchUserApis = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const XAuthUserId = user?.XAuthUserId;
      console.log(`Fetching APIs for user: ${XAuthUserId}`);
      
      const response = await fetch('http://localhost:3000/my-apis', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': XAuthUserId
        }
      });

      console.log('API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch APIs: ${response.status} ${response.statusText}`);
      }

      const responseText = await response.text();
      console.log('Raw API response:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed API data:', data);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('Invalid JSON response from server');
      }
      
      // Sort APIs by creation date (newest first)
      const sortedApis = (data.apis || []).sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      setApis(sortedApis);
      setTotalPages(Math.ceil(sortedApis.length / apisPerPage));
      console.log('APIs loaded:', sortedApis.length || 0);
    } catch (error) {
      console.error('Error fetching user APIs:', error);
      setError(`Failed to load your APIs: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApiSelect = (apiId) => {
    // Store the selected API ID in localStorage for use on the endpoints page
    localStorage.setItem('selectedApiId', apiId);
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
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="min-vh-100 d-flex flex-column"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: 'white',
        paddingTop: '2rem',
        paddingBottom: '3rem',
        overflowY: 'auto',
        height: '100vh'
      }}
    >
      {/* Navigation Bar */}
      <div className="position-fixed top-0 start-0 w-100 py-3 px-4" style={{ 
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        zIndex: 1000
      }}>
        <Container>
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <div className="d-flex align-items-center justify-content-center rounded-circle me-2" 
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  background: 'rgba(59, 130, 246, 0.2)',
                }}>
                <FaServer className="text-primary" size={20} />
              </div>
              <h5 className="m-0 text-white d-none d-md-block">Backlify Admin</h5>
            </div>
            <div className="d-flex gap-2">
              {isAdmin && (
                <Button
                  variant="outline-success"
                  className="d-flex align-items-center gap-2"
                  onClick={navigateToLogs}
                  style={{
                    borderColor: 'rgba(16, 185, 129, 0.4)',
                    borderRadius: '8px',
                    padding: '0.5rem 1rem'
                  }}
                >
                  <FaChartLine size={14} /> <span className="d-none d-md-inline">Logs Dashboard</span>
                </Button>
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
                <FaHome size={14} /> <span className="d-none d-md-inline">Return to Home</span>
              </Button>
            </div>
          </div>
        </Container>
      </div>

      <Container className="pb-5 mt-5 pt-4">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-5"
        >
          <h1 className="display-5 fw-bold mb-2" style={{ 
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-1px'
          }}>
            My API Dashboard
          </h1>
          <p className="lead text-light opacity-75 mx-auto" style={{ maxWidth: '600px' }}>
            Manage and access your API endpoints with ease
          </p>
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
                rotate: 360,
                transition: { duration: 1.5, repeat: Infinity, ease: "linear" } 
              }}
              className="mb-4"
              style={{ display: 'inline-block' }}
            >
              <FaServer size={40} className="text-primary" />
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
                >
                  <FaPlus size={14} /> Create New API
                </Button>
              </Card.Body>
            </Card>
          </motion.div>
        ) : (
          <>
            {/* Search Bar */}
            

            <motion.div variants={staggerItems}>
              <Row className="g-4">
                {currentApis.map((api, index) => (
                  <Col key={api.apiId} lg={4} md={6} className="mb-4">
                    <motion.div variants={itemVariant}>
                      <Card 
                        className="h-100 border-0 shadow-lg overflow-hidden"
                        style={{ 
                          background: 'rgba(30, 41, 59, 0.7)',
                          backdropFilter: 'blur(10px)',
                          borderRadius: '16px',
                          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleApiSelect(api.apiId)}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'translateY(-8px)';
                          e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1)';
                        }}
                      >
                        <div 
                          className="position-absolute top-0 start-0 w-100" 
                          style={{ 
                            height: '6px', 
                            background: getRandomGradient(index),
                            zIndex: 1
                          }}
                        />
                        <Card.Body className="d-flex flex-column position-relative p-4">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <div className="d-flex align-items-center">
                              <div 
                                className="d-flex align-items-center justify-content-center rounded-circle me-2" 
                                style={{ 
                                  width: '36px', 
                                  height: '36px', 
                                  background: 'rgba(59, 130, 246, 0.1)',
                                  flexShrink: 0
                                }}
                              >
                                <FaServer className="text-primary" />
                              </div>
                              <Card.Title className="mb-0 text-primary fw-bold" style={{ fontSize: '1.25rem' }}>
                                {api.apiId.substring(0, 8)}
                              </Card.Title>
                            </div>
                            {isRecent(api.createdAt) && (
                              <span 
                                className="badge px-2 py-1 text-white" 
                                style={{ 
                                  fontSize: '0.7rem',
                                  background: 'linear-gradient(90deg, #10b981, #059669)',
                                  borderRadius: '6px'
                                }}
                              >
                                New
                              </span>
                            )}
                          </div>

                          <Card.Text className="text-light d-flex align-items-start mb-4">
                            <FaTable className="text-light opacity-50 me-2 mt-1" style={{ flexShrink: 0 }} />
                            <span>
                              <strong className="d-block mb-1 text-white-50">Tables:</strong> 
                              <span className="text-white">{api.tables.join(', ')}</span>
                            </span>
                          </Card.Text>

                          <div className="mt-auto pt-3 border-top border-dark d-flex align-items-center">
                            <FaCalendarAlt className="text-light opacity-50 me-2" size={12} />
                            <small className="text-light opacity-75">
                              Created: {formatDate(api.createdAt)}
                            </small>
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