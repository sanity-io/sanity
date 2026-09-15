import {afterEach, describe, expect, test} from 'vitest'

import {
  LIGHTNINGCSS_DARK_VARIABLE,
  LIGHTNINGCSS_LIGHT_VARIABLE,
  setDocumentColorScheme,
} from '../documentColorScheme'

const LIGHT_COLOR = 'rgb(10, 20, 30)'
const DARK_COLOR = 'rgb(200, 210, 220)'

// The module's down-level detection caches its first probe for the life of the page, so the
// no-declaration case needs a page where nothing ever declares the toggles - hence its own
// test file, separate from documentColorScheme.browser.test.ts.
describe('setDocumentColorScheme (real CSSOM, no down-leveled output)', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('style')
    document.body.replaceChildren()
  })

  test('skips the toggles when nothing declares them', () => {
    const probe = document.createElement('div')
    probe.style.color = `var(${LIGHTNINGCSS_LIGHT_VARIABLE}, ${LIGHT_COLOR}) var(${LIGHTNINGCSS_DARK_VARIABLE}, ${DARK_COLOR})`
    document.body.appendChild(probe)

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const mismatchScheme = prefersDark ? 'light' : 'dark'
    const mismatchColor = prefersDark ? LIGHT_COLOR : DARK_COLOR

    setDocumentColorScheme(mismatchScheme)

    expect(document.documentElement.style.colorScheme).toBe(mismatchScheme)
    expect(document.documentElement.getAttribute('style') ?? '').not.toContain('lightningcss')
    expect(getComputedStyle(probe).color).not.toBe(mismatchColor)
  })
})
