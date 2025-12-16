
import { useState, useRef, useEffect } from 'react';
import { Point, CompassProps, RulerProps } from '../types';
import { getDistance, getBothCircleIntersections } from '../utils/math';

type ConstructionStep = 
  | 'IDLE' 
  | 'SELECT_P1' 
  | 'SELECT_P2' 
  | 'ANIMATE_COMPASS_TO_P1' 
  | 'DRAW_ARC_1' 
  | 'ANIMATE_COMPASS_TO_P2' 
  | 'DRAW_ARC_2' 
  | 'SHOW_RULER' 
  | 'DRAW_BISECTOR'
  | 'COMPLETE';

interface UsePerpendicularBisectorProps {
  addPoint: (x: number, y: number) => Point;
  addLine: (p1: Point, p2: Point, dashed?: boolean) => void;
  addArc: (center: Point, radius: number, start: number, end: number) => void;
}

export const usePerpendicularBisector = ({ addPoint, addLine, addArc }: UsePerpendicularBisectorProps) => {
  const [status, setStatus] = useState<ConstructionStep>('IDLE');
  
  // Internal state for the construction process
  const selectionRef = useRef<Point[]>([]);
  const intersectionsRef = useRef<[Point, Point] | null>(null);

  // Virtual Tool States
  const [compass, setCompass] = useState<CompassProps>({
    visible: false,
    x: 0,
    y: 0,
    radius: 50,
    rotation: 0,
    isDrawing: false,
  });

  const [ruler, setRuler] = useState<RulerProps>({
    visible: false,
    p1: { x: 0, y: 0 },
    p2: { x: 0, y: 0 },
    opacity: 0,
  });

  // Reset tool state
  const resetTool = () => {
    setStatus('IDLE');
    selectionRef.current = [];
    intersectionsRef.current = null;
    setCompass(prev => ({ ...prev, visible: false }));
    setRuler(prev => ({ ...prev, visible: false }));
  };

  const activate = () => {
    setStatus('SELECT_P1');
  };

  const handleCanvasClick = (x: number, y: number) => {
    if (status === 'SELECT_P1') {
      const p1 = addPoint(x, y);
      selectionRef.current = [p1];
      setStatus('SELECT_P2');
    } else if (status === 'SELECT_P2') {
      const p2 = addPoint(x, y);
      selectionRef.current.push(p2);
      
      // Start construction sequence
      startConstructionAnimation();
    }
  };

  const startConstructionAnimation = () => {
    const [p1, p2] = selectionRef.current;
    const dist = getDistance(p1, p2);
    // Radius must be > dist/2. Let's do 0.6 * dist
    const radius = dist * 0.6; 

    // Calculate intersections now so we have them ready
    const intersections = getBothCircleIntersections(p1, radius, p2, radius);
    if (!intersections) {
        alert("Error in calculation");
        resetTool();
        return;
    }
    intersectionsRef.current = intersections;

    // --- SEQ 1: Move Compass to P1 ---
    setStatus('ANIMATE_COMPASS_TO_P1');
    setCompass({
      visible: true,
      x: p1.x,
      y: p1.y,
      radius: radius,
      rotation: 0,
      isDrawing: false
    });

    // --- SEQ 2: Draw Arc 1 (after delay) ---
    setTimeout(() => {
      setStatus('DRAW_ARC_1');
      // Animate rotation 
      animateCompassArc(p1, radius, 0, 360, () => {
        // Commit Arc 1 to main geometry state
        addArc(p1, radius, 0, 360);
        
        // --- SEQ 3: Move Compass to P2 ---
        setStatus('ANIMATE_COMPASS_TO_P2');
        setCompass(prev => ({
           ...prev,
           x: p2.x,
           y: p2.y,
           rotation: 0,
           isDrawing: false
        }));

        // --- SEQ 4: Draw Arc 2 ---
        setTimeout(() => {
            setStatus('DRAW_ARC_2');
            animateCompassArc(p2, radius, 0, 360, () => {
                // Commit Arc 2
                addArc(p2, radius, 0, 360);
                
                // Hide Compass
                setCompass(prev => ({ ...prev, visible: false }));

                // --- SEQ 5: Show Ruler ---
                const [int1, int2] = intersectionsRef.current!;
                setStatus('SHOW_RULER');
                setRuler({
                    visible: true,
                    p1: int1,
                    p2: int2,
                    opacity: 0
                });

                // Fade in ruler
                setTimeout(() => {
                    setRuler(prev => ({ ...prev, opacity: 1 }));
                    
                    // --- SEQ 6: Draw Line ---
                    setTimeout(() => {
                        setStatus('DRAW_BISECTOR');
                        addLine(int1, int2, true); // Dashed bisector line

                        // --- SEQ 7: Finish ---
                        setTimeout(() => {
                            setRuler(prev => ({ ...prev, visible: false }));
                            setStatus('COMPLETE');
                            // Optional: Reset to IDLE or stay in complete
                            setTimeout(() => resetTool(), 1000);
                        }, 1000);
                    }, 800);
                }, 100);
            });
        }, 800); // Delay before starting Arc 2
      });
    }, 800); // Delay before starting Arc 1
  };

  // Helper to animate compass rotation
  const animateCompassArc = (center: Point, radius: number, startAng: number, endAng: number, onComplete: () => void) => {
    let currentAng = startAng;
    const speed = 15; // degrees per frame roughly

    const step = () => {
        currentAng += speed;
        if (currentAng >= endAng) {
            currentAng = endAng;
            setCompass(prev => ({ ...prev, rotation: currentAng, isDrawing: false }));
            onComplete();
        } else {
            setCompass(prev => ({ ...prev, rotation: currentAng, isDrawing: true }));
            requestAnimationFrame(step);
        }
    };
    step();
  };

  return {
    status,
    activate,
    handleCanvasClick,
    compassProps: compass,
    rulerProps: ruler,
    reset: resetTool
  };
};
