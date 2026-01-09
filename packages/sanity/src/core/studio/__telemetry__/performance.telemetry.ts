import {defineEvent} from '@sanity/telemetry'
import type {MetricRatingThresholds, NavigationType, Rating} from 'web-vitals'

// =============================================================================
// EXISTING INP (v1) - Keep for backwards compatibility during migration
// =============================================================================

export interface PerformanceINPMeasuredData {
  target: string | null
  attrs?: {
    ui?: string
    testId?: string
  }
  duration: number
  interaction: string
}

export const PerformanceINPMeasured = defineEvent<PerformanceINPMeasuredData>({
  name: 'Performance INP Measured',
  // Sample at most every minute
  maxSampleRate: 60_000,
  version: 1,
  description: 'Performance INP (Interaction to Next Paint) measurement happened',
})

// =============================================================================
// CORE WEB VITALS (via web-vitals library)
// Uses types from web-vitals package
// =============================================================================

/**
 * Base fields common to all web-vitals metrics
 */
interface WebVitalsBaseData {
  /** Metric value (ms for time-based, unitless for CLS) */
  value: number
  /** Rating based on thresholds: 'good', 'needs-improvement', 'poor' */
  rating: Rating
  /** Navigation type: navigate, reload, back_forward, prerender */
  navigationType?: NavigationType
}

/**
 * Largest Contentful Paint - measures loading performance
 * Reports when the largest content element becomes visible
 */
export interface PerformanceLCPMeasuredData extends WebVitalsBaseData {
  /** Element tag name that triggered LCP */
  element?: string
  /** URL of the resource (for images) */
  url?: string
}

export const PerformanceLCPMeasured = defineEvent<PerformanceLCPMeasuredData>({
  name: 'Performance LCP Measured',
  version: 1,
  description: 'Largest Contentful Paint measurement',
})

/**
 * First Contentful Paint - measures initial render
 */
export type PerformanceFCPMeasuredData = WebVitalsBaseData

export const PerformanceFCPMeasured = defineEvent<PerformanceFCPMeasuredData>({
  name: 'Performance FCP Measured',
  version: 1,
  description: 'First Contentful Paint measurement',
})

/**
 * Cumulative Layout Shift - measures visual stability
 */
export interface PerformanceCLSMeasuredData {
  /** CLS score (unitless, typically 0-1) */
  value: number
  /** Rating based on thresholds */
  rating: Rating
  /** Element tag name that caused the largest shift */
  largestShiftTarget?: string
}

export const PerformanceCLSMeasured = defineEvent<PerformanceCLSMeasuredData>({
  name: 'Performance CLS Measured',
  version: 1,
  description: 'Cumulative Layout Shift measurement (reported on page hide)',
})

/**
 * Time to First Byte - measures server response time
 */
export type PerformanceTTFBMeasuredData = WebVitalsBaseData

export const PerformanceTTFBMeasured = defineEvent<PerformanceTTFBMeasuredData>({
  name: 'Performance TTFB Measured',
  version: 1,
  description: 'Time to First Byte measurement',
})

/**
 * Enhanced INP with attribution from web-vitals library
 * Provides more detailed breakdown than v1
 */
export interface PerformanceINPMeasuredV2Data {
  /** INP value in milliseconds */
  value: number
  /** Rating based on thresholds */
  rating: Rating
  /** Element that received the interaction */
  target?: string | null
  /** Interaction type: pointer, keyboard */
  interactionType?: string
  /** Time from input to event processing start */
  inputDelay?: number
  /** Time spent in event handlers */
  processingDuration?: number
  /** Time from processing end to next paint */
  presentationDelay?: number
}

export const PerformanceINPMeasuredV2 = defineEvent<PerformanceINPMeasuredV2Data>({
  name: 'Performance INP Measured',
  version: 2,
  description: 'Interaction to Next Paint with attribution (web-vitals)',
  maxSampleRate: 30_000, // Sample at most every 30 seconds
})
