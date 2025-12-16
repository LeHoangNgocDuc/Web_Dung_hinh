import { useMemo } from 'react';
import { Point2D, LineSegment, SnapResult } from '../types';
import { getDistance, getClosestPointOnSegment } from '../utils/math';
import { SNAP_THRESHOLD } from '../constants';

/**
 * Hook to handle magnetic snapping of the cursor to geometry elements.
 * 
 * Priority:
 * 1. Existing Points (Endpoints)
 * 2. Intersection Points (TODO: Can be added if we pre-calculate intersections)
 * 3. Lines (Projects cursor onto the line segment)
 */
export const useSnap = (
  cursorPos: Point2D,
  points: Point2D[],
  lines: LineSegment[],
  scale: number = 1,
  enabled: boolean = true
): SnapResult | null => {
  
  return useMemo(() => {
    if (!enabled) return null;

    // Adjust threshold based on zoom level so snapping "feels" consistent visually
    const threshold = SNAP_THRESHOLD / scale;
    
    let closestDist = threshold;
    let result: SnapResult | null = null;

    // 1. Check Points (Highest Priority)
    for (const p of points) {
      const dist = getDistance(cursorPos, p);
      if (dist < closestDist) {
        closestDist = dist;
        result = {
          id: p.id,
          type: 'point',
          point: p, // Snap exactly to the point
          distance: dist
        };
      }
    }

    // If we snapped to a point, return immediately (Points > Lines)
    if (result) return result;

    // 2. Check Lines
    for (const l of lines) {
      // Find the closest point on this segment to the cursor
      const closestOnLine = getClosestPointOnSegment(l.start, l.end, cursorPos);
      const dist = getDistance(cursorPos, closestOnLine);

      if (dist < closestDist) {
        closestDist = dist;
        result = {
          id: l.id,
          type: 'line',
          point: closestOnLine, // Snap to the projection on the line
          distance: dist
        };
      }
    }

    return result;

  }, [cursorPos.x, cursorPos.y, points, lines, scale, enabled]);
};
