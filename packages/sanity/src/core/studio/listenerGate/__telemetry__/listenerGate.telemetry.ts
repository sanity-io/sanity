import {defineEvent} from '@sanity/telemetry'

/**
 * The page had been hidden for longer than the grace period, and Studio's listeners gave their
 * connections up (`beta.releaseBackgroundListeners`).
 */
export const ListenersPaused = defineEvent({
  name: 'Listeners Paused',
  version: 1,
  description:
    'Studio closed its listener connections because the page had been hidden for longer than ' +
    'the grace period.',
})

/** @internal */
export interface ListenersResumedData {
  /** How long the listeners were paused, in milliseconds */
  pausedDurationMs: number
  /**
   * `visible`: the page was shown again. `hold`: the page stayed hidden, but a document got
   * changes that are not saved yet, which need the listeners to confirm them.
   */
  reason: 'visible' | 'hold'
}

/**
 * Studio's listeners connected again after a pause (`beta.releaseBackgroundListeners`).
 */
export const ListenersResumed = defineEvent<ListenersResumedData>({
  name: 'Listeners Resumed',
  version: 1,
  description:
    'Studio opened its listener connections again after closing them for a hidden page, with ' +
    'how long they were closed and why they opened again.',
})
