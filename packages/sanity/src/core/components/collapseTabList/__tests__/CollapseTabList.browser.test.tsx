import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {type ReactNode} from 'react'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {Button} from '../../../../ui-components/button/Button'
import {CollapseTabList} from '../CollapseTabList'

const theme = buildTheme()

const overflowButton = (
  <Button aria-label="More tools" icon={EllipsisHorizontalIcon} mode="bleed" tooltipProps={null} />
)

// Each tab is 90px wide, so four tabs need 360px plus the overflow button.
// 250px fits three tabs, 600px fits all of them comfortably.
const NARROW = 250
const WIDE = 600
const TAB_STYLE = {width: 90} as const

// Mirrors ToolCollapseMenu, which keys tools by `${tool.name}-${index}` — inserting
// a tool (e.g. Schedules appearing once its async feature check resolves) shifts
// the keys of every tool after it.
function makeTabs(names: string[]) {
  return names.map((name, index) => (
    <Button key={`${name}-${index}`} mode="bleed" style={TAB_STYLE} text={name} />
  ))
}

function TestList(props: {children: ReactNode; width: number}) {
  const {children, width} = props
  return (
    <ThemeProvider theme={theme}>
      <div style={{width}}>
        <CollapseTabList data-testid="collapse-tab-list" menuButtonProps={{button: overflowButton}}>
          {children}
        </CollapseTabList>
      </div>
    </ThemeProvider>
  )
}

// The clones in the measurement row are aria-hidden, so role queries only ever
// match the interactive instances.
const overflowMenuButton = page.getByRole('button', {name: 'More tools'})

describe('CollapseTabList', () => {
  it('renders all children inline without an overflow button when they fit', async () => {
    await render(<TestList width={WIDE}>{makeTabs(['Alpha', 'Beta', 'Gamma', 'Delta'])}</TestList>)

    await expect.element(page.getByRole('button', {name: 'Delta'})).toBeVisible()
    await expect.element(overflowMenuButton).not.toBeInTheDocument()
  })

  it('moves children that do not fit into the overflow menu', async () => {
    await render(
      <TestList width={NARROW}>{makeTabs(['Alpha', 'Beta', 'Gamma', 'Delta'])}</TestList>,
    )

    await expect.element(overflowMenuButton).toBeVisible()
    await expect.element(page.getByRole('button', {name: 'Delta'})).not.toBeInTheDocument()

    await overflowMenuButton.click()
    await expect.element(page.getByRole('menuitem', {name: 'Delta'})).toBeVisible()
  })

  it('removes the overflow button when the container grows enough to fit all children', async () => {
    const tabs = makeTabs(['Alpha', 'Beta', 'Gamma', 'Delta'])
    const {rerender} = await render(<TestList width={NARROW}>{tabs}</TestList>)

    await expect.element(overflowMenuButton).toBeVisible()

    await rerender(<TestList width={WIDE}>{tabs}</TestList>)

    await expect.element(page.getByRole('button', {name: 'Delta'})).toBeVisible()
    await expect.element(overflowMenuButton).not.toBeInTheDocument()
  })

  it('removes the overflow button when child keys shift while collapsed', async () => {
    // Boot at a width where Delta overflows into the menu.
    const {rerender} = await render(
      <TestList width={NARROW}>{makeTabs(['Alpha', 'Beta', 'Gamma', 'Delta'])}</TestList>,
    )
    await expect.element(overflowMenuButton).toBeVisible()

    // A tool appears mid-session (like Schedules once its feature check
    // resolves), shifting the index-based keys of the tools after it.
    await rerender(
      <TestList width={NARROW}>{makeTabs(['Alpha', 'Beta', 'Gamma', 'Extra', 'Delta'])}</TestList>,
    )
    await expect.element(overflowMenuButton).toBeVisible()

    // The container grows enough to fit everything, so the overflow button
    // must disappear instead of sticking around with an empty menu.
    await rerender(
      <TestList width={WIDE}>{makeTabs(['Alpha', 'Beta', 'Gamma', 'Extra', 'Delta'])}</TestList>,
    )

    await expect.element(page.getByRole('button', {name: 'Delta'})).toBeVisible()
    await expect.element(overflowMenuButton).not.toBeInTheDocument()
  })
})
