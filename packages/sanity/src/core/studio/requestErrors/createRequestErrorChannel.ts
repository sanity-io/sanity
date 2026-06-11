import {BehaviorSubject, isObservable, lastValueFrom, type Observable} from 'rxjs'

import {classifyRequestError, isUnauthorizedError} from './classify'
import {
  type RequestErrorChannel,
  type RequestErrorChannelConfig,
  type RequestErrorClaim,
  type RequestErrorReportOptions,
} from './types'

/**
 * Best-effort projectId extraction from an HTTP error's request URL
 * (`https://{projectId}.api.sanity.io/...`). Used to route a delegated
 * 401 to the right workspace's auth store for verification.
 */
function projectIdFromError(err: Error): string | undefined {
  const url =
    (err as Error & {response?: {url?: string}}).response?.url ??
    (err as Error & {request?: {url?: string}}).request?.url
  if (!url) return undefined
  try {
    const host = new URL(url).hostname
    const match = host.match(/^([a-z0-9]+)\.api\.sanity\.(?:io|work)$/)
    return match?.[1]
  } catch {
    return undefined
  }
}

interface ParkedEntry {
  /** Re-runs the failed work. Absent for the `handle()` form. */
  retry?: () => void
}

/**
 * Per-projectId dedupe for 401 verification. A 401 typically arrives for
 * several in-flight requests in the same second, and the forced-logout
 * request itself can also 401 — without dedupe we'd probe and log out
 * repeatedly. 30s covers the burst.
 */
const UNAUTHORIZED_DEDUPE_TTL_MS = 30_000

/**
 * Create the studio's request-error channel. Framework-free — the React
 * side (context provider, dialog rendering) lives in `WorkspacesProvider`.
 *
 * See {@link StudioErrorHandler} for the call-site API and semantics.
 *
 * @internal
 */
export function createRequestErrorChannel(
  config: RequestErrorChannelConfig = {},
): RequestErrorChannel {
  const claimSubject = new BehaviorSubject<RequestErrorClaim | undefined>(undefined)
  let parked: ParkedEntry[] = []
  const recentUnauthorized = new Set<string>()

  function markUnauthorizedOnce(projectId: string | undefined): boolean {
    const key = projectId ?? ''
    if (recentUnauthorized.has(key)) return false
    recentUnauthorized.add(key)
    setTimeout(() => recentUnauthorized.delete(key), UNAUTHORIZED_DEDUPE_TTL_MS)
    return true
  }

  /**
   * Attempt to claim `err` for the studio UI. Resolves `true` when
   * claimed (entry parked, dialog state set) and `false` when the error
   * is caller-domain and should be re-thrown by the caller of this
   * function. May be async because 401 claims require a session probe.
   */
  async function tryClaim(
    err: unknown,
    options: RequestErrorReportOptions,
    entry: ParkedEntry,
  ): Promise<boolean> {
    if (isUnauthorizedError(err)) {
      const {resolveUnauthorized} = config
      if (!resolveUnauthorized) return false
      const projectId = projectIdFromError(err)
      if (!markUnauthorizedOnce(projectId)) {
        // A verification probe for this project is already in flight (or
        // recently concluded with a logout). Park silently to avoid a
        // racing re-throw while the session teardown happens.
        parked.push(entry)
        return true
      }
      const verdict = await resolveUnauthorized(err, projectId)
      if (verdict === 'propagate') return false
      parked.push(entry)
      claimSubject.next({type: 'unauthorized', error: err, projectId})
      return true
    }

    const classification = classifyRequestError(err)
    if (!classification) return false

    parked.push(entry)
    // First claim owns the dialog; later concurrent failures just park —
    // their retries piggyback on the visible dialog's "Try again".
    if (!claimSubject.getValue()) {
      claimSubject.next({
        ...classification,
        retryable: Boolean(options.retryable && entry.retry),
      })
    }
    return true
  }

  function retry(): void {
    const entries = parked
    parked = []
    claimSubject.next(undefined)
    for (const entry of entries) {
      // Entries without a retry mechanism (the `handle()` form) stay
      // parked-forever by design: their promise chains were
      // fire-and-surface. Re-running is only possible where the caller
      // gave us something to run.
      entry.retry?.()
    }
  }

  async function handle(err: unknown): Promise<never> {
    // A rejection handler can't re-run the request (it already happened),
    // so handled errors are never retryable.
    const claimed = await tryClaim(err, {retryable: false}, {})
    if (!claimed) throw err
    // Claimed: the dialog is up. Park the chain — there is nothing to
    // re-run, so it stays pending until the user reloads.
    return new Promise<never>(() => {})
  }

  function attempt<T>(
    thunk: (attemptNumber: number) => PromiseLike<T> | Observable<T>,
    options: RequestErrorReportOptions = {},
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      let attemptNumber = 0
      const tryOnce = () => {
        attemptNumber += 1
        Promise.resolve(attemptNumber)
          .then((n) => {
            const result = thunk(n)
            // Single-shot request observables emit once then complete —
            // their last value is their value.
            return isObservable(result) ? lastValueFrom(result) : result
          })
          .then(resolve, (err) => {
            tryClaim(err, options, {retry: tryOnce}).then((claimed) => {
              if (!claimed) reject(err)
            }, reject)
          })
      }
      tryOnce()
    })
  }

  return {
    attempt,
    handle,
    retry,
    claim$: claimSubject.asObservable(),
  }
}
