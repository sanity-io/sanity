import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {render, screen} from '@testing-library/react'
import {type CSSProperties} from 'react'
import {expect, it} from 'vitest'

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
  // ui5 Flex defaults minWidth to 0 via CSS variable, not inline style
  expect(root.style.getPropertyValue('--min-width')).toBe('0')
  expect(root.className).toContain('sui-min-width')
  expect(root.style.width).toBe('200px')
  expect(root.style.color).toBe('red')
})

it('lets consumer style override overlapping layout keys', () => {
  renderList({minWidth: 40})

  const root = screen.getByTestId('collapse-tab-list')

  expect(root.style.position).toBe('relative')
  expect(root.style.minWidth).toBe('40px')
})
