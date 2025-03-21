import React, { useRef, useCallback, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from 'react-bootstrap';
import EndpointNode from './EndpointNode';
import { useNavigate } from 'react-router-dom';

// Define custom node types
const nodeTypes = {
  endpointNode: EndpointNode,
};

const EndpointFlow = ({ endpoints, onEndpointSelect, selectedEndpointId }) => {
  const navigate = useNavigate();
  const reactFlowWrapper = useRef(null);

  // Convert endpoints to nodes
  const initialNodes = endpoints.map((endpoint, index) => {
    const position = {
      x: 100 + (index % 3) * 300,
      y: 100 + Math.floor(index / 3) * 200,
    };

    return {
      id: endpoint.id,
      type: 'endpointNode',
      position,
      data: { 
        ...endpoint,
        isSelected: endpoint.id === selectedEndpointId,
        onClick: () => onEndpointSelect(endpoint.id),
      },
    };
  });

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    // Update nodes when selectedEndpointId changes
    setNodes((nds) =>
      nds.map((node) => {
        return {
          ...node,
          data: {
            ...node.data,
            isSelected: node.id === selectedEndpointId,
          },
        };
      })
    );
  }, [selectedEndpointId, setNodes]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="h-100 w-100">
      <div 
        className="h-100" 
        style={{ height: 'calc(100vh - 56px)' }} 
        ref={reactFlowWrapper}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background color="#aaa" gap={16} />
          <Controls />
          <MiniMap />
        </ReactFlow>
        
        <Button
          variant="primary"
          className="position-absolute d-flex align-items-center justify-content-center rounded-circle shadow"
          style={{ bottom: '32px', right: '32px', width: '56px', height: '56px', zIndex: 10 }}
          onClick={() => navigate('/endpoints/new')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </Button>
      </div>
    </div>
  );
};

export default EndpointFlow; 