import {defineEvent} from '@sanity/telemetry'

/** @internal */
export interface ListenerPeakMeasuredData {
  /** The most listeners this tab's Studio clients held open at once. */
  peakListenerCount: number
  /** The most Studio tabs open at once on this origin, this one included. */
  peakStudioTabCount: number | null
  /** The `nextHopProtocol` of a request to the API, such as `h2`, `h3` or `http/1.1`. */
  protocol: string
  sessionDurationMs: number
}

/** @internal */
export const ListenerPeakMeasured = defineEvent<ListenerPeakMeasuredData>({
  name: 'Listener Peak Measured',
  version: 1,
  description: 'The most listeners a Studio tab held open at once, sent when the tab closes',
})
