import React, { useState } from 'react';
import { Container, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    // Username validation - only letters and numbers, max 20 characters
    const usernameRegex = /^[a-zA-Z0-9]+$/;
    if (!usernameRegex.test(formData.username)) {
      setError('Username can only contain letters and numbers (no special characters)');
      return false;
    }
    
    if (formData.username.length > 20) {
      setError('Username cannot be longer than 20 characters');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');

    try {
      const requestData = {
        username: formData.username,
        email: formData.email,
        password: formData.password
      };

      const response = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Registration failed');
      }

      // Registration successful
      toast.success('Registration successful! You can now log in.');
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed');
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center position-relative overflow-hidden">
      {/* Background elements */}
      <div className="position-absolute w-100 h-100" style={{ zIndex: 0, top: 0, left: 0 }}>
        <motion.div 
          className="position-absolute rounded-circle" 
          style={{ 
            top: '-10%', 
            right: '-15%', 
            width: '50%', 
            height: '50%', 
            backgroundColor: 'rgba(139, 92, 246, 0.15)', 
            filter: 'blur(80px)'
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.6, 0.8, 0.6],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        />
        <motion.div 
          className="position-absolute rounded-circle" 
          style={{ 
            bottom: '-10%', 
            left: '-15%', 
            width: '60%', 
            height: '60%', 
            backgroundColor: 'rgba(16, 185, 129, 0.15)', 
            filter: 'blur(80px)'
          }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.5, 0.7, 0.5],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
        />
      </div>

      <Container className="py-5 position-relative" style={{ zIndex: 1, maxWidth: '520px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div 
            className="rounded-4 p-4 p-md-5 position-relative"
            style={{
              background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(59, 130, 246, 0.1)',
            }}
          >
            <div className="text-center mb-4">
              <motion.h1 
                className="display-6 fw-bold text-white mb-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                Create an Account
              </motion.h1>
              <motion.p 
                className="text-white-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                Sign up to start using Backlify
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
              <Row>
                <Col md={12} className="mb-3">
                  <Form.Group>
                    <Form.Label className="text-white-50">Username</Form.Label>
                    <Form.Control
                      type="text"
                      name="username"
                      placeholder="Choose a username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      className="border-0 py-3 bg-dark text-white"
                      style={{
                        borderRadius: '10px',
                        background: 'rgba(15, 23, 42, 0.3)',
                        backdropFilter: 'blur(4px)'
                      }}
                    />
                    <Form.Text className="text-white-50 small">
                      Username must be 1-20 characters, letters and numbers only (no special characters).
                    </Form.Text>
                  </Form.Group>
                </Col>
                
                <Col md={12} className="mb-3">
                  <Form.Group>
                    <Form.Label className="text-white-50">Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="border-0 py-3 bg-dark text-white"
                      style={{
                        borderRadius: '10px',
                        background: 'rgba(15, 23, 42, 0.3)',
                        backdropFilter: 'blur(4px)'
                      }}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label className="text-white-50">Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="border-0 py-3 bg-dark text-white"
                      style={{
                        borderRadius: '10px',
                        background: 'rgba(15, 23, 42, 0.3)',
                        backdropFilter: 'blur(4px)'
                      }}
                    />
                  </Form.Group>
                </Col>
                
                <Col md={6} className="mb-4">
                  <Form.Group>
                    <Form.Label className="text-white-50">Confirm Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="confirmPassword"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="border-0 py-3 bg-dark text-white"
                      style={{
                        borderRadius: '10px',
                        background: 'rgba(15, 23, 42, 0.3)',
                        backdropFilter: 'blur(4px)'
                      }}
                    />
                  </Form.Group>
                </Col>
              </Row>

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
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </motion.div>

              <div className="text-center">
                <p className="text-white-50 mb-0">
                  Already have an account?{' '}
                  <Link to="/login" className="text-decoration-none" style={{ color: '#3b82f6' }}>
                    Sign in
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

export default RegisterPage; 