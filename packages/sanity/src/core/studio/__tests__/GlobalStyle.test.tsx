import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {render} from '@testing-library/react'
import {afterEach, describe, expect, test} from 'vitest'

import {GlobalStyle, WEBKIT_PSEUDO_STYLES_ATTRIBUTE} from '../GlobalStyle'
import {bgColorVar, GLOBAL_STYLES_ATTRIBUTE} from '../styles.css'

const theme = buildTheme()
if (!theme.v2) throw new Error('buildTheme() did not produce a v2 theme')
const {color} = theme.v2
const bgVarName = bgColorVar.slice('var('.length, -1)
const html = document.documentElement

function Studio({scheme}: {scheme: 'light' | 'dark'}) {
  return (
    <ThemeProvider theme={theme} scheme={scheme}>
      <GlobalStyle />
    </ThemeProvider>
  )
}

function webkitPseudoCss() {
  return document.querySelector(`style[${WEBKIT_PSEUDO_STYLES_ATTRIBUTE}]`)?.textContent ?? ''
}

describe('GlobalStyle', () => {
  afterEach(() => {
    html.removeAttribute(GLOBAL_STYLES_ATTRIBUTE)
    html.style.removeProperty(bgVarName)
  })

  test('marks <html> and sets the theme variables while mounted, and cleans up on unmount', () => {
    const {unmount} = render(<Studio scheme="light" />)

    expect(html.hasAttribute(GLOBAL_STYLES_ATTRIBUTE)).toBe(true)
    expect(html.style.getPropertyValue(bgVarName)).toBe(color.light.default.bg)

    unmount()

    expect(html.hasAttribute(GLOBAL_STYLES_ATTRIBUTE)).toBe(false)
    expect(html.style.getPropertyValue(bgVarName)).toBe('')
    expect(webkitPseudoCss()).toBe('')
  })

  test('inlines WebKit-pseudo colors so thumbs and resizers keep literal fallbacks', () => {
    const {unmount} = render(<Studio scheme="light" />)

    const css = webkitPseudoCss()
    expect(css).toContain(`var(--card-border-color, ${color.light.default.border})`)
    expect(css).toContain(`var(--card-muted-fg-color, ${color.light.default.muted.fg})`)
    expect(css).toContain(`stroke='${encodeURIComponent(color.light.default.icon)}'`)

    unmount()
    expect(document.querySelector(`style[${WEBKIT_PSEUDO_STYLES_ATTRIBUTE}]`)).toBeNull()
  })

  test('follows theme changes', () => {
    const {rerender} = render(<Studio scheme="light" />)
    rerender(<Studio scheme="dark" />)

    expect(html.style.getPropertyValue(bgVarName)).toBe(color.dark.default.bg)
    expect(webkitPseudoCss()).toContain(`var(--card-border-color, ${color.dark.default.border})`)
  })

  test('the last mounted studio wins and unmounting it hands the root back to the other', () => {
    const {rerender: rerenderFirst, unmount: unmountFirst} = render(<Studio scheme="light" />)
    const {unmount: unmountSecond} = render(<Studio scheme="dark" />)

    expect(html.style.getPropertyValue(bgVarName)).toBe(color.dark.default.bg)

    // a theme change on the earlier instance does not jump the queue
    rerenderFirst(<Studio scheme="light" />)
    expect(html.style.getPropertyValue(bgVarName)).toBe(color.dark.default.bg)

    unmountSecond()

    expect(html.hasAttribute(GLOBAL_STYLES_ATTRIBUTE)).toBe(true)
    expect(html.style.getPropertyValue(bgVarName)).toBe(color.light.default.bg)

    unmountFirst()

    expect(html.hasAttribute(GLOBAL_STYLES_ATTRIBUTE)).toBe(false)
  })
})
