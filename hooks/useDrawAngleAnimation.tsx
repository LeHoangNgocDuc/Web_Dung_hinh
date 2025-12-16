
import React, { useRef, useState, useMemo } from 'react';
import { Group, Circle as KonvaCircle, Line as KonvaLine } from 'react-konva';
import gsap from 'gsap';
import { Point2D, Decoration } from '../types';
import { getLineAngle } from '../utils/math';
import VirtualProtractor from '../components/Tools/VirtualProtractor';
import VirtualPencil from '../components/Tools/VirtualPencil';
import VirtualRuler from '../components/Tools/VirtualRuler';

export const useDrawAngleAnimation = () => {
  const [active, setActive] = useState(false);
  const [origin, setOrigin] = useState<Point2D>({ x: 0, y: 0, id: 'o' });
  
  // Refs
  const protractorGroupRef = useRef<any>(null);
  const rulerGroupRef = useRef<any>(null);
  const pencilRef = useRef<any>(null);
  const guideRayRef = useRef<any>(null); 
  const pointMarkRef = useRef<any>(null); 
  const finalRayRef = useRef<any>(null);  

  const play = (O: Point2D, A: Point2D, angleDeg: number, onComplete?: (endPoint: Point2D, decorations: Decoration[]) => void) => {
    setActive(true);
    setOrigin(O);

    // 1. Calculate Mathematics
    const baseAngle = getLineAngle(O, A);
    const targetAngle = baseAngle - angleDeg; 

    // Calculate Point Position
    const R_Protractor = 160;
    const markPoint = {
        x: O.x + Math.cos(targetAngle * Math.PI / 180) * R_Protractor,
        y: O.y + Math.sin(targetAngle * Math.PI / 180) * R_Protractor,
        id: `mark_${Date.now()}`
    };

    const finalLen = 350;
    const finalRayEnd = {
        x: O.x + Math.cos(targetAngle * Math.PI / 180) * finalLen,
        y: O.y + Math.sin(targetAngle * Math.PI / 180) * finalLen,
        id: `ang_end_${Date.now()}`
    };

    setTimeout(() => {
      const tl = gsap.timeline({
        onComplete: () => {
             const decs: Decoration[] = [{
                id: `ang_arc_${Date.now()}`,
                type: 'ANGLE',
                x: O.x, y: O.y,
                radius: 30,
                rotation: targetAngle, 
                angle: angleDeg,       
                stroke: '#ef4444'
            },
            {
                 id: `ang_txt_${Date.now()}`,
                 type: 'TEXT',
                 x: O.x + 30, y: O.y - 30, 
                 text: `${angleDeg}°`,
                 stroke: ''
            }];
            setActive(false);
            if (onComplete) onComplete(finalRayEnd, decs);
        }
      });

      // ===========================
      // PHASE 0: INITIAL PENCIL
      // ===========================
      // Start with Pencil at O (where user clicked)
      tl.set(pencilRef.current, { x: O.x, y: O.y, opacity: 1, rotation: 30 });
      tl.set(protractorGroupRef.current, { x: O.x, y: O.y, rotation: baseAngle, opacity: 0, scale: 0.9 });
      
      tl.to({}, { duration: 0.3 }); // Pause

      // Swap Pencil -> Protractor
      tl.to(pencilRef.current, { opacity: 0, y: "-=20", duration: 0.3 });
      tl.to(protractorGroupRef.current, { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" }, "-=0.1");

      // ===========================
      // PHASE 1: GUIDE RAY BLINK
      // ===========================
      tl.set(guideRayRef.current, { points: [O.x, O.y, markPoint.x, markPoint.y], opacity: 0, stroke: '#ef4444', dash: [5,5] });
      
      for(let i=0; i<3; i++) {
          tl.to(guideRayRef.current, { opacity: 0.8, duration: 0.3 });
          tl.to(guideRayRef.current, { opacity: 0, duration: 0.3 });
      }
      tl.to(guideRayRef.current, { opacity: 0.6, duration: 0.2 });

      // ===========================
      // PHASE 2: MARK DOT
      // ===========================
      // Pencil reappears at markPoint
      tl.set(pencilRef.current, { x: markPoint.x, y: markPoint.y - 50, rotation: 30, opacity: 0 });
      tl.to(pencilRef.current, { y: markPoint.y, opacity: 1, duration: 0.5 });
      
      // Draw Dot
      tl.set(pointMarkRef.current, { x: markPoint.x, y: markPoint.y, scale: 0, opacity: 1, fill: '#ef4444' });
      tl.to(pointMarkRef.current, { scale: 1, duration: 0.2, ease: "back.out" });
      
      // Hide Pencil & Protractor & Guide
      tl.to(pencilRef.current, { opacity: 0, y: "-=20", duration: 0.3 });
      tl.to([protractorGroupRef.current, guideRayRef.current], { opacity: 0, duration: 0.5 });

      // ===========================
      // PHASE 3: RULER ALIGN
      // ===========================
      tl.set(rulerGroupRef.current, { x: O.x, y: O.y, rotation: targetAngle, opacity: 0, scale: 0.9 });
      tl.to(rulerGroupRef.current, { opacity: 1, scale: 1, duration: 0.8 });

      // ===========================
      // PHASE 4: DRAW RAY
      // ===========================
      tl.set(pencilRef.current, { x: O.x, y: O.y, opacity: 0, rotation: 30 });
      tl.to(pencilRef.current, { opacity: 1, duration: 0.3 });

      tl.set(finalRayRef.current, { points: [O.x, O.y, finalRayEnd.x, finalRayEnd.y], dash: [finalLen, finalLen], dashOffset: finalLen, opacity: 1 });
      
      tl.to(pencilRef.current, { x: finalRayEnd.x, y: finalRayEnd.y, duration: 1.5, ease: "sine.inOut" }, "draw");
      tl.to(finalRayRef.current, { dashOffset: 0, duration: 1.5, ease: "sine.inOut" }, "draw");

      // ===========================
      // PHASE 5: CLEANUP & RETURN PENCIL
      // ===========================================
      // Hide Ruler, Dot. Keep Pencil visible for a moment
      tl.to([rulerGroupRef.current, pointMarkRef.current], { opacity: 0, duration: 0.5 });
      
      // Pencil remains until cleanup
      tl.to({}, { duration: 0.5 });

    }, 50);
  };

  const animationLayer = useMemo(() => {
    if (!active) return null;
    return (
      <Group>
         {/* Underlay: Guide Ray */}
         <KonvaLine ref={guideRayRef} strokeWidth={2} />

         {/* Tool 1: Protractor */}
         <Group ref={protractorGroupRef} listening={false} opacity={0}>
             <VirtualProtractor x={0} y={0} rotation={0} />
        </Group>

        {/* The Dot Mark */}
        <KonvaCircle ref={pointMarkRef} radius={4} fill="red" opacity={0} />

        {/* Tool 2: Ruler */}
        <Group ref={rulerGroupRef} listening={false} opacity={0}>
             <Group x={-20} y={0}><VirtualRuler x={0} y={0} rotation={0} length={450} /></Group>
        </Group>

        {/* Final Ray */}
        <KonvaLine ref={finalRayRef} stroke="black" strokeWidth={2} lineCap="round" />
        
        {/* Pencil - Shared Ref */}
        <VirtualPencil ref={pencilRef} x={0} y={0} isDrawing={true} opacity={0} />
      </Group>
    );
  }, [active]);

  return { play, animationLayer, isAnimating: active };
};
