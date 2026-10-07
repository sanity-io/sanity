// OAuth token pairs kept in tab memory, for the workspace auth probe.
//
// Without localStorage the OAuth store keeps its pair in memory, where the probe, which reads
// storage, can't see it. The store registers a reader here instead.

const readers = new Map<string, () => string | undefined>()

/**
 * Registers how to read the current access token of the in-memory pair stored under `key`.
 *
 * @internal
 */
export function registerTabAccessToken(key: string, read: () => string | undefined): void {
  readers.set(key, read)
}

/**
 * The current access token of the in-memory pair stored under `key`, if a store registered one.
 *
 * @internal
 */
export function readTabAccessToken(key: string): string | undefined {
  return readers.get(key)?.()
}
