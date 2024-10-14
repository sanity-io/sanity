import QuickLRU from 'quick-lru'
import {concat, defer, EMPTY, map, type Observable, of, type OperatorFunction} from 'rxjs'
import {tap} from 'rxjs/operators'

/**
 * The interface that any caching layer must implement
 * @internal
 */
interface SWRCache<T> {
  /**
   * Note: This will throw if key does not exist. Always check for existence with `has` before calling
   */
  get(key: string): T
  has(key: string): boolean
  set(key: string, value: T): void
  delete(key: string): void
}

const createSWRCache = createLRUCache

/**
 *
 * Create an SWR (Stale While Revalidate) rxjs operator that will store the latest value in a cache and emit the last know value upon observable subscription
 * @param options - Options
 * @internal
 */
export function createSWR<T>(options: {maxSize: number}) {
  const cache = createSWRCache<T>(options)
  return function rxSwr(key: string): OperatorFunction<T, {fromCache: boolean; value: T}> {
    return (input$: Observable<T>) => {
      return concat(
        defer(() => (cache.has(key) ? of({fromCache: true, value: cache.get(key)}) : EMPTY)),
        input$.pipe(
          tap((result) => cache.set(key, result)),
          map((value) => ({
            fromCache: false,
            value: value,
          })),
        ),
      )
    }
  }
}

/**
 * For now, the only cache layer implemented is an in-memory LRU.
 * @param options - LRU options
 * @internal
 */
function createLRUCache<T>(options: {maxSize: number}): SWRCache<T> {
  const lru = new QuickLRU<string, {value: T}>(options)
  return {
    get(key: string) {
      const entry = lru.get(key)
      if (!entry) {
        throw new Error(`Key not found in LRU cache: ${key}`)
      }
      return entry.value
    },
    set(key: string, value: T) {
      lru.set(key, {value})
    },
    delete(key: string) {
      lru.delete(key)
    },
    has(key: string) {
      return lru.has(key)
    },
  }
}
