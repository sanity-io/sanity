/**
 * Per-render instrumentation for settle mode: a zero-duration
 * `performance.measure` with the `bench:render:` prefix. The shared in-page
 * collector already forwards every `bench:`-prefixed measure
 * (instrumentation/index.ts), so this needs no harness change, and the marks
 * come from HEAD's perf/bench tree on both A/B sides — symmetric by
 * construction. Never add marks like this to packages/* code: the merge-base
 * reference build would not have them.
 *
 * Call at the top of an instrumented component's render. The bench runs
 * production studio builds, so there is no StrictMode double-invoke to
 * account for. Naming convention: `<scenario>.<component>`.
 */
export function markRender(name: string): void {
  try {
    performance.measure(`bench:render:${name}`, {
      start: performance.now(),
      duration: 0,
    })
  } catch {
    // Instrumentation must never break rendering.
  }
}
