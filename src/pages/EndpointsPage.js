import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Container, Row, Col, Button, Nav } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/common/ThemeToggle';
import LoadingAnimation from '../components/common/LoadingAnimation';

// Mock API endpoint data
const mockEndpoints = [
  {
    name: 'Users',
    baseUrl: '/api/users',
    endpoints: [
      { method: 'GET', path: '/', description: 'Get all users', auth: true },
      { method: 'GET', path: '/:id', description: 'Get user by ID', auth: true },
      { method: 'POST', path: '/', description: 'Create a new user', auth: false },
      { method: 'PUT', path: '/:id', description: 'Update user by ID', auth: true },
      { method: 'DELETE', path: '/:id', description: 'Delete user by ID', auth: true },
    ]
  },
  {
    name: 'Posts',
    baseUrl: '/api/posts',
    endpoints: [
      { method: 'GET', path: '/', description: 'Get all posts', auth: false },
      { method: 'GET', path: '/:id', description: 'Get post by ID', auth: false },
      { method: 'GET', path: '/user/:userId', description: 'Get posts by user ID', auth: false },
      { method: 'POST', path: '/', description: 'Create a new post', auth: true },
      { method: 'PUT', path: '/:id', description: 'Update post by ID', auth: true },
      { method: 'DELETE', path: '/:id', description: 'Delete post by ID', auth: true },
    ]
  },
  {
    name: 'Comments',
    baseUrl: '/api/comments',
    endpoints: [
      { method: 'GET', path: '/post/:postId', description: 'Get comments by post ID', auth: false },
      { method: 'POST', path: '/', description: 'Create a new comment', auth: true },
      { method: 'PUT', path: '/:id', description: 'Update comment by ID', auth: true },
      { method: 'DELETE', path: '/:id', description: 'Delete comment by ID', auth: true },
    ]
  },
  {
    name: 'Tags',
    baseUrl: '/api/tags',
    endpoints: [
      { method: 'GET', path: '/', description: 'Get all tags', auth: false },
      { method: 'GET', path: '/:id', description: 'Get tag by ID', auth: false },
      { method: 'GET', path: '/post/:postId', description: 'Get tags by post ID', auth: false },
      { method: 'POST', path: '/', description: 'Create a new tag', auth: true },
      { method: 'PUT', path: '/:id', description: 'Update tag by ID', auth: true },
      { method: 'DELETE', path: '/:id', description: 'Delete tag by ID', auth: true },
    ]
  }
];

// Method colors for visual differentiation
const methodColors = {
  GET: 'bg-primary',
  POST: 'bg-success',
  PUT: 'bg-warning',
  DELETE: 'bg-danger',
  PATCH: 'bg-info'
};

const EndpointsPage = () => {
  const [endpoints, setEndpoints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    // Mock API call to get the endpoints
    setIsLoading(true);
    setTimeout(() => {
      setEndpoints(mockEndpoints);
      setIsLoading(false);
    }, 2000);
  }, []);

  const handleGoBack = () => {
    navigate('/schema');
  };

  // Filter endpoints by HTTP method
  const filteredEndpoints = endpoints.map(group => ({
    ...group,
    endpoints: group.endpoints.filter(endpoint => 
      selectedFilter === 'all' || endpoint.method === selectedFilter
    )
  })).filter(group => group.endpoints.length > 0);

  return (
    <div className="min-vh-100 d-flex flex-column">
      {/* Header */}
      <header className="glassmorphism p-3 d-flex align-items-center justify-content-between" style={{ zIndex: 20 }}>
        <div>
          <h1 className="fs-4 fw-bold text-white mb-0">API Endpoints</h1>
          <p className="small text-white-50 mb-0">
            Generated API endpoints for your database schema
          </p>
        </div>
        
        <div className="d-flex align-items-center">
          <motion.button
            className="btn btn-primary"
            onClick={handleGoBack}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Back to Schema
          </motion.button>
        </div>
      </header>
      
      {/* Filter Tabs */}
      <div className="d-flex justify-content-center p-3" style={{ backgroundColor: 'rgba(31, 41, 55, 0.5)', backdropFilter: 'blur(4px)' }}>
        <div className="glassmorphism p-1 rounded">
          <Nav variant="pills" className="d-flex">
            {['all', 'GET', 'POST', 'PUT', 'DELETE'].map(filter => (
              <Nav.Item key={filter}>
                <Nav.Link 
                  className={`px-3 py-1 mx-1 ${selectedFilter === filter ? 'bg-primary' : 'text-white-50'}`}
                  onClick={() => setSelectedFilter(filter)}
                  active={selectedFilter === filter}
                >
                  {filter === 'all' ? 'All' : filter}
                </Nav.Link>
              </Nav.Item>
            ))}
          </Nav>
        </div>
      </div>
      
      {/* Endpoints */}
      <main className="flex-grow-1 p-4 overflow-auto">
        {isLoading ? (
          <div className="d-flex justify-content-center align-items-center h-100">
            <LoadingAnimation />
          </div>
        ) : (
          <Container fluid>
            <Row className="g-4">
              {filteredEndpoints.map((group, index) => (
                <Col lg={6} key={group.name}>
                  <motion.div
                    className="glassmorphism overflow-hidden h-100"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <div className="p-3 border-bottom" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                      <h2 className="fs-5 fw-bold text-white mb-0">{group.name}</h2>
                      <p className="small text-white-50 mb-0">{group.baseUrl}</p>
                    </div>
                    
                    <div>
                      {group.endpoints.map((endpoint, i) => (
                        <motion.div
                          key={`${group.name}-${i}`}
                          className="p-3 border-bottom" 
                          style={{ 
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                            transition: 'background-color 0.2s',
                            backgroundColor: 'rgba(255, 255, 255, 0)'
                          }}
                          whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.1 + i * 0.05 }}
                        >
                          <div className="d-flex align-items-start gap-2">
                            <span className={`badge ${methodColors[endpoint.method]} text-white px-2 py-1`}>
                              {endpoint.method}
                            </span>
                            <div className="flex-grow-1">
                              <div className="font-monospace small mb-1" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                                {group.baseUrl}{endpoint.path}
                              </div>
                              <p className="small mb-0" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{endpoint.description}</p>
                            </div>
                            {endpoint.auth && (
                              <span className="badge" style={{ backgroundColor: 'rgba(234, 179, 8, 0.2)', color: '#f0b429' }}>
                                Auth
                              </span>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </Col>
              ))}
            </Row>
          </Container>
        )}
      </main>
      
      {/* Download Button */}
      <motion.div 
        className="position-fixed"
        style={{ bottom: '32px', right: '32px' }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 1 }}
      >
        <Button
          variant="success"
          className="d-flex align-items-center gap-2 py-2 px-4"
          style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Download Swagger
        </Button>
      </motion.div>
      
      <ThemeToggle />
    </div>
  );
};

export default EndpointsPage; 