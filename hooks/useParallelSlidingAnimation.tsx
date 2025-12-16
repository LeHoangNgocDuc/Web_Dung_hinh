
import React, { useRef, useState, useMemo } from 'react';
import { Group, Line as KonvaLine, Circle as KonvaCircle } from 'react-konva';
import gsap from 'gsap';
import { Point2D } from '../types';
import { getProjectedPoint, getLineAngle, normalizeVector, subtractVectors, getDistance } from '../utils/math';
import VirtualEke from '../components/Tools/VirtualEke';
import VirtualRuler from '../components/Tools/VirtualRuler';
import VirtualPencil from '../components/Tools/VirtualPencil';

export const useParallelSlidingAnimation = () => {
  const [active, setActive] = useState(false);

  const ekeRef = useRef<any>(null);   // Drawing Tool (Slider)
  const railRef = useRef<any>(null);  // Guide Tool (Rail)
  const pencilRef = useRef<any>(null);
  const resultLineRef = useRef<any>(null);
  const pinRef = useRef<any>(null);   // "Lock" visual

  const play = (lineStart: Point2D, lineEnd: Point2D, M: Point2D, onComplete?: (startP: Point2D, endP: Point2D) => void) => {
    setActive(true);

    // --- MATH PREPARATION ---
    
    // 1. Base Vectors
    const vecD = subtractVectors(lineEnd, lineStart); // Vector of line d
    const unitD = normalizeVector(vecD); // Unit vector of d
    
    const vecStartToM = subtractVectors(M, lineStart);
    
    // 2. Cross Product to determine side of M relative to d
    // Cross Z = x1*y2 - x2*y1
    // In screen coords (Y down): 
    // If Cross > 0: M is "Left/Down" relative to vector d. 
    // If Cross < 0: M is "Right/Up" relative to vector d.
    const crossVal = unitD.x * vecStartToM.y - unitD.y * vecStartToM.x;
    
    // 3. Eke Orientation
    // Standard Eke: Leg 2 (Horizontal 0->180) is the Drawing Edge.
    // Leg 1 (Vertical 0->280) is the Rail Edge.
    // We align Leg 2 with Line d.
    const angleD = getLineAngle(lineStart, lineEnd);
    
    // Determine scaleY.
    // Default Eke (scaleY=1): Leg 1 points +90deg (down in Konva) relative to Leg 2.
    // If M is on the "positive" cross side (Cross > 0), Leg 1 points to M naturally.
    // If M is on "negative" side (Cross < 0), we need to flip Eke (scaleY = -1).
    const scaleY = crossVal > 0 ? 1 : -1;
    
    // 4. Slide Calculation
    // We slide perpendicular to d, towards M.
    // H is the projection of M onto d.
    const H = getProjectedPoint(lineStart, lineEnd, M);
    
    // Slide vector is exactly M - H
    const vecSlide = subtractVectors(M, H);
    
    // 5. Initial Positions
    // Place Eke such that Leg 2 is on d.
    // To ensure Leg 2 covers the projection H, we shift Eke along d.
    // Eke Leg 2 is length ~180. Let's position origin (corner) so H is roughly in the middle.
    // Eke origin is at (0,0). Leg 2 goes along local +X.
    // So we want H to correspond to local x ~= 90.
    // Global Pos = H - 90 * unitD
    const ekeOffsetAlongD = 90; 
    const startEkePos = {
        x: H.x - unitD.x * ekeOffsetAlongD,
        y: H.y - unitD.y * ekeOffsetAlongD
    };
    
    // End Position (Slided)
    // Simply add the slide vector
    const endEkePos = {
        x: startEkePos.x + vecSlide.x,
        y: startEkePos.y + vecSlide.y
    };

    // 6. Rail (Ruler) Position
    // Rail must align with Leg 1 of Eke at Start Position.
    // Leg 1 starts at startEkePos. 
    // Angle of Leg 1 = angleD + 90 (if scaleY=1) or angleD - 90 (if scaleY=-1).
    const railRotation = angleD + (scaleY === 1 ? 90 : -90);
    
    // PIN Position: Place it slightly along the ruler so it doesn't obscure the corner
    // Vector of Rail is perpendicular to d.
    const vecRail = { x: -unitD.y * scaleY, y: unitD.x * scaleY }; // Rotate unitD 90 deg scaled
    const pinOffset = 60;
    const pinPos = {
        x: startEkePos.x + vecRail.x * pinOffset,
        y: startEkePos.y + vecRail.y * pinOffset
    };

    setTimeout(() => {
        // Safety check
        if (!ekeRef.current || !railRef.current) return;

        const tl = gsap.timeline({
            defaults: { ease: "power2.inOut" },
            onComplete: () => {
                setActive(false);
                // Define the parallel line segment for the app to render permanently
                const ext = 300;
                // Result line passes through M, parallel to d
                const pStart: Point2D = { id: `p_s_${Date.now()}`, x: M.x - unitD.x * ext, y: M.y - unitD.y * ext };
                const pEnd: Point2D = { id: `p_e_${Date.now()}`, x: M.x + unitD.x * ext, y: M.y + unitD.y * ext };
                if (onComplete) onComplete(pStart, pEnd);
            }
        });

        // --- PHASE 1: ALIGN DRAWING TOOL (EKE) ---
        // Eke appears on line d
        tl.set(ekeRef.current, { 
            x: startEkePos.x, 
            y: startEkePos.y, 
            rotation: angleD, 
            scaleY: scaleY, 
            opacity: 0,
            scale: 0.8
        });
        tl.to(ekeRef.current, { opacity: 1, scale: 1, duration: 0.8 });

        // --- PHASE 2: ALIGN GUIDE TOOL (RAIL) ---
        // Rail appears along the vertical leg.
        // KEY FIX: Apply scaleY to rail as well so its body flips outward, preventing overlap.
        tl.set(railRef.current, { 
            x: startEkePos.x, 
            y: startEkePos.y, 
            rotation: railRotation, 
            scaleY: scaleY,
            opacity: 0,
            scaleX: 0.95 
        });
        // Slight delay to simulate picking up second tool
        tl.to(railRef.current, { opacity: 1, scaleX: 1, duration: 0.8 });

        // --- PHASE 3: LOCK ---
        // Show visual pin to indicate Rail is fixed
        tl.set(pinRef.current, { x: pinPos.x, y: pinPos.y, scale: 0, opacity: 1 });
        tl.to(pinRef.current, { scale: 1, duration: 0.3, ease: "back.out(2)" });
        
        // Optional: Flash rail to show "Active/Locked" state
        // Use a slight brightness filter or just specific scale bounce
        tl.to(railRef.current, { scaleX: 1.02, duration: 0.1, yoyo: true, repeat: 1 });

        // --- PHASE 4: SLIDE ---
        // Rail stays. Eke moves to EndPos.
        tl.to(ekeRef.current, {
            x: endEkePos.x,
            y: endEkePos.y,
            duration: 2.0,
            ease: "power2.inOut" // Smooth slide
        });

        // --- PHASE 5: DRAW ---
        // Pencil appears at M (or actually start of drawing segment on the Eke's edge)
        const drawLen = 400;
        const pDrawStart: Point2D = { id: 'temp_start', x: M.x - unitD.x * (drawLen/2), y: M.y - unitD.y * (drawLen/2) };
        const pDrawEnd: Point2D = { id: 'temp_end', x: M.x + unitD.x * (drawLen/2), y: M.y + unitD.y * (drawLen/2) };
        
        tl.set(pencilRef.current, { x: pDrawStart.x, y: pDrawStart.y, rotation: 30, opacity: 0 });
        tl.to(pencilRef.current, { opacity: 1, duration: 0.3 });
        
        // Setup Line
        const dist = getDistance(pDrawStart, pDrawEnd);
        tl.set(resultLineRef.current, { 
            points: [pDrawStart.x, pDrawStart.y, pDrawEnd.x, pDrawEnd.y], 
            dash: [dist, dist], 
            dashOffset: dist, 
            opacity: 1 
        });
        
        // Draw action
        tl.to(pencilRef.current, { x: pDrawEnd.x, y: pDrawEnd.y, duration: 1.5, ease: "none" });
        tl.to(resultLineRef.current, { dashOffset: 0, duration: 1.5, ease: "none" }, "<");

        // --- PHASE 6: CLEANUP ---
        // Hide Rail (First), Then Slider, Then Pencil
        tl.to(railRef.current, { opacity: 0, x: "-=20", duration: 0.4 });
        tl.to(pinRef.current, { opacity: 0, scale: 0, duration: 0.3 }, "<");
        
        tl.to(ekeRef.current, { opacity: 0, x: "+=20", duration: 0.4 }, "-=0.2");
        tl.to(pencilRef.current, { opacity: 0, duration: 0.4 }, "-=0.2");

    }, 50);
  };

  const animationLayer = useMemo(() => {
    if (!active) return null;
    return (
        <Group>
            {/* Layer 0: Result Line (rendered incrementally) */}
            <KonvaLine ref={resultLineRef} stroke="black" strokeWidth={2} lineCap="round" />

            {/* Layer 2: Guide Ruler (Rail) - Bottom */}
            <Group ref={railRef} listening={false} opacity={0}>
                 {/* Rail Variant Ruler */}
                 <VirtualRuler x={0} y={0} rotation={0} length={400} variant="rail" />
            </Group>

            {/* Layer 3: Visual Pin/Lock */}
            <KonvaCircle 
                ref={pinRef} 
                radius={8} 
                fill="#dc2626" 
                stroke="white" 
                strokeWidth={2} 
                shadowBlur={2} 
                opacity={0} 
            />

            {/* Layer 4: Drawing Tool (Eke) - Top */}
            <VirtualEke ref={ekeRef} isAnimating={true} />

            {/* Layer 5: Pencil */}
            <VirtualPencil ref={pencilRef} x={0} y={0} isDrawing={true} opacity={0} />
        </Group>
    );
  }, [active]);

  return { play, animationLayer, isAnimating: active };
};
