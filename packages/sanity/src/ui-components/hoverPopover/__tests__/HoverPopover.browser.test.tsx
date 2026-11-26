import {Flex, Text} from 'ui5'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {HoverPopover} from '../HoverPopover'

const OPEN_DELAY = 50

function Trigger({label}: {label: string}) {
  return (
    <HoverPopover
      closeDelay={1000}
      content={<Text>{`${label} content`}</Text>}
      group={label === 'Ungrouped' ? undefined : 'test'}
      fallbackPlacements={[]}
      openDelay={OPEN_DELAY}
      padding={3}
      placement="right"
      portal
    >
      <button type="button">{label}</button>
    </HoverPopover>
  )
}

function Harness() {
  return (
    <TestWrapper schemaTypes={[]}>
      {/* Stacked and opening to the right, so no popover covers another element. */}
      <Flex flexDirection="column" alignItems="flex-start" gap={7} padding={4}>
        <Trigger label="First" />
        <Trigger label="Second" />
        <Trigger label="Ungrouped" />
      </Flex>
      <div data-testid="elsewhere" style={{marginTop: 400, height: 40}} />
    </TestWrapper>
  )
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const content = (label: string) => page.getByText(`${label} content`, {exact: true})

describe('HoverPopover', () => {
  it('opens while the pointer rests on its element, and stays open while it is on the popover', async () => {
    void render(<Harness />)

    await userEvent.hover(page.getByRole('button', {name: 'First'}))
    await expect.element(content('First')).toBeVisible()

    // Moving onto the popover keeps it open, past the close delay.
    await userEvent.hover(content('First'))
    await sleep(1200)
    await expect.element(content('First')).toBeVisible()

    // Once the pointer left both, it closes after the close delay.
    await userEvent.hover(page.getByTestId('elsewhere'))
    await sleep(300)
    await expect.element(content('First')).toBeVisible()
    await expect.element(content('First'), {timeout: 2000}).not.toBeInTheDocument()
  })

  it('does not open when the pointer leaves before the open delay', async () => {
    void render(<Harness />)

    await userEvent.hover(page.getByRole('button', {name: 'First'}))
    await userEvent.hover(page.getByTestId('elsewhere'))
    await sleep(OPEN_DELAY * 4)
    expect(content('First').elements()).toHaveLength(0)
  })

  it('keeps only one popover of a group open', async () => {
    void render(<Harness />)

    await userEvent.hover(page.getByRole('button', {name: 'First'}))
    await expect.element(content('First')).toBeVisible()

    // The first one would stay open for its close delay, but the second one closes it.
    await userEvent.hover(page.getByRole('button', {name: 'Second'}))
    await expect.element(content('Second')).toBeVisible()
    expect(content('First').elements()).toHaveLength(0)

    // A popover outside of the group doesn't close it.
    await userEvent.hover(page.getByRole('button', {name: 'Ungrouped'}))
    await expect.element(content('Ungrouped')).toBeVisible()
    await expect.element(content('Second')).toBeVisible()
  })

  it('closes on Escape', async () => {
    void render(<Harness />)

    await userEvent.hover(page.getByRole('button', {name: 'First'}))
    await expect.element(content('First')).toBeVisible()
    await userEvent.keyboard('{Escape}')
    await expect.element(content('First')).not.toBeInTheDocument()
  })
})
