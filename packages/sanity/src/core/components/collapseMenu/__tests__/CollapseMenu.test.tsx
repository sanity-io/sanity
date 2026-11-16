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
  // the Portable Text toolbar renders them through a CollapseMenu, which mounts its measuring rows
  // on an update. Suspending past the menu used to hide and reveal it in a loop until React threw
  // "Maximum update depth exceeded".
  test('renders the options with a placeholder while an option icon loads', async () => {
    const {Icon, load} = createLazyIcon()

    // oxlint-disable-next-line testing-library/no-unnecessary-act -- the icon suspends during mount, and React only resumes work that suspended inside an awaited async `act`
    await act(async () => {
      render(
        <ThemeProvider theme={theme}>
          <Suspense fallback={<div data-testid="fallback" />}>
            <CollapseMenu data-testid="collapse-menu">
              <CollapseMenuButton
                aria-label="Insert video"
                data-testid="insert-video"
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

    expect(screen.queryByTestId('fallback')).not.toBeInTheDocument()
    expect(screen.getByTestId('collapse-menu')).toBeVisible()
    expect(screen.queryByTestId('lazy-icon')).not.toBeInTheDocument()
    for (const button of screen.getAllByTestId('insert-video')) {
      expect(button.querySelector('[data-sanity-icon-placeholder]')).toBeInTheDocument()
    }

    await act(async () => {
      load()
    })

    expect(screen.queryByTestId('fallback')).not.toBeInTheDocument()
    expect(document.querySelector('[data-sanity-icon-placeholder]')).not.toBeInTheDocument()
    expect(screen.getAllByTestId('lazy-icon')).toHaveLength(
      screen.getAllByTestId('insert-video').length,
    )
  })
})
