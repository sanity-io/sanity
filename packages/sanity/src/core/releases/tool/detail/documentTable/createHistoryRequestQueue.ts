import {
  catchError,
  concatWith,
  defer,
  EMPTY,
  ignoreElements,
  mergeMap,
  Observable,
  retry,
  Subject,
  type Subscription,
  takeUntil,
  tap,
  throwError,
  timer,
} from 'rxjs'

import {classifyRequestError} from '../../../../studio/requestErrors/classify'

// The history endpoint is uncached and its in-flight limit is shared with other tabs and editors.
/** @internal */
export const MAX_CONCURRENT_HISTORY_REQUESTS = 5
const HISTORY_REQUEST_GAP_MS = 100
const MAX_HISTORY_REQUEST_RETRIES = 3
const DEFAULT_RETRY_DELAY_MS = 1000
const MAX_RETRY_DELAY_MS = 60_000

function getRetryDelay(error: unknown, retryCount: number): Observable<number> {
  const classification = classifyRequestError(error)
  if (classification === null) return throwError(() => error)
  if (classification.type === 'rateLimited' && classification.retryAfterSeconds !== undefined) {
    return timer(Math.min(classification.retryAfterSeconds * 1000, MAX_RETRY_DELAY_MS))
  }
  return timer(DEFAULT_RETRY_DELAY_MS * 2 ** (retryCount - 1))
}

/**
 * Creates a queue that runs history API requests at most five at a time, with a short gap after
 * each one, and retries rate limited and failed requests after the delay the API asks for.
 *
 * A request whose subscriber unsubscribes before its turn is never sent. One that is already in
 * flight keeps its slot until it settles, so the in-flight limit holds even then.
 *
 * @internal
 */
export function createHistoryRequestQueue(): <T>(request: () => Promise<T>) => Observable<T> {
  const queued$ = new Subject<Observable<never>>()
  let queueSubscription: Subscription | undefined

  return <T>(request: () => Promise<T>) =>
    new Observable<T>((subscriber) => {
      queueSubscription ??= queued$
        .pipe(mergeMap((job) => job, MAX_CONCURRENT_HISTORY_REQUESTS))
        .subscribe()

      const cancelled$ = new Subject<void>()
      let cancelled = false

      queued$.next(
        defer(() => {
          if (cancelled) return EMPTY
          return defer(() => (cancelled ? EMPTY : request())).pipe(
            retry({
              count: MAX_HISTORY_REQUEST_RETRIES,
              delay: (error, retryCount) =>
                cancelled ? EMPTY : getRetryDelay(error, retryCount).pipe(takeUntil(cancelled$)),
            }),
            tap(subscriber),
            catchError(() => EMPTY),
            ignoreElements(),
            concatWith(timer(HISTORY_REQUEST_GAP_MS).pipe(ignoreElements())),
          )
        }),
      )

      return () => {
        cancelled = true
        cancelled$.next()
      }
    })
}
