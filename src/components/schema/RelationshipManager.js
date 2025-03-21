import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { motion } from 'framer-motion';

const RelationshipManager = ({ 
  isOpen, 
  onClose, 
  tables, 
  edges, 
  onAddRelationship, 
  onUpdateRelationship, 
  relationshipToEdit 
}) => {
  const [sourceTable, setSourceTable] = useState('');
  const [targetTable, setTargetTable] = useState('');
  const [sourceField, setSourceField] = useState('');
  const [targetField, setTargetField] = useState('');
  const [relationshipType, setRelationshipType] = useState('one-to-many');
  const [error, setError] = useState('');
  const [mode, setMode] = useState('create');

  useEffect(() => {
    if (relationshipToEdit) {
      // Populate form for editing
      setMode('edit');
      setSourceTable(relationshipToEdit.source || '');
      setTargetTable(relationshipToEdit.target || '');
      
      // Extract field information from the edge data if available
      if (relationshipToEdit.data && relationshipToEdit.data.sourceField) {
        setSourceField(relationshipToEdit.data.sourceField);
      } else {
        setSourceField('');
      }
      if (relationshipToEdit.data && relationshipToEdit.data.targetField) {
        setTargetField(relationshipToEdit.data.targetField);
      } else {
        setTargetField('');
      }
      if (relationshipToEdit.data && relationshipToEdit.data.relationship) {
        setRelationshipType(relationshipToEdit.data.relationship);
      } else {
        setRelationshipType('one-to-many');
      }
    } else {
      // Reset form for creating new relationship
      setMode('create');
      setSourceTable('');
      setTargetTable('');
      setSourceField('');
      setTargetField('');
      setRelationshipType('one-to-many');
    }
    setError('');
  }, [relationshipToEdit, isOpen]);

  const validateRelationship = () => {
    if (!sourceTable || !targetTable || !sourceField || !targetField) {
      setError('All fields are required');
      return false;
    }

    // Get the source and target field objects
    const sourceTableObj = tables.find(t => t.id === sourceTable);
    const targetTableObj = tables.find(t => t.id === targetTable);
    
    if (!sourceTableObj || !targetTableObj) {
      setError('Invalid tables selected');
      return false;
    }

    // Make sure data structure exists
    if (!sourceTableObj.data || !targetTableObj.data || 
        !sourceTableObj.data.fields || !targetTableObj.data.fields) {
      setError('Table data is invalid');
      return false;
    }

    const sourceFieldObj = sourceTableObj.data.fields.find(f => f.name === sourceField);
    const targetFieldObj = targetTableObj.data.fields.find(f => f.name === targetField);

    if (!sourceFieldObj || !targetFieldObj) {
      setError('Invalid fields selected');
      return false;
    }

    // Validation: Cannot relate timestamp/date fields with other fields
    if (
      (sourceFieldObj.type.toLowerCase().includes('timestamp') || 
       sourceFieldObj.type.toLowerCase().includes('date') || 
       sourceFieldObj.type.toLowerCase().includes('time')) && 
      !(targetFieldObj.type.toLowerCase().includes('timestamp') || 
       targetFieldObj.type.toLowerCase().includes('date') || 
       targetFieldObj.type.toLowerCase().includes('time'))
    ) {
      setError('Cannot relate timestamp/date fields with other field types');
      return false;
    }

    // Check if the primary key is properly matched with foreign key
    if (relationshipType === 'one-to-many' && !targetFieldObj.isPrimary && !sourceFieldObj.isForeign) {
      setError('One-to-many relationships should connect primary keys to foreign keys');
      return false;
    }

    // Check if trying to relate ID with created_at fields as per user request
    if (
      (sourceFieldObj.name.toLowerCase().includes('id') && targetFieldObj.name.toLowerCase().includes('created_at')) ||
      (targetFieldObj.name.toLowerCase().includes('id') && sourceFieldObj.name.toLowerCase().includes('created_at'))
    ) {
      setError('Cannot relate ID fields with created_at fields');
      return false;
    }

    // Check if a relationship already exists between these tables and fields
    const existingEdge = edges.find(edge => 
      (edge.source === sourceTable && edge.target === targetTable && 
       edge.data?.sourceField === sourceField && edge.data?.targetField === targetField) ||
      (edge.source === targetTable && edge.target === sourceTable && 
       edge.data?.sourceField === targetField && edge.data?.targetField === sourceField)
    );

    if (existingEdge && (mode === 'create' || !relationshipToEdit || relationshipToEdit.id !== existingEdge.id)) {
      setError('A relationship already exists between these fields');
      return false;
    }

    return true;
  };

  // Submit handler with requestAnimationFrame to avoid ResizeObserver issues
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    if (!validateRelationship()) {
      return;
    }

    const relationship = {
      source: sourceTable,
      target: targetTable,
      sourceField: sourceField,
      targetField: targetField,
      type: relationshipType
    };

    // Use requestAnimationFrame to prevent ResizeObserver issues
    window.requestAnimationFrame(() => {
      if (mode === 'edit' && relationshipToEdit) {
        onUpdateRelationship(relationshipToEdit.id, relationship);
      } else {
        onAddRelationship(relationship);
      }
      
      onClose();
    });
  }, [
    sourceTable, 
    targetTable, 
    sourceField, 
    targetField, 
    relationshipType, 
    mode, 
    relationshipToEdit, 
    onUpdateRelationship, 
    onAddRelationship, 
    onClose, 
    validateRelationship
  ]);

  return (
    <Modal show={isOpen} onHide={onClose} centered backdrop="static" size="lg">
      <Modal.Header 
        closeButton 
        style={{ 
          background: 'linear-gradient(145deg, #1e293b, #0f172a)', 
          color: 'white', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)' 
        }}
      >
        <Modal.Title>
          {mode === 'edit' ? 'Edit Relationship' : 'Create New Relationship'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ background: '#1e293b', color: 'white' }}>
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}
        
        <Form onSubmit={handleSubmit}>
          <div className="row mb-3">
            <div className="col-md-6">
              <Form.Group>
                <Form.Label>Source Table</Form.Label>
                <Form.Select 
                  value={sourceTable}
                  onChange={(e) => {
                    setSourceTable(e.target.value);
                    setSourceField(''); // Reset field when table changes
                  }}
                  style={{ 
                    background: '#0f172a', 
                    color: 'white', 
                    border: '1px solid rgba(255, 255, 255, 0.2)' 
                  }}
                >
                  <option value="">Select a table</option>
                  {tables.map(table => (
                    <option key={table.id} value={table.id}>
                      {table.data.tableName}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group>
                <Form.Label>Target Table</Form.Label>
                <Form.Select 
                  value={targetTable}
                  onChange={(e) => {
                    setTargetTable(e.target.value);
                    setTargetField(''); // Reset field when table changes
                  }}
                  style={{ 
                    background: '#0f172a', 
                    color: 'white', 
                    border: '1px solid rgba(255, 255, 255, 0.2)' 
                  }}
                >
                  <option value="">Select a table</option>
                  {tables.map(table => (
                    <option key={table.id} value={table.id}>
                      {table.data.tableName}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-6">
              <Form.Group>
                <Form.Label>Source Field</Form.Label>
                <Form.Select 
                  value={sourceField}
                  onChange={(e) => setSourceField(e.target.value)}
                  disabled={!sourceTable}
                  style={{ 
                    background: '#0f172a', 
                    color: 'white', 
                    border: '1px solid rgba(255, 255, 255, 0.2)' 
                  }}
                >
                  <option value="">Select a field</option>
                  {sourceTable && tables.find(t => t.id === sourceTable)?.data.fields.map(field => (
                    <option key={field.name} value={field.name}>
                      {field.name} ({field.type}){field.isPrimary ? ' - Primary Key' : ''}{field.isForeign ? ' - Foreign Key' : ''}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group>
                <Form.Label>Target Field</Form.Label>
                <Form.Select 
                  value={targetField}
                  onChange={(e) => setTargetField(e.target.value)}
                  disabled={!targetTable}
                  style={{ 
                    background: '#0f172a', 
                    color: 'white', 
                    border: '1px solid rgba(255, 255, 255, 0.2)' 
                  }}
                >
                  <option value="">Select a field</option>
                  {targetTable && tables.find(t => t.id === targetTable)?.data.fields.map(field => (
                    <option key={field.name} value={field.name}>
                      {field.name} ({field.type}){field.isPrimary ? ' - Primary Key' : ''}{field.isForeign ? ' - Foreign Key' : ''}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
          </div>

          <Form.Group className="mb-3">
            <Form.Label>Relationship Type</Form.Label>
            <div>
              <Form.Check
                inline
                type="radio"
                label="One-to-Many"
                name="relationshipType"
                id="one-to-many"
                checked={relationshipType === 'one-to-many'}
                onChange={() => setRelationshipType('one-to-many')}
                className="text-white"
              />
              <Form.Check
                inline
                type="radio"
                label="One-to-One"
                name="relationshipType"
                id="one-to-one"
                checked={relationshipType === 'one-to-one'}
                onChange={() => setRelationshipType('one-to-one')}
                className="text-white"
              />
              <Form.Check
                inline
                type="radio"
                label="Many-to-Many"
                name="relationshipType"
                id="many-to-many"
                checked={relationshipType === 'many-to-many'}
                onChange={() => setRelationshipType('many-to-many')}
                className="text-white"
              />
            </div>
          </Form.Group>

          <div className="mt-4 d-flex justify-content-between">
            <Button 
              variant="outline-light" 
              onClick={onClose}
              style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              style={{ 
                background: 'linear-gradient(145deg, #3b82f6, #2563eb)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' 
              }}
            >
              {mode === 'edit' ? 'Update Relationship' : 'Create Relationship'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default RelationshipManager; 