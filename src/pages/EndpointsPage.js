import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Container, Row, Col, Button, Nav, Form, Modal, Alert, Spinner, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import LoadingAnimation from '../components/common/LoadingAnimation';

// Method colors for visual differentiation
const methodColors = {
  GET: 'bg-primary',
  POST: 'bg-success',
  PUT: 'bg-warning',
  DELETE: 'bg-danger',
  PATCH: 'bg-info'
};

const EndpointsPage = () => {
  const [endpoints, setEndpoints] = useState([]);
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [apiId, setApiId] = useState('');
  const [userId, setUserId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [swaggerUrl, setSwaggerUrl] = useState('');
  const navigate = useNavigate();
  
  // CRUD operation states
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // create, read, update, delete
  const [formData, setFormData] = useState({});
  const [resourceId, setResourceId] = useState('');
  const [operationResult, setOperationResult] = useState({ show: false, success: false, message: '', data: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [records, setRecords] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableData, setTableData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  
  // Format conversion helpers
  const defaultValueForType = (type) => {
    if (type.includes('varchar') || type.includes('text')) return '';
    if (type.includes('int')) return 0;
    if (type.includes('bool')) return false;
    if (type.includes('timestamp') || type.includes('date')) return new Date().toISOString();
    if (type.includes('uuid')) return '';
    return '';
  };

  useEffect(() => {
    // Get real endpoints data from sessionStorage
    const storedEndpoints = sessionStorage.getItem('apiEndpoints');
    
    if (storedEndpoints) {
      try {
        const endpointsData = JSON.parse(storedEndpoints);
        console.log('Loaded API endpoints:', endpointsData);
        
        if (endpointsData.success) {
          setApiId(endpointsData.apiId);
          setUserId(endpointsData.userId);
          setSwaggerUrl(`http://localhost:3000${endpointsData.swagger_url}`);
          
          // Transform endpoints into a more usable format
          const transformedEndpoints = endpointsData.endpoints.map(endpoint => {
            return {
              name: endpoint.table.charAt(0).toUpperCase() + endpoint.table.slice(1),
              baseUrl: `/api/${endpointsData.apiId}/${endpoint.table}`,
              table: endpoint.table,
              endpoints: endpoint.routes.map(route => {
                // Determine auth and description based on method and path
                const auth = route.method !== 'GET';
                let description = '';
                
                switch(route.method) {
                  case 'GET':
                    description = route.path.includes(':id') 
                      ? `Get a single ${endpoint.table} by ID` 
                      : `List all ${endpoint.table}`;
                    break;
                  case 'POST':
                    description = `Create a new ${endpoint.table}`;
                    break;
                  case 'PUT':
                    description = `Update an existing ${endpoint.table}`;
                    break;
                  case 'DELETE':
                    description = `Delete a ${endpoint.table}`;
                    break;
                  default:
                    description = route.path;
                }
                
                return {
                  method: route.method,
                  path: route.path,
                  description,
                  auth,
                  fullPath: `http://localhost:3000/api/${endpointsData.apiId}${route.path}`
                };
              })
            };
          });
          
          setEndpoints(transformedEndpoints);
          setApiBaseUrl(`http://localhost:3000/api/${endpointsData.apiId}`);
          
          // Set the first table as selected by default
          if (transformedEndpoints.length > 0) {
            setSelectedTable(transformedEndpoints[0].table);
          }
        }
      } catch (error) {
        console.error('Error parsing endpoints data:', error);
      }
    } else {
      // Fallback to mock data or empty state
      console.warn('No API endpoints found in sessionStorage');
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Load table data when selected table changes
    if (selectedTable && apiBaseUrl) {
      loadTableData(selectedTable);
    }
  }, [selectedTable, apiBaseUrl]);

  const loadTableData = async (table, page = 1, limit = 10) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`${apiBaseUrl}/${table}?page=${page}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data?.data)) {
        setTableData(data.data);
        setPagination({
          page: data.pagination?.page || 1,
          limit: data.pagination?.limit || 10,
          total: data.pagination?.total || data.data.length
        });
      } else {
        setTableData([]);
        setPagination({ page: 1, limit: 10, total: 0 });
      }
    } catch (error) {
      console.error(`Error loading ${table} data:`, error);
      setTableData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTable = (table) => {
    setSelectedTable(table);
  };

  const handleGoBack = () => {
    navigate('/schema');
  };

  const handleOpenModal = (mode, endpoint, record = null) => {
    setModalMode(mode);
    setSelectedEndpoint(endpoint);
    
    // Reset states
    setOperationResult({ show: false, success: false, message: '', data: null });
    
    // Initialize form data based on mode
    if (mode === 'create') {
      // For create, initialize with empty values based on table schema
      const initialFormData = {};
      // In a real app, you'd get the schema from your API or schema data
      // For now, we'll use a simple approach
      if (record) {
        // If we have a record template, use its structure
        Object.keys(record).forEach(key => {
          initialFormData[key] = '';
        });
      } else {
        // Fallback to basic fields if no record template
        initialFormData.id = '';
        // Add common fields for all tables
        initialFormData.created_at = new Date().toISOString();
        initialFormData.updated_at = new Date().toISOString();
      }
      setFormData(initialFormData);
      setResourceId('');
    } else if (mode === 'read' || mode === 'update' || mode === 'delete') {
      // For other modes, use the provided record data
      if (record) {
        setFormData({ ...record });
        setResourceId(record.id || '');
      }
    }
    
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedEndpoint(null);
    setFormData({});
    setResourceId('');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setOperationResult({ show: false, success: false, message: '', data: null });
    
    try {
      let url = '';
      let method = '';
      let body = null;
      
      const tableName = selectedEndpoint.table;
      
      switch (modalMode) {
        case 'create':
          url = `${apiBaseUrl}/${tableName}`;
          method = 'POST';
          body = formData;
          break;
        case 'read':
          url = `${apiBaseUrl}/${tableName}/${resourceId}`;
          method = 'GET';
          break;
        case 'update':
          url = `${apiBaseUrl}/${tableName}/${resourceId}`;
          method = 'PUT';
          body = formData;
          break;
        case 'delete':
          url = `${apiBaseUrl}/${tableName}/${resourceId}`;
          method = 'DELETE';
          break;
        default:
          throw new Error('Invalid operation mode');
      }
      
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };
      
      if (body) {
        options.body = JSON.stringify(body);
      }
      
      console.log(`Making ${method} request to ${url}`, options);
      
      const response = await fetch(url, options);
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || `Operation failed: ${response.statusText}`);
      }
      
      // Handle successful operation
      let message = '';
      switch (modalMode) {
        case 'create':
          message = `${selectedEndpoint.name} created successfully!`;
          break;
        case 'read':
          message = `${selectedEndpoint.name} retrieved successfully!`;
          break;
        case 'update':
          message = `${selectedEndpoint.name} updated successfully!`;
          break;
        case 'delete':
          message = `${selectedEndpoint.name} deleted successfully!`;
          break;
      }
      
      setOperationResult({
        show: true,
        success: true,
        message,
        data: responseData
      });
      
      // Reload table data if we modified anything
      if (modalMode !== 'read') {
        loadTableData(tableName);
      }
      
      // Close modal automatically for delete operations
      if (modalMode === 'delete') {
        setTimeout(() => {
          handleCloseModal();
        }, 1500);
      }
      
    } catch (error) {
      console.error('Operation error:', error);
      setOperationResult({
        show: true,
        success: false,
        message: `Error: ${error.message}`,
        data: null
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter endpoints by HTTP method
  const filteredEndpoints = endpoints.map(group => ({
    ...group,
    endpoints: group.endpoints.filter(endpoint => 
      selectedFilter === 'all' || endpoint.method === selectedFilter
    )
  })).filter(group => group.endpoints.length > 0);

  const handleSwaggerDownload = () => {
    window.open(swaggerUrl, '_blank');
  };

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ 
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    }}>
      {/* Header */}
      <header className="p-3 d-flex align-items-center justify-content-between" style={{ 
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        zIndex: 20 
      }}>
        <div>
          <h1 className="fs-4 fw-bold text-white mb-0 d-flex align-items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="me-2 text-primary">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            API Endpoints
          </h1>
          <p className="small mb-0" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            Generated API endpoints for your database schema — User ID: {userId}
          </p>
        </div>
        
        <div className="d-flex align-items-center gap-3">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              variant="outline-primary"
              onClick={handleGoBack}
              className="px-3 py-2"
              style={{ 
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white'
              }}
            >
              <span className="d-flex align-items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="me-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
                Back to Schema
              </span>
            </Button>
          </motion.div>
        </div>
      </header>
      
      {/* Filter Tabs */}
      <div className="d-flex justify-content-between align-items-center p-3" style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div className="d-flex gap-3 align-items-center">
          <div className="p-1 rounded bg-dark bg-opacity-50">
            <Nav variant="pills" className="d-flex">
              {['all', 'GET', 'POST', 'PUT', 'DELETE'].map(filter => (
                <Nav.Item key={filter}>
                  <Nav.Link 
                    className={`px-3 py-1 mx-1 ${selectedFilter === filter ? 'bg-primary' : 'text-white-50'}`}
                    onClick={() => setSelectedFilter(filter)}
                    active={selectedFilter === filter}
                  >
                    {filter === 'all' ? 'All' : filter}
                  </Nav.Link>
                </Nav.Item>
              ))}
            </Nav>
          </div>
          
          <div className="text-white-50 small">
            API Base URL: <span className="font-monospace text-light">{apiBaseUrl}</span>
          </div>
        </div>
        
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            variant="outline-info"
            onClick={handleSwaggerDownload}
            className="px-3 py-2"
            style={{ borderColor: 'rgba(14, 165, 233, 0.5)', color: '#38bdf8' }}
          >
            <span className="d-flex align-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="me-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View Swagger Docs
            </span>
          </Button>
        </motion.div>
      </div>
      
      {/* Main Content with Tables and Endpoints */}
      <div className="flex-grow-1 d-flex">
        {/* Left Panel - Data View */}
        <div className="flex-grow-1 p-4" style={{ borderRight: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fs-5 fw-bold text-white mb-0">Table Explorer</h2>
            
            <div className="d-flex gap-2">
              <Nav variant="pills" className="d-flex">
                {endpoints.map(endpoint => (
                  <Nav.Item key={endpoint.table}>
                    <Nav.Link 
                      className={selectedTable === endpoint.table ? 'bg-primary' : 'text-white-50'}
                      onClick={() => handleSelectTable(endpoint.table)}
                      active={selectedTable === endpoint.table}
                    >
                      {endpoint.name}
                    </Nav.Link>
                  </Nav.Item>
                ))}
              </Nav>
              
              {selectedTable && (
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    variant="success"
                    onClick={() => {
                      // Find the endpoint for the selected table
                      const endpoint = endpoints.find(e => e.table === selectedTable);
                      // Find a template record if we have table data
                      const template = tableData.length > 0 ? tableData[0] : null;
                      handleOpenModal('create', endpoint, template);
                    }}
                    className="px-3 py-2"
                    size="sm"
                  >
                    <span className="d-flex align-items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="me-1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Add New
                    </span>
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
          
          {isLoading ? (
            <div className="d-flex justify-content-center py-5">
              <LoadingAnimation />
            </div>
          ) : tableData.length > 0 ? (
            <>
              <div className="bg-dark rounded overflow-hidden">
                <Table responsive striped hover variant="dark" className="mb-0">
                  <thead>
                    <tr>
                      {Object.keys(tableData[0]).map(key => (
                        <th key={key}>{key}</th>
                      ))}
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((record, index) => (
                      <tr key={index}>
                        {Object.entries(record).map(([key, value]) => (
                          <td key={key}>
                            {typeof value === 'object' 
                              ? JSON.stringify(value).substring(0, 30) + (JSON.stringify(value).length > 30 ? '...' : '')
                              : String(value).substring(0, 30) + (String(value).length > 30 ? '...' : '')}
                          </td>
                        ))}
                        <td className="text-end">
                          <div className="btn-group">
                            <Button 
                              variant="outline-info" 
                              size="sm"
                              onClick={() => {
                                const endpoint = endpoints.find(e => e.table === selectedTable);
                                handleOpenModal('read', endpoint, record);
                              }}
                            >
                              View
                            </Button>
                            <Button 
                              variant="outline-warning" 
                              size="sm"
                              onClick={() => {
                                const endpoint = endpoints.find(e => e.table === selectedTable);
                                handleOpenModal('update', endpoint, record);
                              }}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => {
                                const endpoint = endpoints.find(e => e.table === selectedTable);
                                handleOpenModal('delete', endpoint, record);
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              
              {/* Pagination */}
              <div className="d-flex justify-content-between align-items-center mt-3">
                <div className="text-white-50 small">
                  Showing {tableData.length} of {pagination.total} records
                </div>
                
                <div className="btn-group">
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => loadTableData(selectedTable, pagination.page - 1)}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                    onClick={() => loadTableData(selectedTable, pagination.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center p-5" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 text-primary opacity-75">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="mb-0">No records found in this table</p>
              <p className="small mb-3">Try creating a new record or selecting another table</p>
              
              <Button 
                variant="outline-primary"
                onClick={() => {
                  const endpoint = endpoints.find(e => e.table === selectedTable);
                  handleOpenModal('create', endpoint);
                }}
              >
                Create New Record
              </Button>
            </div>
          )}
        </div>
        
        {/* Right Panel - Endpoints Documentation */}
        <div className="p-4" style={{ width: '400px', borderLeft: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <h2 className="fs-5 fw-bold text-white mb-4">API Reference</h2>
          
          {isLoading ? (
            <div className="d-flex justify-content-center py-5">
              <LoadingAnimation />
            </div>
          ) : (
            <div className="d-flex flex-column gap-4">
              {filteredEndpoints.map(group => (
                <div key={group.name} className="bg-dark bg-opacity-50 rounded overflow-hidden">
                  <div className="p-3 border-bottom" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                    <h3 className="fs-6 fw-bold text-white mb-0">{group.name}</h3>
                    <p className="small text-white-50 mb-0 font-monospace">{group.baseUrl}</p>
                  </div>
                  
                  <div>
                    {group.endpoints.map((endpoint, i) => (
                      <div
                        key={`${group.name}-${i}`}
                        className="p-3 border-bottom hover-highlight" 
                        style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
                      >
                        <div className="d-flex align-items-start gap-2">
                          <span className={`badge ${methodColors[endpoint.method]} text-white px-2 py-1`}>
                            {endpoint.method}
                          </span>
                          <div className="flex-grow-1">
                            <div className="font-monospace small mb-1" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                              {endpoint.path}
                            </div>
                            <p className="small mb-0" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{endpoint.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* CRUD Operation Modal */}
      <Modal 
        show={showModal} 
        onHide={handleCloseModal}
        centered
        backdrop="static"
        size={modalMode === 'read' ? 'lg' : 'md'}
        contentClassName="bg-dark text-white border-secondary"
      >
        <Modal.Header closeButton closeVariant="white" className="border-secondary">
          <Modal.Title>
            {modalMode === 'create' && `Create New ${selectedEndpoint?.name?.slice(0, -1) || 'Record'}`}
            {modalMode === 'read' && `View ${selectedEndpoint?.name?.slice(0, -1) || 'Record'}`}
            {modalMode === 'update' && `Update ${selectedEndpoint?.name?.slice(0, -1) || 'Record'}`}
            {modalMode === 'delete' && `Delete ${selectedEndpoint?.name?.slice(0, -1) || 'Record'}`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Operation result message */}
          {operationResult.show && (
            <Alert variant={operationResult.success ? 'success' : 'danger'} className="mb-3">
              {operationResult.message}
            </Alert>
          )}
          
          {modalMode === 'delete' ? (
            <div className="text-center py-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-danger mx-auto mb-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="mb-0">Are you sure you want to delete this record?</p>
              <p className="small text-white-50 mb-0">This action cannot be undone.</p>
            </div>
          ) : (
            <Form onSubmit={handleSubmit}>
              {Object.entries(formData).map(([key, value]) => (
                <Form.Group key={key} className="mb-3">
                  <Form.Label>{key}</Form.Label>
                  <Form.Control
                    type="text"
                    name={key}
                    value={value || ''}
                    onChange={handleFormChange}
                    disabled={modalMode === 'read' || key === 'id' || key === 'created_at' || key === 'updated_at'}
                    className="bg-dark text-white border-secondary"
                  />
                </Form.Group>
              ))}
              
              {modalMode === 'read' && operationResult.data && (
                <div className="bg-black p-3 rounded">
                  <pre className="mb-0 text-success small">
                    {JSON.stringify(operationResult.data, null, 2)}
                  </pre>
                </div>
              )}
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer className="border-secondary">
          <Button variant="secondary" onClick={handleCloseModal}>
            {modalMode === 'read' ? 'Close' : 'Cancel'}
          </Button>
          
          {modalMode !== 'read' && (
            <Button 
              variant={modalMode === 'create' ? 'success' : modalMode === 'update' ? 'warning' : 'danger'}
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                  Processing...
                </>
              ) : (
                <>
                  {modalMode === 'create' && 'Create'}
                  {modalMode === 'update' && 'Update'}
                  {modalMode === 'delete' && 'Delete'}
                </>
              )}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
      
    
      {/* Loading overlay */}
      {isLoading && !tableData.length && <LoadingAnimation />}
      
      <style jsx="true">{`
        .hover-highlight:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }
      `}</style>
    </div>
  );
};

export default EndpointsPage; 