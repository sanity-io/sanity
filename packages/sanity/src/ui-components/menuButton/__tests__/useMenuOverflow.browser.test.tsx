import {configure} from '@chromatic-com/vitest'
import {BoundaryElementProvider, TextInput} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {Box, Flex} from 'ui5'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {expectStable} from '../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {Button} from '../../button/Button'
import {MenuItem} from '../../menuItem/MenuItem'
import {MenuButton} from '../MenuButton'
import {menuOverflowScroller} from '../menuOverflow.css'
import {useMenuOverflow} from '../useMenuOverflow'
import {searchMenu} from './searchMenuHarness.css'

// Measurements, not visual states worth archiving.
configure({disableAutoSnapshot: true})

/**
 * A search menu laid out like the document pill menus: the field above a scrolling list, in a
 * menu that is a flex column capped to the popover. The trigger sits `offsetTop` px down the page,
 * to open the menu near the viewport's bottom edge.
 */
function SearchMenuHarness({
  offsetTop = 0,
  placement = 'bottom-start',
  rows = 30,
  selected,
}: {
  offsetTop?: number
  /** The side the menu opens on; it is kept there, so the tests choose which edge it meets. */
  placement?: 'bottom-start' | 'top-start'
  rows?: number
  selected?: string
}) {
  const {scrollerRef, onOpen} = useMenuOverflow()
  const names = Array.from({length: rows}, (_, index) => `Row ${index + 1}`)
  return (
    <TestWrapper schemaTypes={[]}>
      {/* The page, as in the studio, not the short test pane, bounds the popover */}
      <BoundaryElementProvider element={document.documentElement}>
        <div style={{paddingTop: offsetTop}}>
          <MenuButton
            button={<Button text="Open menu" />}
            id="menu-overflow-test"
            onOpen={onOpen}
            menu={
              <Menu className={searchMenu} data-testid="search-menu" padding={0}>
                {/* One child, so the menu's own gap between children stays out of the measurements */}
                <Flex flexDirection="column" flexGrow={1} flexShrink={1} minHeight="0">
                  <Box paddingX={2} paddingTop={2} paddingBottom={1}>
                    <TextInput aria-label="Search" fontSize={1} placeholder="Search" radius={2} />
                  </Box>
                  <Flex
                    className={menuOverflowScroller}
                    data-testid="search-menu-list"
                    flexDirection="column"
                    minHeight="0"
                    ref={scrollerRef}
                  >
                    <Flex flexDirection="column" flexShrink={0} gap={1} paddingX={1} paddingY={1}>
                      {names.map((row) => (
                        <MenuItem
                          key={row}
                          pressed={row === selected}
                          selected={row === selected}
                          text={row}
                        />
                      ))}
                    </Flex>
                  </Flex>
                </Flex>
              </Menu>
            }
            popover={{
              constrainSize: true,
              fallbackPlacements: [placement],
              overflow: 'hidden',
              placement,
              portal: true,
            }}
          />
        </div>
      </BoundaryElementProvider>
    </TestWrapper>
  )
}

const list = () => page.getByTestId('search-menu-list').element() as HTMLElement
const rect = (element: Element) => element.getBoundingClientRect()

function geometry() {
  const menu = page.getByTestId('search-menu').element()
  const field = rect(menu.querySelector('[data-ui="TextInput"]')!)
  const box = rect(list())
  const rows = [...menu.querySelectorAll('[data-ui="MenuItem"]')].map(rect)
  const rowsBottom = box.bottom
  // Rows any part of which shows in the list
  const visible = rows.filter((row) => row.bottom > box.top + 0.5 && row.top < rowsBottom - 0.5)
  const lastVisible = visible[visible.length - 1]
  return {
    fieldBottom: field.bottom,
    listTop: box.top,
    listBottom: box.bottom,
    listHeight: box.height,
    rowsBottom,
    firstVisibleTop: visible[0].top,
    lastVisibleTop: lastVisible.top,
    lastVisibleBottom: lastVisible.bottom,
    lastVisibleHeight: lastVisible.height,
    visibleRows: visible.length,
    popoverTop: rect(menu.closest('[data-placement]')!).top,
    popoverBottom: rect(menu.closest('[data-placement]')!).bottom,
  }
}

/** Waits past the opening animation, until the list stops moving. */
async function open() {
  await page.getByRole('button', {name: 'Open menu'}).click()
  await expect.element(page.getByTestId('search-menu')).toBeVisible()
  await expectStable(() => `${list().scrollTop}|${JSON.stringify(geometry())}`)
}

async function close() {
  await userEvent.keyboard('{Escape}')
  await expect.element(page.getByTestId('search-menu')).not.toBeVisible()
}

/** Leaves the list scrolled so a row is cut in half at its top edge. */
function scrollToHalfRow() {
  const row = rect(list().querySelector('[data-ui="MenuItem"]')!)
  list().scrollTop = row.height * 3 + row.height / 2
}

/** The fades on the list: the opacity of its top (`::before`) and bottom (`::after`) fade. */
function fades() {
  return {
    top: getComputedStyle(list(), '::before').opacity,
    bottom: getComputedStyle(list(), '::after').opacity,
  }
}

/** A row's box, by its text. */
function rowRect(name: string) {
  return rect(page.getByRole('menuitem', {name, exact: true}).element())
}

