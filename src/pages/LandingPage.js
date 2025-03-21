import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Container, Row, Col } from 'react-bootstrap';
import PromptInput from '../components/landing/PromptInput';
import LoadingAnimation from '../components/common/LoadingAnimation';
import ThemeToggle from '../components/common/ThemeToggle';
import ExamplePromptCard from '../components/common/ExamplePromptCard';
import { useNavigate } from 'react-router-dom';
import dbIcon from '../assets/images/db-1.png';

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
  count: 30,
  size: [2, 8],
  speed: [0.2, 0.8],
  colors: ['#3b82f6', '#4f46e5', '#10b981', '#8b5cf6'],
};

const LandingPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [particles, setParticles] = useState([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();

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

  // Handle mouse movement for 3D effect
  const handleMouseMove = (e) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

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

  // Track mouse position for 3D effect
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Calculate 3D transform based on mouse position
  const calculate3DTransform = (depth = 5) => {
    if (!mousePosition.x || !mousePosition.y) return {};
    
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    // Calculate rotation values
    let rotateY = -((mousePosition.x - centerX) / centerX) * depth;
    let rotateX = ((mousePosition.y - centerY) / centerY) * depth;
    
    // Limit maximum rotation angles to prevent extreme effects at corners
    const maxAngle = 2;
    rotateY = Math.max(Math.min(rotateY, maxAngle), -maxAngle);
    rotateX = Math.max(Math.min(rotateX, maxAngle), -maxAngle);
    
    return {
      transition: 'transform 0.1s ease-out'
    };
  };

  // Handle API response and navigate to schema page
  const handleGenerateSchema = (prompt) => {
    // Show loading animation immediately
    setIsLoading(true);
    
    // We don't need to store prompt here anymore, PromptInput does it
    
    // Set up polling to check if data is ready (set by PromptInput)
    const checkDataInterval = setInterval(() => {
      const dataReady = sessionStorage.getItem('dataReady');
      
      if (dataReady === 'true') {
        // Clear the interval
        clearInterval(checkDataInterval);
        
        // Clear the flag
        sessionStorage.removeItem('dataReady');
        
        // Navigate to schema page
        setIsLoading(false);
        navigate('/schema');
      }
    }, 500); // Check every 500ms
    
    // Safety timeout - if after 20 seconds we haven't received data,
    // stop waiting and navigate anyway (in case of hang)
    setTimeout(() => {
      clearInterval(checkDataInterval);
      setIsLoading(false);
      navigate('/schema');
    }, 20000);
  };

  return (
    <div 
      className="min-vh-100 d-flex flex-column align-items-center justify-content-center p-4 position-relative overflow-hidden"
      onMouseMove={handleMouseMove}
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
      
      {/* Theme toggle with improved positioning */}
      <div className="position-fixed" style={{ top: '24px', right: '24px', zIndex: 100 }}>
        <ThemeToggle />
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
                    alt="Database Icon" 
                    className="mb-3" 
                    style={{ height: '60px', width: 'auto' }} 
                  />
                </motion.div>
              </div>
              <h1 className="display-4 fw-bold text-white mb-1">
                AI Database Schema Generator
              </h1>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <p className="lead text-white-50 mb-4">
                Describe your database in natural language and let AI create a visual schema with tables, relationships, and endpoints.
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
          <p className="text-white-50 small m-0">
            &copy; {new Date().getFullYear()} Database Schema Generator - Powered by AI
          </p>
        </div>
      </motion.footer>
      
      {/* Loading overlay with full-screen animation */}
      <AnimatePresence>
        {isLoading && <LoadingAnimation />}
      </AnimatePresence>
    </div>
  );
};

export default LandingPage; 