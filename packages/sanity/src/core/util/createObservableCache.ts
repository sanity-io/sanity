import {
  defer,
  type Observable,
  type ObservableInput,
  of,
  ReplaySubject,
  share,
  tap,
  timer,
} from 'rxjs'

/**
 * A keyed, ref-counted observable cache for request-like sources (ones that complete).
 *
 * Each key maps to one shared observable, the same instance for the same key. `share` dedupes:
 * every concurrent subscriber joins the same in-flight request, a request that loses all its
 * subscribers still runs to completion and populates the cache, and the result replays to late
 * subscribers for `ttl` after it arrives. Then the key is released and the next subscriber
 * refetches. An error releases the key immediately, so failures are never cached, and an entry
 * nothing ever subscribes to is released `ttl` after it was created.
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
      return fetch(key)
    }).pipe(
      share({
        connector: () => new ReplaySubject<T>(1),
        resetOnRefCountZero: false,
        resetOnError: () => of(null).pipe(tap(release)),
        resetOnComplete: () => timer(ttl).pipe(tap(release)),
      }),
    )
    entries.set(key, shared)
    return shared
  }
}
