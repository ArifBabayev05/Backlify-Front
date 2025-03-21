import React from 'react';
import { getBezierPath, EdgeText } from 'reactflow';
import './SchemaEdge.css';

const SchemaEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data = {},
  markerEnd,
  animated
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Get readable relationship text
  const getRelationshipLabel = () => {
    if (!data || !data.relationship) return '';
    
    switch (data.relationship) {
      case 'one-to-one':
        return '1:1';
      case 'one-to-many':
        return '1:N';
      case 'many-to-many':
        return 'N:M';
      default:
        return '';
    }
  };
  
  // Get relationship color
  const getRelationshipColor = () => {
    if (!data || !data.relationship) return '#10b981';
    
    switch (data.relationship) {
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
    <>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        strokeDasharray={data?.relationship === 'many-to-many' ? '5 5' : undefined}
        strokeWidth={style.strokeWidth || 2}
        stroke={style.stroke || getRelationshipColor()}
      />
      {data?.relationship && (
        <EdgeText
          x={labelX}
          y={labelY}
          label={getRelationshipLabel()}
          labelStyle={{ 
            fill: 'white', 
            fontWeight: 'bold', 
            fontSize: 12, 
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)' 
          }}
          labelBgStyle={{ 
            fill: getRelationshipColor(), 
            fillOpacity: 0.7,
            rx: 8, 
            ry: 8
          }}
          labelBgPadding={[4, 6]}
        />
      )}
      {/* Show field names if available */}
      {data?.sourceField && data?.targetField && (
        <EdgeText
          x={labelX}
          y={labelY + 20}
          label={`${data.sourceField} → ${data.targetField}`}
          labelStyle={{ 
            fill: 'white', 
            fontSize: 10,
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)'
          }}
          labelBgStyle={{ 
            fill: 'rgba(0, 0, 0, 0.5)', 
            rx: 4, 
            ry: 4
          }}
          labelBgPadding={[2, 4]}
        />
      )}
    </>
  );
};

export default SchemaEdge; 