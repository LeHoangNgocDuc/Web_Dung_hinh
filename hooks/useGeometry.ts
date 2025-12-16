import { useState, useCallback } from 'react';
import { Point, Line, Arc } from '../types';

export const useGeometry = () => {
  const [points, setPoints] = useState<Point[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [arcs, setArcs] = useState<Arc[]>([]);

  const addPoint = useCallback((x: number, y: number): Point => {
    const newPoint: Point = {
      id: `p_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      x,
      y,
      label: String.fromCharCode(65 + points.length), // A, B, C...
    };
    setPoints((prev) => [...prev, newPoint]);
    return newPoint;
  }, [points]);

  const addLine = useCallback((p1: Point, p2: Point, dashed = false) => {
    const newLine: Line = {
      id: `l_${Date.now()}`,
      p1,
      p2,
      dashed,
    };
    setLines((prev) => [...prev, newLine]);
  }, []);

  const addArc = useCallback((center: Point, radius: number, startAngle: number, endAngle: number) => {
    const newArc: Arc = {
      id: `a_${Date.now()}`,
      center,
      radius,
      startAngle,
      endAngle,
    };
    setArcs((prev) => [...prev, newArc]);
  }, []);

  const reset = useCallback(() => {
    setPoints([]);
    setLines([]);
    setArcs([]);
  }, []);

  return {
    points,
    lines,
    arcs,
    addPoint,
    addLine,
    addArc,
    reset,
  };
};