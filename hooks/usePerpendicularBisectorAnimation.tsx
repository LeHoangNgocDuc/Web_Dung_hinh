
import React, { useRef, useState, useMemo } from 'react';
import { Group, Line as KonvaLine, Arc as KonvaArc, Circle as KonvaCircle } from 'react-konva';
import gsap from 'gsap';
import { Point2D, Decoration } from '../types';
import { getDistance, getLineAngle, getBothCircleIntersections, getMidpoint, normalizeVector, subtractVectors, multiplyVector } from '../utils/math';
import VirtualRuler from '../components/Tools/VirtualRuler';
import VirtualPencil from '../components/Tools/VirtualPencil';
import VirtualCompass from '../components/Tools/VirtualCompass';

export const usePerpendicularBisectorAnimation = () => {
  const [active, setActive] = useState(false);
  const [radius, setRadius] = useState(0);

  // Geometry Refs
  const compassGroupRef = useRef<any>(null);
  const rulerGroupRef = useRef<any>(null);
  const pencilRef = useRef<any>(null);
  
  const arc1Ref = useRef<any>(null);
  const arc2Ref = useRef<any>(null);
  const bisectorLineRef = useRef<any>(null);
  
  // Highlight Points
  const intersectPRef = useRef<any>(null);
  const intersectQRef = useRef<any>(null);
  const pointMRef = useRef<any>(null);

  // Decoration Lines (Symbol Refs)
  const perpSymbolRef = useRef<any>(null);
  const eqMark1Ref = useRef<any>(null);
  const eqMark2Ref = useRef<any>(null);

  const play = (A: Point2D, B: Point2D, userRadius: number, onComplete?: (M: Point2D, P: Point2D, Q: Point2D, decorations: Decoration[]) => void) => {
    setActive(true);
    setRadius(userRadius);

    // 1. Math Setup
    const intersects = getBothCircleIntersections(A, userRadius, B, userRadius);
    
    const fallbackY = Math.sqrt(Math.abs(userRadius**2 - (getDistance(A,B)/2)**2));
    const mid = getMidpoint(A, B);
    
    const P = intersects ? (intersects[0].y < intersects[1].y ? intersects[0] : intersects[1]) : { ...mid, y: mid.y - fallbackY, id:'err_p' };
    const Q = intersects ? (intersects[0].y < intersects[1].y ? intersects[1] : intersects[0]) : { ...mid, y: mid.y + fallbackY, id:'err_q' };
    
    const M = mid;

    // Symbols
    const vecAB = normalizeVector(subtractVectors(B, A));
    const vecPQ = normalizeVector(subtractVectors(Q, P)); 
    const symbolSize = 15;
    
    const p1 = multiplyVector(vecAB, symbolSize);
    const p2 = multiplyVector(vecPQ, symbolSize);
    
    const sqPt1 = { x: M.x + p1.x, y: M.y + p1.y };
    const sqPt2 = { x: M.x + p1.x + p2.x, y: M.y + p1.y + p2.y };
    const sqPt3 = { x: M.x + p2.x, y: M.y + p2.y };
    const rightAnglePoints = [M.x, M.y, sqPt1.x, sqPt1.y, sqPt2.x, sqPt2.y, sqPt3.x, sqPt3.y];

    const getVTick = (pStart: Point2D, pEnd: Point2D) => {
         const m = getMidpoint(pStart, pEnd);
         return [m.x - 5, m.y - 5, m.x, m.y, m.x + 5, m.y - 5];
    }

    setTimeout(() => {
      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        onComplete: () => {
           const decorations: Decoration[] = [
               { id: `sym_right_${Date.now()}`, type: 'RIGHT_ANGLE', points: rightAnglePoints, stroke: '#2D3436' },
               { id: `sym_eq1_${Date.now()}`, type: 'TICK', points: getVTick(A, M), stroke: '#2D3436' },
               { id: `sym_eq2_${Date.now()}`, type: 'TICK', points: getVTick(B, M), stroke: '#2D3436' }
           ];
           setActive(false);
           if (onComplete) onComplete(M, P, Q, decorations);
        }
      });

      // ===============================================
      // PHASE 1: COMPASS AT A
      // ===============================================
      const angleAB = getLineAngle(A, B);
      const sweep = 100; // Degrees to draw

      // Center the sweep around the line AB
      // Start = Angle - Sweep/2
      const startAngleA = angleAB - (sweep / 2);

      // 1. Enter & Pin at A
      tl.set(compassGroupRef.current, { x: A.x - 50, y: A.y - 100, rotation: startAngleA, opacity: 0, scale: 1.2 });
      tl.to(compassGroupRef.current, { x: A.x, y: A.y, opacity: 1, scale: 1, duration: 0.8, ease: "back.out(1.7)" });
      
      // 2. Draw Arc 1
      // We set the ARC rotation to startAngleA. We animate the Arc's 'angle' property from 0 to sweep.
      // Simultaneously we rotate the compass tool to follow the arc.
      tl.set(arc1Ref.current, { x: A.x, y: A.y, rotation: startAngleA, angle: 0, opacity: 1 });
      
      tl.to([compassGroupRef.current], {
        rotation: startAngleA + sweep,
        duration: 1.2, 
        ease: "sine.inOut" 
      });
      tl.to([arc1Ref.current], {
        angle: sweep,
        duration: 1.2,
        ease: "sine.inOut"
      }, "<");

      // ===============================================
      // PHASE 2: COMPASS AT B
      // ===============================================
      // Angle from B to A is angleAB + 180
      const angleBA = angleAB + 180;
      const startAngleB = angleBA - (sweep / 2);

      // 3. Lift & Move
      tl.to(compassGroupRef.current, { y: "-=60", scale: 1.1, duration: 0.4, ease: "power1.out" });
      tl.to(compassGroupRef.current, { x: B.x, rotation: startAngleB, duration: 0.6 }, "<0.1");
      tl.to(compassGroupRef.current, { y: B.y, scale: 1, duration: 0.4, ease: "bounce.out" });

      // 4. Draw Arc 2
      tl.set(arc2Ref.current, { x: B.x, y: B.y, rotation: startAngleB, angle: 0, opacity: 1 });
      
      tl.to([compassGroupRef.current], {
        rotation: startAngleB + sweep,
        duration: 1.2, 
        ease: "sine.inOut" 
      });
      tl.to([arc2Ref.current], {
        angle: sweep,
        duration: 1.2, 
        ease: "sine.inOut" 
      }, "<");

      // 5. Exit Compass
      tl.to(compassGroupRef.current, { opacity: 0, x: "+=50", duration: 0.4 });

      // ===============================================
      // PHASE 3: HIGHLIGHT INTERSECTIONS
      // ===============================================
      tl.set([intersectPRef.current, intersectQRef.current], { x: (i: number) => i===0 ? P.x : Q.x, y: (i: number) => i===0 ? P.y : Q.y, scale: 0, opacity: 1 });
      tl.to([intersectPRef.current, intersectQRef.current], { scale: 1, duration: 0.4, ease: "back.out(2)" });
      
      // ===============================================
      // PHASE 4: RULER & LINE
      // ===============================================
      const rulerAngle = getLineAngle(P, Q);
      
      // 6. Ruler Enter
      tl.set(rulerGroupRef.current, { x: P.x, y: P.y, rotation: rulerAngle, opacity: 0, scale: 0.9 });
      tl.to(rulerGroupRef.current, { opacity: 1, scale: 1, duration: 0.6 });

      // 7. Pencil Enter
      tl.set(pencilRef.current, { x: P.x, y: P.y, rotation: 30, opacity: 0 });
      tl.to(pencilRef.current, { opacity: 1, duration: 0.3 });

      // 8. Draw Line PQ
      tl.set(bisectorLineRef.current, { points: [P.x, P.y, Q.x, Q.y], dash: [getDistance(P,Q), getDistance(P,Q)], dashOffset: getDistance(P,Q), opacity: 1 });
      
      tl.to(pencilRef.current, { x: Q.x, y: Q.y, duration: 1.0, ease: "sine.inOut" }, "drawLine");
      tl.to(bisectorLineRef.current, { dashOffset: 0, duration: 1.0, ease: "sine.inOut" }, "drawLine");

      // 9. Tools Exit & Cleanup Arcs
      tl.to([rulerGroupRef.current, pencilRef.current, compassGroupRef.current], { opacity: 0, duration: 0.5 });
      tl.to([arc1Ref.current, arc2Ref.current, intersectPRef.current, intersectQRef.current], { opacity: 0, duration: 0.5 }, "<"); 

      // ===============================================
      // PHASE 5: SYMBOLS
      // ===============================================
      tl.set(pointMRef.current, { x: M.x, y: M.y, scale: 0, opacity: 1 });
      tl.to(pointMRef.current, { scale: 1, duration: 0.3, ease: "back.out" });

      tl.set([perpSymbolRef.current, eqMark1Ref.current, eqMark2Ref.current], { opacity: 0, stroke: "#2D3436", strokeWidth: 2 });
      
      tl.set(perpSymbolRef.current, { points: rightAnglePoints });
      tl.set(eqMark1Ref.current, { points: getVTick(A, M) });
      tl.set(eqMark2Ref.current, { points: getVTick(B, M) });

      tl.to([perpSymbolRef.current, eqMark1Ref.current, eqMark2Ref.current], { opacity: 1, duration: 0.5, stagger: 0.1 });

    }, 100);
  };

  const animationLayer = useMemo(() => {
    if (!active) return null;
    const toolLen = radius * 2.5 + 100;

    return (
      <Group>
        {/* Underlay Tools */}
        <Group ref={rulerGroupRef} listening={false} opacity={0}>
             <Group x={-20} y={0}><VirtualRuler x={0} y={0} rotation={0} length={toolLen} /></Group>
        </Group>
        
        {/* Arcs (Construction Lines - Light Blue) */}
        <KonvaArc ref={arc1Ref} angle={0} innerRadius={radius} outerRadius={radius} stroke="#74B9FF" strokeWidth={1.5} listening={false} />
        <KonvaArc ref={arc2Ref} angle={0} innerRadius={radius} outerRadius={radius} stroke="#74B9FF" strokeWidth={1.5} listening={false} />
        
        {/* Highlight Dots for P and Q */}
        <KonvaCircle ref={intersectPRef} radius={6} fill="#74B9FF" opacity={0} />
        <KonvaCircle ref={intersectQRef} radius={6} fill="#74B9FF" opacity={0} />

        {/* The Resulting Bisector Line */}
        <KonvaLine ref={bisectorLineRef} stroke="#000000" strokeWidth={2.5} lineCap="round" />

        {/* Intersection M */}
        <KonvaCircle ref={pointMRef} radius={4} fill="#2D3436" opacity={0} />

        {/* Symbols (Animated) */}
        <KonvaLine ref={perpSymbolRef} lineCap="square" opacity={0} />
        <KonvaLine ref={eqMark1Ref} lineCap="round" opacity={0} />
        <KonvaLine ref={eqMark2Ref} lineCap="round" opacity={0} />

        {/* Tools Overlay */}
        <Group ref={compassGroupRef} listening={false} opacity={0}>
            <VirtualCompass centerX={0} centerY={0} radius={radius} rotation={0} />
        </Group>
        <VirtualPencil ref={pencilRef} x={0} y={0} isDrawing={true} opacity={0} />
      </Group>
    );
  }, [active, radius]);

  return { play, animationLayer, isAnimating: active };
};
