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
import {MENU_LIST_MAX_HEIGHT, useMenuOverflow} from '../useMenuOverflow'

// Measurements, not visual states worth archiving.
configure({disableAutoSnapshot: true})

/**
 * A search menu laid out like the navbar variant menu: the field above a scrolling list. The
 * trigger sits `offsetTop` px down the page, to open the menu near the viewport's bottom edge.
 */
function SearchMenuHarness({
  offsetTop = 0,
  placement = 'bottom-start',
  pinnedFooter = false,
  rows = 30,
  selected,
  contentPaddingX = 2,
}: {
  offsetTop?: number
  /** The side the menu opens on; it is kept there, so the tests choose which edge it meets. */
  placement?: 'bottom-start' | 'top-start'
  /** A group pinned to the list's bottom, as the navbar perspective menu's footer. */
  pinnedFooter?: boolean
  rows?: number
  selected?: string
  /** The list contents' own side padding: 2 (8px) as in the navbar menus, 1 (4px) as in the pill menus. */
  contentPaddingX?: 1 | 2
}) {
  const scrollerRef = useMenuOverflow()
  const names = Array.from({length: rows}, (_, index) => `Row ${index + 1}`)
  return (
    <TestWrapper schemaTypes={[]}>
      {/* The page, as in the studio, not the short test pane, bounds the popover */}
      <BoundaryElementProvider element={document.documentElement}>
        <div style={{paddingTop: offsetTop}}>
          <MenuButton
            button={<Button text="Open menu" />}
            id="menu-overflow-test"
            menu={
              <Menu data-testid="search-menu" padding={0}>
                {/* One child, so the menu's own gap between children stays out of the measurements */}
                <Flex flexDirection="column">
                  <Box paddingX={2} paddingTop={2} paddingBottom={1}>
                    <TextInput aria-label="Search" fontSize={1} placeholder="Search" radius={2} />
                  </Box>
                  <Flex
                    className={menuOverflowScroller}
                    data-testid="search-menu-list"
                    flexDirection="column"
                    overflowY="auto"
                    ref={scrollerRef}
                  >
                    <Flex
                      flexDirection="column"
                      flexShrink={0}
                      gap={1}
                      paddingX={contentPaddingX}
                      paddingY={1}
                    >
                      {names.map((row) => (
                        <MenuItem
                          key={row}
                          pressed={row === selected}
                          selected={row === selected}
                          text={row}
                        />
                      ))}
                      {pinnedFooter ? (
                        <Flex
                          data-testid="search-menu-footer"
                          flexDirection="column"
                          style={{
                            position: 'sticky',
                            bottom: 0,
                            zIndex: 2,
                            background: 'var(--card-bg-color)',
                          }}
                        >
                          <MenuItem text="Pinned action" />
                        </Flex>
                      ) : null}
                    </Flex>
                  </Flex>
                </Flex>
              </Menu>
            }
            popover={{
              constrainSize: true,
              fallbackPlacements: [placement],
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
  const footer = menu.querySelector('[data-testid="search-menu-footer"]')
  const rows = [...menu.querySelectorAll('[data-ui="MenuItem"]')]
    .filter((row) => !footer?.contains(row))
    .map(rect)
  // The rows' visible area ends at a pinned footer
  const rowsBottom = footer ? rect(footer).top : box.bottom
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

/** Waits past the opening animation, after which the list is fitted for the last time. */
async function open() {
  await page.getByRole('button', {name: 'Open menu'}).click()
  await expect.element(page.getByTestId('search-menu')).toBeVisible()
  await new Promise((resolve) => setTimeout(resolve, 400))
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

/** The first visible row starts 8px below the search field: no row is cut at the top. */
function expectWholeTop(geo: ReturnType<typeof geometry>) {
  expect(Math.abs(geo.firstVisibleTop - (geo.fieldBottom + 8))).toBeLessThanOrEqual(1)
}

/** The list ends 4px (its edge gap) below a row: no row is cut at the bottom. */
function expectWholeRows(geo: ReturnType<typeof geometry>) {
  expect(Math.abs(geo.listBottom - geo.lastVisibleBottom - 4)).toBeLessThanOrEqual(1)
  expectWholeTop(geo)
}

/** The rows' visible area ends half way through a row: the next row peeks, so the list scrolls. */
function expectHalfRow(geo: ReturnType<typeof geometry>) {
  expect(
    Math.abs(geo.rowsBottom - geo.lastVisibleTop - geo.lastVisibleHeight / 2),
  ).toBeLessThanOrEqual(1)
  expectWholeTop(geo)
}

/** The fades on the list: the opacity of its top (`::before`) and bottom (`::after`) fade. */
function fades() {
  return {
    top: getComputedStyle(list(), '::before').opacity,
    bottom: getComputedStyle(list(), '::after').opacity,
  }
}

describe('useMenuOverflow: whole rows and half the next one', () => {
  it('caps a long list at the most whole rows, plus half a row, that fit in 400px', async () => {
    void render(<SearchMenuHarness />)
    await open()

    const geo = geometry()
    expectHalfRow(geo)
    const pitch = rect(list().querySelectorAll('[data-ui="MenuItem"]')[1]).top - geo.firstVisibleTop
    expect(geo.listHeight).toBeLessThanOrEqual(MENU_LIST_MAX_HEIGHT)
    // One more row would not fit
    expect(geo.listHeight + pitch).toBeGreaterThan(MENU_LIST_MAX_HEIGHT)
    // 4px + 10 rows of 33.5px with 4px between them, 4px + half of the 11th row (16.75px)
    expect(geo.visibleRows).toBe(11)
    expect(Math.abs(geo.listHeight - 395.75)).toBeLessThanOrEqual(1)
  })

  it('drops a whole row when the half row would not fit otherwise', async () => {
    // 10 rows end at 379px, so 11 rows (416.5px) do not fit, but 10 rows and half the 11th do
    void render(<SearchMenuHarness rows={11} />)
    await open()

    const geo = geometry()
    expectHalfRow(geo)
    expect(geo.visibleRows).toBe(11)
    expect(geo.listHeight).toBeLessThanOrEqual(MENU_LIST_MAX_HEIGHT)
  })

  it('keeps a short list at its natural height', async () => {
    void render(<SearchMenuHarness rows={3} />)
    await open()

    const geo = geometry()
    expect(list().scrollHeight).toBe(list().clientHeight)
    expect(geo.visibleRows).toBe(3)
    expectWholeRows(geo)
    expect(fades()).toEqual({top: '0', bottom: '0'})
  })

  it('shows fewer whole rows near the viewport bottom, 16px or more clear of it', async () => {
    void render(<SearchMenuHarness offsetTop={window.innerHeight - 300} />)
    await open()

    const geo = geometry()
    expect(geo.visibleRows).toBeGreaterThan(1)
    expect(geo.visibleRows).toBeLessThan(11)
    expectHalfRow(geo)
    expect(window.innerHeight - geo.popoverBottom).toBeGreaterThanOrEqual(16 - 0.5)
  })

  it('shows fewer whole rows near the viewport top when it opens above, 16px or more clear of it', async () => {
    void render(<SearchMenuHarness offsetTop={260} placement="top-start" />)
    await open()

    const geo = geometry()
    expect(geo.visibleRows).toBeGreaterThan(1)
    expect(geo.visibleRows).toBeLessThan(11)
    expectHalfRow(geo)
    expect(geo.popoverTop).toBeGreaterThanOrEqual(16 - 0.5)
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
    expectHalfRow(geometry())
  })

  it('shows a selected row in the middle whole, with half the next row below it', async () => {
    void render(<SearchMenuHarness selected="Row 15" />)
    await open()
    scrollToHalfRow()
    await close()
    await open()

    const geo = geometry()
    expectHalfRow(geo)
    const row = rect(page.getByRole('menuitem', {name: 'Row 15', exact: true}).element())
    expect(row.top).toBeGreaterThanOrEqual(geo.fieldBottom + 8 - 1)
    // Whole: the half row is the one after it
    expect(row.bottom).toBeLessThanOrEqual(geo.lastVisibleTop + 0.5)
  })

  it('shows the last row, when it is selected, whole with no row cut at either end', async () => {
    void render(<SearchMenuHarness selected="Row 30" />)
    await open()
    scrollToHalfRow()
    await close()
    await open()

    const geo = geometry()
    expectWholeRows(geo)
    const row = rect(page.getByRole('menuitem', {name: 'Row 30', exact: true}).element())
    expect(row.top).toBeGreaterThanOrEqual(geo.fieldBottom + 8 - 1)
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
    const row = rect(page.getByRole('menuitem', {name: 'Row 2', exact: true}).element())
    expect(Math.abs(row.top - (fieldBottom + 8))).toBeLessThanOrEqual(1)
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

  it('sits above a pinned footer, not over it, with half a row peeking above the footer', async () => {
    void render(<SearchMenuHarness pinnedFooter />)
    await open()

    const geo = geometry()
    expectHalfRow(geo)
    const footer = page.getByTestId('search-menu-footer').element() as HTMLElement
    expect(Math.abs(rect(footer).bottom - geo.listBottom)).toBeLessThanOrEqual(1)
    expect(fades().bottom).toBe('1')
    // Stuck as far up from the list's bottom as the footer is tall
    expect(
      Math.abs(parseFloat(getComputedStyle(list(), '::after').bottom) - footer.offsetHeight),
    ).toBeLessThanOrEqual(0.5)
  })
})

describe('useMenuOverflow: rows and the scrollbar', () => {
  it.each([
    {contentPaddingX: 2 as const, padding: 8, trim: 4},
    {contentPaddingX: 1 as const, padding: 4, trim: 0},
  ])(
    'ends a row 4px before a 12px track with $padding px of list padding',
    async ({contentPaddingX, trim}) => {
      void render(<SearchMenuHarness contentPaddingX={contentPaddingX} />)
      await userEvent.click(page.getByRole('button', {name: 'Open menu'}))
      const list = page.getByTestId('search-menu-list')
      await expect.element(list).toBeVisible()
      const scroller = list.element() as HTMLElement

      // Headless Chromium hides scrollbars, so stand in for the studio's 12px track the way the
      // hook reads it, then make it measure again
      Object.defineProperty(scroller, 'clientWidth', {
        configurable: true,
        get: () => scroller.offsetWidth - 12,
      })
      scroller.style.width = `${scroller.offsetWidth - 1}px`
      await expect.poll(() => scroller.style.getPropertyValue('--menu-row-trim')).toBe(`${trim}px`)

      // Without a real track the contents keep the full width, so the track's left edge is 12px
      // in from the scroller's right: the row ends 4px before it whatever the list's padding
      const row = scroller.querySelector('[data-ui="MenuItem"]')!
      await expectStable(() => String(row.getBoundingClientRect().right))
      const gap = scroller.getBoundingClientRect().right - row.getBoundingClientRect().right
      expect(Math.abs(gap - 4)).toBeLessThanOrEqual(0.5)
    },
  )
})
