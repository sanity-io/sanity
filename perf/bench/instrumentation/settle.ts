/**
 * Settle-only in-page instrumentation, injected as a SECOND init script by
 * the settle session exclusively — never by interaction/pageload/inp/soak.
 * Keeping it out of instrumentation/index.ts is a structural guarantee: the
 * collector every other mode runs stays byte-identical, so adding settle
 * cannot perturb any existing metric (see perf/bench/README.md).
 *
 * What it measures: actual React render cycles. Production react-dom calls
 * `__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot(...)` on every commit
 * (that is how React DevTools attaches to production apps), so a minimal
 * hook stub installed before React loads counts every committed render pass
 * across ALL components — studio core and bench workspace alike. A react-rx
 * style render loop is one state update → render → commit per iteration, so
 * a loop shows up here even when each frame is too cheap to register as a
 * Long Animation Frame.
 *
 * The hook interface is not a public API. Every method is a defensive no-op
 * and the counter body is wrapped in try/catch — if React changes the
 * contract, the stub must degrade to "no commit signal" (hookInstalled:
 * false, or simply zero buckets), never break the page. The settle session
 * treats a missing commit signal as "fall back to LoAF + render-mark
 * activity", not as a failure.
 */

import {COMMIT_BUCKET_MS, type CommitBucket} from './settleShared'

function install(): void {
  const buckets: CommitBucket[] = []
  let hookInstalled = false

  try {
    if (!window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      const renderers = new Map<number, unknown>()
      let nextRendererId = 1

      const recordCommit = () => {
        try {
          const now = performance.now()
          const bucketStart = Math.floor(now / COMMIT_BUCKET_MS) * COMMIT_BUCKET_MS
          const last = buckets[buckets.length - 1]
          if (last && last.startTime === bucketStart) {
            last.count += 1
          } else {
            buckets.push({startTime: bucketStart, count: 1})
          }
        } catch {
          // Never break the host app from inside a React commit.
        }
      }

      // The subset of the DevTools hook production react-dom interacts with,
      // plus no-ops for the dev/profiling callbacks so a future react-dom
      // that stops existence-checking them still finds a function.
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
        isDisabled: false,
        supportsFiber: true,
        renderers,
        inject(internals: unknown) {
          const id = nextRendererId++
          renderers.set(id, internals)
          return id
        },
        checkDCE() {},
        onCommitFiberRoot: recordCommit,
        onCommitFiberUnmount() {},
        onPostCommitFiberRoot() {},
        onScheduleFiberRoot() {},
        setStrictMode() {},
      }
      hookInstalled = true
    }
  } catch {
    hookInstalled = false
  }

  window.__benchSettle = {
    version: 1,
    take() {
      return {commits: buckets.splice(0), hookInstalled}
    },
  }
}

install()
