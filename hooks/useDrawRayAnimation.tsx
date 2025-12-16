
import React, { useRef, useState, useMemo } from 'react';
import { Group, Line as KonvaLine } from 'react-konva';
import gsap from 'gsap';
import { Point2D, Decoration } from '../types';
import { getDistance, getLineAngle, normalizeVector, subtractVectors, multiplyVector } from '../utils/math';
import VirtualRuler from '../components/Tools/VirtualRuler';
import VirtualPencil from '../components/Tools/VirtualPencil';

export const useDrawRayAnimation = () => {
  const [active, setActive] = useState(false);
  const [startP, setStartP] = useState<Point2D>({ x: 0, y: 0, id: 's' });
  const [throughP, setThroughP] = useState<Point2D>({ x: 0, y: 0, id: 't' });
  const [endP, setEndP] = useState<Point2D>({ x: 0, y: 0, id: 'e' });

  const rulerRef = useRef<any>(null);
  const pencilRef = useRef<any>(null);
  const rayLineRef = useRef<any>(null);

  const play = (O: Point2D, A: Point2D, onComplete?: (rayEnd: Point2D) => void) => {
    setActive(true);
    setStartP(O);
    setThroughP(A);

    // Calculate Extended Point for Ray
    const dir = normalizeVector(subtractVectors(A, O));
    const extensionLen = 500; // Extend 500px
    const farPoint = {
        x: O.x + dir.x * extensionLen,
        y: O.y + dir.y * extensionLen,
        id: `ray_end_${Date.now()}`
    };
    setEndP(farPoint);

    const distTotal = getDistance(O, farPoint);
    const angle = getLineAngle(O, A);

    setTimeout(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          setActive(false);
          if (onComplete) onComplete(farPoint);
        }
      });

      // 1. Ruler Enters
      tl.set(rulerRef.current, { x: O.x, y: O.y, rotation: angle, opacity: 0, scale: 0.9 });
      tl.to(rulerRef.current, { opacity: 1, scale: 1, duration: 0.8, ease: "power2.out" });

      // 2. Pencil Enters at O
      tl.set(pencilRef.current, { x: O.x, y: O.y, rotation: 30, opacity: 0 });
      tl.to(pencilRef.current, { opacity: 1, duration: 0.5 });

      // 3. Draw Ray
      tl.set(rayLineRef.current, { points: [O.x, O.y, farPoint.x, farPoint.y], dash: [distTotal, distTotal], dashOffset: distTotal, opacity: 1 });
      
      tl.to(pencilRef.current, { x: farPoint.x, y: farPoint.y, duration: 1.5, ease: "linear" }, "draw");
      tl.to(rayLineRef.current, { dashOffset: 0, duration: 1.5, ease: "linear" }, "draw");

      // 4. Cleanup
      tl.to([rulerRef.current, pencilRef.current], { opacity: 0, duration: 0.5 });
    }, 50);
  };

  const animationLayer = useMemo(() => {
    if (!active) return null;
    return (
      <Group>
        <Group ref={rulerRef} listening={false} opacity={0}>
             <Group x={-20} y={0}><VirtualRuler x={0} y={0} rotation={0} length={600} /></Group>
        </Group>
        
        <KonvaLine ref={rayLineRef} stroke="black" strokeWidth={2} lineCap="round" />
        
        <VirtualPencil ref={pencilRef} x={0} y={0} isDrawing={true} opacity={0} />
      </Group>
    );
  }, [active]);

  return { play, animationLayer, isAnimating: active };
};
