
import React, { useRef, useState, useMemo } from 'react';
import { Group, Line as KonvaLine, Arc as KonvaArc, Circle as KonvaCircle } from 'react-konva';
import gsap from 'gsap';
import { Point2D, Decoration } from '../types';
import { getDistance, getLineAngle, getMidpoint, getBothCircleIntersections, normalizeVector, subtractVectors } from '../utils/math';
import VirtualRuler from '../components/Tools/VirtualRuler';
import VirtualPencil from '../components/Tools/VirtualPencil';
import VirtualCompass from '../components/Tools/VirtualCompass';

export const useTangentFromPointAnimation = () => {
  const [active, setActive] = useState(false);
  const [compassRadius, setCompassRadius] = useState(50); // Dynamic radius for Compass Tool

  // -- REFS --
  const rulerRef = useRef<any>(null);
  const pencilRef = useRef<any>(null);
  const compassRef = useRef<any>(null);

  // Phase 0: Base Circle
  const baseCircleRef = useRef<any>(null);

  // Construction Elements
  const lineOMRef = useRef<any>(null); // Segment OM
  
  // Midpoint construction Arcs
  const arcO_TopRef = useRef<any>(null);
  const arcO_BottomRef = useRef<any>(null);
  const arcM_TopRef = useRef<any>(null);
  const arcM_BottomRef = useRef<any>(null);
  const perpBisectorRef = useRef<any>(null); // The line connecting arc intersections
  
  // Circle I
  const circleIRef = useRef<any>(null); 
  
  // Result Lines
  const lineMARef = useRef<any>(null);
  const lineMBRef = useRef<any>(null);
  const lineOARef = useRef<any>(null);
  const lineOBRef = useRef<any>(null);

  // Highlight Points
  const pointIRef = useRef<any>(null);
  const pointARef = useRef<any>(null);
  const pointBRef = useRef<any>(null);
  const intersectPRef = useRef<any>(null); // Top arc intersection
  const intersectQRef = useRef<any>(null); // Bottom arc intersection

  // Symbols
  const rightAngleARef = useRef<any>(null);
  const rightAngleBRef = useRef<any>(null);

  const play = (O: Point2D, R: number, M: Point2D, onComplete?: (A: Point2D, B: Point2D, decorations: Decoration[]) => void) => {
    setActive(true);
    setCompassRadius(R); // Initial Radius for Base Circle

    // --- MATH ---
    const midI = getMidpoint(O, M);
    const radiusI = getDistance(O, M) / 2;
    const distOM = getDistance(O, M);
    const angOM = getLineAngle(O, M);
    
    // Find intersections of Circle(O, R) and Circle(I, radiusI) for Tangent Points
    const tangents = getBothCircleIntersections(O, R, midI, radiusI);
    
    if (!tangents) {
        setActive(false);
        alert("Điểm M phải nằm ngoài đường tròn (O)!");
        return;
    }

    const A = tangents[0];
    const B = tangents[1];

    // Helpers for Right Angles
    const makeRA = (Vertex: Point2D, P1: Point2D, P2: Point2D) => {
        const size = 15;
        const v1 = normalizeVector(subtractVectors(P1, Vertex));
        const v2 = normalizeVector(subtractVectors(P2, Vertex));
        const p1 = { x: Vertex.x + v1.x * size, y: Vertex.y + v1.y * size };
        const p2 = { x: p1.x + v2.x * size, y: p1.y + v2.y * size };
        const p3 = { x: Vertex.x + v2.x * size, y: Vertex.y + v2.y * size };
        return [p1.x, p1.y, p2.x, p2.y, p3.x, p3.y];
    };

    const raA = makeRA(A, O, M);
    const raB = makeRA(B, O, M);

    // Helpers for Ray Extension (Visual Only)
    const extendRay = (Start: Point2D, Through: Point2D, len: number): Point2D => {
        const vec = normalizeVector(subtractVectors(Through, Start));
        return {
            id: `ext_${Date.now()}_${Math.random()}`,
            x: Start.x + vec.x * len,
            y: Start.y + vec.y * len
        };
    };
    
    const maExtended = extendRay(M, A, getDistance(M, A) + 100);
    const mbExtended = extendRay(M, B, getDistance(M, B) + 100);

    // Radius for Midpoint Construction (> dist/2)
    const constructionR = distOM * 0.6; 
    
    // Fallback Intersection Points
    const bisectorIntersects = getBothCircleIntersections(O, constructionR, M, constructionR);
    const P_bisect = bisectorIntersects ? bisectorIntersects[0] : { id: 'err_p', x:0, y:0 };
    const Q_bisect = bisectorIntersects ? bisectorIntersects[1] : { id: 'err_q', x:0, y:0 };

    setTimeout(() => {
        const tl = gsap.timeline({
            defaults: { ease: "power2.inOut" },
            onComplete: () => {
                const decs: Decoration[] = [
                    { id: `ra_a_${Date.now()}`, type: 'RIGHT_ANGLE', points: [A.x, A.y, ...raA, A.x, A.y], stroke: '#ef4444' },
                    { id: `ra_b_${Date.now()}`, type: 'RIGHT_ANGLE', points: [B.x, B.y, ...raB, B.x, B.y], stroke: '#ef4444' }
                ];
                setActive(false);
                if (onComplete) onComplete(A, B, decs);
            }
        });

        // ============================
        // PHASE 0: DRAW BASE CIRCLE (O)
        // ============================
        // 1. Compass appears at O
        tl.set(compassRef.current, { x: O.x, y: O.y, rotation: 0, opacity: 0, scale: 0.9 });
        tl.set(baseCircleRef.current, { x: O.x, y: O.y, innerRadius: R, outerRadius: R, angle: 0, rotation: 0, opacity: 1 });
        
        tl.to(compassRef.current, { opacity: 1, scale: 1, duration: 0.5 });
        // 2. Draw 360 degrees
        tl.to(compassRef.current, { rotation: 360, duration: 1.5, ease: "none" });
        tl.to(baseCircleRef.current, { angle: 360, duration: 1.5, ease: "none" }, "<");
        
        // 3. Lift Compass and Fade Out
        tl.to(compassRef.current, { opacity: 0, y: "-=20", duration: 0.3 });

        // === UPDATE COMPASS RADIUS FOR PHASE 2 (Midpoint Construction) ===
        tl.call(() => setCompassRadius(constructionR));
        tl.to({}, { duration: 0.1 }); // Wait for React render

        // ============================
        // PHASE 1: CONNECT O -> M
        // ============================
        tl.set(lineOMRef.current, { points: [O.x, O.y, M.x, M.y], dash: [distOM, distOM], dashOffset: distOM, opacity: 1 });
        
        tl.set(rulerRef.current, { x: O.x, y: O.y, rotation: angOM, opacity: 0 });
        tl.set(pencilRef.current, { x: O.x, y: O.y, rotation: 30, opacity: 0 });
        
        tl.to([rulerRef.current, pencilRef.current], { opacity: 1, duration: 0.5 });
        tl.to(pencilRef.current, { x: M.x, y: M.y, duration: 0.8 });
        tl.to(lineOMRef.current, { dashOffset: 0, duration: 0.8 }, "<");
        
        tl.to(rulerRef.current, { opacity: 0, duration: 0.3 }); // Hide Ruler

        // ============================
        // PHASE 2: FIND MIDPOINT I
        // ============================
        const sweep = 40;
        const angOM_top = angOM - 33.5; // Approximation based on 0.6 ratio
        const angOM_bot = angOM + 33.5;

        // 1. Compass at O
        tl.set(compassRef.current, { x: O.x, y: O.y, rotation: angOM_top - sweep/2, opacity: 0, scale: 0.9 });
        tl.to(compassRef.current, { opacity: 1, scale: 1, duration: 0.4 });
        
        // Draw Top Arc O
        tl.set(arcO_TopRef.current, { x: O.x, y: O.y, innerRadius: constructionR, outerRadius: constructionR, rotation: angOM_top - sweep/2, angle: 0, opacity: 1 });
        tl.to(compassRef.current, { rotation: angOM_top + sweep/2, duration: 0.4 });
        tl.to(arcO_TopRef.current, { angle: sweep, duration: 0.4 }, "<");
        
        // Draw Bottom Arc O
        tl.to(compassRef.current, { rotation: angOM_bot - sweep/2, duration: 0.3 });
        tl.set(arcO_BottomRef.current, { x: O.x, y: O.y, innerRadius: constructionR, outerRadius: constructionR, rotation: angOM_bot - sweep/2, angle: 0, opacity: 1 });
        tl.to(compassRef.current, { rotation: angOM_bot + sweep/2, duration: 0.4 });
        tl.to(arcO_BottomRef.current, { angle: sweep, duration: 0.4 }, "<");

        // 2. Compass at M
        const angMO = angOM + 180;
        const angMO_top = angMO + 33.5; 
        const angMO_bot = angMO - 33.5;

        tl.to(compassRef.current, { y: "-=40", opacity: 0.5, duration: 0.2 });
        tl.to(compassRef.current, { x: M.x, y: M.y, opacity: 1, rotation: angMO_top - sweep/2, duration: 0.4 });

        // Draw Top Arc M
        tl.set(arcM_TopRef.current, { x: M.x, y: M.y, innerRadius: constructionR, outerRadius: constructionR, rotation: angMO_top - sweep/2, angle: 0, opacity: 1 });
        tl.to(compassRef.current, { rotation: angMO_top + sweep/2, duration: 0.4 });
        tl.to(arcM_TopRef.current, { angle: sweep, duration: 0.4 }, "<");

        // Draw Bottom Arc M
        tl.to(compassRef.current, { rotation: angMO_bot - sweep/2, duration: 0.3 });
        tl.set(arcM_BottomRef.current, { x: M.x, y: M.y, innerRadius: constructionR, outerRadius: constructionR, rotation: angMO_bot - sweep/2, angle: 0, opacity: 1 });
        tl.to(compassRef.current, { rotation: angMO_bot + sweep/2, duration: 0.4 });
        tl.to(arcM_BottomRef.current, { angle: sweep, duration: 0.4 }, "<");
        
        // Hide Compass
        tl.to(compassRef.current, { opacity: 0, x: "-=30", duration: 0.3 });

        // 3. Ruler to connect intersections
        tl.set([intersectPRef.current, intersectQRef.current], { x: (i:number) => i===0?P_bisect.x:Q_bisect.x, y: (i:number)=> i===0?P_bisect.y:Q_bisect.y, scale: 0, opacity: 1 });
        tl.to([intersectPRef.current, intersectQRef.current], { scale: 1, duration: 0.3 });

        const perpAngle = getLineAngle(P_bisect, Q_bisect);
        const distPQ = getDistance(P_bisect, Q_bisect);
        
        tl.set(rulerRef.current, { x: P_bisect.x, y: P_bisect.y, rotation: perpAngle, opacity: 0 });
        tl.set(pencilRef.current, { x: P_bisect.x, y: P_bisect.y, rotation: 30, opacity: 0 });
        
        tl.to([rulerRef.current, pencilRef.current], { opacity: 1, duration: 0.5 });
        
        // Draw Perpendicular Bisector (Dashed)
        tl.set(perpBisectorRef.current, { points: [P_bisect.x, P_bisect.y, Q_bisect.x, Q_bisect.y], dash: [distPQ, distPQ], dashOffset: distPQ, opacity: 1 });
        
        tl.to(pencilRef.current, { x: midI.x, y: midI.y, duration: 0.6, ease: "linear" }); // Move to center
        tl.to(perpBisectorRef.current, { dashOffset: distPQ/2, duration: 0.6, ease: "linear" }, "<"); // Draw half
        
        // Mark Point I
        tl.set(pointIRef.current, { x: midI.x, y: midI.y, scale: 0, opacity: 1, fill: '#74B9FF' });
        tl.to(pointIRef.current, { scale: 1, duration: 0.3, ease: "back.out" });
        
        tl.to([rulerRef.current, pencilRef.current, perpBisectorRef.current, intersectPRef.current, intersectQRef.current], { opacity: 0, duration: 0.5 });
        tl.to([arcO_TopRef.current, arcO_BottomRef.current, arcM_TopRef.current, arcM_BottomRef.current], { opacity: 0.2, duration: 0.5 }, "<");

        // === UPDATE COMPASS RADIUS FOR PHASE 3 (Circle I) ===
        tl.call(() => setCompassRadius(radiusI));
        tl.to({}, { duration: 0.1 }); // Wait

        // ============================
        // PHASE 3: DRAW CIRCLE (I, IO) - DASHED
        // ============================
        // Start pencil at O. I is center.
        // Vector IO is from I to O. Angle is angOM + 180.
        tl.set(compassRef.current, { x: midI.x, y: midI.y, rotation: angOM + 180, opacity: 0 });
        tl.to(compassRef.current, { opacity: 1, duration: 0.4 });

        // Draw Circle I (Dashed)
        tl.set(circleIRef.current, { 
            x: midI.x, 
            y: midI.y, 
            innerRadius: radiusI, 
            outerRadius: radiusI, 
            rotation: angOM + 180, 
            angle: 0, 
            opacity: 1,
            dash: [10, 8], 
            stroke: '#64748b' 
        });
        
        tl.to(compassRef.current, { rotation: angOM + 180 + 360, duration: 1.5, ease: "none" });
        tl.to(circleIRef.current, { angle: 360, duration: 1.5, ease: "none" }, "<");

        // Identify A and B
        tl.set([pointARef.current, pointBRef.current], { x: (i:number) => i===0?A.x:B.x, y: (i:number)=> i===0?A.y:B.y, scale: 0, opacity: 1, fill: '#ef4444' });
        tl.to([pointARef.current, pointBRef.current], { scale: 1, duration: 0.3, stagger: 0.1 });

        // Hide Compass
        tl.to(compassRef.current, { opacity: 0, x: "-=50", duration: 0.3 });
        tl.to({}, { duration: 0.5 });

        // ============================
        // PHASE 4: TANGENTS MA, MB
        // ============================
        const distMA_Ext = getDistance(M, maExtended);
        const distMB_Ext = getDistance(M, mbExtended);

        // MA
        tl.set(lineMARef.current, { points: [M.x, M.y, maExtended.x, maExtended.y], dash: [distMA_Ext, distMA_Ext], dashOffset: distMA_Ext, opacity: 1 });
        tl.set(rulerRef.current, { x: M.x, y: M.y, rotation: getLineAngle(M, A), opacity: 0 });
        tl.set(pencilRef.current, { x: M.x, y: M.y, rotation: 30, opacity: 0 });

        tl.to([rulerRef.current, pencilRef.current], { opacity: 1, duration: 0.3 });
        
        // Draw to A then extend
        tl.to(pencilRef.current, { x: maExtended.x, y: maExtended.y, duration: 1.0 });
        tl.to(lineMARef.current, { dashOffset: 0, duration: 1.0 }, "<");

        // MB
        tl.to(pencilRef.current, { opacity: 0, duration: 0.2 });
        tl.set(lineMBRef.current, { points: [M.x, M.y, mbExtended.x, mbExtended.y], dash: [distMB_Ext, distMB_Ext], dashOffset: distMB_Ext, opacity: 1 });
        tl.set(rulerRef.current, { rotation: getLineAngle(M, B) });
        tl.set(pencilRef.current, { x: M.x, y: M.y });
        
        tl.to(pencilRef.current, { opacity: 1, duration: 0.2 });
        tl.to(pencilRef.current, { x: mbExtended.x, y: mbExtended.y, duration: 1.0 });
        tl.to(lineMBRef.current, { dashOffset: 0, duration: 1.0 }, "<");

        // Hide Tools
        tl.to([rulerRef.current, pencilRef.current], { opacity: 0, duration: 0.5 });

        // ============================
        // PHASE 5: VERIFY & CLEANUP
        // ============================
        tl.set([lineOARef.current, lineOBRef.current], { opacity: 1 });
        
        tl.set([rightAngleARef.current, rightAngleBRef.current], { points: (i:number) => i===0 ? [A.x, A.y, ...raA] : [B.x, B.y, ...raB], opacity: 0, stroke: '#ef4444' });
        tl.to([rightAngleARef.current, rightAngleBRef.current], { opacity: 1, duration: 0.5 });

        tl.to([circleIRef.current, pointIRef.current, arcO_TopRef.current, arcO_BottomRef.current, arcM_TopRef.current, arcM_BottomRef.current], { 
            opacity: 0, 
            duration: 1.0 
        });

    }, 50);
  };

  const animationLayer = useMemo(() => {
    if (!active) return null;

    return (
        <Group>
            {/* Base Circle (Animated) */}
            <KonvaArc ref={baseCircleRef} stroke="black" strokeWidth={2} listening={false} innerRadius={0} outerRadius={0} angle={0} />

            {/* Construction Layer */}
            <KonvaLine ref={lineOMRef} stroke="black" strokeWidth={1} />
            
            {/* Arcs */}
            <KonvaArc ref={arcO_TopRef} stroke="#74B9FF" strokeWidth={1} dash={[5,5]} listening={false} innerRadius={0} outerRadius={0} angle={0} />
            <KonvaArc ref={arcO_BottomRef} stroke="#74B9FF" strokeWidth={1} dash={[5,5]} listening={false} innerRadius={0} outerRadius={0} angle={0} />
            <KonvaArc ref={arcM_TopRef} stroke="#74B9FF" strokeWidth={1} dash={[5,5]} listening={false} innerRadius={0} outerRadius={0} angle={0} />
            <KonvaArc ref={arcM_BottomRef} stroke="#74B9FF" strokeWidth={1} dash={[5,5]} listening={false} innerRadius={0} outerRadius={0} angle={0} />
            
            <KonvaCircle ref={intersectPRef} radius={3} fill="#74B9FF" opacity={0} />
            <KonvaCircle ref={intersectQRef} radius={3} fill="#74B9FF" opacity={0} />
            <KonvaLine ref={perpBisectorRef} stroke="#74B9FF" strokeWidth={1} dash={[5,5]} />

            <KonvaCircle ref={pointIRef} radius={4} listening={false} />
            
            {/* Circle I - DASHED as requested */}
            <KonvaArc ref={circleIRef} stroke="#64748b" strokeWidth={1.5} dash={[10,8]} listening={false} innerRadius={0} outerRadius={0} angle={0} />

            {/* Result Layer */}
            <KonvaLine ref={lineMARef} stroke="black" strokeWidth={2.5} lineCap="round" />
            <KonvaLine ref={lineMBRef} stroke="black" strokeWidth={2.5} lineCap="round" />
            
            {/* Verify Layer */}
            <KonvaLine ref={lineOARef} opacity={0} points={pointARef.current ? [0,0] : []} stroke="#ef4444" dash={[5,5]} strokeWidth={1.5} />
            <KonvaLine ref={lineOBRef} opacity={0} stroke="#ef4444" dash={[5,5]} strokeWidth={1.5} />
            <KonvaLine ref={rightAngleARef} opacity={0} />
            <KonvaLine ref={rightAngleBRef} opacity={0} />

            <KonvaCircle ref={pointARef} radius={5} listening={false} />
            <KonvaCircle ref={pointBRef} radius={5} listening={false} />

            {/* Tools */}
            <Group ref={rulerRef} listening={false} opacity={0}>
                <Group x={-20} y={0}><VirtualRuler x={0} y={0} rotation={0} length={500} /></Group>
            </Group>
            
            {/* Compass with dynamic radius */}
            <Group ref={compassRef} listening={false} opacity={0}>
                <VirtualCompass centerX={0} centerY={0} radius={compassRadius} rotation={0} />
            </Group>
            
            <VirtualPencil ref={pencilRef} x={0} y={0} isDrawing={true} opacity={0} />
        </Group>
    );
  }, [active, compassRadius]); // Re-render when radius changes

  return { play, animationLayer, isAnimating: active };
};
