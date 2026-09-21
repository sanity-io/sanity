import {afterEach, describe, expect, test} from 'vitest'

import {
  LIGHTNINGCSS_DARK_VARIABLE,
  LIGHTNINGCSS_LIGHT_VARIABLE,
  setDocumentColorScheme,
} from '../documentColorScheme'

const LIGHT_COLOR = 'rgb(10, 20, 30)'
const DARK_COLOR = 'rgb(200, 210, 220)'

// The toggles are only written when the appearance disagrees with the OS, so each test derives
// the mismatching scheme from the browser's own preference instead of assuming light
function osPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

// Mirrors the blocks Lightning CSS emits alongside down-leveled `light-dark()`
function injectDownleveledStylesheet(): void {
  const style = document.createElement('style')
  style.dataset.downlevel = 'true'
  style.textContent = `
    :root { ${LIGHTNINGCSS_LIGHT_VARIABLE}: initial; ${LIGHTNINGCSS_DARK_VARIABLE}: ; }
    @media (prefers-color-scheme: dark) {
      :root { ${LIGHTNINGCSS_LIGHT_VARIABLE}: ; ${LIGHTNINGCSS_DARK_VARIABLE}: initial; }
    }
  `
  document.head.appendChild(style)
}

// Mirrors the output Lightning CSS emits when down-leveling `color: light-dark(A, B)`
function renderDownleveledProbe(): HTMLElement {
  const probe = document.createElement('div')
  probe.style.color = `var(${LIGHTNINGCSS_LIGHT_VARIABLE}, ${LIGHT_COLOR}) var(${LIGHTNINGCSS_DARK_VARIABLE}, ${DARK_COLOR})`
  document.body.appendChild(probe)
  return probe
}

describe('setDocumentColorScheme (real CSSOM)', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('style')
    document.body.replaceChildren()
    for (const style of Array.from(document.head.querySelectorAll('style[data-downlevel]'))) {
      style.remove()
    }
  })

  test('a scheme mismatching the OS writes the toggles and flips down-leveled light-dark()', () => {
    injectDownleveledStylesheet()
    const probe = renderDownleveledProbe()
    const osColor = osPrefersDark() ? DARK_COLOR : LIGHT_COLOR
    const mismatchScheme = osPrefersDark() ? 'light' : 'dark'
    const mismatchColor = osPrefersDark() ? LIGHT_COLOR : DARK_COLOR

    expect(getComputedStyle(probe).color).toBe(osColor)

    setDocumentColorScheme(mismatchScheme)

    expect(document.documentElement.style.colorScheme).toBe(mismatchScheme)
    expect(getComputedStyle(probe).color).toBe(mismatchColor)
  })

  test('a scheme matching the OS writes only color-scheme', () => {
    injectDownleveledStylesheet()
    const probe = renderDownleveledProbe()
    const osScheme = osPrefersDark() ? 'dark' : 'light'
    const osColor = osPrefersDark() ? DARK_COLOR : LIGHT_COLOR

    setDocumentColorScheme(osScheme)

    expect(document.documentElement.style.colorScheme).toBe(osScheme)
    expect(document.documentElement.getAttribute('style') ?? '').not.toContain('lightningcss')
    expect(getComputedStyle(probe).color).toBe(osColor)
  })

  test('the disposer restores a host-set color-scheme and removes the toggles', () => {
    injectDownleveledStylesheet()
    const probe = renderDownleveledProbe()
    const osColor = osPrefersDark() ? DARK_COLOR : LIGHT_COLOR
    const mismatchScheme = osPrefersDark() ? 'light' : 'dark'
    document.documentElement.style.colorScheme = 'dark'

    const dispose = setDocumentColorScheme(mismatchScheme)
    expect(document.documentElement.style.colorScheme).toBe(mismatchScheme)

    dispose()
    expect(document.documentElement.style.colorScheme).toBe('dark')
    expect(document.documentElement.getAttribute('style') ?? '').not.toContain('lightningcss')
    expect(getComputedStyle(probe).color).toBe(osColor)
  })

  test('a space-valued custom property survives where an empty string would not', () => {
    const probe = renderDownleveledProbe()
    const rootStyle = document.documentElement.style

    rootStyle.setProperty(LIGHTNINGCSS_LIGHT_VARIABLE, 'initial')
    rootStyle.setProperty(LIGHTNINGCSS_DARK_VARIABLE, ' ')
    expect(getComputedStyle(probe).color).toBe(LIGHT_COLOR)

    // an empty string removes the property, so both var() fallbacks apply and the
    // composite value becomes invalid at computed-value time
    rootStyle.setProperty(LIGHTNINGCSS_DARK_VARIABLE, '')
    expect(getComputedStyle(probe).color).not.toBe(LIGHT_COLOR)
  })
})
