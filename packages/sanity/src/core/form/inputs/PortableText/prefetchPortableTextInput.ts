let prefetched = false

/**
 * Triggers a background import of the PortableTextInput module during browser
 * idle time. This warms the module cache so that when a user navigates to a
 * document with a portable text field, the chunk is already fetched and
 * evaluated — making the lazy load essentially instant.
 *
 * Safe to call multiple times — only the first call has any effect.
 * No-ops in non-browser environments and when `requestIdleCallback` is
 * unavailable (e.g. older Safari).
 *
 * @internal
 */
export function prefetchPortableTextInput(): void {
  if (prefetched) return
  prefetched = true

  if (
    typeof window === 'undefined' ||
    typeof requestIdleCallback !== 'function' ||
    typeof navigator === 'undefined'
  ) {
    return
  }

  // Respect the user's data-saver preference
  const connection = (navigator as Navigator & {connection?: {saveData?: boolean}}).connection
  if (connection?.saveData) {
    return
  }

  requestIdleCallback(() => {
    import('./PortableTextInput')
    import('../StringInput/StringInputPortableText/StringInputPortableText')
  })
}
