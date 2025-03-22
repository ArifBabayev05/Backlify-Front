import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LoadingAnimation = () => {
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [progress, setProgress] = useState(0);
  
  const phases = [
    "Analyzing your requirements...",
    "Identifying entity relationships...",
    "Creating database schema...",
    "Optimizing table structures...",
    "Finalizing schema design..."
  ];

  useEffect(() => {
    // Update phases
    const phaseInterval = setInterval(() => {
      setLoadingPhase(prev => (prev + 1) % phases.length);
    }, 3000);
    
    // Update progress bar, but cap at 90% to show it's still loading
    // Will disappear when parent component removes the loading animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return 90; // Cap at 90% instead of 100%
        return prev + 1;
      });
    }, 150);
    
    return () => {
      clearInterval(phaseInterval);
      clearInterval(progressInterval);
    };
  }, []);
  
  // Generate random particles for background
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    size: 3 + Math.random() * 8,
    x: Math.random() * 100,
    y: Math.random() * 100,
  }));

  return (
    <motion.div
      className="position-fixed d-flex flex-column align-items-center justify-content-center w-100 h-100"
      style={{ 
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999, 
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(23, 36, 64, 0.98))',
        backdropFilter: 'blur(8px)',
        perspective: '1000px'
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background particles */}
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="position-absolute rounded-circle"
          style={{
            width: particle.size,
            height: particle.size,
            top: `${particle.y}%`,
            left: `${particle.x}%`,
            backgroundColor: particle.id % 3 === 0 
              ? 'rgba(59, 130, 246, 0.4)' 
              : particle.id % 3 === 1 
                ? 'rgba(16, 185, 129, 0.4)' 
                : 'rgba(139, 92, 246, 0.4)',
            filter: 'blur(1px)',
            zIndex: 0
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 4 + Math.random() * 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}

      {/* 3D cube animation */}
      <motion.div
        className="position-relative mb-5"
        style={{ 
          width: '180px', 
          height: '180px',
          transformStyle: 'preserve-3d',
          transformOrigin: 'center center',
        }}
        animate={{ 
          rotateX: [0, 360], 
          rotateY: [0, 360],
        }}
        transition={{ 
          duration: 15, 
          ease: "linear", 
          repeat: Infinity,
        }}
      >
        {/* Cube faces */}
        <div className="position-absolute w-100 h-100" style={{ 
          transform: 'translateZ(90px)',
          background: 'linear-gradient(45deg, rgba(59, 130, 246, 0.3), rgba(37, 99, 235, 0.3))',
          borderRadius: '12px',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          boxShadow: '0 0 20px rgba(59, 130, 246, 0.4), inset 0 0 40px rgba(59, 130, 246, 0.2)',
          backdropFilter: 'blur(4px)',
        }}>
          <div className="d-flex align-items-center justify-content-center h-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.9)" strokeWidth="1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
          </div>
        </div>
        <div className="position-absolute w-100 h-100" style={{ 
          transform: 'translateZ(-90px)',
          background: 'linear-gradient(45deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.3))',
          borderRadius: '12px',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          boxShadow: '0 0 20px rgba(16, 185, 129, 0.4), inset 0 0 40px rgba(16, 185, 129, 0.2)',
          backdropFilter: 'blur(4px)',
        }}>
          <div className="d-flex align-items-center justify-content-center h-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.9)" strokeWidth="1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 11h10M12 7v8" />
            </svg>
          </div>
        </div>
        <div className="position-absolute w-100 h-100" style={{ 
          transform: 'rotateY(90deg) translateZ(90px)',
          background: 'linear-gradient(45deg, rgba(139, 92, 246, 0.3), rgba(124, 58, 237, 0.3))',
          borderRadius: '12px',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          boxShadow: '0 0 20px rgba(139, 92, 246, 0.4), inset 0 0 40px rgba(139, 92, 246, 0.2)',
          backdropFilter: 'blur(4px)',
        }}>
          <div className="d-flex align-items-center justify-content-center h-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.9)" strokeWidth="1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>
        <div className="position-absolute w-100 h-100" style={{ 
          transform: 'rotateY(-90deg) translateZ(90px)',
          background: 'linear-gradient(45deg, rgba(236, 72, 153, 0.3), rgba(219, 39, 119, 0.3))',
          borderRadius: '12px',
          border: '1px solid rgba(236, 72, 153, 0.3)',
          boxShadow: '0 0 20px rgba(236, 72, 153, 0.4), inset 0 0 40px rgba(236, 72, 153, 0.2)',
          backdropFilter: 'blur(4px)',
        }}>
          <div className="d-flex align-items-center justify-content-center h-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.9)" strokeWidth="1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
        </div>
        <div className="position-absolute w-100 h-100" style={{ 
          transform: 'rotateX(90deg) translateZ(90px)',
          background: 'linear-gradient(45deg, rgba(245, 158, 11, 0.3), rgba(217, 119, 6, 0.3))',
          borderRadius: '12px',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          boxShadow: '0 0 20px rgba(245, 158, 11, 0.4), inset 0 0 40px rgba(245, 158, 11, 0.2)',
          backdropFilter: 'blur(4px)',
        }}>
          <div className="d-flex align-items-center justify-content-center h-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.9)" strokeWidth="1">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
            </svg>
          </div>
        </div>
        <div className="position-absolute w-100 h-100" style={{ 
          transform: 'rotateX(-90deg) translateZ(90px)',
          background: 'linear-gradient(45deg, rgba(6, 182, 212, 0.3), rgba(8, 145, 178, 0.3))',
          borderRadius: '12px',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          boxShadow: '0 0 20px rgba(6, 182, 212, 0.4), inset 0 0 40px rgba(6, 182, 212, 0.2)',
          backdropFilter: 'blur(4px)',
        }}>
          <div className="d-flex align-items-center justify-content-center h-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.9)" strokeWidth="1">
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
              <line x1="6" y1="6" x2="6.01" y2="6"></line>
              <line x1="6" y1="18" x2="6.01" y2="18"></line>
            </svg>
          </div>
        </div>
        
        {/* Glowing center */}
        <motion.div 
          className="position-absolute rounded-circle"
          style={{
            width: '40px',
            height: '40px',
            top: '50%',
            left: '50%',
            marginTop: '-20px',
            marginLeft: '-20px',
            background: 'rgba(255, 255, 255, 0.8)',
            boxShadow: '0 0 20px rgba(255, 255, 255, 0.8), 0 0 40px rgba(59, 130, 246, 0.8)',
            zIndex: 10
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.7, 0.9, 0.7]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>

      {/* Loading text with title */}
      <motion.div 
        className="text-white text-center mb-4"
        style={{ zIndex: 1 }}
      >
        <motion.h2 
          className="fw-bold fs-3 mb-1"
          animate={{ 
            opacity: [0.8, 1, 0.8],
          }}
          transition={{ 
            duration: 2, 
            ease: "easeInOut", 
            repeat: Infinity 
          }}
        >
          Generating Your Schema
        </motion.h2>
        
        <div style={{ height: '28px', overflow: 'hidden' }}>
          <AnimatePresence mode="wait">
            <motion.p
              key={loadingPhase}
              className="mb-0 fs-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              {phases[loadingPhase]}
            </motion.p>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Progress bar */}
      <div className="mb-4" style={{ width: '300px' }}>
        <div className="w-100 bg-dark rounded-pill overflow-hidden" style={{ height: '6px', opacity: 0.7 }}>
          <motion.div 
            className="h-100 rounded-pill"
            style={{ 
              width: `${progress}%`,
              background: 'linear-gradient(to right, #3b82f6, #10b981)'
            }}
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Description text */}
      <motion.p
        className="text-center text-white-50 px-4"
        style={{ maxWidth: '600px', fontSize: '14px', lineHeight: 1.5 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        Our AI analyzes your requirements to create an optimal database schema with well-structured tables and relationships
      </motion.p>

    </motion.div>
  );
};

export default LoadingAnimation; 