
import React, { useRef, useState, useMemo } from 'react';
import { Group, Line as KonvaLine } from 'react-konva';
import gsap from 'gsap';
import { Point2D, Decoration } from '../types';
import { getProjectedPoint, getLineAngle, normalizeVector, subtractVectors, getDistance } from '../utils/math';
import VirtualEke from '../components/Tools/VirtualEke';
import VirtualPencil from '../components/Tools/VirtualPencil';

export const usePerpendicularEkeAnimation = () => {
  const [active, setActive] = useState(false);
  
  const ekeRef = useRef<any>(null);
  const pencilRef = useRef<any>(null);
  const resultLineRef = useRef<any>(null);
  const symbolRef = useRef<any>(null);

  const play = (lineStart: Point2D, lineEnd: Point2D, M: Point2D, onComplete?: (H: Point2D, decorations: Decoration[]) => void) => {
    setActive(true);

    // 1. Math
    const H = getProjectedPoint(lineStart, lineEnd, M);
    const lineAngle = getLineAngle(lineStart, lineEnd);
    
    // Determine Eke orientation
    const vecL = normalizeVector(subtractVectors(lineEnd, lineStart));
    const vecM = subtractVectors(M, lineStart);
    const cross = vecL.x * vecM.y - vecL.y * vecM.x;
    
    // Konva Y is Down.
    // Cross > 0: M is "Below/Left". Normal Eke points Down. scaleY=1.
    // Cross < 0: M is "Above/Right". Eke needs to point Up. scaleY=-1.
    const scaleY = cross > 0 ? 1 : -1;
    
    // Start Slide Position: Some distance before H along the line
    const slideDist = 200;
    const startSlideX = H.x - vecL.x * slideDist;
    const startSlideY = H.y - vecL.y * slideDist;

    // Right Angle Symbol
    const symSize = 15;
    const vecMH = normalizeVector(subtractVectors(H, M)); 
    const vecLineDir = vecL;
    
    const p1 = { x: H.x + vecMH.x * -symSize, y: H.y + vecMH.y * -symSize }; 
    const p2 = { x: p1.x + vecLineDir.x * symSize, y: p1.y + vecLineDir.y * symSize };
    const p3 = { x: H.x + vecLineDir.x * symSize, y: H.y + vecLineDir.y * symSize };
    const raPoints = [p1.x, p1.y, p2.x, p2.y, p3.x, p3.y];

    setTimeout(() => {
        // --- SAFETY CHECK TO FIX GSAP ERROR ---
        if (!ekeRef.current || !pencilRef.current) {
            // Component likely unmounted or refs not ready
            return;
        }

        const tl = gsap.timeline({
            defaults: { ease: "power2.inOut" },
            onComplete: () => {
                const decs: Decoration[] = [{
                    id: `ra_eke_${Date.now()}`,
                    type: 'RIGHT_ANGLE',
                    points: [H.x, H.y, p3.x, p3.y, p2.x, p2.y, p1.x, p1.y],
                    stroke: '#ef4444'
                }];
                setActive(false);
                if (onComplete) onComplete(H, decs);
            }
        });

        // 1. Eke Appears at M (Unaligned) - User puts tool on paper
        tl.set(ekeRef.current, { 
            x: M.x, 
            y: M.y, 
            rotation: 0, 
            scaleY: scaleY, 
            opacity: 0,
            scale: 0.8
        });
        
        tl.to(ekeRef.current, { opacity: 1, scale: 1, duration: 0.5 });

        // 2. Align to Line (Move & Rotate) - "Di chuyển sao cho cạnh thước trùng với đoạn thẳng"
        tl.to(ekeRef.current, {
            x: startSlideX,
            y: startSlideY,
            rotation: lineAngle,
            duration: 1.2,
            ease: "back.out(0.8)"
        });

        // Pause briefly to show it's aligned
        tl.to({}, { duration: 0.3 });

        // 3. Slide to H (Checking M)
        tl.to(ekeRef.current, {
            x: H.x,
            y: H.y,
            duration: 1.5,
            ease: "sine.inOut"
        });

        // 4. Pencil Draw M -> H
        tl.set(pencilRef.current, { x: M.x, y: M.y, rotation: 30, opacity: 0 });
        tl.to(pencilRef.current, { opacity: 1, duration: 0.3 });

        const distMH = getDistance(M, H);
        tl.set(resultLineRef.current, { points: [M.x, M.y, H.x, H.y], dash: [distMH, distMH], dashOffset: distMH, opacity: 1 });
        
        tl.to(pencilRef.current, { x: H.x, y: H.y, duration: 1.0 });
        tl.to(resultLineRef.current, { dashOffset: 0, duration: 1.0 }, "<");

        // 5. Cleanup
        tl.to([ekeRef.current, pencilRef.current], { opacity: 0, duration: 0.5 });
        
        // Symbol
        tl.set(symbolRef.current, { points: raPoints, opacity: 0, stroke: '#ef4444', strokeWidth: 2 });
        tl.to(symbolRef.current, { opacity: 1, duration: 0.5 });

    }, 50);
  };

  const animationLayer = useMemo(() => {
    if (!active) return null;
    return (
        <Group>
            {/* Eke (Set Square) */}
            <VirtualEke ref={ekeRef} isAnimating={true} />

            <KonvaLine ref={resultLineRef} stroke="black" strokeWidth={2} lineCap="round" />
            <KonvaLine ref={symbolRef} />

            <VirtualPencil ref={pencilRef} x={0} y={0} isDrawing={true} opacity={0} />
        </Group>
    );
  }, [active]);

  return { play, animationLayer, isAnimating: active };
};
