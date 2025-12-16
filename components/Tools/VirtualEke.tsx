
import React, { forwardRef } from 'react';
import { Group, Line, Circle, Text } from 'react-konva';

interface VirtualEkeProps {
  x?: number;
  y?: number;
  rotation?: number;
  scaleY?: number;
  // Animation props
  isAnimating?: boolean;
}

const VirtualEke = forwardRef<any, VirtualEkeProps>(({ 
  x = 0, 
  y = 0, 
  rotation = 0, 
  scaleY = 1,
  isAnimating
}, ref) => {

  // If we are controlling externally via GSAP (during animation hooks),
  // we let the hook control transforms. If purely visual cursor, use props.
  const activeProps = isAnimating ? {} : { x, y, rotation, scaleY };

  return (
    <Group 
      ref={ref}
      {...activeProps}
    >
        {/*
            Draw a Set Square (Ê-ke).
            Origin (0,0) is the 90-degree corner.
            Leg 1 (Vertical): 0 to 250 (Y axis)
            Leg 2 (Horizontal): 0 to 150 (X axis)
        */}
        <Line
            points={[0, 0, 180, 0, 0, 280, 0, 0]}
            closed
            fill="rgba(56, 189, 248, 0.2)" // Light Blue Transparent
            stroke="#0284c7" // sky-600
            strokeWidth={2}
            lineJoin="round"
        />
        
        {/* Measurement Ticks on Horizontal Leg */}
        {[...Array(6)].map((_, i) => (
             <Line
                key={`h-${i}`}
                points={[i * 30, 0, i * 30, 8]}
                stroke="#0284c7"
                strokeWidth={1}
             />
        ))}

         {/* Measurement Ticks on Vertical Leg */}
        {[...Array(8)].map((_, i) => (
             <Line
                key={`v-${i}`}
                points={[0, i * 30, 8, i * 30]}
                stroke="#0284c7"
                strokeWidth={1}
             />
        ))}
        
        {/* Inner Cutout */}
         <Line
            points={[30, 50, 100, 50, 30, 180, 30, 50]}
            closed
            fill="rgba(255, 255, 255, 0.15)"
            stroke="#0284c7"
            strokeWidth={1}
            lineJoin="round"
            opacity={0.6}
        />

        {/* 90deg corner highlight */}
        <Group>
          <Line points={[0, 20, 20, 20, 20, 0]} stroke="#0284c7" strokeWidth={1} />
          <Circle x={8} y={8} radius={2} fill="#0284c7" />
        </Group>

        {/* LOGO: "Đ" stylized */}
        <Group x={45} y={100} opacity={0.8}>
            <Circle radius={18} stroke="#0369a1" strokeWidth={2} />
            <Text 
                text="Đ" 
                fontSize={24} 
                fontStyle="bold italic" 
                fill="#0369a1" 
                align="center"
                x={-10}
                y={-12}
            />
        </Group>
    </Group>
  );
});

export default React.memo(VirtualEke);
