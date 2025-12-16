
import React, { useRef, useState, useMemo } from 'react';
import { Group, Line as KonvaLine, Arc as KonvaArc, Circle as KonvaCircle } from 'react-konva';
import gsap from 'gsap';
import { Point2D, Decoration } from '../types';
import { getDistance, getLineAngle, normalizeVector, subtractVectors, getMidpoint, getBothCircleIntersections } from '../utils/math';
import VirtualRuler from '../components/Tools/VirtualRuler';
import VirtualPencil from '../components/Tools/VirtualPencil';
import VirtualCompass from '../components/Tools/VirtualCompass';

export const useRightTriangleAnimation = () => {
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState<'CONSTRUCTION' | 'FINALIZE'>('CONSTRUCTION');
  const [tempCircle, setTempCircle] = useState<{ center: Point2D, radius: number } | null>(null);
  
  // Dynamic radius for the compass tool (changes between steps)
  const [compassRadius, setCompassRadius] = useState(100);

  // Refs
  const compassRef = useRef<any>(null);
  const rulerRef = useRef<any>(null);
  const pencilRef = useRef<any>(null);
  
  // Auxiliary Layer (Midpoint Construction)
  const midpointRef = useRef<any>(null);
  const arcMid1Ref = useRef<any>(null); // Arc from B
  const arcMid2Ref = useRef<any>(null); // Arc from C
  const intersectLineRef = useRef<any>(null); // Line connecting intersections
  
  // Auxiliary Layer (Main Circle)
  const constructionCircleRef = useRef<any>(null);

  // Final Layer (Sides)
  const sideABRef = useRef<any>(null);
  const sideACRef = useRef<any>(null);
  const rightAngleRef = useRef<any>(null);
  const pointA_Ref = useRef<any>(null);

  /**
   * PHASE 1: Construction Sequence
   * Step A: Find Midpoint I using Compass & Ruler (Standard Geometry Construction).
   * Step B: Draw Circle with Diameter BC using Midpoint I.
   */
  const playConstruction = (B: Point2D, C: Point2D, onReady: () => void) => {
    setActive(true);
    setPhase('CONSTRUCTION');

    const distBC = getDistance(B, C);
    const midI = getMidpoint(B, C);
    const mainRadius = distBC / 2;
    
    // Radius for midpoint construction arcs (must be > BC/2)
    // Increased to 0.75 for larger visual arcs
    const midConstRadius = distBC * 0.75; 
    setCompassRadius(midConstRadius); // Initialize compass size

    // Calculate intersections for midpoint construction
    const intersects = getBothCircleIntersections(B, midConstRadius, C, midConstRadius);
    // Safety check, though logically guaranteed with radius > dist/2
    const P = intersects ? intersects[0] : { x: midI.x, y: midI.y - 100, id: 'err' };
    const Q = intersects ? intersects[1] : { x: midI.x, y: midI.y + 100, id: 'err' };

    setTempCircle({ center: midI, radius: mainRadius }); // Save for snapping logic

    // --- TIMELINE 1: CONSTRUCT MIDPOINT ---
    setTimeout(() => {
        const tl = gsap.timeline({
            defaults: { ease: "power2.inOut" },
            onComplete: () => {
                // Once Midpoint is found, proceed to Step B: Draw Main Circle
                playDrawMainCircle(midI, B, mainRadius, onReady);
            }
        });

        // 1. Compass at B -> Draw Arc 1
        const angleBC = getLineAngle(B, C);
        // Increased sweep to 150 degrees to ensure arcs cross visibly
        const sweep = 150; 
        const startAngB = angleBC - (sweep/2);

        tl.set(compassRef.current, { x: B.x, y: B.y, rotation: startAngB, opacity: 0, scale: 0.9 });
        tl.set(arcMid1Ref.current, { x: B.x, y: B.y, rotation: startAngB, angle: 0, opacity: 1, innerRadius: midConstRadius, outerRadius: midConstRadius });
        
        tl.to(compassRef.current, { opacity: 1, scale: 1, duration: 0.5 });
        tl.to(compassRef.current, { rotation: startAngB + sweep, duration: 1.0, ease: "sine.inOut" });
        tl.to(arcMid1Ref.current, { angle: sweep, duration: 1.0, ease: "sine.inOut" }, "<");

        // 2. Compass at C -> Draw Arc 2
        // Angle from C to B is angleBC + 180
        const angleCB = angleBC + 180;
        const startAngC = angleCB - (sweep/2);

        tl.to(compassRef.current, { y: "-=40", opacity: 0.5, duration: 0.3 });
        tl.set(compassRef.current, { x: C.x, y: C.y, rotation: startAngC });
        tl.set(arcMid2Ref.current, { x: C.x, y: C.y, rotation: startAngC, angle: 0, opacity: 1, innerRadius: midConstRadius, outerRadius: midConstRadius });
        
        tl.to(compassRef.current, { y: C.y, opacity: 1, duration: 0.3 });
        tl.to(compassRef.current, { rotation: startAngC + sweep, duration: 1.0, ease: "sine.inOut" });
        tl.to(arcMid2Ref.current, { angle: sweep, duration: 1.0, ease: "sine.inOut" }, "<");
        
        tl.to(compassRef.current, { opacity: 0, x: "-=50", duration: 0.3 });

        // 3. Ruler aligns P and Q
        const rulerAngle = getLineAngle(P, Q);
        tl.set(rulerRef.current, { x: P.x, y: P.y, rotation: rulerAngle, opacity: 0 });
        tl.to(rulerRef.current, { opacity: 1, duration: 0.5 });

        // 4. Pencil marks Midpoint I
        tl.set(pencilRef.current, { x: P.x, y: P.y, rotation: 30, opacity: 0 });
        tl.to(pencilRef.current, { opacity: 1, duration: 0.3 });
        tl.to(pencilRef.current, { x: midI.x, y: midI.y, duration: 0.6, ease: "sine.inOut" });
        
        // Mark I
        tl.set(midpointRef.current, { x: midI.x, y: midI.y, scale: 0, opacity: 1, fill: '#ef4444' });
        tl.to(midpointRef.current, { scale: 1, duration: 0.2, ease: "back.out" });

        // 5. Cleanup Midpoint Tools
        tl.to([rulerRef.current, pencilRef.current, arcMid1Ref.current, arcMid2Ref.current], { opacity: 0, duration: 0.5 });

    }, 50);
  };

  /**
   * Helper: Phase 1 Step B - Draw the main circle
   */
  const playDrawMainCircle = (I: Point2D, B: Point2D, radius: number, onComplete: () => void) => {
      // Update compass radius for the main circle
      setCompassRadius(radius);

      setTimeout(() => {
          const tl = gsap.timeline({
              defaults: { ease: "sine.inOut" },
              onComplete: onComplete
          });

          // 1. Bring Compass to I
          const angleIB = getLineAngle(I, B);
          tl.set(compassRef.current, { x: I.x, y: I.y, rotation: angleIB, opacity: 0, scale: 0.9 });
          tl.to(compassRef.current, { opacity: 1, scale: 1, duration: 0.5 });

          // 2. Draw Main Circle
          tl.set(constructionCircleRef.current, { x: I.x, y: I.y, rotation: angleIB, angle: 0, opacity: 1, innerRadius: radius, outerRadius: radius });
          
          tl.to(compassRef.current, { rotation: angleIB + 360, duration: 1.5, ease: "none" });
          tl.to(constructionCircleRef.current, { angle: 360, duration: 1.5, ease: "none" }, "<");

          // 3. Hide Compass
          tl.to(compassRef.current, { opacity: 0, y: "-=30", duration: 0.4 });
      }, 50);
  };

  /**
   * PHASE 2: Finalize Triangle (Draw Sides AB, AC and Cleanup).
   * Triggered after user picks A on the circle.
   */
  const playFinalize = (A: Point2D, B: Point2D, C: Point2D, onComplete: (decorations: Decoration[]) => void) => {
    setPhase('FINALIZE');

    // Right Angle Symbol logic
    const vecAB = normalizeVector(subtractVectors(B, A));
    const vecAC = normalizeVector(subtractVectors(C, A));
    const symSize = 15;
    const p1 = { x: A.x + vecAB.x * symSize, y: A.y + vecAB.y * symSize };
    const p2 = { x: p1.x + vecAC.x * symSize, y: p1.y + vecAC.y * symSize };
    const p3 = { x: A.x + vecAC.x * symSize, y: A.y + vecAC.y * symSize };
    const raPoints = [p1.x, p1.y, p2.x, p2.y, p3.x, p3.y];

    const tl = gsap.timeline({
        defaults: { ease: "sine.inOut" },
        onComplete: () => {
             const decs: Decoration[] = [{
                id: `ra_thales_${Date.now()}`,
                type: 'RIGHT_ANGLE',
                points: [A.x, A.y, p3.x, p3.y, p2.x, p2.y, p1.x, p1.y],
                stroke: '#ef4444'
            }];
            setActive(false);
            setTempCircle(null);
            onComplete(decs);
        }
    });

    // 1. Draw Side AB
    const distAB = getDistance(A, B);
    const angAB = getLineAngle(A, B); // Draw from A to B

    tl.set(sideABRef.current, { points: [A.x, A.y, B.x, B.y], dash: [distAB, distAB], dashOffset: distAB, opacity: 1 });
    
    tl.set(rulerRef.current, { x: A.x, y: A.y, rotation: angAB, opacity: 0 });
    tl.set(pencilRef.current, { x: A.x, y: A.y, rotation: 30, opacity: 0 });
    
    tl.to([rulerRef.current, pencilRef.current], { opacity: 1, duration: 0.3 });
    tl.to(pencilRef.current, { x: B.x, y: B.y, duration: 0.8 });
    tl.to(sideABRef.current, { dashOffset: 0, duration: 0.8 }, "<");

    // 2. Draw Side AC
    const distAC = getDistance(A, C);
    const angAC = getLineAngle(A, C); // Draw from A to C

    tl.to(pencilRef.current, { opacity: 0, duration: 0.2 });
    tl.set(rulerRef.current, { x: A.x, y: A.y, rotation: angAC });
    tl.set(pencilRef.current, { x: A.x, y: A.y });
    
    tl.set(sideACRef.current, { points: [A.x, A.y, C.x, C.y], dash: [distAC, distAC], dashOffset: distAC, opacity: 1 });
    
    tl.to(pencilRef.current, { opacity: 1, duration: 0.2 });
    tl.to(pencilRef.current, { x: C.x, y: C.y, duration: 0.8 });
    tl.to(sideACRef.current, { dashOffset: 0, duration: 0.8 }, "<");

    // 3. Mark A
    tl.set(pointA_Ref.current, { x: A.x, y: A.y, scale: 0, opacity: 1, fill: '#ef4444' });
    tl.to(pointA_Ref.current, { scale: 1, duration: 0.3, ease: "back.out" });

    // 4. CLEANUP (Hide Circle, Midpoint, Tools)
    tl.to([rulerRef.current, pencilRef.current], { opacity: 0, duration: 0.5 });
    tl.to([constructionCircleRef.current, midpointRef.current], { opacity: 0, duration: 0.8 }, "<");

    // 5. Show Right Angle
    tl.set(rightAngleRef.current, { points: raPoints, opacity: 0, stroke: '#ef4444' });
    tl.to(rightAngleRef.current, { opacity: 1, duration: 0.5 });
  };

  const animationLayer = useMemo(() => {
    if (!active) return null;
    return (
        <Group>
            {/* Auxiliary Layer: Midpoint Construction Arcs */}
            <KonvaArc ref={arcMid1Ref} innerRadius={0} outerRadius={0} angle={0} stroke="#74B9FF" strokeWidth={1} dash={[5,5]} listening={false} />
            <KonvaArc ref={arcMid2Ref} innerRadius={0} outerRadius={0} angle={0} stroke="#74B9FF" strokeWidth={1} dash={[5,5]} listening={false} />

            {/* Auxiliary Layer: Main Circle & Midpoint */}
            <KonvaArc ref={constructionCircleRef} innerRadius={0} outerRadius={0} angle={0} stroke="#94a3b8" strokeWidth={1} dash={[5,5]} listening={false} />
            <KonvaCircle ref={midpointRef} radius={4} fill="#ef4444" opacity={0} listening={false} />
            
            {/* Tools */}
            <Group ref={rulerRef} listening={false} opacity={0}>
                <Group x={-20} y={0}><VirtualRuler x={0} y={0} rotation={0} length={400} /></Group>
            </Group>
            <Group ref={compassRef} listening={false} opacity={0}>
                {/* Visual only compass - radius controlled by state */}
                <VirtualCompass centerX={0} centerY={0} radius={compassRadius} rotation={0} />
            </Group>

            {/* Main Result Layer */}
            <KonvaLine ref={sideABRef} stroke="black" strokeWidth={2} lineCap="round" />
            <KonvaLine ref={sideACRef} stroke="black" strokeWidth={2} lineCap="round" />
            
            <KonvaCircle ref={pointA_Ref} radius={5} />
            <KonvaLine ref={rightAngleRef} strokeWidth={2} />

            <VirtualPencil ref={pencilRef} x={0} y={0} isDrawing={true} opacity={0} />
        </Group>
    );
  }, [active, tempCircle, compassRadius]);

  return { 
      playConstruction, 
      playFinalize, 
      animationLayer, 
      isAnimating: active,
      tempCircle // Expose this for snapping logic in App
  };
};
