import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button, Form, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import SchemaFlow from '../components/schema/SchemaFlow';
import LoadingAnimation from '../components/common/LoadingAnimation';

// Remove or comment out the mock data
// const mockSchema = { ... };

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

  // Scroll to bottom of chat messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  useEffect(() => {
    // Auto-recovery: if schema data exists but dataReady flag doesn't, set it
    const schemaData = sessionStorage.getItem('schemaData');
    const dataReady = sessionStorage.getItem('dataReady');
    
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
                    if (rel.targetTable && rel.type && rel.sourceColumn && rel.targetColumn) {
                      transformedSchema.relationships.push({
                        source: table.name,
                        target: rel.targetTable,
                        type: rel.type,
                        sourceField: rel.sourceColumn,
                        targetField: rel.targetColumn
                      });
                      console.log(`Added relationship: ${table.name} -> ${rel.targetTable} (${rel.type})`);
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
        columns: node.data.fields.map(field => ({
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
      // Show loading animation first
      setIsLoading(true);
      setApiDataReceived(false);
      
      // Increased delay to ensure loading animation is fully rendered before proceeding
      // This is crucial for user experience - they need to see the loading state before navigation
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Get current schema data from sessionStorage
      const schemaDataString = sessionStorage.getItem('schemaData');
      if (!schemaDataString) {
        throw new Error('No schema data available');
      }
      
      const schemaData = JSON.parse(schemaDataString);
      
      // Prepare the request payload
      const payload = {
        tables: schemaData.tables,
        userId: schemaData.tables[0]?.prefixedName?.split('_')[0] || 'Supabasev2'
      };
      
      console.log('Sending API generation request:', payload);
      
      // Send the request to create API from schema
      const response = await fetch('http://localhost:3000/create-api-from-schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log('Received API generation response:', responseData);
      
      if (!responseData.success) {
        throw new Error('API generation was unsuccessful');
      }
      
      // Store the API response in sessionStorage so the endpoints page can access it
      sessionStorage.setItem('apiEndpoints', JSON.stringify(responseData));
      
      // Store the loading state in sessionStorage to maintain it across page navigation
      sessionStorage.setItem('apiLoading', 'true');
      
      // Force a re-render with a state update to ensure the loading animation is visible
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          requestAnimationFrame(resolve); // Double RAF to ensure render completes
        });
      });
      
      // Navigate to endpoints page while loading state is still active
      navigate('/endpoints');
      
    } catch (error) {
      console.error('Error generating API endpoints:', error);
      
      // Show error alert
      alert(`Failed to generate API endpoints: ${error.message}`);
      
      // Hide loading animation and mark data as received on error
      setApiDataReceived(true);
      setIsLoading(false);
      sessionStorage.removeItem('apiLoading');
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

  // Handle sending a new prompt to the chatbot
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
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
      
      // Prepare the request payload
      const payload = {
        prompt: currentMessage,
        tables: schemaData.tables,
        userId: 'Supabasev2'
      };
      
      console.log('Sending schema modification request:', payload);
      
      // Set loading state before API call
      setIsLoading(true);
      setApiDataReceived(false);
      
      // Send the request to the API
      const response = await fetch('http://localhost:3000/modify-schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
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
            if (rel.targetTable && rel.type && rel.sourceColumn && rel.targetColumn) {
              transformedSchema.relationships.push({
                source: table.name,
                target: rel.targetTable,
                type: rel.type,
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

  return (
    <div 
      className="min-vh-100 d-flex flex-column" 
      style={{ 
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        overflow: 'hidden'
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
            transition: 'width 0.3s ease-in-out'
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
              <motion.p 
                className="text-center p-4"
                style={{ color: 'rgba(255, 255, 255, 0.6)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                No schema available. Try generating one from the landing page.
              </motion.p>
            </div>
          ) : null}
        </div>
        
        {/* Chat Sidebar */}
        <motion.div 
          className="h-100 d-flex flex-column"
          style={{
            width: '350px',
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(10px)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
            transform: sidebarOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.3s ease-in-out',
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            zIndex: 10
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: sidebarOpen ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Chat header */}
          <div className="p-3 border-bottom" style={{ borderColor: 'rgba(255, 255, 255, 0.08) !important' }}>
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
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.2)' }}
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
          <div className="p-3 border-top" style={{ borderColor: 'rgba(255, 255, 255, 0.08) !important' }}>
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
                    color: 'white'
                  }}
                  disabled={isSending}
                />
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="rounded-circle d-flex justify-content-center align-items-center"
                  style={{ 
                    width: '40px', 
                    height: '40px',
                    background: 'linear-gradient(to right, #3b82f6, #2563eb)',
                    border: 'none'
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
      {/* {isLoading && (
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
      )} */}
      {isLoading && <LoadingAnimation />}
    </div>
  );
};

export default SchemaPage; 