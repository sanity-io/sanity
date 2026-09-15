import {afterEach, describe, expect, test} from 'vitest'

import {
  clearDocumentColorScheme,
  LIGHTNINGCSS_DARK_VARIABLE,
  LIGHTNINGCSS_LIGHT_VARIABLE,
  setDocumentColorScheme,
} from '../documentColorScheme'

const LIGHT_COLOR = 'rgb(1, 2, 3)'
const DARK_COLOR = 'rgb(201, 202, 203)'

// Mirrors the output Lightning CSS emits when down-leveling `color: light-dark(A, B)`
function renderDownleveledProbe(): HTMLElement {
  const probe = document.createElement('div')
  probe.style.color = `var(${LIGHTNINGCSS_LIGHT_VARIABLE}, ${LIGHT_COLOR}) var(${LIGHTNINGCSS_DARK_VARIABLE}, ${DARK_COLOR})`
  document.body.appendChild(probe)
  return probe
}

describe('setDocumentColorScheme (real CSSOM)', () => {
  afterEach(() => {
    clearDocumentColorScheme()
    document.body.replaceChildren()
  })

  test('light resolves down-leveled light-dark() to the light value', () => {
    const probe = renderDownleveledProbe()

    setDocumentColorScheme('light')

    expect(document.documentElement.style.colorScheme).toBe('light')
    expect(getComputedStyle(probe).color).toBe(LIGHT_COLOR)
  })

  test('dark resolves down-leveled light-dark() to the dark value', () => {
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

  test('the disposer removes everything it wrote', () => {
    const dispose = setDocumentColorScheme('dark')
    dispose()

    expect(document.documentElement.style.colorScheme).toBe('')
    expect(document.documentElement.getAttribute('style') ?? '').not.toContain('lightningcss')
  })
})
