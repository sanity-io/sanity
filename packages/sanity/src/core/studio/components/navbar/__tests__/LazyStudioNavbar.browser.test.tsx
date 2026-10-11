import {MenuIcon} from '@sanity/icons/Menu'
import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {Flex} from 'ui5'
import {afterEach, describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {Button} from '../../../../../ui-components/button/Button'
import {NavbarFallback} from '../LazyStudioNavbar'

const theme = buildTheme()

function height(testId: string) {
  const element = document.querySelector(`[data-testid="${testId}"]`)
  if (!element) throw new Error(`No element with data-testid="${testId}"`)
  return element.getBoundingClientRect().height
}

/**
 * The navbar loads in its own chunk, so the fallback has to reserve the height the navbar takes
 * or the tool area below it jumps when the chunk arrives. It does that with a hidden copy of the
 * button the navbar's rows are built from; these assertions fail if it goes back to a fixed
 * pixel height, which stops tracking the theme's button size, page zoom and text scaling.
 */
describe('NavbarFallback', () => {
  afterEach(() => {
    document.documentElement.style.fontSize = ''
  })

  it('reserves one row of default-size buttons, at any text scale', async () => {
    await render(
      <ThemeProvider theme={theme}>
        <NavbarFallback />
        <Flex alignItems="center" data-testid="reference-row">
          <Button icon={MenuIcon} mode="bleed" tooltipProps={null} />
        </Flex>
      </ThemeProvider>,
    )

    await expect.element(page.getByTestId('studio-navbar-loading')).toBeInTheDocument()

    const reservedRow = document.querySelector(
      '[data-testid="studio-navbar-loading"] [aria-hidden="true"]',
    )
    expect(reservedRow).not.toBeNull()
    expect(reservedRow!.getBoundingClientRect().height).toBe(height('reference-row'))

    const atDefaultScale = height('studio-navbar-loading')
    expect(atDefaultScale).toBeGreaterThan(0)

    document.documentElement.style.fontSize = '24px'
    await expect
      .poll(() => height('studio-navbar-loading'))
      .toBeGreaterThan(atDefaultScale + /* the card padding alone would grow by this much */ 12)
    expect(reservedRow!.getBoundingClientRect().height).toBe(height('reference-row'))

    document.documentElement.style.fontSize = ''
    await expect.poll(() => height('studio-navbar-loading')).toBe(atDefaultScale)
  })
})
