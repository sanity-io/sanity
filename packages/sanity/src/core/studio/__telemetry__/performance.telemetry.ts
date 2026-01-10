import {defineEvent} from '@sanity/telemetry'
import {
  type CLSMetricWithAttribution,
  type FCPMetricWithAttribution,
  type INPMetricWithAttribution,
  type LCPMetricWithAttribution,
  type TTFBMetricWithAttribution,
} from 'web-vitals/attribution'

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
// Pass through full metric objects from web-vitals/attribution build
// Each metric type includes:
// - Base: name, value, rating, delta, id, entries, navigationType
// - Attribution: diagnostic info specific to each metric type
// =============================================================================

/**
 * Largest Contentful Paint - measures loading performance
 * Reports when the largest content element becomes visible
 *
 * Attribution includes: target, url, timeToFirstByte, resourceLoadDelay,
 * resourceLoadDuration, elementRenderDelay, navigationEntry, lcpResourceEntry, lcpEntry
 */
export const PerformanceLCPMeasured = defineEvent<LCPMetricWithAttribution>({
  name: 'Performance LCP Measured',
  version: 2,
  description: 'Largest Contentful Paint measurement with attribution',
})

/**
 * First Contentful Paint - measures initial render
 *
 * Attribution includes: timeToFirstByte, firstByteToFCP, loadState,
 * fcpEntry, navigationEntry
 */
export const PerformanceFCPMeasured = defineEvent<FCPMetricWithAttribution>({
  name: 'Performance FCP Measured',
  version: 2,
  description: 'First Contentful Paint measurement with attribution',
})

/**
 * Cumulative Layout Shift - measures visual stability
 * Reported on page hide (visibilitychange)
 *
 * Attribution includes: largestShiftTarget, largestShiftTime, largestShiftValue,
 * largestShiftEntry, largestShiftSource, loadState
 */
export const PerformanceCLSMeasured = defineEvent<CLSMetricWithAttribution>({
  name: 'Performance CLS Measured',
  version: 2,
  description: 'Cumulative Layout Shift measurement with attribution',
})

/**
 * Time to First Byte - measures server response time
 *
 * Attribution includes: waitingDuration, cacheDuration, dnsDuration,
 * connectionDuration, requestDuration, navigationEntry
 */
export const PerformanceTTFBMeasured = defineEvent<TTFBMetricWithAttribution>({
  name: 'Performance TTFB Measured',
  version: 2,
  description: 'Time to First Byte measurement with attribution',
})

/**
 * Interaction to Next Paint - measures responsiveness
 * Reports the worst interaction latency during the page session
 *
 * Attribution includes: interactionTarget, interactionTime, interactionType,
 * nextPaintTime, processedEventEntries, inputDelay, processingDuration,
 * presentationDelay, loadState, longAnimationFrameEntries, and more
 */
export const PerformanceINPMeasuredV2 = defineEvent<INPMetricWithAttribution>({
  name: 'Performance INP Measured',
  version: 2,
  description: 'Interaction to Next Paint with attribution (web-vitals)',
  maxSampleRate: 30_000, // Sample at most every 30 seconds
})
