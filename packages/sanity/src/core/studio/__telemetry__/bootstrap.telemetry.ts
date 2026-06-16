import {defineEvent} from '@sanity/telemetry'

import {type PageVisibilitySnapshot} from '../telemetry/pageVisibility'

/**
 * Time from browser navigation start to the moment Studio resolves the
 * auth state (logged-in, logged-out, or unauthorized).
 *
 * This event fires once per Studio session, from within `AuthBoundary`,
 * the first time the auth state subscription emits something other than
 * `'loading'`. Because `DeferredTelemetryProvider` wraps everything below
 * `<Studio />`, this event is buffered before the real telemetry provider
 * mounts and replayed later with full `TelemetryContext` attached.
 *
 * `durationMs` is `performance.now()` at log time, which is relative to
 * `performance.timeOrigin` (= browser navigation start). This matches the
 * baseline used by `web-vitals` for LCP/FCP.
 *
 * The visibility fields (see {@link PageVisibilitySnapshot}) record whether the
 * page was backgrounded during the load. Background tabs are throttled while
 * `performance.now()` keeps advancing, so `wasHidden: true` loads carry an
 * inflated `durationMs` and should be excluded when looking at user-perceived
 * timings.
 *
 * Does not fire in embedded Studios that set `unstable_noAuthBoundary`,
 * because the `AuthBoundary` component is not rendered in that case.
 */
export interface StudioAuthReadyMeasuredData extends PageVisibilitySnapshot {
  /** ms since browser navigationStart (= `performance.now()` at log time) */
  durationMs: number
  /** resolved auth state at the moment this event fired */
  authState: 'logged-in' | 'logged-out' | 'unauthorized'
}

export const StudioAuthReadyMeasured = defineEvent<StudioAuthReadyMeasuredData>({
  name: 'Studio Auth Ready Measured',
  version: 2,
  description:
    'Time from browser navigation start to the moment Studio resolves the ' +
    'auth state (logged-in, logged-out, or unauthorized), with page-visibility ' +
    'context to distinguish foreground loads from backgrounded ones.',
})

/**
 * Time from browser navigation start to the moment the Studio layout
 * has rendered the active tool and is interactive.
 *
 * This event fires once per Studio session, from within `StudioLayoutComponent`,
 * the first time `activeTool` resolves to a defined tool. Represents the
 * user-perceived "Studio is ready" moment.
 *
 * `durationMs` is `performance.now()` at log time, which is relative to
 * `performance.timeOrigin` (= browser navigation start).
 *
 * The visibility fields (see {@link PageVisibilitySnapshot}) record whether the
 * page was backgrounded during the load, so `wasHidden: true` loads can be
 * excluded when looking at user-perceived timings.
 */
export interface StudioReadyMeasuredData extends PageVisibilitySnapshot {
  /** ms since browser navigationStart (= `performance.now()` at log time) */
  durationMs: number
  /** total number of tools registered in this workspace */
  toolsCount: number
  /** name of the tool that was active when Studio became ready */
  activeToolName: string | null
}

export const StudioReadyMeasured = defineEvent<StudioReadyMeasuredData>({
  name: 'Studio Ready Measured',
  version: 2,
  description:
    'Time from browser navigation start to the moment the active tool has ' +
    'first rendered and the Studio layout is interactive, with page-visibility ' +
    'context to distinguish foreground loads from backgrounded ones.',
})