describe('useMenuOverflow: the list height', () => {
  it('caps a long list at 400px, ending part way through a row', async () => {
    void render(<SearchMenuHarness />)
    await open()

    const geo = geometry()
    expect(Math.abs(geo.listHeight - 400)).toBeLessThanOrEqual(0.5)
    // 4px + 10 rows of 33.5px with 4px between them, then about half of the 11th
    expect(geo.visibleRows).toBe(11)
    const cut = geo.listBottom - geo.lastVisibleTop
    expect(cut).toBeGreaterThan(geo.lastVisibleHeight * 0.25)
    expect(cut).toBeLessThan(geo.lastVisibleHeight * 0.75)
  })

  it('keeps a short list at its natural height', async () => {
    void render(<SearchMenuHarness rows={3} />)
    await open()

    const geo = geometry()
    expect(list().scrollHeight).toBe(list().clientHeight)
    expect(geo.visibleRows).toBe(3)
    expect(Math.abs(geo.listBottom - geo.lastVisibleBottom - 4)).toBeLessThanOrEqual(1)
    expect(fades()).toEqual({top: '0', bottom: '0'})
  })

  it('shrinks to the room below its trigger near the viewport bottom', async () => {
    void render(<SearchMenuHarness offsetTop={window.innerHeight - 300} />)
    await open()

    const geo = geometry()
    expect(geo.listHeight).toBeLessThan(400)
    expect(geo.visibleRows).toBeGreaterThan(1)
    // The popover keeps 4px from the viewport edge
    expect(geo.popoverBottom).toBeLessThanOrEqual(window.innerHeight - 4 + 0.5)
  })

  it('shrinks to the room above its trigger when it opens above', async () => {
    void render(<SearchMenuHarness offsetTop={260} placement="top-start" />)
    await open()

    const geo = geometry()
    expect(geo.listHeight).toBeLessThan(400)
    expect(geo.visibleRows).toBeGreaterThan(1)
    expect(geo.popoverTop).toBeGreaterThanOrEqual(4 - 0.5)
  })
})

describe('useMenuOverflow: where a reopened menu is scrolled', () => {
  it('starts at the top when no row is selected', async () => {
    void render(<SearchMenuHarness />)
    await open()
    scrollToHalfRow()
    await close()
    await open()

    expect(list().scrollTop).toBe(0)
  })

  it('shows a selected row further down the list whole', async () => {
    void render(<SearchMenuHarness selected="Row 15" />)
    await open()
    scrollToHalfRow()
    await close()
    await open()

    const geo = geometry()
    const row = rowRect('Row 15')
    expect(row.top).toBeGreaterThanOrEqual(geo.listTop - 0.5)
    expect(row.bottom).toBeLessThanOrEqual(geo.listBottom - 4 + 1)
  })

  it('shows the last row, when it is selected, whole', async () => {
    void render(<SearchMenuHarness selected="Row 30" />)
    await open()
    scrollToHalfRow()
    await close()
    await open()

    const geo = geometry()
    const row = rowRect('Row 30')
    expect(row.top).toBeGreaterThanOrEqual(geo.listTop - 0.5)
    expect(row.bottom).toBeLessThanOrEqual(geo.listBottom - 4 + 1)
  })

  it('pads the list so a row scrolled into view stops 8px below the search field', async () => {
    void render(<SearchMenuHarness />)
    await open()
    list().scrollTop = list().scrollHeight
    page
      .getByRole('menuitem', {name: 'Row 2', exact: true})
      .element()
      .scrollIntoView({block: 'nearest'})

    const {fieldBottom} = geometry()
    expect(Math.abs(rowRect('Row 2').top - (fieldBottom + 8))).toBeLessThanOrEqual(1)
  })
})

describe('useMenuOverflow: the fades at an edge with rows beyond it', () => {
  it('fades the bottom at the top of a long list, both edges in the middle, the top at the end', async () => {
    void render(<SearchMenuHarness />)
    await open()

    expect(list()).toHaveAttribute('data-scroll-down')
    expect(list()).not.toHaveAttribute('data-scroll-up')
    expect(fades()).toEqual({top: '0', bottom: '1'})
    const after = getComputedStyle(list(), '::after')
    expect(after.height).toBe('24px')
    expect(after.pointerEvents).toBe('none')
    expect(after.position).toBe('sticky')
    expect(after.backgroundImage).toMatch(/^linear-gradient\(/)

    list().scrollTop = 100
    await expect.poll(() => list().hasAttribute('data-scroll-up')).toBe(true)
    expect(list()).toHaveAttribute('data-scroll-down')
    expect(fades()).toEqual({top: '1', bottom: '1'})

    list().scrollTop = list().scrollHeight
    await expect.poll(() => list().hasAttribute('data-scroll-down')).toBe(false)
    expect(list()).toHaveAttribute('data-scroll-up')
    expect(fades()).toEqual({top: '1', bottom: '0'})
  })

  it('takes no room in the list', async () => {
    void render(<SearchMenuHarness rows={3} />)
    await open()

    // 4px + 3 rows of 33.5px with 4px between them + 4px, as without the fades
    expect(Math.abs(list().scrollHeight - 116.5)).toBeLessThanOrEqual(1)
  })
})
