import {studioTheme, ThemeProvider} from '@sanity/ui'
import {render} from '@testing-library/react'
import {type PropsWithChildren} from 'react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {GlobalStyle} from './GlobalStyle'
import {
  GLOBAL_STYLES_ATTRIBUTE,
  GLOBAL_STYLES_BUILD_ID,
  GLOBAL_STYLE_VARIABLE_NAMES,
  GLOBAL_STYLE_VARIABLES,
} from './globalStyleConstants'

const existingRootClass = 'existing-root-class'
const globalStyleRegistry = Symbol.for('sanity.globalStyleRegistry.v1')
const uiColorBgName = GLOBAL_STYLE_VARIABLES.uiColorBg

function ThemedGlobalStyle({children, scheme}: PropsWithChildren<{scheme: 'dark' | 'light'}>) {
  return (
    // oxlint-disable-next-line no-deprecated -- ThemeProvider is required to exercise useTheme_v2
    <ThemeProvider scheme={scheme} theme={studioTheme}>
      {children ?? <GlobalStyle />}
    </ThemeProvider>
  )
}

afterEach(() => {
  vi.doUnmock('./globalStyleConstants')
  vi.resetModules()
  document.documentElement.removeAttribute(GLOBAL_STYLES_ATTRIBUTE)
  document.documentElement.classList.remove(existingRootClass)
  for (const name of GLOBAL_STYLE_VARIABLE_NAMES) {
    document.documentElement.style.removeProperty(name)
  }
  delete (document as unknown as Record<symbol, unknown>)[globalStyleRegistry]
})

describe('GlobalStyle', () => {
  it('restores the document root after unmounting', () => {
    document.documentElement.setAttribute(GLOBAL_STYLES_ATTRIBUTE, 'existing')
    document.documentElement.classList.add(existingRootClass)
    document.documentElement.style.setProperty(uiColorBgName, 'hotpink')

    const {unmount} = render(<ThemedGlobalStyle scheme="dark" />)

    expect(document.documentElement).toHaveAttribute(
      GLOBAL_STYLES_ATTRIBUTE,
      GLOBAL_STYLES_BUILD_ID,
    )
    expect(document.documentElement).toHaveClass(existingRootClass)
    expect(document.documentElement.style.getPropertyValue(uiColorBgName)).not.toBe('hotpink')
    for (const name of GLOBAL_STYLE_VARIABLE_NAMES) {
      expect(document.documentElement.style.getPropertyValue(name)).not.toBe('')
    }

    unmount()

    expect(document.documentElement).toHaveAttribute(GLOBAL_STYLES_ATTRIBUTE, 'existing')
    expect(document.documentElement).toHaveClass(existingRootClass)
    expect(document.documentElement.style.getPropertyValue(uiColorBgName)).toBe('hotpink')
  })

  it('restores the surviving instance when another instance unmounts', () => {
    const light = render(<ThemedGlobalStyle scheme="light" />)
    const lightBackground = document.documentElement.style.getPropertyValue(uiColorBgName)
    const dark = render(<ThemedGlobalStyle scheme="dark" />)
    const darkBackground = document.documentElement.style.getPropertyValue(uiColorBgName)

    expect(darkBackground).not.toBe(lightBackground)

    dark.unmount()

    expect(document.documentElement).toHaveAttribute(
      GLOBAL_STYLES_ATTRIBUTE,
      GLOBAL_STYLES_BUILD_ID,
    )
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

    expect(document.documentElement).toHaveAttribute(
      GLOBAL_STYLES_ATTRIBUTE,
      GLOBAL_STYLES_BUILD_ID,
    )
    expect(document.documentElement.style.getPropertyValue(uiColorBgName)).toBe(darkBackground)

    dark.unmount()

    expect(document.documentElement).not.toHaveAttribute(GLOBAL_STYLES_ATTRIBUTE)
    expect(document.documentElement.style.getPropertyValue(uiColorBgName)).toBe('')
  })

  it('keeps mount precedence when an earlier instance changes theme', () => {
    const earlier = render(<ThemedGlobalStyle scheme="light" />)
    const latest = render(<ThemedGlobalStyle scheme="dark" />)
    const latestBackground = document.documentElement.style.getPropertyValue(uiColorBgName)

    earlier.rerender(<ThemedGlobalStyle scheme="dark" />)
    earlier.rerender(<ThemedGlobalStyle scheme="light" />)

    expect(document.documentElement.style.getPropertyValue(uiColorBgName)).toBe(latestBackground)

    latest.unmount()
    earlier.unmount()
  })

  it('coordinates independently loaded copies', async () => {
    const earlier = render(<ThemedGlobalStyle scheme="light" />)
    const earlierBackground = document.documentElement.style.getPropertyValue(uiColorBgName)
    const alternateBuildId = `${GLOBAL_STYLES_BUILD_ID}-alternate`

    vi.resetModules()
    vi.doMock('./globalStyleConstants', () => ({
      GLOBAL_STYLES_ATTRIBUTE,
      GLOBAL_STYLES_BUILD_ID: alternateBuildId,
      GLOBAL_STYLE_VARIABLE_NAMES,
      GLOBAL_STYLE_VARIABLES,
    }))
    const {GlobalStyle: IndependentlyLoadedGlobalStyle} = await import('./GlobalStyle')
    const latest = render(
      <ThemedGlobalStyle scheme="dark">
        <IndependentlyLoadedGlobalStyle />
      </ThemedGlobalStyle>,
    )
    const latestBackground = document.documentElement.style.getPropertyValue(uiColorBgName)

    expect(document.documentElement).toHaveAttribute(GLOBAL_STYLES_ATTRIBUTE, alternateBuildId)
    expect(document.documentElement.style.getPropertyValue(uiColorBgName)).toBe(latestBackground)

    latest.unmount()

    expect(document.documentElement).toHaveAttribute(
      GLOBAL_STYLES_ATTRIBUTE,
      GLOBAL_STYLES_BUILD_ID,
    )
    expect(document.documentElement.style.getPropertyValue(uiColorBgName)).toBe(earlierBackground)

    earlier.unmount()

    expect(document.documentElement).not.toHaveAttribute(GLOBAL_STYLES_ATTRIBUTE)
    expect(document.documentElement.style.getPropertyValue(uiColorBgName)).toBe('')
  })
})
