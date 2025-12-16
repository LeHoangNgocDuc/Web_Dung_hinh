
import React, { useState, useRef, useEffect } from 'react';
import { Layer, Circle as KonvaCircle, Line as KonvaLine, Text as KonvaText, Arc as KonvaArc } from 'react-konva';
// Toolbar removed
import StageCanvas from './components/StageCanvas';
import LessonSidebar from './components/LessonSidebar';
import ColorPicker from './components/ColorPicker';
import { Point2D, LineSegment, ToolType, ToolStep, Decoration, Lesson, Circle } from './types';
import { COLOR_HIGHLIGHT, PIXELS_PER_CM } from './constants';
import { useSnap } from './hooks/useSnap';
import { useDrawSegmentAnimation } from './hooks/useDrawSegmentAnimation';
import { useDrawFixedLengthAnimation } from './hooks/useDrawFixedLengthAnimation';
import { useIsoscelesTriangleAnimation } from './hooks/useIsoscelesTriangleAnimation';
import { useEquilateralTriangleAnimation } from './hooks/useEquilateralTriangleAnimation';
import { useMidpointAnimation } from './hooks/useMidpointAnimation';
import { usePerpendicularBisectorAnimation } from './hooks/usePerpendicularBisectorAnimation';
import { useQuadrilateralAnimation } from './hooks/useQuadrilateralAnimation';
import { useAngleBisectorAnimation } from './hooks/useAngleBisectorAnimation';
import { useParallelogramAnimation } from './hooks/useParallelogramAnimation';
// New Hooks
import { useDrawRayAnimation } from './hooks/useDrawRayAnimation';
import { useDrawLineAnimation } from './hooks/useDrawLineAnimation';
import { useMeasureAngleAnimation } from './hooks/useMeasureAngleAnimation';
import { useDrawAngleAnimation } from './hooks/useDrawAngleAnimation';
import { useRightTriangleAnimation } from './hooks/useRightTriangleAnimation';
import { usePerpendicularEkeAnimation } from './hooks/usePerpendicularEkeAnimation';
import { useParallelSlidingAnimation } from './hooks/useParallelSlidingAnimation';
import { useTangentFromPointAnimation } from './hooks/useTangentFromPointAnimation';

// Tools
import VirtualRuler from './components/Tools/VirtualRuler';
import VirtualEke from './components/Tools/VirtualEke';
import VirtualCompass from './components/Tools/VirtualCompass';
import VirtualPencil from './components/Tools/VirtualPencil';
import VirtualProtractor from './components/Tools/VirtualProtractor'; // Import Protractor
import { getDistance, getLineAngle, getClosestPointOnCircle } from './utils/math';

// Initial Mock Data
const INITIAL_POINTS: Point2D[] = [
  { id: 'p1', x: 200, y: 300, label: 'B' },
  { id: 'p2', x: 500, y: 400, label: 'C' },
];
const INITIAL_LINES: LineSegment[] = [];

const SIDEBAR_WIDTH = 256; 
const HEADER_HEIGHT = 140; // Increased height for bold centered layout

