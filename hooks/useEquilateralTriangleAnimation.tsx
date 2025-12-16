
import React, { useRef, useState, useMemo } from 'react';
import { Group, Line as KonvaLine, Arc as KonvaArc, Circle as KonvaCircle } from 'react-konva';
import gsap from 'gsap';
import { Point2D, Decoration } from '../types';
import { getDistance, getLineAngle, getBothCircleIntersections, getMidpoint } from '../utils/math';
import VirtualRuler from '../components/Tools/VirtualRuler';
import VirtualPencil from '../components/Tools/VirtualPencil';
import VirtualCompass from '../components/Tools/VirtualCompass';

export const useEquilateralTriangleAnimation = () => {
  const [active, setActive] = useState(false);
  
  // Data State
  const [pointB, setPointB] = useState<Point2D>({ id: 'temp_b', x: 0, y: 0 }); // Base Start
  const [pointC, setPointC] = useState<Point2D>({ id: 'temp_c', x: 0, y: 0 }); // Base End
  const [radius, setRadius] = useState(0);

  // Animation Refs
  const arc1Ref = useRef<any>(null);
  const arc2Ref = useRef<any>(null);
  const compassGroupRef = useRef<any>(null);
  const rulerGroupRef = useRef<any>(null);
  const pencilRef = useRef<any>(null);
  
  // Highlights for intersections
  const intersect1Ref = useRef<any>(null); // The chosen vertex (A)
  const intersect2Ref = useRef<any>(null); // The other intersection (A')
  const pointA_Ref = useRef<any>(null);    // The final vertex label
  
  // Lines
  const sideLine1Ref = useRef<any>(null);
  const sideLine2Ref = useRef<any>(null);

  // Decorations
  const tick1Ref = useRef<any>(null);
  const tick2Ref = useRef<any>(null);
  const tick3Ref = useRef<any>(null);
  const ang1Ref = useRef<any>(null);
  const ang2Ref = useRef<any>(null);
  const ang3Ref = useRef<any>(null);

  /**
   * Sequence:
   * 1. Radius R = BC.
   * 2. Compass at B, Draw Large Arc (covering both potential intersections).
   * 3. Compass at C, Draw Large Arc.
   * 4. Show BOTH intersection points.
   * 5. Draw Sides AB, AC.
   * 6. Clean up & Show Decorations.
   */
  const play = (B: Point2D, C: Point2D, onComplete?: (vertexA: Point2D, decorations: Decoration[]) => void) => {
    setActive(true);
    setPointB(B);
    setPointC(C);
    
    // R = Distance(B,C) for Equilateral
    const R = getDistance(B, C);
    setRadius(R);

    // Calculate BOTH Intersections
    const intersections = getBothCircleIntersections(B, R, C, R);
    
    // Default logic: Usually intersection 0 is one side, 1 is the other.
    // We prefer the one "Higher" on screen (lower Y) as Vertex A.
    // If no intersection (impossible for eq triangle logic unless math error), fallback.
    const fallback = { id: 'fb', x: (B.x+C.x)/2, y: B.y - 100 };
    
    let A: Point2D = fallback;
    let A_Prime: Point2D = fallback;

    if (intersections) {
        // Sort by Y. P1 is Top (A), P2 is Bottom (A')
        const sorted = intersections.sort((a, b) => a.y - b.y);
        A = sorted[0];
        A_Prime = sorted[1];
    }

    // Decoration Helpers
    const getTickPoints = (p1: Point2D, p2: Point2D) => {
        const mid = getMidpoint(p1, p2);
        const ang = getLineAngle(p1, p2) * (Math.PI / 180);
        const perpAng = ang + Math.PI / 2;
        const len = 6;
        return [
            mid.x - Math.cos(perpAng) * len, mid.y - Math.sin(perpAng) * len,
            mid.x + Math.cos(perpAng) * len, mid.y + Math.sin(perpAng) * len
        ];
    };
    
    const getAngleArcParams = (center: Point2D, startP: Point2D, endP: Point2D) => {
        const angStart = getLineAngle(center, startP);
        const angEnd = getLineAngle(center, endP);
        let diff = angEnd - angStart;
        while (diff <= -180) diff += 360;
        while (diff > 180) diff -= 360;
        
        let finalRotation = angStart;
        let finalAngle = diff;
        if (finalAngle < 0) {
            finalRotation = angStart + finalAngle;
            finalAngle = Math.abs(finalAngle);
        }
        return { x: center.x, y: center.y, radius: 25, rotation: finalRotation, angle: finalAngle };
    };

    setTimeout(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          const decorations: Decoration[] = [
              // 3 Equal Ticks
              { id: `tick_${Date.now()}_1`, type: 'TICK', points: getTickPoints(B, A), stroke: '#ef4444' },
              { id: `tick_${Date.now()}_2`, type: 'TICK', points: getTickPoints(C, A), stroke: '#ef4444' },
              { id: `tick_${Date.now()}_3`, type: 'TICK', points: getTickPoints(B, C), stroke: '#ef4444' },
              // 3 Equal Angles (60 degrees)
              { id: `ang_${Date.now()}_1`, type: 'ANGLE', ...getAngleArcParams(B, C, A), stroke: '#ef4444' },
              { id: `ang_${Date.now()}_2`, type: 'ANGLE', ...getAngleArcParams(C, B, A), stroke: '#ef4444' },
              { id: `ang_${Date.now()}_3`, type: 'ANGLE', ...getAngleArcParams(A, C, B), stroke: '#ef4444' },
          ];
          setActive(false);
          if (onComplete) onComplete(A, decorations);
        }
      });

      // ===========================================
      // PHASE 1: COMPASS AT B
      // ===========================================
      const angBC = getLineAngle(B, C);
      // To show both intersections, we need a large sweep.
      // Equilateral vertices are at +/- 60 degrees from base vector.
      // Let's sweep from -75 to +75 relative to BC.
      const sweep = 150; 
      const startAngle1 = angBC - (sweep / 2);
      
      tl.set(compassGroupRef.current, { x: B.x, y: B.y, rotation: startAngle1, opacity: 0, scale: 0.8 });
      tl.set(arc1Ref.current, { x: B.x, y: B.y, rotation: startAngle1, angle: 0, opacity: 1 });
      
      // Enter
      tl.to(compassGroupRef.current, { opacity: 1, scale: 1, duration: 0.5 });
      
      // Draw Arc 1
      tl.to([compassGroupRef.current], { 
        rotation: startAngle1 + sweep,
        duration: 1.2, ease: "sine.inOut" 
      });
      tl.to([arc1Ref.current], { 
        angle: sweep,
        duration: 1.2, ease: "sine.inOut" 
      }, "<");

      // ===========================================
      // PHASE 2: COMPASS AT C
      // ===========================================
      const angCB = getLineAngle(C, B); // Angle pointing back to B
      // Similarly sweep +/- 75 relative to CB to catch both intersections
      const startAngle2 = angCB - (sweep / 2);
      
      // Lift & Move
      tl.to(compassGroupRef.current, { y: "-=60", scale: 1.05, duration: 0.4, ease: "power1.out" }); 
      tl.to(compassGroupRef.current, { x: C.x, rotation: startAngle2, duration: 0.6, ease: "power1.inOut" }, "<0.2"); 
      tl.to(compassGroupRef.current, { y: C.y, scale: 1, duration: 0.4, ease: "bounce.out" });

      tl.set(arc2Ref.current, { x: C.x, y: C.y, rotation: startAngle2, angle: 0, opacity: 1 });
      
      // Draw Arc 2
      tl.to([compassGroupRef.current], { 
        rotation: startAngle2 + sweep,
        duration: 1.2, ease: "sine.inOut" 
      });
      tl.to([arc2Ref.current], { 
        angle: sweep,
        duration: 1.2, ease: "sine.inOut" 
      }, "<");
      
      // Exit Compass
      tl.to(compassGroupRef.current, { opacity: 0, x: "+=30", duration: 0.4 });

      // ===========================================
      // PHASE 3: HIGHLIGHT BOTH INTERSECTIONS
      // ===========================================
      // Set positions for both dots
      tl.set([intersect1Ref.current, intersect2Ref.current], { 
          x: (i: number) => i === 0 ? A.x : A_Prime.x, 
          y: (i: number) => i === 0 ? A.y : A_Prime.y, 
          scale: 0, 
          opacity: 1 
      });
      
      // Pop them in
      tl.to([intersect1Ref.current, intersect2Ref.current], { scale: 1, duration: 0.4, ease: "back.out" });
      
      // Wait a moment for user to see the two intersections
      tl.to({}, { duration: 0.5 });
      
      // Highlight the chosen one (A)
      tl.to(intersect1Ref.current, { fill: "#ef4444", scale: 1.2, duration: 0.3 });
      tl.to(intersect2Ref.current, { opacity: 0.5, scale: 0.8, duration: 0.3 }, "<"); // Dim the unused one

      // ===========================================
      // PHASE 4: DRAW SIDES
      // ===========================================
      const dist = getDistance(B, A);
      tl.set(sideLine1Ref.current, { points: [B.x, B.y, A.x, A.y], dash: [dist, dist], dashOffset: dist, opacity: 1 });
      tl.set(sideLine2Ref.current, { points: [C.x, C.y, A.x, A.y], dash: [dist, dist], dashOffset: dist, opacity: 1 });
      
      // Ruler setup for AB
      tl.set(rulerGroupRef.current, { x: B.x, y: B.y, rotation: getLineAngle(B, A) });
      tl.set(pencilRef.current, { x: B.x, y: B.y, opacity: 0, rotation: 30 });
      tl.to([rulerGroupRef.current, pencilRef.current], { opacity: 1, duration: 0.3 });
      
      // Draw AB
      tl.to(pencilRef.current, { x: A.x, y: A.y, duration: 0.6, ease: "sine.inOut" }, "s1");
      tl.to(sideLine1Ref.current, { dashOffset: 0, duration: 0.6, ease: "sine.inOut" }, "s1");
      
      // Move Tools to C for AC
      tl.to(pencilRef.current, { opacity: 0, duration: 0.2 });
      tl.set(rulerGroupRef.current, { x: C.x, y: C.y, rotation: getLineAngle(C, A) });
      tl.set(pencilRef.current, { x: C.x, y: C.y });
      tl.to(pencilRef.current, { opacity: 1, duration: 0.2 });
      
      // Draw AC
      tl.to(pencilRef.current, { x: A.x, y: A.y, duration: 0.6, ease: "sine.inOut" }, "s2");
      tl.to(sideLine2Ref.current, { dashOffset: 0, duration: 0.6, ease: "sine.inOut" }, "s2");
      
      // Hide Tools & Construction Arcs (CLEAN UP STEP)
      // Also hide the second intersection point as we finish
      tl.to([rulerGroupRef.current, pencilRef.current], { opacity: 0, duration: 0.5 });
      tl.to([arc1Ref.current, arc2Ref.current, intersect1Ref.current, intersect2Ref.current], { opacity: 0, duration: 0.5 }, "<");

      // ===========================================
      // PHASE 5: SHOW VERTEX A & DECORATIONS
      // ===========================================
      tl.set(pointA_Ref.current, { x: A.x, y: A.y, scale: 0, opacity: 1, fill: '#ef4444' });
      tl.to(pointA_Ref.current, { scale: 1, duration: 0.3, ease: "back.out" });

      tl.set([tick1Ref.current, tick2Ref.current, tick3Ref.current], { opacity: 0, stroke: "#ef4444", strokeWidth: 2 });
      tl.set([ang1Ref.current, ang2Ref.current, ang3Ref.current], { opacity: 0, stroke: "#ef4444", strokeWidth: 1.5 });
      
      tl.to([tick1Ref.current, tick2Ref.current, tick3Ref.current], { opacity: 1, duration: 0.3, stagger: 0.1 });
      tl.to([ang1Ref.current, ang2Ref.current, ang3Ref.current], { opacity: 1, duration: 0.3, stagger: 0.1 });

    }, 50);
  };

  const animationLayer = useMemo(() => {
    if (!active) return null;
    const maxLen = radius + 50;

    return (
      <Group>
        <Group ref={rulerGroupRef} listening={false} opacity={0}>
          <Group x={-20} y={0}><VirtualRuler x={0} y={0} rotation={0} length={maxLen} /></Group>
        </Group>
        <Group ref={compassGroupRef} listening={false} opacity={0}>
            <VirtualCompass centerX={0} centerY={0} radius={radius} rotation={0} />
        </Group>
        
        {/* Construction Arcs */}
        <KonvaArc ref={arc1Ref} angle={0} innerRadius={radius} outerRadius={radius} stroke="#74B9FF" strokeWidth={1} listening={false} />
        <KonvaArc ref={arc2Ref} angle={0} innerRadius={radius} outerRadius={radius} stroke="#74B9FF" strokeWidth={1} listening={false} />
        
        {/* Intersection Points (Construction) */}
        <KonvaCircle ref={intersect1Ref} radius={6} fill="#74B9FF" opacity={0} />
        <KonvaCircle ref={intersect2Ref} radius={6} fill="#74B9FF" opacity={0} />

        {/* Triangle Sides */}
        <KonvaLine ref={sideLine1Ref} stroke="black" strokeWidth={2} lineCap="round" />
        <KonvaLine ref={sideLine2Ref} stroke="black" strokeWidth={2} lineCap="round" />
        
        {/* Point A (Final) */}
        <KonvaCircle ref={pointA_Ref} radius={5} fill="#ef4444" opacity={0} />

        {/* Decorations */}
        <KonvaLine ref={tick1Ref} lineCap="round" points={[]} />
        <KonvaLine ref={tick2Ref} lineCap="round" points={[]} />
        <KonvaLine ref={tick3Ref} lineCap="round" points={[]} />
        <KonvaArc ref={ang1Ref} angle={0} innerRadius={25} outerRadius={25} lineCap="round" />
        <KonvaArc ref={ang2Ref} angle={0} innerRadius={25} outerRadius={25} lineCap="round" />
        <KonvaArc ref={ang3Ref} angle={0} innerRadius={25} outerRadius={25} lineCap="round" />

        <VirtualPencil ref={pencilRef} x={0} y={0} isDrawing={true} opacity={0} />
      </Group>
    );
  }, [active, radius]);

  return { play, animationLayer, isAnimating: active };
};
