import type ConfigStore from 'configstore'

export interface ExpiringConfigOptions<Type> {
  /** Config store */
  store: ConfigStore
  /** Config key */
  key: string
  /** TTL (milliseconds) */
  ttl: number
  /** Fetch value */
  fetchValue: () => Type | Promise<Type>
  /** Subscribe to revalidate event */
  onRevalidate?: () => void
  /** Subscribe to fetch event */
  onFetch?: () => void
  /** Subscribe to cache hit event */
  onCacheHit?: () => void
}

export interface ExpiringConfigApi<Type> {
  /**
   * Attempt to get the cached value. If there is no cached value, or the cached value has expired,
   * fetch, cache, and return the value.
   */
  get: () => Promise<Type>
  /**
   * Delete the cached value.
   */
  delete: () => void
}

/**
 * Create a config in the provided config store that expires after the provided TTL.
 */
export function createExpiringConfig<Type>({
  key,
  ttl,
  store,
  fetchValue,
  onRevalidate = () => null,
  onFetch = () => null,
  onCacheHit = () => null,
}: ExpiringConfigOptions<Type>): ExpiringConfigApi<Type> {
  let currentFetch: Promise<Type> | null = null
  return {
    async get() {
      const {value, updatedAt} = store.get(key) ?? {}

      if (value && updatedAt) {
        const hasExpired = Date.now() - updatedAt > ttl

        if (!hasExpired) {
          onCacheHit()
          return value
        }

        onRevalidate()
      }

      if (currentFetch) {
        return currentFetch
      }
      onFetch()

      currentFetch = Promise.resolve(fetchValue())
      const nextValue = await currentFetch
      currentFetch = null

      store.set(key, {
        value: nextValue,
        updatedAt: Date.now(),
      })

      return nextValue
    },
    delete() {
      store.delete(key)
    },
  }
}
