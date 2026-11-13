import {useEffect, useState} from 'react'
import {PaneRouterContext, type PaneRouterContextValue} from 'sanity/structure'
import {describe, expect, it, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {CLOSE_DELAY, PaneItemVersionsFlyout} from '../PaneItemVersionsFlyout'

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

/** The row's preview loads first, so the flyout mounts after the pointer is already over the row. */
function LateFlyout() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 200)
    return () => clearTimeout(timer)
  }, [])
  return mounted ? <PaneItemVersionsFlyout childId="winterhold" renderList={renderList} /> : null
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

  it('stays open after the finger lifts, which sends the row a pointerleave', async () => {
    renderRow()
    const dots = page.getByTestId('dots')
    await expect.element(dots).toBeVisible()

    tap(dots.element())
    await expect.element(page.getByRole('menu', {name: 'Versions'})).toBeVisible()

    // A touch pointer leaves the row as soon as the finger lifts
    page
      .getByTestId('row')
      .element()
      .dispatchEvent(new PointerEvent('pointerleave', {pointerType: 'touch', bubbles: false}))
    await new Promise((resolve) => setTimeout(resolve, CLOSE_DELAY + 500))

    expect(page.getByRole('menu', {name: 'Versions'}).elements()).toHaveLength(1)
  })

  it('moves focus into the flyout on the right arrow key when hover already opened it', async () => {
    renderRow()
    const row = page.getByTestId('row')
    await row.hover()
    await expect.element(page.getByRole('menu', {name: 'Versions'})).toBeVisible()

    ;(row.element() as HTMLElement).focus()
    await userEvent.keyboard('{ArrowRight}')

    await expect.element(page.getByRole('menuitem', {name: 'Default'})).toHaveFocus()
  })

  it('opens when the pointer was already over the row before the flyout mounted', async () => {
    void render(
      <TestWrapper schemaTypes={[]}>
        <PaneRouterContext.Provider value={paneRouterContextValue}>
          <div style={{padding: 40}}>
            <a data-pane-item-row="" data-testid="row" href="#row" tabIndex={-1}>
              Winterhold
              <LateFlyout />
            </a>
          </div>
        </PaneRouterContext.Provider>
      </TestWrapper>,
    )
    await page.getByTestId('row').hover()
    await expect.element(page.getByRole('menu', {name: 'Versions'})).toBeVisible()
  })

  it('stays open when a tap lands on the flyout and the finger lifts off it', async () => {
    renderRow()
    await expect.element(page.getByTestId('dots')).toBeVisible()
    tap(page.getByTestId('dots').element())
    const menu = page.getByRole('menu', {name: 'Versions'})
    await expect.element(menu).toBeVisible()

    // The flyout's own wrapper is the menu's parent
    const flyout = menu.element().parentElement as HTMLElement
    // React derives `onPointerLeave` from `pointerout` with a related target outside the element
    flyout.dispatchEvent(
      new PointerEvent('pointerout', {
        bubbles: true,
        pointerType: 'touch',
        relatedTarget: document.body,
      }),
    )
    await new Promise((resolve) => setTimeout(resolve, CLOSE_DELAY + 500))

    expect(page.getByRole('menu', {name: 'Versions'}).elements()).toHaveLength(1)
  })
})
