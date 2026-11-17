import {configure} from '@chromatic-com/vitest'
import {TextInput} from '@sanity/ui'
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

// Measurements, not visual states worth archiving.
configure({disableAutoSnapshot: true})

const ROWS = Array.from({length: 12}, (_, index) => `Row ${index + 1}`)

/** A search menu laid out like the navbar variant menu: the field above a scrolling list. */
function SearchMenuHarness({selected}: {selected?: string}) {
  const scrollerRef = useMenuOverflow()
  return (
    <TestWrapper schemaTypes={[]}>
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
                style={{maxHeight: 200}}
              >
                <Flex flexDirection="column" flexShrink={0} gap={1} paddingX={2} paddingY={1}>
                  {ROWS.map((row) => (
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
        popover={{placement: 'bottom-start', portal: true}}
      />
    </TestWrapper>
  )
}

const list = () => page.getByTestId('search-menu-list').element() as HTMLElement

function geometry() {
  const menu = page.getByTestId('search-menu').element()
  const field = menu.querySelector('[data-ui="TextInput"]')!.getBoundingClientRect()
  const box = list().getBoundingClientRect()
  const rows = [...menu.querySelectorAll('[data-ui="MenuItem"]')].map((row) =>
    row.getBoundingClientRect(),
  )
  // The first row any part of which shows in the list
  const firstVisible = rows.find((row) => row.bottom > box.top + 0.5)!
  return {fieldBottom: field.bottom, firstVisibleTop: firstVisible.top, listBottom: box.bottom}
}

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
  const row = list().querySelector('[data-ui="MenuItem"]')!.getBoundingClientRect()
  list().scrollTop = row.height * 3 + row.height / 2
}

describe('useMenuOverflow: where a reopened menu is scrolled', () => {
  it('starts at the top when no row is selected', async () => {
    void render(<SearchMenuHarness />)
    await open()
    scrollToHalfRow()
    await close()
    await open()

    expect(list().scrollTop).toBe(0)
    const {fieldBottom, firstVisibleTop} = geometry()
    expect(Math.abs(firstVisibleTop - (fieldBottom + 8))).toBeLessThanOrEqual(1)
  })

  it('shows the selected row whole, with no row cut in half under the search field', async () => {
    void render(<SearchMenuHarness selected="Row 9" />)
    await open()
    scrollToHalfRow()
    await close()
    await open()

    const {fieldBottom, firstVisibleTop, listBottom} = geometry()
    expect(firstVisibleTop).toBeGreaterThanOrEqual(fieldBottom + 8 - 1)
    expect(Math.abs(firstVisibleTop - (fieldBottom + 8))).toBeLessThanOrEqual(1)
    const selected = page.getByRole('menuitem', {name: 'Row 9'}).element().getBoundingClientRect()
    expect(selected.top).toBeGreaterThanOrEqual(fieldBottom + 8 - 1)
    expect(selected.bottom).toBeLessThanOrEqual(listBottom - 4 + 1)
  })

  it('pads the list so a row scrolled into view stops 8px below the search field', async () => {
    void render(<SearchMenuHarness />)
    await open()
    list().scrollTop = list().scrollHeight
    page.getByRole('menuitem', {name: 'Row 2'}).element().scrollIntoView({block: 'nearest'})

    const {fieldBottom} = geometry()
    const row = page.getByRole('menuitem', {name: 'Row 2'}).element().getBoundingClientRect()
    expect(Math.abs(row.top - (fieldBottom + 8))).toBeLessThanOrEqual(1)
  })
})
