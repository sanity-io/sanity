import {PaneRouterContext, type PaneRouterContextValue} from 'sanity/structure'
import {describe, expect, it, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {PaneItemVersionsFlyout} from '../PaneItemVersionsFlyout'

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

function renderList({onPick}: {onOpenInventory: () => void; onPick: () => void}) {
  return (
    <div role="menu" aria-label="Versions">
      <button role="menuitem" type="button" onClick={onPick}>
        Default
      </button>
      <button role="menuitem" type="button" onClick={onPick}>
        German
      </button>
    </div>
  )
}

function renderRow(onRowClick = vi.fn()) {
  void render(
    <TestWrapper schemaTypes={[]}>
      <PaneRouterContext.Provider value={paneRouterContextValue}>
        <div style={{padding: 40}}>
          <a data-pane-item-row="" data-testid="row" href="#row" onClick={onRowClick} tabIndex={-1}>
            Winterhold
            <PaneItemVersionsFlyout childId="winterhold" renderList={renderList}>
              <span data-testid="dots" style={{display: 'inline-block', width: 24, height: 24}}>
                dots
              </span>
            </PaneItemVersionsFlyout>
          </a>
        </div>
      </PaneRouterContext.Provider>
    </TestWrapper>,
  )
}

/** A tap: the pointer events a touch screen sends, then the click that follows them. */
function tap(element: Element) {
  const init = {bubbles: true, cancelable: true, pointerType: 'touch', isPrimary: true}
  element.dispatchEvent(new PointerEvent('pointerdown', init))
  element.dispatchEvent(new PointerEvent('pointerup', init))
  return element.dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true}))
}

describe('PaneItemVersionsFlyout', () => {
  it('tells assistive technology the row opens a menu, and whether it is open', async () => {
    renderRow()
    const row = page.getByTestId('row')
    await expect.element(row).toHaveAttribute('aria-haspopup', 'menu')
    await expect.element(row).toHaveAttribute('aria-expanded', 'false')

    await userEvent.keyboard('{Tab}')
    ;(row.element() as HTMLElement).focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect.element(page.getByRole('menu', {name: 'Versions'})).toBeVisible()
    await expect.element(row).toHaveAttribute('aria-expanded', 'true')

    await userEvent.keyboard('{Escape}')
    await expect.poll(() => row.element().getAttribute('aria-expanded')).toBe('false')
  })

  it('opens on a tap on the dots on a touch screen, without following the row link', async () => {
    const onRowClick = vi.fn()
    renderRow(onRowClick)
    const dots = page.getByTestId('dots')
    await expect.element(dots).toBeVisible()

    const notPrevented = tap(dots.element())

    await expect.element(page.getByRole('menu', {name: 'Versions'})).toBeVisible()
    // The tap opens the flyout; it does not also open the row's document
    expect(notPrevented).toBe(false)
    expect(onRowClick).not.toHaveBeenCalled()
    await expect.element(page.getByTestId('row')).toHaveAttribute('aria-expanded', 'true')

    // A second tap closes it
    tap(dots.element())
    await expect.poll(() => page.getByRole('menu', {name: 'Versions'}).elements().length).toBe(0)
  })
})
