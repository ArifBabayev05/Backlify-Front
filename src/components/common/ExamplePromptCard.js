import React from 'react';
import { motion } from 'framer-motion';

const ExamplePromptCard = ({ title, description, icon, iconBg }) => {
  return (
    <motion.div 
      className="glassmorphism p-3 text-start h-100 rounded-3 border border-1"
      style={{ 
        background: 'rgba(255, 255, 255, 0.03)',
        borderColor: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)'
      }}
      whileHover={{ 
        y: -5, 
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)', 
        background: 'rgba(255, 255, 255, 0.06)',
        borderColor: `${iconBg}33`,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="d-flex align-items-center mb-2">
        <div 
          className="me-2 rounded-circle p-1 d-flex align-items-center justify-content-center" 
          style={{ 
            background: `${iconBg}33`,
            width: '32px',
            height: '32px'
          }}
        >
          <div 
            className="rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: '24px', height: '24px', background: iconBg }}
          >
            <span className="text-white small fw-bold">{title.charAt(0)}</span>
          </div>
        </div>
        <h3 className="fs-6 fw-semibold text-white mb-0">{title}</h3>
      </div>
      <p className="small mb-0" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
        "{description}"
      </p>
    </motion.div>
  );
};

export default ExamplePromptCard; 