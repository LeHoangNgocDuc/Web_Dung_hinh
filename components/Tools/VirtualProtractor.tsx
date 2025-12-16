
import React, { useMemo } from 'react';
import { Group, Arc, Line, Text, Circle } from 'react-konva';

interface VirtualProtractorProps {
  x: number;
  y: number;
  rotation?: number;
  opacity?: number;
  onClick?: (e: any) => void; 
}

const VirtualProtractor: React.FC<VirtualProtractorProps> = React.memo(({ x, y, rotation = 0, opacity = 1, onClick }) => {
  const radius = 160;

  const ticks = useMemo(() => {
    const t = [];
    for (let i = 0; i <= 180; i++) {
       const isMajor = i % 10 === 0;
       const isMid = i % 5 === 0 && !isMajor;
       
       if (!isMajor && !isMid) continue; 

       const len = isMajor ? 15 : 10;
       const angleRad = (i * Math.PI) / 180; 
       
       const vecX = Math.cos(-angleRad); 
       const vecY = Math.sin(-angleRad);
       
       const outerR = radius - 2;
       const innerR = radius - 2 - len;
       
       t.push(
         <Line 
            key={`tick_${i}`}
            points={[
                vecX * innerR, vecY * innerR,
                vecX * outerR, vecY * outerR
            ]}
            stroke="#1e293b" 
            strokeWidth={isMajor ? 1.5 : 1}
            listening={false} // Optimize hit testing
         />
       );
       
       if (i % 20 === 0) {
           const textR = radius - 35;
           const tx = vecX * textR;
           const ty = vecY * textR;
           
           t.push(
               <Text
                 key={`txt_${i}`}
                 x={tx - 15}
                 y={ty - 6}
                 text={i.toString()}
                 fontSize={11}
                 width={30}
                 align="center"
                 fill="#334155"
                 fontStyle="bold"
                 listening={false}
               />
           );
       }
    }
    return t;
  }, [radius]);

  return (
    <Group 
        x={x} y={y} 
        rotation={rotation} 
        opacity={opacity} 
        onClick={onClick} 
        onTap={onClick}
        // Ensure the Group listens to events if onClick is present
        listening={!!onClick}
    >
        {/* 
            Invisible Hit Region 
            Ensures clicking anywhere on the semicircle body triggers the event 
            even if the glass fill is transparent.
        */}
        <Arc
            innerRadius={0}
            outerRadius={radius}
            angle={180}
            rotation={180}
            fill="transparent" 
            hitStrokeWidth={0}
        />

        {/* Visual Glass Body */}
        <Arc
            innerRadius={0}
            outerRadius={radius}
            angle={180}
            rotation={180} 
            fill="rgba(255, 255, 255, 0.4)" 
            stroke="#94a3b8"
            strokeWidth={1}
            shadowBlur={5}
            shadowColor="rgba(0,0,0,0.1)"
            shadowOffsetY={2}
        />
        
        {/* Base Line */}
        <Line points={[-radius, 0, radius, 0]} stroke="#475569" strokeWidth={2} listening={false} />
        
        {/* Center Target */}
        <Group listening={false}>
            <Circle radius={3} fill="transparent" stroke="#ef4444" strokeWidth={2} />
            <Line points={[0, -10, 0, 10]} stroke="#ef4444" strokeWidth={1} />
            <Line points={[-10, 0, 10, 0]} stroke="#ef4444" strokeWidth={1} />
        </Group>

        {/* Ticks */}
        <Group listening={false}>{ticks}</Group>
        
        {/* Logo */}
        <Group x={0} y={-50} listening={false}>
            <Text 
                text="Đ" 
                fontSize={32} 
                fontStyle="italic bold" 
                fill="rgba(220, 38, 38, 0.3)" 
                align="center"
                x={-15}
                y={-15}
            />
            <Circle radius={25} stroke="rgba(220, 38, 38, 0.1)" strokeWidth={2} />
        </Group>
    </Group>
  );
});

export default VirtualProtractor;
