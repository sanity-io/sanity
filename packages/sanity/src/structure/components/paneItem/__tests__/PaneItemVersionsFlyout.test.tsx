import {act, fireEvent, render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {RouterProvider} from 'sanity/router'
import {PaneRouterContext, type PaneRouterContextValue} from 'sanity/structure'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {DOCUMENT_GROUP_INSPECTOR_NAME} from '../../../panes/document/constants'
import {router} from '../../../router'
import {type RouterPanes} from '../../../types'
import {CLOSE_DELAY, OPEN_DELAY, PaneItemVersionsFlyout} from '../PaneItemVersionsFlyout'

const renderList = ({
  onOpenInventory,
  onPick,
}: {
  onOpenInventory: () => void
  onPick: () => void
}) => (
  <div role="menu" aria-label="Versions">
    <button role="menuitem" type="button" onClick={onPick}>
      Default
    </button>
    <button role="menuitem" type="button" onClick={onPick}>
      German
    </button>
    <button role="menuitem" type="button" onClick={onOpenInventory}>
      See all
    </button>
  </div>
)

const paneRouterContextValue = {
  index: 1,
  groupIndex: 0,
  siblingIndex: 0,
  payload: undefined,
  params: {},
  hasGroupSiblings: false,
  groupLength: 1,
  routerPanesState: [[{id: 'book'}]],
} as unknown as PaneRouterContextValue

async function renderRow() {
  const wrapper = await createTestProvider()
  const user = userEvent.setup({delay: null})
  const onNavigate = vi.fn()
  const onRowClick = vi.fn()
  render(
    <RouterProvider router={router} state={{panes: [[{id: 'book'}]]}} onNavigate={onNavigate}>
      <PaneRouterContext.Provider value={paneRouterContextValue}>
        <a data-pane-item-row="" data-testid="row" href="#row" onClick={onRowClick} tabIndex={-1}>
          Winterhold
          <PaneItemVersionsFlyout childId="winterhold" renderList={renderList} />
        </a>
      </PaneRouterContext.Provider>
    </RouterProvider>,
    {wrapper},
  )
  return {onNavigate, onRowClick, row: screen.getByTestId('row'), user}
}

const advance = (ms: number) =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms))
  })

describe('PaneItemVersionsFlyout', () => {
  it('opens after the hover delay, not at once', async () => {
    const {row, user} = await renderRow()
    await user.hover(row)
    await advance(OPEN_DELAY - 50)
    expect(screen.queryByRole('menu', {hidden: true})).toBeNull()
    await advance(100)
    expect(screen.getByRole('menu', {hidden: true})).toBeTruthy()
  })

  it('does not open when the pointer leaves before the delay', async () => {
    const {row, user} = await renderRow()
    await user.hover(row)
    await advance(OPEN_DELAY - 50)
    await user.unhover(row)
    await advance(1000)
    expect(screen.queryByRole('menu', {hidden: true})).toBeNull()
  })

  it('stays open while the pointer moves into the flyout, and closes after leaving both', async () => {
    const {row, user} = await renderRow()
    await user.hover(row)
    await advance(OPEN_DELAY)
    const menu = screen.getByRole('menu', {hidden: true})
    const flyout = menu.parentElement as HTMLElement

    await user.unhover(row)
    await advance(CLOSE_DELAY - 50)
    await user.hover(flyout)
    await advance(2000)
    expect(screen.getByRole('menu', {hidden: true})).toBeTruthy()

    // jsdom has no layout: give the flyout a box away from the pointer's reset position.
    flyout.getBoundingClientRect = () => new DOMRect(500, 0, 400, 200)
    await user.unhover(flyout)
    await advance(CLOSE_DELAY + 500)
    await vi.waitFor(() => expect(screen.queryByRole('menu', {hidden: true})).toBeNull())
  })

  it('closes on Escape and on scroll', async () => {
    const {row, user} = await renderRow()
    await user.hover(row)
    await advance(OPEN_DELAY)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu', {hidden: true})).toBeNull()

    await user.unhover(row)
    await user.hover(row)
    await advance(OPEN_DELAY)
    expect(screen.getByRole('menu', {hidden: true})).toBeTruthy()
    fireEvent.scroll(document.body)
    expect(screen.queryByRole('menu', {hidden: true})).toBeNull()
  })

  it('opens the document with the inventory open when an item is clicked, not the row', async () => {
    const {onNavigate, onRowClick, row, user} = await renderRow()
    await user.hover(row)
    await advance(OPEN_DELAY)
    await user.click(screen.getByRole('menuitem', {name: 'German', hidden: true}))

    expect(onRowClick).not.toHaveBeenCalled()
    expect(onNavigate).toHaveBeenCalledTimes(1)
    const [{path}] = onNavigate.mock.calls[0]
    const panes = (router.decode(path) as {panes?: RouterPanes} | null)?.panes
    expect(panes?.[0]?.[0]?.id).toBe('book')
    expect(panes?.[1]?.[0]).toMatchObject({
      id: 'winterhold',
      params: {inspect: DOCUMENT_GROUP_INSPECTOR_NAME},
    })
    expect(screen.queryByRole('menu', {hidden: true})).toBeNull()
  })

  it('opens with ArrowRight on the row, moves with the arrows, and returns with ArrowLeft', async () => {
    const {row, user} = await renderRow()
    row.focus()
    await user.keyboard('{ArrowRight}')
    await advance(100)
    const first = screen.getByRole('menuitem', {name: 'Default', hidden: true})
    expect(document.activeElement).toBe(first)

    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(
      screen.getByRole('menuitem', {name: 'German', hidden: true}),
    )
    await user.keyboard('{ArrowUp}')
    expect(document.activeElement).toBe(first)

    await user.keyboard('{ArrowLeft}')
    expect(screen.queryByRole('menu', {hidden: true})).toBeNull()
    expect(document.activeElement).toBe(row)
  })
})
