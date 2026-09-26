import {afterEach, describe, expect, test} from 'vitest'

import {
  LIGHTNINGCSS_DARK_VARIABLE,
  LIGHTNINGCSS_LIGHT_VARIABLE,
  applyStoredDocumentColorScheme,
  setDocumentColorScheme,
} from '../documentColorScheme'

// The Lightning CSS toggle behaviour needs real CSSOM and matchMedia and is covered by
// documentColorScheme.browser.test.ts; these tests cover the color-scheme write and its
// snapshot/restore.
describe('setDocumentColorScheme', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('style')
  })

  test('writes the resolved scheme to color-scheme', () => {
    setDocumentColorScheme('light')
    expect(document.documentElement.style.colorScheme).toBe('light')

    setDocumentColorScheme('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  test('the disposer removes a color-scheme written over an empty one', () => {
    const dispose = setDocumentColorScheme('dark')
    dispose()

    expect(document.documentElement.style.colorScheme).toBe('')
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

describe('applyStoredDocumentColorScheme', () => {
  afterEach(() => {
    document.documentElement.style.colorScheme = ''
    localStorage.removeItem('sanityStudio:ui:colorScheme')
  })

  test('applies a stored light or dark scheme', () => {
    localStorage.setItem('sanityStudio:ui:colorScheme', 'dark')
    applyStoredDocumentColorScheme()
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  test('leaves system unset so the OS can win', () => {
    document.documentElement.style.colorScheme = ''
    localStorage.setItem('sanityStudio:ui:colorScheme', 'system')
    applyStoredDocumentColorScheme()
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
