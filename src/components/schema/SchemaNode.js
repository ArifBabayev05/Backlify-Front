import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Badge } from 'react-bootstrap';
import { motion } from 'framer-motion';
import './SchemaNode.css';
import './SchemaLayout.css';

const SchemaNode = ({ data, selected }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Extract fields from data
  const { label, fields = [], tableName } = data;

  // Function to get icon color for field types
  const getFieldTypeColor = (fieldType) => {
    if (fieldType && fieldType.toLowerCase().includes('uuid')) {
      return '#3b82f6'; // blue for uuid
    } else if (fieldType && fieldType.toLowerCase().includes('int')) {
      return '#10b981'; // green for integers
    } else if (fieldType && fieldType.toLowerCase().includes('varchar')) {
      return '#f59e0b'; // amber for varchar/text
    } else {
      return '#8b5cf6'; // purple for others
    }
  };

  // Count the number of primary and foreign keys
  const primaryKeyCount = fields.filter(f => f.isPrimary).length;
  const foreignKeyCount = fields.filter(f => f.isForeign).length;

  return (
    <motion.div
      className={`schema-node ${selected ? 'selected' : ''}`}
      style={{ 
        width: '250px',
        background: 'white',
        boxShadow: selected 
          ? '0 10px 25px -5px rgba(59, 130, 246, 0.5), 0 8px 10px -6px rgba(59, 130, 246, 0.3)'
          : isHovered 
            ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' 
            : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        transition: 'all 0.2s ease-in-out',
        overflow: 'hidden',
        border: selected ? '2px solid #3b82f6' : '1px solid rgba(0, 0, 0, 0.05)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.3 }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="schema-handle-target"
      />

      {/* Header with icon */}
      <div className="schema-node-header">
        <div className="schema-node-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 11h10M12 7v8" />
          </svg>
        </div>
        <div>
          <h3 className="schema-node-title">
            {tableName || label}
          </h3>
          <p className="schema-node-subtitle">Database Table</p>
        </div>
      </div>

      {/* Fields list */}
      <div className="bg-white">
        {fields.slice(0, isExpanded ? fields.length : 4).map((field, index) => (
          <motion.div 
            key={index}
            className="schema-field"
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div className="schema-field-name">
              {field.isPrimary ? (
                <span className="schema-field-icon" style={{ color: '#3b82f6' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
                  </svg>
                </span>
              ) : field.isForeign ? (
                <span className="schema-field-icon" style={{ color: '#10b981' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </span>
              ) : (
                <span className="schema-field-icon" style={{ color: getFieldTypeColor(field.type) }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                  </svg>
                </span>
              )}
              <span className="schema-field-label">{field.name}</span>
            </div>
            <Badge 
              pill
              className="schema-field-type"
              style={{ backgroundColor: getFieldTypeColor(field.type) }}
            >
              {field.type}
            </Badge>
          </motion.div>
        ))}
        
        {fields.length > 4 && (
          <button 
            className="show-more-button"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Show less' : `Show ${fields.length - 4} more fields`}
          </button>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="schema-handle-source"
      />
    </motion.div>
  );
};

export default SchemaNode; 