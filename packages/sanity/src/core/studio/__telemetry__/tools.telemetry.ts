import {defineEvent} from '@sanity/telemetry'

/**
 * Time from a tool being selected to its component rendering its first
 * effect — i.e. first paint after Suspense resolves the lazy chunk.
 *
 * Fires once per tool *activation*, not once per session: every tool the
 * user switches to produces an event. `isFirstMount` distinguishes the
 * cold-start activation (first time the user visits this tool in the
 * current page session, including lazy-chunk fetch) from warm switches
 * back to an already-mounted tool.
 *
 * Timing origin (T0) is captured in the parent `StudioLayoutComponent`
 * at the moment `activeToolName` first becomes defined (or changes).
 * Timing end (T1) is the first `useEffect` of a timer component mounted
 * inside the `<Suspense>` boundary, which runs only after the lazy
 * chunk resolves *and* the tool's first render commits.
 *
 * Note: v1 measures only to first React commit. Plugins that async-load
 * their own data post-mount (e.g. Vision fetching CORS origins) will
 * under-report. A plugin-facing `Tool.onReady` lifecycle hook is
 * deferred to v2 — see the telemetry gaps implementation plan (D2.1).
 */
export interface StudioToolMountTimeMeasuredData {
  /** the tool whose mount was measured */
  toolName: string
  /** ms from activeTool becoming defined → first effect of the timer */
  durationMs: number
  /** false if this tool has already mounted earlier in the session (cache hit) */
  isFirstMount: boolean
}

export const StudioToolMountTimeMeasured = defineEvent<StudioToolMountTimeMeasuredData>({
  name: 'Studio Tool Mount Time Measured',
  version: 1,
  description:
    'Time from a tool being selected to its component rendering its first ' +
    'effect (i.e. first paint after Suspense resolves the lazy chunk).',
})
