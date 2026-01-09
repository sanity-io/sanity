import {useTelemetry} from '@sanity/telemetry/react'
import {useEffect, useRef} from 'react'
import {
  onCLS,
  onFCP,
  onINP,
  onLCP,
  onTTFB,
  type CLSMetricWithAttribution,
  type FCPMetricWithAttribution,
  type INPMetricWithAttribution,
  type LCPMetricWithAttribution,
  type TTFBMetricWithAttribution,
} from 'web-vitals/attribution'

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
 * the causes of performance issues.
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
    onLCP((metric: LCPMetricWithAttribution) => {
      telemetry.log(PerformanceLCPMeasured, {
        value: metric.value,
        rating: metric.rating,
        element: metric.attribution?.element?.tagName,
        url: metric.attribution?.url,
        navigationType: metric.navigationType,
      })
    })

    // FCP - First Contentful Paint
    // Measures when the first content is painted to the screen
    onFCP((metric: FCPMetricWithAttribution) => {
      telemetry.log(PerformanceFCPMeasured, {
        value: metric.value,
        rating: metric.rating,
        navigationType: metric.navigationType,
      })
    })

    // CLS - Cumulative Layout Shift
    // Measures visual stability - reported on page hide
    // Note: CLS is Chromium-only, Firefox/Safari won't fire this callback
    onCLS((metric: CLSMetricWithAttribution) => {
      telemetry.log(PerformanceCLSMeasured, {
        value: metric.value,
        rating: metric.rating,
        largestShiftTarget: metric.attribution?.largestShiftTarget?.tagName,
      })
    })

    // TTFB - Time to First Byte
    // Measures server response time and network latency
    onTTFB((metric: TTFBMetricWithAttribution) => {
      telemetry.log(PerformanceTTFBMeasured, {
        value: metric.value,
        rating: metric.rating,
        navigationType: metric.navigationType,
      })
    })

    // INP - Interaction to Next Paint (v2 with attribution)
    // Measures responsiveness - the worst interaction latency
    // This runs alongside the existing INP hook during migration
    onINP((metric: INPMetricWithAttribution) => {
      const attribution = metric.attribution
      telemetry.log(PerformanceINPMeasuredV2, {
        value: metric.value,
        rating: metric.rating,
        target: attribution?.interactionTarget || null,
        interactionType: attribution?.interactionType,
        inputDelay: attribution?.inputDelay,
        processingDuration: attribution?.processingDuration,
        presentationDelay: attribution?.presentationDelay,
      })
    })

    // No cleanup function needed:
    // - web-vitals manages its own PerformanceObserver lifecycle
    // - Observers persist for the page lifetime (intentional)
    // - Disconnecting would prevent final CLS/INP reports on page hide
  }, [telemetry])
}
