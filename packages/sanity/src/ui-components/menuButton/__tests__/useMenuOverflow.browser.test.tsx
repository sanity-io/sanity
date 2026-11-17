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
  rows = 30,
  selected,
}: {
  offsetTop?: number
  /** The side the menu opens on; it is kept there, so the tests choose which edge it meets. */
  placement?: 'bottom-start' | 'top-start'
  rows?: number
  selected?: string
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
                    <Flex flexDirection="column" flexShrink={0} gap={1} paddingX={2} paddingY={1}>
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
  // Rows any part of which shows in the list
  const visible = rows.filter((row) => row.bottom > box.top + 0.5 && row.top < box.bottom - 0.5)
  return {
    fieldBottom: field.bottom,
    listTop: box.top,
    listBottom: box.bottom,
    listHeight: box.height,
    firstVisibleTop: visible[0].top,
    lastVisibleBottom: visible[visible.length - 1].bottom,
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

/** The list ends 4px (its edge gap) below a row: no row is cut at the bottom. */
function expectWholeRows(geo: ReturnType<typeof geometry>) {
  expect(Math.abs(geo.listBottom - geo.lastVisibleBottom - 4)).toBeLessThanOrEqual(1)
  expect(Math.abs(geo.firstVisibleTop - (geo.fieldBottom + 8))).toBeLessThanOrEqual(1)
}

describe('useMenuOverflow: a whole number of rows', () => {
  it('caps a long list at the most whole rows that fit in 400px', async () => {
    void render(<SearchMenuHarness />)
    await open()

    const geo = geometry()
    expectWholeRows(geo)
    const pitch = rect(list().querySelectorAll('[data-ui="MenuItem"]')[1]).top - geo.firstVisibleTop
    expect(geo.listHeight).toBeLessThanOrEqual(MENU_LIST_MAX_HEIGHT)
    // One more row would not fit
    expect(geo.listHeight + pitch).toBeGreaterThan(MENU_LIST_MAX_HEIGHT)
    // 4px + 10 rows of 33.5px with 4px between them + 4px
    expect(geo.visibleRows).toBe(10)
    expect(Math.abs(geo.listHeight - 379)).toBeLessThanOrEqual(1)
  })

  it('keeps a short list at its natural height', async () => {
    void render(<SearchMenuHarness rows={3} />)
    await open()

    const geo = geometry()
    expect(list().scrollHeight).toBe(list().clientHeight)
    expect(geo.visibleRows).toBe(3)
    expectWholeRows(geo)
  })

  it('shows fewer whole rows near the viewport bottom, 16px or more clear of it', async () => {
    void render(<SearchMenuHarness offsetTop={window.innerHeight - 300} />)
    await open()

    const geo = geometry()
    expect(geo.visibleRows).toBeGreaterThan(0)
    expect(geo.visibleRows).toBeLessThan(10)
    expectWholeRows(geo)
    expect(window.innerHeight - geo.popoverBottom).toBeGreaterThanOrEqual(16 - 0.5)
  })

  it('shows fewer whole rows near the viewport top when it opens above, 16px or more clear of it', async () => {
    void render(<SearchMenuHarness offsetTop={260} placement="top-start" />)
    await open()

    const geo = geometry()
    expect(geo.visibleRows).toBeGreaterThan(0)
    expect(geo.visibleRows).toBeLessThan(10)
    expectWholeRows(geo)
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
    expectWholeRows(geometry())
  })

  it.each(['Row 15', 'Row 30'])(
    'shows %s, when it is selected, whole with no row cut at either end',
    async (selected) => {
      void render(<SearchMenuHarness selected={selected} />)
      await open()
      scrollToHalfRow()
      await close()
      await open()

      const geo = geometry()
      expectWholeRows(geo)
      const row = rect(page.getByRole('menuitem', {name: selected, exact: true}).element())
      expect(row.top).toBeGreaterThanOrEqual(geo.fieldBottom + 8 - 1)
      expect(row.bottom).toBeLessThanOrEqual(geo.listBottom - 4 + 1)
    },
  )

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
