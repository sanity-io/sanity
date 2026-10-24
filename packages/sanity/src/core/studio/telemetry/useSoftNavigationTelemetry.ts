import {type TelemetryLogger} from '@sanity/telemetry'
import {useTelemetry} from '@sanity/telemetry/react'
import {useEffect} from 'react'
import {onCLS, onFCP, onINP, onLCP} from 'web-vitals'

import {PerformanceSoftNavigationMeasured} from '../__telemetry__/performance.telemetry'
import {useWorkspace} from '../workspace'
import {
  createSoftNavigationReporter,
  SOFT_NAVIGATION_SAMPLE_RATE,
  type SoftNavigationWorkspace,
} from './softNavigationReporter'
import {isDebugTelemetryEnabled} from './utils/debugLoggingStore'

const SOFT_NAVIGATION_OPTIONS = {reportSoftNavs: true}
// Soft LCP finalises after the next click has run, when its element may already be detached.
const SOFT_LCP_OPTIONS = {...SOFT_NAVIGATION_OPTIONS, reportAllChanges: true}

// Module scope so a page load rolls once, not again on remount or workspace switch.
const isPageLoadSampled = Math.random() < SOFT_NAVIGATION_SAMPLE_RATE
const MAX_TRACKED_URLS = 50

function shouldReportSoftNavigations(): boolean {
  const supportsSoftNavigations =
    globalThis.PerformanceObserver?.supportedEntryTypes?.includes('soft-navigation') ?? false
  // Debug telemetry only logs to the console, so it reports every session to make soft navs testable.
  return supportsSoftNavigations && (isDebugTelemetryEnabled() || isPageLoadSampled)
}

// Chromium emits no soft nav for some URL changes, so the previous soft nav's URL can be stale.
function trackPreviousURLs(): (navigationURL: string) => string | undefined {
  const previousURLs = new Map<string, string>()
  globalThis.navigation?.addEventListener('currententrychange', (event) => {
    const currentURL = globalThis.navigation.currentEntry?.url
    const previousURL = event.from.url
    // Tools such as Releases replace their URL with itself on mount, which would erase where the user came from.
    if (currentURL && previousURL && previousURL !== currentURL) {
      previousURLs.delete(currentURL)
      previousURLs.set(currentURL, previousURL)
    }
    if (previousURLs.size > MAX_TRACKED_URLS) {
      previousURLs.delete(previousURLs.keys().next().value ?? '')
    }
  })
  return (navigationURL) => previousURLs.get(navigationURL)
}

// Studio remounts its telemetry provider on every workspace switch, and web-vitals has no
// unsubscribe, so the page registers once and each mount only points it at its own logger.
const page: {
  telemetry?: TelemetryLogger<unknown>
  workspace: SoftNavigationWorkspace
  isStarted: boolean
} = {
  workspace: {basePath: '/', toolNames: []},
  isStarted: false,
}

function startPageReporting(): void {
  const reporter = createSoftNavigationReporter({
    initialURL: location.href,
    getWorkspace: () => page.workspace,
    getPreviousURL: trackPreviousURLs(),
    send: (event) => page.telemetry?.log(PerformanceSoftNavigationMeasured, event),
  })
  onLCP(reporter.record, SOFT_LCP_OPTIONS)
  onFCP(reporter.record, SOFT_NAVIGATION_OPTIONS)
  onINP(reporter.record, SOFT_NAVIGATION_OPTIONS)
  onCLS(reporter.record, SOFT_NAVIGATION_OPTIONS)
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

  useEffect(() => {
    page.telemetry = telemetry
    page.workspace = {
      basePath: workspace.basePath,
      toolNames: workspace.tools.map((tool) => tool.name),
    }
    if (page.isStarted) return
    page.isStarted = true
    if (shouldReportSoftNavigations()) startPageReporting()
  }, [telemetry, workspace])
}
