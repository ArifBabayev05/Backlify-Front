import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthContext';

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
      
      setApis(data.apis || []);
      console.log('APIs loaded:', data.apis?.length || 0);
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

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="min-vh-100 d-flex flex-column"
      style={{
        background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
        color: 'white',
        paddingTop: '6rem',
      }}
    >
      <Container>
        <Row className="mb-4">
          <Col>
            <h1 className="display-5 fw-bold mb-3">My API Dashboard</h1>
            <p className="lead text-light opacity-75">
              Manage and access your API endpoints
            </p>
          </Col>
        </Row>

        {error && (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="text-center my-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-light">Loading your APIs...</p>
          </div>
        ) : apis.length === 0 ? (
          <Card 
            className="border-0 shadow-sm mb-4"
            style={{ 
              background: 'rgba(45, 55, 72, 0.5)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px'
            }}
          >
            <Card.Body className="text-center py-5">
              <h3 className="text-light mb-3">No APIs Found</h3>
              <p className="text-light opacity-75 mb-4">
                You don't have any APIs created yet.
              </p>
              <Button 
                variant="primary"
                style={{
                  background: 'linear-gradient(145deg, #3b82f6, #2563eb)',
                  border: 'none',
                  boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)',
                  borderRadius: '8px',
                  padding: '0.5rem 1.5rem',
                }}
              >
                Create New API
              </Button>
            </Card.Body>
          </Card>
        ) : (
          <motion.div variants={staggerItems}>
            <Row>
              {apis.map((api) => (
                <Col key={api.apiId} lg={4} md={6} className="mb-4">
                  <motion.div variants={itemVariant}>
                    <Card 
                      className="h-100 border-0 shadow-sm"
                      style={{ 
                        background: 'rgba(45, 55, 72, 0.5)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '12px',
                        transition: 'transform 0.3s, box-shadow 0.3s',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleApiSelect(api.apiId)}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-5px)';
                        e.currentTarget.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.2)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                      }}
                    >
                      <Card.Body className="d-flex flex-column">
                        <Card.Title className="mb-3 text-primary">API #{api.apiId.substring(0, 8)}</Card.Title>
                        <Card.Text className="text-light opacity-75 mb-3">
                          <strong>Tables:</strong> {api.tables.join(', ')}
                        </Card.Text>
                        <div className="mt-auto pt-3 border-top border-secondary">
                          <small className="text-light opacity-50">
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
        )}
      </Container>
    </motion.div>
  );
};

export default DashboardPage; 