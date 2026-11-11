import {defineEvent} from '@sanity/telemetry'

import {type StallKind} from '../../network/classifyStall'

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

/** @internal */
export interface ListenerLimitMessageShownData {
  /** `classifyStall`'s verdict for this occurrence. */
  kind: StallKind
  /** Calibration: every tab's listener count summed, this tab included. */
  listenersAllTabs: number
  /** This tab's own listener count at the time of the stall. */
  listenersThisTab: number
  /** Every other known tab's listener count summed. */
  listenersOtherTabs: number
  /** Calibration: how many Studio tabs the ledger could read a count from, this one included. */
  knownStudioTabs: number
  /** Calibration: held presence locks from a Studio build too old to publish a count. */
  unknownStudioTabs: number
  /** How many of this tab's own requests were stalled past the trigger at classification time. */
  stalledListenersThisTab: number
  /** How many other known tabs were flagged stalled at the time of the snapshot. */
  stalledOtherTabs: number
  /** Whether the stalled request was the boot-time auth probe, before any listener opened. */
  isBootStall: boolean
  /** Which stall this is for the tab's session - 1 for the first, incrementing after each clears. */
  stallOccurrence: number
  /** How long the oldest pending request had gone without response headers when detected. */
  stalledForMs: number
  /** This tab's own measured `nextHopProtocol`, never a peer's. */
  protocol: string
  /** The hardcoded listener-stream budget the classifier compared the totals against. */
  budget: number
}

/** @internal */
export const ListenerLimitMessageShown = defineEvent<ListenerLimitMessageShownData>({
  name: 'Studio Listener Limit Message Shown',
  version: 1,
  description: 'A detected listener stall was classified and shown to the editor',
})
