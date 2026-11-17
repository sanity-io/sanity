import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {act, render, screen} from '@testing-library/react'
import {type ComponentType, type CSSProperties, lazy, Suspense} from 'react'
import {expect, it} from 'vitest'

import {Button} from '../../../ui-components/button/Button'
import {CollapseTabList} from './CollapseTabList'

const theme = buildTheme()

function renderList(style: CSSProperties) {
  return render(
    <ThemeProvider theme={theme}>
      <CollapseTabList data-testid="collapse-tab-list" style={style}>
        <span>One</span>
      </CollapseTabList>
    </ThemeProvider>,
  )
}

it('merges consumer style with required layout styles', () => {
  renderList({width: 200, color: 'red'})

  const root = screen.getByTestId('collapse-tab-list')

  expect(root.style.position).toBe('relative')
  // ui5 Flex defaults minWidth to 0 in its stylesheet, not as an inline style
  expect(root.className).toContain('sui-Flex')
  expect(root.style.width).toBe('200px')
  expect(root.style.color).toBe('red')
})

it('lets consumer style override overlapping layout keys', () => {
  renderList({minWidth: 40})

  const root = screen.getByTestId('collapse-tab-list')

  expect(root.style.position).toBe('relative')
  expect(root.style.minWidth).toBe('40px')
})

// Tool icons can be `React.lazy` components (the `icons` map of `@sanity/icons`), and the navbar
// lays out the tools through a CollapseTabList.
it('falls back while a child icon loads instead of hiding and revealing in a loop', async () => {
  let load!: (module: {default: ComponentType}) => void
  const Icon = lazy(
    () =>
      new Promise<{default: ComponentType}>((resolve) => {
        load = resolve
      }),
  )

  // oxlint-disable-next-line testing-library/no-unnecessary-act -- the icon suspends during mount, and React only resumes work that suspended inside an awaited async `act`
  await act(async () => {
    render(
      <ThemeProvider theme={theme}>
        <Suspense fallback={<div data-testid="fallback" />}>
          <CollapseTabList data-testid="collapse-tab-list">
            <Button icon={Icon} key="tool" mode="bleed" text="Tool" tooltipProps={null} />
          </CollapseTabList>
        </Suspense>
      </ThemeProvider>,
    )
  })

  expect(screen.getByTestId('fallback')).toBeInTheDocument()
  expect(screen.getByTestId('collapse-tab-list')).not.toBeVisible()

  await act(async () => {
    load({default: () => <svg data-testid="lazy-icon" />})
  })

  expect(screen.queryByTestId('fallback')).not.toBeInTheDocument()
  expect(screen.getByTestId('collapse-tab-list')).toBeVisible()
  expect(screen.getAllByTestId('lazy-icon').length).toBeGreaterThan(0)
})
