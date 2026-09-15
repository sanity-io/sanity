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

let downleveled = false

// If either toggle is declared, exactly one branch of the probe resolves to its fallback;
// otherwise the composite value is invalid at computed-value time and the probe inherits.
// Only a positive result is cached: present toggles do not disappear, but an absent result
// may just mean the down-leveled stylesheet has not loaded yet, so negatives re-probe.
function isLightDarkDownleveled(): boolean {
  if (downleveled) {
    return true
  }
  const probe = document.createElement('div')
  probe.style.color = `var(${LIGHTNINGCSS_LIGHT_VARIABLE}, rgb(1, 2, 3)) var(${LIGHTNINGCSS_DARK_VARIABLE}, rgb(4, 5, 6))`
  document.body.appendChild(probe)
  const resolved = getComputedStyle(probe).color
  probe.remove()
  downleveled = resolved === 'rgb(1, 2, 3)' || resolved === 'rgb(4, 5, 6)'
  return downleveled
}

function matchesSystemScheme(scheme: 'light' | 'dark'): boolean {
  return window.matchMedia(`(prefers-color-scheme: ${scheme})`).matches
}

function restoreProperty(style: CSSStyleDeclaration, property: string, value: string): void {
  if (value === '') {
    style.removeProperty(property)
  } else {
    style.setProperty(property, value)
  }
}

/**
 * Pins the document to the resolved Studio appearance. `color-scheme` covers native
 * `light-dark()`; the Lightning CSS toggles are only written when down-leveled output is
 * present and the appearance disagrees with the OS, since they are a global namespace shared
 * with the host page's own stylesheets. Returns a disposer that undoes this call.
 *
 * @internal
 */
export function setDocumentColorScheme(scheme: 'light' | 'dark'): () => void {
  const rootStyle = document.documentElement.style
  const previousColorScheme = rootStyle.getPropertyValue('color-scheme')
  rootStyle.colorScheme = scheme

  const overridesToggles = !matchesSystemScheme(scheme) && isLightDarkDownleveled()
  let previousLight = ''
  let previousDark = ''
  if (overridesToggles) {
    // A space-valued custom property reads back as '', so a host's disabled-branch value
    // restores as a removal; every other inline value round-trips.
    previousLight = rootStyle.getPropertyValue(LIGHTNINGCSS_LIGHT_VARIABLE)
    previousDark = rootStyle.getPropertyValue(LIGHTNINGCSS_DARK_VARIABLE)
    const isLight = scheme === 'light'
    // Lightning CSS enables a branch with `initial` and disables it with a single space; an
    // empty string would remove the property and hand control back to the media query.
    rootStyle.setProperty(LIGHTNINGCSS_LIGHT_VARIABLE, isLight ? 'initial' : ' ')
    rootStyle.setProperty(LIGHTNINGCSS_DARK_VARIABLE, isLight ? ' ' : 'initial')
  }

  return function restoreDocumentColorScheme() {
    restoreProperty(rootStyle, 'color-scheme', previousColorScheme)
    if (overridesToggles) {
      restoreProperty(rootStyle, LIGHTNINGCSS_LIGHT_VARIABLE, previousLight)
      restoreProperty(rootStyle, LIGHTNINGCSS_DARK_VARIABLE, previousDark)
    }
  }
}
