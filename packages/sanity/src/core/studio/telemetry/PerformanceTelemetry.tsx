// Tracks performance metrics from the field
import {type PropsWithChildren} from 'react'

import {CapabilityGate} from '../../components/CapabilityGate'
import {useMeasurePerformanceTelemetry} from './useMeasurePerformanceTelemetry'
import {useSoftNavigationTelemetry} from './useSoftNavigationTelemetry'
import {useWebVitalsTelemetry} from './useWebVitalsTelemetry'

/**
 * Component that tracks performance telemetry for the Studio.
 *
 * Metrics tracked:
 * - INP v1 (legacy, via useMeasurePerformanceTelemetry)
 * - Core Web Vitals (LCP, FCP, CLS, TTFB, INP v2 via useWebVitalsTelemetry)
 * - Soft-navigation vitals, one event per soft navigation (via useSoftNavigationTelemetry)
 *
 * @internal
 */
export function PerformanceTelemetryTracker(props: PropsWithChildren) {
  return (
    <>
      {/* A message bus host shares the page with Studio, so the page's metrics aren't Studio's. */}
      <CapabilityGate capability="messageBus" condition="unavailable">
        <PagePerformanceTelemetry />
      </CapabilityGate>
      {props.children}
    </>
  )
}

function PagePerformanceTelemetry(): null {
  // Legacy INP tracking - keep during migration to web-vitals
  useMeasurePerformanceTelemetry()

  // Core Web Vitals via web-vitals library
  useWebVitalsTelemetry()

  useSoftNavigationTelemetry()

  return null
}
