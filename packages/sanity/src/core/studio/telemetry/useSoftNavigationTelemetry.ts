import {useTelemetry} from '@sanity/telemetry/react'
import {useEffect, useRef} from 'react'
import {onCLS, onFCP, onINP, onLCP} from 'web-vitals'

import {type Workspace} from '../../config/types'
import {PerformanceSoftNavigationMeasured} from '../__telemetry__/performance.telemetry'
import {useWorkspace} from '../workspace'
import {
  createSoftNavigationReporter,
  SOFT_NAVIGATION_SAMPLE_RATE,
  type SoftNavigationReporter,
  type SoftNavigationWorkspace,
} from './softNavigationReporter'
import {isSessionSampled} from './softNavigationSampling'
import {telemetrySessionId} from './telemetrySession'
import {isDebugTelemetryEnabled} from './utils/debugLoggingStore'

const SOFT_NAVIGATION_OPTIONS = {reportSoftNavs: true}
// Soft LCP finalises after the next click has run, when its element may already be detached.
const SOFT_LCP_OPTIONS = {...SOFT_NAVIGATION_OPTIONS, reportAllChanges: true}

function supportsSoftNavigations(): boolean {
  return globalThis.PerformanceObserver?.supportedEntryTypes?.includes('soft-navigation') ?? false
}

function isSessionInSample(): boolean {
  // Debug telemetry only logs to the console, so it reports every session to make soft navs testable.
  return (
    isDebugTelemetryEnabled() || isSessionSampled(telemetrySessionId, SOFT_NAVIGATION_SAMPLE_RATE)
  )
}

function shouldReportSoftNavigations(): boolean {
  return supportsSoftNavigations() && isSessionInSample()
}

function toSoftNavigationWorkspace(workspace: Workspace): SoftNavigationWorkspace {
  return {basePath: workspace.basePath, toolNames: workspace.tools.map((tool) => tool.name)}
}

const MAX_TRACKED_URLS = 50

// Chromium skips soft-nav entries for some URL changes, so the previous soft nav's URL can be stale.
function trackPreviousURLs(): (navigationURL: string) => string | undefined {
  const previousURLs = new Map<string, string>()
  globalThis.navigation?.addEventListener('currententrychange', (event) => {
    const currentURL = globalThis.navigation.currentEntry?.url
    const previousURL = event.from.url
    if (currentURL && previousURL) {
      previousURLs.delete(currentURL)
      previousURLs.set(currentURL, previousURL)
    }
    if (previousURLs.size > MAX_TRACKED_URLS) {
      previousURLs.delete(previousURLs.keys().next().value ?? '')
    }
  })
  return (navigationURL) => previousURLs.get(navigationURL)
}

function flushWhenHidden(reporter: SoftNavigationReporter) {
  // Registered after web-vitals' own listeners, so the metrics it finalises on hide land first.
  addEventListener(
    'visibilitychange',
    () => {
      if (document.visibilityState === 'hidden') reporter.flush()
    },
    {capture: true},
  )
  addEventListener('pagehide', reporter.flush, {capture: true})
}

/**
 * Reports one `Performance Soft Navigation Measured` event per soft navigation, for a
 * sample of sessions in browsers that emit soft-navigation entries.
 *
 * A second web-vitals registration with `reportSoftNavs`, independent of the hard-navigation
 * one in `useWebVitalsTelemetry`: web-vitals keys its entry managers per options object.
 *
 * @internal
 */
export function useSoftNavigationTelemetry(): void {
  const telemetry = useTelemetry()
  const workspace = useWorkspace()
  const workspaceRef = useRef(toSoftNavigationWorkspace(workspace))
  const hasInitialized = useRef(false)

  useEffect(() => {
    workspaceRef.current = toSoftNavigationWorkspace(workspace)
  }, [workspace])

  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    if (shouldReportSoftNavigations()) {
      const reporter = createSoftNavigationReporter({
        initialURL: location.href,
        getWorkspace: () => workspaceRef.current,
        getPreviousURL: trackPreviousURLs(),
        send: (event) => telemetry.log(PerformanceSoftNavigationMeasured, event),
      })
      onLCP(reporter.record, SOFT_LCP_OPTIONS)
      onFCP(reporter.record, SOFT_NAVIGATION_OPTIONS)
      onINP(reporter.record, SOFT_NAVIGATION_OPTIONS)
      onCLS(reporter.record, SOFT_NAVIGATION_OPTIONS)
      flushWhenHidden(reporter)
    }
  }, [telemetry])
}
