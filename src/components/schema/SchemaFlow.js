import React, { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MarkerType,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion } from 'framer-motion';
import { Button } from 'react-bootstrap';

import SchemaNode from './SchemaNode';
import SchemaEdge from './SchemaEdge';
import SchemaDetails from './SchemaDetails';
import RelationshipManager from './RelationshipManager';
import TableEditor from './TableEditor';

// Custom node types
const nodeTypes = {
  schemaNode: SchemaNode,
};

// Custom edge types
const edgeTypes = {
  schemaEdge: SchemaEdge,
};

const SchemaFlow = ({ schema, onModifyPrompt, onSchemaChange, readOnly = false }) => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [tableEditorOpen, setTableEditorOpen] = useState(false);
  const [relationshipManagerOpen, setRelationshipManagerOpen] = useState(false);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [editingTable, setEditingTable] = useState(null);
  const [isUpdatingFromProps, setIsUpdatingFromProps] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef(null);

  // Stabilize dimensions to prevent ResizeObserver loop errors
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    
    // Get initial dimensions
    const resizeObserver = new ResizeObserver((entries) => {
      // Prevent infinite loop by using requestAnimationFrame
      window.requestAnimationFrame(() => {
        if (!Array.isArray(entries) || !entries.length) return;
        
        const { width, height } = entries[0].contentRect;
        setDimensions({ width, height });
      });
    });
    
    resizeObserver.observe(containerRef.current);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Handle connections when user creates new edges
  const onConnect = useCallback(
    (params) => {
      // Skip in readOnly mode
      if (readOnly) return;
      
      // Instead of automatically creating the edge, open the relationship manager
      const sourceNode = nodes.find(node => node.id === params.source);
      const targetNode = nodes.find(node => node.id === params.target);
      
      if (sourceNode && targetNode) {
        setSelectedEdge({
          source: params.source,
          target: params.target,
          sourceHandle: params.sourceHandle,
          targetHandle: params.targetHandle
        });
        setRelationshipManagerOpen(true);
      }
    },
    [nodes, readOnly]
  );

  // Set up the flow when schema changes
  useEffect(() => {
    if (!schema || !schema.tables) return;
    
    // Set flag to prevent triggering onSchemaChange during prop update
    setIsUpdatingFromProps(true);
    
    // Create nodes from schema tables in a circular layout
    const schemaNodes = schema.tables.map((table, index) => {
      const angle = (index * (2 * Math.PI / schema.tables.length)) - Math.PI/2;
      const radius = 280; // Adjust radius of the circle
      
      return {
        id: table.name,
        type: 'schemaNode',
        position: {
          x: 400 + radius * Math.cos(angle),
          y: 350 + radius * Math.sin(angle)
        },
        data: {
          label: table.name,
          tableName: table.name,
          fields: table.columns.map(col => ({
            name: col.name,
            type: col.type,
            isPrimary: col.isPrimary,
            isForeign: col.isForeign
          }))
        },
      };
    });
    
    // Create edges from relationships
    const schemaEdges = schema.relationships.map((rel, index) => ({
      id: `e-${rel.source}-${rel.target}`,
      source: rel.source,
      target: rel.target,
      type: 'schemaEdge',
      animated: true,
      data: {
        relationship: rel.type,
        sourceField: rel.sourceField,
        targetField: rel.targetField
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 15,
        height: 15,
        color: getRelationshipColor(rel.type),
      },
      style: { 
        stroke: getRelationshipColor(rel.type), 
        strokeWidth: 2,
        strokeDasharray: rel.type === 'many-to-many' ? '5 5' : 'none'
      },
    }));
    
    setNodes(schemaNodes);
    setEdges(schemaEdges);
    
    // Reset flag after update is complete (with a slight delay to ensure state updates finish)
    setTimeout(() => {
      setIsUpdatingFromProps(false);
    }, 0);
  }, [schema, setNodes, setEdges]);

  // Notify parent component of schema changes when nodes or edges change
  useEffect(() => {
    // Only notify parent if changes are user-initiated (not from props)
    if (nodes.length > 0 && onSchemaChange && !isUpdatingFromProps) {
      onSchemaChange(nodes, edges);
    }
  }, [nodes, edges, onSchemaChange, isUpdatingFromProps]);

  // Handle node click to show details
  const onNodeClick = useCallback((event, node) => {
    if (!readOnly) {
      setSelectedNode(node);
    }
  }, [readOnly]);

  // Handle edge click to edit relationship
  const onEdgeClick = useCallback((event, edge) => {
    if (readOnly) return;
    
    setSelectedEdge(edge);
    setRelationshipManagerOpen(true);
  }, [readOnly]);

  // Add a new table
  const handleAddTable = () => {
    setEditingTable(null);
    setTableEditorOpen(true);
  };

  // Edit existing table
  const handleEditTable = (tableNode) => {
    setEditingTable(tableNode);
    setTableEditorOpen(true);
  };

  // Save table (create or update)
  const handleSaveTable = (tableData, mode) => {
    if (mode === 'edit') {
      // Update existing table
      setNodes(nodes.map(node => 
        node.id === tableData.id 
          ? {
              ...node,
              data: {
                ...node.data,
                label: tableData.tableName,
                tableName: tableData.tableName,
                fields: tableData.fields
              }
            }
          : node
      ));
    } else {
      // Create new table
      const newNode = {
        id: tableData.id,
        type: 'schemaNode',
        position: {
          x: 200 + Math.random() * 400,
          y: 200 + Math.random() * 200
        },
        data: {
          label: tableData.tableName,
          tableName: tableData.tableName,
          fields: tableData.fields
        },
      };
      
      setNodes((nds) => [...nds, newNode]);
    }
  };

  // Delete a table
  const handleDeleteTable = (tableId) => {
    // First remove all edges connected to this table
    setEdges(edges.filter(edge => 
      edge.source !== tableId && edge.target !== tableId
    ));
    
    // Then remove the table node
    setNodes(nodes.filter(node => node.id !== tableId));
    
    // Clear selection if this was the selected node
    if (selectedNode && selectedNode.id === tableId) {
      setSelectedNode(null);
    }
  };

  // Add a new relationship
  const handleAddRelationship = (relationship) => {
    const newEdge = {
      id: `e-${relationship.source}-${relationship.target}-${Date.now()}`,
      source: relationship.source,
      target: relationship.target,
      type: 'schemaEdge',
      animated: relationship.type === 'one-to-many',
      data: {
        relationship: relationship.type,
        sourceField: relationship.sourceField,
        targetField: relationship.targetField
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 15,
        height: 15,
        color: getRelationshipColor(relationship.type),
      },
      style: { 
        stroke: getRelationshipColor(relationship.type), 
        strokeWidth: 2,
        strokeDasharray: relationship.type === 'many-to-many' ? '5 5' : 'none'
      },
    };
    
    setEdges((eds) => [...eds, newEdge]);
  };

  // Update an existing relationship
  const handleUpdateRelationship = (edgeId, relationship) => {
    setEdges(edges.map(edge => 
      edge.id === edgeId
        ? {
            ...edge,
            source: relationship.source,
            target: relationship.target,
            animated: relationship.type === 'one-to-many',
            data: {
              relationship: relationship.type,
              sourceField: relationship.sourceField,
              targetField: relationship.targetField
            },
            markerEnd: {
              ...edge.markerEnd,
              color: getRelationshipColor(relationship.type),
            },
            style: { 
              stroke: getRelationshipColor(relationship.type), 
              strokeWidth: 2,
              strokeDasharray: relationship.type === 'many-to-many' ? '5 5' : 'none'
            },
          }
        : edge
    ));
  };

  // Delete a relationship
  const handleDeleteRelationship = (edgeId) => {
    setEdges(edges.filter(edge => edge.id !== edgeId));
    
    // Clear selection if this was the selected edge
    if (selectedEdge && selectedEdge.id === edgeId) {
      setSelectedEdge(null);
    }
  };

  // Get color based on relationship type
  const getRelationshipColor = (relationshipType) => {
    switch (relationshipType) {
      case 'one-to-one':
        return '#3b82f6';
      case 'one-to-many':
        return '#10b981';
      case 'many-to-many':
        return '#8b5cf6';
      default:
        return '#10b981';
    }
  };

  return (
    <div className="h-100 w-100" ref={containerRef}>
      <ReactFlowProvider>
        <div 
          className="h-100 w-100" 
          style={{ 
            height: 'calc(100vh - 56px)',
            visibility: dimensions.width > 0 ? 'visible' : 'hidden' // Only show when dimensions are ready
          }} 
          ref={reactFlowWrapper}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onInit={setReactFlowInstance}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            attributionPosition="bottom-left"
            minZoom={0.2}
            maxZoom={1.5}
            defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
            zoomOnScroll={true}
            zoomOnPinch={true}
            panOnScroll={true}
            panOnDrag={true}
            style={{ background: 'transparent' }}
            proOptions={{ hideAttribution: true }}
          >
            <Background 
              variant="dots" 
              gap={20} 
              size={1}
              color="rgba(59, 130, 246, 0.3)"
              style={{ backgroundColor: 'transparent' }}
            />
            
            {/* Custom styled Controls panel */}
            <Panel position="top-right" style={{ margin: '10px' }}>
              <div className="d-flex gap-1">
                <motion.button
                  className="btn d-flex align-items-center justify-content-center rounded p-2"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.9)',
                    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.08)',
                    width: '38px',
                    height: '38px',
                    border: 'none'
                  }}
                  onClick={() => reactFlowInstance?.zoomIn()}
                  whileHover={{ backgroundColor: 'rgba(255, 255, 255, 1)', y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#1e293b" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </motion.button>
                <motion.button
                  className="btn d-flex align-items-center justify-content-center rounded p-2"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.9)',
                    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.08)',
                    width: '38px',
                    height: '38px',
                    border: 'none'
                  }}
                  onClick={() => reactFlowInstance?.zoomOut()}
                  whileHover={{ backgroundColor: 'rgba(255, 255, 255, 1)', y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#1e293b" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                  </svg>
                </motion.button>
                <motion.button
                  className="btn d-flex align-items-center justify-content-center rounded p-2"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.9)',
                    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.08)',
                    width: '38px',
                    height: '38px',
                    border: 'none'
                  }}
                  onClick={() => reactFlowInstance?.fitView()}
                  whileHover={{ backgroundColor: 'rgba(255, 255, 255, 1)', y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#1e293b" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </motion.button>
              </div>
            </Panel>
            
            {(!readOnly && selectedNode || selectedEdge) && (
              <Panel position="bottom-left" style={{ margin: '10px' }}>
                <div className="d-flex flex-column gap-2">
                  {selectedNode && (
                    <motion.button
                      className="btn d-flex align-items-center justify-content-center rounded p-2"
                      style={{ 
                        background: 'rgba(16, 185, 129, 0.9)',
                        color: 'white',
                        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.08)',
                        border: 'none',
                        width: 'auto',
                        paddingLeft: '12px',
                        paddingRight: '12px'
                      }}
                      onClick={() => handleEditTable(selectedNode)}
                      whileHover={{ backgroundColor: 'rgba(16, 185, 129, 1)', y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="me-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Edit Selected Table
                    </motion.button>
                  )}
                  
                  {selectedNode && (
                    <motion.button
                      className="btn d-flex align-items-center justify-content-center rounded p-2"
                      style={{ 
                        background: 'rgba(239, 68, 68, 0.9)',
                        color: 'white',
                        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.08)',
                        border: 'none',
                        width: 'auto',
                        paddingLeft: '12px',
                        paddingRight: '12px'
                      }}
                      onClick={() => handleDeleteTable(selectedNode.id)}
                      whileHover={{ backgroundColor: 'rgba(239, 68, 68, 1)', y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="me-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Selected Table
                    </motion.button>
                  )}
                  
                  {selectedEdge && (
                    <motion.button
                      className="btn d-flex align-items-center justify-content-center rounded p-2"
                      style={{ 
                        background: 'rgba(239, 68, 68, 0.9)',
                        color: 'white',
                        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.08)',
                        border: 'none',
                        width: 'auto',
                        paddingLeft: '12px',
                        paddingRight: '12px'
                      }}
                      onClick={() => handleDeleteRelationship(selectedEdge.id)}
                      whileHover={{ backgroundColor: 'rgba(239, 68, 68, 1)', y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="me-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Selected Relationship
                    </motion.button>
                  )}
                </div>
              </Panel>
            )}
            
            {/* Floating action button to add new table */}
            {!readOnly && (
              <Panel position="top-left" style={{ margin: '10px' }}>
                <div className="d-flex flex-column gap-2">
                  {/* No buttons here for read-only view */}
                </div>
              </Panel>
            )}
          </ReactFlow>
          
          {/* Floating action button to add new table */}
          {!readOnly && (
            <motion.div 
              className="position-absolute" 
              style={{ bottom: '32px', right: '32px', zIndex: 10 }}
              initial={{ opacity: 0, scale: 0, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 400, damping: 15 }}
            >
              <motion.div
                whileHover={{ scale: 1.1, boxShadow: '0 8px 25px rgba(59, 130, 246, 0.5)' }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Button
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{ 
                    width: '60px', 
                    height: '60px', 
                    background: 'linear-gradient(145deg, #3b82f6, #2563eb)',
                    border: 'none',
                    boxShadow: '0 8px 20px rgba(59, 130, 246, 0.4)'
                  }}
                  onClick={handleAddTable}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </Button>
              </motion.div>
            </motion.div>
          )}
          
          {/* Table Editor Modal */}
          <TableEditor 
            isOpen={tableEditorOpen} 
            onClose={() => setTableEditorOpen(false)} 
            onSave={handleSaveTable}
            table={editingTable}
          />
          
          {/* Relationship Manager Modal */}
          <RelationshipManager 
            isOpen={relationshipManagerOpen} 
            onClose={() => setRelationshipManagerOpen(false)}
            tables={nodes}
            edges={edges}
            onAddRelationship={handleAddRelationship}
            onUpdateRelationship={handleUpdateRelationship}
            relationshipToEdit={selectedEdge}
          />

          {/* Table Editor Modal - only show when not in readOnly mode */}
          {!readOnly && (
            <TableEditor 
              isOpen={tableEditorOpen} 
              onClose={() => setTableEditorOpen(false)} 
              onSave={handleSaveTable}
              table={editingTable}
            />
          )}
          
          {/* Relationship Manager Modal - only show when not in readOnly mode */}
          {!readOnly && (
            <RelationshipManager 
              isOpen={relationshipManagerOpen} 
              onClose={() => setRelationshipManagerOpen(false)}
              tables={nodes}
              edges={edges}
              onAddRelationship={handleAddRelationship}
              onUpdateRelationship={handleUpdateRelationship}
              relationshipToEdit={selectedEdge}
            />
          )}
        </div>
      </ReactFlowProvider>
    </div>
  );
};

export default SchemaFlow; 