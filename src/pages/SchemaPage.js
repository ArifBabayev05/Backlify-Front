import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import SchemaFlow from '../components/schema/SchemaFlow';
import ThemeToggle from '../components/common/ThemeToggle';
import LoadingAnimation from '../components/common/LoadingAnimation';

// Remove or comment out the mock data
// const mockSchema = { ... };

const SchemaPage = () => {
  const [schema, setSchema] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userPrompt, setUserPrompt] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const navigate = useNavigate();
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const pageRef = useRef(null);

  useEffect(() => {
    // Get the prompt from sessionStorage
    const storedPrompt = sessionStorage.getItem('userPrompt');
    if (storedPrompt) {
      setUserPrompt(storedPrompt);
    }
    
    // Keep loading state true until we successfully process schema data
    setIsLoading(true);
    
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
                  isForeign: Array.isArray(col.constraints) && col.constraints.some(c => c.includes('foreign key')),
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
                // Check that all required fields are present
                if (rel.targetTable && rel.type && rel.sourceColumn && rel.targetColumn) {
                  transformedSchema.relationships.push({
                    source: table.name,
                    target: rel.targetTable,
                    type: rel.type,
                    sourceField: rel.sourceColumn,
                    targetField: rel.targetColumn
                  });
                } else {
                  console.warn('Skipping incomplete relationship:', rel);
                }
              });
            }
          });
          
          console.log('Transformed schema:', transformedSchema);
          setSchema(transformedSchema);
          
          // Only stop loading when schema is successfully loaded
          setIsLoading(false);
        } else {
          console.error('Invalid schema data structure - missing tables array:', schemaData);
          setIsLoading(false); // Still need to stop loading on error
        }
      } catch (error) {
        console.error('Error parsing schema data:', error);
        setIsLoading(false); // Still need to stop loading on error
      }
    } else {
      console.warn('No schema data found in sessionStorage');
      setIsLoading(false); // Stop loading if no data is found
    }
  }, []);

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
    
    // In a real app, we'd call the API with the updated prompt
    // For now, we'll simulate updating the schema after a delay
    setTimeout(() => {
      // For the demo, we're not actually changing the schema
      setIsLoading(false);
    }, 3000);
  };

  const handleGenerateEndpoints = () => {
    // Navigate to endpoints page
    navigate('/endpoints');
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
        </div>
      </motion.header>
      
      {/* Schema Visualization */}
      <main 
        className="flex-grow-1 position-relative" 
        style={{ 
          overflow: 'hidden',
          height: `${windowSize.height - 60}px` // Subtract header height
        }}
      >
        {schema ? (
          <motion.div 
            className="h-100 w-100 position-absolute"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <SchemaFlow 
              schema={schema} 
              onModifyPrompt={handleModifyPrompt} 
              onSchemaChange={handleSchemaChange}
              key={`flow-${windowSize.width}-${windowSize.height}`} // Recreate on resize
            />
          </motion.div>
        ) : !isLoading ? (
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
      </main>
      
      {/* Theme toggle with improved positioning */}
      <div className="position-fixed" style={{ bottom: '24px', left: '24px', zIndex: 100 }}>
        <ThemeToggle />
      </div>
      
      {/* Loading overlay */}
      {isLoading && <LoadingAnimation />}
    </div>
  );
};

export default SchemaPage; 