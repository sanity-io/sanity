import {BehaviorSubject, isObservable, lastValueFrom, type Observable} from 'rxjs'

import {classifyRequestError, isInvalidSessionError} from './classify'
import {
  type RequestErrorChannel,
  type RequestErrorClaim,
  type RequestErrorReportOptions,
  type StudioErrorHandler,
} from './types'

/**
 * Best-effort projectId extraction from an HTTP error's request URL
 * (`https://{projectId}.api.sanity.io/...`). Used to route a delegated
 * 401 to the right workspace's auth store for forced logout.
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
 * Create the studio's request-error channel. Framework-free — the React
 * side (context provider, dialog rendering) lives in `WorkspacesProvider`.
 *
 * See {@link StudioErrorHandler} for the call-site API and semantics.
 *
 * @internal
 */
export function createRequestErrorChannel(): RequestErrorChannel {
  const claimSubject = new BehaviorSubject<RequestErrorClaim | undefined>(undefined)
  let parked: ParkedEntry[] = []

  /**
   * Attempt to claim `err` for the studio UI. Returns `true` when claimed
   * (entry parked, dialog state set) and `false` when the error is
   * caller-domain and should be re-thrown by the caller of this function.
   */
  function tryClaim(err: unknown, options: RequestErrorReportOptions, entry: ParkedEntry): boolean {
    if (isInvalidSessionError(err)) {
      // The API positively signals an invalid session (expired or not found,
      // see INVALID_SESSION_ERROR_CODES) — force logout. A 401 *without* such
      // a code is a resource-level denial (some endpoints answer 401, not
      // 403, for authenticated users lacking a grant) and stays
      // caller-domain, same as a 403.
      parked.push(entry)
      // First invalid-session 401 owns the dialog + logout; concurrent
      // ones for the same teardown (including the logout request's own
      // 401) just park behind it rather than re-claiming.
      if (claimSubject.getValue()?.type !== 'unauthorized') {
        claimSubject.next({type: 'unauthorized', error: err, projectId: projectIdFromError(err)})
      }
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
    if (!tryClaim(err, {retryable: false}, {})) throw err
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
            if (!tryClaim(err, options, {retry: tryOnce})) reject(err)
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

/**
 * The {@link StudioErrorHandler} used when there is no studio error UI to
 * delegate to — outside a `WorkspacesProvider`, or in a standalone render
 * of a component that normally lives in a Studio.
 *
 * It has no dialog and no retry, so it just runs the work and lets the
 * caller's own error handling take over:
 *  - `attempt()` runs the thunk once and resolves/rejects with its result
 *    (an observable is drained to its last value, same as the real
 *    channel).
 *  - `handle()` re-throws, so the next `.catch` in the chain still sees the
 *    error.
 *
 * This lets call sites use `useStudioErrorHandler()` unconditionally
 * instead of branching on whether a Studio is present.
 *
 * @internal
 */
export const passthroughErrorHandler: StudioErrorHandler = {
  attempt(thunk) {
    return Promise.resolve(1).then((n) => {
      const result = thunk(n)
      return isObservable(result) ? lastValueFrom(result) : result
    })
  },
  handle(err) {
    return Promise.reject(err)
  },
}
