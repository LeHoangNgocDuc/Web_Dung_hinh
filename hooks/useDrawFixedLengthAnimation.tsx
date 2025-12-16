
import React, { useRef, useState, useMemo } from 'react';
import { Group, Line as KonvaLine, Circle as KonvaCircle } from 'react-konva';
import gsap from 'gsap';
import { Point2D } from '../types';
import { PIXELS_PER_CM } from '../constants';
import VirtualRuler from '../components/Tools/VirtualRuler';
import VirtualPencil from '../components/Tools/VirtualPencil';

export const useDrawFixedLengthAnimation = () => {
  const [active, setActive] = useState(false);
  const [startPoint, setStartPoint] = useState<Point2D>({ id: 'temp_a', x: 0, y: 0 });
  const [endPoint, setEndPoint] = useState<Point2D>({ id: 'temp_b', x: 0, y: 0 });
  const [lengthCm, setLengthCm] = useState(0);

  // Refs for animation actors
  const rulerGroupRef = useRef<any>(null);
  const pencilRef = useRef<any>(null);
  const lineRef = useRef<any>(null);
  const ghostPointRef = useRef<any>(null);

  /**
   * Triggers the sequence:
   * 1. Ruler appears (Tick 0 at A).
   * 2. Target point B blinks at [length]cm mark.
   * 3. Pencil draws A -> B.
   */
  const play = (A: Point2D, lengthVal: number, onComplete?: (endP: Point2D) => void) => {
    setActive(true);
    setStartPoint(A);
    setLengthCm(lengthVal);

    // Calculate End Point (Horizontal by default for this lesson)
    const pxLength = lengthVal * PIXELS_PER_CM;
    const B: Point2D = {
      id: `p_calc_${Date.now()}`,
      x: A.x + pxLength,
      y: A.y,
    };
    setEndPoint(B);

    setTimeout(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          setActive(false);
          if (onComplete) onComplete(B);
        }
      });

      // ===============================================
      // PHASE 1: RULER ALIGNMENT (1.0s)
      // ===============================================
      if (rulerGroupRef.current) {
        // Initial state: Faded out, slightly above
        tl.set(rulerGroupRef.current, {
          x: A.x, 
          y: A.y - 50,
          rotation: 0,
          opacity: 0,
        });

        // Drop down to align tick 0 with A
        tl.to(rulerGroupRef.current, {
          y: A.y,
          opacity: 1,
          duration: 1.0,
          ease: "power2.out"
        });
      }

      // ===============================================
      // PHASE 2: INDICATE TARGET (1.5s)
      // ===============================================
      if (ghostPointRef.current) {
        // Blink the ghost point at B to show user where we are going
        tl.to(ghostPointRef.current, {
          opacity: 0.8,
          duration: 0.3,
          yoyo: true,
          repeat: 3, // Blink 3 times
          ease: "power1.inOut"
        });
      }

      // ===============================================
      // PHASE 3: PENCIL ENTER (0.5s)
      // ===============================================
      if (pencilRef.current) {
        tl.set(pencilRef.current, {
          x: A.x,
          y: A.y - 40,
          opacity: 0,
          rotation: 30
        });

        tl.to(pencilRef.current, {
          y: A.y,
          opacity: 1,
          duration: 0.5,
          ease: "back.out(1.2)"
        });
      }

      // ===============================================
      // PHASE 4: DRAW (Variable speed)
      // ===============================================
      if (lineRef.current && pencilRef.current) {
        tl.set(lineRef.current, {
          dash: [pxLength, pxLength],
          dashOffset: pxLength,
          opacity: 1,
          strokeWidth: 2
        });

        const drawDuration = Math.max(2.0, pxLength / 100);

        // Move Pencil
        tl.to(pencilRef.current, {
          x: B.x,
          duration: drawDuration,
          ease: "sine.inOut"
        }, "draw");

        // Reveal Line
        tl.to(lineRef.current, {
          dashOffset: 0,
          duration: drawDuration,
          ease: "sine.inOut"
        }, "draw");
      }

      // ===============================================
      // PHASE 5: CLEANUP
      // ===============================================
      tl.to({}, { duration: 0.5 }); // Pause

      tl.to([rulerGroupRef.current, pencilRef.current, ghostPointRef.current], {
        opacity: 0,
        y: "+=20",
        duration: 0.5,
      });

    }, 50);
  };

  const animationLayer = useMemo(() => {
    if (!active) return null;
    
    const pxLength = lengthCm * PIXELS_PER_CM;
    // Ruler needs to be longer than the drawing
    const rulerLen = pxLength + 50; 

    return (
      <Group>
        {/* 1. RULER */}
        <Group ref={rulerGroupRef} listening={false}>
          {/* 
            VirtualRuler's Ticks start at local x=0.
            So putting this group at A.x means Tick 0 is at A.x. Correct.
          */}
          <VirtualRuler x={0} y={0} rotation={0} length={rulerLen} />
        </Group>

        {/* 2. GHOST TARGET POINT */}
        <KonvaCircle
            ref={ghostPointRef}
            x={endPoint.x}
            y={endPoint.y}
            radius={4}
            fill="#ec4899" // Pink snap color
            opacity={0} // Start invisible
            listening={false}
        />

        {/* 3. LINE */}
        <KonvaLine
            ref={lineRef}
            points={[startPoint.x, startPoint.y, endPoint.x, endPoint.y]}
            stroke="black"
            strokeWidth={2}
            lineCap="round"
            listening={false}
        />

        {/* 4. PENCIL */}
        <VirtualPencil 
            ref={pencilRef} 
            x={startPoint.x} 
            y={startPoint.y} 
            isDrawing={true} 
        />
      </Group>
    );
  }, [active, startPoint, endPoint, lengthCm]);

  return {
    play,
    animationLayer,
    isAnimating: active
  };
};
