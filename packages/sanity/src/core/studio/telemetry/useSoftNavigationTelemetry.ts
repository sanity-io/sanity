import {type TelemetryLogger} from '@sanity/telemetry'
import {useTelemetry} from '@sanity/telemetry/react'
import {useEffect} from 'react'
import {onCLS, onFCP, onINP, onLCP} from 'web-vitals'

import {type Workspace} from '../../config/types'
import {PerformanceSoftNavigationMeasured} from '../__telemetry__/performance.telemetry'
import {useWorkspace} from '../workspace'
import {createPreviousURLTracker, type PreviousURLTracker} from './previousURLTracker'
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

function trackPreviousURLs(): PreviousURLTracker['get'] {
  const tracker = createPreviousURLTracker()
  globalThis.navigation?.addEventListener('currententrychange', (event) => {
    const currentURL = globalThis.navigation.currentEntry?.url
    const previousURL = event.from.url
    if (currentURL && previousURL) tracker.record(previousURL, currentURL)
  })
  return tracker.get
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

interface PageSoftNavigationTelemetry {
  telemetry?: TelemetryLogger<unknown>
  workspace: SoftNavigationWorkspace
  isStarted: boolean
}

// Studio remounts its telemetry provider on every workspace switch, and web-vitals has no
// unsubscribe, so the page registers once and each mount only points it at its own logger.
const page: PageSoftNavigationTelemetry = {
  workspace: {basePath: '/', toolNames: []},
  isStarted: false,
}

function startPageReporting() {
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
  flushWhenHidden(reporter)
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
    page.workspace = toSoftNavigationWorkspace(workspace)
    if (page.isStarted) return
    page.isStarted = true
    if (shouldReportSoftNavigations()) startPageReporting()
  }, [telemetry, workspace])
}
