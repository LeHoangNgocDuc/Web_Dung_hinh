import React, { forwardRef } from 'react';
import { Group, Rect, Line, Circle } from 'react-konva';

interface VirtualPencilProps {
  x: number;
  y: number;
  rotation?: number; 
  isDrawing?: boolean;
  opacity?: number;
}

const VirtualPencil = forwardRef<any, VirtualPencilProps>(({ x, y, rotation = 30, isDrawing = false, opacity = 1 }, ref) => {
  return (
    <Group ref={ref} x={x} y={y} rotation={rotation} opacity={opacity} listening={false}>
        {/* Pivot at the tip (0,0) */}
        
        {/* Lead */}
        <Line points={[0,0, -2.5,-8, 2.5,-8]} closed fill="#1e293b" />
        
        {/* Wood collar */}
        <Line points={[-2.5,-8, 2.5,-8, 3.5,-20, -3.5,-20]} closed fill="#fcd34d" />
        
        {/* Main Body */}
        <Rect x={-3.5} y={-80} width={7} height={60} fill="#f59e0b" stroke="#b45309" strokeWidth={0.5} cornerRadius={1} />
        
        {/* Metal Band */}
        <Rect x={-3.5} y={-86} width={7} height={6} fill="#94a3b8" />
        
        {/* Eraser */}
        <Rect x={-3.5} y={-92} width={7} height={6} fill="#fca5a5" cornerRadius={[2,2,0,0]} />

        {/* Drawing Effect (Contact shadow) */}
        {isDrawing && (
             <Circle x={0} y={0} radius={4} fill="black" opacity={0.15} scaleY={0.3} />
        )}
    </Group>
  );
});

export default React.memo(VirtualPencil);