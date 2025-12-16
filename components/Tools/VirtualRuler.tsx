
import React, { useMemo } from 'react';
import { Group, Rect, Line, Text, Circle } from 'react-konva';
import { PIXELS_PER_CM } from '../../constants';

interface VirtualRulerProps {
  x: number;
  y: number;
  rotation: number;
  length?: number;
  variant?: 'default' | 'rail'; // New prop
}

const VirtualRuler: React.FC<VirtualRulerProps> = React.memo(({ x, y, rotation, length = 300, variant = 'default' }) => {
  
  const isRail = variant === 'rail';
  
  // Rail style: Darker, more "metallic/sturdy"
  const bodyFill = isRail ? "#cbd5e1" : "rgba(255, 225, 0, 0.25)"; // Slate-300 vs Yellow
  const bodyStroke = isRail ? "#475569" : "rgba(0,0,0,0.1)";
  const tickColor = isRail ? "#334155" : "#334155";
  const opacity = isRail ? 1 : 1;

  const ticks = useMemo(() => {
    const t = [];
    const pixelsPerMm = PIXELS_PER_CM / 10;
    const totalMm = Math.floor(length / pixelsPerMm);

    for (let m = 0; m <= totalMm; m++) { 
        const posX = m * pixelsPerMm;
        const isCm = m % 10 === 0;    
        const isHalfCm = m % 5 === 0 && !isCm;
        
        const tickHeight = isCm ? 18 : (isHalfCm ? 12 : 7);
        const strokeWidth = isCm ? 1.5 : 1;
        const tickOpacity = isCm ? 0.9 : 0.6;

        t.push(
            <Group key={m} x={posX}>
                <Line
                    points={[0, 0, 0, tickHeight]}
                    stroke={tickColor}
                    strokeWidth={strokeWidth}
                    opacity={tickOpacity}
                />
                {isCm && (
                    <Text 
                        x={-10} 
                        y={20} 
                        text={(m / 10).toString()} 
                        fontSize={11} 
                        fontStyle="bold"
                        fill={tickColor}
                        width={20} 
                        align="center"
                    />
                )}
            </Group>
        );
    }
    return t;
  }, [length, tickColor]);

  return (
    <Group x={x} y={y} rotation={rotation} opacity={opacity}>
      <Rect
        width={length + 20}
        height={50}
        y={0} 
        x={-10} 
        fill={bodyFill}
        cornerRadius={2}
        stroke={bodyStroke}
        strokeWidth={1}
        shadowBlur={isRail ? 5 : 0} // Rail casts a shadow
        shadowOpacity={0.2}
      />
      
      <Group x={0} y={0}>{ticks}</Group>
      
      {/* Reflection for Yellow Ruler */}
      {!isRail && (
        <Rect
            width={length + 20}
            height={20}
            y={0}
            x={-10}
            fill="white"
            opacity={0.15}
            listening={false}
        />
      )}

      {/* Rail Texture lines */}
      {isRail && (
         <Line points={[-10, 45, length+10, 45]} stroke="#94a3b8" strokeWidth={2} />
      )}

       {/* LOGO: "Đ" stylized */}
       <Group x={length - 40} y={25} opacity={0.6}>
            <Circle radius={14} stroke={isRail ? "#334155" : "#854d0e"} strokeWidth={1.5} />
            <Text 
                text="Đ" 
                fontSize={18} 
                fontStyle="bold italic" 
                fill={isRail ? "#334155" : "#854d0e"}
                align="center"
                x={-8}
                y={-9}
            />
        </Group>
    </Group>
  );
});

export default VirtualRuler;
