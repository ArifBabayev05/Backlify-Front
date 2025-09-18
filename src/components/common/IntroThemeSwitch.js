import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const IntroThemeSwitch = () => {
  const [isDark, setIsDark] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Apply the theme class to the document
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleToggle = () => {
    setIsAnimating(true);
    setIsDark(!isDark);
    
    // Reset animation state after transition
    setTimeout(() => setIsAnimating(false), 500);
  };

  return (
    <motion.div
      className="position-fixed d-flex align-items-center justify-content-center"
      style={{ 
        top: '20px', 
        right: '20px', 
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(20px)',
        borderRadius: '50px',
        padding: '4px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.button
        className="border-0 bg-transparent d-flex align-items-center justify-content-center position-relative"
        style={{ 
          width: '60px', 
          height: '32px',
          borderRadius: '50px',
          cursor: 'pointer',
          outline: 'none'
        }}
        onClick={handleToggle}
        disabled={isAnimating}
      >
        {/* Background */}
        <motion.div
          className="position-absolute w-100 h-100"
          style={{
            background: isDark 
              ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' 
              : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
            borderRadius: '50px',
            boxShadow: isDark 
              ? 'inset 0 2px 4px rgba(0, 0, 0, 0.3)' 
              : 'inset 0 2px 4px rgba(255, 255, 255, 0.3)'
          }}
          animate={{
            background: isDark 
              ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' 
              : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
          }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Toggle Circle */}
        <motion.div
          className="position-absolute d-flex align-items-center justify-content-center"
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: isDark 
              ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' 
              : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: isDark 
              ? '0 4px 12px rgba(59, 130, 246, 0.4)' 
              : '0 4px 12px rgba(0, 0, 0, 0.2)',
            left: isDark ? '4px' : '32px'
          }}
          animate={{
            x: isDark ? 0 : 28,
            background: isDark 
              ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' 
              : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: isDark 
              ? '0 4px 12px rgba(59, 130, 246, 0.4)' 
              : '0 4px 12px rgba(0, 0, 0, 0.2)'
          }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            duration: 0.3 
          }}
        >
          {/* Icon inside toggle */}
          <motion.div
            animate={{ 
              rotate: isDark ? 0 : 180,
              scale: isAnimating ? 1.2 : 1
            }}
            transition={{ duration: 0.3 }}
          >
            {isDark ? (
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                className="text-white"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                className="text-yellow-600"
              >
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            )}
          </motion.div>
        </motion.div>
        
        {/* Glow effect */}
        <motion.div
          className="position-absolute"
          style={{
            width: '60px',
            height: '32px',
            borderRadius: '50px',
            background: isDark 
              ? 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)' 
              : 'radial-gradient(circle, rgba(251, 191, 36, 0.2) 0%, transparent 70%)',
            opacity: isAnimating ? 0.8 : 0
          }}
          animate={{
            opacity: isAnimating ? 0.8 : 0,
            scale: isAnimating ? 1.1 : 1
          }}
          transition={{ duration: 0.3 }}
        />
      </motion.button>
      
      {/* Label */}
      <motion.span 
        className="ms-3 text-white fw-medium"
        style={{ 
          fontSize: '0.9rem',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
          userSelect: 'none'
        }}
        animate={{ opacity: isAnimating ? 0.7 : 1 }}
        transition={{ duration: 0.2 }}
      >
        {isDark ? 'Dark' : 'Light'}
      </motion.span>
    </motion.div>
  );
};

export default IntroThemeSwitch;
