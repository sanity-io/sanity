const MAX_TRACKED_URLS = 50

/** @internal */
export interface PreviousURLTracker {
  record: (previousURL: string, currentURL: string) => void
  get: (url: string) => string | undefined
}

/**
 * Remembers which URL the browser left for each URL it moved to, so a soft nav can be
 * described against the real previous URL when Chromium skipped the soft nav before it.
 *
 * @internal
 */
export function createPreviousURLTracker(): PreviousURLTracker {
  const previousURLs = new Map<string, string>()

  function record(previousURL: string, currentURL: string): void {
    // Tools such as Releases replace their URL with itself on mount, which would erase where the user came from.
    if (previousURL === currentURL) return
    previousURLs.delete(currentURL)
    previousURLs.set(currentURL, previousURL)
    if (previousURLs.size > MAX_TRACKED_URLS) {
      previousURLs.delete(previousURLs.keys().next().value ?? '')
    }
  }

  return {record, get: (url) => previousURLs.get(url)}
}
