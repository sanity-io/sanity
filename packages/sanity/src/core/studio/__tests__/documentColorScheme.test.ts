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

// Verbatim output of lightningcss 1.33.0 transforming
// `:root{color-scheme:light dark}a{color:light-dark(#fff,#000)}`
// with targets chrome 111 / safari 16.4, the baseline-widely-available targets
// Next.js builds against, which down-level light-dark()
const LIGHTNINGCSS_DOWNLEVEL_FIXTURE = `:root {
  --lightningcss-light: initial;
  --lightningcss-dark: ;
  color-scheme: light dark;
}

@media (prefers-color-scheme: dark) {
  :root {
    --lightningcss-light: ;
    --lightningcss-dark: initial;
  }
}

a {
  color: var(--lightningcss-light, #fff) var(--lightningcss-dark, #000);
}
`

describe('lightningcss light-dark() down-level convention', () => {
  test("the space toggle is Lightning CSS's convention, not a typo to tidy into an empty string", () => {
    expect(LIGHTNINGCSS_DOWNLEVEL_FIXTURE).toContain(`var(${LIGHTNINGCSS_LIGHT_VARIABLE}, #fff)`)
    expect(LIGHTNINGCSS_DOWNLEVEL_FIXTURE).toContain(`var(${LIGHTNINGCSS_DARK_VARIABLE}, #000)`)

    const darkMediaQueryIndex = LIGHTNINGCSS_DOWNLEVEL_FIXTURE.indexOf(
      '@media (prefers-color-scheme: dark)',
    )
    expect(darkMediaQueryIndex).toBeGreaterThan(-1)

    const lightBlock = LIGHTNINGCSS_DOWNLEVEL_FIXTURE.slice(0, darkMediaQueryIndex)
    expect(lightBlock).toContain(`${LIGHTNINGCSS_LIGHT_VARIABLE}: initial;`)
    expect(lightBlock).toContain(`${LIGHTNINGCSS_DARK_VARIABLE}: ;`)

    const darkBlock = LIGHTNINGCSS_DOWNLEVEL_FIXTURE.slice(darkMediaQueryIndex)
    expect(darkBlock).toContain(`${LIGHTNINGCSS_LIGHT_VARIABLE}: ;`)
    expect(darkBlock).toContain(`${LIGHTNINGCSS_DARK_VARIABLE}: initial;`)
  })
})
