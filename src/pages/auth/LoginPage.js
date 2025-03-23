import React, { useState } from 'react';
import { Container, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../components/auth/AuthContext';

const LoginPage = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  // Get the previous location from state, or default to home page
  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    // Username validation - only letters and numbers, max 20 characters
    const usernameRegex = /^[a-zA-Z0-9]+$/;
    if (!usernameRegex.test(credentials.username)) {
      setError('Username can only contain letters and numbers (no special characters)');
      return false;
    }
    
    if (credentials.username.length > 20) {
      setError('Username cannot be longer than 20 characters');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Authentication failed');
      }

      // Store user data using auth context
      login({
        userId: data.userId,
        email: data.email
      });

      toast.success('Login successful!');
      
      // Check if there was a pending prompt
      const pendingPrompt = sessionStorage.getItem('pendingPrompt');
      if (pendingPrompt) {
        sessionStorage.removeItem('pendingPrompt');
        // Redirect back to the landing page
        navigate('/');
      } else {
        // Redirect user to the page they were trying to access
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Authentication failed');
      toast.error(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center position-relative">
      {/* Simple background */}
      <div className="position-fixed w-100 h-100" style={{ 
        zIndex: -1, 
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        top: 0,
        left: 0
      }}></div>

      <Container className="py-5 position-relative" style={{ zIndex: 1, maxWidth: '480px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div 
            className="rounded-4 p-4 p-md-5 position-relative"
            style={{
              background: 'rgba(30, 41, 59, 0.6)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(59, 130, 246, 0.1)',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div className="text-center mb-4">
              <motion.h1 
                className="display-6 fw-bold text-white mb-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                Welcome Back
              </motion.h1>
              <motion.p 
                className="text-white-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                Sign in to continue to Backlify
              </motion.p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Alert variant="danger">{error}</Alert>
              </motion.div>
            )}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label className="text-white-50">Username</Form.Label>
                <Form.Control
                  type="text"
                  name="username"
                  placeholder="Enter your username"
                  value={credentials.username}
                  onChange={handleChange}
                  required
                  className="border-0 py-3 bg-dark text-white"
                  style={{
                    borderRadius: '10px',
                    background: 'rgba(15, 23, 42, 0.7)',
                    backdropFilter: 'blur(4px)'
                  }}
                />
                <Form.Text className="text-white-50 small">
                  Username must be letters and numbers only, max 20 characters.
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-4">
                <div className="d-flex justify-content-between">
                  <Form.Label className="text-white-50">Password</Form.Label>
                  <Link to="/forgot-password" className="small text-decoration-none" style={{ color: '#3b82f6' }}>
                    Forgot password?
                  </Link>
                </div>
                <Form.Control
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={credentials.password}
                  onChange={handleChange}
                  required
                  className="border-0 py-3 bg-dark text-white"
                  style={{
                    borderRadius: '10px',
                    background: 'rgba(15, 23, 42, 0.7)',
                    backdropFilter: 'blur(4px)'
                  }}
                />
              </Form.Group>

              <motion.div
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="d-grid gap-2 mb-4"
              >
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="py-3 position-relative overflow-hidden"
                  style={{
                    borderRadius: '10px',
                    background: 'linear-gradient(145deg, #3b82f6, #2563eb)',
                    border: 'none',
                    fontWeight: '600',
                    letterSpacing: '0.5px',
                    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)'
                  }}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </motion.div>

              <div className="text-center">
                <p className="text-white-50 mb-0">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-decoration-none" style={{ color: '#3b82f6' }}>
                    Sign up
                  </Link>
                </p>
              </div>
            </Form>
          </div>
        </motion.div>
      </Container>
    </div>
  );
};

export default LoginPage; 