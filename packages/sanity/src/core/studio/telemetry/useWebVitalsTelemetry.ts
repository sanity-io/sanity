import {useTelemetry} from '@sanity/telemetry/react'
import {useEffect, useRef} from 'react'
import {onCLS, onFCP, onINP, onLCP, onTTFB} from 'web-vitals/attribution'

import {
  PerformanceCLSMeasured,
  PerformanceFCPMeasured,
  PerformanceINPMeasuredV2,
  PerformanceLCPMeasured,
  PerformanceTTFBMeasured,
} from '../__telemetry__/performance.telemetry'

/**
 * Tracks Core Web Vitals using Google's web-vitals library.
 *
 * This hook should be called once at the root of the application.
 * It sets up observers for all Core Web Vitals and logs them to telemetry.
 *
 * Metrics tracked:
 * - **LCP** (Largest Contentful Paint) - loading performance
 * - **FCP** (First Contentful Paint) - initial render
 * - **CLS** (Cumulative Layout Shift) - visual stability
 * - **TTFB** (Time to First Byte) - server response time
 * - **INP** (Interaction to Next Paint) - interactivity
 *
 * Uses the attribution build for diagnostic data to help identify
 * the causes of performance issues. Each metric includes:
 * - Base data: name, value, rating, delta, id, entries, navigationType
 * - Attribution data: metric-specific diagnostic information
 *
 * @remarks
 * - The web-vitals library manages its own PerformanceObservers
 * - Each function should only be called once per page load
 * - CLS is only reported on page hide (visibilitychange)
 * - INP is the worst interaction latency during the page session
 *
 * @internal
 */
export function useWebVitalsTelemetry(): void {
  const telemetry = useTelemetry()
  const hasInitialized = useRef(false)

  useEffect(() => {
    // Prevent double initialization in React StrictMode or during HMR
    // web-vitals functions should only be called once per page load
    if (hasInitialized.current) {
      return
    }
    hasInitialized.current = true

    // LCP - Largest Contentful Paint
    // Measures loading performance - when the largest content element is visible
    // Attribution: target, url, timeToFirstByte, resourceLoadDelay, etc.
    onLCP((metric) => {
      telemetry.log(PerformanceLCPMeasured, metric)
    })

    // FCP - First Contentful Paint
    // Measures when the first content is painted to the screen
    // Attribution: timeToFirstByte, firstByteToFCP, loadState, etc.
    onFCP((metric) => {
      telemetry.log(PerformanceFCPMeasured, metric)
    })

    // CLS - Cumulative Layout Shift
    // Measures visual stability - reported on page hide
    // Note: CLS is Chromium-only, Firefox/Safari won't fire this callback
    // Attribution: largestShiftTarget, largestShiftTime, largestShiftValue, etc.
    onCLS((metric) => {
      telemetry.log(PerformanceCLSMeasured, metric)
    })

    // TTFB - Time to First Byte
    // Measures server response time and network latency
    // Attribution: waitingDuration, cacheDuration, dnsDuration, etc.
    onTTFB((metric) => {
      telemetry.log(PerformanceTTFBMeasured, metric)
    })

    // INP - Interaction to Next Paint (v2 with attribution)
    // Measures responsiveness - the worst interaction latency
    // This runs alongside the existing INP hook during migration
    // Attribution: interactionTarget, inputDelay, processingDuration, etc.
    onINP((metric) => {
      telemetry.log(PerformanceINPMeasuredV2, metric)
    })

    // No cleanup function needed:
    // - web-vitals manages its own PerformanceObserver lifecycle
    // - Observers persist for the page lifetime (intentional)
    // - Disconnecting would prevent final CLS/INP reports on page hide
  }, [telemetry])
}
