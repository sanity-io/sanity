import {defineEvent} from '@sanity/telemetry'

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
 * Does not fire in embedded Studios that set `unstable_noAuthBoundary`,
 * because the `AuthBoundary` component is not rendered in that case.
 */
export interface StudioAuthReadyMeasuredData {
  /** ms since browser navigationStart (= `performance.now()` at log time) */
  durationMs: number
  /** resolved auth state at the moment this event fired */
  authState: 'logged-in' | 'logged-out' | 'unauthorized'
}

export const StudioAuthReadyMeasured = defineEvent<StudioAuthReadyMeasuredData>({
  name: 'Studio Auth Ready Measured',
  version: 1,
  description:
    'Time from browser navigation start to the moment Studio resolves the ' +
    'auth state (logged-in, logged-out, or unauthorized).',
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
 */
export interface StudioReadyMeasuredData {
  /** ms since browser navigationStart (= `performance.now()` at log time) */
  durationMs: number
  /** total number of tools registered in this workspace */
  toolsCount: number
  /** name of the tool that was active when Studio became ready */
  activeToolName: string | null
}

export const StudioReadyMeasured = defineEvent<StudioReadyMeasuredData>({
  name: 'Studio Ready Measured',
  version: 1,
  description:
    'Time from browser navigation start to the moment the active tool has ' +
    'first rendered and the Studio layout is interactive.',
})
