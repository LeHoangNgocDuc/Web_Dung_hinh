
import { Point2D, Vector2D, OrientationResult } from '../types';

// ==========================================
// 1. Basic Vector Operations
// ==========================================

export const addVectors = (v1: Vector2D, v2: Vector2D): Vector2D => ({
  x: v1.x + v2.x,
  y: v1.y + v2.y,
});

export const subtractVectors = (v1: Vector2D, v2: Vector2D): Vector2D => ({
  x: v1.x - v2.x,
  y: v1.y - v2.y,
});

export const multiplyVector = (v: Vector2D, scalar: number): Vector2D => ({
  x: v.x * scalar,
  y: v.y * scalar,
});

export const dotProduct = (v1: Vector2D, v2: Vector2D): number => {
  return v1.x * v2.x + v1.y * v2.y;
};

/**
 * 2D Cross Product (Determinant).
 * Returns the Z magnitude of the 3D cross product.
 * Value > 0: v2 is clockwise from v1 (in screen Y-down coords).
 * Value < 0: v2 is counter-clockwise from v1.
 * Value = 0: Collinear.
 */
export const crossProduct = (v1: Vector2D, v2: Vector2D): number => {
  return v1.x * v2.y - v1.y * v2.x;
};

export const getMagnitude = (v: Vector2D): number => {
  return Math.sqrt(v.x * v.x + v.y * v.y);
};

export const normalizeVector = (v: Vector2D): Vector2D => {
  const m = getMagnitude(v);
  return m === 0 ? { x: 0, y: 0 } : { x: v.x / m, y: v.y / m };
};

export const getDistance = (p1: Point2D, p2: Point2D): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

export const getMidpoint = (p1: Point2D, p2: Point2D): Point2D => {
  return {
    id: `mid_${Date.now()}_${Math.random()}`,
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2
  };
};

// ==========================================
// 2. Advanced Geometry Calculations
// ==========================================

/**
 * Calculates the angle of a line in degrees.
 * Returns range: -180 to 180.
 */
export const getLineAngle = (start: Point2D, end: Point2D): number => {
  const dy = end.y - start.y;
  const dx = end.x - start.x;
  let theta = Math.atan2(dy, dx); 
  return theta * (180 / Math.PI);
};

export const getAngle = getLineAngle;

/**
 * Projects point P onto the infinite line defined by A and B.
 * Returns the coordinate of the projection (The "foot" of the perpendicular).
 */
export const getProjectedPoint = (A: Point2D, B: Point2D, P: Point2D): Point2D => {
  const AB = subtractVectors(B, A);
  const AP = subtractVectors(P, A);
  
  const magAB2 = AB.x * AB.x + AB.y * AB.y;
  if (magAB2 === 0) return A; // A and B are the same point

  const scalar = dotProduct(AP, AB) / magAB2;
  
  return {
    id: 'virtual_proj',
    x: A.x + AB.x * scalar,
    y: A.y + AB.y * scalar,
    isVirtual: true
  };
};

/**
 * Finds the closest point on a LINE SEGMENT (finite) to point P.
 * Unlike getProjectedPoint, this clamps to the start/end of the segment.
 */
export const getClosestPointOnSegment = (A: Point2D, B: Point2D, P: Point2D): Point2D => {
  const AB = subtractVectors(B, A);
  const AP = subtractVectors(P, A);
  
  const magAB2 = AB.x * AB.x + AB.y * AB.y;
  if (magAB2 === 0) return A;

  // t is the projection scalar clamped between 0 and 1
  let t = dotProduct(AP, AB) / magAB2;
  t = Math.max(0, Math.min(1, t));

  return {
    id: 'virtual_seg_closest',
    x: A.x + AB.x * t,
    y: A.y + AB.y * t,
    isVirtual: true
  };
};

/**
 * Finds the closest point on a CIRCLE to point P.
 */
export const getClosestPointOnCircle = (center: Point2D, radius: number, P: Point2D): Point2D => {
    const vecCP = subtractVectors(P, center);
    const normalized = normalizeVector(vecCP);
    
    // If P is exactly at center, default to top
    if (normalized.x === 0 && normalized.y === 0) {
        return { x: center.x, y: center.y - radius, id: 'circle_snap' };
    }

    return {
        id: 'circle_snap',
        x: center.x + normalized.x * radius,
        y: center.y + normalized.y * radius
    };
};