const App: React.FC = () => {
  const [tool, setTool] = useState<ToolType>(ToolType.SELECT);
  const [step, setStep] = useState<ToolStep>(ToolStep.IDLE);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  
  const [points, setPoints] = useState<Point2D[]>(INITIAL_POINTS);
  const [lines, setLines] = useState<LineSegment[]>(INITIAL_LINES);
  const [decorations, setDecorations] = useState<Decoration[]>([]);
  // Store circles for rendering static circles
  const [circles, setCircles] = useState<Circle[]>([]);
  
  // Coloring State
  const [activeColor, setActiveColor] = useState<string>('#000000');
  const [recentColors, setRecentColors] = useState<string[]>([]);

  // Interaction State
  const [firstPoint, setFirstPoint] = useState<Point2D | null>(null);
  const [secondPoint, setSecondPoint] = useState<Point2D | null>(null); 
  // For multi-step tools like Quadrilateral
  const [tempPoints, setTempPoints] = useState<Point2D[]>([]);

  // Raw cursor position (World Coordinates)
  const [rawCursorPos, setRawCursorPos] = useState<Point2D>({ id: 'cursor', x: 0, y: 0 });
  const [stageScale, setStageScale] = useState<number>(1);
  
  // Window Dimensions State
  const [dimensions, setDimensions] = useState({ 
    width: window.innerWidth - SIDEBAR_WIDTH, 
    height: window.innerHeight - HEADER_HEIGHT
  });

  // Modal State for Inputs
  const [showInputModal, setShowInputModal] = useState(false);
  const [inputVal, setInputVal] = useState<string>('');
  const [inputType, setInputType] = useState<'LENGTH' | 'ANGLE'>('LENGTH');

  const stageRef = useRef<any>(null);

  // Animation Hooks
  const { play: playSegmentAnim, animationLayer: segmentAnimLayer, isAnimating: isSegmentAnim } = useDrawSegmentAnimation();
  const { play: playFixedAnim, animationLayer: fixedAnimLayer, isAnimating: isFixedAnim } = useDrawFixedLengthAnimation();
  const { play: playIsoAnim, animationLayer: isoAnimLayer, isAnimating: isIsoAnim } = useIsoscelesTriangleAnimation();
  const { play: playEquilateralAnim, animationLayer: equiAnimLayer, isAnimating: isEquiAnim } = useEquilateralTriangleAnimation();
  const { play: playMidpointAnim, animationLayer: midAnimLayer, isAnimating: isMidAnim } = useMidpointAnimation();
  const { play: playPerpBisectorAnim, animationLayer: perpBisectorAnimLayer, isAnimating: isPerpBisectorAnim } = usePerpendicularBisectorAnimation();
  const { play: playAngleBisectorAnim, animationLayer: angleBisectorAnimLayer, isAnimating: isAngleBisectorAnim } = useAngleBisectorAnimation();
  const { play: playQuadAnim, animationLayer: quadAnimLayer, isAnimating: isQuadAnim } = useQuadrilateralAnimation();
  const { play: playParaAnim, animationLayer: paraAnimLayer, isAnimating: isParaAnim } = useParallelogramAnimation();
  
  const { play: playRayAnim, animationLayer: rayAnimLayer, isAnimating: isRayAnim } = useDrawRayAnimation();
  const { play: playLineAnim, animationLayer: lineAnimLayer, isAnimating: isLineAnim } = useDrawLineAnimation();
  const { play: playMeasureAnim, animationLayer: measureAnimLayer, isAnimating: isMeasureAnim } = useMeasureAngleAnimation();
  const { play: playDrawAngleAnim, animationLayer: drawAngleAnimLayer, isAnimating: isDrawAngleAnim } = useDrawAngleAnimation();

  // Grade 7 Advanced Hooks
  const { 
      playConstruction: playRightTriConstruction, 
      playFinalize: playRightTriFinalize,
      animationLayer: rightTriLayer, 
      isAnimating: isRightTri,
      tempCircle: rightTriCircle 
  } = useRightTriangleAnimation();
  
  const { play: playPerpEke, animationLayer: perpEkeLayer, isAnimating: isPerpEke } = usePerpendicularEkeAnimation();
  const { play: playParaSlide, animationLayer: paraSlideLayer, isAnimating: isParaSlide } = useParallelSlidingAnimation();
  
  // Grade 9 Hooks
  const { play: playTangent, animationLayer: tangentLayer, isAnimating: isTangent } = useTangentFromPointAnimation();

  // Combine animation states
  const isGlobalAnimating = isSegmentAnim || isFixedAnim || isIsoAnim || isEquiAnim || isMidAnim || isPerpBisectorAnim || 
                            isAngleBisectorAnim || isQuadAnim || isParaAnim || 
                            isRayAnim || isLineAnim || isMeasureAnim || isDrawAngleAnim || 
                            (isRightTri && step === ToolStep.ANIMATING) || isPerpEke || isParaSlide || isTangent;

  // Handle Resize accounting for Sidebar
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ 
        width: window.innerWidth - SIDEBAR_WIDTH, 
        height: window.innerHeight - HEADER_HEIGHT
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Use the custom hook for snapping logic
  const shouldSnap = !isGlobalAnimating && 
                     step !== ToolStep.SETTING_RADIUS && 
                     step !== ToolStep.PICKING_POINT_ON_CIRCLE;

  const snapInfo = useSnap(rawCursorPos, points, lines, stageScale, shouldSnap);

  // The effective cursor position logic
  let activeCursorPos = snapInfo ? snapInfo.point : rawCursorPos;
  
  // Special Snapping Logic for Lesson 6 (Circle Snap)
  if (tool === ToolType.RIGHT_TRIANGLE && step === ToolStep.PICKING_POINT_ON_CIRCLE && rightTriCircle) {
      // Snap to the virtual circle constructed by the hook
      const dist = getDistance(rawCursorPos, rightTriCircle.center);
      // Allow snapping if within reasonable distance of circumference
      const threshold = 30; 
      if (Math.abs(dist - rightTriCircle.radius) < threshold) {
          activeCursorPos = getClosestPointOnCircle(rightTriCircle.center, rightTriCircle.radius, rawCursorPos);
      }
  }

  // Adjusted Mouse Move
  const handleMouseMove = (e: any) => {
    const stage = e.target.getStage();
    if (!stage) return;
    
    if (stage.scaleX() !== stageScale) {
        setStageScale(stage.scaleX());
    }

    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    
    const relativePos = transform.point(pointer);
    setRawCursorPos({ id: 'cursor', x: relativePos.x, y: relativePos.y });
  };

  // ============================================
  // DRAG & DROP HANDLERS (UPDATED)
  // ============================================
  
  const handlePointDragMove = (e: any) => {
    const id = e.target.id();
    const newX = e.target.x();
    const newY = e.target.y();

    // 1. Update Point State
    setPoints(prevPoints => 
        prevPoints.map(p => p.id === id ? { ...p, x: newX, y: newY } : p)
    );

    // 2. Sync Lines connected to this point
    setLines(prevLines => 
        prevLines.map(line => {
            let newLine = { ...line };
            if (line.startId === id) {
                newLine.start = { ...newLine.start, x: newX, y: newY };
            }
            if (line.endId === id) {
                newLine.end = { ...newLine.end, x: newX, y: newY };
            }
            return newLine;
        })
    );

    // 3. Sync Circles connected to this point (as center)
    setCircles(prevCircles => 
        prevCircles.map(c => {
             // Check if this point is the center of the circle (by ID reference logic)
             // We need to assume a property centerId exists or match by object ref (less reliable)
             // For now, let's look for circles whose center matches the OLD position, or if we stored ID.
             // Best way: Use ID. I updated types to allow centerId.
             
             // If we don't have centerId, we just match coordinates (simple heuristic)
             const matchesCenter = c.centerId === id || (Math.abs(c.center.x - e.target.attrs.x) < 0.1 && Math.abs(c.center.y - e.target.attrs.y) < 0.1); 
             // Note: e.target.attrs.x is the OLD value before drag move finished? No, it's current.
             // Actually, simplest is if we attached IDs to circles when creating them.
             
             if (c.center.id === id) {
                 return { ...c, center: { ...c.center, x: newX, y: newY } };
             }
             return c;
        })
    );
  };

  // Handle dragging ONLY the label
  const handleLabelDragEnd = (e: any, pointId: string) => {
      const newLabelX = e.target.x();
      const newLabelY = e.target.y();
      
      setPoints(prevPoints => 
        prevPoints.map(p => {
            if (p.id !== pointId) return p;
            
            // Calculate offset relative to the point's current position
            const offsetX = newLabelX - p.x;
            const offsetY = newLabelY - p.y;
            
            return {
                ...p,
                labelOffset: { x: offsetX, y: offsetY }
            };
        })
      );
  };

  const handleDecorationDragEnd = (e: any) => {
    const id = e.target.id();
    const newX = e.target.x();
    const newY = e.target.y();

    setDecorations(prev => 
        prev.map(d => d.id === id ? { ...d, x: newX, y: newY } : d)
    );
  };

  const handleCursorStyle = (e: any, type: 'enter' | 'leave') => {
      if (tool === ToolType.SELECT) {
          const container = e.target.getStage().container();
          container.style.cursor = type === 'enter' ? 'move' : 'default';
      }
  };

  // ============================================

  const handleToolChange = (newTool: ToolType) => {
      setTool(newTool);
      setStep(ToolStep.IDLE);
      setFirstPoint(null);
      setSecondPoint(null);
      setTempPoints([]);
      setShowInputModal(false);
      // Deselect lesson if a manual tool is picked
      // setActiveLesson(null); // Optional: depends on UX preference
  };

  const handleColorChange = (color: string) => {
      setActiveColor(color);
      
      // Update recent colors (keep top 8)
      setRecentColors(prev => {
          const filtered = prev.filter(c => c !== color);
          return [color, ...filtered].slice(0, 8);
      });
  };

  const handleLessonSelect = (lesson: Lesson) => {
    setActiveLesson(lesson);
    setPoints([]);
    setLines([]);
    setDecorations([]);
    setCircles([]);
    setFirstPoint(null);
    setSecondPoint(null);
    setTempPoints([]);
    setStep(ToolStep.IDLE);
    setShowInputModal(false);
    
    const toolMap: Record<string, ToolType> = {
        'LINE': ToolType.LINE,
        'FIXED_LENGTH_LINE': ToolType.FIXED_LENGTH_LINE,
        'RAY': ToolType.RAY,
        'INFINITE_LINE': ToolType.INFINITE_LINE,
        'MEASURE_ANGLE': ToolType.MEASURE_ANGLE,
        'DRAW_ANGLE': ToolType.DRAW_ANGLE,
        'ISOSCELES_TRIANGLE': ToolType.ISOSCELES_TRIANGLE,
        'EQUILATERAL_TRIANGLE': ToolType.EQUILATERAL_TRIANGLE,
        'MIDPOINT': ToolType.MIDPOINT,
        'PERPENDICULAR_BISECTOR': ToolType.PERPENDICULAR_BISECTOR,
        'ANGLE_BISECTOR': ToolType.ANGLE_BISECTOR,
        'QUADRILATERAL': ToolType.QUADRILATERAL,
        'PARALLELOGRAM': ToolType.PARALLELOGRAM,
        'RIGHT_TRIANGLE': ToolType.RIGHT_TRIANGLE,
        'PERPENDICULAR_EKE': ToolType.PERPENDICULAR_EKE,
        'PARALLEL_SLIDING': ToolType.PARALLEL_SLIDING,
        'TANGENT_FROM_POINT': ToolType.TANGENT_FROM_POINT,
        'SELECT': ToolType.SELECT
    };

    setTool(toolMap[lesson.toolId] || ToolType.SELECT);
  };

  const handleStageClick = () => {
    if (isGlobalAnimating || showInputModal) return;

    // --- TOOL: POINT ---
    if (tool === ToolType.POINT) {
      const newPoint: Point2D = {
        id: `p${Date.now()}`,
        x: activeCursorPos.x,
        y: activeCursorPos.y,
        label: `P${points.length + 1}`,
        color: activeColor
      };
      setPoints([...points, newPoint]);
    }

    // --- TOOL: TANGENT FROM POINT (Grade 9) ---
    if (tool === ToolType.TANGENT_FROM_POINT) {
        // Step 1: Pick Center O
        if (step === ToolStep.IDLE || step === ToolStep.PICKING_FIRST) {
             const p1 = snapInfo?.type === 'point' ? snapInfo.point : { id: `p_O_${Date.now()}`, x: activeCursorPos.x, y: activeCursorPos.y, label: 'O', color: activeColor };
             if (!snapInfo?.type) setPoints(prev => [...prev, p1]);
             setFirstPoint(p1);
             setStep(ToolStep.SETTING_RADIUS);
        } 
        // Step 2: Set Radius (Click to define Circle O)
        else if (step === ToolStep.SETTING_RADIUS && firstPoint) {
            const radius = getDistance(firstPoint, activeCursorPos);
            if (radius < 20) return; // Minimum size
            
            // Add Circle with centerId ref for better moving
            setCircles(prev => [...prev, { id: `c_base_${Date.now()}`, center: firstPoint, centerId: firstPoint.id, radius, color: activeColor }]);
            setSecondPoint({ x: radius, y: 0, id: 'radius_val' }); // Hack to store radius
            setStep(ToolStep.PICKING_THIRD);
        }
        // Step 3: Pick Point M (Outside)
        else if (step === ToolStep.PICKING_THIRD && firstPoint && secondPoint) {
            const M = snapInfo?.type === 'point' ? snapInfo.point : { id: `p_M_${Date.now()}`, x: activeCursorPos.x, y: activeCursorPos.y, label: 'M', color: activeColor };
            
            // Validate M is outside
            const radius = secondPoint.x;
            if (getDistance(firstPoint, M) <= radius) {
                alert("Điểm M phải nằm ngoài đường tròn (O)!");
                return;
            }

            if (!snapInfo?.type) setPoints(prev => [...prev, M]);
            
            setStep(ToolStep.ANIMATING);
            playTangent(firstPoint, radius, M, (A, B, decs) => {
                const ptA = { ...A, id: `p_A_${Date.now()}`, label: 'A', color: activeColor };
                const ptB = { ...B, id: `p_B_${Date.now()}`, label: 'B', color: activeColor };
                setPoints(prev => [...prev, ptA, ptB]);
                
                // Add Tangent Lines (Rays actually)
                // We draw segments for now based on animation visual
                // Actually let's make them Rays starting at M passing through A/B
                const rayMA: LineSegment = { id: `l_ma_${Date.now()}`, startId: M.id, endId: ptA.id, start: M, end: ptA, type: 'ray', color: activeColor };
                const rayMB: LineSegment = { id: `l_mb_${Date.now()}`, startId: M.id, endId: ptB.id, start: M, end: ptB, type: 'ray', color: activeColor };
                
                // Add Radius lines (dashed usually, but let's make them segments)
                const radOA: LineSegment = { id: `l_oa_${Date.now()}`, startId: firstPoint.id, endId: ptA.id, start: firstPoint, end: ptA, type: 'segment', color: '#ef4444' }; // Red dashed look via styling handled in render if needed, but standard for now
                const radOB: LineSegment = { id: `l_ob_${Date.now()}`, startId: firstPoint.id, endId: ptB.id, start: firstPoint, end: ptB, type: 'segment', color: '#ef4444' };

                setLines(prev => [...prev, rayMA, rayMB, radOA, radOB]);
                setDecorations(prev => [...prev, ...decs]);
                
                setStep(ToolStep.IDLE);
                setFirstPoint(null);
                setSecondPoint(null);
            });
        }
    }

    // --- TOOL: RIGHT TRIANGLE (Lesson 6 - Thales Theorem) ---
    if (tool === ToolType.RIGHT_TRIANGLE) {
        // Step 1: Select B
        if (step === ToolStep.IDLE || step === ToolStep.PICKING_FIRST) {
            const p1 = snapInfo?.type === 'point' ? snapInfo.point : {
                id: `p_rt_B_${Date.now()}`,
                x: activeCursorPos.x,
                y: activeCursorPos.y,
                label: 'B',
                color: activeColor
            };
            if (!snapInfo?.type) setPoints(prev => [...prev, p1]);
            setFirstPoint(p1);
            setStep(ToolStep.PICKING_SECOND);
        } 
        // Step 2: Select C, Draw Base BC, Trigger Circle Construction
        else if (step === ToolStep.PICKING_SECOND && firstPoint) {
            const p2 = snapInfo?.type === 'point' ? snapInfo.point : {
                id: `p_rt_C_${Date.now()}`,
                x: activeCursorPos.x,
                y: activeCursorPos.y,
                label: 'C',
                color: activeColor
            };
            if (getDistance(firstPoint, p2) < 20) return;
            if (!snapInfo?.type) setPoints(prev => [...prev, p2]);
            setSecondPoint(p2);
            
            // Draw BC
            setStep(ToolStep.ANIMATING);
            playSegmentAnim(firstPoint, p2, () => {
                 const lineBC: LineSegment = { id: `l_rt_base_${Date.now()}`, startId: firstPoint.id, endId: p2.id, start: firstPoint, end: p2, type: 'segment', color: activeColor };
                 setLines(prev => [...prev, lineBC]);
                 
                 // Trigger Circle Construction
                 playRightTriConstruction(firstPoint, p2, () => {
                     // Ready to pick A
                     setStep(ToolStep.PICKING_POINT_ON_CIRCLE);
                 });
            });
        }
        // Step 3: Pick A on Circle
        else if (step === ToolStep.PICKING_POINT_ON_CIRCLE && firstPoint && secondPoint && rightTriCircle) {
             // Check if click is on circle (already handled by handleMouseMove + snap activeCursorPos)
             // We just verify it's close enough logic if needed, but activeCursorPos is snapped
             const dist = getDistance(activeCursorPos, rightTriCircle.center);
             if (Math.abs(dist - rightTriCircle.radius) > 30) return; // Must click near circle

             const A: Point2D = {
                 id: `p_rt_A_${Date.now()}`,
                 x: activeCursorPos.x,
                 y: activeCursorPos.y,
                 label: 'A',
                 color: activeColor
             };
             setPoints(prev => [...prev, A]);
             
             // Trigger Finalize
             setStep(ToolStep.ANIMATING);
             playRightTriFinalize(A, firstPoint, secondPoint, (decs) => {
                 const lineAB: LineSegment = { id: `l_rt_ab_${Date.now()}`, startId: A.id, endId: firstPoint.id, start: A, end: firstPoint, type: 'segment', color: activeColor };
                 const lineAC: LineSegment = { id: `l_rt_ac_${Date.now()}`, startId: A.id, endId: secondPoint.id, start: A, end: secondPoint, type: 'segment', color: activeColor };
                 
                 setLines(prev => [...prev, lineAB, lineAC]);
                 setDecorations(prev => [...prev, ...decs]);
                 
                 setStep(ToolStep.IDLE);
                 setFirstPoint(null);
                 setSecondPoint(null);
            });
        }
    }

    // --- TOOL: PERPENDICULAR EKE (Lesson 7) ---
    if (tool === ToolType.PERPENDICULAR_EKE) {
        if (step === ToolStep.IDLE || step === ToolStep.PICKING_FIRST) {
            // Start Line d (Point 1)
             const p1 = snapInfo?.type === 'point' ? snapInfo.point : { id: `p_eke_1_${Date.now()}`, x: activeCursorPos.x, y: activeCursorPos.y, color: activeColor };
             if (!snapInfo?.type) setPoints(prev => [...prev, p1]);
             setFirstPoint(p1);
             setStep(ToolStep.PICKING_SECOND);
        } else if (step === ToolStep.PICKING_SECOND && firstPoint) {
            // End Line d (Point 2)
            const p2 = snapInfo?.type === 'point' ? snapInfo.point : { id: `p_eke_2_${Date.now()}`, x: activeCursorPos.x, y: activeCursorPos.y, color: activeColor };
            if (!snapInfo?.type) setPoints(prev => [...prev, p2]);
            setSecondPoint(p2);
            
            const lineD: LineSegment = { id: `l_eke_d_${Date.now()}`, startId: firstPoint.id, endId: p2.id, start: firstPoint, end: p2, type: 'line', color: activeColor, lengthLabel: 'd' };
            setLines(prev => [...prev, lineD]);
            
            setStep(ToolStep.PICKING_THIRD);
        } else if (step === ToolStep.PICKING_THIRD && firstPoint && secondPoint) {
            // Pick Point M
            const M = snapInfo?.type === 'point' ? snapInfo.point : { id: `p_eke_M_${Date.now()}`, x: activeCursorPos.x, y: activeCursorPos.y, label: 'M', color: activeColor };
             if (!snapInfo?.type) setPoints(prev => [...prev, M]);
             
             setStep(ToolStep.ANIMATING);
             playPerpEke(firstPoint, secondPoint, M, (H, decs) => {
                 // Add point H (labeled as requested)
                 const pointH: Point2D = { 
                     id: `p_eke_H_${Date.now()}`, 
                     x: H.x, 
                     y: H.y, 
                     label: 'H', 
                     color: activeColor 
                 };
                 setPoints(prev => [...prev, pointH]);

                 // Add resulting line from M to H
                 const lineMH: LineSegment = { 
                     id: `l_eke_res_${Date.now()}`, 
                     startId: M.id, 
                     endId: pointH.id, 
                     start: M, 
                     end: pointH, 
                     type: 'segment', 
                     color: activeColor 
                 };
                 setLines(prev => [...prev, lineMH]);
                 setDecorations(prev => [...prev, ...decs]);
                 
                 setStep(ToolStep.IDLE);
                 setFirstPoint(null);
                 setSecondPoint(null);
             });
        }
    }

    // --- TOOL: PARALLEL SLIDING (Lesson 8) ---
    if (tool === ToolType.PARALLEL_SLIDING) {
        if (step === ToolStep.IDLE || step === ToolStep.PICKING_FIRST) {
             const p1 = snapInfo?.type === 'point' ? snapInfo.point : { id: `p_par_1_${Date.now()}`, x: activeCursorPos.x, y: activeCursorPos.y, color: activeColor };
             if (!snapInfo?.type) setPoints(prev => [...prev, p1]);
             setFirstPoint(p1);
             setStep(ToolStep.PICKING_SECOND);
        } else if (step === ToolStep.PICKING_SECOND && firstPoint) {
            const p2 = snapInfo?.type === 'point' ? snapInfo.point : { id: `p_par_2_${Date.now()}`, x: activeCursorPos.x, y: activeCursorPos.y, color: activeColor };
            if (!snapInfo?.type) setPoints(prev => [...prev, p2]);
            setSecondPoint(p2);
            
            const lineD: LineSegment = { id: `l_par_d_${Date.now()}`, startId: firstPoint.id, endId: p2.id, start: firstPoint, end: p2, type: 'line', color: activeColor, lengthLabel: 'd' };
            setLines(prev => [...prev, lineD]);
            
            setStep(ToolStep.PICKING_THIRD);
        } else if (step === ToolStep.PICKING_THIRD && firstPoint && secondPoint) {
            const M = snapInfo?.type === 'point' ? snapInfo.point : { id: `p_par_M_${Date.now()}`, x: activeCursorPos.x, y: activeCursorPos.y, label: 'M', color: activeColor };
             if (!snapInfo?.type) setPoints(prev => [...prev, M]);
             
             setStep(ToolStep.ANIMATING);
             playParaSlide(firstPoint, secondPoint, M, (s, e) => {
                 // Add result line
                 // Need to create dummy points for start/end if we want it strictly geometric, 
                 // or just render the line segment using existing mechanism.
                 const pS = { ...s, id: `p_res_s_${Date.now()}` };
                 const pE = { ...e, id: `p_res_e_${Date.now()}` };
                 const lineRes: LineSegment = { id: `l_par_res_${Date.now()}`, startId: pS.id, endId: pE.id, start: pS, end: pE, type: 'line', color: activeColor, lengthLabel: "d'" };
                 setLines(prev => [...prev, lineRes]);
                 
                 setStep(ToolStep.IDLE);
                 setFirstPoint(null);
                 setSecondPoint(null);
             });
        }
    }

    // --- TOOL: RAY (Grade 6) ---
    if (tool === ToolType.RAY) {
        if (step === ToolStep.IDLE || step === ToolStep.PICKING_FIRST) {
             const p1 = snapInfo?.type === 'point' ? snapInfo.point : {
                id: `p_ray_O_${Date.now()}`,
                x: activeCursorPos.x,
                y: activeCursorPos.y,
                label: 'O',
                color: activeColor
            };
            if (!snapInfo?.type) setPoints(prev => [...prev, p1]);
            setFirstPoint(p1);
            setStep(ToolStep.PICKING_SECOND);
        } else if (step === ToolStep.PICKING_SECOND && firstPoint) {
             const p2 = snapInfo?.type === 'point' ? snapInfo.point : {
                id: `p_ray_A_${Date.now()}`,
                x: activeCursorPos.x,
                y: activeCursorPos.y,
                label: 'A',
                color: activeColor
            };
            if (getDistance(firstPoint, p2) < 20) return;
            if (!snapInfo?.type) setPoints(prev => [...prev, p2]);

            setStep(ToolStep.ANIMATING);
            playRayAnim(firstPoint, p2, (farPoint) => {
                 const rayLine: LineSegment = {
                     id: `l_ray_${Date.now()}`,
                     startId: firstPoint.id,
                     endId: p2.id, // Logically ends at A but visual is ray
                     start: firstPoint,
                     end: farPoint,
                     type: 'ray',
                     color: activeColor
                 };
                 setLines(prev => [...prev, rayLine]);
                 setStep(ToolStep.IDLE);
                 setFirstPoint(null);
            });
        }
    }

    // --- TOOL: INFINITE LINE (Grade 6) ---
    if (tool === ToolType.INFINITE_LINE) {
        if (step === ToolStep.IDLE || step === ToolStep.PICKING_FIRST) {
             const p1 = snapInfo?.type === 'point' ? snapInfo.point : {
                id: `p_line_A_${Date.now()}`,
                x: activeCursorPos.x,
                y: activeCursorPos.y,
                label: 'A',
                color: activeColor
            };
            if (!snapInfo?.type) setPoints(prev => [...prev, p1]);
            setFirstPoint(p1);
            setStep(ToolStep.PICKING_SECOND);
        } else if (step === ToolStep.PICKING_SECOND && firstPoint) {
             const p2 = snapInfo?.type === 'point' ? snapInfo.point : {
                id: `p_line_B_${Date.now()}`,
                x: activeCursorPos.x,
                y: activeCursorPos.y,
                label: 'B',
                color: activeColor
            };
            if (getDistance(firstPoint, p2) < 20) return;
            if (!snapInfo?.type) setPoints(prev => [...prev, p2]);

            setStep(ToolStep.ANIMATING);
            playLineAnim(firstPoint, p2, (startExt, endExt) => {
                 const infLine: LineSegment = {
                     id: `l_inf_${Date.now()}`,
                     startId: firstPoint.id,
                     endId: p2.id,
                     start: startExt,
                     end: endExt,
                     type: 'line',
                     color: activeColor
                 };
                 setLines(prev => [...prev, infLine]);
                 setStep(ToolStep.IDLE);
                 setFirstPoint(null);
            });
        }
    }

    // --- TOOL: MEASURE ANGLE (Grade 6) ---
    if (tool === ToolType.MEASURE_ANGLE) {
        if (step === ToolStep.IDLE || step === ToolStep.PICKING_FIRST) {
             const p1 = snapInfo?.type === 'point' ? snapInfo.point : { id: `p_meas_O_${Date.now()}`, x: activeCursorPos.x, y: activeCursorPos.y, label: 'O', color: activeColor };
             if (!snapInfo?.type) setPoints(prev => [...prev, p1]);
             setFirstPoint(p1);
             setStep(ToolStep.PICKING_SECOND);
        } else if (step === ToolStep.PICKING_SECOND && firstPoint) {
             const p2 = snapInfo?.type === 'point' ? snapInfo.point : { id: `p_meas_A_${Date.now()}`, x: activeCursorPos.x, y: activeCursorPos.y, label: 'x', color: activeColor };
             if (!snapInfo?.type) setPoints(prev => [...prev, p2]);
             
             // Draw ray Ox reference
             const l1: LineSegment = { id: `ref_1_${Date.now()}`, startId: firstPoint.id, endId: p2.id, start: firstPoint, end: p2, type: 'ray', color: activeColor };
             setLines(prev => [...prev, l1]);

             setSecondPoint(p2);
             setStep(ToolStep.PICKING_THIRD);
        } else if (step === ToolStep.PICKING_THIRD && firstPoint && secondPoint) {
             const p3 = snapInfo?.type === 'point' ? snapInfo.point : { id: `p_meas_B_${Date.now()}`, x: activeCursorPos.x, y: activeCursorPos.y, label: 'y', color: activeColor };
             if (!snapInfo?.type) setPoints(prev => [...prev, p3]);

             // Draw ray Oy reference
             const l2: LineSegment = { id: `ref_2_${Date.now()}`, startId: firstPoint.id, endId: p3.id, start: firstPoint, end: p3, type: 'ray', color: activeColor };
             setLines(prev => [...prev, l2]);

             setStep(ToolStep.ANIMATING);
             playMeasureAnim(firstPoint, secondPoint, p3, (decs) => {
                 setDecorations(prev => [...prev, ...decs]);
                 setStep(ToolStep.IDLE);
                 setFirstPoint(null);
                 setSecondPoint(null);
             });
        }
    }

    // --- TOOL: DRAW ANGLE (Grade 6) ---
    if (tool === ToolType.DRAW_ANGLE) {
        if (step === ToolStep.IDLE || step === ToolStep.PICKING_FIRST) {
            const p1 = snapInfo?.type === 'point' ? snapInfo.point : { id: `p_drw_O_${Date.now()}`, x: activeCursorPos.x, y: activeCursorPos.y, label: 'O', color: activeColor };
             if (!snapInfo?.type) setPoints(prev => [...prev, p1]);
             setFirstPoint(p1);
             setStep(ToolStep.PICKING_SECOND);
        } else if (step === ToolStep.PICKING_SECOND && firstPoint) {
             const p2 = snapInfo?.type === 'point' ? snapInfo.point : { id: `p_drw_A_${Date.now()}`, x: activeCursorPos.x, y: activeCursorPos.y, label: 'x', color: activeColor };
             if (!snapInfo?.type) setPoints(prev => [...prev, p2]);
             setSecondPoint(p2);
             
             // Draw base ray
             const l1: LineSegment = { id: `base_ray_${Date.now()}`, startId: firstPoint.id, endId: p2.id, start: firstPoint, end: p2, type: 'ray', color: activeColor };
             setLines(prev => [...prev, l1]);

             setStep(ToolStep.INPUT_ANGLE);
             setInputType('ANGLE');
             setInputVal('60');
             setShowInputModal(true);
        }
    }

    // --- TOOL: QUADRILATERAL (Grade 8) ---
    if (tool === ToolType.QUADRILATERAL) {
        const labels = ['A', 'B', 'C', 'D'];
        const currentIdx = tempPoints.length;
        
        // Pick next point
        const p = snapInfo?.type === 'point' ? snapInfo.point : {
             id: `p_quad_${Date.now()}`,
             x: activeCursorPos.x,
             y: activeCursorPos.y,
             label: labels[currentIdx],
             color: activeColor
        };

        // Prevent very close points
        if (tempPoints.length > 0 && getDistance(tempPoints[tempPoints.length - 1], p) < 20) return;

        // Add to main state if new
        if (!snapInfo?.type) setPoints(prev => [...prev, p]);
        
        const newTemp = [...tempPoints, p];
        setTempPoints(newTemp);

        if (newTemp.length === 1) setStep(ToolStep.PICKING_SECOND);
        else if (newTemp.length === 2) setStep(ToolStep.PICKING_THIRD);
        else if (newTemp.length === 3) setStep(ToolStep.PICKING_FOURTH);
        else if (newTemp.length === 4) {
             // We have 4 points, Start Animation
             setStep(ToolStep.ANIMATING);
             playQuadAnim(newTemp[0], newTemp[1], newTemp[2], newTemp[3], (newDecorations) => {
                 // Animation Complete: Add permanent lines
                 const l1: LineSegment = { id: `lq1_${Date.now()}`, startId: newTemp[0].id, endId: newTemp[1].id, start: newTemp[0], end: newTemp[1], type: 'segment', color: activeColor };
                 const l2: LineSegment = { id: `lq2_${Date.now()}`, startId: newTemp[1].id, endId: newTemp[2].id, start: newTemp[1], end: newTemp[2], type: 'segment', color: activeColor };
                 const l3: LineSegment = { id: `lq3_${Date.now()}`, startId: newTemp[2].id, endId: newTemp[3].id, start: newTemp[2], end: newTemp[3], type: 'segment', color: activeColor };
                 const l4: LineSegment = { id: `lq4_${Date.now()}`, startId: newTemp[3].id, endId: newTemp[0].id, start: newTemp[3], end: newTemp[0], type: 'segment', color: activeColor };
                 
                 setLines(prev => [...prev, l1, l2, l3, l4]);
                 setDecorations(prev => [...prev, ...newDecorations]);
                 
                 setStep(ToolStep.IDLE);
                 setTempPoints([]);
             });
        }
    }

    // --- TOOL: PARALLELOGRAM (Grade 8 - Lesson 2) ---
    if (tool === ToolType.PARALLELOGRAM) {
        // Step 1: Pick A
        if (step === ToolStep.IDLE || step === ToolStep.PICKING_FIRST) {
             const p1 = snapInfo?.type === 'point' ? snapInfo.point : {
                id: `p_para_1_${Date.now()}`,
                x: activeCursorPos.x,
                y: activeCursorPos.y,
                label: 'A',
                color: activeColor
            };
            if (!snapInfo?.type) setPoints(prev => [...prev, p1]);
            setFirstPoint(p1);
            setStep(ToolStep.PICKING_SECOND);
        }
        // Step 2: Pick B
        else if (step === ToolStep.PICKING_SECOND && firstPoint) {
            const p2 = snapInfo?.type === 'point' ? snapInfo.point : {
                id: `p_para_2_${Date.now()}`,
                x: activeCursorPos.x,
                y: activeCursorPos.y,
                label: 'B',
                color: activeColor
            };
            if (getDistance(firstPoint, p2) < 20) return;
            if (!snapInfo?.type) setPoints(prev => [...prev, p2]);
            setSecondPoint(p2);
            
            // Draw AB
            const l1: LineSegment = { id: `l_para_1_${Date.now()}`, startId: firstPoint.id, endId: p2.id, start: firstPoint, end: p2, type: 'segment', color: activeColor };
            setLines(prev => [...prev, l1]);
            
            setStep(ToolStep.PICKING_THIRD);
        }
        // Step 3: Pick C
        else if (step === ToolStep.PICKING_THIRD && firstPoint && secondPoint) {
             const p3 = snapInfo?.type === 'point' ? snapInfo.point : {
                id: `p_para_3_${Date.now()}`,
                x: activeCursorPos.x,
                y: activeCursorPos.y,
                label: 'C',
                color: activeColor
            };
            if (getDistance(secondPoint, p3) < 20) return;
            if (!snapInfo?.type) setPoints(prev => [...prev, p3]);
            
            // Draw BC
            const l2: LineSegment = { id: `l_para_2_${Date.now()}`, startId: secondPoint.id, endId: p3.id, start: secondPoint, end: p3, type: 'segment', color: activeColor };
            setLines(prev => [...prev, l2]);

            // Animate Construction
            setStep(ToolStep.ANIMATING);
            playParaAnim(firstPoint, secondPoint, p3, (D, decorations) => {
                 const newPointD = { ...D, label: 'D', color: activeColor };
                 setPoints(prev => [...prev, newPointD]);
                 
                 const l3: LineSegment = { id: `l_para_3_${Date.now()}`, startId: p3.id, endId: newPointD.id, start: p3, end: newPointD, type: 'segment', color: activeColor };
                 const l4: LineSegment = { id: `l_para_4_${Date.now()}`, startId: newPointD.id, endId: firstPoint.id, start: newPointD, end: firstPoint, type: 'segment', color: activeColor };
                 
                 setLines(prev => [...prev, l3, l4]);
                 setDecorations(prev => [...prev, ...decorations]);
                 
                 setStep(ToolStep.IDLE);
                 setFirstPoint(null);
                 setSecondPoint(null);
            });
        }
    }

    // --- TOOL: FIXED LENGTH LINE ---
    if (tool === ToolType.FIXED_LENGTH_LINE) {
        if (step === ToolStep.IDLE || step === ToolStep.PICKING_FIRST) {
             const p1 = snapInfo?.type === 'point' ? snapInfo.point : {
                id: `p_start_${Date.now()}`,
                x: activeCursorPos.x,
                y: activeCursorPos.y,
                label: 'A',
                color: activeColor
            };
            if (!snapInfo?.type) setPoints(prev => [...prev, p1]);
            setFirstPoint(p1);
            setStep(ToolStep.INPUT_LENGTH);
            setInputType('LENGTH');
            setInputVal('5');
            setShowInputModal(true); 
        }
    }

    // --- TOOL: EQUILATERAL_TRIANGLE (Grade 7 - Lesson 5) ---
    if (tool === ToolType.EQUILATERAL_TRIANGLE) {
        if (step === ToolStep.IDLE || step === ToolStep.PICKING_FIRST) {
            const p1 = snapInfo?.type === 'point' ? snapInfo.point : {
                id: `p_equi_1_${Date.now()}`,
                x: activeCursorPos.x,
                y: activeCursorPos.y,
                label: 'B',
                color: activeColor
            };
            if (!snapInfo?.type) setPoints(prev => [...prev, p1]);
            setFirstPoint(p1);
            setStep(ToolStep.PICKING_SECOND);
        }
        else if (step === ToolStep.PICKING_SECOND && firstPoint) {
            const p2 = snapInfo?.type === 'point' ? snapInfo.point : {
                id: `p_equi_2_${Date.now()}`,
                x: activeCursorPos.x,
                y: activeCursorPos.y,
                label: 'C',
                color: activeColor
            };
            if (getDistance(firstPoint, p2) < 20) return;
            if (!snapInfo?.type) setPoints(prev => [...prev, p2]);
            
            // Draw Base BC then animate Equilateral construction
            setStep(ToolStep.ANIMATING);
            playSegmentAnim(firstPoint, p2, () => {
                 const lineBC: LineSegment = { id: `l_base_${Date.now()}`, startId: firstPoint.id, endId: p2.id, start: firstPoint, end: p2, type: 'segment', color: activeColor };
                 setLines(prev => [...prev, lineBC]);
                 
                 // No radius selection for Equilateral. It's fixed to side length.
                 playEquilateralAnim(firstPoint, p2, (vertexA, newDecorations) => {
                     const newPointA = { ...vertexA, label: 'A', color: activeColor };
                     setPoints(prev => [...prev, newPointA]);
                     const lineAB: LineSegment = { id: `l_${Date.now()}_2`, startId: firstPoint.id, endId: newPointA.id, start: firstPoint, end: newPointA, type: 'segment', color: activeColor };
                     const lineAC: LineSegment = { id: `l_${Date.now()}_3`, startId: p2.id, endId: newPointA.id, start: p2, end: newPointA, type: 'segment', color: activeColor };
                     
                     setLines(prev => [...prev, lineAB, lineAC]);
                     setDecorations(prev => [...prev, ...newDecorations]);
                     
                     setStep(ToolStep.IDLE);
                     setFirstPoint(null);
                 });
            });
        }
    }

    // --- TOOL: PERPENDICULAR_BISECTOR (Grade 7 - Lesson 1) ---
    if (tool === ToolType.PERPENDICULAR_BISECTOR) {
         if (step === ToolStep.IDLE || step === ToolStep.PICKING_FIRST) {
             const p1 = snapInfo?.type === 'point' ? snapInfo.point : {
                id: `p_bisect_1_${Date.now()}`,
                x: activeCursorPos.x,
                y: activeCursorPos.y,
                label: 'A',
                color: activeColor
            };
            if (!snapInfo?.type) setPoints(prev => [...prev, p1]);
            setFirstPoint(p1);
            setStep(ToolStep.PICKING_SECOND);
        }
        else if (step === ToolStep.PICKING_SECOND && firstPoint) {
            const p2 = snapInfo?.type === 'point' ? snapInfo.point : {
                id: `p_bisect_2_${Date.now()}`,
                x: activeCursorPos.x,
                y: activeCursorPos.y,
                label: 'B',
                color: activeColor
            };
            if (getDistance(firstPoint, p2) < 20) return;
            if (!snapInfo?.type) setPoints(prev => [...prev, p2]);

            // Phase 1: Draw Segment AB immediately
            setStep(ToolStep.ANIMATING);
            playSegmentAnim(firstPoint, p2, () => {
                const lineAB: LineSegment = { id: `l_bisect_base_${Date.now()}`, startId: firstPoint.id, endId: p2.id, start: firstPoint, end: p2, type: 'segment', color: activeColor };
                setLines(prev => [...prev, lineAB]);
                
                // Transition to Radius Selection
                setSecondPoint(p2);
                setStep(ToolStep.SETTING_RADIUS);
            });
        }
        else if (step === ToolStep.SETTING_RADIUS && firstPoint && secondPoint) {
            // Calculate Radius from First Point to Cursor
            const radius = getDistance(firstPoint, activeCursorPos);
            const distAB = getDistance(firstPoint, secondPoint);
            
            // Validate: Radius must be > AB/2
            if (radius <= distAB / 2) return;
            
            setStep(ToolStep.ANIMATING);
            playPerpBisectorAnim(firstPoint, secondPoint, radius, (midPointM, P, Q, newDecorations) => {
                 // Add Midpoint M
                 const newPointM = { ...midPointM, label: 'M' };
                 setPoints(prev => [...prev, newPointM]);
                 
                 // Add the Bisector Line (P to Q)
                 const bisectorLine: LineSegment = { 
                     id: `l_bisector_${Date.now()}`, 
                     startId: 'temp_p', // Ideally these would be real points if we wanted to interact with them later
                     endId: 'temp_q',
                     start: P, 
                     end: Q, 
                     type: 'line', 
                     color: activeColor 
                 };
                 setLines(prev => [...prev, bisectorLine]);

                 // Add Symbols (Perpendicular, Equality)
                 setDecorations(prev => [...prev, ...newDecorations]);
                 
                 setStep(ToolStep.IDLE);
                 setFirstPoint(null);
                 setSecondPoint(null);
            });
        }
    }

    // --- TOOL: MIDPOINT (Grade 7 - Lesson 2) ---
    if (tool === ToolType.MIDPOINT) {
        if (step === ToolStep.IDLE || step === ToolStep.PICKING_FIRST) {
             const p1 = snapInfo?.type === 'point' ? snapInfo.point : {
                id: `p_mid_1_${Date.now()}`,
                x: activeCursorPos.x,
                y: activeCursorPos.y,
                label: 'A',
                color: activeColor
            };
            if (!snapInfo?.type) setPoints(prev => [...prev, p1]);
            setFirstPoint(p1);
            setStep(ToolStep.PICKING_SECOND);
        }
        else if (step === ToolStep.PICKING_SECOND && firstPoint) {
            const p2 = snapInfo?.type === 'point' ? snapInfo.point : {
                id: `p_mid_2_${Date.now()}`,
                x: activeCursorPos.x,
                y: activeCursorPos.y,
                label: 'B',
                color: activeColor
            };
            if (getDistance(firstPoint, p2) < 20) return;
            if (!snapInfo?.type) setPoints(prev => [...prev, p2]);

            // Draw Segment AB then Construct Midpoint
            setStep(ToolStep.ANIMATING);
            playSegmentAnim(firstPoint, p2, () => {
                const lineAB: LineSegment = { id: `l_mid_base_${Date.now()}`, startId: firstPoint.id, endId: p2.id, start: firstPoint, end: p2, type: 'segment', color: activeColor };
                setLines(prev => [...prev, lineAB]);
                
                // NEW: Wait for Radius selection
                setSecondPoint(p2);
                setStep(ToolStep.SETTING_RADIUS);
            });
        }
        else if (step === ToolStep.SETTING_RADIUS && firstPoint && secondPoint) {
            const radius = getDistance(firstPoint, activeCursorPos);
            const distAB = getDistance(firstPoint, secondPoint);
            
            if (radius <= distAB / 2) return;

            setStep(ToolStep.ANIMATING);
            playMidpointAnim(firstPoint, secondPoint, radius, (midPointM, newDecorations) => {
                const newPointM = { ...midPointM, label: 'M', color: activeColor };
                setPoints(prev => [...prev, newPointM]);
                setDecorations(prev => [...prev, ...newDecorations]);
                
                setStep(ToolStep.IDLE);
                setFirstPoint(null);
                setSecondPoint(null);
            });
        }
    }

    // --- TOOL: ANGLE BISECTOR (Grade 7 - Lesson 3) ---
    if (tool === ToolType.ANGLE_BISECTOR) {
        if (step === ToolStep.IDLE || step === ToolStep.PICKING_FIRST) {
            // 1. Pick Vertex O
             const p1 = snapInfo?.type === 'point' ? snapInfo.point : {
                id: `p_ang_O_${Date.now()}`,
                x: activeCursorPos.x,
                y: activeCursorPos.y,
                label: 'O',
                color: activeColor
            };
            if (!snapInfo?.type) setPoints(prev => [...prev, p1]);
            setFirstPoint(p1);
            setStep(ToolStep.PICKING_SECOND);
        }
        else if (step === ToolStep.PICKING_SECOND && firstPoint) {
            // 2. Pick Point A (Leg 1)
            const p2 = snapInfo?.type === 'point' ? snapInfo.point : {
                id: `p_ang_A_${Date.now()}`,
                x: activeCursorPos.x,
                y: activeCursorPos.y,
                label: 'x', // Label as ray direction usually
                color: activeColor
            };
            if (getDistance(firstPoint, p2) < 20) return;
            if (!snapInfo?.type) setPoints(prev => [...prev, p2]);
            setSecondPoint(p2);
            
            // Draw Ray 1
            const line1: LineSegment = { id: `l_ang_1_${Date.now()}`, startId: firstPoint.id, endId: p2.id, start: firstPoint, end: p2, type: 'ray', color: activeColor };
            setLines(prev => [...prev, line1]);

            setStep(ToolStep.PICKING_THIRD);
        }
        else if (step === ToolStep.PICKING_THIRD && firstPoint && secondPoint) {
             // 3. Pick Point B (Leg 2)
             const p3 = snapInfo?.type === 'point' ? snapInfo.point : {
                id: `p_ang_B_${Date.now()}`,
                x: activeCursorPos.x,
                y: activeCursorPos.y,
                label: 'y',
                color: activeColor
            };
            if (getDistance(firstPoint, p3) < 20) return;
            if (!snapInfo?.type) setPoints(prev => [...prev, p3]);
            
            // Draw Ray 2
            const line2: LineSegment = { id: `l_ang_2_${Date.now()}`, startId: firstPoint.id, endId: p3.id, start: firstPoint, end: p3, type: 'ray', color: activeColor };
            setLines(prev => [...prev, line2]);

            // Start Animation
            setStep(ToolStep.ANIMATING);
            // Updated Callback: Now receives Point I and decorations
            playAngleBisectorAnim(firstPoint, secondPoint, p3, (I, newDecorations) => {
                 setDecorations(prev => [...prev, ...newDecorations]);
                 
                 // IMPORTANT: Save the Bisector Ray so it persists!
                 // Currently points from O to I. We make it a ray.
                 const bisectorRay: LineSegment = {
                     id: `l_bisector_${Date.now()}`,
                     startId: firstPoint.id,
                     endId: I.id, // Using the calculated ID for stability
                     start: firstPoint,
                     end: I,
                     type: 'ray',
                     color: '#ef4444' // Red for emphasis
                 };
                 setLines(prev => [...prev, bisectorRay]);

                 setStep(ToolStep.IDLE);
                 setFirstPoint(null);
                 setSecondPoint(null);
            });
        }
    }

    // --- TOOL: ISOSCELES TRIANGLE (Grade 7 - Lesson 4) ---
    if (tool === ToolType.ISOSCELES_TRIANGLE) {
        if (step === ToolStep.IDLE || step === ToolStep.PICKING_FIRST) {
            // Pick Point B
            const p1 = snapInfo?.type === 'point' ? snapInfo.point : {
                id: `p_iso_1_${Date.now()}`,
                x: activeCursorPos.x,
                y: activeCursorPos.y,
                label: 'B',
                color: activeColor
            };
            if (!snapInfo?.type) setPoints(prev => [...prev, p1]);
            setFirstPoint(p1);
            setStep(ToolStep.PICKING_SECOND);
        }
        else if (step === ToolStep.PICKING_SECOND && firstPoint) {
            // Pick Point C
            const p2 = snapInfo?.type === 'point' ? snapInfo.point : {
                id: `p_iso_2_${Date.now()}`,
                x: activeCursorPos.x,
                y: activeCursorPos.y,
                label: 'C',
                color: activeColor
            };
            if (getDistance(firstPoint, p2) < 20) return; // Too close
            if (!snapInfo?.type) setPoints(prev => [...prev, p2]);
            
            // Phase 1: Draw the base line BC immediately
            setStep(ToolStep.ANIMATING);
            playSegmentAnim(firstPoint, p2, () => {
                // After drawing BC, add it to persistent state
                const lineBC: LineSegment = { 
                    id: `l_base_${Date.now()}`, 
                    startId: firstPoint.id, 
                    endId: p2.id, 
                    start: firstPoint, 
                    end: p2, 
                    type: 'segment',
                    color: activeColor
                };
                setLines(prev => [...prev, lineBC]);
                
                // Now transition to Radius Selection mode
                setSecondPoint(p2);
                setStep(ToolStep.SETTING_RADIUS);
            });
        }
        else if (step === ToolStep.SETTING_RADIUS && firstPoint && secondPoint) {
            // Set Radius by clicking
            const radius = getDistance(firstPoint, activeCursorPos);
            const distBC = getDistance(firstPoint, secondPoint);
            
            // Validate Radius: Must be > BC/2 for intersection
            if (radius <= distBC / 2) return;

            setStep(ToolStep.ANIMATING);

            // Trigger Animation with selected Radius
            playIsoAnim(firstPoint, secondPoint, radius, (vertexA, newDecorations) => {
                 // Animation Done: Add Vertex A, Lines, and Decorations
                 const newPointA = { ...vertexA, label: 'A', color: activeColor };
                 setPoints(prev => [...prev, newPointA]);

                 // Add sides AB and AC
                 const lineAB: LineSegment = { id: `l_${Date.now()}_2`, startId: firstPoint.id, endId: newPointA.id, start: firstPoint, end: newPointA, type: 'segment', color: activeColor };
                 const lineAC: LineSegment = { id: `l_${Date.now()}_3`, startId: secondPoint.id, endId: newPointA.id, start: secondPoint, end: newPointA, type: 'segment', color: activeColor };
                 
                 setLines(prev => [...prev, lineAB, lineAC]);
                 setDecorations(prev => [...prev, ...newDecorations]);
                 
                 setStep(ToolStep.IDLE);
                 setFirstPoint(null);
                 setSecondPoint(null);
            });
        }
    }
    
    // --- TOOL: LINE (2 Steps) ---
    if (tool === ToolType.LINE) {
        // Step 1: Pick First Point
        if (step === ToolStep.IDLE || step === ToolStep.PICKING_FIRST) {
            const p1 = snapInfo?.type === 'point' ? snapInfo.point : {
                id: `p_temp_${Date.now()}`,
                x: activeCursorPos.x,
                y: activeCursorPos.y,
                label: activeLesson ? (points.length === 0 ? 'A' : 'C') : undefined,
                color: activeColor
            };
            if (!snapInfo?.type) setPoints(prev => [...prev, p1]);
            setFirstPoint(p1);
            setStep(ToolStep.PICKING_SECOND);
        } 
        // Step 2: Pick Second Point -> Trigger Animation
        else if (step === ToolStep.PICKING_SECOND && firstPoint) {
             const p2 = snapInfo?.type === 'point' ? snapInfo.point : {
                id: `p_temp_2_${Date.now()}`,
                x: activeCursorPos.x,
                y: activeCursorPos.y,
                label: activeLesson ? (points.length === 1 ? 'B' : 'D') : undefined,
                color: activeColor
            };
            if (getDistance(firstPoint, p2) < 5) return;
            if (!snapInfo?.type) setPoints(prev => [...prev, p2]);
            setStep(ToolStep.ANIMATING);
            playSegmentAnim(firstPoint, p2, () => {
                const newId = `l_${Date.now()}`;
                let finalP1 = points.find(p => p.id === firstPoint.id) || firstPoint;
                let finalP2 = points.find(p => p.id === p2.id) || p2;
                const newLine: LineSegment = { id: newId, startId: finalP1.id, endId: finalP2.id, start: finalP1, end: finalP2, type: 'segment', color: activeColor };
                setLines(prev => [...prev, newLine]);
                setStep(ToolStep.IDLE);
                setFirstPoint(null);
            });
        }
    }
  };

  const handleInputSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!firstPoint) return;
      
      const val = parseFloat(inputVal);
      if (isNaN(val) || val <= 0) return;

      setShowInputModal(false);
      setStep(ToolStep.ANIMATING);

      if (inputType === 'LENGTH') {
          // Play Fixed Length Animation
          playFixedAnim(firstPoint, val, (endP) => {
              const newPointB = { ...endP, label: 'B', color: activeColor };
              setPoints(prev => [...prev, newPointB]);
              const newLine: LineSegment = {
                  id: `l_fix_${Date.now()}`,
                  startId: firstPoint.id,
                  endId: newPointB.id,
                  start: firstPoint,
                  end: newPointB,
                  type: 'segment',
                  lengthLabel: `${val}cm`,
                  color: activeColor
              };
              setLines(prev => [...prev, newLine]);
              setStep(ToolStep.IDLE);
              setFirstPoint(null);
          });
      } else if (inputType === 'ANGLE' && secondPoint) {
          // Play Draw Angle Animation
          playDrawAngleAnim(firstPoint, secondPoint, val, (endRayP, decs) => {
               // Add the new Ray
               const newRay: LineSegment = {
                   id: `ray_ang_${Date.now()}`,
                   startId: firstPoint.id,
                   endId: endRayP.id,
                   start: firstPoint,
                   end: endRayP,
                   type: 'ray',
                   color: activeColor
               };
               setLines(prev => [...prev, newRay]);
               setDecorations(prev => [...prev, ...decs]);
               
               setStep(ToolStep.IDLE);
               setFirstPoint(null);
               setSecondPoint(null);
          });
      }
  };

  const renderActiveTool = () => {
      if (isGlobalAnimating) return null;

      if (tool === ToolType.CIRCLE) {
          return <VirtualCompass centerX={activeCursorPos.x} centerY={activeCursorPos.y} radius={100} rotation={0} />;
      }
      if (tool === ToolType.PERPENDICULAR) {
          return <VirtualEke x={activeCursorPos.x} y={activeCursorPos.y} rotation={0} />;
      }
      if (tool === ToolType.MEASURE_ANGLE || tool === ToolType.DRAW_ANGLE) {
          return <VirtualProtractor x={activeCursorPos.x} y={activeCursorPos.y} rotation={0} />;
      }
      
      // ISOSCELES or PERPENDICULAR_BISECTOR or MIDPOINT Radius Selection
      if ((tool === ToolType.ISOSCELES_TRIANGLE || tool === ToolType.PERPENDICULAR_BISECTOR || tool === ToolType.MIDPOINT) && step === ToolStep.SETTING_RADIUS && firstPoint) {
          // Interactive Radius Selection Mode
          const radius = getDistance(firstPoint, activeCursorPos);
          const rotation = getLineAngle(firstPoint, activeCursorPos);
          // Check validity
          const isValid = secondPoint ? radius > getDistance(firstPoint, secondPoint) / 2 : true;

          return (
             <>
                {/* Preview Circle */}
                <KonvaCircle x={firstPoint.x} y={firstPoint.y} radius={radius} stroke={isValid ? "#94a3b8" : "#fca5a5"} dash={[5,5]} strokeWidth={1} listening={false} />
                {isValid ? (
                    <VirtualCompass centerX={firstPoint.x} centerY={firstPoint.y} radius={radius} rotation={rotation} />
                ) : (
                    <VirtualPencil x={activeCursorPos.x} y={activeCursorPos.y} rotation={rotation} opacity={0.5} />
                )}
             </>
          );
      }
      
      // Tangent Construction - Circle Preview
      if (tool === ToolType.TANGENT_FROM_POINT && step === ToolStep.SETTING_RADIUS && firstPoint) {
           const radius = getDistance(firstPoint, activeCursorPos);
           return <KonvaCircle x={firstPoint.x} y={firstPoint.y} radius={radius} stroke="#000" dash={[5,5]} opacity={0.5} listening={false} />;
      }
      
      // Preview Circle Snap for Lesson 6
      if (tool === ToolType.RIGHT_TRIANGLE && step === ToolStep.PICKING_POINT_ON_CIRCLE && rightTriCircle) {
           // Show pencil snapping to the virtual circle
           return <VirtualPencil x={activeCursorPos.x} y={activeCursorPos.y} />;
      }

      // Pencil default
      return <VirtualPencil x={activeCursorPos.x} y={activeCursorPos.y} />;
  };

  // Helper function to generate instruction text
  const getInstructionText = () => {
      // New Tools
      if (tool === ToolType.RIGHT_TRIANGLE) {
          if (step === ToolStep.IDLE || step === ToolStep.PICKING_FIRST) return "👉 Chọn điểm đầu B.";
          if (step === ToolStep.PICKING_SECOND) return "👉 Chọn điểm cuối C để vẽ đường kính.";
          if (step === ToolStep.ANIMATING) return "⚡ Đang dựng đường tròn đường kính BC...";
          if (step === ToolStep.PICKING_POINT_ON_CIRCLE) return "👉 Rê chuột và chọn đỉnh A trên đường tròn.";
      }
      if (tool === ToolType.PERPENDICULAR_EKE) {
          if (step === ToolStep.IDLE || step === ToolStep.PICKING_FIRST) return "👉 Chọn điểm đầu đường thẳng d.";
          if (step === ToolStep.PICKING_SECOND) return "👉 Chọn điểm cuối đường thẳng d.";
          if (step === ToolStep.PICKING_THIRD) return "👉 Chọn điểm M nằm ngoài d.";
          if (step === ToolStep.ANIMATING) return "⚡ Đang dùng ê-ke trượt tìm đường vuông góc...";
      }
      if (tool === ToolType.PARALLEL_SLIDING) {
          if (step === ToolStep.IDLE || step === ToolStep.PICKING_FIRST) return "👉 Chọn điểm đầu đường thẳng d.";
          if (step === ToolStep.PICKING_SECOND) return "👉 Chọn điểm cuối đường thẳng d.";
          if (step === ToolStep.PICKING_THIRD) return "👉 Chọn điểm M nằm ngoài d.";
          if (step === ToolStep.ANIMATING) return "⚡ Đang trượt hai thước để vẽ song song...";
      }
      
      if (tool === ToolType.TANGENT_FROM_POINT) {
          if (step === ToolStep.IDLE || step === ToolStep.PICKING_FIRST) return "👉 Chọn tâm O của đường tròn.";
          if (step === ToolStep.SETTING_RADIUS) return "👉 Kéo chuột để chọn bán kính cho (O).";
          if (step === ToolStep.PICKING_THIRD) return "👉 Chọn điểm M nằm ngoài đường tròn.";
          if (step === ToolStep.ANIMATING) return "⚡ Đang dựng tiếp tuyến...";
      }

      if (tool === ToolType.MEASURE_ANGLE) {
           if (step === ToolStep.IDLE || step === ToolStep.PICKING_FIRST) return "👉 Chọn đỉnh góc (O).";
           if (step === ToolStep.PICKING_SECOND) return "👉 Chọn điểm trên cạnh thứ nhất.";
           if (step === ToolStep.PICKING_THIRD) return "👉 Chọn điểm trên cạnh thứ hai.";
      }
      if (tool === ToolType.DRAW_ANGLE) {
           if (step === ToolStep.IDLE || step === ToolStep.PICKING_FIRST) return "👉 Chọn đỉnh góc (O).";
           if (step === ToolStep.PICKING_SECOND) return "👉 Chọn điểm hướng (Ox).";
           if (step === ToolStep.INPUT_ANGLE) return "👉 Nhập số đo góc.";
      }
      
      if (tool === ToolType.QUADRILATERAL) {
          if (step === ToolStep.IDLE || step === ToolStep.PICKING_FIRST) return "👉 Chọn điểm A.";
          if (step === ToolStep.PICKING_SECOND) return "👉 Chọn điểm B.";
          if (step === ToolStep.PICKING_THIRD) return "👉 Chọn điểm C.";
          if (step === ToolStep.PICKING_FOURTH) return "👉 Chọn điểm D để hoàn thành tứ giác.";
          if (step === ToolStep.ANIMATING) return "⚡ Đang nối các điểm và đo góc...";
      }
      
      if (step === ToolStep.IDLE || step === ToolStep.PICKING_FIRST) return "👉 Chọn điểm thứ nhất.";
      if (step === ToolStep.PICKING_SECOND) return "👉 Chọn điểm thứ hai.";
      
      return "👉 Chọn công cụ để bắt đầu.";
  };

  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-slate-50">
      {/* BRANDING HEADER */}
      <div className="h-[140px] bg-blue-900 flex items-center justify-center relative px-4 shadow-md z-40 shrink-0 border-b-4 border-orange-500">
        {/* Logo Left */}
        <div className="absolute left-6 top-1/2 transform -translate-y-1/2 w-28 h-28 bg-white rounded-full p-1 border-2 border-white shadow-lg flex items-center justify-center overflow-hidden">
             <img
                src="https://drive.google.com/uc?export=view&id=1FNKbFgs2_2WOkb7hItnGW-uldrRQEFxM"
                alt="An Phuc Logo"
                className="object-contain w-full h-full"
             />
        </div>

        {/* Centered Text Content */}
        <div className="flex flex-col items-center justify-center text-white space-y-1 w-full pl-32">
            <h1 className="font-bold text-3xl uppercase tracking-wider drop-shadow-md text-center">
                TRUNG TÂM TOÁN AN PHÚC EDUCATION
            </h1>
            <p className="font-bold text-xl uppercase tracking-wide drop-shadow-md text-center text-orange-400">
                "VỮNG KIẾN THỨC - CHẮC TƯƠNG LAI"
            </p>
            <p className="font-bold text-xs uppercase tracking-wide mt-2 opacity-90 text-center leading-tight max-w-4xl">
                ĐỊA CHỈ: LÔ 19, Ô DC 16, KHU TÁI ĐỊNH CƯ VĨNH TRƯỜNG, NAM NHA TRANG, KHÁNH HÒA - SĐT: 0986.108.104 - 0834.23.02.87
            </p>
        </div>
      </div>

      <div className="flex flex-1 w-full overflow-hidden relative">
        <LessonSidebar 
            activeLessonId={activeLesson?.id || null} 
            onSelectLesson={handleLessonSelect} 
            currentTool={tool}
            setTool={handleToolChange}
        />

        <div className="relative flex-1 h-full">
            {/* Toolbar Removed */}
            
            {/* Color Picker Positioned next to Toolbar area (now empty, move left) */}
            <div className="absolute left-4 top-4 z-10">
                <ColorPicker 
                    activeColor={activeColor} 
                    onChange={handleColorChange} 
                    recentColors={recentColors} 
                />
            </div>
            
            <StageCanvas 
                width={dimensions.width} 
                height={dimensions.height} 
                onMouseMove={handleMouseMove}
                onClick={handleStageClick}
                forwardedRef={stageRef}
            >
                {/* 1. Decorations Layer (Bottom) */}
                <Layer>
                    {decorations.map(d => {
                        const isSelectMode = tool === ToolType.SELECT;
                        
                        if ((d.type === 'TICK' || d.type === 'RIGHT_ANGLE') && d.points) {
                            return <KonvaLine key={d.id} points={d.points} stroke={d.stroke} strokeWidth={2} lineCap="round" />;
                        }
                        if (d.type === 'ANGLE') {
                            return <KonvaArc key={d.id} x={d.x} y={d.y} innerRadius={d.radius} outerRadius={d.radius} angle={d.angle || 0} rotation={d.rotation || 0} stroke={d.stroke} strokeWidth={2} lineCap="round" />;
                        }
                        if (d.type === 'TEXT') {
                            return (
                                <KonvaText 
                                    key={d.id} 
                                    id={d.id}
                                    x={d.x} 
                                    y={d.y} 
                                    text={d.text} 
                                    fontSize={14} 
                                    fill="#ef4444" 
                                    fontStyle="bold"
                                    draggable={isSelectMode}
                                    onDragEnd={handleDecorationDragEnd}
                                    onMouseEnter={(e) => handleCursorStyle(e, 'enter')}
                                    onMouseLeave={(e) => handleCursorStyle(e, 'leave')}
                                />
                            );
                        }
                        return null;
                    })}
                </Layer>
                
                {/* 1.5 Static Circles Layer */}
                <Layer>
                    {circles.map(c => (
                        <KonvaCircle key={c.id} x={c.center.x} y={c.center.y} radius={c.radius} stroke={c.color || 'black'} strokeWidth={2} listening={false} />
                    ))}
                </Layer>

                {/* 2. Lines Layer */}
                <Layer>
                {lines.map(line => {
                    const isSnapped = snapInfo?.type === 'line' && snapInfo.id === line.id;
                    const midX = (line.start.x + line.end.x) / 2;
                    const midY = (line.start.y + line.end.y) / 2;
                    // Use custom color or default black, highlight overrides everything
                    const strokeColor = isSnapped ? COLOR_HIGHLIGHT : (line.color || "black");

                    return (
                    <React.Fragment key={line.id}>
                        {isSnapped && (
                            <KonvaLine points={[line.start.x, line.start.y, line.end.x, line.end.y]} stroke={COLOR_HIGHLIGHT} strokeWidth={6} opacity={0.5} lineCap="round" />
                        )}
                        <KonvaLine points={[line.start.x, line.start.y, line.end.x, line.end.y]} stroke={strokeColor} strokeWidth={2} hitStrokeWidth={10} lineCap="round" />
                        
                        {/* Length Label */}
                        {line.lengthLabel && (
                            <KonvaText 
                                x={midX - 15} 
                                y={midY - 20} 
                                text={line.lengthLabel} 
                                fontSize={14} 
                                fill="#475569"
                                fontStyle="italic"
                            />
                        )}
                    </React.Fragment>
                    );
                })}
                </Layer>

                {/* 3. Points Layer */}
                <Layer>
                {points.map(point => {
                    const isSnapped = snapInfo?.type === 'point' && snapInfo.id === point.id;
                    const isFirstSelected = firstPoint?.id === point.id;
                    const isSecondSelected = secondPoint?.id === point.id;
                    const isSelectMode = tool === ToolType.SELECT;
                    
                    // Determine Fill Color
                    let fillColor = point.color || 'black';
                    if (isSnapped || isFirstSelected || isSecondSelected) {
                        fillColor = isFirstSelected ? '#ef4444' : COLOR_HIGHLIGHT;
                    }

                    // Default Label Offset (e.g. +8, -20) if not set
                    const labelX = point.x + (point.labelOffset?.x ?? 8);
                    const labelY = point.y + (point.labelOffset?.y ?? -20);

                    return (
                        <React.Fragment key={point.id}>
                        {(isSnapped || isFirstSelected || isSecondSelected) && (
                            <KonvaCircle x={point.x} y={point.y} radius={12} fill={fillColor} opacity={0.3} listening={false} />
                        )}
                        <KonvaCircle 
                            id={point.id}
                            x={point.x} 
                            y={point.y} 
                            radius={6} // Slightly larger visually
                            fill={fillColor} 
                            strokeWidth={0} 
                            hitStrokeWidth={20} // Much larger hit area for easier grabbing
                            draggable={isSelectMode}
                            onDragMove={handlePointDragMove}
                            onMouseEnter={(e) => handleCursorStyle(e, 'enter')}
                            onMouseLeave={(e) => handleCursorStyle(e, 'leave')}
                        />
                        {point.label && (
                            <KonvaText 
                                x={labelX} 
                                y={labelY} 
                                text={point.label} 
                                fontSize={16} 
                                fontStyle="bold" 
                                fontFamily="serif" 
                                fill="#1e293b"
                                draggable={isSelectMode} // Make label draggable independently
                                onDragEnd={(e) => handleLabelDragEnd(e, point.id)}
                                onMouseEnter={(e) => isSelectMode && handleCursorStyle(e, 'enter')}
                                onMouseLeave={(e) => isSelectMode && handleCursorStyle(e, 'leave')}
                            />
                        )}
                        </React.Fragment>
                    );
                })}
                </Layer>
                
                {/* 4. Guide Lines & Snapping Layer */}
                {!isGlobalAnimating && (
                    <Layer>
                    {snapInfo && <KonvaCircle x={activeCursorPos.x} y={activeCursorPos.y} radius={8} stroke={COLOR_HIGHLIGHT} strokeWidth={2} dash={[4, 4]} listening={false} />}
                    
                    {/* Guide Line logic */}
                    {(step === ToolStep.PICKING_SECOND || step === ToolStep.PICKING_THIRD || step === ToolStep.PICKING_FOURTH) && tempPoints.length > 0 && (
                        <KonvaLine 
                            points={[tempPoints[tempPoints.length-1].x, tempPoints[tempPoints.length-1].y, activeCursorPos.x, activeCursorPos.y]} 
                            stroke="#94a3b8" 
                            strokeWidth={1} 
                            dash={[5, 5]} 
                        />
                    )}
                    </Layer>
                )}

                {/* 5. Active Tool Cursor */}
                <Layer listening={false}>{renderActiveTool()}</Layer>
                
                {/* 6. Animation Layers */}
                <Layer listening={false}>
                    {segmentAnimLayer}
                    {fixedAnimLayer}
                    {isoAnimLayer}
                    {equiAnimLayer}
                    {midAnimLayer}
                    {perpBisectorAnimLayer}
                    {angleBisectorAnimLayer}
                    {quadAnimLayer}
                    {paraAnimLayer}
                    {rayAnimLayer}
                    {lineAnimLayer}
                    {measureAnimLayer}
                    {drawAngleAnimLayer}
                    {rightTriLayer}
                    {perpEkeLayer}
                    {paraSlideLayer}
                    {tangentLayer}
                </Layer>
            </StageCanvas>

            {/* Input Modal for Fixed Length OR Angle */}
            {showInputModal && firstPoint && (
                <div 
                    className="absolute bg-white p-4 rounded-lg shadow-xl border border-blue-200 z-50 flex flex-col gap-3"
                    style={{ 
                        left: Math.min(firstPoint.x + 20, window.innerWidth - 250), 
                        top: firstPoint.y - 80 
                    }}
                >
                    <label className="text-sm font-semibold text-gray-700">
                        {inputType === 'LENGTH' ? 'Nhập độ dài đoạn thẳng (cm):' : 'Nhập số đo góc (độ):'}
                    </label>
                    <form onSubmit={handleInputSubmit} className="flex gap-2">
                        <input 
                            type="number" 
                            value={inputVal} 
                            onChange={(e) => setInputVal(e.target.value)} 
                            className="w-20 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                            autoFocus
                            min="1"
                            max={inputType === 'LENGTH' ? 20 : 180}
                        />
                        <button 
                            type="submit"
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                        >
                            Vẽ
                        </button>
                    </form>
                </div>
            )}

            {/* FLOATING SELECT TOOL */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 pointer-events-auto">
                <button 
                    onClick={() => handleToolChange(ToolType.SELECT)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full shadow-xl border transition-all duration-200 ${
                        tool === ToolType.SELECT 
                            ? 'bg-blue-600 text-white border-blue-700 scale-110' 
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                >
                    <span className="text-xl">🖱️</span>
                    <span className="font-bold">Di chuyển</span>
                </button>
            </div>

            {/* UI Overlay */}
            <div className="absolute bottom-4 left-4 pointer-events-none flex flex-col gap-2">
                {activeLesson && (
                    <div className="bg-blue-50 p-4 rounded shadow-lg border border-blue-200 max-w-sm pointer-events-auto">
                        <h4 className="font-bold text-blue-800 mb-1">{activeLesson.title}</h4>
                        <p className="text-blue-700 text-sm mb-2">{activeLesson.description}</p>
                        <div className="text-xs text-blue-600 italic">
                            {getInstructionText()}
                        </div>
                    </div>
                )}
                {/* Show simple instructions if no lesson active but tool selected */}
                {!activeLesson && tool !== ToolType.SELECT && (
                    <div className="bg-white p-3 rounded shadow border border-gray-200 max-w-xs pointer-events-auto">
                        <div className="text-xs text-gray-600 font-medium">
                            {getInstructionText()}
                        </div>
                    </div>
                )}
                {tool === ToolType.SELECT && (
                    <div className="bg-white p-2 px-3 rounded shadow border border-gray-200 pointer-events-auto flex items-center gap-2">
                        <span className="text-lg">🖱️</span>
                        <span className="text-xs text-gray-600 font-medium">Kéo thả các điểm, nhãn hoặc hình vẽ để di chuyển.</span>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default App;
