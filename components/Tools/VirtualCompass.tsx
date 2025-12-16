
import React from 'react';
import { Group, Circle, Line, Rect } from 'react-konva';

interface VirtualCompassProps {
  centerX: number;
  centerY: number;
  radius: number;
  rotation: number; // Angle of the drawing action (rotation of the whole tool around needle)
}

const VirtualCompass: React.FC<VirtualCompassProps> = React.memo(({ centerX, centerY, radius, rotation }) => {
    // Dynamic calculation for leg spread based on radius
    // INCREASED SIZE: Make compass larger to support bigger geometry
    const legLength = 280; 
    
    // Calculate the height of the triangle formed by legs and radius
    // radius is the base of isosceles triangle.
    // height = sqrt(leg^2 - (radius/2)^2)
    // Clamp radius to not exceed 2*legLength (minus a buffer)
    const safeRadius = Math.min(radius, legLength * 2 - 10);
    
    const height = Math.sqrt(Math.pow(legLength, 2) - Math.pow(safeRadius / 2, 2));
    
    // Coordinates relative to needle tip at (0,0)
    // Pivot point (Hinge)
    const hingeX = safeRadius / 2;
    const hingeY = -height;

  return (
    <Group x={centerX} y={centerY} rotation={rotation}>
        {/* Visuals offset so (0,0) is the needle tip */}

        {/* Needle Leg (Left) */}
        <Line
            points={[0, 0, hingeX, hingeY]}
            stroke="#475569" // slate-600
            strokeWidth={5}
            lineCap="round"
            shadowBlur={2}
        />
        
        {/* Pencil Leg (Right) */}
        <Line
            points={[safeRadius, 0, hingeX, hingeY]}
            stroke="#475569"
            strokeWidth={5}
            lineCap="round"
            shadowBlur={2}
        />

        {/* Hinge Mechanism */}
        <Group x={hingeX} y={hingeY}>
            <Circle
                radius={12}
                fill="#334155"
                stroke="#cbd5e1"
                strokeWidth={2}
            />
            {/* Handle */}
            <Rect
                x={-4}
                y={-30}
                width={8}
                height={30}
                fill="#334155"
                cornerRadius={2}
            />
        </Group>

        {/* Pencil Assembly on Right Leg Tip */}
        <Group x={safeRadius} y={0} rotation={15}>
             {/* Holder */}
             <Rect x={-4} y={-25} width={8} height={15} fill="#94a3b8" />
             {/* Pencil Body */}
             <Rect x={-3} y={-20} width={6} height={25} fill="#f59e0b" />
             {/* Lead Tip */}
             <Line points={[-3, 0, 3, 0, 0, 6]} closed fill="#1e293b" />
        </Group>

        {/* Needle Tip */}
         <Circle x={0} y={0} radius={1.5} fill="black" />
    </Group>
  );
});

export default VirtualCompass;
