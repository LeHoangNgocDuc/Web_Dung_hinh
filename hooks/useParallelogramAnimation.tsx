
import React, { useRef, useState, useMemo } from 'react';
import { Group, Line as KonvaLine, Arc as KonvaArc, Circle as KonvaCircle } from 'react-konva';
import gsap from 'gsap';
import { Point2D, Decoration } from '../types';
import { getDistance, getLineAngle, getBothCircleIntersections } from '../utils/math';
import VirtualRuler from '../components/Tools/VirtualRuler';
import VirtualPencil from '../components/Tools/VirtualPencil';
import VirtualCompass from '../components/Tools/VirtualCompass';

export const useParallelogramAnimation = () => {
  const [active, setActive] = useState(false);
  const [radius1, setRadius1] = useState(0); // Radius = AB (drawn at C)
  const [radius2, setRadius2] = useState(0); // Radius = BC (drawn at A)

  // Refs
  const compassGroupRef = useRef<any>(null);
  const arc1Ref = useRef<any>(null); // At A
  const arc2Ref = useRef<any>(null); // At C
  
  const rulerGroupRef = useRef<any>(null);
  const pencilRef = useRef<any>(null);
  const lineADRef = useRef<any>(null);
  const lineCDRef = useRef<any>(null);
  
  const pointDRef = useRef<any>(null);
  const intersectRef = useRef<any>(null);

  /**
   * Construction of Parallelogram ABCD given A, B, C.
   * D is found such that AB = CD and BC = AD.
   * 1. Compass at A, Radius = BC. Draw Arc 1.
   * 2. Compass at C, Radius = AB. Draw Arc 2.
   * 3. Intersection is D.
   * 4. Draw AD and CD.
   */
  const play = (A: Point2D, B: Point2D, C: Point2D, onComplete?: (D: Point2D, decorations: Decoration[]) => void) => {
    setActive(true);
    
    const distAB = getDistance(A, B);
    const distBC = getDistance(B, C);
    
    setRadius1(distBC); // At A
    setRadius2(distAB); // At C

    // Find intersection D
    // We expect D to be "opposite" to B relative to AC line approx.
    const intersections = getBothCircleIntersections(A, distBC, C, distAB);
    
    // Heuristic: The correct D is the one further from B
    let D = { x: 0, y: 0, id: 'temp_d' };
    if (intersections) {
        const d0 = getDistance(B, intersections[0]);
        const d1 = getDistance(B, intersections[1]);
        D = d0 > d1 ? intersections[0] : intersections[1];
    } else {
        // Fallback (Simple vector addition A + (C-B)) - wait no, A + (C-B) is not quite right if B is center
        // Vector BD = Vector BA + Vector BC
        // D = B + (A-B) + (C-B) = A + C - B
        D = { x: A.x + C.x - B.x, y: A.y + C.y - B.y, id: 'temp_d_calc' };
    }

    setTimeout(() => {
      const tl = gsap.timeline({
        onComplete: () => {
            // Decorations: Parallel markers
            // Not implemented fully yet, just return
            setActive(false);
            if (onComplete) onComplete(D, []);
        }
      });

      const sweep = 60;

      // ===============================================
      // PHASE 1: COMPASS AT A (Radius = BC)
      // ===============================================
      // Aim towards estimated D
      const angAD = getLineAngle(A, D);
      const start1 = angAD - sweep/2;

      tl.set(compassGroupRef.current, { x: A.x, y: A.y, rotation: start1, opacity: 0, scale: 0.9 });
      tl.set(arc1Ref.current, { x: A.x, y: A.y, rotation: start1, angle: 0, opacity: 1 });
      
      tl.to(compassGroupRef.current, { opacity: 1, scale: 1, duration: 0.5 });
      tl.to(compassGroupRef.current, { rotation: start1 + sweep, duration: 1.0, ease: "sine.inOut" });
      tl.to(arc1Ref.current, { angle: sweep, duration: 1.0, ease: "sine.inOut" }, "<");

      // ===============================================
      // PHASE 2: COMPASS AT C (Radius = AB)
      // ===============================================
      const angCD = getLineAngle(C, D);
      const start2 = angCD - sweep/2;

      tl.to(compassGroupRef.current, { y: "-=50", scale: 1.1, duration: 0.3 });
      tl.to(compassGroupRef.current, { x: C.x, rotation: start2, duration: 0.5 }, "<0.1");
      tl.to(compassGroupRef.current, { y: C.y, scale: 1, duration: 0.3 });

      tl.set(arc2Ref.current, { x: C.x, y: C.y, rotation: start2, angle: 0, opacity: 1 });
      
      tl.to(compassGroupRef.current, { rotation: start2 + sweep, duration: 1.0, ease: "sine.inOut" });
      tl.to(arc2Ref.current, { angle: sweep, duration: 1.0, ease: "sine.inOut" }, "<");
      
      tl.to(compassGroupRef.current, { opacity: 0, x: "+=30", duration: 0.3 });

      // ===============================================
      // PHASE 3: HIGHLIGHT INTERSECTION D
      // ===============================================
      tl.set(intersectRef.current, { x: D.x, y: D.y, scale: 0, opacity: 1 });
      tl.to(intersectRef.current, { scale: 1, duration: 0.4, ease: "back.out" });

      // ===============================================
      // PHASE 4: DRAW LINES AD and CD
      // ===============================================
      
      // Draw AD
      const distAD = getDistance(A, D);
      tl.set(lineADRef.current, { points: [A.x, A.y, D.x, D.y], dash: [distAD, distAD], dashOffset: distAD, opacity: 1 });
      
      const angRulerAD = getLineAngle(A, D);
      tl.set(rulerGroupRef.current, { x: A.x, y: A.y, rotation: angRulerAD, opacity: 0 });
      tl.set(pencilRef.current, { x: A.x, y: A.y, rotation: 30, opacity: 0 });
      
      tl.to([rulerGroupRef.current, pencilRef.current], { opacity: 1, duration: 0.3 });
      tl.to(pencilRef.current, { x: D.x, y: D.y, duration: 0.7, ease: "sine.inOut" });
      tl.to(lineADRef.current, { dashOffset: 0, duration: 0.7, ease: "sine.inOut" }, "<");

      // Draw CD
      const distCD = getDistance(C, D);
      tl.set(lineCDRef.current, { points: [C.x, C.y, D.x, D.y], dash: [distCD, distCD], dashOffset: distCD, opacity: 1 });
      
      const angRulerCD = getLineAngle(C, D);
      tl.to(pencilRef.current, { opacity: 0, duration: 0.2 });
      tl.set(rulerGroupRef.current, { x: C.x, y: C.y, rotation: angRulerCD });
      tl.set(pencilRef.current, { x: C.x, y: C.y });
      tl.to(pencilRef.current, { opacity: 1, duration: 0.2 });
      
      tl.to(pencilRef.current, { x: D.x, y: D.y, duration: 0.7, ease: "sine.inOut" });
      tl.to(lineCDRef.current, { dashOffset: 0, duration: 0.7, ease: "sine.inOut" }, "<");

      // ===============================================
      // PHASE 5: FINISH
      // ===============================================
      tl.set(pointDRef.current, { x: D.x, y: D.y, scale: 0, opacity: 1, fill: '#ef4444' });
      tl.to(pointDRef.current, { scale: 1, duration: 0.3, ease: "back.out" });

      tl.to([rulerGroupRef.current, pencilRef.current, arc1Ref.current, arc2Ref.current, intersectRef.current], { opacity: 0, duration: 0.5 });

    }, 50);
  };

  const animationLayer = useMemo(() => {
    if (!active) return null;
    const maxLen = Math.max(radius1, radius2) + 100;

    return (
      <Group>
        <Group ref={rulerGroupRef} listening={false} opacity={0}>
             <Group x={-20} y={0}><VirtualRuler x={0} y={0} rotation={0} length={maxLen} /></Group>
        </Group>

        <KonvaArc ref={arc1Ref} angle={0} innerRadius={radius1} outerRadius={radius1} stroke="#74B9FF" strokeWidth={1} listening={false} />
        <KonvaArc ref={arc2Ref} angle={0} innerRadius={radius2} outerRadius={radius2} stroke="#74B9FF" strokeWidth={1} listening={false} />
        
        <KonvaCircle ref={intersectRef} radius={5} fill="#74B9FF" opacity={0} />

        <KonvaLine ref={lineADRef} stroke="black" strokeWidth={2} lineCap="round" />
        <KonvaLine ref={lineCDRef} stroke="black" strokeWidth={2} lineCap="round" />
        
        <KonvaCircle ref={pointDRef} radius={5} />

        <Group ref={compassGroupRef} listening={false} opacity={0}>
            <VirtualCompass centerX={0} centerY={0} radius={radius1} rotation={0} />
        </Group>
        <VirtualPencil ref={pencilRef} x={0} y={0} isDrawing={true} opacity={0} />
      </Group>
    );
  }, [active, radius1, radius2]);

  return { play, animationLayer, isAnimating: active };
};
