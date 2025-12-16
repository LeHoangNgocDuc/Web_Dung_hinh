
import React, { useRef, useState, useMemo } from 'react';
import { Group, Line as KonvaLine, Circle as KonvaCircle, Arc as KonvaArc } from 'react-konva';
import gsap from 'gsap';
import { Point2D, Decoration } from '../types';
import { getDistance, getLineAngle, getCircleIntersections, getMidpoint } from '../utils/math';
import VirtualRuler from '../components/Tools/VirtualRuler';
import VirtualPencil from '../components/Tools/VirtualPencil';
import VirtualCompass from '../components/Tools/VirtualCompass';

export const useIsoscelesTriangleAnimation = () => {
  const [active, setActive] = useState(false);
  
  // Data State
  const [pointA, setPointA] = useState<Point2D>({ id: 'temp_a', x: 0, y: 0 }); // The vertex A (Found)
  const [pointB, setPointB] = useState<Point2D>({ id: 'temp_b', x: 0, y: 0 }); // Base Start
  const [pointC, setPointC] = useState<Point2D>({ id: 'temp_c', x: 0, y: 0 }); // Base End
  const [radius, setRadius] = useState(0);

  // Animation State Refs
  const arc1Ref = useRef<any>(null);
  const arc2Ref = useRef<any>(null);
  const compassGroupRef = useRef<any>(null);
  const rulerGroupRef = useRef<any>(null);
  const pencilRef = useRef<any>(null);
  
  // Lines
  const sideLine1Ref = useRef<any>(null);
  const sideLine2Ref = useRef<any>(null);

  // Decoration Refs
  const tick1Ref = useRef<any>(null);
  const tick2Ref = useRef<any>(null);
  const angleArc1Ref = useRef<any>(null);
  const angleArc2Ref = useRef<any>(null);

  /**
   * Main Sequence:
   * 1. Compass at B -> Draw Arc 1 (User Radius).
   * 2. Compass at C -> Draw Arc 2 (User Radius).
   * 3. Identify Intersection A.
   * 4. Draw Sides AB, AC (Ruler+Pencil).
   * 5. Draw Markings (Ticks and Angles).
   * Note: Base BC is assumed to be already drawn.
   */
  const play = (B: Point2D, C: Point2D, userRadius: number, onComplete?: (vertexA: Point2D, decorations: Decoration[]) => void) => {
    setActive(true);
    setPointB(B);
    setPointC(C);
    setRadius(userRadius);

    // 1. Math Prep
    const distBC = getDistance(B, C);
    
    // Calculate Intersection A
    const intersect = getCircleIntersections(B, userRadius, C, userRadius);
    // Fallback if null (e.g. radius too small, though UI should prevent this)
    const A = intersect || { id: 'fallback', x: (B.x+C.x)/2, y: B.y - Math.sqrt(userRadius**2 - (distBC/2)**2) };
    setPointA(A);

    // Angles for arcs (Interior Angle Logic)
    // We want the angle swept between the Base Vector and the Side Vector.
    const sweep = 40;

    // Calculate Decoration Data for "Permanent" return
    const getTickPoints = (p1: Point2D, p2: Point2D) => {
        const mid = getMidpoint(p1, p2);
        const ang = getLineAngle(p1, p2) * (Math.PI / 180);
        const perpAng = ang + Math.PI / 2;
        const len = 8;
        return [
            mid.x - Math.cos(perpAng) * len, mid.y - Math.sin(perpAng) * len,
            mid.x + Math.cos(perpAng) * len, mid.y + Math.sin(perpAng) * len
        ];
    };
    
    // Calculate smallest angle difference for interior angles
    const getAngleArcParams = (center: Point2D, startP: Point2D, endP: Point2D) => {
        const angStart = getLineAngle(center, startP);
        const angEnd = getLineAngle(center, endP);
        
        let diff = angEnd - angStart;
        
        // Normalize to -180 to 180 to get the shortest path (Internal Angle)
        while (diff <= -180) diff += 360;
        while (diff > 180) diff -= 360;

        // Convert to positive angle sweep for consistent rendering
        // If diff is negative (CCW), we shift rotation back and make angle positive
        let finalRotation = angStart;
        let finalAngle = diff;
        
        if (finalAngle < 0) {
            finalRotation = angStart + finalAngle;
            finalAngle = Math.abs(finalAngle);
        }

        return {
             x: center.x,
             y: center.y,
             radius: 25,
             rotation: finalRotation,
             angle: finalAngle 
        };
    };

    setTimeout(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          // Generate final decoration objects
          const decorations: Decoration[] = [
              { id: `tick_${Date.now()}_1`, type: 'TICK', points: getTickPoints(B, A), stroke: '#ef4444' },
              { id: `tick_${Date.now()}_2`, type: 'TICK', points: getTickPoints(C, A), stroke: '#ef4444' },
              // Angles: At B (between BC and BA), At C (between CB and CA)
              // NOTE: The order of start/end points determines the base vector.
              // For B: Base is BC. For C: Base is CB.
              { id: `ang_${Date.now()}_1`, type: 'ANGLE', ...getAngleArcParams(B, C, A), stroke: '#ef4444' },
              { id: `ang_${Date.now()}_2`, type: 'ANGLE', ...getAngleArcParams(C, B, A), stroke: '#ef4444' },
          ];
          
          setActive(false);
          if (onComplete) onComplete(A, decorations);
        }
      });

      // ===========================================
      // PHASE 1: COMPASS ARC 1 (Center B)
      // ===========================================
      const angleBA = getLineAngle(B, A); 
      const angleCA = getLineAngle(C, A); 
      
      if (compassGroupRef.current && arc1Ref.current) {
         // Start angle for drawing the arc construction (not the decoration)
         // We draw a small arc crossing the potential intersection
         const startAngle1 = angleBA - (sweep/2);
         tl.set(compassGroupRef.current, { x: B.x, y: B.y, rotation: startAngle1, opacity: 0, scale: 0.8 });
         tl.set(arc1Ref.current, { x: B.x, y: B.y, rotation: startAngle1, angle: 0, opacity: 1 });

         tl.to(compassGroupRef.current, { opacity: 1, scale: 1, duration: 0.5 });
         tl.to(compassGroupRef.current, { rotation: startAngle1 + sweep, duration: 1.0, ease: "sine.inOut" }, "arc1");
         tl.to(arc1Ref.current, { angle: sweep, duration: 1.0, ease: "sine.inOut" }, "arc1");
      }

      // ===========================================
      // PHASE 2: COMPASS ARC 2 (Center C)
      // ===========================================
      if (compassGroupRef.current && arc2Ref.current) {
          const startAngle2 = angleCA - (sweep/2);
          tl.to(compassGroupRef.current, { y: "-=50", opacity: 0.5, duration: 0.3 });
          tl.set(compassGroupRef.current, { x: C.x, rotation: startAngle2 }); 
          tl.to(compassGroupRef.current, { y: C.y, opacity: 1, duration: 0.5 });

          tl.set(arc2Ref.current, { x: C.x, y: C.y, rotation: startAngle2, angle: 0, opacity: 1 });

          tl.to(compassGroupRef.current, { rotation: startAngle2 + sweep, duration: 1.0, ease: "sine.inOut" }, "arc2");
          tl.to(arc2Ref.current, { angle: sweep, duration: 1.0, ease: "sine.inOut" }, "arc2");

          tl.to(compassGroupRef.current, { opacity: 0, y: "-=30", duration: 0.4 });
      }

      // ===========================================
      // PHASE 3: DRAW SIDES AB & AC
      // ===========================================
      if (rulerGroupRef.current && pencilRef.current && sideLine1Ref.current && sideLine2Ref.current) {
          const distAB = getDistance(B, A);
          const distAC = getDistance(C, A);
          const angAB = getLineAngle(B, A);
          const angCA = getLineAngle(C, A);

          tl.set(sideLine1Ref.current, { points: [B.x, B.y, A.x, A.y], dash: [distAB, distAB], dashOffset: distAB, opacity: 1 });
          tl.set(sideLine2Ref.current, { points: [C.x, C.y, A.x, A.y], dash: [distAC, distAC], dashOffset: distAC, opacity: 1 });

          // Side AB
          tl.set(rulerGroupRef.current, { x: B.x, y: B.y, rotation: angAB });
          tl.set(pencilRef.current, { x: B.x, y: B.y, rotation: 30, opacity: 0 });
          
          tl.to([rulerGroupRef.current, pencilRef.current], { opacity: 1, duration: 0.3 });
          tl.to(pencilRef.current, { x: A.x, y: A.y, duration: 0.6 }, "side1");
          tl.to(sideLine1Ref.current, { dashOffset: 0, duration: 0.6 }, "side1");

          // Side AC
          tl.to(pencilRef.current, { opacity: 0, duration: 0.2 });
          tl.set(rulerGroupRef.current, { x: C.x, y: C.y, rotation: angCA });
          tl.set(pencilRef.current, { x: C.x, y: C.y });
          tl.to(pencilRef.current, { opacity: 1, duration: 0.2 });
          tl.to(pencilRef.current, { x: A.x, y: A.y, duration: 0.6 }, "side2");
          tl.to(sideLine2Ref.current, { dashOffset: 0, duration: 0.6 }, "side2");
          
          // Hide Tools
          tl.to([rulerGroupRef.current, pencilRef.current], { opacity: 0, duration: 0.3 });
      }

      // ===========================================
      // PHASE 4: DRAW MARKINGS (Ticks & Angles)
      // ===========================================
      if (tick1Ref.current && tick2Ref.current && angleArc1Ref.current && angleArc2Ref.current) {
         // Setup Geometry for Ticks
         const tick1Pts = getTickPoints(B, A);
         const tick2Pts = getTickPoints(C, A);
         
         tl.set(tick1Ref.current, { points: tick1Pts, opacity: 0, stroke: "#ef4444", strokeWidth: 3 });
         tl.set(tick2Ref.current, { points: tick2Pts, opacity: 0, stroke: "#ef4444", strokeWidth: 3 });
         
         // Setup Geometry for Angles
         const ang1 = getAngleArcParams(B, C, A);
         const ang2 = getAngleArcParams(C, B, A);
         
         tl.set(angleArc1Ref.current, { ...ang1, opacity: 0, stroke: "#ef4444", strokeWidth: 2 });
         tl.set(angleArc2Ref.current, { ...ang2, opacity: 0, stroke: "#ef4444", strokeWidth: 2 });
         
         // Animate appearance (Pop or Draw)
         tl.to([tick1Ref.current, tick2Ref.current], { opacity: 1, duration: 0.4, stagger: 0.1 });
         tl.to([angleArc1Ref.current, angleArc2Ref.current], { opacity: 1, duration: 0.4, stagger: 0.1 });
      }

    }, 50);
  };

  const animationLayer = useMemo(() => {
    if (!active) return null;
    const maxLen = Math.max(getDistance(pointB, pointC), radius) + 50;

    return (
      <Group>
        {/* Tools */}
        <Group ref={rulerGroupRef} listening={false} opacity={0}>
          <Group x={-20} y={0}>
             <VirtualRuler x={0} y={0} rotation={0} length={maxLen} />
          </Group>
        </Group>
        <Group ref={compassGroupRef} listening={false} opacity={0}>
            <VirtualCompass centerX={0} centerY={0} radius={radius} rotation={0} />
        </Group>

        {/* Geometry Construction */}
        <KonvaArc ref={arc1Ref} angle={0} innerRadius={radius} outerRadius={radius} stroke="#94a3b8" strokeWidth={1} dash={[5, 5]} listening={false} />
        <KonvaArc ref={arc2Ref} angle={0} innerRadius={radius} outerRadius={radius} stroke="#94a3b8" strokeWidth={1} dash={[5, 5]} listening={false} />
        <KonvaLine ref={sideLine1Ref} stroke="black" strokeWidth={2} lineCap="round" />
        <KonvaLine ref={sideLine2Ref} stroke="black" strokeWidth={2} lineCap="round" />
        
        {/* Decorations (Markings) */}
        <KonvaLine ref={tick1Ref} lineCap="round" />
        <KonvaLine ref={tick2Ref} lineCap="round" />
        <KonvaArc ref={angleArc1Ref} angle={0} innerRadius={25} outerRadius={25} lineCap="round" />
        <KonvaArc ref={angleArc2Ref} angle={0} innerRadius={25} outerRadius={25} lineCap="round" />

        {/* Active Pencil */}
        <VirtualPencil ref={pencilRef} x={0} y={0} isDrawing={true} opacity={0} />
      </Group>
    );
  }, [active, pointB, pointC, radius]);

  return {
    play,
    animationLayer,
    isAnimating: active
  };
};
