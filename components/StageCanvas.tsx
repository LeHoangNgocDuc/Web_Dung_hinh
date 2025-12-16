import React, { useState, useMemo } from 'react';
import { Stage, Layer, Line, Group } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { Vector2D } from '../types';

interface StageCanvasProps {
  width: number;
  height: number;
  onMouseMove?: (e: KonvaEventObject<MouseEvent>) => void;
  onClick?: (e: KonvaEventObject<MouseEvent>) => void;
  children?: React.ReactNode;
  forwardedRef?: React.MutableRefObject<any>;
}

const GRID_SIZE = 50;

const StageCanvas: React.FC<StageCanvasProps> = ({
  width,
  height,
  onMouseMove,
  onClick,
  children,
  forwardedRef,
}) => {
  const [stagePos, setStagePos] = useState<Vector2D>({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState<number>(1);

  // ==============================
  // Zoom Handling
  // ==============================
  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const scaleBy = 1.1;
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

    // Clamp Scale
    if (newScale < 0.1 || newScale > 10) return;

    // Calculate new position to zoom towards pointer
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    setStageScale(newScale);
    setStagePos(newPos);
  };

  // ==============================
  // Infinite Grid Logic
  // ==============================
  const gridComponents = useMemo(() => {
    // Prevent infinite loops or invalid calculations if width/height are invalid
    if (width <= 0 || height <= 0) return [];

    // Calculate visible area in "World Coordinates"
    // startX = (0 - stageX) / scale
    const startX = Math.floor((-stagePos.x) / stageScale / GRID_SIZE) * GRID_SIZE;
    const endX = Math.floor((-stagePos.x + width) / stageScale / GRID_SIZE) * GRID_SIZE;
    
    const startY = Math.floor((-stagePos.y) / stageScale / GRID_SIZE) * GRID_SIZE;
    const endY = Math.floor((-stagePos.y + height) / stageScale / GRID_SIZE) * GRID_SIZE;

    const lines = [];

    // Vertical Lines
    for (let x = startX; x <= endX; x += GRID_SIZE) {
      const isMajor = x % (GRID_SIZE * 5) === 0; // Every 5th line is major
      const isAxis = x === 0;
      
      lines.push(
        <Line
          key={`v${x}`}
          points={[x, startY, x, endY]}
          stroke={isAxis ? "#94a3b8" : "#cbd5e1"} // Axis darker, grid lighter
          strokeWidth={isAxis ? 2 : isMajor ? 1 : 0.5}
          dash={isAxis ? [] : isMajor ? [] : [4, 4]}
          listening={false}
        />
      );
    }

    // Horizontal Lines
    for (let y = startY; y <= endY; y += GRID_SIZE) {
      const isMajor = y % (GRID_SIZE * 5) === 0;
      const isAxis = y === 0;

      lines.push(
        <Line
          key={`h${y}`}
          points={[startX, y, endX, y]}
          stroke={isAxis ? "#94a3b8" : "#cbd5e1"}
          strokeWidth={isAxis ? 2 : isMajor ? 1 : 0.5}
          dash={isAxis ? [] : isMajor ? [] : [4, 4]}
          listening={false}
        />
      );
    }

    return lines;
  }, [stagePos, stageScale, width, height]);

  // Guard against 0 dimensions which causes "drawImage" errors in Konva
  if (width <= 0 || height <= 0) {
    return <div style={{ width: '100%', height: '100%', backgroundColor: '#f8fafc' }} />;
  }

  return (
    <Stage
      width={width}
      height={height}
      onWheel={handleWheel}
      draggable
      onDragEnd={(e) => {
        // Only update state if the stage itself was dragged (not a child)
        if (e.target === e.target.getStage()) {
          setStagePos({ x: e.target.x(), y: e.target.y() });
        }
      }}
      x={stagePos.x}
      y={stagePos.y}
      scaleX={stageScale}
      scaleY={stageScale}
      onMouseMove={onMouseMove}
      onClick={onClick}
      ref={forwardedRef}
      style={{ backgroundColor: '#f8fafc' }} // slate-50
    >
      <Layer>
        {/* Render Grid First (Background) */}
        <Group>{gridComponents}</Group>
      </Layer>
      {children}
    </Stage>
  );
};

export default StageCanvas;