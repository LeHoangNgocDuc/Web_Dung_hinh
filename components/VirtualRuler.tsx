import React from 'react';
import { Group, Rect, Text } from 'react-konva';
import { RulerProps } from '../types';
import { getDistance, getAngle } from '../utils/math';

export const VirtualRuler: React.FC<RulerProps> = ({ visible, p1, p2, opacity }) => {
  if (!visible) return null;

  const length = getDistance({ ...p1, id: '' }, { ...p2, id: '' });
  const angle = getAngle({ ...p1, id: '' }, { ...p2, id: '' });
  const extraLen = 100; // Make ruler longer than the points

  return (
    <Group 
        x={p1.x} 
        y={p1.y} 
        rotation={angle} 
        opacity={opacity}
        offsetY={25} // Center vertically
        offsetX={extraLen / 2}
    >
      {/* Ruler Body */}
      <Rect
        width={length + extraLen}
        height={50}
        fill="rgba(255, 235, 59, 0.8)"
        stroke="#eab308"
        strokeWidth={2}
        cornerRadius={4}
      />
      {/* Ticks */}
      {Array.from({ length: Math.floor((length + extraLen) / 20) }).map((_, i) => (
        <Rect
          key={i}
          x={i * 20}
          y={0}
          width={1}
          height={15}
          fill="#854d0e"
        />
      ))}
      <Text text="RULER" x={10} y={30} fill="#854d0e" fontSize={12} fontStyle="bold"/>
    </Group>
  );
};