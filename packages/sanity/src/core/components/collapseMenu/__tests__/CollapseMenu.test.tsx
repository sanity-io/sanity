import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {act, render, screen} from '@testing-library/react'
import {type ComponentType, lazy, Suspense} from 'react'
import {describe, expect, test} from 'vitest'

import {CollapseMenu} from '../CollapseMenu'
import {CollapseMenuButton} from '../CollapseMenuButton'

const theme = buildTheme()

function createLazyIcon() {
  let resolve!: (module: {default: ComponentType}) => void
  const Icon = lazy(
    () =>
      new Promise<{default: ComponentType}>((r) => {
        resolve = r
      }),
  )
  return {Icon, load: () => resolve({default: () => <svg data-testid="lazy-icon" />})}
}

describe('CollapseMenu', () => {
  // Schema type icons can be `React.lazy` components (the `icons` map of `@sanity/icons`), and
  // the Portable Text insert menu renders them through a CollapseMenu under the field's boundary.
  test('falls back while an option icon loads instead of hiding and revealing in a loop', async () => {
    const {Icon, load} = createLazyIcon()

    // oxlint-disable-next-line testing-library/no-unnecessary-act -- the icon suspends during mount, and React only resumes work that suspended inside an awaited async `act`
    await act(async () => {
      render(
        <ThemeProvider theme={theme}>
          <Suspense fallback={<div data-testid="fallback" />}>
            <CollapseMenu data-testid="collapse-menu">
              <CollapseMenuButton
                aria-label="Insert video"
                icon={Icon}
                key="video"
                mode="bleed"
                text="Insert video"
              />
            </CollapseMenu>
          </Suspense>
        </ThemeProvider>,
      )
    })

    await act(async () => {
      load()
    })

    expect(screen.getByTestId('collapse-menu')).toBeVisible()
    expect(screen.getAllByTestId('lazy-icon').length).toBeGreaterThan(0)
  })
})
