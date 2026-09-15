/**
 * Custom properties emitted by Lightning CSS when a consumer's bundler down-levels
 * `light-dark()` (e.g. Next.js with Turbopack). The down-leveled output is gated by a
 * `prefers-color-scheme` media query that follows the OS and ignores the runtime
 * `color-scheme` property, so a pinned Studio scheme must also be written to these variables.
 *
 * @internal
 */
export const LIGHTNINGCSS_LIGHT_VARIABLE = '--lightningcss-light'

/** @internal */
export const LIGHTNINGCSS_DARK_VARIABLE = '--lightningcss-dark'

const PROBE_LIGHT_COLOR = 'rgb(1, 2, 3)'
const PROBE_DARK_COLOR = 'rgb(4, 5, 6)'

let downlevelActive: boolean | null = null

// The variables are a global namespace shared with every stylesheet the host's bundler
// down-levels, so writing them unconditionally would repaint host elements that use them.
// If either variable is declared anywhere, exactly one probe branch resolves to its fallback;
// otherwise the composite value is invalid at computed-value time and the probe inherits.
function detectLightDarkDownlevel(): boolean {
  const probe = document.createElement('div')
  probe.style.color = `var(${LIGHTNINGCSS_LIGHT_VARIABLE}, ${PROBE_LIGHT_COLOR}) var(${LIGHTNINGCSS_DARK_VARIABLE}, ${PROBE_DARK_COLOR})`
  document.body.appendChild(probe)
  const probeColor = getComputedStyle(probe).color
  probe.remove()
  return probeColor === PROBE_LIGHT_COLOR || probeColor === PROBE_DARK_COLOR
}

function lightDarkDownlevelActive(): boolean {
  if (downlevelActive === null) {
    downlevelActive = detectLightDarkDownlevel()
  }
  return downlevelActive
}

/**
 * jsdom cannot resolve the computed style the detection probe reads.
 *
 * @internal
 */
export function overrideLightDarkDownlevelForTests(value: boolean | null): void {
  downlevelActive = value
}

/**
 * Pins the document to the resolved Studio color scheme: `color-scheme` for native
 * `light-dark()` CSS, plus the Lightning CSS custom properties when down-leveled output is
 * detected in the document. Returns a disposer that restores the inline `color-scheme` this
 * call replaced and removes the custom properties.
 *
 * @internal
 */
export function setDocumentColorScheme(scheme: 'light' | 'dark'): () => void {
  const rootStyle = document.documentElement.style
  const previousColorScheme = rootStyle.getPropertyValue('color-scheme')
  const isLight = scheme === 'light'
  rootStyle.colorScheme = scheme
  if (lightDarkDownlevelActive()) {
    // Lightning CSS enables a light-dark() branch with `initial` and disables it with a single
    // space; an empty string would remove the property and hand control back to the media query.
    rootStyle.setProperty(LIGHTNINGCSS_LIGHT_VARIABLE, isLight ? 'initial' : ' ')
    rootStyle.setProperty(LIGHTNINGCSS_DARK_VARIABLE, isLight ? ' ' : 'initial')
  }
  return function restoreDocumentColorScheme() {
    if (previousColorScheme === '') {
      rootStyle.removeProperty('color-scheme')
    } else {
      rootStyle.setProperty('color-scheme', previousColorScheme)
    }
    // `getPropertyValue` returns '' for a space-valued custom property, so the previous values
    // cannot be saved and restored; removing unconditionally is the only reliable cleanup.
    rootStyle.removeProperty(LIGHTNINGCSS_LIGHT_VARIABLE)
    rootStyle.removeProperty(LIGHTNINGCSS_DARK_VARIABLE)
  }
}
