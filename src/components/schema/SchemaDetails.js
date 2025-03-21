import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Form, Button } from 'react-bootstrap';

const SchemaDetails = ({ node, onClose, onModifyPrompt }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tableName, setTableName] = useState(node.data.tableName);
  const [fields, setFields] = useState([...node.data.fields]);
  const [newField, setNewField] = useState({ name: '', type: 'VARCHAR' });

  // Field types for the dropdown
  const fieldTypes = [
    'VARCHAR', 'TEXT', 'INT', 'BIGINT', 'FLOAT', 'DOUBLE', 
    'DECIMAL', 'BOOLEAN', 'DATE', 'TIMESTAMP', 'JSON'
  ];

  const handleSave = () => {
    // Here we would update the node data
    // For this demo, we'll just close the panel
    setIsEditing(false);
    // In a real implementation, you would update the node data here
  };

  const handleAddField = () => {
    if (newField.name.trim() === '') return;
    setFields([...fields, { ...newField }]);
    setNewField({ name: '', type: 'VARCHAR' });
  };

  const handleDeleteField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleUpdatePrompt = () => {
    // Example of natural language prompt update based on table changes
    const fieldDesc = fields.map(f => `${f.name} (${f.type})`).join(', ');
    const promptUpdate = `Update the ${tableName} table to have fields: ${fieldDesc}`;
    onModifyPrompt(promptUpdate);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="position-absolute glassmorphism p-3 rounded"
        style={{ top: '16px', right: '16px', width: '320px', zIndex: 20 }}
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 100, opacity: 0 }}
      >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="fs-5 fw-semibold text-white mb-0">
            {isEditing ? 'Edit Table' : 'Table Details'}
          </h3>
          <button 
            onClick={onClose}
            className="btn btn-sm btn-close btn-close-white"
            aria-label="Close"
          >
          </button>
        </div>
        
        {/* Table Name */}
        <div className="mb-3">
          <Form.Label className="text-white-50 small">Table Name</Form.Label>
          {isEditing ? (
            <Form.Control
              type="text"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              className="glassmorphism border-0 py-1 px-2 small text-white bg-transparent"
              size="sm"
            />
          ) : (
            <div className="p-2 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white' }}>
              {tableName}
            </div>
          )}
        </div>
        
        {/* Fields */}
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <Form.Label className="text-white-50 small mb-0">Fields</Form.Label>
            {isEditing && (
              <Button 
                variant="outline-primary"
                size="sm"
                onClick={handleAddField}
                className="py-0 px-2"
                style={{ fontSize: '0.75rem' }}
              >
                Add Field
              </Button>
            )}
          </div>
          
          {isEditing && (
            <div className="d-flex gap-2 mb-3">
              <Form.Control
                type="text"
                placeholder="Field name"
                value={newField.name}
                onChange={(e) => setNewField({...newField, name: e.target.value})}
                className="glassmorphism border-0 py-1 px-2 small text-white bg-transparent"
                size="sm"
              />
              <Form.Select
                value={newField.type}
                onChange={(e) => setNewField({...newField, type: e.target.value})}
                className="glassmorphism border-0 py-1 px-2 small text-white bg-transparent w-50"
                size="sm"
              >
                {fieldTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </Form.Select>
            </div>
          )}
          
          <div className="overflow-auto" style={{ maxHeight: '160px' }}>
            {fields.map((field, index) => (
              <motion.div 
                key={index}
                className="d-flex justify-content-between align-items-center rounded p-2 mb-1"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div>
                  <span className="text-white small">{field.name}</span>
                  <span className="ms-2 small" style={{ color: 'rgba(59, 130, 246, 0.7)' }}>{field.type}</span>
                </div>
                
                {isEditing && (
                  <button
                    onClick={() => handleDeleteField(index)}
                    className="btn btn-sm"
                    style={{ color: '#f87171', padding: '0 0.25rem' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* Actions */}
        <div className="d-flex justify-content-between pt-2 border-top" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          {isEditing ? (
            <>
              <Button
                variant="link"
                size="sm"
                className="text-white-50"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
              >
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="link"
                size="sm"
                className="text-white-50 d-flex align-items-center gap-1 p-0"
                onClick={() => setIsEditing(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Edit
              </Button>
              <Button
                variant="success"
                size="sm"
                onClick={handleUpdatePrompt}
                className="d-flex align-items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                Update Prompt
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SchemaDetails; 