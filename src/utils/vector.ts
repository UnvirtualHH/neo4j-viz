import { PointData } from "pixi.js";

export function getUnitVector(
  start: PointData,
  end: PointData
): { ux: number; uy: number; distance: number } {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return { ux: dx / distance, uy: dy / distance, distance };
}

export function getOffsetPoint(
  point: PointData,
  ux: number,
  uy: number,
  offset: number
): PointData {
  return {
    x: point.x + offset * ux,
    y: point.y + offset * uy,
  };
}

export function getMidPoint(p1: PointData, p2: PointData): PointData {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}
