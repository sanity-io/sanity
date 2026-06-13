/**
 * Tracks whether the document has been hidden during this page load.
 *
 * The navigation-anchored timing events (`Studio Auth Ready Measured`,
 * `Studio Ready Measured`) record `performance.now()` from navigation start. A
 * backgrounded tab is throttled while `performance.now()` keeps advancing, so its
 * measured durations are inflated even though no user was waiting. Stamping each
 * event with a visibility snapshot lets analysis separate foreground loads from
 * backgrounded ones instead of inferring it from a missing web-vitals event.
 *
 * The latch mirrors web-vitals' `firstHiddenTime` guard, which is not publicly
 * exported. The listener registers at module evaluation; the initial value also
 * covers a document already hidden at that point (a load opened in the background).
 *
 * @internal
 */

const isBrowser = typeof document !== 'undefined'

/**
 * `performance.now()` of the first hide, or `Number.POSITIVE_INFINITY` while the
 * document has only ever been visible. Prerendering documents report `'hidden'`,
 * so they need no separate handling.
 */
let firstHiddenTime =
  isBrowser && document.visibilityState === 'hidden' ? 0 : Number.POSITIVE_INFINITY

function handleVisibilityChange() {
  if (document.visibilityState === 'hidden' && firstHiddenTime === Number.POSITIVE_INFINITY) {
    firstHiddenTime = performance.now()
  }
}

if (isBrowser) {
  // Latched once and never removed: it must observe for the whole page lifetime.
  document.addEventListener('visibilitychange', handleVisibilityChange, {capture: true})
}

/** @internal */
export interface PageVisibilitySnapshot {
  /**
   * Whether the document was hidden at any point before the measured moment.
   * `false` is a clean foreground load; `true` may have an inflated duration.
   */
  wasHidden: boolean
  visibilityState: DocumentVisibilityState
  /** ms of the first hide (rounded), or `null` if the document stayed visible. */
  firstHiddenTime: number | null
}

/**
 * Visibility snapshot for a measurement taken at `measuredAt`, a `performance.now()`
 * reading that defaults to the current time.
 *
 * @internal
 */
export function getPageVisibilitySnapshot(
  measuredAt: number = isBrowser ? performance.now() : 0,
): PageVisibilitySnapshot {
  return {
    wasHidden: firstHiddenTime < measuredAt,
    visibilityState: isBrowser ? document.visibilityState : 'visible',
    firstHiddenTime:
      firstHiddenTime === Number.POSITIVE_INFINITY ? null : Math.round(firstHiddenTime),
  }
}
