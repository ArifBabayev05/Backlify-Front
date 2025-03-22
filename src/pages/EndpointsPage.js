import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Container, Row, Col, Button, Nav, Form, Modal, Alert, Spinner, Table, Badge, Card, Tooltip, OverlayTrigger } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import LoadingAnimation from '../components/common/LoadingAnimation';

// Method colors for visual differentiation
const methodColors = {
  GET: { bg: '#3b82f6', color: 'white', hover: '#2563eb' },
  POST: { bg: '#10b981', color: 'white', hover: '#059669' },
  PUT: { bg: '#f59e0b', color: 'white', hover: '#d97706' },
  DELETE: { bg: '#ef4444', color: 'white', hover: '#dc2626' },
  PATCH: { bg: '#8b5cf6', color: 'white', hover: '#7c3aed' }
};

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } }
};

const slideIn = {
  hidden: { x: 20, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.4 } }
};

const staggerItems = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
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
  const [tableSchemas, setTableSchemas] = useState({});
  const [submitError, setSubmitError] = useState('');
  
  // Format conversion helpers
  const defaultValueForType = (type) => {
    if (type.includes('varchar') || type.includes('text')) return '';
    if (type.includes('int')) return 0;
    if (type.includes('bool')) return false;
    if (type.includes('timestamp') || type.includes('date')) return new Date().toISOString();
    if (type.includes('uuid')) return '';
    return '';
  };

  // Format field names for display (convert snake_case to Title Case)
  const formatFieldName = (key) => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format datetime values for datetime-local input
  const formatDateTimeForInput = (value) => {
    if (!value) return '';
    
    try {
      // Handle ISO string format (with timezone info)
      if (typeof value === 'string' && value.includes('T') && value.includes('Z')) {
        // Convert to local datetime format without seconds
        const date = new Date(value);
        if (isNaN(date.getTime())) return '';
        
        return date.toISOString().slice(0, 16);
      }
      
      // Handle simple date strings
      if (typeof value === 'string' && value.includes('-')) {
        // Add time component if missing
        if (!value.includes('T')) {
          return `${value}T00:00`;
        }
        
        // Truncate to minutes precision if needed
        return value.slice(0, 16);
      }
    } catch (error) {
      console.error('Error formatting date for input:', error);
    }
    
    return '';
  };

  // Get field notes for specific fields
  const getFieldNote = (key) => {
    const notesMap = {
      'id': 'Unique identifier (auto-generated)',
      'user_id': 'User identifier for ownership',
      'created_at': 'Creation timestamp (auto-generated)',
      'updated_at': 'Last update timestamp (auto-updated)',
      'email': 'Must be a valid email address',
      'password': 'Must be at least 8 characters',
      'phone': 'Phone number in international format'
    };
    
    // Return note for exact match
    if (notesMap[key]) return notesMap[key];
    
    // Return notes for keys ending with common patterns
    if (key.endsWith('_id')) return 'Reference to another record';
    if (key.endsWith('_at')) return 'Timestamp field';
    
    return '';
  };

  useEffect(() => {
    // Get real endpoints data from sessionStorage
    const storedEndpoints = sessionStorage.getItem('apiEndpoints');
    
    const loadEndpointsData = async () => {
      setIsLoading(true);
      
      try {
        if (!storedEndpoints) {
          console.warn('No API endpoints found in sessionStorage');
          setIsLoading(false);
          // Redirect back to the schema page if no endpoints are found
          navigate('/schema');
          return;
        }
        
        const endpointsData = JSON.parse(storedEndpoints);
        console.log('Loaded API endpoints:', endpointsData);
        
        if (!endpointsData || !endpointsData.success) {
          console.error('Invalid endpoints data:', endpointsData);
          setIsLoading(false);
          // Redirect back to the schema page if endpoints data is invalid
          navigate('/schema');
          return;
        }
        
        // Set basic data first
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
        
        // Set endpoints data
        setEndpoints(transformedEndpoints);
        setApiBaseUrl(`http://localhost:3000/api/${endpointsData.apiId}`);
        
        // First check if we have at least one endpoint
        if (!transformedEndpoints.length) {
          console.error('No endpoints available');
          setIsLoading(false);
          navigate('/schema');
          return;
        }

        // Set the first table as selected by default
        setSelectedTable(transformedEndpoints[0].table);

        // Check if the API is ready with retries
        const testUrl = `http://localhost:3000/api/${endpointsData.apiId}/${transformedEndpoints[0].table}?limit=1`;
        let apiReady = false;
        let apiCheckAttempts = 0;
        const maxApiCheckAttempts = 5;
        
        while (!apiReady && apiCheckAttempts < maxApiCheckAttempts) {
          console.log(`Checking API readiness (attempt ${apiCheckAttempts + 1}/${maxApiCheckAttempts})`);
          
          apiReady = await checkApiReady(testUrl);
          
          if (apiReady) {
            console.log('API is ready to use!');
            break;
          }
          
          // Wait a bit before trying again
          console.log(`API not ready, waiting before retry...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          apiCheckAttempts++;
        }
        
        if (!apiReady) {
          console.error('API is not ready after multiple attempts, redirecting to schema page');
          setIsLoading(false);
          // Signal to schema page that API isn't ready yet
          sessionStorage.setItem('api_not_ready', 'true');
          navigate('/schema');
          return;
        }

        // If we made it here, the API is ready, so we can fetch schemas
        const schemas = {};
        let fetchError = false;
        
        // Fetch schemas for each table (up to 3 attempts per table with a delay)
        for (const endpoint of transformedEndpoints) {
          let attempts = 0;
          const maxAttempts = 3;
          
          while (attempts < maxAttempts) {
            try {
              console.log(`Fetching schema for table: ${endpoint.table} (attempt ${attempts + 1}/${maxAttempts})`);
              
              const dataResponse = await fetch(`http://localhost:3000/api/${endpointsData.apiId}/${endpoint.table}?limit=1`);
              
              if (!dataResponse.ok) {
                console.error(`Error fetching schema for ${endpoint.table}: ${dataResponse.status} ${dataResponse.statusText}`);
                
                // If we've reached max attempts, mark as error and continue to next table
                if (attempts === maxAttempts - 1) {
                  fetchError = true;
                  break;
                }
                
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, 1000));
                attempts++;
                continue;
              }
              
              const dataText = await dataResponse.text();
              
              try {
                if (!dataText || dataText.trim() === '') {
                  console.warn(`Empty response for ${endpoint.table}`);
                  break; // Move to next table
                }
                
                // Try to parse the response as JSON
                const data = JSON.parse(dataText);
                console.log(`Data for ${endpoint.table}:`, data);
                
                // Check if we have data to infer schema from
                if (data && data.data && data.data.length > 0) {
                  const record = data.data[0];
                  const schema = {};
                  
                  Object.keys(record).forEach(key => {
                    let type = typeof record[key];
                    if (type === 'string' && key.includes('date')) {
                      type = 'date';
                    } else if (key === 'id' || key.endsWith('_id')) {
                      type = 'uuid';
                    }
                    
                    schema[key] = { type, required: key === 'id' };
                  });
                  
                  schemas[endpoint.table] = schema;
                  console.log(`Inferred schema for ${endpoint.table}:`, schema);
                  break; // Success - exit retry loop
                } else {
                  console.log(`No data available for ${endpoint.table} to infer schema`);
                  break; // Move to next table
                }
              } catch (parseError) {
                console.error(`Error parsing response for ${endpoint.table}:`, parseError);
                console.log(`Raw response:`, dataText);
                
                // If we've reached max attempts, mark as error and continue to next table
                if (attempts === maxAttempts - 1) {
                  fetchError = true;
                  break;
                }
                
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, 1000));
                attempts++;
              }
            } catch (error) {
              console.error(`Error fetching schema for ${endpoint.table}:`, error);
              
              // If we've reached max attempts, mark as error and continue to next table
              if (attempts === maxAttempts - 1) {
                fetchError = true;
                break;
              }
              
              // Wait before retrying
              await new Promise(resolve => setTimeout(resolve, 1000));
              attempts++;
            }
          }
        }
        
        // Update table schemas with what we've found
        setTableSchemas(schemas);
        console.log('All schemas loaded:', schemas);
        
        // If there were errors fetching schemas, still allow the page to load
        // but maintain the loading state for a short time to ensure UI is ready
        if (fetchError) {
          console.warn('Some schemas could not be loaded, but continuing');
          setTimeout(() => {
            setIsLoading(false);
          }, 1000);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading endpoints data:', error);
        setIsLoading(false);
        // Navigate back to schema page on error
        navigate('/schema');
      }
    };
    
    loadEndpointsData();
  }, [navigate]);

  useEffect(() => {
    // Load table data when selected table changes
    if (selectedTable && apiBaseUrl) {
      loadTableData(selectedTable);
    }
  }, [selectedTable, apiBaseUrl]);

  const loadTableData = async (table, page = 1, limit = 10) => {
    if (!table || !apiBaseUrl) {
      console.log('Cannot load table data: missing table or API base URL');
      return;
    }
    
    setIsLoading(true);
    setTableData([]);
    
    try {
      const url = `${apiBaseUrl}/${table}?page=${page}&limit=${limit}`;
      console.log(`Loading table data from: ${url}`);
      
      const response = await fetch(url);
      const responseText = await response.text();
      
      try {
        // Try to parse the response as JSON
        const data = JSON.parse(responseText);
        console.log(`Received data for ${table}:`, data);
        
        if (Array.isArray(data?.data)) {
          setTableData(data.data);
          setPagination({
            page: data.pagination?.page || 1,
            limit: data.pagination?.limit || 10,
            total: data.pagination?.total || data.data.length
          });
        } else if (Array.isArray(data)) {
          // Some APIs might return the array directly without a data wrapper
          setTableData(data);
          setPagination({
            page: 1,
            limit: limit,
            total: data.length
          });
        } else {
          console.warn(`Unexpected data format for ${table}:`, data);
          setTableData([]);
          setPagination({ page: 1, limit: 10, total: 0 });
        }
      } catch (parseError) {
        console.error(`Error parsing response for ${table}:`, parseError);
        console.log(`Raw response:`, responseText);
        setTableData([]);
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
    // Navigate back to the schema page but signal that we need to do a fresh load
    sessionStorage.setItem('reload_schema', 'true');
    navigate('/schema');
  };

  // Function to check if the API endpoint is ready
  const checkApiReady = async (url) => {
    try {
      console.log(`Testing API endpoint: ${url}`);
      const response = await fetch(url, { 
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      // If we get any response, even an error, the API is at least running
      if (response) {
        console.log(`API endpoint responded with status: ${response.status}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`API endpoint not ready: ${error.message}`);
      return false;
    }
  };

  // Add a helper function to generate a UUID
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handleOpenModal = async (mode, endpoint, record = null) => {
    if (!endpoint) {
      console.error('Cannot open modal: missing endpoint information');
      return;
    }
    
    setModalMode(mode);
    setSelectedEndpoint(endpoint);
    setShowModal(true); // Show modal immediately with loading state
    setIsLoading(true); // Indicate loading
    
    // Reset states
    setOperationResult({ show: false, success: false, message: '', data: null });
    
    try {
      // Initialize form data based on mode
      if (mode === 'create') {
        // For create, initialize with empty values based on table schema
        let initialFormData = {};
        
        // Generate a UUID for the id field - required by the backend
        initialFormData.id = generateUUID();
        initialFormData.user_id = userId || '';
        
        // Use existing record as template if available
        if (record) {
          console.log('Using existing record as template:', record);
          Object.keys(record).forEach(key => {
            // Don't overwrite already set fields
            if (!initialFormData.hasOwnProperty(key)) {
              const value = record[key];
              // For timestamps, use current time
              if (key.includes('_at')) {
                initialFormData[key] = new Date().toISOString();
              } else {
                // For other fields, start with empty value
                initialFormData[key] = typeof value === 'number' ? 0 : 
                                       typeof value === 'boolean' ? false : '';
              }
            }
          });
        } 
        // Otherwise use schema if available
        else if (tableSchemas[endpoint.table]) {
          console.log('Using cached schema:', tableSchemas[endpoint.table]);
          Object.keys(tableSchemas[endpoint.table]).forEach(key => {
            // Don't overwrite already set fields
            if (!initialFormData.hasOwnProperty(key)) {
              const fieldSchema = tableSchemas[endpoint.table][key];
              let defaultValue = '';
              
              if (fieldSchema.type === 'number' || fieldSchema.type === 'integer') {
                defaultValue = 0;
              } else if (fieldSchema.type === 'boolean') {
                defaultValue = false;
              } else if (fieldSchema.type === 'date' || fieldSchema.type === 'timestamp') {
                defaultValue = new Date().toISOString().split('T')[0];
              }
              
              initialFormData[key] = defaultValue;
            }
          });
        } 
        // If no schema or record, fetch a schema dynamically
        else {
          console.log(`No cached schema for ${endpoint.table}, fetching dynamically`);
          
          try {
            const schema = await fetchTableSchema(endpoint.table);
            
            if (schema) {
              console.log('Using fetched schema:', schema);
              Object.keys(schema).forEach(key => {
                // Don't overwrite already set fields
                if (!initialFormData.hasOwnProperty(key)) {
                  const fieldSchema = schema[key];
                  let defaultValue = '';
                  
                  if (fieldSchema.type === 'number' || fieldSchema.type === 'integer') {
                    defaultValue = 0;
                  } else if (fieldSchema.type === 'boolean') {
                    defaultValue = false;
                  } else if (fieldSchema.type === 'date' || fieldSchema.type === 'timestamp') {
                    defaultValue = new Date().toISOString().split('T')[0];
                  }
                  
                  initialFormData[key] = defaultValue;
                }
              });
            } else {
              // Fallback to basic fields if no schema available
              console.warn(`Could not determine schema for ${endpoint.table}, using minimal fields`);
              
              // Always include created_at and updated_at as these are common
              initialFormData.created_at = new Date().toISOString();
              initialFormData.updated_at = new Date().toISOString();
              
              // Try to make an educated guess about other fields based on table name
              const tableName = endpoint.table.toLowerCase();
              
              if (tableName.includes('user')) {
                initialFormData.username = '';
                initialFormData.email = '';
                initialFormData.password = '';
              } else if (tableName.includes('post') || tableName.includes('article')) {
                initialFormData.title = '';
                initialFormData.content = '';
                initialFormData.author_id = '';
              } else if (tableName.includes('comment')) {
                initialFormData.content = '';
                initialFormData.author_id = '';
                initialFormData.post_id = '';
              }
            }
          } catch (error) {
            console.error('Error fetching table schema:', error);
          }
        }
        
        // Ensure we have created_at and updated_at fields
        if (!initialFormData.created_at) {
          initialFormData.created_at = new Date().toISOString();
        }
        if (!initialFormData.updated_at) {
          initialFormData.updated_at = new Date().toISOString();
        }
        
        console.log('Final form data for create:', initialFormData);
        setFormData(initialFormData);
        setResourceId(initialFormData.id);
      } else if (mode === 'read' || mode === 'update' || mode === 'delete') {
        // For other modes, use the provided record data
        if (record) {
          console.log(`Setting form data for ${mode} operation:`, record);
          setFormData({ ...record });
          setResourceId(record.id || '');
        } else {
          console.error(`Cannot perform ${mode} operation: missing record data`);
        }
      }
    } catch (error) {
      console.error('Error preparing modal form:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedEndpoint(null);
    setFormData({});
    setResourceId('');
  };

  const handleFormChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // Add a function to detect field types based on field name or content
  const getFieldType = (key, value) => {
    // Common date field names
    const dateFields = ['date', 'birth', 'dob', 'created_at', 'updated_at', 'birthday', 'birthdate'];
    
    // Check if any date-related keywords are in the field name
    if (dateFields.some(field => key.toLowerCase().includes(field))) {
      return 'date';
    }
    
    // Check if it's a number field
    if (key.includes('id') || key.includes('_id') || key === 'id') {
      return 'number';
    }
    
    // Default to text
    return 'text';
  };
  
  // Add a function to determine input type for rendering
  const getInputType = (key) => {
    const fieldType = getFieldType(key);
    
    if (fieldType === 'date') {
      return 'date';
    } else if (fieldType === 'number') {
      return 'number';
    }
    
    return 'text';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSubmitError('');
    
    // Clear any previous operation result
    setOperationResult({ show: false, success: false, message: '', data: null });
    
    if (!selectedEndpoint || !selectedEndpoint.url) {
      setSubmitError('Invalid endpoint configuration');
      setIsLoading(false);
      return;
    }
    
    try {
      const resourceUrl = `${apiBaseUrl}/${userId}/${selectedEndpoint.table}`;
      const requestUrl = modalMode === 'create' ? resourceUrl : `${resourceUrl}/${resourceId}`;
      
      console.log(`Submitting ${modalMode} request to:`, requestUrl);
      console.log('Form data being sent:', formData);
      
      // Configure the request based on the operation
      let requestConfig = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      };
      
      // Set the appropriate HTTP method based on the operation
      switch (modalMode) {
        case 'create':
          requestConfig.method = 'POST';
          requestConfig.body = JSON.stringify(formData);
          break;
        case 'update':
          requestConfig.method = 'PUT';
          requestConfig.body = JSON.stringify(formData);
          break;
        case 'delete':
          requestConfig.method = 'DELETE';
          break;
        default: // 'read'
          // GET method already set as default
          break;
      }
      
      console.log('Request config:', {
        method: requestConfig.method,
        url: requestUrl,
        headers: requestConfig.headers,
        bodyPreview: requestConfig.body ? JSON.stringify(formData).substring(0, 200) + '...' : 'No body'
      });
      
      const response = await fetch(requestUrl, requestConfig);
      
      // First get the response as text to handle empty responses
      const responseText = await response.text();
      
      // Try to parse as JSON if not empty
      let responseData = null;
      try {
        if (responseText) {
          responseData = JSON.parse(responseText);
          console.log(`${modalMode} operation response:`, responseData);
        } else {
          console.log(`${modalMode} operation completed with empty response`);
        }
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        console.log('Raw response:', responseText);
      }
      
      if (response.ok) {
        // Success - handle based on operation mode
        let successMessage = '';
        
        switch (modalMode) {
          case 'create':
            successMessage = 'Record created successfully';
            break;
          case 'read':
            successMessage = 'Record retrieved successfully';
            break;
          case 'update':
            successMessage = 'Record updated successfully';
            break;
          case 'delete':
            successMessage = 'Record deleted successfully';
            break;
        }
        
        setOperationResult({
          show: true,
          success: true,
          message: successMessage,
          data: responseData
        });
        
        // For successful create/update/delete, reload the table data
        if (modalMode !== 'read') {
          loadTableData(selectedEndpoint.table);
        }
        
        // Close modal on success (except for read operation)
        if (modalMode !== 'read') {
          setShowModal(false);
        }
      } else {
        // Error handling
        let errorMessage = 'Operation failed';
        
        if (responseData && responseData.message) {
          errorMessage = responseData.message;
        } else if (responseData && responseData.error) {
          errorMessage = responseData.error;
        } else {
          errorMessage = `${modalMode} operation failed: ${response.status} ${response.statusText}`;
        }
        
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          data: responseData
        });
        
        setOperationResult({
          show: true,
          success: false,
          message: errorMessage,
          data: responseData
        });
        
        setSubmitError(errorMessage);
      }
    } catch (error) {
      console.error('Request error:', error);
      setSubmitError(`Error: ${error.message || 'Unknown error occurred'}`);
      
      setOperationResult({
        show: true,
        success: false,
        message: `Error: ${error.message || 'Unknown error occurred'}`,
        data: null
      });
    } finally {
      setIsLoading(false);
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

  // Fetch schema for a table dynamically
  const fetchTableSchema = async (tableName) => {
    if (!tableName || !apiBaseUrl) {
      console.error('fetchTableSchema: Missing required parameters', { tableName, apiBaseUrl });
      return null;
    }
    
    console.log(`Fetching schema for table: ${tableName}`);
    setIsLoading(true);
    
    // First try to get schema from existing data
    try {
      // Build the URL for fetching table data
      const url = `${apiBaseUrl}/${userId}/${tableName}?limit=1`;
      console.log(`Making schema discovery request to: ${url}`);
      
      const response = await fetch(url);
      
      // First read the response as text
      const responseText = await response.text();
      let data = null;
      
      try {
        // Try to parse as JSON if there is content
        if (responseText && responseText.trim() !== '') {
          data = JSON.parse(responseText);
          console.log(`Received data for schema discovery:`, data);
        } else {
          console.warn(`Empty response received when trying to discover schema for ${tableName}`);
        }
      } catch (parseError) {
        console.error(`Error parsing JSON response for schema discovery:`, parseError);
        console.log(`Raw response:`, responseText);
      }
      
      if (!response.ok) {
        console.error(`Error fetching sample data for ${tableName}:`, response.status, response.statusText);
        throw new Error(`Failed to fetch sample data: ${response.status} ${response.statusText}`);
      }
      
      // Check if we got an array directly
      if (Array.isArray(data)) {
        if (data.length === 0) {
          console.warn(`No records found in ${tableName} to infer schema`);
          // Try another approach - make a record with some default fields
          return inferDefaultSchema(tableName);
        }
        
        const sampleRecord = data[0];
        return inferSchemaFromRecord(sampleRecord);
      } 
      // Or if the data is wrapped in a property
      else if (data && (data.data || data.records || data.items || data.results)) {
        const records = data.data || data.records || data.items || data.results;
        
        if (Array.isArray(records) && records.length > 0) {
          const sampleRecord = records[0];
          return inferSchemaFromRecord(sampleRecord);
        } else {
          console.warn(`Response contained a data array but it was empty`);
          return inferDefaultSchema(tableName);
        }
      } 
      // Check if it's a single object that might be the record itself
      else if (data && typeof data === 'object' && !Array.isArray(data)) {
        return inferSchemaFromRecord(data);
      }
      
      console.warn(`Could not determine schema format from response:`, data);
      return inferDefaultSchema(tableName);
      
    } catch (error) {
      console.error(`Error fetching table schema for ${tableName}:`, error);
      return inferDefaultSchema(tableName);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to infer schema from a sample record
  const inferSchemaFromRecord = (record) => {
    console.log('Inferring schema from record:', record);
    if (!record || typeof record !== 'object') {
      console.warn('Cannot infer schema: invalid record');
      return null;
    }
    
    const schema = {};
    
    Object.entries(record).forEach(([key, value]) => {
      let type = 'string';
      
      if (typeof value === 'number') {
        type = Number.isInteger(value) ? 'integer' : 'number';
      } else if (typeof value === 'boolean') {
        type = 'boolean';
      } else if (value instanceof Date) {
        type = 'date';
      } else if (typeof value === 'string') {
        // Check if it looks like a date string
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
          type = 'timestamp';
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          type = 'date';
        } else if (key.includes('_id') || key === 'id') {
          type = 'id';
        } else if (value.length > 200) {
          type = 'longtext';
        }
      }
      
      schema[key] = { type };
    });
    
    console.log('Inferred schema:', schema);
    
    // Update the tableSchemas state with this schema
    setTableSchemas(prev => ({
      ...prev,
      [record.table || 'unknown']: schema
    }));
    
    return schema;
  };
  
  // Helper function to create a default schema based on common table patterns
  const inferDefaultSchema = (tableName) => {
    console.log(`Creating default schema for ${tableName}`);
    const schema = {
      id: { type: 'id' },
      user_id: { type: 'id' }
    };
    
    // Add timestamp fields that are common
    schema.created_at = { type: 'timestamp' };
    schema.updated_at = { type: 'timestamp' };
    
    // Make educated guesses based on table name
    const tableNameLower = tableName.toLowerCase();
    
    if (tableNameLower.includes('user')) {
      schema.username = { type: 'string' };
      schema.email = { type: 'string' };
      schema.password = { type: 'string' };
    } else if (tableNameLower.includes('post') || tableNameLower.includes('article')) {
      schema.title = { type: 'string' };
      schema.content = { type: 'longtext' };
      schema.author_id = { type: 'id' };
    } else if (tableNameLower.includes('comment')) {
      schema.content = { type: 'string' };
      schema.author_id = { type: 'id' };
      schema.post_id = { type: 'id' };
    } else if (tableNameLower.includes('product')) {
      schema.name = { type: 'string' };
      schema.description = { type: 'longtext' };
      schema.price = { type: 'number' };
    }
    
    console.log('Default schema created:', schema);
    
    // Update the tableSchemas state with this schema
    setTableSchemas(prev => ({
      ...prev,
      [tableName]: schema
    }));
    
    return schema;
  };

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ 
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    }}>
      {/* Header */}
      <header className="p-3 d-flex align-items-center justify-content-between" style={{ 
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        zIndex: 20,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
      }}>
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="fs-4 fw-bold text-white mb-0 d-flex align-items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="me-2" style={{color: '#3b82f6'}}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            API Endpoints
          </h1>
          <div className="small mb-0 mt-1 d-flex align-items-center" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            <Badge bg="info" className="me-2" pill style={{ fontSize: '0.65rem', backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>
              {userId || 'Loading...'}
            </Badge>
            <span>Generated endpoints for your database schema</span>
          </div>
        </motion.div>
        
        <div className="d-flex align-items-center gap-3">
          <motion.div 
            whileHover={{ scale: 1.03 }} 
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Button
              variant="outline-primary"
              onClick={handleGoBack}
              className="px-3 py-2 rounded-pill"
              style={{ 
                borderColor: 'rgba(59, 130, 246, 0.5)',
                color: '#60a5fa',
                transition: 'all 0.2s ease'
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
      
      {/* Filter Tabs and Controls */}
      {!isLoading && endpoints.length > 0 && (
        <motion.div 
          className="d-flex justify-content-between align-items-center px-4 py-3" 
          style={{ 
            backgroundColor: 'rgba(15, 23, 42, 0.6)', 
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="d-flex gap-4 align-items-center">
            <div className="rounded-pill px-1 py-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <Nav variant="pills" className="d-flex">
                {['all', 'GET', 'POST', 'PUT', 'DELETE'].map(filter => (
                  <Nav.Item key={filter}>
                    <Nav.Link 
                      className={`px-3 py-1 mx-1 rounded-pill ${selectedFilter === filter ? '' : 'text-white-50'}`}
                      onClick={() => setSelectedFilter(filter)}
                      active={selectedFilter === filter}
                      style={{
                        backgroundColor: selectedFilter === filter 
                          ? methodColors[filter === 'all' ? 'GET' : filter].bg 
                          : 'transparent',
                        opacity: selectedFilter === filter ? 1 : 0.7,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {filter === 'all' ? 'All' : filter}
                    </Nav.Link>
                  </Nav.Item>
                ))}
              </Nav>
            </div>
            
            <div className="bg-dark bg-opacity-50 px-3 py-2 rounded-pill">
              <span className="text-white-50 small me-2">API Base URL:</span>
              <span className="font-monospace text-light small">{apiBaseUrl}</span>
            </div>
          </div>
          
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              variant="outline-info"
              onClick={handleSwaggerDownload}
              className="px-3 py-2 rounded-pill"
              style={{ 
                borderColor: 'rgba(6, 182, 212, 0.5)', 
                color: '#06b6d4',
                transition: 'all 0.2s ease'
              }}
            >
              <span className="d-flex align-items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="me-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Swagger Docs
              </span>
            </Button>
          </motion.div>
        </motion.div>
      )}
      
      {/* Main Content with Tables and Endpoints */}
      <div className="flex-grow-1 d-flex">
        {isLoading ? (
          <div className="d-flex justify-content-center align-items-center w-100 py-5">
            <div className="text-center">
              <div className="mb-4">
                <Spinner animation="border" variant="primary" style={{ width: '4rem', height: '4rem' }} />
              </div>
              <h4 className="text-white mb-3">Loading API Endpoints</h4>
              <p className="text-white-50 mb-0">Please wait while we fetch your schema data...</p>
            </div>
          </div>
        ) : endpoints.length === 0 ? (
          <div className="d-flex justify-content-center align-items-center w-100 py-5">
            <div className="text-center">
              <div className="mb-4 text-danger">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h4 className="text-white mb-3">No API Endpoints Found</h4>
              <p className="text-white-50 mb-4">Unable to load API endpoints. Please return to the schema page and try again.</p>
              <Button 
                variant="primary" 
                onClick={handleGoBack}
                className="px-4 py-2 rounded-pill"
              >
                Return to Schema Page
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Left Panel - Data View */}
            <motion.div 
              className="flex-grow-1 p-4" 
              style={{ borderRight: '1px solid rgba(255, 255, 255, 0.05)' }}
              variants={fadeIn}
              initial="hidden"
              animate="visible"
            >
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center">
                  <h2 className="fs-5 fw-bold text-white mb-0">Table Explorer</h2>
                  {isLoading && (
                    <div className="ms-3 spinner-grow spinner-grow-sm text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  )}
                </div>
                
                <div className="d-flex gap-2">
                  <div className="bg-dark bg-opacity-50 rounded-pill p-1">
                    <Nav variant="pills" className="d-flex">
                      {endpoints.map(endpoint => (
                        <Nav.Item key={endpoint.table}>
                          <Nav.Link 
                            className={`px-3 py-1 mx-1 rounded-pill ${selectedTable === endpoint.table ? '' : 'text-white-50'}`}
                            onClick={() => handleSelectTable(endpoint.table)}
                            active={selectedTable === endpoint.table}
                            style={{
                              transition: 'all 0.2s ease',
                              fontSize: '0.9rem'
                            }}
                          >
                            {endpoint.name}
                          </Nav.Link>
                        </Nav.Item>
                      ))}
                    </Nav>
                  </div>
                  
                  {selectedTable && (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="success"
                        onClick={() => {
                          // Find the endpoint for the selected table
                          const endpoint = endpoints.find(e => e.table === selectedTable);
                          // Find a template record if we have table data
                          const template = tableData.length > 0 ? tableData[0] : null;
                          
                          // Call the async function
                          (async () => {
                            await handleOpenModal('create', endpoint, template);
                          })();
                        }}
                        className="px-3 py-2 rounded-pill"
                        size="sm"
                        style={{
                          background: 'linear-gradient(45deg, #10b981, #059669)',
                          border: 'none',
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        <span className="d-flex align-items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="me-1">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                          Add New
                        </span>
                      </Button>
                    </motion.div>
                  )}
                </div>
              </div>
              
              {isLoading && !tableData.length ? (
                <div className="d-flex justify-content-center py-5">
                  <LoadingAnimation />
                </div>
              ) : tableData.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="bg-dark rounded-3 overflow-hidden" style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)' }}>
                    <Table responsive hover variant="dark" className="mb-0" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                      <thead>
                        <tr style={{ backgroundColor: 'rgba(30, 41, 59, 0.8)' }}>
                          {Object.keys(tableData[0]).map(key => (
                            <th key={key} className="py-3 px-4 text-nowrap" style={{ borderBottom: '2px solid rgba(59, 130, 246, 0.3)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              {key.replace(/_/g, ' ')}
                            </th>
                          ))}
                          <th className="text-end py-3 px-4" style={{ borderBottom: '2px solid rgba(59, 130, 246, 0.3)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableData.map((record, index) => (
                          <motion.tr 
                            key={index}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="record-row"
                            style={{ transition: 'background-color 0.15s ease' }}
                          >
                            {Object.entries(record).map(([key, value]) => (
                              <td key={key} className="py-3 px-4">
                                {typeof value === 'object' 
                                  ? JSON.stringify(value).substring(0, 30) + (JSON.stringify(value).length > 30 ? '...' : '')
                                  : String(value).substring(0, 30) + (String(value).length > 30 ? '...' : '')}
                              </td>
                            ))}
                            <td className="text-end py-3 px-4">
                              <div className="d-flex gap-2 justify-content-end">
                                <OverlayTrigger
                                  placement="top"
                                  overlay={<Tooltip>View Details</Tooltip>}
                                >
                                  <Button 
                                    variant="outline-info" 
                                    size="sm"
                                    onClick={() => {
                                      const endpoint = endpoints.find(e => e.table === selectedTable);
                                      
                                      // Call the async function
                                      (async () => {
                                        await handleOpenModal('read', endpoint, record);
                                      })();
                                    }}
                                    className="rounded-circle d-flex align-items-center justify-content-center"
                                    style={{ width: '32px', height: '32px', padding: 0 }}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  </Button>
                                </OverlayTrigger>
                                <OverlayTrigger
                                  placement="top"
                                  overlay={<Tooltip>Edit Record</Tooltip>}
                                >
                                  <Button 
                                    variant="outline-warning" 
                                    size="sm"
                                    onClick={() => {
                                      const endpoint = endpoints.find(e => e.table === selectedTable);
                                      
                                      // Call the async function
                                      (async () => {
                                        await handleOpenModal('update', endpoint, record);
                                      })();
                                    }}
                                    className="rounded-circle d-flex align-items-center justify-content-center"
                                    style={{ width: '32px', height: '32px', padding: 0 }}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </Button>
                                </OverlayTrigger>
                                <OverlayTrigger
                                  placement="top"
                                  overlay={<Tooltip>Delete Record</Tooltip>}
                                >
                                  <Button 
                                    variant="outline-danger" 
                                    size="sm"
                                    onClick={() => {
                                      const endpoint = endpoints.find(e => e.table === selectedTable);
                                      
                                      // Call the async function
                                      (async () => {
                                        await handleOpenModal('delete', endpoint, record);
                                      })();
                                    }}
                                    className="rounded-circle d-flex align-items-center justify-content-center"
                                    style={{ width: '32px', height: '32px', padding: 0 }}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </Button>
                                </OverlayTrigger>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                  
                  {/* Pagination */}
                  <div className="d-flex justify-content-between align-items-center mt-4">
                    <div className="badge bg-dark bg-opacity-50 py-2 px-3 rounded-pill text-white-50 small">
                      Showing {tableData.length} of {pagination.total} records
                    </div>
                    
                    <div className="d-flex gap-2">
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        disabled={pagination.page <= 1}
                        onClick={() => loadTableData(selectedTable, pagination.page - 1)}
                        className="rounded-pill px-3 py-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="me-1">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Previous
                      </Button>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                        onClick={() => loadTableData(selectedTable, pagination.page + 1)}
                        className="rounded-pill px-3 py-2"
                      >
                        Next
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="ms-1">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  className="bg-dark bg-opacity-50 rounded-3 text-center p-5 mt-4" 
                  style={{ color: 'rgba(255, 255, 255, 0.6)', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)' }}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="rounded-circle bg-dark d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '70px', height: '70px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-primary opacity-75">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <h4 className="fs-5 fw-bold text-white mb-2">No Data Available</h4>
                  <p className="mb-4">This table is empty. Create a new record to get started.</p>
                  
                  <Button 
                    variant="primary"
                    onClick={() => {
                      const endpoint = endpoints.find(e => e.table === selectedTable);
                      
                      // Call the async function
                      (async () => {
                        await handleOpenModal('create', endpoint);
                      })();
                    }}
                    className="rounded-pill px-4 py-2"
                    style={{
                      background: 'linear-gradient(45deg, #3b82f6, #2563eb)',
                      border: 'none',
                      boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)'
                    }}
                  >
                    <span className="d-flex align-items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="me-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Create First Record
                    </span>
                  </Button>
                </motion.div>
              )}
            </motion.div>
            
            {/* Right Panel - Endpoints Documentation */}
            <motion.div 
              className="p-4" 
              style={{ 
                width: '400px', 
                borderLeft: '1px solid rgba(255, 255, 255, 0.05)',
                background: 'rgba(15, 23, 42, 0.4)',
                backdropFilter: 'blur(8px)'
              }}
              variants={slideIn}
              initial="hidden"
              animate="visible"
            >
              <h2 className="fs-5 fw-bold text-white mb-4 d-flex align-items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="me-2 text-primary">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                API Reference
              </h2>
              
              {isLoading ? (
                <div className="d-flex justify-content-center py-5">
                  <LoadingAnimation />
                </div>
              ) : (
                <motion.div 
                  className="d-flex flex-column gap-4"
                  variants={staggerItems}
                  initial="hidden"
                  animate="visible"
                >
                  {filteredEndpoints.map((group, groupIndex) => (
                    <motion.div 
                      key={group.name} 
                      className="rounded-3 overflow-hidden"
                      style={{ 
                        background: 'rgba(30, 41, 59, 0.5)',
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}
                      variants={fadeIn}
                      whileHover={{ y: -3, transition: { duration: 0.2 } }}
                    >
                      <div className="p-3 border-bottom" style={{ borderColor: 'rgba(255, 255, 255, 0.08)', background: 'rgba(15, 23, 42, 0.7)' }}>
                        <h3 className="fs-6 fw-bold text-white mb-0 d-flex align-items-center">
                          <Badge pill bg="dark" className="me-2 text-white fs-7">
                            {group.endpoints.length}
                          </Badge>
                          {group.name}
                        </h3>
                        <p className="small mb-0 font-monospace mt-1" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                          {group.baseUrl}
                        </p>
                      </div>
                      
                      <div>
                        {group.endpoints.map((endpoint, i) => (
                          <motion.div
                            key={`${group.name}-${i}`}
                            className="border-bottom hover-highlight p-0" 
                            style={{ 
                              borderColor: 'rgba(255, 255, 255, 0.05)',
                              transition: 'all 0.2s ease'
                            }}
                            whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                            variants={fadeIn}
                          >
                            <div className="p-3">
                              <div className="d-flex align-items-start gap-3">
                                <div 
                                  className="badge text-white px-2 py-1 rounded-pill"
                                  style={{
                                    backgroundColor: methodColors[endpoint.method].bg,
                                    boxShadow: `0 2px 5px rgba(0, 0, 0, 0.2)`,
                                    minWidth: '60px',
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                    fontSize: '0.7rem'
                                  }}
                                >
                                  {endpoint.method}
                                </div>
                                <div className="flex-grow-1">
                                  <div className="font-monospace small mb-1" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                                    {endpoint.path}
                                  </div>
                                  <p className="small mb-0" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                    {endpoint.description}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="mt-2 pt-2 border-top" style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                                <code className="small d-block p-2 rounded" style={{ 
                                  backgroundColor: 'rgba(0, 0, 0, 0.2)', 
                                  color: '#10b981',
                                  fontSize: '0.7rem',
                                  overflow: 'auto',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {endpoint.fullPath}
                                </code>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          </>
        )}
      </div>
      
      {/* CRUD Operation Modal */}
      <Modal
        show={showModal}
        onHide={handleCloseModal}
        size="lg"
        aria-labelledby="crud-modal"
        centered
        className="crud-modal"
      >
        <Modal.Header closeButton className="border-bottom">
          <Modal.Title id="crud-modal">
            {modalMode === 'create' && <><i className="bi bi-plus-circle me-2"></i>Create {selectedEndpoint?.name || 'Record'}</>}
            {modalMode === 'read' && <><i className="bi bi-eye me-2"></i>View {selectedEndpoint?.name || 'Record'}</>}
            {modalMode === 'update' && <><i className="bi bi-pencil me-2"></i>Edit {selectedEndpoint?.name || 'Record'}</>}
            {modalMode === 'delete' && <><i className="bi bi-trash me-2"></i>Delete {selectedEndpoint?.name || 'Record'}</>}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" className="mb-3" />
              <p className="text-muted mb-0">Loading...</p>
            </div>
          ) : (
            <>
              {operationResult.show && (
                <Alert 
                  variant={operationResult.success ? 'success' : 'danger'} 
                  className="mb-4 d-flex align-items-center"
                >
                  <div className="me-3">
                    {operationResult.success ? (
                      <i className="bi bi-check-circle fs-4"></i>
                    ) : (
                      <i className="bi bi-exclamation-circle fs-4"></i>
                    )}
                  </div>
                  <div>
                    <p className="mb-1 fw-bold">{operationResult.success ? 'Success!' : 'Error'}</p>
                    <p className="mb-0">{operationResult.message}</p>
                  </div>
                </Alert>
              )}
              
              {submitError && (
                <Alert variant="danger" className="mb-4">
                  <p className="mb-0"><strong>Error:</strong> {submitError}</p>
                </Alert>
              )}
              
              {modalMode === 'delete' ? (
                <div className="text-center py-3">
                  <div className="mb-4">
                    <span className="delete-icon-wrapper">
                      <i className="bi bi-exclamation-triangle"></i>
                    </span>
                  </div>
                  <h5 className="mb-3">Are you sure you want to delete this {selectedEndpoint?.name}?</h5>
                  <p className="text-muted mb-4">This action cannot be undone.</p>
                  <div className="d-flex justify-content-center">
                    <Button
                      variant="outline-secondary"
                      onClick={handleCloseModal}
                      className="me-3"
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      onClick={handleSubmit}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" className="me-2" />
                          Deleting...
                        </>
                      ) : (
                        'Delete'
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <Form onSubmit={handleSubmit}>
                  {Object.entries(formData).map(([key, value]) => (
                    <Form.Group key={key} className="mb-3">
                      <Form.Label className="text-capitalize">{formatFieldName(key)}</Form.Label>
                      {key === 'id' || key === 'user_id' || key.includes('_id') ? (
                        <Form.Control
                          type="text"
                          value={value}
                          onChange={(e) => handleFormChange(key, e.target.value)}
                          disabled={modalMode === 'read' || key === 'id' || (key === 'user_id' && modalMode !== 'update')}
                          className="border"
                        />
                      ) : getFieldType(key, value) === 'date' ? (
                        <Form.Control
                          type="date"
                          value={value && value.includes('T') ? value.split('T')[0] : value}
                          onChange={(e) => handleFormChange(key, e.target.value)}
                          disabled={modalMode === 'read'}
                          className="border"
                        />
                      ) : getFieldType(key, value) === 'boolean' ? (
                        <Form.Check
                          type="checkbox"
                          checked={value === true}
                          onChange={(e) => handleFormChange(key, e.target.checked)}
                          disabled={modalMode === 'read'}
                          label={value === true ? 'Yes' : 'No'}
                          className="ms-2"
                        />
                      ) : getFieldType(key, value) === 'longtext' ? (
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={value || ''}
                          onChange={(e) => handleFormChange(key, e.target.value)}
                          disabled={modalMode === 'read'}
                          className="border"
                        />
                      ) : getFieldType(key, value) === 'timestamp' ? (
                        <Form.Control
                          type="datetime-local"
                          value={formatDateTimeForInput(value)}
                          onChange={(e) => handleFormChange(key, e.target.value)}
                          disabled={modalMode === 'read' || key === 'created_at' || key === 'updated_at'}
                          className="border"
                        />
                      ) : (
                        <Form.Control
                          type={getFieldType(key, value) === 'number' ? 'number' : 'text'}
                          value={value !== null && value !== undefined ? value : ''}
                          onChange={(e) => handleFormChange(key, e.target.value)}
                          disabled={modalMode === 'read'}
                          className="border"
                        />
                      )}
                      {getFieldNote(key) && (
                        <Form.Text className="text-muted">
                          {getFieldNote(key)}
                        </Form.Text>
                      )}
                    </Form.Group>
                  ))}
                  
                  {modalMode !== 'read' && (
                    <div className="d-flex justify-content-end mt-4">
                      <Button
                        variant="outline-secondary"
                        onClick={handleCloseModal}
                        className="me-2"
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        variant={modalMode === 'update' ? 'warning' : 'primary'}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Spinner as="span" animation="border" size="sm" className="me-2" />
                            {modalMode === 'create' ? 'Creating...' : modalMode === 'update' ? 'Updating...' : 'Loading...'}
                          </>
                        ) : (
                          <>
                            {modalMode === 'create' && 'Create'}
                            {modalMode === 'update' && 'Update'}
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                  
                  {modalMode === 'read' && (
                    <div className="d-flex justify-content-between mt-4">
                      <Button
                        variant="outline-warning"
                        onClick={() => handleOpenModal('update', selectedEndpoint, formData)}
                        className="me-2"
                      >
                        <i className="bi bi-pencil me-1"></i> Edit
                      </Button>
                      <Button
                        variant="outline-danger"
                        onClick={() => handleOpenModal('delete', selectedEndpoint, formData)}
                      >
                        <i className="bi bi-trash me-1"></i> Delete
                      </Button>
                    </div>
                  )}
                </Form>
              )}
            </>
          )}
        </Modal.Body>
      </Modal>
      
      {/* Loading overlay */}
      {isLoading && !tableData.length && <LoadingAnimation />}
      
      <style jsx="true">{`
        .hover-highlight:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }
        
        .record-row:hover {
          background-color: rgba(30, 41, 59, 1);
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.6);
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.5);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.7);
        }
      `}</style>
    </div>
  );
};

export default EndpointsPage; 