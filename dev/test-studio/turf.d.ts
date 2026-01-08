// Type declarations for @turf packages that have issues with package.json exports resolution
declare module '@turf/helpers' {
  export function featureCollection<T>(features: T[]): {features: T[]}
  export function points(coordinates: number[][]): {features: {geometry: {coordinates: number[]}}[]}
}

declare module '@turf/points-within-polygon' {
  export default function pointsWithinPolygon(
    points: {features: {geometry: {coordinates: number[]}}[]},
    polygon: {features: unknown[]},
  ): {features: unknown[]}
}
