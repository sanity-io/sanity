/**
 * Page visibility tracking for navigation-anchored timing telemetry.
 *
 * Timing events such as `Studio Auth Ready Measured` and `Studio Ready Measured`
 * record `performance.now()` relative to `performance.timeOrigin` (navigation
 * start). When a page loads in a background tab, or is hidden part-way through
 * loading, the browser throttles its work while `performance.now()` keeps
 * advancing in wall-clock time. The measured duration is then inflated by the
 * time the page spent hidden, even though no user was waiting on a spinner.
 *
 * This module records the first moment the document became hidden so that each
 * timing event can be stamped with whether it was affected. Analysis can then
 * separate genuine foreground loads from backgrounded ones with certainty,
 * rather than inferring it from the absence of a web-vitals event. The approach
 * mirrors the `firstHiddenTime` guard the `web-vitals` library applies to its
 * own metrics; web-vitals does not expose that watcher publicly, so the latch is
 * reimplemented here.
 *
 * The listener is registered when this module is first evaluated, which happens
 * during boot as the importing component modules load. It latches from that
 * point onward, and the initial value additionally covers a document that is
 * already hidden when the module first runs (the common case of a studio opened
 * in a background tab). The one case it cannot observe is a hide that both starts
 * and ends before this module evaluates.
 *
 * @internal
 */

const isBrowser = typeof document !== 'undefined'

/**
 * `performance.now()` of the first time the document was observed hidden, or
 * `Number.POSITIVE_INFINITY` while it has only ever been visible. Initialised to
 * `0` when the document is already hidden at module load, so a background-tab
 * load is captured even if the listener attaches after the fact.
 */
let firstHiddenTime =
  isBrowser && document.visibilityState === 'hidden' ? 0 : Number.POSITIVE_INFINITY

function handleVisibilityChange() {
  if (document.visibilityState === 'hidden' && firstHiddenTime === Number.POSITIVE_INFINITY) {
    firstHiddenTime = performance.now()
  }
}

if (isBrowser) {
  // `capture` so we record the hide as early as possible in the event phase.
  // `once` is intentionally omitted because the value is latched in the handler,
  // so later visibility changes are ignored. The listener is never removed: it
  // must observe for the whole page lifetime, and the latch makes repeat fires cheap.
  document.addEventListener('visibilitychange', handleVisibilityChange, {capture: true})
}

/**
 * Visibility context for a single navigation-anchored timing measurement.
 *
 * @internal
 */
export interface PageVisibilitySnapshot {
  /**
   * Whether the document was hidden at any point between navigation start and
   * the measured moment. A load with `wasHidden: false` is a clean foreground
   * load; one with `wasHidden: true` may have an inflated duration.
   */
  wasHidden: boolean
  /** `document.visibilityState` at the moment the measurement was taken. */
  visibilityState: DocumentVisibilityState
  /**
   * `performance.now()` of the first time the document became hidden, rounded to
   * a whole millisecond, or `null` if it remained visible throughout. Lets
   * analysis quantify how much of a duration elapsed after the page was hidden.
   */
  firstHiddenTime: number | null
}

/**
 * Returns the visibility context for a measurement taken at `measuredAt`
 * (a `performance.now()` reading, defaulting to the current time).
 *
 * @internal
 */
export function getPageVisibilitySnapshot(
  measuredAt: number = isBrowser ? performance.now() : 0,
): PageVisibilitySnapshot {
  // The non-browser branch is a safe default only; the call sites log from
  // client-only effects, so a snapshot is never taken outside the browser.
  return {
    wasHidden: firstHiddenTime < measuredAt,
    visibilityState: isBrowser ? document.visibilityState : 'visible',
    firstHiddenTime:
      firstHiddenTime === Number.POSITIVE_INFINITY ? null : Math.round(firstHiddenTime),
  }
}
