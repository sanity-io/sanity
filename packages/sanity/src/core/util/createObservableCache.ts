import {
  concat,
  defer,
  finalize,
  NEVER,
  type Observable,
  type ObservableInput,
  ReplaySubject,
  share,
  timer,
} from 'rxjs'

/**
 * A keyed observable cache for request-like sources (ones that complete).
 *
 * Each key maps to one shared observable, the same instance for as long as the key is cached.
 * `share` dedupes: every concurrent subscriber joins the same request, and its result replays to
 * later subscribers. The cached observable doesn't complete after the result, so subscribers keep
 * the key cached until they unsubscribe, and the key is released `ttl` after the last one leaves
 * (a request that loses every subscriber keeps running for that long too). An error releases the
 * key immediately, so failures are never cached, and an entry nothing ever subscribes to is
 * released `ttl` after it was created.
 *
 * @internal
 */
export function createObservableCache<T>(
  fetch: (key: string) => ObservableInput<T>,
  {ttl}: {ttl: number},
): (key: string) => Observable<T> {
  const entries = new Map<string, Observable<T>>()

  return function get(key: string): Observable<T> {
    const cached = entries.get(key)
    if (cached) {
      return cached
    }
    const release = () => {
      if (entries.get(key) === shared) {
        entries.delete(key)
      }
    }
    // Callers can get an entry during a render that never commits, so nothing may subscribe
    const idleRelease = setTimeout(release, ttl)
    const shared: Observable<T> = defer(() => {
      clearTimeout(idleRelease)
      // Completing would run `finalize`, releasing the key as soon as the result arrives
      return concat(fetch(key), NEVER)
    }).pipe(
      finalize(release),
      share({
        connector: () => new ReplaySubject<T>(1),
        resetOnRefCountZero: () => timer(ttl),
      }),
    )
    entries.set(key, shared)
    return shared
  }
}
