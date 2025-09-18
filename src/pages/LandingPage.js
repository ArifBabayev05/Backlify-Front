import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Container, Row, Col } from 'react-bootstrap';
import PromptInput from '../components/landing/PromptInput';
import LoadingAnimation from '../components/common/LoadingAnimation';
import ExamplePromptCard from '../components/common/ExamplePromptCard';
import { useNavigate } from 'react-router-dom';
import dbIcon from '../assets/images/db-1.png';
import { toast } from 'react-hot-toast';
import { useAuth } from '../components/auth/AuthContext';

// 3D animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { 
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
};

const particleConfig = {
  count: 12,
  size: [2, 8],
  speed: [0.2, 0.8],
  colors: ['#3b82f6', '#4f46e5', '#10b981', '#8b5cf6'],
};

const LandingPage = () => {
  const [particles, setParticles] = useState([]);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Example prompt cards data
  const examplePromptCards = [
    {
      title: "E-commerce Database",
      description: "I need a database for an e-commerce platform with products, categories, users, orders, and reviews. Products have prices, descriptions, and belong to categories. Orders have statuses and belong to users.",
      iconBg: "#3b82f6"
    },
    {
      title: "Blog Database",
      description: "Create a blog database with users, posts, comments, and tags. Posts belong to users and can have many comments. Posts can have multiple tags, and tags can be applied to multiple posts.",
      iconBg: "#10b981"
    }
  ];

  // Generate floating particles
  useEffect(() => {
    const newParticles = Array.from({ length: particleConfig.count }, () => ({
      id: Math.random(),
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: particleConfig.size[0] + Math.random() * (particleConfig.size[1] - particleConfig.size[0]),
      color: particleConfig.colors[Math.floor(Math.random() * particleConfig.colors.length)],
      speed: particleConfig.speed[0] + Math.random() * (particleConfig.speed[1] - particleConfig.speed[0]),
      direction: Math.random() * Math.PI * 2,
    }));
    
    setParticles(newParticles);
  }, []);

  // Handle API response and navigate to schema page
  const handleGenerateSchema = (prompt) => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      // Store the prompt in sessionStorage for after login
      sessionStorage.setItem('pendingPrompt', prompt);
      toast.error('Please log in to continue');
      navigate('/login');
      return;
    }

    // At this point, data should already be ready (set by PromptInput)
    // but we'll double-check to be safe
    const dataReady = sessionStorage.getItem('dataReady');
    
    if (dataReady === 'true') {
      // Data is already ready, navigate immediately
      console.log('Data ready, navigating to schema page');
      sessionStorage.removeItem('dataReady'); // Clear the flag
      navigate('/schema');
    } else {
      // This shouldn't happen with our updated flow, but just in case
      console.warn('Data not ready yet, waiting for a moment...');
      
      // Small delay to give sessionStorage time to update
      setTimeout(() => {
        const dataReadyAfterDelay = sessionStorage.getItem('dataReady');
        
        if (dataReadyAfterDelay === 'true') {
          console.log('Data ready after delay, navigating to schema page');
          sessionStorage.removeItem('dataReady'); // Clear the flag
          navigate('/schema');
        } else {
          console.error('Data still not ready after delay, showing error');
          toast.error('Error generating schema. Please try again.');
        }
      }, 1000); // 1 second delay
    }
  };

  return (
    <div 
      className="min-vh-100 d-flex flex-column align-items-center justify-content-center p-4 position-relative overflow-hidden page-wrapper"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
    >
      {/* Animated particles background */}
      <div className="position-absolute w-100 h-100" style={{ top: 0, left: 0, zIndex: 1, overflow: 'hidden' }}>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="position-absolute rounded-circle"
            style={{
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              filter: 'blur(1px)',
              opacity: 0.4,
              x: particle.x,
              y: particle.y,
            }}
            animate={{
              x: [particle.x, particle.x + Math.cos(particle.direction) * 100],
              y: [particle.y, particle.y + Math.sin(particle.direction) * 100],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 10 / particle.speed,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Background gradient elements - NO 3D effect */}
      <div 
        className="position-absolute w-100 h-100 overflow-hidden" 
        style={{ zIndex: 0, top: 0, left: 0 }}
      >
        <motion.div 
          className="position-absolute rounded-circle" 
          style={{ 
            top: '-5%', 
            left: '-15%', 
            width: '50%', 
            height: '50%', 
            backgroundColor: 'rgba(59, 130, 246, 0.15)', 
            filter: 'blur(80px)',
            zIndex: 1
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
            right: '-15%', 
            width: '60%', 
            height: '60%', 
            backgroundColor: 'rgba(16, 185, 129, 0.15)', 
            filter: 'blur(80px)',
            zIndex: 1
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
        <motion.div 
          className="position-absolute rounded-circle" 
          style={{ 
            top: '40%', 
            right: '10%', 
            width: '30%', 
            height: '30%', 
            backgroundColor: 'rgba(139, 92, 246, 0.12)', 
            filter: 'blur(60px)',
            zIndex: 1
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
        />
      </div>
      
   
      
      {/* Content - no 3D effect on the container */}
      <div 
        className="position-relative" 
        style={{ zIndex: 10, width: '100%', maxWidth: '64rem' }}
      >
        <Container>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center"
          >
            <motion.div variants={itemVariants} className="mb-2">
              <div className="position-relative d-inline-block mb-3">
                <span className="position-absolute" style={{ 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  bottom: 0, 
                  background: 'linear-gradient(45deg, #3b82f6, #10b981)',
                  filter: 'blur(25px)',
                  opacity: 0.3,
                  borderRadius: '50%',
                  transform: 'translate(-10%, -20%) scale(1.2)',
                }}></span>
                <motion.div
                  initial={{ y: -100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 200, 
                    damping: 20
                  }}
                >
                  <img 
                    src={dbIcon} 
                    alt="Database Schema Builder Icon - Build APIs visually" 
                    className="mb-3" 
                    style={{ height: '40px', width: 'auto' }} 
                    loading="lazy"
                    width="40"
                    height="40"
                  />
                </motion.div>
              </div>
              <h1 className="display-4 fw-bold text-white mb-1">
                AI-Powered API Builder
              </h1>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <p className="lead text-white-50 mb-4">
                Just describe your backend in plain language, and let AI generate a complete database schema with tables, relationships, and instant API endpoints.
              </p>
            </motion.div>

            {/* Input component without 3D effects */}
            <motion.div variants={itemVariants}>
              <PromptInput onGenerate={handleGenerateSchema} />
            </motion.div>
            
            {/* No 3D effects on the example section */}
            <motion.div variants={itemVariants} className="mt-5 mb-4">
              <h4 className="text-white-50 fs-6 fw-bold text-uppercase opacity-75 mb-2">
                EXAMPLE PROMPTS
              </h4>
              <Row className="g-4 mt-2 justify-content-center">
                {examplePromptCards.map((card, index) => (
                  <Col lg={6} key={index}>
                    <ExamplePromptCard 
                      title={card.title}
                      description={card.description}
                      iconBg={card.iconBg}
                    />
                  </Col>
                ))}
              </Row>
            </motion.div>
          </motion.div>
        </Container>
      </div>
      
      {/* Footer with glow effect */}
      <motion.footer 
        className="mt-auto pt-4 text-center"
        style={{ zIndex: 10 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="position-relative">
          <div className="position-absolute" style={{ 
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '150px',
            height: '25px',
            background: 'rgba(59, 130, 246, 0.15)',
            filter: 'blur(15px)',
            borderRadius: '50%',
          }}></div>
          {/* <p className="text-white-50 small m-0">
            &copy; {new Date().getFullYear()} API Generator AI
          </p> */}
        </div>
      </motion.footer>
    </div>
  );
};

export default LandingPage; 

