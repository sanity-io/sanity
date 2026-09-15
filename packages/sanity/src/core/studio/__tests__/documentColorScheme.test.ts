import {transform} from 'lightningcss'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {
  LIGHTNINGCSS_DARK_VARIABLE,
  LIGHTNINGCSS_LIGHT_VARIABLE,
  overrideLightDarkDownlevelForTests,
  setDocumentColorScheme,
} from '../documentColorScheme'

describe('setDocumentColorScheme', () => {
  beforeEach(() => {
    overrideLightDarkDownlevelForTests(true)
  })

  afterEach(() => {
    overrideLightDarkDownlevelForTests(null)
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

  test('skips the custom properties when no down-leveled output is detected', () => {
    overrideLightDarkDownlevelForTests(false)
    const setProperty = vi.spyOn(document.documentElement.style, 'setProperty')

    setDocumentColorScheme('light')

    expect(document.documentElement.style.colorScheme).toBe('light')
    expect(document.documentElement.getAttribute('style') ?? '').not.toContain('lightningcss')
    expect(setProperty).not.toHaveBeenCalledWith(LIGHTNINGCSS_LIGHT_VARIABLE, expect.anything())
    expect(setProperty).not.toHaveBeenCalledWith(LIGHTNINGCSS_DARK_VARIABLE, expect.anything())
  })

  test('the disposer removes everything the call wrote', () => {
    const dispose = setDocumentColorScheme('dark')
    dispose()

    expect(document.documentElement.style.colorScheme).toBe('')
    expect(document.documentElement.getAttribute('style') ?? '').not.toContain('lightningcss')
  })

  test('the disposer restores a host-set color-scheme', () => {
    document.documentElement.style.colorScheme = 'dark'

    const dispose = setDocumentColorScheme('light')
    expect(document.documentElement.style.colorScheme).toBe('light')

    dispose()
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  test('each disposer restores its own snapshot', () => {
    const disposeFirst = setDocumentColorScheme('light')
    const disposeSecond = setDocumentColorScheme('dark')

    disposeSecond()
    expect(document.documentElement.style.colorScheme).toBe('light')

    disposeFirst()
    expect(document.documentElement.style.colorScheme).toBe('')
  })
})

describe('lightningcss light-dark() down-level canary', () => {
  test('emits the variable names and initial/space convention the runtime writes', () => {
    const output = transform({
      filename: 'canary.css',
      code: Buffer.from(':root{color-scheme:light dark}a{color:light-dark(#fff,#000)}'),
      // versions are encoded as major << 16 | minor << 8; chrome 111 / safari 16.4 are the
      // baseline-widely-available targets Next.js builds against, which down-level light-dark()
      targets: {chrome: 111 << 16, safari: (16 << 16) | (4 << 8)},
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
