/**
 * Custom properties Lightning CSS emits when a consumer's bundler down-levels `light-dark()`
 * (Next.js with Turbopack, or Vite on older targets). The down-leveled output is gated on a
 * `prefers-color-scheme` media query, which the runtime `color-scheme` property does not feed
 * into, so a pinned Studio appearance has to be written to these too.
 *
 * @internal
 */
export const LIGHTNINGCSS_LIGHT_VARIABLE = '--lightningcss-light'

/** @internal */
export const LIGHTNINGCSS_DARK_VARIABLE = '--lightningcss-dark'

/** @internal */
export function setDocumentColorScheme(scheme: 'light' | 'dark'): () => void {
  const rootStyle = document.documentElement.style
  const previousColorScheme = rootStyle.getPropertyValue('color-scheme')
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
