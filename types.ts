
// Core Geometry Types
export interface Point2D {
  id: string;
  x: number;
  y: number;
  label?: string;
  labelOffset?: { x: number, y: number }; // New: Custom offset for the label
  isVirtual?: boolean; // For snap points or calculation intermediates
  color?: string; // Custom color
}

// Alias Point for backward compatibility with some hooks
export type Point = Point2D;

export interface Vector2D {
  x: number;
  y: number;
}

export interface LineSegment {
  id: string;
  startId: string; // Reference to Point2D id
  endId: string;   // Reference to Point2D id
  start: Point2D;  // Denormalized for easier rendering/calc
  end: Point2D;    // Denormalized for easier rendering/calc
  type: 'segment' | 'ray' | 'line'; // Extendable for rays or infinite lines
  lengthLabel?: string; // e.g. "5cm"
  color?: string; // Custom color
}

export interface Circle {
  id: string;
  centerId?: string; // Optional ref to a point ID
  radiusPointId?: string; // Point defining the radius
  center: Point2D;
  radius: number;
  color?: string;
}

// Geometric Decorations (Ticks, Angles)
export interface Decoration {
  id: string;
  type: 'TICK' | 'ANGLE' | 'RIGHT_ANGLE' | 'TEXT'; // Added TEXT
  // For Ticks/RightAngle: A line segment points array
  points?: number[]; 
  // For Angles: Arc params
  x?: number;
  y?: number;
  radius?: number;
  angle?: number;
  rotation?: number;
  stroke: string;
  // For Text
  text?: string;
}

// Lesson Type Definition
export interface Lesson {
  id: string;
  title: string;
  description: string;
  toolId: string; // The tool required for this lesson
}

// Tool & State Management Types
export enum ToolType {
  SELECT = 'SELECT',
  POINT = 'POINT',
  // Grade 6
  LINE = 'LINE', // Segment
  FIXED_LENGTH_LINE = 'FIXED_LENGTH_LINE', 
  RAY = 'RAY',
  INFINITE_LINE = 'INFINITE_LINE',
  MEASURE_ANGLE = 'MEASURE_ANGLE',
  DRAW_ANGLE = 'DRAW_ANGLE',
  // Grade 7
  ISOSCELES_TRIANGLE = 'ISOSCELES_TRIANGLE', 
  EQUILATERAL_TRIANGLE = 'EQUILATERAL_TRIANGLE', 
  MIDPOINT = 'MIDPOINT', 
  PERPENDICULAR_BISECTOR = 'PERPENDICULAR_BISECTOR', 
  ANGLE_BISECTOR = 'ANGLE_BISECTOR',
  // Grade 7 - New Advanced Constructions
  RIGHT_TRIANGLE = 'RIGHT_TRIANGLE',
  PERPENDICULAR_EKE = 'PERPENDICULAR_EKE',
  PARALLEL_SLIDING = 'PARALLEL_SLIDING',
  // Grade 8
  QUADRILATERAL = 'QUADRILATERAL',
  PARALLELOGRAM = 'PARALLELOGRAM', 
  PERPENDICULAR = 'PERPENDICULAR', 
  PARALLEL = 'PARALLEL',
  CIRCLE = 'CIRCLE', 
  // Grade 9
  TANGENT_FROM_POINT = 'TANGENT_FROM_POINT',
}

export enum ToolStep {
  IDLE = 'IDLE',
  PICKING_FIRST = 'PICKING_FIRST',   // e.g., Pick line for perpendicular
  PICKING_SECOND = 'PICKING_SECOND', // e.g., Pick point for perpendicular
  PICKING_THIRD = 'PICKING_THIRD',   // For Quadrilateral or Angle Bisector
  PICKING_FOURTH = 'PICKING_FOURTH', // For Quadrilateral
  PICKING_POINT_ON_CIRCLE = 'PICKING_POINT_ON_CIRCLE', // New: Lesson 6 pick A on virtual circle
  SETTING_RADIUS = 'SETTING_RADIUS', // New: User determines compass width
  INPUT_LENGTH = 'INPUT_LENGTH',     // Waiting for user text input
  INPUT_ANGLE = 'INPUT_ANGLE',       // Waiting for angle input
  ANIMATING = 'ANIMATING',           // GSAP animation running
  FINISHED = 'FINISHED'
}

export interface GeometryState {
  points: Point2D[];
  lines: LineSegment[];
  circles: Circle[];
  selectedIds: string[];
}

// Math Utility Returns
export interface OrientationResult {
  rotation: number; // Degrees for Konva rotation
  scaleY: 1 | -1;   // Flip state
  projection: Point2D; // The foot of the perpendicular
}

export interface SnapResult {
  id: string | null;
  type: 'point' | 'line' | 'intersection' | null;
  point: Point2D; // The actual snapped coordinate
  distance: number;
}

// ==========================================
// Additional Types for Hooks/Legacy Components
// ==========================================

export interface Line {
  id: string;
  p1: Point;
  p2: Point;
  dashed?: boolean;
}

export interface Arc {
  id: string;
  center: Point;
  radius: number;
  startAngle: number;
  endAngle: number;
}

export interface CompassProps {
  visible: boolean;
  x: number;
  y: number;
  radius: number;
  rotation: number;
  isDrawing: boolean;
}

export interface RulerProps {
  visible: boolean;
  p1: Point;
  p2: Point;
  opacity: number;
}
