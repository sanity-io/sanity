import {transform} from 'lightningcss'
import {afterEach, describe, expect, test, vi} from 'vitest'

import {
  clearDocumentColorScheme,
  LIGHTNINGCSS_DARK_VARIABLE,
  LIGHTNINGCSS_LIGHT_VARIABLE,
  setDocumentColorScheme,
} from '../documentColorScheme'

describe('setDocumentColorScheme', () => {
  afterEach(() => {
    clearDocumentColorScheme()
    document.documentElement.removeAttribute('style')
    vi.restoreAllMocks()
  })

  test('light writes color-scheme and enables the light branch', () => {
    const setProperty = vi.spyOn(document.documentElement.style, 'setProperty')

    setDocumentColorScheme('light')

    expect(document.documentElement.style.colorScheme).toBe('light')
    expect(document.documentElement.getAttribute('style')).toContain(
      `${LIGHTNINGCSS_LIGHT_VARIABLE}: initial`,
    )
    // jsdom does not store whitespace-only custom properties, so the disabled branch is
    // pinned via the call; the real CSSOM behaviour is covered by the browser test
    expect(setProperty).toHaveBeenCalledWith(LIGHTNINGCSS_DARK_VARIABLE, ' ')
  })

  test('dark writes color-scheme and enables the dark branch', () => {
    const setProperty = vi.spyOn(document.documentElement.style, 'setProperty')

    setDocumentColorScheme('dark')

    expect(document.documentElement.style.colorScheme).toBe('dark')
    expect(document.documentElement.getAttribute('style')).toContain(
      `${LIGHTNINGCSS_DARK_VARIABLE}: initial`,
    )
    expect(setProperty).toHaveBeenCalledWith(LIGHTNINGCSS_LIGHT_VARIABLE, ' ')
  })

  test('the disposer removes all three properties', () => {
    const removeProperty = vi.spyOn(document.documentElement.style, 'removeProperty')

    const dispose = setDocumentColorScheme('dark')
    dispose()

    expect(document.documentElement.style.colorScheme).toBe('')
    expect(document.documentElement.getAttribute('style') ?? '').not.toContain('lightningcss')
    expect(removeProperty).toHaveBeenCalledWith('color-scheme')
    expect(removeProperty).toHaveBeenCalledWith(LIGHTNINGCSS_LIGHT_VARIABLE)
    expect(removeProperty).toHaveBeenCalledWith(LIGHTNINGCSS_DARK_VARIABLE)
  })

  test('clearDocumentColorScheme removes all three properties', () => {
    setDocumentColorScheme('light')
    clearDocumentColorScheme()

    expect(document.documentElement.style.colorScheme).toBe('')
    expect(document.documentElement.getAttribute('style') ?? '').not.toContain('lightningcss')
  })

  test('clearDocumentColorScheme leaves a host-set color-scheme in place', () => {
    document.documentElement.style.colorScheme = 'dark'
    clearDocumentColorScheme()

    expect(document.documentElement.style.colorScheme).toBe('dark')
  })
})

describe('lightningcss light-dark() down-level canary', () => {
  test('emits the variable names and initial/space convention the runtime writes', () => {
    const output = transform({
      filename: 'canary.css',
      code: Buffer.from(':root{color-scheme:light dark}a{color:light-dark(#fff,#000)}'),
      // versions are encoded as major << 16; chrome 110 predates light-dark() support
      targets: {chrome: 110 << 16},
    }).code.toString()

    expect(output).toContain(`var(${LIGHTNINGCSS_LIGHT_VARIABLE}, #fff)`)
    expect(output).toContain(`var(${LIGHTNINGCSS_DARK_VARIABLE}, #000)`)

    const darkMediaQueryIndex = output.indexOf('@media (prefers-color-scheme: dark)')
    expect(darkMediaQueryIndex).toBeGreaterThan(-1)

    const lightBlock = output.slice(0, darkMediaQueryIndex)
    expect(lightBlock).toContain(`${LIGHTNINGCSS_LIGHT_VARIABLE}: initial`)
    expect(lightBlock).toContain(`${LIGHTNINGCSS_DARK_VARIABLE}: ;`)

    const darkBlock = output.slice(darkMediaQueryIndex)
    expect(darkBlock).toContain(`${LIGHTNINGCSS_LIGHT_VARIABLE}: ;`)
    expect(darkBlock).toContain(`${LIGHTNINGCSS_DARK_VARIABLE}: initial`)
  })
})
