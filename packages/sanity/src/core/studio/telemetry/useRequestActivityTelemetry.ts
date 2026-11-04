import {type TelemetryLogger} from '@sanity/telemetry'
import {useTelemetry} from '@sanity/telemetry/react'
import {useEffect} from 'react'

import {SANITY_VERSION} from '../../version'
import {
  BrowserRequestLimitApproached,
  RequestActivitySummarized,
} from '../__telemetry__/requestActivity.telemetry'
import {studioRequestActivity} from '../diagnostics/requestActivity'
import {requestStudioTabsCensus} from '../diagnostics/studioTabsCensus'
import {
  createRequestActivityReporter,
  LIMIT_CHECK_INTERVAL_MS,
  SUMMARY_INTERVAL_MS,
} from './requestActivityReporter'

// Studio remounts its telemetry provider on every workspace switch. Request activity belongs to
// the page, not the workspace, so the page starts reporting once and each mount only points it at
// its own logger. This keeps a workspace switch from cutting a window short or doubling the timers.
const page: {telemetry?: TelemetryLogger<unknown>; isStarted: boolean} = {isStarted: false}

function startPageReporting(): void {
  const reporter = createRequestActivityReporter({
    getVisibilityState: () => document.visibilityState,
    requestCensus: (currentTab) => requestStudioTabsCensus({currentTab}),
    sendLimitApproached: (data) => page.telemetry?.log(BrowserRequestLimitApproached, data),
    sendSummary: (data) => page.telemetry?.log(RequestActivitySummarized, data),
    studioVersion: SANITY_VERSION,
    tracker: studioRequestActivity,
  })

  setInterval(reporter.summarize, SUMMARY_INTERVAL_MS)
  setInterval(() => void reporter.checkLimit(), LIMIT_CHECK_INTERVAL_MS)

  // The telemetry store sends its batch with `sendBeacon` on page hide, so summarize first
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
 * Reports the tab's request activity: a `Request Activity Summarized` event every five minutes (and
 * when the page is hidden), and a `Browser Request Limit Approached` event when requests wait a long
 * time for a response or the tab holds most of the browser's request budget.
 *
 * @internal
 */
export function useRequestActivityTelemetry(): void {
  const telemetry = useTelemetry()

  useEffect(() => {
    page.telemetry = telemetry
    if (!page.isStarted) {
      page.isStarted = true
      startPageReporting()
    }

    return () => {
      if (page.telemetry === telemetry) page.telemetry = undefined
    }
  }, [telemetry])
}
