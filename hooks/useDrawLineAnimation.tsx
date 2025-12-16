
import React, { useRef, useState, useMemo } from 'react';
import { Group, Line as KonvaLine } from 'react-konva';
import gsap from 'gsap';
import { Point2D } from '../types';
import { getDistance, getLineAngle, normalizeVector, subtractVectors } from '../utils/math';
import VirtualRuler from '../components/Tools/VirtualRuler';
import VirtualPencil from '../components/Tools/VirtualPencil';

export const useDrawLineAnimation = () => {
  const [active, setActive] = useState(false);
  const [drawStart, setDrawStart] = useState<Point2D>({ x: 0, y: 0, id: 's' });
  const [drawEnd, setDrawEnd] = useState<Point2D>({ x: 0, y: 0, id: 'e' });

  const rulerRef = useRef<any>(null);
  const pencilRef = useRef<any>(null);
  const lineRef = useRef<any>(null);

  const play = (A: Point2D, B: Point2D, onComplete?: (startExt: Point2D, endExt: Point2D) => void) => {
    setActive(true);
    
    // Calculate infinite extensions
    const dir = normalizeVector(subtractVectors(B, A));
    const extLen = 300; // How far to extend past points
    
    const startExt = {
        x: A.x - dir.x * extLen,
        y: A.y - dir.y * extLen,
        id: `inf_start_${Date.now()}`
    };
    
    const endExt = {
        x: B.x + dir.x * extLen,
        y: B.y + dir.y * extLen,
        id: `inf_end_${Date.now()}`
    };
    
    setDrawStart(startExt);
    setDrawEnd(endExt);

    const distTotal = getDistance(startExt, endExt);
    const angle = getLineAngle(A, B);

    setTimeout(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          setActive(false);
          if (onComplete) onComplete(startExt, endExt);
        }
      });

      // 1. Ruler Enters (Aligns with A and B, but positioned to cover the full draw)
      // We offset the ruler X so it covers the startExt
      const offset = getDistance(startExt, A) + 50;
      
      tl.set(rulerRef.current, { x: A.x, y: A.y, rotation: angle, opacity: 0, scale: 0.9 });
      
      // Ruler needs to slide back to cover startExt
      // We can simulate this by placing ruler group at A, but the ruler graphic inside is offset
      // But simpler: just place ruler at startExt + buffer
      tl.set(rulerRef.current, { x: startExt.x, y: startExt.y, rotation: angle });
      
      tl.to(rulerRef.current, { opacity: 1, scale: 1, duration: 0.8 });

      // 2. Pencil Enters at startExt
      tl.set(pencilRef.current, { x: startExt.x, y: startExt.y, rotation: 30, opacity: 0 });
      tl.to(pencilRef.current, { opacity: 1, duration: 0.5 });

      // 3. Draw Line
      tl.set(lineRef.current, { points: [startExt.x, startExt.y, endExt.x, endExt.y], dash: [distTotal, distTotal], dashOffset: distTotal, opacity: 1 });
      
      tl.to(pencilRef.current, { x: endExt.x, y: endExt.y, duration: 2.0, ease: "linear" }, "draw");
      tl.to(lineRef.current, { dashOffset: 0, duration: 2.0, ease: "linear" }, "draw");

      // 4. Cleanup
      tl.to([rulerRef.current, pencilRef.current], { opacity: 0, duration: 0.5 });
    }, 50);
  };

  const animationLayer = useMemo(() => {
    if (!active) return null;
    return (
      <Group>
        <Group ref={rulerRef} listening={false} opacity={0}>
             <Group x={-20} y={0}><VirtualRuler x={0} y={0} rotation={0} length={800} /></Group>
        </Group>
        
        <KonvaLine ref={lineRef} stroke="black" strokeWidth={2} lineCap="round" />
        
        <VirtualPencil ref={pencilRef} x={0} y={0} isDrawing={true} opacity={0} />
      </Group>
    );
  }, [active]);

  return { play, animationLayer, isAnimating: active };
};
