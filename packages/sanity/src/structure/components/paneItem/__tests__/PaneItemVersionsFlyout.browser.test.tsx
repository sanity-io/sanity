import {useEffect, useState} from 'react'
import {CommandList} from 'sanity'
import {RouterProvider} from 'sanity/router'
import {PaneRouterContext, type PaneRouterContextValue} from 'sanity/structure'
import {describe, expect, it, type Mock, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {DOCUMENT_GROUP_INSPECTOR_NAME} from '../../../panes/document/constants'
import {router} from '../../../router'
import {type RouterPanes} from '../../../types'
import {
  CLOSE_DELAY,
  PaneItemVersionsFlyout,
  type PaneItemVersionsFlyoutActions,
} from '../PaneItemVersionsFlyout'

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

function renderList({onOpenInventory, onPick}: PaneItemVersionsFlyoutActions) {
  return (
    <div role="menu" aria-label="Versions">
      <button role="menuitem" type="button" onClick={() => onPick(null)}>
        Default
      </button>
      <button role="menuitem" type="button" onClick={() => onPick('_.variants.german')}>
        German
      </button>
      <button role="menuitem" type="button" onClick={onOpenInventory}>
        See all versions
      </button>
    </div>
  )
}

type OnNavigate = Mock<(opts: {path: string; replace?: boolean}) => void>

/** Where a navigation went: the panes, and the audience in the `variant` sticky param. */
function decodeNavigation(onNavigate: OnNavigate) {
  const [{path}] = onNavigate.mock.lastCall as [{path: string}]
  return {
    panes: (router.decode(path) as {panes?: RouterPanes} | null)?.panes,
    variant: new URL(path, 'http://localhost').searchParams.get('variant'),
  }
}

const BOOKS = ['winterhold', 'riften', 'solitude']

/**
 * A document list as Structure renders one: a `CommandList` that Tab focuses as a whole, whose
 * arrow keys move the active row, with a flyout on every row.
 */
function DocumentList(props: {onNavigate: OnNavigate}) {
  return (
    <RouterProvider router={router} state={{panes: [[{id: 'book'}]]}} onNavigate={props.onNavigate}>
      <PaneRouterContext.Provider value={paneRouterContextValue}>
        <button type="button">Before the list</button>
        <div style={{height: 240, width: 320, display: 'flex', flexDirection: 'column'}}>
          <CommandList
            activeItemDataAttr="data-hovered"
            ariaLabel="Books"
            canReceiveFocus
            itemHeight={51}
            items={BOOKS}
            onlyShowSelectionWhenActive
            renderItem={(id: string) => (
              <a
                data-pane-item-row=""
                data-testid={`row-${id}`}
                href={`#${id}`}
                style={{display: 'flex', height: 51, alignItems: 'center'}}
                tabIndex={-1}
              >
                {id}
                <PaneItemVersionsFlyout childId={id} renderList={renderList} />
              </a>
            )}
            wrapAround={false}
          />
        </div>
      </PaneRouterContext.Provider>
    </RouterProvider>
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

  it('opens the document in the picked audience with the inventory beside it', async () => {
    const onNavigate: OnNavigate = vi.fn()
    void render(
      <TestWrapper schemaTypes={[]}>
        <DocumentList onNavigate={onNavigate} />
      </TestWrapper>,
    )
    const row = page.getByTestId('row-riften')
    await row.hover()
    await page.getByRole('menuitem', {name: 'German'}).click()

    const {panes, variant} = decodeNavigation(onNavigate)
    expect(onNavigate).toHaveBeenCalledTimes(1)
    expect(panes?.[0]?.[0]?.id).toBe('book')
    expect(panes?.[1]?.[0]).toMatchObject({
      id: 'riften',
      params: {inspect: DOCUMENT_GROUP_INSPECTOR_NAME},
    })
    expect(variant).toBe('variant:german')
    await expect.poll(() => page.getByRole('menu', {name: 'Versions'}).elements().length).toBe(0)
  })

  it('opens the document with the inventory beside it from the footer', async () => {
    const onNavigate: OnNavigate = vi.fn()
    void render(
      <TestWrapper schemaTypes={[]}>
        <DocumentList onNavigate={onNavigate} />
      </TestWrapper>,
    )
    await page.getByTestId('row-solitude').hover()
    await page.getByRole('menuitem', {name: 'See all versions'}).click()

    const {panes, variant} = decodeNavigation(onNavigate)
    expect(panes?.[1]?.[0]).toMatchObject({
      id: 'solitude',
      params: {inspect: DOCUMENT_GROUP_INSPECTOR_NAME},
    })
    // The footer keeps the audience the studio is in
    expect(variant).toBeNull()
  })

  it('is reachable from the keyboard: Tab into the list, arrows, then into the flyout and back', async () => {
    const onNavigate: OnNavigate = vi.fn()
    void render(
      <TestWrapper schemaTypes={[]}>
        <DocumentList onNavigate={onNavigate} />
      </TestWrapper>,
    )
    const before = page.getByRole('button', {name: 'Before the list'})
    await expect.element(before).toBeVisible()
    ;(before.element() as HTMLElement).focus()

    // Tab focuses the list as a whole, and the arrow keys move its active row
    await userEvent.keyboard('{Tab}')
    const list = document.activeElement as HTMLElement
    expect(list.getAttribute('aria-activedescendant')).toBeTruthy()
    const activeRow = () =>
      document
        .getElementById(list.getAttribute('aria-activedescendant') ?? '')
        ?.querySelector('[data-pane-item-row]')
    expect(activeRow()?.getAttribute('data-testid')).toBe('row-winterhold')
    await userEvent.keyboard('{ArrowDown}')
    expect(activeRow()?.getAttribute('data-testid')).toBe('row-riften')

    // ArrowRight opens the active row's flyout and focuses its first row
    await userEvent.keyboard('{ArrowRight}')
    await expect.element(page.getByRole('menuitem', {name: 'Default'})).toHaveFocus()
    await expect.element(page.getByTestId('row-riften')).toHaveAttribute('aria-expanded', 'true')

    // Up and down move inside the flyout
    await userEvent.keyboard('{ArrowDown}')
    await expect.element(page.getByRole('menuitem', {name: 'German'})).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}{ArrowUp}')
    await expect.element(page.getByRole('menuitem', {name: 'German'})).toHaveFocus()

    // ArrowLeft closes it and gives focus back to the list, on the same row
    await userEvent.keyboard('{ArrowLeft}')
    await expect.poll(() => page.getByRole('menu', {name: 'Versions'}).elements().length).toBe(0)
    expect(document.activeElement).toBe(list)
    expect(activeRow()?.getAttribute('data-testid')).toBe('row-riften')

    // So does Escape
    await userEvent.keyboard('{ArrowRight}')
    await expect.element(page.getByRole('menuitem', {name: 'Default'})).toHaveFocus()
    await userEvent.keyboard('{Escape}')
    await expect.poll(() => page.getByRole('menu', {name: 'Versions'}).elements().length).toBe(0)
    expect(document.activeElement).toBe(list)
    expect(activeRow()?.getAttribute('data-testid')).toBe('row-riften')

    // The list's own arrow keys still work
    await userEvent.keyboard('{ArrowDown}')
    expect(activeRow()?.getAttribute('data-testid')).toBe('row-solitude')
    await userEvent.keyboard('{ArrowUp}')
    expect(activeRow()?.getAttribute('data-testid')).toBe('row-riften')

    // Enter on a version opens the document in it, with the inventory beside it
    await userEvent.keyboard('{ArrowRight}')
    await expect.element(page.getByRole('menuitem', {name: 'Default'})).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}{Enter}')
    await expect.poll(() => onNavigate.mock.calls.length).toBe(1)
    const {panes, variant} = decodeNavigation(onNavigate)
    expect(panes?.[1]?.[0]).toMatchObject({
      id: 'riften',
      params: {inspect: DOCUMENT_GROUP_INSPECTOR_NAME},
    })
    expect(variant).toBe('variant:german')
  })
})
