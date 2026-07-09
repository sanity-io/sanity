import {useEffect} from 'react'

import {CorsOriginErrorScreen} from './CorsOriginErrorScreen'

const POLL_INTERVAL_FOCUSED_MS = 5_000
const POLL_INTERVAL_HIDDEN_MS = 30_000

/** @internal */
export interface CorsErrorEvent {
  isStaging: boolean
  projectId?: string
  /**
   * Mirrors `/check/cors`'s `result.allowed` — whether the origin is in
   * the project's CORS allowlist at all.
   */
  allowed: boolean
  /**
   * Mirrors `/check/cors`'s `result.withCredentials` — whether the
   * allowlist entry permits credentialed requests. When `allowed: true`
   * and `withCredentials: false`, the screen shows the "re-add with
   * credentials" branch. Otherwise it shows the
   * "register Studio / add CORS origin" branch.
   */
  withCredentials: boolean
  /**
   * Whether the failure arrived as a *readable* CORS-rejection 403 — proof
   * the environment rewrites response headers (a regular browser can never
   * read the gateway's rejection), most commonly an unsafe CORS-unblocking
   * extension. The screen adds a warning about the rewriting.
   */
  readableRejection: boolean
  /**
   * Re-runs the CORS probe with a fresh result (cache invalidated).
   * Resolves with `true` while still misconfigured, `false` when both
   * `allowed` and `withCredentials` are satisfied. Used by the screen's
   * poll loop.
   */
  recheck: () => Promise<boolean>
}

interface CorsOriginErrorViewProps {
  event: CorsErrorEvent
  primaryProjectId?: string
  /** Called when the recheck confirms CORS is no longer misconfigured. */
  onResolved: () => void
}

/**
 * Wraps `CorsOriginErrorScreen` with a poll loop that periodically re-checks
 * whether the CORS misconfig has been fixed (via Manage / register flow).
 * On resolution, calls `onResolved` so `WorkspacesProvider` can swap the
 * screen for its normal children.
 *
 * Polling cadence depends on `document.visibilityState`: 5s while focused,
 * 30s when hidden. An immediate check fires on `visibilitychange` → visible
 * and on `focus`, so returning to the tab after fixing the misconfig in
 * Manage resolves quickly.
 *
 * @internal
 */
export function CorsOriginErrorView(props: CorsOriginErrorViewProps): React.ReactElement {
  const {event, primaryProjectId, onResolved} = props
  const {recheck} = event

  useEffect(() => {
    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    const runCheck = async () => {
      if (cancelled) return
      try {
        const stillMisconfigured = await recheck()
        if (cancelled) return
        if (!stillMisconfigured) {
          onResolved()
          return
        }
      } catch {
        // Treat probe errors as "still misconfigured" — better to keep the
        // screen up than to flicker into a broken studio. Next tick will
        // try again.
      }
      schedule()
    }

    const schedule = () => {
      if (cancelled) return
      const interval =
        typeof document !== 'undefined' && document.visibilityState === 'hidden'
          ? POLL_INTERVAL_HIDDEN_MS
          : POLL_INTERVAL_FOCUSED_MS
      timeoutId = setTimeout(runCheck, interval)
    }

    // Immediate check on tab focus / visibility return — typical recovery
    // flow is "fix CORS in Manage tab → switch back here."
    const checkNow = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = undefined
      }
      void runCheck()
    }
    const handleVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        checkNow()
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', checkNow)
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibility)
    }

    schedule()

    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', checkNow)
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibility)
      }
    }
  }, [recheck, onResolved])

  return (
    <CorsOriginErrorScreen
      projectId={event.projectId}
      isStaging={event.isStaging}
      primaryProjectId={primaryProjectId}
      allowed={event.allowed}
      withCredentials={event.withCredentials}
      readableRejection={event.readableRejection}
      origin={window.location.origin}
    />
  )
}
