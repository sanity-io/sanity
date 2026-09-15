import {afterEach, describe, expect, test} from 'vitest'

import {
  LIGHTNINGCSS_DARK_VARIABLE,
  LIGHTNINGCSS_LIGHT_VARIABLE,
  overrideLightDarkDownlevelForTests,
  setDocumentColorScheme,
} from '../documentColorScheme'

const LIGHT_COLOR = 'rgb(10, 20, 30)'
const DARK_COLOR = 'rgb(200, 210, 220)'

// Mirrors the `:root` block Lightning CSS emits alongside down-leveled `light-dark()`
function injectDownleveledStylesheet(): void {
  const style = document.createElement('style')
  style.dataset.downlevel = 'true'
  style.textContent = `:root { ${LIGHTNINGCSS_LIGHT_VARIABLE}: initial; ${LIGHTNINGCSS_DARK_VARIABLE}: ; }`
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
    overrideLightDarkDownlevelForTests(null)
    document.documentElement.removeAttribute('style')
    document.body.replaceChildren()
    for (const style of Array.from(document.head.querySelectorAll('style[data-downlevel]'))) {
      style.remove()
    }
  })

  test('light resolves down-leveled light-dark() to the light value', () => {
    injectDownleveledStylesheet()
    const probe = renderDownleveledProbe()

    setDocumentColorScheme('light')

    expect(document.documentElement.style.colorScheme).toBe('light')
    expect(getComputedStyle(probe).color).toBe(LIGHT_COLOR)
  })

  test('dark resolves down-leveled light-dark() to the dark value', () => {
    injectDownleveledStylesheet()
    const probe = renderDownleveledProbe()

    setDocumentColorScheme('dark')

    expect(document.documentElement.style.colorScheme).toBe('dark')
    expect(getComputedStyle(probe).color).toBe(DARK_COLOR)
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

  test('the disposer restores a host-set color-scheme and removes the toggles', () => {
    injectDownleveledStylesheet()
    document.documentElement.style.colorScheme = 'dark'

    const dispose = setDocumentColorScheme('light')
    expect(document.documentElement.style.colorScheme).toBe('light')

    dispose()
    expect(document.documentElement.style.colorScheme).toBe('dark')
    expect(document.documentElement.getAttribute('style') ?? '').not.toContain('lightningcss')
  })

  test('skips the custom properties when nothing declares the toggles', () => {
    const probe = renderDownleveledProbe()

    setDocumentColorScheme('light')

    expect(document.documentElement.style.colorScheme).toBe('light')
    expect(document.documentElement.getAttribute('style') ?? '').not.toContain('lightningcss')
    expect(getComputedStyle(probe).color).not.toBe(LIGHT_COLOR)
  })
})
