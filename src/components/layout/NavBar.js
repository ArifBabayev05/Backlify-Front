import React, { useState } from 'react';
import { Navbar, Nav, Container, Button, Dropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../auth/AuthContext';

const NavBar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Navbar 
      expand="lg" 
      expanded={expanded}
      className="py-3 position-absolute w-100"
      style={{ 
        background: 'transparent',
        zIndex: 1000,
      }}
      variant="dark"
    >
      <Container>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span 
              className="fw-bold text-white" 
              style={{ 
                background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)', 
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Backlify
            </span>
          </motion.div>
        </Navbar.Brand>
        
        <Navbar.Toggle 
          aria-controls="navbar-nav" 
          onClick={() => setExpanded(expanded ? false : true)}
        />
        
        <Navbar.Collapse id="navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link as={Link} to="/" onClick={() => setExpanded(false)}>
              Home
            </Nav.Link>
            
            {isAuthenticated() ? (
              <>
                {/* <Nav.Link as={Link} to="/schema" onClick={() => setExpanded(false)}>
                  My Schemas
                </Nav.Link>*/}
                <Nav.Link as={Link} to="/dashboard" onClick={() => setExpanded(false)}>
                  Dashboard
                </Nav.Link>
                <Nav.Link as={Link} to="/endpoints" onClick={() => setExpanded(false)}>
                  API Endpoints
                </Nav.Link> 
                
                <Dropdown align="end">
                  <Dropdown.Toggle 
                    variant="link" 
                    id="dropdown-user" 
                    className="nav-link text-white"
                    style={{ textDecoration: 'none' }}
                  >
                    {user?.userId || 'Account'}
                  </Dropdown.Toggle>

                  <Dropdown.Menu style={{ 
                    background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                  }}>
                    <Dropdown.Item 
                      className="text-white-50"
                      style={{ 
                        background: 'transparent',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => {
                        setExpanded(false);
                        navigate('/profile');
                      }}
                    >
                      Profile
                    </Dropdown.Item>
                    <Dropdown.Divider style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                    <Dropdown.Item 
                      className="text-white-50"
                      style={{ 
                        background: 'transparent',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => {
                        setExpanded(false);
                        handleLogout();
                      }}
                    >
                      Sign Out
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </>
            ) : (
              <>
                <Nav.Item className="d-flex align-items-center ms-lg-2">
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Button 
                      as={Link} 
                      to="/login"
                      variant="outline-light"
                      className="me-2"
                      onClick={() => setExpanded(false)}
                      style={{
                        borderRadius: '8px',
                        padding: '0.5rem 1rem',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        background: 'rgba(255, 255, 255, 0.05)'
                      }}
                    >
                      Sign In
                    </Button>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Button 
                      as={Link} 
                      to="/register"
                      variant="primary"
                      onClick={() => setExpanded(false)}
                      style={{
                        borderRadius: '8px',
                        padding: '0.5rem 1rem',
                        background: 'linear-gradient(145deg, #3b82f6, #2563eb)',
                        border: 'none',
                        boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)'
                      }}
                    >
                      Sign Up
                    </Button>
                  </motion.div>
                </Nav.Item>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavBar; 