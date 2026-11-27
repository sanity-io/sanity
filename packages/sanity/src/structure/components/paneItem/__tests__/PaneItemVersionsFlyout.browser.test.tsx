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
import {PaneItemVersionsFlyout, type PaneItemVersionsFlyoutActions} from '../PaneItemVersionsFlyout'

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

describe('PaneItemVersionsFlyout', () => {
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

  it('keeps one flyout open: a hover on another row closes the one the keyboard opened', async () => {
    const onNavigate: OnNavigate = vi.fn()
    void render(
      <TestWrapper schemaTypes={[]}>
        <DocumentList onNavigate={onNavigate} />
      </TestWrapper>,
    )
    const before = page.getByRole('button', {name: 'Before the list'})
    await expect.element(before).toBeVisible()
    ;(before.element() as HTMLElement).focus()
    await userEvent.keyboard('{Tab}')
    const list = document.activeElement as HTMLElement

    // The keyboard opens the first row's flyout
    await userEvent.keyboard('{ArrowRight}')
    await expect.element(page.getByRole('menuitem', {name: 'Default'})).toHaveFocus()
    await expect
      .element(page.getByTestId('row-winterhold'))
      .toHaveAttribute('aria-expanded', 'true')

    // The pointer rests on another row: its flyout opens and the first one closes
    await page.getByTestId('row-solitude').hover()
    await expect.element(page.getByTestId('row-solitude')).toHaveAttribute('aria-expanded', 'true')
    await expect
      .element(page.getByTestId('row-winterhold'))
      .toHaveAttribute('aria-expanded', 'false')
    expect(page.getByRole('menu', {name: 'Versions'}).elements()).toHaveLength(1)
    // The closed flyout had focus, which goes back to the list rather than being lost
    expect(document.activeElement).toBe(list)
  })

  it('keeps one flyout open: the keyboard opening one closes the one the pointer opened', async () => {
    const onNavigate: OnNavigate = vi.fn()
    void render(
      <TestWrapper schemaTypes={[]}>
        <DocumentList onNavigate={onNavigate} />
      </TestWrapper>,
    )
    // The pointer opens the last row's flyout
    await page.getByTestId('row-solitude').hover()
    await expect.element(page.getByRole('menu', {name: 'Versions'})).toBeVisible()

    // The keyboard opens the first row's, in a list it is not in
    const row = page.getByTestId('row-winterhold').element() as HTMLElement
    row.focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect.element(page.getByRole('menuitem', {name: 'Default'})).toHaveFocus()
    await expect.element(page.getByTestId('row-solitude')).toHaveAttribute('aria-expanded', 'false')
    expect(page.getByRole('menu', {name: 'Versions'}).elements()).toHaveLength(1)
  })

  it('enters a flyout the pointer opened with ArrowRight from the list, and moves the list there', async () => {
    const onNavigate: OnNavigate = vi.fn()
    void render(
      <TestWrapper schemaTypes={[]}>
        <DocumentList onNavigate={onNavigate} />
      </TestWrapper>,
    )
    const before = page.getByRole('button', {name: 'Before the list'})
    await expect.element(before).toBeVisible()
    ;(before.element() as HTMLElement).focus()
    await userEvent.keyboard('{Tab}')
    const list = document.activeElement as HTMLElement
    const activeRow = () =>
      document
        .getElementById(list.getAttribute('aria-activedescendant') ?? '')
        ?.querySelector('[data-pane-item-row]')
        ?.getAttribute('data-testid')

    // The pointer opens the last row's flyout; hover never takes focus
    await page.getByTestId('row-solitude').hover()
    await expect.element(page.getByRole('menu', {name: 'Versions'})).toBeVisible()
    expect(document.activeElement).toBe(list)

    // The keyboard moves the list's active row somewhere else
    await userEvent.keyboard('{ArrowUp}')
    expect(activeRow()).not.toBe('row-solitude')

    // ArrowRight enters the open flyout, not a new one, and the list's active row follows it
    await userEvent.keyboard('{ArrowRight}')
    await expect.element(page.getByRole('menuitem', {name: 'Default'})).toHaveFocus()
    expect(page.getByRole('menu', {name: 'Versions'}).elements()).toHaveLength(1)
    await expect.element(page.getByTestId('row-solitude')).toHaveAttribute('aria-expanded', 'true')
    expect(activeRow()).toBe('row-solitude')

    // The arrows work inside it, and ArrowLeft gives focus back to the list on that row
    await userEvent.keyboard('{ArrowDown}')
    await expect.element(page.getByRole('menuitem', {name: 'German'})).toHaveFocus()
    await userEvent.keyboard('{ArrowLeft}')
    await expect.poll(() => page.getByRole('menu', {name: 'Versions'}).elements().length).toBe(0)
    expect(document.activeElement).toBe(list)
    expect(activeRow()).toBe('row-solitude')
  })

  it('moves focus into a flyout under the pointer with ArrowDown or ArrowUp from anywhere', async () => {
    const onNavigate: OnNavigate = vi.fn()
    void render(
      <TestWrapper schemaTypes={[]}>
        <DocumentList onNavigate={onNavigate} />
      </TestWrapper>,
    )
    const before = page.getByRole('button', {name: 'Before the list'})
    await expect.element(before).toBeVisible()
    ;(before.element() as HTMLElement).focus()

    // The pointer opens a flyout and moves onto it; focus stays on the button
    await page.getByTestId('row-riften').hover()
    await page.getByRole('menuitem', {name: 'German'}).hover()
    await expect.element(before).toHaveFocus()

    // ArrowDown moves focus to its first row, and Escape gives it back
    await userEvent.keyboard('{ArrowDown}')
    await expect.element(page.getByRole('menuitem', {name: 'Default'})).toHaveFocus()
    await userEvent.keyboard('{Escape}')
    await expect.poll(() => page.getByRole('menu', {name: 'Versions'}).elements().length).toBe(0)
    await expect.element(before).toHaveFocus()

    // ArrowUp moves focus to its last row, and Enter picks it
    await page.getByTestId('row-riften').hover()
    await page.getByRole('menuitem', {name: 'German'}).hover()
    await userEvent.keyboard('{ArrowUp}')
    await expect.element(page.getByRole('menuitem', {name: 'See all versions'})).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect.poll(() => onNavigate.mock.calls.length).toBe(1)
    expect(decodeNavigation(onNavigate).panes?.[1]?.[0]).toMatchObject({
      id: 'riften',
      params: {inspect: DOCUMENT_GROUP_INSPECTOR_NAME},
    })
  })

  it('leaves the arrow keys and Escape to a field being typed in while a flyout is under the pointer', async () => {
    const onNavigate: OnNavigate = vi.fn()
    const onFieldEscape = vi.fn()
    void render(
      <TestWrapper schemaTypes={[]}>
        <input
          aria-label="Title"
          defaultValue="Winterhold"
          onKeyDown={(event) => {
            if (event.key === 'Escape') onFieldEscape()
          }}
        />
        <DocumentList onNavigate={onNavigate} />
      </TestWrapper>,
    )
    const field = page.getByRole('textbox', {name: 'Title'})
    await expect.element(field).toBeVisible()
    ;(field.element() as HTMLInputElement).focus()

    await page.getByTestId('row-riften').hover()
    await page.getByRole('menuitem', {name: 'German'}).hover()
    await expect.element(field).toHaveFocus()

    await userEvent.keyboard('{ArrowDown}')
    await userEvent.keyboard('{ArrowUp}')
    await expect.element(field).toHaveFocus()

    // Escape still closes the flyout, and the field gets it too
    await userEvent.keyboard('{Escape}')
    await expect.poll(() => page.getByRole('menu', {name: 'Versions'}).elements().length).toBe(0)
    expect(onFieldEscape).toHaveBeenCalledTimes(1)
    await expect.element(field).toHaveFocus()
  })
})
