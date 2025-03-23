import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// This is a simplified version for embedding in the PromptInput component
const SpinnerLoading = ({ embedded = false }) => {
  // If embedded is true, show a simplified version for the PromptInput component
  if (embedded) {
    return (
      <motion.div
        style={{
          width: '60px',
          height: '60px',
          position: 'relative'
        }}
      >
        {/* Spinning circle */}
        <motion.div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            border: '3px solid rgba(59, 130, 246, 0.2)',
            borderTop: '3px solid rgba(59, 130, 246, 0.8)',
            boxSizing: 'border-box'
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, ease: "linear", repeat: Infinity }}
        />
        
        {/* Inner pulsing dot */}
        <motion.div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '16px',
            height: '16px',
            marginLeft: '-8px',
            marginTop: '-8px',
            backgroundColor: '#3b82f6',
            borderRadius: '50%'
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.6, 1, 0.6]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>
    );
  }
  
  // Otherwise, use the existing full-page animation
  return (
    <motion.div
      className="d-flex flex-column align-items-center justify-content-center"
      style={{
        position: 'relative',
        width: '100px',
        height: '100px'
      }}
    >
      {/* Spinning outer ring */}
      <motion.div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          border: '4px solid transparent',
          borderTopColor: '#3b82f6',
          borderLeftColor: '#3b82f6'
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, ease: "linear", repeat: Infinity }}
      />
      
      {/* Spinning inner ring (opposite direction) */}
      <motion.div
        style={{
          position: 'absolute',
          width: '70%',
          height: '70%',
          borderRadius: '50%',
          border: '4px solid transparent',
          borderRightColor: '#10b981',
          borderBottomColor: '#10b981'
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 1.8, ease: "linear", repeat: Infinity }}
      />
      
      {/* Center dot */}
      <motion.div
        style={{
          width: '20px',
          height: '20px',
          backgroundColor: 'white',
          borderRadius: '50%'
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  );
};

export default SpinnerLoading; 