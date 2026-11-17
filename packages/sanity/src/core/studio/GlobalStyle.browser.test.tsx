import {Card, studioTheme, ThemeProvider} from '@sanity/ui'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../test/browser/testHelpers'
import {GlobalStyle} from './GlobalStyle'
import {
  GLOBAL_STYLES_ATTRIBUTE,
  GLOBAL_STYLES_BUILD_ID,
  GLOBAL_STYLE_VARIABLE_NAMES,
  GLOBAL_STYLE_VARIABLES,
} from './globalStyleConstants'

const {settleChromaticEndState} = testHelpers()

function GlobalStyleHarness({scheme}: {scheme: 'dark' | 'light'}) {
  return (
    // oxlint-disable-next-line no-deprecated -- ThemeProvider is required to exercise useTheme_v2
    <ThemeProvider scheme={scheme} theme={studioTheme}>
      <GlobalStyle />
      <Card
        as="main"
        data-testid="global-style-harness"
        id="sanity"
        tone="default"
        style={{height: 320, overflow: 'auto', padding: 24}}
      >
        <div style={{height: 480}}>
          <h1>Studio global styles</h1>
          <p>
            Theme values stay dynamic while <strong>Panda CSS</strong> owns the global selectors.
          </p>
          <div
            data-testid="background-probe"
            style={{
              backgroundColor: `var(${GLOBAL_STYLE_VARIABLES.uiColorBg})`,
              height: 80,
              width: 240,
            }}
          />
          <textarea aria-label="Resizable field" defaultValue="Resize handle and scrollbar" />
        </div>
      </Card>
    </ThemeProvider>
  )
}

function rootBackgroundColor() {
  return getComputedStyle(document.documentElement).backgroundColor
}

describe('GlobalStyle', () => {
  it('applies extracted global rules and updates their theme variables', async () => {
    await page.viewport(1280, 800)
    const {rerender} = await render(<GlobalStyleHarness scheme="light" />)

    await expect.element(page.getByTestId('global-style-harness')).toBeVisible()
    await expect
      .poll(() => document.documentElement.getAttribute(GLOBAL_STYLES_ATTRIBUTE))
      .toBe(GLOBAL_STYLES_BUILD_ID)

    const lightBackground = rootBackgroundColor()
    const backgroundProbe = page.getByTestId('background-probe').element()
    expect(lightBackground).toBe(getComputedStyle(backgroundProbe).backgroundColor)
    expect(getComputedStyle(document.body).scrollbarGutter).toBe('stable')

    for (const name of GLOBAL_STYLE_VARIABLE_NAMES) {
      expect(document.documentElement.style.getPropertyValue(name)).not.toBe('')
    }

    const strong = page.getByText('Panda CSS', {exact: true}).element()
    expect(getComputedStyle(strong).fontWeight).toBe(
      document.documentElement.style.getPropertyValue(
        GLOBAL_STYLE_VARIABLES.uiFontTextWeightMedium,
      ),
    )

    await rerender(<GlobalStyleHarness scheme="dark" />)
    await expect.poll(rootBackgroundColor).not.toBe(lightBackground)
    expect(rootBackgroundColor()).toBe(getComputedStyle(backgroundProbe).backgroundColor)

    await settleChromaticEndState()
  })
})
