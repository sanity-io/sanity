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

// The measuring clones mount on an update, after the list has stored its row element. Suspending
// past the list used to hide and reveal it in a loop until React threw "Maximum update depth
// exceeded".
it('renders the tabs with a placeholder while a lazy tab icon loads', async () => {
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
            <Button data-testid="tab" icon={Icon} key="tab" mode="bleed" text="Tab" />
          </CollapseTabList>
        </Suspense>
      </ThemeProvider>,
    )
  })

  expect(screen.queryByTestId('fallback')).not.toBeInTheDocument()
  for (const tab of screen.getAllByTestId('tab')) {
    expect(tab.querySelector('[data-sanity-icon-placeholder]')).toBeInTheDocument()
  }

  await act(async () => {
    load({default: () => <svg data-testid="lazy-icon" />})
  })

  expect(document.querySelector('[data-sanity-icon-placeholder]')).not.toBeInTheDocument()
  expect(screen.getAllByTestId('lazy-icon')).toHaveLength(screen.getAllByTestId('tab').length)
})
