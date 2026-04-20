import {defineEvent} from '@sanity/telemetry'

export const RecentSearchClicked = defineEvent({
  name: 'Recent Search Viewed',
  version: 1,
  description: 'User clicked on a recent search item to reapply it',
})

/**
 * Time from a global navbar search being dispatched (post-debounce) to
 * its results arriving or failing.
 *
 * Timing origin (T0) is the `onStart` callback of the search pipeline,
 * which fires after the 300ms debounce (we want network latency, not
 * the user's typing pause). Timing end (T1) is the `onComplete` or
 * `onError` callback in the same pipeline.
 *
 * Fires only for searches with searchable terms; empty-term "searches"
 * (where the pipeline short-circuits to an empty observable) are
 * skipped to avoid noising the metric.
 *
 * Not overlapping with `Document List Load Time Measured`, which
 * measures search within the structure tool's document list. This
 * event covers the global omnisearch only.
 *
 * Sampled at most every 30 seconds to bound the event volume when
 * users type quickly (matches existing `Document Pair Load Time
 * Measured` and `Document List Load Time Measured`).
 */
export interface GlobalSearchLatencyMeasuredData {
  /** ms from onStart to onComplete/onError */
  durationMs: number
  queryLength: number
  typeFilterCount: number
  /** number of hits returned (0 when errored) */
  resultCount: number
  /** search strategy from workspace config (e.g. 'text-search', 'groq2024') */
  strategy: string | null
  /** true when the pipeline called onError instead of onComplete */
  errored: boolean
}

export const GlobalSearchLatencyMeasured = defineEvent<GlobalSearchLatencyMeasuredData>({
  name: 'Global Search Latency Measured',
  version: 1,
  description:
    'Time from a global navbar search being dispatched (post-debounce) to ' +
    'its results arriving or failing.',
  maxSampleRate: 30_000,
})
