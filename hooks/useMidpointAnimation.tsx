
import React, { useRef, useState, useMemo } from 'react';
import { Group, Line as KonvaLine, Arc as KonvaArc, Circle as KonvaCircle } from 'react-konva';
import gsap from 'gsap';
import { Point2D, Decoration } from '../types';
import { getDistance, getLineAngle, getBothCircleIntersections, getMidpoint } from '../utils/math';
import VirtualRuler from '../components/Tools/VirtualRuler';
import VirtualPencil from '../components/Tools/VirtualPencil';
import VirtualCompass from '../components/Tools/VirtualCompass';

export const useMidpointAnimation = () => {
  const [active, setActive] = useState(false);
  const [radius, setRadius] = useState(0);

  // Refs
  const compassGroupRef = useRef<any>(null);
  const arc1Ref = useRef<any>(null);
  const arc2Ref = useRef<any>(null);
  const rulerGroupRef = useRef<any>(null);
  const pencilRef = useRef<any>(null);
  const pointMRef = useRef<any>(null);
  const tick1Ref = useRef<any>(null);
  const tick2Ref = useRef<any>(null);
  
  // Intersection Highlights
  const intersectPRef = useRef<any>(null);
  const intersectQRef = useRef<any>(null);

  /**
   * Midpoint Construction Sequence:
   * 1. Compass at A (User Radius). Draw Arc.
   * 2. Compass at B (User Radius). Draw Arc.
   * 3. Show Intersections P and Q.
   * 4. Place Ruler aligning P and Q.
   * 5. Pencil marks the center M (DO NOT DRAW LINE).
   * 6. Fade out tools/arcs. Show M and ticks.
   */
  const play = (A: Point2D, B: Point2D, userRadius: number, onComplete?: (M: Point2D, decorations: Decoration[]) => void) => {
    setActive(true);
    setRadius(userRadius);

    // Calc Intersections
    const intersects = getBothCircleIntersections(A, userRadius, B, userRadius);
    const fallbackY = Math.sqrt(Math.abs(userRadius**2 - (getDistance(A,B)/2)**2));
    const mid = getMidpoint(A, B);
    
    const P = intersects ? (intersects[0].y < intersects[1].y ? intersects[0] : intersects[1]) : { ...mid, y: mid.y - fallbackY };
    const Q = intersects ? (intersects[0].y < intersects[1].y ? intersects[1] : intersects[0]) : { ...mid, y: mid.y + fallbackY };
    const M = mid;
    
    // Ticks
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

    setTimeout(() => {
      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        onComplete: () => {
            const decorations: Decoration[] = [
                { id: `tick_m1_${Date.now()}`, type: 'TICK', points: getTickPoints(A, M), stroke: '#ef4444' },
                { id: `tick_m2_${Date.now()}`, type: 'TICK', points: getTickPoints(B, M), stroke: '#ef4444' }
            ];
            setActive(false);
            if (onComplete) onComplete(M, decorations);
        }
      });

      // --- PHASE 1: COMPASS AT A ---
      const angleAB = getLineAngle(A, B);
      const sweep = 100;
      const startAngleA = angleAB - (sweep / 2);

      tl.set(compassGroupRef.current, { x: A.x, y: A.y, rotation: startAngleA, opacity: 0, scale: 0.9 });
      tl.set(arc1Ref.current, { x: A.x, y: A.y, rotation: startAngleA, angle: 0, opacity: 1 });
      
      tl.to(compassGroupRef.current, { opacity: 1, scale: 1, duration: 0.5 });
      
      tl.to([compassGroupRef.current], { rotation: startAngleA + sweep, duration: 1.2, ease: "sine.inOut" });
      tl.to([arc1Ref.current], { angle: sweep, duration: 1.2, ease: "sine.inOut" }, "<");

      // --- PHASE 2: COMPASS AT B ---
      const angleBA = angleAB + 180;
      const startAngleB = angleBA - (sweep / 2);
      
      tl.to(compassGroupRef.current, { y: "-=50", scale: 1.05, duration: 0.4 });
      tl.to(compassGroupRef.current, { x: B.x, rotation: startAngleB, duration: 0.6, ease: "power1.inOut" }, "<0.1");
      tl.to(compassGroupRef.current, { y: B.y, scale: 1, duration: 0.4 });

      tl.set(arc2Ref.current, { x: B.x, y: B.y, rotation: startAngleB, angle: 0, opacity: 1 });
      
      tl.to([compassGroupRef.current], { rotation: startAngleB + sweep, duration: 1.2, ease: "sine.inOut" });
      tl.to([arc2Ref.current], { angle: sweep, duration: 1.2, ease: "sine.inOut" }, "<");
      
      tl.to(compassGroupRef.current, { opacity: 0, x: "+=30", duration: 0.4 });

      // --- PHASE 3: HIGHLIGHT INTERSECTIONS ---
      tl.set([intersectPRef.current, intersectQRef.current], { x: (i: number) => i===0 ? P.x : Q.x, y: (i: number) => i===0 ? P.y : Q.y, scale: 0, opacity: 1 });
      tl.to([intersectPRef.current, intersectQRef.current], { scale: 1, duration: 0.4, ease: "back.out" });

      // --- PHASE 4: RULER ALIGN ---
      const rulerAngle = getLineAngle(P, Q);
      tl.set(rulerGroupRef.current, { x: P.x, y: P.y, rotation: rulerAngle, opacity: 0 });
      tl.set(pencilRef.current, { x: P.x, y: P.y, rotation: 30, opacity: 0 });
      
      tl.to(rulerGroupRef.current, { opacity: 1, duration: 0.5 });
      tl.to(pencilRef.current, { opacity: 1, duration: 0.3 });

      // --- PHASE 5: MARK CENTER (Move Pencil to M) ---
      tl.to(pencilRef.current, { x: M.x, y: M.y, duration: 0.8, ease: "sine.inOut" });
      
      // Draw Dot M
      tl.set(pointMRef.current, { x: M.x, y: M.y, scale: 0, opacity: 1, fill: '#ef4444' });
      tl.to(pointMRef.current, { scale: 1, duration: 0.2, ease: "back.out" });

      // --- PHASE 6: CLEANUP ---
      tl.to([rulerGroupRef.current, pencilRef.current, intersectPRef.current, intersectQRef.current], { opacity: 0, duration: 0.5 });
      tl.to([arc1Ref.current, arc2Ref.current], { opacity: 0, duration: 0.5 }, "<");

      // --- PHASE 7: SHOW TICKS ---
      tl.set([tick1Ref.current, tick2Ref.current], { opacity: 0, stroke: "#ef4444", strokeWidth: 2 });
      tl.set([tick1Ref.current], { points: getTickPoints(A, M) });
      tl.set([tick2Ref.current], { points: getTickPoints(B, M) });
      
      tl.to([tick1Ref.current, tick2Ref.current], { opacity: 1, duration: 0.4 });
      
    }, 50);
  };

  const animationLayer = useMemo(() => {
    if (!active) return null;
    const toolLen = radius * 2.5 + 50;

    return (
      <Group>
         {/* Tools */}
         <Group ref={rulerGroupRef} listening={false} opacity={0}>
          <Group x={-20} y={0}><VirtualRuler x={0} y={0} rotation={0} length={toolLen} /></Group>
        </Group>
        
        {/* Arcs */}
        <KonvaArc ref={arc1Ref} angle={0} innerRadius={radius} outerRadius={radius} stroke="#74B9FF" strokeWidth={1} listening={false} />
        <KonvaArc ref={arc2Ref} angle={0} innerRadius={radius} outerRadius={radius} stroke="#74B9FF" strokeWidth={1} listening={false} />
        
        {/* Intersection Dots */}
        <KonvaCircle ref={intersectPRef} radius={5} fill="#74B9FF" opacity={0} />
        <KonvaCircle ref={intersectQRef} radius={5} fill="#74B9FF" opacity={0} />

        {/* Result M */}
        <KonvaCircle ref={pointMRef} radius={5} />
        <KonvaLine ref={tick1Ref} lineCap="round" />
        <KonvaLine ref={tick2Ref} lineCap="round" />

        <Group ref={compassGroupRef} listening={false} opacity={0}>
            <VirtualCompass centerX={0} centerY={0} radius={radius} rotation={0} />
        </Group>
        <VirtualPencil ref={pencilRef} x={0} y={0} isDrawing={true} opacity={0} />
      </Group>
    );
  }, [active, radius]);

  return { play, animationLayer, isAnimating: active };
};
