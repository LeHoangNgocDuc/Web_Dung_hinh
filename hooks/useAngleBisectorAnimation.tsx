
import React, { useRef, useState, useMemo } from 'react';
import { Group, Line as KonvaLine, Arc as KonvaArc, Circle as KonvaCircle } from 'react-konva';
import gsap from 'gsap';
import { Point2D, Decoration } from '../types';
import { getDistance, getLineAngle, getBothCircleIntersections, normalizeVector, subtractVectors, multiplyVector } from '../utils/math';
import VirtualRuler from '../components/Tools/VirtualRuler';
import VirtualPencil from '../components/Tools/VirtualPencil';
import VirtualCompass from '../components/Tools/VirtualCompass';

export const useAngleBisectorAnimation = () => {
  const [active, setActive] = useState(false);
  const [radius, setRadius] = useState(0);

  // Geometry Refs
  const compassGroupRef = useRef<any>(null);
  const rulerGroupRef = useRef<any>(null);
  const pencilRef = useRef<any>(null);
  
  // Arcs (Construction Lines)
  const arcBaseRef = useRef<any>(null); // Arc at O
  const arc1Ref = useRef<any>(null);    // Arc at M
  const arc2Ref = useRef<any>(null);    // Arc at N
  
  // Highlight Points (Construction Points)
  const intersect1Ref = useRef<any>(null); // M
  const intersect2Ref = useRef<any>(null); // N
  const finalIntersectRef = useRef<any>(null); // I
  
  // Result Line
  const bisectorLineRef = useRef<any>(null);
  
  // Decorations
  const angleMark1Ref = useRef<any>(null);
  const angleMark2Ref = useRef<any>(null);
  const angleTick1Ref = useRef<any>(null);
  const angleTick2Ref = useRef<any>(null);

  /**
   * Sequence:
   * 1. Compass at O. Draw Dashed Arc cutting legs at M and N.
   * 2. Compass at M (Same Radius). Draw Dashed Arc.
   * 3. Compass at N (Same Radius). Draw Dashed Arc -> Intersect I.
   * 4. Draw Ray Ot (passing through I).
   * 5. Cleanup construction. Leave Result + Markings.
   */
  const play = (O: Point2D, A: Point2D, B: Point2D, onComplete?: (I: Point2D, decorations: Decoration[]) => void) => {
    setActive(true);
    
    // 1. Math Setup
    const distOA = getDistance(O, A);
    const distOB = getDistance(O, B);
    const R = Math.min(distOA, distOB) * 0.6; 
    setRadius(R);

    // Calculate Intersection Points on Legs (M and N)
    const vecOA = normalizeVector(subtractVectors(A, O));
    const vecOB = normalizeVector(subtractVectors(B, O));
    
    const M: Point2D = { id: `temp_m_${Date.now()}`, x: O.x + vecOA.x * R, y: O.y + vecOA.y * R };
    const N: Point2D = { id: `temp_n_${Date.now()}`, x: O.x + vecOB.x * R, y: O.y + vecOB.y * R };

    // Calculate Final Intersection I
    const intersections = getBothCircleIntersections(M, R, N, R);
    
    let I: Point2D = { id: `temp_i_${Date.now()}`, x: 0, y: 0 };
    if (intersections) {
        const d0 = getDistance(O, intersections[0]);
        const d1 = getDistance(O, intersections[1]);
        // Pick the intersection furthest from O (the one "inside" the angle)
        I = d0 > d1 ? intersections[0] : intersections[1];
    }

    // Angle calculations for arcs
    const angOA = getLineAngle(O, A);
    const angOB = getLineAngle(O, B);
    const angBisector = getLineAngle(O, I);

    // Helper: Calculate sweep between two angles ensuring we go the "short way"
    const getSweepParams = (startAng: number, endAng: number) => {
        let diff = endAng - startAng;
        while (diff <= -180) diff += 360;
        while (diff > 180) diff -= 360;
        return { start: startAng, sweep: diff };
    };

    // Helper for Angle Decoration
    const getAngleArcParams = (center: Point2D, startP: Point2D, endP: Point2D) => {
        const aStart = getLineAngle(center, startP);
        const aEnd = getLineAngle(center, endP);
        let diff = aEnd - aStart;
        while (diff <= -180) diff += 360;
        while (diff > 180) diff -= 360;
        
        let finalRotation = aStart;
        let finalAngle = diff;
        if (finalAngle < 0) {
            finalRotation = aStart + finalAngle;
            finalAngle = Math.abs(finalAngle);
        }
        return { x: center.x, y: center.y, radius: 40, rotation: finalRotation, angle: finalAngle };
    };
    
    const getTickOnArc = (center: Point2D, startP: Point2D, endP: Point2D) => {
         const p = getAngleArcParams(center, startP, endP);
         const midAngleRad = (p.rotation + p.angle / 2) * Math.PI / 180;
         const arcR = p.radius;
         const mx = center.x + Math.cos(midAngleRad) * arcR;
         const my = center.y + Math.sin(midAngleRad) * arcR;
         const tickLen = 5;
         return [
             mx - Math.cos(midAngleRad) * tickLen, my - Math.sin(midAngleRad) * tickLen,
             mx + Math.cos(midAngleRad) * tickLen, my + Math.sin(midAngleRad) * tickLen
         ];
    };

    setTimeout(() => {
      const tl = gsap.timeline({
        onComplete: () => {
            const decs: Decoration[] = [];
            
            // Add equality marks
            decs.push({ id: `ang_b1_${Date.now()}`, type: 'ANGLE', ...getAngleArcParams(O, A, I), stroke: '#ef4444' });
            decs.push({ id: `ang_b2_${Date.now()}`, type: 'ANGLE', ...getAngleArcParams(O, I, B), stroke: '#ef4444' });
            decs.push({ id: `tick_ang_1_${Date.now()}`, type: 'TICK', points: getTickOnArc(O, A, I), stroke: '#ef4444' });
            decs.push({ id: `tick_ang_2_${Date.now()}`, type: 'TICK', points: getTickOnArc(O, I, B), stroke: '#ef4444' });
            
            // Add Label "t" for the ray "Ot"
            // Position it slightly beyond I
            const vecOI = normalizeVector(subtractVectors(I, O));
            const labelPos = {
                x: I.x + vecOI.x * 40,
                y: I.y + vecOI.y * 40
            };
            decs.push({
                id: `label_ot_${Date.now()}`,
                type: 'TEXT',
                text: 't',
                x: labelPos.x,
                y: labelPos.y,
                stroke: '#ef4444'
            });

            setActive(false);
            if (onComplete) onComplete(I, decs);
        }
      });

      // ===============================================
      // PHASE 1: COMPASS AT O -> ARC SWEEP (Dashed)
      // ===============================================
      
      // Calculate sweep from OA to OB
      let { start: startRot, sweep: diff } = getSweepParams(angOA, angOB);
      
      // Extend sweep slightly for visual niceness
      const buffer = 15; 
      const drawStart = startRot - (diff > 0 ? buffer : -buffer);
      const drawSweep = diff + (diff > 0 ? buffer * 2 : -buffer * 2);

      // Start: Invisible, Angle 0
      tl.set(compassGroupRef.current, { x: O.x, y: O.y, rotation: drawStart, opacity: 0, scale: 0.9 });
      tl.set(arcBaseRef.current, { x: O.x, y: O.y, rotation: drawStart, angle: 0, opacity: 1 });
      
      // Fade in Compass
      tl.to(compassGroupRef.current, { opacity: 1, scale: 1, duration: 0.5 });
      
      // Draw Arc (Sweep) - Animating 'angle' property
      tl.to(compassGroupRef.current, { rotation: drawStart + drawSweep, duration: 1.0, ease: "sine.inOut" });
      tl.to(arcBaseRef.current, { angle: drawSweep, duration: 1.0, ease: "sine.inOut" }, "<");

      // Highlight intersections M and N
      tl.set([intersect1Ref.current, intersect2Ref.current], { x: (i:number) => i===0 ? M.x : N.x, y: (i:number) => i===0 ? M.y : N.y, opacity: 1, scale: 0 });
      tl.to([intersect1Ref.current, intersect2Ref.current], { scale: 1, duration: 0.3 });

      // ===============================================
      // PHASE 2: COMPASS AT M (Radius R - Same)
      // ===============================================
      const sweep2 = 50;
      const angM_I = getLineAngle(M, I);
      const startM = angM_I - sweep2/2;

      tl.to(compassGroupRef.current, { opacity: 0.5, duration: 0.2 });
      tl.set(compassGroupRef.current, { x: M.x, y: M.y, rotation: startM });
      tl.set(arc1Ref.current, { x: M.x, y: M.y, rotation: startM, angle: 0, opacity: 1 });
      
      tl.to(compassGroupRef.current, { opacity: 1, duration: 0.3 });
      tl.to(compassGroupRef.current, { rotation: startM + sweep2, duration: 0.8 });
      tl.to(arc1Ref.current, { angle: sweep2, duration: 0.8 }, "<");

      // ===============================================
      // PHASE 3: COMPASS AT N (Radius R - Same)
      // ===============================================
      const angN_I = getLineAngle(N, I);
      const startN = angN_I - sweep2/2;
      
      tl.to(compassGroupRef.current, { opacity: 0.5, duration: 0.2 });
      tl.set(compassGroupRef.current, { x: N.x, y: N.y, rotation: startN });
      tl.set(arc2Ref.current, { x: N.x, y: N.y, rotation: startN, angle: 0, opacity: 1 });
      
      tl.to(compassGroupRef.current, { opacity: 1, duration: 0.3 });
      tl.to(compassGroupRef.current, { rotation: startN + sweep2, duration: 0.8 });
      tl.to(arc2Ref.current, { angle: sweep2, duration: 0.8 }, "<");
      
      tl.to(compassGroupRef.current, { opacity: 0, x: "+=20", duration: 0.3 });

      // Highlight Final Intersection I
      tl.set(finalIntersectRef.current, { x: I.x, y: I.y, opacity: 1, scale: 0 });
      tl.to(finalIntersectRef.current, { scale: 1, duration: 0.3 });

      // ===============================================
      // PHASE 4: DRAW RAY Ot
      // ===============================================
      // Draw slightly past I
      const distOI = getDistance(O, I) * 1.5; 
      
      tl.set(bisectorLineRef.current, { points: [O.x, O.y, I.x, I.y], opacity: 1, dash: [distOI, distOI], dashOffset: distOI });
      
      tl.set(rulerGroupRef.current, { x: O.x, y: O.y, rotation: angBisector, opacity: 0 });
      tl.set(pencilRef.current, { x: O.x, y: O.y, rotation: 30, opacity: 0 });
      
      tl.to([rulerGroupRef.current, pencilRef.current], { opacity: 1, duration: 0.3 });
      
      tl.to(pencilRef.current, { x: I.x, y: I.y, duration: 1.0, ease: "sine.inOut" }, "draw");
      tl.to(bisectorLineRef.current, { dashOffset: 0, duration: 1.0, ease: "sine.inOut" }, "draw");

      // ===============================================
      // PHASE 5: CLEANUP & SHOW DECORATIONS
      // ===============================================
      // Hide construction lines (arcs) and construction points (M, N, I)
      // Do NOT hide bisectorLineRef here.
      tl.to([rulerGroupRef.current, pencilRef.current, intersect1Ref.current, intersect2Ref.current, finalIntersectRef.current], { opacity: 0, duration: 0.5 });
      tl.to([arcBaseRef.current, arc1Ref.current, arc2Ref.current], { opacity: 0, duration: 0.5 }, "<");

      // Show Marks
      const angParams1 = getAngleArcParams(O, A, I);
      const angParams2 = getAngleArcParams(O, I, B);
      const tick1 = getTickOnArc(O, A, I);
      const tick2 = getTickOnArc(O, I, B);

      tl.set(angleMark1Ref.current, { ...angParams1, opacity: 0, stroke: "#ef4444", strokeWidth: 2 });
      tl.set(angleMark2Ref.current, { ...angParams2, opacity: 0, stroke: "#ef4444", strokeWidth: 2 });
      tl.set(angleTick1Ref.current, { points: tick1, opacity: 0, stroke: "#ef4444", strokeWidth: 2 });
      tl.set(angleTick2Ref.current, { points: tick2, opacity: 0, stroke: "#ef4444", strokeWidth: 2 });
      
      tl.to([angleMark1Ref.current, angleMark2Ref.current, angleTick1Ref.current, angleTick2Ref.current], { opacity: 1, duration: 0.4 });

    }, 50);
  };

  const animationLayer = useMemo(() => {
    if (!active) return null;
    const maxLen = radius * 2 + 50;

    return (
      <Group>
        <Group ref={rulerGroupRef} listening={false} opacity={0}>
             <Group x={-20} y={0}><VirtualRuler x={0} y={0} rotation={0} length={maxLen} /></Group>
        </Group>
        <Group ref={compassGroupRef} listening={false} opacity={0}>
            <VirtualCompass centerX={0} centerY={0} radius={radius} rotation={0} />
        </Group>

        {/* Construction Arcs: Start with opacity 0 and angle 0 to be safe */}
        <KonvaArc ref={arcBaseRef} innerRadius={radius} outerRadius={radius} angle={0} stroke="#74B9FF" strokeWidth={1} dash={[5, 5]} opacity={0} listening={false} />
        <KonvaArc ref={arc1Ref} innerRadius={radius} outerRadius={radius} angle={0} stroke="#74B9FF" strokeWidth={1} dash={[5, 5]} opacity={0} listening={false} />
        <KonvaArc ref={arc2Ref} innerRadius={radius} outerRadius={radius} angle={0} stroke="#74B9FF" strokeWidth={1} dash={[5, 5]} opacity={0} listening={false} />
        
        {/* Construction Points */}
        <KonvaCircle ref={intersect1Ref} radius={4} fill="#74B9FF" opacity={0} />
        <KonvaCircle ref={intersect2Ref} radius={4} fill="#74B9FF" opacity={0} />
        <KonvaCircle ref={finalIntersectRef} radius={4} fill="#ef4444" opacity={0} />

        {/* Bisector */}
        <KonvaLine ref={bisectorLineRef} stroke="#ef4444" strokeWidth={2} lineCap="round" />

        {/* Decorations */}
        <KonvaArc ref={angleMark1Ref} innerRadius={35} outerRadius={35} angle={0} stroke="#ef4444" strokeWidth={2} />
        <KonvaArc ref={angleMark2Ref} innerRadius={35} outerRadius={35} angle={0} stroke="#ef4444" strokeWidth={2} />
        <KonvaLine ref={angleTick1Ref} lineCap="round" />
        <KonvaLine ref={angleTick2Ref} lineCap="round" />

        <VirtualPencil ref={pencilRef} x={0} y={0} isDrawing={true} opacity={0} />
      </Group>
    );
  }, [active, radius]);

  return { play, animationLayer, isAnimating: active };
};
