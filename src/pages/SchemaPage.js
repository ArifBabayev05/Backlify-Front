import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button, Form, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import SchemaFlow from '../components/schema/SchemaFlow';
import LoadingAnimation from '../components/common/LoadingAnimation';
import '../components/schema/SchemaLayout.css';
import { apiRequest } from '../utils/apiService';


const SchemaPage = () => {
  const [schema, setSchema] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiDataReceived, setApiDataReceived] = useState(false);
  const [userPrompt, setUserPrompt] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const navigate = useNavigate();
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const pageRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatMessages, setChatMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const [generatingEndpoints, setGeneratingEndpoints] = useState(false);

  // Scroll to bottom of chat messages only when the sidebar is open
  const scrollToBottom = useCallback(() => {
    if (sidebarOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'nearest' // This is important - only scroll if needed
      });
    }
  }, [sidebarOpen]);

  // Only scroll when chat messages change AND sidebar is open
  useEffect(() => {
    if (sidebarOpen && chatMessages.length > 0) {
      scrollToBottom();
    }
  }, [chatMessages, sidebarOpen, scrollToBottom]);

  useEffect(() => {
    // Auto-recovery: if schema data exists but dataReady flag doesn't, set it
    const schemaData = sessionStorage.getItem('schemaData');
    const dataReady = sessionStorage.getItem('dataReady');
    
    // Check if we're coming back from the endpoints page and need to reload
    const reloadSchema = sessionStorage.getItem('reload_schema');
    if (reloadSchema === 'true') {
      console.log('Reload schema flag detected, refreshing schema data');
      // Clear the flag
      sessionStorage.removeItem('reload_schema');
      
      // Force schema reload by clearing the apiDataReceived flag
      setApiDataReceived(false);
      setIsLoading(true);
    }
    
    if (schemaData && !dataReady) {
      console.log('Auto-recovery: Setting dataReady flag because schema data exists');
      sessionStorage.setItem('dataReady', 'true');
    }
    
    // Get the prompt from sessionStorage
    const storedPrompt = sessionStorage.getItem('userPrompt');
    if (storedPrompt) {
      setUserPrompt(storedPrompt);
    }
    
    // Set loading state to true at the beginning
    setIsLoading(true);
    
    // Check if dataReady flag exists and schema data exists
    const checkDataReady = () => {
      const dataReady = sessionStorage.getItem('dataReady');
      const hasSchemaData = sessionStorage.getItem('schemaData');
      console.log('Data ready check:', { dataReady, hasData: !!hasSchemaData });
      
      // Modified to check for schemaData even if dataReady is not set
      if (hasSchemaData && !dataReady) {
        // Auto-fix the missing dataReady flag
        console.log('Found schema data but dataReady flag was missing - fixing it');
        sessionStorage.setItem('dataReady', 'true');
        return true;
      }
      
      return dataReady === 'true' && !!hasSchemaData;
    };
    
    // Function to process schema data
    const processSchemaData = () => {
      // Get schema data from sessionStorage
      const schemaDataString = sessionStorage.getItem('schemaData');
      console.log('Raw schemaData from sessionStorage:', schemaDataString);
      
      if (schemaDataString) {
        try {
          const schemaData = JSON.parse(schemaDataString);
          console.log('Parsed schemaData:', schemaData);
          
          // Transform the API response format to match the expected schema format
          if (schemaData && schemaData.tables && Array.isArray(schemaData.tables)) {
            console.log('Found tables array with length:', schemaData.tables.length);
            
            const transformedSchema = {
              tables: schemaData.tables.map(table => {
                console.log('Processing table:', table.name);
                return {
                  name: table.name,
                  columns: Array.isArray(table.columns) ? table.columns.map(col => ({
                    name: col.name,
                    type: col.type,
                    isPrimary: Array.isArray(col.constraints) && col.constraints.includes('primary key'),
                    isForeign: Array.isArray(col.constraints) && col.constraints.some(c => 
                      c.includes('foreign key') || c.includes('references')
                    ),
                    constraints: col.constraints || []
                  })) : []
                };
              }),
              relationships: []
            };
            
            // Extract relationships from tables
            schemaData.tables.forEach(table => {
              if (table.relationships && Array.isArray(table.relationships)) {
                console.log(`Processing ${table.relationships.length} relationships for table ${table.name}`);
                table.relationships.forEach(rel => {
                  try {
                    // Check that all required fields are present
                    if (rel.targetTable && rel.sourceColumn && rel.targetColumn) {
                      // Ensure relationship type is valid
                      const validType = rel.type && ['one-to-one', 'one-to-many', 'many-to-many'].includes(rel.type)
                        ? rel.type : 'one-to-many';
                        
                      transformedSchema.relationships.push({
                        source: table.name,
                        target: rel.targetTable,
                        type: validType,
                        sourceField: rel.sourceColumn,
                        targetField: rel.targetColumn
                      });
                      console.log(`Added relationship: ${table.name} -> ${rel.targetTable} (${validType})`);
                    } else {
                      console.warn('Skipping incomplete relationship:', rel);
                    }
                  } catch (error) {
                    console.error('Error processing relationship:', error, rel);
                  }
                });
              }
            });
            
            console.log('Transformed schema:', transformedSchema);
            setSchema(transformedSchema);
            setApiDataReceived(true);
            
            // Only stop loading when schema is successfully processed
            setIsLoading(false);
          } else {
            console.error('Invalid schema data structure - missing tables array:', schemaData);
            // Still set apiDataReceived to true since we did get a response
            setApiDataReceived(true);
            setIsLoading(false);
          }
        } catch (error) {
          console.error('Error parsing schema data:', error);
          setApiDataReceived(true);
          setIsLoading(false);
        }
      } else if (apiDataReceived) {
        // If we previously received API data but now it's gone
        console.warn('No schema data found in sessionStorage, but API data was previously received');
        setIsLoading(false);
      }
    };
    
    // Initial processing attempt
    if (checkDataReady()) {
      processSchemaData();
    } else {
      // Set up an interval to check for data readiness
      const intervalId = setInterval(() => {
        if (checkDataReady()) {
          clearInterval(intervalId);
          processSchemaData();
        }
      }, 500); // Check every 500ms
      
      // Safety timeout to prevent waiting forever
      const timeoutId = setTimeout(() => {
        clearInterval(intervalId);
        setApiDataReceived(true);
        setIsLoading(false);
        console.warn('Timed out waiting for schema data');
      }, 15000); // 15 second timeout
      
      return () => {
        clearInterval(intervalId);
        clearTimeout(timeoutId);
      };
    }
  }, [apiDataReceived]);

  // Handle schema changes from SchemaFlow component
  const handleSchemaChange = useCallback((updatedNodes, updatedEdges) => {
    // Mark that changes have been made to the schema
    setHasChanges(true);
    
    // Transform the nodes and edges back into our schema format
    const updatedSchema = {
      tables: updatedNodes.map(node => ({
        name: node.data.tableName,
        columns: node.data.fields
          .filter(field => field.name !== 'XAuthUserId') // Filter out XAuthUserId field
          .map(field => ({
            name: field.name,
            type: field.type,
            isPrimary: field.isPrimary,
            isForeign: field.isForeign,
            constraints: field.constraints || []
          }))
      })),
      relationships: updatedEdges.map(edge => ({
        source: edge.source,
        target: edge.target,
        type: edge.data?.relationship || 'one-to-many',
        sourceField: edge.data?.sourceField,
        targetField: edge.data?.targetField
      }))
    };
    
    // Store the updated schema in sessionStorage without updating state immediately
    const schemaData = {
      tables: updatedSchema.tables.map(table => ({
        name: table.name,
        columns: table.columns.map(col => ({
          name: col.name,
          type: col.type,
          constraints: [
            ...(col.isPrimary ? ['primary key'] : []),
            ...(col.isForeign ? ['foreign key'] : []),
            ...(col.constraints?.filter(c => 
              c !== 'primary key' && !c.includes('foreign key')
            ) || [])
          ]
        })),
        relationships: updatedSchema.relationships
          .filter(rel => rel.source === table.name)
          .map(rel => ({
            targetTable: rel.target,
            type: rel.type,
            sourceColumn: rel.sourceField,
            targetColumn: rel.targetField
          }))
      }))
    };
    
    sessionStorage.setItem('schemaData', JSON.stringify(schemaData));
    
    // Only update schema state if we need to (debounce the state update)
    // This prevents excessive re-renders
    setSchema(prev => {
      // Deep comparison would be better here, but this is simpler for now
      if (JSON.stringify(prev) !== JSON.stringify(updatedSchema)) {
        return updatedSchema;
      }
      return prev;
    });
  }, []);

  const handleModifyPrompt = (promptUpdate) => {
    setIsLoading(true);
    setApiDataReceived(false);
    
    // In a real app, we'd call the API with the updated prompt
    // For now, we'll simulate updating the schema after a delay
    setTimeout(() => {
      // Process the schema data again once API responds
      const schemaDataString = sessionStorage.getItem('schemaData');
      if (schemaDataString) {
        try {
          const schemaData = JSON.parse(schemaDataString);
          if (schemaData && schemaData.tables) {
            setApiDataReceived(true);
            setIsLoading(false);
          }
        } catch (error) {
          console.error('Error processing modified schema:', error);
          setApiDataReceived(true);
          setIsLoading(false);
        }
      } else {
        setApiDataReceived(true);
        setIsLoading(false);
      }
    }, 3000);
  };

  const handleGenerateEndpoints = async () => {
    try {
      // 1. Set specific state for endpoint generation loading
      setGeneratingEndpoints(true);
      
      // 2. Wait for the state to update and component to re-render
      // with loading animation BEFORE doing any work
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 3. Store loading state in sessionStorage
      sessionStorage.setItem('apiLoading', 'true');
      sessionStorage.setItem('loadingStartTime', Date.now().toString());
      
      // 4. Get schema data and prepare payload
      const schemaDataString = sessionStorage.getItem('schemaData');
      if (!schemaDataString) {
        throw new Error('No schema data available');
      }
      
      const schemaData = JSON.parse(schemaDataString);
      console.log('Schema data for API generation:', schemaData);
      
      const payload = {
        tables: schemaData.tables
        // XAuthUserId is automatically added in the header by apiService
      };
      
      console.log('Sending API generation request:', payload);
      
      // 5. Make the API call using apiRequest for authentication
      const responseData = await apiRequest('/create-api-from-schema', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      console.log('Received API generation response:', responseData);
      
      if (!responseData.success) {
        throw new Error('API generation was unsuccessful');
      }
      
      // 6. Store the complete API response in sessionStorage without any transformation
      // This is important - we want to preserve ALL schema information from the server
      sessionStorage.setItem('apiEndpoints', JSON.stringify(responseData));
      
      // 7. Store the complete table definitions in a separate key for easy access
      if (responseData.tables && Array.isArray(responseData.tables)) {
        console.log('Storing complete table definitions:', responseData.tables);
        sessionStorage.setItem('tableDefinitions', JSON.stringify(responseData.tables));
      }
      
      // 8. Also store the API ID in localStorage for the dashboard to access
      if (responseData.apiId) {
        console.log('Storing API ID in localStorage:', responseData.apiId);
        localStorage.setItem('selectedApiId', responseData.apiId);
      } else {
        console.error('No API ID found in response');
      }
      
      // 9. Ensure minimum loading time of 6 seconds
      const loadingStartTime = parseInt(sessionStorage.getItem('loadingStartTime') || '0');
      const timeElapsed = Date.now() - loadingStartTime;
      const minimumLoadingTime = 6000; // 6 seconds
      
      if (timeElapsed < minimumLoadingTime) {
        await new Promise(resolve => setTimeout(resolve, minimumLoadingTime - timeElapsed));
      }
      
      // 10. Navigate to endpoints page while keeping loading state active
      navigate('/endpoints');
      
    } catch (error) {
      console.error('Error generating API endpoints:', error);
      
      // Show error alert
      alert(`Failed to generate API endpoints: ${error.message}`);
      
      // Reset loading states
      setGeneratingEndpoints(false);
      sessionStorage.removeItem('apiLoading');
      sessionStorage.removeItem('loadingStartTime');
    }
  };

  const handleRefreshSchema = () => {
    if (window.confirm("This will regenerate the schema from the original prompt and discard any changes. Continue?")) {
      setIsLoading(true);
      
      // Clear session storage schema data to force regeneration
      sessionStorage.removeItem('schemaData');
      
      // Redirect to landing page to regenerate schema
      setTimeout(() => {
        navigate('/');
      }, 500);
    }
  };

  // Handle window resize events
  useEffect(() => {
    const handleResize = () => {
      // Debounce resize events
      if (!window.resizeTimeout) {
        window.resizeTimeout = setTimeout(() => {
          window.resizeTimeout = null;
          setWindowSize({
            width: window.innerWidth,
            height: window.innerHeight
          });
        }, 200);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const adjustLayout = () => {
      const element = document.querySelector('.react-flow-wrapper');
      if (element) {
        element.style.height = `calc(${window.innerHeight}px - 60px)`;
      }
    };

    window.addEventListener('resize', adjustLayout);
    adjustLayout(); // Initial adjustment

    return () => {
      window.removeEventListener('resize', adjustLayout);
    };
  }, []);

  // Handle sending a new prompt to the chatbot
  const handleSendMessage = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Stop event propagation
    
    if (!currentMessage.trim()) return;
    
    // Add user message to chat
    const newMessage = { 
      id: Date.now(), 
      text: currentMessage, 
      sender: 'user' 
    };
    
    setChatMessages(prev => [...prev, newMessage]);
    setCurrentMessage('');
    setIsSending(true);
    
    try {
      // Get the current schema data from sessionStorage
      const schemaDataString = sessionStorage.getItem('schemaData');
      if (!schemaDataString) {
        throw new Error('No schema data available');
      }
      
      const schemaData = JSON.parse(schemaDataString);
      
      // Prepare the request payload - no need to include XAuthUserId
      const payload = {
        prompt: currentMessage,
        tables: schemaData.tables
      };
      
      console.log('Sending schema modification request:', payload);
      
      // Set loading state before API call
      setIsLoading(true);
      setApiDataReceived(false);
      
      // Send the request to the API using apiRequest
      const responseData = await apiRequest('/modify-schema', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      console.log('Received schema modification response:', responseData);
      
      if (!responseData.success) {
        throw new Error('API returned unsuccessful response');
      }
      
      // Preparing a specific response based on what changed
      let responseMessage = "I've updated your schema based on your request.";
      
      // Compare original tables with updated tables to identify changes
      if (schemaData.tables && responseData.tables) {
        const changes = [];
        
        responseData.tables.forEach(newTable => {
          const originalTable = schemaData.tables.find(t => t.name === newTable.name);
          if (originalTable) {
            newTable.columns.forEach(newCol => {
              const originalCol = originalTable.columns.find(c => 
                c.name === newCol.name.replace(/s$/, '') || c.name === newCol.name
              );
              
              if (originalCol && originalCol.name !== newCol.name) {
                changes.push(`Changed "${originalCol.name}" to "${newCol.name}" in ${newTable.name} table`);
              }
            });
          }
        });
        
        if (changes.length > 0) {
          responseMessage += " Here's what changed:\n• " + changes.join("\n• ");
        }
      }
      
      // Add bot response to chat
      const botResponse = { 
        id: Date.now() + 1, 
        text: responseMessage, 
        sender: 'bot' 
      };
      
      setChatMessages(prev => [...prev, botResponse]);
      
      // Mark data as received before processing
      setApiDataReceived(true);
      
      // Transform the API response to match our schema format
      const transformedSchema = {
        tables: responseData.tables.map(table => ({
          name: table.name,
          columns: table.columns.map(col => ({
            name: col.name,
            type: col.type,
            isPrimary: Array.isArray(col.constraints) && col.constraints.includes('primary key'),
            isForeign: Array.isArray(col.constraints) && col.constraints.some(c => 
              c.includes('foreign key') || c.includes('references')
            ),
            constraints: col.constraints || []
          }))
        })),
        relationships: []
      };
      
      // Extract relationships
      responseData.tables.forEach(table => {
        if (table.relationships && Array.isArray(table.relationships)) {
          table.relationships.forEach(rel => {
            if (rel.targetTable && rel.sourceColumn && rel.targetColumn) {
              // Ensure relationship type is valid
              const validType = rel.type && ['one-to-one', 'one-to-many', 'many-to-many'].includes(rel.type)
                ? rel.type : 'one-to-many';
                
              transformedSchema.relationships.push({
                source: table.name,
                target: rel.targetTable,
                type: validType,
                sourceField: rel.sourceColumn,
                targetField: rel.targetColumn
              });
            }
          });
        }
      });
      
      // Update the schema in state
      setSchema(transformedSchema);
      
      // Store updated schema back to sessionStorage in the expected format
      const updatedSchemaData = {
        tables: responseData.tables
      };
      
      sessionStorage.setItem('schemaData', JSON.stringify(updatedSchemaData));
      
      // Mark that changes have been made
      setHasChanges(true);
      
      // Finish loading
      setIsLoading(false);
      
    } catch (error) {
      console.error('Error processing schema modification:', error);
      
      // Add error message to chat
      setChatMessages(prev => [
        ...prev, 
        { 
          id: Date.now() + 1, 
          text: `Sorry, there was an error: ${error.message}. Please try again or refine your request.`, 
          sender: 'bot' 
        }
      ]);
      
      // Make sure we mark data as received and stop loading on error
      setApiDataReceived(true);
      setIsLoading(false);
    } finally {
      setIsSending(false);
    }
  };

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  // Remove global scroll locking: keep page scroll enabled

  return (
    <div 
      className="schema-container min-vh-100 d-flex flex-column" 
      style={{ 
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        maxWidth: '100vw',
        maxHeight: '100vh'
      }}
      ref={pageRef}
    >
      {/* Decorative elements */}
      <div className="position-absolute" style={{ 
        width: '500px', 
        height: '500px', 
        background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, rgba(56, 189, 248, 0) 70%)',
        top: '-250px',
        right: '-100px',
        borderRadius: '100%',
        pointerEvents: 'none'
      }}></div>
      <div className="position-absolute" style={{ 
        width: '400px', 
        height: '400px', 
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, rgba(139, 92, 246, 0) 70%)',
        bottom: '-150px',
        left: '-100px',
        borderRadius: '100%',
        pointerEvents: 'none'
      }}></div>
      
      {/* Header */}
      <motion.header 
        className="d-flex align-items-center justify-content-between p-3 py-3"
        style={{ 
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          zIndex: 20
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="d-flex align-items-center">
          {/* Back to Home button */}
          <motion.div 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            className="me-3"
          >
            <Button
              variant="outline-light"
              onClick={() => navigate('/')}
              className="d-flex align-items-center"
              style={{ 
                borderColor: 'rgba(255, 255, 255, 0.2)',
                padding: '6px 12px'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="me-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Home
            </Button>
          </motion.div>
          
          <div>
            <h1 className="fs-4 fw-bold text-white mb-0 d-flex align-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="me-2 text-primary">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
              Database Schema
              {hasChanges && (
                <span className="badge bg-warning text-dark ms-2 fs-7">Modified</span>
              )}
            </h1>
            <p className="small mb-0" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              {userPrompt 
                ? `Based on: "${userPrompt.length > 80 ? userPrompt.substring(0, 80) + '...' : userPrompt}"`
                : 'AI-generated schema visualization'}
            </p>
          </div>
        </div>
        
        <div className="d-flex align-items-center gap-3">
          {hasChanges && (
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                variant="outline-warning"
                onClick={handleRefreshSchema}
                className="px-3 py-2"
                style={{ 
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#f59e0b'
                }}
              >
                <span className="d-flex align-items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="me-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Regenerate
                </span>
              </Button>
            </motion.div>
          )}
          
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              variant="primary"
              onClick={handleGenerateEndpoints}
              className="px-3 py-2"
              style={{ 
                background: 'linear-gradient(to right, #3b82f6, #2563eb)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}
            >
              <span className="d-flex align-items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="me-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                </svg>
                Generate API Endpoints
              </span>
            </Button>
          </motion.div>
          
          {/* Chat sidebar toggle button */}
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              variant="outline-primary"
              onClick={toggleSidebar}
              className="px-3 py-2 ms-2"
              style={{ 
                borderColor: 'rgba(59, 130, 246, 0.5)',
                color: '#3b82f6'
              }}
            >
              <span className="d-flex align-items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="me-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                {sidebarOpen ? 'Close Chat' : 'AI Assistant'}
              </span>
            </Button>
          </motion.div>
        </div>
      </motion.header>
      
      {/* Schema Visualization with conditional width */}
      <main 
        className="flex-grow-1 position-relative d-flex" 
        style={{ 
          overflow: 'hidden',
          height: `${windowSize.height - 60}px` // Subtract header height
        }}
      >
        <div 
          className="h-100 position-relative"
          style={{ 
            width: sidebarOpen ? 'calc(100% - 350px)' : '100%',
            transition: 'width 0.3s ease-in-out',
            borderRadius: '8px',
            boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.05)'
          }}
        >
          {schema && !isLoading ? (
            <motion.div 
              className="h-100 w-100 position-absolute"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              <SchemaFlow 
                schema={schema} 
                readOnly={true}
                key={`flow-${windowSize.width}-${windowSize.height}-${sidebarOpen ? 'sidebar' : 'nosidebar'}`} // Recreate on resize
              />
            </motion.div>
          ) : !isLoading && apiDataReceived ? (
            <div className="h-100 d-flex align-items-center justify-content-center">
              <motion.div 
                className="text-center p-5 rounded-4"
                style={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  maxWidth: '400px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="#3b82f6" strokeWidth="1.5" className="mb-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <h4 className="text-white mb-3">No Schema Available</h4>
                <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  Try generating a schema from the landing page or use the chat assistant to create one.
                </p>
                <Button 
                  variant="primary" 
                  onClick={() => navigate('/')}
                  className="mt-3"
                  style={{ 
                    background: 'linear-gradient(to right, #3b82f6, #2563eb)',
                    border: 'none'
                  }}
                >
                  Go to Home Page
                </Button>
              </motion.div>
            </div>
          ) : null}
        </div>
        
        {/* Chat Sidebar */}
        <motion.div 
          className="h-100 d-flex flex-column"
          style={{
            width: '350px',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(12px)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '-5px 0 25px rgba(0, 0, 0, 0.15)',
            transform: sidebarOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.3s ease-in-out',
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            zIndex: 10,
            borderRadius: '0 0 0 12px'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: sidebarOpen ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Chat header with improved styling */}
          <div className="p-3 border-bottom" style={{ 
            borderColor: 'rgba(255, 255, 255, 0.08) !important',
            background: 'rgba(15, 23, 42, 0.5)'
          }}>
            <h3 className="fs-5 fw-bold text-white mb-0 d-flex align-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="me-2 text-primary">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Schema Assistant
            </h3>
            <p className="small mb-0" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              Ask me to modify your database schema
            </p>
          </div>
          
          {/* Chat messages area */}
          <div 
            className="flex-grow-1 p-3 overflow-auto"
            style={{ 
              backgroundColor: 'rgba(15, 23, 42, 0.2)',
              maxHeight: 'calc(100vh - 200px)' // Constrain height to prevent page scrolling
            }}
          >
            {chatMessages.length === 0 ? (
              <div className="text-center mt-4" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1" className="mx-auto mb-3 text-primary opacity-75">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="fs-6 mb-1">No messages yet</p>
                <p className="small mb-0">
                  Try asking me to modify your schema. For example:
                </p>
                <div className="mt-3 mb-2 text-start mx-auto" style={{ maxWidth: '280px' }}>
                  <div className="small mb-2 rounded p-2 d-inline-block" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', maxWidth: '90%' }}>
                    "Add a timestamp field to the Users table"
                  </div>
                  <div className="small mb-2 rounded p-2 d-inline-block" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', maxWidth: '90%' }}>
                    "Create a new Products table with name, price, and description"
                  </div>
                  <div className="small mb-2 rounded p-2 d-inline-block" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', maxWidth: '90%' }}>
                    "Add a one-to-many relationship between Users and Orders"
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {chatMessages.map(message => (
                  <div 
                    key={message.id} 
                    className={`mb-3 d-flex ${message.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                  >
                    <div 
                      className="rounded p-3" 
                      style={{
                        backgroundColor: message.sender === 'user' 
                          ? 'rgba(59, 130, 246, 0.8)' 
                          : 'rgba(255, 255, 255, 0.1)',
                        color: message.sender === 'user' 
                          ? 'white' 
                          : 'rgba(255, 255, 255, 0.9)',
                        maxWidth: '80%',
                        wordBreak: 'break-word'
                      }}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          
          {/* Chat input area */}
          <div className="p-3 border-top" style={{ 
            borderColor: 'rgba(255, 255, 255, 0.08) !important',
            background: 'rgba(15, 23, 42, 0.5)'
          }}>
            <Form onSubmit={handleSendMessage}>
              <div className="d-flex">
                <Form.Control
                  type="text"
                  placeholder="Type your schema modification request..."
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  className="rounded-pill me-2"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.2)',
                    padding: '12px 18px',
                    fontSize: '0.9rem'
                  }}
                  disabled={isSending}
                />
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="rounded-circle d-flex justify-content-center align-items-center"
                  style={{ 
                    width: '42px', 
                    height: '42px',
                    background: 'linear-gradient(to right, #3b82f6, #2563eb)',
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                  }}
                  disabled={isSending || !currentMessage.trim()}
                >
                  {isSending ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                  )}
                </Button>
              </div>
            </Form>
            <div className="text-center mt-2">
              <small style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                Your schema updates will be processed by our AI assistant
              </small>
            </div>
          </div>
        </motion.div>
      </main>
      
      {/* Loading overlay */}
      {(isLoading || generatingEndpoints) && <LoadingAnimation />}
    </div>
  );
};

export default SchemaPage; 