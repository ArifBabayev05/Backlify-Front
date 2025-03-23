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
  const [initialLoading, setInitialLoading] = useState(true); // For the full-page loading animation
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
  const [userData, setUserData] = useState([]);
  const [relatedTableData, setRelatedTableData] = useState({});
  // Add state for storing complete schema information
  const [completeSchemaInfo, setCompleteSchemaInfo] = useState(null);
  // Add error state to the component's state variables
  const [error, setError] = useState(null);
  
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
      'user_id': 'users',
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
    
    // Check our common mappings
    if (commonRelationships[key]) {
      console.log(`Using common relationship mapping for ${key} -> ${commonRelationships[key]}`);
      return commonRelationships[key];
    }
    
    // Check for field naming pattern like 'product_id', 'category_id', etc.
    if (key.endsWith('_id')) {
      // Extract the table name from the field - convert to plural if needed
      let tableName = key.replace('_id', '');
      
      // Check common singular/plural patterns
      if (!tableName.endsWith('s') && tableName.length > 1) {
        // Most tables are named in plural form, but don't pluralize single letters
        tableName = tableName + 's';
      }
      
      // Check if this table exists in our endpoints list
      const tableExists = endpoints.some(endpoint => endpoint.table === tableName);
      
      if (tableExists) {
        console.log(`Inferred relationship from field name for ${key} -> ${tableName}`);
        return tableName;
      }
    }
    
    console.log(`Could not determine relationship for ${key}`);
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
    if (!table || !apiBaseUrl) {
      console.log('Cannot load related table data: missing table or API base URL');
      return [];
    }
    
    console.log(`Loading related table data for: ${table}`);
    
    // First check if this table exists in the completeSchemaInfo
    let tableName = table;
    let tableExists = false;
    
    if (completeSchemaInfo) {
      // Try to find the exact table name
      const exactMatch = completeSchemaInfo.find(t => t.name === table);
      if (exactMatch) {
        tableName = exactMatch.name;
        tableExists = true;
        console.log(`Found exact match for table ${table} in schema`);
      } else {
        // Try plural form
        const pluralMatch = completeSchemaInfo.find(t => t.name === `${table}s`);
        if (pluralMatch) {
          tableName = pluralMatch.name;
          tableExists = true;
          console.log(`Found plural match for table ${table} -> ${tableName}`);
        } else {
          // Try replacing 'y' with 'ies' for tables like 'category' -> 'categories'
          const irregularMatch = completeSchemaInfo.find(t => 
            t.name === table.replace(/y$/, 'ies')
          );
          if (irregularMatch) {
            tableName = irregularMatch.name;
            tableExists = true;
            console.log(`Found irregular plural match for table ${table} -> ${tableName}`);
          }
        }
      }
    }
    
    // If we didn't find it in the schema, use fallback rules
    if (!tableExists) {
      // Special case mappings
      const tableNameMappings = {
        'city': 'cities',
        'country': 'countries',
        'category': 'categories',
        'property': 'properties'
      };
      
      // Check if we need to adjust the table name
      if (tableNameMappings[tableName]) {
        tableName = tableNameMappings[tableName];
        console.log(`Adjusted table name from ${table} to ${tableName}`);
      }
      
      // Single-letter table names should not be pluralized
      const isSingleLetterTable = /^[a-z]$/i.test(tableName);
      
      // Also handle common singular/plural conversions, but only if not a single letter table
      if (!isSingleLetterTable && !tableName.endsWith('s') && !Object.values(tableNameMappings).includes(tableName)) {
        // Most tables are named in plural form
        tableName = tableName + 's';
        console.log(`Adding plural 's' to get table name: ${tableName}`);
      }
      
      // Special handling for tables with irregular plurals not covered above
      if (tableName === 'persons') tableName = 'people';
    }
    
    try {
      const url = `${apiBaseUrl}/${tableName}?limit=100`;
      console.log(`Loading related table data from: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Error loading related data for ${tableName}: ${response.status} ${response.statusText}`);
        // Try the original table name as fallback
        if (tableName !== table) {
          console.log(`Trying original table name: ${table}`);
          const fallbackUrl = `${apiBaseUrl}/${table}?limit=100`;
          const fallbackResponse = await fetch(fallbackUrl);
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            console.log(`Fallback request succeeded for ${table}:`, fallbackData);
            if (Array.isArray(fallbackData?.data)) {
              return fallbackData.data;
            } else if (Array.isArray(fallbackData)) {
              return fallbackData;
            }
          }
        }
        return [];
      }
      
      const data = await response.json();
      
      console.log(`Received data from ${tableName}:`, data);
      
      if (Array.isArray(data?.data)) {
        return data.data;
      } else if (Array.isArray(data)) {
        return data;
      }
      
      return [];
    } catch (error) {
      console.error(`Error loading related data for ${tableName}:`, error);
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
      setApiBaseUrl(`http://localhost:3000/api/${selectedApiId}`);
      loadApiEndpoints(selectedApiId);
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
      // Fetch the user's ID from sessionStorage first, then fallback to localStorage
      const userIdFromSession = sessionStorage.getItem('userId');
      const userId = userIdFromSession || localStorage.getItem('userId');
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      // Update the userId state
      setUserId(userId);
      
      // Make a request to your backend to get the API details
      const response = await fetch('http://localhost:3000/my-apis', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch API details');
      }
      
      const data = await response.json();
      console.log('API data received:', data);
      
      const selectedApi = data.apis.find(api => api.apiId === apiId);
      
      if (!selectedApi) {
        throw new Error('Selected API not found');
      }
      
      console.log('Selected API:', selectedApi);
      
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
              auth: false,
              fullPath: `http://localhost:3000/api/${apiId}/${table}`
            },
            {
              method: 'GET',
              path: `/${table}/:id`,
              description: `Get a single ${table} by ID`,
              auth: false,
              fullPath: `http://localhost:3000/api/${apiId}/${table}/:id`
            },
            {
              method: 'POST',
              path: `/${table}`,
              description: `Create a new ${table}`,
              auth: true,
              fullPath: `http://localhost:3000/api/${apiId}/${table}`
            },
            {
              method: 'PUT',
              path: `/${table}/:id`,
              description: `Update an existing ${table}`,
              auth: true,
              fullPath: `http://localhost:3000/api/${apiId}/${table}/:id`
            },
            {
              method: 'DELETE',
              path: `/${table}/:id`,
              description: `Delete a ${table}`,
              auth: true,
              fullPath: `http://localhost:3000/api/${apiId}/${table}/:id`
            }
          ]
        };
      });
      
      console.log('Transformed endpoints:', transformedEndpoints);
      
      // Set endpoints data
      setEndpoints(transformedEndpoints);
      setApiBaseUrl(`http://localhost:3000/api/${apiId}`);
      setSwaggerUrl(`http://localhost:3000/api/${apiId}/docs/`);
      
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
        setApiBaseUrl(`http://localhost:3000/api/${endpointsData.apiId}`);
      } else {
        console.warn('No API ID found in endpoint data');
      }
      
      // Store the complete schema information if available
      if (endpointsData.tables) {
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
              schema[column.name] = { 
                type: column.type, 
                required: isRequired,
                primary: isPrimary,
                constraints: column.constraints || []
              };
            });
          }
          schemas[table.name] = schema;
        });
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
      if (endpointsData.userId) {
        setUserId(endpointsData.userId);
      }
      
      // Set swagger URL if available
      if (endpointsData.swagger_url) {
        setSwaggerUrl(`http://localhost:3000${endpointsData.swagger_url}`);
      } else if (endpointsData.apiId) {
        // Create a default swagger URL based on the API ID
        setSwaggerUrl(`http://localhost:3000/api/${endpointsData.apiId}/docs/`);
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
              fullPath: `http://localhost:3000/api/${endpointsData.apiId}${route.path}`
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

  // Update the loadTableData function to add error handling
  const loadTableData = async (table, page = 1, limit = 10) => {
    if (!apiId || !table) {
      console.error('Missing apiId or table name for loading data');
      //setError('Missing API ID or table name');
      return;
    }

    setIsLoading(true);
    try {
      console.log(`Loading data for ${table}, page ${page}, limit ${limit}`);
      
      const url = `${apiBaseUrl}/${table}?page=${page}&limit=${limit}`;
      console.log('Fetching from URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to load ${table} data: ${response.status} ${response.statusText}`);
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
      setError(`Error loading ${table} data: ${error.message}`);
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
      const url = `${apiBaseUrl}/users?limit=100`;
      console.log(`Loading users data from: ${url}`);
      
      const response = await fetch(url);
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
      const userIdFromSession = sessionStorage.getItem('userId') || userId;
      
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
      
      console.log(`Identified potential foreign key fields for ${endpoint.table}:`, allPotentialForeignKeys);
      
      // Load related data for all potential foreign key fields
      const relationshipLoading = [];
      
      for (const field of allPotentialForeignKeys) {
        const relatedTable = getForeignKeyReference(field);
        if (relatedTable) {
          console.log(`Loading related data for ${field} from table ${relatedTable}`);
          relationshipLoading.push(
            loadRelatedTableData(relatedTable).then(data => {
              setRelatedTableData(prev => ({
                ...prev,
                [field]: data
              }));
              return { field, relatedTable, data };
            })
          );
        }
      }
      
      // Wait for all relationship data to load
      if (relationshipLoading.length > 0) {
        const results = await Promise.allSettled(relationshipLoading);
        console.log('Finished loading relationship data:', results);
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
              
              // Skip user_id field for doctors table (unless it's a relationship field)
              if (endpoint.table === 'doctors' && column.name === 'user_id') {
                // Check if it's a relationship field
                const isRelationshipField = tableSchema.relationships?.some(rel => 
                  rel.sourceColumn === 'user_id' || rel.targetColumn === 'user_id'
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
        
        // Ensure user_id is set correctly
        initialFormData = ensureUserIdInFormData(initialFormData);
        
        // Apply special handling for doctors table
        initialFormData = ensureDoctorFormFields(initialFormData, endpoint.table);
        
        setFormData(initialFormData);
        setResourceId(initialFormData.id);
      } else if (mode === 'read' || mode === 'update' || mode === 'delete') {
        // For other modes, use the provided record data
        if (record) {
          console.log(`Setting form data for ${mode} operation:`, record);
          
          // Make a copy of the record and ensure user_id is set correctly
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

  // Add a function to ensure user_id is set correctly in form data
  const ensureUserIdInFormData = (data) => {
    const userIdFromSession = sessionStorage.getItem('userId');
    const currentUserId = userIdFromSession || userId;
    
    if (!data.user_id && currentUserId) {
      return { ...data, user_id: currentUserId };
    }
    
    return data;
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
    
    try {
      const resourceUrl = `${apiBaseUrl}/${selectedEndpoint.table}`;
      const requestUrl = modalMode === 'create' ? resourceUrl : `${resourceUrl}/${resourceId}`;
      
      console.log(`Submitting ${modalMode} request to:`, requestUrl);
      
      // Get the latest user ID from sessionStorage
      const userIdFromSession = sessionStorage.getItem('userId') || userId;
      
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
          // Make sure the formData has the userId included
          {
            const formDataWithUserId = ensureUserIdInFormData(formData);
            requestConfig.body = JSON.stringify(formDataWithUserId);
          }
          break;
        case 'update':
          requestConfig.method = 'PUT';
          // Make sure the formData has the userId included
          {
            const formDataWithUserId = ensureUserIdInFormData(formData);
            requestConfig.body = JSON.stringify(formDataWithUserId);
          }
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
        bodyPreview: requestConfig.body ? requestConfig.body.substring(0, 200) + '...' : 'No body'
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
    if (!tableName) {
      console.error('fetchTableSchema: Missing table name');
      return null;
    }
    
    if (!apiBaseUrl && apiId) {
      // If apiBaseUrl is not set but we have apiId, set it
      const newApiBaseUrl = `http://localhost:3000/api/${apiId}`;
      console.log(`Setting API base URL to ${newApiBaseUrl}`);
      setApiBaseUrl(newApiBaseUrl);
    }
    
    // If we still don't have a valid API URL, return default schema
    if (!apiBaseUrl && !apiId) {
      console.error('fetchTableSchema: Missing API base URL and API ID');
      return inferDefaultSchema(tableName);
    }
    
    const url = `${apiBaseUrl || `http://localhost:3000/api/${apiId}`}/${tableName}?limit=1`;
    
    console.log(`Fetching schema for table: ${tableName}`);
    console.log(`Making schema discovery request to: ${url}`);
    
    setIsLoading(true);
    
    try {
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
                  <p className="mb-0"><strong>Error:</strong> {submitError}</p>
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
                    
                    // Improved logic for handling user_id field:
                    // 1. Skip standard user_id field (authentication-related)
                    // 2. Only show user_id if it's a true relationship field
                    if (key === 'user_id') {
                      const isRelationshipField = getForeignKeyReference(key) && relatedTableData[key]?.length > 0;
                      // Only show user_id if it's a true relationship field that has related data
                      if (!isRelationshipField) {
                        return null;
                      }
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
                            value={value}
                            onChange={(e) => handleFormChange(key, e.target.value)}
                            disabled={modalMode === 'read'}
                            className="border bg-dark text-white"
                          >
                            <option value="">Select a {key.replace('_id', '')}</option>
                            {relatedTableData[key] && relatedTableData[key].length > 0 ? (
                              relatedTableData[key].map(item => (
                                <option key={item.id} value={item.id}>
                                  {getRecordDisplayName(item, getForeignKeyReference(key))}
                                </option>
                              ))
                            ) : (
                              <option value="" disabled>Loading related data...</option>
                            )}
                          </Form.Select>
                        ) : completeSchemaInfo && key !== 'id' ? (
                          // Find the field type from the schema
                          (() => {
                            // Get the current table schema
                            const tableSchema = completeSchemaInfo.find(table => table.name === selectedEndpoint?.table);
                            if (!tableSchema) return null;
                            
                            // Get the column definition
                            const column = tableSchema.columns.find(col => col.name === key);
                            if (!column) return null;
                            
                            // Render appropriate input based on the column type
                            switch (column.type) {
                              case 'boolean':
                                return (
                                  <Form.Check
                                    type="checkbox"
                                    checked={value === true}
                                    onChange={(e) => handleFormChange(key, e.target.checked)}
                                    disabled={modalMode === 'read'}
                                    label={value === true ? 'Yes' : 'No'}
                                    className="ms-2 text-light"
                                  />
                                );
                              case 'date':
                                return (
                                  <Form.Control
                                    type="date"
                                    value={value && value.includes('T') ? value.split('T')[0] : value}
                                    onChange={(e) => handleFormChange(key, e.target.value)}
                                    disabled={modalMode === 'read'}
                                    className="border bg-dark text-white"
                                  />
                                );
                              case 'timestamp':
                              case 'timestamptz':
                                return (
                                  <Form.Control
                                    type="datetime-local"
                                    value={formatDateTimeForInput(value)}
                                    onChange={(e) => handleFormChange(key, e.target.value)}
                                    disabled={modalMode === 'read' || key === 'created_at' || key === 'updated_at'}
                                    className="border bg-dark text-white"
                                  />
                                );
                              case 'int':
                              case 'integer':
                              case 'bigint':
                              case 'smallint':
                                return (
                                  <Form.Control
                                    type="number"
                                    value={value !== null && value !== undefined ? value : ''}
                                    onChange={(e) => handleFormChange(key, e.target.value)}
                                    disabled={modalMode === 'read'}
                                    className="border bg-dark text-white"
                                  />
                                );
                              case 'float':
                              case 'double':
                              case 'decimal':
                              case 'numeric':
                                return (
                                  <Form.Control
                                    type="number"
                                    step="0.01"
                                    value={value !== null && value !== undefined ? value : ''}
                                    onChange={(e) => handleFormChange(key, e.target.value)}
                                    disabled={modalMode === 'read'}
                                    className="border bg-dark text-white"
                                  />
                                );
                              case 'text':
                                return (
                                  <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={value || ''}
                                    onChange={(e) => handleFormChange(key, e.target.value)}
                                    disabled={modalMode === 'read'}
                                    className="border bg-dark text-white"
                                  />
                                );
                              case 'uuid':
                                if (key.endsWith('_id')) {
                                  // If it's a UUID field that looks like a foreign key
                                  // but we don't have related data, render as a text field
                                  return (
                                    <Form.Control
                                      type="text"
                                      value={value !== null && value !== undefined ? value : ''}
                                      onChange={(e) => handleFormChange(key, e.target.value)}
                                      disabled={modalMode === 'read'}
                                      className="border bg-dark text-white"
                                    />
                                  );
                                }
                                // Fall through for other UUID fields
                              default:
                                return (
                                  <Form.Control
                                    type="text"
                                    value={value !== null && value !== undefined ? value : ''}
                                    onChange={(e) => handleFormChange(key, e.target.value)}
                                    disabled={modalMode === 'read'}
                                    className="border bg-dark text-white"
                                  />
                                );
                            }
                          })()
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
                            onChange={(e) => handleFormChange(key, e.target.value)}
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
    </div>
  );
};

export default EndpointsPage; 