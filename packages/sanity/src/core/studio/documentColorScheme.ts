/**
 * Custom properties emitted by Lightning CSS when a consumer's bundler down-levels
 * `light-dark()` (e.g. Next.js with Turbopack). The down-leveled output is gated by a
 * `prefers-color-scheme` media query that follows the OS and ignores the `color-scheme`
 * property, so a pinned Studio scheme must also be written to these variables.
 *
 * @internal
 */
export const LIGHTNINGCSS_LIGHT_VARIABLE = '--lightningcss-light'

/** @internal */
export const LIGHTNINGCSS_DARK_VARIABLE = '--lightningcss-dark'

let colorSchemeWritten = false

/**
 * Pins the document to the resolved Studio color scheme, covering both native
 * `light-dark()` CSS (via `color-scheme`) and Lightning CSS down-leveled output (via the
 * custom properties). Returns a disposer that clears all three.
 *
 * @internal
 */
export function setDocumentColorScheme(scheme: 'light' | 'dark'): () => void {
  const rootStyle = document.documentElement.style
  const isLight = scheme === 'light'
  rootStyle.colorScheme = scheme
  colorSchemeWritten = true
  // Lightning CSS enables a light-dark() branch with `initial` and disables it with a single
  // space; an empty string would remove the property and hand control back to the media query.
  rootStyle.setProperty(LIGHTNINGCSS_LIGHT_VARIABLE, isLight ? 'initial' : ' ')
  rootStyle.setProperty(LIGHTNINGCSS_DARK_VARIABLE, isLight ? ' ' : 'initial')
  return clearDocumentColorScheme
}

/** @internal */
export function clearDocumentColorScheme(): void {
  const rootStyle = document.documentElement.style
  // removed only when Studio wrote it, so a host-set inline `color-scheme` survives system mode
  if (colorSchemeWritten) {
    rootStyle.removeProperty('color-scheme')
    colorSchemeWritten = false
  }
  // `getPropertyValue` returns '' for a space-valued custom property, so the previous values
  // cannot be saved and restored; removing unconditionally is the only reliable cleanup.
  rootStyle.removeProperty(LIGHTNINGCSS_LIGHT_VARIABLE)
  rootStyle.removeProperty(LIGHTNINGCSS_DARK_VARIABLE)
}
