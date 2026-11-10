import {
  type BrowserRequestLimitApproachedData,
  type RequestActivitySummarizedData,
} from '../__telemetry__/requestActivity.telemetry'
import {
  type RequestActivitySnapshot,
  type RequestActivityTracker,
} from '../diagnostics/requestActivity'
import {
  createStudioTabActivity,
  type StudioTabActivity,
  type StudioTabsCensus,
} from '../diagnostics/studioTabsCensus'

/** How often to summarize this tab's request activity */
export const SUMMARY_INTERVAL_MS = 5 * 60_000

/** How often to check whether requests are waiting or this tab holds too many */
export const LIMIT_CHECK_INTERVAL_MS = 10_000

/** A request waiting this long for a response is likely queued in the browser, or the network is stalling */
export const LONG_WAIT_MS = 10_000

/** Open listeners plus waiting requests in a single tab that make up most of the ~100 request budget */
export const MANY_IN_FLIGHT = 60

/** After reporting, wait this long before checking again (matches the event's sample rate) */
const LIMIT_REPORT_COOLDOWN_MS = 10 * 60_000

/** A window shorter than this isn't worth summarizing when the page is hidden */
const MIN_FLUSH_WINDOW_MS = 30_000

/** @internal */
export interface RequestActivityReporterOptions {
  getVisibilityState: () => string
  now?: () => number
  /** Asks the other Studio tabs in this browser for their request activity */
  requestCensus: (currentTab: StudioTabActivity) => Promise<StudioTabsCensus>
  sendLimitApproached: (data: BrowserRequestLimitApproachedData) => void
  sendSummary: (data: RequestActivitySummarizedData) => void
  studioVersion: string
  tracker: RequestActivityTracker
}

/** @internal */
export interface RequestActivityReporter {
  /** Checks whether requests are waiting long or this tab holds too many, and reports it once per cooldown */
  checkLimit: () => Promise<void>
  /** Summarizes the current window if it has run long enough. For when the page is hidden. */
  flush: () => void
  /** Summarizes the current window and starts a new one */
  summarize: () => void
}

/**
 * Turns the tab's request activity into telemetry: a summary per window, and an event when
 * requests start waiting or the tab holds most of the browser's request budget. Framework-free, so
 * the timers and page lifecycle listeners live in `useRequestActivityTelemetry`.
 *
 * @internal
 */
export function createRequestActivityReporter({
  getVisibilityState,
  now = () => performance.now(),
  requestCensus,
  sendLimitApproached,
  sendSummary,
  studioVersion,
  tracker,
}: RequestActivityReporterOptions): RequestActivityReporter {
  let windowStartedAt = now()
  let lastLimitReportAt: number | undefined
  let checking = false

  function summarize() {
    const summary = tracker.takeWindowSummary()
    windowStartedAt = now()
    // An idle tab with nothing open has nothing to say
    if (summary.requestsStarted === 0 && summary.peakInFlight === 0) return
    sendSummary({...summary, visibilityState: getVisibilityState()})
  }

  return {
    checkLimit: async () => {
      if (checking) return
      if (lastLimitReportAt !== undefined && now() - lastLimitReportAt < LIMIT_REPORT_COOLDOWN_MS) {
        return
      }

      const snapshot = tracker.getSnapshot()
      const trigger = getLimitTrigger(snapshot)
      if (!trigger) return

      checking = true
      try {
        // Other tabs share the connection, so ask them what they hold before reporting
        const census = await requestCensus(createStudioTabActivity(snapshot, studioVersion))
        lastLimitReportAt = now()
        sendLimitApproached({
          allTabs: census.status === 'success' ? census.totals : undefined,
          tab: {
            oldestPendingMs: snapshot.oldestPendingMs,
            openStreams: snapshot.openStreams,
            pendingRequests: snapshot.pendingRequests,
          },
          trigger,
        })
      } finally {
        checking = false
      }
    },

    flush: () => {
      if (now() - windowStartedAt >= MIN_FLUSH_WINDOW_MS) summarize()
    },

    summarize,
  }
}

function getLimitTrigger(
  snapshot: RequestActivitySnapshot,
): BrowserRequestLimitApproachedData['trigger'] | undefined {
  if ((snapshot.oldestPendingMs ?? 0) >= LONG_WAIT_MS) return 'long-wait'
  if (snapshot.openStreams + snapshot.pendingRequests >= MANY_IN_FLIGHT) return 'many-in-flight'
  return undefined
}