/**
 * Calculates the intersection point of two line segments (p1-p2 and p3-p4).
 * Returns null if parallel or not intersecting within segments.
 */
export const getLineIntersection = (p1: Point2D, p2: Point2D, p3: Point2D, p4: Point2D): Point2D | null => {
  const denominator = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
  
  // Lines are parallel
  if (denominator === 0) return null;

  const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denominator;
  const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denominator;

  // Check if intersection is within the segments
  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return {
      id: `intersect_${Date.now()}`,
      x: p1.x + ua * (p2.x - p1.x),
      y: p1.y + ua * (p2.y - p1.y),
      isVirtual: true
    };
  }
  
  return null;
};

/**
 * Calculate intersection points of two circles.
 * Returns the intersection "above" the line connecting centers (smaller y value).
 */
export const getCircleIntersections = (
    c1: Point2D, r1: number, 
    c2: Point2D, r2: number
): Point2D | null => {
    const intersections = getBothCircleIntersections(c1, r1, c2, r2);
    if (!intersections) return null;
    // Return the one with smaller Y (higher on screen) to act as vertex A usually
    return intersections[0].y < intersections[1].y ? intersections[0] : intersections[1];
};

/**
 * Calculate BOTH intersection points of two circles.
 * Returns [P1, P2] or null.
 */
export const getBothCircleIntersections = (
    c1: Point2D, r1: number, 
    c2: Point2D, r2: number
): [Point2D, Point2D] | null => {
    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;
    const d = Math.sqrt(dx * dx + dy * dy);

    // Circles do not intersect
    if (d > r1 + r2 || d < Math.abs(r1 - r2) || d === 0) return null;

    const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
    const h = Math.sqrt(r1 * r1 - a * a);

    const x2 = c1.x + a * (dx / d);
    const y2 = c1.y + a * (dy / d);

    // Two intersection points
    const xa = x2 + h * (dy / d);
    const ya = y2 - h * (dx / d);
    
    const xb = x2 - h * (dy / d);
    const yb = y2 + h * (dx / d);

    return [
        { id: `intersect_1_${Date.now()}`, x: xa, y: ya },
        { id: `intersect_2_${Date.now()}`, x: xb, y: yb }
    ];
};

// ==========================================
// 3. Tool Specific Logic (Half-Plane / Eke)
// ==========================================

/**
 * CORE LOGIC for Virtual Eke (Set Square).
 * Determines how to orient the Eke so it aligns with a reference line (A-B)
 * and faces the target point P.
 * 
 * Uses Cross Product to determine the "Handedness" (Left/Right) of P relative to Vector AB.
 * 
 * @param lineStart Point A on the line
 * @param lineEnd Point B on the line
 * @param targetPoint Point P (external point where perpendicular must pass)
 * @returns OrientationResult { rotation, scaleY, projection }
 */
export const getHalfPlaneOrientation = (
  lineStart: Point2D, 
  lineEnd: Point2D, 
  targetPoint: Point2D
): OrientationResult => {
  // 1. Calculate Vector of the base line (A -> B)
  const vecLine = subtractVectors(lineEnd, lineStart);
  
  // 2. Calculate Vector from Start to Target (A -> P)
  const vecPoint = subtractVectors(targetPoint, lineStart);
  
  // 3. Calculate Rotation Angle of the base line
  const rotation = getLineAngle(lineStart, lineEnd);
  
  // 4. Determine Orientation using Cross Product
  // Screen Coordinates (Y points down):
  // X axis is 0 deg. Y axis is 90 deg.
  // Cross Product (2D) = x1*y2 - y1*x2
  const cp = crossProduct(vecLine, vecPoint);
  
  // If cp > 0: In screen coords, P is "below/left" (positive rotation direction) relative to AB
  // If cp < 0: P is "above/right" (negative rotation direction) relative to AB
  // We flip (scaleY = -1) if the point is on the "positive" side because the default Eke draws "up".
  const scaleY = cp > 0 ? 1 : -1; 

  // 5. Calculate exact projection point (where the 90deg corner should slide to)
  const projection = getProjectedPoint(lineStart, lineEnd, targetPoint);

  return {
    rotation,
    scaleY,
    projection
  };
};
