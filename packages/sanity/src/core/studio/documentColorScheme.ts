/**
 * Custom properties Lightning CSS emits when a consumer's bundler down-levels `light-dark()`.
 * The down-leveled output is gated on a `prefers-color-scheme` media query, which the runtime
 * `color-scheme` property does not feed into, so a pinned Studio appearance is written here too.
 *
 * @internal
 */
export const LIGHTNINGCSS_LIGHT_VARIABLE = '--lightningcss-light'

/** @internal */
export const LIGHTNINGCSS_DARK_VARIABLE = '--lightningcss-dark'

const COLOR_SCHEME_STORAGE_KEY = 'sanityStudio:ui:colorScheme'

/**
 * Host `color-scheme` captured before a pre-mount stored write. The next
 * `setDocumentColorScheme` claims it so ColorThemeProvider restores the host
 * original instead of snapshotting the already-applied stored value.
 */
let pendingHostColorScheme: string | undefined

/**
 * Pins the document to the resolved Studio appearance. Returns a disposer that undoes this call.
 *
 * @internal
 */
export function setDocumentColorScheme(scheme: 'light' | 'dark'): () => void {
  const rootStyle = document.documentElement.style
  const previousColorScheme =
    pendingHostColorScheme === undefined
      ? rootStyle.getPropertyValue('color-scheme')
      : pendingHostColorScheme
  pendingHostColorScheme = undefined
  rootStyle.colorScheme = scheme

  const overridesToggles = !window.matchMedia(`(prefers-color-scheme: ${scheme})`).matches
  if (overridesToggles) {
    const isLight = scheme === 'light'
    // Lightning CSS enables a branch with `initial` and disables it with a single space; an
    // empty string would remove the property and hand control back to the media query.
    rootStyle.setProperty(LIGHTNINGCSS_LIGHT_VARIABLE, isLight ? 'initial' : ' ')
    rootStyle.setProperty(LIGHTNINGCSS_DARK_VARIABLE, isLight ? ' ' : 'initial')
  }

  return function restoreDocumentColorScheme() {
    if (previousColorScheme === '') {
      rootStyle.removeProperty('color-scheme')
    } else {
      rootStyle.setProperty('color-scheme', previousColorScheme)
    }
    if (overridesToggles) {
      rootStyle.removeProperty(LIGHTNINGCSS_LIGHT_VARIABLE)
      rootStyle.removeProperty(LIGHTNINGCSS_DARK_VARIABLE)
    }
  }
}

/**
 * Apply a stored explicit Studio scheme before React mounts so the first paint
 * of ui5 `light-dark()` tokens matches Appearance. `"system"` is left unset so
 * `:root { color-scheme: light dark }` keeps following the OS.
 *
 * @internal
 */
export function applyStoredDocumentColorScheme(): void {
  if (typeof document === 'undefined') {
    return
  }

  try {
    const stored = localStorage.getItem(COLOR_SCHEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') {
      // The helper snapshots the host original, but this first-paint write is
      // not a restore-stack frame — its disposer is dropped on purpose. Stash
      // the host value so ColorThemeProvider's later call restores it when
      // switching to `system` or unmounting, instead of pinning the stored scheme.
      const hostColorScheme = document.documentElement.style.getPropertyValue('color-scheme')
      setDocumentColorScheme(stored)
      pendingHostColorScheme = hostColorScheme
    }
  } catch {
    // localStorage can throw in private browsing / disabled storage
  }
}
