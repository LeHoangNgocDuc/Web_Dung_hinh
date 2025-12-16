import React from 'react';
import { Group, Circle, Line, Rect } from 'react-konva';
import { CompassProps } from '../types';

export const VirtualCompass: React.FC<CompassProps> = ({ visible, x, y, radius, rotation, isDrawing }) => {
  if (!visible) return null;

  return (
    <Group x={x} y={y}>
      {/* Pivot Point (Needle) */}
      <Circle radius={4} fill="#ef4444" />
      
      {/* The Compass Arm Group - Rotates around pivot */}
      <Group rotation={rotation}>
        {/* Metal Arm */}
        <Rect x={0} y={-2} width={radius} height={4} fill="#94a3b8" />
        
        {/* Pencil Holder */}
        <Group x={radius} y={0}>
          <Circle radius={5} fill="#3b82f6" />
          {/* Pencil Tip / Lead */}
          <Circle radius={2} fill={isDrawing ? "#000" : "#666"} />
        </Group>
      </Group>

      {/* Visual Radius Arc (optional, to show what's happening) */}
      {isDrawing && (
        <Circle
          radius={radius}
          stroke="#000000"
          strokeWidth={1}
          opacity={0.2}
          dash={[5, 5]}
        />
      )}
    </Group>
  );
};