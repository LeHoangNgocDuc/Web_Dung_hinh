
import React, { useRef, useState, useMemo } from 'react';
import { Group, Arc as KonvaArc, Line as KonvaLine, Text as KonvaText } from 'react-konva';
import gsap from 'gsap';
import { Point2D, Decoration } from '../types';
import { getLineAngle } from '../utils/math';
import VirtualProtractor from '../components/Tools/VirtualProtractor';
import VirtualPencil from '../components/Tools/VirtualPencil';

export const useMeasureAngleAnimation = () => {
  const [active, setActive] = useState(false);
  
  // State for rendering
  const [measuredAngle, setMeasuredAngle] = useState(0);
  const [toolPos, setToolPos] = useState({ x: 0, y: 0, rotation: 0 });
  const [origin, setOrigin] = useState<Point2D>({ id: 'o', x: 0, y: 0 });
  const [labelPos, setLabelPos] = useState({ x: 0, y: 0 });

  // Refs
  const highlightRayRef = useRef<any>(null); // The ray line at the angle
  const sweepArcRef = useRef<any>(null);     // The yellow fan
  const resultTextRef = useRef<any>(null);   // The text number
  const pencilRef = useRef<any>(null);       // The pencil tool

  const play = (O: Point2D, A: Point2D, B: Point2D, onComplete?: (decorations: Decoration[]) => void) => {
    setActive(true);
    setOrigin(O);

    // 1. Calculate Angles
    const angOA = getLineAngle(O, A);
    const angOB = getLineAngle(O, B);
    
    // Normalize difference (-180 to 180)
    let diff = angOB - angOA;
    while (diff <= -180) diff += 360;
    while (diff > 180) diff -= 360;

    // 2. Determine Alignment (Base Rotation)
    let baseRotation = angOA;
    let value = Math.abs(diff);

    if (diff > 0) {
        baseRotation = angOB; 
    }
    
    setMeasuredAngle(value);
    setToolPos({ x: O.x, y: O.y, rotation: baseRotation });

    // Calculate Text Position
    const midAngleRad = (baseRotation - value / 2) * (Math.PI / 180);
    const labelDist = 110;
    const lx = O.x + Math.cos(midAngleRad) * labelDist;
    const ly = O.y + Math.sin(midAngleRad) * labelDist;
    setLabelPos({ x: lx, y: ly });

    // 3. Animation Sequence
    setTimeout(() => {
      const tl = gsap.timeline({
        onComplete: () => {
            // Finished -> Hide and Add permanent text
            setActive(false);
            if (onComplete) {
                const decs: Decoration[] = [{
                    id: `measure_final_${Date.now()}`,
                    type: 'TEXT',
                    text: `${Math.round(value)}°`,
                    x: lx,
                    y: ly,
                    stroke: ''
                }];
                onComplete(decs);
            }
        }
      });

      // --- PHASE 0: PENCIL APPEARS (Initial State) ---
      tl.set(pencilRef.current, { x: O.x, y: O.y, opacity: 1, rotation: 30 });
      tl.set('.virtual-protractor', { opacity: 0, scale: 0.9, rotation: baseRotation });
      
      // Wait a tiny bit to show pencil
      tl.to({}, { duration: 0.3 });

      // --- PHASE 1: SWAP PENCIL -> PROTRACTOR ---
      tl.to(pencilRef.current, { opacity: 0, y: "-=20", duration: 0.3 });
      tl.to('.virtual-protractor', { opacity: 1, scale: 1, duration: 0.5 }, "-=0.1");

      // --- PHASE 2: SWEEP EFFECT (0 -> Angle) ---
      tl.set(sweepArcRef.current, { rotation: 0, angle: 0, opacity: 0.6, fill: '#fcd34d' }); 
      
      const rayAngleTotal = baseRotation - value;
      const R = 155;
      const rayEnd = {
          x: O.x + Math.cos(rayAngleTotal * Math.PI / 180) * R,
          y: O.y + Math.sin(rayAngleTotal * Math.PI / 180) * R
      };
      tl.set(highlightRayRef.current, { points: [O.x, O.y, rayEnd.x, rayEnd.y], opacity: 0, stroke: '#ef4444' });

      // Animate Sweep
      tl.to(sweepArcRef.current, { 
          angle: -value, 
          duration: 1.0, 
          ease: "power1.inOut" 
      });

      // Show the ray
      tl.to(highlightRayRef.current, { opacity: 1, duration: 0.2 }, "-=0.2");

      // --- PHASE 3: BLINK ---
      const blinkCount = 3;
      for(let i=0; i<blinkCount; i++) {
          tl.to([highlightRayRef.current, sweepArcRef.current], { opacity: 0.2, duration: 0.2 });
          tl.to([highlightRayRef.current, sweepArcRef.current], { opacity: 0.8, duration: 0.2 });
      }

      // --- PHASE 4: SHOW RESULT AUTOMATICALLY ---
      tl.set(resultTextRef.current, { opacity: 0, scale: 0.5 });
      tl.to(resultTextRef.current, { opacity: 1, scale: 1.5, duration: 0.5, ease: "back.out" });

      // Wait 
      tl.to({}, { duration: 2.5 });

      // --- PHASE 5: SWAP BACK PROTRACTOR -> PENCIL ---
      // Fade out tools
      tl.to(['.virtual-protractor', highlightRayRef.current, sweepArcRef.current, resultTextRef.current], { 
          opacity: 0, 
          duration: 0.5 
      });
      
      // Pencil comes back (Reset pos first)
      tl.set(pencilRef.current, { x: O.x, y: O.y - 20 });
      tl.to(pencilRef.current, { opacity: 1, y: O.y, duration: 0.4 });
      
      // Short pause before finishing completely
      tl.to({}, { duration: 0.3 });

    }, 100);
  };

  const animationLayer = useMemo(() => {
    if (!active) return null;
    return (
      <Group>
        {/* ROTATED GROUP */}
        <Group x={toolPos.x} y={toolPos.y} rotation={toolPos.rotation}>
            <KonvaArc 
                ref={sweepArcRef}
                innerRadius={0}
                outerRadius={155}
                rotation={0}
                angle={0} 
                fill="#fcd34d" 
                opacity={0.6}
            />
        </Group>

        {/* Global Elements */}
        <KonvaLine ref={highlightRayRef} stroke="#ef4444" strokeWidth={3} lineCap="round" dash={[10, 5]} />

        {/* Protractor Tool */}
        <Group 
            name="virtual-protractor" 
            x={toolPos.x} 
            y={toolPos.y} 
            rotation={toolPos.rotation}
        >
             <VirtualProtractor x={0} y={0} rotation={0} />
        </Group>

        {/* Result Text */}
        <KonvaText
            ref={resultTextRef}
            x={labelPos.x - 25}
            y={labelPos.y - 15}
            text={`${Math.round(measuredAngle)}°`}
            fontSize={32}
            fontFamily="Arial"
            fontStyle="bold"
            fill="#dc2626"
            stroke="white"
            strokeWidth={4}
            fillAfterStrokeEnabled
            opacity={0}
            listening={false}
        />
        
        {/* Pencil (Initially and Finally visible) */}
        <VirtualPencil ref={pencilRef} x={origin.x} y={origin.y} opacity={0} isDrawing={false} />
      </Group>
    );
  }, [active, toolPos, measuredAngle, labelPos, origin]);

  return { play, animationLayer, isAnimating: active };
};
