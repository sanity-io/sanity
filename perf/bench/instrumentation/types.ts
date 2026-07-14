/**
 * Shapes shared between the in-page collector (instrumentation/index.ts,
 * bundled and injected into the studio page) and the runner (which drains
 * them via `window.__bench.take()`). Import type-only from runner code.
 */

/** One Event Timing API entry (PerformanceEventTiming), trimmed. */
export interface EventTimingSample {
  name: string
  interactionId: number
  /** Event hardware timestamp (ms, relative to timeOrigin). */
  startTime: number
  processingStart: number
  processingEnd: number
  /** startTime → next paint, rounded to 8ms granularity by the browser. */
  duration: number
}

/** One Long Animation Frame entry with script attribution. */
export interface LoafSample {
  startTime: number
  duration: number
  blockingDuration: number
  scripts: {sourceUrl: string; functionName: string; duration: number}[]
}

export interface PaintSample {
  name: string
  startTime: number
}

export interface LayoutShiftSample {
  startTime: number
  value: number
  hadRecentInput: boolean
}

export interface NavigationSample {
  responseStart: number
  domContentLoadedEventEnd: number
  loadEventEnd: number
}

export interface MeasureSample {
  name: string
  startTime: number
  duration: number
}

/**
 * One resource timing entry, trimmed to the fields exposed for cross-origin
 * requests without Timing-Allow-Origin (the API host is a different origin
 * than the studio): start and end only, no phase breakdown.
 */
export interface ResourceSample {
  url: string
  startTime: number
  responseEnd: number
}

export interface BenchEntries {
  events: EventTimingSample[]
  loafs: LoafSample[]
  paints: PaintSample[]
  largestContentfulPaint: PaintSample | null
  layoutShifts: LayoutShiftSample[]
  navigation: NavigationSample | null
  measures: MeasureSample[]
  resources: ResourceSample[]
}

export interface BenchCollector {
  version: number
  /** Drain and return everything collected since the last take(). */
  take(): BenchEntries
}

declare global {
  interface Window {
    __bench?: BenchCollector
  }
}
