
import React, { useRef, useState, useMemo } from 'react';
import { Group, Line as KonvaLine, Arc as KonvaArc, Text as KonvaText } from 'react-konva';
import gsap from 'gsap';
import { Point2D, Decoration } from '../types';
import { getDistance, getLineAngle } from '../utils/math';
import VirtualRuler from '../components/Tools/VirtualRuler';
import VirtualPencil from '../components/Tools/VirtualPencil';

export const useQuadrilateralAnimation = () => {
  const [active, setActive] = useState(false);
  const [points, setPoints] = useState<Point2D[]>([]);

  // Refs
  const rulerRef = useRef<any>(null);
  const pencilRef = useRef<any>(null);
  const line1Ref = useRef<any>(null);
  const line2Ref = useRef<any>(null);
  const line3Ref = useRef<any>(null);
  const line4Ref = useRef<any>(null);
  
  const arcARef = useRef<any>(null);
  const arcBRef = useRef<any>(null);
  const arcCRef = useRef<any>(null);
  const arcDRef = useRef<any>(null);

  // Helper to calculate interior angle
  const getInteriorAngle = (center: Point2D, prev: Point2D, next: Point2D) => {
    const angPrev = getLineAngle(center, prev);
    const angNext = getLineAngle(center, next);
    let diff = angNext - angPrev;
    while (diff <= -180) diff += 360;
    while (diff > 180) diff -= 360;
    
    // Konva Arc logic: needs positive angle
    let finalRotation = angPrev;
    let finalAngle = diff;
    if (finalAngle < 0) {
        finalRotation = angPrev + finalAngle;
        finalAngle = Math.abs(finalAngle);
    }
    return { rotation: finalRotation, angle: finalAngle, degrees: Math.round(finalAngle) };
  };

  /**
   * Sequence:
   * 1. Draw AB.
   * 2. Draw BC.
   * 3. Draw CD.
   * 4. Draw DA.
   * 5. Pop up Angles.
   */
  const play = (p1: Point2D, p2: Point2D, p3: Point2D, p4: Point2D, onComplete?: (decorations: Decoration[]) => void) => {
    setActive(true);
    setPoints([p1, p2, p3, p4]);

    const lineRefs = [line1Ref, line2Ref, line3Ref, line4Ref];
    const segmentPairs = [[p1, p2], [p2, p3], [p3, p4], [p4, p1]];

    setTimeout(() => {
      const tl = gsap.timeline({
        onComplete: () => {
            // Calculate final decorations
            const decs: Decoration[] = [];
            const pts = [p1, p2, p3, p4];
            
            // Generate angles for A(p1), B(p2), C(p3), D(p4)
            // A: Neighbors p4, p2
            const angA = getInteriorAngle(p1, p4, p2);
            decs.push({ id: `ang_A_${Date.now()}`, type: 'ANGLE', x: p1.x, y: p1.y, radius: 25, rotation: angA.rotation, angle: angA.angle, stroke: '#ef4444' });
            decs.push({ id: `lbl_A_${Date.now()}`, type: 'TEXT', x: p1.x, y: p1.y - 30, text: `${angA.degrees}°`, stroke: '' });

            // B: Neighbors p1, p3
            const angB = getInteriorAngle(p2, p1, p3);
            decs.push({ id: `ang_B_${Date.now()}`, type: 'ANGLE', x: p2.x, y: p2.y, radius: 25, rotation: angB.rotation, angle: angB.angle, stroke: '#ef4444' });
            decs.push({ id: `lbl_B_${Date.now()}`, type: 'TEXT', x: p2.x, y: p2.y - 30, text: `${angB.degrees}°`, stroke: '' });

            // C: Neighbors p2, p4
            const angC = getInteriorAngle(p3, p2, p4);
            decs.push({ id: `ang_C_${Date.now()}`, type: 'ANGLE', x: p3.x, y: p3.y, radius: 25, rotation: angC.rotation, angle: angC.angle, stroke: '#ef4444' });
            decs.push({ id: `lbl_C_${Date.now()}`, type: 'TEXT', x: p3.x, y: p3.y - 30, text: `${angC.degrees}°`, stroke: '' });

            // D: Neighbors p3, p1
            const angD = getInteriorAngle(p4, p3, p1);
            decs.push({ id: `ang_D_${Date.now()}`, type: 'ANGLE', x: p4.x, y: p4.y, radius: 25, rotation: angD.rotation, angle: angD.angle, stroke: '#ef4444' });
            decs.push({ id: `lbl_D_${Date.now()}`, type: 'TEXT', x: p4.x, y: p4.y - 30, text: `${angD.degrees}°`, stroke: '' });

            setActive(false);
            if (onComplete) onComplete(decs);
        }
      });

      // Loop through 4 segments
      segmentPairs.forEach((pair, idx) => {
          const start = pair[0];
          const end = pair[1];
          const dist = getDistance(start, end);
          const ang = getLineAngle(start, end);
          const lineRef = lineRefs[idx];
          
          // Setup
          tl.set(lineRef.current, { points: [start.x, start.y, end.x, end.y], dash: [dist, dist], dashOffset: dist, opacity: 1, strokeWidth: 2 });
          
          // Move Ruler & Pencil
          tl.set(rulerRef.current, { x: start.x, y: start.y, rotation: ang, opacity: 0 });
          tl.set(pencilRef.current, { x: start.x, y: start.y, rotation: 30, opacity: 0 });
          
          tl.to([rulerRef.current, pencilRef.current], { opacity: 1, duration: 0.2 });
          
          // Draw
          tl.to(pencilRef.current, { x: end.x, y: end.y, duration: 0.5, ease: "linear" }, `draw${idx}`);
          tl.to(lineRef.current, { dashOffset: 0, duration: 0.5, ease: "linear" }, `draw${idx}`);
          
          // Fade out tools briefly between lines
          tl.to([rulerRef.current, pencilRef.current], { opacity: 0, duration: 0.1 });
      });
      
      // Show Angles
      tl.set([arcARef.current, arcBRef.current, arcCRef.current, arcDRef.current], { opacity: 0 });
      // We calculate angle props dynamically in render, here we just fade in
      tl.to([arcARef.current, arcBRef.current, arcCRef.current, arcDRef.current], { opacity: 1, duration: 0.5 });

    }, 50);
  };

  const animationLayer = useMemo(() => {
    if (!active || points.length < 4) return null;
    
    // Pre-calculate angle props for the animation layer visuals
    const [p1, p2, p3, p4] = points;
    const angA = getInteriorAngle(p1, p4, p2);
    const angB = getInteriorAngle(p2, p1, p3);
    const angC = getInteriorAngle(p3, p2, p4);
    const angD = getInteriorAngle(p4, p3, p1);

    return (
      <Group>
        <Group ref={rulerRef} listening={false} opacity={0}>
            <Group x={-20} y={0}><VirtualRuler x={0} y={0} rotation={0} length={400} /></Group>
        </Group>

        <KonvaLine ref={line1Ref} stroke="black" lineCap="round" />
        <KonvaLine ref={line2Ref} stroke="black" lineCap="round" />
        <KonvaLine ref={line3Ref} stroke="black" lineCap="round" />
        <KonvaLine ref={line4Ref} stroke="black" lineCap="round" />
        
        <KonvaArc ref={arcARef} x={p1.x} y={p1.y} innerRadius={20} outerRadius={20} rotation={angA.rotation} angle={angA.angle} stroke="#ef4444" strokeWidth={2} />
        <KonvaArc ref={arcBRef} x={p2.x} y={p2.y} innerRadius={20} outerRadius={20} rotation={angB.rotation} angle={angB.angle} stroke="#ef4444" strokeWidth={2} />
        <KonvaArc ref={arcCRef} x={p3.x} y={p3.y} innerRadius={20} outerRadius={20} rotation={angC.rotation} angle={angC.angle} stroke="#ef4444" strokeWidth={2} />
        <KonvaArc ref={arcDRef} x={p4.x} y={p4.y} innerRadius={20} outerRadius={20} rotation={angD.rotation} angle={angD.angle} stroke="#ef4444" strokeWidth={2} />

        <VirtualPencil ref={pencilRef} x={0} y={0} isDrawing={true} opacity={0} />
      </Group>
    );
  }, [active, points]);

  return { play, animationLayer, isAnimating: active };
};
