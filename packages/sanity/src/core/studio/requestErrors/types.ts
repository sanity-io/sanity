import {type Observable} from 'rxjs'

/**
 * Options for delegating a request error to the studio's error UI.
 *
 * @beta
 */
export interface RequestErrorReportOptions {
  /**
   * Whether the failed request is safe to re-run. Only set this to `true`
   * when re-running cannot cause harm: the request is idempotent (reads),
   * or it is guaranteed to have been rejected before processing (429s).
   *
   * When `true`, the studio's error dialog offers a "Try again" button
   * that re-runs the request. When `false` (the default), the dialog only
   * offers "Reload Studio" and uses more conservative copy, warning that
   * the last change may or may not have been applied.
   *
   * Note: retry requires a re-runnable request, so it only takes effect
   * with `attempt()` (which has the thunk to re-invoke). The `handle`
   * rejection-handler form cannot re-run the request.
   */
  retryable?: boolean
}

/**
 * An error claimed by the studio's request-error UI, as rendered by the
 * studio dialog. Mirrors the classification plus the caller's retry
 * assertion.
 *
 * @internal
 */
export type RequestErrorClaim =
  | {type: 'networkError'; error: Error; retryable: boolean}
  | {type: 'serverError'; error: Error; retryable: boolean}
  | {type: 'rateLimited'; error: Error; retryAfterSeconds?: number; retryable: boolean}
  | {type: 'unauthorized'; error: Error; projectId?: string}

/**
 * Call-site API for delegating unrecoverable request errors to the
 * studio's built-in error UI (dialogs, verified forced logout).
 *
 * The studio never intercepts your requests — errors only reach this
 * channel when you hand them over. Handle what you can locally (inline
 * errors, toasts, fallbacks); delegate what you can't.
 *
 * Two shapes, both feeding the same dialog:
 *
 * ```ts
 * const {attempt, handle} = useStudioErrorHandler()
 *
 * // 1. Thunk wrapper — the dialog's "Try again" re-invokes the thunk.
 * //    The thunk may return a promise or a (single-shot) observable:
 * const user = await attempt(() => client.request({uri: '/users/me'}), {
 *   retryable: true,
 * })
 *
 * // 2. Promise rejection handler — fire-and-surface, no retry:
 * client.create(doc).catch(handle)
 * ```
 *
 * Unclaimable errors (4xx other than 429, parse errors, ...) are
 * re-thrown unchanged, so downstream `.catch` / `catchError` handlers
 * still see them. 401s are claimed only when the API explicitly tags them
 * as session expiry (`SIO-401-AEX`), in which case a forced logout
 * follows; untagged resource-level 401s are re-thrown to the caller.
 *
 * @beta
 */
export interface StudioErrorHandler {
  /**
   * Promise rejection handler — use directly in `.catch(handle)`.
   * Claimable errors surface the studio dialog and leave the promise
   * pending (the request is in limbo until the user reloads);
   * unclaimable errors are re-thrown to the next `.catch`:
   *
   * ```ts
   * client
   *   .create(doc)
   *   .catch(handle)
   *   .catch((err) => {
   *     // caller-domain errors (validation, permissions, 404, ...)
   *   })
   * ```
   */
  handle(err: unknown): Promise<never>

  /**
   * Runs `thunk` and delegates claimable failures to the studio dialog.
   * With `retryable: true`, the dialog's "Try again" re-invokes the thunk;
   * the returned promise resolves with the first successful attempt.
   * Unclaimable failures reject the returned promise.
   *
   * The thunk receives the attempt number (starting at 1), useful for
   * logging or cache-busting. It may return a promise or an observable —
   * an observable is drained to its last emitted value (single-shot
   * request observables emit once and complete, so this is their value).
   *
   * The observable MUST be finite. `attempt` waits for completion, so a
   * long-lived or multicast source (`client.listen()`, a `Subject`) would
   * never resolve and would leak its subscription for the life of the
   * returned promise. An observable that completes without emitting
   * rejects with rxjs's `EmptyError`. Pass request-style observables only.
   *
   * Promises are eager, so the thunk must CREATE the request when called
   * — retry works by invoking it again for a fresh request:
   *
   * ```ts
   * // ✓ each invocation issues a new request
   * attempt(() => client.fetch(query), {retryable: true})
   *
   * // ✗ the request already happened; retry re-awaits the same
   * //   settled rejection and the dialog just reappears
   * const promise = client.fetch(query)
   * attempt(() => promise, {retryable: true})
   * ```
   */
  attempt<T>(
    thunk: (attemptNumber: number) => PromiseLike<T> | Observable<T>,
    options?: RequestErrorReportOptions,
  ): Promise<T>
}

/**
 * The full channel, as owned by `WorkspacesProvider`: the reporter
 * surface plus the state stream and retry trigger the dialog needs.
 *
 * @internal
 */
export interface RequestErrorChannel extends StudioErrorHandler {
  /** Currently active claim (undefined → no dialog). */
  claim$: Observable<RequestErrorClaim | undefined>
  /** Re-runs all parked retryable requests and clears the claim. */
  retry(): void
}
