import {defineEvent} from '@sanity/telemetry'

import {type RequestActivityWindowSummary} from '../diagnostics/requestActivity'

/**
 * Browsers allow about 100 requests in flight per HTTP/2 or HTTP/3 connection to the Sanity API,
 * shared by every tab, and each listener holds one for as long as it's open. These events show how
 * close Studio sessions get to that budget, and how often requests end up waiting for it.
 */

/** @internal */
export interface RequestActivitySummarizedData extends RequestActivityWindowSummary {
  /** Whether the tab was visible when the window ended */
  visibilityState: string
}

/** @internal */
export const RequestActivitySummarized = defineEvent<RequestActivitySummarizedData>({
  name: 'Request Activity Summarized',
  version: 1,
  description:
    'Peak open listeners and waiting requests in this tab, and how many requests it started, over a window of up to five minutes',
})

/** @internal */
export interface RequestActivityCounts {
  /** Listeners and other event streams that are open */
  openStreams: number
  /** Requests waiting for response headers */
  pendingRequests: number
  /** How long the longest-waiting request has been waiting */
  oldestPendingMs?: number
}

/** @internal */
export interface BrowserRequestLimitApproachedData {
  /**
   * `long-wait`: a request has waited a long time for a response, which usually means it is queued
   * in the browser (other tabs may hold the connection) or the network is stalling.
   * `many-in-flight`: this tab alone holds most of the connection's request budget.
   */
  trigger: 'long-wait' | 'many-in-flight'
  tab: RequestActivityCounts
  /** Totals across the Studio tabs in this browser that answered, including this one */
  allTabs?: RequestActivityCounts & {tabs: number}
}

/** @internal */
export const BrowserRequestLimitApproached = defineEvent<BrowserRequestLimitApproachedData>({
  name: 'Browser Request Limit Approached',
  version: 1,
  description:
    "Requests waited a long time for a response, or this tab held most of the browser's request budget for the Sanity API",
  maxSampleRate: 10 * 60_000,
})
