import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Container, Row, Col, Button, Nav, Form, Modal, Alert, Spinner, Table, Badge, Card, Tooltip, OverlayTrigger } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingAnimation from '../components/common/LoadingAnimation';
import { getXAuthUserId } from '../utils/apiService';
import { apiRequest, getAccessToken, refreshAccessToken } from '../utils/apiService';
import { useAuth } from '../components/auth/AuthContext';
import { toast } from 'react-hot-toast';
import { FaServer, FaLock, FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa';

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
  const [XAuthUserId, setUserId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true); // For the full-page loading animation
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [swaggerUrl, setSwaggerUrl] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // CRUD operation states
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCurlModal, setShowCurlModal] = useState(false);
  const [modalMode, setModalMode] = useState('read');
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
  const [userData, setUserData] = useState([]);
  const [relatedTableData, setRelatedTableData] = useState({});
  // Add state for storing complete schema information
  const [completeSchemaInfo, setCompleteSchemaInfo] = useState(null);
  // Add mapping between foreign key fields and their related tables
  const [fieldToTableMap, setFieldToTableMap] = useState({});
  // Add error state to the component's state variables
  const [error, setError] = useState(null);
  const [skipAuth, setSkipAuth] = useState(false);
  const [showSkipAuthWarning, setShowSkipAuthWarning] = useState(false);
  // Make sure we capture the endpoint origin (where the user came from)
  const [originPage, setOriginPage] = useState(localStorage.getItem('endpoint_origin') || 'dashboard');
  const backButtonLabel = originPage === 'dashboard' ? 'Back to Dashboard' : 'Back to Schema';
  
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
    // Special handling for known doctor fields
    const doctorFieldLabels = {
      'first_name': 'First Name',
      'last_name': 'Last Name',
      'specialization': 'Specialization',
      'created_at': 'Created At',
      'updated_at': 'Updated At'
    };
    
    // Use predefined label if available
    if (doctorFieldLabels[key]) {
      return doctorFieldLabels[key];
    }
    
    // Default formatting logic for other fields
    // Remove underscores and capitalize each word
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
      'XAuthUserId': 'User identifier for ownership',
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

  // Function to check if a field is a foreign key and extract table reference
  const getForeignKeyReference = (key) => {
    // If we have the complete schema information, use it to find relationships
    if (completeSchemaInfo) {
      console.log('Looking for relationship for field:', key);
      
      // First, look for any table that has a relationship where this key is the source column
      for (const table of completeSchemaInfo) {
        if (table.relationships) {
          for (const rel of table.relationships) {
            if (rel.sourceColumn === key) {
              console.log(`Found relationship in ${table.name} for ${key} -> ${rel.targetTable}`);
              return rel.targetTable;
            }
          }
        }
      }
      
      // If we didn't find a direct match, check if any table has this column
      // and infer the target table from the field name
      if (key.endsWith('_id')) {
        const baseTableName = key.replace('_id', '');
        
        // Search for a table with this name
        const matchingTable = completeSchemaInfo.find(t => 
          t.name === baseTableName || 
          t.name === `${baseTableName}s` || 
          t.name === baseTableName.replace(/y$/, 'ies')
        );
        
        if (matchingTable) {
          console.log(`Inferred relationship from field name for ${key} -> ${matchingTable.name}`);
          return matchingTable.name;
        }
      }
    }
    
    // Common fields mapping for fallback
    const commonRelationships = {
      'XAuthUserId': 'users',
      'author_id': 'users',
      'creator_id': 'users',
      'owner_id': 'users',
      'book_id': 'books',
      'member_id': 'members',
      'student_id': 'students',
      'course_id': 'courses',
      'product_id': 'products',
      'category_id': 'categories',
      'order_id': 'orders',
      'customer_id': 'customers',
      'parent_id': key.replace('_id', 's'), // parent_id → parents
    };
    
    // Return the common relationship if one exists
    if (commonRelationships[key]) {
      console.log(`Using common relationship for ${key} -> ${commonRelationships[key]}`);
      return commonRelationships[key];
    }
    
    // If no matches found, try to infer from the key name
    if (key.endsWith('_id')) {
      const tableName = key.replace('_id', 's');
      console.log(`Inferring table name from key: ${key} -> ${tableName}`);
      return tableName;
    }
    
    return null;
  };
  
  // Function to get a display name for records from a specified table
  const getRecordDisplayName = (record, table) => {
    if (!record) return '';
    
    // For users table
    if (table === 'users') {
      return record.name || record.username || record.email || `User ${record.id.substring(0, 8)}`;
    }
    
    // Specific handling for common tables
    if (table === 'books') {
      return record.title || `Book ${record.id.substring(0, 8)}`;
    }
    
    if (table === 'members') {
      return record.first_name && record.last_name 
        ? `${record.first_name} ${record.last_name}`
        : record.name || record.email || `Member ${record.id.substring(0, 8)}`;
    }
    
    // For loans, show a combination of fields
    if (table === 'loans') {
      let display = 'Loan';
      if (record.id) display += ` ${record.id.substring(0, 8)}`;
      if (record.loan_date) display += ` (${new Date(record.loan_date).toLocaleDateString()})`;
      return display;
    }
    
    // For other tables, look for common naming fields in priority order
    const nameFields = [
      'name', 'title', 'label', 'display_name', 'full_name',
      'first_name', 'last_name', 'description', 'subject', 
      'code', 'reference', 'number'
    ];
    
    for (const field of nameFields) {
      if (record[field] && typeof record[field] === 'string' && record[field].trim()) {
        return record[field];
      }
    }
    
    // Try to combine first_name and last_name if both exist
    if (record.first_name && record.last_name) {
      return `${record.first_name} ${record.last_name}`;
    }
    
    // Look for any field containing "name" or "title"
    for (const key in record) {
      if (
        (key.includes('name') || key.includes('title')) && 
        typeof record[key] === 'string' && 
        record[key].trim()
      ) {
        return record[key];
      }
    }
    
    // Fall back to ID if no name-like field is found
    return `${table.charAt(0).toUpperCase() + table.slice(1, -1)} ${record.id.substring(0, 8)}`;
  };

  // Load related table data for dropdowns
  const loadRelatedTableData = async (table) => {
    if (!apiBaseUrl) {
      console.log(`Cannot load related table data for ${table}: missing API base URL`);
      return [];
    }
    
    // Check if we already have this data cached
    if (relatedTableData[table] && relatedTableData[table].length > 0) {
      console.log(`Using cached data for ${table}`);
      return relatedTableData[table];
    }
    
    try {
      console.log(`Loading related table data for ${table}`);
      
      // Create URL with limit parameter
      let url = `${apiBaseUrl}/${table}?limit=100`;
      
      // Note: skipAuth parameter will be added by fetchWithAuth, so we don't add it here
      // to prevent duplication
      
      console.log(`Fetching from URL: ${url} with skipAuth=${skipAuth}`);
      
      const response = await fetchWithAuth(url);
      
      if (!response.ok) {
        console.error(`Error loading related data for ${table}: ${response.status} ${response.statusText}`);
        
        // Try pluralized/singularized table name as fallback
        const alternateTable = table.endsWith('s') ? table.slice(0, -1) : `${table}s`;
        
        if (alternateTable !== table) {
          console.log(`Trying alternate table name: ${alternateTable}`);
          const fallbackUrl = `${apiBaseUrl}/${alternateTable}?limit=100`;
          const fallbackResponse = await fetchWithAuth(fallbackUrl);
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            console.log(`Fallback request succeeded for ${alternateTable}:`, fallbackData);
            const resultData = Array.isArray(fallbackData?.data) ? fallbackData.data : 
                              Array.isArray(fallbackData) ? fallbackData : [];
            
            // Cache the result
            setRelatedTableData(prev => ({
              ...prev,
              [table]: resultData
            }));
            
            return resultData;
          }
        }
        
        return [];
      }
      
      let data;
      try {
        const responseText = await response.text();
        data = JSON.parse(responseText);
        console.log(`Received data from ${table}:`, data);
      } catch (error) {
        console.error(`Error parsing response for ${table}:`, error);
        return [];
      }
      
      const resultData = Array.isArray(data?.data) ? data.data : 
                        Array.isArray(data) ? data : [];
      
      // Cache the result
      setRelatedTableData(prev => ({
        ...prev,
        [table]: resultData
      }));
      
      return resultData;
    } catch (error) {
      console.error(`Error loading related data for ${table}:`, error);
      return [];
    }
  };

  useEffect(() => {
    // Clear any previous errors
    setError(null);
    
    // First check if we're transitioning from schema page (this should take priority)
    const apiLoadingFlag = sessionStorage.getItem('apiLoading');
    const storedEndpoints = sessionStorage.getItem('apiEndpoints');
    
    console.log('API loading flag:', apiLoadingFlag);
    console.log('Stored endpoints available:', !!storedEndpoints);
    
    // Capture where the user came from
    if (apiLoadingFlag === 'true') {
      // If coming from schema page with loading flag, set origin to 'schema'
      setOriginPage('schema');
      localStorage.setItem('endpoint_origin', 'schema');
    } else {
      // Otherwise, use what's in localStorage or default to dashboard
      const origin = localStorage.getItem('endpoint_origin') || 'dashboard';
      setOriginPage(origin);
    }
    
    if (apiLoadingFlag === 'true' && storedEndpoints) {
      console.log('Loading endpoints from session storage');
      loadEndpointsFromSession(storedEndpoints, apiLoadingFlag);
      return; // Exit early since we're handling the transition from schema page
    }
    
    // If not coming from schema page, check for a selected API ID from the dashboard
    const selectedApiId = localStorage.getItem('selectedApiId');
    console.log('Selected API ID from localStorage:', selectedApiId);
    
    if (selectedApiId) {
      // Use the selected API ID to fetch endpoint data
      console.log('Loading endpoints for API ID:', selectedApiId);
      setApiId(selectedApiId);
      // Initialize the API base URL
      setApiBaseUrl(`https://backlify-v2.onrender.com/api/${selectedApiId}`);
      loadApiEndpoints(selectedApiId);
      
      // Load users data for relationship fields
      loadUsersData();
    } else {
      // No data and not loading - redirect to dashboard
      console.log('No API ID or session data, redirecting to dashboard');
      setIsLoading(false);
      navigate('/dashboard');
    }
  }, [navigate]);

  // New function to load API endpoints directly using the API ID
  const loadApiEndpoints = async (apiId) => {
    setInitialLoading(true);
    setIsLoading(true);
    
    try {
      // Use apiRequest to include authorization header
      const data = await apiRequest('/my-apis', {
        method: 'GET'
      });
      
      console.log('API data received:', data);
      
      const selectedApi = data.apis.find(api => api.apiId === apiId);
      
      if (!selectedApi) {
        throw new Error('Selected API not found');
      }
      
      console.log('Selected API:', selectedApi);
      
      // Get auth headers for constructing the endpoint URLs
      const token = getAccessToken();
      const authHeadersInfo = token ? `(With Auth Header)` : '';
      // Don't append skipAuth to URLs
      const authStatus = skipAuth ? 'No Auth' : 'Auth Required';
      
      // Initialize endpoints based on the tables in the API
      const transformedEndpoints = selectedApi.tables.map(table => {
        return {
          name: table.charAt(0).toUpperCase() + table.slice(1),
          baseUrl: `/api/${apiId}/${table}`,
          table: table,
          endpoints: [
            {
              method: 'GET',
              path: `/${table}`,
              description: `List all ${table}`,
              auth: !skipAuth,
              fullPath: `https://backlify-v2.onrender.com/api/${apiId}/${table} (${authStatus})`
            },
            {
              method: 'GET',
              path: `/${table}/:id`,
              description: `Get a single ${table} by ID`,
              auth: !skipAuth,
              fullPath: `https://backlify-v2.onrender.com/api/${apiId}/${table}/:id (${authStatus})`
            },
            {
              method: 'POST',
              path: `/${table}`,
              description: `Create a new ${table}`,
              auth: !skipAuth,
              fullPath: `https://backlify-v2.onrender.com/api/${apiId}/${table} (${authStatus})`
            },
            {
              method: 'PUT',
              path: `/${table}/:id`,
              description: `Update an existing ${table}`,
              auth: !skipAuth,
              fullPath: `https://backlify-v2.onrender.com/api/${apiId}/${table}/:id (${authStatus})`
            },
            {
              method: 'DELETE',
              path: `/${table}/:id`,
              description: `Delete a ${table}`,
              auth: !skipAuth,
              fullPath: `https://backlify-v2.onrender.com/api/${apiId}/${table}/:id (${authStatus})`
            }
          ]
        };
      });
      
      console.log('Transformed endpoints:', transformedEndpoints);
      
      // Set endpoints data
      setEndpoints(transformedEndpoints);
      setApiBaseUrl(`https://backlify-v2.onrender.com/api/${apiId}`);
      setSwaggerUrl(`https://backlify-v2.onrender.com/api/${apiId}/docs/`);
      
      // Set the first table as selected by default if we have endpoints
      if (transformedEndpoints.length > 0) {
        setSelectedTable(transformedEndpoints[0].table);
        
        // Try to fetch table schema
        try {
          await fetchTableSchema(transformedEndpoints[0].table);
        } catch (error) {
          console.error('Error fetching table schema:', error);
        }
        
        // Load table data
        await loadTableData(transformedEndpoints[0].table);
      }
    } catch (error) {
      console.error('Error loading API endpoints:', error);
      //setError('Failed to load API endpoints: ' + error.message);
    } finally {
      setInitialLoading(false);
      setIsLoading(false);
    }
  };

  // Function to handle the existing session storage data loading
  const loadEndpointsFromSession = async (storedEndpoints, apiLoadingFlag) => {
    // Always start with loading state active if coming from schema page
    if (apiLoadingFlag === 'true') {
      setInitialLoading(true);
      setIsLoading(true);
      // Keep the loading animation visible for at least 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    try {
      // Parse the endpoints data
      let endpointsData;
      try {
        endpointsData = JSON.parse(storedEndpoints);
        console.log('Loaded API endpoints from session:', endpointsData);
      } catch (parseError) {
        console.error('Failed to parse endpoints data:', parseError);
        throw new Error('Invalid endpoint data format');
      }
      
      if (!endpointsData) {
        throw new Error('No endpoint data available');
      }
      
      // Set API ID even if there's an issue with the data structure
      if (endpointsData.apiId) {
        console.log('Storing API ID in localStorage from session data:', endpointsData.apiId);
        localStorage.setItem('selectedApiId', endpointsData.apiId);
        setApiId(endpointsData.apiId);
        setApiBaseUrl(`https://backlify-v2.onrender.com/api/${endpointsData.apiId}`);
      } else {
        console.warn('No API ID found in endpoint data');
      }
      
      // Get table definitions from the API response
      if (endpointsData.tables && Array.isArray(endpointsData.tables)) {
        // Also store in session storage for other components to access
        sessionStorage.setItem('tableDefinitions', JSON.stringify(endpointsData.tables));
        console.log('Stored table definitions in session storage:', endpointsData.tables);
        
        // Store the complete schema information in state
        setCompleteSchemaInfo(endpointsData.tables);
        console.log('Loaded complete schema information:', endpointsData.tables);
        
        // Build table schemas from the complete info
        const schemas = {};
        endpointsData.tables.forEach(table => {
          const schema = {};
          if (Array.isArray(table.columns)) {
            table.columns.forEach(column => {
              const isRequired = column.constraints?.includes('not null');
              const isPrimary = column.constraints?.includes('primary key');
              
              // Determine the type based on database column type
              let fieldType = 'string';
              if (column.type === 'uuid' || column.type.includes('int') || column.name.endsWith('_id')) {
                fieldType = 'id';
              } else if (column.type === 'timestamp' || column.type === 'timestamptz' || column.type === 'date') {
                fieldType = 'timestamp';
              } else if (column.type === 'boolean') {
                fieldType = 'boolean';
              } else if (column.type === 'numeric' || column.type === 'decimal' || column.type === 'float') {
                fieldType = 'number';
              } else if (column.type === 'text' || column.type.includes('text')) {
                fieldType = 'longtext';
              }
              
              schema[column.name] = { 
                type: fieldType, 
                required: isRequired,
                primary: isPrimary,
                constraints: column.constraints || []
              };
            });
          }
          schemas[table.name] = schema;
        });
        
        // Store the schemas in state for form generation
        console.log('Generated table schemas from API definition:', schemas);
        setTableSchemas(schemas);
        
        // Create basic endpoints if they don't exist in the response
        if (!endpointsData.endpoints || !Array.isArray(endpointsData.endpoints) || endpointsData.endpoints.length === 0) {
          console.log('No endpoints found in data, creating basic endpoints from tables');
          const basicEndpoints = endpointsData.tables.map(table => ({
            table: table.name,
            routes: [
              { method: 'GET', path: `/${table.name}` },
              { method: 'GET', path: `/${table.name}/:id` },
              { method: 'POST', path: `/${table.name}` },
              { method: 'PUT', path: `/${table.name}/:id` },
              { method: 'DELETE', path: `/${table.name}/:id` }
            ]
          }));
          endpointsData.endpoints = basicEndpoints;
        }
      }
      
      // Set user ID if available
      if (endpointsData.XAuthUserId) {
        setUserId(endpointsData.XAuthUserId);
      }
      
      // Set swagger URL if available
      if (endpointsData.swagger_url) {
        setSwaggerUrl(`https://backlify-v2.onrender.com${endpointsData.swagger_url}`);
      } else if (endpointsData.apiId) {
        // Create a default swagger URL based on the API ID
        setSwaggerUrl(`https://backlify-v2.onrender.com/api/${endpointsData.apiId}/docs/`);
      }
      
      // Check if endpoints array exists and is valid
      if (!endpointsData.endpoints || !Array.isArray(endpointsData.endpoints)) {
        console.warn('Invalid or missing endpoints array in data');
        endpointsData.endpoints = [];
      }
      
      // Transform endpoints into a more usable format
      const transformedEndpoints = endpointsData.endpoints.map(endpoint => {
        // Make sure routes array exists
        const routes = Array.isArray(endpoint.routes) ? endpoint.routes : [];
        return {
          name: endpoint.table ? endpoint.table.charAt(0).toUpperCase() + endpoint.table.slice(1) : 'Unknown',
          baseUrl: `/api/${endpointsData.apiId}/${endpoint.table}`,
          table: endpoint.table || 'unknown',
          endpoints: routes.map(route => {
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
              fullPath: `https://backlify-v2.onrender.com/api/${endpointsData.apiId}${route.path}`
            };
          })
        };
      });
      
      // Set endpoints data
      setEndpoints(transformedEndpoints);
      
      // Set the first table as selected by default if we have endpoints
      if (transformedEndpoints.length > 0) {
        setSelectedTable(transformedEndpoints[0].table);
        
        // Try to fetch table schema and load data
        try {
          // We may already have the schema from the complete schema info
          if (!tableSchemas[transformedEndpoints[0].table]) {
            await fetchTableSchema(transformedEndpoints[0].table);
          }
          await loadTableData(transformedEndpoints[0].table);
        } catch (schemaError) {
          console.error('Error fetching initial table data:', schemaError);
        }
      }
    } catch (error) {
      console.error('Error loading API endpoints from session:', error);
      //setError('Failed to load API endpoints: ' + error.message);
      
      // Clear session storage to prevent repeated errors
      sessionStorage.removeItem('apiEndpoints');
      sessionStorage.removeItem('apiLoading');
      
      // Redirect back to schema page after a short delay
      setTimeout(() => {
        navigate('/schema');
      }, 2000);
    } finally {
      // Clean up loading states
      setInitialLoading(false);
      setIsLoading(false);
      sessionStorage.removeItem('apiLoading');
      sessionStorage.removeItem('loadingStartTime');
    }
  };

  useEffect(() => {
    // Load table data when selected table changes
    if (selectedTable && apiBaseUrl) {
      loadTableData(selectedTable);
    }
  }, [selectedTable, apiBaseUrl]);

  // Update the loadTableData function to use fetchWithAuth
  const loadTableData = async (table, page = 1, limit = 10) => {
    if (!apiId || !table) {
      console.error('Missing apiId or table name for loading data');
      return;
    }

    setIsLoading(true);
    setError(null); // Clear any previous errors
    
    try {
      console.log(`Loading data for ${table}, page ${page}, limit ${limit}`);
      
      // Create URL with pagination parameters
      let url = `${apiBaseUrl}/${table}?page=${page}&limit=${limit}`;
      
      // Note: skipAuth parameter will be added by fetchWithAuth, so we don't add it here
      // to prevent duplication
      
      console.log(`Fetching from URL: ${url} with skipAuth=${skipAuth}`);
      
      const response = await fetchWithAuth(url);
      
      if (!response.ok) {
        // Don't throw for 401/403 since we already tried to refresh the token
        if (response.status !== 401 && response.status !== 403) {
          throw new Error(`Failed to load ${table} data: ${response.status} ${response.statusText}`);
        } else {
          console.warn(`Authentication issue when loading ${table} data, silent handling...`);
          // Return early without showing error to user
          setTableData([]);
          setIsLoading(false);
          return;
        }
      }
      
      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
        console.log(`${table} data loaded:`, data);
      } catch (error) {
        console.error('Error parsing response:', error, 'Raw response:', responseText);
        throw new Error('Invalid response format');
      }
      
      if (data && data.data) {
        setTableData(data.data);
        
        if (data.pagination) {
          setPagination({
            page: data.pagination.page || 1,
            limit: data.pagination.limit || 10,
            total: data.pagination.total || 0
          });
        }
        
        // If we don't have schema information yet, infer it from the data
        if (!tableSchemas[table] && data.data.length > 0) {
          const schema = inferSchemaFromRecord(data.data[0]);
          setTableSchemas(prev => ({
            ...prev,
            [table]: schema
          }));
        }
      } else {
        setTableData([]);
        setPagination({
          page: 1,
          limit: 10,
          total: 0
        });
      }
    } catch (error) {
      console.error(`Error loading ${table} data:`, error);
      // Only set the error message for non-401/403 errors
      if (error.message.indexOf('401') === -1 && error.message.indexOf('403') === -1) {
        setError(`Error loading ${table} data: ${error.message}`);
      }
      setTableData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsersData = async () => {
    if (!apiBaseUrl) {
      console.log('Cannot load users data: missing API base URL');
      return;
    }
    
    try {
      // Create URL with limit parameter
      let url = `${apiBaseUrl}/users?limit=100`;
      
      // Note: skipAuth parameter will be added by fetchWithAuth, so we don't add it here
      // to prevent duplication
      
      console.log(`Loading users data from: ${url} with skipAuth=${skipAuth}`);
      
      const response = await fetchWithAuth(url);
      
      if (!response.ok && response.status !== 401 && response.status !== 403) {
        console.error(`Error loading users data: ${response.status} ${response.statusText}`);
        return;
      }
      
      const responseText = await response.text();
      
      try {
        // Try to parse the response as JSON
        const data = JSON.parse(responseText);
        console.log(`Received users data:`, data);
        
        if (Array.isArray(data?.data)) {
          setUserData(data.data);
        } else if (Array.isArray(data)) {
          setUserData(data);
        } else {
          console.warn(`Unexpected data format for users:`, data);
          setUserData([]);
        }
      } catch (parseError) {
        console.error(`Error parsing response for users:`, parseError);
        console.log(`Raw response:`, responseText);
      }
    } catch (error) {
      console.error(`Error loading users data:`, error);
      // Don't show errors to the user for auth issues
    }
  };

  const handleSelectTable = (table) => {
    setSelectedTable(table);
  };

  const handleGoBack = () => {
    console.log(`Navigating back to ${originPage} page`);
    
    if (originPage === 'dashboard') {
      // When going back to dashboard, set a flag to refresh it to show the latest APIs
      localStorage.setItem('refresh_dashboard', 'true');
      navigate('/dashboard');
    } else {
      // When going back to schema, set a flag to reload schema data if needed
      sessionStorage.setItem('reload_schema', 'true');
      navigate('/schema');
    }
  };

  // Utility function to handle authenticated fetches with automatic token refresh
  const fetchWithAuth = async (url, options = {}) => {
    try {
      // Don't add skipAuth parameter to API calls
      const finalUrl = url;
      
      // Always use auth headers for actual API calls
      const headers = {
        ...getAuthHeaders(),
        ...options.headers
      };
      
      // Create the initial request config
      const config = {
        ...options,
        headers
      };
      
      console.log(`Making authenticated request to: ${finalUrl}`);
      
      // Make the first request
      let response = await fetch(finalUrl, config);
      
      // Try token refresh if we get a 401/403
      if (response.status === 401 || response.status === 403) {
        try {
          console.log('Token expired, attempting refresh...');
          // Try to refresh the token
          await refreshAccessToken();
          
          // Get new headers with the refreshed token
          const newHeaders = {
            ...getAuthHeaders(),
            ...options.headers
          };
          
          // Create a new config with the updated headers
          const newConfig = {
            ...options,
            headers: newHeaders
          };
          
          // Retry the request with the new token
          console.log('Retrying request with new token...');
          response = await fetch(finalUrl, newConfig);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // We don't throw here - we'll continue and let the caller handle the response
        }
      }
      
      // Return the response object so the caller can handle it
      return response;
    } catch (error) {
      console.error(`API request error (${url}):`, error);
      throw error;
    }
  };

  // Utility function to get auth headers with bearer token
  const getAuthHeaders = () => {
    const token = getAccessToken();
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Get the user ID from session storage
    const userIdFromSession = sessionStorage.getItem('XAuthUserId');
    if (userIdFromSession) {
      headers['XAuthUserId'] = userIdFromSession;
    }
    
    return headers;
  };

  // Function to check if the API endpoint is ready
  const checkApiReady = async (url) => {
    try {
      console.log(`Testing API endpoint: ${url}`);
      const response = await fetchWithAuth(url, { method: 'GET' });
      
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

  // Function to extract required fields from the schema
  const getRequiredFieldsFromSchema = (tableName) => {
    // If we have complete schema information, use it
    if (completeSchemaInfo) {
      const table = completeSchemaInfo.find(t => t.name === tableName);
      
      if (table && table.columns) {
        // Get all columns that have a 'not null' constraint
        const requiredFields = table.columns
          .filter(column => column.constraints && column.constraints.includes('not null'))
          .map(column => column.name);
          
        console.log(`Required fields for ${tableName} from schema:`, requiredFields);
        return requiredFields;
      }
    }
    
    // Fallback to tableSchemas if available
    if (tableSchemas && tableSchemas[tableName]) {
      const schema = tableSchemas[tableName];
      const requiredFields = Object.entries(schema)
        .filter(([_, details]) => details.required)
        .map(([field]) => field);
      
      if (requiredFields.length > 0) {
        console.log(`Required fields for ${tableName} from tableSchemas:`, requiredFields);
        return requiredFields;
      }
    }
    
    // Default common required fields if nothing else available
    return ['id'];
  };

  // Add a function to ensure doctor form fields are properly initialized if table is 'doctors'
  const ensureDoctorFormFields = (formData, tableName) => {
    // Only apply special handling to the doctors table
    if (tableName !== 'doctors') {
      return formData;
    }
    
    const updatedFormData = { ...formData };
    
    // Ensure doctor-specific fields exist
    if (!updatedFormData.hasOwnProperty('first_name')) {
      updatedFormData.first_name = '';
    }
    
    if (!updatedFormData.hasOwnProperty('last_name')) {
      updatedFormData.last_name = '';
    }
    
    if (!updatedFormData.hasOwnProperty('specialization')) {
      updatedFormData.specialization = '';
    }
    
    // Ensure timestamps are set
    if (!updatedFormData.hasOwnProperty('created_at')) {
      updatedFormData.created_at = new Date().toISOString();
    }
    
    if (!updatedFormData.hasOwnProperty('updated_at')) {
      updatedFormData.updated_at = new Date().toISOString();
    }
    
    return updatedFormData;
  };

  // Modify the handleOpenModal function to use the complete schema info
  const handleOpenModal = async (mode, endpoint, record = null) => {
    if (!endpoint) {
      console.error('Cannot open modal: missing endpoint information');
      return;
    }
    
    // Ensure endpoint has all required properties
    endpoint = {
      table: endpoint.table || '',
      ...endpoint
    };
    
    console.log(`Opening modal for ${mode} operation on table ${endpoint.table}`, { endpoint, record });
    
    setModalMode(mode);
    setSelectedEndpoint(endpoint);
    setShowModal(true); // Show modal immediately with loading state
    setIsLoading(true); // Indicate loading
    setSubmitError('');
    
    // Reset states
    setOperationResult({ show: false, success: false, message: '', data: null });
    
    try {
      // Get required fields for this table
      const requiredFields = getRequiredFieldsFromSchema(endpoint.table);
      console.log(`Required fields for ${endpoint.table}:`, requiredFields);
      
      // Get user ID from sessionStorage
      const userIdFromSession = sessionStorage.getItem('XAuthUserId') || XAuthUserId;
      
      // Special handling for admin table - ensure users data is loaded
      if (endpoint.table === 'admin') {
        await loadUsersData();
      }
      
      // Identify all potential foreign key fields (ending with _id)
      const allPotentialForeignKeys = [];
      
      // First, check relationship data from completeSchemaInfo
      if (completeSchemaInfo) {
        // Find the current table
        const currentTable = completeSchemaInfo.find(table => table.name === endpoint.table);
        console.log(`Current table for identifying foreign keys:`, currentTable);
        
        if (currentTable) {
          // Add relationship source columns
          if (currentTable.relationships) {
            currentTable.relationships.forEach(rel => {
              if (rel.sourceColumn !== 'id' && !allPotentialForeignKeys.includes(rel.sourceColumn)) {
                allPotentialForeignKeys.push(rel.sourceColumn);
                console.log(`Added foreign key from relationship: ${rel.sourceColumn} -> ${rel.targetTable}`);
              }
            });
          }
          
          // Add any column ending with _id from the schema
          if (currentTable.columns) {
            currentTable.columns.forEach(column => {
              if (column.name.endsWith('_id') && column.name !== 'id' && !allPotentialForeignKeys.includes(column.name)) {
                allPotentialForeignKeys.push(column.name);
                console.log(`Added foreign key from column name: ${column.name}`);
              }
            });
          }
        }
        
        // Also check other tables' relationships that might reference this table
        for (const table of completeSchemaInfo) {
          if (table.relationships) {
            table.relationships.forEach(rel => {
              if (rel.targetTable === endpoint.table && !allPotentialForeignKeys.includes(rel.sourceColumn)) {
                allPotentialForeignKeys.push(rel.sourceColumn);
                console.log(`Added foreign key from cross-table relationship: ${rel.sourceColumn}`);
              }
            });
          }
        }
      }
      
      // Also check from the record if available
      if (record) {
        Object.keys(record).forEach(key => {
          if (key.endsWith('_id') && key !== 'id' && !allPotentialForeignKeys.includes(key)) {
            allPotentialForeignKeys.push(key);
            console.log(`Added foreign key from record: ${key}`);
          }
        });
      }
      
      // Always add XAuthUserId as a potential foreign key for admin table
      if (endpoint.table === 'admin' && !allPotentialForeignKeys.includes('XAuthUserId')) {
        allPotentialForeignKeys.push('XAuthUserId');
        console.log('Added XAuthUserId as foreign key for admin table');
      }
      
      console.log(`Identified potential foreign key fields for ${endpoint.table}:`, allPotentialForeignKeys);
      
      // Load related data for all potential foreign key fields
      const relationshipLoading = [];
      
      for (const field of allPotentialForeignKeys) {
        const relatedTable = getForeignKeyReference(field);
        if (relatedTable) {
          console.log(`Loading related data for ${field} from table ${relatedTable}`);
          relationshipLoading.push(
            loadRelatedTableData(relatedTable).then(data => {
              // Explicitly set the relation between the field and the table
              console.log(`Setting relationship mapping: ${field} -> ${relatedTable} (${data.length} records)`);
              setRelatedTableData(prev => ({
                ...prev,
                [field]: data
              }));
              
              // Also store in a direct mapping for this field
              const foreignKeyMap = {...fieldToTableMap};
              foreignKeyMap[field] = relatedTable;
              setFieldToTableMap(foreignKeyMap);
              
              return { field, relatedTable, data };
            }).catch(error => {
              console.error(`Failed to load data for ${field} from ${relatedTable}:`, error);
              return { field, relatedTable, error };
            })
          );
        } else {
          console.warn(`Could not determine related table for foreign key: ${field}`);
        }
      }
      
      // Wait for all relationship data to load
      if (relationshipLoading.length > 0) {
        const results = await Promise.allSettled(relationshipLoading);
        console.log('Finished loading relationship data:', results.map(r => 
          r.status === 'fulfilled' ? 
            `${r.value.field}: ${r.value.data?.length || 0} records` : 
            `${r.reason?.field || 'unknown'}: failed`
        ));
        
        // Log all related dropdown data for debugging
        console.log('Complete related table mapping:', fieldToTableMap);
        console.log('Available dropdown data:', Object.keys(relatedTableData).map(key => 
          `${key}: ${relatedTableData[key]?.length || 0} items`
        ));
      }
      
      // Initialize form data based on mode
      if (mode === 'create') {
        // For create, initialize with empty values based on table schema
        let initialFormData = {};
        
        // Generate a UUID for the id field - required by the backend
        initialFormData.id = generateUUID();
        
        // Special handling for districts - set default city_id if cities are available
        if (endpoint.table === 'districts') {
          const citiesData = await loadRelatedTableData('cities');
          if (citiesData && citiesData.length > 0) {
            initialFormData.city_id = citiesData[0].id;
            console.log(`Setting default city_id to ${citiesData[0].id}`);
          }
        }
        
        // Get table schema from our complete schema info
        if (completeSchemaInfo) {
          const tableSchema = completeSchemaInfo.find(table => table.name === endpoint.table);
          
          if (tableSchema && tableSchema.columns) {
            console.log(`Using schema from completeSchemaInfo for ${endpoint.table}`);
            
            // Initialize form fields based on column definitions
            tableSchema.columns.forEach(column => {
              if (column.name === 'id' && initialFormData.id) {
                // Skip if we already set the ID
                return;
              }
              
              // Skip XAuthUserId field for doctors table (unless it's a relationship field)
              if (endpoint.table === 'doctors' && column.name === 'XAuthUserId') {
                // Check if it's a relationship field
                const isRelationshipField = tableSchema.relationships?.some(rel => 
                  rel.sourceColumn === 'XAuthUserId' || rel.targetColumn === 'XAuthUserId'
                );
                
                if (!isRelationshipField) {
                  return; // Skip this field
                }
              }
              
              // Set appropriate default values based on column type
              let defaultValue;
              
              switch (column.type) {
                case 'uuid':
                  defaultValue = column.name === 'id' ? generateUUID() : '';
                  break;
                case 'int':
                case 'integer':
                case 'bigint':
                case 'smallint':
                  defaultValue = 0;
                  break;
                case 'float':
                case 'double':
                case 'decimal':
                case 'numeric':
                  defaultValue = 0.0;
                  break;
                case 'boolean':
                  defaultValue = false;
                  break;
                case 'date':
                  defaultValue = new Date().toISOString().split('T')[0];
                  break;
                case 'timestamp':
                case 'timestamptz':
                  // Check if this is a created_at or updated_at field
                  if (column.name.includes('_at')) {
                    defaultValue = new Date().toISOString();
                  } else {
                    defaultValue = new Date().toISOString();
                  }
                  break;
                default:
                  defaultValue = '';
              }
              
              initialFormData[column.name] = defaultValue;
            });
          }
        } 
        else if (tableSchemas[endpoint.table]) {
          // Fallback to the previously loaded schema
          console.log('Using cached schema:', tableSchemas[endpoint.table]);
          Object.entries(tableSchemas[endpoint.table]).forEach(([key, fieldSchema]) => {
            // Don't overwrite already set fields
            if (!initialFormData.hasOwnProperty(key)) {
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
        
        // If no schema available, use the record as a template
        if (Object.keys(initialFormData).length <= 1 && record) {
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
        
        // Ensure we have created_at and updated_at fields if required
        if (requiredFields.includes('created_at') && !initialFormData.hasOwnProperty('created_at')) {
          initialFormData.created_at = new Date().toISOString();
        }
        if (requiredFields.includes('updated_at') && !initialFormData.hasOwnProperty('updated_at')) {
          initialFormData.updated_at = new Date().toISOString();
        }
        
        // Ensure all required fields are included
        requiredFields.forEach(field => {
          if (!initialFormData.hasOwnProperty(field)) {
            initialFormData[field] = '';
          }
        });
        
        console.log('Final form data for create:', initialFormData);
        
        // Ensure XAuthUserId is set correctly
        initialFormData = ensureUserIdInFormData(initialFormData);
        
        // Apply special handling for doctors table
        initialFormData = ensureDoctorFormFields(initialFormData, endpoint.table);
        
        setFormData(initialFormData);
        setResourceId(initialFormData.id);
      } else if (mode === 'read' || mode === 'update' || mode === 'delete') {
        // For other modes, use the provided record data
        if (record) {
          console.log(`Setting form data for ${mode} operation:`, record);
          
          // Make a copy of the record and ensure XAuthUserId is set correctly
          let updatedRecord = ensureUserIdInFormData({ ...record });
          
          // Apply special handling for doctors table
          updatedRecord = ensureDoctorFormFields(updatedRecord, endpoint.table);
          
          setFormData(updatedRecord);
          setResourceId(record.id || '');
          
          // If we're updating, load related data for foreign keys in this record
          if (mode === 'update') {
            const recordForeignKeys = Object.keys(record).filter(key => 
              key !== 'id' && key.endsWith('_id')
            );
            
            for (const field of recordForeignKeys) {
              const relatedTable = getForeignKeyReference(field);
              if (relatedTable) {
                const data = await loadRelatedTableData(relatedTable);
                setRelatedTableData(prev => ({
                  ...prev,
                  [field]: data
                }));
              }
            }
          }
        } else {
          console.error(`Cannot perform ${mode} operation: missing record data`);
          setSubmitError(`Cannot perform ${mode} operation: missing record data`);
        }
      }
    } catch (error) {
      console.error('Error preparing modal form:', error);
      setSubmitError(`Error preparing form: ${error.message}`);
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
    console.log(`Form change: ${key} = ${value} (type: ${typeof value})`);
    
    // Special handling for ID fields (dropdown selections)
    if (key.endsWith('_id') && key !== 'id') {
      // For ID fields, if the value is a string but represents a number, convert it
      // Empty string should be converted to null
      if (value === '') {
        setFormData(prev => ({ ...prev, [key]: null }));
      } else {
        // Try to convert to number if it's a numeric string
        const numValue = Number(value);
        if (!isNaN(numValue)) {
          setFormData(prev => ({ ...prev, [key]: numValue }));
        } else {
          // Keep as string if it's not convertible to number
          setFormData(prev => ({ ...prev, [key]: value }));
        }
      }
      return;
    }
    
    // Handle type conversion for numeric fields
    if (getFieldType(key) === 'number') {
      // For empty inputs, use null instead of trying to parse an empty string to number
      if (value === '') {
        setFormData(prev => ({ ...prev, [key]: null }));
        return;
      }
      
      // For numeric fields, convert to number
      const numValue = Number(value);
      if (!isNaN(numValue)) {
        setFormData(prev => ({ ...prev, [key]: numValue }));
      }
      // If conversion fails, don't update the state (keep previous valid value)
      return;
    }
    
    // For other field types, update normally
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // Add a function to detect field types based on field name or content
  const getFieldType = (key, value) => {
    // First check table schema for this field if available
    if (selectedEndpoint && tableSchemas[selectedEndpoint.table]) {
      const schema = tableSchemas[selectedEndpoint.table];
      if (schema[key]) {
        // Use the schema type information
        const fieldSchema = schema[key];
        
        // For database integer types, always return 'number'
        if (fieldSchema.type === 'integer' || fieldSchema.type === 'id') {
          return 'number';
        }
        
        // For known database types
        if (fieldSchema.type === 'timestamp' || fieldSchema.type === 'date') {
          return 'date';
        }
        
        if (fieldSchema.type === 'boolean') {
          return 'boolean';
        }
        
        if (fieldSchema.type === 'number' || fieldSchema.type === 'float' || 
            fieldSchema.type === 'decimal' || fieldSchema.type === 'numeric') {
          return 'number';
        }
        
        if (fieldSchema.type === 'longtext') {
          return 'longtext';
        }
      }
    }
    
    // Fallback to checking column schema from the API definition
    if (selectedEndpoint && completeSchemaInfo) {
      const table = completeSchemaInfo.find(t => t.name === selectedEndpoint.table);
      if (table && table.columns) {
        const column = table.columns.find(c => c.name === key);
        if (column) {
          // Column types directly from database schema
          if (column.type && (
              column.type === 'int' || 
              column.type === 'integer' || 
              column.type === 'bigint' || 
              column.type === 'smallint' || 
              column.type.includes('int')
             )) {
            return 'number';
          }
          
          if (column.type && (
              column.type === 'numeric' || 
              column.type === 'decimal' || 
              column.type === 'float' || 
              column.type === 'double' ||
              column.type === 'real' ||
              column.type.includes('money')
             )) {
            return 'number';
          }
          
          if (column.type && (
              column.type === 'timestamp' || 
              column.type === 'timestamptz' || 
              column.type === 'date'
             )) {
            return 'date';
          }
          
          if (column.type === 'boolean' || column.type === 'bool') {
            return 'boolean';
          }
        }
      }
    }
    
    // Check common field names that should be numeric
    const numericFields = ['price', 'amount', 'quantity', 'stock', 'count', 'total', 'cost', 'rate', 
                          'number', 'num', 'height', 'width', 'length', 'weight', 'age', 'size'];
    
    if (numericFields.some(field => key.toLowerCase().includes(field))) {
      return 'number';
    }
    
    // Fallback to heuristics based on field name and value
    
    // Common date field names
    const dateFields = ['date', 'birth', 'dob', 'created_at', 'updated_at', 'birthday', 'birthdate'];
    
    // Check if any date-related keywords are in the field name
    if (dateFields.some(field => key.toLowerCase().includes(field))) {
      return 'date';
    }
    
    // Check if it's a number field by name pattern
    if (key === 'id' || key.endsWith('_id') || key.includes('_id_')) {
      return 'number';
    }
    
    // Check by value type
    if (value !== null && value !== undefined) {
      if (typeof value === 'number') {
        return 'number';
      }
      if (typeof value === 'boolean') {
        return 'boolean';
      }
      // Check if the string value is actually a number
      if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') {
        return 'number';
      }
    }
    
    // Default to text for unknown types
    return 'text';
  };

  // Add a function to determine input type for rendering
  const getInputType = (key) => {
    const fieldType = getFieldType(key);
    
    if (fieldType === 'date') {
      return 'date';
    } else if (fieldType === 'number') {
      return 'number';
    } else if (fieldType === 'boolean') {
      return 'checkbox';
    } else if (fieldType === 'longtext') {
      return 'textarea';
    }
    
    return 'text';
  };

  // Function to check if a field should be hidden in the UI
  const shouldHideField = (fieldName) => {
    // Hide XAuthUserId field
    return fieldName === 'XAuthUserId';
  };

  // Ensure XAuthUserId is included in the form data when needed
  const ensureUserIdInFormData = (data) => {
    const result = { ...data };
    // If XAuthUserId doesn't exist in the data, add it from the apiService
    if (!result.XAuthUserId) {
      result.XAuthUserId = getXAuthUserId(); // Use the XAuthUserId from apiService
    }
    return result;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSubmitError('');
    
    // Clear any previous operation result
    setOperationResult({ show: false, success: false, message: '', data: null });
    
    console.log('Selected endpoint:', selectedEndpoint);
    
    if (!selectedEndpoint || !selectedEndpoint.table) {
      console.error('Invalid endpoint configuration:', selectedEndpoint);
      setSubmitError('Invalid endpoint configuration');
      setIsLoading(false);
      return;
    }
    
    // Check for required fields that are missing values
    const requiredValidationErrors = validateRequiredFields(formData, selectedEndpoint.table);
    if (requiredValidationErrors) {
      setSubmitError(requiredValidationErrors);
      setIsLoading(false);
      return;
    }
    
    try {
      const resourceUrl = `${apiBaseUrl}/${selectedEndpoint.table}`;
      const requestUrl = modalMode === 'create' ? resourceUrl : `${resourceUrl}/${resourceId}`;
      
      console.log(`Submitting ${modalMode} request to:`, requestUrl);
      
      // Configure the request based on the operation
      let requestConfig = {
        method: modalMode === 'create' ? 'POST' : 
                modalMode === 'update' ? 'PUT' : 
                modalMode === 'delete' ? 'DELETE' : 'GET'
      };
      
      // Add body for POST and PUT requests
      if (modalMode === 'create' || modalMode === 'update') {
        // Make sure the formData has the XAuthUserId included
        const formDataWithUserId = ensureUserIdInFormData(formData);
        requestConfig.body = JSON.stringify(formDataWithUserId);
      }
      
      console.log('Request config:', {
        method: requestConfig.method,
        url: requestUrl,
        bodyPreview: requestConfig.body ? requestConfig.body.substring(0, 200) + '...' : 'No body'
      });
      
      const response = await fetchWithAuth(requestUrl, requestConfig);
      
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
        // Handle auth errors silently
        if (response.status === 401 || response.status === 403) {
          console.warn(`Authentication issue during ${modalMode} operation, handled silently`);
          // Still set an operation result but don't show auth errors to user
          setOperationResult({
            show: true,
            success: false,
            message: 'Operation could not be completed',
            data: null
          });
        } else {
          // Error handling for non-auth errors
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
      }
    } catch (error) {
      console.error('Request error:', error);
      
      // Don't show authentication errors to the user
      const isAuthError = error.message.includes('401') || error.message.includes('403') || 
                         error.message.includes('Authentication') || error.message.includes('token');
      
      if (!isAuthError) {
        setSubmitError(`Error: ${error.message || 'Unknown error occurred'}`);
        
        setOperationResult({
          show: true,
          success: false,
          message: `Error: ${error.message || 'Unknown error occurred'}`,
          data: null
        });
      } else {
        console.warn('Authentication error handled silently');
        setOperationResult({
          show: true,
          success: false,
          message: 'Operation could not be completed',
          data: null
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to validate required fields based on schema and foreign keys
  const validateRequiredFields = (data, tableName) => {
    // First, check for required foreign key fields (fields ending with _id)
    const foreignKeyFields = Object.keys(data).filter(key => 
      key.endsWith('_id') && key !== 'id' && key !== 'XAuthUserId'
    );
    
    // Check if any foreign key field is missing a value
    for (const field of foreignKeyFields) {
      if (!data[field] && data[field] !== 0) {
        // Get a friendly field name for the error message
        const friendlyFieldName = formatFieldName(field);
        return `Please select a value for ${friendlyFieldName}`;
      }
    }
    
    // Check for other required fields from the schema
    if (tableSchemas[tableName]) {
      const schema = tableSchemas[tableName];
      
      for (const [field, fieldSchema] of Object.entries(schema)) {
        // Skip id field for create operations
        if (field === 'id' && modalMode === 'create') continue;
        
        // Skip created_at and updated_at fields as they're auto-generated
        if (field === 'created_at' || field === 'updated_at') continue;
        
        // Check if the field is required according to schema
        if (fieldSchema.required && (!data[field] && data[field] !== 0 && data[field] !== false)) {
          const friendlyFieldName = formatFieldName(field);
          return `${friendlyFieldName} is required`;
        }
      }
    }
    
    // If no validation errors were found, return null
    return null;
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
    if (!tableName) {
      console.error('fetchTableSchema: Missing table name');
      return null;
    }
    
    // First, check if we already have this table schema in our state
    if (tableSchemas[tableName]) {
      console.log(`Using existing schema for ${tableName}:`, tableSchemas[tableName]);
      return tableSchemas[tableName];
    }
    
    // If not in state, check if we have the table definition from the API response
    try {
      const tableDefinitionsString = sessionStorage.getItem('tableDefinitions');
      if (tableDefinitionsString) {
        const tableDefinitions = JSON.parse(tableDefinitionsString);
        const tableDefinition = tableDefinitions.find(t => t.name === tableName);
        
        if (tableDefinition && tableDefinition.columns) {
          console.log(`Using table definition from API response for ${tableName}:`, tableDefinition);
          return inferDefaultSchema(tableName); // This will now use the table definition
        }
      }
    } catch (error) {
      console.error('Error checking for table definition:', error);
    }
    
    // If we don't have definitions, try to get them from the API
    if (!apiBaseUrl && apiId) {
      // If apiBaseUrl is not set but we have apiId, set it
      const newApiBaseUrl = `https://backlify-v2.onrender.com/api/${apiId}`;
      console.log(`Setting API base URL to ${newApiBaseUrl}`);
      setApiBaseUrl(newApiBaseUrl);
    }
    
    // If we still don't have a valid API URL, return default schema
    if (!apiBaseUrl && !apiId) {
      console.error('fetchTableSchema: Missing API base URL and API ID');
      return inferDefaultSchema(tableName);
    }
    
    const url = `${apiBaseUrl || `https://backlify-v2.onrender.com/api/${apiId}`}/${tableName}?limit=1`;
    
    console.log(`Fetching schema for table: ${tableName}`);
    console.log(`Making schema discovery request to: ${url}`);
    
    setIsLoading(true);
    
    try {
      // Test if the API endpoint is ready
      const isApiReady = await checkApiReady(url);
      
      if (!isApiReady) {
        console.warn(`API endpoint not ready yet for ${tableName}, using default schema`);
        return inferDefaultSchema(tableName);
      }
      
      // Make the request to get data
      const response = await fetchWithAuth(url);
      
      // Handle 401/403 silently
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.warn(`Authentication issue when fetching schema for ${tableName}, using default schema`);
          return inferDefaultSchema(tableName);
        } else {
          console.error(`Error fetching sample data for ${tableName}:`, response.status, response.statusText);
          throw new Error(`Failed to fetch sample data: ${response.status} ${response.statusText}`);
        }
      }
      
      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log(`Received schema data for ${tableName}:`, data);
      } catch (error) {
        console.error('Error parsing response:', error, 'Raw response:', responseText);
        return inferDefaultSchema(tableName);
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
  
  // Helper function to create a default schema based on common table patterns or API response data
  const inferDefaultSchema = (tableName) => {
    console.log(`Creating default schema for ${tableName}`);
    
    // First, check if we have the table definition from the API response
    let tableDefinitions = null;
    try {
      const tableDefinitionsString = sessionStorage.getItem('tableDefinitions');
      if (tableDefinitionsString) {
        tableDefinitions = JSON.parse(tableDefinitionsString);
        console.log('Found table definitions in session storage:', tableDefinitions);
      }
    } catch (error) {
      console.error('Error parsing table definitions from session storage:', error);
    }
    
    // Try to find the definition for the current table
    if (tableDefinitions && Array.isArray(tableDefinitions)) {
      const tableDefinition = tableDefinitions.find(t => t.name === tableName);
      
      if (tableDefinition && tableDefinition.columns) {
        console.log(`Found table definition for ${tableName} in API response:`, tableDefinition);
        
        // Create schema based on the actual table definition
        const schema = {};
        
        // Filter out XAuthUserId from columns
        tableDefinition.columns
          .filter(column => column.name !== 'XAuthUserId')
          .forEach(column => {
            const isRequired = column.constraints?.includes('not null');
            const isPrimary = column.constraints?.includes('primary key');
            
            // Determine the type based on database column type
            let fieldType = 'string';
            if (column.type === 'uuid' || column.type.includes('int') || column.name.endsWith('_id')) {
              fieldType = 'id';
            } else if (column.type === 'timestamp' || column.type === 'timestamptz' || column.type === 'date') {
              fieldType = 'timestamp';
            } else if (column.type === 'boolean') {
              fieldType = 'boolean';
            } else if (column.type === 'numeric' || column.type === 'decimal' || column.type === 'float') {
              fieldType = 'number';
            } else if (column.type === 'text' || column.type.includes('text')) {
              fieldType = 'longtext';
            }
            
            schema[column.name] = { 
              type: fieldType, 
              required: isRequired,
              primary: isPrimary,
              constraints: column.constraints || []
            };
          });
        
        console.log('Schema created from API definition:', schema);
        
        // Update the tableSchemas state with this schema
        setTableSchemas(prev => ({
          ...prev,
          [tableName]: schema
        }));
        
        return schema;
      }
    }
    
    // Fallback to creating a default schema if no definition found
    console.log(`No API definition found for ${tableName}, creating default schema`);
    const schema = {
      id: { type: 'id' }
      // Don't include XAuthUserId in the default schema
    };
    
    // Add timestamp fields that are common
    schema.created_at = { type: 'timestamp' };
    schema.updated_at = { type: 'timestamp' };
    
    // Make educated guesses based on table name
    const tableNameLower = tableName.toLowerCase();
    
    if (tableNameLower.includes('user')) {
      schema.username = { type: 'string' };
      schema.email = { type: 'string' };
      schema.password_hash = { type: 'string' };
      schema.role_id = { type: 'id' }; 
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
    
    console.log('Default fallback schema created:', schema);
    
    // Update the tableSchemas state with this schema
    setTableSchemas(prev => ({
      ...prev,
      [tableName]: schema
    }));
    
    return schema;
  };

  // Function to generate a curl example for the endpoint
  const generateCurlExample = (endpoint) => {
    if (!endpoint) {
      // Return a default example if endpoint is undefined
      return `curl -X GET "https://backlify-v2.onrender.com/api/your-api-id/your-endpoint" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${getAccessToken() || 'YOUR_BEARER_TOKEN'}"`;
    }
    
    const token = getAccessToken() || 'YOUR_BEARER_TOKEN';
    
    // Handle the case where fullPath might be undefined
    let url = '';
    if (endpoint.fullPath) {
      // Remove the auth info from the fullPath
      url = endpoint.fullPath.split(' ')[0]; 
    } else if (endpoint.table) {
      url = `https://backlify-v2.onrender.com/api/${apiId || 'your-api-id'}/${endpoint.table}`;
    } else {
      url = 'https://backlify-v2.onrender.com/api/your-api-id/your-endpoint';
    }
    
    let method = endpoint.method || 'GET';
    let curlCmd = `curl -X ${method} "${url}"`;
    
    // Add headers
    curlCmd += ` \\\n  -H "Content-Type: application/json"`;
    
    // Apply skipAuth only to examples, not actual API calls
    if (!skipAuth) {
      curlCmd += ` \\\n  -H "Authorization: Bearer ${token}"`;
    } else {
      curlCmd += ` \\\n  -H "X-Skip-Auth: true"`;
    }
    
    // Add body for POST and PUT requests
    if (method === 'POST' || method === 'PUT') {
      let sampleBody = {};
      const uuid = generateUUID();
      const relatedUuid = generateUUID();
      const currentDate = new Date().toISOString();
      
      if (endpoint.table) {
        // Generate sample data based on table name
        switch(endpoint.table.toLowerCase()) {
          case 'users':
            sampleBody = {
              id: uuid,
              username: "example_user",
              email: "user@example.com",
              password: "securepassword",
              created_at: currentDate,
              updated_at: currentDate
            };
            break;
          case 'posts':
            sampleBody = {
              id: uuid,
              title: "Sample Post",
              content: "This is a sample post content.",
              user_id: relatedUuid,
              created_at: currentDate,
              updated_at: currentDate
            };
            break;
          case 'books':
            sampleBody = {
              id: uuid,
              title: "Sample Book",
              author: "Author Name",
              isbn: "978-3-16-148410-0",
              publication_date: "2023-01-15",
              created_at: currentDate,
              updated_at: currentDate
            };
            break;
          case 'loans':
            sampleBody = {
              id: uuid,
              book_id: relatedUuid,
              member_id: generateUUID(),
              loan_date: currentDate,
              due_date: new Date(Date.now() + 14*24*60*60*1000).toISOString(), // 2 weeks later
              return_date: null, // Usually null for a new loan
              created_at: currentDate,
              updated_at: currentDate
            };
            break;
          case 'members':
            sampleBody = {
              id: uuid,
              first_name: "John",
              last_name: "Doe",
              email: "john.doe@example.com",
              phone: "123-456-7890",
              created_at: currentDate,
              updated_at: currentDate
            };
            break;
          case 'orders':
            sampleBody = {
              id: uuid,
              user_id: relatedUuid,
              order_date: currentDate,
              total_amount: 99.99,
              status: "pending",
              created_at: currentDate,
              updated_at: currentDate
            };
            break;
          case 'products':
            sampleBody = {
              id: uuid,
              name: "Sample Product",
              description: "This is a sample product description",
              price: 29.99,
              stock: 100,
              created_at: currentDate,
              updated_at: currentDate
            };
            break;
          case 'appointments':
            sampleBody = {
              id: uuid,
              user_id: relatedUuid,
              doctor_id: generateUUID(),
              appointment_date: currentDate,
              notes: "Regular checkup",
              status: "scheduled",
              created_at: currentDate,
              updated_at: currentDate
            };
            break;
          case 'doctors':
            sampleBody = {
              id: uuid,
              first_name: "Dr. Jane",
              last_name: "Smith",
              specialization: "Cardiology",
              license_number: "MED-123456",
              created_at: currentDate,
              updated_at: currentDate
            };
            break;
          default:
            // Try to infer fields from table name or use default
            if (completeSchemaInfo) {
              const tableSchema = completeSchemaInfo.find(t => t.name === endpoint.table);
              if (tableSchema && tableSchema.columns) {
                tableSchema.columns.forEach(column => {
                  // Skip XAuthUserId
                  if (column.name === 'XAuthUserId') return;
                  
                  // Set value based on column type
                  let value;
                  if (column.name === 'id') {
                    value = uuid;
                  } else if (column.name.endsWith('_id')) {
                    value = relatedUuid;
                  } else if (column.name.includes('date')) {
                    value = currentDate;
                  } else if (column.name.includes('email')) {
                    value = 'sample@example.com';
                  } else if (column.name.includes('name')) {
                    value = 'Sample Name';
                  } else if (column.type === 'int' || column.type === 'integer') {
                    value = 1;
                  } else if (column.type === 'float' || column.type === 'decimal') {
                    value = 9.99;
                  } else if (column.type === 'boolean') {
                    value = true;
                  } else {
                    value = `Sample ${column.name.replace(/_/g, ' ')}`;
                  }
                  
                  sampleBody[column.name] = value;
                });
              } else {
                // Default fallback
                sampleBody = {
                  id: uuid,
                  name: "Sample Item",
                  description: "This is a sample item",
                  created_at: currentDate,
                  updated_at: currentDate
                };
              }
            } else {
              // Default fallback
              sampleBody = {
                id: uuid,
                name: "Sample Item",
                description: "This is a sample item",
                created_at: currentDate,
                updated_at: currentDate
              };
            }
        }
      }
      
      curlCmd += ` \\\n  -d '${JSON.stringify(sampleBody, null, 2)}'`;
    }
    
    return curlCmd;
  };

  // Function to toggle skipAuth mode (only for examples)
  const handleToggleSkipAuth = () => {
    if (!skipAuth) {
      // If enabling skipAuth, show warning first
      setShowSkipAuthWarning(true);
    } else {
      // If disabling, just set the state
      setSkipAuth(false);
    }
  };

  // Function to confirm skipAuth after warning
  const confirmSkipAuth = () => {
    setSkipAuth(true);
    setShowSkipAuthWarning(false);
    // No need to reload endpoints since this only affects examples
  };

  // Function to cancel skipAuth
  const cancelSkipAuth = () => {
    setShowSkipAuthWarning(false);
  };

  // Custom styles for auth toggle
  const authToggleStyles = `
    .auth-toggle .form-check-input {
      cursor: pointer;
      height: 1.25rem;
      width: 2.5rem;
      transition: all 0.2s ease;
    }
    
    .auth-toggle .form-check-input:checked {
      background-color: #10b981;
      border-color: #10b981;
    }
    
    .auth-toggle .form-check-input:not(:checked) {
      background-color: #dc3545;
      border-color: #dc3545;
    }
    
    .auth-toggle .form-check-input:focus {
      box-shadow: 0 0 0 0.25rem rgba(16, 185, 129, 0.25);
    }
    
    .auth-toggle .form-check-input:not(:checked):focus {
      box-shadow: 0 0 0 0.25rem rgba(220, 53, 69, 0.25);
    }
    
    .auth-toggle .form-check-label {
      cursor: pointer;
      user-select: none;
      font-weight: 600;
      padding-left: 0.5rem;
    }
  `;

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ 
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      height: '100vh', // Set explicit height for main container
      overflow: 'hidden' // Prevent overall page scrolling
    }}>
      <style>{authToggleStyles}</style>
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
            {/* Remove or comment out the badge showing XAuthUserId */}
            <span>Generated endpoints for your database schema</span>
          </div>
        </motion.div>
        
        <div className="d-flex align-items-center gap-3">
          {/* Authentication Toggle Section */}
          <div className="d-flex flex-column gap-1">
            <div className="d-flex align-items-center gap-2 bg-dark bg-opacity-75 px-3 py-2 rounded-pill">
              <span className="text-white-50 small">Authentication:</span>
              <Form.Check
                type="switch"
                id="skip-auth-switch"
                className="auth-toggle"
                checked={!skipAuth}
                onChange={handleToggleSkipAuth}
                label={<span className={skipAuth ? "text-danger" : "text-success"}>{skipAuth ? "Disabled" : "Enabled"}</span>}
              />
            </div>
            {skipAuth && (
              <div className="small text-danger px-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="me-1">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                API requests will skip authentication
              </div>
            )}
          </div>
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
                {backButtonLabel}
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
      <div className="flex-grow-1 d-flex" style={{ overflow: 'hidden' }}>
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
                {backButtonLabel}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Left Panel - Data View */}
            <motion.div 
              className="flex-grow-1 p-4"
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              style={{ 
                height: '100%',
                overflow: 'auto'  // Allow scrolling in the main content area
              }}
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
                          {Object.keys(tableData[0])
                            .filter(key => key !== 'XAuthUserId') // Filter out XAuthUserId from table headers
                            .map(key => (
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
                            {Object.entries(record)
                              .filter(([key]) => key !== 'XAuthUserId') // Filter out XAuthUserId from table cells
                              .map(([key, value]) => (
                                <td key={key} className="py-3 px-4">
                                  {typeof value === 'object' 
                                    ? JSON.stringify(value).substring(0, 60) + (JSON.stringify(value).length > 60 ? '...' : '')
                                    : String(value).substring(0, 60) + (String(value).length > 60 ? '...' : '')}
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
                width: '500px', 
                borderLeft: '1px solid rgba(255, 255, 255, 0.05)',
                background: 'rgba(15, 23, 42, 0.4)',
                backdropFilter: 'blur(8px)',
                height: '100%',
                overflowY: 'auto', // Enable vertical scrolling for this panel
                overflowX: 'hidden', // Prevent horizontal scrolling
                position: 'relative',
                maxHeight: 'calc(100vh - 64px)', // Account for header height
                paddingBottom: '80px' // Add padding at the bottom for better scrolling
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
                                
                                <div className="mt-2 d-flex">
                                  <Button
                                    size="sm"
                                    variant="outline-secondary"
                                    className="me-2"
                                    onClick={() => {
                                      const curlExample = generateCurlExample(endpoint);
                                      navigator.clipboard.writeText(curlExample);
                                      toast.success('CURL command copied to clipboard!');
                                    }}
                                    style={{ fontSize: '0.7rem' }}
                                  >
                                    <i className="bi bi-clipboard me-1"></i> Copy CURL
                                  </Button>
                                  
                                  <OverlayTrigger
                                    placement="top"
                                    overlay={
                                      <Tooltip id={`tooltip-${endpoint.method}-${endpoint.path}`}>
                                        Remember to include authorization headers!
                                      </Tooltip>
                                    }
                                  >
                                    <Button
                                      size="sm"
                                      variant="outline-info"
                                      style={{ fontSize: '0.7rem' }}
                                      onClick={() => {
                                        // Ensure endpoint has all required properties before showing the modal
                                        const completeEndpoint = {
                                          method: endpoint.method || 'GET',
                                          path: endpoint.path || '',
                                          table: endpoint.table || endpoint.path?.split('/')[1] || '',
                                          fullPath: endpoint.fullPath || `https://backlify-v2.onrender.com/api/${apiId}/${endpoint.table || ''}`,
                                          description: endpoint.description || 'API endpoint',
                                          ...endpoint
                                        };
                                        setSelectedEndpoint(completeEndpoint);
                                        setShowCurlModal(true);
                                      }}
                                    >
                                      <i className="bi bi-code-slash me-1"></i> View Example
                                    </Button>
                                  </OverlayTrigger>
                                </div>
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
        className="crud-modal dark-modal"
      >
        <Modal.Header closeButton className="border-bottom bg-dark text-white">
          <Modal.Title id="crud-modal">
            {modalMode === 'create' && <><i className="bi bi-plus-circle me-2"></i>Create {selectedEndpoint?.name || 'Record'}</>}
            {modalMode === 'read' && <><i className="bi bi-eye me-2"></i>View {selectedEndpoint?.name || 'Record'}</>}
            {modalMode === 'update' && <><i className="bi bi-pencil me-2"></i>Edit {selectedEndpoint?.name || 'Record'}</>}
            {modalMode === 'delete' && <><i className="bi bi-trash me-2"></i>Delete {selectedEndpoint?.name || 'Record'}</>}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4 bg-dark text-white">
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" className="mb-3" />
              <p className="text-light mb-0">Loading...</p>
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
                  <p className="mb-0">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    <strong>Required Field:</strong> {submitError}
                  </p>
                </Alert>
              )}
              
              {modalMode === 'delete' ? (
                <div className="text-center py-3">
                  <div className="mb-4">
                    <span className="delete-icon-wrapper text-danger">
                      <i className="bi bi-exclamation-triangle"></i>
                    </span>
                  </div>
                  <h5 className="mb-3 text-white">Are you sure you want to delete this {selectedEndpoint?.name}?</h5>
                  <p className="text-light mb-4">This action cannot be undone.</p>
                  <div className="d-flex justify-content-center">
                    <Button
                      variant="outline-light"
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
                  {Object.entries(formData).map(([key, value]) => {
                    // Skip rendering 'id' field
                    if (key === 'id') {
                      return null;
                    }
                    
                    // Hide XAuthUserId field for all tables except admin
                    if (key === 'XAuthUserId' && selectedEndpoint?.table !== 'admin') {
                      return null;
                    }
                    
                    // Hide created_at and updated_at in create mode
                    if ((key === 'created_at' || key === 'updated_at') && modalMode === 'create') {
                      return null;
                    }
                    
                    return (
                      <Form.Group key={key} className="mb-3">
                        <Form.Label className="text-capitalize text-light">{formatFieldName(key)}</Form.Label>
                        {key.endsWith('_id') && key !== 'id' ? (
                          <Form.Select
                            value={value !== null && value !== undefined ? value : ''}
                            onChange={(e) => {
                              console.log(`Select changed for ${key}: value="${e.target.value}" (type: ${typeof e.target.value})`);
                              const selectedValue = e.target.value;
                              // Convert empty string to null, otherwise try to convert to number if it's a numeric ID
                              const processedValue = selectedValue === '' ? null : 
                                (!isNaN(Number(selectedValue)) && selectedValue !== '') ? Number(selectedValue) : selectedValue;
                              
                              console.log(`Processed value: ${processedValue} (type: ${typeof processedValue})`);
                              setFormData(prev => ({ ...prev, [key]: processedValue }));
                            }}
                            disabled={modalMode === 'read'}
                            className="border bg-dark text-white"
                          >
                            <option value="">Select a {key.replace('_id', '')}</option>
                            {key === 'XAuthUserId' && selectedEndpoint?.table === 'admin' ? (
                              // For admin table's XAuthUserId field, always try to show users data
                              userData && userData.length > 0 ? (
                                userData.map(item => (
                                  <option key={item.id} value={item.id}>
                                    {getRecordDisplayName(item, 'users')}
                                  </option>
                                ))
                              ) : (
                                <option value="" disabled>Loading users data...</option>
                              )
                            ) : (
                              // For other fields, use the standard approach
                              relatedTableData[key] && relatedTableData[key].length > 0 ? (
                                relatedTableData[key].map(item => (
                                  <option key={item.id} value={item.id}>
                                    {getRecordDisplayName(item, getForeignKeyReference(key))}
                                  </option>
                                ))
                              ) : (
                                <option value="" disabled>Loading related data...</option>
                              )
                            )}
                          </Form.Select>
                        ) : getFieldType(key, value) === 'date' ? (
                          <Form.Control
                            type="date"
                            value={value && value.includes('T') ? value.split('T')[0] : value}
                            onChange={(e) => handleFormChange(key, e.target.value)}
                            disabled={modalMode === 'read'}
                            className="border bg-dark text-white"
                          />
                        ) : getFieldType(key, value) === 'boolean' ? (
                          <Form.Check
                            type="checkbox"
                            checked={value === true}
                            onChange={(e) => handleFormChange(key, e.target.checked)}
                            disabled={modalMode === 'read'}
                            label={value === true ? 'Yes' : 'No'}
                            className="ms-2 text-light"
                          />
                        ) : getFieldType(key, value) === 'longtext' ? (
                          <Form.Control
                            as="textarea"
                            rows={3}
                            value={value || ''}
                            onChange={(e) => handleFormChange(key, e.target.value)}
                            disabled={modalMode === 'read'}
                            className="border bg-dark text-white"
                          />
                        ) : getFieldType(key, value) === 'timestamp' ? (
                          <Form.Control
                            type="datetime-local"
                            value={formatDateTimeForInput(value)}
                            onChange={(e) => handleFormChange(key, e.target.value)}
                            disabled={modalMode === 'read' || key === 'created_at' || key === 'updated_at'}
                            className="border bg-dark text-white"
                          />
                        ) : (
                          <Form.Control
                            type={getFieldType(key, value) === 'number' ? 'number' : 'text'}
                            value={value !== null && value !== undefined ? value : ''}
                            onChange={(e) => {
                              // For numeric fields, prevent invalid input characters
                              if (getFieldType(key, value) === 'number') {
                                // Allow only numeric input (including decimal point and minus sign)
                                const isValidInput = /^-?\d*\.?\d*$/.test(e.target.value);
                                
                                if (e.target.value === '' || isValidInput) {
                                  // For empty inputs, use null
                                  if (e.target.value === '') {
                                    handleFormChange(key, null);
                                  } else {
                                    // Parse as number before updating state
                                    const numValue = Number(e.target.value);
                                    if (!isNaN(numValue)) {
                                      handleFormChange(key, numValue);
                                    }
                                  }
                                }
                                // Ignore invalid numeric input
                              } else {
                                // For non-numeric fields, pass the value as is
                                handleFormChange(key, e.target.value);
                              }
                            }}
                            onBlur={(e) => {
                              // On blur, ensure the number is formatted correctly
                              if (getFieldType(key, value) === 'number' && e.target.value !== '') {
                                const numValue = Number(e.target.value);
                                if (!isNaN(numValue)) {
                                  // Format the number and update the field
                                  handleFormChange(key, numValue);
                                }
                              }
                            }}
                            min={getFieldType(key, value) === 'number' ? '0' : undefined}
                            step={getFieldType(key, value) === 'number' ? 'any' : undefined}
                            disabled={modalMode === 'read'}
                            className="border bg-dark text-white"
                          />
                        )}
                        {getFieldNote(key) && (
                          <Form.Text className="text-light opacity-75">
                            {getFieldNote(key)}
                          </Form.Text>
                        )}
                      </Form.Group>
                    );
                  })}
                  
                  {modalMode !== 'read' && (
                    <div className="d-flex justify-content-end mt-4">
                      <Button
                        variant="outline-light"
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
        
        /* Dark modal styles */
        .dark-modal .modal-content {
          background-color: #1e293b;
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .dark-modal .close {
          color: white;
        }
        
        .dark-modal .form-control:disabled {
          background-color: #151e2d;
          color: rgba(255, 255, 255, 0.6);
        }
        
        /* Fix date picker text color */
        .dark-modal input[type="date"],
        .dark-modal input[type="datetime-local"] {
          color-scheme: dark;
        }
        
        /* Modal close button color fix */
        .dark-modal .btn-close {
          filter: invert(1) grayscale(100%) brightness(200%);
        }
      `}</style>
      
      {/* Full-page loading animation */}
      {initialLoading && (
        <motion.div 
          className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center"
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="position-relative" style={{ marginBottom: '2rem' }}>
            <div className="position-absolute" style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '200px',
              height: '200px',
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(16, 185, 129, 0.05) 70%)',
              filter: 'blur(30px)',
              borderRadius: '50%',
              zIndex: 0
            }}></div>
            <LoadingAnimation />
          </div>
          
          <motion.h2 
            className="fw-bold mb-3 text-white"
            animate={{ 
              opacity: [0.8, 1, 0.8],
            }}
            transition={{ 
              duration: 2, 
              ease: "easeInOut", 
              repeat: Infinity 
            }}
          >
            Generating API Endpoints
          </motion.h2>
          
          <motion.p 
            className="text-white-50 mb-4 fs-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Creating CRUD operations for your tables...
          </motion.p>
          
          <motion.div 
            style={{ 
              width: '280px', 
              height: '4px', 
              background: 'rgba(59, 130, 246, 0.2)',
              borderRadius: '2px',
              overflow: 'hidden',
              margin: '0 auto'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <motion.div
              style={{ 
                height: '100%', 
                background: 'linear-gradient(90deg, #3b82f6, #10b981)',
                borderRadius: '2px'
              }}
              animate={{
                width: ['0%', '100%'],
              }}
              transition={{
                duration: 15,
                ease: 'easeInOut',
                repeat: Infinity,
              }}
            />
          </motion.div>
        </motion.div>
      )}
      
      {/* Add error alert after the header */}
      {error && (
        <Alert 
          variant="danger" 
          className="m-3"
          dismissible
          onClose={() => setError(null)}
        >
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
        </Alert>
      )}
      
      {/* CURL Example Modal */}
      <Modal
        show={showCurlModal}
        onHide={() => setShowCurlModal(false)}
        size="lg"
        centered
        className="dark-modal"
      >
        <Modal.Header closeButton className="border-bottom bg-dark text-white">
          <Modal.Title>
            <i className="bi bi-code-slash me-2"></i>
            API Request Example with Authentication
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-white">
          {selectedEndpoint && (
            <>
              <div className="mb-4">
                <h6 className="text-light">
                  <span className="badge me-2" style={{ backgroundColor: methodColors[selectedEndpoint.method || 'GET']?.bg || '#3b82f6' }}>
                    {selectedEndpoint.method || 'GET'}
                  </span>
                  {selectedEndpoint.path || '/api/endpoint'}
                </h6>
                <p className="text-light mb-1">{selectedEndpoint.description || 'API endpoint'}</p>
                <p className="text-muted small mb-0">
                  <i className="bi bi-info-circle me-1"></i>
                  {skipAuth ? 
                    'Example shown without authentication for demonstration purposes.' :
                    'All requests to the API require authentication headers.'}
                </p>
              </div>
              
              <div className="mb-4">
                <h6 className="text-light mb-2">
                  <i className="bi bi-link-45deg me-1"></i>
                  Endpoint URL
                </h6>
                <div className="bg-black p-3 rounded mb-2">
                  <code className="text-success">
                    {selectedEndpoint.fullPath ? 
                      (selectedEndpoint.fullPath.split(' ')[0]) : 
                      (`https://backlify-v2.onrender.com/api/${apiId}/${selectedEndpoint.table || ''}`)}
                  </code>
                </div>
              </div>
              
              <div className="mb-4">
                <h6 className="text-light mb-2">
                  <i className="bi bi-key me-1"></i>
                  Required Headers
                </h6>
                <div className="bg-black p-3 rounded mb-2">
                  <pre className="text-info mb-0" style={{ whiteSpace: 'pre-wrap' }}>
{skipAuth ? 
`Content-Type: application/json
X-Skip-Auth: true` : 
`Content-Type: application/json
Authorization: Bearer ${getAccessToken() || 'YOUR_ACCESS_TOKEN'}`}
                  </pre>
                </div>
                <p className="text-muted small mb-0">
                  {skipAuth ? 
                    <><i className="bi bi-unlock me-1"></i> Authentication is disabled. Using X-Skip-Auth header instead.</> : 
                    <><i className="bi bi-lock me-1"></i> Authentication is required for this endpoint.</>}
                </p>
              </div>
              
              <div>
                <h6 className="text-light mb-2">
                  <i className="bi bi-terminal me-1"></i>
                  CURL Example
                </h6>
                <div className="bg-black p-3 rounded">
                  <pre className="text-warning mb-0" style={{ whiteSpace: 'pre-wrap', overflowX: 'auto' }}>
                    {generateCurlExample(selectedEndpoint)}
                  </pre>
                </div>
                <div className="mt-2">
                  <Button 
                    size="sm" 
                    variant="outline-info" 
                    onClick={() => {
                      navigator.clipboard.writeText(generateCurlExample(selectedEndpoint));
                      toast.success('CURL command copied to clipboard!');
                    }}
                  >
                    <i className="bi bi-clipboard me-1"></i> Copy CURL Command
                  </Button>
                </div>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-dark border-top-0">
          <Button variant="secondary" onClick={() => setShowCurlModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Skip Auth Warning Modal */}
      <Modal
        show={showSkipAuthWarning}
        onHide={cancelSkipAuth}
        backdrop="static"
        centered
        className="dark-modal"
      >
        <Modal.Header closeButton className="bg-dark text-white border-secondary">
          <Modal.Title>
            <FaExclamationTriangle className="text-warning me-2" /> Security Warning
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-white">
          <div className="p-2 bg-warning bg-opacity-10 border border-warning rounded mb-3">
            <div className="d-flex">
              <div className="me-3">
                <FaExclamationTriangle className="text-warning" size={24} />
              </div>
              <div>
                <h5 className="text-warning">Disabling Authentication</h5>
                <p className="mb-0">You are about to disable authentication for your API requests. This means:</p>
                <ul className="mt-2 mb-0">
                  <li>No authentication token will be required</li>
                  <li>Your requests will use the "anonymous" user identity</li>
                  <li>Anyone with access to your API endpoints can use them</li>
                  <li>You may expose sensitive data or operations</li>
                  <li>The <code>?skipAuth=true</code> parameter or <code>X-Skip-Auth: true</code> header will be added to requests</li>
                </ul>
              </div>
            </div>
          </div>
          
          <p>This setting is useful for:</p>
          <ul>
            <li>Public API endpoints that don't require user context</li>
            <li>Testing endpoints without authentication</li>
            <li>Sharing API endpoints with external systems</li>
          </ul>
          
          
        </Modal.Body>
        <Modal.Footer className="bg-dark border-secondary">
          <Button variant="outline-light" onClick={cancelSkipAuth}>
            Keep Authentication
          </Button>
          <Button variant="warning" onClick={confirmSkipAuth}>
            Disable Authentication
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default EndpointsPage; 