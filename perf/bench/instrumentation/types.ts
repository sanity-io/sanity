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
  /** The hard or soft navigation the event belongs to. */
  navigationId: number
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
  /**
   * Compact descriptors of the shifted elements (from LayoutShiftAttribution),
   * e.g. '[data-testid="pane-content"]' or 'div.someClass' — so a CLS number
   * can name its culprit instead of just existing.
   */
  sources: string[]
  /** The hard or soft navigation the shift belongs to. */
  navigationId: number
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

/**
 * A `soft-navigation` entry: Chrome's record of a trusted interaction that
 * changed the URL and painted. Every later entry carries its `navigationId`.
 */
export interface SoftNavigationSample {
  url: string
  navigationType: string
  navigationId: number
  interactionId: number
  /** The interaction's timestamp. */
  startTime: number
  /** startTime → first contentful paint (soft FCP). */
  duration: number
}

/**
 * An `interaction-contentful-paint` entry: the largest paint an interaction
 * caused so far. Emitted for every interaction that paints content, typing
 * included, and again whenever a larger paint lands, possibly after a later
 * take(). Soft LCP is the largest one whose `interactionId` matches the soft
 * navigation's.
 */
export interface InteractionContentfulPaintSample {
  interactionId: number
  navigationId: number
  startTime: number
  /** startTime → this paint. */
  duration: number
  /** Painted area of the largest element, in px². */
  size: number
  /** Compact descriptor of that element, as in `LayoutShiftSample.sources`. */
  element: string
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
  softNavigations: SoftNavigationSample[]
  interactionContentfulPaints: InteractionContentfulPaintSample[]
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
