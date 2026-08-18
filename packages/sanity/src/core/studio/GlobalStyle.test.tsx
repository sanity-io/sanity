import {studioTheme, ThemeProvider} from '@sanity/ui'
import {render} from '@testing-library/react'
import {afterEach, describe, expect, it} from 'vitest'

import {GlobalStyle} from './GlobalStyle'
import {GLOBAL_STYLES_ATTRIBUTE} from './globalStyleConstants'
import {uiColorBg} from './styles.css'

const uiColorBgName = uiColorBg.slice(4, -1)

function ThemedGlobalStyle({scheme}: {scheme: 'dark' | 'light'}) {
  return (
    // oxlint-disable-next-line no-deprecated -- ThemeProvider is required to exercise useTheme_v2
    <ThemeProvider scheme={scheme} theme={studioTheme}>
      <GlobalStyle />
    </ThemeProvider>
  )
}

afterEach(() => {
  document.documentElement.removeAttribute(GLOBAL_STYLES_ATTRIBUTE)
  document.documentElement.style.removeProperty(uiColorBgName)
})

describe('GlobalStyle', () => {
  it('restores the document root after unmounting', () => {
    document.documentElement.style.setProperty(uiColorBgName, 'hotpink')

    const {unmount} = render(<ThemedGlobalStyle scheme="dark" />)

    expect(document.documentElement).toHaveAttribute(GLOBAL_STYLES_ATTRIBUTE)
    expect(document.documentElement.style.getPropertyValue(uiColorBgName)).not.toBe('hotpink')

    unmount()

    expect(document.documentElement).not.toHaveAttribute(GLOBAL_STYLES_ATTRIBUTE)
    expect(document.documentElement.style.getPropertyValue(uiColorBgName)).toBe('hotpink')
  })

  it('restores the surviving instance when another instance unmounts', () => {
    const light = render(<ThemedGlobalStyle scheme="light" />)
    const lightBackground = document.documentElement.style.getPropertyValue(uiColorBgName)
    const dark = render(<ThemedGlobalStyle scheme="dark" />)
    const darkBackground = document.documentElement.style.getPropertyValue(uiColorBgName)

    expect(darkBackground).not.toBe(lightBackground)

    dark.unmount()

    expect(document.documentElement).toHaveAttribute(GLOBAL_STYLES_ATTRIBUTE)
    expect(document.documentElement.style.getPropertyValue(uiColorBgName)).toBe(lightBackground)

    light.unmount()

    expect(document.documentElement).not.toHaveAttribute(GLOBAL_STYLES_ATTRIBUTE)
    expect(document.documentElement.style.getPropertyValue(uiColorBgName)).toBe('')
  })

  it('keeps the latest instance active when an earlier instance unmounts', () => {
    const light = render(<ThemedGlobalStyle scheme="light" />)
    const dark = render(<ThemedGlobalStyle scheme="dark" />)
    const darkBackground = document.documentElement.style.getPropertyValue(uiColorBgName)

    light.unmount()

    expect(document.documentElement).toHaveAttribute(GLOBAL_STYLES_ATTRIBUTE)
    expect(document.documentElement.style.getPropertyValue(uiColorBgName)).toBe(darkBackground)

    dark.unmount()

    expect(document.documentElement).not.toHaveAttribute(GLOBAL_STYLES_ATTRIBUTE)
    expect(document.documentElement.style.getPropertyValue(uiColorBgName)).toBe('')
  })
})
