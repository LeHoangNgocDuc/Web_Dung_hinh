import React, { useRef, useState, useMemo } from 'react';
import { Group, Line as KonvaLine } from 'react-konva';
import gsap from 'gsap';
import { Point2D } from '../types';
import { getDistance, getLineAngle } from '../utils/math';
import VirtualRuler from '../components/Tools/VirtualRuler';
import VirtualPencil from '../components/Tools/VirtualPencil';

export const useDrawSegmentAnimation = () => {
  const [active, setActive] = useState(false);
  const [startPoint, setStartPoint] = useState<Point2D>({ id: 'temp_a', x: 0, y: 0 });
  const [endPoint, setEndPoint] = useState<Point2D>({ id: 'temp_b', x: 0, y: 0 });

  // Refs for animation actors
  const rulerGroupRef = useRef<any>(null);
  const pencilRef = useRef<any>(null);
  const lineRef = useRef<any>(null);

  /**
   * Triggers the realistic drawing sequence.
   * Phase 1: Ruler Enters (Aligned)
   * Phase 2: Pencil Enters (At Point A)
   * Phase 3: Draw (Sync Pencil & Line) - SLOW & SMOOTH
   * Phase 4: Cleanup - DELAYED
   */
  const play = (A: Point2D, B: Point2D, onComplete?: () => void) => {
    setActive(true);
    setStartPoint(A);
    setEndPoint(B);

    const distance = getDistance(A, B);
    const angle = getLineAngle(A, B); // Degrees

    // Small delay to allow React to mount the components
    setTimeout(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          setActive(false);
          if (onComplete) onComplete();
        }
      });

      // ===============================================
      // PHASE 1: RULER ENTER (1.0s)
      // ===============================================
      if (rulerGroupRef.current) {
        // Initial: Invisible, slightly scaled down
        tl.set(rulerGroupRef.current, {
          x: A.x, 
          y: A.y, 
          rotation: angle, 
          scale: 0.9,
          opacity: 0
        });

        // Action: Fade In & Scale Up to perfect fit
        tl.to(rulerGroupRef.current, {
          scale: 1,
          opacity: 1,
          duration: 1.0,
          ease: "power2.out"
        });
      }

      // ===============================================
      // PHASE 2: PENCIL ENTER (0.6s)
      // ===============================================
      if (pencilRef.current) {
        // Initial: Hovering above Point A
        tl.set(pencilRef.current, {
          x: A.x,
          y: A.y - 40, // Above
          rotation: 30, // Writing tilt
          opacity: 0,
          scale: 1.1
        });

        // Action: Land on Point A
        tl.to(pencilRef.current, {
          y: A.y,
          opacity: 1,
          scale: 1,
          duration: 0.6,
          ease: "back.out(1.2)"
        });
      }

      // ===============================================
      // PHASE 3: DRAWING ACTION (Slower & Smoother)
      // ===============================================
      if (lineRef.current && pencilRef.current) {
        // Setup dashed line (invisible initially)
        tl.set(lineRef.current, {
          dash: [distance, distance],
          dashOffset: distance,
          opacity: 1,
          strokeWidth: 2
        });

        // Calculate dynamic duration based on length
        // Minimum 2.0s for short lines, up to 4.0s for long lines -> Very deliberate speed
        const drawDuration = Math.min(4.0, Math.max(2.0, distance / 120));

        // Sync 1: Move Pencil A -> B
        tl.to(pencilRef.current, {
          x: B.x,
          y: B.y,
          duration: drawDuration,
          ease: "sine.inOut" // Sine easing is very smooth and natural
        }, "draw");

        // Sync 2: Reveal Line (dashOffset -> 0)
        tl.to(lineRef.current, {
          dashOffset: 0,
          duration: drawDuration,
          ease: "sine.inOut"
        }, "draw");
      }

      // ===============================================
      // PHASE 4: CLEANUP (Delayed)
      // ===============================================
      
      // Add a distinct pause (0.6s) so user can see the result before tools vanish
      tl.to({}, { duration: 0.6 });

      // Then fade out tools
      tl.to([rulerGroupRef.current, pencilRef.current], {
        opacity: 0,
        y: "+=20", // Drop down effect
        duration: 0.8,
        ease: "power2.in"
      });
      
      // Ensure the temp line vanishes right at the end
      tl.set(lineRef.current, { opacity: 0 });

    }, 50);
  };

  const animationLayer = useMemo(() => {
    if (!active) return null;
    
    const dist = getDistance(startPoint, endPoint);
    // Ruler layout calculation
    const rulerLen = dist + 40;

    return (
      <Group>
        {/* 1. RULER */}
        <Group ref={rulerGroupRef} listening={false}>
          {/* Offset x by -20 so the ruler starts "before" point A */}
          <Group x={-20} y={0}>
             <VirtualRuler x={0} y={0} rotation={0} length={rulerLen} />
          </Group>
        </Group>

        {/* 2. TEMPORARY LINE */}
        <KonvaLine
            ref={lineRef}
            points={[startPoint.x, startPoint.y, endPoint.x, endPoint.y]}
            stroke="black"
            strokeWidth={2}
            lineCap="round"
            lineJoin="round"
            listening={false}
        />

        {/* 3. PENCIL */}
        <VirtualPencil 
            ref={pencilRef} 
            x={startPoint.x} 
            y={startPoint.y} 
            rotation={30} 
            isDrawing={true} 
        />
      </Group>
    );
  }, [active, startPoint, endPoint]);

  return {
    play,
    animationLayer,
    isAnimating: active
  };
};