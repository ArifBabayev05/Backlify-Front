import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Form, InputGroup, Table, Alert } from 'react-bootstrap';
import { motion } from 'framer-motion';

const TableEditor = ({ isOpen, onClose, onSave, table }) => {
  const [tableName, setTableName] = useState('');
  const [fields, setFields] = useState([]);
  const [newField, setNewField] = useState({ 
    name: '', 
    type: 'VARCHAR', 
    isPrimary: false, 
    isForeign: false,
    constraints: [] 
  });
  const [error, setError] = useState('');
  const [mode, setMode] = useState('create');

  useEffect(() => {
    if (table) {
      // Editing existing table
      setMode('edit');
      setTableName(table.data.tableName);
      setFields(table.data.fields.map(field => ({ ...field })));
    } else {
      // Creating new table
      setMode('create');
      setTableName('');
      setFields([
        { name: 'id', type: 'UUID', isPrimary: true, isForeign: false, constraints: ['primary key', 'not null'] },
        { name: 'created_at', type: 'TIMESTAMP', isPrimary: false, isForeign: false, constraints: ['not null', 'default now()'] }
      ]);
    }
    setError('');
  }, [table, isOpen]);

  const handleFieldChange = (e, index, property) => {
    const updatedFields = [...fields];
    let value = e.target.value;
    
    if (property === 'isPrimary' || property === 'isForeign') {
      value = e.target.checked;
      
      // If setting a primary key, update constraints
      if (property === 'isPrimary' && value) {
        if (!updatedFields[index].constraints.includes('primary key')) {
          updatedFields[index].constraints.push('primary key');
        }
        
        // Only one primary key allowed
        updatedFields.forEach((field, i) => {
          if (i !== index && field.isPrimary) {
            field.isPrimary = false;
            field.constraints = field.constraints.filter(c => c !== 'primary key');
          }
        });
      } else if (property === 'isPrimary' && !value) {
        updatedFields[index].constraints = updatedFields[index].constraints.filter(c => c !== 'primary key');
      }
      
      // If setting a foreign key, update constraints
      if (property === 'isForeign' && value) {
        if (!updatedFields[index].constraints.includes('foreign key')) {
          updatedFields[index].constraints.push('foreign key');
        }
      } else if (property === 'isForeign' && !value) {
        updatedFields[index].constraints = updatedFields[index].constraints.filter(c => c.includes('foreign key'));
      }
    }
    
    updatedFields[index][property] = value;
    setFields(updatedFields);
  };

  const addField = () => {
    if (!newField.name.trim()) {
      setError('Field name is required');
      return;
    }
    
    // Check if field name already exists
    if (fields.some(field => field.name.toLowerCase() === newField.name.toLowerCase())) {
      setError('Field name already exists');
      return;
    }
    
    // Validate field name format
    const fieldNameRegex = /^[a-z][a-z0-9_]*$/i;
    if (!fieldNameRegex.test(newField.name)) {
      setError('Field name must start with a letter and contain only letters, numbers, and underscores');
      return;
    }
    
    // Update constraints based on field properties
    const constraints = [];
    if (newField.isPrimary) {
      constraints.push('primary key');
      
      // Only one primary key allowed
      const updatedFields = fields.map(field => ({
        ...field,
        isPrimary: false,
        constraints: field.constraints.filter(c => c !== 'primary key')
      }));
      setFields(updatedFields);
    }
    
    if (newField.isForeign) {
      constraints.push('foreign key');
    }
    
    setFields([...fields, { ...newField, constraints }]);
    setNewField({ name: '', type: 'VARCHAR', isPrimary: false, isForeign: false, constraints: [] });
    setError('');
  };

  const removeField = (index) => {
    // Don't allow removing the last field
    if (fields.length <= 1) {
      setError('Table must have at least one field');
      return;
    }
    
    // Don't allow removing the primary key if it's the only one
    if (fields[index].isPrimary && fields.filter(field => field.isPrimary).length <= 1) {
      setError('Cannot remove the only primary key');
      return;
    }
    
    const updatedFields = [...fields];
    updatedFields.splice(index, 1);
    setFields(updatedFields);
  };

  // Save table (create or update) with debounce to prevent ResizeObserver errors
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    if (!tableName.trim()) {
      setError('Table name is required');
      return;
    }
    
    // Validate table name format
    const tableNameRegex = /^[a-z][a-z0-9_]*$/i;
    if (!tableNameRegex.test(tableName)) {
      setError('Table name must start with a letter and contain only letters, numbers, and underscores');
      return;
    }
    
    // Ensure there's at least one field
    if (fields.length === 0) {
      setError('Table must have at least one field');
      return;
    }
    
    // Ensure there's at least one primary key
    if (!fields.some(field => field.isPrimary)) {
      setError('Table must have a primary key');
      return;
    }
    
    const tableData = {
      tableName,
      fields,
      id: mode === 'edit' ? table.id : `table-${Date.now()}`
    };
    
    // Wrap the save operation in requestAnimationFrame to avoid ResizeObserver issues
    window.requestAnimationFrame(() => {
      onSave(tableData, mode);
      onClose();
    });
  }, [tableName, fields, mode, table, onSave, onClose]);

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
          {mode === 'edit' ? 'Edit Table' : 'Create New Table'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ background: '#1e293b', color: 'white' }}>
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}
        
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Table Name</Form.Label>
            <Form.Control
              type="text"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="Enter table name"
              style={{ 
                background: '#0f172a', 
                color: 'white', 
                border: '1px solid rgba(255, 255, 255, 0.2)' 
              }}
            />
          </Form.Group>
          
          <div className="mb-3">
            <h5 className="border-bottom pb-2 text-white">Fields</h5>
            <Table responsive bordered variant="dark" style={{ background: '#0f172a', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Primary Key</th>
                  <th>Foreign Key</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => (
                  <tr key={index}>
                    <td>
                      <Form.Control
                        type="text"
                        value={field.name}
                        onChange={(e) => handleFieldChange(e, index, 'name')}
                        style={{ 
                          background: 'rgba(15, 23, 42, 0.7)', 
                          color: 'white', 
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                      />
                    </td>
                    <td>
                      <Form.Select
                        value={field.type}
                        onChange={(e) => handleFieldChange(e, index, 'type')}
                        style={{ 
                          background: 'rgba(15, 23, 42, 0.7)', 
                          color: 'white', 
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        <option value="VARCHAR">VARCHAR</option>
                        <option value="TEXT">TEXT</option>
                        <option value="INT">INT</option>
                        <option value="BIGINT">BIGINT</option>
                        <option value="FLOAT">FLOAT</option>
                        <option value="BOOLEAN">BOOLEAN</option>
                        <option value="DATE">DATE</option>
                        <option value="TIMESTAMP">TIMESTAMP</option>
                        <option value="UUID">UUID</option>
                        <option value="JSONB">JSONB</option>
                      </Form.Select>
                    </td>
                    <td className="text-center">
                      <Form.Check
                        type="checkbox"
                        checked={field.isPrimary}
                        onChange={(e) => handleFieldChange(e, index, 'isPrimary')}
                      />
                    </td>
                    <td className="text-center">
                      <Form.Check
                        type="checkbox"
                        checked={field.isForeign}
                        onChange={(e) => handleFieldChange(e, index, 'isForeign')}
                      />
                    </td>
                    <td className="text-center">
                      <Button 
                        variant="danger" 
                        size="sm"
                        onClick={() => removeField(index)}
                        style={{ background: '#ef4444', border: 'none' }}
                      >
                        <i className="bi bi-trash"></i> Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          
          <div className="mb-4">
            <h5 className="border-bottom pb-2 text-white">Add New Field</h5>
            <div className="row align-items-end">
              <div className="col-md-3">
                <Form.Group>
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={newField.name}
                    onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                    placeholder="Field name"
                    style={{ 
                      background: '#0f172a', 
                      color: 'white', 
                      border: '1px solid rgba(255, 255, 255, 0.2)' 
                    }}
                  />
                </Form.Group>
              </div>
              <div className="col-md-3">
                <Form.Group>
                  <Form.Label>Type</Form.Label>
                  <Form.Select
                    value={newField.type}
                    onChange={(e) => setNewField({ ...newField, type: e.target.value })}
                    style={{ 
                      background: '#0f172a', 
                      color: 'white', 
                      border: '1px solid rgba(255, 255, 255, 0.2)' 
                    }}
                  >
                    <option value="VARCHAR">VARCHAR</option>
                    <option value="TEXT">TEXT</option>
                    <option value="INT">INT</option>
                    <option value="BIGINT">BIGINT</option>
                    <option value="FLOAT">FLOAT</option>
                    <option value="BOOLEAN">BOOLEAN</option>
                    <option value="DATE">DATE</option>
                    <option value="TIMESTAMP">TIMESTAMP</option>
                    <option value="UUID">UUID</option>
                    <option value="JSONB">JSONB</option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-2 text-center">
                <Form.Group>
                  <Form.Label>Primary Key</Form.Label>
                  <div>
                    <Form.Check
                      type="checkbox"
                      checked={newField.isPrimary}
                      onChange={(e) => setNewField({ ...newField, isPrimary: e.target.checked })}
                    />
                  </div>
                </Form.Group>
              </div>
              <div className="col-md-2 text-center">
                <Form.Group>
                  <Form.Label>Foreign Key</Form.Label>
                  <div>
                    <Form.Check
                      type="checkbox"
                      checked={newField.isForeign}
                      onChange={(e) => setNewField({ ...newField, isForeign: e.target.checked })}
                    />
                  </div>
                </Form.Group>
              </div>
              <div className="col-md-2">
                <Button 
                  variant="success" 
                  className="w-100"
                  onClick={addField}
                  style={{ 
                    background: 'linear-gradient(145deg, #10b981, #059669)',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' 
                  }}
                >
                  Add Field
                </Button>
              </div>
            </div>
          </div>
          
          <div className="d-flex justify-content-between">
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
              {mode === 'edit' ? 'Update Table' : 'Create Table'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default TableEditor; 